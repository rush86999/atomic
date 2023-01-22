import React, { useState, useEffect } from 'react'
import {
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Dimensions,
  Image,
  FlatList,
} from 'react-native'
import { DataStore } from '@aws-amplify/datastore'
import { GraphQLResult, API } from '@aws-amplify/api'
import { dayjs } from '@app/date-utils'
import { useNavigation, RouteProp } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'

import { btoa } from 'react-native-quick-base64'
import { v4 as uuid } from 'uuid'

import Box from '@components/common/Box'
import Text from '@components/common/Text'
import Button from '@components/Button'

import { palette } from '@theme/theme'

import {
  UserProfile, Following,
  ActivityType,
} from '@models'


import ListFollowers from '@graphql/Queries/ListFollowers'

import CreateFollower from '@graphql/Mutations/CreateFollower'

import CreateActivity from '@graphql/Mutations/CreateActivity'
import GetFollower from '@graphql/Queries/GetFollower'
import UpdateFollower from '@graphql/Mutations/UpdateFollower'
import UpdateUserProfile from '@graphql/Mutations/UpdateUserProfile'
import GetUserProfile from '@graphql/Queries/GetUserProfile'

import {
  ListFollowersQuery,
  ListFollowersQueryVariables,
  CreateFollowerMutationVariables,
  CreateActivityMutation,
  CreateActivityMutationVariables,
  UpdateUserProfileMutation,
  UpdateUserProfileMutationVariables,
  GetFollowerQuery,
  GetFollowerQueryVariables,
  UpdateFollowerMutationVariables,
  UpdateFollowerMutation,
  GetUserProfileQuery,
  GetUserProfileQueryVariables,
} from '@app/API'


const bucketName = 'YOUR S3 COMPRESSED BUCKET NAME'

const PUBLICPROFILEIMAGEAPI = 'YOUR AWS SERVERLESS IMAGE HANDLER CLOUDFRONT URL'


const buildProfileURL = (fileKey: string) => `${PUBLICPROFILEIMAGEAPI}/${btoa(JSON.stringify({
  bucket: bucketName,
  key: `${fileKey.split('.')[0]}.webp`,
  edits: {
    resize: {
      width: 20,
      height: 20,
      fit: 'cover',
    },
  },
}))}`

type RootNavigationStackParamList = {
  UserViewProfile: {
    profileId: string,
    username: string,
    isUpdate: string,
  },
  UserViewFollowers: undefined,
}

type UserViewFollowersNavigationProp = StackNavigationProp<
  RootNavigationStackParamList,
  'UserViewFollowers'
>

type RootRouteStackParamList = {
  UserViewFollowers: {
    userId: string,
  },
}

type UserViewFollowersRouteProp = RouteProp<
  RootRouteStackParamList,
  'UserViewFollowers'
>

type Props = {
  route: UserViewFollowersRouteProp,
  getRealmApp: () => Realm,
  sub: string,
}

const { width: winWidth } = Dimensions.get('window')

const styles = StyleSheet.create({
  profilePicture: {
    borderRadius: 60 / 2,
    height: 60,
    width: 60,
    overflow: 'hidden',
    padding: 1,
    borderWidth: 1,
    borderColor: palette.purplePrimary,
  },
  item: {
    width: winWidth - 2,
  }
})

