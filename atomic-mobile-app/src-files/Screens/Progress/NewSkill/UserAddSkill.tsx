import React, { useState, useEffect, useRef } from 'react'
import {
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native'
 import { useHeaderHeight } from '@react-navigation/elements'
import { TextField } from 'react-native-ui-lib'
import { DataStore, SortDirection} from '@aws-amplify/datastore'
import { dayjs } from '@app/date-utils'
import Toast from 'react-native-toast-message';
import LottieView from 'lottie-react-native'
import { useNavigation, RouteProp } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { v4 as uuid } from 'uuid'
import {
  NewSkillTypeData, Goal, User,
  Status, PrimaryGoalType, Point, UserStat, UserProfile,
  Schedule, Level, Streak, Day,
  UserActivateType,
} from '@models'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import * as math from 'mathjs'
import _ from 'lodash'

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
  UserAddNewSkill: undefined,
}

type UserAddNewSkillNavigationProp = StackNavigationProp<
  RootNavigationStackParamList,
  'UserAddNewSkill'
>

type RootRouteStackParamList = {
  UserAddSkill: {
    type: string,
  },
}

type UserAddNewSkillRouteProp = RouteProp<
  RootRouteStackParamList,
  'UserAddSkill'
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

const rescapeUnsafe = (safe: string) => safe
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#039;/g, '\'')
  .replace(/-/gi, ' ')

type Props = {
  sub: string,
  route: UserAddNewSkillRouteProp,
  getRealmApp: () => Realm,
  client: ApolloClient<NormalizedCacheObject>
}

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

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

const WEEKSTONEXTLEVEL = 4

