import React, { useState, useEffect, useRef } from 'react';
import { DataStore, SortDirection } from '@aws-amplify/datastore'
import {
  UserStat, User, PrimaryGoalType, Level,
} from '@models'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import * as math from 'mathjs'
import { dayjs, RNLocalize } from '@app/date-utils'

import {
  UserProfile as UserProfileRealm,
} from '@realm/UserProfile'



type Props = {
  sub: string,
  getRealmApp: () => Realm,
}

function UserViewMeditationStats(props: Props) {
  const [userId, setUserId] = useState<string | null>(null)
  const [userStat, setUserStat] = useState<UserStat | null>(null)
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null)

  const userIdEl = useRef<string>(null)
  const avatarEl = useRef<string>('')
  const usernameEl = useRef<string>('')
  const profileIdEl = useRef<string>('')

  const {
    sub,
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
  }, [userId])

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
        const userStatData = await DataStore.query(UserStat, c => c.userId('eq', userId1)
          .primaryGoalType('eq', PrimaryGoalType.MEDITATION), {
          page: 0,
          limit: 100,
        })
        if (userStatData?.[0]?.id) {
          setUserStat(userStatData[0])
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
          .primaryGoalType('eq', PrimaryGoalType.MEDITATION),
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
         Meditation
       </Text>
       {
         userStat?.value
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
               {userStat?.value
               && (userStat?.dayCount > 2)
               ? (
                 <Box m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
                   <Text variant="optionHeader">
                     {`${math.chain(userStat?.value).divide(userStat?.dayCount)
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
                   userStat?.max
                   && userStat?.maxDate
                   ? (
                     <Box m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
                       <Text variant="optionHeader">
                         {`${userStat?.max} minutes`}
                       </Text>
                       <Text variant="body">
                         Max on {dayjs(userStat.maxDate).format('MMM D, YYYY')}
                       </Text>
                     </Box>
                   ) : null
                 }
                 {
                   (userStat?.min || (userStat?.min === 0))
                   && userStat?.minDate
                   ? (
                     <Box m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
                       <Text variant="optionHeader">
                         {`${userStat?.min} minutes`}
                       </Text>
                       <Text variant="body">
                         Min on {dayjs(userStat.minDate).format('MMM D, YYYY')}
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

export default UserViewMeditationStats
