import React, { useState, useEffect, useCallback } from 'react'
import {

  Platform,
  FlatList,
  NativeSyntheticEvent,
  TextInputSubmitEditingEventData,
  Appearance,

 } from 'react-native'
import {
  SpeedDial,
  SearchBar,

 } from 'react-native-elements/src'

import { GraphQLResult, API } from '@aws-amplify/api'

import {launchImageLibrary} from 'react-native-image-picker'
import Spinner from 'react-native-spinkit'

import { dayjs } from '@app/date-utils'
import Toast from 'react-native-toast-message'

import { useNavigation, RouteProp, useFocusEffect } from '@react-navigation/native'

import { v4 as uuid } from 'uuid'

import RNFS from 'react-native-fs'


import { Buffer } from '@craftzdog/react-native-buffer'

import Box from '@components/common/Box'


import UserViewPost from '@post/UserViewPost'

import { palette } from '@theme/theme'

import {
  uploadPictureForListPosts,
  createPostRealm,
  updatePostRealm,
} from '@progress/Todo/UserTaskHelper'

import {
  Post,
} from '@models'



import ListPostsByDateDay from '@graphql/Queries/ListPostsByDateDay'
import GetTag from '@graphql/Queries/GetTag'
import ListTagsByName from '@graphql/Queries/ListTagsByName'
import GetPost from '@graphql/Queries/GetPost'

import {
  ListPostsByDateDayQuery,
  ListPostsByDateDayQueryVariables,

  GetTagQuery,
  GetTagQueryVariables,
  ListTagsByNameQuery,
  ListTagsByNameQueryVariables,
  GetPostQuery,
  GetPostQueryVariables,
} from '@app/API'


import {
  UserProfile as UserProfileRealm,
} from '@realm/UserProfile'

import {
  UserListPostsNavigationProp,
 } from '@post/PostNavigationTypes'


type RootRouteStackParamList = {
  UserListPosts: {
    postId: string | undefined,
    dataChanged?: string,
  },
}


type UserListPostsRouteProp = RouteProp<
  RootRouteStackParamList,
  'UserListPosts'>

type Props = {
  route: UserListPostsRouteProp,
  sub: string,
  getRealmApp: () => Realm,
}

const dark = Appearance.getColorScheme() === 'dark'

