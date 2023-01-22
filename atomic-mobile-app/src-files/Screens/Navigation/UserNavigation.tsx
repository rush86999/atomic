import React, { useState, useEffect, Dispatch, SetStateAction } from 'react'
import {
  Appearance,
  Linking } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'

import Toast from 'react-native-toast-message'
import {
  Amplify,
  Auth,
  Hub,
  syncExpression,
 } from 'aws-amplify'
import { GraphQLResult, API } from '@aws-amplify/api'
import {
  DataStore,
 } from '@aws-amplify/datastore'

 import { UpdateMode } from 'realm'

 import {
   UserProfile as UserProfileRealm,
 } from '@realm/UserProfile'

 import {
   Post as PostRealm,
 } from '@realm/Post'

 import {
   Point,
   User,
   UserActivateType,
   PrimaryGoalType,
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
   RoutineData,
   UserExerciseStat,
   DailyToDo,
   ScheduleToDo,
   MasterToDo,
   WeeklyToDo,
   GroceryToDo,
   Schedule,
   Streak,
   UserProfile,
 } from '@models'

 import InAppBrowser, { RedirectResult } from 'react-native-inappbrowser-reborn'

 import awsconfig from '@app/aws-exports'

import UserContext from '@navigation/user-context'
import {
  navigationTheme,
  darkNavigationTheme,
} from '@theme/theme'

import NotifService from '@screens/Notification/NotifService'

import UserInitialRegister from '@screens/User/Register/UserInitialRegister'
import UserConfirmRegister from '@screens/User/Register/UserConfirmRegister'
import UserLogin from '@screens/User/Login/UserLogin'
import UserForgotPassword from '@screens/User/Login/UserForgotPassword'
import UserCompleteRegister from '@screens/User/Register/UserCompleteRegister'
import UserAlternateCompleteRegister from '@screens/User/Register/UserAlternateCompleteRegister'
import UserDrawerNavigation from '@navigation/UserDrawerNavigation'

import { ReceivedNotification } from 'react-native-push-notification'

import { getRealmApp } from '@realm/realm'

import ListUserProfilesBySub from '@graphql/Queries/ListUserProfilesBySub'

import {
  ListUserProfilesBySubQuery,
  ListUserProfilesBySubQueryVariables,
} from '@app/API'

import makeApolloClient from '@app/apollo/apollo'
import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { getDeepLink } from '@app/zoom/constants'
import { closeZoomOAuthLink } from '../../zoom/zoomMeetingHelper';




type tokenObject = { os: string, token: string }

type onNotification = (notification: emitNotification) => void

type emitNotification = Omit<ReceivedNotification, "userInfo">

const primaryTypes = [
  PrimaryGoalType.NEWSKILLTYPE,
  PrimaryGoalType.MEDITATION,
  PrimaryGoalType.STEP,
  PrimaryGoalType.STRENGTH,
  PrimaryGoalType.ENDURANCE,
  PrimaryGoalType.WEIGHT,
  PrimaryGoalType.ROUTINE,
  PrimaryGoalType.HABITTYPE,
  PrimaryGoalType.TODO,
  PrimaryGoalType.LIMITTYPE,
]

type UserContextType = {
  sub: string,
  getRealmApp: () => Realm,
  checkUserConfirmed: () => Promise<boolean>,

  setUserConfirmed: Dispatch<SetStateAction<boolean>>,
  client: ApolloClient<NormalizedCacheObject> | null,
}

function UserDrawerNavigationWithContext() {
  return (
    <UserContext.Consumer>
      {({ client }: UserContextType) => (
        <UserDrawerNavigation client={client} />
      )}
    </UserContext.Consumer>
  )
}

function UserInitialRegisterWithContext() {
  return (
    <UserContext.Consumer>
      {({ checkUserConfirmed, getRealmApp, setUserConfirmed }: UserContextType) => (
        <UserInitialRegister 
          getRealmApp={getRealmApp} 
          checkUserConfirmed={checkUserConfirmed}
          setUserConfirmed={setUserConfirmed}
        />
      )}
    </UserContext.Consumer>
  )
}

