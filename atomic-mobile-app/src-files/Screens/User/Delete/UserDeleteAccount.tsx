import React, { useState, Dispatch, SetStateAction } from 'react'
import {
  Pressable,
  Modal,
  Appearance,
  StyleSheet,
} from 'react-native'
 import {DataStore} from '@aws-amplify/datastore'
import {
  DailyToDo,
  WeeklyToDo,
  MasterToDo,
  GroceryToDo,
  ScheduleToDo,
  User,
  Activity,
  Follower,
  Following,
  Goal,
  GoalExercise,
  StepData,
  StrengthData,
  EnduranceData,
  WeightData,
  NewSkillTypeData,
  HabitTypeData,
  LimitTypeData,
  MeditationData,
  Level,
  UserStat,
  UserExerciseStat,
  Point,
  UserProfile,
  Schedule,
  Streak,
  RoutineData,
  UserActivateType,
  Post,
  PostLike,
  SavedPost,
  Comment,
  Integration,
} from '@models'

 import Box from '@components/common/Box'
import Text from '@components/common/Text'
import Button from '@components/Button'

import { palette } from '@theme/theme'

import {
  User as UserRealm,
} from '@realm/User'
import { Auth } from '@aws-amplify/auth';
import { deleteUserAccountUrl } from '@app/lib/constants'
import { CognitoUser } from 'amazon-cognito-identity-js'
import axios from 'axios'
import Toast from 'react-native-toast-message'
import { TextField } from 'react-native-ui-lib'



const dark = Appearance.getColorScheme() === 'dark'

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22
  },
  modalView: {
    margin: 20,
    backgroundColor: dark ? palette.black : palette.white,
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: dark ? palette.white : palette.black,
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
})


 type Props = {
    checkUserConfirmed: () => Promise<boolean>,
    getRealmApp: () => Realm,
    setUserConfirmed: Dispatch<SetStateAction<boolean>>,
 }

 const DELETEKEY = 'Delete'

