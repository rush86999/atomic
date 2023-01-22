import React from 'react'
import { RouteProp } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { ApolloClient, ApolloConsumer, NormalizedCacheObject } from '@apollo/client'
import UserContext from '@navigation/user-context'

import { useNavigation } from '@react-navigation/native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { Pressable } from 'react-native'
import { DrawerNavigationProp } from '@react-navigation/drawer'
import Box from '@components/common/Box'

import {
  GetPostQuery,
} from '@app/API'

type userContextType = {
  sub: string
  getRealmApp: () => Realm,
}


import UserCommentPost from '@screens/Post/UserCommentPost'
import UserCreatePost from '@screens/Post/UserCreatePost'
import UserUpdatePost from '@screens/Post/UserUpdatePost'
import UserViewPost from '@screens/Post/UserViewPost'
import UserListPosts from '@screens/Post/UserListPosts'
import UserTask from '@progress/Todo/UserTask'
import UserTaskTimer from '@screens/Playback/UserTaskTimer'
import UserTaskSchedule from '@screens/Schedule/UserTaskSchedule'
import UserTaskDeadline from '@screens/Schedule/UserTaskDeadline'
import UserTaskEvent from '@screens/Schedule/UserTaskEvent'
import UserOnBoard from '@screens/OnBoard/UserOnBoard'
import UserAddTask from '@progress/Todo/UserAddTask'

import {
  // PrimaryGoalType,
  Comment,
  Post,
} from '@models'

import {
  Post as PostRealm,
} from '@realm/Post'

import { palette } from '@theme/theme'

type taskType = 'Daily'|'Weekly'|'Master'|'Grocery'

type taskType3 = 'Daily'|'Weekly'

type taskType2 = 'Daily'|'Weekly'|'Master'

type calendarEventIdEl = React.MutableRefObject<string>

type userIdEl = React.MutableRefObject<string>

type UserTaskEventRouteStackParamList = {
  UserTaskEvent: {
    taskType: taskType,
    isUpdate?: boolean,
    taskId: string,
  },
}

type UserTaskEventRouteProp = RouteProp<
  UserTaskEventRouteStackParamList,
  'UserTaskEvent'
>

type UserTaskEventProps = {
  route: UserTaskEventRouteProp,
}

function UserTaskEventWithContext(props: UserTaskEventProps) {
  return (
    <ApolloConsumer>
      {client =>
      (
        <UserContext.Consumer>
          {({ sub }: userContextType) =>
          (
            <UserTaskEvent client={client as ApolloClient<NormalizedCacheObject>} sub={sub} {...props} />
          )}
        </UserContext.Consumer>
      )}
    </ApolloConsumer>
  )
}

type UserOnBoardRouteStackParamList = {
 used for rendering the right type after done with timer
  UserOnBoard: {
    taskType: taskType | undefined,
  },
}

type UserOnBoardRouteProp = RouteProp<
  UserOnBoardRouteStackParamList,
  'UserOnBoard'>

  type UserOnBoardProps = {
    route: UserOnBoardRouteProp,
  }

function UserOnBoardWithContext(props: UserOnBoardProps) {
  return (
    <ApolloConsumer>
      {client => (
        <UserContext.Consumer>
          {({ sub, }: userContextType) =>
          (
            <UserOnBoard 
              client={client as ApolloClient<NormalizedCacheObject>} 
              sub={sub}
              route={props?.route}
              {...props}
            />
          )}
        </UserContext.Consumer>
      )}
    </ApolloConsumer>
  )
}

type UserTaskDeadlineRouteStackParamList = {
  UserTaskDeadline: {
    taskType: taskType3,
    isUpdate?: boolean,
    taskId: string,
    deadlineType: 'soft' | 'hard'
  },
}

type UserTaskDeadlineRouteProp = RouteProp<
  UserTaskDeadlineRouteStackParamList,
  'UserTaskDeadline'
>

type UserTaskDeadlineProps = {
  route: UserTaskDeadlineRouteProp,
}

function UserTaskDeadlineWithContext(props: UserTaskDeadlineProps) {
  return (
    <ApolloConsumer>
      {client => (
        <UserContext.Consumer>
          {({ sub }: userContextType) =>
          (
            <UserTaskDeadline client={client as ApolloClient<NormalizedCacheObject>} sub={sub} {...props} />
          )}
        </UserContext.Consumer>
      )}
    </ApolloConsumer>
  )
}

type UserTaskScheduleRouteStackParamList = {
  UserTaskSchedule: {
    startDate?: string,
    endDate?: string,
    title?: string,
    taskType: taskType,
    sub: string,
    isUpdate?: boolean,
    notes: string,
    taskId: string,
    calendarEventIdEl: calendarEventIdEl,
    userIdEl: userIdEl,
  },
}

type UserTaskScheduleRouteProp = RouteProp<
  UserTaskScheduleRouteStackParamList,
  'UserTaskSchedule'
>

type UserTaskScheduleProps = {
  route: UserTaskScheduleRouteProp,
}

