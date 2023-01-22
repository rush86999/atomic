import React, { useState, useEffect } from 'react'

import { Appearance } from 'react-native'
import { TextField } from 'react-native-ui-lib'

import { API, GraphQLResult } from '@aws-amplify/api'
import { dayjs } from '@app/date-utils'

import Toast from 'react-native-toast-message'

import {
  useNavigation,
  RouteProp,
 } from '@react-navigation/native'

import {
  CreatePostMutation,
  CreatePostMutationVariables,
  CreatePostTagMutation,
  CreatePostTagMutationVariables,
} from '@app/API'

import Box from '@components/common/Box'
import Text from '@components/common/Text'
import Button from '@components/Button'

import { palette } from '@theme/theme'

import {
  Post as PostRealm,
} from '@realm/Post'

import {
  UserProfile as UserProfileRealm,
} from '@realm/UserProfile'

import {
  UserCreatePostNavigationProp,
 } from '@post/PostNavigationTypes'


 import ListTagsByName from '@graphql/Queries/ListTagsByName'


import CreatePost from '@graphql/Mutations/CreatePost'
import CreateTag from '@graphql/Mutations/CreateTag'
import CreatePostTag from '@graphql/Mutations/CreatePostTag'
import UpdateUserProfile from '@graphql/Mutations/UpdateUserProfile'

import {
  ListTagsByNameQuery,
  ListTagsByNameQueryVariables,
  CreateTagMutation,
  CreateTagMutationVariables,
  UpdateUserProfileMutation,
  UpdateUserProfileMutationVariables,
} from '@app/API'

const dark = Appearance.getColorScheme() === 'dark'
type RootRouteStackParamList = {
  UserCreatePost: {
    postId: string,
    userId: string,
    avatar: string,
    username: string,
    profileId: string,
  },
}

type UserCreatePostRouteProp = RouteProp<
  RootRouteStackParamList,
  'UserCreatePost'>

type Props = {
  route: UserCreatePostRouteProp,
  getRealmApp: () => Realm,
}



