import React, { useState, useEffect, useRef } from 'react'
import { DataStore, SortDirection} from '@aws-amplify/datastore'
import { dayjs } from '@app/date-utils'
import RNFS from 'react-native-fs'
import ViewShot from 'react-native-view-shot'
import { S3Client } from '@aws-sdk/client-s3'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import Toast from 'react-native-toast-message'

import Spinner from 'react-native-spinkit'
import { Buffer } from '@craftzdog/react-native-buffer'

import {Calendar} from 'react-native-calendars'
import { Bar } from 'react-native-progress'
import * as math from 'mathjs'

import {
  FruitData, Goal, User,
  Status, PrimaryGoalType,
  Streak,
  UserProfile,
} from '@models'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import Button from '@components/Button'
import {
  
  uploadPicture,
  getS3AndCredId,
  
  capture,
} from '@progress/Todo/UserTaskHelper'
import {
  Post as PostRealm,
} from '@realm/Post'

import { palette } from '@theme/theme'





type Props = {
  sub: string,
  
}

type RootStackParamList = {
  UserCreatePost: {
    post: PostRealm,
    userId: string,
    avatar: string,
    username: string,
    profileId: string,
  },
  UserViewFruitCalendar: undefined,
}

type UserViewFruitCalendarNavigationProp = StackNavigationProp<
  RootStackParamList,
  'UserViewFruitCalendar'
>

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

