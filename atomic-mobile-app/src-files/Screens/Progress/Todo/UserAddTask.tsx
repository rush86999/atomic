import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
 } from 'react'

 import {
  StyleSheet,
  Pressable,
  Appearance,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
  KeyboardAvoidingView,
} from 'react-native'
 import { useHeaderHeight } from '@react-navigation/elements'
import {DataStore} from '@aws-amplify/datastore'
import {  TextField, Picker, PickerValue } from 'react-native-ui-lib'
import { useNavigation, RouteProp, useFocusEffect } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import DatePicker from 'react-native-date-picker'
import { v4 as uuid } from 'uuid'

import {
  DailyToDo,
  WeeklyToDo,
  User,
  ToDoStatus,
} from '@models'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import Button from '@components/Button'
import { palette } from '@theme/theme'

import {
  createDailyDeadline,
  submitEventForQueue,
  createWeeklyDeadline,
} from '@progress/Todo/UserTaskHelper2'
import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import Toast from 'react-native-toast-message'
import { _createDailyTaskToStore } from '@progress/Todo/UserTaskHelper';
import { dayjs } from '@app/date-utils'
import _ from 'lodash'

export const CALENDARNAME = 'Atomic Calendar'



export type taskType = 'Daily'|'Weekly'|'Master'|'Grocery'

type RootRouteStackParamList = {
  UserAddTask: {
    taskType: taskType | undefined,
  },
}

type RootNavigationStackParamList = {
  UserTask: {
    isUpdate?: string | undefined,
  },
    UserAddTask: undefined,
}

type UserAddTaskNavigationProp = StackNavigationProp<
  RootNavigationStackParamList,
  'UserAddTask'
>

type UserAddTaskRouteProp = RouteProp<
  RootRouteStackParamList,
    'UserAddTask'>

type Props = {
  sub: string
  route: UserAddTaskRouteProp
  client: ApolloClient<NormalizedCacheObject>,
}

const dark = Appearance.getColorScheme() === 'dark'

const styles = StyleSheet.create({
  task: {
    fontSize: 16,
    lineHeight: 24,
    color:  dark ? palette.white : '#221D23',
    width: '100%',
  },
  taskOverlay: {
    fontSize: 16,
    lineHeight: 24,
    color:  dark ? palette.white : '#221D23',
    padding: 10,
    width: 280,
    borderColor: dark ? palette.white : palette.textBlack,
    borderWidth: 1,
  },
  taskOverlay2: {
    fontSize: 16,
    lineHeight: 24,
    color:  dark ? palette.white : '#221D23',
    width: '100%',
  },
   container: {
      flex: 1,
    },
})

export type DeadlineType = 'soft' | 'hard'

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

