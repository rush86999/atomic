import React, { useState, useEffect, useRef } from 'react';
import { useWindowDimensions } from 'react-native'
import { DataStore, SortDirection} from '@aws-amplify/datastore'
import { dayjs, RNLocalize } from '@app/date-utils'
import { LineChart } from 'react-native-chart-kit'
import { Bar } from 'react-native-progress'
import {
  WeightData, Goal, User,
  Status, PrimaryGoalType,
} from '@models'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import { v4 as uuid } from 'uuid'
import _ from 'lodash'
import * as math from 'mathjs'
import { palette } from '@theme/theme'


import {
  UserProfile as UserProfileRealm,
} from '@realm/UserProfile'

import materialTheme from '@constants/Theme'


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
  getRealmApp: () => Realm,
}

type data = {
  labels: string[],
  datasets: Dataset[],
}

function UserViewWeightMonthly(props: Props) {
  const [datasetG, setDataSetG] = useState<WeightData[] | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [chartData, setChartData] = useState<data | null>(null)
  const [goal, setGoal] = useState<Goal | null>(null)
  const [weightProgressBar, setWeightProgressBar] = useState<number>(0)

  const userIdEl = useRef<string>(null)
  const avatarEl = useRef<string>('')
  const usernameEl = useRef<string>('')
  const profileIdEl = useRef<string>('')

  const {
    sub,
    getRealmApp,
   } = props

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
    const getWeightGoal = async (userId1: string) => {
      try {

        const goals = await DataStore.query(Goal, c => c.userId('eq', userId1)
        .date('beginsWith', dayjs().format('YYYY'))
        .status('eq', Status.ACTIVE)
        .primaryGoalType('eq', PrimaryGoalType.WEIGHT), {
          page: 0,
          limit: 1,
          sort: s => s.date(SortDirection.DESCENDING),
        })

        const goals1 = await DataStore.query(
          Goal,
          c => c.userId('eq', userId1)
            .date('beginsWith', dayjs().subtract(1, 'y').format('YYYY'))
            .status('eq', Status.ACTIVE)
            .primaryGoalType('eq', PrimaryGoalType.WEIGHT),
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
      getWeightGoal(userIdEl?.current);
    }
  }, [userId])


  useEffect(() => {
    const updateWeightProgressBar = (dataset: WeightData[]) => {
      const currentGoal = goal?.goal as string
      const newWeightProgressBar: number = (((dataset as WeightData[])?.[(dataset as WeightData[])?.length - 1]?.['weight'] as number) > parseFloat(currentGoal))
        ? 1
        : typeof ((dataset as WeightData[])?.[(dataset as WeightData[])?.length - 1]?.['weight']) === 'number'
          ? math.chain(((dataset as WeightData[])?.[(dataset as WeightData[])?.length - 1]?.['weight'] as number)).divide(parseFloat(currentGoal) || 0).done()
          : 0

      setWeightProgressBar(newWeightProgressBar)
    }
    const conformData = (dataset: WeightData[], labels: string[]) => {
      if (labels?.[0] && dataset?.[0]?.id) {
        const weightDataset = dataset.map((i: WeightData) => {
          const value: number = typeof i?.weight === 'number'
            && (i?.weight > -1)
            ? math.round(i?.weight)
            : 0
          return value
        })
          const data: data = {
            labels,
            datasets: [
              {
                data: typeof weightDataset?.[0] === 'number'
                ? weightDataset as number[]
                : [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
              }
            ],
          }
          if (dataset?.[0]?.id && goal?.goal) {
            updateWeightProgressBar(dataset)
          }

          return setChartData(data)
      }
    }
    const getData = async (userId1: string) => {
      try {
        const newDates = []

        for(let i = 0; i < 31; i++) {
          newDates.push(dayjs().subtract(i, 'd').format('YYYY-MM-DD'))
        }

        const newDatasPromiseArray = newDates.map(async (date) => {

          const datas = await DataStore.query(
            WeightData,
            c => c.userId('eq', `${userId1}`)
              .date('beginsWith', date),
            {
              page: 0,
              limit: 1,
            }
          )

          return datas
        })

        const newDatasArray = await Promise.all(newDatasPromiseArray)

        let newDatas: WeightData[] = []

        for(let i = 0; i < 31; i++) {
          if (!(newDatasArray?.[i]?.[0]?.id)) {
            newDatas.push({
              id: uuid(),
              date: dayjs().subtract(i, 'd').format('YYYY-MM-DD'),
              userId,
              weight: 0,
            })
          } else {
            newDatas = newDatas.concat(newDatasArray[i])
          }
        }

        newDatas = _.reverse(newDatas)

        let newLabels = []

        for (let i = 0; i < 31; i++) {
          newLabels.push(dayjs().subtract(i, 'd').format('dd'))
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

  }, [userId, (goal?.goal || '')])


  const chartConfig = {
    backgroundGradientFrom: materialTheme.COLORS.GRADIENT_START,
    backgroundGradientTo: materialTheme.COLORS.GRADIENT_END,
    backgroundGradientFromOpacity: 1,
    backgroundGradientToOpacity: 1,
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
        <Text variant="header" my={{ phone: 'm', tablet: 'l' }}>
          Monthly Progress
        </Text>
        {chartData?.datasets?.[0]?.data?.[0] > -1
          ? (
            <LineChart
              data={(chartData as data)}
              width={width}
              height={height}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={chartConfig}
              bezier
              style={graphStyle}
              withVerticalLabels={false}
              withHorizontalLines={false}
              withVerticalLines={false}
              withInnerLines={false}
              withOuterLines={false}
            />
          ) :
            (
              <Box>
                <Text variant="subheader">
                  Nothing here. Need more data.
                </Text>
              </Box>
          )}
      </Box>
      <Box style={{ width: '100%'}} flex={2} justifyContent="flex-start" alignItems="center" my={{ phone: 'm', tablet: 'l' }}>
        <Box style={{ width: '100%'}} flex={1} justifyContent="flex-start" alignItems="center">
          {
            goal?.goal
            ? (
              <Box style={{ width: '100%'}} flex={1} justifyContent="flex-start" alignItems="center">
                <Text variant="optionHeader" my={{ phone: 's', tablet: 'm' }}>
                  Daily Weight to Goal
                </Text>
                <Box  style={{ width: '100%'}} flex={1} justifyContent="flex-start" alignItems="center" m={{ phone: 's', tablet: 'm' }} >
                  <Box style={{ width: '100%'}} flex={1} m={{ phone: 's', tablet: 'm' }} justifyContent="flex-start" alignItems="center">
                    {(typeof ((datasetG as WeightData[])?.[(datasetG as WeightData[])?.length - 1]
                      ?.['weight'] as number) === 'number')
                      && parseFloat(goal?.goal) > 0 ? (
                        <Text variant="optionHeader">
                          {`${math.round((datasetG as WeightData[])
                              ?.[(datasetG as WeightData[])?.length - 1]
                              ?.['weight'] as number)} / ${goal?.goal} lbs`
                          }
                        </Text>
                      ) : null}
                  </Box>
                  <Box style={{ width: '100%'}} flex={1} m={{ phone: 's', tablet: 'm' }} justifyContent="flex-start" alignItems="center">
                    <Bar progress={weightProgressBar} width={200} />
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

export default UserViewWeightMonthly
