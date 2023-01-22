import React, {
    useEffect,
  useState,
} from 'react'
import { TextField, Hint, Colors } from 'react-native-ui-lib'
import Box from '@components/common/Box'
import Text from '@components/common/Text'

import {EventType} from '@app/dataTypes/EventType'
import Toast from 'react-native-toast-message'
import Button from '@components/Button'
import getEventById from '@app/apollo/gql/getEventById'
import updateEventForPriority from '@app/apollo/gql/updateEventForPriority'
import listAllEvents from '@app/apollo/gql/listAllEvents'
import { ApolloClient, gql, NormalizedCacheObject } from '@apollo/client'
import { Pressable } from 'react-native'

type Props = {
    eventId: string,
    hidePriority: () => void,
    priority: number,
    client: ApolloClient<NormalizedCacheObject>,
}

function UserEditEventPriorityModal(props: Props) {
    const [priority, setPriority] = useState<number>(props.priority)
    const [isMessage1, setIsMessage1] = useState<boolean>(false)

    const client = props?.client
    const eventId = props?.eventId

    
    
    

    useEffect(() => {
        if ((props?.priority > 0) && (priority !== props.priority)) {
            setPriority(props.priority)
        }
    }, [props?.priority])

    const updatePriority = async () => {
        try {
            // validate
            if (priority < 1) {
                Toast.show({
                    type: 'error',
                    position: 'top',
                    text1: 'Priority must be greater than 0',
                    text2: '',
                    visibilityTime: 3000,
                })
                return
            }

            const existingEvent = (await client.query<{ Event_by_pk: EventType }>({
                query: getEventById,
                variables: {
                    id: eventId,
                },
            })).data?.Event_by_pk
            if (existingEvent) {
                await client.mutate<{ update_Event_by_pk: EventType }>({
                    mutation: updateEventForPriority,
                    variables: {
                        id: existingEvent.id,
                        priority,  
                    },
                    update(cache, { data }) {
                       
                
                        cache.modify({
                            fields: {
                                Event(existingEvents = []) {
                                const newEventRef = cache.writeFragment({
                                  data: data?.update_Event_by_pk,
                                  fragment: gql`
                                    fragment NewEvent on Event {
                                      id
                                      startDate
                                      endDate
                                      allDay
                                      recurrence
                                      recurrenceRule
                                      location
                                      notes
                                      attachments
                                      links
                                      timezone
                                      taskId
                                      taskType
                                      priority
                                      followUpEventId
                                      isFollowUp
                                      isPreEvent
                                      isPostEvent
                                      preEventId
                                      postEventId
                                      modifiable
                                      forEventId
                                      conferenceId
                                      maxAttendees
                                      attendeesOmitted
                                      sendUpdates
                                      anyoneCanAddSelf
                                      guestsCanInviteOthers
                                      guestsCanSeeOtherGuests
                                      originalStartDate
                                      originalTimezone
                                      originalAllDay
                                      status
                                      summary
                                      title
                                      transparency
                                      visibility
                                      recurringEventId
                                      iCalUID
                                      htmlLink
                                      colorId
                                      creator
                                      organizer
                                      endTimeUnspecified
                                      extendedProperties
                                      hangoutLink
                                      guestsCanModify
                                      locked
                                      source
                                      eventType
                                      privateCopy
                                      backgroundColor
                                      foregroundColor
                                      useDefaultAlarms
                                      deleted
                                      createdDate
                                      updatedAt
                                      userId
                                      calendarId
                                      positiveImpactScore
                                      negativeImpactScore
                                      positiveImpactDayOfWeek
                                      positiveImpactTime
                                      negativeImpactDayOfWeek
                                      negativeImpactTime
                                      preferredDayOfWeek
                                      preferredTime
                                      isExternalMeeting
                                      isExternalMeetingModifiable
                                      isMeetingModifiable
                                      isMeeting
                                      dailyTaskList
                                      weeklyTaskList
                                      isBreak
                                      preferredStartTimeRange
                                      preferredEndTimeRange
                                      copyAvailability
                                      copyTimeBlocking
                                      copyTimePreference
                                      copyReminders
                                      copyPriorityLevel
                                      copyModifiable
                                      copyCategories
                                      copyIsBreak
                                      userModifiedAvailability
                                      userModifiedTimeBlocking
                                      userModifiedTimePreference
                                      userModifiedReminders
                                      userModifiedPriorityLevel
                                      userModifiedCategories
                                      userModifiedModifiable
                                      userModifiedIsBreak
                                      hardDeadline
                                      softDeadline
                                      copyIsMeeting
                                      copyIsExternalMeeting
                                      userModifiedIsMeeting
                                      userModifiedIsExternalMeeting
                                      duration
                                      copyDuration
                                      userModifiedDuration
                                      method
                                      unlink
                                      copyColor
                                      userModifiedColor
                                      byWeekDay
                                      localSynced
                                      timeBlocking
                                      meetingId
                                      eventId
                                    }
                                  `
                                });
                                const filteredEvents = existingEvents?.filter((e: EventType) => (e.id !== data?.update_Event_by_pk?.id))
                                return [...filteredEvents, newEventRef];
                              }
                            }
                          })
                      }
                })   
                Toast.show({
                    type: 'success',
                    text1: 'Event priority updated successfully',
                    visibilityTime: 3000,
                })
            }
            
            props.hidePriority()
        } catch (e) {
            
        }
    }

    const onChangePriority = (value: string = '1') => {
        const intValue = parseInt(value.replace(/[^0-9.]/g, ''), 10)
        // validate
        if (intValue < 1) {
            if (intValue < 1) {
                setPriority(1)
            }
            return
        }

        if (isNaN(intValue)) {
            setPriority(1)
            return
        }

        setPriority(parseInt(value.replace(/[^0-9.]/g, ''), 10) || 1)
    }


    return (
        <Box justifyContent="center" alignItems="center">
           <Box m={{ phone: 's', tablet: 'm' }}>
                <Box justifyContent="center" alignItems="center" m={{ phone: 's', tablet: 'm' }}>
                <Hint visible={isMessage1} message={'Higher values have higher priority over other events'} color={Colors.purple} onBackgroundPress={() => setIsMessage1(false)}>
                    <Pressable onPress={() => setIsMessage1(!isMessage1)}>  
                        <Text variant="buttonLink">
                        Priority (&gt; 0) of this event for schedule assist (Hint)
                        </Text>
                    </Pressable>
                </Hint>
                </Box>
                <Box justifyContent="center" alignItems="center" m={{ phone: 's', tablet: 'm' }}>
                    <TextField
                        label="Priority"
                        value={`${priority}`}
                        onChangeText={onChangePriority}
                        keyboardType="numeric"
                        style={{ width: '25%' }}
                    />  
                </Box>
                <Box justifyContent="center" alignItems="center" m={{ phone: 's', tablet: 'm' }}>
                    <Button onPress={updatePriority}>
                        Update
                    </Button>
                </Box>
                <Box justifyContent="center" alignItems="center" m={{ phone: 's', tablet: 'm' }}>
                    <Pressable onPress={props.hidePriority}>
                        <Text variant="buttonLink">
                            Cancel
                        </Text>
                    </Pressable>
                </Box>
            </Box> 
        </Box>
    )
}

export default UserEditEventPriorityModal
