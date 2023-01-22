import React, {
  useState,
  useEffect,
  useCallback,
} from 'react'
import { Appearance, Modal, Pressable, StyleSheet } from 'react-native'
import {
  ExpandableCalendar,
  TimelineList,
  CalendarProvider,
  TimelineProps,
} from 'react-native-calendars'

import { useNavigation, RouteProp, useFocusEffect } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { FAB, SpeedDial } from 'react-native-elements/src'
import Toast from 'react-native-toast-message'
import { Auth } from 'aws-amplify'
import { dayjs, RNLocalize } from '@app/date-utils'
import _ from 'lodash'
import axios from 'axios'

import Box from '@components/common/Box'
import Text from '@components/common/Text'


import UserEditCategoryEventModal from '@screens/Calendar/UserEditCategoryEventModal'
import UserPreAndPostForEventModal from '@screens/Calendar/UserPreAndPostForEventModal'
import UserEditEventPriorityModal from  '@screens/Calendar/UserEditEventPriorityModal'

import { EventType } from '@app/dataTypes/EventType'
import { setCurrentEventsForCalendar } from '@screens/Calendar/UserCreateCalendarHelper'
import { addToSearchIndexAuthUrl, calendarToQueueAuthUrl, eventToQueueAuthUrl, featuresApplyToEventsAuthUrl } from '@app/lib/constants'
import Button from '@components/Button'

import UserRateEvent from '@screens/Calendar/UserRateEvent'
import FeedbackModal from '@screens/Feedback/FeedbackModal'
import { CategoryEventType } from '@app/dataTypes/Category_EventType'
import Timeline from '@screens/Calendar/Timeline/Timeline'
import { googleCalendarResource, localCalendarResource } from '@app/calendar/constants'
import { checkIfCalendarWebhookExpired, deleteGoogleEvent } from '@app/calendar/googleCalendarHelper'
import { deleteLocalEvent } from '@app/calendar/localCalendarHelper'
import { getCurrentActiveSubscriptions } from '@screens/Progress/Todo/UserTaskHelper2'
import { SafeAreaView } from 'react-native'
import { palette } from '@theme/theme'
import subscribeEventUpdated from '@app/apollo/gql/subscribeEventUpdated'
import { ApolloClient, gql, NormalizedCacheObject } from '@apollo/client'
import listCategoriesForEventId from '@app/apollo/gql/listCategoriesForEventId'
import { CategoryType } from '@app/dataTypes/CategoryType'
import subscribeEventAdded from '@app/apollo/gql/subscribeEventAdded'
import getEventById from '@app/apollo/gql/getEventById'
import updateEventForUnlink from '@app/apollo/gql/updateEventForUnlink'
import updateEventForModifiable from '@app/apollo/gql/updateEventForModifiable'
import getCalendarById from '@app/apollo/gql/getCalendarById'
import deleteEventById from '@app/apollo/gql/deleteEventById'
import { CalendarType } from '@app/dataTypes/CalendarType'
import Spinner from 'react-native-spinkit';
import { getEventWithId } from '@app/calendar/calendarDbHelper'
import { atomicUpsertEventInDb } from './UserCreateCalendarHelper';
import { deleteAttendeesForEvent } from '@screens/Calendar/Attendee/AttendeeHelper';
import { deleteConferencesWithIds } from '@screens/Calendar/Conference/ConferenceHelper';
import { removeRemindersForEvent } from '@screens/Calendar/Reminder/ReminderHelper'
import { esResponseBody } from '@screens/Calendar/types';
import DatePicker from 'react-native-date-picker'
import { ActiveSubscriptionType } from '@dataTypes/active_subscriptionType'
import { deleteMeetingAssistGivenId, getMeetingAssistGivenId } from '@screens/Assist/UserMeetingAssistHelper'
import { deleteZoomConferenceUrl } from '@screens/Assist/constants'


const dark = Appearance.getColorScheme() === 'dark'

const styles = StyleSheet.create({
  safeArea: {
    alignItems: 'flex-end',
  },
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  fab: {
    margin: 16,
    marginTop: 0,
  },
})

const styles2 = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22
  },
  modalView: {
    margin: 20,
    backgroundColor: dark ? palette.black : "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
})

type RootRouteStackParamList = {
  UserViewCalendar: undefined,
}

type RootNavigationStackParamList = {
  InviteContact: undefined,
  UserViewCalendar: undefined,
  UserCreateEvent: {
    hour: number;
    minutes?: number;
    date: string
  },
  UserEditEvent: {
      eventId: string,
  },
  UserTrainEvent: {
      eventId: string,
  },
  UserAddFollowUp: {
      eventId: string,
  },
  UserEventTimePreferences: {
      eventId: string,
  },
  UserCreateMeetingAssist: undefined,
}

type UserTaskNavigationProp = StackNavigationProp<
  RootNavigationStackParamList,
  'UserViewCalendar'
>

type UserTaskRouteProp = RouteProp<
  RootRouteStackParamList,
  'UserViewCalendar'>

type Props = {
  sub: string,
  route: UserTaskRouteProp,
  isPro: boolean,
  isPremium: boolean,
  enableTesting: boolean,
  client: ApolloClient<NormalizedCacheObject>,
}



const getDate = (offset = 0) => dayjs().add(offset, 'd').format('YYYY-MM-DD')