function UserAddTask(props: Props) {
    const [newDailyTaskText, setNewDailyTaskText] = useState<string>('')
    const [newDailyPriority, setNewDailyPriority] = useState<number>(1)
    const [newDailyDeadline, setNewDailyDeadline] = useState<Date>(new Date())
    const [newDailyDeadlineType, setNewDailyDeadlineType] = useState<DeadlineType>('soft')
    const [newDailyDuration, setNewDailyDuration] = useState<number>(30)

    const [newWeeklyTaskText, setNewWeeklyTaskText] = useState<string>('')
    const [newWeeklyPriority, setNewWeeklyPriority] = useState<number>(1)
    const [newWeeklyDeadline, setNewWeeklyDeadline] = useState<Date>(new Date())
    const [newWeeklyDeadlineType, setNewWeeklyDeadlineType] = useState<DeadlineType>('soft')
    const [newWeeklyDuration, setNewWeeklyDuration] = useState<number>(30)
    
    const [isDeadlineDatePicker, setIsDeadlineDatePicker] = useState<boolean>(false)

    const {
        route,
        sub,
    } = props

    const client = props?.client
    const taskType = route?.params?.taskType
    const height = useHeaderHeight()

    const userIdEl = useRef<string>('')
    const profileIdEl = useRef<string>('')

    const navigation = useNavigation<UserAddTaskNavigationProp>()

  

    useEffect(() => {
      (async () => {
        try {
          const users = await DataStore.query(User, c => c.sub('eq', sub), {
            limit: 1,
          })
          userIdEl.current = users[0].id
          
          profileIdEl.current = users[0].profileId
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
            profileIdEl.current = users[0].profileId
          } catch (e) {
            
          }
          })()
        }, [sub]
      )
    )

    const onChangeDailyPriority = (value: string = '1') => {
        const intValue = parseInt(value.replace(/[^0-9.]/g, ''), 10)
        if (intValue < 1) {
        setNewDailyPriority(1)
        return
        }

        if (isNaN(intValue)) {
        setNewDailyPriority(1)
        return
        }

        setNewDailyPriority(parseInt(value.replace(/[^0-9.]/g, ''), 10) || 1)
    }
  
    const updateDailyTaskToStoreById = async (
      taskId: string,
      text?: string,
      completed?: boolean,
      startDate?: string,
      endDate?: string,
      completedDate?: string,
      nextDay?: boolean,
      important?: boolean,
      event?: boolean,
      scheduleId?: string,
      softDeadline?: string,
      hardDeadline?: string,
      status?: ToDoStatus,
      parentId?: string,
      order?: number,
      eventId?: string,
      duration?: number,
    ) => {
      try {
        const original = await DataStore.query(DailyToDo, taskId)

        if (original) {
          await DataStore.save(
            DailyToDo.copyOf(
              original, updated => {

                if (text && (text !== original.notes)) {
                  updated.notes = text
                }

                if ((completed !== undefined) && (completed !== original.completed)) {
                  updated.completed = completed
                }

                if ((startDate !== undefined) && (startDate !== original.startDate)) {
                  updated.startDate = startDate
                }

                if ((endDate !== undefined) && (endDate !== original.endDate)) {
                  updated.endDate = endDate
                }

                if ((completedDate !== undefined) && (completedDate !== original.completedDate)) {
                  updated.completedDate = completedDate
                }

                if ((nextDay !== undefined) && (nextDay !== original.nextDay)) {
                  updated.nextDay = nextDay
                }

                if ((important !== undefined) && (important !== original.important)) {
                  updated.important = important
                }

                if ((softDeadline !== undefined) && (softDeadline !== original.softDeadline)) {
                  updated.softDeadline = softDeadline
                }

                if ((hardDeadline !== undefined) && (hardDeadline !== original.hardDeadline)) {
                  updated.hardDeadline = hardDeadline
                }

                if ((scheduleId !== undefined) && (scheduleId !== original.scheduleId)) {
                  updated.scheduleId = scheduleId
                }

                if ((event !== undefined) && (event !== original.event)) {
                  updated.event = event
                }

                if ((completed !== undefined) && (completed !== original.completed)) {
                  updated.completed = completed
                }

                if ((status !== undefined) && (status !== original.status)) {
                    updated.status = status
                }

                if ((parentId !== undefined) && (parentId !== original.parentId)) {
                    updated.parentId = parentId
                }

                if ((order !== undefined) && (order !== original.order)) {
                    updated.order = order
                }

                if ((eventId !== undefined) && (eventId !== original.eventId)) {
                    updated.eventId = eventId
                }

                if ((duration !== undefined) && (duration !== original.duration)) {
                    updated.duration = duration
                }
              }
            )
          )
        }
      } catch (e) {
        
      }
    }

    const createDailyTaskToStore = async (
      text: string,
      completed?: boolean,
      startDate?: string,
      endDate?: string,
      completedDate?: string,
      nextDay?: boolean,
      important?: boolean,
      softDeadline?: string,
      hardDeadline?: string,
      status?: ToDoStatus,
      parentId?: string,
      eventId?: string,
      duration?: number,
    ) => {
        try {
          
          
          const newDailyToDo = await _createDailyTaskToStore(
              userIdEl,
              text,
              completed,
              startDate,
              endDate,
              completedDate,
              nextDay,
              important,
              softDeadline,
              hardDeadline,
              status || ToDoStatus.TODO,
              parentId || '',
              undefined,
              eventId,
              duration,
          )

        return newDailyToDo.id

        } catch(e) {
        
        }
    }

    const createDailyTaskNote = async () => {
      try {
        const notes = newDailyTaskText
        if (!notes) {
            Toast.show({
            type: 'info',
            text1: 'Empty',
            text2: 'Your task is empty'
            })
            return
        }

        const taskId = await createDailyTaskToStore(notes, false, undefined,
            undefined, undefined, false, false, newDailyDeadlineType === 'soft' ? dayjs(newDailyDeadline).format() : '', newDailyDeadlineType === 'hard' ? dayjs(newDailyDeadline).format() : '', ToDoStatus.TODO,
          '', '', newDailyDuration)
        
        
        
        const event = await createDailyDeadline(
            client, 
            sub, 
            taskId, 
            notes, 
            newDailyPriority,
            dayjs(newDailyDeadline).format(),
            newDailyDeadlineType,
            newDailyDuration,
        )
        
        
        if (event) {
          await submitEventForQueue(event, client, sub, true)
          setNewDailyTaskText('')
          setNewDailyPriority(1)
          setNewDailyDeadline(new Date())
          setNewDailyDeadlineType('soft')
          setNewDailyDuration(1)

          await updateDailyTaskToStoreById(
            taskId,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            event?.id,
          )
        }
        
        navigation.navigate('UserTask', { isUpdate: uuid() })
      } catch (e) {
        
      }
    }
  
    const hideDeadlineDatePicker = () => setIsDeadlineDatePicker(false)
    
    const showDeadlineDatePicker = () => setIsDeadlineDatePicker(true)

    const onChangeWeeklyPriority = (value: string = '1') => {
      const intValue = parseInt(value.replace(/[^0-9.]/g, ''), 10)
      if (intValue < 1) {
        setNewWeeklyPriority(1)
        return
      }

      if (isNaN(intValue)) {
        setNewWeeklyPriority(1)
        return
      }

      setNewWeeklyPriority(parseInt(value.replace(/[^0-9.]/g, ''), 10) || 1)
    }
  
    const updateWeeklyTaskToStoreById = async (
      taskId: string,
      text?: string,
      completed?: boolean,
      startDate?: string,
      endDate?: string,
      completedDate?: string,
      nextDay?: boolean,
      important?: boolean,
      event?: boolean,
      scheduleId?: string,
      softDeadline?: string,
      hardDeadline?: string,
      status?: ToDoStatus,
      parentId?: string,
      order?: number,
      eventId?: string,
      duration?: number,
    ) => {
      try {
        const original = await DataStore.query(WeeklyToDo, taskId)

        if (original) {
          await DataStore.save(
            WeeklyToDo.copyOf(
              original, updated => {

                if (text && (text !== original.notes)) {
                  updated.notes = text
                }

                if ((completed !== undefined) && (completed !== original.completed)) {
                  updated.completed = completed
                }

                if ((startDate !== undefined) && (startDate !== original.startDate)) {
                  updated.startDate = startDate
                }

                if ((endDate !== undefined) && (endDate !== original.endDate)) {
                  updated.endDate = endDate
                }

                if ((completedDate !== undefined) && (completedDate !== original.completedDate)) {
                  updated.completedDate = completedDate
                }

                if ((nextDay !== undefined) && (nextDay !== original.nextDay)) {
                  updated.nextDay = nextDay
                }

                if ((important !== undefined) && (important !== original.important)) {
                  updated.important = important
                }

                if ((softDeadline !== undefined) && (softDeadline !== original.softDeadline)) {
                  updated.softDeadline = softDeadline
                }

                if ((hardDeadline !== undefined) && (hardDeadline !== original.hardDeadline)) {
                  updated.hardDeadline = hardDeadline
                }

                if ((scheduleId !== undefined) && (scheduleId !== original.scheduleId)) {
                  updated.scheduleId = scheduleId
                }

                if ((event !== undefined) && (event !== original.event)) {
                  updated.event = event
                }

                if ((completed !== undefined) && (completed !== original.completed)) {
                  updated.completed = completed
                }

                if ((status !== undefined) && (status !== original.status)) {
                    updated.status = status
                }

                if ((parentId !== undefined) && (parentId !== original.parentId)) {
                    updated.parentId = parentId
                }

                if ((order !== undefined) && (order !== original.order)) {
                    updated.order = order
                }

                if ((eventId !== undefined) && (eventId !== original.eventId)) {
                    updated.eventId = eventId
                }

                if ((duration !== undefined) && (duration !== original.duration)) {
                    updated.duration = duration
                }
              }
            )
          )
        }
      } catch (e) {
        
      }
    }
  
    const createWeeklyTaskToStore = async (
      text: string,
      completed?: boolean,
      startDate?: string,
      endDate?: string,
      completedDate?: string,
      nextDay?: boolean,
      important?: boolean,
      softDeadline?: string,
      hardDeadline?: string,
      status?: ToDoStatus,
      parentId?: string,
      eventId?: string,
      duration?: number,
    ) => {
      try {

        const newWeeklyToDo = await DataStore.save(
          new WeeklyToDo({
            userId: userIdEl?.current,
            notes: text,
            completed: completed || false,
            nextDay: nextDay || false,
            important: important || false,
            event: false,
            softDeadline: softDeadline || '',
            hardDeadline: hardDeadline || '',
            date: dayjs().format(),
            startDate,
            endDate,
            completedDate,
            status: status || ToDoStatus.TODO,
            parentId: parentId || '',
            eventId, 
            duration,
          })
        )
        return newWeeklyToDo.id
      } catch(e) {
        
      }
    }
  
    const createWeeklyTaskNote = async () => {
      try {
        const notes = newWeeklyTaskText
        if (!notes) {
          Toast.show({
            type: 'info',
            text1: 'Empty',
            text2: 'Your task is empty'
          })
          return
        }

        const taskId = await createWeeklyTaskToStore(notes, false, undefined,
          undefined, undefined, false, false, newWeeklyDeadlineType === 'soft' ? dayjs(newWeeklyDeadline).format() : '', newWeeklyDeadlineType === 'hard' ? dayjs(newWeeklyDeadline).format() : '', ToDoStatus.TODO,
          '', '', newWeeklyDuration)
        
        const event = await createWeeklyDeadline(
          client, 
          sub, 
          taskId, 
          notes, 
          newWeeklyPriority,
          dayjs(newWeeklyDeadline).format(),
          newWeeklyDeadlineType,
          newWeeklyDuration,
        )


          await submitEventForQueue(event, client, sub)
  
          await updateWeeklyTaskToStoreById(
            taskId,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            event?.id,
          )
      

        setNewWeeklyTaskText('')
        setNewWeeklyPriority(1)
        setNewWeeklyDeadline(new Date())
        setNewWeeklyDeadlineType('soft')
        setNewWeeklyDuration(1)

        navigation.navigate('UserTask', { isUpdate: uuid() })
      } catch (e) {
        
      }
    }
  

    if (taskType === 'Daily') {
        navigation.setOptions({
            headerTitle: 'Add Daily Task',
        })
      return (
          <KeyboardAvoidingView
                keyboardVerticalOffset={height + 64}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.container}
          >
            <Pressable style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} onPress={Keyboard.dismiss}>
              <Box flex={1} justifyContent="center" alignItems="center">
                  <Box flex={3} m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center" style={{ width: '100%' }}>
                      <Text m={{ phone: 'm', tablet: 'l' }} variant="optionHeader">Notes</Text>
                      <Box style={{ borderColor: dark ? palette.white : palette.textBlack, borderWidth: 1,}}>
                        <TextInput
                            placeholder="This is an example task"
                            multiline
                            numberOfLines={3}
                            style={styles?.taskOverlay}
                            value={newDailyTaskText}
                            onChangeText={setNewDailyTaskText}
                        />
                      </Box>
                  </Box>
                  <Box flex={3} m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center" style={{ width: '100%' }}>
                    <Pressable onPress={showDeadlineDatePicker}>
                        <Text variant="buttonLink">Deadline: {dayjs(newDailyDeadline).format('dddd, MMMM D, h:mm A')}</Text>
                    </Pressable>
                    <DatePicker
                      modal
                      open={isDeadlineDatePicker}
                      date={newDailyDeadline}
                      onConfirm={(date) => {
                            setNewDailyDeadline(date)
                            hideDeadlineDatePicker()
                        }}
                      onCancel={() => {
                          hideDeadlineDatePicker()
                      }}
                    theme={dark ? 'dark' : 'light'}
                    />
                  </Box>
                  <Box flex={2} m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
                    <Picker
                      modal
                      placeholder="Pick a deadline"
                      useNativePicker
                      migrateTextField
                      style={{ color: dark ? palette.white : palette.textBlack }}
                      value={newDailyDeadlineType}
                      onChange={(itemValue: PickerValue) => {
                        
                        setNewDailyDeadlineType(itemValue as DeadlineType)
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
                      <TextField
                        title="Duration (minutes)"
                        type="numeric"
                        onChangeText={(text: string) => setNewDailyDuration(parseInt(text.replace(/[^0-9.]/g, ''), 10) || 0)}
                        value={`${newDailyDuration}`}
                        placeholder="1"
                        style={[styles?.taskOverlay2, { width: '30%' }]}
                      />
                  </Box>
                  <Box flex={1} m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center" style={{ width: '100%' }}>
                      <TextField
                        title="Priority ( > 0)"
                        type="numeric"
                        onChangeText={onChangeDailyPriority}
                        value={`${newDailyPriority}`}
                        placeholder="1"
                        style={[styles?.taskOverlay2, { width: '30%' }]}
                      />
                  </Box>
                  <Box flex={2} justifyContent="center" alignItems="center" style={{ width: '100%' }}>
                    <Button onPress={createDailyTaskNote}>
                        Add
                    </Button>
                  </Box>
              </Box>
            </Pressable>
          </KeyboardAvoidingView>
        )
    } else if (taskType === 'Weekly') {
      navigation.setOptions({
        headerTitle: 'Add Weekly Task',
      })

      return (
        <KeyboardAvoidingView
              keyboardVerticalOffset={height + 64}
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.container}
        >
          <Pressable style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} onPress={Keyboard.dismiss}>
            <Box flex={1} justifyContent="center" alignItems="center">
                <Box flex={3} m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center" style={{ width: '100%' }}>
                    <Text m={{ phone: 'm', tablet: 'l' }} variant="optionHeader">Notes</Text>
                    <Box style={{ borderColor: dark ? palette.white : palette.textBlack, borderWidth: 1,}}>
                    <TextInput
                        placeholder="This is an example task"
                        multiline
                        numberOfLines={3}
                        style={styles?.taskOverlay}
                        value={newWeeklyTaskText}
                        onChangeText={setNewWeeklyTaskText}
                    />
                    </Box>
                </Box>
                <Box flex={3} m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center" style={{ width: '100%' }}>
                  <Pressable onPress={showDeadlineDatePicker}>
                    <Text variant="buttonLink">Deadline: {dayjs(newWeeklyDeadline).format('dddd, MMMM D, h:mm A')}</Text>
                  </Pressable>
                  <DatePicker
                    modal
                    open={isDeadlineDatePicker}
                    date={newWeeklyDeadline}
                    onConfirm={(date) => {
                          setNewWeeklyDeadline(date)
                          hideDeadlineDatePicker()
                      }}
                    onCancel={() => {
                        hideDeadlineDatePicker()
                    }}
                    theme={dark ? 'dark' : 'light'}
                  />
                </Box>
                <Box flex={2} m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
                  <Picker
                    modal
                    placeholder="Pick a deadline"
                    useNativePicker
                    migrateTextField
                    style={{ color: dark ? palette.white : palette.textBlack }}
                    value={newWeeklyDeadlineType}
                    onChange={(itemValue: PickerValue) => {
                        
                        setNewWeeklyDeadlineType(itemValue as DeadlineType)
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
                  <TextField
                    title="Duration (minutes)"
                    type="numeric"
                    onChangeText={(text: string) => setNewWeeklyDuration(parseInt(text.replace(/[^0-9.]/g, ''), 10))}
                    value={`${newWeeklyDuration}`}
                    placeholder="1"
                    style={[styles?.taskOverlay2, { width: '30%' }]}
                  />
                </Box>
                <Box flex={1} m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center" style={{ width: '100%' }}>
                    <TextField
                    title="Priority ( > 0)"
                    type="numeric"
                    onChangeText={onChangeWeeklyPriority}
                    value={`${newWeeklyPriority}`}
                    placeholder="1"
                    style={[styles?.taskOverlay2, { width: '30%' }]}
                    />
                </Box>
                <Box flex={2} justifyContent="center" alignItems="center" style={{ width: '100%' }}>
                  <Button onPress={createWeeklyTaskNote}>
                      Add
                  </Button>
                </Box>
            </Box>
          </Pressable>
        </KeyboardAvoidingView>
      )

    }
  
    
    
   

}

export default UserAddTask



    


  