function UserDeleteAccount(props: Props) {
    const [isDelete, setIsDelete] = useState<boolean>(false)
    const [key, setKey] = useState<string>('')

    const getRealmApp = props.getRealmApp

    const realm = getRealmApp()
    const setUserConfirmed = props?.setUserConfirmed
    const checkUserConfirmed = props?.checkUserConfirmed
    const deleteFromDataStore = async () => {
        try {
            const { payload: { sub } } = (await Auth.currentSession()).getAccessToken()
            const users = await DataStore.query(User, u => u.sub('eq', sub))

            if (!users?.[0]?.id) {
                return
            }

            const userProfiles = await DataStore.query(UserProfile, u => u.sub('eq', sub))

            if (!userProfiles?.[0]?.id) {
                return
            }

            const userId = users[0].id
            const userProfileId = userProfiles[0].id
            const pointId = userProfiles[0].pointId

            const toDeletePoint = await DataStore.query(Point, pointId)

            await DataStore.delete(toDeletePoint)

            await DataStore.delete(Activity, a => a.userId('eq', userId))

            await DataStore.delete(Follower, f => f.userId('eq', userId))

            await DataStore.delete(Following, f => f.userId('eq', userId))

            await DataStore.delete(Goal, g => g.userId('eq', userId))

            await DataStore.delete(GoalExercise, g => g.userId('eq', userId))

            await DataStore.delete(StepData, s => s.userId('eq', userId))

            await DataStore.delete(StrengthData, s => s.userId('eq', userId))

            await DataStore.delete(EnduranceData, e => e.userId('eq', userId))

            await DataStore.delete(WeightData, w => w.userId('eq', userId))

            await DataStore.delete(NewSkillTypeData, n => n.userId('eq', userId))

            await DataStore.delete(HabitTypeData, h => h.userId('eq', userId))

            await DataStore.delete(LimitTypeData, l => l.userId('eq', userId))

            await DataStore.delete(MeditationData, m => m.userId('eq', userId))

            await DataStore.delete(Level, l => l.userId('eq', userId))

            await DataStore.delete(UserStat, u => u.userId('eq', userId))

            await DataStore.delete(UserExerciseStat, u => u.userId('eq', userId))

            await DataStore.delete(DailyToDo, d => d.userId('eq', userId))

            await DataStore.delete(WeeklyToDo, w => w.userId('eq', userId))

            await DataStore.delete(MasterToDo, m => m.userId('eq', userId))

            await DataStore.delete(GroceryToDo, g => g.userId('eq', userId))

            await DataStore.delete(ScheduleToDo, s => s.userId('eq', userId))

            await DataStore.delete(Schedule, s => s.userId('eq', userId))

            await DataStore.delete(Streak, s => s.userId('eq', userId))

            await DataStore.delete(RoutineData, r => r.userId('eq', userId))

            await DataStore.delete(UserActivateType, u => u.userId('eq', userId))

            await DataStore.delete(Post, p => p.userId('eq', userId))

            await DataStore.delete(PostLike, p => p.userId('eq', userId))

            await DataStore.delete(SavedPost, s => s.userId('eq', userId))

            await DataStore.delete(Comment, c => c.userId('eq', userId))

            await DataStore.delete(Integration, i => i.sub('eq', sub))

            await DataStore.delete(UserProfile, userProfileId)

            await DataStore.delete(User, userId)
        } catch (e) {
            
        }
    }

    const deleteUserOnBackend = async () => {
        try {
            const { payload: { sub } } = (await Auth.currentSession()).getAccessToken()
            const token = (await Auth.currentSession()).getIdToken().getJwtToken()
            const userObject = await Auth.currentAuthenticatedUser() as CognitoUser
            const userName = userObject.getUsername()
            const userSession = await Auth.userSession(userObject)
            const refreshToken = await userSession.getRefreshToken()

            const url = deleteUserAccountUrl
            const config = {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            }

            const data = {
                userId: sub,
                userName,
                refreshToken,
                accessToken: token,
            }
            const results = await axios.post(url, data, config)
        } catch (e) {
            
        }
    }

    const deleteUserAccount = async () => {
        try {
            await deleteFromDataStore()
            await deleteUserOnBackend()
            const isConfirmed = await checkUserConfirmed()
            
            realm.write(() => {
                const userRealms = realm.objects<UserRealm>('User')

                realm.delete(userRealms)
            })
            
            setUserConfirmed(isConfirmed || false)
              
        } catch (e) {
            
        }
    }

    const confirmAndDeleteUser = async () => {
        try {
            if (key === DELETEKEY) {
                await deleteUserAccount()
                Toast.show({
                    type: 'success',
                    text1: 'User account deleted',
                    text2: 'User account was successfully deleted'
                })
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Invalid key',
                    text2: 'The input key is invalid, please try again'
                })
            }
        } catch (e) {
            
        }
    }

    const enableDelete = () => setIsDelete(true)

    const disableDelete = () => setIsDelete(false)

    return (
        <Box flex={1} justifyContent="center" alignItems="center">
            <Box justifyContent="center" alignItems="center">
                <Text  m={{ phone: 's', tablet: 'm' }} variant="subheaderNormal">
                    Delete Account
                </Text>
                <Box m={{ phone: 's', tablet: 'm' }}>
                    <Button onPress={enableDelete}>
                        Delete
                    </Button>
                </Box>
            </Box>
            <Modal
                animationType="slide"
                transparent={true}
                visible={isDelete}
                onDismiss={disableDelete}
            >
                <Box style={styles.centeredView}>
                    <Box style={styles.modalView}>
                        <Box>
                            <Text textAlign="left" m={{ phone: 'm', tablet: 'l' }} variant="optionHeader">
                                To permanently delete account type 'Delete' (with capital D)
                            </Text>
                            <Text textAlign="left"  m={{ phone: 'm', tablet: 'l' }} variant="body">
                                Warning: This is irreversible
                            </Text>
                        </Box>
                        <TextField
                            title="Key Phrase"
                            value={key}
                            onChangeText={setKey}
                            style={{ width: '40%'}}
                        />
                        <Pressable onPress={confirmAndDeleteUser}>
                            <Text variant="buttonLink">
                                Submit
                            </Text>
                        </Pressable>
                        <Pressable onPress={disableDelete}>
                            <Text m={{ phone: 'm', tablet: 'l' }} variant="buttonText">
                                Cancel
                            </Text>
                        </Pressable>    
                    </Box>

                </Box>

            </Modal>
        </Box>
    )
}
 
 export default UserDeleteAccount









