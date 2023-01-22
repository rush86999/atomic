import React, { useState, useEffect, useCallback } from 'react'
import { Wizard } from 'react-native-ui-lib'
import { useNavigation, RouteProp, useFocusEffect } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'

import Toast from 'react-native-toast-message'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import Button from '@components/Button'
import RegularCard from '@components/RegularCard'

import { dayjs, RNLocalize } from '@app/date-utils'

//  import { NewEventTime } from '@screens/Calendar/UserCalendarHelper'

import {
  CategoryType
} from '@app/dataTypes/CategoryType'
import {
  listCategoriesForEvent,
  listUserCategories,
} from '@screens/Category/CategoryHelper'
import { RecurrenceFrequency } from 'react-native-calendar-events'
import {
  zoomAvailable
} from '@app/zoom/zoomMeetingHelper'
import {
  googleMeetAvailable,
} from '@app/calendar/googleCalendarHelper'
import { Person } from '@screens/Calendar/types'
import { visibility } from '@app/calendar/types'

import EditEventAttendees from '@screens/Calendar/EditEventWizard/EditEventAttendees'
import EditEventBaseStep from '@screens/Calendar/EditEventWizard/EditEventBaseStep'
import EditEventBaseStep2 from '@screens/Calendar/EditEventWizard/EditEventBaseStep2'
import EditEventBaseStep3 from '@screens/Calendar/EditEventWizard/EditEventBaseStep3'
import EditEventRecurStep from '@screens/Calendar/EditEventWizard/EditEventRecurStepAlt'
import EditEventVirtualMeet from '@screens/Calendar/EditEventWizard/EditEventVirtualMeet'
import EditEventVisibilityAndAlarmsStep from '@screens/Calendar/EditEventWizard/EditEventVisibilityAndAlarmsStep'
import EditEventUpdateCategories from '@screens/Calendar/EditEventWizard/EditEventUpdateCategories'


import { updateEvent } from '@screens/Calendar/UserEditCalendarHelper'
import { CalendarType } from '@app/dataTypes/CalendarType'
import { EventType } from '@app/dataTypes/EventType'
import { listRemindersForEvent } from '@screens/Calendar/Reminder/ReminderHelper'
import { listAttendeesForEvent } from '@screens/Calendar/Attendee/AttendeeHelper'
import { transparency } from '../../calendar/types';
import { Day } from '@models'
import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import getGlobalPrimaryCalendar from '@app/apollo/gql/getGlobalPrimaryCalendar'
import getEventById from '@app/apollo/gql/getEventById'
import getConferenceById from '@app/apollo/gql/getConferenceById'
import { ConferenceType } from '@app/dataTypes/ConferenceType'
import getCalendarById from '@app/apollo/gql/getCalendarById'


// dayjs.extend(utc)

type RootStackNavigationParamList = {
 UserEditEvent: undefined,
 UserViewCalendar: undefined,
}

type UserEditEventNavigationProp = StackNavigationProp<
  RootStackNavigationParamList,
  'UserEditEvent'
>

type RootStackEventParamList = {
    UserEditEvent: {
        eventId: string,
    },
}

type UserEditEventRouteProp = RouteProp<
  RootStackEventParamList,
  'UserEditEvent'
>

type Props = {
  sub: string,
  route: UserEditEventRouteProp,
  client: ApolloClient<NormalizedCacheObject>,
}

