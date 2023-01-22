import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native'
import { DataStore, SortDirection} from '@aws-amplify/datastore'
import { dayjs } from '@app/date-utils'
import {
  WaistData, Goal, User, PointSystem, Action,
  Status, PrimaryGoalType, Point, UserStat, UserProfile,
  Schedule, Level, Streak, LevelSystem, Day,
} from '@models'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import LottieView from 'lottie-react-native';
import * as math from 'mathjs'
import Toast from 'react-native-toast-message';
import { Input } from 'galio-framework';
import RegularCard from '@components/RegularCard'
import PrimaryCard from '@components/PrimaryCard'
import Button from '@components/Button'



const styles = StyleSheet.create({
  lottie: {
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

function UserAddWaist(props: any) {
  const [goal, setGoal] = useState<Goal | null>(null);
  const [waistInches, setWaistInches] = useState<string>('30')

  const { sub } = props;

  const waistRef: React.MutableRefObject<LottieView | null> = useRef(null)

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
  const waistDataIdEl = useRef<string>(null)
  const userStatEl = useRef<UserStat>()

  useEffect(() => {
    waistRef?.current?.play()
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
            .primaryGoalType('eq', PrimaryGoalType.WAIST))

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
        .primaryGoalType('eq', PrimaryGoalType.WAIST), {
          page: 0,
          limit: 1,
          sort: s => s.date(SortDirection.DESCENDING),
        })

        const goals1 = await DataStore.query(
          Goal,
          c => c.userId('eq', userId1)
            .date('beginsWith', dayjs().subtract(1, 'y').format('YYYY'))
            .status('eq', Status.ACTIVE)
            .primaryGoalType('eq', PrimaryGoalType.WAIST),
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
        .primaryGoalType('eq', PrimaryGoalType.WAIST))

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
    const updateCount = () => {
      if (goal?.goal as string) {
        const goalCopy = goal?.goal as string
        setWaistInches(goalCopy)
      }
    }
    updateCount()
  }, [goal])

  useEffect(() => {
    const getWaistData = async (userId1: string) => {
      try {
         const waistDatas = await DataStore.query(WaistData, (c) => c.userId('eq', userId1), {
           sort: s => s.date(SortDirection.DESCENDING),
           page: 0,
           limit: 1,
         })

        if (waistDatas && waistDatas[0] && waistDatas[0].id) {
          const { date } = waistDatas[0]

          if (dayjs(date).isSameOrAfter(dayjs().subtract(1, 'd'))) {
            const { id } = waistDatas[0]
            waistDataIdEl.current = id
          }
        }
      } catch (e) {
      }
    }
    if (userIdEl?.current) {
      getWaistData(userIdEl?.current)
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
          primaryGoalType: PrimaryGoalType.WAIST,
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
        .primaryGoalType('eq', PrimaryGoalType.WAIST)
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
          .userIdGoal('eq', `${userIdEl?.current}#${PrimaryGoalType.WAIST}#null`)
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
            const dataPoints = await DataStore.query(WaistData,
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
              primaryGoalType: PrimaryGoalType.WAIST,
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
             primaryGoalType: PrimaryGoalType.WAIST,
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

               updated.currentValue = parseFloat(waistInches) || 0

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
             const original: WaistData | undefined = await DataStore.query(WaistData, waistDataIdEl?.current)

             if (original as WaistData) {

               const originalCopy = original as WaistData
               const difference = math.chain(originalCopy.inches).subtract(parseFloat(waistInches)).done()

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
         primaryGoalType: PrimaryGoalType.WAIST,
         userId: userIdEl?.current,
         value: parseFloat(waistInches),
         max: parseFloat(waistInches),
         min: parseFloat(waistInches),
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

  const createNewWaistData = async (): Promise<undefined | null> => {
    try {
      if (!waistInches || !(userIdEl?.current)) {
        Toast.show({
              type: 'error',
              text1: `Missing info`,
              text2: `You are missing info`
           });

          return null;
      }
      if (waistDataIdEl?.current) {

        await updateUserStats()

        const original: WaistData | undefined = await DataStore.query(WaistData, waistDataIdEl?.current)

        if (original as WaistData) {

          const originalCopy = original as WaistData

          await DataStore.save(
            WaistData.copyOf(originalCopy, (updated) => {
              updated.inches = parseFloat(waistInches)
            })
          )

          Toast.show({
                type: 'success',
                text1: 'Waist recorded',
                text2: `You have recorded ${waistInches} inches 🙌`
             });
          }
      } else if (userIdEl?.current && !waistDataIdEl?.current) {
        const waistData = new WaistData({
          date: dayjs().format(),
          userId: userIdEl?.current,
          inches: parseFloat(waistInches),
          ttl: dayjs().add(1, 'y').unix(),
        })
        await DataStore.save(
          waistData
        )

        await updateUserStats()

        await updateUserPoint()

        await updateStreak()

        await updateLevel()

        Toast.show({
              type: 'success',
              text1: 'Waist recorded',
              text2: `You have recorded ${waistInches} inches. You are awarded ${pointRewardEl?.current} points! 🙌`
           });
        waistDataIdEl.current = waistData.id
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
              {`Your goal: ${goal?.goal} inches`}
            </Text>
          ) : null}
          <Text variant="primarySecondaryHeader">
            {waistInches && `${waistInches} inches`}
          </Text>
        </PrimaryCard>
        <Box style={styles.lottie}>
          <LottieView
            ref={waistRef}
            source={require('@assets/icons/waist.json')}
            loop={false}
          />
        </Box>
      </Box>
      <RegularCard>
        <Box flexDirection="row">
          <Input
            type="numeric"
            label="inches"
            onChangeText={(text: string) => setWaistInches(text.replace(/[^0-9.]/g, ''))}
            value={waistInches}
          />
        </Box>
        <Button onPress={createNewWaistData}>
          Save
        </Button>
      </RegularCard>
    </Box>
  )


}

export default UserAddWaist
