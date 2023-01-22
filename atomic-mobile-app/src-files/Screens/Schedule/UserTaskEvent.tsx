import React, { useState, useEffect } from 'react'
import { FlatList, useColorScheme, StyleSheet, Appearance, Pressable } from 'react-native'
import DatePicker from 'react-native-date-picker'
import {TextField, Wizard} from 'react-native-ui-lib'
import { v4 as uuid } from 'uuid'
import { dayjs, RNLocalize } from '@app/date-utils'
import Toast from 'react-native-toast-message'

import Ionicons from 'react-native-vector-icons/Ionicons'
import { useNavigation, RouteProp } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { DataStore } from '@aws-amplify/datastore'

import { listRemindersForEvent } from '@screens/Calendar/Reminder/ReminderHelper'
import { Picker } from '@react-native-picker/picker'
import _ from 'lodash'

import Box from '@components/common/Box'
import Text from '@components/common/Text'
import Button from '@components/Button'
import { palette } from '@theme/theme'

import {
  DailyToDo,
  GroceryToDo,
  MasterToDo,
  WeeklyToDo,
} from '@models'


import { CategoryType } from '@app/dataTypes/CategoryType'
import { CalendarType } from '@app/dataTypes/CalendarType'
import { listCategoriesForEvent, listUserCategories } from '@screens/Category/CategoryHelper'
import { createNewEvent } from '@screens/Calendar/UserCreateCalendarHelper'
import { editEventForTask } from '@screens/Progress/Todo/UserTaskHelper2'
import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { getGlobalPrimaryCalendarFunction } from '@screens/Schedule/ScheduleHelper';
import { getEventWithId } from '../../calendar/calendarDbHelper';

const dark = Appearance.getColorScheme() === 'dark'

