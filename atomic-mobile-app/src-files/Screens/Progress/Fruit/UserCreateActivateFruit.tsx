import React, { useState, useEffect, useRef } from 'react'
import { Platform } from 'react-native'
import { Wizard } from 'react-native-ui-lib'
import { useNavigation } from '@react-navigation/native'
import { StackActions } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { DataStore } from '@aws-amplify/datastore'

import RNCalendarEvents from 'react-native-calendar-events'
import Toast from 'react-native-toast-message'
import { dayjs } from '@app/date-utils'

import * as math from 'mathjs'
import {
  UserActivateType,
  PrimaryGoalType,
  Day, Schedule, Goal, Status,
  User,
} from '@models'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import RegularCard from '@components/RegularCard'
import PrimaryCard from '@components/PrimaryCard'
import Button from '@components/Button'

import UserActivateSchedule from '@screens/Schedule/UserActivateSchedule'
import UserActivateGoal from '@screens/Goal/UserActivateGoal'
import {
  generateTimesForEveryDay,
  createCalendarEvent,
  createRealmEvent,
} from '@progress/Todo/UserTaskHelper'





type RootStackParamList = {
  UserCreateActivateFruit: {},
}

type UserCreateActivateFruitNavigationProp = StackNavigationProp<
  RootStackParamList,
  'UserCreateActivateFruit'
>

type dayType = 'MO'|'TU'|'WE'|'TH'|'FR'|'SA'|'SU'

type Props = {
  sub: string,
}

const getDayNumber = (value: Day) => {
  switch(value) {
    case Day.SU:
      return 0
    case Day.MO:
      return 1
    case Day.TU:
      return 2
    case Day.WE:
      return 3
    case Day.TH:
      return 4
    case Day.FR:
      return 5
    case Day.SA:
      return 6
    default:
      return 1
  }
}

const ATOMICCALENDARNAME = 'Atomic Calendar'

