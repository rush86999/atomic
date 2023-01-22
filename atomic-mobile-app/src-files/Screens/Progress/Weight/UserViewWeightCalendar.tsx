import React, { useState, useEffect, useRef } from 'react'
import { DataStore, SortDirection} from '@aws-amplify/datastore'
import { dayjs } from '@app/date-utils'
import {Calendar} from 'react-native-calendars'
import {
  WeightData, User,
  PrimaryGoalType,
  Streak,
} from '@models'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import _ from 'lodash'
import { palette } from '@theme/theme'


import {
  UserProfile as UserProfileRealm,
} from '@realm/UserProfile'



type Props = {
  sub: string,
  getRealmApp: () => Realm,
}

const getDays = (month: string) => {
  switch(month) {
    case '01':
      return '31'
    case '02':
      if (dayjs().month(1).isLeapYear()) {
        return '29'
      }
      return '28'
    case '03':
      return '31'
    case '04':
      return '30'
    case '05':
      return '31'
    case '06':
      return '30'
    case '07':
      return '31'
    case '08':
      return '31'
    case '09':
      return '30'
    case '10':
      return '31'
    case '11':
      return '30'
    case '12':
      return '31'
  }
}

type streakDates = {
  startDate: string,
  endDate: string,
}


function UserViewWeightCalendar(props: Props) {
  const [userId, setUserId] = useState<string | null>(null)
  const [currentDataView, setCurrentDataView] = useState()
  const [month, setMonth] = useState<number>(0)

  const userIdEl = useRef<string>(null)
  const avatarEl = useRef<string>('')
  const usernameEl = useRef<string>('')
  const profileIdEl = useRef<string>('')

  const {
    sub,
    getRealmApp,
   } = props

  const realm = getRealmApp()

  const createObject = (dates: string[]) => {
    const newObj: any = {}
    for (const date of dates) {
        newObj[date] = { marked: true, dotColor: palette.purplePrimary }
    }
    return newObj
  }

  const createObjectWithStreaks = (dates: string[], streakDates: streakDates[]) => {
    const newObj: any = {}
    for (const date of dates) {
        let isBetween = false

        if (streakDates?.length > 0) {
          streakDates.forEach(streakDate => {
            if (dayjs(date).isBetween(
              dayjs(streakDate.startDate),
              dayjs(streakDate.endDate),
              'd',
              '[]')
          ) {
            isBetween = true

            if (date === streakDate.startDate) {

              newObj[date] = {
                startingDay: true,
                marked: true,
                dotColor: palette.white,
                textColor: palette.white,
                color: palette.purpleLight,
               }

            } else if (date === streakDate.endDate) {
              newObj[date] = {
                endingDay: true,
                marked: true,
                dotColor: palette.white,
                textColor: palette.white,
                color: palette.purpleLight,
               }
            } else {
              newObj[date] = {
                marked: true,
                dotColor: palette.white,
                textColor: palette.white,
                color: palette.purpleLight,
               }
            }
          }
          })
        }

        if (!isBetween) {
          newObj[date] = { marked: true, dotColor: palette.purplePrimary }
        }
    }
    return newObj
  }


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
    const getData = async (userId1: string) => {
      try {

        const days = getDays(dayjs().format('MM'))

        const numberOfDays = parseInt(days, 10)

        const dates: string[] = []

        for (let i = 0; i < numberOfDays; i++) {
          if (i < 10) {
            dates.push(`0${i}`)
          } else {
            dates.push(`${i}`)
          }
        }

        const dataFetched = await Promise.all(dates.map(async (date) => {
          try {
            return DataStore.query(
              WeightData,
              c => c.userId('eq', `${userId1}`)
                .date('beginsWith', `${dayjs().format('YYYY-MM')}-${date}`),
              {
                sort: s => s.date(SortDirection.DESCENDING),
                limit: 1,
              })
          } catch(e) {
            
          }
        }))

        let newDatas: WeightData[] = []

        for (let i = 0; i < numberOfDays; i++) {
          if (!(dataFetched?.[i]?.[0])) {
            newDatas.push(null)
          } else {
            newDatas = newDatas.concat(dataFetched[i])
          }
        }

        newDatas = newDatas.filter(i => !!i)

        newDatas = _.reverse(newDatas)

        

        const streakDataFetched = await Promise.all(dates.map(async (date) => {
          try {
            return DataStore.query(
              Streak,
              c => c.userIdGoal('eq', `${userId1}#${PrimaryGoalType.WEIGHT}#null`)
                .startDate('beginsWith', `${dayjs().format('YYYY-MM')}-${date}`),
              {
                limit: 1,
              })
          } catch(e) {
            
          }
        }))


        let newStreakDatas: Streak[] = []

        for (let i = 0; i < numberOfDays; i++) {
          if (!(streakDataFetched?.[i]?.[0])) {
            newStreakDatas.push(null)
          } else {
            newStreakDatas = newStreakDatas.concat(streakDataFetched[i])
          }
        }

        newStreakDatas = newStreakDatas.filter(i => !!i)
        newStreakDatas = _.reverse(newStreakDatas)


        if (newStreakDatas?.[0]?.id) {
          if (newDatas?.[0]?.id) {
            return setCurrentDataView(
              createObjectWithStreaks(
              newDatas.map(i => dayjs(i.date).format('YYYY-MM-DD')),
              newStreakDatas.map(i => ({
                startDate: dayjs(i.startDate).format('YYYY-MM-DD'),
                endDate: dayjs(i.lastSyncDate).format('YYYY-MM-DD'),
              }))
            )
          )
          }

        } else if (!(newStreakDatas?.[0]?.id) && newDatas?.[0]?.id) {
          setCurrentDataView(createObject(newDatas.map(i => dayjs(i.date).format('YYYY-MM-DD'))))
        }


      } catch(e) {
        
      }
    }
    if (userIdEl?.current) {
      getData(userIdEl?.current)
    }

  }, [userId])

  const onPressArrowLeft = async (subtractMonth: () => void) => {
    try {
      const days = getDays(dayjs().subtract(month + 1, 'M').format('MM'))

      

      const numberOfDays = parseInt(days, 10)

      const dates: string[] = []

      for (var i = 0; i < numberOfDays; i++) {
        if (i < 10) {
          dates.push(`0${i}`)
        } else {
          dates.push(`${i}`)
        }
      }

      const dataFetched = await Promise.all(dates.map(async (date) => {
        try {
          return DataStore.query(
            WeightData,
            c => c.userId('eq', `${userIdEl?.current}`)
              .date('beginsWith', `${dayjs().subtract(month + 1, 'M').format('YYYY-MM')}-${date}`),
            {
              sort: s => s.date(SortDirection.DESCENDING),
              limit: 1,
            })
        } catch(e) {
          
        }
      }))

      let newDatas: WeightData[] = []

      for(let i = 0; i < numberOfDays; i++) {
        if (!(dataFetched?.[i]?.[0])) {
          newDatas.push(null)
        } else {
          newDatas = newDatas.concat(dataFetched[i])
        }
      }

      newDatas = newDatas.filter(i => !!i)
      newDatas = _.reverse(newDatas)

      

      const streakDataFetched = await Promise.all(dates.map(async (date) => {
        try {
          return DataStore.query(
            Streak,
            c => c.userIdGoal('eq', `${userIdEl?.current}#${PrimaryGoalType.WEIGHT}#null`)
              .startDate('beginsWith', `${dayjs().subtract(month + 1, 'M').format('YYYY-MM')}-${date}`),
            {
              limit: 1,
            })
        } catch(e) {
          
        }
      }))

      let newStreakDatas: Streak[] = []

      for (let i = 0; i < numberOfDays; i++) {
        if (!(streakDataFetched?.[i]?.[0])) {
          newStreakDatas.push(null)
        } else {
          newStreakDatas = newStreakDatas.concat(streakDataFetched[i])
        }
      }

      newStreakDatas = newStreakDatas.filter(i => !!i)
      newStreakDatas = _.reverse(newStreakDatas)

      if (newStreakDatas?.[0]?.id) {
        if (newDatas?.[0]?.id) {
          setCurrentDataView(
            createObjectWithStreaks(
            newDatas.map(i => dayjs(i.date).format('YYYY-MM-DD')),
            newStreakDatas.map(i => ({
              startDate: dayjs(i.startDate).format('YYYY-MM-DD'),
              endDate: dayjs(i.lastSyncDate).format('YYYY-MM-DD'),
            }))
            )
          )

          subtractMonth()
          return setMonth(month + 1)
        }
        subtractMonth()
        setMonth(month + 1)
      } else if (!(newStreakDatas?.[0]?.id) && newDatas?.[0]?.id) {
        setCurrentDataView(createObject(newDatas.map(i => dayjs(i.date).format('YYYY-MM-DD'))))
        subtractMonth()
        setMonth(month + 1)
      } else {
        setMonth(month + 1)
        subtractMonth()
      }
    } catch(e) {
      
    }
  }

  const onPressArrowRight = async (addMonth: () => void) => {
    try {
      const days = getDays(dayjs().subtract(month - 1, 'M').format('MM'))

      

      const numberOfDays = parseInt(days, 10)

      const dates: string[] = []

      for (var i = 0; i < numberOfDays; i++) {
        if (i < 10) {
           dates.push(`0${i}`)
        } else {
          dates.push(`${i}`)
        }
      }

      const dataFetched = await Promise.all(dates.map(async (date) => {
        try {
          return DataStore.query(
            WeightData,
            c => c.userId('eq', `${userIdEl?.current}`)
              .date('beginsWith', `${dayjs().subtract(month - 1, 'M').format('YYYY-MM')}-${date}`),
            {
              sort: s => s.date(SortDirection.DESCENDING),
              limit: 1,
            })
        } catch(e) {
          
        }
      }))

      let newDatas: WeightData[] = []

      for (let i = 0; i < numberOfDays; i++) {
        if (!(dataFetched?.[i]?.[0])) {
          newDatas.push(null)
        } else {
          newDatas = newDatas.concat(dataFetched[i])
        }
      }

      newDatas = newDatas.filter(i => !!i)

      newDatas = _.reverse(newDatas)

      

      const streakDataFetched = await Promise.all(dates.map(async (date) => {
        try {
          return DataStore.query(
            Streak,
            c => c.userIdGoal('eq', `${userIdEl?.current}#${PrimaryGoalType.WEIGHT}#null`)
              .startDate('beginsWith', `${dayjs().subtract(month - 1, 'M').format('YYYY-MM')}-${date}`),
            {
              limit: 1,
            })
        } catch(e) {
          
        }
      }))

      let newStreakDatas: Streak[] = []

      for(let i = 0; i < numberOfDays; i++) {
        if (!(streakDataFetched?.[i]?.[0])) {
          newStreakDatas.push(null)
        } else {
          newStreakDatas = newStreakDatas.concat(streakDataFetched[i])
        }
      }

      newStreakDatas = newStreakDatas.filter(i => !!i)
      newStreakDatas = _.reverse(newStreakDatas)

      if (newStreakDatas?.[0]?.id) {
        if (newDatas?.[0]?.id) {
          setCurrentDataView(
            createObjectWithStreaks(
            newDatas.map(i => dayjs(i.date).format('YYYY-MM-DD')),
            newStreakDatas.map(i => ({
              startDate: dayjs(i.startDate).format('YYYY-MM-DD'),
              endDate: dayjs(i.lastSyncDate).format('YYYY-MM-DD'),
            }))
            )
          )
          addMonth()
          return setMonth(month - 1)
        }
        addMonth()
        setMonth(month - 1)
      } else if (!(newStreakDatas?.[0]?.id) && newDatas?.length > 0) {
        setCurrentDataView(createObject(newDatas.map(i => dayjs(i.date).format('YYYY-MM-DD'))))
        setMonth(month - 1)
        addMonth()
      } else {
        setMonth(month - 1)
        addMonth()
      }
    } catch(e) {
      
    }
  }

  return (
    <Box flex={1} justifyContent="center" alignItems="center">
      <Box my={{ phone: 'm', tablet: 'l' }}>
        <Text my={{ phone: 'm', tablet: 'l' }} variant="header">
          Weight Calendar
        </Text>
        <Calendar
          onPressArrowLeft={onPressArrowLeft}
          onPressArrowRight={onPressArrowRight}
          markedDates={currentDataView}
          theme={{
            arrowColor: palette.purplePrimary,
            indicatorColor: palette.purplePrimary,
            todayTextColor: palette.purplePrimary,
            monthTextColor: palette.purplePrimary,
            textSectionTitleColor: palette.purplePrimary,
          }}
        />
      </Box>
    </Box>
  )
}

export default UserViewWeightCalendar
