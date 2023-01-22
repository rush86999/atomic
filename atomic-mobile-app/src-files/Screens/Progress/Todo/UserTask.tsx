import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
 } from 'react'
import {
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  Pressable,
  useWindowDimensions,
  Appearance,
  SafeAreaView,
  Modal as Modal2,
  TextInput,
  Keyboard,
 } from 'react-native'
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from 'react-native-draggable-flatlist'
import {DataStore, SortDirection} from '@aws-amplify/datastore'
import {  TextField, Modal, Picker, PickerValue, Incubator } from 'react-native-ui-lib'
import { Overlay, FAB } from 'react-native-elements/src'
import {
  TourGuideZone,
  useTourGuideController,
} from 'rn-tourguide'
import GripIcon from 'react-native-vector-icons/FontAwesome5'
import ScheduleIcon from 'react-native-vector-icons/MaterialIcons'
import DeadlineIcon from 'react-native-vector-icons/MaterialCommunityIcons'
import EventIcon from 'react-native-vector-icons/MaterialCommunityIcons'
import ImportantIcon from 'react-native-vector-icons/MaterialIcons'

import { dayjs } from '@app/date-utils'

import Toast from 'react-native-toast-message'

import { useNavigation, RouteProp, useFocusEffect } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'

import { Menu } from 'react-native-paper'
import DatePicker from 'react-native-date-picker'
import _ from 'lodash'

import { v4 as uuid } from 'uuid'
import { S3Client } from '@aws-sdk/client-s3'
import { Auth } from 'aws-amplify'

import Realm from 'realm'
import {
  DailyToDo,
  WeeklyToDo,
  MasterToDo,
  GroceryToDo,
  Status,
  ScheduleToDo,
  User,
  ToDoStatus,
} from '@models'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import Button from '@components/Button'

import { palette } from '@theme/theme'

import {
  getS3AndCredId,
  _createDailyTaskToStore,
  cleanUpTaskSchedule,
  sortTasksByParent,
  onDragEndUpdate,
  dragEnd,
  getDisplayUI,
  sortByOrder,
  sortByStatus,
  addToDataArrayAfterIndex,
  addToOrderArrayAfterIndexWithNewOrder,
  removeFromDataArray,
  updateDataArray,
  addParent,
  removeParent,
  deleteChildrenOfTask,
} from '@progress/Todo/UserTaskHelper'

import {
  deleteEventForTask,
  createDailyDeadline,
  getOrRequestCalendar,
  submitEventForQueue,
  createWeeklyDeadline,
} from '@progress/Todo/UserTaskHelper2'

import {
  updateTaskInStore,
  TableName,
  queryNotion,
  deleteNotionBlock,
} from '@progress/Todo/IntegrationHelper'

import { API, GraphQLResult } from '@aws-amplify/api'

import GetUserProfile from '@graphql/Queries/GetUserProfile'

import {
  GetUserProfileQuery,
  GetUserProfileQueryVariables,
} from '@app/API'

import {
  UserProfile as UserProfileRealm,
} from '@realm/UserProfile'

import {
  OnBoard as OnBoardRealm,
} from '@realm/OnBoard'

import { NotionResourceName } from '@progress/Todo/constants'
import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { getUserPreference } from '@screens/OnBoard/OnBoardHelper'
import { AdminBetaTestingType } from '@app/dataTypes/Admin_Beta_TestingType'
import { ActiveSubscriptionType } from '@dataTypes/active_subscriptionType'
import getAdminBetaTesting from '@app/apollo/gql/getAdminBetaTesting'
import listActiveSubscriptions from '@app/apollo/gql/listActiveSubscriptions'
import { getSubscriptionWithId } from '@screens/Payment/PaymentHelper'


export const CALENDARNAME = 'Atomic Calendar'

export type taskType = 'Daily'|'Weekly'|'Master'|'Grocery'


type RootRouteStackParamList = {
  UserTask: {
    taskType: taskType | undefined,
    isUpdate?: string | undefined,
  },
}

type RootNavigationStackParamList = {
  UserTaskEvent: {
    taskType: taskType,
    isUpdate?: boolean,
    taskId: string,
  },
  UserTaskDeadline: {
    taskType: taskType,
    isUpdate?: boolean,
    taskId: string,
    deadlineType: 'soft' | 'hard'
  },
  UserTaskTimer: {
    taskType: taskType,
  },
  UserTask: undefined,
  UserCreatePost: {
    userId: string,
    avatar: string,
    username: string,
    profileId: string,
  },
  UserTaskSchedule: {
    taskType: taskType,
    isUpdate?: boolean,
    taskId: string,
  },
  UserOnBoard: {
    taskType: taskType,
  },
  UserAddTask: {
    taskType: taskType | undefined,
  },
}

type UserTaskNavigationProp = StackNavigationProp<
  RootNavigationStackParamList,
  'UserTask'
>

type UserTaskRouteProp = RouteProp<
  RootRouteStackParamList,
  'UserTask'>

type Props = {
  sub: string
  route: UserTaskRouteProp
  getRealmApp: () => Realm,
  client: ApolloClient<NormalizedCacheObject>,
}

type bulletType = 'completed'|'bullet' |'future'|'nextDay'
  |'important'|'event'|'schedule'|'deadline'


type renderItem = string

export type displayUI = string

const dark = Appearance.getColorScheme() === 'dark'

const styles = StyleSheet.create({
  safeArea: {
    alignItems: 'flex-end',
  },
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  fab: {
    margin: 16,
    marginTop: 0,
  },
  removeButton: {
    borderRadius: 50,
    backgroundColor: dark ? palette.pinkPrimary : palette.lightGray,
    padding: 10,
  },
  infoButton: {
    backgroundColor: dark ? palette.darkGreen : palette.lightGreen,
    borderRadius: 50,
    padding: 10,
    margin: 2,
  },
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
  },
  taskOverlay2: {
    fontSize: 16,
    lineHeight: 24,
    color:  dark ? palette.white : '#221D23',
    width: '100%',
  },
  taskMenu: {
    color: dark ? palette.white : '#a6a6a6',
  },
})

const styles2 = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22
  },
  modalView: {
    margin: 20,
    backgroundColor: dark ? palette.black : palette.white,
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: dark ? palette.white : palette.black,
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
})

const renderBulletType = (value: bulletType) => {
  switch(value) {
    case 'completed':
      return dark ? (
              <Image
                source={require('@assets/icons/completedDark.png')}
                style={{
                  width: 20,
                  height: 20,
                  resizeMode: 'contain',
                }}
              />
            ) : (
              <Image
                source={require('@assets/icons/completed.png')}
                style={{
                  width: 20,
                  height: 20,
                  resizeMode: 'contain',
                }}
              />
            )
    case 'future':
      return (<Text
                variant="optionHeader"

              >
                {'\u003C'}
              </Text>)
    case 'nextDay':
      return (<Text
                variant="optionHeader"

              >
                {'\u003E'}
              </Text>)
    case 'bullet':
      return (<Text
                variant="optionHeader"

              >
                {'\u2022'}
              </Text>)

    case 'important':
      return (<Text
                variant="optionHeader"

              >
                {'\u274B'}
              </Text>)
    case 'event':
      return (<Text
                variant="optionHeader"

              >
                {'\u25EF'}
              </Text>)
    case 'schedule':
      return (<Text
                variant="optionHeader"

              >
                {'\u25A1'}
              </Text>)
    case 'deadline':
      return (<Text
                variant="optionHeader"

              >
                {'\u2299'}
              </Text>)
    default:
      return null
  }
}


export type DeadlineType = 'soft' | 'hard'

