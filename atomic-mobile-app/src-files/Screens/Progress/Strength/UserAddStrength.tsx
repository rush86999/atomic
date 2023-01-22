import React, { useState, useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  SafeAreaView,
  FlatList,
  Pressable,
  Appearance,
 } from 'react-native'
 import { useHeaderHeight } from '@react-navigation/elements'
import { DataStore, SortDirection} from '@aws-amplify/datastore'
import { GraphQLResult, API } from '@aws-amplify/api'
import { FAB, Overlay } from 'react-native-elements/src'
import { Menu } from 'react-native-paper'
import { dayjs } from '@app/date-utils'
import Toast from 'react-native-toast-message'
import {Stepper, TextField} from 'react-native-ui-lib'
import {Picker} from '@react-native-picker/picker'
import Swipeable from 'react-native-gesture-handler/Swipeable'
import { RectButton } from 'react-native-gesture-handler'
import { useNavigation, RouteProp } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { v4 as uuid } from 'uuid'
import {
  StrengthData,
  GoalExercise,
  User,
  Status,
  PrimaryGoalType,
  Point,
  UserExerciseStat,
  UserProfile,
  Schedule,
  Level,
  Streak,
  Day,
  ExerciseType,
  StatPreference,
} from '@models'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import UserExerciseTimer from '../../Playback/UserExerciseTimer'

import * as math from 'mathjs'
import _ from 'lodash'
import Button from '@components/Button'
import { palette } from '@theme/theme'

import ListExerciseByName from '@graphql/Queries/ListExerciseByName'

import {
  ListExerciseByNameQuery,
  ListExerciseByNameQueryVariables,
} from '@app/API'

import {
  UserProfile as UserProfileRealm,
} from '@realm/UserProfile'
import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { getEventWithId } from '@app/calendar/calendarDbHelper';


const dark = Appearance.getColorScheme() === 'dark'
const styles = StyleSheet.create({
  svg: {
    width: 'auto',
  },
  leftAction: {
    flex: 1,
    backgroundColor: '#ff0000',
    justifyContent: 'center',
  },
  actionText: {
    color: 'white',
    fontSize: 16,
    backgroundColor: 'transparent',
    padding: 10,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeItem: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    height: 50,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  fabContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  safeArea: {
    alignItems: 'flex-end',
  },
  fab: {
    margin: 16,
    marginTop: 0,
  },
})

type RootNavigationStackParamList = {
  UserProgressActiveComponents: {
    isUpdate?: string,
  },
  UserAddStrength: undefined,
}

type UserAddStrengthNavigationProp = StackNavigationProp<
  RootNavigationStackParamList,
  'UserAddStrength'
>

type RootRouteStackParamList = {
  UserAddStrength: {
    type: string,
  },
}

type UserAddStrengthRouteProp = RouteProp<
  RootRouteStackParamList,
  'UserAddStrength'
>

type Props = {
  sub: string,
  route: UserAddStrengthRouteProp,
  getRealmApp: () => Realm,
  client: ApolloClient<NormalizedCacheObject>
}


type item = 'kg' | 'lbs'

type getExerciseType = (value: ExerciseType) => item

const getExerciseType: getExerciseType = (value) => {
  switch(value) {
    case ExerciseType.KILOS:
      return 'kg'
    case ExerciseType.POUNDS:
      return 'lbs'
    default:
      return 'lbs'
  }
}

const rescapeUnsafe = (safe: string) => safe
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#039;/g, '\'')
  .replace(/-/gi, ' ');

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

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

type swipeProps = {
  removeRepFromArray: (index: number) => void,
  weightArray: string[],
  index: number,
  updateWeightInArray: (index: number, text: number) => void,
  selectedStat: string,
  item: string,
  repArray: string[],
  updateRepInArray: (index: number, count: number) => void,
}

function SwipeComponent({
  removeRepFromArray,
  weightArray,
  index,
  updateWeightInArray,
  selectedStat,
  item,
  repArray,
  updateRepInArray,
}: swipeProps) {

  const swipeableRowEl = useRef<Swipeable>()

  const closeRow = () => swipeableRowEl?.current?.close()

  const renderRepRightActions = (progress: Animated.AnimatedInterpolation, index: number) => {
    const trans = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [64, 0],
    });
    return (
      <RectButton style={styles.leftAction} onPress={() => { closeRow(); removeRepFromArray(index); }}>
        <Animated.Text
          style={[
            styles.actionText,
            {
              transform: [{ translateX: trans }],
            },
          ]}>
          Delete
        </Animated.Text>
      </RectButton>
    );
  };

  return (
    <Box flexDirection="row" justifyContent="space-between" style={{ width: '100%' }}>
      <Box />
      <Swipeable
        ref={swipeableRowEl}
        friction={2}
        enableTrackpadTwoFingerGesture
        leftThreshold={30}
        rightThreshold={40}
        renderRightActions={(...args) => renderRepRightActions(args[0], index)}
        childrenContainerStyle={styles.swipeItem}
        containerStyle={{ width: '80%' }}
        >
          <Box flexDirection="row" flex={1}>
            <TextField
              type="numeric"
              placeholder="30"
              onChangeText={(text: string) => updateWeightInArray(index, text?.length > 0 ? parseFloat(text.replace(/[^0-9.]/g, '')) : 0)}
              value={weightArray[index]}
              style={{ paddingTop: 2.2, marginHorizontal: 5 }}
              hideUnderline
            />
            <Text variant="body">
              {selectedStat}
            </Text>
          </Box>
          <Box flexDirection="row" flex={0.5} style={{
            height: 40,
            paddingHorizontal: 20,
          }}>
            <Text variant="body" style={{ marginHorizontal: 5 }}>
              {item}
            </Text>
            <Text variant="body">
              reps
            </Text>
          </Box>
          <Stepper
            min={1}
            max={30}
            onValueChange={count => updateRepInArray(index, count)}
            initialValue={parseInt(item, 10)}
          />
      </Swipeable>
    </Box>
  )
}

