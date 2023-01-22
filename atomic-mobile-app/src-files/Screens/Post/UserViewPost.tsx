import React, { useState, useEffect } from 'react'
import {
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Dimensions,
  Appearance,
 } from 'react-native'
 import FastImage from 'react-native-fast-image'
import { GraphQLResult, API } from '@aws-amplify/api'

import {
  SharedElement, SharedElementsComponentConfig
} from 'react-navigation-shared-element'
import { dayjs } from '@app/date-utils'

import { useNavigation, RouteProp } from '@react-navigation/native'

import { Menu } from 'react-native-paper'

import { btoa } from 'react-native-quick-base64'

import Ionicons from 'react-native-vector-icons/Ionicons'
import FontAwesome from 'react-native-vector-icons/FontAwesome'

import {
  
  ActivityType,
} from '@models'

import {
  Post as PostRealm,
} from '@realm/Post'

import CreateActivity from '@graphql/Mutations/CreateActivity'
import DeletePost from '@graphql/Mutations/DeletePost'
import CreatePostLike from '@graphql/Mutations/CreatePostLike'
import UpdatePostLike from '@graphql/Mutations/UpdatePostLike'

import ListPostLikesByPost from '@graphql/Queries/ListPostLikesByPost'
import GetPost from '@graphql/Queries/GetPost'

import {
  CreateActivityMutation,
  CreateActivityMutationVariables,
  DeletePostMutation,
  DeletePostMutationVariables,

  ListPostLikesByPostQueryVariables,
  ListPostLikesByPostQuery,
  CreatePostLikeMutation,
  CreatePostLikeMutationVariables,

  UpdatePostLikeMutation,
  UpdatePostLikeMutationVariables,
  GetPostQuery,
  GetPostQueryVariables,
} from '@app/API'

import {
  UserViewPostNavigationProp,
} from '@post/PostNavigationTypes'


const bucketName = 'YOUR-PUBLIC-POST-S3-IMAGE-BUCKET'
const bucketNameProfile = 'YOUR-S3-PROFILE-COMPRESSED-BUCKET'


const PUBLICIMAGEAPI = 'YOUR-CLOUDFRONT-PUBLIC-IMAGE-API'
const PUBLICPROFILEIMAGEAPI = 'YOUR-CLOUDFRONT-PROFILE-IMAGE-API'

import Box from '@components/common/Box'
import Text from '@components/common/Text'

import { palette } from '@theme/theme'


const { width: winWidth } = Dimensions.get('window')

const dark = Appearance.getColorScheme() === 'dark'

const buildImageURL = (fileKey: string) => {

  return `${PUBLICIMAGEAPI}/${btoa(JSON.stringify({
    bucket: bucketName,
    key: fileKey,
    edits: {
      resize: {
        width: winWidth,
        height: winWidth,
        fit: 'contain',
        background: dark ? { r: 0, g: 0, b: 0, alpha: 0 } : { r: 255, g: 255, b: 255, alpha: 0 },
      },
    },
  }))}`
}

const buildProfileURL = (fileKey: string) => {

  return `${PUBLICPROFILEIMAGEAPI}/${btoa(JSON.stringify({
    bucket: bucketNameProfile,
    key: fileKey,
    edits: {
      resize: {
        width: 20,
        height: 20,
        fit: 'cover',
      },
    },
    }))}`}



type RootRouteStackParamList = {
  UserViewPost: {
    postId?: string,
    userId?: string,
    userAvatar?: string,
    username?: string,
    profileId?: string,
  },
}

type UserViewPostRouteProp = RouteProp<
  RootRouteStackParamList,
  'UserViewPost'>

type Props = {
  route?: UserViewPostRouteProp,
  post?: GetPostQuery['getPost'],
  userId?: string,
  userAvatar?: string,
  username?: string,
  profileId?: string,
  handleExternalData?: () => void,
  getRealmApp?: () => Realm,
}

const styles = StyleSheet.create({
  profilePicture: {
    borderRadius: 40 / 2,
    height: 40,
    width: 40,
    overflow: 'hidden',
    padding: 1,
    borderWidth: 1,
    borderColor: palette.purplePrimary,
  },
  comment: {
  borderWidth: 1,
  borderColor: 'rgba(0, 0, 0, 0.6)',
  borderRadius: 20,
  },
})


