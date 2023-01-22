import React, { useState } from 'react'
import {
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Keyboard,
} from 'react-native'
import { DataStore } from '@aws-amplify/datastore'
import { TextField, Dialog } from 'react-native-ui-lib'
import { useHeaderHeight } from '@react-navigation/elements'
import { Auth } from '@aws-amplify/auth'

import { RouteProp, useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'

import {launchImageLibrary} from 'react-native-image-picker'

import Toast from 'react-native-toast-message'
import Spinner from 'react-native-spinkit'
import FastImage from 'react-native-fast-image'


import { Buffer } from '@craftzdog/react-native-buffer'

import { btoa } from 'react-native-quick-base64'

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
 } from "@aws-sdk/client-s3"

import RNFS from 'react-native-fs'

import Box from '@components/common/Box'

import Text from '@components/common/Text'
import Button from '@components/Button'

import { palette } from '@theme/theme'

import {
  UserProfile,
} from '@models'

import {
  UserProfile as UserProfileRealm,
} from '@realm/UserProfile'

const bucketNameProfile = 'YOUR S3 COMPRESSED BUCKET NAME'
const bucketNameProfileUncompressed = 'YOUR S3 UNCOMPRESSED BUCKET NAME'

const PUBLICPROFILEIMAGEAPI = 'YOUR AWS SERVERLESS IMAGE HANDLER CLOUDFRONT URL'

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

const bucketRegion = 'YOUR BUCKET REGIONS'

type RootRouteStackParamList = {
  UserEditProfile: {
    userProfileId: string,
   },
}

type UserEditProfileRouteProp = RouteProp<
  RootRouteStackParamList,
  'UserEditProfile'>

type RootNavigationStackParamList = {
  UserProfileCamera: {
    userProfileId: string
  },
  UserEditProfile: undefined,
}

type UserEditProfileNavigationProp = StackNavigationProp<
  RootNavigationStackParamList,
  'UserEditProfile'
>


type Props = {
  route: UserEditProfileRouteProp,
  getRealmApp: () => Realm,
}

const escapeUnsafe = (unsafe: string) => unsafe
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;')
  .replace(/ /gi, '-')

const { width: winWidth } = Dimensions.get('window')

