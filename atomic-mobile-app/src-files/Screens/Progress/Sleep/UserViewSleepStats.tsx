import React, { useState, useEffect, useRef } from 'react';
import { DataStore, SortDirection } from '@aws-amplify/datastore'
import RNFS from 'react-native-fs'
import ViewShot from 'react-native-view-shot'
import { S3Client } from '@aws-sdk/client-s3'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import Toast from 'react-native-toast-message'
import Spinner from 'react-native-spinkit'
import { Buffer } from '@craftzdog/react-native-buffer'
import {
  UserStat, User, PrimaryGoalType, Level,
  UserProfile,
} from '@models'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import Button from '@components/Button'
import * as math from 'mathjs'
import { dayjs, RNLocalize } from '@app/date-utils'
import utc from 'dayjs/plugin/utc'
import LightRegularCard from '@components/LightRegularCard'
import {
  uploadPicture,
  getS3AndCredId,
  capture,
} from '@progress/Todo/UserTaskHelper'
import {
  Post as PostRealm,
} from '@realm/Post'


type RootStackParamList = {
  UserCreatePost: {
    post: PostRealm,
    userId: string,
    avatar: string,
    username: string,
    profileId: string,
  },
  UserViewSleepStats: undefined,
}

type UserViewSleepStatsNavigationProp = StackNavigationProp<
  RootStackParamList,
  'UserViewSleepStats'
>

type Props = {
  sub: string,
}

