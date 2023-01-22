import React, { useState, useEffect, useRef } from 'react'
import {
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  KeyboardAvoidingView,
  Dimensions,
  Image,
  FlatList,
  Pressable,
} from 'react-native'

import { GraphQLResult, API } from '@aws-amplify/api'
import { TextField } from 'react-native-ui-lib'
import { useHeaderHeight } from '@react-navigation/elements'
import { dayjs } from '@app/date-utils'

import Toast from 'react-native-toast-message'
import { useNavigation, RouteProp } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'

import { btoa } from 'react-native-quick-base64'

import Box from '@components/common/Box'
import Text from '@components/common/Text'

import { palette } from '@theme/theme'

import {
  Comment, ActivityType,
} from '@models'

import {
  Comment as CommentRealm,
} from '@realm/Comment'


import  ListCommentsByPost from '@graphql/Queries/ListCommentsByPost'
import GetComment from '@graphql/Queries/GetComment'


import CreateActivity from '@graphql/Mutations/CreateActivity'
import CreateComment from '@graphql/Mutations/CreateComment'
import DeleteComment from '@graphql/Mutations/DeleteComment'
import UpdatePost from '@graphql/Mutations/UpdatePost'
import GetPost from '@graphql/Queries/GetPost'

import {
  UpdatePostMutationVariables,
  ListCommentsByPostQuery,
  ListCommentsByPostQueryVariables,
  CreateActivityMutation,
  CreateActivityMutationVariables,
  CreateCommentMutation,
  CreateCommentMutationVariables,
  DeleteCommentMutation,
  DeleteCommentMutationVariables,
  GetCommentQuery,
  GetCommentQueryVariables,
  GetPostQuery,
  GetPostQueryVariables,
} from '@app/API'


const PUBLICPROFILEIMAGEAPI = 'YOUR-PROFILE-IMAGE-API-CLOUDFRONT'

