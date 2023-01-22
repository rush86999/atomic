import React, { useState, useEffect } from 'react'
import {
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
} from 'react-native'
import { DataStore } from '@aws-amplify/datastore'
import { GraphQLResult, API } from '@aws-amplify/api'
import TouchableScale from 'react-native-touchable-scale'
import {SharedElement} from 'react-navigation-shared-element'
import FastImage from 'react-native-fast-image'
import { dayjs } from '@app/date-utils'

import { useNavigation, RouteProp } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'

import { btoa } from 'react-native-quick-base64'

import Box from '@components/common/Box'
import Text from '@components/common/Text'
import Button from '@components/Button'

import { palette } from '@theme/theme'

import {
  UserProfile,
  Following,
  ActivityType,
} from '@models'

import ListPostsByUserId from '@graphql/Queries/ListPostsByUserId'
import GetUserProfile from '@graphql/Queries/GetUserProfile'
import GetFollower from '@graphql/Queries/GetFollower'


import CreateFollower from '@graphql/Mutations/CreateFollower'
import UpdateFollower from '@graphql/Mutations/UpdateFollower'
import CreateActivity from '@graphql/Mutations/CreateActivity'
import UpdateUserProfile from '@graphql/Mutations/UpdateUserProfile'

import {
  UpdateUserProfileMutation,
  UpdateUserProfileMutationVariables,
  ListPostsByUserIdQuery,
  ListPostsByUserIdQueryVariables,
  GetUserProfileQuery,
  GetUserProfileQueryVariables,
  CreateFollowerMutationVariables,
  CreateActivityMutation,
  CreateActivityMutationVariables,
  GetFollowerQuery,
  GetFollowerQueryVariables,
  UpdateFollowerMutationVariables,
  UpdateFollowerMutation,
} from '@app/API'

const bucketName = 'YOUR S3 COMPRESSED IMAGE BUCKET FOR IMAGES'
const bucketNameProfile = 'YOUR S3 COMPRESSED IMAGE BUCKET FOR PROFILE IMAGES'

const PUBLICIMAGEAPI = 'YOUR AWS SERVERLESS IMAGE HANDLER CLOUDFRONT URL FOR IMAGES'
const PUBLICPROFILEIMAGEAPI = 'YOUR AWS SERVERLESS IMAGE HANDLER CLOUDFRONT URL FOR PROFILE IMAGES'

const buildImageURL = (fileKey: string) => `${PUBLICIMAGEAPI}/${btoa(JSON.stringify({
  bucket: bucketName,
  key: fileKey,
  edits: {
    resize: {
      width: 150,
      height: 150,
      fit: 'cover',
    },
  },
}))}`

const buildProfileURL = (fileKey: string) => {
  return `${PUBLICPROFILEIMAGEAPI}/${btoa(JSON.stringify({
    bucket: bucketNameProfile,
    key: fileKey,
    edits: {
      resize: {
        width: 110,
        height: 110,
        fit: 'cover',
      },
    },
  }))}`
}

type RootNavigationStackParamList = {
  UserViewPost: {
    postId: string,
    userId: string,
    userAvatar: string,
    username: string,
    profileId: string,
   },
  UserViewProfile: undefined,
  UserEditProfile: {
    userProfileId: string,
  },
  UserViewFollowing: {
    userId: string,
    isOwner: boolean,
  },
  UserViewFollowers: {
    userId: string,
  }
}

type UserViewProfileNavigationProp = StackNavigationProp<
  RootNavigationStackParamList,
  'UserViewProfile'
>

type RootRouteStackParamList = {
  UserViewProfile: {
    profileId?: string,
    username?: string,
    isUpdate?: string,
  },
}

type UserViewProfileRouteProp = RouteProp<
  RootRouteStackParamList,
  'UserViewProfile'>

type Props = {
  route?: UserViewProfileRouteProp,
  sub: string,
  getRealmApp: () => Realm,
}

const { width: winWidth } = Dimensions.get('window')

const styles = StyleSheet.create({
  profilePicture: {
    borderRadius: 110 / 2,
    height: 110,
    width: 110,
    overflow: 'hidden',
    padding: 1,
    borderWidth: 1,
    borderColor: palette.purplePrimary,
    margin: 10,
  },
  imageThumbnail: {
    justifyContent: 'center',
    alignItems: 'center',
    height: (winWidth - 4) / 3,
    width: (winWidth - 4) / 3,
  },
})

