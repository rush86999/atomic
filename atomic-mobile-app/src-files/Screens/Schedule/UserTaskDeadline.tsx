import React, { useState, useEffect } from 'react'
import { FlatList, useColorScheme, Appearance, StyleSheet, Pressable, KeyboardAvoidingView, Platform } from 'react-native'
import DatePicker from 'react-native-date-picker'
import { useHeaderHeight } from '@react-navigation/elements'
import { PickerValue, TextField, Wizard, Picker, Colors } from 'react-native-ui-lib'
import { v4 as uuid } from 'uuid'
import { dayjs, RNLocalize } from '@app/date-utils'
import Toast from 'react-native-toast-message'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { useNavigation, RouteProp } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { DataStore } from '@aws-amplify/datastore'

import Box from '@components/common/Box'
import Text from '@components/common/Text'
import Button from '@components/Button'
import { palette } from '@theme/theme'

import {
  DailyToDo,
  WeeklyToDo,
} from '@models'


import { DeadlineType } from '@screens/Progress/Todo/UserTask'

import { CategoryType } from '@app/dataTypes/CategoryType'
import { createDeadlineForTask, editEventForTask, submitCalendarForQueue } from '@screens/Progress/Todo/UserTaskHelper2'
import { listCategoriesForEvent, listUserCategories } from '@screens/Category/CategoryHelper'

import { CalendarType } from '@app/dataTypes/CalendarType'
import { listRemindersForEvent } from '@screens/Calendar/Reminder/ReminderHelper'
import _ from 'lodash'
import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { getGlobalPrimaryCalendarFunction } from '@screens/Schedule/ScheduleHelper';
import { getEventWithId } from '@app/calendar/calendarDbHelper'
import { EventType } from '@app/dataTypes/EventType';


const dark = Appearance.getColorScheme() === 'dark'

const styles = StyleSheet.create({
  inputField: {
    fontSize: 16,
    lineHeight: 24,
    color:  dark ? palette.white : '#221D23',
    width: '100%',
  },
  container: {
    flex: 1,
  },
})

export type taskType = 'Daily'|'Weekly'



type RootNavigationStackParamList = {
  UserTask: {
    taskType: taskType,
    isUpdate?: string,
  },
  UserTaskDeadline: undefined,
}

type UserTaskDeadlineNavigationProp = StackNavigationProp<
  RootNavigationStackParamList,
  'UserTaskDeadline'
>

type RootRouteStackParamList = {
  UserTaskDeadline: {
    taskType: taskType,
    isUpdate?: boolean,
    taskId: string,
    deadlineType: 'soft' | 'hard'
  },
}

type UserTaskDeadlineRouteProp = RouteProp<
  RootRouteStackParamList,
  'UserTaskDeadline'
>

type deadlineProps = {
  sub: string,
  route: UserTaskDeadlineRouteProp,
  client: ApolloClient<NormalizedCacheObject>,
}

const deadlineOptions = [
  {
    label: 'Soft Deadline',
    value: 'soft',
  },
  {
    label: 'Hard Deadline',
    value: 'hard',
  }
]

