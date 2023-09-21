import React, { useState, useEffect, useCallback } from 'react'

import { useToast } from '@chakra-ui/react'
import { dayjs } from '@lib/date-utils'
import utc from 'dayjs/plugin/utc'

import Box from '@components/common/Box'
import Text from '@components/common/Text'
import Button from '@components/Button'

import { createNewEvent, meetingTypeStringType } from '@lib/Calendar/UserCreateCalendarHelper'

import {EventType} from '@lib/dataTypes/EventType';
import { ConferenceType } from '@lib/dataTypes/ConferenceType'
import { AttendeeType } from '@lib/dataTypes/AttendeeType'
import TextField from '@components/TextField'
import { Pressable, StyleSheet, useColorScheme, Dimensions, ScrollView } from 'react-native';
// import DatePicker from 'react-native-date-picker';
// import DateTimePicker from 'react-datetime-picker/dist/entry.nostyle'
import { Input } from '@chakra-ui/react'
import { palette } from '@lib/theme/theme'

import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import getEventById from '@lib/apollo/gql/getEventById'
import listCategoriesForEventId from '@lib/apollo/gql/listCategoriesForEventId'
import { CategoryType } from '@lib/dataTypes/CategoryType'
import { ReminderType } from '@lib/dataTypes/ReminderType';
import listRemindersForEventId from '@lib/apollo/gql/listRemindersForEventId'
import getConferenceById from '@lib/apollo/gql/getConferenceById'
import listAttendeesByEventId from '@lib/apollo/gql/listAttendeesByEventId';
import { getEventWithId } from '@lib/calendarLib/calendarDbHelper'
import { useRouter } from 'next/router'

import { useAppContext } from '@lib/user-context'
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

type Props = {
    id: string,
    closeAddFollowUp: () => void,
    client: ApolloClient<NormalizedCacheObject>,
    sub: string,
}

