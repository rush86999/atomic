import React from 'react'
import { RouteProp } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'

import { useNavigation } from '@react-navigation/native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { Pressable, Appearance } from 'react-native'
import { DrawerNavigationProp } from '@react-navigation/drawer'
import Box from '@components/common/Box'

import UserContext from '@navigation/user-context'
import Realm from 'realm'
import { palette } from '@theme/theme'

type userContextType = {
  sub: string,
  getRealmApp: () => Realm,
}

import UserCommentPost from '@post/UserCommentPost'
import UserCreatePost from '@post/UserCreatePost'
import UserUpdatePost from '@post/UserUpdatePost'
import UserViewPost from '@post/UserViewPost'
import UserListPosts from '@post/UserListPosts'
import UserNotifyActivity from '@screens/Notification/UserNotifyActivity'
import UserViewActivity from '@screens/Notification/UserViewActivity'
import UserCamera from '@post/UserCamera'
import UserProfileStackNavigation from '@profile/UserProfileStackNavigation'


const dark = Appearance.getColorScheme() === 'dark'

function UserViewActivityWithContext() {
  return (
    <UserContext.Consumer>
      {({ sub, getRealmApp }: userContextType) =>
      (
        <UserViewActivity sub={sub} getRealmApp={getRealmApp} />
      )}
    </UserContext.Consumer>
  )
}

type UserCameraRouteStackParamList = {
  UserListPosts: undefined,
  UserCamera: undefined,

}

type UserCameraRouteProp = RouteProp<
  UserCameraRouteStackParamList,
  'UserCamera'
>

type UserCameraProps = {
  route: UserCameraRouteProp,
}

function UserCameraWithContext(props: UserCameraProps) {
  return (
    <UserContext.Consumer>
      {({ sub, getRealmApp }: userContextType) =>
      (
        <UserCamera sub={sub} getRealmApp={getRealmApp} {...props} />
      )}
    </UserContext.Consumer>
  )
}

type UserNotifyActivityProps = {
  tintColor?: string,
}

function UserNotifyActivityWithContext(props: UserNotifyActivityProps) {
  return (
    <UserContext.Consumer>
      {({ sub, getRealmApp }: userContextType) =>
      (
        <UserNotifyActivity sub={sub} getRealmApp={getRealmApp} {...props} />
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
    commentId?: string,
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
        <UserUpdatePost getRealmApp={getRealmApp} {...props} />
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
  route?: UserViewPostRouteProp,
  postId?: string,
  userId?: string,
  userAvatar?: string,
  username?: string,
  profileId?: string,
  handleExternalData?: () => void,
}

function UserViewPostWithContext(props: UserViewPostProps) {
  return (
    <UserContext.Consumer>
      {({ getRealmApp }: userContextType) =>
      (
        <UserViewPost getRealmApp={getRealmApp} {...props} />
      )}
    </UserContext.Consumer>
  )
}

type UserListPostsRouteStackParamList = {
  UserListPosts: {
    postId: string | undefined,
    dataChanged?: string,
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
  UserProfileStackNavigation: undefined,
  UserViewActivity: undefined,
  UserCamera: undefined,
  UserCommentPost: {
    postId: string,
    commentCount: number,
    userId: string,
    userAvatar: string,
    username: string,
    profileId: string,
    postUserId: string,
    postUserName: string,
    commentId?: string,
  },
  UserCreatePost: {
    postId: string,
    userId: string,
    avatar: string,
    username: string,
    profileId: string,
  },
  UserUpdatePost: {
    postId: string,
  },
  UserViewPost: {
    postId?: string,
    userId?: string,
    userAvatar?: string,
    username?: string,
    profileId?: string,
  },
  UserListPosts: {
    postId: string | undefined,
  },
  UserListPostsStackNavigation: undefined,
}

type NavigationProps = DrawerNavigationProp<RootStackParamList, 'UserListPostsStackNavigation'>

function UserListPostsStackNavigation() {
  const Stack = createStackNavigator<RootStackParamList>()

  const navigation = useNavigation<NavigationProps>()
  /** UserProfileStackNavigation */
  return (
    <Stack.Navigator initialRouteName="UserListPosts" screenOptions={{ headerTintColor: palette.white }}>
      <Stack.Screen
        name="UserViewActivity"
        component={UserViewActivityWithContext}
        options={{ title: 'Activity' }}
      />
      <Stack.Screen
        name="UserProfileStackNavigation"
        component={UserProfileStackNavigation}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="UserCamera"
        component={UserCameraWithContext}
        options={{ title: 'Camera' }}
      />
      <Stack.Screen
        name="UserCommentPost"
        component={UserCommentPostWithContext}
        options={{ title: 'Comments' }}
      />
      <Stack.Screen
        name="UserListPosts"
        component={UserListPostsWithContext}
        options={{
          title: 'Posts',
          headerRight: (props) => (
            <Box mr={{ phone: 's', tablet: 'm' }}>
              <UserNotifyActivityWithContext {...props} />
            </Box>
          ),
          headerLeft: () => (
            <Box ml={{ phone: 's', tablet: 'm' }}>
              <Pressable onPress={() => navigation.toggleDrawer()}>
                <Ionicons name="menu" size={24} color={dark ? palette.white : palette.white} />
              </Pressable>
            </Box>
          ),
          headerTintColor: palette.white,
         }}

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
    </Stack.Navigator>
  )
}

export default UserListPostsStackNavigation
