import React, { useState, useEffect, useRef } from 'react'
import { useWindowDimensions } from 'react-native'
import { DataStore, SortDirection} from '@aws-amplify/datastore'
import { dayjs, RNLocalize } from '@app/date-utils'
import { BarChart } from 'react-native-chart-kit'
import { Bar } from 'react-native-progress'
import { RouteProp } from '@react-navigation/native'
import {
  HabitTypeData, Goal, User,
  Status, PrimaryGoalType,
  UserActivateType,
} from '@models'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import { v4 as uuid } from 'uuid'
import _ from 'lodash'
import * as math from 'mathjs'
import { palette } from '@theme/theme'

import {
  Post as PostRealm,
} from '@realm/Post'

import {
  UserProfile as UserProfileRealm,
} from '@realm/UserProfile'

import materialTheme from '@constants/Theme'




type RootRouteStackParamList = {
  UserViewHabitWeekly: {
    type: string,
  },
}

type UserViewHabitWeeklyRouteProp = RouteProp<
  RootRouteStackParamList,
  'UserViewHabitWeekly'
>


interface Dataset {
  data: number[]

  color?: (opacity: number) => string

  colors?: Array<(opacity: number) => string>

  strokeWidth?: number

  withDots?: boolean

  withScrollableDot?: boolean
}

type Props = {
  sub: string,
  route: UserViewHabitWeeklyRouteProp,
  getRealmApp: () => Realm,
}

type data = {
  labels: string[],
  datasets: Dataset[],
}


