import React, { useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
 import { useHeaderHeight } from '@react-navigation/elements'
import {TextField} from 'react-native-ui-lib'
import { Auth } from 'aws-amplify'
import Toast from 'react-native-toast-message'
import {
  useNavigation,
 } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'

import Box from '@components/common/Box'
import Button from '@components/Button'

type RootNavigationStackParamList = {
  UserInitialRegister: undefined,
  UserForgotPassword: undefined,
  UserChangePassword: undefined,
  UserLogin: undefined,
}

type UserForgotPasswordNavigationProp = StackNavigationProp<
  RootNavigationStackParamList,
  'UserInitialRegister'
>

function UserForgotPassword() {
  const [stage, setStage] = useState<number>(0)
  const [email, setEmail] = useState<string>('')
  const [code, setCode] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')

  const navigation = useNavigation<UserForgotPasswordNavigationProp>()

  const resetPassword = async () => {
    try {
      await Auth.forgotPassword(email)

      setStage(1)

    } catch(e: any) {
      Toast.show({
        type: 'error',
        text1: 'Oops...',
        text2: e.message,
      })
    }
  }

  const confirmResetPassword = async () => {
    try {
      if (password !== confirmPassword) {
        Toast.show({
          type: 'error',
          text1: 'No match',
          text2: 'The passwords do no not match'
        })
        return
      }

      await Auth.forgotPasswordSubmit(email, code, password)
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Password was changed successfully!'
      })

      navigation.navigate('UserLogin')
    } catch(e) {
    }
  }

  const renderForgotPassword = () => {
    switch(stage) {
      case 0:
        return (
          <Box flex={1} justifyContent="center" alignItems="center">
            <TextField
              title="Email"
              onChangeText={setEmail}
              value={email}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Box m={{ phone: 'm', tablet: 'l' }}>
              <Button onPress={resetPassword}>
                Send code for reset
              </Button>
            </Box>
          </Box>
        )

      case 1:
        return (
          <Box flex={1} justifyContent="center" alignItems="center">
            <Box mb={{ phone: 'm', tablet: 'l' }}>
              <TextField
                title="Authorization Code"
                onChangeText={setCode}
                value={code}
              />
            </Box>
            <Box mb={{ phone: 'm', tablet: 'l' }}>
              <TextField
                title="Password"
                type="password"
                onChangeText={setPassword}
                value={password}
              />
            </Box>
            <Box mb={{ phone: 'm', tablet: 'l' }}>
              <TextField
                title="Confirm Password"
                type="password"
                onChangeText={setConfirmPassword}
                value={confirmPassword}
              />
            </Box>
            <Button onPress={confirmResetPassword}>
              Reset Password
            </Button>
          </Box>
        )
    }
  }

  const height = useHeaderHeight()

  return (
    <Box flex={1}>
      <KeyboardAvoidingView
        keyboardVerticalOffset={height + 64}
        behavior={Platform.OS == "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
       >
         {renderForgotPassword()}
       </KeyboardAvoidingView>
    </Box>
  )
}

export default UserForgotPassword