const styles = StyleSheet.create({
  editProfileBox: {
    width: winWidth,
  },
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
  modal: {
    flex: 1,
    width: winWidth,
  },
  buttonLink: {
    margin: 10,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})

function UserEditProfile(props: Props) {

  const {
    getRealmApp,
    route,
  } = props

  const userProfileId = route?.params?.userProfileId

  const realm = getRealmApp()
  const height = useHeaderHeight()

  const profile = realm.objects<UserProfileRealm>('UserProfile')?.[0]

  const [avatar, setAvatar] = useState<string>(profile?.avatar || '')
  const [username, setUsername] = useState<string>(profile?.username)
  const [bio, setBio] = useState<string>(profile?.bio || '')
  const [isPicDialog, setIsPicDialog] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)

  const navigation = useNavigation<UserEditProfileNavigationProp>()

  const cancelPicDialog = () => setIsPicDialog(false)

  const updateProfileRealm = (avatar1?: string, username1?: string, bio1?: string) => {
    realm.write(() => {
      const profiles = realm.objects<UserProfileRealm>('UserProfile')
      const [profile] = profiles

      if ((typeof avatar1 === 'string') || (avatar1 === null)) {
        profile.avatar = avatar1
      }

      if ((typeof username1 === 'string') || (username1 === null)) {
        profile.username = username1
      }

      if ((typeof bio1 === 'string') || (bio1 === null)) {
        profile.bio = bio1
      }
    })
  }

  const saveProfile = async (
    image?: string,
    localUsername?: string,
    localBio?: string,
  ) => {
    try {

      const original = await DataStore.query(UserProfile, userProfileId)

      const newProfile = await DataStore.save(
        UserProfile.copyOf(
          original, updated => {

            if (typeof image === 'string') {
              updated.avatar = image
            } else {
              updated.avatar = (avatar || '')
            }

            if (typeof localUsername === 'string') {
              updated.username = localUsername
            } else {
              updated.username =  username
            }

            if (typeof localBio === 'string') {

              updated.bio = localBio
            } else {
              updated.bio = (bio || '')
            }
          }
        )
      )

      // const newProfile = newProfileData?.data?.updateUserProfile

      updateProfileRealm(
        image ?? (avatar || undefined),
        localUsername ?? (username || undefined),
        localBio ?? (bio || undefined),
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

        const params = {
          Body: file,
          Bucket: bucketNameProfileUncompressed,
          Key: `${credentials.identityId}/${profile.userId}/${escapeUnsafe(name)}.${type}`,
          'Content-Type': `image/${type}`
        }
        
        if (newS3) {
          const res = await newS3.send(new PutObjectCommand(params));

          

          return `${credentials.identityId}/${profile.userId}/${escapeUnsafe(name)}.${type}`
        }
          

        return undefined
      } catch (e) {
        
        return undefined
      }
    };

  const deletePicture = async (key: string) => {
    try {
      const params = {
        Key: key,
        Bucket: bucketNameProfile,
      }

      const credentials = await Auth.currentCredentials();
      const newS3 = new S3Client({
        region: bucketRegion,
        credentials: Auth.essentialCredentials(credentials),

      })

      if (newS3) {
        const res = await newS3.send(new DeleteObjectCommand(params))

        
      }
    } catch(e) {
      
    }
  }

  const deleteProfileImage = async () => {
    try {

      await deletePicture(avatar)
      setAvatar('')
      setIsPicDialog(false)
    } catch(e) {
      
    }
  }

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

      const key = await uploadPicture(base64Data, profile.username, type)

      

      setAvatar(`${key.split('.')[0]}.webp`)

      await saveProfile(`${key.split('.')[0]}.webp`)

      /** delete local file */
      await RNFS.unlink(imagePath)

      // setIsModal(false)
      setIsPicDialog(false)
      setLoading(false)

    } catch(e) {
      
      setIsPicDialog(false)
      setLoading(false)
    }
  }

  const pickImage = async () => {
    try {
      launchImageLibrary({
        mediaType: 'photo',
        quality: 1,
      }, async (result) => {
        

          if (!(result?.didCancel)) {
            // setImage(result.uri);
            const { assets } = result
            const [{ uri }] = assets
            // 
            // Getting the file type, ie: jpeg, png or gif

            
            if (!uri) {
              
              return
            }

            const type = uri.split('.')[1]

            return onDone(uri, type)
          }
      })

    } catch(e) {
      
      Toast.show({
        type: 'error',
        text1: 'Unable to capture snapshot',
        text2: 'Unable to to capture snapshot due to an internal error',
      })
    }
  }

  const takePicture = () => {
    setIsPicDialog(false)
    navigation.navigate('UserProfileCamera', { userProfileId })
  }

  const openPictureDialog = () => setIsPicDialog(true)


  if (loading) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%'}} backgroundColor="lightRegularCardBackground">
        <Spinner isVisible={true} type="ThreeBounce" size={100} color="#FFFFFF" />
      </Box>
    )
  }

  return (
    <Box flex={1}>
      <Box flex={3} justifyContent="center" alignItems="center">
        <Box>
          <FastImage
            source={{ uri: buildProfileURL(avatar) }}
            style={styles.profilePicture}
            resizeMode={FastImage.resizeMode.contain}
          />
        </Box>
        <TouchableOpacity style={styles.buttonLink} onPress={openPictureDialog}>
          <Text variant="buttonLink">
            Change Profile Photo
          </Text>
        </TouchableOpacity>
      </Box>
      <Box flex={5}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <Box flex={1}>
            <Box m={{ phone: 'xs', tablet: 's' }} flexDirection="row" justifyContent="center">
              <TextField
                onChangeText={setUsername}
                value={username}
                placeholder="Username"
                title="Username"
                style={{ width: '80%' }}
              />
            </Box>
            <Box m={{ phone: 'xs', tablet: 's' }}>
              <KeyboardAvoidingView
                keyboardVerticalOffset={height + 64}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.container}
              >
                <TextField
                  onChangeText={setBio}
                  value={bio}
                  placeholder="Bio"
                  title="Bio"
                  style={{ width: '80%' }}
                />
              </KeyboardAvoidingView>
            </Box>
          </Box>
        </TouchableWithoutFeedback>
      </Box>
      <Box flex={2} alignItems="center">
        <Button onPress={saveProfile}>
          Save
        </Button>
      </Box>
      <Dialog
        bottom
        visible={isPicDialog}
        useSafeArea
        onDismiss={cancelPicDialog}
        pannableHeaderProps={{ title: 'Change Profile Photo'}}
      >
        <TouchableOpacity style={styles.buttonLink} onPress={takePicture}>
          <Text variant="buttonLink">
            Take Photo
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buttonLink} onPress={pickImage}>
          <Text variant="buttonLink">
            Choose from Library
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buttonLink} onPress={deleteProfileImage}>
          <Text variant="buttonLink">
            Remove Current Photo
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buttonLink} onPress={cancelPicDialog}>
          <Text variant="buttonLink">
            Cancel
          </Text>
        </TouchableOpacity>

      </Dialog>
    </Box>
  )
}

export default UserEditProfile