function UserTaskDeadline(props: deadlineProps) {
  const {
    route,
  } = props

  const taskType = route?.params?.taskType
  const taskId = route?.params?.taskId
  const isUpdate = route?.params?.isUpdate
  const deadlineType = route?.params?.deadlineType
  const client = props?.client
 
  const [activeIndex, setActiveIndex] = useState<number>(0)
  const [completedStep, setCompletedStep] = useState<number | undefined>()

  const [newPriority, setNewPriority] = useState<number>(1)
  const [newDeadline, setNewDeadline] = useState<Date>(new Date())
  const [newDeadlineType, setNewDeadlineType] = useState<DeadlineType>(deadlineType || 'soft')
  const [newDuration, setNewDuration] = useState<number>(30)
  const [tags, setTags] = useState<CategoryType[]>([])
  const [alarms, setAlarms] = useState<number[]>([])
  const [calendar, setCalendar] = useState<CalendarType>()
  const [alarm, setAlarm] = useState<number>(0)
  const [selectedTag, setSelectedTag] = useState<string>(null)
  const [selectedTagObject, setSelectedTagObject] = useState<CategoryType>(null)
  const [selectedTags, setSelectedTags] = useState<CategoryType[]>()
  const [isDeadlineDatePicker, setIsDeadlineDatePicker] = useState<boolean>(false)
  const [event, setEvent] = useState<EventType>()
  
  const dark = useColorScheme() === 'dark'
  const userId = props?.sub
  const navigation = useNavigation<UserTaskDeadlineNavigationProp>()

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
      let task: DailyToDo | WeeklyToDo
      if (taskType === 'Daily') {
        task = await DataStore.query(DailyToDo, taskId)
      } else if (taskType === 'Weekly') {
        task = await DataStore.query(WeeklyToDo, taskId)
      }
      if (task?.id) {
        const oldEvent = await getEventWithId(client, task?.eventId)
        if (!oldEvent?.id) {
          
          return
        }
        
        
        
        setEvent(oldEvent)
        setNewPriority(oldEvent.priority)
        setNewDeadline((oldEvent?.softDeadline && dayjs(oldEvent?.softDeadline).tz(oldEvent?.timezone || RNLocalize.getTimeZone(), true).toDate()) || (oldEvent?.hardDeadline && dayjs(oldEvent?.hardDeadline).tz(oldEvent?.timezone || RNLocalize.getTimeZone()).toDate()) || new Date())
        setNewDeadlineType(oldEvent?.softDeadline ? 'soft' : 'hard')
        setNewDuration(oldEvent?.duration || 0)
        const newSelectedTags = await listCategoriesForEvent(client, oldEvent.id)
        
        if (newSelectedTags?.[0]?.id) {
          setSelectedTags(newSelectedTags)
        }
        const newAlarms = await listRemindersForEvent(client, oldEvent.id)
        
        if (newAlarms?.[0]?.id) {
          setAlarms(newAlarms?.map(r => r.minutes))
        }
      }
    })()
  }, [client, taskId])

  const onChangePriority = (value: string = '1') => {
        const intValue = parseInt(value.replace(/[^0-9.]/g, ''), 10)
        if (intValue < 1) {
        setNewPriority(1)
        return
        }

        if (isNaN(intValue)) {
        setNewPriority(1)
        return
        }

        setNewPriority(parseInt(value.replace(/[^0-9.]/g, ''), 10) || 1)
    }

  const updateDailyTaskToStore = async (
    duration?: number,
    softDeadline?: string,
    hardDeadline?: string,
  ) => {

    if (!taskId) {
      return
    }

    const original = await DataStore.query(DailyToDo, taskId)

    if (original) {
      await DataStore.save(
        DailyToDo.copyOf(
          original, updated => {

            if (duration > 0) {
              updated.duration = duration
            }

            if ((softDeadline !== undefined) && (softDeadline !== original.softDeadline)) {
              updated.softDeadline = softDeadline
            }

            if ((hardDeadline !== undefined) && (hardDeadline !== original.hardDeadline)) {
              updated.hardDeadline = hardDeadline
            }
          }
        )
      )
    }
  }

  const updateWeeklyTaskToStore = async (
    duration?: number,
    softDeadline?: string,
    hardDeadline?: string,
  ) => {

    if (!taskId) {
      return
    }

    const original = await DataStore.query(WeeklyToDo, taskId)

    if (original) {
      await DataStore.save(
        WeeklyToDo.copyOf(
          original, updated => {

            if (duration > 0) {
              updated.duration = duration
            }

            if ((softDeadline !== undefined) && (softDeadline !== original.softDeadline)) {
              updated.softDeadline = softDeadline
            }

            if ((hardDeadline !== undefined) && (hardDeadline !== original.hardDeadline)) {
              updated.hardDeadline = hardDeadline
            }
          }
        )
      )
    }
  }


  const onReceiveCreateDeadline = async () => {
    try {

      if (!taskId) {
        return
      }

      let originalTask: DailyToDo | WeeklyToDo
      if (taskType === 'Daily') {
        originalTask = await DataStore.query(DailyToDo, taskId)
      } else if (taskType === 'Weekly') {
        originalTask = await DataStore.query(WeeklyToDo, taskId)
      }

      if (!originalTask) {
        return
      }

      const eventId = await createDeadlineForTask(
        client,
        userId,
        originalTask?.notes,
        newDuration,
        taskId,
        taskType,
        newPriority,
        newDeadlineType === 'soft' ? dayjs(newDeadline).format() : undefined,
        newDeadlineType === 'hard' ? dayjs(newDeadline).format() : undefined,
        alarms,
        selectedTags?.map(tag => tag.id),
        calendar.colorId,
        selectedTags?.[0]?.color || calendar.backgroundColor,
        originalTask?.notes,
      )

      if (taskType === 'Daily') {
          const task = await DataStore.query(DailyToDo, taskId)
          if (task) {
            await DataStore.save(
              DailyToDo.copyOf(
                task, updated => {
                  if (newDuration > 0) {
                    updated.duration = newDuration
                  }
                  if (newDeadlineType === 'soft') {
                    updated.softDeadline = dayjs(newDeadline).format()
                  }

                  if (newDeadlineType === 'hard') {
                    updated.hardDeadline = dayjs(newDeadline).format()
                  }

                  if (eventId?.length > 0) {
                    updated.eventId = `${eventId}#${calendar?.id}`
                  }
                }
              )
            )
          }
      } else if (taskType === 'Weekly') {
        const task = await DataStore.query(WeeklyToDo, taskId)
        if (task) {
          await DataStore.save(
            WeeklyToDo.copyOf(
              task, updated => {
                if (newDuration > 0) {
                  updated.duration = newDuration
                }
                if (newDeadlineType === 'soft') {
                  updated.softDeadline = dayjs(newDeadline).format()
                }

                if (newDeadlineType === 'hard') {
                  updated.hardDeadline = dayjs(newDeadline).format()
                }

                if (eventId?.length > 0) {
                  updated.eventId = `${eventId}#${calendar?.id}`
                }
              }
            )
          )
        }
      }

      if (taskType === 'Weekly') {
        await submitCalendarForQueue(client, userId, dayjs().hour(7).format(), dayjs().add(6, 'day').hour(23).minute(59).format())
      } else if (taskType === 'Daily') {
        await submitCalendarForQueue(client, userId, dayjs().hour(7).format(), dayjs().hour(23).minute(59).format())
      }

      Toast.show({
        type: 'success',
        text1: 'Task deadline created',
        text2: 'Task deadline is succesfully created',
      })

      navigation.navigate('UserTask', {
        taskType,
        isUpdate: uuid(),
      })
    } catch(e) {
      Toast.show({
        type: 'error',
        text1: 'No deadline created',
        text2: 'We are not able to create the deadline due to an internal error.'
      })
      navigation.navigate('UserTask', {
        taskType,
        isUpdate: undefined,
      })
    }
  }

  const onReceiveUpdateDeadline = async () => {
   try {
      let task: DailyToDo | WeeklyToDo
      if (taskType === 'Daily') {
        task = await DataStore.query(DailyToDo, taskId)
      } else if (taskType === 'Weekly') {
        task = await DataStore.query(WeeklyToDo, taskId)
      }

     if (task) {
       
       
       
        const eventDoc = await getEventWithId(client, task.eventId)
        await editEventForTask(
          task?.eventId,
          eventDoc?.startDate,
          eventDoc?.endDate,
          userId,
          client,
          eventDoc?.calendarId,
          selectedTags?.map(tag => tag.id),
          task.notes,
          undefined,
          undefined,
          undefined,
          undefined,
          _.uniq(alarms),
          task.notes,
          undefined,
          undefined,
          undefined,
          undefined,
          true,
          false,
          false,
          false,
          false,
          undefined,
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
          task.notes,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          selectedTags?.[0]?.color || event?.backgroundColor || calendar?.backgroundColor,
          calendar?.foregroundColor,
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
          taskType === 'Daily',
          taskType === 'Weekly',
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
          true,
          true,
          true,
          newDeadlineType === 'hard' ? dayjs(newDeadline).format() : null,
          newDeadlineType === 'soft' ? dayjs(newDeadline).format() : null,
          undefined,
          undefined,
          undefined,
          undefined,
          newDuration,
          undefined,
          true,
          'update',
          undefined,
          undefined,
          undefined,
        )

        if (taskType === 'Daily') {
         await updateDailyTaskToStore(
            newDuration,
            newDeadlineType === 'soft' ? dayjs(newDeadline).format() : null,
            newDeadlineType === 'hard' ? dayjs(newDeadline).format() : null,
         )
        } else if (taskType === 'Weekly') {
          await updateWeeklyTaskToStore(
            newDuration,
            newDeadlineType === 'soft' ? dayjs(newDeadline).format() : null,
            newDeadlineType === 'hard' ? dayjs(newDeadline).format() : null,
          )
        }

      }

     if (event.softDeadline && (newDeadlineType === 'hard')) {
      
       if (taskType === 'Weekly') {
        
        await submitCalendarForQueue(client, userId, dayjs().hour(7).format(), dayjs().add(6, 'day').hour(23).minute(59).format())
      } else if (taskType === 'Daily') {
        await submitCalendarForQueue(client, userId, dayjs().hour(7).format(), dayjs().hour(23).minute(59).format())
      }
     } else if (event.hardDeadline && (newDeadlineType === 'soft')) {
       
      if (taskType === 'Weekly') {
        await submitCalendarForQueue(client, userId, dayjs().hour(7).format(), dayjs().add(6, 'day').hour(23).minute(59).format())
      } else if (taskType === 'Daily') {
        await submitCalendarForQueue(client, userId, dayjs().hour(7).format(), dayjs().hour(23).minute(59).format())
      }
     } else if (event.softDeadline
       && (deadlineType === 'soft')
       && !(dayjs(event.softDeadline?.slice(0, 19)).tz(event?.timezone || RNLocalize.getTimeZone(), true).isSame(dayjs(newDeadline).format(), 'minute'))) {
       
       && (deadlineType === 'soft')
       && !(dayjs(event.softDeadline?.slice(0, 19)).tz(event?.timezone, true).isSame(dayjs(newDeadline).format(), 'minute'))`)
      if (taskType === 'Weekly') {
        await submitCalendarForQueue(client, userId, dayjs().hour(7).format(), dayjs().add(6, 'day').hour(23).minute(59).format())
      } else if (taskType === 'Daily') {
        await submitCalendarForQueue(client, userId, dayjs().hour(7).format(), dayjs().hour(23).minute(59).format())
      }
     }  else if (event.hardDeadline
       && (deadlineType === 'hard')
       && !(dayjs(event.hardDeadline?.slice(0, 19)).tz(event?.timezone || RNLocalize.getTimeZone(), true).isSame(dayjs(newDeadline).format()))) {
        
       && (deadlineType === 'hard')
       && !(dayjs(event.hardDeadline?.slice(0, 19)).tz(event?.timezone, true).isSame(dayjs(newDeadline).format()))`)
      if (taskType === 'Weekly') {
        await submitCalendarForQueue(client, userId, dayjs().hour(7).format(), dayjs().add(6, 'day').hour(23).minute(59).format())
      } else if (taskType === 'Daily') {
        await submitCalendarForQueue(client, userId, dayjs().hour(7).format(), dayjs().hour(23).minute(59).format())
      }
     }
     
     Toast.show({
      type: 'success',
      text1: 'Successfully updated',
      text2: 'Task is successfully updated'
     })
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
      return <Box  m={{ phone: 's', tablet: 'm' }} />
    }

    return (
      <Box  ml={{ phone: 's', tablet: 'm' }} mb={{ phone: 's', tablet: 'm' }}>
        <Button onPress={goToPrevStep}>
          Back
        </Button>
      </Box>
    )
  }

  const renderNextButton = () => {
    if (activeIndex === 4) {
      return <Box mr={{ phone: 's', tablet: 'm' }} />
    }

    return (
      <Box mr={{ phone: 's', tablet: 'm' }} mb={{ phone: 's', tablet: 'm' }}>
        <Button onPress={goToNextStep}>
          Next
        </Button>
      </Box>
    )
  }

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

  const onSubmitPress = () => {
    try {
      return isUpdate
        ? onReceiveUpdateDeadline()
        : onReceiveCreateDeadline()
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

  const hideDeadlineDatePicker = () => setIsDeadlineDatePicker(false)
    
  const showDeadlineDatePicker = () => setIsDeadlineDatePicker(true)

  const height = useHeaderHeight()

  const renderCurrentStep = () => {
    
    switch(activeIndex) {
      case 0:
        return (
          <Box flex={1} justifyContent="space-around" alignItems="center">
            <Box flex={1} m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center" style={{ width: '100%' }}>
              <Text textAlign="center" variant="optionHeader" m={{ phone: 's', tablet: 'm' }}>
                Deadline
              </Text>
              <Pressable onPress={showDeadlineDatePicker}>
                  <Text variant="buttonLink">{dayjs(newDeadline).format('dddd, MMMM D, h:mm A')}</Text>
              </Pressable>
              <DatePicker
                modal
                open={isDeadlineDatePicker}
                date={newDeadline}
                onConfirm={(date) => {
                      setNewDeadline(date)
                      hideDeadlineDatePicker()
                  }}
                onCancel={() => {
                    hideDeadlineDatePicker()
                }}
                theme={dark ? 'dark' : 'light'}
              />
            </Box>
            <Box flex={1} m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
              <Picker
                modal
                style={{ color: dark ? palette.white : palette.textBlack }}
                placeholder="Pick a deadline"
                useNativePicker
                migrateTextField
                value={newDeadlineType}
                onChange={(itemValue: PickerValue) => {
                  
                  setNewDeadlineType(itemValue as DeadlineType)
                }
              }>
                {_.map(deadlineOptions, option => (
                    <Picker.Item
                      key={option.value}
                      label={option.label}
                      value={option.value}
                    />
                  ))}
              </Picker>
            </Box>
            <Box flex={1} m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center" style={{ width: '100%' }}>
              <KeyboardAvoidingView
                keyboardVerticalOffset={height + 64}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.container}
              >
                <TextField
                  title="Duration (minutes)"
                  type="numeric"
                  onChangeText={(text: string) => setNewDuration(parseInt(text.replace(/[^0-9.]/g, ''), 10) || 0)}
                  value={`${newDuration}`}
                  placeholder="1"
                  style={[styles?.inputField, { width: '30%' }]}
                />
              </KeyboardAvoidingView>
            </Box>
            <Box flex={1} m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center" style={{ width: '100%' }}>
              <KeyboardAvoidingView
                keyboardVerticalOffset={height + 64}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.container}
              >
              <TextField
                title="Priority ( > 0)"
                type="numeric"
                onChangeText={onChangePriority}
                value={`${newPriority}`}
                placeholder="1"
                style={[styles?.inputField, { width: '30%' }]}
              />
              </KeyboardAvoidingView>
            </Box>
            <Box flexDirection="row" justifyContent="space-between" style={{ width: '100%' }}>
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
                      Add new alarm
                  </Button>
              </Box>
              </Box>
            <Box flexDirection="row" justifyContent="space-between">
              {renderPrevButton()}
              {renderNextButton()}
            </Box>
          </Box>
        )
      case 2:
        return (
          <Box flex={1} justifyContent="space-around" alignItems="center">
            <Box flex={1} justifyContent="center" alignItems="center">
                <Text variant="optionHeader">
                    Add tags to this task
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
            <Box flex={0.5}  justifyContent="center" alignItems="center" style={{ width: '100%'}}>
                <Pressable onPress={addTagToTags}>
                    <Box flex={1} flexDirection="row" justifyContent="space-between" alignItems="center" style={{ width: '10%'}}>
                        <Ionicons name="add" size={24} color={dark ? palette.white : palette.purplePrimary} />
                        <Text variant="buttonLink">
                            Add
                        </Text>
                    </Box>
                </Pressable>
            </Box>
            <Box flexDirection="row" justifyContent="space-between" style={{ width: '100%'}}>
              {renderPrevButton()}
              {renderNextButton()}
            </Box>
          </Box>
        )
      case 3:
        return (
          <Box flex={1} justifyContent="center" alignItems="center">
            <Box flex={4} justifyContent="center" alignItems="center">
              <Text variant="subheaderNormal" m={{ phone: 'm', tablet: 'l' }}>
                {isUpdate ? 'Update task deadline' : 'Create task deadline?'}
              </Text>
              <Box p={{ phone: 'm', tablet: 'l' }} />
              <Button m={{ phone: 'm', tablet: 'l' }} onPress={onSubmitPress}>
                {isUpdate ? 'Update' : 'Create'}
              </Button>
            </Box>
            <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%'}}>
              <Box flexDirection="row" justifyContent="flex-start" width="100%">
                {renderPrevButton()}
              </Box>
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
        <Wizard.Step state={getStepState(2)} label={'Add Deadline Reminders'}/>
        <Wizard.Step state={getStepState(3)} label={'Create Dealine Reminder'}/>
      </Wizard>
      {renderCurrentStep()}
    </Box>
  )
}

export default UserTaskDeadline

