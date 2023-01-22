import React, {
  useState,
  useEffect,
} from 'react'
import { TextField } from 'react-native-ui-lib'

import { dayjs, RNLocalize } from '@app/date-utils'
import _ from 'lodash'

import Box from '@components/common/Box'
import Text from '@components/common/Text'
import { createNewEvent } from '@screens/Calendar/UserCreateCalendarHelper'
import { updateEvent } from '@screens/Calendar/UserEditCalendarHelper'

import {EventType} from '@app/dataTypes/EventType'
import Toast from 'react-native-toast-message'
import Button from '@components/Button'
import listCategoriesForEventId from '@app/apollo/gql/listCategoriesForEventId'
import { CategoryType } from '@app/dataTypes/CategoryType'
import listRemindersForEventId from '@app/apollo/gql/listRemindersForEventId'
import updateEventForPreEventId from '@app/apollo/gql/updateEventForPreEventId'
import { ReminderType } from '@app/dataTypes/ReminderType'
import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import updateEventForPostEventId from '@app/apollo/gql/updateEventForPostEventId'
import { Pressable } from 'react-native'
import { getEventWithId } from '@app/calendar/calendarDbHelper'

type Props = {
    event: EventType,
    hidePrepAndReview: () => void,
    client: ApolloClient<NormalizedCacheObject>,
}

