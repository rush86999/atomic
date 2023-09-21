import React, { useState, useEffect } from 'react'
import { Input } from '@chakra-ui/react'
import Wizard from '@components/Wizard'
import TextField from '@components/TextField'
import { v4 as uuid } from 'uuid'
import { dayjs } from '@lib/date-utils'
import { useToast } from '@chakra-ui/react'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import Button from '@components/Button'
import { DeadlineType } from '@pages/Progress/Todo/UserTask'
import { createDeadlineForTask, editEventForTask, submitCalendarForQueue } from '@lib/Progress/Todo/UserTaskHelper2'
import { CalendarType } from '@lib/dataTypes/CalendarType'
import _ from 'lodash'
import { getGlobalPrimaryCalendarFunction } from '@lib/Schedule/ScheduleHelper'
import { getEventWithId } from '@lib/calendarLib/calendarDbHelper'
import { EventType } from '@lib/dataTypes/EventType';
import { useAppContext } from '@lib/user-context'
import { useRouter } from 'next/router'
import { getTaskGivenId, updateTaskByIdInDb } from '@lib/Progress/Todo/UserTaskHelper3'
import { TaskType } from '@lib/dataTypes/TaskType'
import { WeeklyTask, DailyTask } from '@lib/Progress/Todo/constants'

const styles = {
  inputField: {
    fontSize: '21px',
    lineHeight: '28px',
    color: '#221D23',
    // borderColor: palette.textBlack,
    // borderWidth: 1,
    width: '100%',
    // height: 40,
  } as React.CSSProperties,
  container: {
    flex: 1,
  } as React.CSSProperties,
}

export type taskType = 'Daily'|'Weekly'

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

