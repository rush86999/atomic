import React, { useState, useEffect } from 'react'
import { TextField } from 'react-native-ui-lib'
import { Appearance } from 'react-native'
import { API, GraphQLResult } from '@aws-amplify/api'
import { dayjs, RNLocalize } from '@app/date-utils'
import utc from 'dayjs/plugin/utc'

import Toast from 'react-native-toast-message'

import { useNavigation, RouteProp } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { v4 as uuid } from 'uuid'

import UpdatePost from '@graphql/Mutations/UpdatePost'
import GetPost from '@graphql/Queries/GetPost'

import {
  UpdatePostMutation,
  UpdatePostMutationVariables,
  GetPostQuery,
  GetPostQueryVariables,
} from '@app/API'

import Box from '@components/common/Box'
import Button from '@components/Button'
import { palette } from '@theme/theme'

const dark = Appearance.getColorScheme() === 'dark'

type RootNavigationStackParamList = {
  UserListPosts: {
    dataChanged: string,
  },
  UserProfile: undefined,
  UserUpdatePost: undefined,
}

type RootRouteStackParamList = {
  UserUpdatePost: {
    postId: string,
  },
}

type UserUpdatePostNavigationProp = StackNavigationProp<
  RootNavigationStackParamList,
  'UserUpdatePost'
>

type UserUpdatePostRouteProp = RouteProp<
  RootRouteStackParamList,
  'UserUpdatePost'>

type Props = {
  route: UserUpdatePostRouteProp,
  getRealmApp: () => Realm,
}

function UserUpdatePost(props: Props) {

  const postId = props?.route?.params?.postId


  const [post, setPost] = useState<GetPostQuery['getPost']>()
  const [caption, setCaption] = useState<string>(post?.caption)

  // getPost
  useEffect(() => {
    (async () => {
      try {
        if (!postId) {
          // 
          return
        }

        const getPostData = await API
          .graphql({
            query: GetPost,
            variables: {
              id: postId,
            } as GetPostQueryVariables
          }) as GraphQLResult<GetPostQuery>

        if (getPostData?.data?.getPost) {
          // post = getPostData?.data?.getPost
          setPost(getPostData?.data?.getPost)
          setCaption(getPostData?.data?.getPost?.caption)
          
        }
      } catch(e) {
        
      }
    })()
  }, [postId])

  const navigation = useNavigation<UserUpdatePostNavigationProp>()

  const onChangeCaption = (text: string) => {
    setCaption(text)
  }

  const updatePost = async () => {
    try {
      if (!caption) {
        Toast.show({
          type: 'error',
          text1: 'Empty caption',
          text2: 'Please write something to create post'
        })
        return
      }

      

        const updatedPostData = await API
          .graphql({
            query: UpdatePost,
            variables: {
              input: {
                id: postId,
                caption,
                _version: post?._version,
              }
            } as UpdatePostMutationVariables
          }) as GraphQLResult<UpdatePostMutation>

          
          navigation.navigate('UserListPosts', {
            dataChanged: uuid(),
          })
    } catch(e) {
      
      Toast.show({
        type: 'error',
        text1: 'Unable to update',
        text2: 'Unable to update post due to an internal error'
      })
    }
  }

  return (
    <Box flex={1} justifyContent="center" alignItems="center">
      <TextField
        hideUnderline
        title='caption'
        titleColor={dark ? palette.white : palette.grey}
        placeholder='Write something'
        multiline
        onChangeText={onChangeCaption}
        value={caption}
        style={{ width: '80%'}}
      />
      <Button onPress={updatePost}>
        Update
      </Button>
    </Box>
  )

}

export default UserUpdatePost