function UserCreatePost(props: Props) {
  const [caption, setCaption] = useState<string>('')
  const [tags, setTags] = useState<string[]>([''])
  const [height, setHeight] = useState<number>(40)
  const [post, setPost] = useState<PostRealm>()

  const {
    route,
    getRealmApp,
  } = props

  const postId = route?.params?.postId
  const userId = route?.params?.userId
  const username = route?.params?.username
  const profileId = route?.params?.profileId
  const avatar = route?.params?.avatar

  const realm = getRealmApp()

  const navigation = useNavigation<UserCreatePostNavigationProp>()

  useEffect(() => {
    (() => {
      if (!postId) {
        
        return
      }
      

      const postRealm = realm.objectForPrimaryKey<PostRealm>('Post', postId)

      

      if (!(postRealm?.id)) {
        
        return
      }
      
      setPost(postRealm)
    })()
  }, [postId])


  const createPost = async (text: string) => {
    try {

        

        

        

        

        

        const newPost = await API
          .graphql({
            query: CreatePost,
            variables: {
              input: {
                dateDay: post.dateDay,
                date: post.date,
                caption: text,
                image: post.image,
                userId,
                likeCount: 0,
                commentCount: 0,
                avatar,
                username,
                profileId,
                ttl: dayjs().add(5, 'y').unix(),
              }
            } as CreatePostMutationVariables
          }) as GraphQLResult<CreatePostMutation>

          
        return newPost?.data?.createPost
    } catch (e) {
      
    }
  }


  const matchValues = (text: string): string[] | null => text.match(/[#][\w|\d]+/gm)

  const onChangeCaption = (text: string) => {
    
    setCaption(text)
    const newTags = matchValues(text)

    

    if (newTags?.[0]) {
      const modTags = newTags.map((i: string) => i.slice(1))
      setTags(modTags)
    }
  }

  const updateProfileRealmPostCount = () => {
    realm.write(() => {
      const profiles = realm.objects<UserProfileRealm>('UserProfile')

      if (profiles?.length > 0) {
        const [profile] = profiles

        if ((typeof (profile?.postCount) === 'number') && (profile?.postCount !== null)) {
          profile.postCount += 1
        } else {
          profile.postCount = 1
        }

      }
    })
  }

  const addPostCount = async () => {
    try {

      const profiles = realm.objects<UserProfileRealm>('UserProfile')

      if (!(profiles?.[0]?.id)) {
        console.error(' there is no user profile? inside usercreatepost')
        return
      }

      const updateProfileData = await API.
        graphql({
          query: UpdateUserProfile,
          variables: {
            input: {
              id: profiles?.[0]?.id,
              postCount: (profiles?.[0]?.postCount || 0) + 1,
            }
          } as UpdateUserProfileMutationVariables
        }) as GraphQLResult<UpdateUserProfileMutation>

        
      updateProfileRealmPostCount()

    } catch(e) {
    }
  }

  const createTags = async (post: any) => {
    try {
      if (tags?.[0]) {
        
        const savedTagsPromises = tags.map(async(tag) => {
          try {

            const oldTagData = await API.
              graphql({
                query: ListTagsByName,
                variables: {
                  name: tag,
                } as ListTagsByNameQueryVariables,
              }) as GraphQLResult<ListTagsByNameQuery>

            const oldTags = oldTagData?.data?.listTagsByName?.items

            if (oldTags?.[0]) {
              return oldTags[0]
            }


            const tagData = await API.
              graphql({
                query: CreateTag,
                variables: {
                  input: {
                    name: tag,
                  }
                } as CreateTagMutationVariables,
              }) as GraphQLResult<CreateTagMutation>

            return tagData?.data?.createTag
          } catch(e) {
            
          }
        })

        const savedTags = await Promise.all(savedTagsPromises)

        if (savedTags?.length > 0) {

          const postTagsPromises = savedTags.map(async (savedTag) => {
            try {


              return API.
                graphql({
                  query: CreatePostTag,
                  variables: {
                    input: {
                      postID: post.id,
                      tagID: savedTag.id,
                    }
                  } as CreatePostTagMutationVariables
                }) as GraphQLResult<CreatePostTagMutation>
            } catch(e) {
            }
          })

          await Promise.all(postTagsPromises)
        }

      }

    } catch(e) {
    }
  }

  const onSubmit = async () => {
    try {

      if (!caption) {
        Toast.show({
          type: 'error',
          text1: 'Empty caption',
          text2: 'Please write something to create post'
        })
        return
      }

      const post = await createPost(caption || '')

      



      if (post?.id) {

          await createTags(post)

          await addPostCount()

          navigation?.navigate('Home', {
            screen: 'UserToDoAndPostsTabNavigation',
            params: {
              screen: 'UserListPosts',
              params: {
                screen: 'UserListPosts',
                params: {
                  postId: post?.id,
                }
              }
            }
          })
      }
    } catch(e) {
      
      Toast.show({
        type: 'error',
        text1: 'Unable to submit post',
        text2: 'Unable to submit post due to an internal error',
      })
    }
  }

  type contentSizeType = {
    nativeEvent: {
      contentSize: {
        height: number
      }
    }
  }

  return (
    <Box flex={1} justifyContent="center" alignItems="center">
      <TextField
        hideUnderline
        title='Caption'
        titleColor={dark ? palette.white : palette.grey}
        placeholder='Write something'
        multiline
        onChangeText={onChangeCaption}
        value={caption}
        style={{ height, width: '80%' }}
        onContentSizeChange={({ nativeEvent: { contentSize: { height } } }: contentSizeType) => setHeight(height)}
      />
      <Box flexDirection="row" flexWrap="wrap" justifyContent="flex-start">
        {tags?.[0]
          ? tags.map(tag => (
            <Box
              style={{ borderRadius: 20, backgroundColor: palette.backgroundLink }}
              m={{ phone: 's', tablet: 'm' }}
            >
              <Text
                color='link'
                p={{ phone: 's', tablet: 'm' }}
              >
                {tag}
              </Text>
            </Box>
          )) : null}
      </Box>
      <Button onPress={onSubmit}>
        Share
      </Button>
    </Box>
  )

}

export default UserCreatePost
