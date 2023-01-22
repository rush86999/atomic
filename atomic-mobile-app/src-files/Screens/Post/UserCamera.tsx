import React, { useState, useEffect, useRef } from 'react'
import {
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native'
import { Auth } from '@aws-amplify/auth'
import { RNCamera } from 'react-native-camera'
import {request, check, PERMISSIONS, RESULTS} from 'react-native-permissions'
import Toast from 'react-native-toast-message'
import { useNavigation, RouteProp } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { useIsFocused } from '@react-navigation/core'
import RNFS from 'react-native-fs'
import Spinner from 'react-native-spinkit'


import { Buffer } from '@craftzdog/react-native-buffer'

import Box from '@components/common/Box'
import Text from '@components/common/Text'

import CameraToolbar from './CameraToolbar'


import {
  UserProfile as UserProfileRealm,
} from '@realm/UserProfile'

import {
  createPostRealm,
  updatePostRealm,
} from '@progress/Todo/UserTaskHelper'


const bucketRegion = 'YOUR-BUCKET-REGION'

const bucketName = 'YOUR-S3-BUCKET-UNCOMPRESSED'



type RootNavigationStackParamList = {
  UserCreatePost: {
    postId: string,
    userId: string,
    avatar: string,
    username: string,
    profileId: string,
  },
  UserListPosts: undefined,
  UserCamera: undefined,
}

type UserListPostsNavigationProp = StackNavigationProp<
  RootNavigationStackParamList,
  'UserListPosts'
>

type RootRouteStackParamList = {
  UserListPosts: undefined,
  UserCamera: undefined,
}

type UserListPostsRouteProp = RouteProp<
  RootRouteStackParamList,
  'UserCamera'
>

type Props = {
  route: UserListPostsRouteProp,
  sub: string,
  getRealmApp: () => Realm,
}

const escapeUnsafe = (unsafe: string) => unsafe
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;')
  .replace(/ /gi, '-')

const { width: winWidth, height: winHeight } = Dimensions.get('window')

const styles = StyleSheet.create({
  preview: {
    height: winHeight,
    width: winWidth,
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    // flex: 1,
  },
  topToolbar: {
    width: winWidth,
    position: 'absolute',
    height: 100,
    top: 0,
  },
})

function UserCamera(props: Props) {
  const { FlashMode: CameraFlashModes, Type: CameraTypes } = RNCamera.Constants

  const [userId, setUserId] = useState<string>('')
  const [username, setUsername] = useState<string>('')
  const [profileId, setProfileId] = useState<string>('')
  const [avatar, setAvatar] = useState<string>('')

  const [flashMode, setFlashMode] = useState<typeof CameraFlashModes.off | typeof CameraFlashModes.on>(RNCamera.Constants.FlashMode.off)
  const [capturing, setCapturing] = useState<boolean>(false)
  const [cameraFacing, setCameraFacing] = useState<typeof CameraTypes.back | typeof CameraTypes.front>(RNCamera.Constants.Type.back)
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
 
  const isFocused = useIsFocused()

  const {
    sub,
    getRealmApp,
  } = props

  const realm = getRealmApp()

  const cameraEl = useRef<RNCamera | null>(null)

  const navigation = useNavigation<UserListPostsNavigationProp>()

  // get userProfileId
  useEffect(() => {
    const getProfileId = async () => {
      try {

        const userData = realm.objects<UserProfileRealm>('UserProfile')

        if (userData?.length > 0) {
          const { id,
            userId: oldUserId,
            username: oldUsername,
            avatar: oldAvatar,
           } = userData[0]
          setUserId(oldUserId)
          setUsername(oldUsername)
          setProfileId(id)
          setAvatar(oldAvatar || '')
        }
      } catch (e) {
          // 
      }
    }
    if (sub) {
      getProfileId()
    }
  }, [sub])


  // get camera permission for ios
  useEffect(() => {
    (async () => {
      try {
        if (Platform.OS !== 'ios') {
          return
        }
        const result = await check(PERMISSIONS.IOS.CAMERA)

        if (result === RESULTS.GRANTED) {
          setHasCameraPermission(true)
        } else if (result === RESULTS.DENIED) {

          const requestResult = await request(PERMISSIONS.IOS.CAMERA)
          if (requestResult === RESULTS.GRANTED) {
            setHasCameraPermission(true)
          } else {
            setHasCameraPermission(false)
          }
        } else {
          setHasCameraPermission(false)
        }
      } catch(e) {
        
      }
    })()
  }, [])

  // get camera permission for android
  useEffect(() => {
    (async () => {
      try {
        if (Platform.OS !== 'android') {
          return
        }
        const result = await check(PERMISSIONS.ANDROID.CAMERA)

        if (result === RESULTS.GRANTED) {
          setHasCameraPermission(true)
        } else if (result === RESULTS.DENIED) {

          const requestResult = await request(PERMISSIONS.ANDROID.CAMERA)
          if (requestResult === RESULTS.GRANTED) {
            setHasCameraPermission(true)
          } else {
            setHasCameraPermission(false)
          }
        } else {
          setHasCameraPermission(false)
        }
      } catch(e) {
        
      }
    })()
  }, [])

  const handleCaptureIn = () => setCapturing(true)

  const uploadPicture = async (file: Buffer, name: string, type: string) => {
      // 
      try {
        // const jwtToken = (await Auth.currentSession()).getIdToken().getJwtToken()

        const credentials = await Auth.currentCredentials();
        const newS3 = new S3Client({
          region: bucketRegion,
          credentials: Auth.essentialCredentials(credentials),
        })

        const params = {
          Body: file,
          Bucket: bucketName,
          Key: `${credentials.identityId}/${userId}/${escapeUnsafe(name)}.${type}`,
          ContentEncoding: 'base64',
          'Content-Type': `image/${type}`
        };
        if (newS3) {
          const res = await newS3.send(new PutObjectCommand(params));

          

          return `${credentials.identityId}/${userId}/${escapeUnsafe(name)}.${type}`
        }
          

        return undefined

        // setProfilePicture(`${credId}/${hostProfileId}/${escapeUnsafe(file.name)}`);


      } catch (e) {
        
        return undefined
      }
    };

  const onDone = async (imagePath: string, type: string) => {
    try {
      // base64 image string
      const base64ImageString = await RNFS.readFile(imagePath, 'base64')

      // Let's assume the variable "base64" is one.
      const base64Data = Buffer.from(base64ImageString.replace(/^data:image\/\w+;base64,/, ""), 'base64')

      // if (activePost?.id) {

      const post = createPostRealm('')

      if (!(post.id)) {
        
        return
      }
        // upload file
        const key = await uploadPicture(base64Data, post.id, type)

        /** delete local file */
        await RNFS.unlink(imagePath)

        // write create post
        updatePostRealm(post.id, `${key.split('.')[0]}.webp`)

        navigation.navigate('UserCreatePost', {
          postId: post.id,
          userId,
          avatar,
          username,
          profileId,
        })
      // }
      setLoading(false)
    } catch(e) {
      
      setLoading(false)
    }
  }


  const handleCapture = async () => {
    try {
      setLoading(true)

      const { uri } = await cameraEl?.current?.takePictureAsync()

      setCapturing(false)
      const type = uri.split('.')[1]

      return onDone(uri, type)
    } catch(e) {
      
      setLoading(false)
      Toast.show({
        type: 'error',
        text1: 'Unable to capture',
        text2: ''
      })
    }
  }

  const onClose = () => navigation?.goBack()

  if (loading) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%'}} backgroundColor="lightRegularCardBackground">
        <Spinner isVisible={true} type="ThreeBounce" size={100} color="#FFFFFF" />
      </Box>
    )
  }

  if (hasCameraPermission === false) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center">
        <Text variant="subheader">No access to camera</Text>
      </Box>
    )
  }

  if (hasCameraPermission !== null && isFocused) {
    return (
      <Box flex={1}>
        <RNCamera
          type={cameraFacing}
          flashMode={flashMode}
          style={styles.preview}
          ref={cameraEl}
          captureAudio={false}
        />
        <CameraToolbar
          capturing={capturing}
          flashMode={flashMode}
          cameraType={cameraFacing}
          setFlashMode={setFlashMode}
          setCameraType={setCameraFacing}
          onCaptureIn={handleCaptureIn}
          onCapture={handleCapture}
        />
      </Box>
    )
  } else {
    return null
  }

}

export default UserCamera