function UserListPosts(props: Props) {

  const [userId, setUserId] = useState<string>('')
  const [username, setUsername] = useState<string>('')
  const [profileId, setProfileId] = useState<string>('')
  const [avatar, setAvatar] = useState<string>('')
  const [posts, setPosts] = useState<any[] | []>([])
  const [postsByTag, setPostsByTag] = useState<GetTagQuery['getTag']['posts']['items'] | []>([])
  const [postToken, setPostToken] = useState<string>()
  const [postTagToken, setPostTagToken] = useState<string>()
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [tag, setTag] = useState<string>('')
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [getPost, setGetPost] = useState<GetPostQuery['getPost'] | undefined>()
  const [loading, setLoading] = useState<boolean>(false)
  const [dateDay, setDateDay] = useState<string>()

  const postId = props?.route?.params?.postId
  const getRealmApp = props?.getRealmApp
  const sub = props?.sub
  const dataChangedRoute = props?.route?.params?.dataChanged
  const [dataChanged, setDataChanged] = useState<string>('')


  useEffect(() => {
    if (dataChangedRoute) {
      setDataChanged(dataChangedRoute)
    }
  }, [dataChangedRoute])

  useFocusEffect(
    useCallback(() => {
      if (dataChangedRoute) {
        setDataChanged(dataChangedRoute)
      }
    }, [dataChangedRoute])
  )


  const realm = getRealmApp()


  useEffect(() => {
    (async () => {
      try {
        if (!postId) {
          return
        }

        const getPostData = await API.
          graphql({
            query: GetPost,
            variables: {
              id: postId,
            } as GetPostQueryVariables
          }) as GraphQLResult<GetPostQuery>

        const newGetPost = getPostData?.data?.getPost

        if (newGetPost?.id) {
          setGetPost(newGetPost)
        }
      } catch(e) {
        
      }
    })()
  }, [postId])

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          if (!postId) {
            return
          }

          const getPostData = await API.
            graphql({
              query: GetPost,
              variables: {
                id: postId,
              } as GetPostQueryVariables
            }) as GraphQLResult<GetPostQuery>

          const newGetPost = getPostData?.data?.getPost

          if (newGetPost?.id) {
            setGetPost(newGetPost)
          }
        } catch(e) {
          
        }
      })()
    }, [postId])
  )

  const navigation = useNavigation<UserListPostsNavigationProp>()


  useEffect(() => {
    const getProfileId = async () => {
      try {

        const userData = realm.objects<UserProfileRealm>('UserProfile')

        if (userData?.[0]?.id) {
          const [profile] = userData

          setUserId(profile?.userId)
          setUsername(profile?.username)
          setProfileId(profile?.id)
          setAvatar(profile?.avatar || '')
        }
      } catch (e) {
          
      }
    }
    if (sub) {
      getProfileId()
    }
  }, [sub])


  useEffect(() => {
    (async () => {
      setDateDay(dayjs().format('YYYY-MM-DD'))
      try {
        const postData: GraphQLResult<ListPostsByDateDayQuery> = await (API
          .graphql({
            query: ListPostsByDateDay,
            variables: {
              dateDay: dayjs().format('YYYY-MM-DD'),
              sortDirection: 'DESC',
              limit: 5,
            } as ListPostsByDateDayQueryVariables,
          }) as Promise<GraphQLResult<ListPostsByDateDayQuery>>)


          

          const listPostsByDateDay = postData?.data?.listPostsByDateDay?.items

          if (listPostsByDateDay?.[0]?.id) {


            setPosts(listPostsByDateDay)

            const nextToken = postData?.data?.listPostsByDateDay?.nextToken

            if (nextToken) {
              setPostToken(nextToken)
            }
          }
      } catch(e) {
        
      }
    })()
  }, [])

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setDateDay(dayjs().format('YYYY-MM-DD'))
        try {
          const postData: GraphQLResult<ListPostsByDateDayQuery> = await (API
            .graphql({
              query: ListPostsByDateDay,
              variables: {
                dateDay: dayjs().format('YYYY-MM-DD'),
                sortDirection: 'DESC',
                limit: 5,
              } as ListPostsByDateDayQueryVariables,
            }) as Promise<GraphQLResult<ListPostsByDateDayQuery>>)

            

            const listPostsByDateDay = postData?.data?.listPostsByDateDay?.items

            if (listPostsByDateDay?.[0]?.id) {
         

              setPosts(listPostsByDateDay)

              const nextToken = postData?.data?.listPostsByDateDay?.nextToken

              if (nextToken) {
                setPostToken(nextToken)
              }
            }
        } catch(e) {
          
        }
      })()
    }, [])
  )

  const onDone = async (imagePath: string, type: string) => {
    try {
      const base64ImageString = await RNFS.readFile(imagePath, 'base64')

      const base64Data = Buffer.from(base64ImageString.replace(/^data:image\/\w+;base64,/, ""), 'base64')


        const post = createPostRealm('')

        if (!(post?.id)) {
          
          return
        }
        const key = await uploadPictureForListPosts(userId, base64Data, post.id, type)
        

        await RNFS.unlink(imagePath)

        updatePostRealm(post.id, `${key.split('.')[0]}.webp`)

        
        navigation.navigate('UserCreatePost', {
          postId: post.id,
          userId,
          avatar,
          username,
          profileId,
        })
      setLoading(false)
    } catch(e) {
      
      setLoading(false)
    }
  }

  const pickImage = async () => {
    try {
      launchImageLibrary({
        mediaType: 'photo',
        quality: 1,
      }, async (result) => {
        setLoading(true)
          if (!(result?.didCancel)) {
            const { assets } = result
            const [{ uri }] = assets

            const type = uri.split('.')[1]


            return onDone(uri, type)

          }
          setLoading(false)
      });


    } catch(e) {
      Toast.show({
        type: 'error',
        text1: 'Unable to capture snapshot',
        text2: 'Unable to to capture snapshot due to an internal error',
      })
    }
  }

  const takePicture = () => navigation.navigate('UserCamera')

  const handleExternalData = () => setDataChanged(uuid())

  const loadMoreData = async () => {
    try {
      if (!postToken) {
        return
      }

      const postData: GraphQLResult<ListPostsByDateDayQuery> = await (API
        .graphql({
          query: ListPostsByDateDay,
          variables: {
            dateDay,
            sortDirection: 'DESC',
            nextToken: postToken,
            limit: 5,
          } as ListPostsByDateDayQueryVariables,
        }) as Promise<GraphQLResult<ListPostsByDateDayQuery>>)


        const items = postData?.data?.listPostsByDateDay?.items
        const nextToken = postData?.data?.listPostsByDateDay?.nextToken
        if (items?.[0]?.id) {

          

          setPosts(
            (posts as Post[]).concat(items as any[])
          )

          setPostToken(nextToken)
        }

    } catch(e) {
      
    }
  }

  const updateSearch = (text: string) => setTag(text)

  const onCancelSearch = () => {
    setTag('')
    setPostsByTag([])
  }

  const onClearSearch = () => setTag('')

  const onSubmitEditing = async ({ nativeEvent: { text }}: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => {
    try {
      

      

      const possibleTagData = await API
        .graphql({
          query: ListTagsByName,
          variables: {
            name: tag,
          } as ListTagsByNameQueryVariables
        }) as GraphQLResult<ListTagsByNameQuery>

      const possibleTags = possibleTagData?.data?.listTagsByName?.items

      

      if (possibleTags?.[0]?.id) {
        const selectedTag = possibleTags?.[0]


        const postData: GraphQLResult<GetTagQuery> = await API
          .graphql({
            query: GetTag,
            variables: {
              id: selectedTag.id,
            } as GetTagQueryVariables,
          }) as GraphQLResult<GetTagQuery>



        const listPostsByTagId = postData?.data?.getTag?.posts?.items
        const nextToken = postData?.data?.getTag?.posts?.nextToken

        

        if (listPostsByTagId?.[0]?.id) {


            if (nextToken) {
              setPostTagToken(nextToken)
            }

            const newPostsByTag = listPostsByTagId.map(listPostByTagId => {

              const post = listPostByTagId?.post

              

              return post
            })

            
            setPostsByTag(listPostsByTagId)
          }
      }
    } catch(e) {
      
    }
  }

  const loadMorePostTagData = async () => {
    try {

      if (!postTagToken) {
        return
      }

      const possibleTagData = await API
        .graphql({
          query: ListTagsByName,
          variables: {
            name: tag,
          } as ListTagsByNameQueryVariables
        }) as GraphQLResult<ListTagsByNameQuery>

      const possibleTags = possibleTagData?.data?.listTagsByName?.items

      

      if (possibleTags?.[0]?.id) {
        const selectedTag = possibleTags?.[0]


        const postData: GraphQLResult<GetTagQuery> = await API
          .graphql({
            query: GetTag,
            variables: {
              id: selectedTag?.id,
            } as GetTagQueryVariables,
          }) as GraphQLResult<GetTagQuery>



        const listPostsByTagId = postData?.data?.getTag?.posts?.items

        

        if (listPostsByTagId?.[0]?.id) {


            const listPostsByTagIdItems = listPostsByTagId
            const nextToken = postData?.data?.getTag?.posts?.nextToken

            


            setPostTagToken(nextToken)

            setPostsByTag(
              (postsByTag as any[]).concat(listPostsByTagIdItems)
            )
          }
      }
    } catch(e) {
      
    }
  }

  const refreshPostData = async () => {
    try {
      setRefreshing(true)
      if (tag?.length > 0) {
        

        const possibleTagData = await API
          .graphql({
            query: ListTagsByName,
            variables: {
              name: tag,
            } as ListTagsByNameQueryVariables
          }) as GraphQLResult<ListTagsByNameQuery>

        const possibleTags = possibleTagData?.data?.listTagsByName?.items

        

        if (possibleTags?.[0]?.id) {
          const selectedTag = possibleTags?.[0]


          const postData: GraphQLResult<GetTagQuery> = await API
            .graphql({
              query: GetTag,
              variables: {
                id: selectedTag.id,
              } as GetTagQueryVariables,
            }) as GraphQLResult<GetTagQuery>



          const listPostsByTagId = postData?.data?.getTag?.posts?.items
          const nextToken = postData?.data?.getTag?.posts?.nextToken

          

          if (listPostsByTagId?.[0]?.id) {


              if (nextToken) {
                setPostTagToken(nextToken)
              }

              const newPostsByTag = listPostsByTagId

              setRefreshing(false)
              return setPostsByTag(newPostsByTag)
            }
            return setRefreshing(false)
        }
        return setRefreshing(false)
      }

      setDateDay(dayjs().format('YYYY-MM-DD'))
      const postData: GraphQLResult<ListPostsByDateDayQuery> = await (API
        .graphql({
          query: ListPostsByDateDay,
          variables: {
            dateDay,
            sortDirection: 'DESC',
            limit: 5,
          } as ListPostsByDateDayQueryVariables,
        }) as Promise<GraphQLResult<ListPostsByDateDayQuery>>)


        const listPostsByDateDay = postData?.data?.listPostsByDateDay?.items

        

        if (listPostsByDateDay?.[0]?.id) {

          const items = listPostsByDateDay

          const nextToken = postData?.data?.listPostsByDateDay?.nextToken

          setPosts(items)
          setPostToken(nextToken)
          setPostsByTag([])

          setRefreshing(false)
        }
        setRefreshing(false)
    } catch(e) {
      
      setRefreshing(false)
    }
  }

  if (loading) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%'}} backgroundColor="lightRegularCardBackground">
        <Spinner isVisible={true} type="ThreeBounce" size={100} color="#FFFFFF" />
      </Box>
    )
  }

  return (
    <Box flex={1}>
      <Box>
        <SearchBar
          round
          placeholder="Type Tag Name Here And Enter..."
          onChangeText={updateSearch}
          value={tag}
          onSubmitEditing={onSubmitEditing}
          onClear={onClearSearch}
          onCancel={onCancelSearch}
          platform={Platform.OS === 'ios' ? 'ios' : 'android'}
          autoCapitalize="none"
          containerStyle={{ backgroundColor: dark ? palette.black : null }}
        />
      </Box>
      <Box flex={1}>
        <Box flex={1}>
          {getPost?.id
          ? (
            <Box flex={1}>
              {
                postsByTag?.[0]?.id
                 ? (
                   <FlatList
                     data={[getPost].concat((postsByTag as any).filter((i: { _deleted: boolean }) => (i._deleted !== true)))}
                     renderItem={({ item }) =>
                       (<UserViewPost
                         post={item}
                         userId={userId}
                         username={username}
                         userAvatar={avatar}
                         profileId={profileId}
                         handleExternalData={handleExternalData}
                       />)
                     }
                     keyExtractor={item => item.id}
                     extraData={dataChanged}
                     onEndReachedThreshold={0.3}
                     onEndReached={loadMorePostTagData}
                     onRefresh={refreshPostData}
                     refreshing={refreshing}
                   />
                 ) :
                (
                  posts?.[0]?.id
                  ? (
                    <FlatList
                      data={[getPost].concat(posts as any).filter(i => (i._deleted !== true))}
                      renderItem={({ item }) =>
                        (<UserViewPost
                          post={item}
                          userId={userId}
                          username={username}
                          userAvatar={avatar}
                          profileId={profileId}
                          handleExternalData={handleExternalData}
                        />)
                      }
                      keyExtractor={item => item.id}
                      extraData={dataChanged}
                      onEndReachedThreshold={0.3}
                      onEndReached={loadMoreData}
                      onRefresh={refreshPostData}
                      refreshing={refreshing}
                    />
                  ) : null)}
            </Box>
          ) : (
            <Box flex={1}>
              {
                postsByTag?.[0]?.id
                 ? (
                   <FlatList
                     data={postsByTag.filter(i => (i._deleted !== true))}
                     renderItem={({ item }) =>
                       (<UserViewPost
                         post={item?.post}
                         userId={userId}
                         username={username}
                         userAvatar={avatar}
                         profileId={profileId}
                         handleExternalData={handleExternalData}
                       />)
                     }
                     keyExtractor={item => item.id}
                     extraData={dataChanged}
                     onEndReachedThreshold={0.3}
                     onEndReached={loadMorePostTagData}
                     onRefresh={refreshPostData}
                     refreshing={refreshing}
                   />
                 ) :
                (
                  posts?.[0]?.id
                  ? (
                    <FlatList
                      data={posts.filter(i => (i._deleted !== true))}
                      renderItem={({ item }) =>
                        (<UserViewPost
                          post={item}
                          userId={userId}
                          username={username}
                          userAvatar={avatar}
                          profileId={profileId}
                          handleExternalData={handleExternalData}
                        />)
                      }
                      keyExtractor={item => item.id}
                      extraData={dataChanged}
                      onEndReachedThreshold={0.3}
                      onEndReached={loadMoreData}
                      onRefresh={refreshPostData}
                      refreshing={refreshing}
                    />
                  ) : null)}
            </Box>
          )}
        </Box>
      </Box>
      <SpeedDial
        isOpen={isOpen}
        onOpen={() => setIsOpen(true)}
        onClose={() => setIsOpen(false)}
        icon={{
          name: 'add',
          type: 'ionicon',
          color: '#fff',
         }}
        openIcon={{
          name: 'close',
          type: 'ionicon',
          color: '#fff',
         }}
        >
          <SpeedDial.Action
            icon={{
              name: 'images',
              color: '#fff',
              type: 'ionicon',
             }}
            title="Library"
            onPress={pickImage}
          />
          <SpeedDial.Action
            icon={{
              name: 'camera',
              color: '#fff',
              type: 'ionicon',
             }}
            title="Camera"
            onPress={takePicture}
          />
      </SpeedDial>
    </Box>
  )
}

export default UserListPosts
