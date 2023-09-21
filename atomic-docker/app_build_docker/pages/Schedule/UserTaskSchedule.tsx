import React, { useState, useEffect } from 'react'
import { TouchableOpacity } from 'react-native'
import { Input } from '@chakra-ui/react'
import Wizard from '@components/Wizard'
import { v4 as uuid } from 'uuid'
import { dayjs } from '@lib/date-utils'
import { useToast } from '@chakra-ui/react'
import TextField from '@components/TextField'
import { Picker } from '@react-native-picker/picker'
import _ from 'lodash'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import RegularCard from '@components/RegularCard'
import Button from '@components/Button'
import { palette } from '@lib/theme/theme'
import { CalendarType } from '@lib/dataTypes/CalendarType'
import { createNewEvent } from '@lib/Calendar/UserCreateCalendarHelper'
import { editEventForTask } from '@lib/Progress/Todo/UserTaskHelper2'
import { getEventWithId } from '@lib/calendarLib/calendarDbHelper'
import getGlobalPrimaryCalendar from '@lib/apollo/gql/getGlobalPrimaryCalendar'
import { useAppContext } from '@lib/user-context'
import { useRouter } from 'next/router'
import { Day } from '@lib/Schedule/constants'
import { TaskType } from '@lib/dataTypes/TaskType'
import { getTaskGivenId, updateTaskByIdInDb } from '@lib/Progress/Todo/UserTaskHelper3'

type TaskNameType = 'Daily'|'Weekly'|'Master'|'Grocery'

type RecurrenceFrequency = 'daily' | 'weekly'
        | 'monthly' | 'yearly'

const styles = {
  day: {
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    width: 50,
  } as any,
  frequency: {
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    width: 50,
  } as any,
  inputField: {
    fontSize: '21px',
    lineHeight: '28px',
    borderWidth: 1,
    width: '100%',
    height: 40,
  } as any,
}

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