function UserTaskScheduleWithContext(props: UserTaskScheduleProps) {
  return (
    <ApolloConsumer>
      {client => (
        <UserContext.Consumer>
          {({ sub }: userContextType) =>
          (
            <UserTaskSchedule client={client as ApolloClient<NormalizedCacheObject>} sub={sub} {...props} />
          )}
        </UserContext.Consumer>
      )}
    </ApolloConsumer>
  )
}

type UserAddTaskRouteStackParamList = {
    // used for rendering the right type after done with timer
  UserAddTask: {
    taskType: taskType | undefined,
  },
}

type UserAddTaskRouteProp = RouteProp<
  UserAddTaskRouteStackParamList,
  'UserAddTask'>

type UserAddTaskProps = {
  sub: string
  route: UserAddTaskRouteProp
  client: ApolloClient<NormalizedCacheObject>,
}

function UserAddTaskWithContext(props: UserAddTaskProps) {
  return (
    <ApolloConsumer>
      {client => (
        <UserContext.Consumer>
          {({ sub }: userContextType) => (
            <UserAddTask 
              client={client as ApolloClient<NormalizedCacheObject>}  
              sub={sub}
              {...props}
            />
          )}
        </UserContext.Consumer>
      )}
    </ApolloConsumer>
  )
}


type UserTaskStackParamList = {
    // used for rendering the right type after done with timer
  UserTask: {
    taskType: taskType | undefined,
    isUpdate?: string,
  },
}

type UserTaskRouteProp = RouteProp<
  UserTaskStackParamList,
  'UserTask'
>

type UserTaskProps = {
  route: UserTaskRouteProp,
}

function UserTaskWithContext(props: UserTaskProps) {
  return (
    <ApolloConsumer>
      {client => (
        <UserContext.Consumer>
          {({ sub, getRealmApp }: userContextType) => (
            <UserTask 
              client={client as ApolloClient<NormalizedCacheObject>} 
              getRealmApp={getRealmApp} 
              sub={sub} {...props}
            />
          )}
        </UserContext.Consumer>
      )}
    </ApolloConsumer>
  )
}

type UserTaskTimerStackParamList = {
  UserTaskTimer: {
    taskType: taskType2,
  },
}

type UserTaskTimerRouteProp = RouteProp<
  UserTaskTimerStackParamList,
  'UserTaskTimer'
>

type UserTaskTimerProps = {
  route: UserTaskTimerRouteProp,
}

function UserTaskTimerWithContext(props: UserTaskTimerProps) {
  return (
    <UserContext.Consumer>
      {({ sub, getRealmApp }: userContextType) =>
      (
        <UserTaskTimer getRealmApp={getRealmApp} sub={sub} {...props} />
      )}
    </UserContext.Consumer>
  )
}

type UserCommentPostRouteStackParamList = {
  UserCommentPost: {
    postId: string,
    commentCount: number,
    userId: string,
    userAvatar: string,
    username: string,
    profileId: string,
    postUserId: string,
    postUserName: string,
    comment?: Comment,
  },
}

type UserCommentPostRouteProp = RouteProp<
  UserCommentPostRouteStackParamList,
  'UserCommentPost'
>

type UserCommentPostProps = {
  route: UserCommentPostRouteProp,
}

function UserCommentPostWithContext(props: UserCommentPostProps) {
  return (
    <UserContext.Consumer>
      {({ sub, getRealmApp }: userContextType) =>
      (
        <UserCommentPost getRealmApp={getRealmApp} sub={sub} {...props} />
      )}
    </UserContext.Consumer>
  )
}

type UserCreatePostRouteStackParamList = {
  UserCreatePost: {
    postId: string,
    userId: string,
    avatar: string,
    username: string,
    profileId: string,
  },
}

type UserCreatePostRouteProp = RouteProp<
  UserCreatePostRouteStackParamList,
  'UserCreatePost'
>

type UserCreatePostProps = {
  route: UserCreatePostRouteProp,
}

function UserCreatePostWithContext(props: UserCreatePostProps) {
  return (
    <UserContext.Consumer>
      {({ getRealmApp }: userContextType) =>
      (
        <UserCreatePost getRealmApp={getRealmApp} {...props} />
      )}
    </UserContext.Consumer>
  )
}

type UserUpdatePostRouteStackParamList = {
  UserUpdatePost: {
    postId: string,
  },
}

type UserUpdatePostRouteProp = RouteProp<
  UserUpdatePostRouteStackParamList,
  'UserUpdatePost'
>

type UserUpdatePostProps = {
  route: UserUpdatePostRouteProp,
}

function UserUpdatePostWithContext(props: UserUpdatePostProps) {
  return (
    <UserContext.Consumer>
      {({ getRealmApp }: userContextType) =>
      (
        <UserUpdatePost getRealmApp={getRealmApp} route={props?.route} {...props} />
      )}
    </UserContext.Consumer>
  )
}

type UserViewPostRouteStackParamList = {
  UserViewPost: {
    postId?: string,
    userId?: string,
    userAvatar?: string,
    username?: string,
    profileId?: string,
  },
}

type UserViewPostRouteProp = RouteProp<
  UserViewPostRouteStackParamList,
  'UserViewPost'
