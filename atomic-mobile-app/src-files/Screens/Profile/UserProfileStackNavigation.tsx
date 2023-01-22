import React from 'react'
import { RouteProp } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { Appearance } from 'react-native'
import UserContext from '@navigation/user-context'

import { useNavigation } from '@react-navigation/native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { Pressable } from 'react-native'
import { DrawerNavigationProp } from '@react-navigation/drawer'
import Box from '@components/common/Box'

const dark = Appearance.getColorScheme() === 'dark'

type userContextType = {
  sub: string,
  getRealmApp: () => Realm,
}

import UserEditProfile from '@profile/UserEditProfile'
import UserViewFollowers from '@profile/UserViewFollowers'
import UserViewFollowing from '@profile/UserViewFollowing'
import UserViewProfile from '@profile/UserViewProfile'
import UserViewPost from '@post/UserViewPost'
import UserCommentPost from '@post/UserCommentPost'
import UserUpdatePost from '@post/UserUpdatePost'
import UserProfileCamera from '@profile/UserProfileCamera'

import { palette } from '@theme/theme'

type UserViewProfileRouteStackParamList = {
  UserViewProfile: {
    profileId?: string,
    username?: string,
    isUpdate?: string,
  },
}

type UserViewProfileRouteProp = RouteProp<
  UserViewProfileRouteStackParamList,
  'UserViewProfile'
>

type UserViewProfileProps = {
  route: UserViewProfileRouteProp,
}

function UserViewProfileWithContext(props: UserViewProfileProps) {
  return (
    <UserContext.Consumer>
      {({ sub, getRealmApp }: userContextType) =>
      (
        <UserViewProfile getRealmApp={getRealmApp} sub={sub} {...props} />
      )}
    </UserContext.Consumer>
  )
}

type UserEditProfileRouteStackParamList = {
  UserEditProfile: { userProfileId: string },
}

type UserEditProfileRouteProp = RouteProp<
  UserEditProfileRouteStackParamList,
  'UserEditProfile'
>

type UserEditProfileProps = {
  route: UserEditProfileRouteProp,
}

function UserEditProfileWithContext(props: UserEditProfileProps) {
  return (
    <UserContext.Consumer>
      {({ getRealmApp }: userContextType) =>
      (
        <UserEditProfile getRealmApp={getRealmApp} {...props} />
      )}
    </UserContext.Consumer>
  )
}

type UserProfileCameraRouteStackParamList = {
  UserProfileCamera: { userProfileId: string },
}

type UserProfileCameraRouteProp = RouteProp<
  UserProfileCameraRouteStackParamList,
  'UserProfileCamera'
>

type UserProfileCameraProps = {
  route: UserProfileCameraRouteProp,
}

function UserProfileCameraWithContext(props: UserProfileCameraProps) {
  return (
    <UserContext.Consumer>
      {({ getRealmApp }: userContextType) =>
      (
        <UserProfileCamera getRealmApp={getRealmApp} {...props} />
      )}
    </UserContext.Consumer>
  )
}

type UserViewFollowersRouteStackParamList = {
  UserViewFollowers: {
    userId: string,
  },
}

type UserViewFollowersRouteProp = RouteProp<
  UserViewFollowersRouteStackParamList,
  'UserViewFollowers'
>

type UserViewFollowersProps = {
  route: UserViewFollowersRouteProp,
  sub: string,
}

function UserViewFollowersWithContext(props: UserViewFollowersProps) {
  return (
    <UserContext.Consumer>
      {({ getRealmApp, sub }: userContextType) =>
      (
        <UserViewFollowers sub={sub} getRealmApp={getRealmApp} {...props} />
      )}
    </UserContext.Consumer>
  )
}

type UserViewFollowingRouteStackParamList = {
  UserViewFollowing: {
    userId: string,
    isOwner: boolean,
  },
}

type UserViewFollowingRouteProp = RouteProp<
  UserViewFollowingRouteStackParamList,
  'UserViewFollowing'
>

type UserViewFollowingProps = {
  route: UserViewFollowingRouteProp,
  sub: string,
  getRealmApp: () => Realm,
}

function UserViewFollowingWithContext(props: UserViewFollowingProps) {
  return (
    <UserContext.Consumer>
      {({ getRealmApp, sub }: userContextType) =>
      (
        <UserViewFollowing sub={sub} getRealmApp={getRealmApp} {...props} />
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
  sub: string,
}

function UserViewPostWithContext(props: UserViewPostProps) {
  return (
    <UserContext.Consumer>
      {({ getRealmApp, sub }: userContextType) =>
      (
        <UserViewPost sub={sub} getRealmApp={getRealmApp} {...props} />
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


type RootStackParamList = {
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
  UserViewPost: {
    postId?: string,
    userId?: string,
    userAvatar?: string,
    username?: string,
    profileId?: string,
  },
  UserUpdatePost: {
    postId: string,
  },
  UserViewProfile: undefined,
  UserEditProfile: {
    userProfileId: string,
  },
  UserProfileCamera: {
    userProfileId: string,
  },
  UserViewFollowers: {
    userId: string,
    sub: string,
  },
  UserViewFollowing: {
    userId: string,
    isOwner: boolean,
    sub: string,
  },
  UserProfileStackNavigation: undefined,
}

type NavigationProps = DrawerNavigationProp<RootStackParamList, 'UserProfileStackNavigation'>

function UserProfileStackNavigation() {
  const Stack = createStackNavigator<RootStackParamList>()
  const navigation = useNavigation<NavigationProps>()

  return (
    <Stack.Navigator initialRouteName="UserViewProfile" screenOptions={{ headerTintColor: palette.white }}>
      <Stack.Screen
        name="UserCommentPost"
        component={UserCommentPostWithContext}
        options={{ title: 'Comments' }}
      />
      <Stack.Screen
        name="UserViewPost"
        component={UserViewPostWithContext}
        options={{ title: 'Post' }}
      />
      <Stack.Screen
        name="UserUpdatePost"
        component={UserUpdatePostWithContext}
        options={{ title: 'Update Post' }}
      />
      <Stack.Screen
        name="UserViewProfile"
        component={UserViewProfileWithContext}
        options={{
          title: 'Profile',
          headerLeft: () => (
            <Box ml={{ phone: 's', tablet: 'm' }}>
              <Pressable onPress={() => navigation.toggleDrawer()}>
                <Ionicons name="menu" size={24} color={palette.white} />
              </Pressable>
            </Box>
          )
       }}
      />
      <Stack.Screen
        name="UserEditProfile"
        component={UserEditProfileWithContext}
        options={{ title: 'Edit Profile' }}
      />
      <Stack.Screen
        name="UserProfileCamera"
        component={UserProfileCameraWithContext}
        options={{ title: 'Profile Camera' }}
      />
      <Stack.Screen
        name="UserViewFollowers"
        component={UserViewFollowersWithContext}
        options={{ title: 'Followers' }}
      />
      <Stack.Screen
        name="UserViewFollowing"
        component={UserViewFollowingWithContext}
        options={{ title: 'Following' }}
      />
    </Stack.Navigator>
  )
}

export default UserProfileStackNavigation
