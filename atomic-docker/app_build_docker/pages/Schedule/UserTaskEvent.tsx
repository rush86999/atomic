import React, { useState, useEffect } from 'react'
import { FlatList, useColorScheme, StyleSheet, Appearance, Pressable } from 'react-native'
// import DateTimePicker from 'react-datetime-picker/dist/entry.nostyle'
import { Input } from '@chakra-ui/react'
import Wizard from '@components/Wizard'
import TextField from '@components/TextField'
import { v4 as uuid } from 'uuid'
import { dayjs } from '@lib/date-utils'

import { useToast } from '@chakra-ui/react'

import { IoIosClose, } from "react-icons/io"

import { listRemindersForEvent } from '@lib/Calendar/Reminder/ReminderHelper'
import { Picker } from '@react-native-picker/picker'
import _ from 'lodash'

import Box from '@components/common/Box'
import Text from '@components/common/Text'
import Button from '@components/Button'
import { palette } from '@lib/theme/theme'

import { CategoryType } from '@lib/dataTypes/CategoryType'
import { CalendarType } from '@lib/dataTypes/CalendarType'
import { listCategoriesForEvent, listUserCategories } from '@lib/Category/CategoryHelper'
import { createNewEvent } from '@lib/Calendar/UserCreateCalendarHelper'
import { editEventForTask } from '@lib/Progress/Todo/UserTaskHelper2'
import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { getGlobalPrimaryCalendarFunction } from '@lib/Schedule/ScheduleHelper'
import { getEventWithId } from '@lib/calendarLib/calendarDbHelper'
import { useAppContext } from '@lib/user-context'
import { useRouter } from 'next/router'
import { TaskType } from '@lib/dataTypes/TaskType'
import { getTaskGivenId, updateTaskByIdInDb } from '@lib/Progress/Todo/UserTaskHelper3'

const styles = {
  inputField: {
    fontSize: '21px',
    lineHeight: '28px',
    color:  '#221D23',
    borderColor: palette.textBlack,
    borderWidth: 1,
    width: '100%',
    height: 40,
  },
}

type taskType = 'Daily'|'Weekly'|'Master'|'Grocery'

import { NextApiRequest, NextApiResponse } from 'next';
import supertokensNode from 'supertokens-node'
import { backendConfig } from '@config/backendConfig'
import Session from 'supertokens-node/recipe/session'

export async function getServerSideProps({ req, res }: { req: NextApiRequest, res: NextApiResponse }) {
    // Notice how the server uses `API` from `withSSRContext`, instead of the top-level `API`.
    // const SSR = withSSRContext({ req })
    // this runs on the backend, so we must call init on supertokens-node SDK
    supertokensNode.init(backendConfig())
    let session
    try {
        session = await Session.getSession(req, res, {
            overrideGlobalClaimValidators: async function () {
                return []
            },
        })
    } catch (err: any) {
        if (err.type === Session.Error.TRY_REFRESH_TOKEN) {
            return { props: { fromSupertokens: 'needs-refresh' } }
        } else if (err.type === Session.Error.UNAUTHORISED) {
            // this will force the frontend to try and refresh which will fail
            // clearing all cookies and redirecting the user to the login screen.
            return { props: { fromSupertokens: 'needs-refresh' } }
        }
        throw err
    }

    if (!session?.getUserId()) {
        return {
            redirect: {
                destination: '/User/Login/UserLogin',
                permanent: false,
            },
        }
    }

    return {
        props: {
        sub: session.getUserId(),
        }
    }
}

