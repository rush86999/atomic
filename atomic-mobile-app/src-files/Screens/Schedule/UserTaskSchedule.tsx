import React, { useState, useEffect, Dispatch, SetStateAction } from 'react'
import { TouchableOpacity, StyleSheet, FlatList, useColorScheme, Appearance, Pressable } from 'react-native'
import DatePicker from 'react-native-date-picker'
import {Wizard, TextField} from 'react-native-ui-lib'
import { DataStore } from '@aws-amplify/datastore'
import { v4 as uuid } from 'uuid'
import { dayjs, RNLocalize } from '@app/date-utils'
import Toast from 'react-native-toast-message'

import Ionicons from 'react-native-vector-icons/Ionicons'
import { useNavigation, RouteProp } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'

import { listRemindersForEvent } from '@screens/Calendar/Reminder/ReminderHelper'
import { Picker } from '@react-native-picker/picker'
import _ from 'lodash'
import {
  Day,
  DailyToDo,
  GroceryToDo,
  MasterToDo,
  WeeklyToDo,
} from '@models'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import RegularCard from '@components/RegularCard'
import Button from '@components/Button'
import { palette } from '@theme/theme'

import { CategoryType } from '@app/dataTypes/CategoryType'

import { CalendarType } from '@app/dataTypes/CalendarType'
import { listCategoriesForEvent, listUserCategories } from '@screens/Category/CategoryHelper'
import { createNewEvent } from '@screens/Calendar/UserCreateCalendarHelper'
import { editEventForTask } from '@screens/Progress/Todo/UserTaskHelper2'
import { getEventWithId } from '@app/calendar/calendarDbHelper'
import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import getGlobalPrimaryCalendar from '@app/apollo/gql/getGlobalPrimaryCalendar'



const dark = Appearance.getColorScheme() === 'dark'

type taskType = 'Daily'|'Weekly'|'Master'|'Grocery'

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
    borderColor: dark ? palette.white : palette.textBlack,
    borderWidth: 1,
    width: '100%',
    height: 40,
  },
})

type DayKeyType = 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU'

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

type RootNavigationStackParamList = {
  UserTask: {
    taskType: taskType,
    isUpdate: string | undefined,
  },
  UserTaskSchedule: undefined,
}

type UserTaskScheduleNavigationProp = StackNavigationProp<
  RootNavigationStackParamList,
  'UserTaskSchedule'
>

type RootRouteStackParamList = {
  UserTaskSchedule: {
    taskType: taskType,
    isUpdate?: boolean,
    taskId: string,
  },
}

type UserTaskScheduleRouteProp = RouteProp<
  RootRouteStackParamList,
  'UserTaskSchedule'
>

type Props = {
  sub: string,
  route: UserTaskScheduleRouteProp,
  client: ApolloClient<NormalizedCacheObject>,
}

type deadlineProps = {
  endDate: string,
  addToParentAlarms: () => void,
  removeFromDeadlineAlarms: (index: number) => void,
  setParentAlarm: Dispatch<SetStateAction<number>>,
  
}



