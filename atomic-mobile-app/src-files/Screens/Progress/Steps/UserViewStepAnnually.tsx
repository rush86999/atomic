import React, { useState, useEffect, useRef } from 'react';
import { useWindowDimensions } from 'react-native'
import { DataStore, SortDirection} from '@aws-amplify/datastore'
import { dayjs, RNLocalize } from '@app/date-utils'
import { LineChart } from 'react-native-chart-kit'
import { Bar } from 'react-native-progress'
import {
  StepData, Goal, User,
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

function UserViewStepAnnually(props: Props) {
  const [datasetG, setDataSetG] = useState<StepData[] | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [chartData, setChartData] = useState<data | null>(null)
  const [goal, setGoal] = useState<Goal | null>(null)
  const [stepProgressBar, setStepProgressBar] = useState<number>(0)

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
    const getStepGoal = async (userId1: string) => {
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
          setGoal(goals[0]);
        } else if (goals1 && goals1.length > 0) {
          setGoal(goals1[0]);
        }
      } catch (e) {
      }
    }
    if (userIdEl?.current) {
      getStepGoal(userIdEl?.current);
    }
  }, [userId])


  useEffect(() => {
    const updateStepProgressBar = (dataset: StepData[]) => {
      const currentGoal = goal?.goal as string
      const newStepProgressBar: number = (((dataset as StepData[])?.[(dataset as StepData[])?.length - 1]?.['steps'] as number) > parseFloat(currentGoal))
        ? 1
        : typeof ((dataset as StepData[])?.[(dataset as StepData[])?.length - 1]?.['steps']) === 'number'
          ? math.chain(((dataset as StepData[])?.[(dataset as StepData[])?.length - 1]?.['steps'] as number)).divide(parseFloat(currentGoal) || 0).done()
          : 0

      setStepProgressBar(newStepProgressBar)
    }
    const conformData = (dataset: StepData[], labels: string[]) => {
      if (labels?.[0] && dataset?.[0]?.id) {
        const stepsDataset = dataset.map((i: StepData) => {
          const value: number = typeof i?.steps === 'number'
            && (i?.steps > -1)
            ? math.round(i?.steps)
            : 0
          return value
        })
          const data: data = {
            labels,
            datasets: [
              {
                data: typeof stepsDataset?.[0] === 'number'
                ? stepsDataset as number[]
                : [0,0,0,0,0,0,0],
              }
            ],
          }

          if (dataset?.[0]?.id && goal?.goal) {
            updateStepProgressBar(dataset)
          }

          return setChartData(data)
      }
    }
    const getData = async (userId1: string) => {
      try {
        const newDates = []

        for(let i = 0; i < 31; i++) {
          newDates.push(dayjs().subtract(i + 12, 'd').format('YYYY-MM-DD'))
        }

        const newDatasPromiseArray = newDates.map(async (date) => {

          const datas = await DataStore.query(
            StepData,
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

        let newDatas: StepData[] = []

        for(let i = 0; i < 31; i++) {
          if (!(newDatasArray?.[i]?.[0])) {
            newDatas.push({
              id: uuid(),
              date: dayjs().subtract(i + 12, 'd').format('YYYY-MM-DD'),
              userId,
              steps: 0,
            })
          } else {
            newDatas = newDatas.concat(newDatasArray[i])
          }
        }

        newDatas = _.reverse(newDatas)

        let newLabels = []

        for (let i = 0; i < 31; i++) {
          newLabels.push(dayjs().subtract(i + 12, 'd').format('ddd'))
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
          12 Months Progress
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
                  Daily Steps to Goal
                </Text>
                <Box  style={{ width: '100%'}} flex={1} justifyContent="flex-start" alignItems="center" m={{ phone: 's', tablet: 'm' }} >
                  <Box style={{ width: '100%'}} flex={1} m={{ phone: 's', tablet: 'm' }} justifyContent="flex-start" alignItems="center">
                    {(typeof ((datasetG as StepData[])?.[(datasetG as StepData[])?.length - 1]
                      ?.['steps'] as number) === 'number')
                      && parseFloat(goal?.goal) > 0 ? (
                        <Text variant="optionHeader">
                          {`${math.round((datasetG as StepData[])
                              ?.[(datasetG as StepData[])?.length - 1]
                              ?.['steps'] as number)} / ${goal?.goal} Steps`
                          }
                        </Text>
                      ) : null}
                  </Box>
                  <Box style={{ width: '100%'}} flex={1} m={{ phone: 's', tablet: 'm' }} justifyContent="flex-start" alignItems="center">
                    <Bar progress={stepProgressBar} width={200} />
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

export default UserViewStepAnnually
