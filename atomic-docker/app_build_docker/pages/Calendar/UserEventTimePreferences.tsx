import React, { useState, useEffect, useCallback } from 'react'


// import DatePicker from 'react-native-date-picker'
// import DateTimePicker from 'react-datetime-picker/dist/entry.nostyle'
import { Input } from '@chakra-ui/react'
import { v4 as uuid } from 'uuid'
import { getISODay, setISODay } from 'date-fns'
import { useToast } from '@chakra-ui/react'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import Button from '@components/Button'
import RegularCard from '@components/RegularCard'

import { dayjs } from '@lib/date-utils'

import {
  PreferredTimeRangeType,
} from '@lib/dataTypes/PreferredTimeRangeType'

import {
    listPreferredTimeRangesByEvent,
    deletePreferredTimeRangeWithId,
    insertPreferredTimeRangeOneForEvent,
} from '@lib/Calendar/UserTrainCalendarHelper'

import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { getEventWithId } from '@lib/calendarLib/calendarDbHelper'
import { Appearance, FlatList, Pressable } from 'react-native'

import { IoIosRemoveCircleOutline } from "react-icons/io";
// 
import { palette } from '@lib/theme/theme'
import { Time } from '@lib/dataTypes/EventType'
import _ from 'lodash'
import { atomicUpsertEventInDb } from '@lib/Calendar/UserCreateCalendarHelper';
import { useFocusEffect } from '@chakra-ui/react'
import { NextApiRequest, NextApiResponse } from 'next';
import supertokensNode from 'supertokens-node'
import { backendConfig } from '../../config/backendConfig'
import Session from 'supertokens-node/recipe/session'

export async function getServerSideProps({ req, res }: { req: NextApiRequest, res: NextApiResponse }) {
  // Notice how the server uses `API` from `withSSRContext`, instead of the top-level `API`.
  // const SSR = withSSRContext({ req })
  // this runs on the backend, so we must call init on supertokens-node SDK
  supertokensNode.init(backendConfig())
  let session
  try {
    session = await Session.getSession(req, res, {
      overrideGlobalClaimValidators: async function () {
        return []
      },
    })
  } catch (err: any) {
    if (err.type === Session.Error.TRY_REFRESH_TOKEN) {
      return { props: { fromSupertokens: 'needs-refresh' } }
    } else if (err.type === Session.Error.UNAUTHORISED) {
      // this will force the frontend to try and refresh which will fail
      // clearing all cookies and redirecting the user to the login screen.
      return { props: { fromSupertokens: 'needs-refresh' } }
    }
    throw err
  }

  if (!session?.getUserId()) {
    return {
      redirect: {
        destination: '/User/Login/UserLogin',
        permanent: false,
      },
    }
  }

  return {
    props: {
      sub: session.getUserId(),
    }
  }
}


type RenderPreferredTimeRangeType = {
    item: PreferredTimeRangeType,
    index: number,
}

const dayOfWeekInt = [-1, 1, 2, 3, 4, 5, 6, 7]

const dark = Appearance.getColorScheme() === 'dark'

type Props = {
    id: string,
    closeTimePreferences: () => void,
    client: ApolloClient<NormalizedCacheObject>,
    sub: string,
}

