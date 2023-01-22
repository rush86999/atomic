import React, { useState, useEffect, useCallback } from 'react'
import { useNavigation, RouteProp, useFocusEffect } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import Toast from 'react-native-toast-message'


import { dayjs, RNLocalize } from '@app/date-utils'
import utc from 'dayjs/plugin/utc'

import Box from '@components/common/Box'
import Text from '@components/common/Text'
import Button from '@components/Button'

import { createNewEvent, meetingTypeStringType } from '@screens/Calendar/UserCreateCalendarHelper'

import {EventType} from '@app/dataTypes/EventType';
import { ConferenceType } from '@app/dataTypes/ConferenceType'
import { AttendeeType } from '@app/dataTypes/AttendeeType'
import { TextArea, TextField } from 'react-native-ui-lib'
import { Pressable, useColorScheme } from 'react-native';
import DatePicker from 'react-native-date-picker';
import { palette } from '@theme/theme'
import { Day } from '@models'
import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import getEventById from '@app/apollo/gql/getEventById'
import listCategoriesForEventId from '@app/apollo/gql/listCategoriesForEventId'
import { CategoryType } from '@app/dataTypes/CategoryType'
import { ReminderType } from '../../dataTypes/ReminderType';
import listRemindersForEventId from '@app/apollo/gql/listRemindersForEventId'
import getConferenceById from '@app/apollo/gql/getConferenceById'
import listAttendeesByEventId from '@app/apollo/gql/listAttendeesByEventId';
import { getEventWithId } from '@app/calendar/calendarDbHelper'


type RootStackNavigationParamList = {
    UserAddFollowUp: undefined,
    UserViewCalendar: undefined,
}

type UserAddFollowUpNavigationProp = StackNavigationProp<
  RootStackNavigationParamList,
  'UserAddFollowUp'
    >

type RootStackEventParamList = {
    UserAddFollowUp: {
        eventId: string,
        sub: string,
    },
}

type UserAddFollowUpRouteProp = RouteProp<
  RootStackEventParamList,
  'UserAddFollowUp'
    >

type Props = {
  sub: string,
  route: UserAddFollowUpRouteProp,
  client: ApolloClient<NormalizedCacheObject>,
}

function UserAddFollowUp(props: Props) {
    const [event, setEvent] = useState<EventType>()
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [startDate, setStartDate] = useState<Date>(new Date())
    const [duration, setDuration] = useState<number>(0)
    const [isStartDatePicker, setIsStartDatePicker] = useState(false)
    
    const userId = props.sub
    const dark = useColorScheme() === 'dark'
    const client = props?.client
    const navigation = useNavigation<UserAddFollowUpNavigationProp>()
    
    useEffect(() => {
        (async () => {
            try {
                if (!props?.route?.params?.eventId) {
                    Toast.show({
                        text1: 'Something went wrong',
                        text2: 'Please try again',
                        type: 'error',
                    })
                    
                    return
                }
                const event = await getEventWithId(client, props.route.params.eventId)
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
                    Toast.show({
                        type: 'error',
                        text1: 'Event not found',
                        text2: 'Please try again',
                    })
                }
                
            } catch (e) {
                
                Toast.show({
                    type: 'error',
                    text1: 'Error getting event',
                    text2: 'Please try again',
                })
            }
        })()
    }, [props?.route?.params?.eventId])

    useFocusEffect(
        useCallback(() => {
            (async () => {
                try {
                    if (!props?.route?.params?.eventId) {
                        Toast.show({
                            text1: 'Something went wrong',
                            text2: 'Please try again',
                            type: 'error',
                        })
                        
                        return
                    }
                    const event = await getEventWithId(client, props.route.params.eventId)
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
                        Toast.show({
                            type: 'error',
                            text1: 'Event not found',
                            text2: 'Please try again',
                        })
                    }
                    
                } catch (e) {
                    
                    Toast.show({
                        type: 'error',
                        text1: 'Error getting event',
                        text2: 'Please try again',
                    })
                }
            })()
        }, [props?.route?.params?.eventId])
    )

    const hideStartDatePicker = () => { 
        setIsStartDatePicker(false)
    }
    
    const showStartDatePicker = () => {
        setIsStartDatePicker(true)
    }

    const handleSubmit = async () => {
        try {
            if (!startDate || !duration) {
                Toast.show({
                    type: 'error',
                    text1: 'Please fill in all fields',
                    text2: '',
                })
                return
            }
            if (!event?.id) {
                Toast.show({
                    type: 'error',
                    text1: 'Event not found',
                    text2: 'Please try again',
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
            Toast.show({
                type: 'success',
                text1: 'Follow up event created',
                text2: title || event?.summary  || '',
            })

            navigation.goBack()
        } catch (e) {
            
            Toast.show({
                type: 'error',
                text1: 'Error adding follow up',
                text2: 'Please try again',
            })
        }
    }

    return (
        <Box flex={1} justifyContent="center" alignItems="center">
            <Box flex={1} justifyContent="flex-end" m={{ phone: 's', tablet: 'm' }} style={{ width: '60%'}}>
                <TextField
                    title="Title"
                    placeholder="title"
                    onChangeText={setTitle}
                    value={title || ''}
                    style={{ width: '60%'}}
                />
            </Box>
            <Box flex={1} m={{ phone: 's', tablet: 'm' }} style={{ width: '60%'}}>
                <TextField
                    placeholder="notes"
                    onChangeText={setDescription}
                    value={description || ''}
                    style={{ width: '60%'}}
                    multiline
                />
            </Box>
            <Box flex={1} m={{ phone: 's', tablet: 'm' }} style={{ width: '60%'}}>
                <Pressable onPress={showStartDatePicker}>
                <Text variant="buttonLink">
                    Start: {dayjs(startDate).format('MMMM D, h:mm A')}
                </Text>
                </Pressable>
                <DatePicker
                    modal
                    open={isStartDatePicker}
                    date={startDate}
                    onConfirm={(date) => {
                        setStartDate(date)
                        hideStartDatePicker()
                    }}
                    onCancel={() => {
                        hideStartDatePicker()
                    }}
                    theme={dark ? 'dark' : 'light'}
                />
            </Box>
            <Box flex={1} m={{ phone: 's', tablet: 'm' }} style={{ width: '60%'}}>
                <Box flexDirection="row" justifyContent="flex-start" alignItems="center">
                    <Box>
                        
                        <TextField
                            title="Duration"
                            type="numeric"
                            onChangeText={(text: string) => setDuration(parseInt(text.replace(/[^0-9.]/g, ''), 10))}
                            value={`${duration}`}
                            placeholder="1"
                            style={{ width: '30%' }}
                            
                        />
                    </Box>
                    <Text m={{ phone: 'm', tablet: 'l' }} variant="body">
                        minutes
                    </Text>
                </Box>
            </Box>
            <Box flex={1} m={{ phone: 's', tablet: 'm' }}  justifyContent="center" alignItems="center" style={{ width: '60%'}}>
                <Box>
                <Button onPress={handleSubmit}>
                    Submit
                </Button>
            </Box>
            </Box>
        </Box>
    )
}

export default UserAddFollowUp


