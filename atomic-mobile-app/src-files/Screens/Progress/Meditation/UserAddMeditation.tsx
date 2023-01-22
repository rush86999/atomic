import React, { useState, useEffect, useRef } from 'react'
import {
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native'
import { useHeaderHeight } from '@react-navigation/elements'
import { DataStore, SortDirection} from '@aws-amplify/datastore'
import { dayjs } from '@app/date-utils'
import Toast from 'react-native-toast-message'
import LottieView from 'lottie-react-native'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { v4 as uuid } from 'uuid'
import { TextField } from 'react-native-ui-lib'
import {
  MeditationData, Goal, User,
  Status, PrimaryGoalType, Point, UserStat, UserProfile,
  Schedule, Level, Streak, Day,
} from '@models'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import * as math from 'mathjs'

import {
  UserProfile as UserProfileRealm,
} from '@realm/UserProfile'


import RegularCard from '@components/RegularCard'
import PrimaryCard from '@components/PrimaryCard'
import Button from '@components/Button'
import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { getEventWithId } from '@app/calendar/calendarDbHelper'


type RootNavigationStackParamList = {
  UserProgressActiveComponents: {
    isUpdate?: string,
  },
  UserAddMeditation: undefined,
}

type UserAddMeditationNavigationProp = StackNavigationProp<
  RootNavigationStackParamList,
  'UserAddMeditation'
>

const styles = StyleSheet.create({
  svg: {
    width: 'auto',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})

const getDayNumber = (day: Day) => {
  switch(day) {
    case Day.SU:
      return 0
    case Day.MO:
      return 1
    case Day.TU:
      return 2
    case Day.WE:
      return 3
    case Day.TH:
      return 4
    case Day.FR:
      return 5
    case Day.SA:
      return 6
  }
}

const WEEKSTONEXTLEVEL = 4

type Props = {
  sub: string,
  getRealmApp: () => Realm,
  client: ApolloClient<NormalizedCacheObject>
}

function UserAddMeditation(props: Props) {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [meditationMinutes, setMeditationMinutes] = useState<string>('30')
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  const {
    sub,
    getRealmApp,
   } = props
   const client = props?.client
   const realm = getRealmApp()

  const meditationRef: React.MutableRefObject<LottieView | null> = useRef(null)
  const height = useHeaderHeight()

  const levelEl = useRef<Level>(null)
  const streakEl = useRef<Streak>(null)
  const previousStreakEl = useRef<Streak>(null)
  const pointRewardEl = useRef<number>(null)
  const profileIdEl = useRef<string>(null)
  const userProfileEl = useRef<UserProfile>(null)
  const pointEl = useRef<Point>(null)
  const userIdEl = useRef<string>(null)
  const scheduleEl = useRef<Schedule>(null)
  const meditationDataIdEl = useRef<string>(null)
  const userStatEl = useRef<UserStat>()

  const navigation = useNavigation<UserAddMeditationNavigationProp>()



  useEffect(() => {
    const getStreak = async () => {
      try {
        if (!(userIdEl?.current)) {
          return
        }

        const todayStreak = await DataStore.query(Streak, c => c
            .userIdGoal('eq', `${userIdEl?.current}#${PrimaryGoalType.MEDITATION}#null`)
            .lastSyncDate('beginsWith', dayjs().format('YYYY-MM-DD')))

        

        if (todayStreak?.length > 0) {
          streakEl.current = todayStreak[0]
          return todayStreak[0]
        }

        if (!todayStreak || !(todayStreak?.length > 0)) {
          const yesterdayStreak = await DataStore.query(Streak, c => c
              .userIdGoal('eq', `${userIdEl?.current}#${PrimaryGoalType.MEDITATION}#null`)
              .lastSyncDate('beginsWith', dayjs().subtract(1, 'd').format('YYYY-MM-DD')))

          if (yesterdayStreak?.length > 0) {
            streakEl.current = yesterdayStreak[0]
            
            return yesterdayStreak[0]
          }

          if (
            !yesterdayStreak
            || !(yesterdayStreak?.length > 0)
          ) {
            const previousStreaks = await DataStore.query(Streak,
              c => c.userIdGoal('eq', `${userIdEl?.current}#${PrimaryGoalType.MEDITATION}#null`),
              {
                sort: s => s.startDate(SortDirection.DESCENDING),
              })
            if (previousStreaks?.length > 0) {
              previousStreakEl.current = previousStreaks[0]
            }
          }
        }
      } catch(e) {
        
      }
    }
    const createStreak = async () => {
      try {

        const newStreak = new Streak({
          goalId: goal?.id || undefined,
          primaryGoalType: PrimaryGoalType.MEDITATION,
          userIdGoal: `${userIdEl?.current}#${PrimaryGoalType.MEDITATION}#null`,
          userId: userIdEl?.current,
          streak: 1,
          startDate: dayjs().format('YYYY-MM-DD'),
          lastSyncDate: dayjs().format('YYYY-MM-DD'),
          ttl: dayjs().add(2, 'y').unix(),
        })

        await DataStore.save(newStreak)
        streakEl.current = newStreak
        

      } catch(e) {
        
      }
    }
    (async () => {
      try {
        if (!(userIdEl?.current)) {
          return
        }

        const currentStreak = await getStreak()

        if (currentStreak?.id) {
          return
        }

        const dataPoints = await DataStore.query(MeditationData,
          c => c.userId('eq', userIdEl?.current),
          {
            sort: s => s.date(SortDirection.DESCENDING),
            limit: 3,
          })

        if (dataPoints?.length > 2) {
          const firstDay = dayjs(dataPoints[0].date).format('YYYY-MM-DD')
          const secondDay = dayjs(firstDay).subtract(1, 'd').format('YYYY-MM-DD')
          const thirdDay = dayjs(secondDay).subtract(1, 'd').format('YYYY-MM-DD')

          if (
            (dayjs(dataPoints[1].date).format('YYYY-MM-DD') === secondDay)
            && (dayjs(dataPoints[2].date).format('YYYY-MM-DD') === thirdDay)
          ) {
            await createStreak()
          }
        }
      } catch(e) {
        
      }
    })()
  }, [userId])

  useEffect(() => {
    const getPointReward = async () => {
      try {
        const userData = await DataStore.query(User, c => c.sub('eq', sub), {
          page: 0,
          limit: 1,
        })

        if (userData && userData[0]) {
          const { id } = userData[0]
          setUserId(id)
          userIdEl.current = id

          const scheduleDatas = await DataStore.query(Schedule, c => c.userId('eq', id)
            .date('beginsWith', dayjs().format('YYYY'))
            .status('eq', Status.ACTIVE)
            .primaryGoalType('eq', PrimaryGoalType.MEDITATION))

          
          const event = await getEventWithId(client, scheduleDatas?.[0]?.eventId)
          if (
            scheduleDatas && scheduleDatas.length > 0
            && (event?.endDate
              && dayjs(event?.endDate).isAfter(dayjs())
              || !(event?.endDate)
            )
          ) {
              pointRewardEl.current = 2

          } else {

            pointRewardEl.current = 1

          }
        }
      } catch (e) {
        
      }
      
    }
    getPointReward()
  }, [])

  useEffect(() => {
    const getUserProfileRealm = async () => {
      const userProfiles = realm.objects<UserProfileRealm>('UserProfile')
      if (!(userProfiles?.[0]?.id)) {
        
      } else {
        const [profile] = userProfiles
        profileIdEl.current = profile?.id
        const original = await DataStore.query(User, profile?.userId)

        const updatedUser = await DataStore.save(
          User.copyOf(
            original, updated => {
              updated.profileId = profile?.id
            }
          )
        )

        
      }
    }
    const getProfileId = async (userId1: string) => {
      try {
        const userData = await DataStore.query(User, userId1)
        
        if (userData && userData.profileId) {
          const profileIdData = userData.profileId

          if ((profileIdData !== 'null') && profileIdData) {
            profileIdEl.current = profileIdData
            
          } else {
            await getUserProfileRealm()
          }
        }
      } catch (e) {
          
      }
    }
    if (userIdEl?.current) {
      getProfileId(userIdEl.current)
    }
  }, [userId])

  useEffect(() => {
    const getUserProfile = async () => {
      try {

        const profileDatas = realm.objects<UserProfileRealm>('UserProfile')

        if (!(profileDatas?.length > 0)) {
          return
        }

        const [getProfileData] = profileDatas

        if (getProfileData?.pointId) {

          setUserProfile(getProfileData)
          userProfileEl.current = getProfileData
          
        }

      } catch (e) {
        
      }
    }
    getUserProfile()
  }, [])

  useEffect(() => {
    const getPoint = async () => {
      try {

        if (userProfileEl?.current?.pointId) {
          const pointData = await DataStore.query(Point, userProfileEl?.current?.pointId)
          if (pointData?.id) {
            pointEl.current = pointData
            
          }
        }
      } catch (e) {
        
      }
    }
    getPoint()
  }, [userProfile?.pointId])

  useEffect(() => {
    const getUserStat = async (userId1: string) => {
      try {
        const userStatDatas = await DataStore.query(UserStat, c => c.userId('eq', userId1)
        .primaryGoalType('eq', PrimaryGoalType.MEDITATION))

        if (userStatDatas?.[0]?.id) {
          const userStatData = userStatDatas[0]

          userStatEl.current = userStatData
          

        }
      } catch (e) {
        
      }
    }
    if (userIdEl?.current) {
      getUserStat(userIdEl?.current)
    }
  }, [userId])

  useEffect(() => {
    meditationRef?.current?.play()
  }, [])

  useEffect(() => {
    const deactivateGoal = async (goal: Goal) => {
      try {
        const updatedGoal = await DataStore.save(
          Goal.copyOf(
            goal, updated => {
              updated.status = Status.ENDED
            }
          )
        )
        
      } catch(e) {
        
      }
    }
    const getExerciseGoal = async (userId1: string) => {
      try {

        const goals = await DataStore.query(Goal, c => c.userId('eq', userId1)
          .date('beginsWith', dayjs().format('YYYY'))
          .status('eq', Status.ACTIVE)
          .primaryGoalType('eq', PrimaryGoalType.MEDITATION), {
          page: 0,
          limit: 1,
          sort: s => s.date(SortDirection.DESCENDING),
        })

        const goals1 = await DataStore.query(
          Goal,
          c => c.userId('eq', userId1)
            .date('beginsWith', dayjs().subtract(1, 'y').format('YYYY'))
            .status('eq', Status.ACTIVE)
            .primaryGoalType('eq', PrimaryGoalType.MEDITATION),
            {
              page: 0,
              limit: 1,
              sort: s => s.date(SortDirection.DESCENDING),
            },
          )

        

        if (goals && goals.length > 0) {
          setGoal(goals[0])
          const [oldGoal] = goals
          if (dayjs().isAfter(dayjs(oldGoal.endDate))) {
            await deactivateGoal(oldGoal)
          }
        } else if (goals1 && goals1.length > 0) {
          setGoal(goals1[0])
          const [oldGoal] = goals
          if (dayjs().isAfter(dayjs(oldGoal.endDate))) {
            await deactivateGoal(oldGoal)
          }
        }



      } catch (e) {
        
      }
    }
    if (userIdEl?.current) {
      getExerciseGoal(userIdEl?.current);
    }
  }, [userId])

  useEffect(() => {
    const getMeditationGoal = () => {
      if (goal?.goal as string) {
        const goalCopy = goal?.goal as string
        
        setMeditationMinutes(goalCopy)
      }
    }
    getMeditationGoal()
  }, [goal?.id])

  useEffect(() => {
    const getMeditationData = async (userId1: string) => {
      try {
         const meditationDatas = await DataStore.query(MeditationData, (c) => c.userId('eq', userId1), {
           sort: s => s.date(SortDirection.DESCENDING),
           page: 0,
           limit: 1,
         })
         
        if (meditationDatas && meditationDatas[0] && meditationDatas[0].id) {
          const { date } = meditationDatas[0]

          if (dayjs(date).isSameOrAfter(dayjs().hour(0))) {
            
            const { id } = meditationDatas[0]
            meditationDataIdEl.current = id
            
          }
        }
      } catch (e) {
        
      }
    }
    if (userIdEl?.current) {
      getMeditationData(userIdEl?.current)
    }
  }, [userId])

  useEffect(() => {
    const createLevel = async () => {
      try {
        if (!(userIdEl?.current)) {
          return
        }
        const newLevel = new Level({
          userId: userIdEl?.current,
          level: 1,
          primaryGoalType: PrimaryGoalType.MEDITATION,
          secondaryGoalType: 'null',
          date: dayjs().format(),
        })

        await DataStore.save(newLevel)

        levelEl.current = newLevel
      } catch(e) {
        
      }
    }
    (async () => {
      try {
        if (!(userIdEl?.current)) {
          return
        }
      const levels  = await DataStore.query(Level,
        c => c.userId('eq', userIdEl?.current)
        .primaryGoalType('eq', PrimaryGoalType.MEDITATION)
        .secondaryGoalType('eq', 'null'))

        if (levels?.length > 0) {
          const [oldLevel] = levels
          levelEl.current = oldLevel

          
        } else {
          await createLevel()
        }
      } catch(e) {
        
      }
    })()
  }, [userId])


  useEffect(() => {
    (async () => {
      if (!(userIdEl?.current)) {
        return
      }
      const schedules = await DataStore.query(Schedule,
        c => c
          .userIdGoal('eq', `${userIdEl?.current}#${PrimaryGoalType.MEDITATION}#null`)
          .status('eq', Status.ACTIVE),
        {
          sort: s => s.date(SortDirection.DESCENDING),
        })

      if (schedules?.length > 0) {
        const [oldSchedule] = schedules
        const event = await getEventWithId(client, oldSchedule?.eventId)
        if (event?.endDate
          && dayjs().isAfter(event?.endDate)) {

            await DataStore.save(
              Schedule.copyOf(
                oldSchedule, updated => {
                  updated.status = Status.ENDED
                }
              )
            )
        }
        scheduleEl.current = oldSchedule
      }
    })()
  }, [userId])

  const updateStreak = async () => {
    try {
      if (!(streakEl?.current)) {
        
        return
      }

      

      if (streakEl?.current?.lastSyncDate !== dayjs().format('YYYY-MM-DD')) {
        const newStreak = await DataStore.save(
          Streak.copyOf(
            streakEl.current, updated => {
              updated.streak += 1
              updated.lastSyncDate = dayjs().format('YYYY-MM-DD')
            }
          )
        )
        
        streakEl.current = newStreak
      }
    } catch(e) {
      
    }
  }

  const updateLevel = async () => {
    try {
      if (!(scheduleEl?.current?.id)) {
        
        return
      }

      if (!(goal?.id)) {
        
        return
      }

      

      const previousWeek = dayjs().week() === 0
       ? dayjs().subtract(1, 'y').week(52)
       : dayjs().week(dayjs().week() - 1)

      

      if (goal?.previousWeek === previousWeek.week()) {
        
        return
      }

      if ((goal?.previousWeek === undefined)
        || (goal?.previousWeek === null)) {

        const updatedGoal = await DataStore.save(
          Goal.copyOf(
            goal, updated => {
              updated.previousWeek = previousWeek.week()
            }
          )
        )
        
        setGoal(updatedGoal)
      }
      const event = await getEventWithId(client, scheduleEl?.current?.eventId)
      if ((event?.recurrenceRule?.byWeekDay?.length > 0)
           && levelEl.current?.level) {

        const previousWeekDays = (event?.recurrenceRule?.byWeekDay as Day[]).map(day => {
          return previousWeek.day(getDayNumber(day)).format('YYYY-MM-DD')
        })

        const promises = previousWeekDays.map(async (date) => {
          try {
            const dataPoints = await DataStore.query(MeditationData,
             c => c.userId('eq', userIdEl?.current).date('beginsWith', date),
             {
               limit: 1,
             })

             if (dataPoints?.length > 0) {
               const [dataPoint] = dataPoints
               
               return metLevel(dataPoint.date)
             } else {
               return missLevel(date)
             }

          } catch(e) {
            
          }
        })

        const results = await Promise.all(promises)

        

        const updatedGoal = await DataStore.save(
          Goal.copyOf(
            goal, updated => {
              updated.previousWeek = previousWeek.week()
            }
          )
        )
        
        setGoal(updatedGoal)

      }

    } catch(e) {
      
    }
  }

  const missLevel = async (comparisonDate: string) => {
    try {
      if (levelEl.current?.attempts === 1) {
        if (levelEl.current?.level > 1) {
          const newLevel = await DataStore.save(
            new Level({
              userId: userIdEl?.current,
              level: levelEl.current?.level - 1,
              attempts: 3,
              primaryGoalType: PrimaryGoalType.MEDITATION,
              secondaryGoalType: 'null',
              date: dayjs(comparisonDate).format()
            })
          )

          await DataStore.delete(levelEl.current)
          
          
          return levelEl.current = newLevel
        }
      }

      const newLevel = await DataStore.save(
        Level.copyOf(
          levelEl.current, updated => {
            updated.attempts -= 1
          }
        )
      )
      levelEl.current = newLevel
    } catch(e) {
      
    }
  }

  const metLevel = async (comparisonDate: string) => {
    try {
      const weeks = dayjs(comparisonDate).diff(dayjs(levelEl.current?.date).format(), 'w', true)


       if (weeks > WEEKSTONEXTLEVEL) {
         const newLevel = await DataStore.save(
           new Level({
             userId: userIdEl?.current,
             level: levelEl.current?.level + 1,
             attempts: 3,
             primaryGoalType: PrimaryGoalType.MEDITATION,
             secondaryGoalType: 'null',
             date: dayjs().format(),
           })
         )

         await DataStore.delete(levelEl.current)

         levelEl.current = newLevel
       }

    } catch(e) {
      
    }
  }

 const updateUserStats = async () => {
   try {
     
     

     if (userStatEl?.current?.currentDate && userIdEl?.current) {
         if (dayjs(userStatEl?.current?.currentDate).format('YYYY-MM-DD') !== dayjs().format('YYYY-MM-DD')) {
           const newUserStat = await DataStore.save(
             UserStat.copyOf(userStatEl?.current, updated => {

               if (typeof (userStatEl?.current?.currentValue) === 'number') {

                 if (!(typeof (userStatEl?.current?.max) === 'number')) {
                   updated.max = userStatEl?.current?.currentValue
                   updated.maxDate = userStatEl?.current?.currentDate || dayjs().format()
                 } else if ((userStatEl?.current?.max) < (userStatEl?.current?.currentValue)) {
                   updated.max = userStatEl?.current?.currentValue
                   updated.maxDate = userStatEl?.current?.currentDate || dayjs().format()
                 }

                 if (!(typeof (userStatEl?.current?.min) === 'number')) {
                   updated.min = userStatEl?.current?.currentValue
                   updated.minDate = userStatEl?.current?.currentDate || dayjs().format()
                 } else if ((userStatEl?.current?.min) > (userStatEl?.current?.currentValue)) {
                   updated.min = userStatEl?.current?.currentValue
                   updated.minDate = userStatEl?.current?.currentDate || dayjs().format()
                 }
               }

               if (!(typeof userStatEl?.current?.value === 'number') && !(typeof (userStatEl?.current?.currentValue) === 'number')) {
                 
               } else if ((typeof (userStatEl?.current?.currentValue) === 'number') && !(typeof (userStatEl?.current?.value) === 'number')) {
                 
               } else if (!(typeof (userStatEl?.current?.currentValue) === 'number') && typeof (userStatEl?.current?.value) === 'number') {

                 

               } else {
                 const newValue = math.chain(userStatEl?.current?.value).add((userStatEl?.current?.currentValue)).done()

                 updated.value = newValue
               }


               updated.currentDate = dayjs().format()

               if (parseFloat(meditationMinutes) > 0) {
                 updated.currentValue = parseFloat(meditationMinutes)

               }

               if (!(typeof (userStatEl?.current?.dayCount) === 'number')) {
                 updated.dayCount = 1
                 
               } else {
                 const newDayCount = math.chain(userStatEl?.current?.dayCount).add(1).done()
                 updated.dayCount = newDayCount
               }

               if (typeof (previousStreakEl.current?.streak) === 'number') {
                 updated.lastStreakStartDate = previousStreakEl.current?.startDate
                 updated.lastStreakEndDate = previousStreakEl.current?.lastSyncDate
                 updated.lastStreakValue = previousStreakEl.current?.streak
               }

               if (!(typeof (updated?.bestStreakValue) === 'number')
                && (typeof (previousStreakEl.current?.streak) === 'number')
                && (typeof (streakEl.current?.streak) === 'number')) {
                 if (previousStreakEl.current?.streak > streakEl.current?.streak) {
                   updated.bestStreakStartDate = previousStreakEl.current.startDate
                   updated.bestStreakEndDate = previousStreakEl.current.endDate
                   updated.bestStreakValue = previousStreakEl.current.streak
                 } else {
                   updated.bestStreakStartDate = streakEl.current.startDate
                   updated.bestStreakEndDate = streakEl.current.endDate
                   updated.bestStreakValue = streakEl.current.streak
                 }
               } else if ((typeof (streakEl.current?.streak) === 'number')) {
                 if ((typeof (previousStreakEl.current?.streak) === 'number')
                  && (typeof (updated?.bestStreakValue) === 'number')
                   && (previousStreakEl.current?.streak > (updated?.bestStreakValue))) {
                     if (previousStreakEl.current?.streak > streakEl.current?.streak) {
                       updated.bestStreakStartDate = previousStreakEl.current.startDate
                       updated.bestStreakEndDate = previousStreakEl.current.endDate
                       updated.bestStreakValue = previousStreakEl.current.streak
                     } else {
                       updated.bestStreakStartDate = streakEl.current.startDate
                       updated.bestStreakEndDate = streakEl.current.endDate
                       updated.bestStreakValue = streakEl.current.streak
                     }
                 }
               }
             })
           )
           userStatEl.current = newUserStat
           
         } else {
             const original: MeditationData | undefined = await DataStore.query(MeditationData, meditationDataIdEl?.current)

             if (original?.id) {

               const originalCopy = original as MeditationData
               const difference = math.chain(originalCopy.minutes).subtract(parseFloat(meditationMinutes)).done()

               const newUserStat = await DataStore.save(
                 UserStat.copyOf(userStatEl?.current, updated => {


                   const newValue = math.chain(updated.value).subtract(difference).done()

                   updated.value = newValue
                 })
               )
               userStatEl.current = newUserStat
               
             }
           }
     } else if (!(userStatEl?.current?.currentDate)) {
       const newUserStat = new UserStat({
         primaryGoalType: PrimaryGoalType.MEDITATION,
         userId: userIdEl?.current,
         value: parseFloat(meditationMinutes),
         max: parseFloat(meditationMinutes),
         min: parseFloat(meditationMinutes),
         maxDate: dayjs().format(),
         minDate: dayjs().format(),
         currentDate: dayjs().format(),
         dayCount: 1,
       })

       await DataStore.save(newUserStat)
       userStatEl.current = newUserStat
       
     }
   } catch (e) {
     
   }
 }

  const updateUserPoint = async () => {
   try {
     if (pointEl?.current?.currentDate) {
       
         if (dayjs(pointEl?.current.currentDate).format('YYYY-MM-DD') !== dayjs().format('YYYY-MM-DD')) {
           const updatedPoint = await DataStore.save(
             Point.copyOf(
               pointEl?.current, updated =>  {

                 if (typeof (pointEl?.current.currentPoints) === 'number') {

                   if (!(typeof (pointEl?.current?.max) === 'number')) {
                     updated.max = pointEl?.current.currentPoints
                     updated.maxDate = pointEl?.current.currentDate || dayjs().format()

                   } else if ((pointEl?.current?.max) < (pointEl?.current.currentPoints)) {
                     updated.max = pointEl?.current.currentPoints || 0
                     updated.maxDate = pointEl?.current.currentDate || dayjs().format()

                   }

                   if (!(typeof (pointEl?.current?.min) === 'number')) {
                     updated.min = pointEl?.current.currentPoints
                     updated.minDate = pointEl?.current.currentDate || dayjs().format()

                   } else if ((pointEl?.current?.currentPoints) < (pointEl?.current?.min)) {
                     updated.min = pointEl?.current.currentPoints || 0
                     updated.minDate = pointEl?.current.currentDate || dayjs().format()

                   }

                  }

                  if (!(typeof pointEl?.current.points === 'number') && !(typeof (pointEl?.current?.currentPoints) === 'number')) {
                    
                  } else if ((typeof (pointEl?.current?.currentPoints) === 'number') && !(typeof (pointEl?.current.points) === 'number')) {
                    
                  } else if (!(typeof (pointEl?.current?.currentPoints) === 'number') && typeof (pointEl?.current.points) === 'number') {

                    

                  } else {
                    const newValue = math.chain(pointEl?.current.points).add((pointEl?.current?.currentPoints)).done()
                    updated.currentPoints = pointRewardEl.current
                    updated.points = newValue
                  }

                 updated.currentDate = dayjs().format()

                 updated.currentPoints = pointRewardEl.current

                 updated.currentDate = dayjs().format()


                 if (!(typeof (pointEl?.current.dayCount) === 'number')) {
                   updated.dayCount = 1
                   
                 } else {
                   const newDayCount = math.chain(pointEl?.current.dayCount).add(1).done()
                   updated.dayCount = newDayCount
                 }
               }
             )
           )
           
         }
     } else {

       if (!(pointEl?.current)) {
         
         return
       }

       
       const updatedPoint = await DataStore.save(
         Point.copyOf(
           pointEl?.current, updated =>  {

             updated.currentDate = dayjs().format()

             updated.currentPoints = pointRewardEl.current

             updated.currentDate = dayjs().format()


             if (!(typeof (pointEl?.current.dayCount) === 'number')) {
               updated.dayCount = 1
               
             } else {
               const newDayCount = math.chain(pointEl?.current.dayCount).add(1).done()
               updated.dayCount = newDayCount
             }
           }
         )
       )
       
     }
   } catch (e) {
     
   }
  }

  const createNewMeditationData = async () => {
    try {
      if (!meditationMinutes || !(userIdEl?.current)) {
        Toast.show({
              type: 'error',
              text1: `Missing info`,
              text2: `You are missing info`
           });

          return
      }

      if (meditationDataIdEl?.current) {
        


        const original: MeditationData | undefined = await DataStore.query(MeditationData, meditationDataIdEl?.current)

        if (original?.id) {
          
          const originalCopy = original as MeditationData

          const updatedMeditationData = await DataStore.save(
            MeditationData.copyOf(originalCopy, (updated) => {
              if (parseFloat(meditationMinutes) > -1) {
                updated.minutes = parseFloat(meditationMinutes)
              }
            })
          )

          

          await updateUserStats()

          Toast.show({
                type: 'success',
                text1: 'Meditation recorded',
                text2: `You have recorded ${meditationMinutes} minutes 🙌`
             })

             navigation.navigate('UserProgressActiveComponents', { isUpdate: uuid() })
          }
      } else if (userIdEl?.current && !(meditationDataIdEl?.current)) {
        const meditationData = new MeditationData({
          date: dayjs().format(),
          userId: userIdEl?.current,
          minutes: parseFloat(meditationMinutes),
          ttl: dayjs().add(1, 'y').unix(),
        })

        const newMeditationData = await DataStore.save(
          meditationData
        )

        

        await updateUserStats()

        await updateUserPoint()

        await updateStreak()

        await updateLevel()

        Toast.show({
              type: 'success',
              text1: 'Meditation recorded',
              text2: `You have recorded ${meditationMinutes} minutes. You are awarded ${pointRewardEl?.current} points! 🙌`
           });
        meditationDataIdEl.current = meditationData.id

        navigation.navigate('UserProgressActiveComponents', { isUpdate: uuid() })
      }
    } catch (e) {
      
      Toast.show({
            type: 'error',
            text1: 'Oops...',
            text2: `Something went wrong 🤭`
         });
    }
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        keyboardVerticalOffset={height + 64}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <Box flex={1} justifyContent="center" alignItems="center">
          <Box flex={2} justifyContent="center" alignItems="center" my={{ phone: 's', tablet: 'm' }}>
            <Box flex={0.5}>
              <PrimaryCard >
                <Text variant="primaryHeader">
                  {meditationMinutes && `${meditationMinutes} minutes`}
                </Text>
                {goal?.goal ? (
                  <Text variant="primaryOptionHeader">
                    {`Goal: ${goal?.goal} minutes`}
                  </Text>
                ) : null}
              </PrimaryCard>
            </Box>
            <Box flex={2}>
              <LottieView
                ref={meditationRef}
                source={require('@assets/icons/yoga.json')}
                loop
                style={styles.svg}
              />
            </Box>
          </Box>
          <Box flex={1} justifyContent="center" alignItems="center" my={{ phone: 's', tablet: 'm' }}>
            <RegularCard>
              <Box>
                <TextField
                  type="numeric"
                  title="minutes"
                  onChangeText={(text: string) => setMeditationMinutes(text.replace(/[^0-9.]/g, ''))}
                  value={meditationMinutes}
                />
              </Box>
              <Button onPress={createNewMeditationData}>
                Save
              </Button>
            </RegularCard>
          </Box>
        </Box>
    </KeyboardAvoidingView>
  </TouchableWithoutFeedback>
  )
}

export default UserAddMeditation
