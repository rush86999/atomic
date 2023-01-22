import React, { useState, useEffect, useRef } from 'react'
import {
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  useColorScheme,
 } from 'react-native'
 import { useHeaderHeight } from '@react-navigation/elements'
import { DataStore, SortDirection} from '@aws-amplify/datastore'
import { GraphQLResult, API } from '@aws-amplify/api'
import { dayjs } from '@app/date-utils'
import Toast from 'react-native-toast-message';
import { TextField} from 'react-native-ui-lib'
import {Picker} from '@react-native-picker/picker'
import * as math from 'mathjs'

import { palette } from '@theme/theme'

import {
  EnduranceData, GoalExercise, User,
  Status, PrimaryGoalType, Point, UserExerciseStat, UserProfile,
  Schedule, StatPreference, ExerciseType, Level,
  Streak, Day,
} from '@models'

import ListExerciseByName from '@graphql/Queries/ListExerciseByName'

import {
  ListExerciseByNameQuery,
  ListExerciseByNameQueryVariables,
} from '@app/API'

import {
  UserProfile as UserProfileRealm,
} from '@realm/UserProfile'

import Box from '@components/common/Box'
import Text from '@components/common/Text'

import Button from '@components/Button'
import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { getEventWithId } from '@app/calendar/calendarDbHelper'


const styles = StyleSheet.create({
  container: {
  },
})

type Props = {
  sub: string,
  type: string,
  updateSubmittedArray: (index: number) => void,
  index: number,
  getRealmApp: () => Realm,
  client: ApolloClient<NormalizedCacheObject>,
}

type item = 'reps' | 'miles'