function UserViewFollowers(props: Props) {
  const [followers, setFollowers] = useState<ListFollowersQuery['listFollowers']['items']>([])
  const [followerToken, setFollowerToken] = useState<string>('')
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | undefined>()
  const [isFollowing, setIsFollowing] = useState<boolean[] | []>([])
  const [refreshing, setRefreshing] = useState<boolean>(false)

  const {
      sub,
      route,
      getRealmApp,
  } = props

  const userId = route?.params?.userId


  const realm = getRealmApp()

  const navigation = useNavigation<UserViewFollowersNavigationProp>()

  useEffect(() => {
    (async () => {
      try {
        if (!currentUserProfile || !(currentUserProfile?.userId)) {
          return
        }

        const followerData: GraphQLResult<ListFollowersQuery> = await (API
          .graphql({
            query: ListFollowers,
            variables: {
              userId,
              limit: 12,
            } as ListFollowersQueryVariables,
          }) as Promise<GraphQLResult<ListFollowersQuery>>)


          const listFollowers = followerData?.data?.listFollowers

          

          if (listFollowers?.items?.[0]?.id) {

              const {
                items,
              } = listFollowers

              const nextToken = listFollowers?.nextToken

              
              setFollowers(items.filter(i => !!(i.isFollower)))
              setFollowerToken(nextToken)

              const newIsFollowing = await Promise.all(items.map(async (profile) => {
                try {
                  const currentUserFollowing = await DataStore.query(Following,
                    c => c.userId('eq', currentUserProfile.userId)
                      .followingProfileId('eq', profile.id)
                      .isFollowing('eq', true), {
                      limit: 1
                    })

                  if (currentUserFollowing?.[0]?.id) {
                    return true
                  }
                  return false
                } catch(e) {
                  
                }
              }))

              setIsFollowing(newIsFollowing)

            }
      } catch(e) {
        
      }
    })()
  }, [(currentUserProfile && currentUserProfile.id)])

  useEffect(() => {
    (async () => {
      try {
        const userProfiles = await DataStore.query(UserProfile, c => c.sub('eq', sub), {
          limit: 1,
        })


        if (userProfiles?.[0]?.id) {
          setCurrentUserProfile(userProfiles[0])
        }
      } catch(e) {
        
      }
    })()
  }, [])

  const createActivity = async (index: number) => {
    try {
      await (API.
        graphql({
          query: CreateActivity,
          variables: {
            input: {
              userId: followers[index].userId,
              date: dayjs().format(),
              senderId: currentUserProfile.userId,
              activity: ActivityType.FOLLOW,
              objectId: followers[index].id,
              sendername: currentUserProfile.username,
              ttl: dayjs().add(14, 'd').unix(),
            },
          } as CreateActivityMutationVariables,
        }) as Promise<GraphQLResult<CreateActivityMutation>>)
    } catch(e) {
      
    }
  }

  const addFollowerProfileCount = async (index: number) => {
    try {
      const userProfileData: GraphQLResult<GetUserProfileQuery> = await (API
        .graphql({
          query: GetUserProfile,
          variables: {
            id: followers[index].followerProfileId,
          } as GetUserProfileQueryVariables,
        }) as Promise<GraphQLResult<GetUserProfileQuery>>)

      const followerData = await (API
        .graphql({
          query: UpdateUserProfile,
          variables: {
            input: {
              id: followers[index].followerProfileId,
              followerCount: userProfileData?.data?.getUserProfile?.followerCount > 0 ? userProfileData?.data?.getUserProfile?.followerCount + 1 : 1,
              _version: userProfileData?.data?.getUserProfile?._version,
            },
          } as UpdateUserProfileMutationVariables,
        }) as Promise<GraphQLResult<UpdateUserProfileMutation>>)


      const updatedUserProfile = followerData?.data?.updateUserProfile
      
      if (updatedUserProfile?.followerCount) {
        
      }
    } catch(e) {
      
    }
  }

  const addFollowingProfileCount = async() => {
    try {

      const updatedProfile = await DataStore.save(
        UserProfile.copyOf(
          currentUserProfile, updated => {

            if (currentUserProfile.followingCount > 0) {

              updated.followingCount += 1
            } else {
              updated.followingCount = 1
            }
          }
        )
      )

      
    } catch(e) {
      
    }
  }

  const createFollowing = async (index: number) => {
    try {
      if (!(currentUserProfile && currentUserProfile.id) || !currentUserProfile) {
        
        return
      }

      if (index < 0) {
        
        return
      }

      await DataStore.save(
        new Following({
          userId: currentUserProfile.userId,
          followingProfileId: followers[index].followerProfileId,
          username: followers[index].username,
          avatar: followers[index].avatar,
          isFollowing: true,
        })
      )

      const getFollowerData = await API
        .graphql({
          query: GetFollower,
          variables: {
            userId: followers[index].userId,
            followerProfileId: currentUserProfile.id,
          } as GetFollowerQueryVariables
        }) as GraphQLResult<GetFollowerQuery>

      if (getFollowerData?.data?.getFollower?.id) {

        const followerData = await (API
          .graphql({
            query: UpdateFollower,
            variables: {
              input: {
                userId: followers[index].userId,
                followerProfileId: currentUserProfile.id,
                avatar: currentUserProfile.avatar,
                username: currentUserProfile.username,
                isFollower: true,
                _version: getFollowerData?.data?.getFollower?._version,
              }
            } as UpdateFollowerMutationVariables
          })) as GraphQLResult<UpdateFollowerMutation>
        
      } else {

        const followerData = await (API
          .graphql({
            query: CreateFollower,
            variables: {
              input: {
                userId: followers[index].userId,
                followerProfileId: currentUserProfile.id,
                avatar: currentUserProfile.avatar,
                username: currentUserProfile.username,
                isFollower: true,
              }
            } as CreateFollowerMutationVariables,
          }))

        
      }

      await addFollowerProfileCount(index)
      await addFollowingProfileCount()

      await createActivity(index)
      const newIsFollowing = [
        ...isFollowing.slice(0, index),
        true,
        ...isFollowing.slice(index + 1),
      ]

      setIsFollowing(newIsFollowing)
    } catch(e) {
      
    }
  }

  const removeFollowerProfileCount = async (index: number) => {
    try {
      const userProfileData: GraphQLResult<GetUserProfileQuery> = await (API
        .graphql({
          query: GetUserProfile,
          variables: {
            id: followers[index].followerProfileId,
          } as GetUserProfileQueryVariables,
        }) as Promise<GraphQLResult<GetUserProfileQuery>>)

      

      const followerData = await (API
        .graphql({
          query: UpdateUserProfile,
          variables: {
            input: {
              id: followers[index]?.followerProfileId,
              followerCount: userProfileData?.data?.getUserProfile?.followerCount > 0 ? userProfileData?.data?.getUserProfile?.followerCount - 1 : 0,
              _version: userProfileData?.data?.getUserProfile?._version,
            },
          } as UpdateUserProfileMutationVariables,
        }) as Promise<GraphQLResult<UpdateUserProfileMutation>>)


      const updateUserProfile = followerData?.data?.updateUserProfile
      
      if (updateUserProfile?.followerCount) {
        
      }
    } catch(e) {
      
    }
  }

  const removeFollowingProfileCount = async() => {
    try {
      const updatedUserProfile = await DataStore.save(
        UserProfile.copyOf(
          currentUserProfile, updated => {
            if (currentUserProfile.followingCount > 0) {

              updated.followingCount -= 1
            } else {
              updated.followingCount = 0
            }
          }
        )
      )
      
    } catch(e) {
      
    }
  }

  const removeFollowing = async (index: number) => {
    try {
      if (!(currentUserProfile && currentUserProfile.id) || !currentUserProfile) {
        
        return
      }

      const toDeletes = await DataStore.query(Following, c => c
        .followingProfileId('eq', followers[index].followerProfileId)
        .userId('eq', currentUserProfile.userId),
        {
          limit: 1,
        })

      if (toDeletes?.[0]?.id) {
        const [toDelete] = toDeletes
        await DataStore.delete(toDelete)
      }

      const getFollowerData = await API
        .graphql({
          query: GetFollower,
          variables: {
            userId: followers[index].userId,
            followerProfileId: currentUserProfile.id,
          } as GetFollowerQueryVariables
        }) as GraphQLResult<GetFollowerQuery>

      const followerData = await (API
        .graphql({
          query: UpdateFollower,
          variables: {
            input: {
              userId: followers[index].userId,
              followerProfileId: currentUserProfile.id,
              _version: getFollowerData?.data?.getFollower?._version,
              isFollower: false,
            }
          } as UpdateFollowerMutationVariables
        })) as GraphQLResult<UpdateFollowerMutation>

      


      


      const newIsFollowing = [
        ...isFollowing.slice(0, index),
        false,
        ...isFollowing.slice(index + 1)
      ]

      await removeFollowerProfileCount(index)
      await removeFollowingProfileCount()

      setIsFollowing(newIsFollowing)
    } catch(e) {
      
    }
  }

  const loadMoreFollowers = async (): Promise<undefined | null> => {
    try {
      if (!followerToken) {
        return
      }

      if (!(currentUserProfile?.userId)) {
        return
      }

      const followerData: GraphQLResult<ListFollowersQuery> = await (API
        .graphql({
          query: ListFollowers,
          variables: {
            userId,
            limit: 12,
            nextToken: followerToken,
          } as ListFollowersQueryVariables,
        }) as Promise<GraphQLResult<ListFollowersQuery>>)


      const listFollowers = followerData?.data?.listFollowers?.items

      if (listFollowers?.[0]?.id) {


        const nextToken = followerData?.data?.listFollowers?.nextToken

          setFollowers([
            ...followers,
            ...(listFollowers.filter(i => !!(i.isFollower))),
          ])

          setFollowerToken(nextToken)

          const newIsFollowing = await Promise.all(listFollowers.filter(i => !!(i.isFollower)).map(async (profile) => {
            try {
              const currentUserFollowing = await DataStore.query(Following,
                c => c.userId('eq', currentUserProfile.userId)
                  .followingProfileId('eq', profile.id)
                  .isFollowing('eq', true), {
                  limit: 1
                })

              if (currentUserFollowing?.[0]?.id) {
                return true
              }
              return false
            } catch(e) {
              
            }
          }))

          setIsFollowing([
            ...isFollowing,
            ...newIsFollowing,
          ])
        }

    } catch(e) {
      
    }
  }

  const refreshFollowers = async () => {
    try {
      if (!(currentUserProfile?.userId)) {
        return
      }

      setRefreshing(true)

      const followerData: GraphQLResult<ListFollowersQuery> = await (API
        .graphql({
          query: ListFollowers,
          variables: {
            userId,
            limit: 12,
          } as ListFollowersQueryVariables,
        }) as Promise<GraphQLResult<ListFollowersQuery>>)


        const listFollowers = followerData?.data?.listFollowers?.items

        if (listFollowers?.[0]?.id) {


            const nextToken = followerData?.data?.listFollowers?.nextToken

            setFollowers(listFollowers.filter(i => !!(i.isFollower)))
            setFollowerToken(nextToken)

            const newIsFollowing = await Promise.all(listFollowers.filter(i => !!(i.isFollower)).map(async (profile) => {
              try {
                const currentUserFollowing = await DataStore.query(Following,
                  c => c.userId('eq', currentUserProfile.userId)
                  .followingProfileId('eq', profile.id)
                  .isFollowing('eq', true), {
                    limit: 1
                  })

                if (currentUserFollowing && currentUserFollowing.length > 0) {
                  return true
                }
                return false
              } catch(e) {
                
              }
            }))

            setIsFollowing(newIsFollowing)

          }

      setRefreshing(false)
    } catch(e) {
      
      setRefreshing(false)
    }
  }

  const navigateToProfile = (index: number) => {
    navigation.navigate('UserViewProfile', {
      profileId: followers[index].followerProfileId,
      username: followers[index].username,
      isUpdate: uuid(),
    })
  }

  return (
    <Box flex={1}>
      {
        followers?.length > 0
        ? (
          <Box flex={1}>
            <FlatList
              data={followers.filter(p => (p?._deleted !== true))}
              keyExtractor={item => item.id}
              renderItem={({ item, index }) => (
                <Box mt={{ phone: 's', tablet: 'm' }} style={[styles.item]}>
                  <Box flex={1} flexDirection="row" justifyContent="space-between">
                    <Box flexDirection="row" justifyContent="flex-start">
                      <Box flexDirection="row" ml={{ phone: 's', tablet: 'm' }} justifyContent="flex-start" alignItems="center">
                        <TouchableWithoutFeedback onPress={() => navigateToProfile(index)}>
                          {
                            (item
                            && item.avatar)
                            ? (
                              <Image
                                source={{ uri: buildProfileURL(item.avatar)}}
                                style={styles.profilePicture}
                              />
                            ) : (
                              <Image
                                source={require('../../assets/icons/defaultProfileImage.png')}
                                style={styles.profilePicture}
                              />
                            )
                          }
                        </TouchableWithoutFeedback>
                      </Box>
                      <Box flexDirection="row" ml={{ phone: 's', tablet: 'm' }} justifyContent="flex-start" alignItems="center">
                        <TouchableOpacity onPress={() => navigateToProfile(index)}>
                          <Text variant="optionHeader">
                            {item.username}
                          </Text>
                        </TouchableOpacity>
                      </Box>
                    </Box>
                    <Box flexDirection="row" mr={{ phone: 's', tablet: 'm' }} justifyContent="flex-end">
                      {
                        isFollowing[index]
                        ? (
                          <Button following onPress={() => removeFollowing(index)}>
                            Following
                          </Button>
                        ) : (
                          <Button onPress={() => createFollowing(index)}>
                            Follow
                          </Button>
                        )
                      }
                    </Box>
                  </Box>
                </Box>
              )}
              onEndReachedThreshold={0.3}
              onEndReached={loadMoreFollowers}
              refreshing={refreshing}
              onRefresh={refreshFollowers}
            />
          </Box>
        ) : null
      }
    </Box>
  )

}

export default UserViewFollowers