function UserConfirmRegisterWithContext() {
  return (
    <UserContext.Consumer>
      {({ checkUserConfirmed, getRealmApp, setUserConfirmed }) => (
        <UserConfirmRegister
          getRealmApp={getRealmApp} 
          checkUserConfirmed={checkUserConfirmed}
          setUserConfirmed={setUserConfirmed}
         />
      )}
    </UserContext.Consumer>
  )
}

function UserLoginWithContext() {
  return (
    <UserContext.Consumer>
      {({ checkUserConfirmed, getRealmApp, setUserConfirmed }) => (
        <UserLogin 
          getRealmApp={getRealmApp} 
          checkUserConfirmed={checkUserConfirmed} 
          setUserConfirmed={setUserConfirmed} 
        />
      )}
    </UserContext.Consumer>
  )
}

function UserAternateCompleteRegisterWithContext() {
  return (
    <UserContext.Consumer>
      {({ checkUserConfirmed, getRealmApp, setUserConfirmed, client }: UserContextType) => (
        <UserAlternateCompleteRegister 
          getRealmApp={getRealmApp} 
          checkUserConfirmed={checkUserConfirmed}
          setUserConfirmed={setUserConfirmed}
          client={client}
        />
      )}
    </UserContext.Consumer>
  )
}

function UserCompleteRegisterWithContext() {
  return (
    <UserContext.Consumer>
      {({ checkUserConfirmed, getRealmApp, setUserConfirmed, client }: UserContextType) => (
        <UserCompleteRegister 
          getRealmApp={getRealmApp} 
          checkUserConfirmed={checkUserConfirmed}
          setUserConfirmed={setUserConfirmed}
          client={client}
        />
      )}
    </UserContext.Consumer>
  )
}

async function urlOpener(url: string, redirectUrl: string) {
  try {
    const isAvailable = await InAppBrowser.isAvailable();
    if (isAvailable) {
      const { type, url: newUrl } = (await InAppBrowser.openAuth(url, redirectUrl, {
        showTitle: false,
        enableUrlBarHiding: true,
        enableDefaultShare: false,
        ephemeralWebSession: false,
      })) as RedirectResult

      if (type === 'success' && newUrl) {
        Linking.openURL(newUrl)
      }
    } else {
      InAppBrowser.closeAuth()
      const { type, url: newUrl } = (await InAppBrowser.openAuth(url, redirectUrl, {
        showTitle: false,
        enableUrlBarHiding: true,
        enableDefaultShare: false,
        ephemeralWebSession: false,
      })) as RedirectResult

      if (type === 'success' && newUrl) {
        Linking.openURL(newUrl)
      }
    }

  } catch(e) {
    InAppBrowser.closeAuth()
    await new Promise((resolve) => setTimeout(resolve, 500));
    const { type, url: newUrl } = (await InAppBrowser.openAuth(url, redirectUrl, {
      showTitle: false,
      enableUrlBarHiding: true,
      enableDefaultShare: false,
      ephemeralWebSession: false,
    })) as RedirectResult

    if (type === 'success' && newUrl) {
      Linking.openURL(newUrl)
    }
  }
}

const Stack = createStackNavigator()

let globalUserId = 'null'
let globalSub = 'null'
let globalPointId = 'null'

Amplify.configure({
  ...awsconfig,
  oauth: {
    ...awsconfig.oauth,
    urlOpener,
  },
})

