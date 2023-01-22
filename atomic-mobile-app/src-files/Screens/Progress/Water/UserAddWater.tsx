import React, { useState, useEffect, useRef } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native'
import { DataStore, SortDirection} from '@aws-amplify/datastore'
import { dayjs } from '@app/date-utils'
import {
  WaterData, Goal, User, PointSystem, Action,
  Status, PrimaryGoalType, Point, UserStat, UserProfile,
  Schedule, Level, Streak, LevelSystem, Day,
} from '@models'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import Button from '@components/Button'
import LottieView from 'lottie-react-native';
import * as math from 'mathjs'
import Toast from 'react-native-toast-message';

import Water from '@assets/icons/water.svg'
import RegularCard from '@components/RegularCard'
import PrimaryCard from '@components/PrimaryCard'


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


function UserAddWaterServings(props: any) {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [count, setCount] = useState(2);
  const [eatenServings, setEatenServings] = useState<number[]>([1, 1, 1, 0, 0, 0]);
  const servingRefs: React.MutableRefObject<any>[] = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null),
  useRef(null)]

  const { sub } = props

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
  const waterDataIdEl = useRef<string>(null)
  const userStatEl = useRef<UserStat>()

  useEffect(() => {
    const getStreak = async (): Promise<null | undefined | Streak> => {
      try {
        if (!(userIdEl?.current)) {
          return null
        }

        const todayStreak = await DataStore.query(Streak, c => c
            .userIdGoal('eq', `${userIdEl?.current}#${PrimaryGoalType.WATER}#null`)
            .lastSyncDate('beginsWith', dayjs().format('YYYY-MM-DD')))

        if (todayStreak?.length > 0) {
          streakEl.current = todayStreak[0]
          return todayStreak[0]
        }

        if (!todayStreak || !(todayStreak?.length > 0)) {
          const yesterdayStreak = await DataStore.query(Streak, c => c
              .userIdGoal('eq', `${userIdEl?.current}#${PrimaryGoalType.WATER}#null`)
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
              c => c.userIdGoal('eq', `${userIdEl?.current}#${PrimaryGoalType.WATER}#null`),
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
          primaryGoalType: PrimaryGoalType.WATER,
          userIdGoal: `${userIdEl?.current}#${PrimaryGoalType.WATER}#null`,
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

        const dataPoints = await DataStore.query(WaterData,
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
            .primaryGoalType('eq', PrimaryGoalType.WATER))

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
        .primaryGoalType('eq', PrimaryGoalType.WATER))

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
    const getWaterGoal = async (userId1: string) => {
      try {

        const goals = await DataStore.query(Goal, c => c.userId('eq', userId1)
        .date('beginsWith', dayjs().format('YYYY'))
        .status('eq', Status.ACTIVE)
        .primaryGoalType('eq', PrimaryGoalType.WATER), {
          page: 0,
          limit: 1,
          sort: s => s.date(SortDirection.DESCENDING),
        })

        const goals1 = await DataStore.query(
          Goal,
          c => c.userId('eq', userId1)
            .date('beginsWith', dayjs().subtract(1, 'y').format('YYYY'))
            .status('eq', Status.ACTIVE)
            .primaryGoalType('eq', PrimaryGoalType.WATER),
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
      getWaterGoal(userIdEl?.current);
    }
  }, [userIdEl?.current])
  useEffect(() => {
    const updateCount = () => {

      if (goal?.goal as string) {
        const goalCopy = goal?.goal as string
        setCount(parseInt(math.chain(goalCopy).done(), 10))
      }
    }
    updateCount()
  }, [goal])



  useEffect(() => {
    const getWaterData = async (userId1: string) => {
      try {
         const waterDatas = await DataStore.query(WaterData, (c) => c.userId('eq', userId1), {
           sort: s => s.date(SortDirection.DESCENDING),
           page: 0,
           limit: 1,
         })

        if (waterDatas && waterDatas[0] && waterDatas[0].id) {
          const { date } = waterDatas[0]

          if (dayjs(date).isSameOrAfter(dayjs().subtract(1, 'd'))) {
            const { id } = waterDatas[0]
            waterDataIdEl.current = id
          }
        }
      } catch (e) {
      }
    }
    if (userIdEl?.current) {
      getWaterData(userIdEl?.current)
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
          primaryGoalType: PrimaryGoalType.WATER,
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
        .primaryGoalType('eq', PrimaryGoalType.WATER)
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
          .userIdGoal('eq', `${userIdEl?.current}#${PrimaryGoalType.WATER}#null`)
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
            const dataPoints = await DataStore.query(WaterData,
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
              primaryGoalType: PrimaryGoalType.WATER,
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
             primaryGoalType: PrimaryGoalType.WATER,
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


                updated.currentValue = count || 0

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
              const original: WaterData | undefined = await DataStore.query(WaterData, waterDataIdEl?.current)

              if (original as WaterData) {

                const originalCopy = original as WaterData
                const difference = math.chain(originalCopy.water).subtract(count).done()

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
          primaryGoalType: PrimaryGoalType.WATER,
          userId: userIdEl?.current,
          value: count,
          max: count,
          min: count,
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

  const createNewWaterData = async (): Promise<undefined | null> => {
    try {
      if (!count || !(userIdEl?.current)) {
        Toast.show({
              type: 'error',
              text1: `Missing info`,
              text2: `You are missing info`
           });

          return null;
      }
      if (waterDataIdEl?.current) {

        await updateUserStats()

        const original: WaterData | undefined = await DataStore.query(WaterData, waterDataIdEl?.current)

        if (original as WaterData) {

          const originalCopy = original as WaterData

          await DataStore.save(
            WaterData.copyOf(originalCopy, (updated) => {
              updated.water = count
            })
          )

          Toast.show({
                type: 'success',
                text1: 'Water recorded',
                text2: `You have recorded ${count} servings 🙌`
             });
          }
      } else if (userIdEl?.current && !waterDataIdEl?.current) {
        const waterData = new WaterData({
          date: dayjs().format(),
          userId: userIdEl?.current,
          water: count,
          ttl: dayjs().add(1, 'y').unix(),
        })
        await DataStore.save(
          waterData
        )

        await updateUserStats()

        await updateUserPoint()

        await updateStreak()

        await updateLevel()

        Toast.show({
              type: 'success',
              text1: 'Water recorded',
              text2: `You have recorded ${count} servings. You are awarded ${pointRewardEl?.current} points! 🙌`
           });
        waterDataIdEl.current = waterData.id
      }
    } catch (e) {
      Toast.show({
            type: 'error',
            text1: 'Oops...',
            text2: `Something went wrong 🤭`
         });
    }
  }

  const updateCount = async (index: number) => {

    const newEatenServings = eatenServings.map((_, idx) => {
      if (idx <= index) {
        return 1
      }
      return  0
    })

    newEatenServings.forEach((_, idx) => {
      if (idx < index) {
        servingRefs[idx]?.current?.play(89, 89)
      } else if (idx === index) {
        servingRefs[idx]?.current?.play(0, 89)
      } else {
        servingRefs[idx]?.current?.play(0, 0)
      }
    })

    setCount(index + 1)
    setEatenServings(newEatenServings)
  }

  return (
    <Box flex={1} justifyContent="center" alignItems="center">
      <Box my={{ phone: 's', tablet: 'm' }}>
        <PrimaryCard>
          {goal?.goal ? (
            <Text variant="primarySecondaryHeader">
              {`Your goal: ${goal?.goal} glasses of water`}
            </Text>
          ) : null}
          {count ? (
            <Text variant="primarySecondaryHeader">
            {`${count && math.chain(count).done()} glasses of water`}
            </Text>
          ) : null}
        </PrimaryCard>
        <Box style={{ width: 'auto' }}>
          <Water style={styles.svg} />
        </Box>
      </Box>
      <RegularCard>
        <Box flexDirection="row">
          {eatenServings.map(({}, index) => (
            <Box bg="buttonIconBackground">
              <TouchableOpacity onPress={() => updateCount(index)}>
                <LottieView
                  ref={servingRefs[index]}
                  source={require('@assets/icons/glassOfWater.json')}
                  loop={false}
                />
            </TouchableOpacity>
          </Box>
          ))}
        </Box>
        <Button onPress={createNewWaterData}>
          Save
        </Button>
      </RegularCard>
    </Box>
  )

}

export default UserAddWaterServings
