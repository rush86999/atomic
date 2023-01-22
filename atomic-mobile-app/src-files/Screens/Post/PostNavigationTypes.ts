import {
  CompositeNavigationProp,
  NavigatorScreenParams,
 } from '@react-navigation/native'
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import { StackNavigationProp } from '@react-navigation/stack'
import { DrawerNavigationProp } from '@react-navigation/drawer'

export type HomeParamList = {
  Home: NavigatorScreenParams<DrawerNavigationPropParamList>,
}

export type UserToDoAndPostsTabNavigationParamList = {
  UserListPosts: NavigatorScreenParams<UserListPostsNavigationStackParamList>,
}

export type UserProgressActiveComponentsStackNavigationParamList = {
  UserProgressActiveComponentsStackNavigation: NavigatorScreenParams<UserListPostsNavigationParamList>,
}

export type UserCreatePostParamList = {
  postId: string,
  userId: string,
  avatar: string,
  username: string,
  profileId: string,
}

export type UserCommentPostParamList = {
  postId: string,
  commentCount: number,
  userId: string,
  userAvatar: string,
  username: string,
  profileId: string,
  postUserId: string,
  postUserName: string,
  commentId?: string,
}

export type UserViewPostParamList = {
  postId?: string,
  userId?: string,
  userAvatar?: string,
  username?: string,
  profileId?: string,
}

export type UserViewPostNavigationParamList = {
  UserCommentPost: {
    postId: string,
    commentCount: number,
    userId: string,
    userAvatar: string,
    username: string,
    profileId: string,
    postUserId: string,
    postUserName: string,
  },
  // UserListPosts: undefined,
  UserViewPost: undefined,
  UserUpdatePost: {
    postId: string,
  },
  UserProfileStackNavigation: NavigatorScreenParams<UserProfileStackNavigationParamList>,
}

export type UserUpdatePostParamList = {
  postId: string,
}

export type UserViewProfileParamList = {
  profileId?: string,
  username?: string,
}

export type UserViewFollowersParamList = {
  userId: string,
}

export type UserViewFollowingParamList = {
  userId: string,
  isOwner: boolean,
}

export type UserProfileStackNavigationParamList = {
  UserCommentPost: UserCommentPostParamList,
  UserCreatePost: UserCreatePostParamList,
  UserViewPost: UserViewPostParamList,
  UserUpdatePost: UserUpdatePostParamList,
  UserViewProfile: UserViewProfileParamList,
  UserEditProfile: undefined,
  UserViewFollowers: UserViewFollowersParamList,
  UserViewFollowing: UserViewFollowingParamList,
  UserProfileStackNavigation: undefined,
}

export type UserListPostsNavigationParamList = {
  UserCreatePost: {
    // post: PostRealm,
    postId: string,
    userId: string,
    avatar: string,
    username: string,
    profileId: string,
  },
  UserCamera: undefined,
  UserListPosts: undefined,
}

export type UserCreatePostNavigationStackParamList = {
  UserListPosts: {
    postId: string | undefined,
  },
  UserCreatePost: undefined,
}

export type UserListPostsParamList = {
  postId: string | undefined,
}

export type UserListPostsNavigationStackParamList = {
  UserListPosts: UserListPostsParamList,
  UserProfileStackNavigation: NavigatorScreenParams<UserProfileStackNavigationParamList>,
  UserCommentPost: UserCommentPostParamList,
  UserCreatePost: UserCreatePostParamList,
  UserUpdatePost: UserUpdatePostParamList,
  UserViewPost: UserViewPostParamList,
  UserViewActivity: undefined,
  UserCamera: undefined,
}

export type UserViewPostNavigationProp = CompositeNavigationProp<
  StackNavigationProp<UserProfileStackNavigationParamList, 'UserViewPost'>,
    CompositeNavigationProp<
      StackNavigationProp<UserListPostsNavigationStackParamList, 'UserProfileStackNavigation'>,
      CompositeNavigationProp<
        BottomTabNavigationProp<BottomTabNavigationPropParamList, 'UserListPosts'>,
        CompositeNavigationProp<
            DrawerNavigationProp<DrawerNavigationPropParamList, 'UserToDoAndPostsTabNavigation'>,
              StackNavigationProp<HomeParamList, 'Home'>
          >
        >
      >
    >

export type UserListPostsNavigationProp = CompositeNavigationProp<
StackNavigationProp<UserListPostsNavigationStackParamList, 'UserListPosts'>,
  CompositeNavigationProp<
    BottomTabNavigationProp<BottomTabNavigationPropParamList, 'UserListPosts'>,
    CompositeNavigationProp<
        DrawerNavigationProp<DrawerNavigationPropParamList, 'UserToDoAndPostsTabNavigation'>,
          StackNavigationProp<HomeParamList, 'Home'>
          >
        >
      >

export type DrawerNavigationPropParamList = {
  UserToDoAndPostsTabNavigation: NavigatorScreenParams<UserToDoAndPostsTabNavigationParamList>
}

export type BottomTabNavigationPropParamList = {
  UserListPosts: NavigatorScreenParams<UserListPostsNavigationStackParamList>
}


export type UserCreatePostNavigationProp = CompositeNavigationProp<
  StackNavigationProp<UserListPostsNavigationStackParamList, 'UserCreatePost'>,
    CompositeNavigationProp<
      BottomTabNavigationProp<BottomTabNavigationPropParamList, 'UserListPosts'>,
      CompositeNavigationProp<
          DrawerNavigationProp<DrawerNavigationPropParamList, 'UserToDoAndPostsTabNavigation'>,
            StackNavigationProp<HomeParamList, 'Home'>
            >
          >
        >
