import React, { useState, useEffect, Dispatch, SetStateAction } from 'react'
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
import { Auth } from '@aws-amplify/auth'
import { API, GraphQLResult } from '@aws-amplify/api'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import Toast from 'react-native-toast-message'

import {
  User,
  Point,
  UserActivateType,
  PrimaryGoalType,
  UserProfile,
} from '@models'



import ListUserProfilesByUserName from '@graphql/Queries/ListUserProfilesByUserName'

import {
  ListUserProfilesByUserNameQuery,
  ListUserProfilesByUserNameQueryVariables,
} from '@app/api'


import Box from '@components/common/Box'
import Button from '@components/Button'

type RootNavigationStackParamList = {
  Home: undefined,
  UserLogin: undefined,
  UserCompleteSocialLogin: undefined,
  UserInitialRegister: undefined,
}

type UserCompleteSocialLoginNavigationProp = StackNavigationProp<
  RootNavigationStackParamList,
  'UserCompleteSocialLogin'
>

const primaryTypes = [
  PrimaryGoalType.NEWSKILLTYPE,
  PrimaryGoalType.MEDITATION,
  PrimaryGoalType.STEP,
  PrimaryGoalType.STRENGTH,
  PrimaryGoalType.ENDURANCE,
  PrimaryGoalType.WEIGHT,
  PrimaryGoalType.ROUTINE,
  PrimaryGoalType.HABITTYPE,
  PrimaryGoalType.LIMITTYPE,
]

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})

type Props = {
  checkUserConfirmed: () => Promise<boolean>,
  getRealmApp: () => Realm,
  setUserConfirmed: Dispatch<SetStateAction<boolean>>,
}

function UserCompleteSocialLogin(props: Props) {
  const [email, setEmail] = useState<string>('')
  const [username, setUsername] = useState<string>('')
  const [usernameTaken, setUsernameTaken] = useState<string>('')

  const {
    checkUserConfirmed,
    getRealmApp,
  } = props

  const setUserConfirmed = props?.setUserConfirmed

  const navigation = useNavigation<UserCompleteSocialLoginNavigationProp>()

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
          } as ListUserProfilesByUserNameQueryVariables
        }) as GraphQLResult<ListUserProfilesByUserNameQuery>

      if (usernameData?.data?.listUserProfilesByUserName?.items?.length > 0) {
        return false
      }

      return true
    } catch(e) {
    }
  }

  const createGoalTypes = async (userId: string) => {
    try {
      primaryTypes.forEach(async (type) => {
        try {
          await DataStore.save(
            new UserActivateType({
              userId,
              primaryGoalType: type,
              secondaryGoalType: 'null',
              activated: false,
          })
        )
        } catch(e) {
        }
      })
    } catch(e) {
    }
  }

  const createPoint = async () => {
    try {
      const point = await DataStore.save(new Point({
        points: 0
      }))

      return point
    } catch(e) {
    }
  }

  const createUserProfileRealm = async (id: string, userId: string, pointId: string, sub: string, email: string) => {
    realm.write(() => {
      realm.create(
        'UserProfile',
        {
          id,
          username,
          email,
          userId,
          sub,
          pointId,
        },
        Realm.UpdateMode.Modified,
      )
    })
  }

  const createUserProfile = async (userId: string, pointId: string, sub: string, email: string) => {
    try {

      if (!userId) {
        Toast.show({
          type: 'error',
          text1: 'Oops..',
          text2: 'No user was registered. Please try again from scratch'
        })

        return
      }

      if (!pointId) {
        Toast.show({
          type: 'error',
          text1: 'Oops..',
          text2: 'No user was registered. Please try again from scratch'
        })

        return
      }

      if (!sub) {
        Toast.show({
          type: 'error',
          text1: 'Oops..',
          text2: 'No user was registered. Please try again from scratch'
        })

        return
      }

      if (!email) {
        Toast.show({
          type: 'error',
          text1: 'Oops..',
          text2: 'No user was registered. Please try again from scratch'
        })

        return
      }



      const userProfile = await DataStore.save(new UserProfile({
        username,
        email,
        userId,
        sub,
        pointId,
      }))

      createUserProfileRealm(
        userProfile.id,
        userProfile.userId,
        userProfile.pointId,
        userProfile.sub,
        userProfile.email,
      )

      const original = await DataStore.query(User, userId)

      await DataStore.save(
        User.copyOf(
          original, updated => {
            updated.profileId = userProfile.id
          }
        )
      )

    } catch(e) {
      
      Toast.show({
        type: 'error',
        text1: 'Oops..',
        text2: 'Something went wrong'
      })
    }
  }

  const createUser = async () => {
    try {
      if (!username) {
        Toast.show({
          type: 'error',
          text1: 'Empty username',
          text2: 'We need a  valid username to register your account'
        })

        return
      }

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

      const { payload: { sub } } = (await Auth.currentSession()).getIdToken()

      const user = await DataStore.save(
        new User({
          profileId: 'null',
          sub,
          email,
        })
      )

      const point = await createPoint()

      await createUserProfile(user.id, point.id, sub, user.email)

      await createGoalTypes(user.id)

      const isConfirmed = await checkUserConfirmed()
      if (isConfirmed) {
        setUserConfirmed(isConfirmed ?? false)
      }
    } catch(e) {
      Toast.show({
        type: 'error',
        text1: 'Oops..',
        text2: 'Something went wrong. Please try again.'
      })
    }
  }

  const goToRegister = () => navigation.navigate('UserInitialRegister')

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
                placeholder="Username"
                style={{ width: '50%' }}
                autoCapitalize='none'
                autoCorrect={false}
                autoCompleteType='email'
                error={usernameTaken}
              />
            </Box>
            <Box m={{ phone: 'xs', tablet: 's' }} flexDirection="row" justifyContent="center" alignItems="center">
              <TextField
                onChangeText={setEmail}
                value={email}
                placeholder="Email"
                style={{ width: '50%' }}
                autoCapitalize='none'
                autoCorrect={false}
                autoCompleteType='email'
              />
            </Box>
            <Box mt={{ phone: 'xs', tablet: 's' }}>
              <Button onPress={createUser}>
                Confirm
              </Button>
            </Box>
          </Box>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Box>
  )

}

export default UserCompleteSocialLogin