>


type UserViewPostProps = {
  route: UserViewPostRouteProp,
  post?: GetPostQuery['getPost'],
  userId?: string,
  userAvatar?: string,
  username?: string,
  profileId?: string,
  handleExternalData?: () => void,
}

function UserViewPostWithContext(props: UserViewPostProps) {
  return (
    <UserViewPost {...props} />
  )
}

type UserListPostsRouteStackParamList = {
  UserListPosts: {
    postId: string | undefined,
  },
}

type UserListPostsRouteProp = RouteProp<
  UserListPostsRouteStackParamList,
  'UserListPosts'
>

type UserListPostsProps = {
  route: UserListPostsRouteProp,
}

function UserListPostsWithContext(props: UserListPostsProps) {
  return (
    <UserContext.Consumer>
      {({ sub, getRealmApp }: userContextType) =>
      (
        <UserListPosts getRealmApp={getRealmApp} sub={sub} {...props} />
      )}
    </UserContext.Consumer>
  )
}

type RootStackParamList = {
  UserOnBoard: {
    sub: string,
  },
  UserTaskEvent: {
    taskType: taskType,
    sub: string,
    isUpdate?: boolean,
    taskId: string,
  },
  UserTaskDeadline: {
    taskType: taskType3,
    sub: string,
    isUpdate?: boolean,
    taskId: string,
  },
  UserTaskSchedule: {
    startDate?: string,
    endDate?: string,
    title?: string,
    taskType: taskType,
    sub: string,
    isUpdate: boolean,
    notes: string,
    taskId: string,
    calendarEventIdEl: calendarEventIdEl,
    userIdEl: userIdEl,
  },
  UserTask: {
    taskType: taskType | undefined,
  },
  UserTaskTimer: {
    taskType: taskType2,
  },
  UserCommentPost: {
    postId: string,
    commentCount: number,
    userId: string,
    userAvatar: string,
    username: string,
    profileId: string,
    postUserId: string,
    postUserName: string,
    comment?: Comment,
  },
  UserCreatePost: {
    post: PostRealm,
    userId: string,
    avatar: string,
    username: string,
    profileId: string,
  },
  UserUpdatePost: {
    post: Post,
  },
  UserViewPost: {
    post?: Post,
    userId?: string,
    userAvatar?: string,
    username?: string,
    profileId?: string,
  },
  UserListPosts: {
    post: Post | undefined,
  },
  UserStackNavigation: undefined,
  UserAddTask: {
    taskType: taskType | undefined,
  },
}

type NavigationProps = DrawerNavigationProp<RootStackParamList, 'UserStackNavigation'>

function UserTaskStackNavigation() {
  const Stack = createStackNavigator<RootStackParamList>()

  const navigation = useNavigation<NavigationProps>()

  return (
    <Stack.Navigator initialRouteName="UserTask" screenOptions={{ headerTintColor: palette.white }}>
        <Stack.Screen
          name="UserAddTask"
          component={UserAddTaskWithContext}
          options={{ title: 'User Add Task' }}
        />
        <Stack.Screen
          name="UserTaskEvent"
          component={UserTaskEventWithContext}
          options={{ title: 'Add a Task Event' }}
        />
        <Stack.Screen
          name="UserTaskDeadline"
          component={UserTaskDeadlineWithContext}
          options={{ title: 'Add a Task Deadline' }}
        />
        <Stack.Screen
          name="UserOnBoard"
          component={UserOnBoardWithContext}
          options={{ title: 'OnBoard Wizard' }}
        />
        <Stack.Screen
          name="UserTaskSchedule"
          component={UserTaskScheduleWithContext}
          options={{ title: 'Add a Task Schedule' }}
        />
        <Stack.Screen
          name="UserTask"
          component={UserTaskWithContext}
          options={{
            title: 'Tasks',
            headerLeft: () => (
              <Box ml={{ phone: 's', tablet: 'm' }}>
                <Pressable onPress={() => navigation.toggleDrawer()}>
                  <Ionicons name="menu" size={24} color={palette.white} />
                </Pressable>
              </Box>
            ),
            headerTintColor: palette.white,
          }}
        />
        <Stack.Screen
          name="UserTaskTimer"
          component={UserTaskTimerWithContext}
          options={{ title: 'Task Timer' }}
        />
        <Stack.Screen
          name="UserListPosts"
          component={UserListPostsWithContext}
          options={{ title: 'Posts' }}
        />
        <Stack.Screen
          name="UserCreatePost"
          component={UserCreatePostWithContext}
          options={{ title: 'Create Post' }}
        />
        <Stack.Screen
          name="UserUpdatePost"
          component={UserUpdatePostWithContext}
          options={{ title: 'Update Post' }}
        />
        <Stack.Screen
          name="UserViewPost"
          component={UserViewPostWithContext}
          options={{ title: 'View Post' }}
        />
        <Stack.Screen
          name="UserCommentPost"
          component={UserCommentPostWithContext}
          options={{ title: 'Comments' }}
        />
      </Stack.Navigator>
  )
}

export default UserTaskStackNavigation