DataStore.configure({
  syncExpressions: [
    syncExpression(Following, () => {
      return following => following.userId('eq', globalUserId)
    }),
    syncExpression(User, () => {
      return user => user.sub('eq', globalSub)
    }),
    syncExpression(Goal, () => {
      return goal => goal.userId('eq', globalUserId)
    }),
    syncExpression(GoalExercise, () => {
      return goalExercise => goalExercise.userId('eq', globalUserId)
    }),
    syncExpression(StepData, () => {
      return stepData => stepData.userId('eq', globalUserId)
    }),
    syncExpression(StrengthData, () => {
      return strengthData => strengthData.userId('eq', globalUserId)
    }),
    syncExpression(EnduranceData, () => {
      return enduranceData => enduranceData.userId('eq', globalUserId)
    }),
    syncExpression(WeightData, () => {
      return weightData => weightData.userId('eq', globalUserId)
    }),
    syncExpression(NewSkillTypeData, () => {
      return newSkillTypeData => newSkillTypeData.userId('eq', globalUserId)
    }),
    syncExpression(HabitTypeData, () => {
      return habitTypeData => habitTypeData.userId('eq', globalUserId)
    }),
    syncExpression(LimitTypeData, () => {
      return limitTypeData => limitTypeData.userId('eq', globalUserId)
    }),
    syncExpression(MeditationData, () => {
      return meditationData => meditationData.userId('eq', globalUserId)
    }),
    syncExpression(Level, () => {
      return level => level.userId('eq', globalUserId)
    }),
    syncExpression(Point, () => {
      return point => point.id('eq', globalPointId)
    }),
    syncExpression(UserStat, () => {
      return userStat => userStat.userId('eq', globalUserId)
    }),
    syncExpression(UserActivateType, () => {
      return userActivateType => userActivateType.userId('eq', globalUserId)
    }),
    syncExpression(RoutineData, () => {
      return routineData => routineData.userId('eq', globalUserId)
    }),
    syncExpression(UserExerciseStat, () => {
      return userExerciseStat => userExerciseStat.userId('eq', globalUserId)
    }),
    syncExpression(DailyToDo, () => {
      return dailyToDo => dailyToDo.userId('eq', globalUserId)
    }),
    syncExpression(ScheduleToDo, () => {
      return scheduleToDo => scheduleToDo.userId('eq', globalUserId)
    }),
    syncExpression(MasterToDo, () => {
      return masterToDo => masterToDo.userId('eq', globalUserId)
    }),
    syncExpression(WeeklyToDo, () => {
      return weeklyToDo => weeklyToDo.userId('eq', globalUserId)
    }),
    syncExpression(GroceryToDo, () => {
      return groceryToDo => groceryToDo.userId('eq', globalUserId)
    }),
    syncExpression(Schedule, () => {
      return schedule => schedule.userId('eq', globalUserId)
    }),
    syncExpression(Streak, () => {
      return streak => streak.userId('eq', globalUserId)
    }),
    syncExpression(UserProfile, () => {
      return userProfile => userProfile.sub('eq', globalSub)
    }),
  ]
})




