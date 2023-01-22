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
import { dayjs } from '@app/date-utils'
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

import {
  User as UserRealm,
} from '@realm/User'

import {
  UserProfile as UserProfileRealm,
} from '@realm/UserProfile'

import Box from '@components/common/Box'
import Button from '@components/Button'
import { createTaskInStore, TableName } from '@progress/Todo/IntegrationHelper'
import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { UserContactInfoType } from '@dataTypes/UserContactInfoType'




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
  client: ApolloClient<NormalizedCacheObject>,
}

function UserAlternateCompleteRegister(props: Props) {
    const [username, setUsername] = useState<string>('')
    const [usernameTaken, setUsernameTaken] = useState<string>('')
    const [email, setEmail] = useState<string>('')

  const {
    checkUserConfirmed,
    getRealmApp,
  } = props
  const setUserConfirmed = props?.setUserConfirmed
  const client = props?.client

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
      realm.create<UserProfileRealm>(
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



      const userProfile = await DataStore.save(
        new UserProfile({
          username,
          email,
          userId,
          sub,
          pointId,
        })
      )

      

      createUserProfileRealm(
        userProfile.id,
        userProfile.userId,
        userProfile.pointId,
        userProfile.sub,
        userProfile.email,
      )

      const original = await DataStore.query(User, userId)

      const updatedUser = await DataStore.save(
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

  const updateUserRealmToRegistered = () => {
    realm.write(() => {
      const userObjects = realm.objects<UserRealm>('User')

      const [user] = userObjects

      user.isNew = false
    })
  }

  const createSampleTaskNote = async (userId: string) => {
    try {


       const notes = 'A sample todo item to take care of today'

       if (!notes) {
         Toast.show({
           type: 'info',
           text1: 'Empty',
           text2: 'Your task is empty'
         })
         return
       }


       const newDate = dayjs().format()


       const taskId = await createTaskInStore(
         userId,
         'Daily' as TableName,
         notes,
         newDate,
         false,
         false,
       )
        
      } catch(e) {
        }
  }

  const validateEmail = (email: string) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
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

      const { payload: { sub } } = (await Auth.currentSession()).getIdToken()

      realm.write(() => {
        realm.deleteAll()
        const user = realm.create('User', {
          id: 1,
          sub,
          email,
          isNew: false,
        })

        
      })

      await DataStore.clear()

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

      updateUserRealmToRegistered()

      await createSampleTaskNote(user.id)


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
                        onChangeText={setEmail}
                        value={email}
                        placeholder="Email"
                        style={{ width: '50%' }}
                        keyboardType="email-address"
                        autoComplete="email"
                        textContentType="emailAddress"
                        autoCapitalize="none"
                        autoCorrect={false}
                        title="Email"
                    />
                </Box>
                <Box m={{ phone: 'xs', tablet: 's' }} flexDirection="row" justifyContent="center" alignItems="center">
                    <TextField
                        onChangeText={setUsername}
                        value={username}
                        placeholder="Username"
                        style={{ width: '50%' }}
                        autoCapitalize='none'
                        autoCorrect={false}
                        error={usernameTaken}
                        title="Username"
                    />
                </Box>
                <Button style={{ width: 200 }} onPress={createUser}>
                Complete Sign Up
                </Button>
          </Box>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Box>
  )

}

export default UserAlternateCompleteRegister
