import React, { useEffect, useState, useCallback, useRef } from 'react'
import { TouchableOpacity, StyleSheet, useColorScheme, Appearance, FlatList, Pressable, KeyboardAvoidingView, Platform } from 'react-native'
import { useHeaderHeight } from '@react-navigation/elements'
import DatePicker from 'react-native-date-picker'
import Toast from 'react-native-toast-message'
import { Colors, Wizard, TextField, Picker, PickerValue } from 'react-native-ui-lib';
import { dayjs, RNLocalize } from '@app/date-utils'
import Ionicons from 'react-native-vector-icons/Ionicons'

import { listRemindersForEvent } from '@screens/Calendar/Reminder/ReminderHelper'
import _ from 'lodash'
import { useNavigation, RouteProp, useFocusEffect } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import {
  Day, Schedule, Status, User,
} from '@models'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import RegularCard from '@components/RegularCard'
import Button from '@components/Button'
import { palette } from '@theme/theme'
import { v4 as uuid } from 'uuid'
import { CategoryType } from '@app/dataTypes/CategoryType'
import { CalendarType } from '@app/dataTypes/CalendarType'

import { listCategoriesForEvent, listUserCategories } from '@screens/Category/CategoryHelper'
import { createNewEvent } from '@screens/Calendar/UserCreateCalendarHelper'
import { updateEvent } from '@screens/Calendar/UserEditCalendarHelper'
import { DataStore, SortDirection } from '@aws-amplify/datastore'
import { PrimaryGoalType } from '@app/models/index'
import { getGlobalPrimaryCalendarFunction } from '@screens/Schedule/ScheduleHelper';
import { getEventWithId } from '@app/calendar/calendarDbHelper';
import { ApolloClient, NormalizedCacheObject } from '@apollo/client'


const dark = Appearance.getColorScheme() === 'dark'

type DayKeyType = 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU'


type RecurrenceFrequency = 'daily' | 'weekly'
        | 'monthly' | 'yearly'

const styles = StyleSheet.create({
  day: {
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    width: 50,
  },
  frequency: {
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    width: 50,
  },
  inputField: {
    fontSize: 16,
    lineHeight: 24,
    color:  dark ? palette.white : '#221D23',
    width: '100%',
  },
  container: {
    flex: 1,
  }
})


const DayObject = {
  'MO': Day.MO,
  'TU': Day.TU,
  'WE': Day.WE,
  'TH': Day.TH,
  'FR': Day.FR,
  'SA': Day.SA,
  'SU': Day.SU,
}

const getDay = (value: Day | undefined) => {
  switch(value) {
    case Day.MO:
      return 'MO'
    case Day.TU:
      return 'TU'
    case Day.WE:
      return 'WE'
    case Day.TH:
      return 'TH'
    case Day.FR:
      return 'FR'
    case Day.SA:
      return 'SA'
    case Day.SU:
      return 'SU'
    default:
      return undefined
  }
}

const getGoalName = (goal: PrimaryGoalType) => {
  switch(goal) {
    case PrimaryGoalType.NEWSKILLTYPE:
      return ''
    case PrimaryGoalType.MEDITATION:
      return 'Meditation'
    case PrimaryGoalType.STEP:
      return 'Steps'
    case PrimaryGoalType.STRENGTH:
      return 'Strength: '
    case PrimaryGoalType.ENDURANCE:
      return 'Endurance: '
    case PrimaryGoalType.WEIGHT:
      return 'Weight'
    case PrimaryGoalType.HABITTYPE:
      return ''
    case PrimaryGoalType.LIMITTYPE:
      return ''
  }
}

const scheduleOptions = [
  {
    label: 'Daily',
    value: 'daily'
  },
  {
    label: 'Weekly',
    value: 'weekly'
  },
  {
    label: 'Monthly',
    value: 'monthly'
  }, 
  {
    label: 'Yearly',
    value: 'yearly'
  }
]


type RootNavigationStackParamList = {
  UserProgressActiveComponents: {
    isUpdate?: string,
  },
  UserAddSchedule: undefined,
}

type UserAddScheduleNavigationProp = StackNavigationProp<
  RootNavigationStackParamList,
  'UserAddSchedule'
>
type RootRouteStackParamList = {
  UserAddSchedule: {
    primaryGoalType: PrimaryGoalType,
    secondaryGoalType?: string,
  }
}

type UserAddScheduleRouteProp = RouteProp<
  RootRouteStackParamList,
  'UserAddSchedule'