function UserPreAndPostForEventModal(props: Props) {
    const [beforeEventMinutes, setBeforeEventMinutes] = useState<number>(props?.event?.timeBlocking?.beforeEvent ?? 0)
    const [afterEventMinutes, setAfterEventMinutes] = useState<number>(props?.event?.timeBlocking?.afterEvent ?? 0)

    const event = props?.event
    const client = props?.client
    
    
    
    
    
    
    useEffect(() => {
        if ((props?.event?.timeBlocking?.beforeEvent > 0) && (props?.event?.timeBlocking?.beforeEvent !== beforeEventMinutes)) {
            setBeforeEventMinutes(props?.event?.timeBlocking?.beforeEvent)
        }
    }, [props?.event?.timeBlocking?.beforeEvent])

    useEffect(() => {
        if ((props?.event?.timeBlocking?.afterEvent > 0) && (props?.event?.timeBlocking?.afterEvent !== afterEventMinutes)) {
            setAfterEventMinutes(props?.event?.timeBlocking?.afterEvent)
        }
    }, [props?.event?.timeBlocking?.afterEvent])

    const createEvent = async (minutes: number, eventType: 'pre' | 'post') => {
        try {
            // validate
            if (minutes === 0) {
                Toast.show({
                    type: 'error',
                    position: 'top',
                    text1: 'Please enter a valid time',
                    text2: '',
                })
                return
            }

            if (event?.allDay) {
                Toast.show({
                    text1: 'All day event',
                    text2: 'All day events cannot have prep or debrief events',
                    type: 'success',
                    position: 'top',
                })
                return
            }

            const categoryIds = (await client.query<{ Category: CategoryType[] }>({
                query: listCategoriesForEventId,
                variables: {
                eventId: event?.id,
                },
            }))?.data?.Category?.map(c => c?.id)
            
            const reminders = (await client.query<{ Reminder: ReminderType[] }>({
                query: listRemindersForEventId,
                variables: {
                    eventId: event.id,
                },
            })).data?.Reminder?.map(r => r.minutes)

            if (eventType === 'pre') {
                const id = await createNewEvent(
                    dayjs(event.startDate).subtract(minutes, 'minute').format(),
                    dayjs(event.startDate).format(),
                    event?.userId,
                    client,
                    event?.calendarId,
                    categoryIds,
                    'Buffer time',
                    false,
                    undefined,
                    undefined,
                    undefined,
                    reminders,
                    'Buffer time',
                    event?.location,
                    false,
                    true,
                    false,
                    true,
                    false,
                    false,
                    false,
                    false,
                    event?.timezone,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    event?.id,
                    false,
                    false,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    'opaque',
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    event?.colorId,
                    event?.originalTimezone,
                    event?.backgroundColor,
                    event?.foregroundColor,
                    event?.useDefaultAlarms,
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
                    true,
                    true,
                    true,
                    true,
                    true,
                    true,
                    true,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    true,
                    true,
                    minutes,
                    undefined,
                    true,
                    'create',
                    undefined,
                )

                

                if (id) {
                    // setPreEventId(eventId)
                    return updateForEvent(id, eventType, minutes)
                } else {
                    Toast.show({
                        text1: 'Error creating prep event',
                        text2: '',
                        type: 'error',
                        position: 'top',
                    })
                }
                
            } else if (eventType == 'post') {
                const id = await createNewEvent(
                    dayjs(event.endDate).format(),
                    dayjs(event.endDate).add(minutes, 'minute').format(),
                    event?.userId,
                    client,
                    event?.calendarId,
                    categoryIds,
                    'Buffer time',
                    false,
                    undefined,
                    undefined,
                    undefined,
                    reminders,
                    'Buffer time',
                    event?.location,
                    false,
                    false,
                    true,
                    true,
                    false,
                    false,
                    false,
                    false,
                    event?.timezone,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    event?.id,
                    false,
                    false,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    'Buffer time',
                    'opaque',
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    event?.colorId,
                    event?.originalTimezone,
                    event?.backgroundColor,
                    event?.foregroundColor,
                    event?.useDefaultAlarms,
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
                    true,
                    true,
                    true,
                    true,
                    true,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    true,
                    minutes,
                    undefined,
                    true,
                    'create',
                    undefined,
                )

                
                if (id) {
                    // setPostEventId(eventId)
                    return updateForEvent(id, eventType, undefined, minutes)
                } else {
                    Toast.show({
                        text1: 'Error creating debrief event',
                        text2: '',
                        type: 'error',
                        position: 'top',
                    })
                }
            }

        } catch (e) {
            
        }
        
    }

    const updateForEvent = async (id: string, eventType: 'pre' | 'post', beforeMinutes?: number, afterMinutes?: number) => {
        
        try {
            if (eventType === 'pre') {

                await client.mutate({
                    mutation: updateEventForPreEventId,
                    variables: {
                        id: event?.id,
                        preEventId: id,
                        timeBlocking: {
                            beforeEvent: beforeMinutes || beforeEventMinutes,
                            afterEvent: afterMinutes || afterEventMinutes || event?.timeBlocking?.afterEvent || 0,
                        }
                    },
                })

            } else if (eventType === 'post') {

                await client.mutate({
                    mutation: updateEventForPostEventId,
                    variables: {
                        id: event?.id,
                        postEventId: id,
                        timeBlocking: {
                            beforeEvent: beforeMinutes || beforeEventMinutes || event?.timeBlocking?.beforeEvent || 0,
                            afterEvent: afterMinutes || afterEventMinutes,
                        }
                    },
                })
            }
        } catch (e) {
            
                'Error updating existing event for prep/debrief')
            Toast.show({
                text1: 'Error updating event',
                text2: '',
                type: 'error',
                position: 'top',
            })
        }
    }

    const updateLocalEvent = async (id: string, minutes: number, eventType: 'pre' | 'post') => {
        try {
            // validate
        if (minutes === 0) {
            Toast.show({
                type: 'error',
                position: 'top',
                text1: 'Please enter a valid time',
                text2: '',
            })
            return
        }

        if (event?.allDay) {
            Toast.show({
                text1: 'All day event',
                text2: 'All day events cannot have prep or debrief events',
                type: 'success',
                position: 'top',
            })
            return
        }

        const categoryIds = (await client.query<{ Category: CategoryType[] }>({
            query: listCategoriesForEventId,
            variables: {
              eventId: event?.id,
            },
        }))?.data?.Category?.map(c => c?.id)
        
        const reminders = (await client.query<{ Reminder: ReminderType[] }>({
            query: listRemindersForEventId,
            variables: {
                eventId: event.id,
            },
        })).data?.Reminder?.map(r => r.minutes)

        if (eventType === 'pre') {

            await updateEvent(
                id,
                dayjs(event.startDate).subtract(minutes, 'minute').format(),
                dayjs(event.startDate).format(),
                event?.userId,
                client,
                event?.calendarId,
                categoryIds,
                'Buffer time',
                false,
                undefined,
                undefined,
                undefined,
                reminders,
                'Buffer time',
                event?.location,
                false,
                true,
                false,
                true,
                false,
                false,
                false,
                false,
                event?.timezone,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                event?.id,
                false,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                'Buffer time',
                'opaque',
                undefined,
                undefined,
                undefined,
                undefined,
                event?.colorId,
                event?.originalTimezone,
                event?.backgroundColor,
                event?.foregroundColor,
                event?.useDefaultAlarms,
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
                true,
                true,
                true,
                true,
                true,
                true,
                true,
                undefined,
                undefined,
                undefined,
                undefined,
                true,
                true,
                minutes,
                undefined,
                true,
                'update',
                true,
            )
            return updateForEvent(id, eventType, minutes)     
        } else if (eventType === 'post') {

            await updateEvent(
                id,
                dayjs(event.endDate).format(),
                dayjs(event.endDate).add(minutes, 'minute').format(),
                event?.userId,
                client,
                event?.calendarId,
                categoryIds,
                'Buffer time',
                false,
                undefined,
                undefined,
                undefined,
                reminders,
                'Buffer time',
                event?.location,
                false,
                false,
                true,
                true,
                false,
                false,
                false,
                false,
                event?.timezone,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                event?.id,
                false,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                'Buffer time',
                'opaque',
                undefined,
                undefined,
                undefined,
                undefined,
                event?.colorId,
                event?.originalTimezone,
                event?.backgroundColor,
                event?.foregroundColor,
                event?.useDefaultAlarms,
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
                undefined,
                undefined,
                true,
                true,
                true,
                true,
                true,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                true,
                'update',
                true,
            )

            return updateForEvent(id, eventType, undefined, minutes)
        }
            
        } catch (e) {
            
                'Error updating existing event for prep/debrief')
            Toast.show({
                text1: 'Error updating event',
                text2: '',
                type: 'error',
                position: 'top',
            })
        }
    }

    const onBeforeEventMinutesChange = (value: string) => {
        setBeforeEventMinutes(parseInt(value.replace(/[^0-9.]/g, ''), 10) || 0)
    }

    const onAfterEventMinutesChange = (value: string) => {
        setAfterEventMinutes(parseInt(value.replace(/[^0-9.]/g, ''), 10) || 0)
    }
    
    const onSubmit = async () => {
        try {
            const promises = []
            if (event?.preEventId 
                && (beforeEventMinutes > 0)
                && (event?.timeBlocking?.beforeEvent !== beforeEventMinutes)
            ) {
                
                promises.push(updateLocalEvent(event?.preEventId, beforeEventMinutes, 'pre'))
            }
            
            if (
                event?.postEventId 
                && (afterEventMinutes > 0)
                && (event?.timeBlocking?.afterEvent !== afterEventMinutes)
                ) {
                
                promises.push(updateLocalEvent(event?.postEventId, afterEventMinutes, 'post'))
            }
            
            if (!event?.preEventId && (beforeEventMinutes > 0)) {
                
                promises.push(createEvent(beforeEventMinutes, 'pre'))
            }
            
            if (!event?.postEventId && (afterEventMinutes > 0)) {
                
                promises.push(createEvent(afterEventMinutes, 'post'))
            }

            await Promise.all(promises)

            props.hidePrepAndReview()
        } catch (e) {
            
            Toast.show({
                text1: 'Error updating event',
                text2: '',
                type: 'error',
                position: 'top',
            })
        }
    }

    return (
        <Box justifyContent="center" alignItems="center" style={{ width: '100%' }}>
            <Box mt={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center"  style={{ width: '100%' }}>
                <Box style={{ width: '100%' }} justifyContent="center" alignItems="center">
                    <Box style={{ width: '100%' }} flexDirection="row" justifyContent="space-between" alignItems="center" mt={{ phone: 's', tablet: 'm' }}>
                        <Text variant="optionHeader">
                        Prep time before event:
                        </Text>
                        <Box>
                            <Box p={{ phone: 'm', tablet: 'm'}} />
                            <TextField
                                label="Minutes"
                                value={`${beforeEventMinutes}`}
                                onChangeText={onBeforeEventMinutesChange}
                                keyboardType="numeric"
                                style={{ width: '15%' }}
                            />
                        </Box>
                    </Box>
                </Box>
                <Box style={{ width: '100%' }} justifyContent="center" alignItems="center">
                    <Box style={{ width: '100%' }} flexDirection="row" justifyContent="space-between" alignItems="center" mt={{ phone: 's', tablet: 'm' }}>
                        <Text variant="optionHeader">
                            Review time after event:
                        </Text>
                        <Box>
                            <Box p={{ phone: 'm', tablet: 'm'}} />
                            <TextField
                                label="Minutes"
                                value={`${afterEventMinutes}`}
                                onChangeText={onAfterEventMinutesChange}
                                keyboardType="numeric"
                                style={{width: '15%' }}
                            />
                        </Box>
                    </Box>
                </Box>
            </Box>
            <Button onPress={onSubmit}>
                Submit
            </Button>
            <Pressable onPress={props.hidePrepAndReview}>
                <Text m={{ phone: 'm', tablet: 'l' }} variant="buttonLink">
                    Cancel
                </Text>
            </Pressable>
        </Box> 
    )
}

export default UserPreAndPostForEventModal

