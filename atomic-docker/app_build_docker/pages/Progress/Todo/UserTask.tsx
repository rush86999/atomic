import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
 } from 'react'
import {
  TouchableOpacity,
  StyleSheet,
  Pressable,
 } from 'react-native'
 import Image from 'next/image'
import Modal from 'react-modal'
import Fab from '@mui/material/Fab';
import AddIcon from '@mui/icons-material/Add';
import { SxProps, useTheme } from '@mui/material/styles'
import Zoom from '@mui/material/Zoom'
import TextField from '@components/TextField'
import { v4 as uuid } from 'uuid'
import { FaGripVertical } from "react-icons/fa";
import { MdSchedule, MdOutlineEventNote, MdLabelImportant } from "react-icons/md"
import { GiSandsOfTime } from "react-icons/gi";
import completedIcon from '@assets/icons/completed.png'
import { dayjs } from '@lib/date-utils'
import { useToast } from '@chakra-ui/react'

import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
} from '@chakra-ui/react'
import _ from 'lodash'

import Box from '@components/common/Box'
import Text from '@components/common/Text'
import Button from '@components/Button'

import { palette } from '@lib/theme/theme'
import {

  sortTasksByParent,
  getDisplayUIForWeb,
  sortByOrder,
  sortByStatus,
  updateDataArray,
  addParent,
  removeParent,
  addToDataArrayAfterIndex,
  onDragEndUpdateForWeb,
} from '@lib/Progress/Todo/UserTaskHelper'

import {
  removeEventForTask,
} from '@lib/Progress/Todo/UserTaskHelper2'


import {
  deleteTaskGivenId,
  insertTaskInDb,
  listEventsGivenIds,
  listTasksGivenUserId,
  updateTaskByIdInDb,
} from '@lib/Progress/Todo/UserTaskHelper3'
import { DailyTask, WeeklyTask } from '@lib/Progress/Todo/constants'
import { TaskStatus } from "@lib/Progress/Todo/constants"
import { getUserPreference } from '@lib/OnBoard/OnBoardHelper2'
import { useRouter } from 'next/router'
import { useAppContext } from '@lib/user-context'
import { pink } from '@mui/material/colors'
import { EventType } from '@lib/dataTypes/EventType';
import { TaskType } from '@lib/dataTypes/TaskType'
import { upsertManyTasksInDb } from '@lib/Progress/Todo/UserTaskHelper3';
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import type { DropResult, DraggableProvided, DraggableStateSnapshot } from "react-beautiful-dnd"
import { StarIcon } from '@chakra-ui/icons'

import { Icon } from '@chakra-ui/react'
import { BsThreeDotsVertical, BsThreeDots } from 'react-icons/bs'

function ThreeDotsVertical() {
  return <Icon as={BsThreeDotsVertical} w={8} h={8} color='gray.500' />
}

function ThreeDots() {
  return <Icon as={BsThreeDots} w={16} h={16} color='gray.900' />
}

const customModalStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
  },
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

export type DeadlineType = 'soft' | 'hard'

export type TaskPlusType = TaskType & {
  startDate?: string,
  endDate?: string,
  nextDay?: boolean,

}


export type TaskSubType = 'Daily'|'Weekly'|'Master'|'Grocery' | string


type BulletType = 'completed'|'bullet' |'future'|'nextDay'
  |'important'|'event'|'schedule'|'deadline'



export type DisplayUIType = TaskPlusType


const styles: any = {
  safeArea: {
    alignItems: 'flex-end',
  } as React.CSSProperties,
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  } as React.CSSProperties,
  fab: {
    margin: 16,
    marginTop: 0,
  } as React.CSSProperties,
  removeButton: {
    borderRadius: 50,
    backgroundColor: palette.lightGray,
    padding: 10,
  } as React.CSSProperties,
  infoButton: {
    backgroundColor: palette.lightGreen,
    borderRadius: 50,
    padding: 10,
    margin: 2,
  } as React.CSSProperties,
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
  taskMenu: {
    color: '#a6a6a6',
  } as React.CSSProperties,
}


const fabStyle = {
  position: 'absolute',
  bottom: 16,
  right: 16,
}

const renderBulletType = (value: BulletType) => {
  switch(value) {
    case 'completed':
      return (
              <Image
                src={completedIcon}
                style={{
                  width: 20,
                  height: 20,
                  
                }}
                alt={'completed icon'}
              />
            )
    case 'future':
      return (<Text
                variant="header"

              >
                {'\u003C'}
              </Text>)
    case 'nextDay':
      return (<Text
                variant="header"

              >
                {'\u003E'}
              </Text>)
    case 'bullet':
      return (<Text
                variant="header"

              >
                {'\u2022'}
              </Text>)

    case 'important':
      return (<Text
                variant="header"

              >
                {'\u274B'}
              </Text>)
    case 'event':
      return (<Text
                variant="header"

              >
                {'\u25EF'}
              </Text>)
    case 'schedule':
      return (<Text
                variant="header"

              >
                {'\u25A1'}
              </Text>)
    case 'deadline':
      return (<Text
                variant="header"

              >
                {'\u2299'}
              </Text>)
    default:
      return null
  }
}