function UserEventTimePreferences(props: Props) {
    const [timeRangePreferences, setTimeRangePreferences] = useState<PreferredTimeRangeType[]>([])
    const [summary, setSummary] = useState<string>('')
    const [startDate, setStartDate] = useState<string>('')
    const [endDate, setEndDate] = useState<string>('')
    const [dayOfWeek, setDayOfWeek] = useState<-1 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | null>(-1)
    // const [dayOfWeekObject, setDayOfWeekObject] = useState<{label: string, value: number }>(null)
    const [startTimeRange, setStartTimeRange] = useState<Date>(new Date())
    const [endTimeRange, setEndTimeRange] = useState<Date>(dayjs().add(30, 'm').toDate())
    const [isStartTimeRange, setIsStartTimeRange] = useState<boolean>(false)
    const [isEndTimeRange, setIsEndTimeRange] = useState<boolean>(false)
    const [calendarId, setCalendarId] = useState<string>('')
    const [error, setError] = useState<string>('')
    

    const sub = props?.sub
    const client = props?.client
    const toast = useToast()
    const userId = sub

    const eventId = props?.id

    const closeTimePreferences = props?.closeTimePreferences

    // const navigation = useNavigation<UserEventTimePreferencesNavigationProp>()
    
    console.log(eventId, ' eventId prerender inside UserEventTimePreferences')

    // get event
    useEffect(() => {
        (async () => {
            // validate
            if (!eventId) {
                console.log(eventId, ' no eventId')
                return
            }

            if (!client) {
                console.log(' no client')
                return
            }

            const event = await getEventWithId(client, eventId)
            setSummary(event?.summary)
            setStartDate(event?.startDate)
            setEndDate(event?.endDate)
            setCalendarId(event?.calendarId)
        })()
    }, [client, eventId])

    // list time range preferences for event
    useEffect(() => {
        (async () => {
            try {
                // validate
                if (!eventId) {
                    return
                }

                if (!client) {
                    return
                }

                const res = await listPreferredTimeRangesByEvent(client, eventId)
                if (res?.length > 0) {
                    setTimeRangePreferences(res)
                }
            } catch (e) {
                console.log(e, ' unable to list time ranges')
            }
        })()
    }, [client, eventId])

    const hideStartTimeRangePicker = () => setIsStartTimeRange(false)
    
    const showStartTimeRangePicker = () => setIsStartTimeRange(true)

    const hideEndTimeRangePicker = () => setIsEndTimeRange(false)

    const showEndTimeRangePicker = () => setIsEndTimeRange(true)

    const changeDayOfWeek = (item: number) => {
        console.log(item, ' item inside change day of week')
        
        setDayOfWeek(item as -1 | 1 | 2 | 3 | 4 | 5 | 6 | 7)
        // setDayOfWeekObject(item)
    }

    const addItem = async () => {
        try {
            console.log('addItem called')
            // validate startTime, endTime, eventId, and dayOfWeek
            if (!startTimeRange) {
                setError('Please select a start time')
                setTimeout(() => setError(''), 3000)
                toast({
                    title: 'Start time is required',
                    description: 'Please select a start time',
                    status: 'error',
                    duration: 9000,
                    isClosable: true,
                })
                return
            }

            if (!endTimeRange) {
                setError('Please select an end time')
                setTimeout(() => setError(''), 3000)
                toast({
                    title: 'End time is required',
                    description: 'Please select an end time',
                    status: 'error',
                    duration: 9000,
                    isClosable: true,
                })
                return
            }

            if (!eventId) {
                setError('Please select an event')
                setTimeout(() => setError(''), 3000)
                toast({
                    title: 'Event is required',
                    description: 'Please select an event',
                    status: 'error',
                    duration: 9000,
                    isClosable: true,
                })
                return
            }


            if (dayOfWeek < -1 || dayOfWeek > 7) {
                setError('Please select a day of week')
                setTimeout(() => setError(''), 3000)
                toast({
                    title: 'Day of week is required',
                    description: 'Please select a day of week',
                    status: 'error',
                    duration: 9000,
                    isClosable: true,
                })
                return
            }

            // validate startTimeRange and endTimeRange
            if (startTimeRange.getTime() >= endTimeRange.getTime()) {
                setError('Please select a start time before end time')
                setTimeout(() => setError(''), 3000)
                toast({
                    title: 'Start time must be before end time',
                    description: 'Please select a start time before end time',
                    status: 'error',
                    duration: 9000,
                    isClosable: true,
                })
                return
            }

            const timeRangeDuration = dayjs(endTimeRange).diff(dayjs(startTimeRange), 'm')
            const dateDuration = dayjs(startDate.slice(0, 19)).diff(dayjs(endDate.slice(0, 19)), 'm')

            if (timeRangeDuration < dateDuration) {
                setError('Please select a end time that is same or longer than event duration')
                setTimeout(() => setError(''), 3000)
                toast({
                    title: 'End time must be same or longer than event duration',
                    description: 'Please select a end time that is same or longer than event duration',
                    status: 'error',
                    duration: 9000,
                    isClosable: true,
                })
                return
            }

            const startTime = dayjs(startTimeRange).format('HH:mm') as Time
            const endTime = dayjs(endTimeRange).format('HH:mm') as Time
            const id = uuid()
            const createdDate = dayjs().toISOString()
            const updatedAt = createdDate

            const newPreferredTimeRange: PreferredTimeRangeType = {
                id,
                eventId,
                dayOfWeek,
                startTime,
                endTime,
                createdDate,
                updatedAt,
                userId,
            }

            const newTimeRangePreferences = (timeRangePreferences || []).concat([newPreferredTimeRange])
            setTimeRangePreferences(newTimeRangePreferences)

            // save to database
            await insertPreferredTimeRangeOneForEvent(client, id, eventId, startTime, endTime, dayOfWeek, userId, createdDate, updatedAt, toast)
            // update event in db with boolean to true for modified preferredtime range
            /**
             * must include:
             * userId,
                startDate,
                endDate,

             */
            await atomicUpsertEventInDb(
                client,
                eventId,
                eventId.split('#')[0],
                userId,
                startDate,
                endDate,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                calendarId,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                true,
            )

            // clear form
            setStartTimeRange(new Date())
            setEndTimeRange(new Date())
            setDayOfWeek(-1)
            console.log('done processing')

        } catch (e) {
            setError('unable to add item to preferred time ranges')
            setTimeout(() => setError(''), 3000)
            console.log(e, ' e unable to add item to preferred time ranges')
        }
    }

    const removeItem = async (index: number) => {
        try {
            // validate item
            if (!timeRangePreferences[index]) {
                toast({
                    title: 'Item is required',
                    description: 'Please select an item',
                    status: 'error',
                    duration: 9000,
                    isClosable: true,
                })
                return
            }

            const cloneTimeRangePreferences = _.reverse(_.cloneDeep(timeRangePreferences))
            const newTimeRangePreferences = cloneTimeRangePreferences.filter((item, i) => i !== index)   
            setTimeRangePreferences(newTimeRangePreferences)
            // deletePreferredTimeRangeWithId
            await deletePreferredTimeRangeWithId(client, cloneTimeRangePreferences[index].id)
        } catch (e) {
            console.log(e, ' e unable to remove item from preferred time ranges')
        }
    }


    const renderItem = ({ item, index }: RenderPreferredTimeRangeType) => (
        <Box justifyContent="center" alignItems="center">
            <RegularCard>
                <Text p={{ phone: 's', tablet: 'm' }} variant="optionHeader">
                    {(((item?.dayOfWeek === -1) || (item?.dayOfWeek === null))) ? 'Any day of week' : dayjs(setISODay(dayjs().toDate(), item.dayOfWeek)).format('dddd')}
                </Text>
                <Text p={{ phone: 's', tablet: 'm' }} variant="optionHeader">
                    {dayjs(item.startTime, 'HH:mm').format('h:mm A')}
                    {' - '}
                    {dayjs(item.endTime, 'HH:mm').format('h:mm A')}
                </Text>
                <Pressable onPress={() => removeItem(index)}>
                    <Text p={{ phone: 's', tablet: 'm' }} variant="buttonLink">
                        <IoIosRemoveCircleOutline color={palette.purplePrimary} name="ios-remove-circle-outline" size="2em" />
                    </Text>
                </Pressable>
            </RegularCard>
        </Box>
    )

    return (
        <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%' }}>
            {error && (
                <div className="pt-4">
                    <div className="alert alert-error shadow-lg">
                        <div>
                            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span>{error}</span>
                        </div>
                    </div>
                </div>
            )}
            <div className="flex flex-col md:flex md:flex-row w-full justify-center items-center">
                <div className="flex flex-col justify-center items-center w-1/2 flex-auto">
                    <Box justifyContent="center" alignItems="center"  style={{ width: '100%'}}>
                        <Text variant="optionHeader">
                            {summary}
                        </Text>
                    </Box>
                    <Box justifyContent="center" alignItems="center"  style={{ width: '100%'}}>
                        <Box p={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
                            
                            <Text variant="optionHeader">Start Time</Text>
                            
                            <Input
                                placeholder="Select Time"
                                size="md"
                                type="time"
                                onChange={(e) => {
                                    setStartTimeRange(dayjs(e?.target?.value, "HH:mm").toDate())
                                    const timeRangeDuration = dayjs(endTimeRange).diff(dayjs(e?.target?.value), 'm')
                                    const dateDuration = dayjs(endDate.slice(0, 19)).diff(dayjs(startDate.slice(0, 19)), 'm')
                                    if (timeRangeDuration < dateDuration) {
                                        setEndTimeRange(dayjs(e?.target?.value).add(dateDuration, 'm').toDate())
                                    }
                                }}
                                value={dayjs(startTimeRange).format("HH:mm")}
                            />
                            
                        </Box>
                        <Box p={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
                            
                            <Text variant="optionHeader">End Time</Text>
                        
                            <Input
                                placeholder="Time"
                                size="md"
                                type="time"
                                onChange={(e) => {
                                    setEndTimeRange(dayjs(e?.target?.value, "HH:mm").toDate())
                                    
                                }}
                                value={dayjs(endTimeRange).format("HH:mm")}
                            />
                        
                        </Box>
                        <Box p={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
                            <select value={dayOfWeek} onChange={(e) => changeDayOfWeek(parseInt(e?.target?.value.replace(/[^0-9.]/g, ''), 10))} className="select select-primary w-full max-w-xs">
                                <option key="pick a day" disabled selected>Pick a day of the week</option>
                                {_.map(dayOfWeekInt, option1 => (
                                    <option
                                        value={option1}
                                        key={option1}
                                    >
                                        {(option1 !== -1 ? dayjs(setISODay(dayjs().toDate(), option1)).format('dddd') : 'Any day of the week')}
                                    </option>
                                    ))}
                            </select>
                        
                        </Box>
                        <Button onClick={addItem}>
                            Add
                        </Button>
                    </Box>
                </div>
                <div className="flex flex-col justify-center items-center w-1/2 flex-auto">
                    <div style={{ minHeight: '65vh'}}>
                        <FlatList
                            data={timeRangePreferences?.length > 0 ? _.reverse(_.cloneDeep(timeRangePreferences)) : null}
                            keyExtractor={item => item.id}
                            renderItem={renderItem}
                        />
                    </div>
                </div> 
            </div>
            <Box m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center"  style={{ width: '100%'}}>
                <Button onClick={closeTimePreferences}>
                    Close
                </Button>
            </Box>
        </Box>
    )


}

export default UserEventTimePreferences