function UserTask(props: Props) {
  const [idArray, setIdArray] = useState<string[]>()
  const [notesArray, setNotesArray] = useState<string[]>()
  const [completedArray, setCompletedArray] = useState<boolean[]>()
  const [startDateArray, setStartDateArray] = useState<string[]>()
  const [endDateArray, setEndDateArray] = useState<string[]>()
  const [nextDayArray, setNextDayArray] = useState<boolean[]>()
  const [completedDateArray, setCompletedDateArray] = useState<string[]>()
  const [importantArray, setImportantArray] = useState<boolean[]>()
  const [dateArray, setDateArray] = useState<string[]>()
  const [eventArray, setEventArray] = useState<boolean[]>()
  const [scheduleIdArray, setScheduleIdArray] = useState<string[]>()
  const [softDeadlineArray, setSoftDeadlineArray] = useState<string[]>()
  const [hardDeadlineArray, setHardDeadlineArray] = useState<string[]>()
  const [statusArray, setStatusArray] = useState<ToDoStatus[]>()
  const [parentIdArray, setParentIdArray] = useState<string[]>()
  const [taskCompletedCount, setTaskCompletedCount] = useState<number>(0)
  const [localTaskType, setLocalTaskType] = useState<taskType>('Daily')

  const [updateIndex, setUpdateIndex] = useState<number>(-1)
  const [profileId, setProfileId] = useState<string>()
  const [userId, setUserId] = useState<string>()
  const [isMenu, setIsMenu] = useState<boolean>(false)
  const [isTaskMenus, setIsTaskMenus] = useState<boolean[]>([])
  const [heightArray, setHeightArray] = useState<number[]>([40])
  const [showFTE, setShowFTE] = useState<boolean>(false)
  const [showFTEOverlay, setShowFTEOverlay] = useState<boolean>(false)
  const [displayUIArray, setDisplayUIArray] = useState<displayUI[]>([])
  const [dataIndexToDisplayArray, setDataIndexToDisplayArray] = useState<number[]>([])
  const [orderArray, setOrderArray] = useState<number[]>([])
  const [eventIdArray, setEventIdArray] = useState<string[]>([])
  const [durationArray ,setDurationArray] = useState<number[]>([])

  const [updateTaskText, setUpdateTaskText] = useState<string>('')
  const [isNewTask, setIsNewTask] = useState<boolean>(false)
  const [newTaskText, setNewTaskText] = useState<string>('')
  const [isUpdateTask, setIsUpdateTask] = useState<boolean>(false)

  const [newDailyTaskText, setNewDailyTaskText] = useState<string>('')
  const [newDailyPriority, setNewDailyPriority] = useState<number>(1)
  const [newDailyDeadline, setNewDailyDeadline] = useState<Date>(new Date())
  const [newDailyDeadlineType, setNewDailyDeadlineType] = useState<DeadlineType>('soft')
  const [isNewDailyTask, setIsNewDailyTask] = useState<boolean>(false)
  const [newDailyDuration, setNewDailyDuration] = useState<number>(30)

  const [newWeeklyTaskText, setNewWeeklyTaskText] = useState<string>('')
  const [newWeeklyPriority, setNewWeeklyPriority] = useState<number>(1)
  const [newWeeklyDeadline, setNewWeeklyDeadline] = useState<Date>(new Date())
  const [newWeeklyDeadlineType, setNewWeeklyDeadlineType] = useState<DeadlineType>('soft')
  const [isNewWeeklyTask, setIsNewWeeklyTask] = useState<boolean>(false)
  const [newWeeklyDuration, setNewWeeklyDuration] = useState<number>(30)
  const [isDeadlineDatePicker, setIsDeadlineDatePicker] = useState<boolean>(false)
  const [disableTaskType, setDisableTaskType] = useState<boolean>(false)

  const profileIdEl = useRef<string>('')
  const usernameEl = useRef<string>('')
  const userIdEl = useRef<string>('')
  const credIdEl = useRef<string>('')
  const s3El = useRef<S3Client>(null)
  const calendarEventIdEl = useRef<string>('')
  const avatarEl = useRef<string>('')

  const {
    route,
    sub,
    getRealmApp,
  } = props

  const client = props?.client

  const {
    canStart,
    start,
    stop,
    eventEmitter,
  } = useTourGuideController()

  const { width } = useWindowDimensions()

  const taskType = route?.params?.taskType

  const isUpdate = route?.params?.isUpdate


  const realm = getRealmApp()

  const navigation = useNavigation<UserTaskNavigationProp>()

  
  useEffect(() => {
    if (client) {
      queryNotion(client)
    }
  }, [client])

  useFocusEffect(
    useCallback(() => {
      if (client) {
        queryNotion(client)
      }
    }, [client])
  )

  useEffect(() => {
    (async () => {
      const user_preferenceDoc = await getUserPreference(client, sub)
      
      if (!user_preferenceDoc?.onBoarded) {
        
        return navigation.navigate('UserOnBoard', { taskType })
      }
      const OnBoards = realm.objects<OnBoardRealm>('OnBoard')
      if (OnBoards?.[0]?.id) {
        const [OnBoard] = OnBoards
        if (OnBoard?.UserTask === true) {
          setShowFTEOverlay(true)
        }
      } else {
        realm.write(() => {
          realm.create<OnBoardRealm>('OnBoard', {
            id: uuid(),
            UserCreateSpecificExercise: undefined,
            UserCreateActivateSpecificExercise: undefined,
            UserCreateActivateHabit: undefined,
            UserCreateActivateLimit: undefined,
            UserCreateActivateNewSkill: undefined,
            UserTask: true,
           })
        })
        setShowFTEOverlay(true)
      }
    })()
  }, [])

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const user_preferenceDoc = await getUserPreference(client, sub)
        
        if (!user_preferenceDoc?.onBoarded) {
          
          return navigation.navigate('UserOnBoard', { taskType })
        }
        const OnBoards = realm.objects<OnBoardRealm>('OnBoard')
        if (OnBoards?.[0]?.id) {
          const [OnBoard] = OnBoards
          if (OnBoard?.UserTask === true) {
            setShowFTEOverlay(true)
          }
        } else {
          realm.write(() => {
            realm.create<OnBoardRealm>('OnBoard', {
              id: uuid(),
              UserCreateSpecificExercise: undefined,
              UserCreateActivateSpecificExercise: undefined,
              UserCreateActivateHabit: undefined,
              UserCreateActivateLimit: undefined,
              UserCreateActivateNewSkill: undefined,
              UserTask: true,
             })
          })
          setShowFTEOverlay(true)
        }
      })()
    }, [])
  )


  useEffect(() => {
    getS3AndCredId(s3El, credIdEl)
  }, []);

  useEffect(() => {

    if (((taskType === 'Daily') && !disableTaskType) || ((!taskType || disableTaskType) && (localTaskType === 'Daily'))) {

      if ((taskType && !disableTaskType) && (taskType !== localTaskType)) {
        setLocalTaskType('Daily')
      }
      (async () => {

        const { payload: { sub } } = (await Auth.currentSession()).getAccessToken()
        const users = await DataStore.query(User, c => c.sub('eq', sub))
        if (!(users?.[0]?.id)) {
          return
        }
        const [user] = users

        const dailyToDos = await DataStore.query(DailyToDo, c => c.userId('eq', user.id))



        if (dailyToDos?.[0]?.id) {

          let isOrder = true
          for (let i = 0; i < dailyToDos.length; i++) {
            if (typeof (dailyToDos?.[i]?.order) !== 'number') {
              isOrder = false
            }
          }

          if (isOrder) {
            
            const oldOrderArray = dailyToDos.map((i) => (i?.order))

            const newIdArray = dailyToDos.map(i => ((i && i.id) || ''))
            const newNotesArray = dailyToDos.map(i => ((i && i.notes) || ''))
            const newCompletedArray = dailyToDos.map(i => ((i && i.completed) || false))
            const newStartDateArray = dailyToDos.map((i) => ((i?.startDate) || ''))
            const newEndDateArray = dailyToDos.map((i) => ((i?.endDate) || ''))
            const newCompletedDateArray = dailyToDos.map(i => ((i && i.completedDate) || ''))
            const newNextDayArray = dailyToDos.map(i => ((i?.startDate && dayjs(i.startDate).isTomorrow()) || false))
            const newImportantArray = dailyToDos.map(i => ((i && i.important) || false))
            const newDateArray = dailyToDos.map((i) => ((i && i.date) || ''))
            const newEventArray = dailyToDos.map(i => ((i && i.event) || false))
            const newScheduleIdArray = dailyToDos.map(i => ((i && i.scheduleId) || ''))
            const newSoftDeadlineArray = dailyToDos.map(i => ((i && i.softDeadline) || ''))
            const newHardDeadlineArray = dailyToDos.map(i => ((i && i.hardDeadline) || ''))


            const newIsTaskMenus = dailyToDos.map(() => false)


            const newStatusArray = dailyToDos.map(i => (i?.status || ToDoStatus.TODO))

            const newParentIdArray = dailyToDos.map(i => (i?.parentId|| ''))
            const newEventIdArray = dailyToDos.map(i => (i?.eventId || ''))
            const newDurationArray = dailyToDos.map(i => (i?.startDate && dayjs(i?.startDate).diff(i?.endDate, 'minute')) || -1)

            const sortedByOrderIdArray = sortByOrder(newIdArray, oldOrderArray)

            const sortedByOrderNotesArray = sortByOrder(newNotesArray, oldOrderArray)

            const sortedByOrderCompletedArray = sortByOrder(newCompletedArray, oldOrderArray)

            const sortedByOrderStartDateArray = sortByOrder(newStartDateArray, oldOrderArray)

            const sortedByOrderEndDateArray = sortByOrder(newEndDateArray, oldOrderArray)

            const sortedByOrderCompletedDateArray = sortByOrder(newCompletedDateArray, oldOrderArray)

            const sortedByOrderNextDayArray = sortByOrder(newNextDayArray, oldOrderArray)

            const sortedByOrderImportantArray = sortByOrder(newImportantArray, oldOrderArray)

            const sortedByOrderDateArray = sortByOrder(newDateArray, oldOrderArray)

            const sortedByOrderEventArray = sortByOrder(newEventArray, oldOrderArray)

            const sortedByOrderScheduleIdArray = sortByOrder(newScheduleIdArray, oldOrderArray)

            const sortedByOrderSoftDeadlineArray = sortByOrder(newSoftDeadlineArray, oldOrderArray)
            const sortedByOrderHardDeadlineArray = sortByOrder(newHardDeadlineArray, oldOrderArray)



            const sortedByOrderStatusArray = sortByOrder(newStatusArray, oldOrderArray)

            const sortedByOrderParentIdArray = sortByOrder(newParentIdArray, oldOrderArray)
            const sortedByOrderEventIdArray = sortByOrder(newEventIdArray, oldOrderArray)
            const sortedByOrderDurationArray = sortByOrder(newDurationArray, oldOrderArray)



            const sortedByStatusSortedByOrderIdArray = sortByStatus(sortedByOrderIdArray, sortedByOrderStatusArray as ToDoStatus[])
            const sortedByStatusSortedByOrderNotesArray = sortByStatus(sortedByOrderNotesArray, sortedByOrderStatusArray as ToDoStatus[])
            const sortedByStatusSortedByOrderCompletedArray = sortByStatus(sortedByOrderCompletedArray, sortedByOrderStatusArray as ToDoStatus[])
            const sortedByStatusSortedByOrderStartDateArray = sortByStatus(sortedByOrderStartDateArray, sortedByOrderStatusArray as ToDoStatus[])
            const sortedByStatusSortedByOrderEndDateArray = sortByStatus(sortedByOrderEndDateArray, sortedByOrderStatusArray as ToDoStatus[])
            const sortedByStatusSortedByOrderCompletedDateArray = sortByStatus(sortedByOrderCompletedDateArray, sortedByOrderStatusArray as ToDoStatus[])
            const sortedByStatusSortedByOrderNextDayArray = sortByStatus(sortedByOrderNextDayArray, sortedByOrderStatusArray as ToDoStatus[])
            const sortedByStatusSortedByOrderImportantArray = sortByStatus(sortedByOrderImportantArray, sortedByOrderStatusArray as ToDoStatus[])
            const sortedByStatusSortedByOrderDateArray = sortByStatus(sortedByOrderDateArray, sortedByOrderStatusArray as ToDoStatus[])
            const sortedByStatusSortedByOrderEventArray = sortByStatus(sortedByOrderEventArray, sortedByOrderStatusArray as ToDoStatus[])
            const sortedByStatusSortedByOrderScheduleIdArray = sortByStatus(sortedByOrderScheduleIdArray, sortedByOrderStatusArray as ToDoStatus[])
            const sortedByStatusSortedByOrderSoftDeadlineArray = sortByStatus(sortedByOrderSoftDeadlineArray, sortedByOrderStatusArray as ToDoStatus[])
            const sortedByStatusSortedByOrderHardDeadlineArray = sortByStatus(sortedByOrderHardDeadlineArray, sortedByOrderStatusArray as ToDoStatus[])

            const sortedByStatusSortedByOrderStatusArray = sortByStatus(sortedByOrderStatusArray, sortedByOrderStatusArray as ToDoStatus[])
            const sortedByStatusSortedByOrderParentIdArray = sortByStatus(sortedByOrderParentIdArray, sortedByOrderStatusArray as ToDoStatus[])

            const sortedByStatusSortedByOrderEventIdArray = sortByStatus(sortedByOrderEventIdArray, sortedByOrderStatusArray as ToDoStatus[])
            const sortedByStatusSortedByOrderDurationArray = sortByStatus(sortedByOrderDurationArray, sortedByOrderStatusArray as ToDoStatus[])

            setIdArray(sortedByStatusSortedByOrderIdArray)
            setNotesArray(sortedByStatusSortedByOrderNotesArray)
            setCompletedArray(sortedByStatusSortedByOrderCompletedArray)
            setStartDateArray(sortedByStatusSortedByOrderStartDateArray)
            setEndDateArray(sortedByStatusSortedByOrderEndDateArray)
            setCompletedDateArray(sortedByStatusSortedByOrderCompletedDateArray)
            setNextDayArray(sortedByStatusSortedByOrderNextDayArray)
            setImportantArray(sortedByStatusSortedByOrderImportantArray)
            setDateArray(sortedByStatusSortedByOrderDateArray)
            setEventArray(sortedByStatusSortedByOrderEventArray)
            setScheduleIdArray(sortedByStatusSortedByOrderScheduleIdArray)
            setSoftDeadlineArray(sortedByStatusSortedByOrderSoftDeadlineArray)
            setHardDeadlineArray(sortedByStatusSortedByOrderHardDeadlineArray)

            setIsTaskMenus(newIsTaskMenus)

            setStatusArray(sortedByStatusSortedByOrderStatusArray as ToDoStatus[])
            setParentIdArray(sortedByStatusSortedByOrderParentIdArray)
            setOrderArray(sortedByStatusSortedByOrderNotesArray.map((_, inx) => inx))
            setEventIdArray(sortedByStatusSortedByOrderEventIdArray)
            setDurationArray(sortedByStatusSortedByOrderDurationArray)

            const {
              displayUIArray: sortedDisplayUIArray,
              dataIndexToDisplayArray: sortedDataIndexToDisplayArray,
            } = getDisplayUI(sortedByStatusSortedByOrderNotesArray, sortedByStatusSortedByOrderStatusArray as ToDoStatus[])
            
            
            const newHeightArray = sortedDisplayUIArray.map(() => 40)
            setHeightArray(newHeightArray)
            
            setDisplayUIArray(sortedDisplayUIArray)
            setDataIndexToDisplayArray(sortedDataIndexToDisplayArray)
            
          } else {

            const newIdArray = dailyToDos.map(i => ((i && i.id) || ''))
            const newNotesArray = dailyToDos.map(i => ((i && i.notes) || ''))
            const newCompletedArray = dailyToDos.map(i => ((i && i.completed) || false))
            const newStartDateArray = dailyToDos.map((i) => ((i?.startDate) || ''))
            const newEndDateArray = dailyToDos.map((i) => ((i?.endDate) || ''))
            const newCompletedDateArray = dailyToDos.map(i => ((i && i.completedDate) || ''))
            const newNextDayArray = dailyToDos.map(i => ((i?.startDate && dayjs(i.startDate).isTomorrow()) || false))
            const newImportantArray = dailyToDos.map(i => ((i && i.important) || false))
            const newDateArray = dailyToDos.map((i) => ((i && i.date) || ''))
            const newEventArray = dailyToDos.map(i => ((i && i.event) || false))
            const newScheduleIdArray = dailyToDos.map(i => ((i && i.scheduleId) || ''))
            const newSoftDeadlineArray = dailyToDos.map(i => ((i && i.softDeadline) || ''))
            const newHardDeadlineArray = dailyToDos.map(i => ((i && i.hardDeadline) || ''))

            const newIsTaskMenus = dailyToDos.map(() => false)


            const newStatusArray = dailyToDos.map(i => (i?.status || ToDoStatus.TODO))

            const newParentIdArray = dailyToDos.map(i => (i?.parentId || ''))
            const newEventIdArray = dailyToDos.map(i => (i?.eventId || ''))
            const newDurationArray = dailyToDos.map(i => (i?.duration || null))

            const {
              sortedParentIdArray,
              sortedIdArray,
              sortedNotesArray,
              sortedCompletedArray,
              sortedStartDateArray,
              sortedEndDateArray,
              sortedNextDayArray,
              sortedCompletedDateArray,
              sortedImportantArray,
              sortedDateArray,
              sortedEventArray,
              sortedScheduleIdArray,
              sortedSoftDeadlineArray,
              sortedHardDeadlineArray,

              sortedStatusArray,
              sortedEventIdArray,
              sortedDurationArray,
            } = sortTasksByParent(
                  newParentIdArray,
                  newIdArray,
                  newNotesArray,
                  newCompletedArray,
                  newStartDateArray,
                  newEndDateArray,
                  newNextDayArray,
                  newCompletedDateArray,
                  newImportantArray,
                  newDateArray,
                  newEventArray,
                  newScheduleIdArray,
                  newSoftDeadlineArray,
                  newHardDeadlineArray,
                  newStatusArray as ToDoStatus[],
                  newEventIdArray,
                  newDurationArray,
                )

            const sortedOrderArray = sortedNotesArray.map((_, inx) => (inx))


            const sortedByStatusSortedIdArray = sortByStatus(sortedIdArray, sortedStatusArray as ToDoStatus[])
            const sortedByStatusSortedNotesArray = sortByStatus(sortedNotesArray, sortedStatusArray as ToDoStatus[])
            const sortedByStatusSortedCompletedArray = sortByStatus(sortedCompletedArray, sortedStatusArray as ToDoStatus[])
            const sortedByStatusSortedStartDateArray = sortByStatus(sortedStartDateArray, sortedStatusArray as ToDoStatus[])
            const sortedByStatusSortedEndDateArray = sortByStatus(sortedEndDateArray, sortedStatusArray as ToDoStatus[])
            const sortedByStatusSortedCompletedDateArray = sortByStatus(sortedCompletedDateArray, sortedStatusArray as ToDoStatus[])
            const sortedByStatusSortedNextDayArray = sortByStatus(sortedNextDayArray, sortedStatusArray as ToDoStatus[])
            const sortedByStatusSortedImportantArray = sortByStatus(sortedImportantArray, sortedStatusArray as ToDoStatus[])
            const sortedByStatusSortedDateArray = sortByStatus(sortedDateArray, sortedStatusArray as ToDoStatus[])
            const sortedByStatusSortedEventArray = sortByStatus(sortedEventArray, sortedStatusArray as ToDoStatus[])
            const sortedByStatusSortedScheduleIdArray = sortByStatus(sortedScheduleIdArray, sortedStatusArray as ToDoStatus[])
            const sortedByStatusSortedSoftDeadlineArray = sortByStatus(sortedSoftDeadlineArray, sortedStatusArray as ToDoStatus[])
            const sortedByStatusSortedHardDeadlineArray = sortByStatus(sortedHardDeadlineArray, sortedStatusArray as ToDoStatus[])

            const sortedByStatusSortedStatusArray = sortByStatus(sortedStatusArray, sortedStatusArray as ToDoStatus[])
            const sortedByStatusSortedParentIdArray = sortByStatus(sortedParentIdArray, sortedStatusArray as ToDoStatus[])
            const sortedByStatusSortedOrderArray = sortByStatus(sortedOrderArray, sortedStatusArray as ToDoStatus[])

            const sortedByStatusSortedEventIdArray = sortByStatus(sortedEventIdArray, sortedStatusArray as ToDoStatus[])
            const sortedByStatusSortedDurationArray = sortByStatus(sortedDurationArray, sortedStatusArray as ToDoStatus[])

            setIdArray(sortedByStatusSortedIdArray)
            setNotesArray(sortedByStatusSortedNotesArray)
            setCompletedArray(sortedByStatusSortedCompletedArray)
            setStartDateArray(sortedByStatusSortedStartDateArray)
            setEndDateArray(sortedByStatusSortedEndDateArray)
            setCompletedDateArray(sortedByStatusSortedCompletedDateArray)
            setNextDayArray(sortedByStatusSortedNextDayArray)
            setImportantArray(sortedByStatusSortedImportantArray)
            setDateArray(sortedByStatusSortedDateArray)
            setEventArray(sortedByStatusSortedEventArray)
            setScheduleIdArray(sortedByStatusSortedScheduleIdArray)
            setSoftDeadlineArray(sortedByStatusSortedSoftDeadlineArray)
            setHardDeadlineArray(sortedByStatusSortedHardDeadlineArray)
            setIsTaskMenus(newIsTaskMenus)

            setStatusArray(sortedByStatusSortedStatusArray as ToDoStatus[])
            setParentIdArray(sortedByStatusSortedParentIdArray)
            setOrderArray(sortedByStatusSortedOrderArray)
            setEventIdArray(sortedByStatusSortedEventIdArray)
            setDurationArray(sortedByStatusSortedDurationArray)

            const {
              displayUIArray: sortedDisplayUIArray,
              dataIndexToDisplayArray: sortedDataIndexToDisplayArray,
            } = getDisplayUI(sortedByStatusSortedNotesArray, sortedByStatusSortedStatusArray as ToDoStatus[])
            const promises = sortedByStatusSortedIdArray.map(async (id, inx) => {
              try {
                return updateTaskInStore(
                  TableName.DAILY,
                  id,
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
                  sortedByStatusSortedStatusArray[inx],
                  undefined,
                  inx,
                )
              } catch(e) {
                
              }
            })
            await Promise.all(promises)
            const newHeightArray = sortedDisplayUIArray.map(() => 40)
            setHeightArray(newHeightArray)
            
            setDisplayUIArray(sortedDisplayUIArray)
            setDataIndexToDisplayArray(sortedDataIndexToDisplayArray)
          }
        } else {
          setIdArray([])
          setNotesArray([])
          setCompletedArray([])
          setStartDateArray([])
          setEndDateArray([])
          setCompletedDateArray([])
          setNextDayArray([])
          setImportantArray([])
          setDateArray([])
          setEventArray([])
          setScheduleIdArray([])
          setSoftDeadlineArray([])
          setHardDeadlineArray([])

          setIsTaskMenus([])
          setStatusArray([])
          setParentIdArray([])
          setOrderArray([])
          setHeightArray([])
          setDisplayUIArray([])
          setDataIndexToDisplayArray([])
          setEventIdArray([])
          setDurationArray([])
        }
      })()
    }
  }, [taskType, localTaskType, disableTaskType, isUpdate, ...displayUIArray])

  useFocusEffect(
    useCallback(() => {

      if (((taskType === 'Daily') && !disableTaskType) || ((!taskType || disableTaskType) && (localTaskType === 'Daily'))) {

        if ((taskType && !disableTaskType) && (taskType !== localTaskType)) {
          setLocalTaskType('Daily')
        }
        (async () => {

          const { payload: { sub } } = (await Auth.currentSession()).getAccessToken()
          const users = await DataStore.query(User, c => c.sub('eq', sub))
          if (!(users?.[0]?.id)) {
            return
          }
          const [user] = users

          const dailyToDos = await DataStore.query(DailyToDo, c => c.userId('eq', user.id))


          if (dailyToDos?.[0]?.id) {

            let isOrder = true
            for (let i = 0; i < dailyToDos.length; i++) {
              if (typeof (dailyToDos?.[i]?.order) !== 'number') {
                isOrder = false
              }
            }

            if (isOrder) {

              

              const oldOrderArray = dailyToDos.map((i) => (i?.order))

              const newIdArray = dailyToDos.map(i => ((i && i.id) || ''))
              const newNotesArray = dailyToDos.map(i => ((i && i.notes) || ''))
              const newCompletedArray = dailyToDos.map(i => ((i && i.completed) || false))
              const newStartDateArray = dailyToDos.map((i) => ((i?.startDate) || ''))
              const newEndDateArray = dailyToDos.map((i) => ((i?.endDate) || ''))
              const newCompletedDateArray = dailyToDos.map(i => ((i && i.completedDate) || ''))
              const newNextDayArray = dailyToDos.map(i => ((i?.startDate && dayjs(i.startDate).isTomorrow()) || false))
              const newImportantArray = dailyToDos.map(i => ((i && i.important) || false))
              const newDateArray = dailyToDos.map((i) => ((i && i.date) || ''))
              const newEventArray = dailyToDos.map(i => ((i && i.event) || false))
              const newScheduleIdArray = dailyToDos.map(i => ((i && i.scheduleId) || ''))
              const newSoftDeadlineArray = dailyToDos.map(i => ((i && i.softDeadline) || ''))
              const newHardDeadlineArray = dailyToDos.map(i => ((i && i.hardDeadline) || ''))

              const newIsTaskMenus = dailyToDos.map(() => false)

              const newStatusArray = dailyToDos.map(i => (i?.status || ToDoStatus.TODO))

              const newParentIdArray = dailyToDos.map(i => (i?.parentId || ''))
              const newEventIdArray = dailyToDos.map(i => (i?.eventId || ''))
              const newDurationArray = dailyToDos.map(i => (i?.duration || -1))

              const sortedByOrderIdArray = sortByOrder(newIdArray, oldOrderArray)

              const sortedByOrderNotesArray = sortByOrder(newNotesArray, oldOrderArray)

              const sortedByOrderCompletedArray = sortByOrder(newCompletedArray, oldOrderArray)

              const sortedByOrderStartDateArray = sortByOrder(newStartDateArray, oldOrderArray)

              const sortedByOrderEndDateArray = sortByOrder(newEndDateArray, oldOrderArray)

              const sortedByOrderCompletedDateArray = sortByOrder(newCompletedDateArray, oldOrderArray)

              const sortedByOrderNextDayArray = sortByOrder(newNextDayArray, oldOrderArray)

              const sortedByOrderImportantArray = sortByOrder(newImportantArray, oldOrderArray)

              const sortedByOrderDateArray = sortByOrder(newDateArray, oldOrderArray)

              const sortedByOrderEventArray = sortByOrder(newEventArray, oldOrderArray)

              const sortedByOrderScheduleIdArray = sortByOrder(newScheduleIdArray, oldOrderArray)

              const sortedByOrderSoftDeadlineArray = sortByOrder(newSoftDeadlineArray, oldOrderArray)
              const sortedByOrderHardDeadlineArray = sortByOrder(newHardDeadlineArray, oldOrderArray)


              const sortedByOrderStatusArray = sortByOrder(newStatusArray, oldOrderArray)

              const sortedByOrderParentIdArray = sortByOrder(newParentIdArray, oldOrderArray)
              const sortedByOrderEventIdArray = sortByOrder(newEventIdArray, oldOrderArray)
              const sortedByOrderDurationArray = sortByOrder(newDurationArray, oldOrderArray)

              const sortedByStatusSortedByOrderIdArray = sortByStatus(sortedByOrderIdArray, sortedByOrderStatusArray as ToDoStatus[])
              const sortedByStatusSortedByOrderNotesArray = sortByStatus(sortedByOrderNotesArray, sortedByOrderStatusArray as ToDoStatus[])
              const sortedByStatusSortedByOrderCompletedArray = sortByStatus(sortedByOrderCompletedArray, sortedByOrderStatusArray as ToDoStatus[])
              const sortedByStatusSortedByOrderStartDateArray = sortByStatus(sortedByOrderStartDateArray, sortedByOrderStatusArray as ToDoStatus[])
              const sortedByStatusSortedByOrderEndDateArray = sortByStatus(sortedByOrderEndDateArray, sortedByOrderStatusArray as ToDoStatus[])
              const sortedByStatusSortedByOrderCompletedDateArray = sortByStatus(sortedByOrderCompletedDateArray, sortedByOrderStatusArray as ToDoStatus[])
              const sortedByStatusSortedByOrderNextDayArray = sortByStatus(sortedByOrderNextDayArray, sortedByOrderStatusArray as ToDoStatus[])
              const sortedByStatusSortedByOrderImportantArray = sortByStatus(sortedByOrderImportantArray, sortedByOrderStatusArray as ToDoStatus[])
              const sortedByStatusSortedByOrderDateArray = sortByStatus(sortedByOrderDateArray, sortedByOrderStatusArray as ToDoStatus[])
              const sortedByStatusSortedByOrderEventArray = sortByStatus(sortedByOrderEventArray, sortedByOrderStatusArray as ToDoStatus[])
              const sortedByStatusSortedByOrderScheduleIdArray = sortByStatus(sortedByOrderScheduleIdArray, sortedByOrderStatusArray as ToDoStatus[])
              const sortedByStatusSortedByOrderSoftDeadlineArray = sortByStatus(sortedByOrderSoftDeadlineArray, sortedByOrderStatusArray as ToDoStatus[])
              const sortedByStatusSortedByOrderHardDeadlineArray = sortByStatus(sortedByOrderHardDeadlineArray, sortedByOrderStatusArray as ToDoStatus[])

              const sortedByStatusSortedByOrderStatusArray = sortByStatus(sortedByOrderStatusArray, sortedByOrderStatusArray as ToDoStatus[])
              const sortedByStatusSortedByOrderParentIdArray = sortByStatus(sortedByOrderParentIdArray, sortedByOrderStatusArray as ToDoStatus[])

              const sortedByStatusSortedByOrderEventIdArray = sortByStatus(sortedByOrderEventIdArray, sortedByOrderStatusArray as ToDoStatus[])
              const sortedByStatusSortedByOrderDurationArray = sortByStatus(sortedByOrderDurationArray, sortedByOrderStatusArray as ToDoStatus[])
              
              setIdArray(sortedByStatusSortedByOrderIdArray)
              setNotesArray(sortedByStatusSortedByOrderNotesArray)
              setCompletedArray(sortedByStatusSortedByOrderCompletedArray)
              setStartDateArray(sortedByStatusSortedByOrderStartDateArray)
              setEndDateArray(sortedByStatusSortedByOrderEndDateArray)
              setCompletedDateArray(sortedByStatusSortedByOrderCompletedDateArray)
              setNextDayArray(sortedByStatusSortedByOrderNextDayArray)
              setImportantArray(sortedByStatusSortedByOrderImportantArray)
              setDateArray(sortedByStatusSortedByOrderDateArray)
              setEventArray(sortedByStatusSortedByOrderEventArray)
              setScheduleIdArray(sortedByStatusSortedByOrderScheduleIdArray)
              setSoftDeadlineArray(sortedByStatusSortedByOrderSoftDeadlineArray)
              setHardDeadlineArray(sortedByStatusSortedByOrderHardDeadlineArray)

              setIsTaskMenus(newIsTaskMenus)
              setStatusArray(sortedByStatusSortedByOrderStatusArray as ToDoStatus[])
              setParentIdArray(sortedByStatusSortedByOrderParentIdArray)
              setOrderArray(sortedByStatusSortedByOrderNotesArray.map((_, inx) => inx))
              setEventIdArray(sortedByStatusSortedByOrderEventIdArray)
              setDurationArray(sortedByStatusSortedByOrderDurationArray)
              const {
                displayUIArray: sortedDisplayUIArray,
                dataIndexToDisplayArray: sortedDataIndexToDisplayArray,
              } = getDisplayUI(sortedByStatusSortedByOrderNotesArray, sortedByStatusSortedByOrderStatusArray as ToDoStatus[])
              
              
              const newHeightArray = sortedDisplayUIArray.map(() => 40)
              setHeightArray(newHeightArray)
              setDisplayUIArray(sortedDisplayUIArray)
              setDataIndexToDisplayArray(sortedDataIndexToDisplayArray)
            } else {
              const newIdArray = dailyToDos.map(i => ((i && i.id) || ''))
              const newNotesArray = dailyToDos.map(i => ((i && i.notes) || ''))
              const newCompletedArray = dailyToDos.map(i => ((i && i.completed) || false))
              const newStartDateArray = dailyToDos.map((i) => ((i?.startDate) || ''))
              const newEndDateArray = dailyToDos.map((i) => ((i?.endDate) || ''))
              const newCompletedDateArray = dailyToDos.map(i => ((i && i.completedDate) || ''))
              const newNextDayArray = dailyToDos.map(i => ((i?.startDate && dayjs(i.startDate).isTomorrow()) || false))
              const newImportantArray = dailyToDos.map(i => ((i && i.important) || false))
              const newDateArray = dailyToDos.map((i) => ((i && i.date) || ''))
              const newEventArray = dailyToDos.map(i => ((i && i.event) || false))
              const newScheduleIdArray = dailyToDos.map(i => ((i && i.scheduleId) || ''))
              const newSoftDeadlineArray = dailyToDos.map(i => ((i && i.softDeadline) || ''))
              const newHardDeadlineArray = dailyToDos.map(i => ((i && i.hardDeadline) || ''))

              const newIsTaskMenus = dailyToDos.map(() => false)

              const newStatusArray = dailyToDos.map(i => (i?.status || ToDoStatus.TODO))

              const newParentIdArray = dailyToDos.map(i => (i?.parentId|| ''))
              const newEventIdArray = dailyToDos.map(i => (i?.eventId || ''))
              const newDurationArray = dailyToDos.map(i => (i?.duration || -1))

              const {
                sortedParentIdArray,
                sortedIdArray,
                sortedNotesArray,
                sortedCompletedArray,
                sortedStartDateArray,
                sortedEndDateArray,
                sortedNextDayArray,
                sortedCompletedDateArray,
                sortedImportantArray,
                sortedDateArray,
                sortedEventArray,
                sortedScheduleIdArray,
                sortedSoftDeadlineArray,
                sortedHardDeadlineArray,
                sortedStatusArray,
                sortedEventIdArray,
                sortedDurationArray,
              } = sortTasksByParent(
                    newParentIdArray,
                    newIdArray,
                    newNotesArray,
                    newCompletedArray,
                    newStartDateArray,
                    newEndDateArray,
                    newNextDayArray,
                    newCompletedDateArray,
                    newImportantArray,
                    newDateArray,
                    newEventArray,
                    newScheduleIdArray,
                    newSoftDeadlineArray,
                    newHardDeadlineArray,
                    newStatusArray as ToDoStatus[],
                    newEventIdArray,
                    newDurationArray,
                  )



              const sortedByStatusSortedIdArray = sortByStatus(sortedIdArray, sortedStatusArray as ToDoStatus[])
              const sortedByStatusSortedNotesArray = sortByStatus(sortedNotesArray, sortedStatusArray as ToDoStatus[])
              const sortedByStatusSortedCompletedArray = sortByStatus(sortedCompletedArray, sortedStatusArray as ToDoStatus[])
              const sortedByStatusSortedStartDateArray = sortByStatus(sortedStartDateArray, sortedStatusArray as ToDoStatus[])
              const sortedByStatusSortedEndDateArray = sortByStatus(sortedEndDateArray, sortedStatusArray as ToDoStatus[])
              const sortedByStatusSortedCompletedDateArray = sortByStatus(sortedCompletedDateArray, sortedStatusArray as ToDoStatus[])
              const sortedByStatusSortedNextDayArray = sortByStatus(sortedNextDayArray, sortedStatusArray as ToDoStatus[])
              const sortedByStatusSortedImportantArray = sortByStatus(sortedImportantArray, sortedStatusArray as ToDoStatus[])
              const sortedByStatusSortedDateArray = sortByStatus(sortedDateArray, sortedStatusArray as ToDoStatus[])
              const sortedByStatusSortedEventArray = sortByStatus(sortedEventArray, sortedStatusArray as ToDoStatus[])
              const sortedByStatusSortedScheduleIdArray = sortByStatus(sortedScheduleIdArray, sortedStatusArray as ToDoStatus[])
              const sortedByStatusSortedSoftDeadlineArray = sortByStatus(sortedSoftDeadlineArray, sortedStatusArray as ToDoStatus[])
              const sortedByStatusSortedHardDeadlineArray = sortByStatus(sortedHardDeadlineArray, sortedStatusArray as ToDoStatus[])

              const sortedByStatusSortedStatusArray = sortByStatus(sortedStatusArray, sortedStatusArray as ToDoStatus[])
              const sortedByStatusSortedParentIdArray = sortByStatus(sortedParentIdArray, sortedStatusArray as ToDoStatus[])

              const sortedByStatusSortedEventIdArray = sortByStatus(sortedEventIdArray, sortedStatusArray as ToDoStatus[])
              const sortedByStatusSortedDurationArray = sortByStatus(sortedDurationArray, sortedStatusArray as ToDoStatus[])


              setIdArray(sortedByStatusSortedIdArray)
              setNotesArray(sortedByStatusSortedNotesArray)
              setCompletedArray(sortedByStatusSortedCompletedArray)
              setStartDateArray(sortedByStatusSortedStartDateArray)
              setEndDateArray(sortedByStatusSortedEndDateArray)
              setCompletedDateArray(sortedByStatusSortedCompletedDateArray)
              setNextDayArray(sortedByStatusSortedNextDayArray)
              setImportantArray(sortedByStatusSortedImportantArray)
              setDateArray(sortedByStatusSortedDateArray)
              setEventArray(sortedByStatusSortedEventArray)
              setScheduleIdArray(sortedByStatusSortedScheduleIdArray)
              setSoftDeadlineArray(sortedByStatusSortedSoftDeadlineArray)
              setHardDeadlineArray(sortedByStatusSortedHardDeadlineArray)
              setIsTaskMenus(newIsTaskMenus)
              setStatusArray(sortedByStatusSortedStatusArray as ToDoStatus[])
              setParentIdArray(sortedByStatusSortedParentIdArray)
              setOrderArray(sortedByStatusSortedNotesArray.map((_, inx) => inx))
              setEventIdArray(sortedByStatusSortedEventIdArray)
              setDurationArray(sortedByStatusSortedDurationArray)
              const {
                displayUIArray: sortedDisplayUIArray,
                dataIndexToDisplayArray: sortedDataIndexToDisplayArray,
              } = getDisplayUI(sortedByStatusSortedNotesArray, sortedByStatusSortedStatusArray as ToDoStatus[])
              const newHeightArray = sortedDisplayUIArray.map(() => 40)
              setHeightArray(newHeightArray)
              const promises = sortedByStatusSortedIdArray.map(async (id, inx) => {
                try {
                  return updateTaskInStore(
                    TableName.DAILY,
                    id,
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
                    sortedByStatusSortedStatusArray[inx],
                    undefined,
                    inx,
                  )
                } catch(e) {
                  
                }
              })
              await Promise.all(promises)

              setDisplayUIArray(sortedDisplayUIArray)
              setDataIndexToDisplayArray(sortedDataIndexToDisplayArray)
            }
          } else {
            setIdArray([])
            setNotesArray([])
            setCompletedArray([])
            setStartDateArray([])
            setEndDateArray([])
            setCompletedDateArray([])
            setNextDayArray([])
            setImportantArray([])
            setDateArray([])
            setEventArray([])
            setScheduleIdArray([])
            setSoftDeadlineArray([])
            setHardDeadlineArray([])
            setIsTaskMenus([])
            setStatusArray([])
            setParentIdArray([])
            setOrderArray([])
            setHeightArray([])
            setDisplayUIArray([])
            setDataIndexToDisplayArray([])
            setEventIdArray([])
            setDurationArray([])
          }
        })()
      }
    }, [taskType, localTaskType, disableTaskType, isUpdate, ...displayUIArray])
  )

  useEffect(() => {
    if (((taskType && !disableTaskType) && (taskType === 'Weekly'))
    || (localTaskType === 'Weekly')) {

      if ((taskType && !disableTaskType) && ((taskType as taskType) !== localTaskType)) {
        setLocalTaskType(taskType)
      }

      (async () => {

        const { payload: { sub } } = (await Auth.currentSession()).getAccessToken()
        const users = await DataStore.query(User, c => c.sub('eq', sub))
        if (!(users?.[0]?.id)) {
          return
        }
        const [user] = users

        const weeklyToDos = await DataStore.query(WeeklyToDo, c => c.userId('eq', user.id))

        if (weeklyToDos?.[0]?.id) {
          let isOrder = true
          for (let i = 0; i < weeklyToDos.length; i++) {
            if (typeof (weeklyToDos?.[i]?.order) !== 'number') {
              isOrder = false
            }
          }
          if (isOrder) {

            const oldOrderArray = weeklyToDos.map((i) => (i?.order))

            const newIdArray = weeklyToDos.map(i => ((i && i.id) || ''))
            const newNotesArray = weeklyToDos.map(i => ((i && i.notes) || ''))
            const newCompletedArray = weeklyToDos.map(i => ((i && i.completed) || false))
            const newStartDateArray = weeklyToDos.map((i) => ((i?.startDate) || ''))
            const newEndDateArray = weeklyToDos.map((i) => ((i?.endDate) || ''))
            const newCompletedDateArray = weeklyToDos.map(i => ((i && i.completedDate) || ''))
            const newNextDayArray = weeklyToDos.map(i => ((i?.startDate && dayjs(i.startDate).isTomorrow()) || false))
            const newImportantArray = weeklyToDos.map(i => ((i && i.important) || false))
            const newDateArray = weeklyToDos.map((i) => ((i && i.date) || ''))
            const newEventArray = weeklyToDos.map(i => ((i && i.event) || false))
            const newScheduleIdArray = weeklyToDos.map(i => ((i && i.scheduleId) || ''))
            const newSoftDeadlineArray = weeklyToDos.map(i => ((i && i.softDeadline) || ''))
            const newHardDeadlineArray = weeklyToDos.map(i => ((i && i.hardDeadline) || ''))

            const newIsTaskMenus = weeklyToDos.map(() => false)


            const newStatusArray = weeklyToDos.map(i => (i?.status || ToDoStatus.TODO))

            const newParentIdArray = weeklyToDos.map(i => (i?.parentId || ''))
            const newEventIdArray = weeklyToDos.map(i => (i?.eventId || ''))
            const newDurationArray = weeklyToDos.map(i => (i?.duration || -1))

            const sortedByOrderIdArray = sortByOrder(newIdArray, oldOrderArray)

            const sortedByOrderNotesArray = sortByOrder(newNotesArray, oldOrderArray)

            const sortedByOrderCompletedArray = sortByOrder(newCompletedArray, oldOrderArray)

            const sortedByOrderStartDateArray = sortByOrder(newStartDateArray, oldOrderArray)

            const sortedByOrderEndDateArray = sortByOrder(newEndDateArray, oldOrderArray)

            const sortedByOrderCompletedDateArray = sortByOrder(newCompletedDateArray, oldOrderArray)

            const sortedByOrderNextDayArray = sortByOrder(newNextDayArray, oldOrderArray)

            const sortedByOrderImportantArray = sortByOrder(newImportantArray, oldOrderArray)

            const sortedByOrderDateArray = sortByOrder(newDateArray, oldOrderArray)

            const sortedByOrderEventArray = sortByOrder(newEventArray, oldOrderArray)

            const sortedByOrderScheduleIdArray = sortByOrder(newScheduleIdArray, oldOrderArray)

            const sortedByOrderSoftDeadlineArray = sortByOrder(newSoftDeadlineArray, oldOrderArray)
            const sortedByOrderHardDeadlineArray = sortByOrder(newHardDeadlineArray, oldOrderArray)

            const sortedByOrderStatusArray = sortByOrder(newStatusArray, oldOrderArray)

            const sortedByOrderParentIdArray = sortByOrder(newParentIdArray, oldOrderArray)

            const sortedByOrderEventIdArray = sortByOrder(newEventIdArray, oldOrderArray)
            const sortedByOrderDurationArray = sortByOrder(newDurationArray, oldOrderArray)

            const sortedByStatusSortedByOrderIdArray = sortByStatus(sortedByOrderIdArray, sortedByOrderStatusArray as ToDoStatus[])
            const sortedByStatusSortedByOrderNotesArray = sortByStatus(sortedByOrderNotesArray, sortedByOrderStatusArray as ToDoStatus[])
            const sortedByStatusSortedByOrderCompletedArray = sortByStatus(sortedByOrderCompletedArray, sortedByOrderStatusArray as ToDoStatus[])
            const sortedByStatusSortedByOrderStartDateArray = sortByStatus(sortedByOrderStartDateArray, sortedByOrderStatusArray as ToDoStatus[])
            const sortedByStatusSortedByOrderEndDateArray = sortByStatus(sortedByOrderEndDateArray, sortedByOrderStatusArray as ToDoStatus[])
            const sortedByStatusSortedByOrderCompletedDateArray = sortByStatus(sortedByOrderCompletedDateArray, sortedByOrderStatusArray as ToDoStatus[])
            const sortedByStatusSortedByOrderNextDayArray = sortByStatus(sortedByOrderNextDayArray, sortedByOrderStatusArray as ToDoStatus[])
            const sortedByStatusSortedByOrderImportantArray = sortByStatus(sortedByOrderImportantArray, sortedByOrderStatusArray as ToDoStatus[])
            const sortedByStatusSortedByOrderDateArray = sortByStatus(sortedByOrderDateArray, sortedByOrderStatusArray as ToDoStatus[])
            const sortedByStatusSortedByOrderEventArray = sortByStatus(sortedByOrderEventArray, sortedByOrderStatusArray as ToDoStatus[])
            const sortedByStatusSortedByOrderScheduleIdArray = sortByStatus(sortedByOrderScheduleIdArray, sortedByOrderStatusArray as ToDoStatus[])
            const sortedByStatusSortedByOrderSoftDeadlineArray = sortByStatus(sortedByOrderSoftDeadlineArray, sortedByOrderStatusArray as ToDoStatus[])
            const sortedByStatusSortedByOrderHardDeadlineArray = sortByStatus(sortedByOrderHardDeadlineArray, sortedByOrderStatusArray as ToDoStatus[])
            const sortedByStatusSortedByOrderStatusArray = sortByStatus(sortedByOrderStatusArray, sortedByOrderStatusArray as ToDoStatus[])
            const sortedByStatusSortedByOrderParentIdArray = sortByStatus(sortedByOrderParentIdArray, sortedByOrderStatusArray as ToDoStatus[])

            const sortedByStatusSortedByOrderEventIdArray = sortByStatus(sortedByOrderEventIdArray, sortedByOrderStatusArray as ToDoStatus[])
            const sortedByStatusSortedByOrderDurationArray = sortByStatus(sortedByOrderDurationArray, sortedByOrderStatusArray as ToDoStatus[])

            setIdArray(sortedByStatusSortedByOrderIdArray)
            setNotesArray(sortedByStatusSortedByOrderNotesArray)
            setCompletedArray(sortedByStatusSortedByOrderCompletedArray)
            setStartDateArray(sortedByStatusSortedByOrderStartDateArray)
            setEndDateArray(sortedByStatusSortedByOrderEndDateArray)
            setCompletedDateArray(sortedByStatusSortedByOrderCompletedDateArray)
            setNextDayArray(sortedByStatusSortedByOrderNextDayArray)
            setImportantArray(sortedByStatusSortedByOrderImportantArray)
            setDateArray(sortedByStatusSortedByOrderDateArray)
            setEventArray(sortedByStatusSortedByOrderEventArray)
            setScheduleIdArray(sortedByStatusSortedByOrderScheduleIdArray)
            setSoftDeadlineArray(sortedByStatusSortedByOrderSoftDeadlineArray)
            setHardDeadlineArray(sortedByStatusSortedByOrderHardDeadlineArray)

            setIsTaskMenus(newIsTaskMenus)
            setStatusArray(sortedByStatusSortedByOrderStatusArray as ToDoStatus[])
            setParentIdArray(sortedByStatusSortedByOrderParentIdArray)
            setOrderArray(sortedByStatusSortedByOrderNotesArray.map((_, inx) => inx))
            setEventIdArray(sortedByStatusSortedByOrderEventIdArray)
            setDurationArray(sortedByStatusSortedByOrderDurationArray)
            const {
              displayUIArray: sortedDisplayUIArray,
              dataIndexToDisplayArray: sortedDataIndexToDisplayArray,
            } = getDisplayUI(sortedByStatusSortedByOrderNotesArray, sortedByStatusSortedByOrderStatusArray as ToDoStatus[])
            const newHeightArray = sortedDisplayUIArray.map(() => 40)
            setHeightArray(newHeightArray)
            setDisplayUIArray(sortedDisplayUIArray)
            setDataIndexToDisplayArray(sortedDataIndexToDisplayArray)
          } else {
            const newIdArray = weeklyToDos.map(i => ((i && i.id) || ''))
            const newNotesArray = weeklyToDos.map(i => ((i && i.notes) || ''))
            const newCompletedArray = weeklyToDos.map(i => ((i && i.completed) || false))
            const newStartDateArray = weeklyToDos.map((i) => ((i?.startDate) || ''))
            const newEndDateArray = weeklyToDos.map((i) => ((i?.endDate) || ''))
            const newCompletedDateArray = weeklyToDos.map(i => ((i && i.completedDate) || ''))
            const newNextDayArray = weeklyToDos.map(i => ((i?.startDate && dayjs(i.startDate).isTomorrow()) || false))
            const newImportantArray = weeklyToDos.map(i => ((i && i.important) || false))
            const newDateArray = weeklyToDos.map((i) => ((i && i.date) || ''))
            const newEventArray = weeklyToDos.map(i => ((i && i.event) || false))
            const newScheduleIdArray = weeklyToDos.map(i => ((i && i.scheduleId) || ''))
            const newSoftDeadlineArray = weeklyToDos.map(i => ((i && i.softDeadline) || ''))
            const newHardDeadlineArray = weeklyToDos.map(i => ((i && i.hardDeadline) || ''))

            const newIsTaskMenus = weeklyToDos.map(() => false)


            const newStatusArray = weeklyToDos.map(i => (i?.status || ToDoStatus.TODO))

            const newParentIdArray = weeklyToDos.map(i => (i?.parentId || ''))
            const newEventIdArray = weeklyToDos.map(i => (i?.eventId || ''))
            const newDurationArray = weeklyToDos.map(i => (i?.duration || -1))

            const {
              sortedParentIdArray,
              sortedIdArray,
              sortedNotesArray,
              sortedCompletedArray,
              sortedStartDateArray,
              sortedEndDateArray,
              sortedNextDayArray,
              sortedCompletedDateArray,
              sortedImportantArray,
              sortedDateArray,
              sortedEventArray,
              sortedScheduleIdArray,
              sortedSoftDeadlineArray,
              sortedHardDeadlineArray,
              sortedStatusArray,
              sortedEventIdArray,
              sortedDurationArray,
            } = sortTasksByParent(
                  newParentIdArray,
                  newIdArray,
                  newNotesArray,
                  newCompletedArray,
                  newStartDateArray,
                  newEndDateArray,
                  newNextDayArray,
                  newCompletedDateArray,
                  newImportantArray,
                  newDateArray,
                  newEventArray,
                  newScheduleIdArray,
                  newSoftDeadlineArray,
                  newHardDeadlineArray,
                  newStatusArray as ToDoStatus[],
                  newEventIdArray,
                  newDurationArray,
                )


            const sortedByStatusSortedIdArray = sortByStatus(sortedIdArray, sortedStatusArray as ToDoStatus[])
            const sortedByStatusSortedNotesArray = sortByStatus(sortedNotesArray, sortedStatusArray as ToDoStatus[])
            const sortedByStatusSortedCompletedArray = sortByStatus(sortedCompletedArray, sortedStatusArray as ToDoStatus[])
            const sortedByStatusSortedStartDateArray = sortByStatus(sortedStartDateArray, sortedStatusArray as ToDoStatus[])
            const sortedByStatusSortedEndDateArray = sortByStatus(sortedEndDateArray, sortedStatusArray as ToDoStatus[])
            const sortedByStatusSortedCompletedDateArray = sortByStatus(sortedCompletedDateArray, sortedStatusArray as ToDoStatus[])
            const sortedByStatusSortedNextDayArray = sortByStatus(sortedNextDayArray, sortedStatusArray as ToDoStatus[])
            const sortedByStatusSortedImportantArray = sortByStatus(sortedImportantArray, sortedStatusArray as ToDoStatus[])
            const sortedByStatusSortedDateArray = sortByStatus(sortedDateArray, sortedStatusArray as ToDoStatus[])
            const sortedByStatusSortedEventArray = sortByStatus(sortedEventArray, sortedStatusArray as ToDoStatus[])
            const sortedByStatusSortedScheduleIdArray = sortByStatus(sortedScheduleIdArray, sortedStatusArray as ToDoStatus[])
            const sortedByStatusSortedSoftDeadlineArray = sortByStatus(sortedSoftDeadlineArray, sortedStatusArray as ToDoStatus[])
            const sortedByStatusSortedHardDeadlineArray = sortByStatus(sortedHardDeadlineArray, sortedStatusArray as ToDoStatus[])

            const sortedByStatusSortedStatusArray = sortByStatus(sortedStatusArray, sortedStatusArray as ToDoStatus[])
            const sortedByStatusSortedParentIdArray = sortByStatus(sortedParentIdArray, sortedStatusArray as ToDoStatus[])

            const sortedByStatusSortedEventIdArray = sortByStatus(sortedEventIdArray, sortedStatusArray as ToDoStatus[])
            const sortedByStatusSortedDurationArray = sortByStatus(sortedDurationArray, sortedStatusArray as ToDoStatus[])

            setIdArray(sortedByStatusSortedIdArray)
            setNotesArray(sortedByStatusSortedNotesArray)
            setCompletedArray(sortedByStatusSortedCompletedArray)
            setStartDateArray(sortedByStatusSortedStartDateArray)
            setEndDateArray(sortedByStatusSortedEndDateArray)
            setCompletedDateArray(sortedByStatusSortedCompletedDateArray)
            setNextDayArray(sortedByStatusSortedNextDayArray)
            setImportantArray(sortedByStatusSortedImportantArray)
            setDateArray(sortedByStatusSortedDateArray)
            setEventArray(sortedByStatusSortedEventArray)
            setScheduleIdArray(sortedByStatusSortedScheduleIdArray)
            setSoftDeadlineArray(sortedByStatusSortedSoftDeadlineArray)
            setHardDeadlineArray(sortedByStatusSortedHardDeadlineArray)

            setIsTaskMenus(newIsTaskMenus)
            setStatusArray(sortedByStatusSortedStatusArray as ToDoStatus[])
            setParentIdArray(sortedByStatusSortedParentIdArray)
            setOrderArray(sortedByStatusSortedNotesArray.map((_, inx) => inx))
            setEventIdArray(sortedByStatusSortedEventIdArray)
            setDurationArray(sortedByStatusSortedDurationArray)
            const {
              displayUIArray: sortedDisplayUIArray,
              dataIndexToDisplayArray: sortedDataIndexToDisplayArray,
            } = getDisplayUI(sortedByStatusSortedNotesArray, sortedByStatusSortedStatusArray as ToDoStatus[])
            const newHeightArray = sortedDisplayUIArray.map(() => 40)
            setHeightArray(newHeightArray)
            const promises = sortedByStatusSortedIdArray.map(async (id, inx) => {
              try {
                return updateTaskInStore(
                  TableName.WEEKLY,
                  id,
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
                  sortedByStatusSortedStatusArray[inx],
                  undefined,
                  inx,
                )
              } catch(e) {
                
              }
            })
            await Promise.all(promises)

            setDisplayUIArray(sortedDisplayUIArray)
            setDataIndexToDisplayArray(sortedDataIndexToDisplayArray)
          }
        } else {
          setIdArray([])
          setNotesArray([])
          setCompletedArray([])
          setStartDateArray([])
          setEndDateArray([])
          setCompletedDateArray([])
          setNextDayArray([])
          setImportantArray([])
          setDateArray([])
          setEventArray([])
          setScheduleIdArray([])
          setSoftDeadlineArray([])
          setHardDeadlineArray([])

          setIsTaskMenus([])
          setStatusArray([])
          setParentIdArray([])
          setOrderArray([])
          setHeightArray([])
          setDisplayUIArray([])
          setDataIndexToDisplayArray([])
          setEventIdArray([])
          setDurationArray([])
        }
      })()
    }

  }, [taskType, localTaskType, disableTaskType, isUpdate, ...displayUIArray])

  useFocusEffect(
    useCallback(() => {
      if (((taskType && !disableTaskType) && (taskType === 'Weekly'))
      || (localTaskType === 'Weekly')) {

        if (((taskType && !disableTaskType) && ((taskType as taskType) !== localTaskType))) {
          setLocalTaskType(taskType)
        }

        (async () => {

          const { payload: { sub } } = (await Auth.currentSession()).getAccessToken()
          const users = await DataStore.query(User, c => c.sub('eq', sub))
          if (!(users?.[0]?.id)) {
            return
          }
          const [user] = users

          const weeklyToDos = await DataStore.query(WeeklyToDo, c => c.userId('eq', user.id))



          if (weeklyToDos?.[0]?.id) {
            let isOrder = true
            for (let i = 0; i < weeklyToDos.length; i++) {
              if (typeof (weeklyToDos?.[i]?.order) !== 'number') {
                isOrder = false
              }
            }
            if (isOrder) {

              const oldOrderArray = weeklyToDos.map((i) => (i?.order))

              const newIdArray = weeklyToDos.map(i => ((i && i.id) || ''))
              const newNotesArray = weeklyToDos.map(i => ((i && i.notes) || ''))
              const newCompletedArray = weeklyToDos.map(i => ((i && i.completed) || false))
              const newStartDateArray = weeklyToDos.map((i) => ((i?.startDate) || ''))
              const newEndDateArray = weeklyToDos.map((i) => ((i?.endDate) || ''))
              const newCompletedDateArray = weeklyToDos.map(i => ((i && i.completedDate) || ''))
              const newNextDayArray = weeklyToDos.map(i => ((i?.startDate && dayjs(i.startDate).isTomorrow()) || false))
              const newImportantArray = weeklyToDos.map(i => ((i && i.important) || false))
              const newDateArray = weeklyToDos.map((i) => ((i && i.date) || ''))
              const newEventArray = weeklyToDos.map(i => ((i && i.event) || false))
              const newScheduleIdArray = weeklyToDos.map(i => ((i && i.scheduleId) || ''))
              const newSoftDeadlineArray = weeklyToDos.map(i => ((i && i.softDeadline) || ''))
              const newHardDeadlineArray = weeklyToDos.map(i => ((i && i.hardDeadline) || ''))

              const newIsTaskMenus = weeklyToDos.map(() => false)


              const newStatusArray = weeklyToDos.map(i => (i?.status || ToDoStatus.TODO))

              const newParentIdArray = weeklyToDos.map(i => (i?.parentId || ''))
              const newEventIdArray = weeklyToDos.map(i => (i?.eventId || ''))
              const newDurationArray = weeklyToDos.map(i => (i?.duration|| -1))

              const sortedByOrderIdArray = sortByOrder(newIdArray, oldOrderArray)

              const sortedByOrderNotesArray = sortByOrder(newNotesArray, oldOrderArray)

              const sortedByOrderCompletedArray = sortByOrder(newCompletedArray, oldOrderArray)

              const sortedByOrderStartDateArray = sortByOrder(newStartDateArray, oldOrderArray)

              const sortedByOrderEndDateArray = sortByOrder(newEndDateArray, oldOrderArray)

              const sortedByOrderCompletedDateArray = sortByOrder(newCompletedDateArray, oldOrderArray)

              const sortedByOrderNextDayArray = sortByOrder(newNextDayArray, oldOrderArray)

              const sortedByOrderImportantArray = sortByOrder(newImportantArray, oldOrderArray)

              const sortedByOrderDateArray = sortByOrder(newDateArray, oldOrderArray)

              const sortedByOrderEventArray = sortByOrder(newEventArray, oldOrderArray)

              const sortedByOrderScheduleIdArray = sortByOrder(newScheduleIdArray, oldOrderArray)

              const sortedByOrderSoftDeadlineArray = sortByOrder(newSoftDeadlineArray, oldOrderArray)
              const sortedByOrderHardDeadlineArray = sortByOrder(newHardDeadlineArray, oldOrderArray)

              const sortedByOrderStatusArray = sortByOrder(newStatusArray, oldOrderArray)

              const sortedByOrderParentIdArray = sortByOrder(newParentIdArray, oldOrderArray)
              const sortedByOrderEventIdArray = sortByOrder(newEventIdArray, oldOrderArray)
              const sortedByOrderDurationArray = sortByOrder(newDurationArray, oldOrderArray)

              const sortedByStatusSortedByOrderIdArray = sortByStatus(sortedByOrderIdArray, sortedByOrderStatusArray as ToDoStatus[])
              const sortedByStatusSortedByOrderNotesArray = sortByStatus(sortedByOrderNotesArray, sortedByOrderStatusArray as ToDoStatus[])
              const sortedByStatusSortedByOrderCompletedArray = sortByStatus(sortedByOrderCompletedArray, sortedByOrderStatusArray as ToDoStatus[])
              const sortedByStatusSortedByOrderStartDateArray = sortByStatus(sortedByOrderStartDateArray, sortedByOrderStatusArray as ToDoStatus[])
              const sortedByStatusSortedByOrderEndDateArray = sortByStatus(sortedByOrderEndDateArray, sortedByOrderStatusArray as ToDoStatus[])
              const sortedByStatusSortedByOrderCompletedDateArray = sortByStatus(sortedByOrderCompletedDateArray, sortedByOrderStatusArray as ToDoStatus[])
              const sortedByStatusSortedByOrderNextDayArray = sortByStatus(sortedByOrderNextDayArray, sortedByOrderStatusArray as ToDoStatus[])
              const sortedByStatusSortedByOrderImportantArray = sortByStatus(sortedByOrderImportantArray, sortedByOrderStatusArray as ToDoStatus[])
              const sortedByStatusSortedByOrderDateArray = sortByStatus(sortedByOrderDateArray, sortedByOrderStatusArray as ToDoStatus[])
              const sortedByStatusSortedByOrderEventArray = sortByStatus(sortedByOrderEventArray, sortedByOrderStatusArray as ToDoStatus[])
              const sortedByStatusSortedByOrderScheduleIdArray = sortByStatus(sortedByOrderScheduleIdArray, sortedByOrderStatusArray as ToDoStatus[])
              const sortedByStatusSortedByOrderSoftDeadlineArray = sortByStatus(sortedByOrderSoftDeadlineArray, sortedByOrderStatusArray as ToDoStatus[])
              const sortedByStatusSortedByOrderHardDeadlineArray = sortByStatus(sortedByOrderHardDeadlineArray, sortedByOrderStatusArray as ToDoStatus[])

              const sortedByStatusSortedByOrderStatusArray = sortByStatus(sortedByOrderStatusArray, sortedByOrderStatusArray as ToDoStatus[])
              const sortedByStatusSortedByOrderParentIdArray = sortByStatus(sortedByOrderParentIdArray, sortedByOrderStatusArray as ToDoStatus[])
              const sortedByStatusSortedByOrderEventIdArray = sortByStatus(sortedByOrderEventIdArray, sortedByOrderStatusArray as ToDoStatus[])
              const sortedByStatusSortedByOrderDurationArray = sortByStatus(sortedByOrderDurationArray, sortedByOrderStatusArray as ToDoStatus[])

              setIdArray(sortedByStatusSortedByOrderIdArray)
              setNotesArray(sortedByStatusSortedByOrderNotesArray)
              setCompletedArray(sortedByStatusSortedByOrderCompletedArray)
              setStartDateArray(sortedByStatusSortedByOrderStartDateArray)
              setEndDateArray(sortedByStatusSortedByOrderEndDateArray)
              setCompletedDateArray(sortedByStatusSortedByOrderCompletedDateArray)
              setNextDayArray(sortedByStatusSortedByOrderNextDayArray)
              setImportantArray(sortedByStatusSortedByOrderImportantArray)
              setDateArray(sortedByStatusSortedByOrderDateArray)
              setEventArray(sortedByStatusSortedByOrderEventArray)
              setScheduleIdArray(sortedByStatusSortedByOrderScheduleIdArray)
              setSoftDeadlineArray(sortedByStatusSortedByOrderSoftDeadlineArray)
              setHardDeadlineArray(sortedByStatusSortedByOrderHardDeadlineArray)

              setIsTaskMenus(newIsTaskMenus)
              setStatusArray(sortedByStatusSortedByOrderStatusArray as ToDoStatus[])
              setParentIdArray(sortedByStatusSortedByOrderParentIdArray)
              setOrderArray(sortedByStatusSortedByOrderNotesArray.map((_, inx) => inx))
              setEventIdArray(sortedByStatusSortedByOrderEventIdArray)
              setDurationArray(sortedByStatusSortedByOrderDurationArray)

              const {
                displayUIArray: sortedDisplayUIArray,
                dataIndexToDisplayArray: sortedDataIndexToDisplayArray,
              } = getDisplayUI(sortedByStatusSortedByOrderNotesArray, sortedByStatusSortedByOrderStatusArray as ToDoStatus[])
              const newHeightArray = sortedDisplayUIArray.map(() => 40)
              setHeightArray(newHeightArray)
              setDisplayUIArray(sortedDisplayUIArray)
              setDataIndexToDisplayArray(sortedDataIndexToDisplayArray)
            } else {
              const newIdArray = weeklyToDos.map(i => ((i && i.id) || ''))
              const newNotesArray = weeklyToDos.map(i => ((i && i.notes) || ''))
              const newCompletedArray = weeklyToDos.map(i => ((i && i.completed) || false))
              const newStartDateArray = weeklyToDos.map((i) => ((i?.startDate) || ''))
              const newEndDateArray = weeklyToDos.map((i) => ((i?.endDate) || ''))
              const newCompletedDateArray = weeklyToDos.map(i => ((i && i.completedDate) || ''))
              const newNextDayArray = weeklyToDos.map(i => ((i?.startDate && dayjs(i.startDate).isTomorrow()) || false))
              const newImportantArray = weeklyToDos.map(i => ((i && i.important) || false))
              const newDateArray = weeklyToDos.map((i) => ((i && i.date) || ''))
              const newEventArray = weeklyToDos.map(i => ((i && i.event) || false))
              const newScheduleIdArray = weeklyToDos.map(i => ((i && i.scheduleId) || ''))
              const newSoftDeadlineArray = weeklyToDos.map(i => ((i && i.softDeadline) ||''))
              const newHardDeadlineArray = weeklyToDos.map(i => ((i && i.hardDeadline) ||''))


              const newIsTaskMenus = weeklyToDos.map(() => false)


              const newStatusArray = weeklyToDos.map(i => (i?.status || ToDoStatus.TODO))

              const newParentIdArray = weeklyToDos.map(i => (i?.parentId|| ''))
              const newEventIdArray = weeklyToDos.map(i => (i?.eventId|| ''))
              const newDurationArray = weeklyToDos.map(i => (i?.duration|| -1))

              const {
                sortedParentIdArray,
                sortedIdArray,
                sortedNotesArray,
                sortedCompletedArray,
                sortedStartDateArray,
                sortedEndDateArray,
                sortedNextDayArray,
                sortedCompletedDateArray,
                sortedImportantArray,
                sortedDateArray,
                sortedEventArray,
                sortedScheduleIdArray,
                sortedSoftDeadlineArray,
                sortedHardDeadlineArray,
                sortedStatusArray,
                sortedEventIdArray,
                sortedDurationArray,
              } = sortTasksByParent(
                    newParentIdArray,
                    newIdArray,
                    newNotesArray,
                    newCompletedArray,
                    newStartDateArray,
                    newEndDateArray,
                    newNextDayArray,
                    newCompletedDateArray,
                    newImportantArray,
                    newDateArray,
                    newEventArray,
                    newScheduleIdArray,
                    newSoftDeadlineArray,
                    newHardDeadlineArray,
                    newStatusArray as ToDoStatus[],
                    newEventIdArray,
                    newDurationArray,
                  )

              const sortedByStatusSortedIdArray = sortByStatus(sortedIdArray, sortedStatusArray as ToDoStatus[])
              const sortedByStatusSortedNotesArray = sortByStatus(sortedNotesArray, sortedStatusArray as ToDoStatus[])
              const sortedByStatusSortedCompletedArray = sortByStatus(sortedCompletedArray, sortedStatusArray as ToDoStatus[])
              const sortedByStatusSortedStartDateArray = sortByStatus(sortedStartDateArray, sortedStatusArray as ToDoStatus[])
              const sortedByStatusSortedEndDateArray = sortByStatus(sortedEndDateArray, sortedStatusArray as ToDoStatus[])
              const sortedByStatusSortedCompletedDateArray = sortByStatus(sortedCompletedDateArray, sortedStatusArray as ToDoStatus[])
              const sortedByStatusSortedNextDayArray = sortByStatus(sortedNextDayArray, sortedStatusArray as ToDoStatus[])
              const sortedByStatusSortedImportantArray = sortByStatus(sortedImportantArray, sortedStatusArray as ToDoStatus[])
              const sortedByStatusSortedDateArray = sortByStatus(sortedDateArray, sortedStatusArray as ToDoStatus[])
              const sortedByStatusSortedEventArray = sortByStatus(sortedEventArray, sortedStatusArray as ToDoStatus[])
              const sortedByStatusSortedScheduleIdArray = sortByStatus(sortedScheduleIdArray, sortedStatusArray as ToDoStatus[])
              const sortedByStatusSortedSoftDeadlineArray = sortByStatus(sortedSoftDeadlineArray, sortedStatusArray as ToDoStatus[])
              const sortedByStatusSortedHardDeadlineArray = sortByStatus(sortedHardDeadlineArray, sortedStatusArray as ToDoStatus[])
             
              const sortedByStatusSortedStatusArray = sortByStatus(sortedStatusArray, sortedStatusArray as ToDoStatus[])
              const sortedByStatusSortedParentIdArray = sortByStatus(sortedParentIdArray, sortedStatusArray as ToDoStatus[])

              const sortedByStatusSortedEventIdArray = sortByStatus(sortedEventIdArray, sortedStatusArray as ToDoStatus[])
              const sortedByStatusSortedDurationArray = sortByStatus(sortedDurationArray, sortedStatusArray as ToDoStatus[])

              setIdArray(sortedByStatusSortedIdArray)
              setNotesArray(sortedByStatusSortedNotesArray)
              setCompletedArray(sortedByStatusSortedCompletedArray)
              setStartDateArray(sortedByStatusSortedStartDateArray)
              setEndDateArray(sortedByStatusSortedEndDateArray)
              setCompletedDateArray(sortedByStatusSortedCompletedDateArray)
              setNextDayArray(sortedByStatusSortedNextDayArray)
              setImportantArray(sortedByStatusSortedImportantArray)
              setDateArray(sortedByStatusSortedDateArray)
              setEventArray(sortedByStatusSortedEventArray)
              setScheduleIdArray(sortedByStatusSortedScheduleIdArray)
              setSoftDeadlineArray(sortedByStatusSortedSoftDeadlineArray)
              setHardDeadlineArray(sortedByStatusSortedHardDeadlineArray)

              setIsTaskMenus(newIsTaskMenus)

              setStatusArray(sortedByStatusSortedStatusArray as ToDoStatus[])
              setParentIdArray(sortedByStatusSortedParentIdArray)
              setOrderArray(sortedByStatusSortedNotesArray.map((_, inx) => inx))
              setEventIdArray(sortedByStatusSortedEventIdArray)
              setDurationArray(sortedByStatusSortedDurationArray)

              const {
                displayUIArray: sortedDisplayUIArray,
                dataIndexToDisplayArray: sortedDataIndexToDisplayArray,
              } = getDisplayUI(sortedByStatusSortedNotesArray, sortedByStatusSortedStatusArray as ToDoStatus[])
              const promises = sortedByStatusSortedIdArray.map(async (id, inx) => {
                try {
                  return updateTaskInStore(
                    TableName.WEEKLY,
                    id,
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
                    sortedByStatusSortedStatusArray[inx],
                    undefined,
                    inx,
                  )
                } catch(e) {
                  
                }
              })
              await Promise.all(promises)
              const newHeightArray = sortedDisplayUIArray.map(() => 40)
              setHeightArray(newHeightArray)
              setDisplayUIArray(sortedDisplayUIArray)
              setDataIndexToDisplayArray(sortedDataIndexToDisplayArray)
            }
          } else {
            setIdArray([])
            setNotesArray([])
            setCompletedArray([])
            setStartDateArray([])
            setEndDateArray([])
            setCompletedDateArray([])
            setNextDayArray([])
            setImportantArray([])
            setDateArray([])
            setEventArray([])
            setScheduleIdArray([])
            setSoftDeadlineArray([])
            setHardDeadlineArray([])
            setIsTaskMenus([])
            setStatusArray([])
            setParentIdArray([])
            setOrderArray([])
            setHeightArray([])
            setDisplayUIArray([])
            setDataIndexToDisplayArray([])
            setEventIdArray([])
            setDurationArray([])
          }
        })()
      }

    }, [taskType, localTaskType, disableTaskType, isUpdate, ...displayUIArray])
  )

  useEffect(() => {

    if (((taskType && !disableTaskType) && (taskType === 'Master'))
    || (localTaskType === 'Master')) {

      if (((taskType && !disableTaskType) && ((taskType as taskType) !== localTaskType))) {
        setLocalTaskType(taskType)
      }

      (async () => {

        const { payload: { sub } } = (await Auth.currentSession()).getAccessToken()
        const users = await DataStore.query(User, c => c.sub('eq', sub))
        if (!(users?.[0]?.id)) {
          return
        }
        const [user] = users

        const masterToDos = await DataStore.query(MasterToDo, c => c.userId('eq', user.id))


        if (masterToDos?.[0]?.id) {
          let isOrder = true
          for (let i = 0; i < masterToDos.length; i++) {
            if (typeof (masterToDos?.[i]?.order) !== 'number') {
              isOrder = false
            }
          }
          if (isOrder) {

            const oldOrderArray = masterToDos.map((i) => (i?.order))

            const newIdArray = masterToDos.map(i => ((i && i.id) || ''))
            const newNotesArray = masterToDos.map(i => ((i && i.notes) || ''))
            const newCompletedArray = masterToDos.map(i => ((i && i.completed) || false))
            const newStartDateArray = masterToDos.map((i) => ((i?.startDate) || ''))
            const newEndDateArray = masterToDos.map((i) => ((i?.endDate) || ''))
            const newCompletedDateArray = masterToDos.map(i => ((i && i.completedDate) || ''))
            const newNextDayArray = masterToDos.map(i => ((i?.startDate && dayjs(i.startDate).isTomorrow()) || false))
            const newImportantArray = masterToDos.map(i => ((i && i.important) || false))
            const newDateArray = masterToDos.map((i) => ((i && i.date) || ''))
            const newEventArray = masterToDos.map(i => ((i && i.event) || false))
            const newScheduleIdArray = masterToDos.map(i => ((i && i.scheduleId) || ''))
            const newSoftDeadlineArray = masterToDos.map(i => ((i && i.softDeadline) || ''))
            const newHardDeadlineArray = masterToDos.map(i => ((i && i.hardDeadline) || ''))

            const newIsTaskMenus = masterToDos.map(() => false)


            const newStatusArray = masterToDos.map(i => (i?.status || ToDoStatus.TODO))

            const newParentIdArray = masterToDos.map(i => (i?.parentId || ''))
            const newEventIdArray = masterToDos.map(i => (i?.eventId || ''))
            const newDurationArray = masterToDos.map(i => (i?.duration || -1))

            const sortedByOrderIdArray = sortByOrder(newIdArray, oldOrderArray)

            const sortedByOrderNotesArray = sortByOrder(newNotesArray, oldOrderArray)

            const sortedByOrderCompletedArray = sortByOrder(newCompletedArray, oldOrderArray)

            const sortedByOrderStartDateArray = sortByOrder(newStartDateArray, oldOrderArray)

            const sortedByOrderEndDateArray = sortByOrder(newEndDateArray, oldOrderArray)

            const sortedByOrderCompletedDateArray = sortByOrder(newCompletedDateArray, oldOrderArray)

            const sortedByOrderNextDayArray = sortByOrder(newNextDayArray, oldOrderArray)

            const sortedByOrderImportantArray = sortByOrder(newImportantArray, oldOrderArray)

            const sortedByOrderDateArray = sortByOrder(newDateArray, oldOrderArray)

            const sortedByOrderEventArray = sortByOrder(newEventArray, oldOrderArray)

            const sortedByOrderScheduleIdArray = sortByOrder(newScheduleIdArray, oldOrderArray)

            const sortedByOrderSoftDeadlineArray = sortByOrder(newSoftDeadlineArray, oldOrderArray)
            const sortedByOrderHardDeadlineArray = sortByOrder(newHardDeadlineArray, oldOrderArray)

            const sortedByOrderStatusArray = sortByOrder(newStatusArray, oldOrderArray)

            const sortedByOrderParentIdArray = sortByOrder(newParentIdArray, oldOrderArray)
            const sortedByOrderEventIdArray = sortByOrder(newEventIdArray, oldOrderArray)
            const sortedByOrderDurationArray = sortByOrder(newDurationArray, oldOrderArray)


            const sortedByStatusSortedByOrderIdArray = sortByStatus(sortedByOrderIdArray, sortedByOrderStatusArray as ToDoStatus[])
            const sortedByStatusSortedByOrderNotesArray = sortByStatus(sortedByOrderNotesArray, sortedByOrderStatusArray as ToDoStatus[])
            const sortedByStatusSortedByOrderCompletedArray = sortByStatus(sortedByOrderCompletedArray, sortedByOrderStatusArray as ToDoStatus[])
            const sortedByStatusSortedByOrderStartDateArray = sortByStatus(sortedByOrderStartDateArray, sortedByOrderStatusArray as ToDoStatus[])
            const sortedByStatusSortedByOrderEndDateArray = sortByStatus(sortedByOrderEndDateArray, sortedByOrderStatusArray as ToDoStatus[])
            const sortedByStatusSortedByOrderCompletedDateArray = sortByStatus(sortedByOrderCompletedDateArray, sortedByOrderStatusArray as ToDoStatus[])
            const sortedByStatusSortedByOrderNextDayArray = sortByStatus(sortedByOrderNextDayArray, sortedByOrderStatusArray as ToDoStatus[])
            const sortedByStatusSortedByOrderImportantArray = sortByStatus(sortedByOrderImportantArray, sortedByOrderStatusArray as ToDoStatus[])
            const sortedByStatusSortedByOrderDateArray = sortByStatus(sortedByOrderDateArray, sortedByOrderStatusArray as ToDoStatus[])
            const sortedByStatusSortedByOrderEventArray = sortByStatus(sortedByOrderEventArray, sortedByOrderStatusArray as ToDoStatus[])
            const sortedByStatusSortedByOrderScheduleIdArray = sortByStatus(sortedByOrderScheduleIdArray, sortedByOrderStatusArray as ToDoStatus[])
            const sortedByStatusSortedByOrderSoftDeadlineArray = sortByStatus(sortedByOrderSoftDeadlineArray, sortedByOrderStatusArray as ToDoStatus[])
            const sortedByStatusSortedByOrderHardDeadlineArray = sortByStatus(sortedByOrderHardDeadlineArray, sortedByOrderStatusArray as ToDoStatus[])

            const sortedByStatusSortedByOrderStatusArray = sortByStatus(sortedByOrderStatusArray, sortedByOrderStatusArray as ToDoStatus[])
            const sortedByStatusSortedByOrderParentIdArray = sortByStatus(sortedByOrderParentIdArray, sortedByOrderStatusArray as ToDoStatus[])

            const sortedByStatusSortedByOrderEventIdArray = sortByStatus(sortedByOrderEventIdArray, sortedByOrderStatusArray as ToDoStatus[])
            const sortedByStatusSortedByOrderDurationArray = sortByStatus(sortedByOrderDurationArray, sortedByOrderStatusArray as ToDoStatus[])

            setIdArray(sortedByStatusSortedByOrderIdArray)
            setNotesArray(sortedByStatusSortedByOrderNotesArray)
            setCompletedArray(sortedByStatusSortedByOrderCompletedArray)
            setStartDateArray(sortedByStatusSortedByOrderStartDateArray)
            setEndDateArray(sortedByStatusSortedByOrderEndDateArray)
            setCompletedDateArray(sortedByStatusSortedByOrderCompletedDateArray)
            setNextDayArray(sortedByStatusSortedByOrderNextDayArray)
            setImportantArray(sortedByStatusSortedByOrderImportantArray)
            setDateArray(sortedByStatusSortedByOrderDateArray)
            setEventArray(sortedByStatusSortedByOrderEventArray)
            setScheduleIdArray(sortedByStatusSortedByOrderScheduleIdArray)
            setSoftDeadlineArray(sortedByStatusSortedByOrderSoftDeadlineArray)
            setHardDeadlineArray(sortedByStatusSortedByOrderHardDeadlineArray)

            setIsTaskMenus(newIsTaskMenus)
            setStatusArray(sortedByStatusSortedByOrderStatusArray as ToDoStatus[])
            setParentIdArray(sortedByStatusSortedByOrderParentIdArray)
            setOrderArray(sortedByStatusSortedByOrderNotesArray.map((_, inx) => inx))
            setEventIdArray(sortedByStatusSortedByOrderEventIdArray)
            setDurationArray(sortedByStatusSortedByOrderDurationArray)

            const {
              displayUIArray: sortedDisplayUIArray,
              dataIndexToDisplayArray: sortedDataIndexToDisplayArray,
            } = getDisplayUI(sortedByStatusSortedByOrderNotesArray, sortedByStatusSortedByOrderStatusArray as ToDoStatus[])
            const newHeightArray = sortedDisplayUIArray.map(() => 40)
            setHeightArray(newHeightArray)
            setDisplayUIArray(sortedDisplayUIArray)
            setDataIndexToDisplayArray(sortedDataIndexToDisplayArray)
          } else {
            const newIdArray = masterToDos.map(i => ((i && i.id) || ''))
            const newNotesArray = masterToDos.map(i => ((i && i.notes) || ''))
            const newCompletedArray = masterToDos.map(i => ((i && i.completed) || false))
            const newStartDateArray = masterToDos.map((i) => ((i?.startDate) || ''))
            const newEndDateArray = masterToDos.map((i) => ((i?.endDate) || ''))
            const newCompletedDateArray = masterToDos.map(i => ((i && i.completedDate) || ''))
            const newNextDayArray = masterToDos.map(i => ((i?.startDate && dayjs(i.startDate).isTomorrow()) || false))
            const newImportantArray = masterToDos.map(i => ((i && i.important) || false))
            const newDateArray = masterToDos.map((i) => ((i && i.date) || ''))
            const newEventArray = masterToDos.map(i => ((i && i.event) || false))
            const newScheduleIdArray = masterToDos.map(i => ((i && i.scheduleId) || ''))
            const newSoftDeadlineArray = masterToDos.map(i => ((i && i.softDeadline) || ''))
            const newHardDeadlineArray = masterToDos.map(i => ((i && i.hardDeadline) || ''))

            const newIsTaskMenus = masterToDos.map(() => false)


            const newStatusArray = masterToDos.map(i => (i?.status || ToDoStatus.TODO))

            const newParentIdArray = masterToDos.map(i => (i?.parentId|| ''))
            const newEventIdArray = masterToDos.map(i => (i?.eventId|| ''))
            const newDurationArray = masterToDos.map(i => (i?.duration|| -1))

            const {
              sortedParentIdArray,
              sortedIdArray,
              sortedNotesArray,
              sortedCompletedArray,
              sortedStartDateArray,
              sortedEndDateArray,
              sortedNextDayArray,
              sortedCompletedDateArray,
              sortedImportantArray,
              sortedDateArray,
              sortedEventArray,
              sortedScheduleIdArray,
              sortedSoftDeadlineArray,
              sortedHardDeadlineArray,
              sortedStatusArray,
              sortedEventIdArray,
              sortedDurationArray,
            } = sortTasksByParent(
                  newParentIdArray,
                  newIdArray,
                  newNotesArray,
                  newCompletedArray,
                  newStartDateArray,
                  newEndDateArray,
                  newNextDayArray,
                  newCompletedDateArray,
                  newImportantArray,
                  newDateArray,
                  newEventArray,
                  newScheduleIdArray,
                  newSoftDeadlineArray,
                  newHardDeadlineArray,
                  newStatusArray as ToDoStatus[],
                  newEventIdArray,
                  newDurationArray,
                )

            const sortedByStatusSortedIdArray = sortByStatus(sortedIdArray, sortedStatusArray as ToDoStatus[])
            const sortedByStatusSortedNotesArray = sortByStatus(sortedNotesArray, sortedStatusArray as ToDoStatus[])
            const sortedByStatusSortedCompletedArray = sortByStatus(sortedCompletedArray, sortedStatusArray as ToDoStatus[])
            const sortedByStatusSortedStartDateArray = sortByStatus(sortedStartDateArray, sortedStatusArray as ToDoStatus[])
            const sortedByStatusSortedEndDateArray = sortByStatus(sortedEndDateArray, sortedStatusArray as ToDoStatus[])
            const sortedByStatusSortedCompletedDateArray = sortByStatus(sortedCompletedDateArray, sortedStatusArray as ToDoStatus[])
            const sortedByStatusSortedNextDayArray = sortByStatus(sortedNextDayArray, sortedStatusArray as ToDoStatus[])
            const sortedByStatusSortedImportantArray = sortByStatus(sortedImportantArray, sortedStatusArray as ToDoStatus[])
            const sortedByStatusSortedDateArray = sortByStatus(sortedDateArray, sortedStatusArray as ToDoStatus[])
            const sortedByStatusSortedEventArray = sortByStatus(sortedEventArray, sortedStatusArray as ToDoStatus[])
            const sortedByStatusSortedScheduleIdArray = sortByStatus(sortedScheduleIdArray, sortedStatusArray as ToDoStatus[])
            const sortedByStatusSortedSoftDeadlineArray = sortByStatus(sortedSoftDeadlineArray, sortedStatusArray as ToDoStatus[])
            const sortedByStatusSortedHardDeadlineArray = sortByStatus(sortedHardDeadlineArray, sortedStatusArray as ToDoStatus[])

            const sortedByStatusSortedStatusArray = sortByStatus(sortedStatusArray, sortedStatusArray as ToDoStatus[])
            const sortedByStatusSortedParentIdArray = sortByStatus(sortedParentIdArray, sortedStatusArray as ToDoStatus[])

            const sortedByStatusSortedEventIdArray = sortByStatus(sortedEventIdArray, sortedStatusArray as ToDoStatus[])
            const sortedByStatusSortedDurationArray = sortByStatus(sortedDurationArray, sortedStatusArray as ToDoStatus[])

            setIdArray(sortedByStatusSortedIdArray)
            setNotesArray(sortedByStatusSortedNotesArray)
            setCompletedArray(sortedByStatusSortedCompletedArray)
            setStartDateArray(sortedByStatusSortedStartDateArray)
            setEndDateArray(sortedByStatusSortedEndDateArray)
            setCompletedDateArray(sortedByStatusSortedCompletedDateArray)
            setNextDayArray(sortedByStatusSortedNextDayArray)
            setImportantArray(sortedByStatusSortedImportantArray)
            setDateArray(sortedByStatusSortedDateArray)
            setEventArray(sortedByStatusSortedEventArray)
            setScheduleIdArray(sortedByStatusSortedScheduleIdArray)
            setSoftDeadlineArray(sortedByStatusSortedSoftDeadlineArray)
            setHardDeadlineArray(sortedByStatusSortedHardDeadlineArray)

            setIsTaskMenus(newIsTaskMenus)
            setStatusArray(sortedByStatusSortedStatusArray as ToDoStatus[])
            setParentIdArray(sortedByStatusSortedParentIdArray)
            setOrderArray(sortedByStatusSortedNotesArray.map((_, inx) => inx))
            setEventIdArray(sortedByStatusSortedEventIdArray)
            setDurationArray(sortedByStatusSortedDurationArray)

            const {
              displayUIArray: sortedDisplayUIArray,
              dataIndexToDisplayArray: sortedDataIndexToDisplayArray,
            } = getDisplayUI(sortedByStatusSortedNotesArray, sortedByStatusSortedStatusArray as ToDoStatus[])
            const newHeightArray = sortedDisplayUIArray.map(() => 40)
            setHeightArray(newHeightArray)
            const promises = sortedByStatusSortedIdArray.map(async (id, inx) => {
              try {
                return updateTaskInStore(
                  TableName.MASTER,
                  id,
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
                  sortedByStatusSortedStatusArray[inx],
                  undefined,
                  inx,
                )
              } catch(e) {
                
              }
            })
            await Promise.all(promises)

            setDisplayUIArray(sortedDisplayUIArray)
            setDataIndexToDisplayArray(sortedDataIndexToDisplayArray)
          }
        } else {
          setIdArray([])
          setNotesArray([])
          setCompletedArray([])
          setStartDateArray([])
          setEndDateArray([])
          setCompletedDateArray([])
          setNextDayArray([])
          setImportantArray([])
          setDateArray([])
          setEventArray([])
          setScheduleIdArray([])
          setSoftDeadlineArray([])
          setHardDeadlineArray([])
          setIsTaskMenus([])
          setStatusArray([])
          setParentIdArray([])
          setOrderArray([])
          setHeightArray([])
          setDisplayUIArray([])
          setDataIndexToDisplayArray([])
          setEventIdArray([])
          setDurationArray([])
        }
      })()
    }
  }, [taskType, localTaskType, disableTaskType, isUpdate, ...displayUIArray])

  useFocusEffect(
    useCallback(() => {


      if (((taskType && !disableTaskType) && (taskType === 'Master'))
      || (localTaskType === 'Master')) {

        if (((taskType && !disableTaskType) && ((taskType as taskType) !== localTaskType))) {
          setLocalTaskType(taskType)
        }

        (async () => {

          const { payload: { sub } } = (await Auth.currentSession()).getAccessToken()
          const users = await DataStore.query(User, c => c.sub('eq', sub))
          if (!(users?.[0]?.id)) {
            return
          }
          const [user] = users

          const masterToDos = await DataStore.query(MasterToDo, c => c.userId('eq', user.id))



          if (masterToDos?.[0]?.id) {
            let isOrder = true
            for (let i = 0; i < masterToDos.length; i++) {
              if (typeof (masterToDos?.[i]?.order) !== 'number') {
                isOrder = false
              }
            }
            if (isOrder) {

              const oldOrderArray = masterToDos.map((i) => (i?.order))
              const newIdArray = masterToDos.map(i => ((i && i.id) || ''))
              const newNotesArray = masterToDos.map(i => ((i && i.notes) || ''))
              const newCompletedArray = masterToDos.map(i => ((i && i.completed) || false))
              const newStartDateArray = masterToDos.map((i) => ((i?.startDate) || ''))
              const newEndDateArray = masterToDos.map((i) => ((i?.endDate) || ''))
              const newCompletedDateArray = masterToDos.map(i => ((i && i.completedDate) || ''))
              const newNextDayArray = masterToDos.map(i => ((i?.startDate && dayjs(i.startDate).isTomorrow()) || false))
              const newImportantArray = masterToDos.map(i => ((i && i.important) || false))
              const newDateArray = masterToDos.map((i) => ((i && i.date) || ''))
              const newEventArray = masterToDos.map(i => ((i && i.event) || false))
              const newScheduleIdArray = masterToDos.map(i => ((i && i.scheduleId) || ''))
              const newSoftDeadlineArray = masterToDos.map(i => ((i && i.softDeadline) || ''))
              const newHardDeadlineArray = masterToDos.map(i => ((i && i.hardDeadline) || ''))

              const newIsTaskMenus = masterToDos.map(() => false)

              const newStatusArray = masterToDos.map(i => (i?.status || ToDoStatus.TODO))

              const newParentIdArray = masterToDos.map(i => (i?.parentId|| ''))
              const newEventIdArray = masterToDos.map(i => (i?.eventId|| ''))
              const newDurationArray = masterToDos.map(i => (i?.duration|| -1))

              const sortedByOrderIdArray = sortByOrder(newIdArray, oldOrderArray)

              const sortedByOrderNotesArray = sortByOrder(newNotesArray, oldOrderArray)

              const sortedByOrderCompletedArray = sortByOrder(newCompletedArray, oldOrderArray)

              const sortedByOrderStartDateArray = sortByOrder(newStartDateArray, oldOrderArray)

              const sortedByOrderEndDateArray = sortByOrder(newEndDateArray, oldOrderArray)

              const sortedByOrderCompletedDateArray = sortByOrder(newCompletedDateArray, oldOrderArray)

              const sortedByOrderNextDayArray = sortByOrder(newNextDayArray, oldOrderArray)

              const sortedByOrderImportantArray = sortByOrder(newImportantArray, oldOrderArray)

              const sortedByOrderDateArray = sortByOrder(newDateArray, oldOrderArray)

              const sortedByOrderEventArray = sortByOrder(newEventArray, oldOrderArray)

              const sortedByOrderScheduleIdArray = sortByOrder(newScheduleIdArray, oldOrderArray)

              const sortedByOrderSoftDeadlineArray = sortByOrder(newSoftDeadlineArray, oldOrderArray)
              const sortedByOrderHardDeadlineArray = sortByOrder(newHardDeadlineArray, oldOrderArray)

              const sortedByOrderStatusArray = sortByOrder(newStatusArray, oldOrderArray)

              const sortedByOrderParentIdArray = sortByOrder(newParentIdArray, oldOrderArray)
              const sortedByOrderEventIdArray = sortByOrder(newEventIdArray, oldOrderArray)
              const sortedByOrderDurationArray = sortByOrder(newDurationArray, oldOrderArray)

              const sortedByStatusSortedByOrderIdArray = sortByStatus(sortedByOrderIdArray, sortedByOrderStatusArray as ToDoStatus[])
              const sortedByStatusSortedByOrderNotesArray = sortByStatus(sortedByOrderNotesArray, sortedByOrderStatusArray as ToDoStatus[])
              const sortedByStatusSortedByOrderCompletedArray = sortByStatus(sortedByOrderCompletedArray, sortedByOrderStatusArray as ToDoStatus[])
              const sortedByStatusSortedByOrderStartDateArray = sortByStatus(sortedByOrderStartDateArray, sortedByOrderStatusArray as ToDoStatus[])
              const sortedByStatusSortedByOrderEndDateArray = sortByStatus(sortedByOrderEndDateArray, sortedByOrderStatusArray as ToDoStatus[])
              const sortedByStatusSortedByOrderCompletedDateArray = sortByStatus(sortedByOrderCompletedDateArray, sortedByOrderStatusArray as ToDoStatus[])
              const sortedByStatusSortedByOrderNextDayArray = sortByStatus(sortedByOrderNextDayArray, sortedByOrderStatusArray as ToDoStatus[])
              const sortedByStatusSortedByOrderImportantArray = sortByStatus(sortedByOrderImportantArray, sortedByOrderStatusArray as ToDoStatus[])
              const sortedByStatusSortedByOrderDateArray = sortByStatus(sortedByOrderDateArray, sortedByOrderStatusArray as ToDoStatus[])
              const sortedByStatusSortedByOrderEventArray = sortByStatus(sortedByOrderEventArray, sortedByOrderStatusArray as ToDoStatus[])
              const sortedByStatusSortedByOrderScheduleIdArray = sortByStatus(sortedByOrderScheduleIdArray, sortedByOrderStatusArray as ToDoStatus[])
              const sortedByStatusSortedByOrderSoftDeadlineArray = sortByStatus(sortedByOrderSoftDeadlineArray, sortedByOrderStatusArray as ToDoStatus[])
              const sortedByStatusSortedByOrderHardDeadlineArray = sortByStatus(sortedByOrderHardDeadlineArray, sortedByOrderStatusArray as ToDoStatus[])
              const sortedByStatusSortedByOrderStatusArray = sortByStatus(sortedByOrderStatusArray, sortedByOrderStatusArray as ToDoStatus[])
              const sortedByStatusSortedByOrderParentIdArray = sortByStatus(sortedByOrderParentIdArray, sortedByOrderStatusArray as ToDoStatus[])

              const sortedByStatusSortedByOrderEventIdArray = sortByStatus(sortedByOrderEventIdArray, sortedByOrderStatusArray as ToDoStatus[])
              const sortedByStatusSortedByOrderDurationArray = sortByStatus(sortedByOrderDurationArray, sortedByOrderStatusArray as ToDoStatus[])

              setIdArray(sortedByStatusSortedByOrderIdArray)
              setNotesArray(sortedByStatusSortedByOrderNotesArray)
              setCompletedArray(sortedByStatusSortedByOrderCompletedArray)
              setStartDateArray(sortedByStatusSortedByOrderStartDateArray)
              setEndDateArray(sortedByStatusSortedByOrderEndDateArray)
              setCompletedDateArray(sortedByStatusSortedByOrderCompletedDateArray)
              setNextDayArray(sortedByStatusSortedByOrderNextDayArray)
              setImportantArray(sortedByStatusSortedByOrderImportantArray)
              setDateArray(sortedByStatusSortedByOrderDateArray)
              setEventArray(sortedByStatusSortedByOrderEventArray)
              setScheduleIdArray(sortedByStatusSortedByOrderScheduleIdArray)
              setSoftDeadlineArray(sortedByStatusSortedByOrderSoftDeadlineArray)
              setHardDeadlineArray(sortedByStatusSortedByOrderHardDeadlineArray)
              setIsTaskMenus(newIsTaskMenus)
              setStatusArray(sortedByStatusSortedByOrderStatusArray as ToDoStatus[])
              setParentIdArray(sortedByStatusSortedByOrderParentIdArray)
              setOrderArray(sortedByStatusSortedByOrderNotesArray.map((_, inx) => inx))
              setEventIdArray(sortedByStatusSortedByOrderEventIdArray)
              setDurationArray(sortedByStatusSortedByOrderDurationArray)

              const {
                displayUIArray: sortedDisplayUIArray,
                dataIndexToDisplayArray: sortedDataIndexToDisplayArray,
              } = getDisplayUI(sortedByStatusSortedByOrderNotesArray, sortedByStatusSortedByOrderStatusArray as ToDoStatus[])
              const newHeightArray = sortedDisplayUIArray.map(() => 40)
              setHeightArray(newHeightArray)
              setDisplayUIArray(sortedDisplayUIArray)
              setDataIndexToDisplayArray(sortedDataIndexToDisplayArray)
            } else {
              const newIdArray = masterToDos.map(i => ((i && i.id) || ''))
              const newNotesArray = masterToDos.map(i => ((i && i.notes) || ''))
              const newCompletedArray = masterToDos.map(i => ((i && i.completed) || false))
              const newStartDateArray = masterToDos.map((i) => ((i?.startDate) || ''))
              const newEndDateArray = masterToDos.map((i) => ((i?.endDate) || ''))
              const newCompletedDateArray = masterToDos.map(i => ((i && i.completedDate) || ''))
              const newNextDayArray = masterToDos.map(i => ((i?.startDate && dayjs(i.startDate).isTomorrow()) || false))
              const newImportantArray = masterToDos.map(i => ((i && i.important) || false))
              const newDateArray = masterToDos.map((i) => ((i && i.date) || ''))
              const newEventArray = masterToDos.map(i => ((i && i.event) || false))
              const newScheduleIdArray = masterToDos.map(i => ((i && i.scheduleId) || ''))
              const newSoftDeadlineArray = masterToDos.map(i => ((i && i.softDeadline) || ''))
              const newHardDeadlineArray = masterToDos.map(i => ((i && i.hardDeadline) || ''))

              const newIsTaskMenus = masterToDos.map(() => false)


              const newStatusArray = masterToDos.map(i => (i?.status || ToDoStatus.TODO))

              const newParentIdArray = masterToDos.map(i => (i?.parentId|| ''))
              const newEventIdArray = masterToDos.map(i => (i?.eventId|| ''))
              const newDurationArray = masterToDos.map(i => (i?.duration || -1))

              const {
                sortedParentIdArray,
                sortedIdArray,
                sortedNotesArray,
                sortedCompletedArray,
                sortedStartDateArray,
                sortedEndDateArray,
                sortedNextDayArray,
                sortedCompletedDateArray,
                sortedImportantArray,
                sortedDateArray,
                sortedEventArray,
                sortedScheduleIdArray,
                sortedSoftDeadlineArray,
                sortedHardDeadlineArray,
                sortedStatusArray,
                sortedEventIdArray,
                sortedDurationArray,
              } = sortTasksByParent(
                    newParentIdArray,
                    newIdArray,
                    newNotesArray,
                    newCompletedArray,
                    newStartDateArray,
                    newEndDateArray,
                    newNextDayArray,
                    newCompletedDateArray,
                    newImportantArray,
                    newDateArray,
                    newEventArray,
                    newScheduleIdArray,
                    newSoftDeadlineArray,
                    newHardDeadlineArray,
                    newStatusArray as ToDoStatus[],
                    newEventIdArray,
                    newDurationArray,
                  )



              const sortedByStatusSortedIdArray = sortByStatus(sortedIdArray, sortedStatusArray as ToDoStatus[])
              const sortedByStatusSortedNotesArray = sortByStatus(sortedNotesArray, sortedStatusArray as ToDoStatus[])
              const sortedByStatusSortedCompletedArray = sortByStatus(sortedCompletedArray, sortedStatusArray as ToDoStatus[])
              const sortedByStatusSortedStartDateArray = sortByStatus(sortedStartDateArray, sortedStatusArray as ToDoStatus[])
              const sortedByStatusSortedEndDateArray = sortByStatus(sortedEndDateArray, sortedStatusArray as ToDoStatus[])
              const sortedByStatusSortedCompletedDateArray = sortByStatus(sortedCompletedDateArray, sortedStatusArray as ToDoStatus[])
              const sortedByStatusSortedNextDayArray = sortByStatus(sortedNextDayArray, sortedStatusArray as ToDoStatus[])
              const sortedByStatusSortedImportantArray = sortByStatus(sortedImportantArray, sortedStatusArray as ToDoStatus[])
              const sortedByStatusSortedDateArray = sortByStatus(sortedDateArray, sortedStatusArray as ToDoStatus[])
              const sortedByStatusSortedEventArray = sortByStatus(sortedEventArray, sortedStatusArray as ToDoStatus[])
              const sortedByStatusSortedScheduleIdArray = sortByStatus(sortedScheduleIdArray, sortedStatusArray as ToDoStatus[])
              const sortedByStatusSortedSoftDeadlineArray = sortByStatus(sortedSoftDeadlineArray, sortedStatusArray as ToDoStatus[])
              const sortedByStatusSortedHardDeadlineArray = sortByStatus(sortedHardDeadlineArray, sortedStatusArray as ToDoStatus[])
              const sortedByStatusSortedStatusArray = sortByStatus(sortedStatusArray, sortedStatusArray as ToDoStatus[])
              const sortedByStatusSortedParentIdArray = sortByStatus(sortedParentIdArray, sortedStatusArray as ToDoStatus[])

              const sortedByStatusSortedEventIdArray = sortByStatus(sortedEventIdArray, sortedStatusArray as ToDoStatus[])
              const sortedByStatusSortedDurationArray = sortByStatus(sortedDurationArray, sortedStatusArray as ToDoStatus[])

              setIdArray(sortedByStatusSortedIdArray)
              setNotesArray(sortedByStatusSortedNotesArray)
              setCompletedArray(sortedByStatusSortedCompletedArray)
              setStartDateArray(sortedByStatusSortedStartDateArray)
              setEndDateArray(sortedByStatusSortedEndDateArray)
              setCompletedDateArray(sortedByStatusSortedCompletedDateArray)
              setNextDayArray(sortedByStatusSortedNextDayArray)
              setImportantArray(sortedByStatusSortedImportantArray)
              setDateArray(sortedByStatusSortedDateArray)
              setEventArray(sortedByStatusSortedEventArray)
              setScheduleIdArray(sortedByStatusSortedScheduleIdArray)
              setSoftDeadlineArray(sortedByStatusSortedSoftDeadlineArray)
              setHardDeadlineArray(sortedByStatusSortedHardDeadlineArray)

              setIsTaskMenus(newIsTaskMenus)
              setStatusArray(sortedByStatusSortedStatusArray as ToDoStatus[])
              setParentIdArray(sortedByStatusSortedParentIdArray)
              setOrderArray(sortedByStatusSortedNotesArray.map((_, inx) => inx))
              setEventIdArray(sortedByStatusSortedEventIdArray)
              setDurationArray(sortedByStatusSortedDurationArray)

              const {
                displayUIArray: sortedDisplayUIArray,
                dataIndexToDisplayArray: sortedDataIndexToDisplayArray,
              } = getDisplayUI(sortedByStatusSortedNotesArray, sortedByStatusSortedStatusArray as ToDoStatus[])
              const newHeightArray = sortedDisplayUIArray.map(() => 40)
              setHeightArray(newHeightArray)
              const promises = sortedByStatusSortedIdArray.map(async (id, inx) => {
                try {
                  return updateTaskInStore(
                    TableName.MASTER,
                    id,
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
                    sortedByStatusSortedStatusArray[inx],
                    undefined,
                    inx,
                  )
                } catch(e) {
                  
                }
              })
              await Promise.all(promises)

              setDisplayUIArray(sortedDisplayUIArray)
              setDataIndexToDisplayArray(sortedDataIndexToDisplayArray)
            }
          } else {
            setIdArray([])
            setNotesArray([])
            setCompletedArray([])
            setStartDateArray([])
            setEndDateArray([])
            setCompletedDateArray([])
            setNextDayArray([])
            setImportantArray([])
            setDateArray([])
            setEventArray([])
            setScheduleIdArray([])
            setSoftDeadlineArray([])
            setHardDeadlineArray([])

            setIsTaskMenus([])
            setStatusArray([])
            setParentIdArray([])
            setOrderArray([])
            setHeightArray([])
            setDisplayUIArray([])
            setDataIndexToDisplayArray([])
            setEventIdArray([])
            setDurationArray([])
          }
        })()
      }
    }, [taskType, localTaskType, disableTaskType, isUpdate, ...displayUIArray])
  )


  useEffect(() => {
    if (((taskType && !disableTaskType) && (taskType === 'Grocery'))
    || (localTaskType === 'Grocery')) {

      if (((taskType && !disableTaskType) && ((taskType as taskType) !== localTaskType))) {
        setLocalTaskType(taskType)
      }

      (async () => {

        const { payload: { sub } } = (await Auth.currentSession()).getAccessToken()
        const users = await DataStore.query(User, c => c.sub('eq', sub))
        if (!(users?.[0]?.id)) {
          return
        }
        const [user] = users

        const groceryToDos = await DataStore.query(GroceryToDo, c => c.userId('eq', user.id))



        if (groceryToDos?.[0]?.id) {
          let isOrder = true
          for (let i = 0; i < groceryToDos.length; i++) {
            if (typeof (groceryToDos?.[i]?.order) !== 'number') {
              isOrder = false
            }
          }
          if (isOrder) {
            const oldOrderArray = groceryToDos.map((i) => (i?.order))

            const newIdArray = groceryToDos.map(i => ((i && i.id) || ''))
            const newNotesArray = groceryToDos.map(i => ((i && i.notes) || ''))
            const newCompletedArray = groceryToDos.map(i => ((i && i.completed) || false))
            const newStartDateArray = groceryToDos.map((i) => ((i?.startDate) || ''))
            const newEndDateArray = groceryToDos.map((i) => ((i?.endDate) || ''))
            const newCompletedDateArray = groceryToDos.map(i => ((i && i.completedDate) || ''))
            const newNextDayArray = groceryToDos.map(i => ((i?.startDate && dayjs(i.startDate).isTomorrow()) || false))
            const newImportantArray = groceryToDos.map(i => ((i && i.important) || false))
            const newDateArray = groceryToDos.map((i) => ((i && i.date) || ''))
            const newEventArray = groceryToDos.map(i => ((i && i.event) || false))
            const newScheduleIdArray = groceryToDos.map(i => ((i && i.scheduleId) || ''))
            const newSoftDeadlineArray = groceryToDos.map(i => ((i && i.softDeadline) || ''))
            const newHardDeadlineArray = groceryToDos.map(i => ((i && i.hardDeadline) || ''))

            const newIsTaskMenus = groceryToDos.map(() => false)

            const newStatusArray = groceryToDos.map(i => (i?.status || ToDoStatus.TODO))

            const newParentIdArray = groceryToDos.map(i => (i?.parentId|| ''))
            const newEventIdArray = groceryToDos.map(i => (i?.eventId|| ''))
            const newDurationArray = groceryToDos.map(i => (i?.duration || -1))

            const sortedByOrderIdArray = sortByOrder(newIdArray, oldOrderArray)

            const sortedByOrderNotesArray = sortByOrder(newNotesArray, oldOrderArray)

            const sortedByOrderCompletedArray = sortByOrder(newCompletedArray, oldOrderArray)

            const sortedByOrderStartDateArray = sortByOrder(newStartDateArray, oldOrderArray)

            const sortedByOrderEndDateArray = sortByOrder(newEndDateArray, oldOrderArray)

            const sortedByOrderCompletedDateArray = sortByOrder(newCompletedDateArray, oldOrderArray)

            const sortedByOrderNextDayArray = sortByOrder(newNextDayArray, oldOrderArray)

            const sortedByOrderImportantArray = sortByOrder(newImportantArray, oldOrderArray)

            const sortedByOrderDateArray = sortByOrder(newDateArray, oldOrderArray)

            const sortedByOrderEventArray = sortByOrder(newEventArray, oldOrderArray)

            const sortedByOrderScheduleIdArray = sortByOrder(newScheduleIdArray, oldOrderArray)

            const sortedByOrderSoftDeadlineArray = sortByOrder(newSoftDeadlineArray, oldOrderArray)
            const sortedByOrderHardDeadlineArray = sortByOrder(newHardDeadlineArray, oldOrderArray)

            const sortedByOrderStatusArray = sortByOrder(newStatusArray, oldOrderArray)

            const sortedByOrderParentIdArray = sortByOrder(newParentIdArray, oldOrderArray)
            const sortedByOrderEventIdArray = sortByOrder(newEventIdArray, oldOrderArray)
            const sortedByOrderDurationArray = sortByOrder(newDurationArray, oldOrderArray)



            const sortedByStatusSortedByOrderIdArray = sortByStatus(sortedByOrderIdArray, sortedByOrderStatusArray as ToDoStatus[])
            const sortedByStatusSortedByOrderNotesArray = sortByStatus(sortedByOrderNotesArray, sortedByOrderStatusArray as ToDoStatus[])
            const sortedByStatusSortedByOrderCompletedArray = sortByStatus(sortedByOrderCompletedArray, sortedByOrderStatusArray as ToDoStatus[])
            const sortedByStatusSortedByOrderStartDateArray = sortByStatus(sortedByOrderStartDateArray, sortedByOrderStatusArray as ToDoStatus[])
            const sortedByStatusSortedByOrderEndDateArray = sortByStatus(sortedByOrderEndDateArray, sortedByOrderStatusArray as ToDoStatus[])
            const sortedByStatusSortedByOrderCompletedDateArray = sortByStatus(sortedByOrderCompletedDateArray, sortedByOrderStatusArray as ToDoStatus[])
            const sortedByStatusSortedByOrderNextDayArray = sortByStatus(sortedByOrderNextDayArray, sortedByOrderStatusArray as ToDoStatus[])
            const sortedByStatusSortedByOrderImportantArray = sortByStatus(sortedByOrderImportantArray, sortedByOrderStatusArray as ToDoStatus[])
            const sortedByStatusSortedByOrderDateArray = sortByStatus(sortedByOrderDateArray, sortedByOrderStatusArray as ToDoStatus[])
            const sortedByStatusSortedByOrderEventArray = sortByStatus(sortedByOrderEventArray, sortedByOrderStatusArray as ToDoStatus[])
            const sortedByStatusSortedByOrderScheduleIdArray = sortByStatus(sortedByOrderScheduleIdArray, sortedByOrderStatusArray as ToDoStatus[])
            const sortedByStatusSortedByOrderSoftDeadlineArray = sortByStatus(sortedByOrderSoftDeadlineArray, sortedByOrderStatusArray as ToDoStatus[])
            const sortedByStatusSortedByOrderHardDeadlineArray = sortByStatus(sortedByOrderHardDeadlineArray, sortedByOrderStatusArray as ToDoStatus[])
 
            const sortedByStatusSortedByOrderStatusArray = sortByStatus(sortedByOrderStatusArray, sortedByOrderStatusArray as ToDoStatus[])
            const sortedByStatusSortedByOrderParentIdArray = sortByStatus(sortedByOrderParentIdArray, sortedByOrderStatusArray as ToDoStatus[])

            const sortedByStatusSortedByOrderEventIdArray = sortByStatus(sortedByOrderEventIdArray, sortedByOrderStatusArray as ToDoStatus[])
            const sortedByStatusSortedByOrderDurationArray = sortByStatus(sortedByOrderDurationArray, sortedByOrderStatusArray as ToDoStatus[])

            setIdArray(sortedByStatusSortedByOrderIdArray)
            setNotesArray(sortedByStatusSortedByOrderNotesArray)
            setCompletedArray(sortedByStatusSortedByOrderCompletedArray)
            setStartDateArray(sortedByStatusSortedByOrderStartDateArray)
            setEndDateArray(sortedByStatusSortedByOrderEndDateArray)
            setCompletedDateArray(sortedByStatusSortedByOrderCompletedDateArray)
            setNextDayArray(sortedByStatusSortedByOrderNextDayArray)
            setImportantArray(sortedByStatusSortedByOrderImportantArray)
            setDateArray(sortedByStatusSortedByOrderDateArray)
            setEventArray(sortedByStatusSortedByOrderEventArray)
            setScheduleIdArray(sortedByStatusSortedByOrderScheduleIdArray)
            setSoftDeadlineArray(sortedByStatusSortedByOrderSoftDeadlineArray)
            setHardDeadlineArray(sortedByStatusSortedByOrderHardDeadlineArray)

            setIsTaskMenus(newIsTaskMenus)
            setStatusArray(sortedByStatusSortedByOrderStatusArray as ToDoStatus[])
            setParentIdArray(sortedByStatusSortedByOrderParentIdArray)
            setOrderArray(sortedByStatusSortedByOrderNotesArray.map((_, inx) => inx))
            setEventIdArray(sortedByStatusSortedByOrderEventIdArray)
            setDurationArray(sortedByStatusSortedByOrderDurationArray)

            const {
              displayUIArray: sortedDisplayUIArray,
              dataIndexToDisplayArray: sortedDataIndexToDisplayArray,
            } = getDisplayUI(sortedByStatusSortedByOrderNotesArray, sortedByStatusSortedByOrderStatusArray as ToDoStatus[])
            const newHeightArray = sortedDisplayUIArray.map(() => 40)
            setHeightArray(newHeightArray)
            setDisplayUIArray(sortedDisplayUIArray)
            setDataIndexToDisplayArray(sortedDataIndexToDisplayArray)
          } else {
            const newIdArray = groceryToDos.map(i => ((i && i.id) || ''))
            const newNotesArray = groceryToDos.map(i => ((i && i.notes) || ''))
            const newCompletedArray = groceryToDos.map(i => ((i && i.completed) || false))
            const newStartDateArray = groceryToDos.map((i) => ((i?.startDate) || ''))
            const newEndDateArray = groceryToDos.map((i) => ((i?.endDate) || ''))
            const newCompletedDateArray = groceryToDos.map(i => ((i && i.completedDate) || ''))
            const newNextDayArray = groceryToDos.map(i => ((i?.startDate && dayjs(i.startDate).isTomorrow()) || false))
            const newImportantArray = groceryToDos.map(i => ((i && i.important) || false))
            const newDateArray = groceryToDos.map((i) => ((i && i.date) || ''))
            const newEventArray = groceryToDos.map(i => ((i && i.event) || false))
            const newScheduleIdArray = groceryToDos.map(i => ((i && i.scheduleId) || ''))
            const newSoftDeadlineArray = groceryToDos.map(i => ((i && i.softDeadline) || ''))
            const newHardDeadlineArray = groceryToDos.map(i => ((i && i.hardDeadline) || ''))

            const newIsTaskMenus = groceryToDos.map(() => false)


            const newStatusArray = groceryToDos.map(i => (i?.status || ToDoStatus.TODO))

            const newParentIdArray = groceryToDos.map(i => (i?.parentId|| ''))
            const newEventIdArray = groceryToDos.map(i => (i?.eventId|| ''))
            const newDurationArray = groceryToDos.map(i => (i?.duration|| -1))

            const {
              sortedParentIdArray,
              sortedIdArray,
              sortedNotesArray,
              sortedCompletedArray,
              sortedStartDateArray,
              sortedEndDateArray,
              sortedNextDayArray,
              sortedCompletedDateArray,
              sortedImportantArray,
              sortedDateArray,
              sortedEventArray,
              sortedScheduleIdArray,
              sortedSoftDeadlineArray,
              sortedHardDeadlineArray,
              sortedStatusArray,
              sortedEventIdArray,
              sortedDurationArray,
            } = sortTasksByParent(
                  newParentIdArray,
                  newIdArray,
                  newNotesArray,
                  newCompletedArray,
                  newStartDateArray,
                  newEndDateArray,
                  newNextDayArray,
                  newCompletedDateArray,
                  newImportantArray,
                  newDateArray,
                  newEventArray,
                  newScheduleIdArray,
                  newSoftDeadlineArray,
                  newHardDeadlineArray,
                  newStatusArray as ToDoStatus[],
                  newEventIdArray,
                  newDurationArray,
                )

            const sortedOrderArray = sortedNotesArray.map((_, inx) => (inx))


            const sortedByStatusSortedIdArray = sortByStatus(sortedIdArray, sortedStatusArray as ToDoStatus[])
            const sortedByStatusSortedNotesArray = sortByStatus(sortedNotesArray, sortedStatusArray as ToDoStatus[])
            const sortedByStatusSortedCompletedArray = sortByStatus(sortedCompletedArray, sortedStatusArray as ToDoStatus[])
            const sortedByStatusSortedStartDateArray = sortByStatus(sortedStartDateArray, sortedStatusArray as ToDoStatus[])
            const sortedByStatusSortedEndDateArray = sortByStatus(sortedEndDateArray, sortedStatusArray as ToDoStatus[])
            const sortedByStatusSortedCompletedDateArray = sortByStatus(sortedCompletedDateArray, sortedStatusArray as ToDoStatus[])
            const sortedByStatusSortedNextDayArray = sortByStatus(sortedNextDayArray, sortedStatusArray as ToDoStatus[])
            const sortedByStatusSortedImportantArray = sortByStatus(sortedImportantArray, sortedStatusArray as ToDoStatus[])
            const sortedByStatusSortedDateArray = sortByStatus(sortedDateArray, sortedStatusArray as ToDoStatus[])
            const sortedByStatusSortedEventArray = sortByStatus(sortedEventArray, sortedStatusArray as ToDoStatus[])
            const sortedByStatusSortedScheduleIdArray = sortByStatus(sortedScheduleIdArray, sortedStatusArray as ToDoStatus[])
            const sortedByStatusSortedSoftDeadlineArray = sortByStatus(sortedSoftDeadlineArray, sortedStatusArray as ToDoStatus[])
            const sortedByStatusSortedHardDeadlineArray = sortByStatus(sortedHardDeadlineArray, sortedStatusArray as ToDoStatus[])

            const sortedByStatusSortedStatusArray = sortByStatus(sortedStatusArray, sortedStatusArray as ToDoStatus[])
            const sortedByStatusSortedParentIdArray = sortByStatus(sortedParentIdArray, sortedStatusArray as ToDoStatus[])
            const sortedByStatusSortedOrderArray = sortByStatus(sortedOrderArray, sortedStatusArray as ToDoStatus[])

            const sortedByStatusSortedEventIdArray = sortByStatus(sortedEventIdArray, sortedStatusArray as ToDoStatus[])
            const sortedByStatusSortedDurationArray = sortByStatus(sortedDurationArray, sortedStatusArray as ToDoStatus[])


            setIdArray(sortedByStatusSortedIdArray)
            setNotesArray(sortedByStatusSortedNotesArray)
            setCompletedArray(sortedByStatusSortedCompletedArray)
            setStartDateArray(sortedByStatusSortedStartDateArray)
            setEndDateArray(sortedByStatusSortedEndDateArray)
            setCompletedDateArray(sortedByStatusSortedCompletedDateArray)
            setNextDayArray(sortedByStatusSortedNextDayArray)
            setImportantArray(sortedByStatusSortedImportantArray)
            setDateArray(sortedByStatusSortedDateArray)
            setEventArray(sortedByStatusSortedEventArray)
            setScheduleIdArray(sortedByStatusSortedScheduleIdArray)
            setSoftDeadlineArray(sortedByStatusSortedSoftDeadlineArray)
            setHardDeadlineArray(sortedByStatusSortedHardDeadlineArray)

            setIsTaskMenus(newIsTaskMenus)
            setStatusArray(sortedByStatusSortedStatusArray as ToDoStatus[])
            setParentIdArray(sortedByStatusSortedParentIdArray)
            setOrderArray(sortedByStatusSortedOrderArray)
            setEventIdArray(sortedByStatusSortedEventIdArray)
            setDurationArray(sortedByStatusSortedDurationArray)

            const {
              displayUIArray: sortedDisplayUIArray,
              dataIndexToDisplayArray: sortedDataIndexToDisplayArray,
            } = getDisplayUI(sortedByStatusSortedNotesArray, sortedByStatusSortedStatusArray as ToDoStatus[])
            const newHeightArray = sortedDisplayUIArray.map(() => 40)
            setHeightArray(newHeightArray)
            const promises = sortedByStatusSortedIdArray.map(async (id, inx) => {
              try {
                return updateTaskInStore(
                  TableName.GROCERY,
                  id,
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
                  sortedByStatusSortedStatusArray[inx],
                  undefined,
                  inx,
                )
              } catch(e) {
                
              }
            })
            await Promise.all(promises)

            setDisplayUIArray(sortedDisplayUIArray)
            setDataIndexToDisplayArray(sortedDataIndexToDisplayArray)
          }
        }
      })()
    }

  }, [taskType, localTaskType, disableTaskType, isUpdate, ...displayUIArray])

  useFocusEffect(
    useCallback(() => {

      if (((taskType && !disableTaskType) && (taskType === 'Grocery'))
      || (localTaskType === 'Grocery')) {

        if (((taskType && !disableTaskType) && ((taskType as taskType) !== localTaskType))) {
          setLocalTaskType(taskType)
        }

        (async () => {

          const { payload: { sub } } = (await Auth.currentSession()).getAccessToken()
          const users = await DataStore.query(User, c => c.sub('eq', sub))
          if (!(users?.[0]?.id)) {
            return
          }
          const [user] = users

          const groceryToDos = await DataStore.query(GroceryToDo, c => c.userId('eq', user.id))



          if (groceryToDos?.[0]?.id) {
            let isOrder = true
            for (let i = 0; i < groceryToDos.length; i++) {
              if (typeof (groceryToDos?.[i]?.order) !== 'number') {
                isOrder = false
              }
            }
            if (isOrder) {

              const oldOrderArray = groceryToDos.map((i) => (i?.order))

              const newIdArray = groceryToDos.map(i => ((i && i.id) || ''))
              const newNotesArray = groceryToDos.map(i => ((i && i.notes) || ''))
              const newCompletedArray = groceryToDos.map(i => ((i && i.completed) || false))
              const newStartDateArray = groceryToDos.map((i) => ((i?.startDate) || ''))
              const newEndDateArray = groceryToDos.map((i) => ((i?.endDate) || ''))
              const newCompletedDateArray = groceryToDos.map(i => ((i && i.completedDate) || ''))
              const newNextDayArray = groceryToDos.map(i => ((i?.startDate && dayjs(i.startDate).isTomorrow()) || false))
              const newImportantArray = groceryToDos.map(i => ((i && i.important) || false))
              const newDateArray = groceryToDos.map((i) => ((i && i.date) || ''))
              const newEventArray = groceryToDos.map(i => ((i && i.event) || false))
              const newScheduleIdArray = groceryToDos.map(i => ((i && i.scheduleId) || ''))
              const newSoftDeadlineArray = groceryToDos.map(i => ((i && i.softDeadline) || ''))
              const newHardDeadlineArray = groceryToDos.map(i => ((i && i.hardDeadline) || ''))

              const newIsTaskMenus = groceryToDos.map(() => false)


              const newStatusArray = groceryToDos.map(i => (i?.status || ToDoStatus.TODO))

              const newParentIdArray = groceryToDos.map(i => (i?.parentId|| ''))
              const newEventIdArray = groceryToDos.map(i => (i?.eventId|| ''))
              const newDurationArray = groceryToDos.map(i => (i?.duration || -1))

              const sortedByOrderIdArray = sortByOrder(newIdArray, oldOrderArray)

              const sortedByOrderNotesArray = sortByOrder(newNotesArray, oldOrderArray)

              const sortedByOrderCompletedArray = sortByOrder(newCompletedArray, oldOrderArray)

              const sortedByOrderStartDateArray = sortByOrder(newStartDateArray, oldOrderArray)

              const sortedByOrderEndDateArray = sortByOrder(newEndDateArray, oldOrderArray)

              const sortedByOrderCompletedDateArray = sortByOrder(newCompletedDateArray, oldOrderArray)

              const sortedByOrderNextDayArray = sortByOrder(newNextDayArray, oldOrderArray)

              const sortedByOrderImportantArray = sortByOrder(newImportantArray, oldOrderArray)

              const sortedByOrderDateArray = sortByOrder(newDateArray, oldOrderArray)

              const sortedByOrderEventArray = sortByOrder(newEventArray, oldOrderArray)

              const sortedByOrderScheduleIdArray = sortByOrder(newScheduleIdArray, oldOrderArray)

              const sortedByOrderSoftDeadlineArray = sortByOrder(newSoftDeadlineArray, oldOrderArray)
              const sortedByOrderHardDeadlineArray = sortByOrder(newHardDeadlineArray, oldOrderArray)


              const sortedByOrderStatusArray = sortByOrder(newStatusArray, oldOrderArray)

              const sortedByOrderParentIdArray = sortByOrder(newParentIdArray, oldOrderArray)
              const sortedByOrderEventIdArray = sortByOrder(newEventIdArray, oldOrderArray)
              const sortedByOrderDurationArray = sortByOrder(newDurationArray, oldOrderArray)

              const sortedByStatusSortedByOrderIdArray = sortByStatus(sortedByOrderIdArray, sortedByOrderStatusArray as ToDoStatus[])
              const sortedByStatusSortedByOrderNotesArray = sortByStatus(sortedByOrderNotesArray, sortedByOrderStatusArray as ToDoStatus[])
              const sortedByStatusSortedByOrderCompletedArray = sortByStatus(sortedByOrderCompletedArray, sortedByOrderStatusArray as ToDoStatus[])
              const sortedByStatusSortedByOrderStartDateArray = sortByStatus(sortedByOrderStartDateArray, sortedByOrderStatusArray as ToDoStatus[])
              const sortedByStatusSortedByOrderEndDateArray = sortByStatus(sortedByOrderEndDateArray, sortedByOrderStatusArray as ToDoStatus[])
              const sortedByStatusSortedByOrderCompletedDateArray = sortByStatus(sortedByOrderCompletedDateArray, sortedByOrderStatusArray as ToDoStatus[])
              const sortedByStatusSortedByOrderNextDayArray = sortByStatus(sortedByOrderNextDayArray, sortedByOrderStatusArray as ToDoStatus[])
              const sortedByStatusSortedByOrderImportantArray = sortByStatus(sortedByOrderImportantArray, sortedByOrderStatusArray as ToDoStatus[])
              const sortedByStatusSortedByOrderDateArray = sortByStatus(sortedByOrderDateArray, sortedByOrderStatusArray as ToDoStatus[])
              const sortedByStatusSortedByOrderEventArray = sortByStatus(sortedByOrderEventArray, sortedByOrderStatusArray as ToDoStatus[])
              const sortedByStatusSortedByOrderScheduleIdArray = sortByStatus(sortedByOrderScheduleIdArray, sortedByOrderStatusArray as ToDoStatus[])
              const sortedByStatusSortedByOrderSoftDeadlineArray = sortByStatus(sortedByOrderSoftDeadlineArray, sortedByOrderStatusArray as ToDoStatus[])
              const sortedByStatusSortedByOrderHardDeadlineArray = sortByStatus(sortedByOrderHardDeadlineArray, sortedByOrderStatusArray as ToDoStatus[])

              const sortedByStatusSortedByOrderStatusArray = sortByStatus(sortedByOrderStatusArray, sortedByOrderStatusArray as ToDoStatus[])
              const sortedByStatusSortedByOrderParentIdArray = sortByStatus(sortedByOrderParentIdArray, sortedByOrderStatusArray as ToDoStatus[])

              const sortedByStatusSortedByOrderEventIdArray = sortByStatus(sortedByOrderEventIdArray, sortedByOrderStatusArray as ToDoStatus[])
              const sortedByStatusSortedByOrderDurationArray = sortByStatus(sortedByOrderDurationArray, sortedByOrderStatusArray as ToDoStatus[])

              setIdArray(sortedByStatusSortedByOrderIdArray)
              setNotesArray(sortedByStatusSortedByOrderNotesArray)
              setCompletedArray(sortedByStatusSortedByOrderCompletedArray)
              setStartDateArray(sortedByStatusSortedByOrderStartDateArray)
              setEndDateArray(sortedByStatusSortedByOrderEndDateArray)
              setCompletedDateArray(sortedByStatusSortedByOrderCompletedDateArray)
              setNextDayArray(sortedByStatusSortedByOrderNextDayArray)
              setImportantArray(sortedByStatusSortedByOrderImportantArray)
              setDateArray(sortedByStatusSortedByOrderDateArray)
              setEventArray(sortedByStatusSortedByOrderEventArray)
              setScheduleIdArray(sortedByStatusSortedByOrderScheduleIdArray)
              setSoftDeadlineArray(sortedByStatusSortedByOrderSoftDeadlineArray)
              setHardDeadlineArray(sortedByStatusSortedByOrderHardDeadlineArray)

              setIsTaskMenus(newIsTaskMenus)
              setStatusArray(sortedByStatusSortedByOrderStatusArray as ToDoStatus[])
              setParentIdArray(sortedByStatusSortedByOrderParentIdArray)

              setOrderArray(sortedByStatusSortedByOrderNotesArray.map((_, inx) => inx))
              setEventIdArray(sortedByStatusSortedByOrderEventIdArray)
              setDurationArray(sortedByStatusSortedByOrderDurationArray)

              const {
                displayUIArray: sortedDisplayUIArray,
                dataIndexToDisplayArray: sortedDataIndexToDisplayArray,
              } = getDisplayUI(sortedByStatusSortedByOrderNotesArray, sortedByStatusSortedByOrderStatusArray as ToDoStatus[])
              const newHeightArray = sortedDisplayUIArray.map(() => 40)
              setHeightArray(newHeightArray)
              setDisplayUIArray(sortedDisplayUIArray)
              setDataIndexToDisplayArray(sortedDataIndexToDisplayArray)
            } else {
              const newIdArray = groceryToDos.map(i => ((i && i.id) || ''))
              const newNotesArray = groceryToDos.map(i => ((i && i.notes) || ''))
              const newCompletedArray = groceryToDos.map(i => ((i && i.completed) || false))
              const newStartDateArray = groceryToDos.map((i) => ((i?.startDate) || ''))
              const newEndDateArray = groceryToDos.map((i) => ((i?.endDate) || ''))
              const newCompletedDateArray = groceryToDos.map(i => ((i && i.completedDate) || ''))
              const newNextDayArray = groceryToDos.map(i => ((i?.startDate && dayjs(i.startDate).isTomorrow()) || false))
              const newImportantArray = groceryToDos.map(i => ((i && i.important) || false))
              const newDateArray = groceryToDos.map((i) => ((i && i.date) || ''))
              const newEventArray = groceryToDos.map(i => ((i && i.event) || false))
              const newScheduleIdArray = groceryToDos.map(i => ((i && i.scheduleId) || ''))
              const newSoftDeadlineArray = groceryToDos.map(i => ((i && i.softDeadline) || ''))
              const newHardDeadlineArray = groceryToDos.map(i => ((i && i.hardDeadline) || ''))

              const newIsTaskMenus = groceryToDos.map(() => false)


              const newStatusArray = groceryToDos.map(i => (i?.status || ToDoStatus.TODO))

              const newParentIdArray = groceryToDos.map(i => (i?.parentId|| ''))
              const newEventIdArray = groceryToDos.map(i => (i?.eventId || ''))
              const newDurationArray = groceryToDos.map(i => (i?.duration || -1))

              const {
                sortedParentIdArray,
                sortedIdArray,
                sortedNotesArray,
                sortedCompletedArray,
                sortedStartDateArray,
                sortedEndDateArray,
                sortedNextDayArray,
                sortedCompletedDateArray,
                sortedImportantArray,
                sortedDateArray,
                sortedEventArray,
                sortedScheduleIdArray,
                sortedSoftDeadlineArray,
                sortedHardDeadlineArray,
                sortedStatusArray,
                sortedEventIdArray,
                sortedDurationArray,
              } = sortTasksByParent(
                    newParentIdArray,
                    newIdArray,
                    newNotesArray,
                    newCompletedArray,
                    newStartDateArray,
                    newEndDateArray,
                    newNextDayArray,
                    newCompletedDateArray,
                    newImportantArray,
                    newDateArray,
                    newEventArray,
                    newScheduleIdArray,
                    newSoftDeadlineArray,
                    newHardDeadlineArray,
                    newStatusArray as ToDoStatus[],
                    newEventIdArray,
                    newDurationArray,
                  )

              const sortedByStatusSortedIdArray = sortByStatus(sortedIdArray, sortedStatusArray as ToDoStatus[])
              const sortedByStatusSortedNotesArray = sortByStatus(sortedNotesArray, sortedStatusArray as ToDoStatus[])
              const sortedByStatusSortedCompletedArray = sortByStatus(sortedCompletedArray, sortedStatusArray as ToDoStatus[])
              const sortedByStatusSortedStartDateArray = sortByStatus(sortedStartDateArray, sortedStatusArray as ToDoStatus[])
              const sortedByStatusSortedEndDateArray = sortByStatus(sortedEndDateArray, sortedStatusArray as ToDoStatus[])
              const sortedByStatusSortedCompletedDateArray = sortByStatus(sortedCompletedDateArray, sortedStatusArray as ToDoStatus[])
              const sortedByStatusSortedNextDayArray = sortByStatus(sortedNextDayArray, sortedStatusArray as ToDoStatus[])
              const sortedByStatusSortedImportantArray = sortByStatus(sortedImportantArray, sortedStatusArray as ToDoStatus[])
              const sortedByStatusSortedDateArray = sortByStatus(sortedDateArray, sortedStatusArray as ToDoStatus[])
              const sortedByStatusSortedEventArray = sortByStatus(sortedEventArray, sortedStatusArray as ToDoStatus[])
              const sortedByStatusSortedScheduleIdArray = sortByStatus(sortedScheduleIdArray, sortedStatusArray as ToDoStatus[])
              const sortedByStatusSortedSoftDeadlineArray = sortByStatus(sortedSoftDeadlineArray, sortedStatusArray as ToDoStatus[])
              const sortedByStatusSortedHardDeadlineArray = sortByStatus(sortedHardDeadlineArray, sortedStatusArray as ToDoStatus[])

              const sortedByStatusSortedStatusArray = sortByStatus(sortedStatusArray, sortedStatusArray as ToDoStatus[])
              const sortedByStatusSortedParentIdArray = sortByStatus(sortedParentIdArray, sortedStatusArray as ToDoStatus[])

              const sortedByStatusSortedEventIdArray = sortByStatus(sortedEventIdArray, sortedStatusArray as ToDoStatus[])
              const sortedByStatusSortedDurationArray = sortByStatus(sortedDurationArray, sortedStatusArray as ToDoStatus[])

              setIdArray(sortedByStatusSortedIdArray)
              setNotesArray(sortedByStatusSortedNotesArray)
              setCompletedArray(sortedByStatusSortedCompletedArray)
              setStartDateArray(sortedByStatusSortedStartDateArray)
              setEndDateArray(sortedByStatusSortedEndDateArray)
              setCompletedDateArray(sortedByStatusSortedCompletedDateArray)
              setNextDayArray(sortedByStatusSortedNextDayArray)
              setImportantArray(sortedByStatusSortedImportantArray)
              setDateArray(sortedByStatusSortedDateArray)
              setEventArray(sortedByStatusSortedEventArray)
              setScheduleIdArray(sortedByStatusSortedScheduleIdArray)
              setSoftDeadlineArray(sortedByStatusSortedSoftDeadlineArray)
              setHardDeadlineArray(sortedByStatusSortedHardDeadlineArray)

              setIsTaskMenus(newIsTaskMenus)
              setStatusArray(sortedByStatusSortedStatusArray as ToDoStatus[])
              setParentIdArray(sortedByStatusSortedParentIdArray)
              setOrderArray(sortedByStatusSortedNotesArray.map((_, inx) => inx))
              setEventIdArray(sortedByStatusSortedEventIdArray)
              setDurationArray(sortedByStatusSortedDurationArray)

              const {
                displayUIArray: sortedDisplayUIArray,
                dataIndexToDisplayArray: sortedDataIndexToDisplayArray,
              } = getDisplayUI(sortedByStatusSortedNotesArray, sortedByStatusSortedStatusArray as ToDoStatus[])
              const newHeightArray = sortedDisplayUIArray.map(() => 40)
              setHeightArray(newHeightArray)
              const promises = sortedByStatusSortedIdArray.map(async (id, inx) => {
                try {
                  return updateTaskInStore(
                    TableName.GROCERY,
                    id,
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
                    sortedByStatusSortedStatusArray[inx],
                    undefined,
                    inx,
                  )
                } catch(e) {
                  
                }
              })
              await Promise.all(promises)

              setDisplayUIArray(sortedDisplayUIArray)
              setDataIndexToDisplayArray(sortedDataIndexToDisplayArray)
            }
          } else {
            setIdArray([])
            setNotesArray([])
            setCompletedArray([])
            setStartDateArray([])
            setEndDateArray([])
            setCompletedDateArray([])
            setNextDayArray([])
            setImportantArray([])
            setDateArray([])
            setEventArray([])
            setScheduleIdArray([])
            setSoftDeadlineArray([])
            setHardDeadlineArray([])
            setIsTaskMenus([])
            setStatusArray([])
            setParentIdArray([])
            setOrderArray([])
            setHeightArray([])
            setDisplayUIArray([])
            setDataIndexToDisplayArray([])
            setEventIdArray([])
            setDurationArray([])
          }
        })()
      }

    }, [taskType, localTaskType, disableTaskType, isUpdate,  ...displayUIArray])
  )

  useEffect(() => {
    const getUserProfile = async () => {
      try {
        if (!(profileIdEl?.current)) {
          
          return
        }

        const profileData = await API.
          graphql({
            query: GetUserProfile,
            variables:{
              id: profileIdEl.current
            } as GetUserProfileQueryVariables
          }) as GraphQLResult<GetUserProfileQuery>

        const profile = profileData?.data?.getUserProfile

        profileIdEl.current = profile.id
        setProfileId(profile?.id)
        usernameEl.current = profile.username
        avatarEl.current = profile.avatar
        userIdEl.current = profile.userId
        setUserId(profile.userId)
        realm.write(() => {
          const userProfile = realm.create<UserProfileRealm>('UserProfile', {
            id: profileIdEl.current,
            avatar: profile.avatar,
            username: profile.username,
            email: profile.email,
            followerCount: profile.followerCount,
            followingCount: profile.followingCount,
            postCount: profile.postCount,
            bio: profile.bio,
            userId: profile.userId,
            sub: profile.sub,
            pointId: profile.pointId,
          })

          
        })

        const original = await DataStore.query(User, profile?.userId)

        const updatedUser = await DataStore.save(
          User.copyOf(
            original, updated => {
              updated.profileId = profile?.id
            }
          )
        )

        
      } catch(e) {
        
      }
    }
    const getUserProfileRealm = async () => {
      const userProfiles = realm.objects<UserProfileRealm>('UserProfile')
      if (!(userProfiles?.[0]?.id)) {
        return getUserProfile()
      } else {
        const [profile] = userProfiles
        if (profile?.id) {
          profileIdEl.current = profile?.id
          setProfileId(profile?.id)
        }

        if (profile?.username) {
          usernameEl.current = profile?.username
        }

        if (profile?.avatar) {
          avatarEl.current = profile?.avatar
        }

        if (profile?.userId) {

          userIdEl.current = profile?.userId
          setUserId(profile?.userId)

          const original = await DataStore.query(User, profile?.userId)

          const updatedUser = await DataStore.save(
            User.copyOf(
              original, updated => {
                updated.profileId = profile?.id
              }
            )
          )

          
        }
      }
    }
    const getProfileId = async (userId: string) => {
      try {
        if (!userId) {
          return
        }
        const userData = await DataStore.query(User, userId)

        

        if ((userData?.profileId !== 'null') && userData?.profileId) {
          const profileIdData = userData.profileId

          if (profileIdData) {
            setProfileId(profileIdData)
            profileIdEl.current = profileIdData

          }
        } else {
          await getUserProfileRealm()
        }
      } catch (e) {
          
      }
    }
    (async () => {
      if (userIdEl?.current) {
        return getProfileId(userIdEl.current)
      }
    })()

  }, [userId])

  useFocusEffect(
    useCallback(() => {
      const getUserProfile = async () => {
        try {
          if (!(profileIdEl?.current)) {
            
            return
          }

          const profileData = await API.
            graphql({
              query: GetUserProfile,
              variables:{
                id: profileIdEl.current
              } as GetUserProfileQueryVariables
            }) as GraphQLResult<GetUserProfileQuery>

          const profile = profileData?.data?.getUserProfile

          profileIdEl.current = profile.id
          setProfileId(profile?.id)
          usernameEl.current = profile.username
          avatarEl.current = profile.avatar
          userIdEl.current = profile.userId
          setUserId(profile.userId)
          realm.write(() => {
            const userProfile = realm.create<UserProfileRealm>('UserProfile', {
              id: profileIdEl.current,
              avatar: profile.avatar,
              username: profile.username,
              email: profile.email,
              followerCount: profile.followerCount,
              followingCount: profile.followingCount,
              postCount: profile.postCount,
              bio: profile.bio,
              userId: profile.userId,
              sub: profile.sub,
              pointId: profile.pointId,
            })

            
          })

          const original = await DataStore.query(User, profile?.userId)

          const updatedUser = await DataStore.save(
            User.copyOf(
              original, updated => {
                updated.profileId = profile?.id
              }
            )
          )

          
        } catch(e) {
          
        }
      }
      const getUserProfileRealm = async () => {
        const userProfiles = realm.objects<UserProfileRealm>('UserProfile')
        if (!(userProfiles?.[0]?.id)) {
          return getUserProfile()
        } else {
          const [profile] = userProfiles
          if (profile?.id) {
            profileIdEl.current = profile?.id
            setProfileId(profile?.id)
          }

          if (profile?.username) {
            usernameEl.current = profile?.username
          }

          if (profile?.avatar) {
            avatarEl.current = profile?.avatar
          }

          if (profile?.userId) {

            userIdEl.current = profile?.userId
            setUserId(profile?.userId)

            const original = await DataStore.query(User, profile?.userId)

            const updatedUser = await DataStore.save(
              User.copyOf(
                original, updated => {
                  updated.profileId = profile?.id
                }
              )
            )

            
          }
        }
      }
      const getProfileId = async (userId: string) => {
        try {
          if (!userId) {
            return
          }
          const userData = await DataStore.query(User, userId)

          

          if ((userData?.profileId !== 'null') && userData?.profileId) {
            const profileIdData = userData.profileId

            if (profileIdData) {
              setProfileId(profileIdData)
              profileIdEl.current = profileIdData

            }
          } else {
            await getUserProfileRealm()
          }
        } catch (e) {
            
        }
      }
      (async () => {
        if (userIdEl?.current) {
          return getProfileId(userIdEl.current)
        }
      })()

    }, [userId])
  )

  useEffect(() => {
    const getUserProfile = async () => {
      try {
        if (!(profileIdEl?.current)) {
          
          return
        }

        const profileData = await API.
          graphql({
            query: GetUserProfile,
            variables:{
              id: profileIdEl.current
            } as GetUserProfileQueryVariables
          }) as GraphQLResult<GetUserProfileQuery>

        const profile = profileData?.data?.getUserProfile

        profileIdEl.current = profile.id
        usernameEl.current = profile.username
        avatarEl.current = profile.avatar
        userIdEl.current = profile.userId
        setUserId(profile?.userId)

        realm.write(() => {
          const userProfile = realm.create<UserProfileRealm>('UserProfile', {
            id: profileIdEl.current,
            avatar: profile.avatar,
            username: profile.username,
            email: profile.email,
            followerCount: profile.followerCount,
            followingCount: profile.followingCount,
            postCount: profile.postCount,
            bio: profile.bio,
            userId: profile.userId,
            sub: profile.sub,
            pointId: profile.pointId,
          })

          
        })

      } catch(e) {
        
      }
    }
    (async () => {
      const userProfiles = realm.objects<UserProfileRealm>('UserProfile')
      if (!(userProfiles?.[0]?.id)) {
        return getUserProfile()
      } else {
        const [profile] = userProfiles
        profileIdEl.current = profile?.id
        usernameEl.current = profile?.username
        avatarEl.current = profile?.avatar
        userIdEl.current = profile?.userId
        setUserId(profile?.userId)
      }
    })()
  }, [profileId])

  useFocusEffect(
    useCallback(() => {
      const getUserProfile = async () => {
        try {
          if (!(profileIdEl?.current)) {
            
            return
          }

          const profileData = await API.
            graphql({
              query: GetUserProfile,
              variables:{
                id: profileIdEl.current
              } as GetUserProfileQueryVariables
            }) as GraphQLResult<GetUserProfileQuery>

          const profile = profileData?.data?.getUserProfile

          profileIdEl.current = profile.id
          usernameEl.current = profile.username
          avatarEl.current = profile.avatar
          userIdEl.current = profile.userId
          setUserId(profile?.userId)

          realm.write(() => {
            const userProfile = realm.create<UserProfileRealm>('UserProfile', {
              id: profileIdEl.current,
              avatar: profile.avatar,
              username: profile.username,
              email: profile.email,
              followerCount: profile.followerCount,
              followingCount: profile.followingCount,
              postCount: profile.postCount,
              bio: profile.bio,
              userId: profile.userId,
              sub: profile.sub,
              pointId: profile.pointId,
            })

            
          })

        } catch(e) {
          
        }
      }
      (async () => {
        const userProfiles = realm.objects<UserProfileRealm>('UserProfile')
        if (!(userProfiles?.[0]?.id)) {
          return getUserProfile()
        } else {
          const [profile] = userProfiles
          profileIdEl.current = profile?.id
          usernameEl.current = profile?.username
          avatarEl.current = profile?.avatar
          userIdEl.current = profile?.userId
          setUserId(profile?.userId)
        }
      })()
    }, [profileId])
  )

  useEffect(() => {
    (async () => {
      try {

        if (!(userIdEl?.current)) {
          return
        }

        const schedules = await DataStore.query(
          ScheduleToDo,
          c => c
            .userId('eq', `${userIdEl.current}`)
            .status('eq', Status.ACTIVE),
          {
            sort: s => s.date(SortDirection.DESCENDING),
          },
        )


        if (schedules?.length > 0) {
           await Promise.all(schedules.map(async (oldSchedule) => {
             if (oldSchedule?.endDate
               && dayjs().isAfter(oldSchedule?.endDate)) {

                 return DataStore.save(
                   ScheduleToDo.copyOf(
                     oldSchedule, updated => {
                       updated.status = Status.ENDED
                     }
                   )
                 )
             }
             return null
           }))


        }
      } catch(e) {
      }

    })()
  }, [userId])

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {

          if (!(userIdEl?.current)) {
            return
          }

          const schedules = await DataStore.query(
            ScheduleToDo,
            c => c
              .userId('eq', `${userIdEl.current}`)
              .status('eq', Status.ACTIVE),
            {
              sort: s => s.date(SortDirection.DESCENDING),
            },
          )


          if (schedules?.length > 0) {
             await Promise.all(schedules.map(async (oldSchedule) => {
               if (oldSchedule?.endDate
                 && dayjs().isAfter(oldSchedule?.endDate)) {

                   return DataStore.save(
                     ScheduleToDo.copyOf(
                       oldSchedule, updated => {
                         updated.status = Status.ENDED
                       }
                     )
                   )
               }
               return null
             }))


          }
        } catch(e) {
        }

      })()
    }, [userId])
  )

  useEffect(() => {
    const deleteTaskLocally = async (
      index: number,
    ) => {
      try {

         const taskId = idArray[index]

         if (!taskId) {
           return
         }

        await deleteEventForTask(taskId, localTaskType, client, sub)

         switch(localTaskType) {
           case 'Daily':
            await deleteDailyTaskInStore(index)
            break
           case 'Weekly':
            await deleteWeeklyTaskInStore(index)
            break
           case 'Master':
            await deleteMasterTaskInStore(index)
            break
          case 'Grocery':
            await deleteGroceryTaskInStore(index)
            break
         }
      } catch(e) {
        
      }
    }

    const index = completedDateArray?.findIndex(i => (i?.length > 0))
    if (index > -1) {
      (async () => {
        completedDateArray.forEach(async(taskCompletedDate, index) => {

          if (!taskCompletedDate) {
            return
          }

          if (scheduleIdArray?.[index]) {

            switch(localTaskType) {
              case 'Daily':
                await updateDailyTaskToStore(
                  index,
                  undefined,
                  dayjs().isAfter(dayjs(taskCompletedDate).add(24, 'h')) ? false : true,
                  undefined,
                  undefined,
                  dayjs().isAfter(dayjs(taskCompletedDate).add(24, 'h')) ? '' : dayjs().format(),
                )
              break

              case 'Weekly':
                await updateWeeklyTaskToStore(
                  index,
                  undefined,
                  dayjs().isAfter(dayjs(taskCompletedDate).add(24, 'h')) ? false : true,
                  undefined,
                  undefined,
                  dayjs().isAfter(dayjs(taskCompletedDate).add(24, 'h')) ? '' : dayjs().format(),
                )
              break
              case 'Master':
                await updateMasterTaskToStore(
                  index,
                  undefined,
                  dayjs().isAfter(dayjs(taskCompletedDate).add(24, 'h')) ? false : true,
                  undefined,
                  undefined,
                  dayjs().isAfter(dayjs(taskCompletedDate).add(24, 'h')) ? '' : dayjs().format(),
                )
              break
              case 'Grocery':
                await updateGroceryTaskToStore(
                  index,
                  undefined,
                  dayjs().isAfter(dayjs(taskCompletedDate).add(24, 'h')) ? false : true,
                  undefined,
                  undefined,
                  dayjs().isAfter(dayjs(taskCompletedDate).add(24, 'h')) ? '' : dayjs().format(),
                  undefined,
                  undefined,
                  undefined,
                  undefined,
                  undefined,
                  undefined,
                  undefined,
                )
              break
            }

            const newDate = dayjs().format()

            if (dayjs().isAfter(dayjs(taskCompletedDate).add(24, 'h'))) {
 
              updateDataArray(newDate, dateArray, setDateArray, index)
              updateDataArray(dayjs().isAfter(dayjs(taskCompletedDate).add(24, 'h')) ? false : true, completedArray, setCompletedArray, index)
              return updateDataArray(dayjs(taskCompletedDate).add(24, 'h').isAfter(dayjs()) ? '' : newDate, completedDateArray, setCompletedDateArray, index)

            }
          }

          if (
            !(scheduleIdArray?.[index])
            && dayjs().isAfter(dayjs(taskCompletedDate).add(24, 'h'))
          ) {
            return deleteTaskLocally(index)
          }
        })
      })()
    }
  }, [completedDateArray])

  useFocusEffect(
    useCallback(() => {
      const deleteTaskLocally = async (
        index: number,
      ) => {
        try {

           const taskId = idArray[index]

           if (!taskId) {
             return
           }

          await deleteEventForTask(taskId, localTaskType, client, sub)

           switch(localTaskType) {
             case 'Daily':
              await deleteDailyTaskInStore(index)
              break
             case 'Weekly':
              await deleteWeeklyTaskInStore(index)
              break
             case 'Master':
              await deleteMasterTaskInStore(index)
              break
            case 'Grocery':
              await deleteGroceryTaskInStore(index)
              break
           }
        } catch(e) {
        }
      }
      const index = completedDateArray?.findIndex(i => (i?.length > 0))
      if (index > -1) {
        (async () => {
          completedDateArray.forEach(async(taskCompletedDate, index) => {

            if (!taskCompletedDate) {
              return
            }

            if ((endDateArray?.[index])
              && (scheduleIdArray?.[index])
              && (dayjs(taskCompletedDate)
              .isAfter(dayjs(endDateArray?.[index])
              .add(24, 'h')))) {

              return deleteTaskLocally(index)
            }

            if (scheduleIdArray?.[index]) {

              switch(localTaskType) {
                case 'Daily':
                  await updateDailyTaskToStore(
                    index,
                    undefined,
                    dayjs().isAfter(dayjs(taskCompletedDate).add(24, 'h')) ? false : true,
                    undefined,
                    undefined,
                    dayjs().isAfter(dayjs(taskCompletedDate).add(24, 'h')) ? '' : dayjs().format(),
                  )
                break

                case 'Weekly':
                  await updateWeeklyTaskToStore(
                    index,
                    undefined,
                    dayjs().isAfter(dayjs(taskCompletedDate).add(24, 'h')) ? false : true,
                    undefined,
                    undefined,
                    dayjs().isAfter(dayjs(taskCompletedDate).add(24, 'h')) ? '' : dayjs().format(),
                  )
                break
                case 'Master':
                  await updateMasterTaskToStore(
                    index,
                    undefined,
                    dayjs().isAfter(dayjs(taskCompletedDate).add(24, 'h')) ? false : true,
                    undefined,
                    undefined,
                    dayjs().isAfter(dayjs(taskCompletedDate).add(24, 'h')) ? '' : dayjs().format(),
                  )
                break
                case 'Grocery':
                  await updateGroceryTaskToStore(
                    index,
                    undefined,
                    dayjs().isAfter(dayjs(taskCompletedDate).add(24, 'h')) ? false : true,
                    undefined,
                    undefined,
                    dayjs().isAfter(dayjs(taskCompletedDate).add(24, 'h')) ? '' : dayjs().format(),
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                  )
                break
              }

              const newDate = dayjs().format()

              if (dayjs().isAfter(dayjs(taskCompletedDate).add(24, 'h'))) {
                updateDataArray(newDate, dateArray, setDateArray, index)
                updateDataArray(dayjs().isAfter(dayjs(taskCompletedDate).add(24, 'h')) ? false : true, completedArray, setCompletedArray, index)
                return updateDataArray(dayjs(taskCompletedDate).add(24, 'h').isAfter(dayjs()) ? '' : newDate, completedDateArray, setCompletedDateArray, index)

              }
            }

            if (
              !(scheduleIdArray?.[index])
              && dayjs().isAfter(dayjs(taskCompletedDate).add(24, 'h'))
            ) {
              return deleteTaskLocally(index)
            }
          })
        })()
      }
    }, [completedDateArray])
  )

  useEffect(() => {
    getOrRequestCalendar(calendarEventIdEl)
  }, [])


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


      if (idArray?.[0]) {
        const index = statusArray.lastIndexOf(ToDoStatus.TODO)
        
        const newIdArray = addToDataArrayAfterIndex(newDailyToDo.id, idArray, false, setIdArray, index)
        const newNotesArray = addToDataArrayAfterIndex(newDailyToDo.notes || '', notesArray, false, setNotesArray, index)
        addToDataArrayAfterIndex(newDailyToDo.completed || false, completedArray, false, setCompletedArray, index)
        addToDataArrayAfterIndex(newDailyToDo.startDate || '', startDateArray, false, setStartDateArray, index)
        addToDataArrayAfterIndex(newDailyToDo.endDate || '', endDateArray, false, setEndDateArray, index)
        addToDataArrayAfterIndex(newDailyToDo.completedDate || '', completedDateArray, false, setCompletedDateArray, index)
        addToDataArrayAfterIndex(newDailyToDo.nextDay || false, nextDayArray, false, setNextDayArray, index)
        addToDataArrayAfterIndex(newDailyToDo.important || false, importantArray, false, setImportantArray, index)
        addToDataArrayAfterIndex(newDailyToDo.date || '', dateArray, false, setDateArray, index)
        addToDataArrayAfterIndex(newDailyToDo.event || false, eventArray, false, setEventArray, index)
        addToDataArrayAfterIndex(newDailyToDo.scheduleId || '', scheduleIdArray, false, setScheduleIdArray, index)
        addToDataArrayAfterIndex(newDailyToDo.softDeadline || '', softDeadlineArray, false, setSoftDeadlineArray, index)
        addToDataArrayAfterIndex(newDailyToDo.hardDeadline || '', hardDeadlineArray, false, setHardDeadlineArray, index)
        const newStatusArray = addToDataArrayAfterIndex(newDailyToDo.status as ToDoStatus || ToDoStatus.TODO, statusArray, false,  setStatusArray, index)
        addToDataArrayAfterIndex(newDailyToDo.parentId || '', parentIdArray, false, setParentIdArray, index)
        addToDataArrayAfterIndex(newDailyToDo.eventId || '', eventIdArray, false, setEventIdArray, index)
        addToDataArrayAfterIndex(newDailyToDo.duration || -1, durationArray, false, setDurationArray, index)

        const newOrderArray = addToOrderArrayAfterIndexWithNewOrder(orderArray, false, setOrderArray, index)
        const {
          displayUIArray: sortedDisplayUIArray,
          dataIndexToDisplayArray: sortedDataIndexToDisplayArray,
        } = getDisplayUI(newNotesArray, newStatusArray as ToDoStatus[])

        setDisplayUIArray(sortedDisplayUIArray)
        setDataIndexToDisplayArray(sortedDataIndexToDisplayArray)
        const promises = newOrderArray.map(async (i, inx) => {
          try {
            return updateTaskInStore(
              TableName.DAILY,
              newIdArray[inx],
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
              i,
            )
          } catch(e) {
            
          }
        })
        await Promise.all(promises)
      } else {

        const newIdArray = addToDataArrayAfterIndex(newDailyToDo.id, idArray, true, setIdArray)
        const newNotesArray = addToDataArrayAfterIndex(newDailyToDo.notes || '', notesArray, true, setNotesArray)
        addToDataArrayAfterIndex(newDailyToDo.completed || false, completedArray, true, setCompletedArray)
        addToDataArrayAfterIndex(newDailyToDo.startDate || '', startDateArray, true, setStartDateArray)
        addToDataArrayAfterIndex(newDailyToDo.endDate || '', endDateArray, true, setEndDateArray)
        addToDataArrayAfterIndex(newDailyToDo.completedDate || '', completedDateArray, true, setCompletedDateArray)
        addToDataArrayAfterIndex(newDailyToDo.nextDay || false, nextDayArray, true, setNextDayArray)
        addToDataArrayAfterIndex(newDailyToDo.important || false, importantArray, true, setImportantArray)
        addToDataArrayAfterIndex(newDailyToDo.date || '', dateArray, true, setDateArray)
        addToDataArrayAfterIndex(newDailyToDo.event || false, eventArray, true, setEventArray)
        addToDataArrayAfterIndex(newDailyToDo.scheduleId || '', scheduleIdArray, true, setScheduleIdArray)
        addToDataArrayAfterIndex(newDailyToDo.softDeadline || '', softDeadlineArray, true, setSoftDeadlineArray)
        addToDataArrayAfterIndex(newDailyToDo.hardDeadline || '', hardDeadlineArray, true, setHardDeadlineArray)
        addToDataArrayAfterIndex(newDailyToDo.eventId || '', eventIdArray, true, setEventIdArray)
        addToDataArrayAfterIndex(newDailyToDo.duration || -1, durationArray, true, setDurationArray)

        const newStatusArray = addToDataArrayAfterIndex(status || ToDoStatus.TODO, statusArray, true,  setStatusArray)
        addToDataArrayAfterIndex(parentId || '', parentIdArray, true, setParentIdArray)
        const newOrderArray = addToOrderArrayAfterIndexWithNewOrder(orderArray, true, setOrderArray)
        const {
          displayUIArray: sortedDisplayUIArray,
          dataIndexToDisplayArray: sortedDataIndexToDisplayArray,
        } = getDisplayUI(newNotesArray, newStatusArray as ToDoStatus[])

        setDisplayUIArray(sortedDisplayUIArray)
        setDataIndexToDisplayArray(sortedDataIndexToDisplayArray)
        const promises = newOrderArray.map(async (i, inx) => {
          try {
            return updateTaskInStore(
              TableName.DAILY,
              newIdArray[inx],
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
              i
            )
          } catch(e) {
            
          }
        })
        await Promise.all(promises)
      }

      return newDailyToDo.id

    } catch(e) {
      
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

      if (idArray?.[0]) {
        const index = statusArray.lastIndexOf(ToDoStatus.TODO)
        const newIdArray = addToDataArrayAfterIndex(newWeeklyToDo.id, idArray, false, setIdArray, index)
        const newNotesArray = addToDataArrayAfterIndex(newWeeklyToDo.notes || '', notesArray, false, setNotesArray, index)
        addToDataArrayAfterIndex(newWeeklyToDo.completed || false, completedArray, false, setCompletedArray, index)
        addToDataArrayAfterIndex(newWeeklyToDo.startDate || '', startDateArray, false, setStartDateArray, index)
        addToDataArrayAfterIndex(newWeeklyToDo.endDate || '', endDateArray, false, setEndDateArray, index)
        addToDataArrayAfterIndex(newWeeklyToDo.completedDate || '', completedDateArray, false, setCompletedDateArray, index)
        addToDataArrayAfterIndex(newWeeklyToDo.nextDay || false, nextDayArray, false, setNextDayArray, index)
        addToDataArrayAfterIndex(newWeeklyToDo.important || false, importantArray, false, setImportantArray, index)
        addToDataArrayAfterIndex(newWeeklyToDo.date || '', dateArray, false, setDateArray, index)
        addToDataArrayAfterIndex(newWeeklyToDo.event || false, eventArray, false, setEventArray, index)
        addToDataArrayAfterIndex(newWeeklyToDo.scheduleId || '', scheduleIdArray, false, setScheduleIdArray, index)
        addToDataArrayAfterIndex(newWeeklyToDo.softDeadline || '', softDeadlineArray, false, setSoftDeadlineArray, index)
        addToDataArrayAfterIndex(newWeeklyToDo.hardDeadline || '', hardDeadlineArray, false, setHardDeadlineArray, index)
        
        const newStatusArray = addToDataArrayAfterIndex(newWeeklyToDo.status as ToDoStatus || ToDoStatus.TODO, statusArray, false,  setStatusArray)
        addToDataArrayAfterIndex(parentId || '', parentIdArray, false, setParentIdArray)
        addToDataArrayAfterIndex(eventId || '', eventIdArray, false, setEventIdArray)
        addToDataArrayAfterIndex(duration || -1, durationArray, false, setDurationArray)
        const newOrderArray = addToOrderArrayAfterIndexWithNewOrder(orderArray, false, setOrderArray, index)
        const {
          displayUIArray: sortedDisplayUIArray,
          dataIndexToDisplayArray: sortedDataIndexToDisplayArray,
        } = getDisplayUI(newNotesArray, newStatusArray as ToDoStatus[])

        setDisplayUIArray(sortedDisplayUIArray)
        setDataIndexToDisplayArray(sortedDataIndexToDisplayArray)
        const promises = newOrderArray.map(async (i, inx) => {
          try {
            return updateTaskInStore(
              TableName.WEEKLY,
              newIdArray[inx],
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
              i
            )
          } catch(e) {
            
          }
        })
        await Promise.all(promises)
      } else {

        const newIdArray = addToDataArrayAfterIndex(newWeeklyToDo.id, idArray, true, setIdArray)
        const newNotesArray = addToDataArrayAfterIndex(newWeeklyToDo.notes || '', notesArray, true, setNotesArray)
        addToDataArrayAfterIndex(newWeeklyToDo.completed || false, completedArray, true, setCompletedArray)
        addToDataArrayAfterIndex(newWeeklyToDo.startDate || '', startDateArray, true, setStartDateArray)
        addToDataArrayAfterIndex(newWeeklyToDo.endDate || '', endDateArray, true, setEndDateArray)
        addToDataArrayAfterIndex(newWeeklyToDo.completedDate || '', completedDateArray, true, setCompletedDateArray)
        addToDataArrayAfterIndex(newWeeklyToDo.nextDay || false, nextDayArray, true, setNextDayArray)
        addToDataArrayAfterIndex(newWeeklyToDo.important || false, importantArray, true, setImportantArray)
        addToDataArrayAfterIndex(newWeeklyToDo.date || '', dateArray, true, setDateArray)
        addToDataArrayAfterIndex(newWeeklyToDo.event || false, eventArray, true, setEventArray)
        addToDataArrayAfterIndex(newWeeklyToDo.scheduleId || '', scheduleIdArray, true, setScheduleIdArray)
        addToDataArrayAfterIndex(newWeeklyToDo.softDeadline || '', softDeadlineArray, true, setSoftDeadlineArray)
        addToDataArrayAfterIndex(newWeeklyToDo.hardDeadline || '', hardDeadlineArray, true, setHardDeadlineArray)

        const newStatusArray = addToDataArrayAfterIndex(status || ToDoStatus.TODO, statusArray, true,  setStatusArray)
        addToDataArrayAfterIndex(parentId || '', parentIdArray, true, setParentIdArray)
        addToDataArrayAfterIndex(eventId || '', eventIdArray, true, setEventIdArray)
        addToDataArrayAfterIndex(duration || -1, durationArray, true, setDurationArray)
        const newOrderArray = addToOrderArrayAfterIndexWithNewOrder(orderArray, true, setOrderArray)
        const {
          displayUIArray: sortedDisplayUIArray,
          dataIndexToDisplayArray: sortedDataIndexToDisplayArray,
        } = getDisplayUI(newNotesArray, newStatusArray as ToDoStatus[])

        setDisplayUIArray(sortedDisplayUIArray)
        setDataIndexToDisplayArray(sortedDataIndexToDisplayArray)
        const promises = newOrderArray.map(async (i, inx) => {
          try {
            return updateTaskInStore(
              TableName.WEEKLY,
              newIdArray[inx],
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
              i
            )
          } catch(e) {
            
          }
        })
        await Promise.all(promises)
      }

      return newWeeklyToDo.id

    } catch(e) {
      
    }
  }

  const createMasterTaskToStore = async (
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

      const newMasterToDo = await DataStore.save(
        new MasterToDo({
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

      if (idArray?.[0]) {
        const index = statusArray.lastIndexOf(ToDoStatus.TODO)
        const newIdArray = addToDataArrayAfterIndex(newMasterToDo.id, idArray, false, setIdArray, index)
        const newNotesArray = addToDataArrayAfterIndex(newMasterToDo.notes || '', notesArray, false, setNotesArray, index)
        addToDataArrayAfterIndex(newMasterToDo.completed || false, completedArray, false, setCompletedArray, index)
        addToDataArrayAfterIndex(newMasterToDo.startDate || '', startDateArray, false, setStartDateArray, index)
        addToDataArrayAfterIndex(newMasterToDo.endDate || '', endDateArray, false, setEndDateArray, index)
        addToDataArrayAfterIndex(newMasterToDo.completedDate || '', completedDateArray, false, setCompletedDateArray, index)
        addToDataArrayAfterIndex(newMasterToDo.nextDay || false, nextDayArray, false, setNextDayArray, index)
        addToDataArrayAfterIndex(newMasterToDo.important || false, importantArray, false, setImportantArray, index)
        addToDataArrayAfterIndex(newMasterToDo.date || '', dateArray, false, setDateArray, index)
        addToDataArrayAfterIndex(newMasterToDo.event || false, eventArray, false, setEventArray, index)
        addToDataArrayAfterIndex(newMasterToDo.scheduleId || '', scheduleIdArray, false, setScheduleIdArray, index)
        addToDataArrayAfterIndex(newMasterToDo.softDeadline || '', softDeadlineArray, false, setSoftDeadlineArray, index)
        addToDataArrayAfterIndex(newMasterToDo.hardDeadline || '', hardDeadlineArray, false, setHardDeadlineArray, index)
        
        const newStatusArray = addToDataArrayAfterIndex(newMasterToDo.status as ToDoStatus || ToDoStatus.TODO, statusArray, false,  setStatusArray)
        addToDataArrayAfterIndex(parentId || '', parentIdArray, false, setParentIdArray)
        addToDataArrayAfterIndex(eventId || '', eventIdArray, false, setEventIdArray)
        addToDataArrayAfterIndex(duration || -1, durationArray, false, setDurationArray)
        const newOrderArray = addToOrderArrayAfterIndexWithNewOrder(orderArray, false, setOrderArray, index)
        const {
          displayUIArray: sortedDisplayUIArray,
          dataIndexToDisplayArray: sortedDataIndexToDisplayArray,
        } = getDisplayUI(newNotesArray, newStatusArray as ToDoStatus[])

        setDisplayUIArray(sortedDisplayUIArray)
        setDataIndexToDisplayArray(sortedDataIndexToDisplayArray)
        const promises = newOrderArray.map(async (i, inx) => {
          try {
            return updateTaskInStore(
              TableName.MASTER,
              newIdArray[inx],
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
              i
            )
          } catch(e) {
            
          }
        })
        await Promise.all(promises)
      } else {

        const newIdArray = addToDataArrayAfterIndex(newMasterToDo.id, idArray, true, setIdArray)
        const newNotesArray = addToDataArrayAfterIndex(newMasterToDo.notes || '', notesArray, true, setNotesArray)
        addToDataArrayAfterIndex(newMasterToDo.completed || false, completedArray, true, setCompletedArray)
        addToDataArrayAfterIndex(newMasterToDo.startDate || '', startDateArray, true, setStartDateArray)
        addToDataArrayAfterIndex(newMasterToDo.endDate || '', endDateArray, true, setEndDateArray)
        addToDataArrayAfterIndex(newMasterToDo.completedDate || '', completedDateArray, true, setCompletedDateArray)
        addToDataArrayAfterIndex(newMasterToDo.nextDay || false, nextDayArray, true, setNextDayArray)
        addToDataArrayAfterIndex(newMasterToDo.important || false, importantArray, true, setImportantArray)
        addToDataArrayAfterIndex(newMasterToDo.date || '', dateArray, true, setDateArray)
        addToDataArrayAfterIndex(newMasterToDo.event || false, eventArray, true, setEventArray)
        addToDataArrayAfterIndex(newMasterToDo.scheduleId || '', scheduleIdArray, true, setScheduleIdArray)
        addToDataArrayAfterIndex(newMasterToDo.softDeadline || '', softDeadlineArray, true, setSoftDeadlineArray)
        addToDataArrayAfterIndex(newMasterToDo.hardDeadline || '', hardDeadlineArray, true, setHardDeadlineArray)

        const newStatusArray = addToDataArrayAfterIndex(status || ToDoStatus.TODO, statusArray, true,  setStatusArray)
        addToDataArrayAfterIndex(parentId || '', parentIdArray, true, setParentIdArray)
        addToDataArrayAfterIndex(eventId || '', eventIdArray, true, setEventIdArray)
        addToDataArrayAfterIndex(duration || -1, durationArray, true, setDurationArray)
        const newOrderArray = addToOrderArrayAfterIndexWithNewOrder(orderArray, true, setOrderArray)
        const {
          displayUIArray: sortedDisplayUIArray,
          dataIndexToDisplayArray: sortedDataIndexToDisplayArray,
        } = getDisplayUI(newNotesArray, newStatusArray as ToDoStatus[])

        setDisplayUIArray(sortedDisplayUIArray)
        setDataIndexToDisplayArray(sortedDataIndexToDisplayArray)
        const promises = newOrderArray.map(async (i, inx) => {
          try {
            return updateTaskInStore(
              TableName.MASTER,
              newIdArray[inx],
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
              i
            )
          } catch(e) {
            
          }
        })
        await Promise.all(promises)
      }

      return newMasterToDo.id

    } catch(e) {
      
    }
  }

  const createGroceryTaskToStore = async (
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

      const newGroceryToDo = await DataStore.save(
        new GroceryToDo({
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

      if (idArray?.[0]) {
        const index = statusArray.lastIndexOf(ToDoStatus.TODO)
        const newIdArray = addToDataArrayAfterIndex(newGroceryToDo.id, idArray, false, setIdArray, index)
        const newNotesArray = addToDataArrayAfterIndex(newGroceryToDo.notes || '', notesArray, false, setNotesArray, index)
        addToDataArrayAfterIndex(newGroceryToDo.completed || false, completedArray, false, setCompletedArray, index)
        addToDataArrayAfterIndex(newGroceryToDo.startDate || '', startDateArray, false, setStartDateArray, index)
        addToDataArrayAfterIndex(newGroceryToDo.endDate || '', endDateArray, false, setEndDateArray, index)
        addToDataArrayAfterIndex(newGroceryToDo.completedDate || '', completedDateArray, false, setCompletedDateArray, index)
        addToDataArrayAfterIndex(newGroceryToDo.nextDay || false, nextDayArray, false, setNextDayArray, index)
        addToDataArrayAfterIndex(newGroceryToDo.important || false, importantArray, false, setImportantArray, index)
        addToDataArrayAfterIndex(newGroceryToDo.date || '', dateArray, false, setDateArray, index)
        addToDataArrayAfterIndex(newGroceryToDo.event || false, eventArray, false, setEventArray, index)
        addToDataArrayAfterIndex(newGroceryToDo.scheduleId || '', scheduleIdArray, false, setScheduleIdArray, index)
        addToDataArrayAfterIndex(newGroceryToDo.softDeadline || '', softDeadlineArray, false, setSoftDeadlineArray, index)
        addToDataArrayAfterIndex(newGroceryToDo.hardDeadline || '', hardDeadlineArray, false, setHardDeadlineArray, index)
        const newStatusArray = addToDataArrayAfterIndex(newGroceryToDo.status as ToDoStatus || ToDoStatus.TODO, statusArray, false,  setStatusArray)
        addToDataArrayAfterIndex(parentId || '', parentIdArray, false, setParentIdArray)
        addToDataArrayAfterIndex(eventId || '', eventIdArray, false, setEventIdArray)
        addToDataArrayAfterIndex(duration || -1, durationArray, false, setDurationArray)
        const newOrderArray = addToOrderArrayAfterIndexWithNewOrder(orderArray, false, setOrderArray, index)
        const {
          displayUIArray: sortedDisplayUIArray,
          dataIndexToDisplayArray: sortedDataIndexToDisplayArray,
        } = getDisplayUI(newNotesArray, newStatusArray as ToDoStatus[])

        setDisplayUIArray(sortedDisplayUIArray)
        setDataIndexToDisplayArray(sortedDataIndexToDisplayArray)
        const promises = newOrderArray.map(async (i, inx) => {
          try {
            return updateTaskInStore(
              TableName.GROCERY,
              newIdArray[inx],
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
              i
            )
          } catch(e) {
            
          }
        })
        await Promise.all(promises)
      } else {

        const newIdArray = addToDataArrayAfterIndex(newGroceryToDo.id, idArray, true, setIdArray)
        const newNotesArray = addToDataArrayAfterIndex(newGroceryToDo.notes || '', notesArray, true, setNotesArray)
        addToDataArrayAfterIndex(newGroceryToDo.completed || false, completedArray, true, setCompletedArray)
        addToDataArrayAfterIndex(newGroceryToDo.startDate || '', startDateArray, true, setStartDateArray)
        addToDataArrayAfterIndex(newGroceryToDo.endDate || '', endDateArray, true, setEndDateArray)
        addToDataArrayAfterIndex(newGroceryToDo.completedDate || '', completedDateArray, true, setCompletedDateArray)
        addToDataArrayAfterIndex(newGroceryToDo.nextDay || false, nextDayArray, true, setNextDayArray)
        addToDataArrayAfterIndex(newGroceryToDo.important || false, importantArray, true, setImportantArray)
        addToDataArrayAfterIndex(newGroceryToDo.date || '', dateArray, true, setDateArray)
        addToDataArrayAfterIndex(newGroceryToDo.event || false, eventArray, true, setEventArray)
        addToDataArrayAfterIndex(newGroceryToDo.scheduleId || '', scheduleIdArray, true, setScheduleIdArray)
        addToDataArrayAfterIndex(newGroceryToDo.softDeadline || '', softDeadlineArray, true, setSoftDeadlineArray)
        addToDataArrayAfterIndex(newGroceryToDo.hardDeadline || '', hardDeadlineArray, true, setHardDeadlineArray)
      
        const newStatusArray = addToDataArrayAfterIndex(status || ToDoStatus.TODO, statusArray, true,  setStatusArray)
        addToDataArrayAfterIndex(parentId || '', parentIdArray, true, setParentIdArray)
        addToDataArrayAfterIndex(eventId || '', eventIdArray, true, setEventIdArray)
        addToDataArrayAfterIndex(duration || -1, durationArray, true, setDurationArray)
        const newOrderArray = addToOrderArrayAfterIndexWithNewOrder(orderArray, true, setOrderArray)
        const {
          displayUIArray: sortedDisplayUIArray,
          dataIndexToDisplayArray: sortedDataIndexToDisplayArray,
        } = getDisplayUI(newNotesArray, newStatusArray as ToDoStatus[])

        setDisplayUIArray(sortedDisplayUIArray)
        setDataIndexToDisplayArray(sortedDataIndexToDisplayArray)
        const promises = newOrderArray.map(async (i, inx) => {
          try {
            return updateTaskInStore(
              TableName.GROCERY,
              newIdArray[inx],
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
              i
            )
          } catch(e) {
            
          }
        })
        await Promise.all(promises)
      }

      return newGroceryToDo.id

    } catch(e) {
    }
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
  const updateDailyTaskToStore = async (
    index: number,
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

    if (!(idArray?.[index])) {
      return
    }

    return updateDailyTaskToStoreById(
      idArray?.[index],
      text,
      completed,
      startDate,
      endDate,
      completedDate,
      nextDay,
      important,
      event,
      scheduleId,
      softDeadline,
      hardDeadline,
      status,
      parentId,
      order,
      eventId,
      duration,
    )
  }

  const updateWeeklyTaskToStore = async (
    index: number,
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

    if (!idArray[index]) {
      return
    }

    const original = await DataStore.query(WeeklyToDo, idArray[index])

    if (original) {
      await DataStore.save(
        WeeklyToDo.copyOf(
          original, updated => {

            if (text && (text.localeCompare(original.notes || '') !== 0)) {
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
  }

  const updateMasterTaskToStore = async (
    index: number,
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

    if (!(idArray?.[index])) {
      return
    }

    const original = await DataStore.query(MasterToDo, idArray[index])

    if (original) {
      await DataStore.save(
        MasterToDo.copyOf(
          original, updated => {

            if (text && (text.localeCompare(original.notes || '') !== 0)) {
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
  }

  const updateGroceryTaskToStore = async (
    index: number,
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

    if (!idArray[index]) {
      return
    }

    const original = await DataStore.query(GroceryToDo, idArray[index])

    if (original) {
      await DataStore.save(
        GroceryToDo.copyOf(
          original, updated => {

            if (text && (text.localeCompare(original.notes || '') !== 0)) {
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
  }

  const deleteDailyTaskInStore = async (index: number) => {
    try {
      const id = idArray[index]

      const toDelete = await DataStore.query(DailyToDo, id)

      if (toDelete) {
        const deleted = await DataStore.delete(toDelete)


        const newIdArray = removeFromDataArray(index, idArray, setIdArray)
        const newNotesArray = removeFromDataArray(index, notesArray, setNotesArray)
        removeFromDataArray(index, completedArray, setCompletedArray)
        removeFromDataArray(index, startDateArray, setStartDateArray)
        removeFromDataArray(index, endDateArray, setEndDateArray)
        removeFromDataArray(index, completedDateArray, setCompletedDateArray)
        removeFromDataArray(index, nextDayArray, setNextDayArray)
        removeFromDataArray(index, importantArray, setImportantArray)
        removeFromDataArray(index, dateArray, setDateArray)
        removeFromDataArray(index, eventArray, setEventArray)
        removeFromDataArray(index, scheduleIdArray, setScheduleIdArray)
        removeFromDataArray(index, softDeadlineArray, setSoftDeadlineArray)
        removeFromDataArray(index, hardDeadlineArray, setHardDeadlineArray)

        const newStatusArray = removeFromDataArray(index, statusArray, setStatusArray)
        removeFromDataArray(index, parentIdArray, setParentIdArray)
        removeFromDataArray(index, eventIdArray, setEventIdArray)
        removeFromDataArray(index, durationArray, setDurationArray)
        const newOrderArray = removeFromDataArray(index, orderArray, setOrderArray)
        const {
          displayUIArray: sortedDisplayUIArray,
          dataIndexToDisplayArray: sortedDataIndexToDisplayArray,
        } = getDisplayUI(newNotesArray, newStatusArray as ToDoStatus[])

        const promises = newOrderArray.map(async (i, inx) => {
          try {
            return updateTaskInStore(
              TableName.DAILY,
              newIdArray[inx],
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
              i
            )
          } catch(e) {
            
          }
        })
        await Promise.all(promises)
        setDisplayUIArray(sortedDisplayUIArray)
        setDataIndexToDisplayArray(sortedDataIndexToDisplayArray)

        return deleted
      }
    } catch(e) {
    }
  }

  const deleteWeeklyTaskInStore = async (index: number) => {
    try {
      const id = idArray[index]

      const toDelete = await DataStore.query(WeeklyToDo, id)

      if (toDelete) {
        const deleted = await DataStore.delete(toDelete)


        const newIdArray = removeFromDataArray(index, idArray, setIdArray)
        const newNotesArray = removeFromDataArray(index, notesArray, setNotesArray)
        removeFromDataArray(index, completedArray, setCompletedArray)
        removeFromDataArray(index, startDateArray, setStartDateArray)
        removeFromDataArray(index, endDateArray, setEndDateArray)
        removeFromDataArray(index, completedDateArray, setCompletedDateArray)
        removeFromDataArray(index, nextDayArray, setNextDayArray)
        removeFromDataArray(index, importantArray, setImportantArray)
        removeFromDataArray(index, dateArray, setDateArray)
        removeFromDataArray(index, eventArray, setEventArray)
        removeFromDataArray(index, scheduleIdArray, setScheduleIdArray)
        removeFromDataArray(index, softDeadlineArray, setSoftDeadlineArray)
        removeFromDataArray(index, hardDeadlineArray, setHardDeadlineArray)

        const newStatusArray = removeFromDataArray(index, statusArray, setStatusArray)
        removeFromDataArray(index, parentIdArray, setParentIdArray)
        removeFromDataArray(index, eventIdArray, setEventIdArray)
        removeFromDataArray(index, durationArray, setDurationArray)
        const newOrderArray = removeFromDataArray(index, orderArray, setOrderArray)
        const {
          displayUIArray: sortedDisplayUIArray,
          dataIndexToDisplayArray: sortedDataIndexToDisplayArray,
        } = getDisplayUI(newNotesArray, newStatusArray as ToDoStatus[])

        const promises = newOrderArray.map(async (i, inx) => {
          try {
            return updateTaskInStore(
              TableName.WEEKLY,
              newIdArray[inx],
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
              i
            )
          } catch(e) {
            
          }
        })
        await Promise.all(promises)
        setDisplayUIArray(sortedDisplayUIArray)
        setDataIndexToDisplayArray(sortedDataIndexToDisplayArray)
        return deleted
      }
    } catch(e) {
      
    }
  }

  const deleteMasterTaskInStore = async (index: number) => {
    try {
      const id = idArray[index]

      const toDelete = await DataStore.query(MasterToDo, id)

      if (toDelete) {
        const deleted = await DataStore.delete(toDelete)


        const newIdArray = removeFromDataArray(index, idArray, setIdArray)
        const newNotesArray = removeFromDataArray(index, notesArray, setNotesArray)
        removeFromDataArray(index, completedArray, setCompletedArray)
        removeFromDataArray(index, startDateArray, setStartDateArray)
        removeFromDataArray(index, endDateArray, setEndDateArray)
        removeFromDataArray(index, completedDateArray, setCompletedDateArray)
        removeFromDataArray(index, nextDayArray, setNextDayArray)
        removeFromDataArray(index, importantArray, setImportantArray)
        removeFromDataArray(index, dateArray, setDateArray)
        removeFromDataArray(index, eventArray, setEventArray)
        removeFromDataArray(index, scheduleIdArray, setScheduleIdArray)
        removeFromDataArray(index, softDeadlineArray, setSoftDeadlineArray)
        removeFromDataArray(index, hardDeadlineArray, setHardDeadlineArray)

        const newStatusArray = removeFromDataArray(index, statusArray, setStatusArray)
        removeFromDataArray(index, parentIdArray, setParentIdArray)
        removeFromDataArray(index, eventIdArray, setEventIdArray)
        removeFromDataArray(index, durationArray, setDurationArray)
        const newOrderArray = removeFromDataArray(index, orderArray, setOrderArray)
        const {
          displayUIArray: sortedDisplayUIArray,
          dataIndexToDisplayArray: sortedDataIndexToDisplayArray,
        } = getDisplayUI(newNotesArray, newStatusArray as ToDoStatus[])
        const promises = newOrderArray.map(async (i, inx) => {
          try {
            return updateTaskInStore(
              TableName.MASTER,
              newIdArray[inx],
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
              i
            )
          } catch(e) {
            
          }
        })
        await Promise.all(promises)
        setDisplayUIArray(sortedDisplayUIArray)
        setDataIndexToDisplayArray(sortedDataIndexToDisplayArray)
        return deleted
      }
    } catch(e) {
      
    }
  }

  const deleteGroceryTaskInStore = async (index: number) => {
    try {
      const id = idArray[index]

      const toDelete = await DataStore.query(GroceryToDo, id)

      if (toDelete) {
        const deleted = await DataStore.delete(toDelete)


        const newIdArray = removeFromDataArray(index, idArray, setIdArray)
        const newNotesArray = removeFromDataArray(index, notesArray, setNotesArray)
        removeFromDataArray(index, completedArray, setCompletedArray)
        removeFromDataArray(index, startDateArray, setStartDateArray)
        removeFromDataArray(index, endDateArray, setEndDateArray)
        removeFromDataArray(index, completedDateArray, setCompletedDateArray)
        removeFromDataArray(index, nextDayArray, setNextDayArray)
        removeFromDataArray(index, importantArray, setImportantArray)
        removeFromDataArray(index, dateArray, setDateArray)
        removeFromDataArray(index, eventArray, setEventArray)
        removeFromDataArray(index, scheduleIdArray, setScheduleIdArray)
        removeFromDataArray(index, softDeadlineArray, setSoftDeadlineArray)
        removeFromDataArray(index, hardDeadlineArray, setHardDeadlineArray)
        const newStatusArray = removeFromDataArray(index, statusArray, setStatusArray)
        removeFromDataArray(index, parentIdArray, setParentIdArray)
        removeFromDataArray(index, eventIdArray, setEventIdArray)
        removeFromDataArray(index, durationArray, setDurationArray)
        const newOrderArray = removeFromDataArray(index, orderArray, setOrderArray)
        const {
          displayUIArray: sortedDisplayUIArray,
          dataIndexToDisplayArray: sortedDataIndexToDisplayArray,
        } = getDisplayUI(newNotesArray, newStatusArray as ToDoStatus[])
        const promises = newOrderArray.map(async (i, inx) => {
          try {
            return updateTaskInStore(
              TableName.GROCERY,
              newIdArray[inx],
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
              i
            )
          } catch(e) {
            
          }
        })
        await Promise.all(promises)
        setDisplayUIArray(sortedDisplayUIArray)
        setDataIndexToDisplayArray(sortedDataIndexToDisplayArray)
        return deleted
      }
    } catch(e) {
    }
  }

  const createTaskNote = async () => {
    try {

       const notes = newTaskText

       if (!notes) {
         Toast.show({
           type: 'info',
           text1: 'Empty',
           text2: 'Your task is empty'
         })
         return
       }

         let taskId

         switch(localTaskType) {
           case 'Daily':
            taskId = await createDailyTaskToStore(notes, false, undefined,
              undefined, undefined, false, false, '', '', ToDoStatus.TODO,
              '')
              break

           case 'Weekly':
            taskId = await createWeeklyTaskToStore(notes, false, undefined,
             undefined, undefined, false, false, '', '', ToDoStatus.TODO,
             '')
             break

           case 'Master':
             taskId = await createMasterTaskToStore(notes, false, undefined,
              undefined, undefined, false, false, '', '',  ToDoStatus.TODO,
              '')
              break

           case 'Grocery':
             taskId = await createGroceryTaskToStore(notes, false, undefined,
              undefined, undefined, false, false, '', '', ToDoStatus.TODO,
              '')
              break
         }

       setNewTaskText('')
       setIsNewTask(!isNewTask)
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

         if (event) {
          await submitEventForQueue(event, client, sub)
          setIsNewWeeklyTask(false)
  
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
        }
        setNewWeeklyTaskText('')
        setNewWeeklyPriority(1)
        setNewWeeklyDeadline(new Date())
        setNewWeeklyDeadlineType('soft')
        setNewWeeklyDuration(1)
        setIsNewWeeklyTask(false)
    } catch (e) {
      
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
        setIsNewDailyTask(false)

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
      setIsNewDailyTask(false)
    } catch (e) {
      
    }
  }

  const updateTaskNote = async () => {
    try {
      if (!updateTaskText) {
        
        return
      }

      const notes = updateTaskText
      const index = updateIndex
      const taskId = idArray[updateIndex]

      
      const UIIndex = dataIndexToDisplayArray.indexOf(index)
      updateDataArray(notes, displayUIArray, setDisplayUIArray, UIIndex)
      updateDataArray(notes, notesArray, setNotesArray, updateIndex)

      changeIsUpdateTask()

      const newDate = dayjs().format()
      updateDataArray(newDate, dateArray, setDateArray, index)

      return updateTaskInStore(
        localTaskType as TableName,
        taskId,
        notes,
        newDate,
      )
      
    } catch(e) {
      
    }
  }

  const deleteTask = async (
    index: number,
  ) => {
    try {

       const taskId = idArray[index]

       if (!taskId) {
          
         return
       }

       await deleteEventForTask(taskId, localTaskType, client, sub)

       let deleted: any
       switch(localTaskType) {
         case 'Daily':
           deleted = await deleteDailyTaskInStore(index)

          break
         case 'Weekly':
          deleted = await deleteWeeklyTaskInStore(index)
          break
         case 'Master':
          deleted = await deleteMasterTaskInStore(index)
          break
        case 'Grocery':
          deleted = await deleteGroceryTaskInStore(index)
          break
       }

       const childTaskIds = await deleteChildrenOfTask(
         index,
         idArray,
         parentIdArray,
       )

       if (deleted?.syncId && deleted?.syncName === NotionResourceName) {
         await deleteNotionBlock(localTaskType, deleted.syncId)
       }


       

       if (!childTaskIds || !(childTaskIds?.length > 0)) {
         
         return
       }

       const promises = childTaskIds.map(async(i) => {
         try {
          const inx = idArray.indexOf(i)

          await deleteEventForTask(i, localTaskType, client, sub)

           switch(localTaskType) {
             case 'Daily':
              await deleteDailyTaskInStore(inx)
              break
             case 'Weekly':
              await deleteWeeklyTaskInStore(inx)
              break
             case 'Master':
              await deleteMasterTaskInStore(inx)
              break
            case 'Grocery':
              await deleteGroceryTaskInStore(inx)
              break
           }

         } catch(e) {
           
         }
       })

       await Promise.all(promises)
    } catch(e) {
      
    }
  }

  const updateImportantTask = async (
    index: number,
  ) => {
    try {

      const oldImportant = importantArray[index]

      const taskId = idArray[index]

      if (!taskId) {
        return
      }

      switch(localTaskType) {
        case 'Daily':
          await updateDailyTaskToStore(
            index,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            !oldImportant,
          )
        break

        case 'Weekly':
          await updateWeeklyTaskToStore(
            index,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            !oldImportant,
          )
        break
        case 'Master':
          await updateMasterTaskToStore(
            index,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            !oldImportant,
          )
        break
        case 'Grocery':
          await updateGroceryTaskToStore(
            index,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            !oldImportant,
          )
        break
      }

      const newDate = dayjs().format()
      updateDataArray(newDate, dateArray, setDateArray, index)
      updateDataArray(!oldImportant, importantArray, setImportantArray, index)

    } catch(e) {
      
    }
  }

  const updateCompletedTask = async (
    index: number,
  ) => {
    try {
      const taskId = idArray[index]

      if (!taskId) {
        return
      }

      const oldCompleted = completedArray[index]

      switch(taskType) {
        case 'Daily':
          await updateDailyTaskToStore(
            index,
            undefined,
            !oldCompleted,
            undefined,
            undefined,
            (!oldCompleted) === true ? dayjs().format() : '',
          )
        break

        case 'Weekly':
          await updateWeeklyTaskToStore(
            index,
            undefined,
            !oldCompleted,
            undefined,
            undefined,
            (!oldCompleted) === true ? dayjs().format() : '',
          )
        break
        case 'Master':
          await updateMasterTaskToStore(
            index,
            undefined,
            !oldCompleted,
            undefined,
            undefined,
            (!oldCompleted) === true ? dayjs().format() : '',
          )
        break
        case 'Grocery':
          await updateGroceryTaskToStore(
            index,
            undefined,
            !oldCompleted,
            undefined,
            undefined,
            (!oldCompleted) === true ? dayjs().format() : '',
          )
        break
      }

      const newDate = dayjs().format()
      updateDataArray(newDate, dateArray, setDateArray, index)

      updateDataArray((!oldCompleted) === true
        ? newDate
        : '', completedDateArray, setCompletedDateArray, index)

      updateDataArray(!oldCompleted, completedArray, setCompletedArray, index)
      if ((!oldCompleted) !== true) {
        const newTaskCompleted = Math.min(0, taskCompletedCount - 1)
        return setTaskCompletedCount(newTaskCompleted)
      }

      const newTaskCompleted = taskCompletedCount + 1

      return setTaskCompletedCount(newTaskCompleted)

    } catch(e) {
      Toast.show({
        type: 'error',
        text1: 'Unable to update',
        text2: 'We are unable to update completed task due to an internal error'
      })
    }
  }

  const updateHeight = (height: number, index: number) => {
    const displayIndex = dataIndexToDisplayArray.indexOf(index)
    const newHeightArray = heightArray.slice(0, displayIndex).concat([height]).concat(heightArray.slice(displayIndex + 1))
    setHeightArray(newHeightArray)
  }

  const showMenu = () => setIsMenu(true)

  const hideMenu = () => setIsMenu(false)

  const showTaskMenu = (index: number) => {

    setIsTaskMenus(
      isTaskMenus
        .slice(0, index)
        .concat([true])
        .concat(isTaskMenus
          .slice(index + 1)))
  }

  const hideTaskMenu = (index: number) => {
    setIsTaskMenus(isTaskMenus.slice(0, index).concat([false]).concat(isTaskMenus.slice(index + 1)))
  }

const changeTaskList = async (type: taskType) => {
  setDisableTaskType(true)
  setLocalTaskType(type)
    
}

const changeToDailyTaskList = () => changeTaskList('Daily')

const changeToWeeklyTaskList = () => changeTaskList('Weekly')

const changeToMasterTaskList = () => changeTaskList('Master')

const changeToGroceryTaskList = () => changeTaskList('Grocery')

const navigateToTaskSchedule = (index: number, isTaskUpdate: boolean) => {
  navigation.navigate('UserTaskSchedule', {
    taskType: localTaskType,
    isUpdate: isTaskUpdate,
    taskId: idArray[index],
  })
}

const navigateToTaskDeadline = (index: number, isTaskUpdate: boolean, deadlineType: 'soft' | 'hard') => {
  navigation.navigate('UserTaskDeadline', {
    taskType: localTaskType,
    isUpdate: isTaskUpdate,
    taskId: idArray[index],
    deadlineType,
  })
}

const navigateToTaskEvent = (index: number, isTaskUpdate: boolean) => {
  navigation.navigate('UserTaskEvent', {
    taskType: localTaskType,
    isUpdate: isTaskUpdate,
    taskId: idArray[index],
  })
}

const removeEventTask = async (index: number) => {
  try {
    const taskId = idArray[index]

    await deleteEventForTask(taskId, localTaskType, client, sub)

    if (localTaskType === 'Daily') {
      await updateDailyTaskToStore(
        index,
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
        undefined,
        '',
      )

    } else if (localTaskType === 'Weekly') {
      await updateWeeklyTaskToStore(
        index,
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
        undefined,
        '',
      )
    } else if (localTaskType === 'Master') {
      await updateMasterTaskToStore(
        index,
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
        undefined,
        '',
      )
    } else if (localTaskType === 'Grocery') {
      await updateGroceryTaskToStore(
        index,
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
        undefined,
        '',
      )
    }

    const newDate = dayjs().format()

    updateDataArray('', startDateArray, setStartDateArray, index)
    updateDataArray('', endDateArray, setEndDateArray, index)
    updateDataArray(false, eventArray, setEventArray, index)

    updateDataArray(newDate, dateArray, setDateArray, index)

  } catch(e) {
    
  }
}

const navigateToTaskTimer = () => navigation.navigate('UserTaskTimer', {
  taskType: localTaskType,
})

const changeIsNewTask = () => setIsNewTask(!isNewTask)

const changeIsUpdateTask = () => setIsUpdateTask(!isUpdateTask)

const onNewTaskText = (text: string) => setNewTaskText(text)


const removeTaskSchedule = async (i: number) => {
  try {

     if (!i) {
     }

     const taskId = idArray[i]
    
    await deleteEventForTask(taskId, localTaskType, client, sub)

    await cleanUpTaskSchedule(idArray, i, localTaskType)

    const newDate = dayjs().format()

    updateDataArray('', startDateArray, setStartDateArray, i)
    updateDataArray('', endDateArray, setEndDateArray, i)
    updateDataArray(newDate, dateArray, setDateArray, i)
    updateDataArray('', scheduleIdArray, setScheduleIdArray, i)
  } catch(e) {
    
  }
}

const addNewTask = async () => {
  const enableBetaTesting = (await client.query<{ Admin_Beta_Testing: AdminBetaTestingType[]}>({ query: getAdminBetaTesting}))?.data?.Admin_Beta_Testing?.[0]
  const activeSubscriptions = (await client.query<{ Active_Subscription: ActiveSubscriptionType[]}>({ query: listActiveSubscriptions, variables: { currentDate: dayjs().toISOString(), userId: sub }, fetchPolicy: 'no-cache' }))?.data?.Active_Subscription
  const subscriptions = await Promise.all(activeSubscriptions?.map(async (activeSubscription) => getSubscriptionWithId(client, activeSubscription.subscriptionId)))
  if (localTaskType === 'Daily') {
    
    navigation.navigate('UserAddTask', { taskType: localTaskType })
  } else if ((localTaskType === 'Weekly') && (enableBetaTesting || (activeSubscriptions?.length > 0))) {
    navigation.navigate('UserAddTask', { taskType: localTaskType })
  } else {
    setIsNewTask(true)
    setIsNewDailyTask(false)
    setIsNewWeeklyTask(false)
  }
}

const changeIsNewDailyTask = () => setIsNewDailyTask(!isNewDailyTask)

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


const changeIsNewWeeklyTask = () => setIsNewWeeklyTask(!isNewWeeklyTask)

const hideDeadlineDatePicker = () => setIsDeadlineDatePicker(false)
const showDeadlineDatePicker = () => setIsDeadlineDatePicker(true)

type contentSizeType = {
  nativeEvent: {
    contentSize: {
      height: number
    }
  }
}

const updateNoteAtIndex = (i: number) => {
  setUpdateIndex(i)
  setUpdateTaskText(notesArray[i])
  setIsUpdateTask(true)
}
useEffect(() => {
  (() => {
    if (canStart && showFTE) {
      start()
    }
  })()
}, [showFTE, canStart])

const enableFTE = () => {
  setShowFTEOverlay(false)
  setShowFTE(true)
  realm.write(() => {
    const OnBoards = realm.objects<OnBoardRealm>('OnBoard')
    if (OnBoards?.[0]?.id) {
      const [OnBoard] = OnBoards
      OnBoard.UserTask = true
    }
  })
}

const disableFTE = () => {
  setShowFTE(false)
  setShowFTEOverlay(false)
  stop()
  realm.write(() => {
    const OnBoards = realm.objects<OnBoardRealm>('OnBoard')
    if (OnBoards?.[0]?.id) {
      const [OnBoard] = OnBoards
      OnBoard.UserTask = false
    }
  })
}
useEffect(() => {
  const handleOnStop = () => disableFTE()
  eventEmitter.on('stop', handleOnStop)
  return () => {
    eventEmitter.off('stop', handleOnStop)
  }
}, [])

const hideFTEOverlay = () => setShowFTEOverlay(false)

const onDragEnd = async (dragEnd: dragEnd<string>)  => {
  return onDragEndUpdate(
    localTaskType,
    dragEnd,
    idArray,
    notesArray,
    statusArray,
    parentIdArray,
    displayUIArray,
    setDisplayUIArray,
    dataIndexToDisplayArray,
    setDataIndexToDisplayArray,
    setOrderArray,
  )
}

const addParentToTask = async (index: number) => {
  try {
    return addParent(
      localTaskType as TableName,
      index,
      index - 1,
      parentIdArray,
      setParentIdArray,
      idArray,
    )
  } catch(e) {
    
  }
}

const removeParentFromTask = async (
  index: number,
) => {
  try {
    return removeParent(
      localTaskType as TableName,
      index,
      parentIdArray,
      setParentIdArray,
      idArray,
    )
  } catch(e) {
    
  }
}

const renderItem = ({ item: note, index: displayIndex, drag, isActive }: RenderItemParams<renderItem>) => {
  const i = dataIndexToDisplayArray?.[displayIndex]
  const indexBefore = dataIndexToDisplayArray?.[displayIndex - 1]
  if (i === -1) {
    return (
      <Box
        style={{ width: width - 30 }}
      >
        <Text variant="optionHeader" textAlign="left">
          {note}
        </Text>
      </Box>
    )
  }

  if (i === 0 && showFTE) {
    return (
      <ScaleDecorator>
        <Box
          flexDirection="row"
          justifyContent="space-between"
          style={{ width: width - 30 }}
        >
          <TourGuideZone
            zone={1}
            text={'You can tap on the bullet to mark it as complete. "*" symbol will highlight bullets you marked as important to complete. ">" symbol will show tasks that are due tomorrow'}
            borderRadius={16}
          >
            <Box flex={1}>
              <Box flexDirection="row">
                {importantArray?.[i]
                  && renderBulletType('important')}
                <Pressable hitSlop={20} onPress={() => updateCompletedTask(i)}>
                  {completedArray?.[i]
                    ? (renderBulletType('completed'))
                    : (renderBulletType('bullet'))}
                </Pressable>
              </Box>
              {startDateArray?.[i]
                ? (
                  <Box>
                    {dayjs(startDateArray[i]).isTomorrow()
                      && (renderBulletType('nextDay'))}
                  </Box>
              ) : null}
            </Box>
          </TourGuideZone>
          <Box flex={7}>
            <TextField
              hideUnderline
              multiline
              style={[styles.task, { height: heightArray?.[i] > 0 ? heightArray?.[i] : 40 }]}
              value={note}
              onContentSizeChange={({ nativeEvent: { contentSize: { height } } }: contentSizeType) => updateHeight(height, i)}
              onFocus={() => updateNoteAtIndex(i)}
              disabled={isActive}
            />
            <TourGuideZone
              zone={2}
              text={'You will see chips in this area'}
              borderRadius={16}
            >
              <Box flexDirection="row" flexWrap="wrap" >
                {importantArray?.[i]
                  ? (
                    <Pressable onPress={() => updateImportantTask(i)} >
                      <ImportantIcon name="label-important" color={dark ? palette.white : palette.purplePrimary} />
                    </Pressable>
                  ) : null}
                {(startDateArray?.[i]
                  && dayjs(startDateArray?.[i]).isToday())
                  ? (
                    <TouchableOpacity style={styles.infoButton}>
                      <Text variant="toDoButton">
                        Today
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                  {(startDateArray?.[i]
                    && dayjs(startDateArray?.[i]).isTomorrow())
                    ? (
                      <TouchableOpacity style={styles.infoButton}>
                        <Text variant="toDoButton">
                          Tomorrow
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                {startDateArray?.[i]
                  ? (
                    <TouchableOpacity style={styles.infoButton}>
                      <Text variant="toDoButton">
                        {dayjs(startDateArray[i]).format('l')}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                {eventArray?.[i]
                  ? (
                    <Pressable onPress={() => navigateToTaskEvent(i, true)} onLongPress={async () => removeEventTask(i)}>
                      <EventIcon name="event-note" color={dark ? palette.white : palette.purplePrimary} />
                    </Pressable>
                  ) : null}
                {scheduleIdArray?.[i]
                  ? (
                    <Pressable onPress={() => navigateToTaskSchedule(i, true)} onLongPress={async () => removeTaskSchedule(i)}>
                      <ScheduleIcon name="schedule" color={dark ? palette.white : palette.purplePrimary} />
                    </Pressable>
                  ) : null
                }
                {softDeadlineArray?.[i]
                  ? (
                    <TouchableOpacity style={styles.infoButton}>
                      <Text variant="toDoButton">
                        Soft Deadline - {dayjs(softDeadlineArray[i]).format('lll')}
                      </Text>
                    </TouchableOpacity>
                  ) : null
                }
                {hardDeadlineArray?.[i]
                  ? (
                    <TouchableOpacity style={styles.infoButton}>
                      <Text variant="toDoButton">
                        Hard Deadline - {dayjs(hardDeadlineArray[i]).format('lll')}
                      </Text>
                    </TouchableOpacity>
                  ) : null
                }
                {(softDeadlineArray?.[i] || hardDeadlineArray?.[i])
                  ? (
                    <Pressable onPress={() => navigateToTaskDeadline(i, true, softDeadlineArray?.[i] ? 'soft' : 'hard')} onLongPress={() => removeTaskSchedule(i)}>
                      <DeadlineIcon  name="timer-sand" color={dark ? palette.white : palette.purplePrimary} />
                    </Pressable>
                  ) : null
                }
                {durationArray?.[i] > 0
                  ? (
                    <TouchableOpacity style={styles.infoButton}>
                      <Text variant="toDoButton">
                        Duration - {durationArray[i]} minutes
                      </Text>
                    </TouchableOpacity>
                  ) : null
                }
              </Box>
            </TourGuideZone>
          </Box>
          <TourGuideZone
            zone={3}
            text={'You tap on this menu for options related to the entry'}
            borderRadius={16}
          >
            <Box flex={1} flexDirection="column" justifyContent="flex-start">
              <Menu
                visible={isTaskMenus[i]}
                onDismiss={() => hideTaskMenu(i)}
                anchor={(
                  <Pressable hitSlop={30} onPress={() => showTaskMenu(i)}>
                    <Box flexDirection="row" justifyContent="flex-end">
                      <Text variant="subTitle" style={styles.taskMenu}>
                        {"\u22EE"}
                      </Text>
                    </Box>
                  </Pressable>
                )}
                >
                  {
                    importantArray?.[i]
                    ? (
                      <Menu.Item title="Remove Important" onPress={() => { hideTaskMenu(i); updateImportantTask(i); }} />
                    ) : (
                      <Menu.Item title="Add Important" onPress={() => { hideTaskMenu(i); updateImportantTask(i); }} />
                    )
                  }
                  {localTaskType !== 'Grocery'
                  ? (
                    <Menu.Item title="Start Timer" onPress={() => { hideTaskMenu(i); navigateToTaskTimer()}} />
                  ) : null}
                  <Menu.Item title="Remove Task" onPress={async () => { hideTaskMenu(i); await deleteTask(i) }} />
                </Menu>
            </Box>
          </TourGuideZone>
          <Box flex={1} alignItems="flex-end">
            <Pressable
              onLongPress={drag}
              disabled={isActive}
              hitSlop={10}
            >
                <GripIcon
                  name="grip-vertical"
                  size={30}
                  color={dark ? palette.white : palette.lightGray}
                />
            </Pressable>
          </Box>
        </Box>
      </ScaleDecorator>
    )
  }

  if (indexBefore === -1) {
    return (
      <ScaleDecorator>
        <Box
          flexDirection="row"
          justifyContent="space-between"
          style={{ width: width - 30 }}
          pt={{ phone: 's', tablet: 'm' }}
        >
          <Box flex={1}>
            <Box flexDirection="row">
              {importantArray?.[i]
                && renderBulletType('important')}
              <Pressable hitSlop={20} onPress={() => updateCompletedTask(i)}>
                {completedArray?.[i]
                  ? (renderBulletType('completed'))
                  : (renderBulletType('bullet'))}
              </Pressable>
            </Box>
            {startDateArray?.[i]
              ? (
                <Box>
                  {dayjs(startDateArray[i]).isTomorrow()
                    && (renderBulletType('nextDay'))}
                </Box>
            ) : null}
          </Box>
          <Box flex={7}>
            <TextField
              hideUnderline
              multiline
              style={[styles.task, { height: heightArray?.[i] ? heightArray?.[i] : 40 }]}
              value={note}
              onContentSizeChange={({ nativeEvent: { contentSize: { height } } }: contentSizeType) => updateHeight(height, i)}
              onFocus={() => updateNoteAtIndex(i)}
              disabled={isActive}
            />
            <Box flexDirection="row" flexWrap="wrap" >
                {importantArray?.[i]
                  ? (
                    <Pressable onPress={() => updateImportantTask(i)} >
                      <ImportantIcon name="label-important" color={dark ? palette.white : palette.purplePrimary} />
                    </Pressable>
                  ) : null}
                {(startDateArray?.[i]
                  && dayjs(startDateArray?.[i]).isToday())
                  ? (
                    <TouchableOpacity style={styles.infoButton}>
                      <Text variant="toDoButton">
                        Today
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                  {(startDateArray?.[i]
                    && dayjs(startDateArray?.[i]).isTomorrow())
                    ? (
                      <TouchableOpacity style={styles.infoButton}>
                        <Text variant="toDoButton">
                          Tomorrow
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                {startDateArray?.[i]
                  ? (
                    <TouchableOpacity style={styles.infoButton}>
                      <Text variant="toDoButton">
                        {dayjs(startDateArray[i]).format('l')}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                {eventArray?.[i]
                  ? (
                    <Pressable onPress={() => navigateToTaskEvent(i, true)} onLongPress={async () => removeEventTask(i)}>
                      <EventIcon name="event-note" color={dark ? palette.white : palette.purplePrimary} />
                    </Pressable>
                  ) : null}
                {scheduleIdArray?.[i]
                  ? (
                    <Pressable onPress={() => navigateToTaskSchedule(i, true)} onLongPress={async () => removeTaskSchedule(i)}>
                      <ScheduleIcon name="schedule" color={dark ? palette.white : palette.purplePrimary} />
                    </Pressable>
                  ) : null
                }
                {softDeadlineArray?.[i]
                  ? (
                    <TouchableOpacity style={styles.infoButton}>
                      <Text variant="toDoButton">
                        Soft Deadline - {dayjs(softDeadlineArray[i]).format('lll')}
                      </Text>
                    </TouchableOpacity>
                  ) : null
                }
                {hardDeadlineArray?.[i]
                  ? (
                    <TouchableOpacity style={styles.infoButton}>
                      <Text variant="toDoButton">
                        Hard Deadline - {dayjs(hardDeadlineArray[i]).format('lll')}
                      </Text>
                    </TouchableOpacity>
                  ) : null
                }
                {(softDeadlineArray?.[i] || hardDeadlineArray?.[i])
                  ? (
                    <Pressable onPress={() => navigateToTaskDeadline(i, true, softDeadlineArray?.[i] ? 'soft' : 'hard')} onLongPress={() => removeTaskSchedule(i)}>
                      <DeadlineIcon  name="timer-sand" color={dark ? palette.white : palette.purplePrimary} />
                    </Pressable>
                  ) : null
                }
                {durationArray?.[i] > 0
                  ? (
                    <TouchableOpacity style={styles.infoButton}>
                      <Text variant="toDoButton">
                        Duration - {durationArray[i]} minutes
                      </Text>
                    </TouchableOpacity>
                  ) : null
                }
            </Box>
          </Box>
          <Box flex={1} flexDirection="column" justifyContent="flex-start">
            <Menu
              visible={isTaskMenus[i]}
              onDismiss={() => hideTaskMenu(i)}
              anchor={(
                <Pressable hitSlop={30} disabled={isActive} onPress={() => showTaskMenu(i)}>
                  <Box flexDirection="row" justifyContent="flex-end">
                    <Text variant="subTitle" style={styles.taskMenu}>
                      {"\u22EE"}
                    </Text>
                  </Box>
                </Pressable>
              )}
              >
                {
                  importantArray?.[i]
                  ? (
                    <Menu.Item title="Remove Important" onPress={() => { hideTaskMenu(i); updateImportantTask(i); }} />
                  ) : (
                    <Menu.Item title="Add Important" onPress={() => { hideTaskMenu(i); updateImportantTask(i); }} />
                  )
                }
                {
                  parentIdArray?.[i]
                  ? (
                    <Menu.Item title="Remove Parent" onPress={async () => { hideTaskMenu(i); return removeParentFromTask(i)}} />
                  ) : (
                    null
                  )
                }
                {localTaskType !== 'Grocery'
                ? (
                  <Menu.Item title="Start Timer" onPress={() => { hideTaskMenu(i); navigateToTaskTimer()}} />
                ) : null}
                <Menu.Item title="Remove Task" onPress={async () => { hideTaskMenu(i); await deleteTask(i) }} />
              </Menu>
          </Box>
          <Box flex={1} alignItems="flex-end">
            <Pressable
              onLongPress={drag}
              disabled={isActive}
              hitSlop={10}
            >
              <GripIcon
                name="grip-vertical"
                size={30}
                color={dark ? palette.white : palette.lightGray}
              />
            </Pressable>
          </Box>
        </Box>
      </ScaleDecorator>
    )
  }

  if (parentIdArray?.[i]?.length > 0) {
    return (
      <ScaleDecorator>
        <Box
          flexDirection="row"
          justifyContent="space-between"
          style={{ width: width - 30 }}
          pt={{ phone: 's', tablet: 'm' }}
        >
          <Box flex={1} />
          <Box flex={9} justifyContent="space-between" flexDirection="row">
            <Box flex={1}>
              <Box flexDirection="row">
                {importantArray?.[i]
                  && renderBulletType('important')}
                <Pressable hitSlop={20} onPress={() => updateCompletedTask(i)}>
                  {completedArray?.[i]
                    ? (renderBulletType('completed'))
                    : (renderBulletType('bullet'))}
                </Pressable>
              </Box>
              {startDateArray?.[i]
                ? (
                  <Box>
                    {dayjs(startDateArray[i]).isTomorrow()
                      && (renderBulletType('nextDay'))}
                  </Box>
              ) : null}
            </Box>
            <Box flex={7}>
              <TextField
                hideUnderline
                multiline
                style={[styles.task, { height: heightArray?.[i] ? heightArray?.[i] : 40 }]}
                value={note}
                onContentSizeChange={({ nativeEvent: { contentSize: { height } } }: contentSizeType) => updateHeight(height, i)}
                onFocus={() => updateNoteAtIndex(i)}
                disabled={isActive}
              />
              <Box flexDirection="row" flexWrap="wrap" >
                {importantArray?.[i]
                  ? (
                    <Pressable onPress={() => updateImportantTask(i)} >
                      <ImportantIcon name="label-important" color={dark ? palette.white : palette.purplePrimary} />
                    </Pressable>
                  ) : null}
                {(startDateArray?.[i]
                  && dayjs(startDateArray?.[i]).isToday())
                  ? (
                    <TouchableOpacity style={styles.infoButton}>
                      <Text variant="toDoButton">
                        Today
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                  {(startDateArray?.[i]
                    && dayjs(startDateArray?.[i]).isTomorrow())
                    ? (
                      <TouchableOpacity style={styles.infoButton}>
                        <Text variant="toDoButton">
                          Tomorrow
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                {startDateArray?.[i]
                  ? (
                    <TouchableOpacity style={styles.infoButton}>
                      <Text variant="toDoButton">
                        {dayjs(startDateArray[i]).format('l')}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                {eventArray?.[i]
                  ? (
                    <Pressable onPress={() => navigateToTaskEvent(i, true)} onLongPress={async () => removeEventTask(i)}>
                      <EventIcon name="event-note" color={dark ? palette.white : palette.purplePrimary} />
                    </Pressable>
                  ) : null}
                {scheduleIdArray?.[i]
                  ? (
                    <Pressable onPress={() => navigateToTaskSchedule(i, true)} onLongPress={async () => removeTaskSchedule(i)}>
                      <ScheduleIcon name="schedule" color={dark ? palette.white : palette.purplePrimary} />
                    </Pressable>
                  ) : null
                }
                {softDeadlineArray?.[i]
                  ? (
                    <TouchableOpacity style={styles.infoButton}>
                      <Text variant="toDoButton">
                        Soft Deadline - {dayjs(softDeadlineArray[i]).format('lll')}
                      </Text>
                    </TouchableOpacity>
                  ) : null
                }
                {hardDeadlineArray?.[i]
                  ? (
                    <TouchableOpacity style={styles.infoButton}>
                      <Text variant="toDoButton">
                        Hard Deadline - {dayjs(hardDeadlineArray[i]).format('lll')}
                      </Text>
                    </TouchableOpacity>
                  ) : null
                }
                {(softDeadlineArray?.[i] || hardDeadlineArray?.[i])
                  ? (
                    <Pressable onPress={() => navigateToTaskDeadline(i, true, softDeadlineArray?.[i] ? 'soft' : 'hard')} onLongPress={() => removeTaskSchedule(i)}>
                      <DeadlineIcon  name="timer-sand" color={dark ? palette.white : palette.purplePrimary} />
                    </Pressable>
                  ) : null
                }
                {durationArray?.[i] > 0
                  ? (
                    <TouchableOpacity style={styles.infoButton}>
                      <Text variant="toDoButton">
                        Duration - {durationArray[i]} minutes
                      </Text>
                    </TouchableOpacity>
                  ) : null
                }
              </Box>
            </Box>
            <Box flex={1} flexDirection="column" justifyContent="flex-start">
              <Menu
                visible={isTaskMenus[i]}
                onDismiss={() => hideTaskMenu(i)}
                anchor={(
                  <Pressable disabled={isActive} hitSlop={30} onPress={() => showTaskMenu(i)}>
                    <Box flexDirection="row" justifyContent="flex-end">
                      <Text variant="subTitle" style={styles.taskMenu}>
                        {"\u22EE"}
                      </Text>
                    </Box>
                  </Pressable>
                )}
                >
                  {
                    importantArray?.[i]
                    ? (
                      <Menu.Item title="Remove Important" onPress={() => { hideTaskMenu(i); updateImportantTask(i); }} />
                    ) : (
                      <Menu.Item title="Add Important" onPress={() => { hideTaskMenu(i); updateImportantTask(i); }} />
                    )
                  }
                  {
                    parentIdArray?.[i]
                    ? (
                      <Menu.Item title="Remove Parent" onPress={async () => { hideTaskMenu(i); return removeParentFromTask(i)}} />
                    ) : (
                      <Menu.Item title="Add Parent" onPress={async () => { hideTaskMenu(i); return addParentToTask(i)}} />
                    )
                  }
                  {localTaskType !== 'Grocery'
                  ? (
                    <Menu.Item title="Start Timer" onPress={() => { hideTaskMenu(i); navigateToTaskTimer()}} />
                  ) : null}
                  <Menu.Item title="Remove Task" onPress={async () => { hideTaskMenu(i); await deleteTask(i) }} />
                </Menu>
            </Box>
            <Box flex={1} alignItems="flex-end">
              <Pressable
                onLongPress={drag}
                disabled={isActive}
                hitSlop={10}
              >
                <GripIcon
                  name="grip-vertical"
                  size={30}
                  color={dark ? palette.white : palette.lightGray}
                />
              </Pressable>
            </Box>
          </Box>
        </Box>
      </ScaleDecorator>
    )
  }

  return (
    <ScaleDecorator>
        <Box
          flexDirection="row"
          justifyContent="space-between"
          style={{ width: width - 30 }}
          pt={{ phone: 's', tablet: 'm' }}
        >
          <Box flex={1}>
            <Box flexDirection="row">
              {importantArray?.[i]
                && renderBulletType('important')}
              <Pressable hitSlop={20} onPress={() => updateCompletedTask(i)}>
                {completedArray?.[i]
                  ? (renderBulletType('completed'))
                  : (renderBulletType('bullet'))}
              </Pressable>
            </Box>
            {startDateArray?.[i]
              ? (
                <Box>
                  {dayjs(startDateArray[i]).isTomorrow()
                    && (renderBulletType('nextDay'))}
                </Box>
            ) : null}
          </Box>
          <Box flex={7}>
            <TextField
              hideUnderline
              multiline
              style={[styles.task, { height: heightArray?.[i] ? heightArray?.[i] : 40 }]}
              value={note}
              onContentSizeChange={({ nativeEvent: { contentSize: { height } } }: contentSizeType) => updateHeight(height, i)}
              onFocus={() => updateNoteAtIndex(i)}
              disabled={isActive}
            />
            <Box flexDirection="row" flexWrap="wrap" >
                  {importantArray?.[i]
                    ? (
                      <Pressable onPress={() => updateImportantTask(i)} >
                        <ImportantIcon name="label-important" color={dark ? palette.white : palette.purplePrimary} />
                      </Pressable>
                    ) : null}
                  {(startDateArray?.[i]
                    && dayjs(startDateArray?.[i]).isToday())
                    ? (
                      <TouchableOpacity style={styles.infoButton}>
                        <Text variant="toDoButton">
                          Today
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                    {(startDateArray?.[i]
                      && dayjs(startDateArray?.[i]).isTomorrow())
                      ? (
                        <TouchableOpacity style={styles.infoButton}>
                          <Text variant="toDoButton">
                            Tomorrow
                          </Text>
                        </TouchableOpacity>
                      ) : null}
                  {startDateArray?.[i]
                    ? (
                      <TouchableOpacity style={styles.infoButton}>
                        <Text variant="toDoButton">
                          {dayjs(startDateArray[i]).format('l')}
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  {eventArray?.[i]
                    ? (
                      <Pressable onPress={() => navigateToTaskEvent(i, true)} onLongPress={async () => removeEventTask(i)}>
                        <EventIcon name="event-note" color={dark ? palette.white : palette.purplePrimary} />
                      </Pressable>
                    ) : null}
                  {scheduleIdArray?.[i]
                    ? (
                      <Pressable onPress={() => navigateToTaskSchedule(i, true)} onLongPress={async () => removeTaskSchedule(i)}>
                        <ScheduleIcon name="schedule" color={dark ? palette.white : palette.purplePrimary} />
                      </Pressable>
                    ) : null
                  }
                  {softDeadlineArray?.[i]
                    ? (
                      <TouchableOpacity style={styles.infoButton}>
                        <Text variant="toDoButton">
                          Soft Deadline - {dayjs(softDeadlineArray[i]).format('lll')}
                        </Text>
                      </TouchableOpacity>
                    ) : null
                  }
                  {hardDeadlineArray?.[i]
                    ? (
                      <TouchableOpacity style={styles.infoButton}>
                        <Text variant="toDoButton">
                          Hard Deadline - {dayjs(hardDeadlineArray[i]).format('lll')}
                        </Text>
                      </TouchableOpacity>
                    ) : null
                  }
                  {(softDeadlineArray?.[i] || hardDeadlineArray?.[i])
                    ? (
                      <Pressable onPress={() => navigateToTaskDeadline(i, true, softDeadlineArray?.[i] ? 'soft' : 'hard')} onLongPress={() => removeTaskSchedule(i)}>
                        <DeadlineIcon  name="timer-sand" color={dark ? palette.white : palette.purplePrimary} />
                      </Pressable>
                    ) : null
                  }
                  {durationArray?.[i] > 0
                    ? (
                      <TouchableOpacity style={styles.infoButton}>
                        <Text variant="toDoButton">
                          Duration - {durationArray[i]} minutes
                        </Text>
                      </TouchableOpacity>
                    ) : null
                  }
            </Box>
          </Box>
          <Box flex={1} flexDirection="column" justifyContent="flex-start">
            <Menu
              visible={isTaskMenus[i]}
              onDismiss={() => hideTaskMenu(i)}
              anchor={(
                <Pressable hitSlop={30} disabled={isActive} onPress={() => showTaskMenu(i)}>
                  <Box flexDirection="row" justifyContent="flex-end">
                    <Text variant="subTitle" style={styles.taskMenu}>
                      {"\u22EE"}
                    </Text>
                  </Box>
                </Pressable>
              )}
             >
               {
                 importantArray?.[i]
                 ? (
                   <Menu.Item title="Remove Important" onPress={() => { hideTaskMenu(i); updateImportantTask(i); }} />
                 ) : (
                   <Menu.Item title="Add Important" onPress={() => { hideTaskMenu(i); updateImportantTask(i); }} />
                 )
               }
               {
                 parentIdArray?.[i]
                 ? (
                   <Menu.Item title="Remove Parent" onPress={async () => { hideTaskMenu(i); return removeParentFromTask(i)}} />
                 ) : (
                   <Menu.Item title="Add Parent" onPress={async () => { hideTaskMenu(i); return addParentToTask(i)}} />
                 )
               }
               {localTaskType !== 'Grocery'
               ? (
                 <Menu.Item title="Start Timer" onPress={() => { hideTaskMenu(i); navigateToTaskTimer()}} />
               ) : null}
               <Menu.Item title="Remove Task" onPress={async () => { hideTaskMenu(i); await deleteTask(i) }} />
             </Menu>
          </Box>
          <Box flex={1} alignItems="flex-end">
            <Pressable
              onLongPress={drag}
              disabled={isActive}
              hitSlop={10}
            >
              <GripIcon
                name="grip-vertical"
                size={30}
                color={dark ? palette.white : palette.lightGray}
              />
            </Pressable>
          </Box>
        </Box>

    </ScaleDecorator>
  )
}

return (
  
    <Box flex={1}>
      <Box flex={1} flexDirection="row" justifyContent="flex-end" alignItems="center">
        <Box>
          <Menu
            visible={isMenu}
            onDismiss={hideMenu}
            anchor={(
              <TourGuideZone
                zone={4}
                text={'You can tap on this menu for list related options. Currently they include changing to a different list'}
                borderRadius={16}
              >
                <Pressable hitSlop={10} onPress={showMenu}>
                  {Platform.OS === 'ios'
                  ?
                    (<Text variant="menuHeader" pr={{ phone: 's', tablet: 'm' }} mr={{ phone: 'm', tablet: 'l' }}>{"\u20DB"}</Text>)
                  : (
                    <Box pr={{ phone: 's', tablet: 'm' }} mr={{ phone: 'm', tablet: 'l' }}>
                      {dark ?
                      (
                        <Image source={require('@assets/icons/threeDotsWhite.png')} style={{ width: 30, height: 30, resizeMode: 'contain'}} />
                      ) : (
                        <Image source={require('@assets/icons/threeDots.png')} style={{ width: 30, height: 30, resizeMode: 'contain'}} />
                      )}
                    </Box>
                  )}
                </Pressable>
              </TourGuideZone>
            )}
            >
                <Menu.Item title="Daily" onPress={() => { hideMenu(); changeToDailyTaskList() }} />
                <Menu.Item title="Weekly" onPress={() => { hideMenu(); changeToWeeklyTaskList() }} />
                <Menu.Item title="Master" onPress={() => { hideMenu(); changeToMasterTaskList() }} />
                <Menu.Item title="Grocery" onPress={() => { hideMenu(); changeToGroceryTaskList() }} />
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
          <TourGuideZone
            zone={5}
            text={'You can add a new entry in your task list here'}
            borderRadius={16}
          >
            <DraggableFlatList
              data={displayUIArray}
              renderItem={renderItem}
              onDragEnd={onDragEnd}
              keyExtractor={(item: string, i) => (`${item || i}-${i}` || 'null')}
              activationDistance={30}
              dragHitSlop={30}
            />
          </TourGuideZone>
          )
        : (
          <Box>
            <Text variant="backgroundText">
              Add a Task
            </Text>
          </Box>
        )}
      </Box>
      <Box>
        <Overlay overlayStyle={{ width: '90%', backgroundColor: dark ? palette.black : palette.white }} isVisible={isNewTask} onBackdropPress={changeIsNewTask}>
          <Box justifyContent="space-around" alignItems="center">
            <TextField
              hideUnderline
              multiline
              style={styles?.taskOverlay}
              value={newTaskText}
              onChangeText={(text: string) => onNewTaskText(text)}
            />
            <Button onPress={createTaskNote}>
              Add
            </Button>
          </Box>
        </Overlay>
        <Overlay overlayStyle={{ width: '90%',  backgroundColor: dark ? palette.black : palette.white }} isVisible={isUpdateTask} onBackdropPress={changeIsUpdateTask}>
          <Box justifyContent="space-around" alignItems="center">
            <TextField
              hideUnderline
              multiline
              style={styles?.taskOverlay}
              value={updateTaskText}
              onChangeText={setUpdateTaskText}
            />
            <Button onPress={updateTaskNote}>
              Add
            </Button>
          </Box>
        </Overlay>
        <Modal2
          animationType="slide"
          transparent={true} 
          visible={isNewDailyTask}
          onDismiss={changeIsNewDailyTask}
        >
          <Box style={styles2.centeredView}>
            <Box style={[styles2.modalView]}>
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
                style={{ color: dark ? palette.white : palette.textBlack }}
                  placeholder="Pick a deadline"
                  useNativePicker
                  migrateTextField
                  value={newDailyDeadlineType}
                  onChange={(itemValue: PickerValue) =>
                    setNewDailyDeadlineType(itemValue as DeadlineType)
                  }>
                  <Picker.Item key="soft" label="Soft Deadline" value="soft" />
                  <Picker.Item key="hard" label="Hard Deadline" value="hard" />
                </Picker>
              </Box>
              <Box flex={1} m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center" style={{ width: '100%' }}>
                <TextField
                  title="Duration (minutes)"
                  type="numeric"
                  onChangeText={(text: string) => setNewDailyDuration(parseInt(text.replace(/[^0-9.]/g, ''), 10))}
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
                <Box m={{ phone: 'm', tablet: 'l' }} justifyContent="center" alignItems="center">
                  <Pressable onPress={changeIsNewDailyTask}>
                    <Text variant="buttonLink">
                      Close
                    </Text>
                  </Pressable>
                </Box>
              </Box>
            </Box>
          </Box>
        </Modal2>
        <Modal2
          animationType="slide"
          transparent={true}
          visible={isNewWeeklyTask}
          onDismiss={changeIsNewWeeklyTask}
        >
          <Box style={styles2.centeredView}>
            <Box style={[styles2.modalView]}>
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
                  style={{ color: dark ? palette.white : palette.textBlack }}
                  placeholder="Pick a deadline"
                  useNativePicker
                  migrateTextField
                  value={newWeeklyDeadlineType}
                  onChange={(itemValue: PickerValue) =>
                      setNewWeeklyDeadlineType(itemValue as DeadlineType)
                  }>
                  <Picker.Item key="soft" label="Soft Deadline" value="soft" />
                  <Picker.Item key="hard" label="Hard Deadline" value="hard" />
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
              <Box m={{ phone: 'm', tablet: 'l' }} justifyContent="center" alignItems="center">
                <Pressable onPress={changeIsNewWeeklyTask}>
                  <Text variant="buttonLink">
                    Close
                  </Text>
                </Pressable>
              </Box>
            </Box>
          </Box>
        </Modal2>
        <Overlay overlayStyle={{ width: '90%', backgroundColor: dark ? palette.black : palette.white }} isVisible={showFTEOverlay} onBackdropPress={hideFTEOverlay}>
          <Box justifyContent="space-around" alignItems="center">
            <Box m={{ phone: 's', tablet: 'm' }}>
              <Text variant="header">
                Would you like a tour?
              </Text>
            </Box>
            <Box mt={{ phone: 's', tablet: 'm' }}>
              <Button onPress={enableFTE}>
                Yes
              </Button>
            </Box>
            <Box mt={{ phone: 's', tablet: 'm' }}>
              <Button onPress={disableFTE}>
                No, thanks
              </Button>
            </Box>
          </Box>
        </Overlay>
      </Box>
      <Box style={styles.container} pointerEvents="box-none">
        <SafeAreaView style={styles.safeArea} pointerEvents="box-none">
          <FAB
            icon={{
              name: 'add',
              type: 'ionicon',
              color: '#fff',
              }}
            onPress={addNewTask}
            style={styles.fab}
            color={palette.purplePrimary}
          />
        </SafeAreaView>
      </Box>
    </Box>

  )
}

export default UserTask