function UserViewProfile(props: Props) {
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | undefined>()
  const [selectedUserProfile, setSelectedUserProfile] = useState<any | undefined>()
  const [isFollowing, setIsFollowing] = useState<boolean>(false)
  const [posts, setPosts] = useState<ListPostsByUserIdQuery['listPostsByUserId']['items']>([])
  const [postToken, setPostToken] = useState<string>('')
  const [refreshing, setRefreshing] = useState<boolean>(false)

  const {
    sub,
    getRealmApp,
  } = props

  const realm = getRealmApp()

  const profileId = props?.route?.params?.profileId
  const username = props?.route?.params?.username
  const isUpdate = props?.route?.params?.isUpdate
  
  
  const navigation = useNavigation<UserViewProfileNavigationProp>()

  useEffect(() => {
    (async () => {
      try {
        if (!selectedUserProfile || !(selectedUserProfile?.userId)) {
          return
        }

        if (!currentUserProfile || !(currentUserProfile?.userId)) {
          return
        }

        if (selectedUserProfile.userId === currentUserProfile.userId) {


          const postData: GraphQLResult<ListPostsByUserIdQuery> = await (API
            .graphql({
              query: ListPostsByUserId,
              variables: {
                userId: currentUserProfile.userId,
                sortDirection: 'DESC',
                limit: 12,
              } as ListPostsByUserIdQueryVariables,
            }) as Promise<GraphQLResult<ListPostsByUserIdQuery>>)

          const items = postData?.data?.listPostsByUserId?.items

          const newToken = postData?.data?.listPostsByUserId?.nextToken

          if (items?.length > 0) {

            setPosts(items)
            setPostToken(newToken)
          }

          return
        }

        const postData: GraphQLResult<ListPostsByUserIdQuery> = await (API
          .graphql({
            query: ListPostsByUserId,
            variables: {
              userId: selectedUserProfile.userId,
              sortDirection: 'DESC',
              limit: 12,
            } as ListPostsByUserIdQueryVariables,
          }) as Promise<GraphQLResult<ListPostsByUserIdQuery>>)


        const items = postData?.data?.listPostsByUserId?.items

        const newToken = postData?.data?.listPostsByUserId?.nextToken

        if (items?.length > 0) {

          setPosts(items)
          setPostToken(newToken)
        }

      } catch(e) {
      }
    })()
  }, [selectedUserProfile?.userId])

  useEffect(() => {
    (async () => {
      try {
        const userProfiles = await DataStore.query(UserProfile, c => c.sub('eq', sub), {
          limit: 1,
        })
        

        if (userProfiles?.[0]?.id) {
          setCurrentUserProfile(userProfiles?.[0])

          
          if (userProfiles[0]?.id === profileId) {
            setSelectedUserProfile(userProfiles?.[0])
          } else if (!profileId) {
            
            setSelectedUserProfile(userProfiles?.[0])
          }
        }
      } catch(e) {
        
      }
    })()
  }, [])

  useEffect(() => {
    (async () => {
      try {
        
        
        if (!(currentUserProfile?.id)) {
          return
        }

        if (!profileId) {

          return
        }

        if (currentUserProfile?.id === profileId) {
          return
        }
        const userProfileData: GraphQLResult<GetUserProfileQuery> = await (API
          .graphql({
            query: GetUserProfile,
            variables: {
              id: profileId,
            } as GetUserProfileQueryVariables,
          }) as Promise<GraphQLResult<GetUserProfileQuery>>)

        const getUserProfile = userProfileData?.data?.getUserProfile
        if (getUserProfile?.id) {
          setSelectedUserProfile(getUserProfile)

          
        }


      } catch(e) {
        
      }
    })()
  }, [(currentUserProfile?.id), isUpdate])

  useEffect(() => {
    (async () => {
      if (!currentUserProfile || !(currentUserProfile && currentUserProfile.userId)) {
        return
      }
      try {

        const followingData = await DataStore.query(Following, c => c.followingProfileId('eq', profileId)
        .userId('eq', currentUserProfile.userId))

        if (followingData?.[0]?.id) {
          setIsFollowing(true)
        }
      } catch(e) {
        
      }
    })()
  }, [(currentUserProfile?.userId)])


  const createActivity = async () => {
    if (!username || !(selectedUserProfile?.id)) {
      
      return
    }
    try {
      await (API.
        graphql({
          query: CreateActivity,
          variables: {
            input: {
              userId: selectedUserProfile.userId,
              date: dayjs().format(),
              senderId: currentUserProfile.userId,
              activity: ActivityType.FOLLOW,
              objectId: selectedUserProfile.id,
              sendername: username,
              ttl: dayjs().add(14, 'd').unix(),
            },
          } as CreateActivityMutationVariables,
        }) as Promise<GraphQLResult<CreateActivityMutation>>)
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

  const addFollowerProfileCount = async () => {
    try {
      const userProfileData: GraphQLResult<GetUserProfileQuery> = await (API
        .graphql({
          query: GetUserProfile,
          variables: {
            id: profileId,
          } as GetUserProfileQueryVariables,
        }) as Promise<GraphQLResult<GetUserProfileQuery>>)

      const followerData = await (API
        .graphql({
          query: UpdateUserProfile,
          variables: {
            input: {
              id: profileId,
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

  const removeFollowerProfileCount = async () => {
    try {
      const userProfileData: GraphQLResult<GetUserProfileQuery> = await (API
        .graphql({
          query: GetUserProfile,
          variables: {
            id: profileId,
          } as GetUserProfileQueryVariables,
        }) as Promise<GraphQLResult<GetUserProfileQuery>>)

      

      const followerData = await (API
        .graphql({
          query: UpdateUserProfile,
          variables: {
            input: {
              id: profileId,
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

  const createFollowing = async () => {
    try {
      if (!(currentUserProfile?.id)) {
        
        return
      }

      if (!username || !(selectedUserProfile?.id)) {
        
        return
      }

      const updatedFollowing = await DataStore.save(
        new Following({
          userId: currentUserProfile.userId,
          followingProfileId: profileId,
          username,
          avatar: selectedUserProfile.avatar,
          isFollowing: true,
        })
      )

      

      const getFollowerData = await API
        .graphql({
          query: GetFollower,
          variables: {
            userId: selectedUserProfile.userId,
            followerProfileId: currentUserProfile.id,
          } as GetFollowerQueryVariables
        }) as GraphQLResult<GetFollowerQuery>

      if (getFollowerData?.data?.getFollower?.id) {

        const followerData = await (API
          .graphql({
            query: UpdateFollower,
            variables: {
              input: {
                userId: selectedUserProfile.userId,
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
                userId: selectedUserProfile.userId,
                followerProfileId: currentUserProfile.id,
                avatar: currentUserProfile.avatar,
                username: currentUserProfile.username,
                isFollower: true,
              }
            } as CreateFollowerMutationVariables,
          }))
        
      }

      await addFollowerProfileCount()
      await addFollowingProfileCount()
      await createActivity()
      setIsFollowing(true)
    } catch(e) {
      
    }
  }

  const navigateToEditProfile = async () => {
    if (!currentUserProfile) {
      try {

        return navigation.navigate('UserEditProfile', {
          userProfileId: profileId,
        })
      } catch(e) {
        
      }
    }
    navigation.navigate('UserEditProfile', {
      userProfileId: currentUserProfile?.id,
    })
  }

  const removeFollowing = async () => {
    try {
      if (!(currentUserProfile?.id)) {
        
        return
      }

      const toDeletes = await DataStore.query(Following, c => c.followingProfileId('eq', profileId)
      .userId('eq', currentUserProfile.userId),
      {
        limit: 1,
      })

      if (toDeletes?.[0]?.id) {
        const [toDelete] = toDeletes
        const deletedFollowing = await DataStore.delete(toDelete)
        
      }

      const getFollowerData = await API
        .graphql({
          query: GetFollower,
          variables: {
            userId: selectedUserProfile.userId,
            followerProfileId: currentUserProfile.id,
          } as GetFollowerQueryVariables
        }) as GraphQLResult<GetFollowerQuery>

      const followerData = await (API
        .graphql({
          query: UpdateFollower,
          variables: {
            input: {
              userId: selectedUserProfile.userId,
              followerProfileId: currentUserProfile.id,
              _version: getFollowerData?.data?.getFollower?._version,
              isFollower: false,
            }
          } as UpdateFollowerMutationVariables
        })) as GraphQLResult<UpdateFollowerMutation>

      

      await removeFollowerProfileCount()
      await removeFollowingProfileCount()

      setIsFollowing(false)
    } catch(e) {
      
    }
  }

  const navigateToPost = (post: ListPostsByUserIdQuery['listPostsByUserId']['items'][0]) => {
    
    navigation.navigate('UserViewPost', {
      postId: post?.id,
      userId: currentUserProfile.userId,
      userAvatar: currentUserProfile.avatar,
      username: currentUserProfile.username,
      profileId: profileId || currentUserProfile.id,
    })
  }

  const loadMorePosts = async (): Promise<undefined | null> => {
    try {
      if (!postToken) {
        return
      }
      if (selectedUserProfile.userId === currentUserProfile.userId) {

        const postData: GraphQLResult<ListPostsByUserIdQuery> = await (API
          .graphql({
            query: ListPostsByUserId,
            variables: {
              userId: currentUserProfile.userId,
              sortDirection: 'DESC',
              limit: 12,
              nextToken: postToken,
            } as ListPostsByUserIdQueryVariables,
          }) as Promise<GraphQLResult<ListPostsByUserIdQuery>>)

        const newPosts = postData?.data?.listPostsByUserId?.items

        const newToken = postData?.data?.listPostsByUserId?.nextToken

        if (newPosts?.length > 0) {
          setPosts([
            ...posts,
            ...newPosts,
          ])
          setPostToken(newToken)
          return
        }
      }

      const postData: GraphQLResult<ListPostsByUserIdQuery> = await (API
        .graphql({
          query: ListPostsByUserId,
          variables: {
            userId: selectedUserProfile.userId,
            sortDirection: 'DESC',
            limit: 12,
            nextToken: postToken,
          } as ListPostsByUserIdQueryVariables,
        }) as Promise<GraphQLResult<ListPostsByUserIdQuery>>)


      const items = postData?.data?.listPostsByUserId?.items

      const newToken = postData?.data?.listPostsByUserId?.nextToken

      if (items?.length > 0) {

          setPosts([
            ...posts,
            ...items,
          ])
          setPostToken(newToken)
        }

    } catch(e) {
      
    }
  }

  const refreshPosts = async () => {
    try {
      setRefreshing(true)
      if (!selectedUserProfile || !(selectedUserProfile && selectedUserProfile.userId)) {
        return
      }

      if (!currentUserProfile || !(currentUserProfile && currentUserProfile.userId)) {
        return
      }

      if (selectedUserProfile.userId === currentUserProfile.userId) {

        const postData: GraphQLResult<ListPostsByUserIdQuery> = await (API
          .graphql({
            query: ListPostsByUserId,
            variables: {
              userId: currentUserProfile.userId,
              sortDirection: 'DESC',
              limit: 12,
            } as ListPostsByUserIdQueryVariables,
          }) as Promise<GraphQLResult<ListPostsByUserIdQuery>>)

        const oldPosts = postData?.data?.listPostsByUserId?.items

        const newToken = postData?.data?.listPostsByUserId?.nextToken

        if (oldPosts?.length > 0) {
          setPosts(oldPosts)
          setPostToken(newToken)
        }

        setRefreshing(false)
        return
      }

      const postData: GraphQLResult<ListPostsByUserIdQuery> = await (API
        .graphql({
          query: ListPostsByUserId,
          variables: {
            userId: selectedUserProfile.userId,
            sortDirection: 'DESC',
            limit: 12,
          } as ListPostsByUserIdQueryVariables,
        }) as Promise<GraphQLResult<ListPostsByUserIdQuery>>)


      const items = postData?.data?.listPostsByUserId?.items

      const newToken = postData?.data?.listPostsByUserId?.nextToken

      if (items?.length > 0) {



          setPosts(items)
          setPostToken(newToken)
        }
      setRefreshing(false)
    } catch(e) {
      
      setRefreshing(false)
    }
  }

  const navigateToFollowing = () => navigation.navigate('UserViewFollowing', {
    userId: selectedUserProfile.userId,
    isOwner: currentUserProfile.userId === selectedUserProfile.userId,
  })

  const navigateToFollowers = () => navigation.navigate('UserViewFollowers', {
    userId: selectedUserProfile.userId,
  })

  

  return (
    <Box flex={1}>
      <Box flex={5}>
        <Box flex={0.6} flexDirection="row" alignItems="center" justifyContent="space-between">
          <Box flex={3} justifyContent="center" alignItems="center">
            {selectedUserProfile?.avatar
              ? (
                <FastImage
                  source={{ uri: buildProfileURL(selectedUserProfile.avatar) }}
                  style={styles.profilePicture}
                  resizeMode={FastImage.resizeMode.contain}
                />
              ) : (
                <FastImage
                  source={require('../../assets/icons/defaultProfileImage.png')}
                  style={styles.profilePicture}
                  resizeMode={FastImage.resizeMode.contain}
                />
              )}
          </Box>
          <Box flex={7} justifyContent="center" alignItems="center">
            <Box flex={1} m={{ phone: 's', tablet: 'm' }} flexDirection="row" justifyContent="space-around" alignItems="center">
              <Box flex={1}>
                <Text textAlign="center" variant="comment">
                  {selectedUserProfile?.postCount ? selectedUserProfile?.postCount : 0}
                </Text>
                <Text textAlign="center" variant="comment">
                  Posts
                </Text>
              </Box>
              <Box flex={1}>
                <TouchableOpacity onPress={navigateToFollowers}>

                    {selectedUserProfile?.followerCount
                      ? (
                        <Text textAlign="center" variant="comment">
                          {selectedUserProfile?.followerCount}
                        </Text>
                      )
                      : (
                        <Text textAlign="center" variant="comment">
                          {0}
                        </Text>
                        )}

                  <Text textAlign="center" variant="comment">
                    Followers
                  </Text>
                </TouchableOpacity>
              </Box>
              <Box flex={1}>
                <TouchableOpacity onPress={navigateToFollowing}>
                  {selectedUserProfile?.followingCount
                    ? (
                      <Text textAlign="center" variant="comment">
                        {selectedUserProfile?.followingCount}
                      </Text>
                    )
                    : (
                      <Text textAlign="center" variant="comment">
                        {0}
                      </Text>
                      )}
                  <Text textAlign="center" variant="comment">
                    Following
                  </Text>
                </TouchableOpacity>
              </Box>
            </Box>
          </Box>
        </Box>
        {selectedUserProfile?.bio
          ? (
            <Box flex={0.2} justifyContent="center">
              <Text variant="body">
                {selectedUserProfile?.bio}
              </Text>
            </Box>
          ) : null}
        <Box flex={0.2} justifyContent="center" alignItems="center">
          {((currentUserProfile?.id === profileId) || !profileId)
          ? (
            <TouchableOpacity onPress={navigateToEditProfile}>
              <Text textAlign="center" variant="optionHeader">
                Edit Profile
              </Text>
            </TouchableOpacity>
          ) : (
            <Box>
              {
                isFollowing
                ? (
                  <Button following onPress={removeFollowing}>
                    Following
                  </Button>
                ) : (
                  <Button onPress={createFollowing}>
                    Follow
                  </Button>
                )
              }
          </Box>
          )}
        </Box>
      </Box>
      <Box flex={5}>
        {
          posts?.length > 0
          ? (
            <Box>
              <FlatList
                data={posts.filter(p => (p?._deleted !== true))}
                keyExtractor={item => item.id}
                numColumns={3}
                renderItem={({ item }) => (
                  <TouchableScale
                    style={{ flex: 1}}
                    activeScale={0.9}
                    tension={50}
                    friction={7}
                    useNativeDriver
                    onPress={() => navigateToPost(item)}
                  >
                    <Box flex={1} style={{ margin: 1 }}>
                      <SharedElement id={item.id}>
                        <FastImage
                          source={{ uri: buildImageURL(item.image) }}
                          style={styles.imageThumbnail}
                        />
                      </SharedElement>
                    </Box>
                </TouchableScale>
                )}
                onEndReachedThreshold={0.3}
                onEndReached={loadMorePosts}
                refreshing={refreshing}
                onRefresh={refreshPosts}
              />
            </Box>
          ) : null
        }
      </Box>
    </Box>
  )
}

export default UserViewProfile