function UserEditEvent(props: Props) {
  const [categories, setCategories] = useState<CategoryType[]>([])
  const [selectedCategories, setSelectedCategories] = useState<CategoryType[]>([])
  const [title, setTitle] = useState<string>()
  const [allDay, setAllDay] = useState<boolean>(false)
  const [isRecurring, setIsRecurring] = useState<boolean>(false)
  const [recurringEndDate, setRecurringEndDate] = useState<Date>(new Date())
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('daily')
  const [interval, setInterval] = useState<string>('1')
  const [alarms, setAlarms] = useState<number[]>([]) // will be number for createEvent function
  const [notes, setNotes] = useState<string>()
  const [location, setLocation] = useState<string>()
  const [isZoomAvailable, setIsZoomAvailable] = useState<boolean>(false)
  const [isGoogleMeetAvailable, setIsGoogleMeetAvailable] = useState<boolean>(false)
  const [zoomMeet, setZoomMeet] = useState<boolean>()
  const [googleMeet, setGoogleMeet] = useState<boolean>()
  const [zoomPrivateMeeting, setZoomPrivateMeeting] = useState<boolean>(false)
  const [attendees, setAttendees] = useState<Person[]>([])
  const [visibility, setVisibility] = useState<visibility>('default')
  const [isAttendees, setIsAttendees] = useState<boolean>(false)
  const [activeIndex, setActiveIndex] = useState<number>(0)
  const [completedStep, setCompletedStep] = useState<number | undefined>()
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>()
  const [calendar, setCalendar] = useState<CalendarType>()
  const [isBreak, setIsBreak] = useState<boolean>(false)
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [endDate, setEndDate] = useState<Date>(new Date())
  const [transparency, setTransparency] = useState<transparency>('opaque')
  const [isExternalMeeting, setIsExternalMeeting] = useState<boolean>(false)
  const [isMeeting, setIsMeeting] = useState<boolean>(false)
  const [modifiable, setModifiable] = useState<boolean>(true)
  const [byWeekDay, setByWeekDay] = useState<Day[]>([])
  const [oldEvent, setOldEvent] = useState<EventType>()

  const userId = props?.sub
  const client = props?.client
  const navigation = useNavigation<UserEditEventNavigationProp>()
  const id = props?.route?.params?.eventId

  
  // get categories
  useEffect(() => {
    (async() => {
      try {
        if (!userId || !client) {
          
          return
        }
        const results = await listUserCategories(client, userId)

        if (!results?.[0]?.id) {
          
          return
        }
        setCategories(results)
      } catch(e) {
        
      }
    })()
  }, [client, userId])

  // get event selected categories
  useEffect(() => {
    (async () => {
      try {
        if (!id || !client) {
          
          return
        }
        const results = await listCategoriesForEvent(client, id)
        
        if (!results?.[0]?.id) {
          
          return

        }
        setSelectedCategories(results)
      } catch (e) {
        

      }
    })()
  }, [client, id])

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          if (!id || !client) {
            
            return
          }
          const results = await listCategoriesForEvent(client, id)
          
          if (!results?.[0]?.id) {
            
            return

          }
          setSelectedCategories(results)
        } catch (e) {
          

        }
      })()
    }, [client, id])
  )

   // check if zoom available
  useEffect(() => {
    (async () => {
      if (!userId || !client) {
        
        return
      }
      const isAvailable = await zoomAvailable(client, userId)
      if (isAvailable) {
        setIsZoomAvailable(true)
      }
    })()
  }, [client, userId])

   // check if google available
  useEffect(() => {
    (async () => {
      if (!userId || !client) {
        
        return
      }
      const isAvailable = await googleMeetAvailable(client, userId)
      if (isAvailable) {
        setIsGoogleMeetAvailable(isAvailable)
      }
    })()
  }, [client, userId])

  // get event Calendar else global primary calendar
  useEffect(() => {
    (async () => {  
      if (!userId || !client) {
        return
      }
      if (!id) {
        
      }

      const event = (await client.query<{ Event_by_pk: EventType }>({
        query: getEventById,
        variables: {
            id: id,
        },
      })).data?.Event_by_pk
      if (!event?.id) {

        
        return
      }
      const calendarDoc = (await client.query<{ Calendar_by_pk: CalendarType }>({
        query: getCalendarById,
        variables: {
          id: event?.calendarId,
        },
      })).data?.Calendar_by_pk

      if (!calendarDoc?.id) {
        const calendar = (await client.query<{ Calendar: CalendarType[] }>({
          query: getGlobalPrimaryCalendar, 
          variables: {
            userId,
          },
        })).data?.Calendar?.[0]
        if (!calendar?.id) {
          
          return
        }
        setSelectedCalendarId(calendar?.id)
        setCalendar(calendar)
      } else {
        setSelectedCalendarId(calendarDoc?.id)
        setCalendar(calendarDoc)
      }
    })()
  }, [client, userId])

  useFocusEffect(
    useCallback(() => {
      (async () => {  
        if (!userId || !client) {
          return
        }
        if (!id) {
          
        }

        const event = (await client.query<{ Event_by_pk: EventType }>({
          query: getEventById,
          variables: {
              id: id,
          },
        })).data?.Event_by_pk
        if (!event?.id) {

          
          return
        }
        const calendarDoc = (await client.query<{ Calendar_by_pk: CalendarType }>({
          query: getCalendarById,
          variables: {
            id: event?.calendarId,
          },
        })).data?.Calendar_by_pk

        if (!calendarDoc?.id) {
          const calendar = (await client.query<{ Calendar: CalendarType[] }>({
            query: getGlobalPrimaryCalendar, 
            variables: {
              userId,
            },
          })).data?.Calendar?.[0]
          if (!calendar?.id) {
            
            return
          }
          setSelectedCalendarId(calendar?.id)
          setCalendar(calendar)
        } else {
          setSelectedCalendarId(calendarDoc?.id)
          setCalendar(calendarDoc)
        }
      })()
    }, [client, userId])
  )

  // get alarms
  useEffect(() => {
    (async () => {
      if (!id || !client) {
        return
      }
      const results = await listRemindersForEvent(client, id)
      if (!results?.[0]?.id) {
        
        return
      }
      setAlarms(results?.map(r => r.minutes))
    })()
  }, [client, id])

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          if (!id || !client) {
            return
          }
          const results = await listRemindersForEvent(client, id)
          if (!results?.[0]?.id) {
            
            return
          }
          setAlarms(results?.map(r => r.minutes))
        } catch (e) {
          
        } 
      })()
    }, [client, id])
  )
  
  // get event
  useEffect(() => {
    (async () => {
      
      if (!id || !client) {
        
        return
      }
      const event = (await client.query<{ Event_by_pk: EventType }>({
        query: getEventById,
        variables: {
            id: id,
        },
      })).data?.Event_by_pk
      if (!event?.id) {

        
        return
      }
      
      setTitle(event?.title || event?.summary)
      setAllDay(event?.allDay)
      setIsRecurring(event?.recurrence?.length > 0)
      if (event?.recurrenceRule?.endDate) {
        setRecurringEndDate(new Date(event?.recurrenceRule?.endDate))
        setFrequency(event?.recurrenceRule?.frequency as RecurrenceFrequency)
        setInterval(`${event?.recurrenceRule?.interval}`)
      }
      setStartDate(dayjs.tz(event?.startDate, event?.timezone || RNLocalize.getTimeZone()).toDate())
      setEndDate(dayjs.tz(event?.endDate, event?.timezone || RNLocalize.getTimeZone()).toDate())
      setNotes(event?.notes)
      setLocation(event?.location?.title)
      setVisibility(event?.visibility)
      setIsBreak(event?.isBreak)
      setTransparency(event?.transparency)
      setIsExternalMeeting(event?.isExternalMeeting)
      setIsMeeting(event?.isMeeting)
      setModifiable(event?.modifiable)
      setByWeekDay(event?.byWeekDay as Day[])
      setOldEvent(event)
    })()
  }, [client, id])

  useFocusEffect(
    useCallback(() => {
       (async () => {
         try {
          
          if (!id || !client) {
            
            return
          }
          const event = (await client.query<{ Event_by_pk: EventType }>({
            query: getEventById,
            variables: {
                id: id,
            },
          }))?.data?.Event_by_pk
          if (!event?.id) {

            
            return
          }
          
          setTitle(event?.title || event?.summary)
          setAllDay(event?.allDay)
          setIsRecurring(event?.recurrence?.length > 0)
          if (event?.recurrenceRule?.endDate) {
            setRecurringEndDate(new Date(event?.recurrenceRule?.endDate))
            setFrequency(event?.recurrenceRule?.frequency as RecurrenceFrequency)
            setInterval(`${event?.recurrenceRule?.interval}`)
          }
          setStartDate(dayjs.tz(event?.startDate, event?.timezone || RNLocalize.getTimeZone()).toDate())
          setEndDate(dayjs.tz(event?.endDate, event?.timezone || RNLocalize.getTimeZone()).toDate())
          setNotes(event?.notes)
          setLocation(event?.location?.title)
          setVisibility(event?.visibility)
          setIsBreak(event?.isBreak)
          setTransparency(event?.transparency)
          setIsExternalMeeting(event?.isExternalMeeting)
          setIsMeeting(event?.isMeeting)
          setModifiable(event?.modifiable)
          setByWeekDay(event?.byWeekDay as Day[])
          setOldEvent(event)
         } catch (e) {
           
         }
    })()
  }, [client, id]
    )
  )

  // get conference in db
  useEffect(() => {
    (async () => {
      if (!id || !client) {
        return
      }
      const oldEvent = (await client.query<{ Event_by_pk: EventType }>({
        query: getEventById,
        variables: {
            id: id,
        },
      })).data?.Event_by_pk
      if (!oldEvent?.id) {
        
        return
      }

      if (!oldEvent?.conferenceId) {
        
        return
      }
      const conference = (await client.query<{ Conference_by_pk: ConferenceType }>({
        query: getConferenceById,
        variables: {
            id: oldEvent?.conferenceId,
            },
        })).data?.Conference_by_pk
      if (!conference?.id) {
        
        return
      }
      if (conference?.app === 'zoom') {
        setZoomMeet(true)
      }
      if (conference?.app === 'google') {
        setGoogleMeet(true)
      }

      if (conference?.zoomPrivateMeeting === true) {
        setZoomPrivateMeeting(true)
      }
    })()
  }, [client, id])

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          if (!id || !client) {
            return
          }
          const oldEvent = (await client.query<{ Event_by_pk: EventType }>({
            query: getEventById,
            variables: {
                id: id,
            },
          })).data?.Event_by_pk
          if (!oldEvent?.id) {
            
            return
          }
          if (!oldEvent?.conferenceId) {
            
            return
          }
          const conference = (await client.query<{ Conference_by_pk: ConferenceType }>({
            query: getConferenceById,
            variables: {
                id: oldEvent?.conferenceId,
                },
            })).data?.Conference_by_pk
          if (!conference?.id) {
            
            return
          }
          if (conference?.app === 'zoom') {
            setZoomMeet(true)
          }
          if (conference?.app === 'google') {
            setGoogleMeet(true)
          }
    
          if (conference?.zoomPrivateMeeting === true) {
            setZoomPrivateMeeting(true)
          }
        } catch (e) {
          
        }
      })()
    }, [client, id])
  )

  // get event attendees
  useEffect(() => {
    (async () => {
      if (!id || !client) {
        return
      }
      const results = await listAttendeesForEvent(client, id)
      if (!results?.[0]?.id) {
        
        return
      }
      setAttendees(results.map(r => ({ id: r.id, name: r.name, emails: r.emails, phoneNumbers: r.phoneNumbers, imAddresses: r.imAddresses, additionalGuests: r.additionalGuests, optional: r.optional, resource: r.resource } as Person)))
      setIsAttendees(true)
    })()
  }, [client, id])

  // get event attendees
  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          if (!id || !client) {
            return
          }
          const results = await listAttendeesForEvent(client, id)
          if (!results?.[0]?.id) {
            
            return
          }
          setAttendees(results.map(r => ({ id: r.id, name: r.name, emails: r.emails, phoneNumbers: r.phoneNumbers, imAddresses: r.imAddresses, additionalGuests: r.additionalGuests, optional: r.optional, resource: r.resource } as Person)))
          setIsAttendees(true)
        } catch (e) {
          
        }
      })()
    }, [client, id])
  )


  const updateEventForUser = async () => {
    try {
      // validate before update
      if (!userId || !client) {
        
        return
      }

      if (!id) {
        
        return
      }

      if (!selectedCalendarId) {
        
        return
      }



      
      await updateEvent(
        id,
        dayjs(startDate).format(),
        dayjs(endDate).format(),
        userId,
        client,
        selectedCalendarId,
        selectedCategories?.map(category => category.id),
        title,
        allDay,
        isRecurring ? dayjs(recurringEndDate).format() : null,
        isRecurring ? frequency : null,
        isRecurring ? parseInt (interval, 10) : null,
        alarms,
        notes,
        location ? { title: location } : undefined,
        false,
        false,
        false,
        modifiable,
        undefined,
        undefined,
        undefined,
        false,
        RNLocalize.getTimeZone(),
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        zoomMeet,
        googleMeet,
        'scheduled',
        undefined,
        zoomPrivateMeeting,
        attendees,
        undefined,
        undefined,
        attendees?.[0]?.emails?.[0]?.value ? 'all' : undefined,
        undefined,
        title,
        transparency,
        visibility,
        undefined,
        undefined,
        undefined,
        calendar?.colorId,
        RNLocalize.getTimeZone(),
        selectedCategories?.[0]?.color || oldEvent?.backgroundColor || calendar?.backgroundColor,
        oldEvent?.foregroundColor ||  calendar?.foregroundColor,
        alarms?.length > 0 ? false : true,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        isExternalMeeting,
        undefined,
        undefined,
        isMeeting,
        undefined,
        undefined,
        isBreak,
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
        alarms?.length > 0,
        undefined,
        true,
        true,
        true,
        undefined,
        undefined,
        undefined,
        undefined,
        true,
        true,
        dayjs.duration(dayjs(startDate).diff(dayjs(endDate))).asMinutes(),
        undefined,
        undefined,
        'update',
        undefined,
        byWeekDay,
      )

      Toast.show({
        type: 'success',
        position: 'top',
        text1: 'Event Edited',
        text2: 'Event edited successfully',
        visibilityTime: 3000,
      })
      navigation.navigate('UserViewCalendar')
    } catch (e) {
      
    }
  }

  const onActiveIndexChanged = (index: number) => setActiveIndex(index)

  const goToPrevStep = () => {
    const prevActiveIndex = activeIndex
    if (((activeIndex - 1) === 3) && (!isRecurring)) {
      setActiveIndex(prevActiveIndex - 2)
    } else {
      const newActiveIndex = prevActiveIndex === 0 ? 0 : prevActiveIndex - 1
      setActiveIndex(newActiveIndex)
    }
    
  }

  const renderPrevButton = () => {
    if (activeIndex === 0) {
      return <Box mt={{ phone: 's', tablet: 'm' }}/>
    }

    return (
    <Box m={{ phone: 's', tablet: 'm' }}>
      <Button onPress={goToPrevStep}>
        Back
      </Button>
    </Box>
  )}
  
  const goToNextStep = () => {
    const prevActiveIndex = activeIndex
    const prevCompletedStep = completedStep
    /**
     0 - EditEventBaseStep
     1 - EditEventBaseStep2
     2 - EditEventBaseStep3
     3 - EditEventRecurStep
     4 - EditEventVirtualMeet
     5 - EditEventAttendees
     6 - EditEventVisibilityAndAlarmsStep
     7 - EditEventUpdateCategories
     */
    if (prevActiveIndex === 8) {
      return
    }
    if (!isRecurring && isAttendees) {
      let newActiveIndex = prevActiveIndex + 1

      if (prevActiveIndex === 2) {
        newActiveIndex = 4
      }

      // validate user category list
      if (prevActiveIndex === 6) {
        if (categories?.length === 0) {
          Toast.show({
            type: 'info',
            text1: 'No categories available',
            text2: 'Please add at least one category in your settings in order to add to your event',
          })
           newActiveIndex = 8
        }
      }

      if (prevActiveIndex === 8) {
        return
      }

      if (!prevCompletedStep || (prevCompletedStep < prevActiveIndex)) {
        const newCompletedStep = prevActiveIndex
        setCompletedStep(newCompletedStep)
      }

      if (newActiveIndex !== prevActiveIndex) {
        return setActiveIndex(newActiveIndex)
      }
      return
    }

    if (!isAttendees && isRecurring) {
      let newActiveIndex = prevActiveIndex + 1

      if (prevActiveIndex === 3) {
        newActiveIndex = 6
      }

      // validate user category list
      if (prevActiveIndex === 6) {
        if (categories?.length === 0) {
          Toast.show({
            type: 'info',
            text1: 'No categories available',
            text2: 'Please add at least one category in your settings in order to add to your event',
            visibilityTime: 3000,
          })
           newActiveIndex = 8
        }
      }

      if (!prevCompletedStep || (prevCompletedStep < prevActiveIndex)) {
        const newCompletedStep = prevActiveIndex
        setCompletedStep(newCompletedStep)
      }

      if (newActiveIndex !== prevActiveIndex) {
        return setActiveIndex(newActiveIndex)
      }
      return
    }

    if (!isAttendees && !isRecurring) {
      
      let newActiveIndex = prevActiveIndex + 1

      if (prevActiveIndex === 2) {
        newActiveIndex = 6
      }

      // validate user category list
      if (prevActiveIndex === 6) {
        if (categories?.length === 0) {
          Toast.show({
            type: 'info',
            text1: 'No categories available',
            text2: 'Please add at least one category in your settings in order to add to your event',
            visibilityTime: 3000,
          })
           newActiveIndex = 8
        }
      }

      if (!prevCompletedStep || (prevCompletedStep < prevActiveIndex)) {
        const newCompletedStep = prevActiveIndex
        setCompletedStep(newCompletedStep)
      }

      if (newActiveIndex !== prevActiveIndex) {
        return setActiveIndex(newActiveIndex)
      }
      return
    }

    let newActiveIndex = prevActiveIndex + 1

    // validate user category list
      if (prevActiveIndex === 6) {
        if (categories?.length === 0) {
          Toast.show({
            type: 'info',
            text1: 'No categories available',
            text2: 'Please add at least one category in your settings in order to add to your event',
            visibilityTime: 3000,
          })
           newActiveIndex = 8
        }
      }

    if (!prevCompletedStep || (prevCompletedStep < prevActiveIndex)) {
      const newCompletedStep = prevActiveIndex
      setCompletedStep(newCompletedStep)
    }

    if (newActiveIndex !== prevActiveIndex) {
      setActiveIndex(newActiveIndex)
    }
  }

  const renderNextButton = () => {
    if (activeIndex === 8) {
      return <Box mt={{ phone: 's', tablet: 'm' }}/>
    }

    return (
      <Box m={{ phone: 's', tablet: 'm' }}>
        <Button onPress={goToNextStep}>
          Next
        </Button>
      </Box>
    )
  }

  const getStepState = (index: number) => {
    let state = Wizard.States.DISABLED
    if (completedStep && (completedStep >= index)) {
      state = Wizard.States.COMPLETED;
    } else if (activeIndex === index || (completedStep && (completedStep < index))
              || (completedStep === undefined)) {
        state = Wizard.States.ENABLED;
    }

    return state
  }

  const renderCurrentStep = () => {
    /**
     0 - CreateEventBaseStep
     1 - CreateEventBaseStep2
     2 - CreateEventBaseStep3
     3 - CreateEventRecurStep
     4 - CreateEventVirtualMeet
     5 - CreateEventAttendees
     6 - CreateEventVisibilityAndAlarmsStep
     7 - CreateEventAddCategories
     */
     switch(activeIndex) {
      case 0:
        return (
          <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
            <EditEventBaseStep
              title={title}
              notes={notes}
              location={location}
              startDate={startDate}
              endDate={endDate}
              setParentTitle={setTitle}
              setParentNotes={setNotes}
              setParentLocation={setLocation}
              setParentStartDate={setStartDate}
              setParentEndDate={setEndDate}
            />
            <Box flexDirection="row" justifyContent="space-between" alignItems="center" style={{ width: '95%'}}>
              <Box />
              {renderNextButton()}
            </Box>
          </Box>
        )
      case 1: 
      return (
          <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
            <EditEventBaseStep2
              allDay={allDay}
              isRecurring={isRecurring}
              isAttendees={isAttendees}
              isBreak={isBreak}
              setParentAllDay={setAllDay}
              setParentIsRecurring={setIsRecurring}
              setParentIsAttendees={setIsAttendees}
              setParentIsBreak={setIsBreak}        
            />
            <Box flexDirection="row" justifyContent="space-between" alignItems="center">
              {renderPrevButton()}
              {renderNextButton()}
            </Box>
          </Box>
      )
      case 2:
         return (
           <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
             <EditEventBaseStep3
               modifiable={modifiable}
               setParentModifiable={setModifiable}
               isMeeting={isMeeting}
               setParentIsMeeting={setIsMeeting}
               isExternalMeeting={isExternalMeeting}
               setParentIsExternalMeeting={setIsExternalMeeting}
               transparency={transparency}
               setParentTransparency={setTransparency}  
              />
             <Box flexDirection="row" justifyContent="space-between" alignItems="center">
              {renderPrevButton()}
              {renderNextButton()}
            </Box>
           </Box>
         )
      case 3:
        return (
          <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
            <EditEventRecurStep
              recurringEndDate={recurringEndDate}
              setParentRecurringEndDate={setRecurringEndDate}
              frequency={frequency}
              setParentFrequency={setFrequency}
              interval={interval}
              setParentInterval={setInterval}
              byWeekDay={byWeekDay}
              setParentByWeekDay={setByWeekDay}
            />
            <Box flexDirection="row" justifyContent="space-between" alignItems="center">
              {renderPrevButton()}
              {renderNextButton()}
            </Box>
          </Box>
        )
      case 4:
        return (
          <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
            <EditEventVirtualMeet
              isZoomAvailable={isZoomAvailable}
              isGoogleMeetAvailable={isGoogleMeetAvailable}
              zoomMeet={zoomMeet}
              googleMeet={googleMeet}
              setParentZoomMeet={setZoomMeet}
              setParentGoogleMeet={setGoogleMeet}
              zoomPrivateMeeting={zoomPrivateMeeting}
              setParentZoomPrivateMeeting={setZoomPrivateMeeting}
            />
            <Box flexDirection="row" justifyContent="space-between" alignItems="center">
              {renderPrevButton()}
              {renderNextButton()}
            </Box>
          </Box>
        )
      case 5:
         return (
          <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
            <EditEventAttendees
              attendees={attendees}
              setParentAttendees={setAttendees}
              userId={userId}
              client={client}
             />
             <Box flexDirection="row" justifyContent="space-between" alignItems="center">
              {renderPrevButton()}
              {renderNextButton()}
            </Box>
          </Box>
        )
      case 6:
         return (
          <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
            <EditEventVisibilityAndAlarmsStep
              alarms={alarms}
              setParentAlarms={setAlarms}
              visibility={visibility}
              setParentVisibility={setVisibility}
              userId={userId}
             />
             <Box flexDirection="row" justifyContent="space-between" alignItems="center">
               {renderPrevButton()}
               {renderNextButton()}
             </Box>
          </Box>
         )
      case 7:
        return (
          <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
            <EditEventUpdateCategories
              categories={categories}
              setParentSelectedCategories={setSelectedCategories}
              selectedCategories={selectedCategories}
            />
            <Box flexDirection="row" justifyContent="space-between" alignItems="center">
              {renderPrevButton()}
              {renderNextButton()}
            </Box>
          </Box>
        )        
      case 8: 
        return (
          <Box flex={1} alignItems="center" justifyContent="center">
            <Box flex={1} style={{ width: '100%' }} m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
              <Box m={{ phone: 'm', tablet: 'l'}}>
                <Text variant="subheaderNormal">
                  Update Event
                </Text>
              </Box>
              <Box mt={{ phone: 'm', tablet: 'l' }}>
                <Button onPress={updateEventForUser}>
                  Update
                </Button>
              </Box>
            </Box>
            <Box flexDirection="row" justifyContent="space-between" alignItems="center" style={{ width: '75%' }}>
              {renderPrevButton()}
              <Box />
            </Box>
          </Box>
        )
       default:
         return (
           <Box justifyContent="center" alignItems="center">
             <RegularCard>
               <Text variant="header">
                 Oops... something went wrong
               </Text>
             </RegularCard>
           </Box>
         )
     }
  }

  return (
    <Box flex={1} justifyContent="center" alignItems="center" width="100%">
      <Wizard testID={'uilib.wizard'} activeIndex={activeIndex} onActiveIndexChanged={onActiveIndexChanged}>
        <Wizard.Step state={getStepState(0)} label={'Update Base'} />
        <Wizard.Step state={getStepState(1)} label={'Continue Base'}/>
        <Wizard.Step state={getStepState(2)} label={'Continue Base'}/>
        <Wizard.Step state={getStepState(3)} label={'Update Recurrence'}/>
        <Wizard.Step state={getStepState(4)} label={'Update Virtual Meet'}/>
        <Wizard.Step state={getStepState(5)} label={'Update Event Attendees'} />
        <Wizard.Step state={getStepState(6)} label={'Update Visibility And Alarms'} />
        <Wizard.Step state={getStepState(7)} label={'Update Categories for Event'} />
        <Wizard.Step state={getStepState(8)} label={'Update Event'}/>
      </Wizard>
      {renderCurrentStep()}
    </Box>
  )
}

export default UserEditEvent