function UserViewSleepStats(props: Props) {
  const [userStat, setUserStat] = useState<UserStat | null>(null)
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  const userIdEl = useRef<string>(null)
  const avatarEl = useRef<string>('')
  const usernameEl = useRef<string>('')
  const profileIdEl = useRef<string>('')
  const credIdEl = useRef<string>('')
  const s3El = useRef<S3Client>(null)
  const viewShotEl = useRef<ViewShot>(null)
  const localImagePathEl = useRef<string>('')
  const activePostEl = useRef<PostRealm>(null)

  const navigation = useNavigation<UserViewSleepStatsNavigationProp>()

  const { sub} = props

  useEffect(() => {
    return () => {
    }
  }, [])

  useEffect(() => {
    getS3AndCredId(s3El, credIdEl)
  }, []);

  useEffect(() => {
    const getProfileId = async (userId: string) => {
      try {
        const userData = await DataStore.query(User, userId)

        if (userData && userData.profileId) {
          const profileIdData = userData.profileId

          if (profileIdData) {
            profileIdEl.current = profileIdData
            const profileData = await DataStore.query(UserProfile, profileIdData)

            if (profileData?.id) {
              const {
                id,
                username,
                avatar,
              } = profileData

              profileIdEl.current = id
              usernameEl.current = username
              avatarEl.current = avatar
            }

          }
        }
      } catch (e) {
      }
    }
    if (userIdEl.current) {
      getProfileId(userIdEl.current)
    }
  }, [userIdEl?.current])

  useEffect(() => {
    const getUserId = async () => {
      try {
        const userData = await DataStore.query(User, c => c.sub('eq', sub), {
          page: 0,
          limit: 1,
        })
        if (userData && userData.length > 0) {
          const { id } = userData[0]
          userIdEl.current = id
        }
      } catch (e) {
      }
    }
    if (sub) {
      getUserId()
    }
  }, [sub])

  useEffect(() => {
    const getUserStat = async (userId1: string) => {
      try {
        const userStatData = await DataStore.query(UserStat, c => c.userId('eq', userId1)
          .primaryGoalType('eq', PrimaryGoalType.SLEEP), {
          page: 0,
          limit: 100,
        })
        if (userStatData && userStatData.length > 0) {
          setUserStat(userStatData[0])
        }
      } catch (e) {
      }
    }
    if (userIdEl?.current) {
      getUserStat(userIdEl?.current)
    }
  }, [userIdEl?.current])

  useEffect(() => {
   const getLevels = async (userId1: string) => {
     try {
       const levelData = await DataStore.query(
         Level, c => c.userId('eq', userId1)
          .primaryGoalType('eq', PrimaryGoalType.SLEEP),
          {
            page: 0,
            limit: 100,
            sort: s => s.date(SortDirection.DESCENDING)
          }
       )
       if (levelData && levelData[0]) {
         setSelectedLevel(levelData[0])
       }

     } catch(e) {
     }
   }
   if (userIdEl?.current) {
     getLevels(userIdEl?.current)
   }
 }, [userIdEl?.current])

 const onDone = async () => {
   try {
     const base64ImageString = await RNFS.readFile(localImagePathEl?.current, 'base64')


     const base64Data = Buffer.from(base64ImageString.replace(/^data:image\/\w+;base64,/, ""), 'base64')

     if (activePostEl?.current?.id) {
       const key = await uploadPicture(
         s3El,
         userIdEl,
         credIdEl,
         base64Data, activePostEl?.current?.id)


       activePostEl.current = {
         ...activePostEl.current,
         image: key,
       }

       await RNFS.unlink(localImagePathEl?.current)

       navigation.navigate('UserCreatePost', {
         post: activePostEl?.current,
         userId: userIdEl?.current,
         avatar: avatarEl?.current,
         username: usernameEl?.current,
         profileId: profileIdEl?.current,
       })
     }

   } catch(e) {
   }
 }

 const callCapture = async () => {
   try {
     return capture(
       viewShotEl,
       activePostEl,
       localImagePathEl,
       onDone,
       setLoading,
     )
   } catch(e) {
     Toast.show({
       type: 'error',
       text1: 'Unable to capture snapshot',
       text2: 'Unable to to capture snapshot due to an internal error',
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

 return (
   <Box flex={1} justifyContent="center" alignItems="center">
     <Box flex={1} justifyContent="flex-start" alignItems="center" my={{ phone: 'm', tablet: 'l' }}>
       <Text variant="header">
         Sleep
       </Text>
       <LightRegularCard>
         <ViewShot ref={viewShotEl}>
           <Box>
             {
               selectedLevel
               ? (
                 <Box justifyContent="center" alignItems="center">
                   <Text variant="subheader">
                     {selectedLevel}
                   </Text>
                   <Text variant="subheader">
                     Level
                   </Text>
                 </Box>
               ) : null
             }
           </Box>
           <Box>
             {userStat?.value
             && userStat?.dayCount
             ? (
               <Box justifyContent="center" alignItems="center">
                 <Text variant="subheader">
                   {math.chain(userStat.value).divide(userStat.dayCount)
                     .format({ notation: 'fixed', precision: 0 })}
                 </Text>
                 <Text variant="subheader">
                   Avg for {userStat.dayCount} days
                 </Text>
               </Box>
             ) : null}
           </Box>
           <Box justifyContent="space-around">
               {
                 userStat?.max
                 && userStat?.maxDate
                 ? (
                   <Box>
                     <Text variant="subheader">
                       {userStat.max}
                     </Text>
                     <Text variant="subheader">
                       Max on {dayjs(userStat.maxDate).format('MMM D, YYYY')}
                     </Text>
                   </Box>
                 ) : null
               }
               {
                 userStat?.min
                 && userStat?.minDate
                 ? (
                   <Box>
                     <Text variant="subheader">
                       {userStat.min}
                     </Text>
                     <Text variant="subheader">
                       Min on {dayjs(userStat.minDate).format('MMM D, YYYY')}
                     </Text>
                   </Box>
                 ) : null
               }
           </Box>
         </ViewShot>
         <Box my={{ phone: 'm', tablet: 'l' }}>
           <Button onPress={callCapture}>
             Post
           </Button>
         </Box>
       </LightRegularCard>
     </Box>
   </Box>
 )
}

export default UserViewSleepStats