const styles = StyleSheet.create({
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

type taskType = 'Daily'|'Weekly'|'Master'|'Grocery'


type RootNavigationStackParamList = {
  UserTask: {
    taskType: taskType,
    isUpdate?: string,
  },
  UserTaskEvent: undefined,
}

type UserTaskEventNavigationProp = StackNavigationProp<
  RootNavigationStackParamList,
  'UserTaskEvent'
>

type RootRouteStackParamList = {
  UserTaskEvent: {
    taskType: taskType,
    isUpdate?: boolean,
    taskId: string,
  },
}

type UserTaskEventRouteProp = RouteProp<
  RootRouteStackParamList,
  'UserTaskEvent'
>

type eventProps = {
  sub: string,
  route: UserTaskEventRouteProp,
  client: ApolloClient<NormalizedCacheObject>,
}


function UserTaskEvent(props: eventProps) {
  const {
    route,
  } = props

  const taskType = route?.params?.taskType
  const taskId = route?.params?.taskId
  const isUpdate = route?.params?.isUpdate
  const client = props?.client

  const [activeIndex, setActiveIndex] = useState<number>(0)
  const [completedStep, setCompletedStep] = useState<number | undefined>()
  const [startDate, setStartDate] = useState<Date>(dayjs().toDate())
  const [duration, setDuration] = useState<number>(30)
  const [tags, setTags] = useState<CategoryType[]>([])
  const [alarms, setAlarms] = useState<number[]>([])
  const [calendar, setCalendar] = useState<CalendarType>()
  const [alarm, setAlarm] = useState<number>(0)
  const [selectedTag, setSelectedTag] = useState<string>(null)
  const [selectedTagObject, setSelectedTagObject] = useState<CategoryType>(null)
  const [selectedTags, setSelectedTags] = useState<CategoryType[]>(null)
  
  const dark = useColorScheme() === 'dark'
  const userId = props?.sub
  const navigation = useNavigation<UserTaskEventNavigationProp>()

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
      let task: DailyToDo | WeeklyToDo | MasterToDo | GroceryToDo
      if (taskType === 'Daily') {
        task = await DataStore.query(DailyToDo, taskId)
      } else if (taskType === 'Weekly') {
        task = await DataStore.query(WeeklyToDo, taskId)
      } else if (taskType === 'Master') {
        task = await DataStore.query(MasterToDo, taskId)
      } else if (taskType === 'Grocery') {
        task = await DataStore.query(GroceryToDo, taskId)
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
      const result = await getGlobalPrimaryCalendarFunction(client, userId)
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
      let task: DailyToDo | WeeklyToDo | MasterToDo | GroceryToDo
      if (taskType === 'Daily') {
        task = await DataStore.query(DailyToDo, taskId)
      } else if (taskType === 'Weekly') {
        task = await DataStore.query(WeeklyToDo, taskId)
      } else if (taskType === 'Master') {
        task = await DataStore.query(MasterToDo, taskId)
      } else if (taskType === 'Grocery') {
        task = await DataStore.query(GroceryToDo, taskId)
      }

      if (task?.id) {
        const event = await getEventWithId(client, task?.eventId)
        if (!event?.id) {
          
          return
        }

        setStartDate(dayjs(event.startDate).toDate())
        setDuration(event.duration || dayjs(event.endDate).diff(dayjs(event.startDate), 'minutes'))

        const newSelectedTags = await listCategoriesForEvent(client, event.id)
        if (newSelectedTags?.[0]?.id) {
          setSelectedTags(newSelectedTags)
        }
        const newAlarms = await listRemindersForEvent(client, event.id)
        if (newAlarms?.[0]?.id) {
          setAlarms(newAlarms?.map(r => r.minutes))
        }
      }
    })()
  }, [client, taskId])

  const updateDailyTaskToStore = async (
    startDate?: string,
    endDate?: string,
    eventId?: string,
  ) => {

    if (!taskId) {
      return
    }

    const original = await DataStore.query(DailyToDo, taskId)

    if (original) {
      await DataStore.save(
        DailyToDo.copyOf(
          original, updated => {

            if ((startDate !== undefined) && (startDate !== original.startDate)) {
              updated.startDate = startDate
            }

            if ((endDate !== undefined) && (endDate !== original.endDate)) {
              updated.endDate = endDate
            }

            if ((eventId !== undefined) && (eventId !== original.eventId)) {
              updated.eventId = eventId
            }

            updated.event = true

          }
        )
      )
    }
  }

  const updateWeeklyTaskToStore = async (
    startDate?: string,
    endDate?: string,
    eventId?: string,
  ) => {

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

            if ((eventId !== undefined) && (eventId !== original.eventId)) {
              updated.eventId = eventId
            }

            updated.event = true
          }
        )
      )
    }
  }

  const updateMasterTaskToStore = async (
    startDate?: string,
    endDate?: string,
    eventId?: string,
  ) => {

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

            if ((eventId !== undefined) && (eventId !== original.eventId)) {
              updated.eventId = eventId
            }

            updated.event = true
          }
        )
      )
    }
  }

  const updateGroceryTaskToStore = async (
    startDate?: string,
    endDate?: string,
    eventId?: string,
  ) => {
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

            if ((eventId !== undefined) && (eventId !== original.eventId)) {
              updated.eventId = eventId
            }

            updated.event = true
          }
        )
      )
    }
  }

  const onReceiveCreateEvent = async () => {
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
        selectedTags.map(t => t.id),
        originalTask.notes,
        false,
        undefined,
        undefined,
        undefined,
        alarms,
        originalTask.notes,
        undefined,
        false,
        false,
        false,
        true,
        false,
        false,
        false,
        false,
        RNLocalize.getTimeZone(),
        originalTask.id,
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
        originalTask.notes,
        'opaque',
        'private',
        undefined,
        undefined,
        undefined,
        calendar?.colorId,
        undefined,
        selectedTags?.[0]?.color || calendar.backgroundColor,
        calendar.foregroundColor,
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
        undefined,
        true,
        'update',
        undefined,
        undefined,
        undefined,
      )

      if (eventId) {
        if (taskType === 'Daily') {
          await updateDailyTaskToStore(dayjs(startDate).format(), dayjs(startDate).add(duration, 'minute').format(), `${eventId}#${calendar?.id}`)
        } else if (taskType === 'Weekly') {
          await updateWeeklyTaskToStore(dayjs(startDate).format(), dayjs(startDate).add(duration, 'minute').format(), `${eventId}#${calendar?.id}`)
        } else if (taskType === 'Master') {
          await updateMasterTaskToStore(dayjs(startDate).format(), dayjs(startDate).add(duration, 'minute').format(), `${eventId}#${calendar?.id}`)
        } else if (taskType === 'Grocery') {
          await updateGroceryTaskToStore(dayjs(startDate).format(), dayjs(startDate).add(duration, 'minute').format(), `${eventId}#${calendar?.id}`)
        }
      }

      Toast.show({
        type: 'success',
        text1: 'Task Event Created',
        text2: 'Task event created successfully',
      })
    
      navigation.navigate('UserTask', {
        taskType,
        isUpdate: uuid(),
      })
    } catch(e) {
      
      Toast.show({
        type: 'error',
        text1: 'No event created',
        text2: 'We are not able to create the event for task due to an internal error.'
      })
      navigation.navigate('UserTask', {
        taskType,
        isUpdate: undefined,
      })
    }
  }

  const onReceiveUpdateEvent = async ( ) => {
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
        selectedTags.map(t => t.id),
        originalTask.notes,
        false,
        undefined,
        undefined,
        undefined,
        alarms,
        originalTask.notes,
        undefined,
        false,
        false,
        false,
        true,
        false,
        false,
        false,
        false,
        RNLocalize.getTimeZone(),
        originalTask.id,
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
        originalTask.notes,
        'opaque',
        'private',
        undefined,
        undefined,
        undefined,
        calendar?.colorId,
        undefined,
        selectedTags?.[0]?.color || oldEvent?.backgroundColor || calendar?.backgroundColor,
        calendar.foregroundColor,
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
        undefined,
        true,
        'update',
        undefined,
        undefined,
        undefined,
      )
      
      if (taskType === 'Daily') {
        await updateDailyTaskToStore(dayjs(startDate).format(), dayjs(startDate).add(duration, 'minute').format(), originalTask.eventId)
      } else if (taskType === 'Weekly') {
        await updateWeeklyTaskToStore(dayjs(startDate).format(), dayjs(startDate).add(duration, 'minute').format(), originalTask.eventId)
      } else if (taskType === 'Master') {
        await updateMasterTaskToStore(dayjs(startDate).format(), dayjs(startDate).add(duration, 'minute').format(), originalTask.eventId)
      } else if (taskType === 'Grocery') {
        await updateGroceryTaskToStore(dayjs(startDate).format(), dayjs(startDate).add(duration, 'minute').format(), originalTask.eventId)
      }
      
      navigation.navigate('UserTask', {
        taskType,
        isUpdate: uuid(),
      })
   } catch(e) {
     
     Toast.show({
       type: 'error',
       text1: 'Unable to update',
       text2: 'Unable to update deadline due to an internal error'
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

    if (prevActiveIndex === 3) {
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

  const renderNextButton = () => {
    return (
      <Box mt={{ phone: 's', tablet: 'm' }}>
        <Button onPress={goToNextStep}>
          Next
        </Button>
      </Box>
    )
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

  const onSubmitPress = () => {
    try {


      return isUpdate
        ? onReceiveUpdateEvent()
        : onReceiveCreateEvent()
    } catch(e) {
      
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

  const renderCurrentStep = () => {
    switch(activeIndex) {
      case 0:
        return (
          <Box flex={1} justifyContent="center">
            <Text variant="header" mt={{ phone: 's', tablet: 'm' }}>
              Add a task period
            </Text>
            <Text textAlign="center" variant="optionHeader" m={{ phone: 's', tablet: 'm' }}>
              Select a start date for task
            </Text>
            <DatePicker
              date={startDate}
              onDateChange={setStartDate}
              textColor={dark ? palette.white : palette.textBlack}
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
            <Box flexDirection="row" justifyContent="space-between">
              <Box />
              {renderNextButton()}
            </Box>
          </Box>
        )
      case 1:
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
      case 2:
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
      case 3:
        return (
          <Box flex={1} justifyContent="space-around" alignItems="center">
            <Text variant="header" mt={{ phone: 's', tablet: 'm' }}>
              Create the event?
            </Text>
            <Button m={{ phone: 's', tablet: 'm' }} onPress={onSubmitPress}>
              Create Event
            </Button>
            <Box flexDirection="row" justifyContent="flex-start" width="100%">
              {renderPrevButton()}
            </Box>
          </Box>
        )
    }
  }


  return (
    <Box flex={1}>
      <Wizard testID={'uilib.wizard'} activeIndex={activeIndex} onActiveIndexChanged={onActiveIndexChanged}>
        <Wizard.Step state={getStepState(0)} label={'Add a Period'}/>
        <Wizard.Step state={getStepState(1)} label={'Add a Period'}/>
        <Wizard.Step state={getStepState(2)} label={'Add Event Alarms'}/>
        <Wizard.Step state={getStepState(3)} label={'Create Event'}/>
      </Wizard>
      {renderCurrentStep()}
    </Box>
  )

}

export default UserTaskEvent