function UserViewPost(props: Props) {
  const [liked, setLiked] = useState<boolean>(false)
  const [truncated, setTruncated] = useState<boolean>(true)
  const [postLike, setPostLike] = useState<CreatePostLikeMutation['createPostLike'] | undefined>()
  const [isMenu, setIsMenu] = useState<boolean>(false)


  const routePostId = props?.route?.params?.postId
  const getRealmApp = props?.getRealmApp
  const routeUserId = props?.route?.params?.userId
  const routeUserAvatar = props?.route?.params?.userAvatar
  const routeUsername = props?.route?.params?.username
  const routeProfileId = props?.route?.params?.profileId

  

  let routePost: PostRealm
  let realm: Realm

  if (routePostId) {
    realm = getRealmApp()
    routePost = realm.objectForPrimaryKey<PostRealm>('Post', routePostId)
  }

  

  const paramPost = props?.post
  const paramUserId = props?.userId
  const paramUserAvatar = props?.userAvatar
  const paramUsername = props?.username
  const paramProfileId = props?.profileId

  const handleExternalData = props?.handleExternalData

  const userId = paramUserId || routeUserId
  const userAvatar = paramUserAvatar || routeUserAvatar
  const username = paramUsername || routeUsername
  const profileId = paramProfileId || routeProfileId

  const [post, setPost] = useState<GetPostQuery['getPost']>(paramPost)

  useEffect(() => {
    (async () => {
      try {
        if (!(routePost?.id) && !routePostId) {
          return
        }

        const getPostData = await API
          .graphql({
            query: GetPost,
            variables: {
              id: (routePost?.id || routePostId),
            } as GetPostQueryVariables
          }) as GraphQLResult<GetPostQuery>

        if (getPostData?.data?.getPost) {
          setPost(getPostData?.data?.getPost)
          
        }
      } catch(e) {
        
      }
    })()
  }, [routePost?.id])

  useEffect(() => {
    (async () => {
      try {
        if (!(post?.id)) {
          return
        }

        const postLikeData = await API.
          graphql({
            query: ListPostLikesByPost,
            variables: {
              postId: post?.id,
              limit: 100,
            } as ListPostLikesByPostQueryVariables
          }) as GraphQLResult<ListPostLikesByPostQuery>

        const postLikes = postLikeData?.data?.listPostLikesByPost?.items

        

        if (postLikes?.[0]?.isLike) {
          const [newPostLike] = postLikes
          setPostLike(newPostLike)
          setLiked(true)
        }
      } catch(e) {
        
      }
    })()
  }, [post?.id])


  const navigation = useNavigation<UserViewPostNavigationProp>()

  const showMenu = () => setIsMenu(true)

  const hideMenu = () => setIsMenu(false)

  const removePost = async () => {
    try {

      const deletedPost = await API.
        graphql({
          query: DeletePost,
          variables: {
            input: {
              id: post?.id,
              _version: post?._version,
            }
          } as DeletePostMutationVariables
        }) as GraphQLResult<DeletePostMutation>
        
        if (handleExternalData) {
          handleExternalData()
        }
    } catch(e) {
      
    }
  }

  const navigateToUpdatePost = () => {
    navigation?.navigate('UserUpdatePost', {
      postId: post?.id,
    })
  }

  const createPostLikeActivity = async () => {
    try {
      await (API.
        graphql({
          query: CreateActivity,
          variables: {
            input: {
              userId: post.userId,
              date: dayjs().format(),
              senderId: userId,
              activity: ActivityType.LIKE,
              objectId: post.id,
              sendername: username,
              ttl: dayjs().add(14, 'd').unix(),
            },
          } as CreateActivityMutationVariables,
        }) as Promise<GraphQLResult<CreateActivityMutation>>)
    } catch(e) {
      
    }
  }


  const likePost = async () => {
    try {

      const postLikeData = await API.
        graphql({
          query: CreatePostLike,
          variables: {
            input: {
              postId: post.id,
              userId,
              username,
              isLike: true,
              ttl: dayjs().add(5, 'y').unix(),
            }
          } as CreatePostLikeMutationVariables
        }) as GraphQLResult<CreatePostLikeMutation>

      const newPostLike = postLikeData?.data?.createPostLike
      setPostLike(newPostLike)
      setLiked(true)
      
      await createPostLikeActivity()
    } catch(e) {
      
    }
  }

  const unlikePost = async () => {
    try {
      if (postLike?.id) {

        const deletedLike = await API.
          graphql({
            query: UpdatePostLike,
            variables: {
              input: {
                id: postLike?.id,
                isLike: false,
                _version: postLike?._version},
            } as UpdatePostLikeMutationVariables
          }) as GraphQLResult<UpdatePostLikeMutation>

          
          setLiked(false)
        return setPostLike(undefined)
      }
      
    } catch(e) {
      
    }
  }


  const navigateToComments = () => navigation?.navigate('UserCommentPost', {
                                                      postId: post.id,
                                                      commentCount: post.commentCount,
                                                      userId,
                                                      userAvatar,
                                                      username,
                                                      profileId,
                                                      postUserId: post.userId,
                                                      postUserName: post.username,
                                                     })

  const navigateToProfile = () => navigation?.navigate('Home', {
    screen: 'UserToDoAndPostsTabNavigation',
    params: {
      screen: 'UserListPosts',
      params: {
        screen: 'UserProfileStackNavigation',
        params: {
          screen: 'UserViewProfile',
          params: {
            profileId: post?.profileId, username: post?.username,
          }
        }
      }
    }
  })

  const truncate = (str: string) => {
    if ((str.length > 85)) {
      return str.substr(0, 84) + '\u2026'
    }
    return str
  }

  const untruncate = () => {
    setTruncated(false)
    if (handleExternalData) {
      handleExternalData()
    }
  }

  const hide = () => {
    setTruncated(true)
  }


  return (
    <Box flex={1} justifyContent="center">
      <Box flex={1} m={{ phone: 's', tablet: 'm' }} flexDirection="row" justifyContent="space-between">
        <Box flex={1}>
          <Box>
            { post?.avatar
            ? (
              <FastImage
                source={{ uri: buildProfileURL(post.avatar)}}
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
          <Box>
            {post?.username
              ? (
                <TouchableOpacity onPress={navigateToProfile}>
                  <Text variant="username">
                    {post.username}
                  </Text>
                </TouchableOpacity>
              ) : null
            }
          </Box>
        </Box>
        <Box flex={3} flexDirection="row" justifyContent="flex-end">
          {
            (post?.userId === userId)
            ? (
              <Menu
                visible={isMenu}
                onDismiss={hideMenu}
                anchor={(
                  <Pressable hitSlop={30} onPress={showMenu}>
                    <Text variant="subheader">{"\u20DB"}</Text>
                  </Pressable>
                )}
               >
                 <Menu.Item title="Update" onPress={() => { hideMenu(); navigateToUpdatePost() }} />
                 <Menu.Item title="Remove" onPress={() => { hideMenu(); removePost() }} />
               </Menu>
            ) : null
          }
        </Box>
      </Box>
      <Box flex={10}>
        <SharedElement id="image">
          { post?.image
            &&
            (
              <FastImage
                source={{ uri: buildImageURL(post.image)}}
                style={{width: winWidth, height: winWidth }}
              />
          )}
        </SharedElement>
      </Box>
      <Box flex={3} m={{ phone: 's', tablet: 'm' }}>
        <Box flex={2} flexDirection="row" justifyContent="space-between">
          <Box flexDirection="row" justifyContent="flex-start">
            <Box>
              {liked
                ? (
                  <TouchableOpacity onPress={unlikePost}>
                    <Ionicons name="heart-sharp" size={24} color={dark ? palette.white : palette.purplePrimary} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={likePost}>
                    <Ionicons name="heart-outline" size={24} color={dark ? palette.white : palette.purplePrimary} />
                  </TouchableOpacity>
                )}
            </Box>
            <Box ml="s">
              <TouchableOpacity onPress={navigateToComments}>
                <FontAwesome name="comment-o" size={24} color={dark ? palette.white : palette.purplePrimary} />
              </TouchableOpacity>
            </Box>
          </Box>
        </Box>
        <Box flex={1}>
          {post?.caption
            && truncated
             ? (
               <Box flex={1} flexDirection="row">
                 <Text variant="body">
                   {truncate(post.caption)}
                 </Text>
                 {post?.caption?.length > 84
                   ? (
                     <TouchableOpacity onPress={untruncate}>
                       <Text color="greyLink" variant="body">
                         More
                       </Text>
                     </TouchableOpacity>
                   ) : null}
               </Box>
             )
              : (
                <Box flex={1} flexDirection="row">
                  <Text variant="body">
                    {post?.caption}
                  </Text>
                  {post?.caption?.length > 84
                    ? (
                      <TouchableOpacity onPress={hide}>
                        <Text color="greyLink" variant="body">
                          Hide
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                </Box>
              )}
        </Box>
        <Box flex={0.5}>
          {
            post?.commentCount
            ? (
              <TouchableOpacity onPress={navigateToComments}>
                  {post?.commentCount === 1
                    ? (
                      <Text variant="greyComment">
                        View 1 comment
                      </Text>
                    ) : (
                      <Text variant="greyComment">
                        {`View all ${post?.commentCount} comments`}
                      </Text>
                    )}
              </TouchableOpacity>
            ) : null
          }
        </Box>
      </Box>
    </Box>
  )

}

const defaultItem = 'image'

const sharedElements: SharedElementsComponentConfig = (
  route,
) => {

  const item = route.params.post.id || defaultItem

  return [
    {id: item},
  ]
}

UserViewPost.sharedElements = sharedElements

export default UserViewPost
