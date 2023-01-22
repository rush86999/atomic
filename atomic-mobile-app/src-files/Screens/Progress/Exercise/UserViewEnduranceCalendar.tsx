import React, { useState, useEffect, useRef } from 'react'
import {
  useColorScheme,
} from 'react-native'
import { DataStore, SortDirection} from '@aws-amplify/datastore'
import { dayjs, RNLocalize } from '@app/date-utils'
import isLeapYear from 'dayjs/plugin/isLeapYear'
import isBetween from 'dayjs/plugin/isBetween'

import {Calendar} from 'react-native-calendars'
import {Picker} from '@react-native-picker/picker'
import { RouteProp } from '@react-navigation/native'

import {
  EnduranceData, User,
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



type RootRouteStackParamList = {
  UserViewEnduranceCalendar: {
    type: string,
  },
}

type UserViewEnduranceCalendarRouteProp = RouteProp<
  RootRouteStackParamList,
  'UserViewEnduranceCalendar'
>

type pickerItem = 'Reps' | 'Minutes' | 'Distance'


type Props = {
  sub: string,
  route: UserViewEnduranceCalendarRouteProp,
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

function UserViewEnduranceCalendar(props: Props) {
  const [userId, setUserId] = useState<string | null>(null)
  const [currentDataView, setCurrentDataView] = useState()
  const [month, setMonth] = useState<number>(0)
  const [selectedDataType, setSelectedDataType] = useState<'Reps' | 'Minutes' | 'Distance'>('Minutes')
  const [selectedPickerItem, setSelectedPickerItem] = useState<pickerItem | null>(null)

  const userIdEl = useRef<string>(null)
  const avatarEl = useRef<string>('')
  const usernameEl = useRef<string>('')
  const profileIdEl = useRef<string>('')
  const dark = useColorScheme() === 'dark'
  
  const {
    sub,
    getRealmApp,
   } = props

   const type = props?.route?.params?.type

   const realm = getRealmApp()



  useEffect(() => {
    const getProfileId = async (userId: string) => {
      try {
        const userData = await DataStore.query(User, userId)

        if (userData && userData.profileId) {
          const profileIdData = userData.profileId

          if (profileIdData) {
            profileIdEl.current = profileIdData

            const profileDatas = realm.objects<UserProfileRealm>('UserProfile')
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
              EnduranceData,
              c => c.userIdType('eq', `${userId1}#${type}`)
                .date('beginsWith', `${dayjs().format('YYYY-MM')}-${date}`),
              {
                sort: s => s.date(SortDirection.DESCENDING),
                limit: 1,
              })
          } catch(e) {
            
          }
        }))

        let newDatas: EnduranceData[] = []

        switch(selectedDataType) {
          case 'Reps':
            for(let i = 0; i < numberOfDays; i++) {
              if (!(dataFetched?.[i]?.[0]?.reps)) {
                newDatas.push(null)
              } else {
                newDatas = newDatas.concat(dataFetched[i])
              }
            }
          case 'Minutes':
            for(let i = 0; i < numberOfDays; i++) {
              if (!(dataFetched?.[i]?.[0]?.minutes)) {
                newDatas.push(null)
              } else {
                newDatas = newDatas.concat(dataFetched[i])
              }
            }
          case 'Distance':
            for(let i = 0; i < numberOfDays; i++) {
              if (!(dataFetched?.[i]?.[0]?.distance)) {
                newDatas.push(null)
              } else {
                newDatas = newDatas.concat(dataFetched[i])
              }
            }
        }

        newDatas = newDatas.filter(i => !!i)

        newDatas = _.reverse(newDatas)

        const streakDataFetched = await Promise.all(newDatas.map(async (data) => {
          try {
            return DataStore.query(
              Streak,
              c => c.userIdGoal('eq', `${userId1}#${PrimaryGoalType.ENDURANCE}#${type}`)
                .startDate('beginsWith', `${dayjs(data.date).format('YYYY-MM-DD')}`),
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
          }

        } else if (!(newStreakDatas?.[0]?.id) && newDatas?.[0]?.id) {
          setCurrentDataView(createObject(newDatas.map(i => dayjs(i.date).format('YYYY-MM-DD'))))
        }

      } catch(e) {
        
      }
    }

    if (type && userIdEl?.current) {
      getData(userIdEl?.current)
    }

  }, [type, userId, selectedDataType])

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
            EnduranceData,
            c => c.userIdType('eq', `${userIdEl?.current}#${type}`)
              .date('beginsWith', `${dayjs().subtract(month + 1, 'M').format('YYYY-MM')}-${date}`),
            {
              sort: s => s.date(SortDirection.DESCENDING),
              limit: 1,
            })
        } catch(e) {
          
        }
      }))

      let newDatas: EnduranceData[] = []

      switch(selectedDataType) {
        case 'Reps':
          for(let i = 0; i < numberOfDays; i++) {
            if (!(dataFetched?.[i]?.[0]?.reps)) {
              newDatas.push(null)
            } else {
              newDatas = newDatas.concat(dataFetched[i])
            }
          }
        case 'Minutes':
          for(let i = 0; i < numberOfDays; i++) {
            if (!(dataFetched?.[i]?.[0]?.minutes)) {
              newDatas.push(null)
            } else {
              newDatas = newDatas.concat(dataFetched[i])
            }
          }
        case 'Distance':
          for(let i = 0; i < numberOfDays; i++) {
            if (!(dataFetched?.[i]?.[0]?.distance)) {
              newDatas.push(null)
            } else {
              newDatas = newDatas.concat(dataFetched[i])
            }
          }
      }

      newDatas = newDatas.filter(i => !!i)

      newDatas = _.reverse(newDatas)

      const streakDataFetched = await Promise.all(newDatas.map(async (data) => {
        try {
          return DataStore.query(
            Streak,
            c => c.userIdGoal('eq', `${userId}#${PrimaryGoalType.ENDURANCE}#${type}`)
              .startDate('beginsWith', `${dayjs(data.date).format('YYYY-MM-DD')}`),
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
            EnduranceData,
            c => c.userIdType('eq', `${userIdEl?.current}#${type}`)
              .date('beginsWith', `${dayjs().subtract(month - 1, 'M').format('YYYY-MM')}-${date}`),
            {
              sort: s => s.date(SortDirection.DESCENDING),
              limit: 1,
            })
        } catch(e) {
          
        }
      }))

      let newDatas: EnduranceData[] = []

      switch(selectedDataType) {
        case 'Reps':
          for(let i = 0; i < numberOfDays; i++) {
            if (!(dataFetched?.[i]?.[0]?.reps)) {
              newDatas.push(null)
            } else {
              newDatas = newDatas.concat(dataFetched[i])
            }
          }
        case 'Minutes':
          for(let i = 0; i < numberOfDays; i++) {
            if (!(dataFetched?.[i]?.[0]?.minutes)) {
              newDatas.push(null)
            } else {
              newDatas = newDatas.concat(dataFetched[i])
            }
          }
        case 'Distance':
          for(let i = 0; i < numberOfDays; i++) {
            if (!(dataFetched?.[i]?.[0]?.distance)) {
              newDatas.push(null)
            } else {
              newDatas = newDatas.concat(dataFetched[i])
            }
          }
      }

      newDatas = newDatas.filter(i => !!i)

      newDatas = _.reverse(newDatas)

      const streakDataFetched = await Promise.all(newDatas.map(async (data) => {
        try {
          return DataStore.query(
            Streak,
            c => c.userIdGoal('eq', `${userId}#${PrimaryGoalType.ENDURANCE}#${type}`)
              .startDate('beginsWith', `${dayjs(data.date).format('YYYY-MM-DD')}`),
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
        <Text variant="header">
          Endurance Calendar
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
        <Box style={{ width: '100%'}}>
          <Picker
            style={{ color: dark ? palette.white : palette.textBlack }}
            selectedValue={selectedPickerItem}
            onValueChange={(item: pickerItem) => { setSelectedDataType(item); setSelectedPickerItem(item); }}
          >
            <Picker.Item color={dark ? palette.white : palette.textBlack} key="Reps" value="Reps" label="Reps" />
            <Picker.Item color={dark ? palette.white : palette.textBlack} key="Minutes" value="Minutes" label="Minutes" />
            <Picker.Item color={dark ? palette.white : palette.textBlack} key="Distance" value="Distance" label="Distance" />
          </Picker>
        </Box>
      </Box>
    </Box>
  )
}

export default UserViewEnduranceCalendar