const rescapeUnsafe = (safe: string) => safe
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#039;/g, '\'')
  .replace(/-/gi, ' ');

  type getExerciseType = (value: ExerciseType) => item

  const getExerciseType: getExerciseType = (value) => {
    switch(value) {
      case ExerciseType.REPS:
        return 'reps'
      case ExerciseType.DISTANCE:
        return 'miles'
      default:
        return 'reps'
    }
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

  function UserAddEnduranceMini(props: Props) {
    // const [enduranceDataId, setEnduranceDataId] = useState<string>('')
    const [reps, setReps] = useState<string>('')
    const [goal, setGoal] = useState<GoalExercise | null>(null);
    const [enduranceMinutes, setEnduranceMinutes] = useState<string>('30')

    const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

    const [selectedStat, setSelectedStat] = useState<item>('reps')
    const [distance, setDistance] = useState<string>('')
    const [userId, setUserId] = useState<string | null>(null)

    const dark = useColorScheme() === 'dark'
    const height = useHeaderHeight()
    
    const levelEl = useRef<Level>(null)
    const streakEl = useRef<Streak>(null)
    const previousStreakEl = useRef<Streak>(null)
    const pointRewardEl = useRef<number>(null)
    const profileIdEl = useRef<string>(null)
    const userProfileEl = useRef<UserProfile>(null)
    const pointEl = useRef<Point>(null)
    const userExerciseStatEl = useRef<UserExerciseStat>(null)
    const userIdEl = useRef<string>(null)
    // const levelSystemEl = useRef<LevelSystem[]>(null)
    const scheduleEl = useRef<Schedule>(null)
    const enduranceDataIdEl = useRef<string>(null)

    const {
      sub,
      type,
      updateSubmittedArray,
      index: routineIndex,
      getRealmApp,
    } = props
    const client = props?.client

    const realm = getRealmApp()

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
              .userIdGoal('eq', `${userIdEl?.current}#${PrimaryGoalType.ENDURANCE}#${type}`)
              .lastSyncDate('beginsWith', dayjs().format('YYYY-MM-DD')))

          if (todayStreak?.length > 0) {
            // setStreak(todayStreak[0])
            streakEl.current = todayStreak[0]
            return todayStreak[0]
          }

          if (!todayStreak || !(todayStreak?.length > 0)) {
            const yesterdayStreak = await DataStore.query(Streak, c => c
                .userIdGoal('eq', `${userIdEl.current}#${PrimaryGoalType.ENDURANCE}#${type}`)
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
                c => c.userIdGoal('eq', `${userIdEl.current}#${PrimaryGoalType.ENDURANCE}#${type}`),
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
            primaryGoalType: PrimaryGoalType.ENDURANCE,
            userIdGoal: `${userIdEl.current}#${PrimaryGoalType.ENDURANCE}#${type}`,
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
          // 
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

          const dataPoints = await DataStore.query(EnduranceData,
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

    /** get ExerciseType */
    useEffect(() => {
      (async () => {
        try {
          // const exercise = await DataStore.query(Exercise, c => c.name('eq', type))

          const exerciseData = await API.
            graphql({
              query: ListExerciseByName,
              variables: {
                nId: 'null',
                name: {
                  eq: rescapeUnsafe(capitalizeFirstLetter(type)),
                }
              } as ListExerciseByNameQueryVariables
            }) as GraphQLResult<ListExerciseByNameQuery>

            const exercise = exerciseData?.data?.listExerciseByName?.items

          if (exercise?.[0]?.id) {
            setSelectedStat(getExerciseType((exercise?.[0]?.type as ExerciseType)))
          }

        } catch(e) {
          
        }
      })()
    }, [])

    // get pointreward after getting scheduleId
    useEffect(() => {
      const getPointReward = async () => {
        try {
          const userData = await DataStore.query(User, c => c.sub('eq', sub), {
            page: 0,
            limit: 1,
          })

          if ( userData && userData[0]) {
            const { id } = userData[0]
            setUserId(id)
            userIdEl.current = id
            // check if schedule available and adjust PointSystem accordingly
            const scheduleDatas = await DataStore.query(Schedule, c => c
              .userIdGoal('eq', `${userIdEl.current}#${PrimaryGoalType.ENDURANCE}#${type}`)

            )

            const event = await getEventWithId(client, scheduleDatas?.[0]?.eventId)
            if (
              scheduleDatas?.[0]?.id
              && (event?.endDate
                && dayjs(event?.endDate).isAfter(dayjs())
                || !(event?.endDate)
              )
            ) {
              /**  hard coded point rewards  */
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

          if (getProfileData?.pointId) {

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

    // get UserExerciseStats
    useEffect(() => {
      const getUserExerciseStat = async (userId: string) => {
        try {
          const userExerciseStatDatas = await DataStore.query(UserExerciseStat, c => c.userId('eq', userId)
          .primaryGoalType('eq', PrimaryGoalType.ENDURANCE)
          .secondaryGoalType('eq', type))

          if (userExerciseStatDatas?.[0]?.id) {
            const userExerciseStatData = userExerciseStatDatas[0]

            // setUserExerciseStat(userExerciseStatData)
            userExerciseStatEl.current = userExerciseStatData
            // set selectedStat

            const newSelectedStat = userExerciseStatEl?.current?.statPreference ? (userExerciseStatEl?.current.statPreference === StatPreference.REPS ? 'reps'
              : 'miles') : userExerciseStatData.distanceValue ? 'miles' : 'reps'

            setSelectedStat(newSelectedStat)
          }
        } catch (e) {
          
        }
      }
      if (userIdEl.current) {
        getUserExerciseStat(userIdEl.current)
      }
    }, [userId])

    // get Goal
    // and deactivatGoal
    useEffect(() => {
      const deactivateGoal = async (goal: GoalExercise) => {
        try {
          const updatedGoal = await DataStore.save(
            GoalExercise.copyOf(
              goal, updated => {
                updated.status = Status.ENDED
              }
            )
          )
          
        } catch(e) {
          
        }
      }
      const getExerciseGoal = async (userId: string) => {
        try {

          const goals = await DataStore.query(GoalExercise, c => c.userId('eq', userId)
          .date('beginsWith', dayjs().format('YYYY'))
          .status('eq', Status.ACTIVE)
          .primaryGoalType('eq', PrimaryGoalType.ENDURANCE)
          .secondaryGoalType('eq', type), {
            page: 0,
            limit: 1,
            sort: s => s.date(SortDirection.DESCENDING),
          })

          const goals1 = await DataStore.query(
            GoalExercise,
            c => c.userId('eq', userId)
              .date('beginsWith', dayjs().subtract(1, 'y').format('YYYY'))
              .status('eq', Status.ACTIVE)
              .primaryGoalType('eq', PrimaryGoalType.ENDURANCE)
              .secondaryGoalType('eq', type),
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
      if (userIdEl.current) {
        getExerciseGoal(userIdEl.current);
      }
    }, [userId])

    // get already registered enduranceData if any
    useEffect(() => {
      const getEnduranceData = async (userId: string) => {
        try {
           const enduranceDatas = await DataStore.query(EnduranceData, (c) => c.userIdType('eq', `${userId}#${type}`), {
             sort: s => s.date(SortDirection.DESCENDING),
             page: 0,
             limit: 1,
           })

          if (enduranceDatas?.[0]?.id) {
            const { date } = enduranceDatas[0]

            if (dayjs(date).isSameOrAfter(dayjs().hour(0))) {

              if (selectedStat === 'reps') {
                if (enduranceDatas?.[0]?.reps) {
                  const { id } = enduranceDatas[0]
                  // setEnduranceDataId(id)
                  enduranceDataIdEl.current = id
                }
              } else {
                if (enduranceDatas?.[0]?.distance) {
                  const { id } = enduranceDatas[0]
                  // setEnduranceDataId(id)
                  enduranceDataIdEl.current = id
                }
              }

            }
          }
        } catch (e) {
          // 
        }
      }
      if (userIdEl.current) {
        getEnduranceData(userIdEl.current)
      }
    }, [userId, selectedStat])

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
            primaryGoalType: PrimaryGoalType.ENDURANCE,
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
          .primaryGoalType('eq', PrimaryGoalType.ENDURANCE)
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
            .userIdGoal('eq', `${userIdEl.current}#${PrimaryGoalType.ENDURANCE}#${type}`)
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

              await DataStore.save(
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
    const updateStreak = async (): Promise<null | undefined> => {
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

    const updateLevel = async (): Promise<undefined | null> => {
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
            GoalExercise.copyOf(
              goal, updated => {
                updated.previousWeek = previousWeek.week()
              }
            )
          )
          
          setGoal(updatedGoal)
        }

        const event = await getEventWithId(client, scheduleEl?.current?.eventId)
        if ((event?.byWeekDay?.length > 0)
             && levelEl.current?.level) {

          const previousWeekDays = (event?.byWeekDay as Day[]).map(day => {
            return previousWeek.day(getDayNumber(day)).format('YYYY-MM-DD')
          })

          const promises = previousWeekDays.map(async (date) => {
            try {
              const dataPoints = await DataStore.query(EnduranceData,
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
            GoalExercise.copyOf(
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
                primaryGoalType: PrimaryGoalType.ENDURANCE,
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
        // 
      }
    }

    const metLevel = async (comparisonDate: string) => {
      try {
        const weeks = dayjs(comparisonDate).diff(dayjs(levelEl.current?.date).format(), 'w', true)

        // const currentLevelSystem = levelSystemEl.current.find((i: LevelSystem) => i.level === levelEl.current?.level)

       // if (currentLevelSystem?.id) {
       // currentLevelSystem.scheduleWeekLength = 4 == constant
         if (weeks > WEEKSTONEXTLEVEL) {
           const newLevel = await DataStore.save(
             new Level({
               userId: userIdEl.current,
               level: levelEl.current?.level + 1,
               attempts: 3,
               primaryGoalType: PrimaryGoalType.ENDURANCE,
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

    // update userExerciseStatEl?.current for each primaryGoalType
    const updateUserExerciseStats = async () => {
      try {
        if (userExerciseStatEl?.current?.currentDate && userIdEl?.current) {
            // const regValue = dayjs().format('YYYY-MM-DD')
            //
            // const regex = new RegExp(`^(${regValue})`, 'g')
            /** no data was added for today so create new item */
            if (dayjs(userExerciseStatEl?.current.currentDate).format('YYYY-MM-DD') !== dayjs().format('YYYY-MM-DD')) {
                const newUserExerciseStat =  await DataStore.save(
                  UserExerciseStat.copyOf(userExerciseStatEl?.current, updated => {

                    /** update max min from previous data */
                    // based on type
                    switch(selectedStat) {
                      case 'miles':
                        if (typeof (userExerciseStatEl?.current?.currentDistanceValue) === 'number') {
                            if (!(typeof (userExerciseStatEl?.current?.maxDistance) === 'number')) {

                              updated.maxDistance = userExerciseStatEl?.current.currentDistanceValue
                              updated.maxDistanceDate = userExerciseStatEl?.current.currentDate || dayjs().format()
                            } else if ((userExerciseStatEl?.current?.maxDistance) < (userExerciseStatEl?.current.currentDistanceValue)) {
                              updated.maxDistance = userExerciseStatEl?.current.currentDistanceValue
                              updated.maxDistanceDate = userExerciseStatEl?.current.currentDate || dayjs().format()

                            }

                            if (!(typeof (userExerciseStatEl?.current?.minDistance) === 'number')) {

                              updated.minDistance = userExerciseStatEl?.current.currentDistanceValue
                              updated.minDistanceDate = userExerciseStatEl?.current.currentDate || dayjs().format()
                            } else if ((userExerciseStatEl?.current?.minDistance) > (userExerciseStatEl?.current.currentDistanceValue)) {
                              updated.minDistance = (userExerciseStatEl?.current.currentDistanceValue || 0)
                              updated.minDistanceDate = userExerciseStatEl?.current.currentDate || dayjs().format()
                            }
                        }

                        if (!(typeof userExerciseStatEl?.current?.distanceValue === 'number') && !(typeof (userExerciseStatEl?.current.currentDistanceValue) === 'number')) {
                          // do nothing
                          
                        } else if ((typeof (userExerciseStatEl?.current.currentDistanceValue) === 'number') && !(typeof (userExerciseStatEl?.current?.distanceValue) === 'number')) {
                          
                        } else if (!(typeof (userExerciseStatEl?.current.currentDistanceValue) === 'number') && typeof (userExerciseStatEl?.current?.distanceValue) === 'number') {

                          

                        } else {
                          const newDistanceValue = math.chain(userExerciseStatEl?.current?.distanceValue).add((userExerciseStatEl?.current.currentDistanceValue)).done()
                          // set currentValue to today's value
                          updated.currentDistanceValue = parseFloat(distance)
                          updated.distanceValue = newDistanceValue
                        }

                        break;
                      default:
                          if (typeof (userExerciseStatEl?.current?.currentRepsValue) === 'number') {
                              if (!(typeof (userExerciseStatEl?.current?.maxReps) === 'number')) {

                                updated.maxReps = userExerciseStatEl?.current.currentRepsValue
                                updated.maxRepsDate = userExerciseStatEl?.current.currentDate || dayjs().format()
                              } else if ((userExerciseStatEl?.current?.maxReps) < (userExerciseStatEl?.current.currentRepsValue)) {
                                updated.maxReps = userExerciseStatEl?.current.currentRepsValue
                                updated.maxRepsDate = userExerciseStatEl?.current.currentDate || dayjs().format()

                              }

                              if (!(typeof (userExerciseStatEl?.current?.minReps) === 'number')) {

                                updated.minReps = userExerciseStatEl?.current.currentRepsValue
                                updated.minRepsDate = userExerciseStatEl?.current.currentDate || dayjs().format()
                              } else if ((userExerciseStatEl?.current?.minReps) > (userExerciseStatEl?.current.currentRepsValue)) {
                                updated.minReps = (userExerciseStatEl?.current.currentRepsValue)
                                updated.minRepsDate = userExerciseStatEl?.current.currentDate || dayjs().format()
                              }
                          }

                          if (!(typeof userExerciseStatEl?.current?.repsValue === 'number') && !(typeof (userExerciseStatEl?.current.currentRepsValue) === 'number')) {
                            
                          } else if ((typeof (userExerciseStatEl?.current.currentRepsValue) === 'number') && !(typeof (userExerciseStatEl?.current?.repsValue) === 'number')) {
                            
                          } else if (!(typeof (userExerciseStatEl?.current.currentRepsValue) === 'number') && typeof (userExerciseStatEl?.current?.repsValue) === 'number') {

                            

                          } else {
                            const newRepsValue = math.chain(userExerciseStatEl?.current?.repsValue).add((userExerciseStatEl?.current.currentRepsValue)).done()
                            updated.currentRepsValue = parseFloat(reps)
                            updated.repsValue = newRepsValue
                          }

                        break;
                    }

                    if (typeof (userExerciseStatEl?.current?.currentMinutesValue) === 'number') {
                        if (!(typeof (userExerciseStatEl?.current?.maxMinutes) === 'number')) {

                          updated.maxMinutes = userExerciseStatEl?.current.currentMinutesValue
                          updated.maxMinutesDate = userExerciseStatEl?.current.currentDate || dayjs().format()
                        } else if ((userExerciseStatEl?.current?.maxMinutes) < (userExerciseStatEl?.current.currentMinutesValue)) {
                          updated.maxMinutes = userExerciseStatEl?.current.currentMinutesValue
                          updated.maxMinutesDate = userExerciseStatEl?.current.currentDate || dayjs().format()

                        }

                        if (!(typeof (userExerciseStatEl?.current?.minMinutes) === 'number')) {

                          updated.minMinutes = userExerciseStatEl?.current.currentMinutesValue
                          updated.minMinutesDate = userExerciseStatEl?.current.currentDate || dayjs().format()
                        } else if ((userExerciseStatEl?.current?.minMinutes) > (userExerciseStatEl?.current.currentMinutesValue)) {
                          updated.minMinutes = (userExerciseStatEl?.current.currentMinutesValue)
                          updated.minMinutesDate = userExerciseStatEl?.current.currentDate || dayjs().format()
                        }
                    }

                    if (!(typeof userExerciseStatEl?.current?.minutesValue === 'number') && !(typeof (userExerciseStatEl?.current.currentMinutesValue) === 'number')) {
                      
                    } else if ((typeof (userExerciseStatEl?.current.currentMinutesValue) === 'number') && !(typeof (userExerciseStatEl?.current?.minutesValue) === 'number')) {
                      
                    } else if (!(typeof (userExerciseStatEl?.current.currentMinutesValue) === 'number') && typeof (userExerciseStatEl?.current?.minutesValue) === 'number') {

                      

                    } else {
                      const newMinutesValue = math.chain(userExerciseStatEl?.current?.minutesValue).add((userExerciseStatEl?.current.currentMinutesValue)).done()
                      updated.currentMinutesValue = parseFloat(enduranceMinutes)
                      updated.minutesValue = newMinutesValue
                    }

                    if (!(typeof (userExerciseStatEl?.current.dayCount) === 'number')) {
                      updated.dayCount = 1
                      
                    } else {
                      const newDayCount = math.chain(userExerciseStatEl?.current.dayCount).add(1).done()
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
                userExerciseStatEl.current = newUserExerciseStat
            } else {
                const original: EnduranceData | undefined = await DataStore.query(EnduranceData, enduranceDataIdEl?.current)

                if (original?.id) {
                  const minutesDifference = math.chain(original.minutes).subtract(parseFloat(enduranceMinutes)).done()

                  const newUserExerciseStat = await DataStore.save(
                    UserExerciseStat.copyOf(userExerciseStatEl?.current, updated => {


                      const newMinutesValue = math.chain(updated.minutesValue).subtract(minutesDifference).done()

                      updated.currentMinutesValue = newMinutesValue

                      if ((selectedStat === 'reps') && (parseFloat(reps) > -1)) {
                        const repsDifference = math.chain(original.reps).subtract(parseFloat(reps)).done()
                        const newRepsValue = math.chain((userExerciseStatEl?.current?.repsValue || 0)).add(repsDifference).done()
                        updated.currentRepsValue = newRepsValue
                      } else if ((selectedStat === 'miles') && (parseFloat(distance) > -1)) {
                        const distanceDifference = math.chain(original.distance).subtract(parseFloat(distance)).done()
                        const newDistanceValue = math.chain(userExerciseStatEl?.current?.distanceValue).add(distanceDifference).done()
                        updated.currentDistanceValue = newDistanceValue
                      }
                    })
                  )
                  userExerciseStatEl.current = newUserExerciseStat
                }
              }
        } else if (!(userExerciseStatEl?.current?.currentDate)) {
          const dictionary = {
            'reps': StatPreference.REPS,
            'miles': StatPreference.DISTANCE,
          }

          const newUserExerciseStat = new UserExerciseStat({
            primaryGoalType: PrimaryGoalType.ENDURANCE,
            secondaryGoalType: type,
            userId: userIdEl?.current,
            minutesValue: parseFloat(enduranceMinutes),
            maxMinutes: parseFloat(enduranceMinutes),
            minMinutes: parseFloat(enduranceMinutes),
            repsValue: reps ? parseFloat(reps) : undefined,
            maxReps: reps ? parseFloat(reps) : undefined,
            minReps: reps ? parseFloat(reps) : undefined,
            distanceValue: distance ? parseFloat(distance) : undefined,
            maxDistance: distance ? parseFloat(distance) : undefined,
            minDistance: distance ? parseFloat(distance) : undefined,
            maxMinutesDate: dayjs().format(),
            minMinutesDate: dayjs().format(),
            maxRepsDate: reps ? dayjs().format() : undefined,
            minRepsDate: reps ? dayjs().format() : undefined,
            maxDistanceDate: distance ? dayjs().format() : undefined,
            minDistanceDate: distance ? dayjs().format() : undefined,
            currentDate: dayjs().format(),
            dayCount: 1,
            statPreference: selectedStat === 'reps' ? dictionary['reps'] : dictionary['miles'],
          })

          await DataStore.save(newUserExerciseStat)

          userExerciseStatEl.current = newUserExerciseStat
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

    const updateStatPreference = async () => {
      try {
        const dictionary = {
          'reps': StatPreference.REPS,
          'miles': StatPreference.DISTANCE,
        }

        if (userExerciseStatEl?.current) {
          const updatedUserExerciseStat = await DataStore.save(
            UserExerciseStat.copyOf(userExerciseStatEl?.current, updated => {
              updated.statPreference = selectedStat === 'reps' ? dictionary['reps'] : dictionary['miles']
            })
          )

          
        }

      } catch (e) {
        
      }
    }

    const createEnduranceData = async () => {
      if (!enduranceMinutes || !(userIdEl.current)) {
        Toast.show({
              type: 'error',
              text1: `Missing info`,
              text2: `You are missing minutes info`
           });

          return
      }
      try {
        if (enduranceDataIdEl?.current) {

          await updateUserExerciseStats()

          await updateStatPreference()

          const original: EnduranceData | undefined = await DataStore.query(EnduranceData, enduranceDataIdEl?.current)

          if (original) {

            const updatedEnduranceData = await DataStore.save(
              EnduranceData.copyOf(original, (updated) => {
                updated.minutes = parseFloat(enduranceMinutes)
                if (parseFloat(reps) > -1) {
                  updated.reps = parseFloat(reps)
                }

                if (parseFloat(distance) > -1) {
                  updated.distance = parseFloat(distance)
                }
              })
            )

            

            if (parseFloat(reps) > -1) {
              Toast.show({
                    type: 'success',
                    text1: `Endurance: ${rescapeUnsafe(capitalizeFirstLetter(type))} recorded`,
                    text2: `You have recorded ${enduranceMinutes} minutes and ${reps} reps. You are awarded ${pointRewardEl?.current} points! 🙌`
                 });
            } else if (parseFloat(distance) > -1) {
              Toast.show({
                    type: 'success',
                    text1: `Endurance: ${rescapeUnsafe(capitalizeFirstLetter(type))} recorded`,
                    text2: `You have recorded ${enduranceMinutes} minutes and ${distance} miles. You are awarded ${pointRewardEl?.current} points! 🙌`
                 });
            }
          }
        } else if (userIdEl?.current && !(enduranceDataIdEl?.current)) {
          const enduranceData = new EnduranceData({
            date: dayjs().format(),
            userId: userIdEl?.current,
            minutes: parseFloat(enduranceMinutes),
            reps: reps ? parseFloat(reps) : undefined,
            distance: distance ? parseFloat(distance) : undefined,
            type,
            userIdType: `${userIdEl.current}#${type}`,
            ttl: dayjs().add(1, 'y').unix(),
          })
          const updatedEnduranceData = await DataStore.save(
            enduranceData
          )

          

          await updateUserExerciseStats()

          await updateStatPreference()

          await updateUserPoint()

          await updateStreak()

          await updateLevel()

          updateSubmittedArray(routineIndex)

          Toast.show({
                type: 'success',
                text1: `Endurance: ${rescapeUnsafe(type)} recorded`,
                text2: `You have recorded ${enduranceMinutes} minutes and ${reps} reps. You are awarded ${pointRewardEl?.current} points! 🙌`
             })
          enduranceDataIdEl.current = enduranceData.id
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
      <Box>
        <Text textAlign="center" variant="subheader">
          {capitalizeFirstLetter(rescapeUnsafe(type))}
        </Text>
        <Box m={{ phone: 's', tablet: 'm'}}>
          <TextField
            type="numeric"
            title="minutes"
            placeholder="0"
            onChangeText={(text: string) => setEnduranceMinutes(text.replace(/[^0-9.]/g, ''))}
            value={enduranceMinutes}
          />
        </Box>
        <Box m={{ phone: 's', tablet: 'm'}}>
          {selectedStat === 'miles'
          ? (
            <TextField
              type="numeric"
              placeholder="0"
              title="miles"
              onChangeText={(text: string) => setDistance(text.replace(/[^0-9.]/g, ''))}
              value={distance}
            />
          ) :(
            <TextField
              type="numeric"
              placeholder="0"
              title="reps"
              onChangeText={(text: string) => setReps(text.replace(/[^0-9.]/g, ''))}
              value={reps}
            />
        )}
        </Box>
        <Box>
          <Picker
            style={{ color: dark ? palette.white : palette.textBlack }}
            selectedValue={selectedStat}
            onValueChange={(newSelectedStat: item) => setSelectedStat(newSelectedStat)}
          >
              <Picker.Item color={dark ? palette.white : palette.textBlack} key="reps" value="reps" label="reps" />
              <Picker.Item color={dark ? palette.white : palette.textBlack} key="miles" value="miles" label="miles" />
          </Picker>
        </Box>
        <Box alignItems="center">
          <Button onPress={createEnduranceData}>
            Save
          </Button>
        </Box>
      </Box>
    </KeyboardAvoidingView>
  </TouchableWithoutFeedback>
  )
}

  export default UserAddEnduranceMini
