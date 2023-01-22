import AppleHealthKit, {
  HealthValue,
  HealthKitPermissions,
  HealthInputOptions,
} from 'react-native-health'
import GoogleFit, { Scopes } from 'react-native-google-fit'
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
import { v4 as uuid } from 'uuid'
import {
  StepData, Goal, User,
  Status, PrimaryGoalType, Point, UserStat, UserProfile,
  Schedule, WeightData, Level, Streak, Day,
} from '@models'
import Box from '@components/common/Box'
import Text from '@components/common/Text'

import LottieView from 'lottie-react-native'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import * as math from 'mathjs'
import Toast from 'react-native-toast-message'

import PrimaryCard from '@components/PrimaryCard'
import Button from '@components/Button'

import {
  UserProfile as UserProfileRealm,
} from '@realm/UserProfile'
import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { getEventWithId } from '@app/calendar/calendarDbHelper'


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

function getRandomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const CALORIES = [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000,
1100, 1200, 1300, 1400, 1500];

const WEIGHTS = [100, 120, 140, 160, 180, 200, 220, 250, 275, 300]

const CALORIESTEPRATIO = [0.028, 0.033, 0.038, 0.044, 0.049, 0.055, 0.060, 0.069,
0.075, 0.082]

function getClosest(val1: number, val2: number, target: number) {

  if (target - val1 >= val2 - target) {
    return val2
  }

  return val1
}

function findClosest(arr: number[], n: number, target: number) {

  if (target <= arr[0]) {
    return arr[0]
  }

  if (target >= arr[n - 1]) {
    return arr[n - 1]
  }

  let i = 0;
  let j = n;
  let mid = 0;

  while (i < j) {
    mid = Math.round((i + j) / 2)

    if (arr[mid] == target)
        return arr[mid]

    if (target < arr[mid]) {
        if ((mid > 0) && (target > arr[mid - 1])) {

          return getClosest(arr[mid - 1], arr[mid], target)
        }

        j = mid
    } else {
      if ((mid < n - 1) && (target < arr[mid + 1])) {

          return getClosest(arr[mid], arr[mid + 1], target)
      }

      i = mid + 1
    }

  }

  return arr[mid]
}

const foodFor100Calories = [
  { name: 'apples', value: 1, unit: null },
  { name: 'bananas', value: 1.5, unit: null },
  { name: 'chocolate', value: 3.5, unit: 'square' },
  { name: 'oatcakes', value: 2, unit: null },
  { name: 'oranges', value: 5, unit: null },
  { name: 'gummy bears', value: 12, unit: null },
  { name: 'peanut butter', value: 1, unit: 'spoonfull'},
  { name: 'hersheys', value: 4.5, unit: null},
  { name: 'marshmallows', value: 4, unit: null },
  { name: 'cheese cubes', value: 2, unit: null},
  { name: 'olives', value: 16, unit: null },
  { name: 'slow-churned ice cream', value: 0.5, unit: 'cup' },
  { name: 'almonds', value: 14, unit: null },
  { name: 'whole grain pretzel sticks', value: 6, unit: null },
  { name: 'pistachios', value: 20, unit: null },
  { name: 'tomato soup', value: 1, unit: 'cup'},
  { name: 'popsicles', value: 1, unit: null },
  { name: 'hard-boiled eggs', value: 1, unit: null },
  { name: 'sugar', value: 4, unit: 'teaspoon'},
  { name: 'cucumbers', value: 3, unit: null },
]