function UserCreateActivateFruit(props: Props) {
  
  
  
  const [activeIndex, setActiveIndex] = useState<number>(0)
  const [completedStep, setCompletedStep] = useState<number | undefined>()
  
  
  
  
  

  const userIdEl = useRef<string>(null)
  const scheduleDaysEl = useRef<[Day?, Day?, Day?, Day?, Day?, Day?, Day?]>([])
  const reminderTimeRangeEl = useRef<[Date?, Date?]>([])
  const isReminderEl = useRef<boolean>(false)
  const isValidEl = useRef<boolean>(false)
  const reminderFrequencyEl = useRef<number>(0)
  const endDateEl = useRef<Date>(null)
  const goalEl = useRef<string>(null)
  const calendarEventIdEl = useRef<string>('')

  const { sub } = props

  const navigation = useNavigation<UserCreateActivateFruitNavigationProp>()

  
  useEffect(() => {
    (async (): Promise<undefined | null> => {
      try {
        if (!sub) {
          return null
        }
        const userData = await DataStore.query(User, c => c.sub('eq', sub), {
          page: 0,
          limit: 1,
        })

        if (userData?.length > 0) {
          const [user] = userData
          
          userIdEl.current = user.id
        }
      } catch(e) {
        
      }
    })()
  }, [sub])

  
  useEffect(() => {
    (async (): Promise<undefined | null> => {
      const oldStatus = await RNCalendarEvents.checkPermissions()
      let status
      if (oldStatus !== 'authorized') {
        const newStatus = await RNCalendarEvents.requestPermissions();

        status = newStatus
      }

      if (status === 'authorized' || oldStatus === 'authorized') {
        const newCalendars = await RNCalendarEvents.findCalendars();
        
        

        
        const atomicCalendars = newCalendars?.filter(each => each.title === ATOMICCALENDARNAME)

        if (atomicCalendars?.length > 0) {
          
          calendarEventIdEl.current = atomicCalendars[0].id
          return
        }
        
        

        const defaultCalendarSource = Platform.OS === 'ios'
          ? newCalendars?.filter(each => each?.source === 'Default')?.[0]?.source
          : { isLocalAccount: true, name: ATOMICCALENDARNAME, type: '' }

          const newCalendarId = await RNCalendarEvents.saveCalendar({
            title: 'Atomic Calendar',
            color: palette['purple'],
            entityType: 'event',
            source: defaultCalendarSource,
            name: ATOMICCALENDARNAME,
            ownerAccount: 'personal',
            accessLevel: 'owner',
          })
          
          calendarEventIdEl.current = newCalendarId
      } else {
        Toast.show({
          type: 'error',
          text1: 'Need Calendar Access',
          text2: 'Task Reminder works by setting reminders in your calendar and thus needs access to remind you of breaks and active time'
        })
        
      }
    })();
  }, [])

  
  const checkAvailability = async (value: string) => {
    try {
      const activeComponent = await DataStore.query(UserActivateType, c => c.userId('eq', sub)
      .primaryGoalType('eq', PrimaryGoalType.FRUIT)
      .secondaryGoalType('eq', value))

      if (activeComponent && activeComponent.length > 0) {
        return false
      }
      return true
    } catch(e) {
      
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
    <Box mt={{ phone: 's', tablet: 'm' }}>
      <Button onPress={goToPrevStep}>
        Back
      </Button>
    </Box>
  )}

  const goToNextStep = (): Promise<null | undefined> => {
    const prevActiveIndex = activeIndex
    const prevCompletedStep = completedStep

    if (prevActiveIndex === 2) {
      return null
    }

    const newActiveIndex = prevActiveIndex + 1

    if (!prevCompletedStep || (prevCompletedStep < prevActiveIndex)) {
      const newCompletedStep = prevActiveIndex
      setCompletedStep(newCompletedStep)
    }

    if (newActiveIndex !== prevActiveIndex) {
      setActiveIndex(newActiveIndex)
    }
  }

  const renderNextScheduleButton = () => {
    if (scheduleDaysEl?.current?.length > 0) {
      return (
        <Box mt={{ phone: 's', tablet: 'm' }}>
          <Button onPress={goToNextStep}>
            Next
          </Button>
        </Box>
      )
    }

    return (
      <Box mt={{ phone: 's', tablet: 'm' }}>
        <Button onPress={goToNextStep}>
          Skip
        </Button>
      </Box>
    )
  }

  const renderNextGoalButton = () => {

    if (goalEl?.current) {
      return (
        <Box mt={{ phone: 's', tablet: 'm' }}>
          <Button onPress={goToNextStep}>
            Next
          </Button>
        </Box>
      )
    }

    return (
      <Box mt={{ phone: 's', tablet: 'm' }}>
        <Button onPress={goToNextStep}>
          Skip
        </Button>
      </Box>
    )
  }

  const toggleDayChange = (days: [Day?, Day?, Day?, Day?, Day?, Day?, Day?]) => {
    
    scheduleDaysEl.current = days
  }

  const onTimeChange = (timeRange: [Date, Date], reminder: boolean,  valid: boolean, frequency?: number) => {
    
    reminderTimeRangeEl.current = timeRange

    
    isReminderEl.current = reminder

    
    isValidEl.current = valid

    if (frequency) {
      
      reminderFrequencyEl.current = frequency
    }

  }

  const onReminderChange = (reminder: boolean) => (isReminderEl.current = reminder)

  const getRandomArbitrary = (min: number, max: number) => {
    return Math.random() * (max - min) + min
  }

  const createAlarmsAndCalendarEvents = async (
    endDate: string,
    dayFrequency?: number,
    byWeekDay?: dayType[],
    dayReminderTimeRange?: [string, string],
  ) => {
    try {
      let dayReminderTimes: string[] = []

      const randomStartHours: number[] = []

      if (dayFrequency && dayReminderTimeRange?.length > 0) {
        const [startTime, endTime] = dayReminderTimeRange

        const hours = dayjs(endTime).diff(dayjs(startTime), 'h')

        for(let i = 0; i < dayFrequency; i++) {
         const value = getRandomArbitrary(0, hours)

         randomStartHours.push(value)
         
        }

        
        const randomStartHoursOffset = randomStartHours.map(i => math.chain(dayjs(startTime).hour()).add(i).done())

        
        const newDayReminderTimes = await generateTimesForEveryDay(
          byWeekDay as Day[],
          dayjs(Math.min(...scheduleDaysEl?.current?.map(i => dayjs().day(getDayNumber(i as Day)).unix()))).format(),
          endDate,
          randomStartHoursOffset,
        )

        dayReminderTimes = newDayReminderTimes.map(i => dayjs(i).format())
      }

      
      if (dayFrequency
        && dayReminderTimeRange?.length > 0
        && dayReminderTimes?.length < 1) {
        
        return
      }

      if (dayReminderTimes?.length > 0) {
        const calendarEventIdArray: string[] = await Promise.all(
          dayReminderTimes.map(async (reminderDate) => {
            return createCalendarEvent(
              calendarEventIdEl,
              reminderDate,
              reminderDate,
              undefined,
              undefined,
              undefined,
              undefined,
              undefined,
              undefined,
            )
          })
        )

        
        if (calendarEventIdArray && calendarEventIdArray.length > 0) {

          const realmEventPromises = calendarEventIdArray.map(async (eId, index) => createRealmEvent(
              eId,
              dayReminderTimes[index],
              dayReminderTimes[index],
              '',
              calendarEventIdEl.current,
              PrimaryGoalType.FRUIT,
              true,
              false,
              false,
              false,
              undefined,
              undefined,
              undefined,
              undefined,
              undefined,
              undefined,
            )
          )

          await Promise.all(realmEventPromises)

        }
      }
    } catch(e) {
      
    }
  }



  const createSchedule = async () => {
    try {
      if (!endDateEl?.current) {
        

        Toast.show({
          type: 'error',
          text1: 'Oops something went wrong',
          text2: 'We are unable to process at this time. Please try again.',
        })
        return
      }

      if (!(userIdEl?.current)) {
        
        Toast.show({
          type: 'error',
          text1: 'Oops something went wrong',
          text2: 'We are unable to process at this time. Please try again.',
        })
        return null
      }
      if (scheduleDaysEl?.current?.length > 0) {
        /** validate schedule options */
        if (!isValidEl?.current || (isReminderEl?.current && !(reminderTimeRangeEl?.current?.length > 0))
        ||  (isReminderEl?.current && !reminderFrequencyEl?.current)) {
          Toast.show({
            type: 'error',
            text1: 'Invalid selection',
            text2: 'You have an invalid selection for schedule. Please correct it before activating exercise',
          })
          return null
        }

        
        await createAlarmsAndCalendarEvents(
          dayjs(endDateEl?.current).format(),
          reminderFrequencyEl?.current || undefined,
          scheduleDaysEl?.current as dayType[],
          reminderTimeRangeEl?.current?.map(i => dayjs(i).format()) as [string, string],
        )

        const schedule = new Schedule({
          primaryGoalType: PrimaryGoalType.FRUIT,
          secondaryGoalType: 'null',
          status: Status.ACTIVE,
          userId: userIdEl?.current,
          date: dayjs().format(),
          userIdGoal: `${userIdEl?.current}#${PrimaryGoalType.FRUIT}#null`,
          unit: 'servings',
          frequency: reminderFrequencyEl?.current || undefined,
          startDate: dayjs(Math.min(...scheduleDaysEl?.current?.map(i => dayjs().day(getDayNumber(i as Day)).unix()))).format(),
          endDate: endDateEl?.current ? dayjs(endDateEl?.current).format() : undefined,
          byWeekDay: scheduleDaysEl?.current as Day[],
          reminder: isReminderEl?.current,
          reminderTimeRange: reminderTimeRangeEl?.current?.map(i => dayjs(i).format()),
          ttl: endDateEl?.current ? dayjs(endDateEl?.current).add(6, 'm').unix() : dayjs().add(3, 'y').unix(),
        })

        await DataStore.save(schedule)
        return schedule.id
      }
      return null
    } catch(e) {
      
    }
  }

  const createGoal = async (scheduleId?: string | null): Promise<null |undefined> => {
    try {
      if (goalEl?.current) {
        /** verify end date */
        if (!endDateEl?.current) {
          Toast.show({
            type: 'error',
            text1: 'Missing Info',
            text2: 'You will need to select an end date for your goal'
          })
          return null
        }

        

        const newGoal = new Goal({
          userId: userIdEl?.current,
          date: dayjs().format(),
          status: Status.ACTIVE,
          endDate: dayjs(endDateEl?.current).format(),
          primaryGoalType: PrimaryGoalType.FRUIT,
          secondaryGoalType: 'null',
          scheduleId: scheduleId || undefined,
          goal: goalEl?.current,
          ttl: dayjs().add(3, 'y').unix(),
        })

        await DataStore.save(newGoal)
      }
    } catch(e) {
      
    }
  }

  
  const createNewActiveComponent = async (): Promise<undefined | null> => {
    try {
      const isAvailable = await checkAvailability('null')

      if (!isAvailable) {
        Toast.show({
          type: 'error',
          text1: 'Not available',
          text2: `You have already activated Fruit component`
        })

        return null
      }

      
      const scheduleId = await createSchedule()
      await createGoal(scheduleId)

      const userActivateComponent = new UserActivateType({
        userId: userIdEl?.current,
        primaryGoalType: PrimaryGoalType.FRUIT,
        secondaryGoalType: 'null',
        activated: true,
      })

      await DataStore.save(userActivateComponent)

      Toast.show({
            type: 'success',
            text1: 'Component activated',
            text2: `You have activated Fruit Servings component 🙌`
         });

       /** pop twice */
       const popAction = StackActions.pop(1);

       navigation.dispatch(popAction);

    } catch(e) {
      
      Toast.show({
            type: 'error',
            text1: `Something went wrong`,
            text2: `Please try again later`
         });
    }
  }

  const onEndDateChange = (date: Date) => (endDateEl.current = date)

  const onGoalChange = (text: string) => (goalEl.current = text)

  const renderCurrentStep = () => {
    switch(activeIndex) {
      case 0:
        return (
          <Box>
            <UserActivateSchedule
              toggleDayChange={toggleDayChange}
              onTimeChange={onTimeChange}
              onReminderChange={onReminderChange}
            />
            {renderNextScheduleButton()}
          </Box>
        )
      case 1:
        return (
          <Box>
            <UserActivateGoal
              goalUnit="minutes"
              onGoalChange={onGoalChange}
              onEndDateChange={onEndDateChange}
            />
            {renderPrevButton()}
            {renderNextGoalButton()}
          </Box>
        )
      case 2:
        return (
          <Box>
            <Box my={{ phone: 's', tablet: 'm'}}>
              <PrimaryCard>
                <Text variant="primarySecondaryHeader">
                  Exercise
                </Text>
              </PrimaryCard>
            </Box>
            <Box my={{ phone: 's', tablet: 'm'}}>
              <RegularCard>
                <Button onPress={createNewActiveComponent}>
                  Activate
                </Button>
              </RegularCard>
            </Box>
            {renderPrevButton()}
          </Box>
        )
    }
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


  return (
    <Box flex={1} justifyContent="center" alignItems="center">
      <Wizard testID={'uilib.wizard'} activeIndex={activeIndex} onActiveIndexChanged={onActiveIndexChanged}>
        <Wizard.Step state={getStepState(0)} label={'Set a Schedule'}/>
        <Wizard.Step state={getStepState(1)} label={'Set a Goal'}/>
        <Wizard.Step state={getStepState(2)} label={'Activate Fruit Servings'}/>
      </Wizard>
      {renderCurrentStep()}
    </Box>
  )
}

export default UserCreateActivateFruit
