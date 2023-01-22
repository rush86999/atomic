import React, { useState, useEffect, Dispatch, SetStateAction } from 'react'
import {
  StyleSheet,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Platform,
  Keyboard,
} from 'react-native'
 import { useHeaderHeight } from '@react-navigation/elements'
 import {TextField } from 'react-native-ui-lib'

 import {
   DataStore,
  } from '@aws-amplify/datastore'
import { Auth } from '@aws-amplify/auth'
import Realm from 'realm'

import {
  useNavigation,
 } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'

import Toast from 'react-native-toast-message'

import Box from '@components/common/Box'
import Button from '@components/Button'

import {
  UserProfile as UserProfileRealm,
} from '@realm/UserProfile'


type RootNavigationStackParamList = {
  Home: undefined,
  UserConfirmRegister: undefined,
  UserInitialRegister: undefined,
}

type UserInitialRegisterNavigationProp = StackNavigationProp<
  RootNavigationStackParamList,
  'UserInitialRegister'
>

type Props = {
  checkUserConfirmed: () => Promise<boolean>,
  getRealmApp: () => Realm,
  setUserConfirmed: Dispatch<SetStateAction<boolean>>,
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})

function UserInitialRegister(props: Props) {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')

  const {
    checkUserConfirmed,
    getRealmApp,
  } = props

  const setUserConfirmed = props?.setUserConfirmed

  const realm = getRealmApp()

  useEffect(() => {
    (async () => {
      try {
        const { payload: { sub } } = (await Auth.currentSession()).getIdToken()
        if (sub) {
          const profiles = realm.objects<UserProfileRealm>('UserProfile')

          if (profiles?.length > 0) {
            const [profile] = profiles

            if (
              profiles?.[0]?.sub
              && (
                (profiles?.[0]?.sub !== sub)
              )
            ) {
              realm.write(() => {
                realm.deleteAll()
              })
              return
            }

            if (profile?.username) {
              const isConfirmed = await checkUserConfirmed()
              if (isConfirmed) {
                setUserConfirmed(isConfirmed ?? false)
              }
            }

          } else {
            navigation.navigate('UserConfirmRegister')
          }
        }
      } catch(e) {
        
      }
    })()
  }, [])


  const navigation = useNavigation<UserInitialRegisterNavigationProp>()

  const validateEmail = (email: string) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }

  const userSignUp = async () => {
    try {
      if (!email) {
        Toast.show({
          type: 'error',
          text1: 'Empty email',
          text2: 'We need a  valid email to register your account'
        })
        return
      }

      const isValidEmail = validateEmail(email)

      if (!isValidEmail) {
        Toast.show({
          type: 'error',
          text1: 'Invalid email',
          text2: 'We need a  valid email to register your account'
        })

        return 
      }

      if (password !== confirmPassword) {
        Toast.show({
          type: 'error',
          text1: 'Passwords do not match',
          text2: 'Pleae check both passwords as they do not match'
        })

        return 
      }

      const { userSub } = await Auth.signUp({
        username: email,
        password,
      })


      realm.write(() => {
        realm.deleteAll()
        const user = realm.create('User', {
          id: 1,
          sub: userSub,
          email,
          isNew: true,
        })

        
      })

      await DataStore.clear()

      navigation.navigate('UserConfirmRegister')

    } catch(e: any) {
      

      if (e.message === 'User is already confirmed'
      || e.name === 'InvalidParameterException'
      || e.name === 'UsernameExistsException') {
        navigation.navigate('UserConfirmRegister')
      }
    }
  }

  const height = useHeaderHeight()

  return (
    <Box flex={1} justifyContent="center" alignItems="center">
      <KeyboardAvoidingView
        keyboardVerticalOffset={height + 64}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <TouchableWithoutFeedback style={styles.container} onPress={Keyboard.dismiss} accessible={false}>
          <Box flex={1} justifyContent="center" alignItems="center">
            <Box flexDirection="row" m={{ phone: 'xs', tablet: 's' }} justifyContent="center" alignItems="center">
                <TextField
                  onChangeText={setEmail}
                  value={email}
                  placeholder="Email"
                  autoCapitalize='none'
                  autoCorrect={false}
                  autoCompleteType='email'
                  style={{ width: '50%' }}
                />
            </Box>
            <Box flexDirection="row" m={{ phone: 'xs', tablet: 's' }} justifyContent="center" alignItems="center">
              <TextField
                onChangeText={setPassword}
                value={password}
                placeholder="Password"
                autoCapitalize='none'
                autoCorrect={false}
                secureTextEntry
                style={{ width: '50%' }}
              />
            </Box>
            <Box flexDirection="row" m={{ phone: 'xs', tablet: 's' }} justifyContent="center" alignItems="center">
              <TextField
                onChangeText={setConfirmPassword}
                value={confirmPassword}
                placeholder="Confirm Password"
                autoCapitalize='none'
                autoCorrect={false}
                secureTextEntry
                style={{ width: '50%' }}
              />
            </Box>
            <Button onPress={userSignUp}>
              Sign Up
            </Button>
          </Box>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Box>
  )
}

export default UserInitialRegister
