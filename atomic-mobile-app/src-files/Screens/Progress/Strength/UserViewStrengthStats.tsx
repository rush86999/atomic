import React, { useState, useEffect, useRef } from 'react';
import { DataStore, SortDirection } from '@aws-amplify/datastore'
import {
  UserExerciseStat, User, PrimaryGoalType,
  Level,
  StatPreference,
} from '@models'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import * as math from 'mathjs'
import { dayjs, RNLocalize } from '@app/date-utils'


import {
  UserProfile as UserProfileRealm,
} from '@realm/UserProfile'






type item = 'kg' | 'lbs'

type Props = {
  sub: string,
  type: string,
  getRealmApp: () => Realm,
}

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function UserViewStrengthStats(props: Props) {
  const [userId, setUserId] = useState<string | null>(null)
  const [userStat, setUserStat] = useState<UserExerciseStat | null>(null)
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null)
  const [selectedStat, setSelectedStat] = useState<item>('lbs')

  const userIdEl = useRef<string>(null)
  const avatarEl = useRef<string>('')
  const usernameEl = useRef<string>('')
  const profileIdEl = useRef<string>('')

  const {
    sub,
    type,
    getRealmApp,
   } = props

  const realm = getRealmApp()



  useEffect(() => {
    const getProfileId = async (userId: string) => {
      try {
        const userData = await DataStore.query(User, userId)

        if (userData && userData.profileId) {
          const profileIdData = userData.profileId

          if (profileIdData) {
            profileIdEl.current = profileIdData

            const profileDatas = realm.objects<UserProfileRealm>('UserProfile')

            if (!(profileDatas?.length > 0)) {
              return
            }

            const [profileData] = profileDatas

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
          setUserId(id)
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
        const userStatData = await DataStore.query(UserExerciseStat, c => c.userId('eq', userId1)
          .primaryGoalType('eq', PrimaryGoalType.STRENGTH)
          .secondaryGoalType('eq', type), {
          page: 0,
          limit: 100,
        })
        if (userStatData && userStatData.length > 0) {
          setUserStat(userStatData[0])
          setSelectedStat(userStatData?.[0]?.statPreference === StatPreference.POUNDS ? 'lbs' : 'kg')
        }
      } catch (e) {
        
      }
    }
    if (userIdEl?.current) {
      getUserStat(userIdEl?.current)
    }
  }, [userId])

  useEffect(() => {
   const getLevels = async (userId1: string) => {
     try {
       const levelData = await DataStore.query(
         Level, c => c.userId('eq', userId1)
          .primaryGoalType('eq', PrimaryGoalType.STRENGTH)
          .secondaryGoalType('eq', type),
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
 }, [userId])



 return (
   <Box flex={1} justifyContent="center" alignItems="center">
     <Box flex={1} justifyContent="center" alignItems="center" my={{ phone: 'm', tablet: 'l' }}>
       <Text variant="optionHeader">
         {`${capitalizeFirstLetter(type)}`}
       </Text>
       {
         userStat?.weightValue > -1
         ? (
           <Box>
             <Box>
               {
                 selectedLevel?.level
                 ? (
                   <Box m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
                     <Text variant="optionHeader">
                       {selectedLevel?.level}
                     </Text>
                     <Text variant="optionHeader">
                       Level
                     </Text>
                   </Box>
                 ) : null
               }
             </Box>
             <Box>
               {userStat?.weightValue
               && (userStat?.dayCount > 2)
               ? (
                 <Box m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
                   <Text variant="optionHeader">
                     {`${math.chain(userStat?.weightValue).divide(userStat?.dayCount)
                       .format({ notation: 'fixed', precision: 0 })} ${selectedStat}`}
                   </Text>
                   <Text variant="optionHeader">
                     Avg for {userStat?.dayCount} days
                   </Text>
                 </Box>
               ) : null}
             </Box>
             <Box flexDirection="row" justifyContent="space-around">
                 {
                   userStat?.maxWeight
                   && userStat?.maxWeightDate
                   ? (
                     <Box m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
                       <Text variant="optionHeader">
                         {`${userStat?.maxWeight} ${selectedStat}`}
                       </Text>
                       <Text variant="body">
                         Max on {dayjs(userStat.maxWeightDate).format('MMM D, YYYY')}
                       </Text>
                     </Box>
                   ) : null
                 }
                 {
                   (userStat?.minWeight || (userStat?.minWeight === 0))
                   && userStat?.minWeightDate
                   ? (
                     <Box m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
                       <Text variant="optionHeader">
                         {`${userStat?.minWeight} ${selectedStat}`}
                       </Text>
                       <Text variant="body">
                         Min on {dayjs(userStat.minWeightDate).format('MMM D, YYYY')}
                       </Text>
                     </Box>
                   ) : null
                 }
             </Box>
             <Box>
               {userStat?.repsValue
               && (userStat?.dayCount > 2)
               ? (
                 <Box m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
                   <Text variant="optionHeader">
                     {`${math.chain(userStat?.repsValue).divide(userStat?.dayCount)
                       .format({ notation: 'fixed', precision: 0 })} reps`}
                   </Text>
                   <Text variant="optionHeader">
                     Avg for {userStat?.dayCount} days
                   </Text>
                 </Box>
               ) : null}
             </Box>
             <Box flexDirection="row" justifyContent="space-around">
                 {
                   userStat?.maxReps
                   && userStat?.maxRepsDate
                   ? (
                     <Box m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
                       <Text variant="optionHeader">
                         {`${userStat?.maxReps} reps`}
                       </Text>
                       <Text variant="body">
                         Max on {dayjs(userStat.maxRepsDate).format('MMM D, YYYY')}
                       </Text>
                     </Box>
                   ) : null
                 }
                 {
                   (userStat?.minReps || (userStat?.minReps === 0))
                   && userStat?.minRepsDate
                   ? (
                     <Box m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
                       <Text variant="optionHeader">
                         {`${userStat?.minReps} reps`}
                       </Text>
                       <Text variant="body">
                         Min on {dayjs(userStat.minRepsDate).format('MMM D, YYYY')}
                       </Text>
                     </Box>
                   ) : null
                 }
             </Box>
             <Box>
               {
                 userStat?.lastStreakValue
                 && userStat?.lastStreakStartDate
                 && userStat?.lastStreakEndDate
                 ? (
                   <Box flexDirection="row" justifyContent="space-around">
                     <Box m={{ phone: 's', tablet: 'm' }}>
                       <Text variant="optionHeader">
                         {userStat?.lastStreakValue}
                       </Text>
                       <Text variant="optionHeader">
                         Last Streak
                       </Text>
                     </Box>
                     <Box m={{ phone: 's', tablet: 'm' }}>
                       <Text variant="optionHeader">
                         {dayjs(userStat.lastStreakStartDate).format('MMM D, YYYY')}
                       </Text>
                       <Text variant="optionHeader">
                         {`Start Date`}
                       </Text>
                     </Box>
                     <Box m={{ phone: 's', tablet: 'm' }}>
                       <Text variant="optionHeader">
                         {dayjs(userStat.lastStreakEndDate).format('MMM D, YYYY')}
                       </Text>
                       <Text variant="optionHeader">
                         {`End Date`}
                       </Text>
                     </Box>
                   </Box>
                 ) : null
               }
             </Box>
             <Box>
               {
                 userStat?.bestStreakValue
                 && userStat?.bestStreakStartDate
                 && userStat?.bestStreakEndDate
                 ? (
                   <Box flexDirection="row" justifyContent="space-around">
                     <Box m={{ phone: 's', tablet: 'm' }}>
                       <Text variant="optionHeader">
                         {userStat?.bestStreakValue}
                       </Text>
                       <Text variant="optionHeader">
                         Best Streak
                       </Text>
                     </Box>
                     <Box m={{ phone: 's', tablet: 'm' }}>
                       <Text variant="optionHeader">
                         {dayjs(userStat?.bestStreakStartDate).format('MMM D, YYYY')}
                       </Text>
                       <Text variant="optionHeader">
                         {`Start Date`}
                       </Text>
                     </Box>
                     <Box m={{ phone: 's', tablet: 'm' }}>
                       <Text variant="optionHeader">
                         {dayjs(userStat.bestStreakEndDate).format('MMM D, YYYY')}
                       </Text>
                       <Text variant="optionHeader">
                         {`End Date`}
                       </Text>
                     </Box>
                   </Box>
                 ) : null
               }
             </Box>
         </Box>
       ) : null}
     </Box>
   </Box>
 )
}

export default UserViewStrengthStats
