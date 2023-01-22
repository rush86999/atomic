import React, { useState, useEffect } from 'react'
import { Wizard } from 'react-native-ui-lib'
import { useNavigation, RouteProp } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import Toast from 'react-native-toast-message'
import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { dayjs, RNLocalize } from '@app/date-utils'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import RegularCard from '@components/RegularCard'
import Button from '@components/Button'

import {
  CategoryType
} from '@app/dataTypes/CategoryType'
import {
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
import { createNewEvent } from '@screens/Calendar/UserCreateCalendarHelper'

import CreateEventAttendees from '@screens/Calendar/CreateEventWizard/CreateEventAttendees'
import CreateEventBaseStep from '@screens/Calendar/CreateEventWizard/CreateEventBaseStep'
import CreateEventBaseStep2 from '@screens/Calendar/CreateEventWizard/CreateEventBaseStep2'
import CreateEventRecurStep from '@screens/Calendar/CreateEventWizard/CreateEventRecurStepAlt'
import CreateEventVirtualMeet from '@screens/Calendar/CreateEventWizard/CreateEventVirtualMeet'
import CreateEventVisibilityAndAlarmsStep from '@screens/Calendar/CreateEventWizard/CreateEventVisibilityAndAlarmsStep'
import CreateEventAddCategories from '@screens/Calendar/CreateEventWizard/CreateEventAddCategories'

import { CalendarType } from '@app/dataTypes/CalendarType'
import { Day } from '@models'
import getGlobalPrimaryCalendar from '@app/apollo/gql/getGlobalPrimaryCalendar'



type RootStackNavigationParamList = {
 UserCreateEvent: undefined,
 UserViewCalendar: undefined,
}

type UserCreateEventNavigationProp = StackNavigationProp<
  RootStackNavigationParamList,
  'UserCreateEvent'
>

type RootStackEventParamList = {
  UserCreateEvent: {
    hour: number;
    minutes?: number;
    date: string
  },
}

type UserCreateEventRouteProp = RouteProp<
  RootStackEventParamList,
  'UserCreateEvent'
>

type Props = {
  sub: string,
  route: UserCreateEventRouteProp,
  client: ApolloClient<NormalizedCacheObject>,
}

function UserCreateEvent(props: Props) {
  const [tags, setTags] = useState<CategoryType[]>([])
  const [selectedCategories, setSelectedCategories] = useState<CategoryType[]>([])
  const [title, setTitle] = useState<string>()
  const [allDay, setAllDay] = useState<boolean>(false)
  const [isRecurring, setIsRecurring] = useState<boolean>(false)
  const [recurringEndDate, setRecurringEndDate] = useState<Date>(new Date())
  const [frequency, setFrequency] = useState<RecurrenceFrequency>()
  const [interval, setInterval] = useState<string>()
  const [alarms, setAlarms] = useState<number[]>([])
  const [notes, setNotes] = useState<string>()
  const [location, setLocation] = useState<string>()
  const [isZoomAvailable, setIsZoomAvailable] = useState<boolean>(false)
  const [isGoogleMeetAvailable, setIsGoogleMeetAvailable] = useState<boolean>(false)
  const [zoomMeet, setZoomMeet] = useState<boolean>(false)
  const [googleMeet, setGoogleMeet] = useState<boolean>(false)
  const [zoomPrivateMeeting, setZoomPrivateMeeting] = useState<boolean>(false)
  const [attendees, setAttendees] = useState<Person[]>([])
  const [visibility, setVisibility] = useState<visibility>('default')
  const [isAttendees, setIsAttendees] = useState<boolean>(false)
  const [activeIndex, setActiveIndex] = useState<number>(0)
  const [completedStep, setCompletedStep] = useState<number | undefined>()
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>()
  const [calendar, setCalendar] = useState<CalendarType>()
  const [isBreak, setIsBreak] = useState<boolean>(false)
  const [startDate, setStartDate] = useState<Date>(dayjs(props?.route?.params?.date).hour(props?.route?.params?.hour).minute(props?.route?.params?.minutes).toDate())
  const [endDate, setEndDate] = useState<Date>(
    dayjs(props?.route?.params?.date).hour(props?.route?.params?.hour).minute(props?.route?.params?.minutes).add(30, 'm').toDate()
  )
  const [byWeekDay, setByWeekDay] = useState<Day[]>([])

  const userId = props?.sub
  const client = props?.client
  const navigation = useNavigation<UserCreateEventNavigationProp>()
  const date = props?.route?.params?.date
  const hour = props?.route?.params?.hour
  const minutes = props?.route?.params?.minutes

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
        setTags(results)
      } catch(e) {
        
      }
    })()
  }, [client, userId])

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

  useEffect(() => {
    (async () => {  
      if (!userId || !client) {
        return
      }
      const result = (await client.query<{ Calendar: CalendarType[] }>({
        query: getGlobalPrimaryCalendar, 
        variables: {
          userId,
        },
      })).data?.Calendar?.[0]
      if (!result?.id) {
        
        return
      }
      setSelectedCalendarId(result?.id)
      setCalendar(result)
    })()
  }, [client, userId])
  const createEventForUser = async () => {
    try {
      if (!userId || !client) {
        return
      }
      await createNewEvent(
        dayjs(startDate).format(),
        dayjs(endDate).format(),
        userId,
        client,
        selectedCalendarId,
        selectedCategories?.map(category => category.id),
        title,
        allDay,
        dayjs(recurringEndDate).format(),
        frequency,
       parseInt (interval, 10),
        alarms,
        notes,
        location ? { title: location } : undefined,
        false,
        false,
        false,
        true,
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
        undefined,
        undefined,
        title,
        'opaque',
        visibility,
        undefined,
        undefined,
        undefined,
        calendar?.colorId,
        RNLocalize.getTimeZone(),
        calendar?.backgroundColor,
        calendar?.foregroundColor,
        alarms?.length > 0 ? false : true,
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
        undefined,
        true,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        dayjs.duration(dayjs(endDate).diff(dayjs(date).hour(hour).minute(minutes))).asMinutes(),
        undefined,
        undefined,
        'create',
        undefined,
        byWeekDay,
        1
      )

      Toast.show({
        type: 'success',
        position: 'top',
        text1: 'Event Created',
        text2: 'Event created successfully',
        visibilityTime: 3000,
      })
      navigation.navigate('UserViewCalendar')
    } catch (e) {
      
    }
  }

  const onActiveIndexChanged = (index: number) => setActiveIndex(index)

  const goToPrevStep = () => {
    const prevActiveIndex = activeIndex
    const newActiveIndex = prevActiveIndex === 0 ? 0 : prevActiveIndex - 1
    setActiveIndex(newActiveIndex)
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
    if (!isRecurring && isAttendees) {
      let newActiveIndex = prevActiveIndex + 1

      if (prevActiveIndex === 1) {
        newActiveIndex = 3
      }

      if (prevActiveIndex === 5) {
        if (tags?.length === 0) {
          Toast.show({
            type: 'info',
            text1: 'No categories available',
            text2: 'Please add at least one category in your settings in order to add to your event',
          })
           newActiveIndex = 7
        }
      }

      if (prevActiveIndex === 7) {
        return
      }

      if (!prevCompletedStep || (prevCompletedStep < prevActiveIndex)) {
        const newCompletedStep = prevActiveIndex
        setCompletedStep(newCompletedStep)
      }

      if (newActiveIndex !== prevActiveIndex) {
        return setActiveIndex(newActiveIndex)
      }

    }

    if (!isAttendees && isRecurring) {
      let newActiveIndex = prevActiveIndex + 1

      if (prevActiveIndex === 2) {
        newActiveIndex = 5
      }

      if (prevActiveIndex === 5) {
        if (tags?.length === 0) {
          Toast.show({
            type: 'info',
            text1: 'No categories available',
            text2: 'Please add at least one category in your settings in order to add to your event',
            visibilityTime: 3000,
          })
           newActiveIndex = 7
        }
      }

      if (prevActiveIndex === 7) {
        return
      }

      if (!prevCompletedStep || (prevCompletedStep < prevActiveIndex)) {
        const newCompletedStep = prevActiveIndex
        setCompletedStep(newCompletedStep)
      }

      if (newActiveIndex !== prevActiveIndex) {
        return setActiveIndex(newActiveIndex)
      }
    }

    if (!isAttendees && !isRecurring) {
      let newActiveIndex = prevActiveIndex + 1

      if (prevActiveIndex === 1) {
        newActiveIndex = 5
      }

      if (prevActiveIndex === 5) {
        if (tags?.length === 0) {
          Toast.show({
            type: 'info',
            text1: 'No categories available',
            text2: 'Please add at least one category in your settings in order to add to your event',
            visibilityTime: 3000,
          })
           newActiveIndex = 7
        }
      }

      if (prevActiveIndex === 7) {
        return
      }

      if (!prevCompletedStep || (prevCompletedStep < prevActiveIndex)) {
        const newCompletedStep = prevActiveIndex
        setCompletedStep(newCompletedStep)
      }

      if (newActiveIndex !== prevActiveIndex) {
        return setActiveIndex(newActiveIndex)
      }
    }

    if (prevActiveIndex === 7) {
      return
    }

    let newActiveIndex = prevActiveIndex + 1

      if (prevActiveIndex === 5) {
        if (tags?.length === 0) {
          Toast.show({
            type: 'info',
            text1: 'No categories available',
            text2: 'Please add at least one category in your settings in order to add to your event',
            visibilityTime: 3000,
          })
           newActiveIndex = 7
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
    if (activeIndex === 7) {
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
     switch(activeIndex) {
      case 0:
        return (
          <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
            <CreateEventBaseStep
              title={title}
              notes={notes}
              location={location}
              setParentTitle={setTitle}
              setParentNotes={setNotes}
              setParentLocation={setLocation}
              startDate={dayjs(date).hour(hour).minute(minutes).toDate()}
              endDate={ dayjs(date).hour(hour).minute(minutes).add(30, 'm').toDate()}
              setParentEndDate={setEndDate}
              setParentStartDate={setStartDate}
            />
            <Box style={{ width: '100%' }} flexDirection="row" justifyContent="space-between" alignItems="center">
              <Box />
              {renderNextButton()}
            </Box>
          </Box>
        )
      case 1: 
      return (
          <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
            <CreateEventBaseStep2
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
            <CreateEventRecurStep
              recurringEndDate={recurringEndDate}
              setParentRecurringEndDate={setRecurringEndDate}
              frequency={frequency}
              setParentFrequency={setFrequency}
              interval={interval}
              setParentInterval={setInterval}
              byWeekDay={byWeekDay}
              setParentWeekDay={setByWeekDay}
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
            <CreateEventVirtualMeet
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
      case 4:
         return (
          <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
            <CreateEventAttendees
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
      case 5:
         return (
          <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
            <CreateEventVisibilityAndAlarmsStep
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
      case 6:
        return (
          <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
            <CreateEventAddCategories
              categories={tags}
              setParentSelectedCategories={setSelectedCategories}
              selectedCategories={selectedCategories}
            />
            <Box flexDirection="row" justifyContent="space-between" alignItems="center">
              {renderPrevButton()}
              {renderNextButton()}
            </Box>
          </Box>
        )        
      case 7: 
        return (
          <Box flex={1} alignItems="center" justifyContent="center">
            <Box flex={1} style={{ width: '100%' }} m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
              <Box m={{ phone: 'm', tablet: 'l'}}>
                <Text variant="subheaderNormal">
                  Create Event
                </Text>
              </Box>
              <Box mt={{ phone: 'm', tablet: 'l' }}>
                <Button onPress={createEventForUser}>
                  Create
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
    <Box flex={1} justifyContent="center" alignItems="center">
      <Wizard testID={'uilib.wizard'} activeIndex={activeIndex} onActiveIndexChanged={onActiveIndexChanged}>
        <Wizard.Step state={getStepState(0)} label={'Set Base'} />
        <Wizard.Step state={getStepState(1)} label={'Continue Base'}/>
        <Wizard.Step state={getStepState(2)} label={'Select Recurrence'}/>
        <Wizard.Step state={getStepState(3)} label={'Select Virtual Meet'}/>
        <Wizard.Step state={getStepState(4)} label={'Select Event Attendees'} />
        <Wizard.Step state={getStepState(5)} label={'Set Visibility And Alarms'} />
        <Wizard.Step state={getStepState(6)} label={'Select Categories for Event'} />
        <Wizard.Step state={getStepState(7)} label={'Create Event'}/>
      </Wizard>
      {renderCurrentStep()}
    </Box>
  )

}

export default UserCreateEvent
