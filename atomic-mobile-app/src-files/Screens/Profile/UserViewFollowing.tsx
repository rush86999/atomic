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
import { v4 as uuid} from 'uuid'

import Box from '@components/common/Box'
import Text from '@components/common/Text'
import Button from '@components/Button'

import { palette } from '@theme/theme'

import {
  UserProfile,
  Following,
  ActivityType,
} from '@models'

import ListFollowingByUser from '@graphql/Queries/ListFollowingByUser'

import CreateFollower from '@graphql/Mutations/CreateFollower'
import CreateActivity from '@graphql/Mutations/CreateActivity'
import UpdateFollower from '@graphql/Mutations/UpdateFollower'
import UpdateUserProfile from '@graphql/Mutations/UpdateUserProfile'
import GetUserProfile from '@graphql/Queries/GetUserProfile'
import GetFollower from '@graphql/Queries/GetFollower'

import {
  ListFollowingByUserQuery,
  ListFollowingByUserQueryVariables,
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
  key: fileKey,
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
  UserViewFollowing: undefined,
}

type UserViewFollowingNavigationProp = StackNavigationProp<
  RootNavigationStackParamList,
  'UserViewFollowing'
>

type RootRouteStackParamList = {
  UserViewFollowing: {
    userId: string,
    isOwner: boolean,
  },
}

type UserViewFollowingRouteProp = RouteProp<
  RootRouteStackParamList,
  'UserViewFollowing'
>

