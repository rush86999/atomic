import React, { 
  useState, 
  useEffect,
  Dispatch,
  SetStateAction,
 } from 'react'
import {
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
 } from 'react-native'
import { useHeaderHeight } from '@react-navigation/elements'
import { TextField } from 'react-native-ui-lib'

import {
  DataStore,
 } from '@aws-amplify/datastore'

import { Auth} from '@aws-amplify/auth'
import { API, GraphQLResult, GRAPHQL_AUTH_MODE } from '@aws-amplify/api'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'

import Toast from 'react-native-toast-message'

import {
  User,
} from '@models'

import ListUserProfilesByUserName from '@graphql/Queries/ListUserProfilesByUserName'

import {
  ListUserProfilesByUserNameQuery,
  ListUserProfilesByUserNameQueryVariables,
} from '@app/api'

import {
  User as UserRealm
} from '@realm/User'

import Box from '@components/common/Box'
import Button from '@components/Button'

type RootNavigationStackParamList = {
  Home: undefined,
  UserLogin: undefined,
  UserConfirmRegister: undefined,
  UserCompleteRegister: undefined,
}

type UserConfirmRegisterNavigationProp = StackNavigationProp<
  RootNavigationStackParamList,
  'UserConfirmRegister'
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

function UserConfirmRegister(props: Props) {
  const [username, setUsername] = useState<string>('')
  const [code, setCode] = useState<string>('')
  const [usernameTaken, setUsernameTaken] = useState<string>('')

  const {
    checkUserConfirmed,
    getRealmApp,
  } = props

  const setUserConfirmed = props?.setUserConfirmed

  const navigation = useNavigation<UserConfirmRegisterNavigationProp>()

  const realm = getRealmApp()

  useEffect(() => {
    (async () => {
      try {
        const { payload: { sub } } = (await Auth.currentSession()).getIdToken()
        if (sub) {
          const isConfirmed = await checkUserConfirmed()
          if (isConfirmed) {
            setUserConfirmed(isConfirmed ?? false)
          }
        }
      } catch(e) {
      }
    })()
  }, [])

  const checkUsername = async (name: string): Promise<boolean> => {
    try {
      


      const usernameData = await API.
        graphql({
          query: ListUserProfilesByUserName,
          variables: {
            username: name,
          } as ListUserProfilesByUserNameQueryVariables,
          authMode: GRAPHQL_AUTH_MODE.AWS_IAM,
        }) as GraphQLResult<ListUserProfilesByUserNameQuery>

      
      
      if (usernameData?.data?.listUserProfilesByUserName?.items?.length > 0) {
        return false
      }

      return true
    } catch(e) {
      
      return undefined
    }
  }


  const confirmUser = async () => {
    try {

      if (!username) {
        Toast.show({
          type: 'error',
          text1: 'Empty username',
          text2: 'We need a  valid username to register your account'
        })

        return
      }

      const userRealm = realm.objectForPrimaryKey<UserRealm>('User', 1)

      

      const { email } = userRealm

      const usernameAvailable = await checkUsername(username)

      if (!usernameAvailable) {
        Toast.show({
          type: 'error',
          text1: 'Username not available',
          text2: 'Username is already taken'
        })

        setUsernameTaken('Username is already taken')

        return
      }

      setUsernameTaken('')

      await Auth.confirmSignUp(email, code)
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'You were successfully registered, please login'
      })
      navigation.navigate('UserLogin')
    } catch(e: any) {
      if ((e.message === 'User is already confirmed')
      || e.name === 'NotAuthorizedException') {
        navigation.navigate('UserLogin')
      } else {
        
        
        
        Toast.show({
          type: 'error',
          text1: 'Oops..',
          text2: `${e.message}`
        })
      }
    }
  }

  const resendConfirmationCode = async () => {
    try {
      const userRealm = realm.objectForPrimaryKey<UserRealm>('User', 1)

      const { sub } = userRealm

      const userList = await DataStore.query(User, c => c.sub('eq', sub), {
        limit: 1,
      })

      if (userList && userList.length > 0) {
        const [user] = userList
        await Auth.resendSignUp(user.email)
        Toast.show({
          type: 'success',
          text1: 'Code sent',
          text2: 'Code was send successfully'
        })
      }
    } catch(e) {
      Toast.show({
        type: 'error',
        text1: 'Oops..',
        text2: 'Unable to send code. Please try again.'
      })
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
            <Box m={{ phone: 'xs', tablet: 's' }} flexDirection="row" justifyContent="center" alignItems="center">
              <TextField
                onChangeText={setUsername}
                value={username}
                placeholder="Email"
                style={{ width: '50%' }}
                autoCapitalize='none'
                autoCorrect={false}
                autoCompleteType='email'
                error={usernameTaken}
              />
            </Box>
            <Box m={{ phone: 'xs', tablet: 's' }} flexDirection="row" justifyContent="center" alignItems="center">
              <TextField
                onChangeText={(text: string) => setCode(text.replace(/[^0-9]/g, ''))}
                value={code}
                placeholder="Code: example - 1245"
                type="numeric"
                style={{ width: '50%' }}
              />
            </Box>
            <Box mt={{ phone: 's', tablet: 'm' }}>
              <Button style={{ width: 200 }} onPress={confirmUser}>
                Confirm Sign Up
              </Button>
            </Box>
            <Box mt={{ phone: 's', tablet: 'm' }}>
              <Button style={{ width: 200 }} onPress={resendConfirmationCode}>
                Resend Code
              </Button>
            </Box>
          </Box>
        </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
        </Box>
  )

}

export default UserConfirmRegister