function UserTask() {
  const [tasks, setTasks] = useState<TaskPlusType[]>([])
  const [localTaskType, setLocalTaskType] = useState<TaskSubType>('Daily')
  const [updateIndex, setUpdateIndex] = useState<number>(-1)
  const [isMenu, setIsMenu] = useState<boolean>(false)
  const [isTaskMenus, setIsTaskMenus] = useState<boolean[]>([])
  const [displayUIArray, setDisplayUIArray] = useState<DisplayUIType[]>([])
  const [dataIndexToDisplayArray, setDataIndexToDisplayArray] = useState<number[]>([])
 
  const [updateTaskText, setUpdateTaskText] = useState<string>('')
  const [isNewTask, setIsNewTask] = useState<boolean>(false)
  const [newTaskText, setNewTaskText] = useState<string>('')
  const [isUpdateTask, setIsUpdateTask] = useState<boolean>(false)
  const [disableTaskType, setDisableTaskType] = useState<boolean>(false)
  
  const itemsRef = useRef<Array<HTMLDivElement | null>>([])
  const toast = useToast()
  const theme = useTheme()

  const transitionDuration = {
    enter: theme.transitions.duration.enteringScreen,
    exit: theme.transitions.duration.leavingScreen,
  }


  const router = useRouter()
  const { sub, client } = useAppContext()
  const userId = sub


  const taskType = router.query?.taskType as TaskSubType

  const isUpdate = router.query?.isUpdate as string

  console.log(isUpdate, ' isUpdate inside UserTask')


   useEffect(() => {
       itemsRef.current = itemsRef.current.slice(0, tasks?.length);
   }, [tasks, tasks?.length])
  
  useEffect(() => {
    (async () => {
      if (!sub) {
          return
      }
      const user_preferenceDoc = await getUserPreference(client, sub)
      console.log(user_preferenceDoc?.onBoarded, ' user_preferenceDoc?.onBoarded')
      if (!user_preferenceDoc?.onBoarded) {
        console.log(' no user preference created')
        return router.push({ pathname: '/OnBoard/UserOnBoard', query: { taskType }})
      }
        
    })()
  }, [client, router, sub, taskType])




  useEffect(() => {
    if (!sub) {
        return
    }
    let microTaskType = ''
    console.log(taskType,  disableTaskType, localTaskType, ' taskType, disableTaskType, localTaskType')

    microTaskType = (((taskType === DailyTask) && !disableTaskType) && DailyTask) || (((!taskType || disableTaskType) && (localTaskType === DailyTask)) && DailyTask)

    if (!microTaskType) {
      microTaskType = ((taskType && !disableTaskType) && taskType)
        || (localTaskType === taskType) && taskType
    }
    

    if ((taskType && !disableTaskType) && (taskType !== localTaskType)) {
      setLocalTaskType(microTaskType)
    }

    if (!microTaskType) {
      console.log(' error no microTaskType')
      return
    }

    (async () => {
      try {

        const newTasks = await listTasksGivenUserId(client, sub, microTaskType)
        
        if (newTasks?.[0]?.id) {

          let isOrder = true
          for (let i = 0; i < newTasks.length; i++) {
            if (typeof (newTasks?.[i]?.order) !== 'number') {
              isOrder = false
            }
          }

          console.log(newTasks, ' this is newTasks')
          const oldOrderArray = newTasks.map((i) => (i?.order))
          const statusArray = newTasks?.map((i) => (i?.status))
          const eventIds = newTasks?.map(i => ((i && i?.eventId) || null))?.filter(e => !!e)
          const events: EventType[] = []

          if (eventIds?.length > 0) {
            const eventsGivenIds = await listEventsGivenIds(client, eventIds)
            events.push(...eventsGivenIds)
          }

          const newTaskPluses: TaskPlusType[] = []

          for (const newTask of newTasks) {
            const event = events?.find(e => (e?.taskId === newTask?.id))

            const newTaskPlus: TaskPlusType = { ...newTask, startDate: '',  endDate: '', nextDay: false}
            
            newTaskPlus.startDate = event?.startDate || ''
            newTaskPlus.endDate = event?.endDate || ''
            newTaskPlus.nextDay = (event?.startDate && dayjs(event?.startDate).isTomorrow()) || false


            newTaskPluses.push(_.omit(newTaskPlus, ['__typename']) as TaskPlusType)

          }


          if (isOrder) {
            
            const sortedByOrderNewTaskPluses = sortByOrder(newTaskPluses, oldOrderArray)
            const sortedByOrderStatusArray = sortByOrder(statusArray, oldOrderArray)

            const sortedByStatusSortedByOrderNewTaskPluses = sortByStatus(sortedByOrderNewTaskPluses, sortedByOrderStatusArray as TaskStatus[])

            const newIsTaskMenus = sortedByStatusSortedByOrderNewTaskPluses.map(() => false)
            const sortedByStatusSortedByOrderStatusArray = sortByStatus(sortedByOrderStatusArray, sortedByOrderStatusArray as TaskStatus[])
            setIsTaskMenus(newIsTaskMenus)
            setTasks(sortedByStatusSortedByOrderNewTaskPluses)

            const {
              displayUIArray: sortedDisplayUIArray,
              dataIndexToDisplayArray: sortedDataIndexToDisplayArray,
            } = getDisplayUIForWeb(sortedByStatusSortedByOrderNewTaskPluses, sortedByStatusSortedByOrderStatusArray, microTaskType, sub)

            setDisplayUIArray(sortedDisplayUIArray)
            setDataIndexToDisplayArray(sortedDataIndexToDisplayArray)
          } else {

            const newParentIdArray = newTaskPluses?.map(i => (i?.parentId || ''))

            const {
              sortedTaskPluses,
            } = sortTasksByParent(
              newParentIdArray,
              newTaskPluses,
            )

            const sortedOrderArray = sortedTaskPluses.map((_, inx) => (inx))

            const sortedByOrderNewTaskPluses = sortByOrder(newTaskPluses, sortedOrderArray)
            const sortedByOrderStatusArray = sortByOrder(statusArray, sortedOrderArray)

            const sortedByStatusSortedByOrderNewTaskPluses = sortByStatus(sortedByOrderNewTaskPluses, sortedByOrderStatusArray as TaskStatus[])

            const newIsTaskMenus = sortedByStatusSortedByOrderNewTaskPluses.map(() => false)
            const sortedByStatusSortedByOrderStatusArray = sortByStatus(sortedByOrderStatusArray, sortedByOrderStatusArray as TaskStatus[])
            setIsTaskMenus(newIsTaskMenus)
            setTasks(sortedByStatusSortedByOrderNewTaskPluses?.map((i, inx) => ({ ...i, order: inx, status: sortedByStatusSortedByOrderStatusArray[inx] })))

            const {
              displayUIArray: sortedDisplayUIArray,
              dataIndexToDisplayArray: sortedDataIndexToDisplayArray,
            } = getDisplayUIForWeb(sortedByStatusSortedByOrderNewTaskPluses, sortedByStatusSortedByOrderStatusArray, microTaskType, sub)

            setDisplayUIArray(sortedDisplayUIArray)
            setDataIndexToDisplayArray(sortedDataIndexToDisplayArray)

            const upsertTasks = sortedByStatusSortedByOrderNewTaskPluses?.map((i, inx) => ({...i, order: inx, status: sortedByStatusSortedByOrderStatusArray[inx]}))
            upsertTasks?.map(u => (console.log(JSON.stringify(_.omit(u, ['startDate', 'endDate', 'nextDay'])), ' upsertTask 1')))
            await upsertManyTasksInDb(client, upsertTasks?.map(i => _.omit(i, ['startDate', 'endDate', 'nextDay'])))
          }
        }
      } catch (e) {
        console.log(e, ' unable to set tasks')
      }
    })()
  }, [taskType, localTaskType, disableTaskType, isUpdate, client, sub])



  const createTaskInDbAndUpdateUI = async (
    type: TaskSubType, 
    notes: string,
    important?: boolean,
    status?: TaskStatus,
    priority?: number,
    softDeadline?: string,
    hardDeadline?: string,
    duration?: number,
    eventId?: string,
  ) => {
    try {

      const newTask: TaskType = {
        id: uuid(),
        userId,
        eventId,
        type,
        notes,
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

      

      const oldStatusArray = tasks?.map(t => (t?.status))
      const index = oldStatusArray?.lastIndexOf(TaskStatus.TODO)

      const newTasks = addToDataArrayAfterIndex(newTask, tasks, tasks?.[0]?.id ? false : true, index)

      const sortedOrderArray = newTasks.map((_, inx) => (inx))


      const sortedByOrderStatusArray = sortByOrder(oldStatusArray, sortedOrderArray)

      const sortedByStatusSortedByOrderNewTaskPluses = sortByStatus(newTasks, sortedByOrderStatusArray)

      const newIsTaskMenus = sortedByStatusSortedByOrderNewTaskPluses.map(() => false)

      setIsTaskMenus(newIsTaskMenus)
      setTasks(sortedByStatusSortedByOrderNewTaskPluses?.map((i, inx) => ({ ...i, order: inx, status: sortedByOrderStatusArray[inx] })))

      const {
        displayUIArray: sortedDisplayUIArray,
        dataIndexToDisplayArray: sortedDataIndexToDisplayArray,
      } = getDisplayUIForWeb(sortedByStatusSortedByOrderNewTaskPluses, sortedByOrderStatusArray, localTaskType, sub)

      setDisplayUIArray(sortedDisplayUIArray)
      setDataIndexToDisplayArray(sortedDataIndexToDisplayArray)

      const upsertTasks = sortedByStatusSortedByOrderNewTaskPluses?.map((i, inx) => ({...i, order: inx, status: sortedByOrderStatusArray[inx]}))

      await upsertManyTasksInDb(client, upsertTasks?.map(i => _.omit(i, ['startDate', 'endDate', 'nextDay']) as TaskType))

      return newTask?.id
    } catch (e) {
      console.log(e, ' unable to create daily task to db')
    }
  }


  const createTaskNote = async () => {
    try {

        const notes = newTaskText

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

      await createTaskInDbAndUpdateUI(localTaskType, notes, false, TaskStatus.TODO, 1, undefined, undefined, undefined, undefined)

        setNewTaskText('')
        setIsNewTask(!isNewTask)
        
      } catch(e) {
        console.log(e, ' unable to createTask')
      }
  }

  const updateTaskNote = async () => {
    try {
      if (!updateTaskText) {
        console.log(updateTaskText, ' no updateTaskText present updateTaskNotes')
        setIsUpdateTask(false)

        return
      }

      setIsUpdateTask(false)

      const notes = updateTaskText
      const index = updateIndex
      console.log(notes, index, ' notes, index')
      const toUpdateTask = _.cloneDeep(tasks[updateIndex])

      console.log(toUpdateTask, ' toUpdateTask')

      toUpdateTask.notes = notes
      const UIIndex = dataIndexToDisplayArray.indexOf(index)

      updateDataArray(toUpdateTask, displayUIArray, setDisplayUIArray, UIIndex)
      updateDataArray(toUpdateTask, tasks, setTasks, updateIndex)

      await updateTaskByIdInDb(client, toUpdateTask)

    } catch (e) {
      console.log(e, ' unable to update task')
      
      setIsUpdateTask(false)
    }
    
    setIsUpdateTask(false)
    
  }

  const deleteTask = async(
    index: number,
  ) => {
    try {
      const task = tasks[index]

      if (!task) {
          console.log(index, ' no taskid present to deleteTask')
         return
      }

      if (task?.eventId) {
        await removeEventForTask(client, task, sub)
      }
      
      const deleted = await deleteTaskGivenId(client, task?.id)
      console.log(deleted, ' successfully deleted task')

      const UIIndex = dataIndexToDisplayArray.indexOf(index)

      const newTasks = tasks?.slice(0, index)
        .concat(tasks?.slice(index + 1))

      const newDisplayUIArray = displayUIArray?.slice(0, UIIndex)
        .concat(displayUIArray?.slice(UIIndex + 1))
      
      const newDataIndexToDisplayArray = dataIndexToDisplayArray?.slice(0, UIIndex)
        .concat(dataIndexToDisplayArray?.slice(UIIndex + 1))
      
      const newIsTaskMenus = newTasks.map(() => false)

      setIsTaskMenus(newIsTaskMenus)
      setTasks(newTasks)
      setDisplayUIArray(newDisplayUIArray)
      setDataIndexToDisplayArray(newDataIndexToDisplayArray)
    } catch (e) {
      console.log(e, ' unable to delete task')
    }
  }

  const updateImportantTask = async (
    index: number,
  ) => {
    try {
      const oldTask = tasks[index]

      if (!oldTask?.id) {
        return
      }

      const toUpdateTask = _.cloneDeep(oldTask)

      toUpdateTask.important = !oldTask.important

      const UIIndex = dataIndexToDisplayArray.indexOf(index)

      updateDataArray(toUpdateTask, displayUIArray, setDisplayUIArray, UIIndex)
      updateDataArray(toUpdateTask, tasks, setTasks, updateIndex)
      await updateTaskByIdInDb(client, toUpdateTask)
      
    } catch (e) {
      console.log(e, ' unable to update important task')
    }
  }

  const updateCompletedTask = async (
    index: number,
  ) => {
      try {
        const oldTask = tasks[index]

        if (!oldTask?.id) {
          return
        }

        const toUpdateTask = _.cloneDeep(oldTask)

        if (!!oldTask?.completedDate) {
          toUpdateTask.completedDate = null
        } else {
          toUpdateTask.completedDate = dayjs().format()
        }

        const UIIndex = dataIndexToDisplayArray.indexOf(index)

        updateDataArray(toUpdateTask, displayUIArray, setDisplayUIArray, UIIndex)
        updateDataArray(toUpdateTask, tasks, setTasks, updateIndex)
        await updateTaskByIdInDb(client, toUpdateTask)
        
      } catch (e) {
        console.log(e, ' unable to update completed task')
      }
  }


  const hideMenu = () => setIsMenu(false)


  const hideTaskMenu = (index: number) => {
    setIsTaskMenus(isTaskMenus.slice(0, index).concat([false]).concat(isTaskMenus.slice(index + 1)))
  }

  const changeTaskList = async (type: TaskSubType) => {
    setDisableTaskType(true)
    setLocalTaskType(type)
      
  }

  const changeToDailyTaskList = () => changeTaskList('Daily')

  const changeToWeeklyTaskList = () => changeTaskList('Weekly')

  const changeToMasterTaskList = () => changeTaskList('Master')

  const changeToGroceryTaskList = () => changeTaskList('Grocery')

  const navigateToTaskSchedule = (index: number, isTaskUpdate: boolean) => {
    router.push({pathname: '/Schedule/UserTaskSchedule', query: {
      taskType: localTaskType,
      isUpdate: isTaskUpdate,
      taskId: tasks[index]?.id,
    }})
  }

  const navigateToTaskDeadline = (index: number, isTaskUpdate: boolean, deadlineType: 'soft' | 'hard') => {
    router.push({ pathname: '/Schedule/UserTaskDeadline', query: {
      taskType: localTaskType,
      isUpdate: isTaskUpdate,
      taskId: tasks[index]?.id,
      deadlineType,
    }})
  }

  const navigateToTaskEvent = (index: number, isTaskUpdate: boolean) => {
    router.push({ pathname: '/Schedule/UserTaskEvent', query: {
      taskType: localTaskType,
      isUpdate: isTaskUpdate,
      taskId: tasks[index]?.id,
    }})
  }


  const changeIsNewTask = () => setIsNewTask(!isNewTask)


  const closeIsUpdateTask = () => {
    setIsUpdateTask(false)
  }

  const onNewTaskText = (text: string) => setNewTaskText(text)

  const addNewTask = () => {

    if (localTaskType === DailyTask) {
      
      router.push({ pathname: '/Progress/Todo/UserAddTask', query: { taskType: localTaskType }})
    } else if (localTaskType === WeeklyTask) {
      router.push({ pathname: '/Progress/Todo/UserAddTask', query: { taskType: localTaskType }})
    } else {
      setIsNewTask(true)
    }
  }
  
  const updateNoteAtIndex = (i: number) => {

    setUpdateIndex(i)
    setUpdateTaskText(tasks?.[i]?.notes)
    setIsUpdateTask(true)
    itemsRef?.current?.[i]?.blur()

    console.log(itemsRef?.current?.[i], ' itemsRef?.current?.[i]')
    
  }

  const onDragEnd = async (dragEnd: DropResult)  => {
    return onDragEndUpdateForWeb(
      dragEnd,
      tasks,
      displayUIArray,
      setDisplayUIArray,
      dataIndexToDisplayArray,
      setDataIndexToDisplayArray,
      localTaskType,
      sub,
      client,
    )
  }

  const addParentToTask = async (index: number) => {
    try {
      return addParent(
        client,
        index,
        index - 1,
        tasks,
      )
    } catch(e) {
      console.log(e, ' unable to add parent')
    }
  }

  const removeParentFromTask = async (
    index: number,
  ) => {
    try {
      return removeParent(
        client,
        index,
        tasks,
      )
    } catch(e) {
      console.log(e, ' unable to remove parent from task')
    }
  }

  const grid = 8;

  const getItemStyle = (isDragging: boolean, draggableStyle: object) => ({
    userSelect: "none" as any,
    padding: grid * 2,
    margin: `0 0 ${grid}px 0`,

    borderColor: isDragging ? palette.purplePrimary : "transparent",
    borderWidth: '5px',

    ...draggableStyle
  })

  const renderItem = (displayUI: DisplayUIType, index: number, provided: DraggableProvided, snapshot: DraggableStateSnapshot) => {

    const i = dataIndexToDisplayArray?.[index]
    const indexBefore = dataIndexToDisplayArray?.[index - 1]
    
    if (i === -1) {
      return (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={getItemStyle(
            snapshot.isDragging,
            provided.draggableProps.style
          )}
        >
          <Box
            style={{ width: '100%' }}
          >
            <Text variant="optionHeader" textAlign="left">
              {displayUI?.notes}
            </Text>
          </Box>
        </div>
      )
    }


    if (indexBefore === -1) {
      return (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={getItemStyle(
            snapshot.isDragging,
            provided.draggableProps.style
          )}
        >
          <Box
            flexDirection="row"
            justifyContent="space-between"
            style={{ width: '100%' }}
            pt={{ phone: 'm', tablet: 's' }}
          >
            <Box flex={1}>
              <Box flexDirection="row">
                {displayUI?.important
                  && renderBulletType('important')}
                <Pressable hitSlop={20} onPress={() => updateCompletedTask(i)}>
                  {displayUI?.completedDate
                    ? (renderBulletType('completed'))
                    : (renderBulletType('bullet'))}
                </Pressable>
              </Box>
              {displayUI?.startDate
                ? (
                  <Box>
                    {dayjs(displayUI?.startDate).isTomorrow()
                      && (renderBulletType('nextDay'))}
                  </Box>
              ) : null}
            </Box>
            <Box flex={7}>
              <TextField
                numberOfLines={3}
                innerRef={(el: HTMLDivElement) => itemsRef.current[i] = el}
                multiline
                style={{...(styles.task)}}
                value={displayUI?.notes}
                onFocus={() => updateNoteAtIndex(i)}
                disabled={snapshot.isDragging}
              />
              <Box flexDirection="row" flexWrap="wrap" >
                  {displayUI?.important
                    ? (
                      <Pressable onPress={() => updateImportantTask(i)} >
                        <MdLabelImportant size="3em" color={palette.purplePrimary} />
                      </Pressable>
                    ) : null}
                  {(displayUI?.startDate
                    && dayjs(displayUI?.startDate).isToday())
                    ? (
                      <TouchableOpacity style={styles.infoButton}>
                        <Text variant="toDoButton">
                          Today
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                    {(displayUI?.startDate
                      && dayjs(displayUI?.startDate).isTomorrow())
                      ? (
                        <TouchableOpacity style={styles.infoButton}>
                          <Text variant="toDoButton">
                            Tomorrow
                          </Text>
                        </TouchableOpacity>
                      ) : null}
                  {displayUI?.startDate
                    ? (
                      <TouchableOpacity style={styles.infoButton}>
                        <Text variant="toDoButton">
                          {dayjs(displayUI.startDate).format('l')}
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  {displayUI?.eventId
                    ? (
                      <Pressable onPress={() => navigateToTaskEvent(i, true)} onLongPress={async () => removeEventForTask(client, displayUI, userId)}>
                        <MdOutlineEventNote size="3em" color={palette.purplePrimary} />
                      </Pressable>
                    ) : null}
                  {displayUI?.eventId
                    ? (
                      <Pressable onPress={() => navigateToTaskSchedule(i, true)} onLongPress={async () => removeEventForTask(client, displayUI, userId)}>
                        <MdSchedule size="3em" color={palette.purplePrimary} />
                      </Pressable>
                    ) : null
                  }
                  {displayUI?.softDeadline
                    ? (
                      <TouchableOpacity style={styles.infoButton}>
                        <Text variant="toDoButton">
                          Soft Deadline - {dayjs(displayUI?.softDeadline).format('lll')}
                        </Text>
                      </TouchableOpacity>
                    ) : null
                  }
                  {displayUI?.hardDeadline
                    ? (
                      <TouchableOpacity style={styles.infoButton}>
                        <Text variant="toDoButton">
                          Hard Deadline - {dayjs(displayUI?.hardDeadline).format('lll')}
                        </Text>
                      </TouchableOpacity>
                    ) : null
                  }
                  {(displayUI?.softDeadline || displayUI?.hardDeadline)
                    ? (
                      <Pressable onPress={() => navigateToTaskDeadline(i, true, displayUI?.softDeadline ? 'soft' : 'hard')} onLongPress={() => removeEventForTask(client, displayUI, userId)}>
                        <GiSandsOfTime size="3em" color={palette.purplePrimary} />
                      </Pressable>
                    ) : null
                  }
                  {displayUI?.duration > 0
                    ? (
                      <TouchableOpacity style={styles.infoButton}>
                        <Text variant="toDoButton">
                          Duration - {displayUI.duration} minutes
                        </Text>
                      </TouchableOpacity>
                    ) : null
                  }
              </Box>
            </Box>
            <Box flex={1} flexDirection="column" justifyContent="flex-start">
              <Menu>
                <MenuButton
                  as={IconButton}
                  aria-label='Options'
                  icon={<ThreeDotsVertical />}
                  variant='outline'
                  isOpen={isTaskMenus[i]}
                  onClose={() => hideTaskMenu(i)}
                />
                  <MenuList>
                    {
                      displayUI?.important
                      ? (
                          <MenuItem icon={<StarIcon />}  onClick={async () => { hideTaskMenu(i); await updateImportantTask(i); }}>
                            Remove Important
                          </MenuItem>
                      ) : (
                          <MenuItem icon={<StarIcon />} onClick={ async () => { hideTaskMenu(i); await updateImportantTask(i); }}>
                            Add Important
                          </MenuItem>
                      )
                    }
                    {
                      displayUI?.parentId
                      ? (
                          <MenuItem  onClick={async () => { hideTaskMenu(i); return removeParentFromTask(i) }}>
                            Remove Parent
                          </MenuItem>
                      ) : (
                            <MenuItem  onClick={async () => { hideTaskMenu(i); return addParentToTask(i) }}>
                              Add Parent
                            </MenuItem>
                      )
                    }
                    <MenuItem  onClick={async () => { hideTaskMenu(i); await deleteTask(i) }}>
                      Remove Task
                    </MenuItem>
                  </MenuList>
              </Menu>
            </Box>
            <Box flex={1} alignItems="flex-end">
              
                <FaGripVertical
                  size="3em"
                  color={palette.lightGray}
                />
              
            </Box>
          </Box>
        </div>
      )
    }

    if (displayUI?.parentId) {
      return (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={getItemStyle(
            snapshot.isDragging,
            provided.draggableProps.style
          )}
        >
          <Box
            flexDirection="row"
            justifyContent="space-between"
            style={{ width: '100%' }}
            pt={{ phone: 'm', tablet: 's' }}
          >
            <Box flex={1} />
            <Box flex={9} justifyContent="space-between" flexDirection="row">
              <Box flex={1}>
                <Box flexDirection="row">
                  {displayUI?.important
                    && renderBulletType('important')}
                  <Pressable hitSlop={20} onPress={() => updateCompletedTask(i)}>
                    {displayUI?.completedDate
                      ? (renderBulletType('completed'))
                      : (renderBulletType('bullet'))}
                  </Pressable>
                </Box>
                {displayUI?.startDate
                  ? (
                    <Box>
                      {dayjs(displayUI.startDate).isTomorrow()
                        && (renderBulletType('nextDay'))}
                    </Box>
                ) : null}
              </Box>
              <Box flex={7}>
                <TextField
                  numberOfLines={3}
                  innerRef={(el: HTMLDivElement) => itemsRef.current[i] = el}
                  multiline
                  style={{...(styles.task)}}
                  value={displayUI?.notes}
                  onFocus={() => updateNoteAtIndex(i)}
                  disabled={snapshot.isDragging}
                />
                <Box flexDirection="row" flexWrap="wrap" >
                  {displayUI?.important
                    ? (
                      <Pressable onPress={() => updateImportantTask(i)} >
                        <MdLabelImportant size="3em" color={palette.purplePrimary} />
                      </Pressable>
                    ) : null}
                  {(displayUI?.startDate
                    && dayjs(displayUI?.startDate).isToday())
                    ? (
                      <TouchableOpacity style={styles.infoButton}>
                        <Text variant="toDoButton">
                          Today
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                    {(displayUI?.startDate
                      && dayjs(displayUI?.startDate).isTomorrow())
                      ? (
                        <TouchableOpacity style={styles.infoButton}>
                          <Text variant="toDoButton">
                            Tomorrow
                          </Text>
                        </TouchableOpacity>
                      ) : null}
                  {displayUI?.startDate
                    ? (
                      <TouchableOpacity style={styles.infoButton}>
                        <Text variant="toDoButton">
                          {dayjs(displayUI?.startDate).format('l')}
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  {displayUI?.eventId
                    ? (
                      <Pressable onPress={() => navigateToTaskEvent(i, true)} onLongPress={async () => removeEventForTask(client, displayUI, userId)}>
                        <MdOutlineEventNote size="3em" color={palette.purplePrimary} />
                      </Pressable>
                    ) : null}
                  {displayUI?.eventId
                    ? (
                      <Pressable onPress={() => navigateToTaskSchedule(i, true)} onLongPress={async () => removeEventForTask(client, displayUI, userId)}>
                        <MdSchedule size="3em" color={palette.purplePrimary} />
                      </Pressable>
                    ) : null
                  }
                  {displayUI?.softDeadline
                    ? (
                      <TouchableOpacity style={styles.infoButton}>
                        <Text variant="toDoButton">
                          Soft Deadline - {dayjs(displayUI?.softDeadline).format('lll')}
                        </Text>
                      </TouchableOpacity>
                    ) : null
                  }
                  {displayUI?.hardDeadline
                    ? (
                      <TouchableOpacity style={styles.infoButton}>
                        <Text variant="toDoButton">
                          Hard Deadline - {dayjs(displayUI?.hardDeadline).format('lll')}
                        </Text>
                      </TouchableOpacity>
                    ) : null
                  }
                  {(displayUI?.softDeadline || displayUI?.hardDeadline)
                    ? (
                      <Pressable onPress={() => navigateToTaskDeadline(i, true, displayUI?.softDeadline ? 'soft' : 'hard')} onLongPress={() => removeEventForTask(client, displayUI, userId)}>
                        <GiSandsOfTime size="3em" color={palette.purplePrimary} />
                      </Pressable>
                    ) : null
                  }
                  {displayUI?.duration > 0
                    ? (
                      <TouchableOpacity style={styles.infoButton}>
                        <Text variant="toDoButton">
                          Duration - {displayUI?.duration} minutes
                        </Text>
                      </TouchableOpacity>
                    ) : null
                  }
                </Box>
              </Box>
              <Box flex={1} flexDirection="column" justifyContent="flex-start">
                <Menu>
                <MenuButton
                  as={IconButton}
                  aria-label='Options'
                  icon={<ThreeDotsVertical />}
                  variant='outline'
                  isOpen={isTaskMenus[i]}
                  onClose={() => hideTaskMenu(i)}
                />
                  <MenuList>
                    {
                      displayUI?.important
                      ? (
                          <MenuItem icon={<StarIcon />}  onClick={async () => { hideTaskMenu(i); await updateImportantTask(i); }}>
                            Remove Important
                          </MenuItem>
                      ) : (
                          <MenuItem icon={<StarIcon />} onClick={ async () => { hideTaskMenu(i); await updateImportantTask(i); }}>
                            Add Important
                          </MenuItem>
                      )
                    }
                    {
                      displayUI?.parentId
                      ? (
                          <MenuItem  onClick={async () => { hideTaskMenu(i); return removeParentFromTask(i) }}>
                            Remove Parent
                          </MenuItem>
                      ) : (
                            <MenuItem  onClick={async () => { hideTaskMenu(i); return addParentToTask(i) }}>
                              Add Parent
                            </MenuItem>
                      )
                    }
                    <MenuItem  onClick={async () => { hideTaskMenu(i); await deleteTask(i) }}>
                      Remove Task
                    </MenuItem>
                  </MenuList>
                </Menu>
              </Box>
              <Box flex={1} alignItems="flex-end">
              
                <FaGripVertical
                  size="3em"
                  color={palette.lightGray}
                />
                
              </Box>
            </Box>
          </Box>
        </div>
      )
    }

    return (
      <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={getItemStyle(
            snapshot.isDragging,
            provided.draggableProps.style
          )}
        >
          <Box
            flexDirection="row"
            justifyContent="space-between"
            style={{ width: '100%' }}
            pt={{ phone: 'm', tablet: 's' }}
          >
            <Box flex={1}>
              <Box flexDirection="row">
                {displayUI?.important
                  && renderBulletType('important')}
                <Pressable hitSlop={20} onPress={() => updateCompletedTask(i)}>
                  {displayUI?.completedDate
                    ? (renderBulletType('completed'))
                    : (renderBulletType('bullet'))}
                </Pressable>
              </Box>
              {displayUI?.startDate
                ? (
                  <Box>
                    {dayjs(displayUI?.startDate).isTomorrow()
                      && (renderBulletType('nextDay'))}
                  </Box>
              ) : null}
            </Box>
            <Box flex={7}>
              <TextField
                numberOfLines={3}
                innerRef={(el: HTMLDivElement) => itemsRef.current[i] = el}
                multiline
                style={{...(styles.task)}}
                value={displayUI?.notes}
                onFocus={() => updateNoteAtIndex(i)}
                disabled={snapshot.isDragging}
              />
              <Box flexDirection="row" flexWrap="wrap" >
                    {displayUI?.important
                      ? (
                        <Pressable onPress={() => updateImportantTask(i)} >
                          <MdLabelImportant size="3em" color={palette.purplePrimary} />
                        </Pressable>
                      ) : null}
                    {(displayUI?.startDate
                      && dayjs(displayUI?.startDate).isToday())
                      ? (
                        <TouchableOpacity style={styles.infoButton}>
                          <Text variant="toDoButton">
                            Today
                          </Text>
                        </TouchableOpacity>
                      ) : null}
                      {(displayUI?.startDate
                        && dayjs(displayUI?.startDate).isTomorrow())
                        ? (
                          <TouchableOpacity style={styles.infoButton}>
                            <Text variant="toDoButton">
                              Tomorrow
                            </Text>
                          </TouchableOpacity>
                        ) : null}
                    {displayUI?.startDate
                      ? (
                        <TouchableOpacity style={styles.infoButton}>
                          <Text variant="toDoButton">
                            {dayjs(displayUI?.startDate).format('l')}
                          </Text>
                        </TouchableOpacity>
                      ) : null}
                    {displayUI?.eventId
                      ? (
                        <Pressable onPress={() => navigateToTaskEvent(i, true)} onLongPress={async () => removeEventForTask(client, displayUI, userId)}>
                          <MdOutlineEventNote size="3em" color={palette.purplePrimary} />
                        </Pressable>
                      ) : null}
                    {displayUI?.eventId
                      ? (
                        <Pressable onPress={() => navigateToTaskSchedule(i, true)} onLongPress={async () => removeEventForTask(client, displayUI, userId)}>
                          <MdSchedule size="3em" color={palette.purplePrimary} />
                        </Pressable>
                      ) : null
                    }
                    {displayUI?.softDeadline
                      ? (
                        <TouchableOpacity style={styles.infoButton}>
                          <Text variant="toDoButton">
                            Soft Deadline - {dayjs(displayUI?.softDeadline).format('lll')}
                          </Text>
                        </TouchableOpacity>
                      ) : null
                    }
                    {displayUI?.hardDeadline
                      ? (
                        <TouchableOpacity style={styles.infoButton}>
                          <Text variant="toDoButton">
                            Hard Deadline - {dayjs(displayUI?.hardDeadline).format('lll')}
                          </Text>
                        </TouchableOpacity>
                      ) : null
                    }
                    {(displayUI?.softDeadline || displayUI?.hardDeadline)
                      ? (
                        <Pressable onPress={() => navigateToTaskDeadline(i, true, displayUI?.softDeadline ? 'soft' : 'hard')} onLongPress={() => removeEventForTask(client, displayUI, userId)}>
                          <GiSandsOfTime size="3em" color={palette.purplePrimary} />
                        </Pressable>
                      ) : null
                    }
                    {displayUI?.duration > 0
                      ? (
                        <TouchableOpacity style={styles.infoButton}>
                          <Text variant="toDoButton">
                            Duration - {displayUI?.duration} minutes
                          </Text>
                        </TouchableOpacity>
                      ) : null
                    }
              </Box>
            </Box>
            <Box flex={1} flexDirection="column" justifyContent="flex-start">
              <Menu>
                <MenuButton
                  as={IconButton}
                  aria-label='Options'
                  icon={<ThreeDotsVertical />}
                  variant='outline'
                  isOpen={isTaskMenus[i]}
                  onClose={() => hideTaskMenu(i)}
                />
                  <MenuList>
                    {
                      displayUI?.important
                      ? (
                          <MenuItem icon={<StarIcon />}  onClick={async () => { hideTaskMenu(i); await updateImportantTask(i); }}>
                            Remove Important
                          </MenuItem>
                      ) : (
                          <MenuItem icon={<StarIcon />} onClick={ async () => { hideTaskMenu(i); await updateImportantTask(i); }}>
                            Add Important
                          </MenuItem>
                      )
                    }
                    {
                      displayUI?.parentId
                      ? (
                          <MenuItem  onClick={async () => { hideTaskMenu(i); return removeParentFromTask(i) }}>
                            Remove Parent
                          </MenuItem>
                      ) : (
                            <MenuItem  onClick={async () => { hideTaskMenu(i); return addParentToTask(i) }}>
                              Add Parent
                            </MenuItem>
                      )
                    }
                    <MenuItem  onClick={async () => { hideTaskMenu(i); await deleteTask(i) }}>
                      Remove Task
                    </MenuItem>
                  </MenuList>
              </Menu>
            </Box>
            <Box flex={1} alignItems="flex-end">
              
                <FaGripVertical
                  size="3em"
                  color={palette.lightGray}
                />
              
            </Box>
          </Box>

      </div>
    )
  }

  return (
      <Box flex={1}>
        <Box flex={1} flexDirection="row" justifyContent="flex-end" alignItems="center">
          <Box>
            <Menu>
                <MenuButton
                  as={IconButton}
                  aria-label='Options'
                  icon={<ThreeDots />}
                  variant='outline'
                  isOpen={isMenu}
                  onClose={hideMenu}
                />
                <MenuList>
                  <MenuItem onClick={() => { hideMenu(); changeToDailyTaskList() }}>
                    Daily
                  </MenuItem>
                  <MenuItem onClick={() => { hideMenu(); changeToWeeklyTaskList() }}>
                    Weekly
                  </MenuItem>
                  <MenuItem  onClick={() => { hideMenu(); changeToMasterTaskList() }}>
                    Master
                  </MenuItem>
                  <MenuItem onClick={() => { hideMenu(); changeToGroceryTaskList() }}>
                    Grocery
                  </MenuItem>
                </MenuList>
            </Menu>
          </Box>
        </Box>
        <Box flex={1} flexDirection="row" justifyContent="center">
          <Text variant="header">
            {localTaskType}
          </Text>
        </Box>
        <Box flex={8} flexDirection="column" justifyContent="center" alignItems="center">
          {displayUIArray?.[0]
          ? (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="droppable">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                    >
                    {displayUIArray?.map((displayUI, index) => (
                      <Draggable key={displayUI.id} draggableId={displayUI.id} index={index}>
                        {(provided, snapshot) => renderItem(displayUI, index, provided, snapshot)}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                  )}
              </Droppable>
              
            </DragDropContext>
            )
          : (
            <Box flex={1} justifyContent="center" alignItems="center" minHeight="60vh">
              <div>
                <Text variant="backgroundText">
                  Add a Task
                </Text>
              </div>
            </Box>
          )}
        </Box>
        
        <Zoom
            in
            timeout={transitionDuration}
            style={{
              transitionDelay: `${transitionDuration.exit}ms`,
            }}
            unmountOnExit
          >
            <Fab sx={fabStyle as SxProps} aria-label={'Add'} color="primary" onClick={addNewTask}>
              <AddIcon sx={{ color: pink[500] }} />
            </Fab>
        </Zoom>
        <Box>
          <Modal isOpen={isNewTask} onRequestClose={changeIsNewTask} style={customModalStyles}>
            <Box justifyContent="space-around" alignItems="center">
              <TextField
                numberOfLines={3}
                multiline
                style={styles?.taskOverlay}
                value={newTaskText}
                onChange={(e: { target: { value: string } }) => onNewTaskText(e?.target?.value)}
              />
              <Button onClick={createTaskNote}>
                Add
              </Button>
            </Box>
          </Modal>
          <Modal isOpen={isUpdateTask} onRequestClose={closeIsUpdateTask} style={customModalStyles}>
            <Box justifyContent="space-around" alignItems="center">
              <TextField
                numberOfLines={3}
                
                multiline
                style={styles?.taskOverlay}
                value={updateTaskText}
                onChange={(e: { target: { value: string } }) => setUpdateTaskText(e?.target?.value)}
              />
              <Button onClick={updateTaskNote}>
                Update
              </Button>
              <button className="btn btn-link no-underline hover:no-underline" onClick={closeIsUpdateTask}>
                Close
              </button>
            </Box>
          </Modal>
        </Box>
      </Box>
  )
}

export default UserTask