function UserTaskSchedule(props: Props) {

  const {
    route,
  } = props

  const taskType = route?.params?.taskType
  const taskId = route?.params?.taskId
  const isUpdate = route?.params?.isUpdate
  const userId = props?.sub
  const client = props?.client
  
  const navigation = useNavigation<UserTaskScheduleNavigationProp>()

  const [days, setDays] = useState<Day[]>([])
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

  const dark = useColorScheme() === 'dark'

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
      if (!taskId || !client) {
        return
      }
      let task: DailyToDo | WeeklyToDo
      if (taskType === 'Daily') {
        task = await DataStore.query(DailyToDo, taskId)
      } else if (taskType === 'Weekly') {
        task = await DataStore.query(WeeklyToDo, taskId)
      }
      if (task?.id) {
        const results = await listRemindersForEvent(client, task?.eventId)
        if (!results?.[0]?.id) {
          
          return
        }
        setAlarms(results?.map(r => r.minutes))
      }
      
    })()
  }, [client, taskId])

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
      setCalendar(result)
    })()
  }, [client, userId])

  useEffect(() => {
    (async () => {
      if (!taskId || !client) {
        return
      }
      let task: DailyToDo | WeeklyToDo
      if (taskType === 'Daily') {
        task = await DataStore.query(DailyToDo, taskId)
      } else if (taskType === 'Weekly') {
        task = await DataStore.query(WeeklyToDo, taskId)
      }
      if (task?.id) {
        const event = await getEventWithId(client, task?.eventId)
        if (!event?.id) {
          
          return
        }

        setStartDate(dayjs(event.startDate).toDate() || new Date())
        setDuration(event?.duration || dayjs(event.endDate).diff(dayjs(event.startDate), 'm') || 0)
        setByWeekDay(event?.byWeekDay as DayKeyType[] || [])
        setDays((event?.byWeekDay.map((i: unknown) => DayObject[i as DayKeyType])) as Day[] || [])
        setMO(event?.byWeekDay.includes('MO') || false)
        setTU(event?.byWeekDay.includes('TU') || false)
        setWE(event?.byWeekDay.includes('WE') || false)
        setTH(event?.byWeekDay.includes('TH') || false)
        setFR(event?.byWeekDay.includes('FR') || false)
        setSA(event?.byWeekDay.includes('SA') || false)
        setSU(event?.byWeekDay.includes('SU') || false)
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
      }
    })()
  }, [client, taskId])

  const updateDailyTaskToStore = async (
    startDate?: string,
    endDate?: string,
    scheduleId?: string,
  ) => {
    try {
      if (!taskId) {
        return
      }
  
      const original = await DataStore.query(DailyToDo, taskId)
  
      if (original) {
        const task = await DataStore.save(
          DailyToDo.copyOf(
            original, updated => {
  
              if ((startDate !== undefined) && (startDate !== original.startDate)) {
                updated.startDate = startDate
              }
  
              if ((endDate !== undefined) && (endDate !== original.endDate)) {
                updated.endDate = endDate
              }
  
              if ((scheduleId !== undefined) && (scheduleId !== original.scheduleId)) {
                updated.scheduleId = scheduleId
                updated.eventId = scheduleId
              }
            }
          )
        )
        
      }
    } catch (e) {
      
    }
  }

  const updateWeeklyTaskToStore = async (
    startDate?: string,
    endDate?: string,
    scheduleId?: string,
  ) => {
    try {
      if (!taskId) {
        return
      }
  
      const original = await DataStore.query(WeeklyToDo, taskId)
  
      if (original) {
        await DataStore.save(
          WeeklyToDo.copyOf(
            original, updated => {
  
              if ((startDate !== undefined) && (startDate !== original.startDate)) {
                updated.startDate = startDate
              }
  
              if ((endDate !== undefined) && (endDate !== original.endDate)) {
                updated.endDate = endDate
              }
  
              if ((scheduleId !== undefined) && (scheduleId !== original.scheduleId)) {
                updated.scheduleId = scheduleId
                updated.eventId = scheduleId
              }
            }
          )
        )
      }
    } catch (e) {
      
    }
  }

  const updateMasterTaskToStore = async (
    startDate?: string,
    endDate?: string,
    scheduleId?: string,
  ) => {
    try {
      if (!taskId) {
        return
      }
  
      const original = await DataStore.query(MasterToDo, taskId)
  
      if (original) {
        await DataStore.save(
          MasterToDo.copyOf(
            original, updated => {
  
              if ((startDate !== undefined) && (startDate !== original.startDate)) {
                updated.startDate = startDate
              }
  
              if ((endDate !== undefined) && (endDate !== original.endDate)) {
                updated.endDate = endDate
              }
  
              if ((scheduleId !== undefined) && (scheduleId !== original.scheduleId)) {
                updated.scheduleId = scheduleId
                updated.eventId = scheduleId
              }
            }
          )
        )
      }
    } catch (e) {
      
    }
  }

  const updateGroceryTaskToStore = async (
    startDate?: string,
    endDate?: string,
    scheduleId?: string,
  ) => {
    try {
      if (!taskId) {
        return
      }
  
      const original = await DataStore.query(GroceryToDo, taskId)
  
      if (original) {
        await DataStore.save(
          GroceryToDo.copyOf(
            original, updated => {
  
              if ((startDate !== undefined) && (startDate !== original.startDate)) {
                updated.startDate = startDate
              }
  
              if ((endDate !== undefined) && (endDate !== original.endDate)) {
                updated.endDate = endDate
              }
  
              if ((scheduleId !== undefined) && (scheduleId !== original.scheduleId)) {
                updated.scheduleId = scheduleId
                updated.eventId = scheduleId
              }
            }
          )
        )
      }
    } catch (e) {
      
    }
  }

  const onReceiveUpdateTaskScheduleInfo = async () => {
    try {

      let originalTask: DailyToDo | WeeklyToDo | MasterToDo | GroceryToDo

      if (taskType === 'Daily') {
        originalTask = await DataStore.query(DailyToDo, taskId)
      } else if (taskType === 'Weekly') {
        originalTask = await DataStore.query(WeeklyToDo, taskId)
      } else if (taskType === 'Master') {
        originalTask = await DataStore.query(MasterToDo, taskId)
      } else if (taskType === 'Grocery') {
        originalTask = await DataStore.query(GroceryToDo, taskId)
      }

      if (!originalTask?.id) {
        
        return
      }

      const oldEvent = await getEventWithId(client, originalTask.eventId)


      if (!oldEvent) {
        
        return
      }

      await editEventForTask(
        originalTask?.eventId,
        dayjs(startDate).format(),
        dayjs(startDate).add(duration, 'minute').format(),
        userId,
        client,
        calendar?.id,
        selectedTags.map(tag => tag.id),
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
        taskId,
        taskType,
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
        taskType === 'Daily',
        taskType === 'Weekly',
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
        byWeekDay.map(i => (DayObject[i])),
        undefined,
      )

      if (taskType === 'Daily') {
        await updateDailyTaskToStore(
          dayjs(startDate).format(),
          dayjs(startDate).add(duration, 'minute').format(),
          oldEvent.id,
        )
      } else if (taskType === 'Weekly') {
        await updateWeeklyTaskToStore(
          dayjs(startDate).format(),
          dayjs(startDate).add(duration, 'minute').format(),
          oldEvent.id,
        )
      } else if (taskType === 'Master') {
        await updateMasterTaskToStore(
          dayjs(startDate).format(),
          dayjs(startDate).add(duration, 'minute').format(),
          oldEvent.id,
        )
      } else if (taskType === 'Grocery') {
        await updateGroceryTaskToStore(
          dayjs(startDate).format(),
          dayjs(startDate).add(duration, 'minute').format(),
          oldEvent.id,
        )
      }

      navigation.navigate('UserTask', {
        taskType,
        isUpdate: uuid(),
      })

    } catch(e) {
      Toast.show({
        type: 'error',
        text1: 'Unable to update',
        text2: 'Unable to update schedule due to an internal error'
      })

      navigation.navigate('UserTask', {
        taskType,
        isUpdate: undefined,
      })

    }
  }

  const onReceiveCreateTaskScheduleInfo = async () => {
    try {

      if (!taskId) {
        return
      }

      let originalTask: DailyToDo | WeeklyToDo | MasterToDo | GroceryToDo

      if (taskType === 'Daily') {
        originalTask = await DataStore.query(DailyToDo, taskId)
      } else if (taskType === 'Weekly') {
        originalTask = await DataStore.query(WeeklyToDo, taskId)
      } else if (taskType === 'Master') {
        originalTask = await DataStore.query(MasterToDo, taskId)
      } else if (taskType === 'Grocery') {
        originalTask = await DataStore.query(GroceryToDo, taskId)
      }

      if (!originalTask?.id) {
        
        return
      }

      const eventId = await createNewEvent(
        dayjs(startDate).format(),
        dayjs(startDate).add(duration, 'minute').format(),
        userId,
        client,
        calendar?.id,
        selectedTags.map(tag => tag.id),
        originalTask?.notes,
        false,
        dayjs(recurringEndDate).format(),
        eventFrequency,
        eventInterval,
        alarms,
        originalTask?.notes,
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
        taskId,
        taskType,
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
        originalTask?.notes,
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
        taskType === 'Daily',
        taskType === 'Weekly',
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
        byWeekDay.map(i => (DayObject[i])),
        undefined,
      )
      
      if (eventId) {
        if (taskType === 'Daily') {
          await updateDailyTaskToStore(
            dayjs(startDate).format(),
            dayjs(startDate).add(duration, 'minute').format(),
            `${eventId}#${calendar?.id}`,
          )
        } else if (taskType === 'Weekly') {
          await updateWeeklyTaskToStore(
            dayjs(startDate).format(),
            dayjs(startDate).add(duration, 'minute').format(),
            `${eventId}#${calendar?.id}`,
          )
        } else if (taskType === 'Master') {
          await updateMasterTaskToStore(
            dayjs(startDate).format(),
            dayjs(startDate).add(duration, 'minute').format(),
            `${eventId}#${calendar?.id}`,
          )
        } else if (taskType === 'Grocery') {
          await updateGroceryTaskToStore(
            dayjs(startDate).format(),
            dayjs(startDate).add(duration, 'minute').format(),
            `${eventId}#${calendar?.id}`,
          )
        }
      }
      navigation.navigate('UserTask', {
        taskType,
        isUpdate: uuid(),
      })
    } catch(e) {
      Toast.show({
        type: 'error',
        text1: 'No schedule created',
        text2: 'We are not able to create a schedule due to an internal error.'
      })
      navigation.navigate('UserTask', {
        taskType,
        isUpdate: undefined,
      })
    }
  }

  const onActiveIndexChanged = (index: number) => setActiveIndex(index)

  const goToPrevStep = () => {
    const prevActiveIndex = activeIndex

    if (activeIndex === 6) {
      if (!isReminder) {
        const newActiveIndex = 2
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
    <Box mt={{ phone: 's', tablet: 'm' }}>
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

  function renderNextButton(): JSX.Element {
    return (
      <Box mt={{ phone: 's', tablet: 'm' }}>
        <Button onPress={goToNextStep}>
          Next
        </Button>
      </Box>
    )
  }

  const renderNextPeriodStartButton = () => {
    if (startDate) {
      return (
        <Box mt={{ phone: 's', tablet: 'm' }}>
          <Button onPress={goToNextStep}>
            Next
          </Button>
        </Box>
      )
    }
  }

  const onToggleDayChange = (text: 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU') => {
    const index = days.findIndex(i => getDay(i) === text)
     if (index > -1) {
       const newDays = [
         ...days.slice(0, index),
         ...days.slice(index + 1),
       ]

       setDays(newDays as [Day?, Day?, Day?, Day?, Day?, Day?, Day?])

       return setByWeekDay(newDays as [Day?, Day?, Day?, Day?, Day?, Day?, Day?])


     }

     const newDays = [
       ...days,
       DayObject[text],
     ]

     setDays(newDays as [Day?, Day?, Day?, Day?, Day?, Day?, Day?])

     return setByWeekDay(newDays as [Day?, Day?, Day?, Day?, Day?, Day?, Day?])
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

  const createSchedule = async () => {
    try {
      if (dayjs(recurringEndDate).isBefore(startDate)) {
        return Toast.show({
          type: 'error',
          text1: 'Invalid Options',
          text2: 'You seem to ahve selected invalid start date and end date options'
        })
      }

      return  isUpdate
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

  const changeSelectedTag = (value: string) => {
    setSelectedTag(value)
    setSelectedTagObject(tags.find(tag => tag.name === value))
  }

  const addTagToTags = () => {
    const newCategories = _.uniqWith(selectedTags.concat([selectedTagObject]), _.isEqual)
    setSelectedTags(newCategories)
    setSelectedTag('')
    setSelectedTagObject(undefined)
  }

  const removeTagFromTags = (index: number) => {
    const newCategories = selectedTags.slice(0, index)
      .concat(selectedTags.slice(index + 1))

    setSelectedTags(newCategories)
  }

  const renderCurrentStep = () => {
    switch(activeIndex) {
      case 0:
        return (
          <Box flex={1} justifyContent="center">
            <Text variant="header" mt={{ phone: 's', tablet: 'm' }}>
              Task Schedule
            </Text>
            <Text textAlign="center" variant="optionHeader" m={{ phone: 's', tablet: 'm' }}>
              Select a start date for task
            </Text>
            <DatePicker
              date={startDate}
              onDateChange={setStartDate}
              theme={dark ? 'dark' : 'light'}
            />
            <Box flexDirection="row" justifyContent="space-around" alignItems="center">
              <Text variant="optionHeader">
                Duration (minutes)
              </Text>
              <TextField
                type="numeric"
                onChangeText={(text: string) => setDuration(parseInt(text.replace(/[^0-9.]/g, ''), 10))}
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
            <Text textAlign="center" variant="header" mt={{ phone: 's', tablet: 'm' }}>
              Set the schedule
            </Text>
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
            <Box m={{ phone: 's', tablet: 'm' }} flexDirection="row" justifyContent="space-between">
              {renderPrevButton()}
              {renderNextButton()}
            </Box>
          </Box>
        )
      case 2:
        return (
          <Box flex={1}  justifyContent="center">
            <Box m={{ phone: 's', tablet: 'm' }}>
              <Text variant="optionHeader">
                Select how often the task should recur
              </Text>
              <Picker
                selectedValue={eventFrequency}
                onValueChange={setEventFrequency}
                style={{ height: 100, width: '50%', color: dark ? palette.white : palette.textBlack }}
              >
                  <Picker.Item color={dark ? palette.white : palette.textBlack}  key="daily" value="daily" label="Daily" />
                  <Picker.Item color={dark ? palette.white : palette.textBlack}  key="weekly" value="weekly" label="Weekly" />
                  <Picker.Item color={dark ? palette.white : palette.textBlack}  key="monthly" value="monthly" label="Monthly" />
                  <Picker.Item color={dark ? palette.white : palette.textBlack}  key="yearly" value="yearly" label="Yearly" />
              </Picker>
            </Box>
            <Box m={{ phone: 's', tablet: 'm' }}>
              <Text variant="optionHeader">
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
            <Box m={{ phone: 's', tablet: 'm' }}>
              <Text variant="optionHeader">
                Select an end date for Recurrence
              </Text>
              <DatePicker
                date={recurringEndDate}
                onDateChange={setRecurringEndDate}
                theme={dark ? 'dark' : 'light'}
              />
            </Box>
            <Box m={{ phone: 's', tablet: 'm' }} flexDirection="row" justifyContent="space-between">
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
                <Box flexDirection="row" justifyContent="space-around" alignItems="center">
                  <TextField
                    type="numeric"
                    onChangeText={(text: string) => setAlarm(parseInt(text.replace(/[^0-9.]/g, ''), 10))}
                    value={`${alarm}`}
                    placeholder="0"
                    style={{ width: '15%' }}
                  />
                  <Button onPress={addAlarm}>
                    Add
                  </Button>
                </Box>
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
            <Box flex={1}>
                <Text variant="optionHeader">
                    Tags
                </Text>
            </Box>
            <Box flex={1} justifyContent="center" alignItems="center">
                <Picker
                    selectedValue={selectedTag}
                    onValueChange={changeSelectedTag}
                    style={{ height: 100, width: '50%', color: dark ? palette.white : palette.textBlack }}
                >
                    {tags.map((category) => (   
                        <Picker.Item color={dark ? palette.white : palette.textBlack} key={category.id} value={category.name} label={category.name} />
                    ))}
                </Picker>
            </Box>
            <Box flex={1}>
                <Text variant="optionHeader">
                    Add tags to this event
                </Text>
            </Box>
            <Box flex={6} justifyContent="center" alignItems="center">
                <Button onPress={addTagToTags}>
                    Add
                </Button>
                <FlatList
                    data={selectedTags}
                    renderItem={({ item, index }) => (
                        <Box flexDirection="row" alignItems="center">
                            <Text variant="optionHeader">
                                {item.name}
                            </Text>
                            <Pressable hitSlop={15} onPress={() => removeTagFromTags(index)}>
                                <Ionicons name="close" size={24} color={palette.red} />
                            </Pressable>
                        </Box>
                    )}
                    keyExtractor={(item) => item.id}
                />
            </Box>
            <Box flex={1} flexDirection="row" justifyContent="space-between">
              {renderPrevButton()}
              {renderNextButton()}
            </Box>
          </Box>
        )
      case 5:
        return (
          <Box flex={1} justifyContent="space-around" alignItems="center">
            <Text variant="header" mt={{ phone: 's', tablet: 'm' }}>
              Create the schedule?
            </Text>
            <Button m={{ phone: 's', tablet: 'm' }} onPress={createSchedule}>
              Create Schedule
            </Button>
            <Box m={{ phone: 's', tablet: 'm' }} flexDirection="row" justifyContent="flex-start" width="100%">
              {renderPrevButton()}
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

export default UserTaskSchedule