function UserViewFruitCalendar(props: Props) {
  const [dataset, setDataSet] = useState<FruitData[] | null>(null)
  
  const [goal, setGoal] = useState<Goal | null>(null)
  const [currentDataView, setCurrentDataView] = useState()
  const [month, setMonth] = useState<number>(0)
  const [fruitProgressBar, setFruitProgressBar] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)

  const userIdEl = useRef<string>(null)
  const avatarEl = useRef<string>('')
  const usernameEl = useRef<string>('')
  const profileIdEl = useRef<string>('')
  const credIdEl = useRef<string>('')
  const s3El = useRef<S3Client>(null)
  const viewShotEl = useRef<ViewShot>(null)
  const localImagePathEl = useRef<string>('')
  const activePostEl = useRef<PostRealm>(null)

  const navigation = useNavigation<UserViewFruitCalendarNavigationProp>()

  const { sub } = props

  const createObject = (dates: string[]) => {
    const newObj: any = {}
    for (const date of dates) {
        newObj[date] = { marked: true}
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
              streakDate.startDate,
              streakDate.endDate,
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
    return () => {
      
    }
  }, [])

  
  useEffect(() => {
    getS3AndCredId(s3El, credIdEl)
    
  }, []);

  /** get userprofile */
  
  useEffect(() => {
    const getProfileId = async (userId: string) => {
      try {
        const userData = await DataStore.query(User, userId)

        if (userData && userData.profileId) {
          const profileIdData = userData.profileId

          if (profileIdData) {
            
            profileIdEl.current = profileIdData
            const profileData = await DataStore.query(UserProfile, profileIdData)

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
  }, [userIdEl?.current])

  /** get userId */
  useEffect(() => {
    const getUserId = async () => {
      try {
        const userData = await DataStore.query(User, c => c.sub('eq', sub), {
          page: 0,
          limit: 1,
        })

        if (userData && userData.length > 0) {
          const { id } = userData[0]
          
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
    const getFruitGoal = async (userId1: string) => {
      try {

        const goals = await DataStore.query(Goal, c => c.userId('eq', userId1)
        .date('beginsWith', dayjs().format('YYYY'))
        .status('eq', Status.ACTIVE)
        .primaryGoalType('eq', PrimaryGoalType.FRUIT), {
          page: 0,
          limit: 1,
          sort: s => s.date(SortDirection.DESCENDING),
        })

        const goals1 = await DataStore.query(
          Goal,
          c => c.userId('eq', userId1)
            .date('beginsWith', dayjs().subtract(1, 'y').format('YYYY'))
            .status('eq', Status.ACTIVE)
            .primaryGoalType('eq', PrimaryGoalType.FRUIT),
            {
              page: 0,
              limit: 1,
              sort: s => s.date(SortDirection.DESCENDING),
            },
          )

        if (goals && goals.length > 0) {
          setGoal(goals[0]);
        } else if (goals1 && goals1.length > 0) {
          setGoal(goals1[0]);
        }
      } catch (e) {
        
      }
    }
    if (userIdEl?.current) {
      getFruitGoal(userIdEl?.current);
    }
  }, [userIdEl?.current])

  
  useEffect(() => {
    const updateFruitProgressBar = () => {
      const currentGoal = goal?.goal as string
      const newFruitProgressBar: number = (((dataset as FruitData[])[(dataset as FruitData[]).length - 1]['servings'] as number) > parseFloat(currentGoal))
        ? 1
        : (math.chain(((dataset as FruitData[])[(dataset as FruitData[]).length - 1]['servings'] as number)).divide(parseFloat(currentGoal)).done())

      setFruitProgressBar(newFruitProgressBar)
    }
    if (dataset && dataset.length > 0 && goal && goal.goal) {
      updateFruitProgressBar()
    }
  }, [((dataset?.length > 0 && dataset[dataset?.length - 1].servings) || 0), goal?.goal])

  /** get data */
  useEffect(() => {
    const getData = async (userId1: string) => {
      try {

        
        const days = getDays(dayjs().format('MM'))

        const numberOfDays = parseInt(days, 10)

        let datas: FruitData[] = []
        let streakDatas: Streak[] = []

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
              FruitData,
              c => c.userId('eq', `${userId1}`)
                .date('beginsWith', `${dayjs().format('YYYY-MM')}-${date}`),
              {
                sort: s => s.date(SortDirection.DESCENDING),
                limit: 1,
              })
          } catch(e) {
            
          }
        }))

        const streakDataFetched = await Promise.all(dates.map(async (date) => {
          try {
            return DataStore.query(
              Streak,
              c => c.userIdGoal('eq', `${userId1}#${PrimaryGoalType.FRUIT}#null`)
                .startDate('beginsWith', `${dayjs().format('YYYY-MM')}-${date}`),
              {
                limit: 1,
              })
          } catch(e) {
            
          }
        }))

        dataFetched.forEach(i => datas.concat(i.filter(i => !!i)))

        streakDataFetched.forEach(i => streakDatas.concat(i.filter(i => !!i)))

        if (streakDatas?.length > 0) {
          if (datas?.length > 0) {
            setCurrentDataView(
              createObjectWithStreaks(
              datas.map(i => dayjs(i.date).format('YYYY-MM-DD')),
              streakDatas.map(i => ({
                startDate: dayjs(i.startDate).format('YYYY-MM-DD'),
                endDate: dayjs(i.lastSyncDate).format('YYYY-MM-DD'),
              }))
            )
          )
            return setDataSet(datas)
          }

        } else if (!(streakDatas?.length > 0) && datas?.length > 0) {
          setCurrentDataView(createObject(datas.map(i => dayjs(i.date).format('YYYY-MM-DD'))))
          setDataSet(datas)
        }

        
        
        
        

      } catch(e) {
        
      }
    }

    if (userIdEl?.current) {
      getData(userIdEl?.current)
    }

  }, [userIdEl?.current])

  const onPressArrowLeft = async (subtractMonth: () => void) => {
    try {
      
      const days = getDays(dayjs().subtract(month + 1, 'M').format('MM'))

      const numberOfDays = parseInt(days, 10)

      let datas: FruitData[] = []
      let streakDatas: Streak[] = []

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
            FruitData,
            c => c.userId('eq', `${userIdEl?.current}`)
              .date('beginsWith', `${dayjs().format('YYYY-MM')}-${date}`),
            {
              sort: s => s.date(SortDirection.DESCENDING),
              limit: 1,
            })
        } catch(e) {
          
        }
      }))

      const streakDataFetched = await Promise.all(dates.map(async (date) => {
        try {
          return DataStore.query(
            Streak,
            c => c.userIdGoal('eq', `${userIdEl?.current}#${PrimaryGoalType.FRUIT}#null`)
              .startDate('beginsWith', `${dayjs().format('YYYY-MM')}-${date}`),
            {
              limit: 1,
            })
        } catch(e) {
          
        }
      }))

      dataFetched.forEach(i => datas.concat(i.filter(i => !!i)))

      streakDataFetched.forEach(i => streakDatas.concat(i.filter(i => !!i)))

      if (streakDatas?.length > 0) {
        if (datas?.length > 0) {
          setCurrentDataView(
            createObjectWithStreaks(
            datas.map(i => dayjs(i.date).format('YYYY-MM-DD')),
            streakDatas.map(i => ({
              startDate: dayjs(i.startDate).format('YYYY-MM-DD'),
              endDate: dayjs(i.lastSyncDate).format('YYYY-MM-DD'),
            }))
            )
          )
          setMonth(month + 1)
          return setDataSet(datas)
        }

      } else if (!(streakDatas?.length > 0) && datas?.length > 0) {
        setCurrentDataView(createObject(datas.map(i => dayjs(i.date).format('YYYY-MM-DD'))))
        setDataSet(datas)
        setMonth(month + 1)
      }
      subtractMonth()
    } catch(e) {
      
    }
  }

  const onPressArrowRight = async (addMonth: () => void): Promise<null | undefined | void> => {
    try {
      if (month - 1 === 0) {
        addMonth()
        return null
      }
      
      const days = getDays(dayjs().subtract(month - 1, 'M').format('MM'))

      const numberOfDays = parseInt(days, 10)

      let datas: FruitData[] = []
      let streakDatas: Streak[] = []

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
            FruitData,
            c => c.userId('eq', `${userIdEl?.current}`)
              .date('beginsWith', `${dayjs().format('YYYY-MM')}-${date}`),
            {
              sort: s => s.date(SortDirection.DESCENDING),
              page: month - 1,
              limit: 1,
            })
        } catch(e) {
          
        }
      }))

      const streakDataFetched = await Promise.all(dates.map(async (date) => {
        try {
          return DataStore.query(
            Streak,
            c => c.userIdGoal('eq', `${userIdEl?.current}#${PrimaryGoalType.FRUIT}#null`)
              .startDate('beginsWith', `${dayjs().format('YYYY-MM')}-${date}`),
            {
              limit: 1,
            })
        } catch(e) {
          
        }
      }))

      dataFetched.forEach(i => datas.concat(i.filter(i => !!i)))

      streakDataFetched.forEach(i => streakDatas.concat(i.filter(i => !!i)))

      if (streakDatas?.length > 0) {
        if (datas?.length > 0) {
          setCurrentDataView(
            createObjectWithStreaks(
            datas.map(i => dayjs(i.date).format('YYYY-MM-DD')),
            streakDatas.map(i => ({
              startDate: dayjs(i.startDate).format('YYYY-MM-DD'),
              endDate: dayjs(i.lastSyncDate).format('YYYY-MM-DD'),
            }))
            )
          )
          setMonth(month - 1)
          return setDataSet(datas)
        }

      } else if (!(streakDatas?.length > 0) && datas?.length > 0) {
        setCurrentDataView(createObject(datas.map(i => dayjs(i.date).format('YYYY-MM-DD'))))
        setDataSet(datas)
        setMonth(month - 1)
      }

      
      
      
      
      
      

      addMonth()
    } catch(e) {
      
    }
  }

  const onDone = async () => {
    try {
      
      const base64ImageString = await RNFS.readFile(localImagePathEl?.current, 'base64')

      
      

      
      const base64Data = Buffer.from(base64ImageString.replace(/^data:image\/\w+;base64,/, ""), 'base64')

      if (activePostEl?.current?.id) {
        
        const key = await uploadPicture(
          s3El,
          userIdEl,
          credIdEl,
          base64Data, activePostEl?.current?.id)

        
        
        
        

        activePostEl.current = {
          ...activePostEl.current,
          image: key,
        }

        /** delete local file */
        await RNFS.unlink(localImagePathEl?.current)

        navigation.navigate('UserCreatePost', {
          post: activePostEl?.current,
          userId: userIdEl?.current,
          avatar: avatarEl?.current,
          username: usernameEl?.current,
          profileId: profileIdEl?.current,
        })
      }

    } catch(e) {
      
    }
  }

  const callCapture = async () => {
    try {
      return capture(
        viewShotEl,
        activePostEl,
        localImagePathEl,
        onDone,
        setLoading,
      )
    } catch(e) {
      
      Toast.show({
        type: 'error',
        text1: 'Unable to capture snapshot',
        text2: 'Unable to to capture snapshot due to an internal error',
      })
    }
  }

  if (loading) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%'}} backgroundColor="lightRegularCardBackground">
        <Spinner isVisible={true} type="ThreeBounce" size={100} color="#FFFFFF" />
      </Box>
    )
  }

  return (
    <Box flex={1} justifyContent="center" alignItems="center">
      <Box my={{ phone: 'm', tablet: 'l' }}>
        <Text variant="header">
          Fruit Calendar
        </Text>
        <ViewShot ref={viewShotEl} options={{ format: "jpg", quality: 0.9 }}>
          <Calendar
            onPressArrowLeft={onPressArrowLeft}
            onPressArrowRight={onPressArrowRight}
            markedDates={currentDataView}
          />
        </ViewShot>
      </Box>
      <Box my={{ phone: 'm', tablet: 'l' }}>
        <Box>
          {
            fruitProgressBar > 0
            && goal?.goal
            ? (
              <Box m={{ phone: 's', tablet: 'm' }} >
                <Box style={{ width: '100%' }} flexDirection="row" justifyContent="space-between">
                  <Text variant="caption">
                    Fruit
                  </Text>
                  <Text variant="caption">
                    {(((dataset as FruitData[])[(dataset as FruitData[]).length - 1]
                      ['servings'] as number) > 0)
                      && goal?.goal && (`${((dataset as FruitData[])
                        [(dataset as FruitData[]).length - 1]
                        ['servings'] as number)}/${goal?.goal} Servings`)}
                  </Text>
                </Box>
                <Bar progress={fruitProgressBar} width={200} />
              </Box>
            ) : null
          }
        </Box>
      </Box>
      <Box my={{ phone: 'm', tablet: 'l' }}>
        <Text variant="header">
          Goal Fruit
        </Text>
        {
          goal
          && goal.goal
          && (goal.status === Status.ACTIVE)
          && (
            <Box flexDirection="row" justifyContent="flex-start" alignItems="center">
              <Text variant="caption" style={{ textAlign: 'center', fontSize: 48, color: palette.purplePrimary }}>
                {"• "}
              </Text>
              <Text variant="caption">
                {`${goal.goal} Servings`}
              </Text>
            </Box>
          )
        }
      </Box>
      <Box my={{ phone: 'm', tablet: 'l' }}>
        <Button onPress={callCapture}>
          Post
        </Button>
      </Box>
    </Box>
  )
}


export default UserViewFruitCalendar