type food = {
  name: string,
  value: number,
  unit: string | null,
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

type RootNavigationStackParamList = {
  UserProgressActiveComponents: {
    isUpdate?: string,
  },
  UserAddStep: undefined,
}

type UserAddStepNavigationProp = StackNavigationProp<
  RootNavigationStackParamList,
  'UserAddStep'
>

const WEEKSTONEXTLEVEL = 4

type Props = {
  sub: string,
  getRealmApp: () => Realm,
  client: ApolloClient<NormalizedCacheObject>
}

function UserAddStep(props: Props) {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [pastStepCount, setPastStepCount] = useState<number>(0);
  const [currentWeight, setCurrentWeight] = useState<number>(160)
  const [calorieIndex, setCalorieIndex] = useState<number>(0)
  const [randomFood, setRandomFood] = useState<food>({ name: 'apples', value: 1, unit: null })
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  const walkingRef = useRef(null)

  const levelEl = useRef<Level>(null)
  const streakEl = useRef<Streak>(null)
  const previousStreakEl = useRef<Streak>(null)
  const pointRewardEl = useRef<number>(null)
  const profileIdEl = useRef<string>(null)
  const userProfileEl = useRef<UserProfile>(null)
  const pointEl = useRef<Point>(null)
  const userIdEl = useRef<string>(null)
  const scheduleEl = useRef<Schedule>(null)
  const stepDataIdEl = useRef<string>(null)
  const userStatEl = useRef<UserStat>()

  const {
    sub,
    getRealmApp,
   } = props
   const client = props?.client
  useEffect(() => {
    walkingRef?.current?.play()
  }, [])

  useEffect(() => {
    (async () => {
      try {
        if (Platform.OS !== 'ios') {
          return
        }

       const permissions = {
         permissions: {
           read: [AppleHealthKit.Constants.Permissions.Steps],
         },
       } as HealthKitPermissions

        AppleHealthKit.initHealthKit(permissions, (error: string) => {

        if (error) {
          
          Toast.show({
            type: 'error',
            text1: 'Need Access',
            text2: 'We need access to healthkit to get step data'
          })
          return
        }


        const options: HealthInputOptions = {
          startDate: new Date().toISOString(),
        }

        AppleHealthKit.getStepCount(
          options,
          (err: Object, results: HealthValue) => {
            if (err) {
              
              Toast.show({
                type: 'error',
                text1: 'Need Access',
                text2: 'We need access to healthkit to get step data'
              })
              return
            }
            
            const { value } = results
            setPastStepCount(value)
          },
        )
      })
      } catch(e) {
        
      }
    })()
  }, [])

  useEffect(() => {
    (async () => {
      try {
        if (Platform.OS !== 'android') {
          return
        }

        await GoogleFit.checkIsAuthorized()

        if (!(GoogleFit.isAuthorized)) {

          const options = {
            scopes: [
              Scopes.FITNESS_ACTIVITY_READ,
            ],
          }

          const authResult = await GoogleFit.authorize(options)

          if (!(authResult.success)) {

            
            Toast.show({
              type: 'error',
              text1: 'Need Access',
              text2: 'We need access to Google Fit to access step count.'
            })
            return
          }
        }

        const results = await GoogleFit.getDailySteps()

        const stepCount = results?.[0]?.steps?.[0]?.value

        if (stepCount > 0) {
          setPastStepCount(stepCount)
        }
      } catch(e) {
        
      }
    })()
  }, [])

  const realm = getRealmApp()

  const navigation = useNavigation<UserAddStepNavigationProp>()

  useEffect(() => {
    const getStreak = async (): Promise<null | undefined | Streak> => {
      try {
        if (!(userIdEl?.current)) {
          return
        }

        const todayStreak = await DataStore.query(Streak, c => c
            .userIdGoal('eq', `${userIdEl?.current}#${PrimaryGoalType.STEP}#null`)
            .lastSyncDate('beginsWith', dayjs().format('YYYY-MM-DD')))

        if (todayStreak?.length > 0) {
          streakEl.current = todayStreak[0]
          return todayStreak[0]
        }

        if (!todayStreak || !(todayStreak?.length > 0)) {
          const yesterdayStreak = await DataStore.query(Streak, c => c
              .userIdGoal('eq', `${userIdEl?.current}#${PrimaryGoalType.STEP}#null`)
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
              c => c.userIdGoal('eq', `${userIdEl?.current}#${PrimaryGoalType.STEP}#null`),
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
          primaryGoalType: PrimaryGoalType.STEP,
          userIdGoal: `${userIdEl?.current}#${PrimaryGoalType.STEP}#null`,
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

        const dataPoints = await DataStore.query(StepData,
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
            .primaryGoalType('eq', PrimaryGoalType.STEP))
          const event = await getEventWithId(client, scheduleDatas?.[0]?.eventId)
          if (
            scheduleDatas && scheduleDatas.length > 0
            && (event?.endDate
              && dayjs().isAfter(dayjs(event?.endDate))
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

        if (getProfileData && getProfileData.pointId) {

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
        .primaryGoalType('eq', PrimaryGoalType.STEP))

        if (userStatDatas && userStatDatas.length > 0) {
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
        .primaryGoalType('eq', PrimaryGoalType.STEP), {
          page: 0,
          limit: 1,
          sort: s => s.date(SortDirection.DESCENDING),
        })

        const goals1 = await DataStore.query(
          Goal,
          c => c.userId('eq', userId1)
            .date('beginsWith', dayjs().subtract(1, 'y').format('YYYY'))
            .status('eq', Status.ACTIVE)
            .primaryGoalType('eq', PrimaryGoalType.STEP),
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
    const getStepData = async (userId1: string) => {
      try {
         const stepDatas = await DataStore.query(StepData, (c) => c.userId('eq', userId1), {
           sort: s => s.date(SortDirection.DESCENDING),
           page: 0,
           limit: 1,
         })

        if (stepDatas && stepDatas[0] && stepDatas[0].id) {
          const { date } = stepDatas[0]

          if (dayjs(date).isSameOrAfter(dayjs().hour(0))) {
            const { id } = stepDatas[0]
            stepDataIdEl.current = id
          }
        }
      } catch (e) {
        
      }
    }
    if (userIdEl?.current) {
      getStepData(userIdEl?.current)
    }
  }, [userId])

  useEffect(() => {
    const getCurrentWeight = async (userId1: string) => {
      const weightDatas = await DataStore.query(WeightData, c => c.userId('eq', userId1), {
        page: 0,
        limit: 1,
        sort: s => s.date(SortDirection.DESCENDING),
      })

      if (weightDatas?.[0]?.weight) {
        setCurrentWeight(weightDatas[0]?.weight)
      }
    }
    if (userIdEl?.current) {
      getCurrentWeight(userIdEl?.current)
    }
  }, [userId])

  useEffect(() => {
    const calcIndex = () => {
      if (!pastStepCount) {
        
        return
      }

      if (!currentWeight) {
        
        return
      }
      const nearestWeight = findClosest(WEIGHTS, WEIGHTS.length, currentWeight)
      const nearestWeightIndex = WEIGHTS.findIndex(item => item === nearestWeight)

      const totalSteps = pastStepCount
      const calories = math.chain(CALORIESTEPRATIO?.[nearestWeightIndex]).multiply(totalSteps).done()
      const nearestCalories = findClosest(CALORIES, CALORIES.length, calories)
      const nearestCalorieIndex = CALORIES.findIndex(item => item === nearestCalories)

      setCalorieIndex(nearestCalorieIndex)
    }
    calcIndex()
  }, [currentWeight])

  useEffect(() => {
    const getRandomFood = () => {
      const newRandomFoodIndex = getRandomInt(0, foodFor100Calories.length)
      const newRandomFood = foodFor100Calories[newRandomFoodIndex]
      setRandomFood(newRandomFood)
    }
    getRandomFood()
  }, [])

  useEffect(() => {
    const createLevel = async () => {
      try {
        if (!(userIdEl?.current)) {
          return
        }
        const newLevel = new Level({
          userId: userIdEl?.current,
          level: 1,
          primaryGoalType: PrimaryGoalType.STEP,
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
        .primaryGoalType('eq', PrimaryGoalType.STEP)
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
          .userIdGoal('eq', `${userIdEl?.current}#${PrimaryGoalType.STEP}#null`)
          .status('eq', Status.ACTIVE),
        {
          sort: s => s.date(SortDirection.DESCENDING),
        })

      if (schedules?.length > 0) {
        const [oldSchedule] = schedules
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
            const dataPoints = await DataStore.query(StepData,
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
              primaryGoalType: PrimaryGoalType.STEP,
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
             primaryGoalType: PrimaryGoalType.STEP,
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

                 if (pastStepCount > 0) {
                   updated.currentValue = pastStepCount

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
               const original: StepData | undefined = await DataStore.query(StepData, stepDataIdEl?.current)

               if (original?.id) {

                 const originalCopy = original as StepData
                 const difference = math.chain(originalCopy.steps).subtract((pastStepCount)).done()

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
           primaryGoalType: PrimaryGoalType.STEP,
           userId: userIdEl?.current,
           value: (pastStepCount),
           max: (pastStepCount),
           min: (pastStepCount),
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

  const createNewStepData = async () => {
    try {
      
      if ((typeof pastStepCount !== 'number') || !(userIdEl?.current)) {
        Toast.show({
              type: 'error',
              text1: `Missing info`,
              text2: `You are missing info`
           });

          return
      }
      if (stepDataIdEl?.current) {

        await updateUserStats()

        const original: StepData | undefined = await DataStore.query(StepData, stepDataIdEl?.current)

        if (original?.id) {

          const originalCopy = original as StepData

          const totalStepCount = pastStepCount

          const updatedStepData = await DataStore.save(
            StepData.copyOf(originalCopy, (updated) => {
              updated.steps = totalStepCount
            })
          )

          

          await updateUserStats()

          Toast.show({
                type: 'success',
                text1: 'Steps recorded',
                text2: `You have recorded ${totalStepCount} steps 🙌`
             })

            navigation.navigate('UserProgressActiveComponents', { isUpdate: uuid() })
          }
      } else if (userIdEl?.current && !(stepDataIdEl?.current)) {
        const totalStepCount = pastStepCount
        const stepData = new StepData({
          date: dayjs().format(),
          userId: userIdEl?.current,
          steps: totalStepCount,
          ttl: dayjs().add(1, 'y').unix(),
        })
        await DataStore.save(
          stepData
        )

        await updateUserStats()

        await updateUserPoint()

        await updateStreak()

        await updateLevel()

        Toast.show({
              type: 'success',
              text1: 'Step recorded',
              text2: `You have recorded ${totalStepCount} steps. You are awarded ${pointRewardEl?.current} points! 🙌`
           });
        stepDataIdEl.current = stepData.id

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

  const height = useHeaderHeight()

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        keyboardVerticalOffset={height + 64}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <Box flex={1} justifyContent="center" alignItems="center">
          <Box my={{ phone: 's', tablet: 'm' }}>
            <Box flex={2} justifyContent="center" alignItems="center" my={{ phone: 's', tablet: 'm' }}>
              <Box flex={1}>
                <PrimaryCard>
                    {pastStepCount > -1 ? (
                      <Text variant="primaryHeader">
                        {`${pastStepCount} steps`}
                      </Text>
                    ) : null}
                    {goal?.goal?.length > 0 ? (
                      <Text variant="primaryOptionHeader">
                        {`Your goal: ${goal?.goal} steps`}
                      </Text>
                    ) : null}
                    <Text variant="primarySecondaryHeader">
                      {
                        (randomFood && calorieIndex && randomFood.unit)
                        ? (`You burned ${math.chain(randomFood.value).multiply(calorieIndex).done()} ${randomFood.unit} of ${randomFood.name}`)
                        : (`You burned ${math.chain(randomFood.value).multiply(calorieIndex).done()} ${randomFood.name}`)
                      }
                    </Text>
                </PrimaryCard>
              </Box>
              <Box flex={2}>
                <Box mt={{ phone: 's', tablet: 'm' }}>
                  <LottieView
                    ref={walkingRef}
                    source={require('@assets/icons/walking.json')}
                    loop={true}
                    style={styles.svg}
                  />
                </Box>
              </Box>
            </Box>
            <Box>
              {
                (Platform.OS === 'ios')
                ? (
                  <Box my={{ phone: 'xs', tablet: 's' }}>
                    <Text variant="optionHeader" textAlign="center">
                      Powered by Apple Health
                    </Text>
                  </Box>
                ) : null
              }
            </Box>
            <Box flex={1} justifyContent="center" alignItems="center" my={{ phone: 's', tablet: 'm' }}>
              <Button onPress={createNewStepData}>
                  Save
              </Button>
            </Box>
          </Box>
        </Box>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  )
}

export default UserAddStep
