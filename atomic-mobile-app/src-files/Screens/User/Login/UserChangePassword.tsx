import React, { useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
 import { useHeaderHeight } from '@react-navigation/elements'
import {TextField} from 'react-native-ui-lib'
import { Auth } from 'aws-amplify'
import {
  useNavigation,
 } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'

import Toast from 'react-native-toast-message'

import Box from '@components/common/Box'
import Button from '@components/Button'

type RootNavigationStackParamList = {
  UserInitialRegister: undefined,
  UserForgotPassword: undefined,
  UserChangePassword: undefined,
  UserLogin: undefined,
}

type UserChangePasswordNavigationProp = StackNavigationProp<
  RootNavigationStackParamList,
  'UserChangePassword'
>

function UserChangePassword() {
  const [oldPassword, setOldPassword] = useState<string>('')
  const [newPassword, setNewPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')

  const navigation = useNavigation<UserChangePasswordNavigationProp>()

  const changePassword = async () => {
    try {
      if (newPassword !== confirmPassword) {
        Toast.show({
          type: 'error',
          text1: 'No match',
          text2: 'The two passwords do not match'
        })
        return
      }

      const user = await Auth.currentAuthenticatedUser()

      await Auth.changePassword(user, oldPassword, newPassword)

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Password was changed successfully'
      })

      navigation.goBack()

    } catch(e: any) {
      // 
      Toast.show({
        type: 'error',
        text1: 'Oops...',
        text2: e.message,
      })
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
         <Box m={{ phone: 's', tablet: 'm' }}>
           <Box mb={{ phone: 'm', tablet: 'l' }}>
             <TextField
               title="Old Password"
               onChangeText={setOldPassword}
               value={oldPassword}
             />
           </Box>
           <Box mb={{ phone: 'm', tablet: 'l' }}>
             <TextField
               title="New Password"
               onChangeText={setNewPassword}
               value={newPassword}
             />
           </Box>
           <Box mb={{ phone: 'm', tablet: 'l' }}>
             <TextField
               title="Confirm New Password"
               onChangeText={setConfirmPassword}
               value={confirmPassword}
             />
           </Box>
           <Button onPress={changePassword}>
             Change Password
           </Button>
         </Box>

       </KeyboardAvoidingView>
    </Box>
  )
}

export default UserChangePassword
