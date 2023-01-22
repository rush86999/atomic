import React, { useState, useEffect } from 'react'
import {
  TouchableOpacity,
  FlatList,
} from 'react-native'

import { GraphQLResult, API } from '@aws-amplify/api'


import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import Toast from 'react-native-toast-message'
import Realm from 'realm'


import {
  Comment,
  ActivityType, UserProfile,
} from '@models'

import GetComment from '@graphql/Queries/GetComment'
import GetPost from '@graphql/Queries/GetPost'
import GetUserProfile from '@graphql/Queries/GetUserProfile'

import {
  GetCommentQuery,
  GetCommentQueryVariables,
  GetPostQuery,
  GetPostQueryVariables,
  GetUserProfileQuery,
  GetUserProfileQueryVariables,
} from '@app/API'

import {
  Activity as ActivityRealm
} from '@realm/Activity'

import {
  UserProfile as UserProfileRealm,
} from '@realm/UserProfile'

import Box from '@components/common/Box'
import Text from '@components/common/Text'


type RootNavigationStackParamList = {
  UserCommentPost: {
    postId: string,
    userId: string,
    userAvatar: string,
    username: string,
    profileId: string,
    postUserId: string,
    postUserName: string,
    commentId?: string,
  },
  UserViewPost: {
    post: any,
    userId?: string,
    userAvatar?: string,
    username?: string,
    profileId?: string,
   },
  UserViewProfile: {
    profileId: string,
    username: string,
  },
  UserViewActivity: undefined,
}

type UserViewActivityNavigationProp = StackNavigationProp<
  RootNavigationStackParamList,
  'UserViewActivity'
>

type getRealmApp = () => Realm

type Props = {
  sub: string,
  getRealmApp: getRealmApp,
}


function UserViewActivity(props: Props) {
  const [activities, setActivities] = useState<ActivityRealm[] | []>([])
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | undefined>()


  const {
    getRealmApp,
  } = props

  const realm = getRealmApp()

  const navigation = useNavigation<UserViewActivityNavigationProp>()

  useEffect(() => {
    (async () => {
      try {

        const profiles = realm.objects<UserProfileRealm>('UserProfile')

        if (profiles?.length > 0) {
          setCurrentUserProfile(profiles[0])
        }
      } catch(e) {
      }
    })()
  }, [])

  useEffect(() => {
    (() => {
      if (!realm) {
        return
      }
      const newActivities = realm.objects<ActivityRealm & Realm.Object>('Activity')

      const sortedActivities = newActivities.sorted('dateUnix', true)

      if (sortedActivities && sortedActivities.length > 0) {
        setActivities(Array.from<ActivityRealm>(sortedActivities))
        sortedActivities.forEach(item => {
          realm.write(() => {
            const toUpdate = realm.objectForPrimaryKey<ActivityRealm>('Activity', item.id)

            toUpdate.read = true
          })
        })
      }

    })()
  }, [realm])


  useEffect(() => {
    return () => {
    }
  }, [])

  const navigateToComments = async (commentId: string) => {
    try {
      const commentData = await (API
        .graphql({
          query: GetComment,
          variables: {
            id: commentId,
          } as GetCommentQueryVariables
        }) as Promise<GraphQLResult<GetCommentQuery>>)

      const {
        data: {
          getComment,
        }
      } = commentData

      if (getComment && getComment.id) {
        navigation.navigate('UserCommentPost', {
          postId: getComment.postId,
          userId: currentUserProfile.userId,
          userAvatar: currentUserProfile.avatar,
          username: currentUserProfile.username,
          profileId: currentUserProfile.id,
          postUserId: currentUserProfile.userId,
          postUserName: currentUserProfile.username,
          comment: getComment as Comment,
        })
      } else {
        Toast.show({
          type: 'error',
          text1: 'Unable to get comment',
          text2: 'Please try again later'
        })
      }


    } catch(e) {
    }
  }

  const navigateToPost = async (postId: string) => {
    try {

      const postData = await (API
        .graphql({
          query: GetPost,
          variables: {
            id: postId,
          } as GetPostQueryVariables,
        }) as Promise<GraphQLResult<GetPostQuery>>)


      const post = postData?.data?.getPost


      if (post && post.id) {
        navigation.navigate('UserViewPost', {
          post,
          userId: currentUserProfile.userId,
          userAvatar: currentUserProfile.avatar,
          username: currentUserProfile.username,
          profileId: currentUserProfile.id,
        })
      } else {
        Toast.show({
          type: 'error',
          text1: 'Unable to get post',
          text2: 'Please try again later'
        })
      }
    } catch(e) {
    }
  }

  const navigateToProfile = async (profileId: string) => {
    try {
      const profileData = await (API
        .graphql({
          query: GetUserProfile,
          variables: {
            id: profileId,
          } as GetUserProfileQueryVariables
        }) as Promise<GraphQLResult<GetUserProfileQuery>>)

      const {
        data: {
          getUserProfile,
        }
      } = profileData

      if (getUserProfile && getUserProfile.id) {
        navigation.navigate('UserViewProfile', {
          profileId,
          username: currentUserProfile.username,
        })
      } else {
        Toast.show({
          type: 'error',
          text1: 'Unable to get user profile',
          text2: 'Please try again later'
        })
      }
    } catch(e) {
    }
  }

  const activitySwitch = (activity: ActivityRealm) => {
    switch(activity.activity) {
      case ActivityType.COMMENT:
        return navigateToComments(activity.objectId)
      case ActivityType.LIKE:
        return navigateToPost(activity.objectId)
      case ActivityType.FOLLOW:
        return navigateToProfile(activity.objectId)
      case ActivityType.BOOKMARK:
        return navigateToPost(activity.objectId)
      case ActivityType.REPLY:
        return navigateToComments(activity.objectId)
    }
  }


  const activityTypeValue = (type: string) => {
    switch(type) {
      case ActivityType.COMMENT:
        return 'commented'
      case ActivityType.LIKE:
        return 'liked'
      case ActivityType.FOLLOW:
        return 'followed'
      case ActivityType.BOOKMARK:
        return 'bookmarked'
      case ActivityType.REPLY:
        return 'replied'
    }
  }

  const objectTypeValue = (type: string) => {
    switch(type) {
      case ActivityType.COMMENT:
        return 'comment'
      case ActivityType.LIKE:
        return 'post'
      case ActivityType.FOLLOW:
        return 'profile'
      case ActivityType.BOOKMARK:
        return 'post'
      case ActivityType.REPLY:
        return 'comment'
    }
  }

  type renderLine = {
    item: ActivityRealm,
    index: number,
  }
  const renderLine = ({ item }: renderLine) => (
    <TouchableOpacity onPress={() => activitySwitch(item)}>
      <Box flexDirection="row" justifyContent="center" alignItems="center">
        <Text variant="body">
          {`${item.sendername} ${activityTypeValue(item.activity as ActivityType)} to your ${objectTypeValue(item.activity as ActivityType)}`}
        </Text>
      </Box>
    </TouchableOpacity>
  )

  return (
    <Box>
      <FlatList
        data={activities}
        renderItem={renderLine}
        keyExtractor={item => item.id}
      />
    </Box>
  )
}

export default UserViewActivity