function UserAddNewSkill(props: Props) {

  const [goal, setGoal] = useState<Goal | null>(null);
  const [skillValue, setNewSkillValue] = useState<string>('30')
  const [unit, setUnit] = useState<string>('minutes')

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  const [userId, setUserId] = useState<string | null>(null)


  const levelEl = useRef<Level>(null)
  const streakEl = useRef<Streak>(null)
  const previousStreakEl = useRef<Streak>(null)
  const pointRewardEl = useRef<number>(null)
  const profileIdEl = useRef<string>(null)
  const userProfileEl = useRef<UserProfile>(null)
  const pointEl = useRef<Point>(null)
  const userStatEl = useRef<UserStat>(null)
  const userIdEl = useRef<string>(null)
  // const levelSystemEl = useRef<LevelSystem[]>(null)
  const scheduleEl = useRef<Schedule>(null)
  const skillDataIdEl = useRef<string>(null)
  const client = props?.client
  // const {
  //   sub,
  //   route: { params: { type } },
  //   getRealmApp,
  //  } = props

    const type = props?.route?.params?.type
    const sub = props?.sub
    const getRealmApp = props?.getRealmApp

    const realm = getRealmApp()
    const height = useHeaderHeight()
    const skillRef: React.MutableRefObject<LottieView | null> = useRef(null)

  const navigation = useNavigation<UserAddNewSkillNavigationProp>()

  // get unit value
  useEffect(() => {
    (async () => {
      if (!(userIdEl?.current)) {
        return
      }

      const activateTypes = await DataStore.query(UserActivateType, c => c.userId('eq', userIdEl?.current)
        .primaryGoalType('eq', PrimaryGoalType.NEWSKILLTYPE)
        .secondaryGoalType('eq', type),
      {
        limit: 1,

      })

      if (activateTypes?.length > 0) {
        const [activateType] = activateTypes

        setUnit(activateType?.unit || 'minutes')
      }
    })()
  }, [userId])

  // create streak if 3 or more days
  // get streak as well
  useEffect(() => {
    const getStreak = async () => {
      try {
        if (!(userIdEl.current)) {
          return
        }

        if (!type) {
          return
        }

        const todayStreak = await DataStore.query(Streak, c => c
            .userIdGoal('eq', `${userIdEl?.current}#${PrimaryGoalType.NEWSKILLTYPE}#${type}`)
            .lastSyncDate('beginsWith', dayjs().format('YYYY-MM-DD')))

        if (todayStreak?.length > 0) {
          // setStreak(todayStreak[0])
          streakEl.current = todayStreak[0]
          return todayStreak[0]
        }

        if (!todayStreak || !(todayStreak?.length > 0)) {
          const yesterdayStreak = await DataStore.query(Streak, c => c
              .userIdGoal('eq', `${userIdEl.current}#${PrimaryGoalType.NEWSKILLTYPE}#${type}`)
              .lastSyncDate('beginsWith', dayjs().subtract(1, 'd').format('YYYY-MM-DD')))

          if (yesterdayStreak?.length > 0) {
            // setStreak(yesterdayStreak[0])
            streakEl.current = yesterdayStreak[0]
            return yesterdayStreak[0]
          }

          // get last streak if today and yesterday are not available
          if (
            !yesterdayStreak
            || !(yesterdayStreak?.length > 0)
          ) {
            const previousStreaks = await DataStore.query(Streak,
              c => c.userIdGoal('eq', `${userIdEl.current}#${PrimaryGoalType.NEWSKILLTYPE}#${type}`),
              {
                sort: s => s.startDate(SortDirection.DESCENDING),
              })
            if (previousStreaks?.length > 0) {
              // setPreviousStreak(previousStreaks[0])
              previousStreakEl.current = previousStreaks[0]
            }
          }
        }
      } catch(e) {
        
      }
    }
    /// create streak if one not available
    const createStreak = async () => {
      try {

        const newStreak = new Streak({
          goalId: goal?.id || undefined,
          primaryGoalType: PrimaryGoalType.NEWSKILLTYPE,
          userIdGoal: `${userIdEl.current}#${PrimaryGoalType.NEWSKILLTYPE}#${type}`,
          userId: userIdEl.current,
          streak: 1,
          startDate: dayjs().format('YYYY-MM-DD'),
          lastSyncDate: dayjs().format('YYYY-MM-DD'),
          ttl: dayjs().add(2, 'y').unix(),
        })

        await DataStore.save(newStreak)
        streakEl.current = newStreak
        // return newStreak

      } catch(e) {
        
      }
    }
    (async () => {
      try {
        if (!(userIdEl.current)) {
          return
        }

        if (!type) {
          return
        }

        const currentStreak = await getStreak()

        if (currentStreak?.id) {
          return
        }

        const dataPoints = await DataStore.query(NewSkillTypeData,
          c => c.userIdType('eq', `${userIdEl.current}#${type}`),
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

  // get pointreward after getting scheduleId
  useEffect(() => {
    const getPointReward = async () => {
      try {
        const userData = await DataStore.query(User, c => c.sub('eq', sub), {
          page: 0,
          limit: 1,
        })

        if (userData?.[0]) {
          const { id } = userData[0]
          setUserId(id)
          userIdEl.current = id
          // check if schedule available and adjust PointSystem accordingly
          const scheduleDatas = await DataStore.query(Schedule, c => c
            .userIdGoal('eq', `${userIdEl.current}#${PrimaryGoalType.NEWSKILLTYPE}#${type}`)

          )
          const event = await getEventWithId(client, scheduleDatas?.[0]?.eventId)
          if (
            scheduleDatas?.[0]?.id
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
  }, [sub])

  // get userProfileId
  useEffect(() => {
    const getUserProfileRealm = async () => {
      const userProfiles = realm.objects<UserProfileRealm>('UserProfile')
      if (!(userProfiles?.[0]?.id)) {
        
      } else {
        const [profile] = userProfiles
        profileIdEl.current = profile?.id
        // userIdEl.current = profile?.userId
        // setUserId(profile?.userId)
        // get profileId from server
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
    const getProfileId = async (userId: string) => {
      try {
        const userData = await DataStore.query(User, userId)

        if (userData && userData.profileId) {
          const profileIdData = userData.profileId

          if ((profileIdData !== 'null') && profileIdData) {
            // setProfileId(profileIdData)
            profileIdEl.current = profileIdData
          } else {
            await getUserProfileRealm()
          }
        }
      } catch (e) {
          
      }
    }
    if (userIdEl.current) {
      getProfileId(userIdEl.current)
    }
  }, [userId])

  // get userProfile
  useEffect(() => {
    const getUserProfile = async () => {
      try {
        // const getProfileData = await DataStore.query(UserProfile, profileIdEl?.current)
        const getProfileDatas = realm.objects<UserProfileRealm>('UserProfile')

        const [getProfileData] = getProfileDatas

        if (getProfileData && getProfileData.pointId) {

          setUserProfile(getProfileData)
          userProfileEl.current = getProfileData
        }

      } catch (e) {
        
      }
    }
    getUserProfile()
  }, [])

  // getPoint
  useEffect(() => {
    const getPoint = async () => {
      try {

        if (userProfileEl?.current?.pointId) {
          const pointData = await DataStore.query(Point, userProfileEl?.current?.pointId)
          if (pointData?.id) {
            // setPoint(pointData)
            pointEl.current = pointData
          }
        }
      } catch (e) {
        
      }
    }
    getPoint()
  }, [userProfile?.pointId])

  // play skill animation
  useEffect(() => {
    skillRef?.current?.play()
  }, [])

  // get Goal
  // and deactivatGoal
  useEffect(() => {
    const deactivateGoal = async (goal: Goal) => {
      try {
        await DataStore.save(
          Goal.copyOf(
            goal, updated => {
              updated.status = Status.ENDED
            }
          )
        )
      } catch(e) {
        
      }
    }
    const getGoal = async (userId: string) => {
      try {

        const goals = await DataStore.query(Goal, c => c.userId('eq', userId)
        .date('beginsWith', dayjs().format('YYYY'))
        .status('eq', Status.ACTIVE)
        .primaryGoalType('eq', PrimaryGoalType.NEWSKILLTYPE)
        .secondaryGoalType('eq', type), {
          page: 0,
          limit: 1,
          sort: s => s.date(SortDirection.DESCENDING),
        })

        const goals1 = await DataStore.query(
          Goal,
          c => c.userId('eq', userId)
            .date('beginsWith', dayjs().subtract(1, 'y').format('YYYY'))
            .status('eq', Status.ACTIVE)
            .primaryGoalType('eq', PrimaryGoalType.NEWSKILLTYPE)
            .secondaryGoalType('eq', type),
            {
              page: 0,
              limit: 1,
              sort: s => s.date(SortDirection.DESCENDING),
            },
          )

          if (goals && goals.length > 0) {

            const [oldGoal] = goals
            if (dayjs().isAfter(dayjs(oldGoal.endDate))) {
              await deactivateGoal(oldGoal)
            } else {
              setGoal(goals[0])
            }
          } else if (goals1 && goals1.length > 0) {
            const [oldGoal] = goals
            if (dayjs().isAfter(dayjs(oldGoal.endDate))) {
              await deactivateGoal(oldGoal)
            } else {
              setGoal(goals1[0])
            }
          }
      } catch (e) {
        
      }
    }
    if (userIdEl.current) {
      getGoal(userIdEl.current);
    }
  }, [userId])

  // set default skill from db
  useEffect(() => {
    const getNewSkillGoal = () => {
      if (goal?.goal as string) {
        const goalCopy = goal?.goal as string
        setNewSkillValue(goalCopy)
      }
    }
    getNewSkillGoal()
  }, [goal?.id])

  // get already registered skillData if any
  useEffect(() => {
    const getNewSkillTypeData = async (userId: string) => {
      try {
         const skillDatas = await DataStore.query(NewSkillTypeData, (c) => c.userIdType('eq', `${userId}#${type}`), {
           sort: s => s.date(SortDirection.DESCENDING),
           page: 0,
           limit: 1,
         })

        if (skillDatas?.[0]?.id) {
          const { date } = skillDatas[0]

          if (dayjs(date).isSameOrAfter(dayjs().hour(0))) {
            const { id } = skillDatas[0]
            // setNewSkillTypeDataId(id)
            skillDataIdEl.current = id
          }
        }
      } catch (e) {
        
      }
    }
    if (userIdEl.current) {
      getNewSkillTypeData(userIdEl.current)
    }
  }, [userId])

  // get UserStats
  useEffect(() => {
    const getUserStat = async (userId: string) => {
      try {
        const userStatDatas = await DataStore.query(UserStat, c => c.userId('eq', userId)
        .primaryGoalType('eq', PrimaryGoalType.NEWSKILLTYPE)
        .secondaryGoalType('eq', type))

        if (userStatDatas?.[0]?.id) {
          const userStatData = userStatDatas[0]

          // setUserStat(userStatData)
          userStatEl.current = userStatData
        }
      } catch (e) {
        
      }
    }
    if (userIdEl.current) {
      getUserStat(userIdEl.current)
    }
  }, [userId])

  // get level or create it if does not exist
  useEffect(() => {
    // create level if does not exist
    const createLevel = async () => {
      try {
        if (!(userIdEl.current)) {
          return
        }
        const newLevel = new Level({
          userId: userIdEl.current,
          level: 1,
          primaryGoalType: PrimaryGoalType.NEWSKILLTYPE,
          secondaryGoalType: type,
          date: dayjs().format(),
        })

        await DataStore.save(newLevel)

        // setLevel(newLevel)
        levelEl.current = newLevel
      } catch(e) {
        
      }
    }
    (async () => {
      try {
        if (!(userIdEl.current)) {
          return
        }
      const levels  = await DataStore.query(Level,
        c => c.userId('eq', userIdEl.current)
        .primaryGoalType('eq', PrimaryGoalType.NEWSKILLTYPE)
        .secondaryGoalType('eq', type))

        if (levels?.length > 0) {
          const [oldLevel] = levels
          // setLevel(oldLevel)
          levelEl.current = oldLevel
        } else {
          await createLevel()
        }
      } catch(e) {
        
      }
    })()
  }, [userId])

 

  // get schedule
  // and deactivateSchedule if needed
  useEffect(() => {
    (async () => {
      if (!(userIdEl.current)) {
        return
      }
      const schedules = await DataStore.query(Schedule,
        c => c
          .userIdGoal('eq', `${userIdEl.current}#${PrimaryGoalType.NEWSKILLTYPE}#${type}`)
          .status('eq', Status.ACTIVE),
        {
          sort: s => s.date(SortDirection.DESCENDING),
        })

        if (schedules?.length > 0) {
          const [oldSchedule] = schedules
          /** make schedule inactive if date
           after endDate */
          const event = await getEventWithId(client, oldSchedule?.eventId)
          if (event?.endDate
            && dayjs().isAfter(dayjs(event?.endDate))) {

              return DataStore.save(
                Schedule.copyOf(
                  oldSchedule, updated => {
                    updated.status = Status.ENDED
                  }
                )
              )
          }
          // setSchedule(oldSchedule)
          scheduleEl.current = oldSchedule
        }
    })()
  }, [userId])

  // update existing streak if available
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

      /** 52 weeks in a year */
      const previousWeek =  dayjs().week() === 0
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
            const dataPoints = await DataStore.query(NewSkillTypeData,
             c => c.userIdType('eq', `${userIdEl.current}#${type}`).date('beginsWith', date),
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
              userId: userIdEl.current,
              level: levelEl.current?.level - 1,
              attempts: 3,
              primaryGoalType: PrimaryGoalType.NEWSKILLTYPE,
              secondaryGoalType: type,
              date: dayjs(comparisonDate).format()
            })
          )

          await DataStore.delete(levelEl.current)
          // return setLevel(newLevel)
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
      // setLevel(newLevel)
      levelEl.current = newLevel
    } catch(e) {
      
    }
  }

  const metLevel = async (comparisonDate: string) => {
    try {
      const weeks = dayjs(comparisonDate).diff(dayjs(levelEl.current?.date).format(), 'w', true)

      // const currentLevelSystem = levelSystemEl.current.find((i: LevelSystem) => i.level === levelEl.current?.level)

     // if (currentLevelSystem?.id) {
       if (weeks > WEEKSTONEXTLEVEL) {
         const newLevel = await DataStore.save(
           new Level({
             userId: userIdEl.current,
             level: levelEl.current?.level + 1,
             attempts: 3,
             primaryGoalType: PrimaryGoalType.NEWSKILLTYPE,
             secondaryGoalType: type,
             date: dayjs().format(),
           })
         )

         await DataStore.delete(levelEl.current)

         // setLevel(newLevel)
         levelEl.current = newLevel
       }
     // }

    } catch(e) {
      
    }
  }

  // update userStat for each primaryGoalType
  const updateUserStats = async () => {
    try {
      if (userStatEl?.current?.currentDate && userIdEl?.current) {
          // const regValue = dayjs().format('YYYY-MM-DD')
          //
          // const regex = new RegExp(`^(${regValue})`, 'g')
          /** no data was added for today so create new item */
          if (dayjs(userStatEl?.current.currentDate).format('YYYY-MM-DD') !== dayjs().format('YYYY-MM-DD')) {
            const newUserStat = await DataStore.save(
              UserStat.copyOf(userStatEl?.current, updated => {

                /** update max min from previous data */
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
                  // do nothing
                  
                } else if ((typeof (userStatEl?.current?.currentValue) === 'number') && !(typeof (userStatEl?.current?.value) === 'number')) {
                  
                } else if (!(typeof (userStatEl?.current?.currentValue) === 'number') && typeof (userStatEl?.current?.value) === 'number') {

                  

                } else {
                  const newValue = math.chain(userStatEl?.current?.value).add((userStatEl?.current?.currentValue)).done()

                  // totalValue
                  updated.value = newValue
                }

                // set currentdate as it is yesterday's date or not set
                updated.currentDate = dayjs().format()

                if (parseFloat(skillValue) > 0) {
                  updated.currentValue = parseFloat(skillValue)

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
              const original: NewSkillTypeData | undefined = await DataStore.query(NewSkillTypeData, skillDataIdEl?.current)

              if (original?.id) {

                const originalCopy = original as NewSkillTypeData
                const difference = math.chain(originalCopy.value).subtract(parseFloat(skillValue)).done()

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
          primaryGoalType: PrimaryGoalType.NEWSKILLTYPE,
          userId: userIdEl?.current,
          value: parseFloat(skillValue),
          max: parseFloat(skillValue),
          min: parseFloat(skillValue),
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
          if (dayjs(pointEl?.current?.currentDate).format('YYYY-MM-DD') !== dayjs().format('YYYY-MM-DD')) {
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

                  updated.currentPoints = pointRewardEl?.current

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

  const createNewSkillTypeData = async () => {
    if (!skillValue || !(userIdEl.current)) {
      Toast.show({
            type: 'error',
            text1: `Missing info`,
            text2: `You are missing ${unit} info`
         });

        return
    }

    try {
      if (skillDataIdEl?.current) {

        await updateUserStats()

        const original: NewSkillTypeData | undefined = await DataStore.query(NewSkillTypeData, skillDataIdEl?.current)

        if (original) {

          await DataStore.save(
            NewSkillTypeData.copyOf(original, (updated) => {

              if (parseFloat(skillValue) > -1) {
                updated.value = parseFloat(skillValue)
              }
            })
          )

          await updateUserStats()

          Toast.show({
                type: 'success',
                text1: `NewSkill: ${rescapeUnsafe(type)} recorded`,
                text2: `You have recorded ${skillValue} ${unit}. You are awarded ${pointRewardEl?.current} points! 🙌`
          })

          navigation.navigate('UserProgressActiveComponents', { isUpdate: uuid() })
        }
      } else if (userIdEl?.current && !(skillDataIdEl?.current)) {
        const skillData = new NewSkillTypeData({
          date: dayjs().format(),
          userId: userIdEl?.current,
          value: parseFloat(skillValue),
          type,
          unit,
          userIdType: `${userIdEl.current}#${type}`,
          ttl: dayjs().add(1, 'y').unix(),
        })
        await DataStore.save(
          skillData
        )

        await updateUserStats()

        await updateUserPoint()

        await updateStreak()

        await updateLevel()

        Toast.show({
              type: 'success',
              text1: `Skill: ${rescapeUnsafe(type)} recorded`,
              text2: `You have recorded ${skillValue} ${unit}. You are awarded ${pointRewardEl?.current} points! 🙌`
           })
        skillDataIdEl.current = skillData.id

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
          <Box flex={0.5} my={{ phone: 's', tablet: 'm' }}>
            <PrimaryCard>
              {skillValue ? (
                <Text variant="primaryHeader">
                  {`${skillValue} ${capitalizeFirstLetter(unit || 'minutes')}`
                  }
                </Text>
              ) : null}
              {goal?.goal ? (
                <Text variant="primaryOptionHeader">
                  {`Goal: ${goal?.goal} ${capitalizeFirstLetter(goal?.goalUnit || 'minutes')}`
                  }
                </Text>
              ) : null}
            </PrimaryCard>
          </Box>
          <Box  flex={2} style={{ width: 'auto' }}>
            <LottieView
              ref={skillRef}
              source={require('@assets/icons/cooking.json')}
              loop
              style={styles.svg}
            />
          </Box>
          <Box flex={1} justifyContent="center" alignItems="center" my={{ phone: 's', tablet: 'm' }}>
            <RegularCard>
              <Box>
                <TextField
                  type="numeric"
                  title={unit || 'minutes'}
                  onChangeText={(text: string) => setNewSkillValue(text.replace(/[^0-9.]/g, ''))}
                  value={skillValue}
                />
              </Box>
              <Button onPress={createNewSkillTypeData}>
                Save
              </Button>
            </RegularCard>
          </Box>
        </Box>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  )

}

export default UserAddNewSkill
