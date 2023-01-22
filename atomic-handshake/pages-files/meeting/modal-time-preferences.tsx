import { useEffect, useState } from "react"
import type { NextPage } from 'next'
import axios from 'axios'
import { getISODay, setISODay } from 'date-fns'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import isBetween from 'dayjs/plugin/isBetween'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import {
    useToast,
} from '@chakra-ui/react'
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import _ from "lodash"
import { CustomAvailableTimeType, MeetingAssistType, Time, UserPreferenceType } from "@lib/types"

dayjs.extend(duration)
dayjs.extend(isBetween)
dayjs.extend(timezone)
dayjs.extend(utc)
dayjs.extend(customParseFormat)

type Props = {
    minDate: Date,
    maxDate: Date,
    slotDuration: number,
    hostPreferences: UserPreferenceType,
    meetingAssist: MeetingAssistType,
    onSubmit: (availableTime: CustomAvailableTimeType) => void,
    onCancel: () => void,
}
const dayOfWeekIntConstant = -1

const ModalTimePreferences: NextPage<Props> = (props: Props) => {
    const [availableTimes, setAvailableTimes] = useState<CustomAvailableTimeType[]>()
    const [availableStartTime, setAvailableStartTime] = useState<Date>(new Date())
    const [availableEndTime, setAvailableEndTime] = useState<Date>(dayjs().add(5, 'h').toDate())
    const [startTime, setStartTime] = useState<Date | null>()
    const [endTime, setEndTime] = useState<Date | null>()
    const [dayOfWeekInt, setDayOfWeekInt] = useState<number>(-2)
    const [dayOfWeekOptions, setDayOfWeekOptions] = useState<[number, string][]>()

    const toast = useToast()

    const minDate = props?.minDate
    const maxDate = props?.maxDate
    const hostPreferences = props?.hostPreferences
    const hostTimezone = props?.meetingAssist?.timezone
    const meetingAssist = props?.meetingAssist
    const slotDuration = props?.slotDuration
    const onSubmit = props?.onSubmit
    const onCancel = props?.onCancel

    useEffect(() => {

        (async () => {
            try {
                const diffDays = dayjs(maxDate).diff(dayjs(minDate), 'd')
        const startDatesForEachDay = []
        const newDayOfWeekOptions: [number, string][] = []

        const newAvailableTimes: CustomAvailableTimeType[] = []

        for (let i = 0; i <= diffDays; i++) {
            startDatesForEachDay.push(dayjs(dayjs(minDate).format().slice(0, 19)).tz(hostTimezone, true).add(i, 'day').format())
        }

        for (let i = 0; i < startDatesForEachDay.length; i++) {

            if (i === 0) {
                

                const availableTime = (await axios.post<CustomAvailableTimeType>('api/modal-time-preferences', {
                     method: 'getCustomAvailableTimes',
                        variables: {
                            slotDuration,
                            hostStartDate: startDatesForEachDay?.[i],
                            hostPreferences,
                            hostTimezone,
                            userTimezone: dayjs.tz.guess(),
                            isFirstDay: true,
                            isLastDay: false,
                        },
                }))?.data
                if ((availableTime)?.startTime) {
                    newAvailableTimes.push(availableTime as CustomAvailableTimeType)
                }
                
            
                continue
            }

            if (i === (startDatesForEachDay.length - 1)) {

                const availableTime = (await axios.post<CustomAvailableTimeType>('api/modal-time-preferences', {
                     method: 'getCustomAvailableTimes',
                        variables: {
                            slotDuration,
                            hostStartDate: startDatesForEachDay?.[i],
                            hostPreferences,
                            hostTimezone,
                            userTimezone: dayjs.tz.guess(),
                            isFirstDay: false,
                            isLastDay: true,
                        },
                }))?.data

                if ((availableTime as CustomAvailableTimeType)?.startTime) {
                    newAvailableTimes.push(availableTime as CustomAvailableTimeType)
                }
                continue
            }


            const availableTime = (await axios.post<CustomAvailableTimeType>('api/modal-time-preferences', {
                     method: 'getCustomAvailableTimes',
                        variables: {
                            slotDuration,
                            hostStartDate: startDatesForEachDay?.[i],
                            hostPreferences,
                            hostTimezone,
                            userTimezone: dayjs.tz.guess(),
                            isFirstDay: false,
                            isLastDay: false,
                        },
                }))?.data

            if ((availableTime as CustomAvailableTimeType)?.startTime) {
                newAvailableTimes.push(availableTime as CustomAvailableTimeType)
            }
        }

        if (newAvailableTimes?.[0]?.startTime) {
            const oldStartTime = setISODay(dayjs()
                .hour(parseInt(newAvailableTimes?.[0]?.startTime?.slice(0, 2), 10))
                .minute(parseInt(newAvailableTimes?.[0]?.startTime?.slice(3), 10))
                .toDate(), newAvailableTimes?.[0]?.dayOfWeekInt ?? 1)
            setAvailableStartTime(oldStartTime)

            const oldEndTime = setISODay(dayjs()
                .hour(parseInt(newAvailableTimes?.[0]?.endTime?.slice(0, 2), 10))
                .minute(parseInt(newAvailableTimes?.[0]?.endTime?.slice(3), 10))
                .toDate(), newAvailableTimes?.[0]?.dayOfWeekInt ?? 1)
            setAvailableEndTime(oldEndTime)
            setAvailableTimes(newAvailableTimes)
        }
        
        for (let i = 0; i < startDatesForEachDay.length; i++) {
            const option = getISODay(dayjs(dayjs(minDate).format().slice(0, 19)).tz(hostTimezone, true).add(i, 'day').toDate())
            const value = (option !== -1 ? dayjs(setISODay(dayjs().toDate(), option)).format('dddd') : 'Any day of the week')
            newDayOfWeekOptions.push([option, value])
        }

        newDayOfWeekOptions.push([-1, 'Any day of the week'])
        
        setDayOfWeekOptions(newDayOfWeekOptions)
            } catch (e) {
                
            }
        })()
    }, [minDate, maxDate, hostTimezone, slotDuration, hostPreferences])

    useEffect(() => {
        (() => {
            const availableTime = availableTimes?.find(a => (a?.dayOfWeekInt === dayOfWeekInt))

            if (availableTime) {
                const oldStartTime = setISODay(dayjs()
                .hour(parseInt(availableTime?.startTime?.slice(0, 2), 10))
                .minute(parseInt(availableTime?.startTime?.slice(3), 10))
                .toDate(), availableTime?.dayOfWeekInt ?? 1)
            setAvailableStartTime(oldStartTime)

            const oldEndTime = setISODay(dayjs()
                .hour(parseInt(availableTime?.endTime?.slice(0, 2), 10))
                .minute(parseInt(availableTime?.endTime?.slice(3), 10))
                .toDate(), availableTime?.dayOfWeekInt ?? 1)
            setAvailableEndTime(oldEndTime)
            }        
        })()
    }, [availableTimes, dayOfWeekInt])

    const onChangeOption = (e: { target: { value: any } }) => setDayOfWeekInt(e.target.value || -1)

    const onSave = () => {
        onSubmit({
            dayOfWeekInt: typeof dayOfWeekInt === 'string' ? parseInt(dayOfWeekInt, 10) : dayOfWeekInt,
            startTime: dayjs(startTime || new Date()).format('HH:mm') as Time,
            endTime: dayjs(endTime || dayjs().add(8, 'h')).format('HH:mm') as Time,
        })
    }

    return (
        <div className="flex flex-col justify-center items-center h-full w-full">
            <div className="text-center sm:text-left">
                <h2 className="lg:text-lg font-bold text-gray-900 dark:text-gray-200 sm:text-xl">
                    Select a Custom Time
                </h2>
                <p className="mt-1.5 text-sm text-gray-500">
                    {"You can select a time as broad as possible that works for you"}
                </p>
            </div>
            
            <div className="text-left sm:text-xl lg:text-lg lg:my-2 sm:my-3">
                <label>
                    <span className="label-text dark:text-gray-500">
                        {'Day Of Week: optional'}
                    </span>
                    <select className="select select-bordered w-full max-w-xs text-gray-900 bg-gray-200 dark:text-gray-200 dark:bg-gray-900" placeholder='Select day of week' onChange={onChangeOption} value={dayOfWeekInt}>
                        <option disabled selected key={-2} value={-2}>Select day of week</option>
                        {dayOfWeekOptions?.map(values => (
                            <option key={values[0]} value={values[0]}>{values[1]}</option>
                        ))}
                    </select>
                </label>
            </div>
            <div className="text-left sm:text-xl lg:text-lg lg:my-2 sm:my-3">
                <label>
                    <span className="label-text dark:text-gray-500 lg:my-1 sm:my-2">
                        {'Start Time:'}
                    </span>
                    <DatePicker
                        selected={startTime}
                        onChange={(date) => setStartTime(date)}
                        showTimeSelect
                        showTimeSelectOnly
                        timeIntervals={slotDuration}
                        timeCaption="Time"
                        dateFormat="h:mm aa"
                        minTime={availableStartTime}
                        maxTime={availableEndTime}
                        className="text-gray-900 bg-gray-200 dark:text-gray-200 dark:bg-gray-900 rounded-lg text-center"
                    />
                </label>
            </div>
             <div className="text-left sm:text-xl lg:text-lg lg:my-2 sm:my-3">
                <label>
                    <span className="label-text dark:text-gray-500 lg:my-1 sm:my-2">
                        {'End Time:'}
                    </span>
                    <DatePicker
                        selected={endTime}
                        onChange={(date) => setEndTime(date)}
                        showTimeSelect
                        showTimeSelectOnly
                        timeIntervals={slotDuration}
                        timeCaption="Time"
                        dateFormat="h:mm aa"
                        minTime={availableStartTime}
                        maxTime={availableEndTime}
                        className="text-gray-900 bg-gray-200 dark:text-gray-200 dark:bg-gray-900 rounded-lg text-center"
                    />
                </label>
            </div>
            <div className="flex justify-center items-center space-x-4 w-1/2 lg:m-3 m-4">
                <button className='btn btn-secondary' onClick={onSave}>
                    {'Submit'}
                </button>
                <button className='btn btn-ghost' onClick={onCancel}>
                    {'Cancel'}
                </button>
            </div>
        </div>
    )
}

export default ModalTimePreferences