function UserTaskSchedule() {

  const router = useRouter()
    const { sub, client } = useAppContext()

  const taskType = router.query?.taskType as TaskNameType
  const taskId = router.query?.taskId as string
  const isUpdate = router.query?.isUpdate as string
  const userId = sub

  const [days, setDays] = useState<Day[]>([])
  const [byWeekDay, setByWeekDay] = useState<DayKeyType[]>([])
  const [MO, setMO] = useState<boolean>(false)
  const [TU, setTU] = useState<boolean>(false)
  const [WE, setWE] = useState<boolean>(false)
  const [TH, setTH] = useState<boolean>(false)
  const [FR, setFR] = useState<boolean>(false)
  const [SA, setSA] = useState<boolean>(false)
  const [SU, setSU] = useState<boolean>(false)

  const [startDate, setStartDate] = useState<Date>(new Date())
  const [duration, setDuration] = useState<number>(30)
  const [calendar, setCalendar] = useState<CalendarType>()
  const [activeIndex, setActiveIndex] = useState<number>(0)
  const [completedStep, setCompletedStep] = useState<number | undefined>()
  const [recurringEndDate, setRecurringEndDate] = useState<Date>(dayjs().add(1, 'd').toDate())
  const [eventInterval, setEventInterval] = useState<number>(1)
  const [eventFrequency, setEventFrequency] = useState<RecurrenceFrequency>('weekly')
  const [task, setTask] = useState<TaskType>()
  
  const toast = useToast()
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

        setStartDate(dayjs(event.startDate).toDate() || new Date())
        setDuration(event?.duration || dayjs(event.endDate).diff(dayjs(event.startDate), 'm') || 0)
        setByWeekDay(event?.byWeekDay as DayKeyType[] || [])
        setDays((event?.byWeekDay?.map((i: unknown) => DayObject[i as DayKeyType])) as Day[] || [])
        setMO(event?.byWeekDay?.includes('MO' as Day) || false)
        setTU(event?.byWeekDay?.includes('TU' as Day) || false)
        setWE(event?.byWeekDay?.includes('WE' as Day) || false)
        setTH(event?.byWeekDay?.includes('TH' as Day) || false)
        setFR(event?.byWeekDay?.includes('FR' as Day) || false)
        setSA(event?.byWeekDay?.includes('SA' as Day) || false)
        setSU(event?.byWeekDay?.includes('SU' as Day) || false)
        setRecurringEndDate(dayjs(event?.recurrenceRule?.endDate).toDate() || new Date())
        setEventFrequency(event?.recurrenceRule?.frequency as RecurrenceFrequency || 'weekly')
        setEventInterval(event?.recurrenceRule?.interval || 1)
      }
    })()
  }, [client, task, task?.id])

  const updateTaskInDb = async (
    eventId?: string,
  ) => {
    try {
      if (!taskId) {
        return
      }
  
      const toUpdateTask = _.cloneDeep(task)

      if (!toUpdateTask) {
        console.log('no toUpdateTask provided inside updateTaskinDb')
        return
      }

      if (eventId !== undefined) {
          toUpdateTask.eventId = `${eventId}#${calendar?.id}`
      }

      await updateTaskByIdInDb(client, toUpdateTask)

      setTask(toUpdateTask)
      
    } catch (e) {
      console.log(e, ' updateDailyTaskToStore error')
    }
  }

  const onReceiveUpdateTaskScheduleInfo = async () => {
    try {

      if (!task?.id) {
        console.log(' task not available')
        return
      }

      const oldEvent = await getEventWithId(client, task.eventId)


      if (!oldEvent) {
        console.log(' oldEvent not found')
        return
      }

      await editEventForTask(
        task?.eventId,
        dayjs(startDate).format(),
        dayjs(startDate).add(duration, 'minute').format(),
        userId,
        client,
        calendar?.id,
        undefined,
        oldEvent.title,
        false,
        dayjs(recurringEndDate).format(),
        eventFrequency,
        eventInterval,
        undefined,
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
        oldEvent?.timezone || dayjs.tz.guess(),
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
        undefined,
        oldEvent?.timezone || dayjs.tz.guess(),
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
        byWeekDay?.map(i => (DayObject[i])),
        undefined,
      )
      
      await updateTaskInDb(
        oldEvent.id,
      )
      

      router.push({ pathname: '/Progress/Todo/UserTask', query: {
        taskType,
        isUpdate: uuid(),
      }})

    } catch(e) {
      toast({
        status: 'error',
        title: 'Unable to update',
        description: 'Unable to update schedule due to an internal error',
        duration: 9000,
        isClosable: true,
      })

      router.push({ pathname: '/Progress/Todo/UserTask', query: {
        taskType,
        isUpdate: undefined,
      }})

    }
  }

  const onReceiveCreateTaskScheduleInfo = async () => {
    try {

      if (!task?.id) {
        console.log(' task not available')
        return
      }

      const eventId = await createNewEvent(
        dayjs(startDate).format(),
        dayjs(startDate).add(duration, 'minute').format(),
        userId,
        client,
        calendar?.id,
        undefined,
        task?.notes,
        false,
        dayjs(recurringEndDate).format(),
        eventFrequency,
        eventInterval,
        undefined,
        task?.notes,
        undefined,
        undefined,
        undefined,
        undefined,
        true,
        false,
        false,
        false,
        false,
        dayjs.tz.guess(),
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
        task?.notes,
        'opaque',
        'private',
        undefined,
        undefined,
        undefined,
        calendar?.colorId,
        dayjs.tz.guess(),
        calendar?.backgroundColor,
        calendar?.foregroundColor,
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
        undefined,
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
        byWeekDay?.map(i => (DayObject[i])),
        undefined,
      )
      
      if (!eventId) {
        console.log('no eventId inside onReceiveCreateTaskScheduleInfo')
        return
      }


      await updateTaskInDb(
        `${eventId}#${calendar?.id}`,
      )

      router.push({ pathname: '/Progress/Todo/UserTask', query: {
        taskType,
        isUpdate: uuid(),
      }})
    } catch(e) {
      toast({
        status: 'error',
        title: 'No schedule created',
        description: 'We are not able to create a schedule due to an internal error.',
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

  function renderNextButton(): JSX.Element {
    return (
      <Box pt={{ phone: 'm', tablet: 's' }}>
        <Button onClick={goToNextStep}>
          Next
        </Button>
      </Box>
    )
  }

  const renderNextPeriodStartButton = () => {
    if (startDate) {
      return (
        <Box pt={{ phone: 'm', tablet: 's' }}>
          <Button onClick={goToNextStep}>
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
         ...days?.slice(0, index),
         ...days?.slice(index + 1),
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
        toast({
          status: 'error',
          title: 'Invalid Options',
          description: 'You seem to have selected invalid start date and end date options',
          duration: 9000,
          isClosable: true,
        })
        return
      }

      return  isUpdate
      ? onReceiveUpdateTaskScheduleInfo()
      : onReceiveCreateTaskScheduleInfo()
    } catch(e) {
      console.log(e, ' unable to create schedule')
    }
  }

  const renderCurrentStep = () => {
    switch(activeIndex) {
      case 0:
        return (
          <Box  justifyContent="center" alignItems="center">
            <Text variant="subheader" pt={{ phone: 'm', tablet: 's' }}>
              Task Schedule
            </Text>
            <div className="flex-1 flex flex-col justify-center items-start" style={{ minHeight: '50vh'}}>
              <Text textAlign="left" variant="optionHeader">
                Select a start date for task
              </Text>
              <Input
                placeholder="Select Date and Time"
                size="md"
                type="datetime-local"
                onChange={(e) => setStartDate(dayjs(e?.target?.value, "YYYY-MM-DDTHH:mm").toDate())}
                value={dayjs(startDate).format("YYYY-MM-DDTHH:mm")}
              />
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
            <Box p={{ phone: 's', tablet: 'm' }} flexDirection="row" justifyContent="space-between" width="100%">
              <Box />
              {renderNextPeriodStartButton()}
            </Box>
          </Box>
        )
      case 1:
        return (
          <Box justifyContent="center" alignItems="center">
            <Text textAlign="center" variant="subheader" pt={{ phone: 'm', tablet: 's' }}>
              Set the schedule
            </Text>
            <div className="flex-1 flex flex-col justify-center items-start" style={{ minHeight: '50vh' }}>
              <RegularCard>
                <Text textAlign="center" variant="optionHeader" p={{ phone: 's', tablet: 'm' }}>
                  Pick days for the schedule
                </Text>
                <Box width="100%" flexDirection="row" justifyContent="space-evenly" p={{ phone: 's', tablet: 'm' }}>
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
                <Box width="100%" flexDirection="row" justifyContent="space-evenly" p={{ phone: 's', tablet: 'm' }}>
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
            </div>
            <Box p={{ phone: 's', tablet: 'm' }} flexDirection="row" justifyContent="space-between" width="100%">
              {renderPrevButton()}
              {renderNextButton()}
            </Box>
          </Box>
        )
      case 2:
        return (
          <Box justifyContent="center" alignItems="center">
            <Text textAlign="center" variant="subheader" pt={{ phone: 'm', tablet: 's' }}>
              Set the schedule
            </Text>
            <div className="flex-1 flex flex-col justify-center items-start" style={{ minHeight: '50vh'}}>
              
                <Text variant="optionHeader">
                  Select how often the task should recur
                </Text>
                <Picker
                  selectedValue={eventFrequency}
                  onValueChange={setEventFrequency}
                  style={{ color: palette.textBlack }}
                >
                    <Picker.Item color={palette.textBlack}  key="daily" value="daily" label="Daily" />
                    <Picker.Item color={palette.textBlack}  key="weekly" value="weekly" label="Weekly" />
                    <Picker.Item color={palette.textBlack}  key="monthly" value="monthly" label="Monthly" />
                    <Picker.Item color={palette.textBlack}  key="yearly" value="yearly" label="Yearly" />
                </Picker>
                <TextField
                  label="Select the interval between each recurrence (ex: every 2 weeks)"
                  type="number"
                  onChange={(e: { target: { value: string } }) => setEventInterval(parseInt(e?.target?.value.replace(/[^0-9.]/g, ''), 10))}
                  value={`${eventInterval}`}
                  placeholder="1"
                  
                />
              
                <Text variant="optionHeader">
                  Select an end date for Recurrence
                </Text>
                <Input
                  
                  placeholder="Select Date and Time"
                  size="md"
                  type="datetime-local"
                  onChange={(e) => setRecurringEndDate(dayjs(e?.target?.value, "YYYY-MM-DDTHH:mm").toDate())}
                  value={dayjs(recurringEndDate).format("YYYY-MM-DDTHH:mm")}
                />
              
            </div>
            <Box p={{ phone: 's', tablet: 'm' }} flexDirection="row" justifyContent="space-between" width="100%">
              {renderPrevButton()}
              {renderNextButton()}
            </Box>
          </Box>
        )
      
      case 3:
        return (
          <Box justifyContent="center" alignItems="center">
            <div className="flex-1 flex flex-col justify-center items-center" style={{ minHeight: '55vh' }}>
              <Text variant="subheader" pt={{ phone: 'm', tablet: 's' }}>
                {isUpdate ? "Update the schedule?" : "Create the schedule?"}
              </Text>
              <div className="m-3">
                <Button onClick={createSchedule}>
                  {isUpdate ? "Update Schedule" : "Create Schedule"}
                </Button>
              </div>
            </div>
            <Box p={{ phone: 's', tablet: 'm' }} flexDirection="row" justifyContent="flex-start" width="100%">
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
                label: 'Set a Schedule',
            },
            {
                index: 1,
                label: 'Set a Schedule',
            },
            {
                index: 2,
                label: 'Set a Schedule',
            },
            {
                index: 3,
                label: isUpdate ? "Update the schedule?" : "Create the schedule?",
            },
        ]}

        completed={completedStep}
        activeIndex={activeIndex}
      />
      {renderCurrentStep()}
    </Box>
  )

}

export default UserTaskSchedule
