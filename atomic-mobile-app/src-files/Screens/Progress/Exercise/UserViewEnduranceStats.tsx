import React, { useState, useEffect, useRef } from 'react'
import { DataStore, SortDirection } from '@aws-amplify/datastore'


import {
  UserExerciseStat, User, PrimaryGoalType, Level,

} from '@models'
import Box from '@components/common/Box'
import Text from '@components/common/Text'

import * as math from 'mathjs'
import { dayjs } from '@app/date-utils'

import {
  UserProfile as UserProfileRealm,
} from '@realm/UserProfile'


type Props = {
  sub: string,
  type: string,
  getRealmApp: () => Realm,
}

const rescapeUnsafe = (safe: string) => safe
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#039;/g, '\'')
  .replace(/-/gi, ' ')

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function UserViewEnduranceStats(props: Props) {
  const [userId, setUserId] = useState<string | null>(null)
  const [userStat, setUserStat] = useState<UserExerciseStat | null>(null)
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null)


  const userIdEl = useRef(null)
  const avatarEl = useRef<string>('')
  const usernameEl = useRef<string>('')
  const profileIdEl = useRef<string>('')

  const { sub, type, getRealmApp } = props

  const realm = getRealmApp()


  /** get userprofile */
  // get userProfileId
  useEffect(() => {
    const getProfileId = async (userId: string) => {
      try {
        const userData = await DataStore.query(User, userId)

        if (userData && userData.profileId) {
          const profileIdData = userData.profileId

          if (profileIdData) {
            // setProfileId(profileIdData)
            profileIdEl.current = profileIdData
            // const profileData = await DataStore.query(UserProfile, profileIdData)

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
  }, [userId])

  /** get userId */
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


  /** get userStat */
  useEffect(() => {
    const getUserStat = async (userId1: string) => {
      try {
        const userStatData = await DataStore.query(UserExerciseStat, c => c.userId('eq', userId1)
          .primaryGoalType('eq', PrimaryGoalType.ENDURANCE)
          .secondaryGoalType('eq', type), {
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
  }, [userId])

  /** getLevels */
  useEffect(() => {
   const getLevels = async (userId1: string) => {
     try {
       const levelData = await DataStore.query(
         Level, c => c.userId('eq', userId1)
          .primaryGoalType('eq', PrimaryGoalType.ENDURANCE)
          .secondaryGoalType('eq', type),
          {
            page: 0,
            limit: 100,
            sort: s => s.date(SortDirection.DESCENDING)
          }
       )
       // setLevels(levelData)
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
         {`${capitalizeFirstLetter(rescapeUnsafe(type))}`}
       </Text>
       {
         userStat?.minutesValue > -1
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
               {userStat?.minutesValue
               && (userStat?.dayCount > 2)
               ? (
                 <Box m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
                   <Text variant="optionHeader">
                     {`${math.chain(userStat?.minutesValue).divide(userStat?.dayCount)
                       .format({ notation: 'fixed', precision: 0 })} minutes`}
                   </Text>
                   <Text variant="optionHeader">
                     Avg for {userStat?.dayCount} days
                   </Text>
                 </Box>
               ) : null}
             </Box>
             <Box flexDirection="row" justifyContent="space-around">
                 {
                   userStat?.maxMinutes
                   && userStat?.maxMinutesDate
                   ? (
                     <Box m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
                       <Text variant="optionHeader">
                         {`${userStat?.maxMinutes} minutes`}
                       </Text>
                       <Text variant="body">
                         Max on {dayjs(userStat.maxMinutesDate).format('MMM D, YYYY')}
                       </Text>
                     </Box>
                   ) : null
                 }
                 {
                   (userStat?.minMinutes || (userStat?.minMinutes === 0))
                   && userStat?.minMinutesDate
                   ? (
                     <Box m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
                       <Text variant="optionHeader">
                         {`${userStat?.minMinutes} minutes`}
                       </Text>
                       <Text variant="body">
                         Min on {dayjs(userStat.minMinutesDate).format('MMM D, YYYY')}
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
               {userStat?.distanceValue
               && (userStat?.dayCount > 2)
               ? (
                 <Box m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
                   <Text variant="optionHeader">
                     {`${math.chain(userStat?.distanceValue).divide(userStat?.dayCount)
                       .format({ notation: 'fixed', precision: 0 })} miles`}
                   </Text>
                   <Text variant="optionHeader">
                     Avg for {userStat?.dayCount} days
                   </Text>
                 </Box>
               ) : null}
             </Box>
             <Box flexDirection="row" justifyContent="space-around">
                 {
                   userStat?.maxDistance
                   && userStat?.maxDistanceDate
                   ? (
                     <Box m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
                       <Text variant="optionHeader">
                         {`${userStat?.maxDistance} miles`}
                       </Text>
                       <Text variant="body">
                         Max on {dayjs(userStat.maxDistanceDate).format('MMM D, YYYY')}
                       </Text>
                     </Box>
                   ) : null
                 }
                 {
                   (userStat?.minDistance || (userStat?.minDistance === 0))
                   && userStat?.minDistanceDate
                   ? (
                     <Box m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
                       <Text variant="optionHeader">
                         {`${userStat?.minDistance} miles`}
                       </Text>
                       <Text variant="body">
                         Min on {dayjs(userStat.minDistanceDate).format('MMM D, YYYY')}
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
                     <Box m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
                       <Text variant="optionHeader">
                         {userStat?.lastStreakValue}
                       </Text>
                       <Text variant="optionHeader">
                         Last Streak
                       </Text>
                     </Box>
                 ) : null
               }
               {
                 userStat?.lastStreakValue
                 && userStat?.lastStreakStartDate
                 && userStat?.lastStreakEndDate
                 ? (
                   <Box flexDirection="row" justifyContent="space-around">
                     <Box m={{ phone: 's', tablet: 'm' }}>
                       <Text variant="optionHeader">
                         {userStat?.lastStreakStartDate
                           ? (dayjs(userStat?.lastStreakStartDate).format('MMM D, YYYY'))
                           : null}
                       </Text>
                       <Text variant="optionHeader">
                         {`Start Date`}
                       </Text>
                     </Box>
                     <Box m={{ phone: 's', tablet: 'm' }}>
                       <Text variant="optionHeader">
                         {userStat?.lastStreakEndDate
                           ? (dayjs(userStat.lastStreakEndDate).format('MMM D, YYYY'))
                           : null}
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
                    <Box m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
                      <Text variant="optionHeader">
                        {userStat?.bestStreakValue}
                      </Text>
                      <Text variant="optionHeader">
                        Best Streak
                      </Text>
                    </Box>
                  ) : null
               }
               {
                 userStat?.bestStreakValue
                 && userStat?.bestStreakStartDate
                 && userStat?.bestStreakEndDate
                 ? (
                   <Box flexDirection="row" justifyContent="space-around">
                     <Box m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
                       <Text variant="optionHeader">
                         {userStat?.bestStreakStartDate
                           ? (dayjs(userStat?.bestStreakStartDate).format('MMM D, YYYY'))
                           : null}
                       </Text>
                       <Text variant="optionHeader">
                         {`Start Date`}
                       </Text>
                     </Box>
                     <Box m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
                       <Text variant="optionHeader">
                         {userStat?.bestStreakEndDate
                           ? (dayjs(userStat?.bestStreakEndDate).format('MMM D, YYYY'))
                           : null}
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

export default UserViewEnduranceStats