function UserAddStrength(props: Props) {

  const [repArray, setRepArray] = useState<string[]>(['10'])
  const [weightArray, setWeightArray] = useState<string[]>(['50'])
  const [goal, setGoal] = useState<GoalExercise | null>(null);

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  const [userId, setUserId] = useState<string>()

  const [selectedStat, setSelectedStat] = useState<item>('lbs')
  const [isForm, setIsForm] = useState<boolean>(false)
  const [isMenu, setIsMenu] = useState<boolean>(false)

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
  const strengthDataIdEl = useRef<string>(null)


   const type = props?.route?.params?.type
   const sub = props?.sub
   const getRealmApp = props?.getRealmApp

  const realm = getRealmApp()
  const client = props?.client

  const navigation = useNavigation<UserAddStrengthNavigationProp>()

  // create streak if 3 or more days
  // get streak as well
  useEffect(() => {
    const getStreak = async (): Promise<null | undefined | Streak> => {
      try {
        if (!(userIdEl.current)) {
          return
        }

        if (!type) {
          return
        }

        const todayStreak = await DataStore.query(Streak, c => c
            .userIdGoal('eq', `${userIdEl?.current}#${PrimaryGoalType.STRENGTH}#${type}`)
            .lastSyncDate('beginsWith', dayjs().format('YYYY-MM-DD')))

        if (todayStreak?.length > 0) {
          // setStreak(todayStreak[0])
          streakEl.current = todayStreak[0]
          return todayStreak[0]
        }

        if (!todayStreak || !(todayStreak?.length > 0)) {
          const yesterdayStreak = await DataStore.query(Streak, c => c
              .userIdGoal('eq', `${userIdEl.current}#${PrimaryGoalType.STRENGTH}#${type}`)
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
              c => c.userIdGoal('eq', `${userIdEl.current}#${PrimaryGoalType.STRENGTH}#${type}`),
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
          primaryGoalType: PrimaryGoalType.STRENGTH,
          userIdGoal: `${userIdEl.current}#${PrimaryGoalType.STRENGTH}#${type}`,
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

        const dataPoints = await DataStore.query(StrengthData,
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

        if (userData && userData.length > 0) {

          const { id } = userData[0]

          setUserId(id)
          userIdEl.current = id
          // check if schedule available and adjust PointSystem accordingly
          const scheduleDatas = await DataStore.query(Schedule, c => c.userId('eq', id)
            .date('beginsWith', dayjs().format('YYYY'))
            .status('eq', Status.ACTIVE)
            .primaryGoalType('eq', PrimaryGoalType.STRENGTH))
          const event = await getEventWithId(client, scheduleDatas?.[0]?.eventId)
          if (scheduleDatas && scheduleDatas.length > 0
            && (event?.endDate
              && dayjs().isAfter(event?.endDate)
              || !(event?.endDate)
            )) {

              pointRewardEl.current = 2

          } else {

            pointRewardEl.current = 1

          }
        }
      } catch (e) {
        // 
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
    const getUserExerciseStat = async () => {
      try {
        const userExerciseStatDatas = await DataStore.query(UserExerciseStat, c => c.userId('eq', userIdEl.current)
        .primaryGoalType('eq', PrimaryGoalType.STRENGTH)
        .secondaryGoalType('eq', type))

        if (userExerciseStatDatas?.[0]?.id) {
          const userExerciseStatData = userExerciseStatDatas[0]

          // setUserExerciseStat(userExerciseStatData)
          userExerciseStatEl.current = userExerciseStatData

          const newSelectedStat = userExerciseStatEl?.current.statPreference === StatPreference.POUNDS ? 'lbs' : 'kg'

          setSelectedStat(newSelectedStat)
        }
      } catch (e) {
        
      }
    }
    if (userIdEl.current) {
      getUserExerciseStat()
    }
  }, [userId])

  // get Goal
  // and deactivatGoal
  useEffect(() => {
    const deactivateGoal = async (goal: GoalExercise) => {
      try {
        await DataStore.save(
          GoalExercise.copyOf(
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

        const goals = await DataStore.query(GoalExercise, c => c.userId('eq', userId1)
          .date('beginsWith', dayjs().format('YYYY'))
          .status('eq', Status.ACTIVE)
          .primaryGoalType('eq', PrimaryGoalType.STRENGTH)
          .secondaryGoalType('eq', type), {
            page: 0,
            limit: 1,
            sort: s => s.date(SortDirection.DESCENDING),
          })

        const goals1 = await DataStore.query(
          GoalExercise,
          c => c.userId('eq', userId1)
            .date('beginsWith', dayjs().subtract(1, 'y').format('YYYY'))
            .status('eq', Status.ACTIVE)
            .primaryGoalType('eq', PrimaryGoalType.STRENGTH)
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
    if (userIdEl?.current) {
      getExerciseGoal(userIdEl?.current);
    }
  }, [userId])

  // set default strength from db
  useEffect(() => {
    const getStrengthGoal = () => {
      if (goal?.goal as string) {
        const goalCopy = goal?.goal as string
        setWeightArray([goalCopy])
      }
    }
    getStrengthGoal()
  }, [goal?.id])

  // get already registered strengthData if any
  useEffect(() => {
    const getStrengthData = async () => {
      try {
         const strengthDatas = await DataStore.query(StrengthData, (c) => c.userId('eq', `${userIdEl?.current}#${type}`), {
           sort: s => s.date(SortDirection.DESCENDING),
           page: 0,
           limit: 1,
         })

        if (strengthDatas && strengthDatas[0] && strengthDatas[0].id) {
          const { date } = strengthDatas[0]

          if (dayjs(date).isSameOrAfter(dayjs().hour(0))) {
            const { id } = strengthDatas[0]
            strengthDataIdEl.current = id
          }
        }
      } catch (e) {
        
      }
    }
    if (userIdEl.current) {
      getStrengthData()
    }
  }, [userId])

  // get level or create it if does not exist
  useEffect(() => {
    // create level if does not exist
    const createLevel = async () => {
      try {
        if (!(userIdEl?.current)) {
          return
        }
        const newLevel = new Level({
          userId: userIdEl?.current,
          level: 1,
          primaryGoalType: PrimaryGoalType.STRENGTH,
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
        if (!(userIdEl?.current)) {
          return
        }

      const levels  = await DataStore.query(Level,
        c => c.userId('eq', userIdEl?.current)
        .primaryGoalType('eq', PrimaryGoalType.STRENGTH)
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
      if (!(userIdEl?.current)) {
        return
      }
      const schedules = await DataStore.query(Schedule,
        c => c
          .userIdGoal('eq', `${userIdEl?.current}#${PrimaryGoalType.STRENGTH}#${type}`)
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
            && dayjs().isAfter(event?.endDate)) {

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
          GoalExercise.copyOf(
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
            const dataPoints = await DataStore.query(StrengthData,
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
              primaryGoalType: PrimaryGoalType.STRENGTH,
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

      // const currentLevelSystem = levelSystemEl?.current?.find((i: LevelSystem) => i.level === levelEl.current?.level)

     // if (currentLevelSystem?.id) {
       if (weeks > WEEKSTONEXTLEVEL) {
         const newLevel = await DataStore.save(
           new Level({
             userId: userIdEl?.current,
             level: levelEl.current?.level + 1,
             attempts: 3,
             primaryGoalType: PrimaryGoalType.STRENGTH,
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

  // update userExerciseStatEl.current for each primaryGoalType
  const updateUserExerciseStats = async () => {
    try {
      if (userExerciseStatEl.current?.currentDate && userIdEl.current) {
          // const regValue = dayjs().format('YYYY-MM-DD')
          //
          // const regex = new RegExp(`^(${regValue})`, 'g')
          /** no data was added for today so create new item */
          if (dayjs(userExerciseStatEl.current.currentDate).format('YYYY-MM-DD') !== dayjs().format('YYYY-MM-DD')) {
          const newUserStat = await DataStore.save(
            UserExerciseStat.copyOf(userExerciseStatEl.current, updated => {
              // const newWeightValue = math.chain(userExerciseStatEl.current?.weightValue).add(parseFloat(strengthWeight)).done()

              // set currentdate as it is yesterday's date or not set
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
                const newRepsValue = math.chain(userExerciseStatEl.current?.repsValue).add((userExerciseStatEl.current.currentRepsValue || 0)).done()

                const numRepArray = repArray.map(i => parseFloat(i))

                const todaysReps = numRepArray.reduce((acc, current) => (acc + current))


                updated.currentRepsValue = todaysReps || 0
                updated.repsValue = newRepsValue
              }



              const maxWeight = Math.max(...(weightArray.map(i => parseFloat(i))))
              const minWeight = Math.min(...(weightArray.map(i => parseFloat(i))))

              if (typeof (userExerciseStatEl.current?.maxWeight) === 'number') {
                  if (typeof maxWeight === 'number') {
                    if ((userExerciseStatEl.current?.maxWeight) < maxWeight) {
                      updated.maxWeight = maxWeight
                      updated.maxWeightDate = userExerciseStatEl.current.currentDate || dayjs().format()

                    }
                  }

              } else if (typeof maxWeight === 'number') {
                updated.maxWeight = maxWeight
                updated.maxWeightDate = userExerciseStatEl.current.currentDate || dayjs().format()
              }

              if (typeof (userExerciseStatEl.current?.minWeight) === 'number') {
                if ((userExerciseStatEl.current?.minWeight) > (minWeight)) {
                  updated.minWeight = minWeight || updated.minWeight
                  updated.minWeightDate = userExerciseStatEl.current.currentDate || dayjs().format()
                }
              } else if (typeof minWeight === 'number') {
                updated.minWeight = minWeight || updated.minWeight
                updated.minWeightDate = userExerciseStatEl.current.currentDate || dayjs().format()
              }


              const numWeightArray = weightArray.map(i => parseFloat(i))

              const sumWeight = numWeightArray.reduce((acc, i) => (acc + i))

              if (!(typeof sumWeight === 'number')) {
                
                return
              }

              const avgWeight = math.chain(sumWeight).divide(weightArray.length).round().done()

              const newWeightValue = math.chain(userExerciseStatEl.current?.weightValue).add((userExerciseStatEl.current.currentWeightValue || 0)).done()


              updated.currentWeightValue = avgWeight || 0
              updated.weightValue = newWeightValue

              updated.currentDate = dayjs().format()


              const newDayCount = math.chain(userExerciseStatEl.current.dayCount).add(1).done()
              updated.dayCount = newDayCount

              if (previousStreakEl.current) {
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
          userExerciseStatEl.current = newUserStat
          } else {
              const original: StrengthData | undefined = await DataStore.query(StrengthData, strengthDataIdEl.current)

              if (original?.id) {

                const numWeightArray = weightArray.map(i => parseFloat(i))

                const sumWeight = numWeightArray.reduce((acc, i) => (acc + i))

                if (!(typeof sumWeight === 'number')) {
                  
                  return
                }

                const avgWeight = math.chain(sumWeight).divide(weightArray.length).round().done()

                const weightDifference = math.chain(original.weight).subtract(parseFloat(avgWeight)).done()

                const newUserStat = await DataStore.save(
                  UserExerciseStat.copyOf(userExerciseStatEl.current, updated => {

                    const maxWeight = Math.max(...(weightArray.map(i => parseFloat(i))))
                    const minWeight = Math.min(...(weightArray.map(i => parseFloat(i))))

                    if (typeof (userExerciseStatEl.current?.maxWeight) === 'number') {
                      if ((userExerciseStatEl.current?.maxWeight) < maxWeight) {
                        updated.maxWeight = maxWeight
                        updated.maxWeightDate = userExerciseStatEl.current.currentDate || dayjs().format()

                      }
                    } else {
                      updated.maxWeight = maxWeight
                      updated.maxWeightDate = userExerciseStatEl.current.currentDate || dayjs().format()
                    }

                    if (typeof (userExerciseStatEl.current?.minWeight) === 'number') {
                      if ((userExerciseStatEl.current?.minWeight) > (minWeight)) {
                        updated.minWeight = minWeight
                        updated.minWeightDate = userExerciseStatEl.current.currentDate || dayjs().format()
                      }
                    } else {
                      updated.minWeight = minWeight
                      updated.minWeightDate = userExerciseStatEl.current.currentDate || dayjs().format()
                    }

                    const newWeightValue = math.chain(updated.weightValue).subtract(weightDifference).done()

                    updated.currentWeightValue = newWeightValue

                    const numRepArray = repArray.map(i => parseFloat(i))

                    const todaysReps = numRepArray.reduce((acc, current) => (acc + current))

                    const repsDifference = math.chain(original.reps).subtract(todaysReps).done()
                    const newRepsValue = math.chain((userExerciseStatEl.current?.repsValue || 0)).subtract(repsDifference).done()
                    updated.currentRepsValue = newRepsValue
                  })
                )
                userExerciseStatEl.current = newUserStat
              }
            }
      } else if(!(userExerciseStatEl?.current?.currentDate)) {

        const numRepArray = repArray.map(i => parseFloat(i))

        const todaysReps = numRepArray.reduce((acc, current) => (acc + current))

        const numWeightArray = weightArray.map(i => parseFloat(i))

        const sumWeight = numWeightArray.reduce((acc, i) => (acc + i))

        if (!(typeof sumWeight === 'number')) {
          
        }

        const avgWeight = math.chain(sumWeight).divide(weightArray.length).round().done()

        const maxWeight = Math.max(...(weightArray.map(i => parseFloat(i))))
        const minWeight = Math.min(...(weightArray.map(i => parseFloat(i))))

        
        

        const newUserExerciseStat = new UserExerciseStat({
          primaryGoalType: PrimaryGoalType.STRENGTH,
          secondaryGoalType: type,
          userId: userIdEl.current,
          currentRepsValue: todaysReps || undefined,
          currentWeightValue: avgWeight || undefined,
          maxReps: todaysReps || undefined,
          minReps: todaysReps || undefined,
          maxRepsDate: todaysReps ? dayjs().format() : undefined,
          minRepsDate: todaysReps ? dayjs().format() : undefined,
          maxWeight: maxWeight || undefined,
          minWeight: minWeight || undefined,
          maxWeightDate: maxWeight ? dayjs().format() : undefined,
          minWeightDate: minWeight ? dayjs().format() : undefined,
          currentDate: dayjs().format(),
          dayCount: 1,
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
          if (dayjs(pointEl.current.currentDate).format('YYYY-MM-DD') !== dayjs().format('YYYY-MM-DD')) {
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
        
      }
    } catch (e) {
      
    }
  }

  const updateStatPreference = async () => {
    try {
      const dictionary = {
        'lbs': StatPreference.POUNDS,
        'kg': StatPreference.KILOS,
      }

      if (userExerciseStatEl?.current) {
        const updatedUserExerciseStat = await DataStore.save(
          UserExerciseStat.copyOf(userExerciseStatEl?.current, updated => {
            updated.statPreference = selectedStat === 'lbs' ? dictionary['lbs'] : dictionary['kg']
          })
        )

        
      }

    } catch (e) {
      
    }
  }

  const createStrengthData = async (index: number, repValue: string, strengthValue: string) => {
    try {

      if (userIdEl?.current) {
        const strengthData = new StrengthData({
          date: `${dayjs().format()}-${index}`,
          userId: userIdEl?.current,
          weight: parseFloat(strengthValue),
          weightUnit: selectedStat,
          reps: parseFloat(repValue),
          type,
          userIdType: `${userIdEl.current}#${type}`,
          ttl: dayjs().add(1, 'y').unix(),
        })
        return DataStore.save(
          strengthData
        )

      }
    } catch (e) {
      
    }
  }

  const createManyStrengthData = async () => {
    try {

      const strengthValuePromises = weightArray.map(async (weight, index) => {
        try {
          return createStrengthData(index, repArray[index], weight)
        } catch (e) {
          
        }
      })

      const strengthArray = await Promise.all(strengthValuePromises)

      await updateUserExerciseStats()

      await updateStatPreference()

      await updateUserPoint()

      await updateStreak()

      await updateLevel()

      Toast.show({
            type: 'success',
            text1: `Strength: ${rescapeUnsafe(type)} recorded`,
            text2: `You are awarded ${pointRewardEl.current} points! 🙌`
         });
      if (strengthArray[1]?.id) {
        strengthDataIdEl.current = strengthArray[1]?.id
      }

      navigation.navigate('UserProgressActiveComponents', { isUpdate: uuid() })
    } catch (e) {
      
      Toast.show({
            type: 'error',
            text1: 'Oops...',
            text2: `Something went wrong 🤭`
         });
    }
  }

  const addWeightToArray = () => {
    const newWeightArray = weightArray.concat([weightArray[weightArray.length - 1]])

    setWeightArray(newWeightArray)
  }


  const addRepToArray = () => {
    addWeightToArray()
    const newRepArray = repArray.concat(['10'])
    setRepArray(newRepArray)
  }

  const removeWeightFromArray = (index: number) => {
    const newWeightArray = [
      ...weightArray.slice(0, index),
      ...weightArray.slice(index + 1)
    ]

    setWeightArray(newWeightArray)
  }

  const removeRepFromArray = (index: number) => {
    const newRepArray = [
      ...repArray.slice(0, index),
      ...repArray.slice(index + 1)
    ]

    setRepArray(newRepArray)

    removeWeightFromArray(index)
  }

  const updateRepInArray = (index: number, value: number) => {
    const newRepArray = [
      ...repArray.slice(0, index),
      `${value}`,
      ...repArray.slice(index + 1)
    ]

    setRepArray(newRepArray)
  }

  const updateWeightInArray = (index: number, value: number) => {

    const newWeightArray = [
      ...weightArray.slice(0, index),
      `${value}`,
      ...weightArray.slice(index + 1)
    ]

    setWeightArray(newWeightArray)
  }


  type renderElement = {
    item: string,
    index: number,
  }

  const renderItem = ({ item, index }: renderElement) => (
    <SwipeComponent
      removeRepFromArray={removeRepFromArray}
      weightArray={weightArray}
      index={index}
      updateWeightInArray={updateWeightInArray}
      selectedStat={selectedStat}
      item={item}
      repArray={repArray}
      updateRepInArray={updateRepInArray}
    />
  )

  const toggleOverlay = () => setIsForm(!isForm)

  const showMenu = () => setIsMenu(true)

  const hideMenu = () => setIsMenu(false)

  const showForm = () => {
    toggleOverlay()
    hideMenu()
  }

  const height = useHeaderHeight()

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        keyboardVerticalOffset={height + 64}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <Box style={{ width: '100%'}} mt={{ phone: 's', tablet: 'm' }} flexDirection="row" justifyContent="flex-end">
          <Menu
            visible={isMenu}
            onDismiss={hideMenu}
            anchor={(
              <Pressable hitSlop={40} onPress={showMenu}>
                <Text variant="header" pr={{ phone: 's', tablet: 'm' }} mr={{ phone: 'm', tablet: 'l' }}>{"\u20DB"}</Text>
              </Pressable>
            )}
           >
               <Menu.Item title="Edit Unit Metric" onPress={showForm} />
          </Menu>
        </Box>
        <Box style={{ width: '100%'}} flex={1} justifyContent="center" alignItems="center" my={{ phone: 's', tablet: 'm' }}>
          <Box flex={1} m={{ phone: 's', tablet: 'm' }} style={{ width: '100%'}} flexDirection="row" justifyContent="center" alignItems="center">
            <Box style={{ width: '100%' }}>
            {
              repArray?.[0]
              ? (
                <FlatList
                  data={repArray}
                  renderItem={renderItem}
                  keyExtractor={(item, index) => `${item}-${index}`}
                />
              ) : null}
            </Box>
          </Box>
          <Box flex={0.75} style={{ width: '100%'}} justifyContent="center" alignItems="center">
            <UserExerciseTimer
              sub={sub}
              numberOfBreakEpisodes={repArray.length}
              getRealmApp={getRealmApp}
            />
          </Box>
          <Box style={{ width: '100%'}} flex={0.5} justifyContent="center" alignItems="center">
            <Button onPress={createManyStrengthData}>
              Save
            </Button>
          </Box>
          <Box style={styles.fabContainer} pointerEvents="box-none">
            <SafeAreaView style={styles.safeArea} pointerEvents="box-none">
              <FAB
                icon={{
                  name: 'add',
                  type: 'ionicon',
                  color: '#fff',
                 }}
                onPress={addRepToArray}
                style={styles.fab}
              />
            </SafeAreaView>
          </Box>
        </Box>
        <Overlay overlayStyle={{ backgroundColor: dark ? palette.black : palette.white }} isVisible={isForm} onBackdropPress={toggleOverlay}>
          <Picker
            selectedValue={selectedStat}
            onValueChange={(newSelectedStat: item) => setSelectedStat(newSelectedStat)}
            style={{ height: 200, width: 300, color: dark ? palette.white : palette.textBlack }}
          >
              <Picker.Item color={dark ? palette.white : palette.textBlack} key="kg" value="kg" label="kg" />
              <Picker.Item color={dark ? palette.white : palette.textBlack} key="lbs" value="lbs" label="lbs" />
          </Picker>
        </Overlay>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  )


}

export default UserAddStrength
