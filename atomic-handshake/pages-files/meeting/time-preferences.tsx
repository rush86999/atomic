import { useEffect, useRef, useState } from "react"
import type { NextPage } from 'next'
import { v4 as uuid } from 'uuid'
import ModalTimePreferences from './modal-time-preferences'
import { AvailableSlot, AvailableSlotsByDate, CustomAvailableTimeType, EventType, MeetingAssistAttendeeType, MeetingAssistEventType, MeetingAssistPreferredDateRangeType, MeetingAssistPreferredTimeRangeType, MeetingAssistType, NotAvailableSlot, Time, UserPreferenceType } from "@lib/types"
import { getISODay } from 'date-fns'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import duration from 'dayjs/plugin/duration'
import isBetween from 'dayjs/plugin/isBetween'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { dayOfWeekIntToString } from '@lib/constants';
import {
    useDisclosure,
    useToast,
    Tooltip,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalBody,
    ModalCloseButton,
} from '@chakra-ui/react'
import DatePicker, { CalendarContainer } from "react-datepicker";
import axios from 'axios'

import _ from "lodash"
import { IoCloseOutline } from 'react-icons/io5'


dayjs.extend(isoWeek)
dayjs.extend(duration)
dayjs.extend(isBetween)
dayjs.extend(timezone)
dayjs.extend(utc)
dayjs.extend(customParseFormat)

type Props = {
    meetingId: string,
    attendeeId: string,
}


        const MyContainer = ({ className, children }: any) => {
            return (
                <CalendarContainer className={className}>
                  <div style={{ position: "relative" }} className="dark:text-gray-200 text-gray-900">
                    {children}
                </div>
                </CalendarContainer>
            );
          };

