import React, {
  useState,
 } from 'react'
import TextField from '@components/TextField'
import { v4 as uuid } from 'uuid'
import { DailyTask, WeeklyTask } from '@lib/Progress/Todo/constants'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import Button from '@components/Button'

import {
  createDailyDeadline,
  submitEventForQueue,
  createWeeklyDeadline,
} from '@lib/Progress/Todo/UserTaskHelper2'
import { useToast } from '@chakra-ui/react'
import { dayjs } from '@lib/date-utils'
import _ from 'lodash'
import { useAppContext } from '@lib/user-context'
import { useRouter } from 'next/router'
import { Input } from '@chakra-ui/react'
import { TaskStatus } from '../../../lib/Progress/Todo/constants'
import { TaskType } from '@lib/dataTypes/TaskType'
import { insertTaskInDb, updateTaskByIdInDb } from '@lib/Progress/Todo/UserTaskHelper3'
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


export type TaskNameType = 'Daily'|'Weekly'|'Master'|'Grocery'


const styles = {
  task: {
    fontSize: '21px',
    lineHeight: '28px',
    color: '#221D23',
    width: '100%',
  } as React.CSSProperties,
  taskOverlay: {
    fontSize: '21px',
    lineHeight: '28px',
    color: '#221D23',
    padding: 10,
    width: 280,
  } as React.CSSProperties,
  taskOverlay2: {
    fontSize: '21px',
    lineHeight: '28px',
    color: '#221D23',
    width: '100%',
  } as React.CSSProperties,
   container: {
      flex: 1,
    } as React.CSSProperties,
}

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