export type marked = {
  [key: string]: { marked: boolean, dotColor?: string }
}

export const HOURS_SIDEBAR_WIDTH = 72

export type TimelineEventProps = {
  id?: string;
  start: string;
  end: string;
  title: string;
  summary?: string;
  color?: string;
}
export type TimelineEventExtendedProps = TimelineEventProps & {
  tags: { id: string, name: string, color: string }[],
  unlink: boolean,
  modifiable: boolean,
  priority: number,
}

export type TagType = {
  id: string,
  name: string,
  color: string,
}

function UserViewCalendar(props: Props) {
  const [currentDate, setCurrentDate] = useState<string>(getDate())
  const [events, setEvents] = useState<TimelineEventExtendedProps[]>([])
  const [eventsByDate, setEventsByDate] = useState<{ [key: string]: TimelineEventExtendedProps[] }>()
  const [marked, setMarked] = useState<marked>({ [`${getDate()}`]: { marked: false } })
  const [isDelete, setIsDelete] = useState<boolean>(false)
  const [toDeleteId, setToDeleteId] = useState<string | undefined>()
  const [isEventTags, setIsEventTags] = useState<boolean>(false)
  const [toTagId, setToTagId] = useState<string | undefined>()
  const [isRateEvent, setIsRateEvent] = useState<boolean>(false)
  const [toRateId, setToRateId] = useState<string | undefined>()
  const [isPrepAndReview, setIsPrepAndRev] = useState<boolean>(false)
  const [toPrepAndRevEvent, setToPrepAndReviewEvent] = useState<EventType>()
  const [isPriority, setIsPriority] = useState<boolean>(false)
  const [toPriorityId, setToPriorityId] = useState<string | undefined>()
  const [oldPriority, setOldPriority] = useState<number>(1)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [startScheduleDate, setStartScheduleDate] = useState<Date>(new Date())
  const [endScheduleDate, setEndScheduleDate] = useState<Date>(dayjs().add(7, 'd').toDate())
  const [isScheduleAssist, setIsScheduleAssist] = useState<boolean>(false)
  const [isFeaturesApply, setIsFeaturesApply] = useState<boolean>(false)
  const [isStartDatePicker, setIsStartDatePicker] = useState<boolean>(false)
  const [isEndDatePicker, setIsEndDatePicker] = useState<boolean>(false)
  const [activeSubscriptions, setActiveSubscriptions] = useState<ActiveSubscriptionType[]>([])
  const [isDialOpen, setIsDialOpen] = useState<boolean>(false)


  const userId = props?.sub

  const client = props?.client
  const navigation = useNavigation<UserTaskNavigationProp>()
  const isPro = props?.isPro
  const isPremium = props?.isPremium
  const enableTesting = props?.enableTesting

  useEffect(() => {
    (async () => {
      try {
        const active_subscriptions = await getCurrentActiveSubscriptions(client, userId)
        setActiveSubscriptions(active_subscriptions)
        
      } catch (e) {
        
      }
    })()
  }, [userId])

  useFocusEffect(
    useCallback(() => {
    (async () => {
      try {
        const active_subscriptions = await getCurrentActiveSubscriptions(client, userId)
        setActiveSubscriptions(active_subscriptions)
        
      } catch (e) {
        
      }
    })()
  }, [userId])
  )

  useEffect(() => {
    if (userId) {
      (async () => checkIfCalendarWebhookExpired(client, userId))()
    }
    
  }, [userId])

  useFocusEffect(
    useCallback(() => {
    if (userId) {
      (async () => checkIfCalendarWebhookExpired(client, userId))()
    }
  }, [userId])
  )

  useEffect(() => {
    (async () => setCurrentEventsForCalendar(
        userId,
        client,
        setEvents,
        setEventsByDate,
        setMarked,
      )
    )()
    }, [])
  
  useFocusEffect(
    useCallback(() => {
      (async () => setCurrentEventsForCalendar(
        userId,
        client,
        setEvents,
        setEventsByDate,
        setMarked,
      )
    )()
    }, [])
  )


  useEffect(() => {
    if (!client) {
      return
    }
    const subscription = client.subscribe<{ Event: EventType[] }>({
      query: subscribeEventUpdated,
      variables: {
        userId,
        currentDate: dayjs().format(),
      }
    })
      .subscribe({
        next: async (event) => {
          
          
          const newEvent = event?.data?.Event?.[0]
          
          
          if (!newEvent?.id) {
            
            return
          }
          const newEvents = _.cloneDeep(events)
          try {
            const tags = (await client.query<{ Category: CategoryType[] }>({
              query: listCategoriesForEventId,
              variables: {
                eventId: newEvent?.id,
              },
            }))?.data?.Category?.map((c) => ({
              id: c.id, 
              name: c.name, 
              color: c.color,
            }))
            
            
            const index = events.findIndex((e) => (e.id === newEvent?.id))
            if (index > -1) {
              newEvents[index] = {
                ...newEvent,
                id: newEvent?.id,
                start: newEvent?.startDate,
                end: newEvent?.endDate,
                title: newEvent?.title || newEvent?.summary,
                summary: newEvent?.notes,
                color: tags?.[0]?.color || newEvent?.backgroundColor,
                tags,
                unlink: newEvent?.unlink,
                priority: newEvent?.priority,
                modifiable: newEvent?.modifiable,
              }
              setEvents(newEvents)
              setEventsByDate(_.groupBy(newEvents, e => dayjs(e?.start).format('YYYY-MM-DD')))
            } 
          } catch (e) {
            
          }
        }
      })
    return () => subscription.unsubscribe()
  }, [client])
  
  useFocusEffect(
    useCallback(() => {
      if (!client) {
        return
      }
      const subscription = client.subscribe<{ Event: EventType[] }>({
        query: subscribeEventUpdated,
        variables: {
          userId,
          currentDate: dayjs().format(),
        }
      })
        .subscribe({
          next: async (event) => {
            
            const newEvent = event?.data?.Event?.[0]
            
            if (!newEvent?.id) {
              
              return
            }
            const newEvents = _.cloneDeep(events)
            try {
              
              const index = newEvents.findIndex((e) => (e.id === newEvent?.id))
              
              if (index > -1) {
                const tags = (await client.query<{ Category: CategoryType[] }>({
                query: listCategoriesForEventId,
                variables: {
                  eventId: newEvent?.id,
                },
                }))?.data?.Category?.map((c) => ({
                  id: c.id, 
                  name: c.name, 
                  color: c.color,
                }))
                
                newEvents[index] = {
                  ...newEvent,
                  id: newEvent?.id,
                  start: newEvent?.startDate,
                  end: newEvent?.endDate,
                  title: newEvent?.title || newEvent?.summary,
                  summary: newEvent?.notes,
                  color: tags?.[0]?.color || newEvent?.backgroundColor,
                  tags,
                  unlink: newEvent?.unlink,
                  priority: newEvent?.priority,
                  modifiable: newEvent?.modifiable,
                }
                setEvents(newEvents)
                setEventsByDate(_.groupBy(newEvents, e => dayjs(e?.start).format('YYYY-MM-DD')))
              }
              
            } catch (e) {
              
            } 
          }
        })
    return () => subscription.unsubscribe()
    }, [client])
  )

  useEffect(() => {
    if (!client) {
      return
    }
    const subscription = client.subscribe<{ Event: EventType[] }>({
      query: subscribeEventAdded,
      variables: {
        userId,
        currentDate: dayjs().format(),
      }
    })
      .subscribe({
        next: async (event) => {
          
          
          const newEvent = event?.data?.Event?.[0]
          if (!newEvent?.id) {
            return
          }
    
          try {
            await setCurrentEventsForCalendar(
              userId,
              client,
              setEvents,
              setEventsByDate,
              setMarked,
            )
          } catch (e) {
            
          }
        }
      })
    return () => subscription.unsubscribe()
  }, [])

  useFocusEffect(
    useCallback(() => {
      if (!client) {
        return
      }
      const subscription = client.subscribe<{ Event: EventType[] }>({
        query: subscribeEventAdded,
        variables: {
          userId,
          currentDate: dayjs().format(),
        }
      })
        .subscribe({
          next: async (event) => {
            
            const newEvent = event?.data?.Event?.[0]
            if (!newEvent?.id) {
              return
            }

      
      
            
            try {
              await setCurrentEventsForCalendar(
                userId,
                client,
                setEvents,
                setEventsByDate,
                setMarked,
              )
            } catch (e) {
              
            }
          }
        })
      return () => subscription.unsubscribe()
    }, [])
  )

  useEffect(() => {
    const subscription = client.subscribe<{ Category_Event: CategoryEventType[] }>({
      query: subscribeEventAdded,
      variables: {
        userId,
        currentDate: dayjs().format(),
      }
    })
      .subscribe({
        next: async(event) => {
          try {
            
            const newCategoryEvent = event?.data?.Category_Event?.[0]
            if (!newCategoryEvent?.id) {
              return
            }
            const newTags = (await client.query<{ Category: CategoryType[] }>({
              query: listCategoriesForEventId,
              variables: {
                eventId: newCategoryEvent.eventId,
              },
            }))?.data?.Category?.map((c) => ({
              id: c.id, 
              name: c.name, 
              color: c.color,
            }))
            const index = _.findIndex(events, e => e.id === newCategoryEvent.eventId)
            if (index >= 0) {
              const newEvents = _.cloneDeep(events)
              newEvents[index] = {
                ...events[index],
                tags: newTags,
                color: newTags?.[0]?.color || events[index].color,
              }
              const newEventsByDate = _.groupBy(newEvents, e => dayjs(e?.start).format('YYYY-MM-DD'))
              setEventsByDate(newEventsByDate)
              setEvents(newEvents)
            }
          } catch(e) {
            
          }
        }
      })
    return () => subscription.unsubscribe()
  }, [])

  useFocusEffect(
    useCallback(() => {
      const subscription = client.subscribe<{ Category_Event: CategoryEventType[] }>({
        query: subscribeEventAdded,
        variables: {
          userId,
          currentDate: dayjs().format(),
        }
      })
        .subscribe({
          next: async(event) => {
            try {
              
              const newCategoryEvent = event?.data?.Category_Event?.[0]
              if (!newCategoryEvent?.id) {
                return
              }
              const newTags = (await client.query<{ Category: CategoryType[] }>({
                query: listCategoriesForEventId,
                variables: {
                  eventId: newCategoryEvent.eventId,
                },
              }))?.data?.Category?.map((c) => ({
                id: c.id, 
                name: c.name, 
                color: c.color,
              }))
              const index = _.findIndex(events, e => e.id === newCategoryEvent.eventId)
              if (index >= 0) {
                const newEvents = _.cloneDeep(events)
                newEvents[index] = {
                  ...events[index],
                  tags: newTags,
                  color: newTags?.[0]?.color || events[index].color,
                }
                const newEventsByDate = _.groupBy(newEvents, e => dayjs(e?.start).format('YYYY-MM-DD'))
                setEventsByDate(newEventsByDate)
                setEvents(newEvents)
              }
            } catch(e) {
              
            }
          }
        })
      return () => subscription.unsubscribe()
    }, [])
  )

  const hideStartDatePicker = () => { 
      setIsStartDatePicker(false)
  }
    
  const showStartDatePicker = () => {
      setIsStartDatePicker(true)
  }

  const hideEndDatePicker = () => { 
      setIsEndDatePicker(false)
  }
    
  const showEndDatePicker = () => {
      setIsEndDatePicker(true)
  }

  const onDateChanged = (date: string) => {
    setCurrentDate(date)
  }


  const changeLink = async (event: TimelineEventExtendedProps) => {
    try {
      const eventId = event?.id
      const existingEvent = (await client.query<{ Event_by_pk: EventType }>({
        query: getEventById,
        variables: {
            id: eventId,
        },
    })).data?.Event_by_pk
      if (existingEvent) {
        await client.mutate({
          mutation: updateEventForUnlink,
          variables: {
              id: existingEvent.id,
              unlink: !existingEvent.unlink,
          },
        })
      }
    } catch (e) {
      
    }
  }

  
  const submitForPlan = async (event: TimelineEventExtendedProps) => {
    try {
      if (enableTesting || isPremium || isPro) {
        const existingEvent = (await client.query<{ Event_by_pk: EventType }>({
          query: getEventById,
          variables: {
              id: event?.id,
          },
        })).data?.Event_by_pk
        if (existingEvent) {
          const filteredExistingEvent: EventType = _.omit(existingEvent, ['__typename']) as EventType
          const token = (await Auth.currentSession()).getIdToken().getJwtToken()
          const url = eventToQueueAuthUrl
          const config = {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
          }
          const eventWithMethod: EventType = { ...filteredExistingEvent, method: 'update' }
          const results = await axios.post(url, eventWithMethod, config)
          if (results.data.message) {
            Toast.show({
              type: 'success',
              position: 'top',
              text1: 'Event added to queue',
            })
          }
        }
      } else {
        Toast.show({
          type: 'info',
          text1: 'Requires Paid Plan',
          text2: 'Please use a paid plan to use this service.'
        })
      }
    } catch (e) {
      
    }
  }

  const changedModifiable = async (event: TimelineEventExtendedProps) => {
    try {
      const existingEvent = (await client.query<{ Event_by_pk: EventType }>({
        query: getEventById,
        variables: {
            id: event?.id,
        },
      })).data?.Event_by_pk
      
      if (existingEvent) {
        const res = await client.mutate({
          mutation: updateEventForModifiable,
          variables: {
              id: existingEvent.id,
              modifiable: !existingEvent.modifiable,
          },
          fetchPolicy: 'no-cache',
          update(cache, { data }) {
            if (data?.update_Event_by_pk?.id) {
              
            }

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
                  const filteredEvents = existingEvents?.filter((e: EventType) => (e?.id !== data?.update_Event_by_pk?.id)) || []
                  
                  if (filteredEvents?.length > 0) {
                    return filteredEvents.concat([newEventRef])
                  }
                  return [newEventRef]
                }
              }
            })
          }
        })
        
      }
    } catch (e) {
      
    }
  }

  const createNewEvent: TimelineProps['onBackgroundLongPressOut'] = (_, timeObject) => {
    navigation.navigate('UserCreateEvent', {
      hour: timeObject.hour,
      minutes: timeObject.minutes,
      date: timeObject.date,
      })
  }

  const editEvent = (event: TimelineEventExtendedProps) => {
    navigation.navigate('UserEditEvent', {
      eventId: event?.id,
    })
  }

  const trainEvent = (event: TimelineEventExtendedProps) => {
    navigation.navigate('UserTrainEvent', {
      eventId: event?.id,
    })
  }

  const addFollowUp = (event: TimelineEventExtendedProps) => {
    navigation.navigate('UserAddFollowUp', {
      eventId: event?.id,
    })
  }

  const deleteEvent = async (id: string) => {
    try {
      hideDelete()
      
      const newEvents = _.filter(events, e => e.id !== id)
      const newEventsByDate = _.groupBy(newEvents, e => dayjs(e?.start).format('YYYY-MM-DD'))

      const oldEvent = events.find(e => (e?.id === id))
      
      setEventsByDate(newEventsByDate)
      setEvents(newEvents)
      if (oldEvent?.id) {
        const oldEventOriginal = await getEventWithId(client, oldEvent?.id)
        const forEvent = events.find(e => (e?.id === oldEventOriginal?.forEventId))

        if (forEvent?.id) {
          
          const forEventOriginal = await getEventWithId(client, forEvent?.id)

          if (forEventOriginal?.preEventId === id) {
            await atomicUpsertEventInDb(
              client,
              forEventOriginal?.id,
              forEventOriginal?.eventId,
              forEventOriginal?.userId,
              forEventOriginal?.startDate,
              forEventOriginal?.endDate,
              forEventOriginal?.createdDate,
              forEventOriginal?.deleted,
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
              dayjs().format(),
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
              null,
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
              { ...forEventOriginal?.timeBlocking, beforeEvent: 0 },

            )
          }

          if (forEventOriginal?.postEventId === id) {
            await atomicUpsertEventInDb(
              client,
              forEventOriginal?.id,
              forEventOriginal?.eventId,
              forEventOriginal?.userId,
              forEventOriginal?.startDate,
              forEventOriginal?.endDate,
              forEventOriginal?.createdDate,
              forEventOriginal?.deleted,
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
              dayjs().format(),
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
              null,
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
              { ...forEventOriginal?.timeBlocking, afterEvent: 0 },
            )
          }
        }
      }

      await deleteAttendeesForEvent(client, id)
      const originalEvent = await getEventWithId(client, id)

      
      
      
      if (originalEvent?.conferenceId) {
        await deleteConferencesWithIds(client, [originalEvent?.conferenceId])
      }

      await removeRemindersForEvent(client, id)

      const token = (await Auth.currentSession()).getIdToken().getJwtToken()
      const config = {
          headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
          },
      }


      const searchData = {
          search: `${originalEvent?.summary}${originalEvent?.notes ? `: ${originalEvent?.notes}` : ''}`,
          method: 'search',
      }
      const results = await axios.post<{ message: string, event: esResponseBody}>(addToSearchIndexAuthUrl, searchData, config)

      
      
      

      if (results?.data?.event?.hits?.hits?.[0]?._id === id) {
          
          const deleteData = {
              eventId: results?.data?.event?.hits?.hits?.[0]?._id,
              method: 'delete'
          }

          const deleteResults = await axios.post<{ message: string, event: object}>(url, deleteData, config)
          
      }
      if (originalEvent?.meetingId) {
        const meetingAssist = await getMeetingAssistGivenId(client, originalEvent.meetingId)
        await deleteMeetingAssistGivenId(client, originalEvent.meetingId)
        if (meetingAssist?.conferenceApp === 'zoom') {
          const res = await axios.post(deleteZoomConferenceUrl, {
            meetingId: originalEvent?.meetingId,
            userId,
          }, config)

          
        }
      }
      await delEventInAppForTask(id, client, userId)
    } catch (e) {
      
    }
  }

  const delEventInAppForTask = async(
      id: string,
      client: ApolloClient<NormalizedCacheObject>,
      userId: string,
  ) => {
      try {
          const eventDoc = (await client.query<{ Event_by_pk: EventType }>({
            query: getEventById,
            variables: {
                id: id,
            },
          })).data?.Event_by_pk
          if (eventDoc?.id) {
              const calendarId = eventDoc?.calendarId
              const calendarDoc = (await client.query<{ Calendar_by_pk: CalendarType }>({
                query: getCalendarById,
                variables: {
                  id: calendarId,
                },
              })).data?.Calendar_by_pk
              if (calendarDoc?.id) {
                  const resource = calendarDoc?.resource

                  if (resource === googleCalendarResource) {
                      await deleteGoogleEvent(client, userId, calendarId, id.split('#')[0])
                      await client.mutate<{ delete_Event_by_pk: EventType }>({
                        mutation: deleteEventById,
                        variables: {
                          id: id,
                        },
                        update(cache, { data }) {
                          const deletedEvent = data?.delete_Event_by_pk
                          const normalizedId = cache.identify({ id: deletedEvent.id, __typename: deletedEvent.__typename })
                          cache.evict({ id: normalizedId })
                          cache.gc()
                        },
                      })
                  } else if (resource === localCalendarResource) {
                      await deleteLocalEvent(id.split('#')[0], true)
                      await client.mutate<{ delete_Event_by_pk: EventType }>({
                        mutation: deleteEventById,
                        variables: {
                          id: id,
                        },
                        update(cache, { data }) {
                          const deletedEvent = data?.delete_Event_by_pk
                          const normalizedId = cache.identify({ id: deletedEvent.id, __typename: deletedEvent.__typename })
                          cache.evict({ id: normalizedId })
                          cache.gc()
                        }
                      })
                  }
              }
          }
      } catch (e) {
          
      }
  }

  const hideDelete = () => {
    setToDeleteId('')
    setIsDelete(false)
  }

  const showDelete = () => {
    setIsDelete(true)
  }

  const enableDelete = (event: TimelineEventExtendedProps) => {
    setToDeleteId(event?.id)
    showDelete()
  }


  const hideTags = () => {
    setToTagId('')
    setIsEventTags(false)
    
  }

  const showTags = () => {
    setIsEventTags(true)
  }

  const enableTag = (event: TimelineEventExtendedProps) => {
    setToTagId(event?.id)
    showTags()
  }


  const hideRating = () => {
     setToRateId('')
     setIsRateEvent(false)
  }

  const showRating = () => {
    setIsRateEvent(true)
  }

  const enableRate = async (event: TimelineEventExtendedProps) => {
    setToRateId(event?.id)
    showRating()
  }


  const hidePrepAndReview = () => {
    setToPrepAndReviewEvent(null)
    setIsPrepAndRev(false)
  }

  const showPrepAndReview = () => {
    setIsPrepAndRev(true)
  }

  const enablePrepAndReview = async (event: TimelineEventExtendedProps) => {
    try {
      showPrepAndReview()
      const eventDoc = (await client.query<{ Event_by_pk: EventType }>({
        query: getEventById,
        variables: {
            id: event?.id,
        },
      })).data?.Event_by_pk
      setToPrepAndReviewEvent(eventDoc)
    } catch (e) {
      
    }
  }

  const hidePriority = () => {
    setToPriorityId('')
    setIsPriority(false)
  }

  const showPriority = () => {
    setIsPriority(true)
  }

  const hideFeaturesApply = () => {
    setIsFeaturesApply(false)
  }

  const showFeaturesApply = () => {
    setStartScheduleDate(new Date())
    setIsFeaturesApply(true)
  }

  const hideScheduleAssist = () => {
    setIsScheduleAssist(false)
  }

  const showScheduleAssist = () => {
    setStartScheduleDate(new Date())
    setIsScheduleAssist(true)
  }

  const enablePriority = async (event: TimelineEventExtendedProps) => {
    try {
      setToPriorityId(event?.id)
      setOldPriority(event?.priority)
      showPriority()
    } catch (e) {
      
    }
  }

  const navigateToTimeRangePreferences = (event: TimelineEventExtendedProps) => {
    navigation.navigate('UserEventTimePreferences', {
      eventId: event?.id,
    })
  }

  const navigateToMeetingAssist =  () => {
    navigation.navigate('UserCreateMeetingAssist')
  }

  const featuresApplyToEvents = async () => {
    try {
      const activeScheduleAssist = (activeSubscriptions?.length > 0) || enableTesting
      if (startScheduleDate && endScheduleDate && activeScheduleAssist) {
        if (startScheduleDate > endScheduleDate) {
          Toast.show({
            type: 'error',
            text1: 'Invalid start date',
            text2: 'Start date must be before end date',
          })
          return
        }
      }

      const duration = dayjs(endScheduleDate).diff(dayjs(startScheduleDate), 'm')
      
      if ((duration < 120) && enableTesting) {
        Toast.show({
          type: 'error',
          text1: 'Invalid duration',
          text2: 'Duration must be at least 120 minutes',
        })
        return
      }

      const durationDays = dayjs(endScheduleDate).diff(dayjs(startScheduleDate), 'd')
      if ((durationDays > 7) && enableTesting) {
        Toast.show({
          type: 'error',
          text1: 'Invalid duration',
          text2: 'Duration must be less than a week',
        })
        return
      }

      if (enableTesting || (activeSubscriptions?.length > 0)) {
        const token = (await Auth.currentSession()).getIdToken().getJwtToken()
        const url = featuresApplyToEventsAuthUrl
        const config = {
          headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
          },
        }

        const results = await axios.post(url, { userId, windowStartDate: dayjs(startScheduleDate).format(), windowEndDate: dayjs(endScheduleDate).format(), timezone: RNLocalize.getTimeZone() }, config)
        if (results.data.message) {
          Toast.show({
              type: 'success',
              position: 'top',
              text2: 'Applying Features to Events',
              text1: 'Applying Features to Events. Check calendar in a bit.',
          })
        }
      }
    } catch (e) {
      
    }

    hideFeaturesApply()
  }

  const scheduleAssist = async () => {
    try {
      const activeScheduleAssist = (activeSubscriptions?.length > 0) || enableTesting
      if (startScheduleDate && endScheduleDate && activeScheduleAssist) {
        if (startScheduleDate > endScheduleDate) {
          Toast.show({
            type: 'error',
            text1: 'Invalid start date',
            text2: 'Start date must be before end date',
          })
          return
        }
      }

      const duration = dayjs(endScheduleDate).diff(dayjs(startScheduleDate), 'm')
      if ((duration < 120) && enableTesting) {
        Toast.show({
          type: 'error',
          text1: 'Invalid duration',
          text2: 'Duration must be at least 120 minutes',
        })
        return
      }

      const durationDays = dayjs(endScheduleDate).diff(dayjs(startScheduleDate), 'd')
      if ((durationDays > 7) && enableTesting) {
        Toast.show({
          type: 'error',
          text1: 'Invalid duration',
          text2: 'Duration must be less than a week',
        })
        return
      }

      if (enableTesting || (activeSubscriptions?.length > 0)) {
        const token = (await Auth.currentSession()).getIdToken().getJwtToken()
        const url = calendarToQueueAuthUrl
        const config = {
          headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
          },
        }

        const results = await axios.post(url, { userId, windowStartDate: dayjs(startScheduleDate).format(), windowEndDate: dayjs(endScheduleDate).format(), timezone: RNLocalize.getTimeZone() }, config)
        if (results.data.message) {
          Toast.show({
              type: 'success',
              position: 'top',
              text2: 'Schedule assist started',
              text1: 'Planning week. Check calendar in a bit.',
          })
        }
      } else {
        Toast.show({
          type: 'info',
          text1: 'Need Paid Plan',
          text2: 'Please get a paid plan to use this service.'
        })
      }
      
    } catch (e) {
      
    }
    hideScheduleAssist()
  }


  const timelineProps: Partial<TimelineProps> = {
    format24h: false,
    onBackgroundLongPressOut: createNewEvent,
    scrollToFirst: true,
    scrollToNow: true,
    overlapEventsSpacing: 8,
    rightEdgeSpacing: 24,
  }

  const darkMode = Appearance.getColorScheme() === 'dark'
  if (!eventsByDate || !events?.[0]?.id) {
    return (
      <Box backgroundColor="primaryCardBackground" flex={1} justifyContent="center" alignItems="center" style={{ width: '100%'}}>
          <Spinner isVisible={true} type="ThreeBounce" size={100} color={darkMode ? palette.textBlack : palette.white} />
      </Box>
      )
  }

  return (
    <Box flex={1} justifyContent="center" alignItems="center">
      <CalendarProvider
        date={currentDate}
        onDateChanged={onDateChanged}
        showTodayButton
        disabledOpacity={0.6}
      >
      <ExpandableCalendar
          firstDay={1}
          leftArrowImageSource={require('@assets/images/previous.png')}
          rightArrowImageSource={require('@assets/images/next.png')}
          markedDates={marked}
      />
      <TimelineList
        events={eventsByDate}
        timelineProps={timelineProps}
        showNowIndicator
        scrollToNow
        scrollToFirst
          renderItem={(timelineProps) => {
          const date = typeof timelineProps.date === 'string' ? timelineProps.date : timelineProps?.date?.[0]
          return (
            <Timeline
              {...timelineProps}
              events={eventsByDate[date]}
              navigateToTimeRangePreferences={navigateToTimeRangePreferences}
              editEvent={editEvent}
              trainEvent={trainEvent}
              enableTag={enableTag}
              enableRate={enableRate}
              enablePrepAndReview={enablePrepAndReview}
              addFollowUp={addFollowUp}
              enablePriority={enablePriority}
              submitForPlan={submitForPlan}
              changedModifiable={changedModifiable}
              changeLink={changeLink}
              enableDelete={enableDelete}
            />
            )
          }
        }
      />
      </CalendarProvider>
      <Modal animationType="slide" transparent={true} visible={isDelete} onDismiss={hideDelete}>
        <Box style={styles2.centeredView}>
          <Box style={styles2.modalView}>
              <Box justifyContent="center" alignItems="center">
                <Text m={{ phone: 'm', tablet: 'l' }} variant="subheaderNormal">
                  Delete this event?
                </Text>
                <Box justifyContent="center" alignItems="center">
                  <Box m={{ phone: 's', tablet: 'm'}}  justifyContent="center" alignItems="center">
                    <Button onPress={() => deleteEvent(toDeleteId)}>
                      Delete
                    </Button>
                  </Box>
                  <Box m={{ phone: 's', tablet: 'm'}}  justifyContent="center" alignItems="center">
                    <Pressable onPress={hideDelete}>
                      <Text variant="buttonLink">Cancel</Text>
                    </Pressable>
                  </Box>
                </Box>
              </Box>
          </Box>
        </Box>
      </Modal>
      <Modal animationType="slide" transparent={true} visible={isEventTags} onDismiss={hideTags}>
        <Box style={styles2.centeredView}>
          <Box style={styles2.modalView}>
            <UserEditCategoryEventModal
              eventId={toTagId}
              hideTags={hideTags}
              sub={userId}
              client={client}
            />
          </Box>
        </Box>
      </Modal>
      <Modal animationType="slide" transparent={true} visible={isRateEvent} onDismiss={hideRating}>
        <Box style={styles2.centeredView}>
          <Box style={styles2.modalView}>
            <UserRateEvent
              eventId={toRateId}
              hideRating={hideRating}
              userId={userId}
              isRateEvent={isRateEvent}
              client={client}
            />
          </Box>
        </Box>
      </Modal>
        <FeedbackModal
          userId={userId}
          client={client}
        />
      <Modal animationType="slide" transparent={true} visible={isPrepAndReview} onDismiss={hidePrepAndReview}>
        <Box style={styles2.centeredView}>
            <Box style={styles2.modalView}>
              <UserPreAndPostForEventModal
                event={toPrepAndRevEvent as EventType}
                hidePrepAndReview={hidePrepAndReview}
                client={client}
              />
            </Box>
        </Box>
      </Modal>
      <Modal animationType="slide" transparent={true} visible={isPriority} onDismiss={hidePriority}>
        <Box style={styles2.centeredView}>
            <Box style={styles2.modalView}>
              <UserEditEventPriorityModal
                eventId={toPriorityId}
                hidePriority={hidePriority}
                priority={oldPriority}
                client={client}
              />
            </Box>
        </Box>
      </Modal>
      <Modal animationType="slide" transparent={true} visible={(isFeaturesApply && ((activeSubscriptions?.length > 0) || enableTesting))} onDismiss={hideFeaturesApply}>
        <Box style={styles2.centeredView}>
          <Box style={styles2.modalView}>
            <Box m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center" width="90%">
              <Pressable onPress={showStartDatePicker}>
                  <Text variant="buttonLink">Start Date: {dayjs(startScheduleDate).format('lll')}</Text>
              </Pressable>
              <DatePicker
                modal
                open={isStartDatePicker}
                date={startScheduleDate}
                onConfirm={(date) => {
                  setStartScheduleDate(date)
                  if (dayjs(date).isAfter(dayjs(endScheduleDate))) {
                    setEndScheduleDate(dayjs(date).add(120, 'm').toDate())
                  }
                  const duration = dayjs(endScheduleDate).diff(dayjs(date), 'm')
                  if (duration < 120) {
                    setEndScheduleDate(dayjs(date).add(120, 'm').toDate())
                  }
                  const durationDays = dayjs(endScheduleDate).diff(dayjs(date), 'd')
                  if (durationDays > 7) {
                    setEndScheduleDate(dayjs(date).add(6, 'd').toDate())
                  }
                  hideStartDatePicker()
                }}
                onCancel={hideStartDatePicker}
                theme={dark ? 'dark' : 'light'}
              />
            </Box>
            <Box m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center" width="90%">
              <Pressable onPress={showEndDatePicker}>
                  <Text variant="buttonLink">End Date: {dayjs(endScheduleDate).format('lll')}</Text>
              </Pressable>
              <DatePicker
                modal
                open={isEndDatePicker}
                date={endScheduleDate}
                onConfirm={(date) => {
                  setEndScheduleDate(date)
                  hideEndDatePicker()
                }}
                onCancel={hideEndDatePicker}
                theme={dark ? 'dark' : 'light'}
              />
            </Box>
            <Box m={{ phone: 'm', tablet: 'l' }} justifyContent="center" alignItems="center">
              <Button onPress={featuresApplyToEvents}>
                  Apply Features
              </Button>
            </Box>
            <Box m={{ phone: 'm', tablet: 'l' }} justifyContent="center" alignItems="center">
              <Pressable onPress={hideFeaturesApply}>
                <Text variant="buttonLink">
                  Close
                </Text>
              </Pressable>
            </Box>
          </Box>
        </Box>
      </Modal>
      <Modal animationType="slide" transparent={true} visible={(isScheduleAssist && ((activeSubscriptions?.length > 0) || enableTesting))} onDismiss={hideScheduleAssist}>
        <Box style={styles2.centeredView}>
          <Box style={styles2.modalView}>
            <Box m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center" width="90%">
              <Pressable onPress={showStartDatePicker}>
                  <Text variant="buttonLink">Start Date: {dayjs(startScheduleDate).format('lll')}</Text>
              </Pressable>
              <DatePicker
                modal
                open={isStartDatePicker}
                date={startScheduleDate}
                onConfirm={(date) => {
                  setStartScheduleDate(date)
                  if (dayjs(date).isAfter(dayjs(endScheduleDate))) {
                    setEndScheduleDate(dayjs(date).add(120, 'm').toDate())
                  }
                  const duration = dayjs(endScheduleDate).diff(dayjs(date), 'm')
                  if (duration < 120) {
                    setEndScheduleDate(dayjs(date).add(120, 'm').toDate())
                  }
                  const durationDays = dayjs(endScheduleDate).diff(dayjs(date), 'd')
                  if (durationDays > 7) {
                    setEndScheduleDate(dayjs(date).add(6, 'd').toDate())
                  }
                  hideStartDatePicker()
                }}
                onCancel={hideStartDatePicker}
                theme={dark ? 'dark' : 'light'}
              />
            </Box>
            <Box m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center" width="90%">
              <Pressable onPress={showEndDatePicker}>
                  <Text variant="buttonLink">End Date: {dayjs(endScheduleDate).format('lll')}</Text>
              </Pressable>
              <DatePicker
                modal
                open={isEndDatePicker}
                date={endScheduleDate}
                onConfirm={(date) => {
                  setEndScheduleDate(date)
                  hideEndDatePicker()
                }}
                onCancel={hideEndDatePicker}
                theme={dark ? 'dark' : 'light'}
              />
            </Box>
            <Box m={{ phone: 'm', tablet: 'l' }} justifyContent="center" alignItems="center">
              <Button onPress={scheduleAssist}>
                  Schedule Assist
              </Button>
            </Box>
            <Box m={{ phone: 'm', tablet: 'l' }} justifyContent="center" alignItems="center">
              <Pressable onPress={hideScheduleAssist}>
                <Text variant="buttonLink">
                  Close
                </Text>
              </Pressable>
            </Box>
          </Box>
        </Box>
      </Modal>

          <SpeedDial
            isOpen={isDialOpen}
            onOpen={() => setIsDialOpen(true)}
            onClose={() => setIsDialOpen(false)}
            icon={{
              name: 'add',
              color: '#fff',
              }}
            openIcon={{
              name: 'close',
              type: 'ionicon',
              color: '#fff',
              }}
            color={palette.purplePrimary}
          >
            <SpeedDial.Action
              icon={{
                name: 'feature-search-outline',
                color: '#fff',
                type: 'material-community',
              }}
              title="Search & Apply Features"
              onPress={showFeaturesApply}
              style={styles.fab}
              color={palette.purplePrimary}
            />
            <SpeedDial.Action
              icon={{
                name: 'meeting-room',
                color: '#fff',
                type: 'material',
              }}
              title="Meeting Assist"
              onPress={navigateToMeetingAssist}
              style={styles.fab}
              color={palette.purplePrimary}
            />
            <SpeedDial.Action
              icon={{
                name: 'schedule',
                color: '#fff',
                type: 'material',
              }}
              title="Schedule Assist"
              onPress={showScheduleAssist}
              style={styles.fab}
              color={palette.purplePrimary}
            />
          </SpeedDial>
    </Box>
  )
}

export default UserViewCalendar