function UserAddFollowUp(props: Props) {
    const [event, setEvent] = useState<EventType>()
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [startDate, setStartDate] = useState<Date>(new Date())
    const [duration, setDuration] = useState<number>(0)
    const [isStartDatePicker, setIsStartDatePicker] = useState(false)
    const [pageOffset, setPageOffset] = useState<number>(0)

    const { height: fullHeight } = Dimensions.get('window')

    const client = props?.client
    const userId = props?.sub
    const eventId = props?.id
    const toast = useToast()
    // const dark = useColorScheme() === 'dark'
 
    const closeAddFollowUp = props?.closeAddFollowUp
    
    useEffect(() => {
        (async () => {
            try {
                if (!eventId) {
                    toast({
                        title: 'Something went wrong',
                        description: 'Please try again',
                        status: 'error',
                        duration: 9000,
                        isClosable: true,
                    })
                    console.log('no eventId inside UserAddFollowUp')
                    return
                }
                const event = await getEventWithId(client, eventId)
                if (event?.id) {
                    setEvent(event)
                    setTitle('Follow up to ' + (event.title || event?.summary))
                    setDescription(event.notes)
                    if (event?.duration) {
                        setDuration(duration)
                    } else {
                        const duration = dayjs(event.endDate).diff(dayjs(event.startDate), 'minute')
                        setDuration(duration)
                    }
                    setStartDate(new Date(event.endDate))
                } else {
                    toast({
                        status: 'error',
                        title: 'Event not found',
                        description: 'Please try again',
                        duration: 9000,
                        isClosable: true,
                    })
                }
                
            } catch (e) {
                console.log(e, 'error getting event inside useEffect of UserAddFollowUp')
                toast({
                    status: 'error',
                    title: 'Error getting event',
                    description: 'Please try again',
                    duration: 9000,
                    isClosable: true,
                })
            }
        })()
    }, [client, duration, eventId])


    const hideStartDatePicker = () => { 
        setIsStartDatePicker(false)
    }
    
    const showStartDatePicker = () => {
        setIsStartDatePicker(true)
    }

    const handleSubmit = async () => {
        try {
             // validate
            if (!startDate || !duration) {
                toast({
                    status: 'error',
                    title: 'All fields required',
                    description: 'Please fill in all fields',
                    duration: 9000,
                    isClosable: true,
                })
                return
            }
            if (!event?.id) {
                toast({
                    status: 'error',
                    title: 'Event not found',
                    description: 'Please try again',
                    duration: 9000,
                    isClosable: true,
                })
                return
            }


            const categoryIds = (await client.query<{ Category: CategoryType[] }>({
                query: listCategoriesForEventId,
                variables: {
                    eventId: event.id,
                },
            })).data?.Category?.map(c => c.id)
            const reminders = (await client.query<{ Reminder: ReminderType[] }>({
                query: listRemindersForEventId,
                variables: {
                    eventId: event.id,
                },
            })).data?.Reminder?.map(r => r.minutes)
            let conference: ConferenceType
            if (event?.conferenceId) {
                conference = (await client.query<{ Conference_by_pk: ConferenceType }>({
                    query: getConferenceById,
                    variables: {
                        id: event.conferenceId,
                        },
                    })).data?.Conference_by_pk

            }

            const attendees: AttendeeType[] = (await client.query<{ Attendee: AttendeeType[] }>({
                                                    query: listAttendeesByEventId,
                                                    variables: {
                                                        eventId: event.id,
                                                    },
                                                })).data?.Attendee

            await createNewEvent(
                dayjs(startDate).toISOString(),
                dayjs(startDate).add(duration, 'minute').toISOString(),
                event?.userId,
                client,
                event?.calendarId,
                categoryIds,
                title,
                event?.allDay,
                undefined,
                undefined,
                undefined,
                reminders,
                description,
                event?.location,
                true,
                event?.isPreEvent,
                event?.isPostEvent,
                event?.modifiable,
                event?.anyoneCanAddSelf,
                event?.guestsCanInviteOthers,
                event?.guestsCanSeeOtherGuests,
                event?.originalAllDay,
                event?.timezone,
                event?.taskId,
                event?.taskType,
                event?.followUpEventId,
                event?.preEventId,
                event?.postEventId,
                event?.forEventId,
                conference?.app === 'zoom',
                conference?.app === 'google',
                conference?.type as meetingTypeStringType,
                (conference?.app === 'zoom') && conference?.entryPoints?.find((e) => e?.entryPointType === 'video')?.password,
                conference?.zoomPrivateMeeting,
                attendees,
                event?.conferenceId,
                event?.maxAttendees,
                event?.sendUpdates,
                event?.status,
                event?.summary || title,
                event?.transparency,
                event?.visibility,
                undefined,
                undefined,
                event?.htmlLink,
                event?.colorId, 
                event?.originalTimezone,
                event?.backgroundColor,
                event?.foregroundColor,
                event?.useDefaultAlarms,
                event?.positiveImpactScore,
                event?.negativeImpactScore,
                event?.positiveImpactDayOfWeek,
                event?.positiveImpactTime,
                event?.negativeImpactDayOfWeek,
                event?.negativeImpactTime,
                event?.preferredDayOfWeek,
                event?.preferredTime,
                event?.isExternalMeeting,
                event?.isExternalMeeting,
                event?.isMeetingModifiable,
                event?.isMeeting,
                event?.dailyTaskList,
                event?.weeklyTaskList,
                event?.isBreak,
                event?.preferredStartTimeRange,
                event?.preferredEndTimeRange,
                event?.copyAvailability,
                event?.copyTimeBlocking,
                event?.copyTimePreference,
                event?.copyReminders,
                event?.copyPriorityLevel,
                event?.copyModifiable,
                event?.copyCategories,
                event?.copyIsBreak,
                event?.timeBlocking,
                event?.userModifiedAvailability,
                event?.userModifiedTimeBlocking,
                event?.userModifiedTimePreference,
                event?.userModifiedReminders,
                event?.userModifiedPriorityLevel,
                event?.userModifiedCategories,
                event?.userModifiedModifiable,
                event?.userModifiedIsBreak,
                event?.hardDeadline,
                event?.softDeadline,
                event?.copyIsMeeting,
                event?.copyIsExternalMeeting,
                event?.userModifiedIsMeeting,
                event?.userModifiedIsExternalMeeting,
                event?.duration,
                event?.copyDuration,
                event?.userModifiedDuration,
                event?.method,
                event?.unlink,
                event?.byWeekDay as Day[],
            )
            toast({
                status: 'success',
                title: 'Follow up event created',
                description: title || event?.summary || '',
                duration: 9000,
                isClosable: true,
            })

            closeAddFollowUp()
        } catch (e) {
            console.log(e, 'error in handleSubmit of UserAddFollowUp')
            toast({
                status: 'error',
                title: 'Error adding follow up',
                description: 'Please try again',
                duration: 9000,
                isClosable: true,
            })
        }
    }

    return (
        <Box flex={1} style={{ width: '100%' }}>
            <Box style={{ flex: 1, width: '100%' }}> 
                <Box flex={1} alignItems="flex-start">
                    <TextField
                        label="Title"
                        placeholder="title"
                        onChange={(e: { target: { value: string } }) => setTitle(e?.target?.value)}
                        value={title || ''}
                       
                    />
                </Box>
                <Box flex={1} alignItems="flex-start">
                    <TextField
                        label="Notes"
                        onChange={(e: { target: { value: string } }) => setDescription(e?.target?.value)}
                        value={description || ''}
                        numberOfLines={3}
                        multiline
                    />
                </Box>
                <Box flex={1} alignItems="flex-start">
             
                    <Text variant="optionHeader">
                        Start
                    </Text>
                
                    <Input
                        placeholder="Select Date and Time"
                        size="md"
                        type="datetime-local"
                        onChange={(e) => {
                            setStartDate(dayjs(e?.target?.value, "YYYY-MM-DDTHH:mm").toDate())
                          
                        }}
                        value={dayjs(startDate).format("YYYY-MM-DDTHH:mm")}
                    />
                </Box>
                <Box flex={1} alignItems="flex-start">
                    <Box flexDirection="row" justifyContent="center" alignItems="center">
                        <Box>
                            
                            <TextField
                                label="Duration (minutes)"
                                type="number"
                                onChange={(e: { target: { value: string } }) => setDuration(parseInt(e?.target?.value.replace(/[^0-9.]/g, ''), 10))}
                                value={`${duration}`}
                                placeholder="1"
                                
                            />
                        </Box>
                        
                    </Box>
                </Box>
                <Box flex={1}  justifyContent="center" alignItems="center">
                    <Box>
                    <Button onClick={handleSubmit}>
                        Submit
                    </Button>
                    <button className="btn btn-link no-underline hover:no-underline" onClick={closeAddFollowUp}>
                        Close
                    </button>
                    
                </Box>
                </Box>
            </Box>
        </Box>
    )
}

export default UserAddFollowUp