type Props = {
  sub: string,
}
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
    

    const router = useRouter()
    const { client, sub } = useAppContext()
  
    console.log(sub, ' prerender sub inside useraddtask')

    const taskType = router?.query?.taskType as string
    const toast = useToast()

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
  
    const updateTaskInDb = async (
      toUpdateTask: TaskType,
    ) => {
      try {
        if (!toUpdateTask) {
          console.log('no toUpdateTask provided inside updateTaskinDb')
          return
        }

        await updateTaskByIdInDb(client, toUpdateTask)
      } catch (e) {
        console.log(e, ' updateDailyTaskToStoreById')
      }
    }

    const createDailyTaskToStore = async (
      text: string,
      important?: boolean,
      softDeadline?: string,
      hardDeadline?: string,
      status?: TaskStatus,
      eventId?: string,
      duration?: number,
      priority?: number,
    ) => {
        try {
          console.log(text, ' this is text inside createDailyTaskToStore')
          
          const newTask: TaskType = {
            id: uuid(),
            userId: sub,
            eventId,
            type: DailyTask,
            notes: text,
            important,
            status,
            priority: priority || 1,
            softDeadline,
            hardDeadline,
            duration,
            updatedAt: dayjs().format(),
            createdDate: dayjs().format()
          }

          await insertTaskInDb(client, newTask)

          return newTask
        } catch(e) {
        console.log(e, ' unable to create to store todo')
        }
    }

    const createDailyTaskNote = async () => {
      try {
        const notes = newDailyTaskText
        if (!notes) {
            toast({
              status: 'info',
              title: 'Empty',
              description: 'Your task is empty',
              duration: 9000,
              isClosable: true,
            })
            return
        }

        const task = await createDailyTaskToStore(notes, false, newDailyDeadlineType === 'soft' ? dayjs(newDailyDeadline).format() : undefined, newDailyDeadlineType === 'hard' ? dayjs(newDailyDeadline).format() : undefined, TaskStatus.TODO,
          undefined, newDailyDuration, newDailyPriority)
        
        console.log(task, ' this is task inside createDailyTaskNote')
        console.log(newDailyDeadlineType, ' newDailyDeadlineType ')
        const event = await createDailyDeadline(
            client, 
            sub, 
            task?.id, 
            notes, 
            newDailyPriority,
            dayjs(newDailyDeadline).format(),
            newDailyDeadlineType,
            newDailyDuration,
            toast,
        )
        
        console.log(event, ' this is event inside createDailyTaskNote')
        if (event) {

          await submitEventForQueue(event, client, sub, true, toast)
          task.eventId = event?.id
          await updateTaskInDb(
            task,
          )
        }

        setNewDailyTaskText('')
        setNewDailyPriority(1)
        setNewDailyDeadline(new Date())
        setNewDailyDeadlineType('soft')
        setNewDailyDuration(1)
        
        router.push({ pathname: '/Progress/Todo/UserTask', query: { isUpdate: uuid(), taskType: DailyTask }})
      } catch (e) {
        console.log(e, ' create daily task note')
      }
    }
  

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
  
    const createWeeklyTaskToStore = async (
      text: string,
      important?: boolean,
      softDeadline?: string,
      hardDeadline?: string,
      status?: TaskStatus,
      eventId?: string,
      duration?: number,
      priority?: number,
    ) => {
      try {

        console.log(text, ' this is text inside createDailyTaskToStore')
          
          const newTask: TaskType = {
            id: uuid(),
            userId: sub,
            eventId,
            type: WeeklyTask,
            notes: text,
            important,
            status,
            priority: priority || 1,
            softDeadline,
            hardDeadline,
            duration,
            updatedAt: dayjs().format(),
            createdDate: dayjs().format()
          }

          await insertTaskInDb(client, newTask)

          return newTask
      } catch(e) {
        console.log(e, ' unable to create to store todo')
      }
    }
  
    const createWeeklyTaskNote = async () => {
      try {
        const notes = newWeeklyTaskText
        console.log(notes, ' notes inside createWeeklyTaskNote')
        if (!notes) {
          toast({
            status: 'info',
            title: 'Empty',
            description: 'Your task is empty',
            duration: 9000,
            isClosable: true,
          })
          return
        }

        const task = await createWeeklyTaskToStore(notes, false, newWeeklyDeadlineType === 'soft' ? dayjs(newWeeklyDeadline).format() : '', newWeeklyDeadlineType === 'hard' ? dayjs(newWeeklyDeadline).format() : '', TaskStatus.TODO,
          undefined, newWeeklyDuration, newWeeklyPriority)
        
        console.log(task, ' task inside createWeeklyTaskNote')
        
        const event = await createWeeklyDeadline(
          client, 
          sub, 
          task?.id, 
          notes, 
          newWeeklyPriority,
          dayjs(newWeeklyDeadline).format(),
          newWeeklyDeadlineType,
          newWeeklyDuration,
          toast,
        )
        
        console.log(event, ' event inside createWeeklyTaskNote')

        await submitEventForQueue(event, client, sub, undefined, toast)
        
        task.eventId = event?.id

        await updateTaskInDb(
          task,
        )
        

        setNewWeeklyTaskText('')
        setNewWeeklyPriority(1)
        setNewWeeklyDeadline(new Date())
        setNewWeeklyDeadlineType('soft')
        setNewWeeklyDuration(1)

        router.push({ pathname: '/Progress/Todo/UserTask', query: { isUpdate: uuid(), taskType: WeeklyTask }})
      } catch (e) {
        console.log(e, ' unable to create weekly task note')
      }
    }
   

    if (taskType === 'Daily') {
       
      return (


        <Box justifyContent="space-around" alignItems="center">
          <Box>
            <Box mt={{ phone: 'm', tablet: 'l' }}  justifyContent="space-around" alignItems="flex-start" style={{ width: '100%' }}>
                <Box >
                <TextField
                  label="Notes"
                      placeholder="This is an example task"
                      multiline
                      numberOfLines={3}
                      
                      value={newDailyTaskText}
                      onChange={(e: { target: { value: string } }) => setNewDailyTaskText(e?.target?.value)}
                  />
                </Box>
            </Box>
            <Box mt={{ phone: 'm', tablet: 'l' }}  justifyContent="space-around" alignItems="flex-start" style={{ width: '100%' }}>
              <Text variant="body">Deadline</Text>
              <Input
                placeholder="Select Date and Time"
                size="md"
                type="datetime-local"
                onChange={(e) => {
                  setNewDailyDeadline(dayjs(e?.target?.value, "YYYY-MM-DDTHH:mm").toDate()) 
                }}
                value={dayjs(newDailyDeadline).format("YYYY-MM-DDTHH:mm")}

              />
              
            </Box>
            <Box mt={{ phone: 'm', tablet: 'l' }}  justifyContent="space-around" alignItems="flex-start">
              <select value={newDailyDeadlineType} onChange={(e) => setNewDailyDeadlineType(e?.target?.value as DeadlineType)} className="select select-primary w-full max-w-xs">
                  <option disabled defaultValue="Pick a deadline">Pick a deadline</option>
                  {_.map(deadlineOptions, option => (
                      <option
                          key={option.value}
                          value={option.value}
                      >{option.label}</option>
                      ))}
              </select>
            </Box>
            <Box mt={{ phone: 'm', tablet: 'l' }}  justifyContent="space-around" alignItems="flex-start" style={{ width: '100%' }}>
                <TextField
                  label="Duration (minutes)"
                  type="number"
                  onChange={(e: { target: { value: string } }) => setNewDailyDuration(parseInt(e?.target?.value.replace(/[^0-9.]/g, ''), 10))}
                  value={`${newDailyDuration}`}
                  placeholder="1"
                  style={{...(styles?.taskOverlay2),}}
                />
            </Box>
            <Box mt={{ phone: 'm', tablet: 'l' }}  justifyContent="space-around" alignItems="flex-start" style={{ width: '100%' }}>
                <TextField
                  label="Priority ( > 0)"
                  type="number"
                  onChange={(e: { target: { value: string } }) => onChangeDailyPriority(e?.target?.value)}
                  value={`${newDailyPriority}`}
                  placeholder="1"
                  style={{...(styles?.taskOverlay2),}}
                />
            </Box>
            <Box mt={{ phone: 'm', tablet: 'l' }} justifyContent="space-around" alignItems="center" style={{ width: '100%' }}>
              <Button onClick={createDailyTaskNote}>
                  Add
              </Button>
            </Box>
          </Box>
        </Box>
         
          
        )
    } else if (taskType === 'Weekly') {
      
      return (

            <Box justifyContent="space-around" alignItems="center">
              <Box>
                <Box mt={{ phone: 'm', tablet: 'l' }} justifyContent="space-around" alignItems="flex-start" style={{ width: '100%' }}>

                    <Box >
                    <TextField
                        label="Notes"
                        placeholder="This is an example task"
                        multiline
                        numberOfLines={4}
                        style={styles?.taskOverlay}
                        value={newWeeklyTaskText}
                        onChange={(e: { target: { value: string } }) => setNewWeeklyTaskText(e?.target?.value)}
                    />
                    </Box>
                </Box>
                <Box mt={{ phone: 'm', tablet: 'l' }}  justifyContent="space-around" alignItems="flex-start" style={{ width: '100%' }}>
                  <Text variant="body">Deadline</Text>
                  <Input
                    placeholder="Select Date and Time"
                    size="md"
                    type="datetime-local"
                    onChange={(e) => {
                      setNewWeeklyDeadline(dayjs(e?.target?.value, "YYYY-MM-DDTHH:mm").toDate())   
                    }}
                    value={dayjs(newWeeklyDeadline).format("YYYY-MM-DDTHH:mm")}
                  />
                  
                </Box>
                <Box mt={{ phone: 'm', tablet: 'l' }}  justifyContent="space-around" alignItems="flex-start">
                  <select value={newWeeklyDeadlineType} onChange={(e) => setNewWeeklyDeadlineType(e?.target?.value as DeadlineType)} className="select select-primary w-full max-w-xs">
                      <option disabled defaultValue="Pick a deadline">Pick a deadline</option>
                      {_.map(deadlineOptions, option => (
                          <option
                              key={option.value}
                              value={option.value}
                          >{option.label}</option>
                          ))}
                  </select>
                </Box>
                <Box mt={{ phone: 'm', tablet: 'l' }}  justifyContent="space-around" alignItems="flex-start" style={{ width: '100%' }}>
                  <TextField
                    label="Duration (minutes)"
                    type="number"
                    onChange={(e: { target: { value: string } }) => setNewWeeklyDuration(parseInt(e?.target?.value.replace(/[^0-9.]/g, ''), 10))}
                    value={`${newWeeklyDuration}`}
                    placeholder="1"
                    style={{...(styles?.taskOverlay2),}}
                  />
                </Box>
                <Box mt={{ phone: 'm', tablet: 'l' }}  justifyContent="space-around" alignItems="flex-start" style={{ width: '100%' }}>
                    <TextField
                    label="Priority ( > 0)"
                    type="number"
                    onChange={(e: { target: { value: string } }) => onChangeWeeklyPriority(e?.target?.value)}
                    value={`${newWeeklyPriority}`}
                    placeholder="1"
                    style={{...(styles?.taskOverlay2),}}
                    />
                </Box>
              </Box>
              <Box mt={{ phone: 'm', tablet: 'l' }}  justifyContent="space-around" alignItems="center" style={{ width: '100%' }}>
                <Button onClick={createWeeklyTaskNote}>
                    Add
                </Button>
              </Box>
            </Box>
         
      )

    }
  
    
    
   

}

export default UserAddTask



    


  









