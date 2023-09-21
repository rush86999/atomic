import { useRouter } from 'next/router'
import { useEffect, useState } from "react"
import type { NextPage } from 'next'
import { useToast, Spinner } from '@chakra-ui/react'
import axios from 'axios'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import duration from 'dayjs/plugin/duration'
import isBetween from 'dayjs/plugin/isBetween'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import useSWR from 'swr'
import qs from 'qs'
import { MeetingAssistAttendeeType, MeetingAssistType } from '@lib/types'

dayjs.extend(isoWeek)
dayjs.extend(duration)
dayjs.extend(isBetween)
dayjs.extend(timezone)
dayjs.extend(utc)

const meetingAssistPoster = async (url: string, data: any): Promise<MeetingAssistType> => axios.post(url, data).then(res => res.data)

const meetingAssistAttendeePoster = async (url: string, data: any): Promise<MeetingAssistAttendeeType> => axios.post(url, data).then(res => res.data)

const CallbackCalendarSync: NextPage = () => {
    const [isValid, setIsValid] = useState<boolean>(true)
    const router = useRouter()
    const toast = useToast()
    
    const { access_token, attendeeId, meetingId } = router.query
    console.log(router.query, ' router.query')
    // console.log(access_token, ' access_token')
    console.log(attendeeId, ' attendeeId')
    console.log(meetingId, ' meetingId')

    // get meeting assist
    const { data: meetingAssist, error: meetingAssistError } = useSWR<MeetingAssistType>([
        '/api/callback-calendar-sync', {
            method: 'getMeetingAssist',
            variables: { id: meetingId },
        }], meetingAssistPoster)
    
    
    // get meeting assist attendee

    const { data: meetingAssistAttendee, error: meetingAssistAttendeeError } = useSWR<MeetingAssistAttendeeType>([
        '/api/callback-calendar-sync', {
            method: 'getMeetingAssistAttendee',
            variables: { id: attendeeId },
        }], meetingAssistAttendeePoster)
    
    // validate callback
    useEffect(() => {
        const validateCallback = async () => {
            try {

                // const meetingAssist = await getMeetingAssist(meetingId as string)
                if (!meetingAssist?.id) {
                    return false
                }

                if (meetingAssistError) {
                     toast({
                        title: 'Oops...',
                        description: 'Something went wrong, the meeting id is invalid. Maybe try again',
                        status: 'error',
                        duration: 9000,
                        isClosable: true
                     })
                    setIsValid(false)
                    return false
                }

                // const meetingAssistAttendee = await getMeetingAssistAttendee(attendeeId as string)

                if (!meetingAssistAttendee?.id) {
                    return false
                }

                if (meetingAssistAttendeeError) {
                    toast({
                        title: 'Oops...',
                        description: 'Something went wrong, the attendee id is invalid. Maybe try again',
                        status: 'error',
                        duration: 9000,
                        isClosable: true
                     })
                    setIsValid(false)
                    return false 
                }

                return true
                
            } catch (e) {
                console.log(e, ' uanble to validate callback')
            }
        }
        (async () => {
            try {
                const validatedCallback = await validateCallback()

                if (validatedCallback) {

                    // validate timezone
                    if (!meetingAssist?.timezone) {
                        console.log(' unable to get meetingAssist timezone inside callback-calendar-sync')
                        toast({
                            title: 'Oops...',
                            description: 'Something went wrong, let us know so we can work on it',
                            status: 'error',
                            duration: 9000,
                            isClosable: true
                        })
                        setIsValid(false)
                        return
                    }

                    if (!access_token) {
                        console.log(' unable to get access_token')
                        toast({
                            title: 'Oops...',
                            description: 'Something went wrong, let us know so we can work on it',
                            status: 'error',
                            duration: 9000,
                            isClosable: true
                        })
                        setIsValid(false)
                        return
                    }

                    if (!attendeeId) {
                        console.log(attendeeId, ' missing attendeeId')
                         toast({
                            title: 'Oops...',
                            description: 'Something went wrong, let us know so we can work on it',
                            status: 'error',
                            duration: 9000,
                            isClosable: true
                         })
                        setIsValid(false)
                        return
                    }


                    await axios.post('/api/callback-calendar-sync', {
                        method: 'googleCalendarSync', 
                        variables: {
                            token: access_token,
                            windowStartDate: meetingAssist?.windowStartDate,
                            windowEndDate: meetingAssist?.windowEndDate,
                            attendeeId: attendeeId,
                            hostTimezone: meetingAssist?.timezone,
                        }
                    })

                    router.push(`/?${qs.stringify({
                            calendarSyncCompleted: 'true',
                            meetingId: meetingAssist?.id,
                            attendeeId,
                        })}`,  
                    )
                }
            } catch (e) {
                toast({
                    title: 'Oops...',
                    description: 'Something went wrong, let us know so we can work on it',
                    status: 'error',
                    duration: 9000,
                    isClosable: true
                })
                console.log(e, ' unable to validate attendee and meeting')
            }
        })()
    }, [access_token, attendeeId, meetingAssist?.id, meetingAssist?.timezone, meetingAssist?.windowEndDate, meetingAssist?.windowStartDate, meetingAssistAttendee?.id, meetingAssistAttendeeError, meetingAssistError, router, router.query, toast])

    return (
        <div className="flex flex-col justify-center items-center h-screen w-full">
            <div className="sm:text-left lg:my-12 sm:my-8 lg:h-1/6 lg:w-1/2">
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-200 sm:text-2xl">
                    {"Validating your returned values"}
                </h1>

                <p className="mt-1.5 text-sm text-gray-500">
                    {"Please wait as we validate a successful calendar sync "}
                </p>
                {
                !isValid
                    ? (
                        <p className="mt-1.5 text-sm text-red-500">
                            {"Something went wrong with the sync "}
                        </p>
                    ) : null
                }
            </div>
            <div className="flex justify-center items-center lg:h-5/6 w-full">
                <Spinner color='pink.500' />
            </div>
        </div>
    )
}

export default CallbackCalendarSync