function UserNavigation() {
  const [sub, setSub] = useState<string>('')
  const [userConfirmed, setUserConfirmed] = useState<boolean>(false)

  const [client, setClient] = useState<ApolloClient<NormalizedCacheObject>>()
  const [activeToken, setActiveToken] = useState<string>('')

  const realm = getRealmApp()


  const darkMode = Appearance.getColorScheme() === 'dark'

  useEffect(() => {
    (async () => {
      try {
        const token = (await Auth.currentSession()).getIdToken().getJwtToken()
        if (token !== activeToken) {
          
          setActiveToken(token)
        }
      } catch (e) {
        
      }
    })()
  })

  useEffect(() => {
    (async () => {
      try {
        const token = (await Auth.currentSession()).getIdToken().getJwtToken()
        if (!token) {
          
          return
        }
        
        const newClient = await makeApolloClient(token)
        setClient(newClient)
      } catch (e) {
        
      }
    })()
  }, [activeToken])


  const createUserProfileRealm = async () => {
      try {
        const { payload: { sub } } = (await Auth.currentSession()).getIdToken()

        if (sub) {
          const userProfileData = await API.
            graphql({
              query: ListUserProfilesBySub,
              variables: {
                sub,
                limit: 1,
              } as ListUserProfilesBySubQueryVariables
            }) as GraphQLResult<ListUserProfilesBySubQuery>

          const userProfile = userProfileData?.data?.listUserProfilesBySub?.items?.[0]

          

          if (userProfile?.id) {

            realm.write(() => {
              realm.create<UserProfileRealm>('UserProfile', {
                id: userProfile?.id,
                avatar: userProfile?.avatar,
                username: userProfile?.username,
                email: userProfile?.email,
                followerCount: userProfile?.followerCount,
                followingCount: userProfile?.followingCount,
                postCount: userProfile?.postCount,
                bio: userProfile?.bio,
                userId: userProfile?.userId,
                sub: userProfile?.sub,
                pointId: userProfile?.pointId,
              },
              UpdateMode.Modified,
            )
            })

            setUserConfirmed(true)
          }
        }
      } catch(e) {
        
      }
  }


  const checkUserConfirmed = async () => {
    let localProfile
    try {
      const { payload: { sub } } = (await Auth.currentSession()).getIdToken()
      
      if (sub) {


        const userProfiles = await DataStore.query(UserProfile, c => c.sub('eq', sub))
        
        if (!(userProfiles?.[0]?.id)) {
          
          return
        }

        localProfile = userProfiles[0]

        const point = await DataStore.query(Point, localProfile?.pointId)
        
        const [user] = await DataStore.query(User, c => c.sub('eq', sub))
        
        if (!(user?.id)) {
          return
        }
        const activateTypes = primaryTypes?.map(async (type) => {
            const [activateType] = await DataStore.query(UserActivateType, c => c
              .userId('eq', user.id)
              .primaryGoalType('eq', type)
              .secondaryGoalType('eq', 'null'))
            return activateType
          })
        ?.filter(userActivateType => (userActivateType !== null))
        
        const isActive = primaryTypes?.length === activateTypes?.length
        if (primaryTypes?.length !== activateTypes?.length) {
          
        }


        return localProfile?.id && point?.id && user?.id && isActive
      }
    } catch(e) {
      
    }

    if (!(localProfile?.id)) {
      await createUserProfileRealm()
    }

  }

  const onNotif: onNotification = (notif) => {
    Toast.show({
      type: 'info',
      text1: typeof notif?.message === 'string' ? notif?.message as string : '',
      text2: notif.subText,
    })
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

  const createUserProfileRealmForRegistration = async (id: string, userId: string, pointId: string, sub: string, email: string, username: string) => {
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

  const createUserProfile = async (userId: string, pointId: string, sub: string, email: string, username: string) => {
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

      createUserProfileRealmForRegistration(
        userProfile.id,
        userProfile.userId,
        userProfile.pointId,
        userProfile.sub,
        userProfile.email,
        userProfile.username,
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

      const { payload } = (await Auth.currentSession()).getIdToken()

      const sub = payload?.sub
      const email = payload?.email
      const username = payload?.['cognito:username']

      if (!sub || !email || !username) {
        
        Toast.show({
          type: 'error',
          text1: 'Oops..',
          text2: 'No user was registered. Please try again from scratch',
        })

        return
      }

      const user = await DataStore.save(
        new User({
          profileId: 'null',
          sub,
          email,
        })
      )

      const point = await createPoint()

      await createUserProfile(user.id, point.id, sub, user.email, username)

      await createGoalTypes(user.id)

     const isConfirmed = await checkUserConfirmed()
     if (isConfirmed) {
      setUserConfirmed(isConfirmed)
     }
    } catch(e) {
      
      Toast.show({
        type: 'error',
        text1: 'Oops..',
        text2: 'Something went wrong. Please try again.'
      })
    }
  }

  useEffect(() => {
    (async () => {
      try {

        const { payload: { sub } } = (await Auth.currentSession()).getAccessToken()

        setSub(sub)
      } catch(e) {
      }
    })()
  }, [])

  useEffect(() => {
    const checkUserConfirmedLocal = async () => {
      let localProfile
      try {
        const { payload: { sub } } = (await Auth.currentSession()).getIdToken()
        
        if (sub) {

          const userProfiles = await DataStore.query(UserProfile, c => c.sub('eq', sub))
          
          if (!(userProfiles?.[0]?.id)) {
            
            return
          }

          localProfile = userProfiles[0]

          const point = await DataStore.query(Point, localProfile?.pointId)
          
          const [user] = await DataStore.query(User, c => c.sub('eq', sub))
          
          if (!(user?.id)) {
            return
          }
          const activateTypes = primaryTypes?.map(async (type) => {
              const [activateType] = await DataStore.query(UserActivateType, c => c
                .userId('eq', user.id)
                .primaryGoalType('eq', type)
                .secondaryGoalType('eq', 'null'))
              return activateType
            })
          ?.filter(userActivateType => (userActivateType !== null))
          
          const isActive = primaryTypes?.length === activateTypes?.length
          if (primaryTypes?.length !== activateTypes?.length) {
            
          }


          return localProfile?.id && point?.id && user?.id && isActive
        }
      } catch(e) {
        
      }

      if (!(localProfile?.id)) {
        await createUserProfileRealm()
      }

    }
    (async () => {
      try {
        if (!sub) {
          
          return
        }

        globalSub = sub
        await DataStore.stop()
        await DataStore.start()

        const userProfileRealms = realm.objects<UserProfileRealm>('UserProfile')
        const userProfileRealm = userProfileRealms.find(i => i?.sub === sub)

        if (userProfileRealm?.id) {

          globalUserId = userProfileRealm.userId

          globalPointId = userProfileRealm.pointId
          await DataStore.stop()
          await DataStore.start()
          const newIsConfirmed = await checkUserConfirmedLocal()
          if (newIsConfirmed) {
            setUserConfirmed(newIsConfirmed)
          }
        } else {
          const userProfiles = await DataStore.query(UserProfile, c => c.sub('eq', sub))
          
          if (userProfiles?.[0]?.id) {
            const dataStoreProfile = userProfiles[0]
            globalUserId = dataStoreProfile.userId
            globalPointId = dataStoreProfile.pointId
            await DataStore.stop()
            await DataStore.start()
            const newIsConfirmed = await checkUserConfirmedLocal()
            if (newIsConfirmed) {
              setUserConfirmed(newIsConfirmed || false)
            } 
          }
        }

        
        
      } catch(e) {
        
      }
    })()
  }, [sub])

  useEffect(() => {
    const createUserProfileRealmLocal = async () => {
        try {
          const { payload: { sub } } = (await Auth.currentSession()).getIdToken()

          if (sub) {
            const userProfileData = await API.
              graphql({
                query: ListUserProfilesBySub,
                variables: {
                  sub,
                  limit: 1,
                } as ListUserProfilesBySubQueryVariables
              }) as GraphQLResult<ListUserProfilesBySubQuery>

            const userProfile = userProfileData?.data?.listUserProfilesBySub?.items?.[0]

            

            if (userProfile?.id) {

              realm.write(() => {
                realm.create<UserProfileRealm>('UserProfile', {
                  id: userProfile?.id,
                  avatar: userProfile?.avatar,
                  username: userProfile?.username,
                  email: userProfile?.email,
                  followerCount: userProfile?.followerCount,
                  followingCount: userProfile?.followingCount,
                  postCount: userProfile?.postCount,
                  bio: userProfile?.bio,
                  userId: userProfile?.userId,
                  sub: userProfile?.sub,
                  pointId: userProfile?.pointId,
                },
                UpdateMode.Modified,
              )
              })

              setUserConfirmed(true)
            }
          }
        } catch(e) {
          
        }
    }
    (async () => {
      try {
        const userProfileRealms = realm.objects<UserProfileRealm>('UserProfile')
        if (!(userProfileRealms?.[0]?.id)) {
          return createUserProfileRealmLocal()
        }
      } catch(e) {
        
      }
    })()
  }, [sub])

  useEffect(() => {
    async () => {
      let localProfile: UserProfile
      try {
        const { payload: { sub } } = (await Auth.currentSession()).getIdToken()
        if (sub) {
          const profiles = await DataStore.query(UserProfile, c => c.sub('eq', sub))
          localProfile = profiles[0]

          if (!(localProfile?.id)) {
            
            return
          }


          const point = await DataStore.query(Point, localProfile?.pointId)

          if (!(point?.id)) {
            
            return
          }

          const [user] = await DataStore.query(User, c => c.sub('eq', sub))

          if (!(user?.id)) {
            
            return
          }
          const activateTypes = (await Promise.all(
            primaryTypes.map(async (type) => {
              const [activateType] = await DataStore.query(UserActivateType, c => c
                .userId('eq', user.id)
                .primaryGoalType('eq', type)
                .secondaryGoalType('eq', 'null'))
              return activateType
            })
          ))
          .filter(userActivateType => (userActivateType !== null))
          const isActive = primaryTypes.length === activateTypes.length
          if (primaryTypes.length !== activateTypes.length) {
            
          }

          if (localProfile?.id && point?.id && user?.id && isActive) {
            setUserConfirmed(true)
          }
        }
      } catch(e) {
        
      }

      if (!(localProfile?.id)) {
        await createUserProfileRealm()
      }

    }
  }, [sub])


  const enableSocialLogin = async (sub: string) => {
    if (!sub) {
      
      return
    }

    try {
      const isConfirmed = await checkUserConfirmed()
      if (isConfirmed) {
        setUserConfirmed(isConfirmed)
      }
    } catch(e) {
      
    }

    const userProfileObjects = realm.objects<UserProfileRealm>('UserProfile')
    

    if (userProfileObjects?.[0]?.sub && (userProfileObjects?.[0]?.sub !== sub)) {
      
      await createUserProfileRealm()
    }

    if (!(userProfileObjects?.[0]?.id)) {
      const profiles = await DataStore.query(UserProfile, c => c.sub('eq', sub))

      if (!(profiles?.[0]?.id)) {
        await createUser()
        return
      }
    }

    const profiles = await DataStore.query(UserProfile, c => c.sub('eq', sub))


    if (userProfileObjects?.[0]?.id !== profiles?.[0]?.id) {
      try {
          await createUserProfileRealm()
      } catch(e) {
        
      }

    }

    try {
      const isConfirmed = await checkUserConfirmed()
      if (isConfirmed) {
        setUserConfirmed(isConfirmed)
      }
    } catch(e) {
      
    }
  }

  useEffect(() => {
    (async () => {
      try {
        Linking.addEventListener('url', async ({ url }) => {
          try {

            
              
              if ((url === 'atomiclife://settings-nav/cal-integrations')
                || (url === 'atomiclife://todo-posts-nav/onboard')) {
                
                await closeZoomOAuthLink()
              }
              
          } catch (e) {
            
          }
        })
      } catch (e) {
        
      }
    })()
  }, [])

  useEffect(() => {
    (async () => {
        Hub.listen("auth", async ({ payload: { event, data } }) => {
          
          switch (event) {
            case 'parsingCallbackUrl':
            break
          case 'tokenRefresh':
            const token = (await Auth.currentSession()).getIdToken().getJwtToken()
            const newClient = await makeApolloClient(token)
            setClient(newClient)
            break
          case 'signIn':
             
             if (data?.signInUserSession?.idToken?.payload?.sub) {
                setSub(data?.signInUserSession?.idToken?.payload?.sub)
                const token = (await Auth.currentSession()).getIdToken().getJwtToken()
                const newClient = await makeApolloClient(token)
                setClient(newClient)
             }

             break
          case 'cognitoHostedUI':
            
            
            if (data?.signInUserSession?.idToken?.payload?.sub) {
              setSub(data?.signInUserSession?.idToken?.payload?.sub)
              const token = (await Auth.currentSession()).getIdToken().getJwtToken()
              const newClient = await makeApolloClient(token)
              setClient(newClient)
            }
            return enableSocialLogin(data?.signInUserSession?.idToken?.payload?.sub)
          case 'signOut':
             setSub('')
             break
          case 'signIn_failure':
             
             break
          case 'customOAuthState':
              break
          
          default:
            break

         }
       })
    })()
  }, [])

  useEffect(() => {
    (async () => {
      try {
        if (!sub || !userConfirmed) {
          return
        }

        const onRegister = async (tokenObject: tokenObject) => {

          const [user] = await DataStore.query(User, c => c.sub('eq', sub))

          if (!(user?.id)) {
            return
          }


          if (user?.pushToken !== tokenObject.token) {
            await DataStore.save(
              User.copyOf(
                user, updated => {
                  updated.pushToken = tokenObject.token
                }
              )
            )
          }
        }
        new NotifService(onRegister, onNotif)
      } catch(e) {
      }
    })()
  }, [sub, userConfirmed])

  useEffect(() => () => {
    realm.write(() => {
      const postRealms = realm.objects<PostRealm>('Post')

      realm.delete(postRealms)
    })
  }, [])


  return (

        <UserContext.Provider value={{ sub, checkUserConfirmed, getRealmApp, setUserConfirmed, client }}>
          <NavigationContainer 
            theme={darkMode ? darkNavigationTheme : navigationTheme}
            linking={{
              prefixes: [getDeepLink()],
              config: {
                screens: {
                  Home: {
                    path: '',
                    screens: {
                      UserToDoAndPostsTabNavigation: {
                        path: 'todo-posts-nav',
                        screens: {
                          UserTaskNavigation: {
                            path: 'task',
                            screens: {
                              UserOnBoard: 'onboard',
                            }
                          }
                        }
                      },
                      UserSettingsStackNavigation: {
                        path: 'settings-nav',
                        screens: {
                          UserViewCalendarAndContactIntegrations: 'cal-integrations',
                        }
                      }
                    }
                  }
                }
              }
            } as any}

          >
            <Stack.Navigator
              screenOptions={{
                headerShown: false,
              }}
            >
              {
                (sub && userConfirmed)
                  ? (
                      <Stack.Screen name="Home" component={UserDrawerNavigationWithContext} />
                ) : (
                    <>
                      <Stack.Screen
                        name="UserLogin"
                        component={UserLoginWithContext}
                        options={{ title: 'Login' }}
                      />
                      <Stack.Screen
                        name="UserForgotPassword"
                        component={UserForgotPassword}
                        options={{ title: 'Forgot Password' }}
                      />
                      <Stack.Screen
                        name="UserInitialRegister"
                        component={UserInitialRegisterWithContext}
                        options={{ title: 'Initial Register' }}
                      />
                      <Stack.Screen
                        name="UserConfirmRegister"
                        component={UserConfirmRegisterWithContext}
                        options={{ title: 'Confirm Register' }}
                      />
                      <Stack.Screen
                        name="UserCompleteRegister"
                        component={UserCompleteRegisterWithContext}
                        options={{ title: 'Complete Registeration' }}
                      />
                      <Stack.Screen
                        name="UserAlternateCompleteRegister"
                        component={UserAternateCompleteRegisterWithContext}
                        options={{ title: 'Complete Registeration'}}
                      />
                    </>
                )
              }
            </Stack.Navigator>
          </NavigationContainer>
        </UserContext.Provider>
      
  )
}

export default UserNavigation