const MeetingAssistTimePreferences: NextPage<Props> = (props: Props) => {
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
    const [meetingAttendees, setMeetingAttendees] = useState<MeetingAssistAttendeeType[]>()
    const [meetingAssist, setMeetingAssist] = useState<MeetingAssistType>()
    const [oldPreferredTimes, setOldPreferredTimes] = useState<MeetingAssistPreferredDateRangeType[]>()
    const [newPreferredTimes, setNewPreferredTimes] = useState<(MeetingAssistPreferredDateRangeType & { slotId: string })[]>()
    const [preferredTimesRemoved, setPreferredTimesRemoved] = useState<MeetingAssistPreferredDateRangeType[]>()
    const [preferredTimesUI, setPreferredTimesUI] = useState<(MeetingAssistPreferredDateRangeType & { slotId?: string })[]>()
    const [minDate, setMinDate] = useState<Date>(new Date())
    const [maxDate, setMaxDate] = useState<Date>(dayjs().add(5, 'd').toDate())
    const [availableSlotsByDate, setAvailableSlotsByDate] = useState<AvailableSlotsByDate>()
    const [meetingAlreadyCreated, setMeetingAlreadyCreated] = useState<boolean>()
    const [isHost, setIsHost] = useState<boolean>(false)
    const [customPreferredTimes, setCustomPreferredTimes] = useState<(MeetingAssistPreferredDateRangeType & { slotId?: string })[]>()
    const [slotDuration, setSlotDuration] = useState<number>(30)
    const [hostPreferences, setHostPreferences] = useState<UserPreferenceType>()

    const { isOpen, onOpen, onClose } = useDisclosure()

    const toast = useToast()

    const meetingId = props?.meetingId
    const attendeeId = props?.attendeeId
    const preferredTimesEndRef = useRef<HTMLDivElement>(null)

    const convertPTR2PDR = (pt: MeetingAssistPreferredTimeRangeType | (MeetingAssistPreferredTimeRangeType & { slotId: string; })): MeetingAssistPreferredDateRangeType | (MeetingAssistPreferredDateRangeType & { slotId: string; }) => ({
        ...pt,
        startTime: dayjs().hour(parseInt(pt.startTime.slice(0, 3), 10)).minute(parseInt(pt.startTime.slice(3), 10)).format(),
        endTime: dayjs().hour(parseInt(pt.endTime.slice(0, 3), 10)).minute(parseInt(pt.endTime.slice(3), 10)).format(),
    })

    const convertPDR2PTR = (pd: MeetingAssistPreferredDateRangeType | (MeetingAssistPreferredDateRangeType & { slotId?: string | undefined; })): MeetingAssistPreferredTimeRangeType | (MeetingAssistPreferredTimeRangeType  & { slotId?: string | undefined; }) => ({
        ...pd,
        startTime: dayjs(pd.startTime).format('HH:mm') as Time,
        endTime: dayjs(pd.endTime).format('HH:mm') as Time,
    })

    useEffect(() => { 
        const convertPreferredTimesFromAttendeeTimeZoneToUserTimeZone = (preferredTimesInAttendeeZone: MeetingAssistPreferredTimeRangeType[], attendees: MeetingAssistAttendeeType[]): MeetingAssistPreferredDateRangeType[] => {
            return (preferredTimesInAttendeeZone?.map(pt => {
                        const foundAttendee = attendees.find(a => (a?.id === pt?.attendeeId))

                        if (foundAttendee?.id) {
                            const newPt = {
                                ...pt,
                                startTime: dayjs().hour(parseInt(pt?.startTime.slice(0, 3), 10)).minute(parseInt(pt?.startTime.slice(3), 10)).tz(foundAttendee?.timezone, true).tz(dayjs.tz.guess()).format(),
                                endTime: dayjs().hour(parseInt(pt?.endTime.slice(0, 3), 10)).minute(parseInt(pt?.endTime.slice(3), 10)).tz(foundAttendee?.timezone, true).tz(dayjs.tz.guess()).format(),
                            }
                            return newPt
                        }

                        return null
                    })?.filter(e => (e !== null))) as MeetingAssistPreferredTimeRangeType[]
        }
        (async () => {
            try {
                if (!meetingId) {
                    toast({
                        title: 'No meeting id present',
                        description: 'Seems like there is no meeting id to allow time preference selection',
                        status: 'error',
                        duration: 9000,
                        isClosable: true
                    })
                    return
                }

                const oldMeetingAssist = (await axios.post<MeetingAssistType>('/api/time-preferences', {
                    method: 'getMeetingAssist',
                    variables: {
                        id: meetingId,
                    },
                }))?.data
                if (!oldMeetingAssist || (!(oldMeetingAssist?.id))) {
                    toast({
                        title: 'No meeting present',
                        description: 'Seems like there is no meeting to allow time preference selection',
                        status: 'error',
                        duration: 9000,
                        isClosable: true
                    })
                    return
                }

                if (!oldMeetingAssist?.timezone) {
                    
                    toast({
                        title: 'No meeting present',
                        description: 'Seems like there is no meeting to allow time preference selection',
                        status: 'error',
                        duration: 9000,
                        isClosable: true
                    })
                    return
                }

                if (!oldMeetingAssist?.windowStartDate) {
                    
                    toast({
                        title: 'No meeting present',
                        description: 'Seems like there is no meeting to allow time preference selection',
                        status: 'error',
                        duration: 9000,
                        isClosable: true
                    })
                    return
                }

                if (!oldMeetingAssist?.windowEndDate) {
                    
                    toast({
                        title: 'No meeting present',
                        description: 'Seems like there is no meeting to allow time preference selection',
                        status: 'error',
                        duration: 9000,
                        isClosable: true
                    })
                    return
                }

                if (!oldMeetingAssist?.userId) {
                    
                     toast({
                        title: 'No meeting present',
                        description: 'Seems like there is no meeting to allow time preference selection',
                        status: 'error',
                        duration: 9000,
                        isClosable: true
                    })
                    return
                }
                
                setMeetingAssist(oldMeetingAssist)
                setMinDate(dayjs(oldMeetingAssist?.windowStartDate?.slice(0, 19)).tz(oldMeetingAssist?.timezone, true).tz(dayjs.tz.guess()).toDate())
                setMaxDate(dayjs(oldMeetingAssist?.windowEndDate?.slice(0, 19)).tz(oldMeetingAssist?.timezone, true).tz(dayjs.tz.guess()).toDate())
                setSelectedDate(dayjs(oldMeetingAssist?.windowStartDate?.slice(0, 19)).tz(oldMeetingAssist?.timezone, true).tz(dayjs.tz.guess()).toDate())

                const attendees = (await axios.post<MeetingAssistAttendeeType[]>('/api/time-preferences', {
                    method: 'listMeetingAssistAttendeesGivenMeetingId',
                    variables: {
                        meetingId,
                    },
                }))?.data

                if (!attendees || (!(attendees?.length > 0))) {
                    
                    toast({
                        title: 'No attendees present',
                        description: 'Seems like there are no attendees to confirm a meeting',
                        status: 'error',
                        duration: 9000,
                        isClosable: true
                    })
                    return
                }

                setMeetingAttendees(attendees)

                const externalAttendees = attendees.filter(a => !!a?.externalAttendee)

                const internalAttendees = attendees.filter(a => !a?.externalAttendee)

                const meetingAssistEventsInUserTimezone: MeetingAssistEventType[] = []

                for (const externalAttendee of externalAttendees) {


                    const oldMeetingAssistEvents = (await axios.post<MeetingAssistEventType[]>('/api/time-preferences', {
                        method: 'listMeetingAssistEventsForAttendeeGivenDates',
                        variables: {
                            attendeeId: externalAttendee?.id,
                            hostStartDate: oldMeetingAssist?.windowStartDate as string,
                            hostEndDate: oldMeetingAssist?.windowEndDate as string,
                            userTimezone: externalAttendee?.timezone as string,
                            hostTimezone: oldMeetingAssist?.timezone as string,
                        },
                    }))?.data
                    
                    if (!oldMeetingAssistEvents || (!(oldMeetingAssistEvents?.length > 0))) {
                        continue
                    }

                    const oldMeetingAssistEventsInUserTimezone = oldMeetingAssistEvents?.map(e => ({
                        ...e,
                        startDate: dayjs(e?.startDate.slice(0, 19)).tz(e?.timezone, true).tz(dayjs.tz.guess()).format(),
                        endDate: dayjs(e?.endDate.slice(0, 19)).tz(e?.timezone, true).tz(dayjs.tz.guess()).format(),
                        timezone: dayjs.tz.guess(),
                    }))

                    meetingAssistEventsInUserTimezone.push(...oldMeetingAssistEventsInUserTimezone)
                }


                const eventsInUserTimezone: EventType[] = []

                for (const internalAttendee of internalAttendees) {

                    const oldEventsInEventTimezone = (await axios.post<EventType[]>('/api/time-preferences', {
                        method: 'listEventsForUserGivenDates',
                        variables: {
                            userId: internalAttendee?.userId,
                            hostStartDate: oldMeetingAssist?.windowStartDate as string,
                            hostEndDate: oldMeetingAssist?.windowEndDate as string,
                            userTimezone: internalAttendee?.timezone as string,
                            hostTimezone: oldMeetingAssist?.timezone as string,
                        },
                    }))?.data
                    
                    

                    if (!oldEventsInEventTimezone || (!(oldEventsInEventTimezone?.length > 0))) {
                        continue
                    }

                    const oldEventsInUserTimezone = oldEventsInEventTimezone?.map(e => ({
                        ...e,
                        startDate: dayjs(e?.startDate.slice(0, 19)).tz(e?.timezone, true).tz(dayjs.tz.guess()).format(),
                        endDate: dayjs(e?.endDate.slice(0, 19)).tz(e?.timezone, true).tz(dayjs.tz.guess()).format(),
                        timezone: dayjs.tz.guess(),
                    }))

                    eventsInUserTimezone.push(...oldEventsInUserTimezone)
                }



                const preferredTimesInAttendeeZone = (await axios.post<MeetingAssistPreferredTimeRangeType[]>('/api/time-preferences', {
                    method: 'listMeetingAssistPreferredTimeRangesGivenMeetingId',
                    variables: {
                        meetingId,
                    },
                }))?.data
                
                if (preferredTimesInAttendeeZone && (preferredTimesInAttendeeZone?.length > 0)) {
                    const preferredTimesInUserZone = convertPreferredTimesFromAttendeeTimeZoneToUserTimeZone(preferredTimesInAttendeeZone, attendees)

                    if (!preferredTimesInUserZone?.[0]?.id) {
                        
                        return
                    }

                    setOldPreferredTimes(preferredTimesInUserZone?.map(pt => ({ ...pt, dayOfWeek: !pt?.dayOfWeek ? -1 : pt?.dayOfWeek })))
                    setPreferredTimesUI(preferredTimesInUserZone?.map(pt => ({ ...pt, dayOfWeek: !pt?.dayOfWeek ? -1 : pt?.dayOfWeek })))

                }


                const oldHostPreferences = (await axios.post<UserPreferenceType>('/api/time-preferences', {
                    method: 'getUserPreferences',
                    variables: {
                        userId: oldMeetingAssist?.userId,
                    },
                }))?.data

                if (!oldHostPreferences?.id) {
                    
                    return
                }

                const oldSlotDuration = oldMeetingAssist?.duration

                const notAvailableSlots: NotAvailableSlot[] = []
                const currentTimezone = dayjs.tz.guess()

                const notAvailableFromMeetingAssists: NotAvailableSlot[] = meetingAssistEventsInUserTimezone?.map(me => ({
                    startDate: me?.startDate,
                    endDate: me?.endDate,
                }))

                if (notAvailableFromMeetingAssists?.[0]?.startDate) {
                    notAvailableSlots.push(...notAvailableFromMeetingAssists)
                }

                const notAvailableFromEvents: NotAvailableSlot[] = eventsInUserTimezone?.map(e => ({
                    startDate: e?.startDate,
                    endDate: e?.endDate,
                }))

                if (notAvailableFromEvents?.[0]?.startDate) {
                    notAvailableSlots.push(...notAvailableFromEvents)
                }

                setSlotDuration(oldSlotDuration)
                setHostPreferences(oldHostPreferences)


                
                const newAvailableSlotsByDate = (await axios.post<AvailableSlotsByDate>('/api/time-preferences', {
                    method: 'generateAvailableSlotsforTimeWindow',
                    variables: {
                        windowStartDate: oldMeetingAssist?.windowStartDate,
                        windowEndDate: oldMeetingAssist?.windowEndDate,
                        slotDuration: oldSlotDuration,
                        hostPreferences: oldHostPreferences as UserPreferenceType,
                        hostTimezone: oldMeetingAssist?.timezone,
                        userTimezone: currentTimezone,
                        notAvailableSlotsInUserTimezone: notAvailableSlots?.length > 0 ? notAvailableSlots : undefined,
                    },
                }))?.data

                setAvailableSlotsByDate(newAvailableSlotsByDate)
            } catch (e) {
                
            }
        })()
    }, [meetingId, toast])

    useEffect(() => {
        (async () => {
            try {
                if (!meetingAssist?.id) {
                    return
                }

                if (!meetingAttendees?.[0]?.id) {
                    return
                }

                const userAttendee = meetingAttendees?.find(m => (m?.id === attendeeId))

                if (userAttendee?.userId === meetingAssist?.userId) {
                    setIsHost(true)
                }

                if (!userAttendee?.id) {
                    
                    return
                }

                if (!meetingAssist?.timezone) {
                    
                    return
                }

                const events = (await axios.post('/api/time-preferences', {
                    method: 'findEventsForUserGivenMeetingId',
                    variables: {
                        userId: userAttendee?.userId,
                        hostStartDate: meetingAssist?.windowStartDate,
                        hostEndDate: meetingAssist?.windowEndDate,
                        userTimezone: dayjs.tz.guess(),
                        hostTimezone: meetingAssist?.timezone,
                        meetingId,
                    },
                }))?.data

                if (events?.[0]?.id) {
                    toast({
                        title: 'Meeting already created',
                        description: 'Seems like meeting is already created',
                        status: 'error',
                        duration: 9000,
                        isClosable: true
                    })
                    setMeetingAlreadyCreated(true)
                }
            } catch (e) {
                
            }
        })()
    }, [attendeeId, meetingAssist?.id, meetingAssist?.timezone, meetingAssist?.userId, meetingAssist?.windowEndDate, meetingAssist?.windowStartDate, meetingAttendees, meetingId, toast])
    
    
    useEffect(() => {
        preferredTimesEndRef?.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'end',
            inline: 'nearest'
            });
    }, [preferredTimesUI])

    const onSelectedSlot = (i: number) => {
        if (!availableSlotsByDate) {
            
            return
        }

        if (meetingAssist?.cancelled) {
            
            toast({
                title: 'Meeting cancelled',
                description: 'Seems like meeting is cancelled',
                status: 'warning',
                duration: 9000,
                isClosable: true
            })
            return
        }

        if (dayjs().isAfter(dayjs(meetingAssist?.windowEndDate?.slice(0, 19)).tz(meetingAssist?.timezone, true).format())) {
            
            toast({
                title: 'Meeting expired',
                description: 'Seems like meeting is expired',
                status: 'warning',
                duration: 9000,
                isClosable: true
            })
            return
        }

        if (meetingAssist?.expireDate && (dayjs().isAfter(dayjs(meetingAssist?.expireDate?.slice(0, 19)).tz(meetingAssist?.timezone, true).format()))) {
            
            toast({
                title: 'Meeting expired',
                description: 'Seems like meeting is expired',
                status: 'warning',
                duration: 9000,
                isClosable: true
            })
            return
        }

        

        const newAvailableSlotsByDate = _.cloneDeep(availableSlotsByDate)
        
        if (!newAvailableSlotsByDate[`${dayjs(selectedDate).format('YYYY-MM-DD')}`]?.[i]?.id) {
            
            return
        }

        newAvailableSlotsByDate[`${dayjs(selectedDate).format('YYYY-MM-DD')}`][i].selected = !newAvailableSlotsByDate?.[`${dayjs(selectedDate).format('YYYY-MM-DD')}`]?.[i]?.selected
        const selected = newAvailableSlotsByDate[`${dayjs(selectedDate).format('YYYY-MM-DD')}`][i].selected
        setAvailableSlotsByDate(newAvailableSlotsByDate)

        if (selected) {
            const newPt = convertSlotToPreferredTime(newAvailableSlotsByDate[`${dayjs(selectedDate).format('YYYY-MM-DD')}`][i])

            if (!newPt?.id) {
                
                return
            }

            addNewPreferredTime(newPt, newAvailableSlotsByDate[`${dayjs(selectedDate).format('YYYY-MM-DD')}`][i]?.id)

        } else {
            const removedPt = preferredTimesUI?.find(pt => (pt?.slotId === newAvailableSlotsByDate[`${dayjs(selectedDate).format('YYYY-MM-DD')}`][i]?.id))

            if (removedPt?.id) {
                removePreferredTime(removedPt)
            }
        }
        
    }

    const convertCustomAvailableTimeToPreferred = (availableTime: CustomAvailableTimeType): MeetingAssistPreferredTimeRangeType & {
        slotId?: string | undefined;
    } | undefined => {
        if (!meetingAssist?.userId) {
            
            toast({
                title: 'No meeting present',
                description: 'Seems like there is no meeting to allow time preference selection',
                status: 'error',
                duration: 9000,
                isClosable: true
            })
            return
        }

        const newPreferredTime: MeetingAssistPreferredTimeRangeType = {
            id: uuid(),
            meetingId,
            dayOfWeek: availableTime?.dayOfWeekInt === -1 ? undefined : availableTime?.dayOfWeekInt,
            startTime: availableTime?.startTime as Time,
            endTime: availableTime?.endTime as Time,
            updatedAt: dayjs().format(),
            createdDate: dayjs().format(),
            hostId: meetingAssist?.userId as string,
            attendeeId,
        }

        return newPreferredTime
    }

    const onSubmitCustomAvailableTime = (availableTime: CustomAvailableTimeType) => {
        onClose()

        if (dayjs().isAfter(dayjs(meetingAssist?.windowEndDate?.slice(0, 19)).tz(meetingAssist?.timezone, true).format())) {
            
            toast({
                title: 'Meeting expired',
                description: 'Seems like meeting is expired',
                status: 'warning',
                duration: 9000,
                isClosable: true
            })
            return
        }

        if (meetingAssist?.expireDate && (dayjs().isAfter(dayjs(meetingAssist?.expireDate?.slice(0, 19)).tz(meetingAssist?.timezone, true).format()))) {
            
            toast({
                title: 'Meeting expired',
                description: 'Seems like meeting is expired',
                status: 'warning',
                duration: 9000,
                isClosable: true
            })
            return
        }

        if (meetingAssist?.cancelled) {
            
            toast({
                title: 'Meeting cancelled',
                description: 'Seems like meeting is cancelled',
                status: 'warning',
                duration: 9000,
                isClosable: true
            })
            return
        }

        const newPreferredTime = convertCustomAvailableTimeToPreferred(
            availableTime,
        )
        
        if (!newPreferredTime) {
            
            return
        }
        const newPreferredTimesUI = _.cloneDeep(preferredTimesUI) || []

        newPreferredTimesUI.push(convertPTR2PDR(newPreferredTime))

        setPreferredTimesUI(newPreferredTimesUI)

        const newCustomPreferredTimes = _.cloneDeep(customPreferredTimes) || []

        newCustomPreferredTimes.push(convertPTR2PDR(newPreferredTime))

        setCustomPreferredTimes(newCustomPreferredTimes)

    }

    const onCancelCustomAvailableTime = () => onClose()
        
    const convertSlotToPreferredTime = (slot: AvailableSlot): MeetingAssistPreferredDateRangeType | undefined => {
        if (!meetingAssist?.userId) {
            
            toast({
                title: 'No meeting present',
                description: 'Seems like there is no meeting to allow time preference selection',
                status: 'error',
                duration: 9000,
                isClosable: true
            })
            return
        }
        const newPreferredTime: MeetingAssistPreferredDateRangeType = {
            id: uuid(),
            meetingId,
            dayOfWeek: getISODay(dayjs(selectedDate).toDate()),
            startTime: dayjs(slot?.startDate).format(),
            endTime: dayjs(slot?.endDate).format(),
            updatedAt: dayjs().format(),
            createdDate: dayjs().format(),
            hostId: meetingAssist?.userId as string,
            attendeeId,
        }

        return newPreferredTime
    }

    const addNewPreferredTime = (
        newPt: MeetingAssistPreferredDateRangeType,
        slotId: string,
    ) => {
        if (!newPt?.id) {
            
            return
        }

        if (dayjs().isAfter(dayjs(meetingAssist?.windowEndDate?.slice(0, 19)).tz(meetingAssist?.timezone, true).format())) {
            
            toast({
                title: 'Meeting expired',
                description: 'Seems like meeting is expired',
                status: 'warning',
                duration: 9000,
                isClosable: true
            })
            return
        }

        if (meetingAssist?.expireDate && (dayjs().isAfter(dayjs(meetingAssist?.expireDate?.slice(0, 19)).tz(meetingAssist?.timezone, true).format()))) {
            
            toast({
                title: 'Meeting expired',
                description: 'Seems like meeting is expired',
                status: 'warning',
                duration: 9000,
                isClosable: true
            })
            return
        }

        if (meetingAlreadyCreated || meetingAssist?.cancelled) {
            
             toast({
                title: 'Meeting already created',
                description: 'Seems like meeting is already created',
                status: 'error',
                duration: 9000,
                isClosable: true
            })
            return
        }

        const clonedNewPreferredTimes = (_.cloneDeep(newPreferredTimes)
            || []) as (MeetingAssistPreferredDateRangeType & { slotId: string })[]
        clonedNewPreferredTimes.push({...newPt, slotId } as MeetingAssistPreferredDateRangeType & { slotId: string; })
        setNewPreferredTimes(clonedNewPreferredTimes)

        const clonedPreferredTimesUI = (_.cloneDeep(preferredTimesUI) || [])
        clonedPreferredTimesUI.push({ ...newPt, slotId } as MeetingAssistPreferredDateRangeType & { slotId: string; })
        setPreferredTimesUI(clonedPreferredTimesUI)
    }

    const removePreferredTime = (
        removedPt: MeetingAssistPreferredDateRangeType,
    ) => {
        if (!removedPt?.id) {
            
            return
        }


        if (meetingAlreadyCreated || meetingAssist?.cancelled) {
            
             toast({
                title: 'Meeting already created',
                description: 'Seems like meeting is already created',
                status: 'error',
                duration: 9000,
                isClosable: true
            })
            return
        }


        const clonedPreferredTimesUI = (_.cloneDeep(preferredTimesUI) || [])

        const foundIndex = clonedPreferredTimesUI.findIndex(pt => (pt?.id === removedPt?.id))

        if (foundIndex > -1) {
            const newClonedPreferredTimesUI = clonedPreferredTimesUI
                .slice(0, foundIndex)
                .concat(clonedPreferredTimesUI.slice(foundIndex + 1))
            
            setPreferredTimesUI(newClonedPreferredTimesUI)
        }

        const foundOldIndex = oldPreferredTimes?.findIndex(oPt => (oPt?.id === removedPt?.id))

        if ((foundOldIndex) && (foundOldIndex > -1)) {

            const clonedPreferredTimesRemoved = (_.cloneDeep(preferredTimesRemoved) || []) as MeetingAssistPreferredDateRangeType[]
            clonedPreferredTimesRemoved.push(removedPt)
            setPreferredTimesRemoved(clonedPreferredTimesRemoved)

        }

        const foundNewIndex = newPreferredTimes?.findIndex(pt => (pt?.id === removedPt?.id))

        if ((foundNewIndex) && (foundNewIndex > -1)) {
            const slicedNewPreferredTimes = newPreferredTimes
                ?.slice(0, foundNewIndex)
                ?.concat(newPreferredTimes?.slice(foundNewIndex + 1))

            setNewPreferredTimes(slicedNewPreferredTimes)
        }

        const foundCustomIndex = customPreferredTimes?.findIndex(c => (c?.id === removedPt?.id))

        if ((foundCustomIndex) && (foundCustomIndex > -1)) {
            const slicedCustomPreferredTimes = customPreferredTimes
                ?.slice(0, foundCustomIndex)
                ?.concat(customPreferredTimes?.slice(foundCustomIndex + 1))

            setCustomPreferredTimes(slicedCustomPreferredTimes)
        }
    }

    const removePreferredTimeByIndex = (index: number) => {
        if (meetingAssist?.cancelled) {
            
            toast({
                title: 'Meeting cancelled',
                description: 'Seems like meeting is cancelled',
                status: 'warning',
                duration: 9000,
                isClosable: true
            })
            return
        }

        if (dayjs().isAfter(dayjs(meetingAssist?.windowEndDate?.slice(0, 19)).tz(meetingAssist?.timezone, true).format())) {
            
            toast({
                title: 'Meeting expired',
                description: 'Seems like meeting is expired',
                status: 'warning',
                duration: 9000,
                isClosable: true
            })
            return
        }

        if (meetingAssist?.expireDate && (dayjs().isAfter(dayjs(meetingAssist?.expireDate?.slice(0, 19)).tz(meetingAssist?.timezone, true).format()))) {
            
            toast({
                title: 'Meeting expired',
                description: 'Seems like meeting is expired',
                status: 'warning',
                duration: 9000,
                isClosable: true
            })
            return
        }

        const removedPt = preferredTimesUI?.[index]

        if (!removedPt?.id) {
            
            return
        }

        removePreferredTime(removedPt)

    }

    const removePreferredTimesInDb = async () => {
        try {
            const ids = preferredTimesRemoved?.map(pt => (pt?.id))

            if (ids?.[0]) {
                return axios.post('/api/time-preferences', {
                    method: 'deleteMeetingAssistPreferredTimesByIds',
                    variables: {
                        ids,
                    },
                })
            }
        } catch (e) {
            
        }
    }

    const convertPreferredTimesInUserTimeZoneToHostTimeZone = (preferredTimesToConvert: MeetingAssistPreferredTimeRangeType[], hostTimezone: string) => {
        const convertedPreferredTimes = preferredTimesToConvert?.map(pt => {
            return {
                ...pt,
                startTime: dayjs(pt?.startTime, 'HH:mm', true).tz(dayjs.tz.guess(), true).tz(hostTimezone).format('HH:mm'),
                endTime: dayjs(pt?.endTime, 'HH:mm', true).tz(dayjs.tz.guess(), true).tz(hostTimezone).format('HH:mm'),
            }
        })

        return convertedPreferredTimes
    }

    const convertToPreferredTimesForMeetingAssist = () => {
        const preferredTimesAddedInUserTimezone = []
        let preferredTimesAddedInUserTimezoneViaSlots: ((MeetingAssistPreferredDateRangeType & { slotId: string }) | undefined)[] | { id: any }[] = []

        if (newPreferredTimes && (newPreferredTimes?.length > 0)) {
            preferredTimesAddedInUserTimezoneViaSlots = newPreferredTimes?.map(pt => _.omit(pt, ['slotId']))
        }

        if (preferredTimesAddedInUserTimezoneViaSlots?.[0]?.id) {
            preferredTimesAddedInUserTimezone.push(...preferredTimesAddedInUserTimezoneViaSlots)
        }

        let customPreferredTimesAddedInUser: ((MeetingAssistPreferredDateRangeType & { slotId?: string | undefined }) | undefined)[] | { id: any }[] = []

        if (customPreferredTimes && (customPreferredTimes?.length > 0)) {
            customPreferredTimesAddedInUser = customPreferredTimes?.map(pt => _.omit(pt, ['slotId']))
        }

        if (customPreferredTimesAddedInUser?.[0]?.id) {
            preferredTimesAddedInUserTimezone.push(...customPreferredTimesAddedInUser)
        }

        if (oldPreferredTimes?.[0]?.id) {
            preferredTimesAddedInUserTimezone.push(...oldPreferredTimes)
        }

        if (!preferredTimesAddedInUserTimezone?.[0]?.id) {
            
            return
        }

        if (!meetingAssist?.timezone) {
            
            toast({
                title: 'Meeting does not exist',
                description: 'Seems like meeting does not exist',
                status: 'error',
                duration: 9000,
                isClosable: true
            })
            return
        }
            
        

        if (preferredTimesAddedInUserTimezone && (preferredTimesAddedInUserTimezone?.length > 0)) {
            const convertedPreferredTimes = convertPreferredTimesInUserTimeZoneToHostTimeZone(
                preferredTimesAddedInUserTimezone?.map(pd => convertPDR2PTR(pd as MeetingAssistPreferredDateRangeType & { slotId?: string | undefined; })),
                meetingAssist?.timezone,
            )

            return convertedPreferredTimes

        }

        return null
    }

    const addPreferredTimesInDb = async () => {
        try {
            const preferredTimesAddedInUserTimezone = []
            let preferredTimesAddedInUserTimezoneViaSlots: ((MeetingAssistPreferredDateRangeType & { slotId: string }) | undefined)[] | { id: any }[] = []

            if (newPreferredTimes && (newPreferredTimes?.length > 0)) {
                preferredTimesAddedInUserTimezoneViaSlots = newPreferredTimes?.map(pt => _.omit(pt, ['slotId']))
            }

            if (preferredTimesAddedInUserTimezoneViaSlots?.[0]?.id) {
                preferredTimesAddedInUserTimezone.push(...preferredTimesAddedInUserTimezoneViaSlots)
            }

            let customPreferredTimesAddedInUser: ((MeetingAssistPreferredDateRangeType & { slotId?: string | undefined }) | undefined)[] | { id: any }[] = []

            if (customPreferredTimes && (customPreferredTimes?.length > 0)) {
                customPreferredTimesAddedInUser = customPreferredTimes?.map(pt => _.omit(pt, ['slotId']))
            }

            if (customPreferredTimesAddedInUser?.[0]?.id) {
                preferredTimesAddedInUserTimezone.push(...customPreferredTimesAddedInUser)
            }

            if (!preferredTimesAddedInUserTimezone?.[0]?.id) {
                
                return
            }

            if (!meetingAssist?.timezone) {
                
                toast({
                    title: 'Meeting does not exist',
                    description: 'Seems like meeting does not exist',
                    status: 'error',
                    duration: 9000,
                    isClosable: true
                })
                return
            }
            

            if (preferredTimesAddedInUserTimezone && (preferredTimesAddedInUserTimezone?.length > 0)) {
                const convertedPreferredTimes = convertPreferredTimesInUserTimeZoneToHostTimeZone(
                    preferredTimesAddedInUserTimezone?.map(pd => convertPDR2PTR(pd as MeetingAssistPreferredDateRangeType & { slotId?: string | undefined; })),
                    meetingAssist?.timezone,
                )
    
                const res = (await axios.post<number>('/api/time-preferences', {
                    method: 'upsertMeetingAssistPreferredTimes',
                    variables: {
                        preferredTimes: convertedPreferredTimes as MeetingAssistPreferredTimeRangeType[],
                    },
                }))?.data
                return 
            }
            
            
        } catch (e) {
            
        }
    }

    const callMeetingAssist = async () => {
        try {
            
            if (!meetingAssist?.id) {
                
                toast({
                    title: 'Meeting does not exist',
                    description: 'Seems like meeting does not exist',
                    status: 'error',
                    duration: 9000,
                    isClosable: true
                })
                return
            }

            if (!meetingAssist?.timezone) {
                
                toast({
                    title: 'Meeting does not exist',
                    description: 'Seems like meeting does not exist',
                    status: 'error',
                    duration: 9000,
                    isClosable: true
                })
                return
            }

            
            

            if (meetingAssist?.originalMeetingId) {
                
                const originalPreferredTimes = convertToPreferredTimesForMeetingAssist()

                

                await axios.post(
                    process.env.NEXT_PUBLIC_ATOMIC_HANDSHAKE_API as string,
                    {
                        originalMeetingAssist: meetingAssist,
                        originalPreferredTimes,
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    }
                )
            }

            await axios.post('/api/time-preferences', {
                method: 'startMeetingAssist',
                variables: {
                    body: {
                        userId: meetingAssist?.userId,
                        windowStartDate: meetingAssist?.windowStartDate,
                        windowEndDate: meetingAssist?.windowEndDate,
                        timezone: meetingAssist?.timezone,
                    },
                },
            })

            

            
        } catch (e) {
            
        }
    }


    const onSubmit = async () => {
        try {
            if (meetingAssist?.cancelled) {
                
                toast({
                    title: 'Meeting cancelled',
                    description: 'Seems like meeting is cancelled',
                    status: 'warning',
                    duration: 9000,
                    isClosable: true
                })
                return
            }

            if (dayjs().isAfter(dayjs(meetingAssist?.windowEndDate?.slice(0, 19)).tz(meetingAssist?.timezone, true).format())) {
            
            toast({
                title: 'Meeting expired',
                description: 'Seems like meeting is expired',
                status: 'warning',
                duration: 9000,
                isClosable: true
            })
            return
        }

        if (meetingAssist?.expireDate && (dayjs().isAfter(dayjs(meetingAssist?.expireDate?.slice(0, 19)).tz(meetingAssist?.timezone, true).format()))) {
            
            toast({
                title: 'Meeting expired',
                description: 'Seems like meeting is expired',
                status: 'warning',
                duration: 9000,
                isClosable: true
            })
            return
        }

            if (meetingAlreadyCreated) {
                
                toast({
                    title: 'Meeting already created',
                    description: 'Seems like meeting is already created',
                    status: 'error',
                    duration: 9000,
                    isClosable: true
                })
                return
            }

            await removePreferredTimesInDb()

            await addPreferredTimesInDb()

            if (
                meetingAttendees?.length &&
                meetingAssist?.minThresholdCount &&
                (meetingAttendees?.length >= meetingAssist?.minThresholdCount)
            ) {
                
                await callMeetingAssist()
            }

                toast({
                    title: 'Attendance submitted',
                    description: 'Your attendance & time preferences have been successfully submitted. You may now close the window.',
                    status: 'success',
                    duration: 18000,
                    isClosable: true
                })
        } catch (e) {
            
        }
    }

    

    

    return (
        <div className="flex flex-col justify-center items-center h-full w-full ">
            <div className="lg:flex lg:justify-center lg:items-center lg:flex-row sm:flex-col h-3/4 w-full ">
                <div className="lg:w-2/3 flex flex-col justify-center items-center lg:m-2 m-3 h-1/2 lg:h-full ">
                    <div className="flex items-center justify-center lg:my-2 my-3 w-full h-1/6">
                        <div>
                            <DatePicker
                                selected={selectedDate}
                                onChange={(date) => setSelectedDate(date)}
                                minDate={minDate}
                                maxDate={maxDate}
                                placeholderText="Select a date to see available slots for possible time selection"
                                className="text-gray-900 bg-gray-200 dark:text-gray-200 dark:bg-gray-900 rounded-lg text-center"
                            />
                        </div>

                    </div>
                    <div className="flex justify-center items-center h-5/6 w-full my-3 overflow-y-scroll">
                        {
                            (availableSlotsByDate?.[`${dayjs(selectedDate).format('YYYY-MM-DD')}`]
                                && availableSlotsByDate?.[`${dayjs(selectedDate).format('YYYY-MM-DD')}`]?.length > 0)
                                && (meetingAssist?.attendeeCanModify || meetingAssist?.enableAttendeePreferences)
                            ? (
                                <div className="space-y-2 lg:w-1/2 h-full">
                                {availableSlotsByDate?.[`${dayjs(selectedDate).format('YYYY-MM-DD')}`]?.map((av, i) => (
                                    <div key={av?.id} className="w-full m-auto">
                                        <input
                                            className="peer hidden"
                                            type="radio"
                                            name={av?.id}
                                            value={av?.id}
                                            id={av?.id}
                                            checked={av?.selected}
                                            onChange={() => onSelectedSlot(i)}
                                        />

                                        <label
                                            className="flex cursor-pointer items-center justify-center rounded-lg border  border-purple-900 p-4 text-sm font-medium shadow-sm transition-colors hover:bg-purple-900 hover:text-gray-200  peer-checked:border-pink-500 peer-checked:ring-1 peer-checked:ring-pink-500 text-center dark:text-gray-200 text-gray-900"
                                            htmlFor={av?.id}
                                        >
                                            <span className=""> 
                                                {`${dayjs(av?.startDate).format('h:mm A')} - ${dayjs(av?.endDate).format('h:mm A')}`} 
                                            </span>

                                        </label>
                                    </div>
                                ))}
                                </div>
                            )
                            : (
                                <div className="flex justify-center items-center h-full w-full">
                                    <div className="text-center sm:text-left w-1/2">
                                        <h2 className=" font-bold text-gray-900 dark:text-gray-200 sm:text-xl m-3">
                                            Looks like there are no slots available for this date. You can either choose another date or click Submit. You will still be able to book an appointment. Just make sure to click Submit.
                                        </h2>
                                    </div>
                                </div>
                            )
                        }
                    </div>
                </div>
                <div className="lg:w-1/3 flex flex-col justify-center items-center m-3 h-1/2 lg:h-full">
                    <div className="lg:h-1/6 lg:w-full" />
                    <div className="flex flex-col items-center justify-center space-y-2 lg:h-5/6 w-full my-3 overflow-y-scroll">
                        {
                            preferredTimesUI?.map((pt, i) => (
                                <div key={pt?.id}>

                                    <div
                                        className="flex flex-col items-start justify-center rounded-lg border hover:border-pink-900 border-purple-900 p-4 text-sm font-medium shadow-sm transition-colors lg:ml-1 sm:ml-2 ease-in-out delay-150 duration-300"
                                    >
                                        
                                        <div>
                                            {((pt?.dayOfWeek !== undefined) && (pt?.dayOfWeek > 0)) && (dayOfWeekIntToString?.[pt?.dayOfWeek]?.[0] + dayOfWeekIntToString?.[pt?.dayOfWeek]?.slice(1).toLowerCase())}  
                                        </div>
                                        <div className="flex justify-center items-center  hover:text-pink-900 dark:text-gray-200 text-gray-900">
                                            <div className="">
                                                {`${dayjs(pt?.startTime).format('h:mm A')} - ${dayjs(pt?.endTime).format('h:mm A')}`} 
                                            </div>

                                            <div className="flex flex-end items-center">   
                                                {(meetingAssist?.attendeeCanModify || (
                                                    meetingAssist?.enableAttendeePreferences
                                                    && ((newPreferredTimes?.some(pt2 => (pt2?.id === pt?.id))) || (customPreferredTimes?.some(pt2 => (pt2?.id === pt?.id))))
                                                ))
                                                ? (
                                                    <div className="">
                                                        <IoCloseOutline size={45} onClick={() => removePreferredTimeByIndex(i)}  className="text-red-500 cursor-pointer p-3" />
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            ))
                        }
                        <div ref={preferredTimesEndRef} />
                    </div>
                    <div className="lg:h-1/6 w-full flex flex-col justify-center items-center my-3 ">
                        <button className='btn btn-primary lg:p-3 p-4' onClick={onSubmit}>
                            {'Submit'}
                        </button>
                        {
                            (meetingAssist?.guaranteeAvailability || isHost)
                            ? (
                                    <div className=' lg:pt-3 pt-4'>
                                        <Tooltip label='If none of the times work for you, then you can add a custom time. Atomic will take the custom time into account when scheduling a meeting'>
                                            <button className='btn btn-primary' onClick={onOpen}>
                                                {'Custom Time Preferences'}
                                            </button>
                                        </Tooltip>
                                    </div>
                            ) : null
                        }
                    </div>
                </div>   
            </div>
            <p className="lg:m-3 m-4 text-lg text-center text-gray-500">
                You do not have to select a time slot. Go ahead and press submit if you have no time preference.
            </p>
            <div>
                {
                    hostPreferences
                    && meetingAssist
                    &&   
                    (
                        <Modal isOpen={isOpen} onClose={onClose}>
                            <ModalOverlay />
                            <ModalContent>
                                <ModalCloseButton />
                                <ModalBody>
                                    <ModalTimePreferences
                                        minDate={minDate}
                                        maxDate={maxDate}
                                        slotDuration={slotDuration}
                                        hostPreferences={hostPreferences}
                                        meetingAssist={meetingAssist}
                                        onSubmit={onSubmitCustomAvailableTime}
                                        onCancel={onCancelCustomAvailableTime}
                                    />
                                </ModalBody>
                            </ModalContent>
                        </Modal>
                    )
                }
            </div>
        </div>
    )
}

export default MeetingAssistTimePreferences