function UserTaskDeadline() {
  const router = useRouter()
  const { sub, client } = useAppContext()

  const taskType = router.query?.taskType as taskType
  const taskId = router.query?.taskId as string
  const isUpdate = router.query?.isUpdate as string
  const deadlineType = router.query?.deadlineType as DeadlineType
 
  const [activeIndex, setActiveIndex] = useState<number>(0)
  const [completedStep, setCompletedStep] = useState<number | undefined>()

  const [newPriority, setNewPriority] = useState<number>(1)
  const [newDeadline, setNewDeadline] = useState<Date>(new Date())
  const [newDeadlineType, setNewDeadlineType] = useState<DeadlineType>(deadlineType || 'soft')
  const [newDuration, setNewDuration] = useState<number>(30)
  const [calendar, setCalendar] = useState<CalendarType>()

  const [event, setEvent] = useState<EventType>()
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
  

  
  // get global primary calendar
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

  // get Event
  useEffect(() => {
    (async () => {
      if (!taskId || !client) {
        return
      }
      if (task?.id) {
        const oldEvent = await getEventWithId(client, task?.eventId)
        if (!oldEvent?.id) {
          console.log(' no event available')
          return
        }
        console.log(oldEvent?.id, ' oldEvent?.id inside UserTaskDeadline')
        console.log(oldEvent?.softDeadline, ' oldEvent?.softDeadline inside UserTaskDeadline')
        console.log(oldEvent?.hardDeadline, ' oldEvent?.hardDeadline inside UserTaskDeadline')
        setEvent(oldEvent)
        setNewPriority(oldEvent.priority)
        setNewDeadline((oldEvent?.softDeadline && dayjs(oldEvent?.softDeadline).tz(oldEvent?.timezone || dayjs.tz.guess(), true).toDate()) || (oldEvent?.hardDeadline && dayjs(oldEvent?.hardDeadline).tz(oldEvent?.timezone || dayjs.tz.guess()).toDate()) || new Date())
        setNewDeadlineType(oldEvent?.softDeadline ? 'soft' : 'hard')
        setNewDuration(oldEvent?.duration || 0)
        // get tags for event
        
        
      }
    })()
  }, [client, task?.eventId, task?.id, taskId, taskType])

  const onChangePriority = (value: string = '1') => {
        const intValue = parseInt(value.replace(/[^0-9.]/g, ''), 10)
        // validate
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

  // update to Datasore
  const updateTaskInDb = async (
    duration?: number,
    softDeadline?: string,
    hardDeadline?: string,
    eventId?: string,
  ) => {
    try {
      if (!taskId) {
        return // console.log(' not available in the id array')
      }

      const toUpdateTask = _.cloneDeep(task)

      // validate
      if (!toUpdateTask) {
        console.log('no toUpdateTask provided inside updateTaskinDb')
        return
      }

      if (duration !== undefined) {
        toUpdateTask.duration = duration
      }

      if (softDeadline !== undefined) {
        toUpdateTask.softDeadline = softDeadline
      }

      if (hardDeadline !== undefined) {
        toUpdateTask.hardDeadline = hardDeadline
      }

      if (eventId !== undefined) {
          toUpdateTask.eventId = `${eventId}#${calendar?.id}`
      }

      await updateTaskByIdInDb(client, toUpdateTask)

      setTask(toUpdateTask)

    } catch (e) {
      console.log(e, ' unable to update task in db')
    }
  }


  // create taskDeadline
  const onReceiveCreateDeadline = async () => {
    /**
    overrides auto generated start and end dates
     */
    try {

      if (!taskId || !task) {
        // console.log('no taskId present inside onReceiveCreateTaskScheduleInfo')
        return
      }

      const eventId = await createDeadlineForTask(
        client,
        userId,
        task?.notes,
        newDuration,
        taskId,
        taskType,
        newPriority,
        newDeadlineType === 'soft' ? dayjs(newDeadline).format() : undefined,
        newDeadlineType === 'hard' ? dayjs(newDeadline).format() : undefined,
        undefined,
        undefined,
        calendar.colorId,
        undefined,
        task?.notes,
      )

      await updateTaskInDb(
        newDuration,
        newDeadlineType === 'soft' ? dayjs(newDeadline).format() : undefined,
        newDeadlineType === 'hard' ? dayjs(newDeadline).format() : undefined,
        eventId ? `${eventId}#${calendar?.id}` : undefined,
      )

      if (taskType === WeeklyTask) {

          await submitCalendarForQueue(client, userId, dayjs().hour(7).format(), dayjs().add(6, 'day').hour(23).minute(59).format(), toast)
        
        
      } else if (taskType === DailyTask) {

        await submitCalendarForQueue(client, userId, dayjs().hour(7).format(), dayjs().hour(23).minute(59).format(), toast)

      }

      toast({
        status: 'success',
        title: 'Task deadline created',
        description: 'Task deadline is succesfully created',
        duration: 9000,
        isClosable: true,
      })

      router.push({ pathname: '/Progress/Todo/UserTask', query: {
        taskType,
        isUpdate: uuid(),
      }})
    } catch(e) {
      // console.log(e, ' unable to create task deadline')
      toast({
        status: 'error',
        title: 'No deadline created',
        description: 'We are not able to create the deadline due to an internal error.',
        duration: 9000,
        isClosable: true,
      })
      router.push({ pathname: '/Progress/Todo/UserTask', query: {
        taskType,
        isUpdate: undefined,
      }})
      // setIsDeadlineOverlay(false)
      // setActiveDeadlineIndex(-1)
    }
  }

  const onReceiveUpdateDeadline = async () => {
   try {

     if (task) {
      
        console.log(newDeadlineType, ' newDeadlineType before editEventForTask')
      
        const eventDoc = await getEventWithId(client, task.eventId)
          
        await editEventForTask(
          task?.eventId,
          eventDoc?.startDate,
          eventDoc?.endDate,
          userId,
          client,
          eventDoc?.calendarId,
          undefined,
          task.notes,
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

        await updateTaskInDb(
          newDuration,
          newDeadlineType === 'soft' ? dayjs(newDeadline).format() : null,
          newDeadlineType === 'hard' ? dayjs(newDeadline).format() : null,
        )

      }

     if (event.softDeadline && (newDeadlineType === 'hard')) {
      console.log(`event.softDeadline && (newDeadlineType === 'hard')`)
       if (taskType === WeeklyTask) {

            await submitCalendarForQueue(client, userId, dayjs().hour(7).format(), dayjs().add(6, 'day').hour(23).minute(59).format(), toast)
         
       } else if (taskType === DailyTask) {

          await submitCalendarForQueue(client, userId, dayjs().hour(7).format(), dayjs().hour(23).minute(59).format(), toast)
        
      }
     } else if (event.hardDeadline && (newDeadlineType === 'soft')) {
       console.log(`event.hardDeadline && (newDeadlineType === 'soft')`)
      if (taskType === WeeklyTask) {

          await submitCalendarForQueue(client, userId, dayjs().hour(7).format(), dayjs().add(6, 'day').hour(23).minute(59).format(), toast)
        
      } else if (taskType === DailyTask) {

          await submitCalendarForQueue(client, userId, dayjs().hour(7).format(), dayjs().hour(23).minute(59).format(), toast)
        
      }
     } else if (event.softDeadline
       && (deadlineType === 'soft')
       && !(dayjs(event.softDeadline?.slice(0, 19)).tz(event?.timezone || dayjs.tz.guess(), true).isSame(dayjs(newDeadline).format(), 'minute'))) {

      if (taskType === WeeklyTask) {
          await submitCalendarForQueue(client, userId, dayjs().hour(7).format(), dayjs().add(6, 'day').hour(23).minute(59).format(), toast)
      } else if (taskType === DailyTask) {

          await submitCalendarForQueue(client, userId, dayjs().hour(7).format(), dayjs().hour(23).minute(59).format(), toast)

      } 
     }  else if (event.hardDeadline
        && (deadlineType === 'hard')
        && !(dayjs(event.hardDeadline?.slice(0, 19)).tz(event?.timezone || dayjs.tz.guess(), true).isSame(dayjs(newDeadline).format()))) {

        if (taskType === 'Weekly') {

            await submitCalendarForQueue(client, userId, dayjs().hour(7).format(), dayjs().add(6, 'day').hour(23).minute(59).format(), toast)

        } else if (taskType === 'Daily') {

            await submitCalendarForQueue(client, userId, dayjs().hour(7).format(), dayjs().hour(23).minute(59).format(), toast)

        }
     }
     
     toast({
        status: 'success',
        title: 'Successfully updated',
        description: 'Task is successfully updated',
        duration: 9000,
        isClosable: true,
     })
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
    //  navigation.navigate('UserTask', {
    //    taskType,
    //    isUpdate: undefined,
    //  })
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
      return <Box  p={{ phone: 's', tablet: 'm' }} />
    }

    return (
      <Box  ml={{ phone: 's', tablet: 'm' }} mb={{ phone: 's', tablet: 'm' }}>
        <Button onClick={goToPrevStep}>
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
        <Button onClick={goToNextStep}>
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
      console.log(e, ' unable to submit press inside UserTaskDeadline')
    }
  }



  const renderCurrentStep = () => {
  
    switch(activeIndex) {
      case 0:
        return (
          <Box justifyContent="center" alignItems="center">
            <Text textAlign="center" variant="subheader" mt={{ phone: 's', tablet: 'm' }}>
              Deadline
            </Text>
            <div className="flex-1 flex flex-col justify-center items-start" style={{ minHeight: '50vh'}}>
              <Box  mt={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center" style={{ width: '100%' }}>
                
                <Input
                  placeholder="Select Date and Time"
                  size="md"
                  type="datetime-local"
                  onChange={(e) => {
                        setNewDeadline(dayjs(e?.target?.value, "YYYY-MM-DDTHH:mm").toDate())
                  }}
                  value={dayjs(newDeadline).format("YYYY-MM-DDTHH:mm")}
                />
              </Box>
              <Box  mt={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
                <select value={newDeadlineType} onChange={(e) => setNewDeadlineType(e?.target?.value as DeadlineType)} className="select select-primary w-full max-w-xs">
                  <option disabled selected>Pick a deadline</option>
                  {_.map(deadlineOptions, option => (
                      <option
                          key={option.value}
                          value={option.value}
                      >{option.label}</option>
                      ))}
                </select>
              </Box>
              <Box  mt={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center" style={{ width: '100%' }}>

                  <TextField
                    label="Duration (minutes)"
                    type="number"
                    onChange={(e: { target: { value: string } }) => setNewDuration(parseInt(e?.target?.value.replace(/[^0-9.]/g, ''), 10))}
                    value={`${newDuration}`}
                    placeholder="1"
                    style={{...(styles?.inputField)}}
                  />
          
              </Box>
              <Box  mt={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center" style={{ width: '100%' }}>
                <TextField
                  label="Priority ( > 0)"
                  type="number"
                  onChange={(e: { target: { value: string } }) => onChangePriority(e?.target?.value)}
                  value={`${newPriority}`}
                  placeholder="1"
                  style={{ ...(styles?.inputField)}}
                />
            
              </Box>
            </div>
            <Box flexDirection="row" justifyContent="space-between" style={{ width: '100%' }}>
              <Box />
              {renderNextButton()}
            </Box>
          </Box>
        )
      case 1:
        return (
          <Box  justifyContent="center" alignItems="center">
            
            <Box justifyContent="center" alignItems="center" minHeight="60vh">
              <Text variant="subheader" mt={{ phone: 'm', tablet: 'l' }}>
                  {isUpdate ? 'Update task deadline' : 'Create task deadline?'}
              </Text>
              <Box mt={{ phone: 'm', tablet: 'l' }}>
                <Button onClick={onSubmitPress}>
                  {isUpdate ? 'Update' : 'Create'}
                </Button>
              </Box>
            </Box>
            <Box flexDirection="row" justifyContent="flex-start" width="100%">
                {renderPrevButton()}
            </Box>
          </Box>
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
                label: 'Create Deadline',
            },
        ]}

        completed={completedStep}
        activeIndex={activeIndex}
      />
      {renderCurrentStep()}
    </Box>
  )
}

export default UserTaskDeadline