function UserTaskEvent() {
  const router = useRouter()
  const { sub, client } = useAppContext()

  const taskType = router.query?.taskType as taskType
  const taskId = router.query?.taskId as string
  const isUpdate = router.query?.isUpdate as string

  const [activeIndex, setActiveIndex] = useState<number>(0)
  const [completedStep, setCompletedStep] = useState<number | undefined>()
  const [startDate, setStartDate] = useState<Date>(dayjs().toDate())
  const [duration, setDuration] = useState<number>(30)
  const [tags, setTags] = useState<CategoryType[]>([])
  const [alarms, setAlarms] = useState<number[]>([])
  const [calendar, setCalendar] = useState<CalendarType>()
  const [alarm, setAlarm] = useState<number>(0)
  const [selectedTag, setSelectedTag] = useState<string>('')
  const [selectedTagObject, setSelectedTagObject] = useState<CategoryType>(null)
  const [selectedTags, setSelectedTags] = useState<CategoryType[]>([])
  const [task, setTask] = useState<TaskType>()

  // const dark = useColorScheme() === 'dark'
  const userId = sub
  const toast = useToast()

  // get task

  useEffect(() => {
    (async () => {
      try {
        if (!taskId || !client) {
          return
        }

        const oldTask = await getTaskGivenId(client, taskId)
        setTask(oldTask)
      } catch (e) {
        console.log(e, ' unable to get task by id')
      }
    })()
  }, [client, taskId])

  useEffect(() => {
    (async() => {
      try {
        if (!userId || !client) {
          return
        }
        const results = await listUserCategories(client, userId)
        if (!results?.[0]?.id) {
          console.log(' no categories available')
          return
        }
        setTags(results)
      } catch(e) {
        console.log(e, ' unable to get categories')
      }
    })()
  }, [client, userId])

   useEffect(() => {
    (async () => {
      if (!task || !client) {
        return
      }
      
      if (task?.id) {
        const results = await listRemindersForEvent(client, task?.eventId)
        if (!results?.[0]?.id) {
          console.log(' no alarms available')
          return
        }
        setAlarms(results?.map(r => r.minutes))
      }
      
    })()
  }, [client, task, task?.eventId, task?.id])

  useEffect(() => {
    (async () => {  
      if (!userId || !client) {
        return
      }
      const result = await getGlobalPrimaryCalendarFunction(client, userId)
      if (!result?.id) {
        console.log(' no primary calendar available')
        return
      }
      setCalendar(result)
    })()
  }, [client, userId])

  useEffect(() => {
    (async () => {
      if (!task || !client) {
        return
      }
      
      if (task?.id) {
        const event = await getEventWithId(client, task?.eventId)
        if (!event?.id) {
          console.log(' no event available')
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
  }, [client, task, task?.eventId, task?.id])

  const updateTaskInDb = async (
    eventId?: string,
  ) => {
    try {
      if (!taskId) {
        return
      }

      const toUpdateTask = _.cloneDeep(task)

      // validate
      if (!toUpdateTask) {
        console.log('no toUpdateTask provided inside updateTaskinDb')
        return
      }

      if (eventId !== undefined) {
        toUpdateTask.eventId = eventId
      }

      await updateTaskByIdInDb(client, toUpdateTask)

      setTask(toUpdateTask)


    } catch (e) {
      console.log(e, ' unable to update task in db')
    }
  }


  const onReceiveCreateEvent = async () => {
    try {
      if (!task?.id) {
        console.log('no taskId present inside onReceiveCreateTaskScheduleInfo')
        return
      }

      const eventId = await createNewEvent(
        dayjs(startDate).format(),
        dayjs(startDate).add(duration, 'minute').format(),
        userId,
        client,
        calendar?.id,
        selectedTags.map(t => t.id),
        task.notes,
        false,
        undefined,
        undefined,
        undefined,
        alarms,
        task.notes,
        undefined,
        false,
        false,
        false,
        true,
        false,
        false,
        false,
        false,
        dayjs.tz.guess(),
        task.id,
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
        await updateTaskInDb(eventId)
      }

      toast({
        status: 'success',
        title: 'Task Event Created',
        description: 'Task event created successfully',
        duration: 9000,
        isClosable: true,
      })
    
      router.push({ pathname: '/Progress/Todo/UserTask', query: {
        taskType,
        isUpdate: uuid(),
      }})
    } catch(e) {
      console.log(e, ' unable to create task event')
      toast({
        status: 'error',
        title: 'No event created',
        description: 'We are not able to create the event for task due to an internal error.',
        duration: 9000,
        isClosable: true,
      })
      router.push({ pathname: '/Progress/Todo/UserTask', query: {
        taskType,
        isUpdate: undefined,
      }})
    }
  }

  const onReceiveUpdateEvent = async ( ) => {
   try {
      console.log(task, ' task inside onReceiveUpdateEvent')
      if (!task?.id) {
        console.log('no taskId present inside onReceiveUpdateEvent')
        return
      }

      const oldEvent = await getEventWithId(client, task.eventId)

      if (!oldEvent) {
        console.log('no oldEvent present inside onReceiveUpdateTaskScheduleInfo')
        return
      }

      console.log(selectedTags, ' selectedTags inside onReceiveUpdateEvent')

      await editEventForTask(
        task?.eventId,
        dayjs(startDate).format(),
        dayjs(startDate).add(duration, 'minute').format(),
        userId,
        client,
        calendar?.id,
        selectedTags.map(t => t.id),
        task.notes,
        false,
        undefined,
        undefined,
        undefined,
        alarms,
        task.notes,
        undefined,
        false,
        false,
        false,
        true,
        false,
        false,
        false,
        false,
        dayjs.tz.guess(),
        task.id,
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

      if (oldEvent?.id) {
        await updateTaskInDb(oldEvent?.id)
      }
      
      router.push({ pathname: '/Progress/Todo/UserTask', query: {
        taskType,
        isUpdate: uuid(),
      }})
   } catch(e) {
     console.log(e, ' unable to update deadline')
     toast({
        status: 'error',
        title: 'Unable to update',
        description: 'Unable to update deadline due to an internal error',
        duration: 9000,
        isClosable: true,
     })
     router.push({ pathname: '/Progress/Todo/UserTask', query: {
       taskType,
       isUpdate: undefined,
     }})
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
      return <Box pt={{ phone: 'm', tablet: 's' }}/>
    }

    return (
    <Box pt={{ phone: 'm', tablet: 's' }}>
      <Button onClick={goToPrevStep}>
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
      <Box pt={{ phone: 'm', tablet: 's' }}>
        <Button onClick={goToNextStep}>
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
      console.log(e, ' unable to submit press inside UserTaskEvent')
    }
  }

  const renderCurrentStep = () => {
    switch(activeIndex) {
      case 0:
        return (
          <div className="flex flex-col justiy-center items-center">
            <Text textAlign="center" variant="subheader" pt={{ phone: 'm', tablet: 's' }}>
              Add a task period
            </Text>
            <Box flex={1} justifyContent="center" alignItems="center" minHeight="60vh">
              <div className="flex flex-col justify-center items-start">
                <div>
                  <Text variant="optionHeader">
                    Select a start date for task
                  </Text>
                  <Input
                    placeholder="Select Date and Time"
                    size="md"
                    type="datetime-local"
                    onChange={(e) => setStartDate(dayjs(e?.target?.value, "YYYY-MM-DDTHH:mm").toDate())}
                    value={dayjs(startDate).format("YYYY-MM-DDTHH:mm")}
                  />
                </div>
                <Box flexDirection="row" justifyContent="center" alignItems="center">
                  <TextField
                    label="Duration (minutes)"
                    type="number"
                    onChange={(e: { target: { value: string } }) => setDuration(parseInt(e?.target?.value.replace(/[^0-9.]/g, ''), 10))}
                    value={`${duration}`}
                    placeholder="1"
                    style={{ ...(styles?.inputField)}}
                  />
                </Box>
              </div>
            </Box>
            <Box flexDirection="row" justifyContent="space-between" width="100%">
              <Box />
              {renderNextButton()}
            </Box>
            
            </div>
        )
      case 1:
        return (
          <Box justifyContent="center">
            <Box justifyContent="center" alignItems="center">
              <Text variant="subheader">
                Reminders
              </Text>
            </Box>
            <Box flex={1} justifyContent="center" alignItems="center" minHeight="60vh" >
              
              <FlatList
                data={alarms}
                renderItem={({ item, index }) => (
                  <Box flexDirection="row" justifyContent="space-around">
                    <Text variant="optionHeader">
                      {`${item} minutes before`}
                    </Text>
                    <Pressable hitSlop={15} onPress={() => removeAlarm(index)}>
                      <IoIosClose size="3em" color={palette.red} />
                    </Pressable>
                  </Box>
                )}
                keyExtractor={(item, index) => `${item}-${index}`}
              />
              <Box flexDirection="row" justifyContent="center" alignItems="center">
                <TextField
                  type="number"
                  onChange={(e: { target: { value: string } }) => setAlarm(parseInt(e?.target?.value.replace(/[^0-9.]/g, ''), 10))}
                  value={`${alarm}`}
                  placeholder="0"
                  
                />
                <span className="ml-3">
                  <Button onClick={addAlarm}>
                    Add
                  </Button>
                </span>
              </Box>
            </Box>
            <Box  flexDirection="row" justifyContent="space-between">
              {renderPrevButton()}
              {renderNextButton()}
            </Box>
          </Box>
        )
      case 2:
        return (
          <Box justifyContent="center" alignItems="center">
            <Box m={{ phone: 's', tablet: 'm'}} justifyContent="center" alignItems="center">
              <Text variant="subheader">
                Add tags to this event
              </Text>
            </Box>
            <Box flex={1} justifyContent="center" alignItems="center" minHeight="60vh">
              <FlatList
                  data={selectedTags}
                  renderItem={({ item, index }) => (
                      <Box flexDirection="row" alignItems="center">
                          <Text variant="optionHeader">
                              {item.name}
                          </Text>
                          <Pressable hitSlop={15} onPress={() => removeTagFromTags(index)}>
                              <IoIosClose size="3em" color={palette.red} />
                          </Pressable>
                      </Box>
                  )}
                  keyExtractor={(item) => item.id}
              />
              <div className="flex">
                <Box justifyContent="center" alignItems="flex-start">
                    <Picker
                        selectedValue={selectedTag}
                        onValueChange={changeSelectedTag}
                        style={{ color: palette.textBlack }}
                    >
                        {tags.map((category) => (   
                            <Picker.Item color={palette.textBlack} key={category.id} value={category.name} label={category.name} />
                        ))}
                    </Picker>
                </Box>
              
                <div className="m-3">
                  <Button onClick={addTagToTags}>
                      Add
                  </Button>
                </div>
              </div>
            </Box>
            <Box flexDirection="row" justifyContent="space-between" width="100%">
              {renderPrevButton()}
              {renderNextButton()}
            </Box>
          </Box>
        )
      case 3:
        return (
          <div className="flex flex-col justify-between items-center">
            <Box flex={1} justifyContent="space-around" alignItems="center" minHeight="60vh">
              <Text variant="subheader" pt={{ phone: 'm', tablet: 's' }}>
                {isUpdate ? "Update the event?" : "Create the event?"}
              </Text>
              <Box p={{ phone: 's', tablet: 'm' }}>
                <Button onClick={onSubmitPress}>
                  {isUpdate ? "Update Event" : "Create Event"}
                </Button>
              </Box>
            </Box>
            <Box flexDirection="row" justifyContent="flex-start" width="100%">
              {renderPrevButton()}
            </Box>
          </div>
        )
    }
  }


  return (
    <Box flex={1}>
      <Wizard
        items={[
            {
                index: 0,
                label: 'Add a Period',
            },
            {
                index: 1,
                label: 'Add Event Alarms',
            },
            {
                index: 2,
                label: 'Add Tags',
            },
             {
                index: 3,
                label: isUpdate ? "Update the event?" : "Create the event?",
            },
        ]}

        completed={completedStep}
        activeIndex={activeIndex}
      />
      {renderCurrentStep()}
    </Box>
  )

}

export default UserTaskEvent
