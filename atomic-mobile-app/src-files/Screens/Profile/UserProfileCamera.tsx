import React, { useState, useEffect, useRef } from 'react'
import {
 
  StyleSheet,

  Platform,
  Dimensions,

} from 'react-native'
import { Auth } from '@aws-amplify/auth'
import { DataStore } from '@aws-amplify/datastore'
import { RNCamera } from 'react-native-camera'
import {request, check, PERMISSIONS, RESULTS} from 'react-native-permissions'

import Toast from 'react-native-toast-message'
import { useNavigation, RouteProp } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import {
  S3Client,
  PutObjectCommand,
 } from "@aws-sdk/client-s3"

import RNFS from 'react-native-fs'
import Spinner from 'react-native-spinkit'

import { Buffer } from '@craftzdog/react-native-buffer'

import Box from '@components/common/Box'
import Text from '@components/common/Text'

import CameraToolbar from '@profile/CameraToolbar'

import {
  UserProfile,
} from '@models'

import {
  UserProfile as UserProfileRealm,
} from '@realm/UserProfile'

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
  },
  topToolbar: {
    width: winWidth,
    position: 'absolute',
    height: 100,
    top: 0,
    zIndex: 1,
  },
})


const bucketNameProfileUncompressed = 'YOUR S3 UNCOMPRESSED BUCKET NAME'
const bucketRegion = 'YOUR BUCKET REGION'


type RootRouteStackParamList = {
  UserProfileCamera: { userProfileId: string },
}

type UserProfileCameraRouteProp = RouteProp<
  RootRouteStackParamList,
  'UserProfileCamera'>

type RootNavigationStackParamList = {
  UserEditProfile: {
    userProfileId: string
  },
  UserProfileCamera: undefined,
}

type UserProfileCameraNavigationProp = StackNavigationProp<
  RootNavigationStackParamList,
  'UserProfileCamera'
>

type Props = {
  route: UserProfileCameraRouteProp,
  getRealmApp: () => Realm,
}

const escapeUnsafe = (unsafe: string) => unsafe
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;')
  .replace(/ /gi, '-')

function UserProfileCamera(props: Props) {
  const { FlashMode: CameraFlashModes, Type: CameraTypes } = RNCamera.Constants
  const [flashMode, setFlashMode] = useState<typeof CameraFlashModes.off | typeof CameraFlashModes.on>(RNCamera.Constants.FlashMode.off)
  const [capturing, setCapturing] = useState<boolean>(false)
  const [cameraFacing, setCameraFacing] = useState<typeof CameraTypes.back | typeof CameraTypes.front>(RNCamera.Constants.Type.back)
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  const {
    getRealmApp,
    route,
  } = props

  const userProfileId = route?.params?.userProfileId

  const realm = getRealmApp()

  const profile = realm.objects<UserProfileRealm>('UserProfile')?.[0]
  

  const cameraEl = useRef<RNCamera | null>(null)

  const navigation = useNavigation<UserProfileCameraNavigationProp>()

 

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

  const updateProfileRealm = (avatar1?: string) => {
    realm.write(() => {
      const profiles = realm.objects<UserProfileRealm>('UserProfile')
      const [profile] = profiles

      if ((typeof avatar1 === 'string') || (avatar1 === null)) {
        profile.avatar = avatar1
      }
    })
  }

  const saveProfile = async (
    image?: string,
  ) => {
    try {

      const original = await DataStore.query(UserProfile, userProfileId)

      const newProfile = await DataStore.save(
        UserProfile.copyOf(
          original, updated => {

            if (typeof image === 'string') {
              updated.avatar = image
            }
          }
        )
      )

      // const newProfile = newProfileData?.data?.updateUserProfile

      updateProfileRealm(
        image,
      )

      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Profile was successfully updated'
      })
      navigation.goBack()
    } catch(e) {
      
      Toast.show({
        type: 'error',
        text1: 'Unable to update',
        text2: 'We were unable to update Profile.'
      })
    }
  }

  const uploadPicture = async (file: Buffer, name: string, type: string) => {
      // 
      try {

        const credentials = await Auth.currentCredentials();
        const newS3 = new S3Client({
          region: bucketRegion,
          credentials: Auth.essentialCredentials(credentials),

        })

        // const random = ulid()

        const params = {
          Body: file,
          Bucket: bucketNameProfileUncompressed,
          Key: `${credentials.identityId}/${profile.userId}/${escapeUnsafe(name)}.${type}`,
          'Content-Type': `image/${type}`,
        };
        if (newS3) {
          const res = await newS3.send(new PutObjectCommand(params));

          

          return `${credentials.identityId}/${profile.userId}/${escapeUnsafe(name)}.${type}`
        }
          

        return undefined
      } catch (e) {
        
        return undefined
      }
    };

  const onDone = async (imagePath: string, type: string) => {
    try {
      setLoading(true)
      // base64 image string
      const base64ImageString = await RNFS.readFile(imagePath, 'base64')

      // 

      if (!base64ImageString) {
        
        return
      }

      

      // Let's assume the variable "base64" is one.
      const base64Data = Buffer.from(base64ImageString.replace(/^data:image\/\w+;base64,/, ""), 'base64')

      // 

      // upload file
      const key = await uploadPicture(base64Data, profile.username, type)

      

      await saveProfile(`${key.split('.')[0]}.webp`)

      /** delete local file */
      await RNFS.unlink(imagePath)
      setLoading(false)
      navigation.navigate('UserEditProfile', { userProfileId })
    } catch(e) {
      
      Toast.show({
        type: 'error',
        text1: 'Oops...',
        text2: 'Something went wront with picture. Try again later.',
      })
      setLoading(false)
    }
  }

  const handleCaptureIn = () => setCapturing(true)

  const handleCaptureLocal = async () => {
    try {
      const { uri } = await cameraEl?.current?.takePictureAsync()
      setCapturing(false)
     
      const type = uri.split('.')[1]
      
      return onDone(uri, type)
    } catch(e) {
      
      Toast.show({
        type: 'error',
        text1: 'Unable to capture',
        text2: ''
      })
    }
  }

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

  if (hasCameraPermission !== null) {
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
          onCapture={handleCaptureLocal}
        />
      </Box>
    )
  } else {
    return null
  }


}

export default UserProfileCamera
