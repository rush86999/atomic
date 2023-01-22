import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native'
import { DataStore, SortDirection} from '@aws-amplify/datastore'
import { dayjs } from '@app/date-utils'
import Toast from 'react-native-toast-message';
import { TextField } from 'react-native-ui-lib';
import LottieView from 'lottie-react-native';
import {
  SleepData, Goal, User, PointSystem, Action,
  Status, PrimaryGoalType, Point, UserStat, UserProfile,
  Schedule, Level, Streak, LevelSystem, Day,
} from '@models'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import * as math from 'mathjs'
import RegularCard from '@components/RegularCard'
import PrimaryCard from '@components/PrimaryCard'
import Button from '@components/Button'


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

function UserAddSleep(props: any) {
  const [sleepDataId, setSleepDataId] = useState('')
  const [goal, setGoal] = useState<Goal | null>(null);
  const [sleepHours, setSleepHours] = useState<string>('7')
  const [sleepMinutes, setSleepMinutes] = useState<string>('30')

  const { sub } = props;

  const sleepRef: React.MutableRefObject<LottieView | null> = useRef(null)

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
  const sleepDataIdEl = useRef<string>(null)
  const userStatEl = useRef<UserStat>()

  useEffect(() => {
    const getStreak = async (): Promise<null | undefined | Streak> => {
      try {
        if (!(userIdEl?.current)) {
          return null
        }

        const todayStreak = await DataStore.query(Streak, c => c
            .userIdGoal('eq', `${userIdEl?.current}#${PrimaryGoalType.SLEEP}#null`)
            .lastSyncDate('beginsWith', dayjs().format('YYYY-MM-DD')))

        if (todayStreak?.length > 0) {
          streakEl.current = todayStreak[0]
          return todayStreak[0]
        }

        if (!todayStreak || !(todayStreak?.length > 0)) {
          const yesterdayStreak = await DataStore.query(Streak, c => c
              .userIdGoal('eq', `${userIdEl?.current}#${PrimaryGoalType.SLEEP}#null`)
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
              c => c.userIdGoal('eq', `${userIdEl?.current}#${PrimaryGoalType.SLEEP}#null`),
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
          primaryGoalType: PrimaryGoalType.SLEEP,
          userIdGoal: `${userIdEl?.current}#${PrimaryGoalType.SLEEP}#null`,
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
    (async (): Promise<undefined | null> => {
      try {
        if (!(userIdEl?.current)) {
          return null
        }

        const currentStreak = await getStreak()

        if (currentStreak?.id) {
          return null
        }

        const dataPoints = await DataStore.query(SleepData,
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
  }, [userIdEl?.current, streakEl.current])

  useEffect(() => {
    const getPointReward = async () => {
      try {
        const userData = await DataStore.query(User, c => c.sub('eq', sub), {
          page: 0,
          limit: 1,
        })

        if (userData && userData[0]) {
          const { id } = userData[0]
          userIdEl.current = id

          const scheduleDatas = await DataStore.query(Schedule, c => c.userId('eq', id)
            .date('beginsWith', dayjs().format('YYYY'))
            .status('eq', Status.ACTIVE)
            .primaryGoalType('eq', PrimaryGoalType.SLEEP))

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

                pointRewardEl.current = pointRewardDataCopy?.point || 0
              }
            }

          } else {
            const pointRewardDatas = await DataStore.query(PointSystem, c => c.action('eq', Action.RECORD))

            if (pointRewardDatas && pointRewardDatas.length > 0) {
              const pointRewardData = pointRewardDatas[0]

              if (pointRewardData as PointSystem) {
                const pointRewardDataCopy = pointRewardData as PointSystem

                pointRewardEl.current = pointRewardDataCopy?.point || 0
              }
            }
          }
        }
      } catch (e) {
      }
    }
    getPointReward()
  }, [])


  useEffect(() => {
    const getPointReward = async () => {
      try {
        const userData = await DataStore.query(User, c => c.sub('eq', sub), {
          page: 0,
          limit: 1,
        })

        if (userData && userData[0]) {
          const { id } = userData[0]
          userIdEl.current = id

          const scheduleDatas = await DataStore.query(Schedule, c => c.userId('eq', id)
            .date('beginsWith', dayjs().format('YYYY'))
            .status('eq', Status.ACTIVE)
            .primaryGoalType('eq', PrimaryGoalType.SLEEP))

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

                pointRewardEl.current = pointRewardDataCopy?.point || 0
              }
            }

          } else {
            const pointRewardDatas = await DataStore.query(PointSystem, c => c.action('eq', Action.RECORD))

            if (pointRewardDatas && pointRewardDatas.length > 0) {
              const pointRewardData = pointRewardDatas[0]

              if (pointRewardData as PointSystem) {
                const pointRewardDataCopy = pointRewardData as PointSystem

                pointRewardEl.current = pointRewardDataCopy?.point || 0
              }
            }
          }
        }
      } catch (e) {
      }
    }
    getPointReward()
  }, [])

  useEffect(() => {
    const getProfileId = async (userId1: string) => {
      try {
        const userData = await DataStore.query(User, userId1)

        if (userData && userData.profileId) {
          const profileIdData = userData.profileId

          if (profileIdData) {
            profileIdEl.current = profileIdData
          }
        }
      } catch (e) {
      }
    }
    if (userIdEl?.current) {
      getProfileId(userIdEl.current)
    }
  }, [userIdEl?.current])

  useEffect(() => {
    const getUserProfile = async () => {
      try {
        const getProfileData = await DataStore.query(UserProfile, profileIdEl?.current)
        if (getProfileData && getProfileData.pointId) {

          userProfileEl.current = getProfileData
        }

      } catch (e) {
      }
    }
    getUserProfile()
  }, [profileIdEl?.current])

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
  }, [userProfileEl?.current])

  useEffect(() => {
    const getUserStat = async (userId1: string) => {
      try {
        const userStatDatas = await DataStore.query(UserStat, c => c.userId('eq', userId1)
        .primaryGoalType('eq', PrimaryGoalType.SLEEP))

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
  }, [userIdEl?.current])

  useEffect(() => {
    sleepRef?.current?.play()
  }, [])

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
        .primaryGoalType('eq', PrimaryGoalType.SLEEP), {
          page: 0,
          limit: 1,
          sort: s => s.date(SortDirection.DESCENDING),
        })

        const goals1 = await DataStore.query(
          Goal,
          c => c.userId('eq', userId1)
            .date('beginsWith', dayjs().subtract(1, 'y').format('YYYY'))
            .status('eq', Status.ACTIVE)
            .primaryGoalType('eq', PrimaryGoalType.SLEEP),
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
  }, [userIdEl?.current])

  useEffect(() => {
    const updateCount = () => {
      if (goal?.goal as string) {
        const goalCopy = goal?.goal as string
        setSleepHours(goalCopy)
      }
    }
    updateCount()
  }, [goal])

  useEffect(() => {
    const getSleepData = async (userId1: string) => {
      try {
         const sleepDatas = await DataStore.query(SleepData, (c) => c.userId('eq', userId1), {
           sort: s => s.date(SortDirection.DESCENDING),
           page: 0,
           limit: 1,
         })

        if (sleepDatas?.[0]?.id) {
          const { date } = sleepDatas[0]

          if (dayjs(date).isSameOrAfter(dayjs().hour(0))) {
            const { id } = sleepDatas[0]
            sleepDataIdEl.current = id
          }
        }
      } catch (e) {
      }
    }
    if (userIdEl?.current) {
      getSleepData(userIdEl?.current)
    }
  }, [userIdEl?.current])

  useEffect(() => {
    const createLevel = async (): Promise<undefined | null> => {
      try {
        if (!(userIdEl?.current)) {
          return null
        }
        const newLevel = new Level({
          userId: userIdEl?.current,
          level: 1,
          primaryGoalType: PrimaryGoalType.SLEEP,
          secondaryGoalType: 'null',
          date: dayjs().format(),
        })

        await DataStore.save(newLevel)

        levelEl.current = newLevel
      } catch(e) {
      }
    }
    (async (): Promise<null | undefined> => {
      try {
        if (!(userIdEl?.current)) {
          return null
        }
      const levels  = await DataStore.query(Level,
        c => c.userId('eq', userIdEl?.current)
        .primaryGoalType('eq', PrimaryGoalType.SLEEP)
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
  }, [userIdEl?.current])

  useEffect(() => {
    (async () => {
      try {
        const systems = await DataStore.query(LevelSystem)
        if (systems?.length > 0) {
          levelSystemEl.current = systems
        }
      } catch(e) {
      }
    })()
  }, [])

  useEffect(() => {
    (async (): Promise<null | undefined | Schedule> => {
      if (!(userIdEl?.current)) {
        return null
      }
      const schedules = await DataStore.query(Schedule,
        c => c
          .userIdGoal('eq', `${userIdEl?.current}#${PrimaryGoalType.SLEEP}#null`)
          .status('eq', Status.ACTIVE),
        {
          sort: s => s.date(SortDirection.DESCENDING),
        })

      if (schedules?.length > 0) {
        const [oldSchedule] = schedules
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
        scheduleEl.current = oldSchedule
      }
    })()
  }, [userIdEl?.current])

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
    }
  }

  const updateLevel = async (): Promise<undefined | null> => {
    try {
      if (!scheduleEl?.current?.id) {
        return null
      }

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
            const dataPoints = await DataStore.query(SleepData,
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
              primaryGoalType: PrimaryGoalType.SLEEP,
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

      const currentLevelSystem = levelSystemEl.current?.find(i => i.level === levelEl.current?.level)

     if (currentLevelSystem?.id) {
       if (weeks > currentLevelSystem.scheduleWeekLength) {
         const newLevel = await DataStore.save(
           new Level({
             userId: userIdEl?.current,
             level: levelEl.current?.level + 1,
             attempts: 3,
             primaryGoalType: PrimaryGoalType.SLEEP,
             secondaryGoalType: 'null',
             date: dayjs().format(),
           })
         )

         await DataStore.delete(levelEl.current)

         levelEl.current = newLevel
       }
     }

    } catch(e) {
    }
  }

  const updateUserStats = async () => {
    try {
      if ( userStatEl?.current?.currentDate && userIdEl?.current) {
          if (dayjs(userStatEl?.current?.currentDate).format('YYYY-MM-DD') !== dayjs().format('YYYY-MM-DD')) {
            const newUserStat = await DataStore.save(
              UserStat.copyOf(userStatEl?.current, updated => {

                if ((userStatEl?.current?.max || 0) < (userStatEl?.current?.currentValue || 0)) {
                  updated.max = userStatEl?.current?.currentValue || 0
                  updated.maxDate = userStatEl?.current?.currentDate || dayjs().format()

                } else if ((userStatEl?.current?.min || 0) > (userStatEl?.current?.currentValue || 0)) {
                  updated.min = (userStatEl?.current?.currentValue || 0)
                  updated.minDate = userStatEl?.current?.currentDate || dayjs().format()
                }


                const newValue = math.chain(userStatEl?.current?.value).add((userStatEl?.current?.currentValue || 0)).done()

                updated.currentDate = dayjs().format()

                const currentHours = math.chain(parseFloat(sleepMinutes)).divide(60).add(parseFloat(sleepHours)).done()
                updated.currentValue = currentHours || 0

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
            userStatEl.current = newUserStat
          } else {
              const original: SleepData | undefined = await DataStore.query(SleepData, sleepDataIdEl?.current)

              if (original as SleepData) {

                const originalCopy = original as SleepData
                const totalHours = math.chain(parseFloat(sleepMinutes)).divide(60).add(parseFloat(sleepHours)).done()
                const difference = math.chain(originalCopy.hours).subtract(totalHours).done()

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
        const totalHours = math.chain(parseFloat(sleepMinutes)).divide(60).add(parseFloat(sleepHours)).done()
        const newUserStat = new UserStat({
          primaryGoalType: PrimaryGoalType.SLEEP,
          userId: userIdEl?.current,
          value: totalHours,
          max: totalHours,
          min: totalHours,
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
      if (pointEl?.current.currentDate) {
          if (dayjs(pointEl?.current.currentDate).format('YYYY-MM-DD') !== dayjs().format('YYYY-MM-DD')) {
            await DataStore.save(
              Point.copyOf(
                pointEl?.current, updated =>  {

                  if ((pointEl?.current?.max || 0) < (pointEl?.current.currentPoints || 0)) {
                    updated.max = pointEl?.current.currentPoints || 0
                    updated.maxDate = pointEl?.current.currentDate || dayjs().format()

                  } else if ((pointEl?.current?.min || 0) > (pointEl?.current.currentPoints || 0)) {
                    updated.min = pointEl?.current.currentPoints || 0
                    updated.minDate = pointEl?.current.currentDate || dayjs().format()
                  }

                  const newValue = math.chain(pointEl?.current.points).add(pointEl?.current?.currentPoints || 0).done()
                  updated.points = newValue

                  updated.currentDate = dayjs().format()

                  updated.currentPoints = pointRewardEl.current

                  updated.currentDate = dayjs().format()


                  const newDayCount = math.chain(pointEl?.current.dayCount).add(1).done()
                  updated.dayCount = newDayCount
                }
              )
            )

          }
      } else {
      }
    } catch (e) {
    }
  }

  const createNewSleepData = async (): Promise<undefined | null> => {
    try {
      if (!sleepHours || !(userIdEl?.current)) {
        Toast.show({
              type: 'error',
              text1: `Missing info`,
              text2: `You are missing info`
           });

          return null;
      }

      if (sleepDataId) {

        await updateUserStats()

        const original: SleepData | undefined = await DataStore.query(SleepData, sleepDataId)

        if (original as SleepData) {

          const originalCopy = original as SleepData

          const addHours = math.chain(parseFloat(sleepMinutes)).divide(60).done()

          await DataStore.save(
            SleepData.copyOf(originalCopy, (updated) => {
              updated.hours = math.chain(parseFloat(sleepHours)).add(addHours).done()
            })
          )

          Toast.show({
                type: 'success',
                text1: 'Sleep recorded',
                text2: `You have recorded ${sleepHours} hours 🙌`
             });
          }
      } else if (userIdEl?.current && !sleepDataId) {

        const addHours = math.chain(parseFloat(sleepMinutes)).divide(60).done()

        const sleepData = new SleepData({
          date: dayjs().format(),
          userId: userIdEl?.current,
          hours: math.chain(parseFloat(sleepHours)).add(addHours).done(),
          ttl: dayjs().add(1, 'y').unix(),
        })
        await DataStore.save(
          sleepData
        )

        await updateUserStats()

        await updateUserPoint()

        await updateStreak()

        await updateLevel()

        Toast.show({
              type: 'success',
              text1: 'Sleep recorded',
              text2: `You have recorded ${sleepHours} hours. You are awarded ${pointRewardEl?.current} points! 🙌`
           });
        setSleepDataId(sleepData.id)
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
    <Box flex={1} justifyContent="center" alignItems="center">
      <Box my={{ phone: 's', tablet: 'm' }}>
        <PrimaryCard>
          {goal?.goal ? (
            <Text variant="primarySecondaryHeader">
              {`Your goal: ${goal?.goal} hours`}
            </Text>
          ) : null}
          {sleepHours ? (
            <Text variant="primarySecondaryHeader">
              {`${sleepHours} hours`}
            </Text>
          ) : null}
          {sleepMinutes ? (
            <Text variant="primarySecondaryHeader">
              {`${sleepMinutes} minutes`}
            </Text>
          ) : null}
        </PrimaryCard>
        <Box style={{ width: 'auto' }}>
          <LottieView
            ref={sleepRef}
            source={require('@assets/icons/sleep.json')}
            loop
            style={styles.svg}
          />
        </Box>
      </Box>
      <RegularCard>
        <Box flexDirection="row">
          <TextField
            type="numeric"
            label="hours"
            onChangeText={(text: string) => setSleepHours(text.replace(/[^0-9.]/g, ''))}
            value={sleepHours}
          />
          <TextField
            type="numeric"
            label="minutes"
            onChangeText={(text: string) => setSleepMinutes(text.replace(/[^0-9.]/g, ''))}
            value={sleepMinutes}
          />
        </Box>
        <Button onPress={createNewSleepData}>
          Save
        </Button>
      </RegularCard>
    </Box>
  )
}

export default UserAddSleep