const bucketName = 'YOUR-S3-PROFILE-BUCKET-COMPRESSED'

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
  UserCommentPost: undefined,
  UserViewProfile: {
    profileId: string,
    username: string,
  }
}

  type UserCommentPostNavigationProp = StackNavigationProp<
    RootNavigationStackParamList,
    'UserCommentPost'
  >

  type RootRouteStackParamList = {
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
    RootRouteStackParamList,
    'UserCommentPost'>

  type Props = {
    route: UserCommentPostRouteProp,
    sub: string,
    getRealmApp: () => Realm,
  }

  const { width: winWidth } = Dimensions.get('window')

  const styles = StyleSheet.create({
    comment: {
      width: winWidth,
    },
    commentInput: {
      borderWidth: 1,
      borderColor: 'rgba(0, 0, 0, 0.6)',
      borderRadius: 20,
    },
    profilePicture: {
      borderRadius: 40 / 2,
      height: 40,
      width: 40,
      overflow: 'hidden',
      padding: 1,
      borderWidth: 1,
      borderColor: palette.purplePrimary,
    },
    miniProfilePicture: {
      borderRadius: 40 / 2,
      height: 40,
      width: 40,
      overflow: 'hidden',
      padding: 1,
    },
    microProfilePicture: {
      borderRadius: 20 / 2,
      height: 20,
      width: 20,
      overflow: 'hidden',
      padding: 1,
    },
  })

  type keyEvent = {
    nativeEvent: {
      key: string,
    }
  }

  type renderElement = {
    item: Comment,
    index: number,
  }

  function UserCommentPost(props: Props) {
    const [comment, setComment] = useState<string>('')
    const [replyId, setReplyId] = useState<string>('')
    const [replyIndex, setReplyIndex] = useState<number>(-2)
    const [commentToken, setCommentToken] = useState<string>('')
    const [replyRouteComments, setReplyRouteComments] = useState<ListCommentsByPostQuery['listCommentsByPost']['items']>([])
    const [post, setPost] = useState<GetPostQuery['getPost']>()

    const textFieldEl = useRef(null)

    const {
    } = props

    const postId = props?.route?.params?.postId
    const commentCount = props?.route?.params?.commentCount
    const userId = props?.route?.params?.userId
    const userAvatar = props?.route?.params?.userAvatar
    const username = props?.route?.params?.username
    const profileId = props?.route?.params?.profileId
    const postUserId = props?.route?.params?.postUserId
    const postUserName = props?.route?.params?.postUserName
    const commentId = props?.route?.params?.commentId
    const getRealmApp = props?.getRealmApp

    const [localCommentCount, setLocalComment] = useState<number>(commentCount)

    const realm = getRealmApp()

    let commentRealm: CommentRealm | undefined

    if (commentId) {
      commentRealm = realm.objectForPrimaryKey<CommentRealm>('Comment', commentId)
    }

    const height = useHeaderHeight()

    const [comments, setComments] = useState<ListCommentsByPostQuery['listCommentsByPost']['items']>([])

    useEffect(() => {
      (async () => {
        try {
          const commentData: GraphQLResult<ListCommentsByPostQuery> = await (API.
            graphql({
              query: ListCommentsByPost,
              variables: {
                postId,
                sortDirection: 'ASC',
                limit: 5,
                nextToken: commentToken || undefined,
              } as ListCommentsByPostQueryVariables,
            }) as Promise<GraphQLResult<ListCommentsByPostQuery>>)


          const listCommentsByPost = commentData?.data?.listCommentsByPost?.items

          if (listCommentsByPost?.[0]?.id) {

            const nextToken = commentData?.data?.listCommentsByPost?.nextToken


            const newComments = []

            for (let i = 0; i < listCommentsByPost.length; i++) {
              const value = listCommentsByPost[i]

              let replyComments: any[] = []

              for (let j = 0; j < listCommentsByPost.length; j++) {

                  const replyValue = listCommentsByPost[j]

                  if (value.id === replyValue.replyId) {
                    replyComments.push(replyValue)
                  }
              }

              if (replyComments?.[0]?.id) {
                newComments.push(value)
                newComments.concat(replyComments)
              } else {
                newComments.push(value)
              }
            }

            setComments(newComments)
            setCommentToken(nextToken)
          }

        } catch(e) {
          
        }
      })()
    }, [])

    useEffect(() => {
      (async () => {
        try {
          if (!(commentRealm?.id)) {
            return
          }

          const getCommentData = await API.
            graphql({
              query: GetComment,
              variables: {
                id: commentRealm.id,
              } as GetCommentQueryVariables
            }) as GraphQLResult<GetCommentQuery>

          

          const getComment = getCommentData?.data?.getComment

          setComments([getComment, ...comments])

        } catch(e) {
          
        }
      })()
    }, [commentRealm?.id])

    useEffect(() => {
      (async () => {
        try {
          if (!postId) {
            
            return
          }

          const postData = await API.
            graphql({
              query: GetPost,
              variables: {
                id: postId,
              } as GetPostQueryVariables
            }) as GraphQLResult<GetPostQuery>

          const newPost = postData?.data?.getPost
          
          setPost(newPost)
        } catch(e) {
          
        }
      })()
    }, [postId])

    const navigation = useNavigation<UserCommentPostNavigationProp>()

    const loadMoreComments = async () => {
      if (!postId) {
        
        return
      }

      if (!commentToken) {
        return
      }

      try {
        const commentData: GraphQLResult<ListCommentsByPostQuery> = await (API.
          graphql({
            query: ListCommentsByPost,
            variables: {
              postId,
              sortDirection: 'ASC',
              limit: 5,
              nextToken: commentToken,
            } as ListCommentsByPostQueryVariables,
          }) as Promise<GraphQLResult<ListCommentsByPostQuery>>)


        const listCommentsByPost = commentData?.data?.listCommentsByPost?.items

        if (listCommentsByPost?.[0]?.id) {

          const nextToken = commentData?.data?.listCommentsByPost?.nextToken

          const newComments = []

          for (let i = 0; i < listCommentsByPost.length; i++) {
            const value = listCommentsByPost[i]

            let replyComments: any[] = []

            for (let j = 0; j < listCommentsByPost.length; j++) {

                const replyValue = listCommentsByPost[j]

                if (value.id === replyValue.replyId) {
                  replyComments.push(replyValue)
                }
            }

            if (replyComments?.[0]?.id) {
              newComments.push(value)
              newComments.concat(replyComments)
            } else {
              newComments.push(value)
            }
          }

          setComments(comments.concat(newComments))
          setCommentToken(nextToken)
        }
      } catch(e) {
        
      }
    }

    const increaseCommentCount = async () => {
      if (!postId) {
        
        return
      }

      if (!(post?.id)) {
        
        return
      }

      try {
        const postData = await (API
          .graphql({
            query: UpdatePost,
            variables: {
              input: {
                id: postId,
                commentCount: localCommentCount + 1,
                _version: post._version,
              }
            } as UpdatePostMutationVariables
          }))

        setLocalComment(localCommentCount + 1)
        
      } catch(e) {
        
      }
    }

    const decreaseCommentCount = async () => {
      if (!postId) {
        
        return
      }

      if (!(post?.id)) {
        
        return
      }

      try {
        const postData = await (API
          .graphql({
            query: UpdatePost,
            variables: {
              input: {
                id: postId,
                commentCount: localCommentCount - 1,
                _version: post._version,
              }
            } as UpdatePostMutationVariables
          }))

        setLocalComment(localCommentCount - 1)
        
      } catch(e) {
        
      }
    }

    const createActivity = async (comment: Comment, index?: number) => {
      try {
        await (API.
          graphql({
            query: CreateActivity,
            variables: {
              input: {
                userId: postUserId,
                date: dayjs().format(),
                senderId: userId,
                activity: ActivityType.COMMENT,
                objectId: comment.id,
                sendername: username,
                ttl: dayjs().add(14, 'd').unix(),
              },
            } as CreateActivityMutationVariables,
          }) as Promise<GraphQLResult<CreateActivityMutation>>)

          if (index > -2) {
            await (API
              .graphql({
                query: CreateActivity,
                variables: {
                  input: {
                    userId: comment.userId,
                    date: dayjs().format(),
                    senderId: userId,
                    activity: ActivityType.REPLY,
                    objectId: comment.id,
                    ttl: dayjs().add(14, 'd').unix(),
                  }
                } as CreateActivityMutationVariables,
              }) as Promise<GraphQLResult<CreateActivityMutation>>)
          }
      } catch(e) {
        
      }
    }

    const onCommentPost = async () => {
      try {

        if (!comment) {
          return
        }

        const commentData: GraphQLResult<CreateCommentMutation> = await (API
          .graphql({
            query: CreateComment,
            variables: {
              input: {
                postId: postId,
                content: comment,
                date: dayjs().format(),
                userId,
                username,
                profileId,
                avatar: userAvatar,
                replyId: replyId || undefined,
                ttl: dayjs().add(3, 'y').unix(),
              }
            } as CreateCommentMutationVariables
          }) as Promise<GraphQLResult<CreateCommentMutation>>)

        const newComment = commentData?.data?.createComment

        if (replyId && (replyIndex > -1)) {
          const newComments = [
            comments[replyIndex],
            newComment,
            ...comments
          ]
          setComments(newComments)
        } else if (replyId && (replyIndex === -1)) {
          setReplyRouteComments([newComment, ...replyRouteComments])
        } else if (!replyId && (replyIndex === -2)) {
          setComments([newComment, ...comments])
        }

        await increaseCommentCount()

        await createActivity(newComment, replyIndex)

        textFieldEl?.current?.blur()
        setComment('')
      } catch(e) {
        
        Toast.show({
          type: 'error',
          text1: 'Unable to comment',
          text2: 'Unable to create comments at this time due to an internal error'
        })
      }
    }

    const deleteComment = async (index: number, commentId: string) => {
      try {
        if (!index) {
          
          return
        }

        if (!commentId) {
          
          return
        }
        const deletedComment = API.
          graphql({
            query: DeleteComment,
            variables: {
              input: {
                id: commentId,
                _version: (comments as ListCommentsByPostQuery['listCommentsByPost']['items'])?.[index]._version,
              }
            } as DeleteCommentMutationVariables
          }) as GraphQLResult<DeleteCommentMutation>

        

        await decreaseCommentCount()

      } catch(e) {
        
      }
    }

    const replyPress = (id: string, index: number) => {
      setReplyId(id)
      setReplyIndex(index)
      textFieldEl?.current?.focus()
    }

    const replyPressEl = (id: string) => {
      setReplyId(id)
      setReplyIndex(-1)
      textFieldEl?.current?.focus()
    }

    const navigateToProfile = (commentProfileId?: string) => navigation?.push('UserViewProfile', {
                                                                            profileId: commentProfileId || profileId,
                                                                            username: postUserName,
                                                                           })

    const commentRender = ({ item, index  }: renderElement) => (
      <Box style={styles.comment}>
        {
          item?.replyId
          ? (
          <Box flex={1} flexDirection="row">
            <Box flex={2} />
            <Box flex={8}>
              <Box flex={1} flexDirection="row">
                <Box flex={0.5} justifyContent="center" alignItems="center">
                  {item?.avatar
                  ? (
                    <TouchableWithoutFeedback onPress={() => navigateToProfile(item?.profileId)}>
                      <Image
                        source={{ uri: buildProfileURL(item?.avatar) }}
                        style={styles.microProfilePicture}
                      />
                    </TouchableWithoutFeedback>
                  ) : (
                    <TouchableWithoutFeedback onPress={() => navigateToProfile(item?.profileId)}>
                      <Image
                        source={require('../../assets/icons/defaultProfileImage.png')}
                        style={styles.microProfilePicture}
                      />
                    </TouchableWithoutFeedback>
                  ) }
                </Box>
                <Box>
                <Box flex={9.5}>
                  <Box mt={{ phone: 's', tablet: 'm' }} mr={{ phone: 's', tablet: 'm' }} flexDirection="row" alignItems="flex-end" justifyContent="flex-start">
                    <Text variant="comment" style={{ fontWeight: 'bold' }}>
                      {`${item?.username} `}
                    </Text>
                    <Text variant="comment">
                      {item?.content}
                    </Text>
                  </Box>
                  <Box flexDirection="row" alignItems="center" justifyContent="flex-start">
                    <Text mr={{ phone: 's', tablet: 'm' }} variant="greyComment">
                      {item?.date && (dayjs.duration(dayjs(item?.date).diff(dayjs())).humanize())}
                    </Text>
                    <Text mr={{ phone: 's', tablet: 'm' }} onPress={() => replyPress(item.id, index)}>
                      Reply
                    </Text>
                  </Box>
                </Box>
                </Box>
              </Box>
              {
                (item?.userId === userId)
                  ? (
                    <Box flexDirection="row" justifyContent="flex-end" mr={{ phone: 's', tablet: 'm' }}>
                      <Pressable onPress={() => deleteComment(
                        index,
                        item.id,
                      )}>
                        <Text variant="toDoButton">
                          Delete
                        </Text>
                      </Pressable>
                    </Box>
                  ) : null
              }
            </Box>
          </Box>
        ) : (
          <Box flex={1} flexDirection="row">
            <Box flex={2} justifyContent="center" alignItems="center">
              {item?.avatar
              ? (
                <TouchableWithoutFeedback onPress={() => navigateToProfile(item?.profileId)}>
                  <Image
                    source={{ uri: buildProfileURL(item?.avatar) }}
                    style={styles.miniProfilePicture}
                  />
                </TouchableWithoutFeedback>
              ) : (
                <TouchableWithoutFeedback onPress={() => navigateToProfile(item?.profileId)}>
                  <Image
                    source={require('../../assets/icons/defaultProfileImage.png')}
                    style={styles.miniProfilePicture}
                  />
                </TouchableWithoutFeedback>
              ) }
            </Box>
            <Box flex={8}>
              <Box>
                <Box mt={{ phone: 's', tablet: 'm' }} mr={{ phone: 's', tablet: 'm' }} flexDirection="row" alignItems="flex-end" justifyContent="flex-start">
                  <Text variant="comment" style={{ fontWeight: 'bold' }}>
                    {`${item?.username} `}
                  </Text>
                  <Text variant="comment">
                    {item?.content}
                  </Text>
                </Box>
                <Box flexDirection="row" alignItems="center" justifyContent="flex-start">
                  <Text mr={{ phone: 's', tablet: 'm' }} variant="greyComment">
                    {item?.date && (dayjs.duration(dayjs(item?.date).diff(dayjs())).humanize())}
                  </Text>
                  <Text mr={{ phone: 's', tablet: 'm' }} onPress={() => replyPress(item.id, index)}>
                    Reply
                  </Text>
                </Box>
              </Box>
              {
                (item?.userId === userId)
                  ? (
                    <Box flexDirection="row" justifyContent="flex-end" mr={{ phone: 's', tablet: 'm' }}>
                      <Pressable onPress={() => deleteComment(
                        index,
                        item.id,
                      )}>
                        <Text variant="toDoButton">
                          Delete
                        </Text>
                      </Pressable>
                    </Box>
                  ) : null
              }
            </Box>
          </Box>
        )}
      </Box>
    )

    return (
      <KeyboardAvoidingView
        behavior="position"
        style={{ flex: 1 }}
        keyboardVerticalOffset={100}
        contentContainerStyle={{ flex: 1 }}
      >
        <Box flex={1} justifyContent="space-between">
          <Box flex={8.5}>
            {
              (commentRealm?.id
              && commentRealm?.replyId)
              ? (
                <Box style={{ width: '100%' }}>
                  {
                    (comments?.[0]?.id)
                    ? (
                      <Box style={{ width: '100%' }}>
                        <Box style={{ width: '100%' }} flexDirection="row">
                          <Box flex={2} justifyContent="center" alignItems="center">
                            {comments.find(i => i.id === commentRealm.replyId)?.avatar
                            ? (
                              <TouchableWithoutFeedback onPress={() => navigateToProfile(comments.find(i => i.id === commentRealm.replyId)?.profileId)}>
                                <Image
                                  source={{ uri: buildProfileURL(comments.find(i => i.id === commentRealm.replyId)?.avatar) }}
                                  style={styles.miniProfilePicture}
                                />
                              </TouchableWithoutFeedback>
                            ) : (
                              <TouchableWithoutFeedback onPress={() => navigateToProfile(comments.find(i => i.id === commentRealm.replyId)?.profileId)}>
                                <Image
                                  source={require('../../assets/icons/defaultProfileImage.png')}
                                  style={styles.miniProfilePicture}
                                />
                              </TouchableWithoutFeedback>
                            ) }
                          </Box>
                          <Box flex={8}>
                            <Box>
                              <Box mt={{ phone: 's', tablet: 'm' }} mr={{ phone: 's', tablet: 'm' }} flexDirection="row" alignItems="flex-end" justifyContent="flex-start">
                                  <Text variant="comment" style={{ fontWeight: 'bold' }}>
                                    {`${comments.filter(i => (i._deleted !== true)).find(i => i.id === (commentRealm.replyId))?.username} `}
                                  </Text>
                                  <Text variant="comment">
                                    {comments.filter(i => (i._deleted !== true)).find(i => i.id === (commentRealm.replyId))?.content}
                                  </Text>
                              </Box>
                              <Box flexDirection="row" alignItems="center" justifyContent="flex-start">
                                <Text mr={{ phone: 's', tablet: 'm' }} variant="greyComment">
                                  {dayjs.duration(dayjs(comments.filter(i => (i._deleted !== true)).find(i => i.id === commentRealm.replyId)?.date).diff(dayjs())).humanize()}
                                </Text>
                                <Text mr={{ phone: 's', tablet: 'm' }} onPress={() => replyPressEl(comments.filter(i => (i._deleted !== true)).find(i => i.id === commentRealm.replyId).id)}>
                                  Reply
                                </Text>
                              </Box>
                              {((comments.filter(i => (i._deleted !== true)).find(i => i.id === (commentRealm.replyId))?.userId) === userId)
                                ? (
                                  <Box flexDirection="row" justifyContent="flex-end" mr={{ phone: 's', tablet: 'm' }}>
                                    <Pressable onPress={() => deleteComment(
                                      comments.filter(i => (i._deleted !== true)).findIndex(i => i.id === (commentRealm.replyId)),
                                      comments.filter(i => (i._deleted !== true)).find(i => i.id === (commentRealm.replyId))?.id,
                                    )}>
                                      <Text variant="toDoButton">
                                        Delete
                                      </Text>
                                    </Pressable>
                                  </Box>
                                ) : null}
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                    ) : null
                  }
                  <Box style={{ width: '100%' }} flexDirection="row">
                    <Box flex={2} />
                    <Box flex={8}>
                      <Box flex={1} flexDirection="row">
                        <Box flex={0.5} justifyContent="flex-start" alignItems="center">
                          {commentRealm?.avatar
                          ? (
                            <TouchableWithoutFeedback onPress={() => navigateToProfile(commentRealm?.profileId)}>
                              <Image
                                source={{ uri: buildProfileURL(commentRealm?.avatar) }}
                                style={styles.microProfilePicture}
                              />
                            </TouchableWithoutFeedback>
                          ) : (
                            <TouchableWithoutFeedback onPress={() => navigateToProfile(commentRealm?.profileId)}>
                              <Image
                                source={require('../../assets/icons/defaultProfileImage.png')}
                                style={styles.microProfilePicture}
                              />
                            </TouchableWithoutFeedback>
                          ) }
                        </Box>
                        <Box flex={9.5}>
                          <Box>
                            <Box mt={{ phone: 's', tablet: 'm' }} mr={{ phone: 's', tablet: 'm' }} flexDirection="row" alignItems="flex-end" justifyContent="flex-start">
                              <Text variant="comment" style={{ fontWeight: 'bold' }}>
                                {`${commentRealm?.username} `}
                              </Text>
                              <Text variant="comment">
                                {commentRealm?.content}
                              </Text>
                            </Box>
                            <Box flexDirection="row" alignItems="center" justifyContent="flex-start">
                              <Text mr={{ phone: 's', tablet: 'm' }} variant="greyComment">
                                {commentRealm?.date && (dayjs.duration(dayjs(commentRealm?.date).diff(dayjs())).humanize())}
                              </Text>
                              <Text mr={{ phone: 's', tablet: 'm' }} onPress={() => replyPressEl(commentRealm.id)}>
                                Reply
                              </Text>
                            </Box>
                          </Box>
                          {((comments.filter(i => (i._deleted !== true)).find(i => i.id === (commentRealm.id))?.userId) === userId)
                            ? (
                              <Box flexDirection="row" justifyContent="flex-end" mr={{ phone: 's', tablet: 'm' }}>
                                <Pressable onPress={() => deleteComment(
                                  comments.filter(i => (i._deleted !== true)).findIndex(i => i.id === (commentRealm.id)),
                                  comments.filter(i => (i._deleted !== true)).find(i => i.id === (commentRealm.id))?.id,
                                )}>
                                  <Text variant="toDoButton">
                                    Delete
                                  </Text>
                                </Pressable>
                              </Box>
                            ) : null}
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              ) : commentRealm?.id
              ? (
                <Box flexDirection="row">
                  <Box flex={2} justifyContent="flex-start" alignItems="center">
                    {commentRealm?.avatar
                    ? (
                      <TouchableWithoutFeedback onPress={() => navigateToProfile(commentRealm?.profileId)}>
                        <Image
                          source={{ uri: buildProfileURL(commentRealm?.avatar) }}
                          style={styles.miniProfilePicture}
                        />
                      </TouchableWithoutFeedback>
                    ) : (
                      <TouchableWithoutFeedback onPress={() => navigateToProfile(commentRealm?.profileId)}>
                        <Image
                          source={require('../../assets/icons/defaultProfileImage.png')}
                          style={styles.miniProfilePicture}
                        />
                      </TouchableWithoutFeedback>
                    ) }
                  </Box>
                  <Box flex={8}>
                    <Box>
                      <Box mt={{ phone: 's', tablet: 'm' }} flexDirection="row" alignItems="flex-end" justifyContent="flex-start">
                        <Text variant="comment" style={{ fontWeight: 'bold' }}>
                          {`${commentRealm?.username} `}
                        </Text>
                        <Text variant="comment">
                          {commentRealm?.content}
                        </Text>
                      </Box>
                      <Box flexDirection="row" alignItems="center" justifyContent="flex-start">
                        <Text mr={{ phone: 's', tablet: 'm' }} variant="greyComment">
                          {dayjs.duration(dayjs(commentRealm?.date).diff(dayjs())).humanize()}
                        </Text>
                        <Text mr={{ phone: 's', tablet: 'm' }} onPress={() => replyPressEl(commentRealm.id)}>
                          Reply
                        </Text>
                      </Box>
                    </Box>
                    {((comments.filter(i => (i._deleted !== true)).find(i => i.id === (commentRealm.id))?.userId) === userId)
                      ? (
                        <Box flexDirection="row" justifyContent="flex-end" mr={{ phone: 's', tablet: 'm' }}>
                          <Pressable onPress={() => deleteComment(
                            comments.filter(i => (i._deleted !== true)).findIndex(i => i.id === (commentRealm.id)),
                            comments.filter(i => (i._deleted !== true)).find(i => i.id === (commentRealm.id))?.id,
                          )}>
                            <Text variant="toDoButton">
                              Delete
                            </Text>
                          </Pressable>
                        </Box>
                      ) : null}
                  </Box>
                </Box>
              ) : null
            }
            {
              replyRouteComments?.[0]?.id
              ? (
                <FlatList
                  data={replyRouteComments.filter(i => (i._deleted !== true))}
                  renderItem={commentRender}
                  keyExtractor={item => item.id}
                />
              ) : null
            }
            {
              comments?.[0]?.id
              ? (
                <FlatList
                  data={comments.filter(i => (i._deleted !== true))}
                  renderItem={commentRender}
                  keyExtractor={item => item.id}
                  onEndReachedThreshold={0.8}
                  onEndReached={loadMoreComments}
                />
              ) : null
            }
          </Box>
          <Box flex={1.5}>
            <Box flex={1} m={{ phone: 's', tablet: 'm' }} flexDirection="row" justifyContent="space-between">
              <Box flex={2} justifyContent="center" alignItems="center">
                {userAvatar
                ? (
                  <TouchableWithoutFeedback onPress={() => navigateToProfile()}>
                    <Image
                      source={{ uri: buildProfileURL(userAvatar) }}
                      style={styles.profilePicture}
                    />
                  </TouchableWithoutFeedback>
                ) : (
                  <TouchableWithoutFeedback onPress={() => navigateToProfile()}>
                    <Image
                      source={require('../../assets/icons/defaultProfileImage.png')}
                      style={styles.profilePicture}
                    />
                  </TouchableWithoutFeedback>
                ) }
              </Box>
              <Box flex={8} flexDirection="row" justifyContent="space-around" alignItems="center" style={styles.commentInput}>
                <Box flex={8} m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="flex-start">
                  <TextField
                    onChangeText={setComment}
                    value={comment}
                    placeholder="Add a comment..."
                    ref={textFieldEl}
                    hideUnderline
                  />
                </Box>
                <Box flex={2}>
                  <TouchableOpacity onPress={onCommentPost}>
                    <Text variant="commentPost">
                      Post
                    </Text>
                  </TouchableOpacity>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </KeyboardAvoidingView>
    )

  }

  export default UserCommentPost