>

type Props = {
  sub: string,
  route: UserAddScheduleRouteProp,
  client: ApolloClient<NormalizedCacheObject>,
}

function UserAddSchedule(props: Props) {
  const [byWeekDay, setByWeekDay] = useState<DayKeyType[]>([])
  const [MO, setMO] = useState<boolean>(false)
  const [TU, setTU] = useState<boolean>(false)
  const [WE, setWE] = useState<boolean>(false)
  const [TH, setTH] = useState<boolean>(false)
  const [FR, setFR] = useState<boolean>(false)
  const [SA, setSA] = useState<boolean>(false)
  const [SU, setSU] = useState<boolean>(false)
  const [isReminder, setIsReminder] = useState<boolean>(false)
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [duration, setDuration] = useState<number>(30)
  const [tags, setTags] = useState<CategoryType[]>([])
  const [alarms, setAlarms] = useState<number[]>([])
  const [calendar, setCalendar] = useState<CalendarType>()
  const [alarm, setAlarm] = useState<number>(0)
  const [selectedTag, setSelectedTag] = useState<string>(null)
  const [selectedTagObject, setSelectedTagObject] = useState<CategoryType>(null)
  const [selectedTags, setSelectedTags] = useState<CategoryType[]>(null)
  const [activeIndex, setActiveIndex] = useState<number>(0)
  const [completedStep, setCompletedStep] = useState<number | undefined>()
  const [recurringEndDate, setRecurringEndDate] = useState<Date>(dayjs().add(1, 'd').toDate())
  const [eventInterval, setEventInterval] = useState<number>(1)
  const [eventFrequency, setEventFrequency] = useState<RecurrenceFrequency>('weekly')
  const [schedule, setSchedule] = useState<Schedule>()
  const [eventId, setEventId] = useState<string>()
  const [isStartDatePicker, setIsStartDatePicker] = useState<boolean>(false)
  const [isRecurringEndDatePicker, setIsRecurringEndDatePicker] = useState<boolean>(false)

  const dark = useColorScheme() === 'dark'
  const client = props?.client
  const sub = props?.sub
  

  const navigation = useNavigation<UserAddScheduleNavigationProp>()
  const primaryGoalType = props?.route?.params?.primaryGoalType
  const secondaryGoalType = props?.route?.params?.secondaryGoalType
  


  const userIdEl = useRef<string>('')
  
  
    useEffect(() => {
      (async () => {
        try {
          const users = await DataStore.query(User, c => c.sub('eq', sub), {
            limit: 1,
          })
          
          userIdEl.current = users[0].id
        } catch (e) {
          
        }
      })()
    }, [sub])
  
    useFocusEffect(
      useCallback(() => {
        (async () => {
          try {
            const users = await DataStore.query(User, c => c.sub('eq', sub), {
              limit: 1,
            })
            
            userIdEl.current = users[0].id
          } catch (e) {
            
          }
          })()
        }, [sub]
      )
    )
  useEffect(() => {
    (async() => {
      try {
        if (!sub || !client) {
          return
        }
        const results = await listUserCategories(client, sub)
        if (!results?.[0]?.id) {
          
          return
        }
        setTags(results)
      } catch(e) {
        
      }
    })()
  }, [client, sub])

  useFocusEffect(
    useCallback(() => {
      (async() => {
        try {
          if (!sub || !client) {
            return
          }
          const results = await listUserCategories(client, sub)
          if (!results?.[0]?.id) {
            
            return
          }
          setTags(results)
        } catch(e) {
          
        }
      })()
    }, [client, sub])
  )

  useEffect(() => {
    (async () => {
      if (!eventId || !client) {
        return
      }
      const results = await listRemindersForEvent(client, eventId)
        if (!results?.[0]?.id) {
          
          return
        }
        setAlarms(results?.map(r => r.minutes))
      
    })()
  }, [client, eventId])

  useFocusEffect(
    useCallback(() => {
      (async () => {
        if (!eventId || !client) {
          return
        }
        const results = await listRemindersForEvent(client, eventId)
        if (!results?.[0]?.id) {
          
          return
        }
        setAlarms(results?.map(r => r.minutes))
        
      })()
    }, [client, eventId])
  )

  useEffect(() => {
    (async () => {  
      if (!sub || !client) {
        return
      }
      const result = await getGlobalPrimaryCalendarFunction(client, sub)
      if (!result?.id) {
        
        return
      }
      setCalendar(result)
    })()
  }, [client, sub])

  useFocusEffect(
    useCallback(() => {
      (async () => {  
        if (!sub || !client) {
          return
        }
        const result = await getGlobalPrimaryCalendarFunction(client, sub)
        if (!result?.id) {
          
          return
        }
        setCalendar(result)
      })()
    }, [client, sub])
  )

  useEffect(() => {
    (async () => {
      if (!eventId || !client) {
        return
      }

      const event = await getEventWithId(client, eventId)
      if (!event?.id) {
        
        return
      }

      setStartDate(dayjs(event.startDate).toDate() || new Date())
      setDuration(event?.duration || dayjs(event.endDate).diff(dayjs(event.startDate), 'm') || 0)
      setByWeekDay(event?.byWeekDay as DayKeyType[] || [])
      setMO(event?.byWeekDay?.includes('MO') || false)
      setTU(event?.byWeekDay?.includes('TU') || false)
      setWE(event?.byWeekDay?.includes('WE') || false)
      setTH(event?.byWeekDay?.includes('TH') || false)
      setFR(event?.byWeekDay?.includes('FR') || false)
      setSA(event?.byWeekDay?.includes('SA') || false)
      setSU(event?.byWeekDay?.includes('SU') || false)
      setRecurringEndDate(dayjs(event?.recurrenceRule?.endDate).toDate() || new Date())
      setEventFrequency(event?.recurrenceRule?.frequency as RecurrenceFrequency || 'weekly')
      setEventInterval(event?.recurrenceRule?.interval || 1)
      const newSelectedTags = await listCategoriesForEvent(client, event.id)
      if (newSelectedTags?.[0]?.id) {
        setSelectedTags(newSelectedTags)
      }
      const newAlarms = await listRemindersForEvent(client, event.id)
      if (newAlarms?.[0]?.id) {
        setAlarms(newAlarms?.map(r => r.minutes))
        setIsReminder(true)
      }
    })()
  }, [client, eventId])

  useFocusEffect(
    useCallback(() => {
    (async () => {
      if (!eventId || !client) {
        return
      }

      const event = await getEventWithId(client, eventId)
      if (!event?.id) {
        
        return
      }

      setStartDate(dayjs(event.startDate).toDate() || new Date())
      setDuration(event?.duration || dayjs(event.endDate).diff(dayjs(event.startDate), 'm') || 0)
      setByWeekDay(event?.byWeekDay as DayKeyType[] || [])
      setMO(event?.byWeekDay?.includes('MO') || false)
      setTU(event?.byWeekDay?.includes('TU') || false)
      setWE(event?.byWeekDay?.includes('WE') || false)
      setTH(event?.byWeekDay?.includes('TH') || false)
      setFR(event?.byWeekDay?.includes('FR') || false)
      setSA(event?.byWeekDay?.includes('SA') || false)
      setSU(event?.byWeekDay?.includes('SU') || false)
      setRecurringEndDate(dayjs(event?.recurrenceRule?.endDate).toDate() || new Date())
      setEventFrequency(event?.recurrenceRule?.frequency as RecurrenceFrequency || 'weekly')
      setEventInterval(event?.recurrenceRule?.interval || 1)
      const newSelectedTags = await listCategoriesForEvent(client, event.id)
      if (newSelectedTags?.[0]?.id) {
        setSelectedTags(newSelectedTags)
      }
      const newAlarms = await listRemindersForEvent(client, event.id)
      if (newAlarms?.[0]?.id) {
        setAlarms(newAlarms?.map(r => r.minutes))
        setIsReminder(true)
      }
    })()
  }, [client, eventId])
  )

  useEffect(() => {
    (async () => {
      
      if (!primaryGoalType) {
        return
      }

      if (!userIdEl?.current) {
        return
      }
      const oldSchedule = await DataStore.query(Schedule, 
        c => c.primaryGoalType('eq', primaryGoalType)
          .secondaryGoalType('eq', secondaryGoalType)
          .userId('eq', userIdEl?.current)
          .status('eq', Status.ACTIVE),
          {
            limit: 1,
            sort: s => s.date(SortDirection.DESCENDING)
          },
      )
      
      
      if (!oldSchedule?.[0]?.id) {
        
        return
      }
      setSchedule(oldSchedule?.[0])
      setEventId(oldSchedule?.[0]?.eventId)
    })()
  }, [primaryGoalType, secondaryGoalType, userIdEl?.current])

  useFocusEffect(
    useCallback(() => {
      (async () => {
        
        if (!primaryGoalType) {
          return
        }

        if (!userIdEl?.current) {
          return
        }

        const oldSchedule = await DataStore.query(Schedule, 
          c => c.primaryGoalType('eq', primaryGoalType)
            .secondaryGoalType('eq', secondaryGoalType)
            .userId('eq', userIdEl?.current)
            .status('eq', Status.ACTIVE),
            {
              limit: 1,
              sort: s => s.date(SortDirection.DESCENDING)
            },
        )

        
        
        
        if (!oldSchedule?.[0]?.id) {
          
          return
        }
        setSchedule(oldSchedule?.[0])
        setEventId(oldSchedule?.[0]?.eventId)
      })()
    }, [primaryGoalType, secondaryGoalType, userIdEl?.current])
  )

  const hideStartDatePicker = () => setIsStartDatePicker(false)

  const showStartDatePicker = () => setIsStartDatePicker(true)

  const hideRecurringEndDatePicker = () => setIsRecurringEndDatePicker(false)

  const showRecurringEndDatePicker = () => setIsRecurringEndDatePicker(true)

  const onReceiveUpdateTaskScheduleInfo = async () => {
    try {

      if (!schedule?.id) {
        return
      }

      const oldEvent = await getEventWithId(client, schedule.eventId)

      if (!oldEvent) {
        
        return
      }

      await updateEvent(
        schedule?.eventId,
        dayjs(startDate).format(),
        dayjs(startDate).add(duration, 'minute').format(),
        sub,
        client,
        calendar?.id,
        selectedTags?.map(tag => tag.id),
        oldEvent.title,
        false,
        dayjs(recurringEndDate).format(),
        eventFrequency,
        eventInterval,
        alarms,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        true,
        false,
        false,
        false,
        false,
        oldEvent?.timezone || RNLocalize.getTimeZone(),
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
        'opaque',
        'private',
        oldEvent?.id,
        undefined,
        undefined,
        calendar?.colorId,
        oldEvent?.timezone || RNLocalize.getTimeZone(),
        selectedTags?.[0]?.color || oldEvent?.backgroundColor || calendar?.backgroundColor,
        oldEvent?.foregroundColor || calendar?.foregroundColor,
        alarms?.length === 0,
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
        false,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        true,
        undefined,
        true,
        true,
        true,
        undefined,
        true,
        undefined,
        undefined,
        true,
        undefined,
        true,
        true,
        true,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        duration,
        true,
        true,
        'update',
        undefined,
        byWeekDay?.length > 0 ? byWeekDay.map(i => (DayObject[i])) : null,
        undefined,
      )

      const original = await DataStore.query(Schedule, schedule?.id)

      if (!original?.id) {
        
        return
      }

      await DataStore.save(
        Schedule.copyOf(
          original, updated => {
            updated.date = dayjs().toISOString()
          }
        )
      )
      Toast.show({
        type: 'success',
        text1: 'Schedule updated',
        text2: 'Schedule was updated successfully'
      })
      navigation.navigate('UserProgressActiveComponents', {
        isUpdate: uuid(),
      })

      Toast.show({
        text1: 'Schedule updated successfully',
        type: 'success',
      })
    } catch(e) {
      
      Toast.show({
        type: 'error',
        text1: 'Unable to update',
        text2: 'Unable to update schedule due to an internal error'
      })


    }
  }

  const onReceiveCreateTaskScheduleInfo = async () => {
    try {

      if (!primaryGoalType) {
        
        return
      }
      
      const eventId = await createNewEvent(
        dayjs(startDate).format(),
        dayjs(startDate).add(duration, 'minute').format(),
        sub,
        client,
        calendar?.id,
        selectedTags?.map(tag => tag.id),
        `${getGoalName(primaryGoalType)} ${secondaryGoalType}`,
        false,
        dayjs(recurringEndDate).format(),
        eventFrequency,
        eventInterval,
        alarms,
        `${getGoalName(primaryGoalType)} ${secondaryGoalType}`,
        undefined,
        undefined,
        undefined,
        undefined,
        true,
        false,
        false,
        false,
        false,
        RNLocalize.getTimeZone(),
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
        `${getGoalName(primaryGoalType)} ${secondaryGoalType}`,
        'opaque',
        'private',
        undefined,
        undefined,
        undefined,
        calendar?.colorId,
        RNLocalize.getTimeZone(),
        selectedTags?.[0]?.color || calendar?.backgroundColor,
        calendar?.foregroundColor,
        alarms.length === 0,
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
        false,
        undefined,
        undefined,
        true,
        undefined,
        undefined,
        true,
        undefined,
        true,
        true,
        true,
        undefined,
        true,
        undefined,
        undefined,
        true,
        false,
        selectedTags?.length > 0,
        true,
        true,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        duration,
        undefined,
        true,
        'update',
        undefined,
        byWeekDay?.length > 0 ? byWeekDay?.map(i => (DayObject[i])) : null,
        undefined,
      )

      
      
      if (eventId) {
        const newSchedule = await DataStore.save(
          new Schedule({
            primaryGoalType,
            secondaryGoalType,
            status: Status.ACTIVE,
            userId: userIdEl?.current,
            date: dayjs().toISOString(),
            userIdGoal: secondaryGoalType?.length > 0 ? `${userIdEl?.current}#${primaryGoalType}#${secondaryGoalType}` : `${userIdEl?.current}#${primaryGoalType}`,
            eventId,
            ttl: dayjs().add(2, 'y').unix(),
          })
        )
        setSchedule(newSchedule)
      }

      Toast.show({
        type: 'success',
        text1: 'Schedule created',
        text2: 'Schedule was created successfully'
      })

      navigation.navigate('UserProgressActiveComponents', {
        isUpdate: uuid(),
      })
    } catch(e) {
      
      Toast.show({
        type: 'error',
        text1: 'No schedule created',
        text2: 'We are not able to create a schedule due to an internal error.'
      })
      navigation.goBack()
    }
  }


  const onToggleDayChange = (text: 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU') => {
    const index = byWeekDay.findIndex(i => i === text)
     if (index > -1) {
       const newByWeekDay = [
         ...byWeekDay.slice(0, index),
         ...byWeekDay.slice(index + 1),
       ]
       setByWeekDay(newByWeekDay)

     }

     const newByWeekDay = [
       ...byWeekDay,
       text,
     ]

     setByWeekDay(newByWeekDay)
  }

  const onMonday = () => {
    setMO(!MO)
    onToggleDayChange('MO')
  }

  const onTuesday = () => {
    setTU(!TU)
    onToggleDayChange('TU')
  }

  const onWednesday = () => {
    setWE(!WE)
    onToggleDayChange('WE')
  }

  const onThursday = () => {
    setTH(!TH)
    onToggleDayChange('TH')
  }

  const onFriday = () => {
    setFR(!FR)
    onToggleDayChange('FR')
  }

  const onSaturday = () => {
    setSA(!SA)
    onToggleDayChange('SA')
  }

  const onSunday = () => {
    setSU(!SU)
    onToggleDayChange('SU')
  }


  const onActiveIndexChanged = (index: number) => setActiveIndex(index)

  const goToPrevStep = () => {
    const prevActiveIndex = activeIndex

    if (activeIndex === 5) {
      if (!isReminder) {
        const newActiveIndex = 1
        setActiveIndex(newActiveIndex)
        return
      }
    }

    const newActiveIndex = prevActiveIndex === 0 ? 0 : prevActiveIndex - 1
    setActiveIndex(newActiveIndex)
  }

  const renderPrevButton = () => {
    if (activeIndex === 0) {
      return <Box mt={{ phone: 's', tablet: 'm' }}/>
    }

    return (
    <Box ml={{ phone: 's', tablet: 'm' }}>
      <Button onPress={goToPrevStep}>
        Back
      </Button>
    </Box>
  )}

  const goToNextStep = () => {
    const prevActiveIndex = activeIndex
    const prevCompletedStep = completedStep

    if (prevActiveIndex === 5) {
      return
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

  const renderNextPeriodStartButton = () => {
    if (startDate) {
      return (
        <Box mr={{ phone: 's', tablet: 'm' }}>
          <Button onPress={goToNextStep}>
            Next
          </Button>
        </Box>
      )
    }
  }

  const renderNextButton = () => {
    return (
      <Box mr={{ phone: 's', tablet: 'm' }}>
        <Button onPress={goToNextStep}>
          Next
        </Button>
      </Box>
      )
  }

  const createSchedule = async () => {
    try {
      if (dayjs(recurringEndDate).isBefore(startDate)) {
        return Toast.show({
          type: 'error',
          text1: 'Invalid Options',
          text2: 'You seem to ahve selected invalid start date and end date options'
        })
      }

      return  schedule?.id
      ? onReceiveUpdateTaskScheduleInfo()
      : onReceiveCreateTaskScheduleInfo()
    } catch(e) {
      
    }
  }

  const addAlarm = () => {
    const newAlarms = _.uniqWith(alarms.concat([alarm]), _.isEqual)
    setAlarms(newAlarms)
    setAlarm(0)
  }

  const removeAlarm = (index: number) => {
    const newAlarms = alarms.slice(0, index)
      .concat(alarms.slice(index + 1))

    setAlarms(newAlarms)
  }


  const changeSelectedTag = (item: any) => {
        
        setSelectedTag(item.value)
        setSelectedTagObject(tags.find(tag => tag.id === item.value))
  }

  const addTagToTags = () => {
    const newCategories = _.uniqWith((selectedTags || [null]).concat([selectedTagObject || null]), _.isEqual).filter(e => (e !== null))
    setSelectedTags(newCategories)
    setSelectedTag('')
    setSelectedTagObject(undefined)
  }

  const removeTagFromTags = (index: number) => {
    const newCategories = selectedTags.slice(0, index)
      .concat(selectedTags.slice(index + 1))

    setSelectedTags(newCategories)
  }

  const height = useHeaderHeight()

  const renderCurrentStep = () => {
    switch(activeIndex) {
      case 0:
        return (
          <Box flex={1} justifyContent="center">
            <Text textAlign="center" variant="subheaderNormal" mt={{ phone: 's', tablet: 'm' }}>
              Schedule
            </Text>
            <Box flex={1} m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center" style={{ width: '100%' }}>
              <Text textAlign="center" variant="optionHeader" m={{ phone: 's', tablet: 'm' }}>
                Select a start date
              </Text>
              <Pressable onPress={showStartDatePicker}>
                    <Text variant="buttonLink">{dayjs(startDate).format('dddd, MMMM D, h:mm A')}</Text>
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
            <Box flex={1} m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center" style={{ width: '100%' }}>
              <TextField
                title="Duration (minutes)"
                type="numeric"
                onChangeText={(text: string) => setDuration(parseInt(text.replace(/[^0-9.]/g, ''), 10) || 0)}
                value={`${duration}`}
                placeholder="1"
                style={[styles?.inputField, { width: '15%' }]}
              />
            </Box>
            <Box m={{ phone: 's', tablet: 'm' }} flexDirection="row" justifyContent="space-between">
              <Box />
              {renderNextPeriodStartButton()}
            </Box>
          </Box>
        )
      case 1:
        return (
          <Box flex={1} justifyContent="center">
            <Box flex={1} justifyContent="center" alignItems="center">
              <Text textAlign="center" variant="subheaderNormal" mt={{ phone: 's', tablet: 'm' }}>
                Set the schedule
              </Text>
            </Box>
            <Box flex={4} justifyContent="center" alignItems="center">
              <RegularCard>
                <Text textAlign="center" variant="optionHeader" m={{ phone: 's', tablet: 'm' }}>
                  Pick days for the schedule
                </Text>
                <Box width="100%" flexDirection="row" justifyContent="space-evenly" m={{ phone: 's', tablet: 'm' }}>
                  <TouchableOpacity onPress={onMonday} style={[styles.day, { backgroundColor: MO ? palette.purplePrimary : palette.lightGray }]}>
                      <Text variant="optionHeader" style={{color: MO ? palette.white : palette.textBlack }}>
                        MO
                      </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={onTuesday} style={[styles.day, { backgroundColor: TU ? palette.purplePrimary : palette.lightGray }]}>
                      <Text variant="optionHeader" style={{color: TU ? palette.white : palette.textBlack }}>
                        TU
                      </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={onWednesday} style={[styles.day, { backgroundColor: WE ? palette.purplePrimary : palette.lightGray }]}>
                      <Text variant="optionHeader" style={{color: WE ? palette.white : palette.textBlack }}>
                        WE
                      </Text>
                  </TouchableOpacity>
                </Box>
                <Box width="100%" flexDirection="row" justifyContent="space-evenly" m={{ phone: 's', tablet: 'm' }}>
                  <TouchableOpacity onPress={onThursday} style={[styles.day, { backgroundColor: TH ? palette.purplePrimary : palette.lightGray }]}>
                      <Text variant="optionHeader" style={{color: TH ? palette.white : palette.textBlack }}>
                        TH
                      </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={onFriday} style={[styles.day, { backgroundColor: FR ? palette.purplePrimary : palette.lightGray }]}>
                      <Text variant="optionHeader" style={{color: FR ? palette.white : palette.textBlack }}>
                        FR
                      </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={onSaturday} style={[styles.day, { backgroundColor: SA ? palette.purplePrimary : palette.lightGray }]}>
                      <Text variant="optionHeader" style={{color: SA ? palette.white : palette.textBlack }}>
                        SA
                      </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={onSunday} style={[styles.day, { backgroundColor: SU ? palette.purplePrimary : palette.lightGray }]}>
                      <Text variant="optionHeader" style={{color: SU ? palette.white : palette.textBlack }}>
                        SU
                      </Text>
                  </TouchableOpacity>
                </Box>
              </RegularCard>
            </Box>
            <Box flex={1} flexDirection="row" justifyContent="space-between" style={{ width: '100%' }}>
              {renderPrevButton()}
              {renderNextButton()}
            </Box>
          </Box>
        )
      case 2:
        return (
          <Box flex={1}  justifyContent="center">
            <Box flex={1} m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
              <Text m={{ phone: 's', tablet: 'm' }} variant="optionHeader">
                Select how often the activity should recur
              </Text>
              <Picker
                modal
                style={{ color: dark ? palette.white : palette.textBlack }}
                placeholder="Pick a frequency"
                useNativePicker
                migrateTextField
                value={eventFrequency}
                onChange={(itemValue: PickerValue) => {
                  
                  setEventFrequency(itemValue as RecurrenceFrequency)
                }}
              >
                  {_.map(scheduleOptions, option => (
                    <Picker.Item
                      key={option.value}
                      label={option.label}
                      value={option.value}
                    />
                  ))}
              </Picker>
            </Box>
            <Box flex={1} m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
              <Text  m={{ phone: 's', tablet: 'm' }} variant="optionHeader">
                Select the interval between each recurrence (ex: every 2 weeks)
              </Text>
              <TextField
                type="numeric"
                onChangeText={(text: string) => setEventInterval(parseInt(text.replace(/[^0-9.]/g, ''), 10))}
                value={`${eventInterval}`}
                placeholder="1"
                style={{ width: '15%' }}
              />
            </Box>
            <Box flex={1} m={{ phone: 's', tablet: 'm' }}  justifyContent="center" alignItems="center">
              <Text m={{ phone: 's', tablet: 'm' }} variant="optionHeader">
                Select an end date for recurrence
              </Text>
              <Pressable onPress={showRecurringEndDatePicker}>
                  <Text variant="buttonLink">{dayjs(recurringEndDate).format('dddd, MMMM D, h:mm A')}</Text>
              </Pressable>
              <DatePicker
                modal
                open={isRecurringEndDatePicker}
                date={recurringEndDate}
                onConfirm={(date) => {
                      setRecurringEndDate(date)
                      hideRecurringEndDatePicker()
                  }}
                onCancel={() => {
                    hideRecurringEndDatePicker()
                }}
                theme={dark ? 'dark' : 'light'}
              />
            </Box>
            <Box flex={1} flexDirection="row" justifyContent="space-between" alignItems="center" style={{ width: '100%' }}>
              {renderPrevButton()}
              {renderNextButton()}
            </Box>
          </Box>
        )
      case 3:
        return (
          <Box flex={1} justifyContent="center">
            <Box flex={8.5} justifyContent="center">
              <Box flex={0.5} justifyContent="center" alignItems="center">
                <Text variant="optionHeader">
                  Reminders
                </Text>
              </Box>
              <Box flex={2}>
                <FlatList
                  data={alarms}
                  renderItem={({ item, index }) => (
                    <Box flexDirection="row" justifyContent="space-around">
                      <Text variant="optionHeader">
                        {`${item} minutes before`}
                      </Text>
                      <Pressable hitSlop={15} onPress={() => removeAlarm(index)}>
                        <Ionicons name="close" size={24} color={palette.red} />
                      </Pressable>
                    </Box>
                  )}
                  keyExtractor={(item, index) => `${item}-${index}`}
                />
               
              </Box>
              <Box flex={1} justifyContent="center" alignItems="center">
                <Box m={{ phone: 'xs', tablet: 's' }}>
                  <KeyboardAvoidingView
                    keyboardVerticalOffset={height + 64}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.container}
                    >
                        <TextField
                            type="numeric"
                            onChangeText={(text: string) => setAlarm(parseInt(text.replace(/[^0-9.]/g, ''), 10) || 0)}
                            value={`${alarm}`}
                            placeholder="0"
                            style={{ width: '40%' }}
                            title="Reminder"
                        />
                    </KeyboardAvoidingView>
                </Box>
              </Box>
              <Box flex={1} m={{ phone: 'xs', tablet: 's' }} justifyContent="center" alignItems="center">
                  <Button onPress={addAlarm}>
                      Add new reminder
                  </Button>
              </Box>
            </Box>
            <Box flex={1.5} flexDirection="row" justifyContent="space-between">
              {renderPrevButton()}
              {renderNextButton()}
            </Box>
          </Box>
        )
      case 4:
        return (
          <Box flex={1} justifyContent="space-around" alignItems="center">
            <Box flex={1} justifyContent="center" alignItems="center">
                <Text variant="optionHeader">
                    Add tags to this activity
                </Text>
            </Box>
            <Box flex={1} justifyContent="center" alignItems="center">
              <Picker
                placeholder="Select Tags"
                topBarProps={{title: 'Tags'}}
                floatingPlaceholder
                value={selectedTag}
                enableModalBlur={false}
                showSearch
                searchPlaceholder={'Search a tag'}
                searchStyle={{ color: Colors.purple30, placeholderTextColor: Colors.grey50 }}
                onChange={changeSelectedTag}
                style={{ fontSize: 20, lineHeight: 24, width: 150, color: dark ? palette.white : palette.textBlack }}
                >
                  {tags.map((category) => (   
                      <Picker.Item  key={category.id} value={category.id} label={category.name} />
                  ))}
                </Picker>
            </Box>
            <Box flex={2} justifyContent="center" alignItems="center">
                <FlatList
                    data={selectedTags}
                    renderItem={({ item, index }) => (
                        <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%'}}>
                            <Box flexDirection="row" justifyContent="space-between" alignItems="center" style={{ width: '60%'}}>
                                <Text variant="optionHeader">
                                    {item.name}
                                </Text>
                                <Pressable hitSlop={15} onPress={() => removeTagFromTags(index)}>
                                    <Ionicons name="close" size={24} color={palette.red} />
                                </Pressable>
                            </Box>
                        </Box>
                    )}
                    keyExtractor={(item) => item.id}
                />
            </Box>
            <Box flex={1}  justifyContent="center" alignItems="center" style={{ width: '100%'}}>
                <Pressable onPress={addTagToTags}>
                    <Box flex={1} flexDirection="row" justifyContent="space-between" alignItems="center" style={{ width: '10%'}}>
                        <Ionicons name="add" size={24} color={dark ? palette.white : palette.purplePrimary} />
                        <Text variant="buttonLink">
                            Add
                        </Text>
                    </Box>
                </Pressable>
            </Box>
            <Box flex={1} flexDirection="row" justifyContent="space-between" style={{ width: '100%'}}>
              {renderPrevButton()}
              {renderNextButton()}
            </Box>
          </Box>
        )
      case 5:
        return (
          <Box flex={1} justifyContent="space-around" alignItems="center">
            <Box flex={4} justifyContent="center" alignItems="center">
              <Text variant="subheaderNormal" mt={{ phone: 's', tablet: 'm' }}>
                {schedule?.id ? 'Update schedule' : 'Create schedule'}
              </Text>
              <Box p={{ phone: 'm', tablet: 'l' }} />
              <Button m={{ phone: 's', tablet: 'm' }} onPress={createSchedule}>
                {schedule?.id ? 'Update' : 'Create'}
              </Button>
            </Box>
            <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%'}}>
              <Box m={{ phone: 's', tablet: 'm' }} flexDirection="row" justifyContent="flex-start" width="100%">
                {renderPrevButton()}
              </Box>
            </Box>
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
    <Box flex={1}>
      <Wizard testID={'uilib.wizard'} activeIndex={activeIndex} onActiveIndexChanged={onActiveIndexChanged}>
        <Wizard.Step state={getStepState(0)} label={'Set a Schedule'}/>
        <Wizard.Step state={getStepState(1)} label={'Set a Schedule'}/>
        <Wizard.Step state={getStepState(2)} label={'Set a Schedule'}/>
        <Wizard.Step state={getStepState(3)} label={'Set an Alarm'}/>
        <Wizard.Step state={getStepState(4)} label={'Select Tags'}/>
        <Wizard.Step state={getStepState(5)} label={'Create Schedule'}/>
      </Wizard>
      {renderCurrentStep()}
    </Box>
  )

}


export default UserAddSchedule
