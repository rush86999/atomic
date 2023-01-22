import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native'
import { DataStore, SortDirection} from '@aws-amplify/datastore'
import { dayjs, RNLocalize } from '@app/date-utils'
import utc from 'dayjs/plugin/utc'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import {
  Status, PrimaryGoalType, Point, UserStat, UserProfile,
  Schedule, Level, Streak, Goal, Day,
} from '@models'
import Box from '@components/common/Box'
import Text from '@components/common/Text'

import * as math from 'mathjs'

import Toast from 'react-native-toast-message';

import { TextField } from 'react-native-ui-lib';

import Running from '@assets/icons/running.svg'
import RegularCard from '@components/RegularCard'
import PrimaryCard from '@components/PrimaryCard'
import Button from '@components/Button'

type RootNavigationStackParamList = {
  UserProgressActiveComponents: undefined,
  UserAddExercise: undefined,
}

type UserAddExerciseNavigationProp = StackNavigationProp<
  RootNavigationStackParamList,
  'UserAddExercise'
>

const styles = StyleSheet.create({
  svg: {
    width: 'auto',
  }
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

type Props = {
  sub: string,
}

function UserAddExercise(props: Props) {

  const [goal, setGoal] = useState<Goal | null>(null);

  const [exerciseMinutes, setExerciseMinutes] = useState<string>('30')
 
  // values are instantaneous
  const levelEl = useRef<Level>(null)
  const streakEl = useRef<Streak>(null)
  const previousStreakEl = useRef<Streak>(null)
  const pointRewardEl = useRef<number>(null)
  const profileIdEl = useRef<string>(null)
  const userProfileEl = useRef<UserProfile>(null)
  const pointEl = useRef<Point>(null)
  const userIdEl = useRef<string>(null)
  const levelSystemEl = useRef<LevelSystem[]>(null)
  const scheduleEl = useRef<Schedule>(null)
  const exerciseDataIdEl = useRef<string>(null)
  const userStatEl = useRef<UserStat>()

  const { sub } = props

  const navigation = useNavigation<UserAddExerciseNavigationProp>()

  // create streak if 3 or more days
  // get streak as well
  useEffect(() => {
    const getStreak = async (): Promise<null | undefined | Streak> => {
      try {
        if (!(userIdEl?.current)) {
          return null
        }

        const todayStreak = await DataStore.query(Streak, c => c
            .userIdGoal('eq', `${userIdEl?.current}#${PrimaryGoalType.GENERICEXERCISE}#null`)
            .lastSyncDate('beginsWith', dayjs().format('YYYY-MM-DD')))

        if (todayStreak?.length > 0) {
          // setStreak(todayStreak[0])
          streakEl.current = todayStreak[0]
          return todayStreak[0]
        }

        if (!todayStreak || !(todayStreak?.length > 0)) {
          const yesterdayStreak = await DataStore.query(Streak, c => c
              .userIdGoal('eq', `${userIdEl?.current}#${PrimaryGoalType.GENERICEXERCISE}#null`)
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
              c => c.userIdGoal('eq', `${userIdEl?.current}#${PrimaryGoalType.GENERICEXERCISE}#null`),
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
        // 
      }
    }
    /// create streak if one not available
    const createStreak = async () => {
      try {

        const newStreak = new Streak({
          goalId: goal?.id || undefined,
          primaryGoalType: PrimaryGoalType.GENERICEXERCISE,
          userIdGoal: `${userIdEl?.current}#${PrimaryGoalType.GENERICEXERCISE}#null`,
          userId: userIdEl?.current,
          streak: 1,
          startDate: dayjs().format('YYYY-MM-DD'),
          lastSyncDate: dayjs().format('YYYY-MM-DD'),
          ttl: dayjs().add(2, 'y').unix(),
        })

        await DataStore.save(newStreak)
        streakEl.current = newStreak
        // return newStreak

      } catch(e) {
        // 
      }
    }
    (async (): Promise<undefined | null> => {
      try {
        if (!(userIdEl?.current)) {
          return null
        }

        const currentStreak = await getStreak()

        if (currentStreak?.id) {
          return null
        }

        const dataPoints = await DataStore.query(GenericExerciseData,
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
        // 
      }
    })()
  }, [userIdEl?.current, streakEl.current])

 

  // get pointreward after getting scheduleId
  useEffect(() => {
    const getPointReward = async () => {
      try {
        const userData = await DataStore.query(User, c => c.sub('eq', sub), {
          page: 0,
          limit: 1,
        })

        if (userData && userData[0]) {
          const { id } = userData[0]
          // setUserId(id)
          userIdEl.current = id

          // check if schedule available and adjust PointSystem accordingly
          const scheduleDatas = await DataStore.query(Schedule, c => c.userId('eq', id)
            .date('beginsWith', dayjs().format('YYYY'))
            .status('eq', Status.ACTIVE)
            .primaryGoalType('eq', PrimaryGoalType.GENERICEXERCISE))

          if (
            scheduleDatas && scheduleDatas.length > 0
            && (scheduleDatas[0]?.endDate
              && dayjs().isAfter(scheduleDatas[0]?.endDate)
              || !(scheduleDatas[0]?.endDate)
            )
          ) {

            const pointRewardDatas = await DataStore.query(PointSystem, c => c.action('eq', Action.RECORDWITHSCHEDULE))

            if (pointRewardDatas && pointRewardDatas.length > 0) {
              const pointRewardData = pointRewardDatas[0]

              if (pointRewardData as PointSystem) {
                const pointRewardDataCopy = pointRewardData as PointSystem

                // setPointReward(pointRewardDataCopy?.point || 0)
                pointRewardEl.current = pointRewardDataCopy?.point || 0
              }
            }

          } else {
            const pointRewardDatas = await DataStore.query(PointSystem, c => c.action('eq', Action.RECORD))

            if (pointRewardDatas && pointRewardDatas.length > 0) {
              const pointRewardData = pointRewardDatas[0]

              if (pointRewardData as PointSystem) {
                const pointRewardDataCopy = pointRewardData as PointSystem

                // setPointReward(pointRewardDataCopy?.point || 0)
                pointRewardEl.current = pointRewardDataCopy?.point || 0
              }
            }
          }
        }
      } catch (e) {
        // 
      }
    }
    getPointReward()
  }, [])

  // get userProfileId
  useEffect(() => {
    const getProfileId = async (userId1: string) => {
      try {
        const userData = await DataStore.query(User, userId1)

        if (userData && userData.profileId) {
          const profileIdData = userData.profileId

          if (profileIdData) {
            // setProfileId(profileIdData)
            profileIdEl.current = profileIdData
          }
        }
      } catch (e) {
          // 
      }
    }
    if (userIdEl?.current) {
      getProfileId(userIdEl.current)
    }
  }, [userIdEl?.current])

  // get userProfile
  useEffect(() => {
    const getUserProfile = async () => {
      try {
        const getProfileData = await DataStore.query(UserProfile, profileIdEl?.current)
        if (getProfileData && getProfileData.pointId) {

          // setUserProfile(getProfileData)
          userProfileEl.current = getProfileData
        }

      } catch (e) {
        // 
      }
    }
    getUserProfile()
  }, [profileIdEl?.current])

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
        // 
      }
    }
    getPoint()
  }, [userProfileEl?.current])

  // get Goal
  // and deactivateGoal
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
    const getExerciseGoal = async (userId1: string) => {
      try {

        const goals = await DataStore.query(Goal, c => c.userId('eq', userId1)
        .date('beginsWith', dayjs().format('YYYY'))
        .status('eq', Status.ACTIVE)
        .primaryGoalType('eq', PrimaryGoalType.GENERICEXERCISE), {
          page: 0,
          limit: 1,
          sort: s => s.date(SortDirection.DESCENDING),
        })

        const goals1 = await DataStore.query(
          Goal,
          c => c.userId('eq', userId1)
            .date('beginsWith', dayjs().subtract(1, 'y').format('YYYY'))
            .status('eq', Status.ACTIVE)
            .primaryGoalType('eq', PrimaryGoalType.GENERICEXERCISE),
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
        // 
      }
    }
    if (userIdEl?.current) {
      getExerciseGoal(userIdEl?.current);
    }
  }, [userIdEl?.current])

  // set default exercise from db
  useEffect(() => {
    const updateCount = () => {
      if (goal?.goal as string) {
        const goalCopy = goal?.goal as string
        setExerciseMinutes(goalCopy)
      }
    }
    updateCount()
  }, [goal])

  // get UserStats
  useEffect(() => {
    const getUserStat = async (userId1: string) => {
      try {
        const userStatDatas = await DataStore.query(UserStat, c => c.userId('eq', userId1)
        .primaryGoalType('eq', PrimaryGoalType.GENERICEXERCISE))

        if (userStatDatas && userStatDatas.length > 0) {
          const userStatData = userStatDatas[0]

          // setUserStat(userStatData)
          userStatEl.current = userStatData
        }
      } catch (e) {
        // 
      }
    }
    if (userIdEl?.current) {
      getUserStat(userIdEl?.current)
    }
  }, [userIdEl?.current])

  // get already registered exerciseData if any
  useEffect(() => {
    const getGenericExerciseData = async (userId1: string) => {
      try {
         const exerciseDatas = await DataStore.query(GenericExerciseData, (c) => c.userId('eq', userId1), {
           sort: s => s.date(SortDirection.DESCENDING),
           page: 0,
           limit: 1,
         })

        if (exerciseDatas && exerciseDatas[0] && exerciseDatas[0].id) {
          const { date } = exerciseDatas[0]

          if (dayjs(date).isSameOrAfter(dayjs().hour(0))) {
            const { id } = exerciseDatas[0]
            // setGenericExerciseDataId(id)
            exerciseDataIdEl.current = id
          }
        }
      } catch (e) {
        // 
      }
    }
    if (userIdEl?.current) {
      getGenericExerciseData(userIdEl?.current)
    }
  }, [userIdEl?.current])

  // get level or create it if does not exist
  useEffect(() => {
    // create level if does not exist
    const createLevel = async (): Promise<undefined | null> => {
      try {
        if (!(userIdEl?.current)) {
          return null
        }
        const newLevel = new Level({
          userId: userIdEl?.current,
          level: 1,
          primaryGoalType: PrimaryGoalType.GENERICEXERCISE,
          secondaryGoalType: 'null',
          date: dayjs().format(),
        })

        await DataStore.save(newLevel)

        // setLevel(newLevel)
        levelEl.current = newLevel
      } catch(e) {
        // 
      }
    }
    (async (): Promise<null | undefined> => {
      try {
        if (!(userIdEl?.current)) {
          return null
        }
      const levels  = await DataStore.query(Level,
        c => c.userId('eq', userIdEl?.current)
        .primaryGoalType('eq', PrimaryGoalType.GENERICEXERCISE)
        .secondaryGoalType('eq', 'null'))

        if (levels?.length > 0) {
          const [oldLevel] = levels
          // setLevel(oldLevel)
          levelEl.current = oldLevel
        } else {
          await createLevel()
        }
      } catch(e) {
        // 
      }
    })()
  }, [userIdEl?.current])

  // get level system
  useEffect(() => {
    (async () => {
      try {
        const systems = await DataStore.query(LevelSystem)
        if (systems?.length > 0) {
          // setLevelSystem(systems)
          levelSystemEl.current = systems
        }
      } catch(e) {
        // 
      }
    })()
  }, [])

  // get schedule
  // and deactivateSchedule if needed
  useEffect(() => {
    (async (): Promise<null | undefined | Schedule> => {
      if (!(userIdEl?.current)) {
        return null
      }
      const schedules = await DataStore.query(Schedule,
        c => c
          .userIdGoal('eq', `${userIdEl?.current}#${PrimaryGoalType.GENERICEXERCISE}#null`)
          .status('eq', Status.ACTIVE),
        {
          sort: s => s.date(SortDirection.DESCENDING),
        })

      if (schedules?.length > 0) {
        const [oldSchedule] = schedules
        /** make schedule inactive if date
         after endDate */
        if (oldSchedule?.endDate
          && dayjs().isAfter(oldSchedule?.endDate)) {

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
  }, [userIdEl?.current])

  // update existing streak if available
  const updateStreak = async (): Promise<null | undefined> => {
    try {
      if (!(streakEl?.current)) {
        return null
      }

      if (streakEl.current.lastSyncDate !== dayjs().format('YYYY-MM-DD')) {
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
      // 
    }
  }

  /**
    * levels only change if there is a goal and schedule in place
    2 scenarios for if they miss the schedule day -->
    1. remaining attempts -
      - find previous day on schedule
      - find date on data point for day
      if none -> subtract attempt
       if 1 attempt left go down 1 level with 3 attempts

    2. attemps -
      find previous day on schedule
      find date on data point for day
      see if match
        - check week length with start date
        if > week length go up 1 level
    *
   */
   const updateLevel = async (): Promise<undefined | null> => {
     try {
       if (!scheduleEl?.current?.id) {
         return null
       }

       /** 52 weeks in a year */
       const previousWeek =  dayjs().week() === 0
        ? dayjs().subtract(1, 'y').week(52)
        : dayjs().week(dayjs().week() - 1)

       if ((scheduleEl?.current?.byWeekDay?.length > 0)
            && levelEl.current?.level) {

         const previousWeekDays = (scheduleEl?.current?.byWeekDay as Day[]).map(day => {
           return previousWeek.day(getDayNumber(day)).format('YYYY-MM-DD')
         })

         previousWeekDays.forEach(async (date) => {
           try {
             const dataPoints = await DataStore.query(GenericExerciseData,
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
             // 
           }
         })
       }

     } catch(e) {
       // 
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
               primaryGoalType: PrimaryGoalType.GENERICEXERCISE,
               secondaryGoalType: 'null',
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
       // 
     }
   }

   const metLevel = async (comparisonDate: string) => {
     try {
       const weeks = dayjs(comparisonDate).diff(dayjs(levelEl.current?.date).format(), 'w', true)

       const currentLevelSystem = levelSystemEl.current?.find(i => i.level === levelEl.current?.level)

      if (currentLevelSystem?.id) {
        if (weeks > currentLevelSystem.scheduleWeekLength) {
          const newLevel = await DataStore.save(
            new Level({
              userId: userIdEl?.current,
              level: levelEl.current?.level + 1,
              attempts: 3,
              primaryGoalType: PrimaryGoalType.GENERICEXERCISE,
              secondaryGoalType: 'null',
              date: dayjs().format(),
            })
          )

          await DataStore.delete(levelEl.current)

          // setLevel(newLevel)
          levelEl.current = newLevel
        }
      }

     } catch(e) {
       // 
     }
   }

  // update userStat for each primaryGoalType
  // update
  const updateUserStats = async () => {
    try {
      if ( userStatEl?.current?.currentDate && userIdEl?.current) {
          /** no data was added for today so create new item */
          if (dayjs(userStatEl?.current?.currentDate).format('YYYY-MM-DD') !== dayjs().format('YYYY-MM-DD')) {
            const newUserStat = await DataStore.save(
              UserStat.copyOf(userStatEl?.current, updated => {

                /** update max min from previous data */
                if ((userStatEl?.current?.max || 0) < (userStatEl?.current?.currentValue || 0)) {
                  updated.max = userStatEl?.current?.currentValue || 0
                  updated.maxDate = userStatEl?.current?.currentDate || dayjs().format()

                }

                if ((userStatEl?.current?.min || 0) > (userStatEl?.current?.currentValue || 0)) {
                  updated.min = (userStatEl?.current?.currentValue || 0)
                  updated.minDate = userStatEl?.current?.currentDate || dayjs().format()
                }


                const newValue = math.chain(userStatEl?.current?.value).add((userStatEl?.current?.currentValue || 0)).done()

                // set currentdate as it is yesterday's date or not set
                updated.currentDate = dayjs().format()

                // set currentValue to today's value
                updated.currentValue = parseFloat(exerciseMinutes) || 0

                updated.value = newValue


                const newDayCount = math.chain(userStatEl?.current?.dayCount).add(1).done()
                updated.dayCount = newDayCount

                if (previousStreakEl.current) {
                  updated.lastStreakStartDate = previousStreakEl.current?.startDate
                  updated.lastStreakEndDate = previousStreakEl.current?.lastSyncDate
                  updated.lastStreakValue = previousStreakEl.current?.streak
                }

                if (previousStreakEl.current?.streak > (updated?.bestStreakValue || 0)) {
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
              })
            )
            // setUserStat(newUserStat)
            userStatEl.current = newUserStat
          } else {
              const original: GenericExerciseData | undefined = await DataStore.query(GenericExerciseData, exerciseDataIdEl?.current)

              if (original as GenericExerciseData) {

                const originalCopy = original as GenericExerciseData
                const difference = math.chain(originalCopy.minutes).subtract(parseFloat(exerciseMinutes)).done()

                const newUserStat = await DataStore.save(
                  UserStat.copyOf(userStatEl?.current, updated => {

                    /** update max min etc as a background task */

                    const newValue = math.chain(updated.value).subtract(difference).done()

                    updated.value = newValue
                  })
                )
                // setUserStat(newUserStat)
                userStatEl.current = newUserStat
              }
            }
      } else if (!(userStatEl?.current?.currentDate)) {
        // first time UserStat
        const newUserStat = new UserStat({
          primaryGoalType: PrimaryGoalType.GENERICEXERCISE,
          userId: userIdEl?.current,
          value: parseFloat(exerciseMinutes),
          max: parseFloat(exerciseMinutes),
          min: parseFloat(exerciseMinutes),
          maxDate: dayjs().format(),
          minDate: dayjs().format(),
          currentDate: dayjs().format(),
          dayCount: 1,
        })

        await DataStore.save(newUserStat)
        // setUserStat(newUserStat)
        userStatEl.current = newUserStat
      }
    } catch (e) {
      // 
    }
  }

  // update userPoint
  const updateUserPoint = async () => {
    try {
      if (pointEl?.current.currentDate) {
        /** must not update if calorie data already exists
        as pointEl?.currents are already added */
          if (dayjs(pointEl?.current.currentDate).format('YYYY-MM-DD') !== dayjs().format('YYYY-MM-DD')) {
            await DataStore.save(
              Point.copyOf(
                pointEl?.current, updated =>  {

                  /** cannot update min and max until next day as a background task
                  unable to update */
                  /** update max min based on previous values */
                  if ((pointEl?.current?.max || 0) < (pointEl?.current.currentPoints || 0)) {
                    updated.max = pointEl?.current.currentPoints || 0
                    updated.maxDate = pointEl?.current.currentDate || dayjs().format()

                  }

                  if ((pointEl?.current?.min || 0) > (pointEl?.current.currentPoints || 0)) {
                    updated.min = pointEl?.current.currentPoints || 0
                    updated.minDate = pointEl?.current.currentDate || dayjs().format()
                  }

                  // add previous date's value to overall pointEl?.currents
                  const newValue = math.chain(pointEl?.current.points).add(pointEl?.current?.currentPoints || 0).done()
                  updated.points = newValue

                  // set currentdate as it is yesterday's date or not set
                  updated.currentDate = dayjs().format()

                  // set currentValue to today's value
                  updated.currentPoints = pointRewardEl.current

                  updated.currentDate = dayjs().format()

                  /** cannot update min and max until next day as a background task
                  unable to update */

                  const newDayCount = math.chain(pointEl?.current.dayCount).add(1).done()
                  updated.dayCount = newDayCount
                }
              )
            )

          }
      } else {
        // point does not exist
        //  this should be created when user registers
        // 
      }
    } catch (e) {
      // 
    }
  }

  // create new exercise data and save data
  const createNewGenericExerciseData = async (): Promise<undefined | null> => {
    try {
      if (!exerciseMinutes || !(userIdEl?.current)) {
        Toast.show({
              type: 'error',
              text1: `Missing info`,
              text2: `You are missing info`
           });

          return null;
      }
      if (exerciseDataIdEl?.current) {
        /** always update userStat first to get the difference in values
        if you update after then you lose the original value */
        await updateUserStats()

        const original: GenericExerciseData | undefined = await DataStore.query(GenericExerciseData, exerciseDataIdEl?.current)

        if (original as GenericExerciseData) {

          const originalCopy = original as GenericExerciseData

          await DataStore.save(
            GenericExerciseData.copyOf(originalCopy, (updated) => {
              updated.minutes = parseFloat(exerciseMinutes)
            })
          )

          Toast.show({
                type: 'success',
                text1: 'Exercise recorded',
                text2: `You have recorded ${exerciseMinutes} minutes 🙌`
             })

             navigation.goBack()
          }
      } else if (userIdEl?.current && !exerciseDataIdEl?.current) {
        const exerciseData = new GenericExerciseData({
          date: dayjs().format(),
          userId: userIdEl?.current,
          minutes: parseFloat(exerciseMinutes),
          ttl: dayjs().add(1, 'y').unix(),
        })
        await DataStore.save(
          exerciseData
        )

        await updateUserStats()

        await updateUserPoint()

        // await createStreak()

        await updateStreak()

        await updateLevel()

        Toast.show({
              type: 'success',
              text1: 'Exercise recorded',
              text2: `You have recorded ${exerciseMinutes} minutes. You are awarded ${pointRewardEl?.current} points! 🙌`
           })
        // setGenericExerciseDataId(exerciseData.id)
        exerciseDataIdEl.current = exerciseData.id
        navigation.goBack()
      }
      // setIsUpdated(true)
    } catch (e) {
      // 
      Toast.show({
            type: 'error',
            text1: 'Oops...',
            text2: `Something went wrong 🤭`
         });
    }
  }

  return (
    <Box flex={1} justifyContent="center" alignItems="center">
      <Box my={{ phone: 's', tablet: 'm' }}>
        <PrimaryCard>
          {goal?.goal ? (
            <Text variant="primarySecondaryHeader">
            {`Your goal: ${goal?.goal} minutes`}
            </Text>
          ) : null}
          {exerciseMinutes ? (
            <Text variant="primarySecondaryHeader">
              {`${exerciseMinutes} minutes`}
            </Text>
          ) : null}
        </PrimaryCard>
        <Box style={{ width: 'auto' }}>
          <Running style={styles.svg} />
        </Box>
      </Box>
      <RegularCard>
        <Box flexDirection="row">
          <TextField
            type="numeric"
            label="minutes"
            onChangeText={(text: string) => setExerciseMinutes(text.replace(/[^0-9.]/g, ''))}
            value={exerciseMinutes}
          />
        </Box>
        <Button onPress={createNewGenericExerciseData}>
          Save
        </Button>
      </RegularCard>
    </Box>
  )
}


export default UserAddExercise