type Props = {
  route: UserViewFollowingRouteProp,
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


function UserViewFollowing(props: Props) {
  const [following, setFollowing] = useState<ListFollowingByUserQuery['listFollowingByUser']['items'] | []>([])
  const [page, setPage] = useState<number>(-1)
  const [followingToken, setFollowingToken] = useState<string>('')
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | undefined>()
  const [isFollowing, setIsFollowing] = useState<boolean[] | []>([])
  const [refreshing, setRefreshing] = useState<boolean>(false)

  const {
      sub,
      route,
      getRealmApp,
  } = props

  const userId = route?.params?.userId

  const isOwner = route?.params?.isOwner

  const realm = getRealmApp()

  const navigation = useNavigation<UserViewFollowingNavigationProp>()

  useEffect(() => {
    (async ()=> {
      try {
        if (!currentUserProfile || !(currentUserProfile?.userId)) {
          return
        }

        if (isOwner) {
          const followingProfiles = await DataStore.query(Following,
            c => c.userId('eq', userId)
              .isFollowing('eq', true), {
            page: 0,
            limit: 100,
          })

          

          if (followingProfiles?.[0]?.id) {

            setFollowing(followingProfiles as any[])
            setPage(0)

            const newIsFollowing = followingProfiles.map(_ => true)

            setIsFollowing(newIsFollowing)

            return
          }
        }

        const followingData: GraphQLResult<ListFollowingByUserQuery> = await (API
          .graphql({
            query: ListFollowingByUser,
            variables: {
              userId,
              limit: 12,
            } as ListFollowingByUserQueryVariables,
          }) as Promise<GraphQLResult<ListFollowingByUserQuery>>)


          const listFollowingByUser = followingData?.data?.listFollowingByUser?.items

          if (listFollowingByUser?.[0]?.id) {

            const nextToken = followingData?.data?.listFollowingByUser?.nextToken

            setFollowing(listFollowingByUser.filter(i => !!(i.isFollowing)))

            const newIsFollowing = await Promise.all(listFollowingByUser.filter(i => !!(i.isFollowing)).map(async (profile) => {
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
            setFollowingToken(nextToken)

          }
      } catch(e) {
        
      }
    })()
  }, [(currentUserProfile?.id)])

  useEffect(() => {
    (async () => {
      try {
        const userProfiles = await DataStore.query(UserProfile, c => c.sub('eq', sub), {
          limit: 1,
        })


        if (userProfiles && userProfiles.length > 0) {
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
              userId: following[index].userId,
              date: dayjs().format(),
              senderId: currentUserProfile.userId,
              activity: ActivityType.FOLLOW,
              objectId: following[index].id,
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
            id: following[index].followingProfileId,
          } as GetUserProfileQueryVariables,
        }) as Promise<GraphQLResult<GetUserProfileQuery>>)

      const followerData = await (API
        .graphql({
          query: UpdateUserProfile,
          variables: {
            input: {
              id: following[index].followingProfileId,
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
      if (!(currentUserProfile?.id)) {
        
        return
      }

      if (index < 0) {
        
        return
      }

      await DataStore.save(
        new Following({
          userId: currentUserProfile.userId,
          followingProfileId: following[index].followingProfileId,
          username: following[index].username,
          avatar: following[index].avatar,
          isFollowing: true,
        })
      )

    const getFollowerData = await API
      .graphql({
        query: GetFollower,
        variables: {
          userId: following[index].userId,
          followerProfileId: currentUserProfile.id,
        } as GetFollowerQueryVariables
      }) as GraphQLResult<GetFollowerQuery>

      if (getFollowerData?.data?.getFollower?.id) {

        const followerData = await (API
          .graphql({
            query: UpdateFollower,
            variables: {
              input: {
                userId: following[index].userId,
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
                userId: following[index]?.userId,
                followerProfileId: currentUserProfile.id,
                avatar: currentUserProfile.avatar,
                username: currentUserProfile.username,
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
            id: following[index].followingProfileId,
          } as GetUserProfileQueryVariables,
        }) as Promise<GraphQLResult<GetUserProfileQuery>>)

      

      const followerData = await (API
        .graphql({
          query: UpdateUserProfile,
          variables: {
            input: {
              id: following[index]?.followingProfileId,
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
        .followingProfileId('eq', following[index].followingProfileId)
      .userId('eq', currentUserProfile.userId),
      {
        limit: 1,
      })

      if (toDeletes && toDeletes.length > 0) {
        const [toDelete] = toDeletes
        await DataStore.delete(toDelete)
      }

      const getFollowerData = await API
        .graphql({
          query: GetFollower,
          variables: {
            userId: following[index].userId,
            followerProfileId: currentUserProfile.id,
          } as GetFollowerQueryVariables
        }) as GraphQLResult<GetFollowerQuery>


      const followerData = await (API
        .graphql({
          query: UpdateFollower,
          variables: {
            input: {
              userId: following[index].userId,
              followerProfileId: currentUserProfile.id,
              _version: getFollowerData?.data?.getFollower?._version,
              isFollower: false,
            }
          } as UpdateFollowerMutationVariables
        })) as GraphQLResult<UpdateFollowerMutation>

      await removeFollowerProfileCount(index)
      await removeFollowingProfileCount()

      
      const newIsFollowing = [
        ...isFollowing.slice(0, index),
        false,
        ...isFollowing.slice(index + 1)
      ]

      setIsFollowing(newIsFollowing)
    } catch(e) {
      
    }
  }

  const loadMoreFollowing = async () => {
    try {
      if (!currentUserProfile || !(currentUserProfile && currentUserProfile.userId)) {
        return
      }

      if (following?.length < 100) {
        
        return
      }

      if (isOwner) {
        const followingProfiles = await DataStore.query(Following,
          c => c.userId('eq', userId)
            .isFollowing('eq', true), {
          page: page + 1,
          limit: 100,
        })

        if (followingProfiles?.[0]?.id) {
          setFollowing([
            ...following,
            ...(followingProfiles) as any[],
          ])

          setPage(page + 1)

          const newIsFollowing = followingProfiles.map(_ => true)

          setIsFollowing([
            ...isFollowing,
            ...newIsFollowing,
          ])

          return
        }
      }

      if (!followingToken) {
        
        return
      }

      const followingData: GraphQLResult<ListFollowingByUserQuery> = await (API
        .graphql({
          query: ListFollowingByUser,
          variables: {
            userId,
            limit: 12,
            nextToken: followingToken,
          } as ListFollowingByUserQueryVariables,
        }) as Promise<GraphQLResult<ListFollowingByUserQuery>>)


        const listFollowingByUser = followingData?.data?.listFollowingByUser?.items

        if (listFollowingByUser?.[0]?.id) {

          const nextToken = followingData?.data?.listFollowingByUser?.nextToken

          setFollowing([
            ...following,
            ...(listFollowingByUser.filter(i => !!(i.isFollowing))),
          ])
          const newIsFollowing = await Promise.all(listFollowingByUser.filter(i => !!(i.isFollowing)).map(async (profile) => {
            try {
              const currentUserFollowing = await DataStore.query(Following,
                c => c.userId('eq', currentUserProfile.userId)
                .followingProfileId('eq', profile.id), {
                  limit: 1
                })

              if (currentUserFollowing && currentUserFollowing.length > 0) {
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
          setFollowingToken(nextToken)

      }
    } catch(e) {
      
    }

  }

  const refreshFollowing = async () => {
    try {
      if (!currentUserProfile || !(currentUserProfile && currentUserProfile.userId)) {
        return
      }

      setRefreshing(true)

      if (isOwner) {
        const followingProfiles = await DataStore.query(Following,
          c => c.userId('eq', userId)
            .isFollowing('eq', true), {
          page: 0,
          limit: 100,
        })

        if (followingProfiles?.[0]?.id) {
          setFollowing(followingProfiles as any[])

          setPage(0)

          const newIsFollowing = followingProfiles.map(_ => true)

          setIsFollowing(newIsFollowing)
          setRefreshing(false)

          return
        }
      }

      const followingData: GraphQLResult<ListFollowingByUserQuery> = await (API
        .graphql({
          query: ListFollowingByUser,
          variables: {
            userId,
            limit: 12,
          } as ListFollowingByUserQueryVariables,
        }) as Promise<GraphQLResult<ListFollowingByUserQuery>>)


        const listFollowingByUser = followingData?.data?.listFollowingByUser?.items

        if (listFollowingByUser?.[0]?.id) {

          const nextToken = followingData?.data?.listFollowingByUser?.nextToken

          setFollowing(listFollowingByUser.filter(i => !!(i.isFollowing)))
          const newIsFollowing = await Promise.all(listFollowingByUser.filter(i => !!(i.isFollowing)).map(async (profile) => {
            try {
              const currentUserFollowing = await DataStore.query(Following,
                c => c.userId('eq', currentUserProfile.userId)
                .followingProfileId('eq', profile.id), {
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
          setFollowingToken(nextToken)
          setRefreshing(false)
        }

    } catch(e) {
      
      setRefreshing(false)
    }
  }

  const navigateToProfile = (index: number) => {
    navigation.navigate('UserViewProfile', {
      profileId: following[index].followingProfileId,
      username: following[index].username,
      isUpdate: uuid(),
    })
  }

  return (
    <Box flex={1}>
      {
        following?.length > 0
        ? (
          <Box>
            <FlatList
              data={following.filter(p => (p?._deleted !== true))}
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
              onEndReached={loadMoreFollowing}
              refreshing={refreshing}
              onRefresh={refreshFollowing}
            />
          </Box>
        ) : null
      }
    </Box>
  )

}

export default UserViewFollowing