const rescapeUnsafe = (safe: string) => safe
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#039;/g, '\'')
  .replace(/-/gi, ' ');

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function UserViewHabitWeekly(props: Props) {
  const [datasetG, setDataSetG] = useState<HabitTypeData[] | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  // const [labels, setLabels] = useState<string[] | null>(null)
  const [chartData, setChartData] = useState<data | null>(null)
  const [goal, setGoal] = useState<Goal | null>(null)
  const [habitTypeProgressBar, setHabitTypeProgressBar] = useState<number>(0)
  // const [loading, setLoading] = useState<boolean>(false)
  const [unit, setUnit] = useState<string>('minutes')

  const userIdEl = useRef<string>(null)
  const avatarEl = useRef<string>('')
  const usernameEl = useRef<string>('')
  const profileIdEl = useRef<string>('')

  const {
    sub,
    // route: { params: { type } },
    getRealmApp,
  } = props

  const type = props?.route?.params?.type

  const realm = getRealmApp()

  // get unit value
  useEffect(() => {
    (async () => {
      if (!(userIdEl?.current)) {
        return
      }

      const activateTypes = await DataStore.query(UserActivateType, c => c.userId('eq', userIdEl?.current)
        .primaryGoalType('eq', PrimaryGoalType.LIMITTYPE)
        .secondaryGoalType('eq', type),
      {
        limit: 1,

      })

      if (activateTypes?.length > 0) {
        const [activateType] = activateTypes

        setUnit(activateType?.unit || 'minutes')
      }
    })()
  }, [userId])

  // close realm
  useEffect(() => {
    return () => {
      // closeRealm()
    }
  }, [])


  /** get userprofile */
  // get userProfileId
  useEffect(() => {
    const getProfileId = async (userId: string) => {
      try {
        const userData = await DataStore.query(User, userId)

        if (userData && userData.profileId) {
          const profileIdData = userData.profileId

          if (profileIdData) {
            // setProfileId(profileIdData)
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
          // 
      }
    }
    if (userIdEl.current) {
      getProfileId(userIdEl.current)
    }
  }, [userId])

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

  // get Goal
  useEffect(() => {
    const getHabitTypeGoal = async (userId1: string) => {
      try {

        const goals = await DataStore.query(Goal, c => c.userId('eq', userId1)
        .date('beginsWith', dayjs().format('YYYY'))
        .status('eq', Status.ACTIVE)
        .primaryGoalType('eq', PrimaryGoalType.HABITTYPE)
        .secondaryGoalType('eq', type), {
          page: 0,
          limit: 100,
          sort: s => s.date(SortDirection.DESCENDING),
        })

        const goals1 = await DataStore.query(
          Goal,
          c => c.userId('eq', userId1)
            .date('beginsWith', dayjs().subtract(1, 'y').format('YYYY'))
            .status('eq', Status.ACTIVE)
            .primaryGoalType('eq', PrimaryGoalType.HABITTYPE)
            .secondaryGoalType('eq', type),
            {
              page: 0,
              limit: 100,
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
      getHabitTypeGoal(userIdEl?.current);
    }
  }, [userId])


  /** get data */
  useEffect(() => {
    const updateHabitProgressBar = (dataset: HabitTypeData[]) => {
      const currentGoal = goal?.goal as string
      const newHabitTypeProgressBar: number = (((dataset as HabitTypeData[])?.[(dataset as HabitTypeData[])?.length - 1]?.['value'] as number) > parseFloat(currentGoal))
        ? 1
        : typeof ((dataset as HabitTypeData[])?.[(dataset as HabitTypeData[])?.length - 1]?.['value']) === 'number'
          ? math.chain(((dataset as HabitTypeData[])?.[(dataset as HabitTypeData[])?.length - 1]?.['value'] as number)).divide(parseFloat(currentGoal) || 0).done()
          : 0

      setHabitTypeProgressBar(newHabitTypeProgressBar)
    }
    const conformData = (dataset: HabitTypeData[], labels: string[]) => {
      if (labels?.[0] && dataset?.[0]?.id) {
        const valueDataset = dataset.map((i: HabitTypeData) => {
          const value: number = typeof i?.value === 'number'
            && (i?.value > -1)
            ? math.round(i?.value)
            : 0
          return value
        })
          const data: data = {
            labels,
            datasets: [
              {
                data: typeof valueDataset?.[0] === 'number'
                ? valueDataset as number[]
                : [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
              }
            ],
          }

          if (dataset?.[0]?.id && goal?.goal) {
            updateHabitProgressBar(dataset)
          }

          return setChartData(data)
      }
    }
    const getData = async (userId1: string) => {
      try {
        const newDates = []

        for(let i = 0; i < 7; i++) {
          newDates.push(dayjs().subtract(i, 'd').format('YYYY-MM-DD'))
        }

        const newDatasPromiseArray = newDates.map(async (date) => {

          const datas = (await DataStore.query(
            HabitTypeData,
            c => c.userIdType('eq', `${userId1}#${type}`)
              .date('beginsWith', date),
            {
              page: 0,
              limit: 100,
            }
          ))
            .filter(i => (i?.value !== null))
          return datas
        })

        const newDatasArray = await Promise.all(newDatasPromiseArray)

        let newDatas: HabitTypeData[] = []

        for (let i = 0; i < 7; i++) {

          if (!(newDatasArray?.[i]?.[0]?.id)) {
            newDatas.push({
              id: uuid(),
              date: dayjs().subtract(i + 3, 'd').format('YYYY-MM-DD'),
              userId,
              value: 0,
              unit,
              userIdType: `${userId}#${type}`,
              type,
            })
          } else {
            newDatas = newDatas.concat(newDatasArray[i])
          }
        }

        newDatas = _.reverse(newDatas)

        let newLabels = []

        for(let i = 0; i < 7; i++) {
          newLabels.push(dayjs().subtract(i, 'd').format('ddd'))
        }

        newLabels = _.reverse(newLabels)

        conformData(newDatas, newLabels)

        setDataSetG(newDatas)

      } catch(e) {
        
      }
    }

    if (userIdEl?.current) {
      getData(userIdEl?.current)
    }

  }, [userId])


  /** chart config */
  const chartConfig = {
    backgroundGradientFrom: materialTheme.COLORS.GRADIENT_START,
    backgroundGradientTo: materialTheme.COLORS.GRADIENT_END,
    backgroundGradientFromOpacity: 1,
    backgroundGradientToOpacity: 1,
    fillShadowGradient: palette.white,
    fillShadowGradientOpacity: 1,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: palette.purplePrimary
    }
  }

  const graphStyle = {
    marginVertical: 8,
    ...chartConfig.style
  }

  const width = useWindowDimensions().width

  const height = Math.min(useWindowDimensions().width/2, useWindowDimensions().height - 250)


  return (
    <Box flex={1} justifyContent="center" alignItems="center">
      <Box flex={3} justifyContent="center" alignItems="center" my={{ phone: 'm', tablet: 'l' }}>
        <Text variant="header">
          Daily Progress
        </Text>
        {chartData?.datasets?.length > 0
          ? (
              <BarChart
                data={(chartData as data)}
                width={width}
                height={height}
                yAxisLabel=""
                yAxisSuffix=""
                chartConfig={chartConfig}
                style={graphStyle}
                showBarTops
                withInnerLines={false}
                fromZero
                showValuesOnTopOfBars
              />
          ) : (
            <Box>
              <Text variant="subheader">
                Nothing here. Need more data.
              </Text>
            </Box>
          )}
      </Box>
      <Box flex={2} style={{ width: '100%'}} justifyContent="flex-start" alignItems="center" my={{ phone: 'm', tablet: 'l' }}>
        <Box style={{ width: '100%'}} flex={1} justifyContent="flex-start" alignItems="center">
          {
            habitTypeProgressBar > 0
            && goal?.goal
            ? (
              <Box style={{ width: '100%'}} flex={1} justifyContent="flex-start" alignItems="center">
                <Text variant="optionHeader">
                  {`Daily ${rescapeUnsafe(type)} ${capitalizeFirstLetter(unit || 'value')}`}
                </Text>
                <Box style={{ width: '100%'}} flex={1} justifyContent="flex-start" alignItems="center" m={{ phone: 's', tablet: 'm' }}>
                  <Box style={{ width: '100%'}} flex={1} justifyContent="flex-start" alignItems="center" m={{ phone: 's', tablet: 'm' }}>
                    {(typeof ((datasetG as HabitTypeData[])?.[(datasetG as HabitTypeData[])?.length - 1]
                      ?.['value'] as number) === 'number')
                      && parseFloat(goal?.goal) > 0 ? (
                        <Text variant="optionHeader">
                          {`${math.round((datasetG as HabitTypeData[])
                              ?.[(datasetG as HabitTypeData[])?.length - 1]
                              ?.['value'] as number)} / ${goal?.goal} ${capitalizeFirstLetter(unit)}`
                          }
                        </Text>
                      ) : null}
                  </Box>
                  <Box style={{ width: '100%'}} flex={1} m={{ phone: 's', tablet: 'm' }} justifyContent="flex-start" alignItems="center">
                    <Bar progress={habitTypeProgressBar} width={200} />
                  </Box>
                </Box>
              </Box>
            ) : null
          }
        </Box>
      </Box>
    </Box>
  )
}

export default UserViewHabitWeekly
