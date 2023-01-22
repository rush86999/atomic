import React, { useState, useEffect, useRef } from 'react';
import {
  useWindowDimensions,
  useColorScheme,
 } from 'react-native'
import { DataStore, SortDirection} from '@aws-amplify/datastore'
import { dayjs } from '@app/date-utils'

import { LineChart } from 'react-native-chart-kit'
import { Bar } from 'react-native-progress';

import {Picker} from '@react-native-picker/picker'

import { RouteProp } from '@react-navigation/native'

import {
  EnduranceData, GoalExercise, User,
  Status, PrimaryGoalType, EnduranceUnit,
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

type RootRouteStackParamList = {
  UserViewEndurance3Months: {
    type: string,
  },
}

type UserViewEndurance3MonthsRouteProp = RouteProp<
  RootRouteStackParamList,
  'UserViewEndurance3Months'
>

interface Dataset {
  data: number[];

  color?: (opacity: number) => string;

  colors?: Array<(opacity: number) => string>;

  strokeWidth?: number;

  withDots?: boolean;

  withScrollableDot?: boolean;
}

type pickerItem = 'Reps' | 'Minutes' | 'Distance'

type Props = {
  sub: string,
  route: UserViewEndurance3MonthsRouteProp,
  getRealmApp: () => Realm,
}

type data = {
  labels: string[],
  datasets: Dataset[],
}


const getEnduranceUnit = (value: EnduranceUnit) => {
  switch(value) {
    case EnduranceUnit.REPS:
      return 'reps'
    case EnduranceUnit.MINUTES:
      return 'minutes'
    case EnduranceUnit.DISTANCE:
      return 'distance'
  }
}

type value = 'Reps' | 'Minutes' | 'Distance'

const getMeasureUnit = (value: value) => {
  switch(value) {
    case 'Reps':
      return 'reps'
    case 'Minutes':
      return 'minutes'
    case 'Distance':
      return 'distance'
  }
}

const getEnduranceUnitValue = (value: EnduranceUnit) => {
  switch(value) {
    case EnduranceUnit.REPS:
      return 'Reps'
    case EnduranceUnit.MINUTES:
      return 'Minutes'
    case EnduranceUnit.DISTANCE:
      return 'Miles'
  }
}

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function UserViewEndurance3Months(props: Props) {
  const [datasetG, setDataSetG] = useState<EnduranceData[] | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [chartData, setChartData] = useState<data | null>(null)
  const [goal, setGoal] = useState<GoalExercise | null>(null);
  const [goalUnit, setGoalUnit] = useState<EnduranceUnit | null>(null)
  const [enduranceProgressBar, setEnduranceProgressBar] = useState<number>(0)
  const [selectedDataType, setSelectedDataType] = useState<'Reps' | 'Minutes' | 'Distance'>('Reps')
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
    const getEnduranceGoal = async (userId1: string) => {
      try {

        const goals = await DataStore.query(GoalExercise, c => c.userId('eq', userId1)
        .date('beginsWith', dayjs().format('YYYY'))
        .status('eq', Status.ACTIVE)
        .primaryGoalType('eq', PrimaryGoalType.ENDURANCE)
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
            .primaryGoalType('eq', PrimaryGoalType.ENDURANCE)
            .secondaryGoalType('eq', type),
            {
              page: 0,
              limit: 1,
              sort: s => s.date(SortDirection.DESCENDING),
            },
          )

        if (goals && goals.length > 0) {
          setGoal(goals[0]);
          setGoalUnit((goals[0].goalUnit as EnduranceUnit) || null)
        } else if (goals1 && goals1.length > 0) {
          setGoal(goals1[0]);
          setGoalUnit((goals[0].goalUnit as EnduranceUnit) || null)
        }
      } catch (e) {
        
      }
    }
    if (userIdEl?.current) {
      getEnduranceGoal(userIdEl?.current);
    }
  }, [userId])



  useEffect(() => {
    const updateEnduranceProgressBar = (dataset: EnduranceData[]) => {
      const currentGoal = goal?.goal as string
      const newEnduranceProgressBar: number = (((dataset as EnduranceData[])?.[(dataset as EnduranceData[])?.length - 1]?.[getEnduranceUnit(goalUnit as EnduranceUnit)] as number) > parseFloat(currentGoal))
        ? 1
        : typeof ((dataset as EnduranceData[])?.[(dataset as EnduranceData[])?.length - 1]?.[getEnduranceUnit(goalUnit as EnduranceUnit)] as number) === 'number'
          ? math.chain(((dataset as EnduranceData[])?.[(dataset as EnduranceData[])?.length - 1]?.[getEnduranceUnit(goalUnit as EnduranceUnit)] as number)).divide(parseFloat(currentGoal)).done()
          : 0

      setEnduranceProgressBar(newEnduranceProgressBar)
    }
    const conformData = (dataset: EnduranceData[], labels: string[]) => {
      if (labels?.[0] && dataset?.[0]?.id) {
        switch(selectedDataType) {
          case 'Reps':
            const repsDataset = dataset.map((i: EnduranceData) => {
              
              const value: number = typeof (i?.reps) === 'number'
              && (i?.reps > -1)
              ? math.round(i?.reps)
              : 0
              return value
            })
            const repsData: data = {
              labels,
              datasets: [
                {
                  data: typeof repsDataset?.[0] === 'number'
                  ? repsDataset as number[]
                  : [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                }
              ],
            }

            if (dataset?.[0]?.id && goalUnit && goal?.goal) {
              updateEnduranceProgressBar(dataset)
            }

            return setChartData(repsData)
          case 'Minutes':
            const minutesDataset = dataset.map((i: EnduranceData) => {

              const value: number = typeof (i?.minutes) === 'number'
              && (i?.minutes > -1)
              ? math.round(i?.minutes)
              : 0
              return value
            })
            const minutesData: data = {
              labels,
              datasets: [
                {
                  data: typeof minutesDataset?.[0] === 'number'
                  ? minutesDataset as number[]
                  : [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                }
              ],
            }

            if (dataset?.[0]?.id && goalUnit && goal?.goal) {
              updateEnduranceProgressBar(dataset)
            }
            

            return setChartData(minutesData)

          case 'Distance':
            const distanceDataset = dataset.map((i: EnduranceData) => {
              const value: number = typeof (i?.distance) === 'number'
              && (i?.distance > -1)
              ? math.round(i?.distance)
              : 0
              return value
            })
            const distanceData: data = {
              labels,
              datasets: [
                {
                  data: typeof distanceDataset?.[0] === 'number'
                  ? distanceDataset as number[]
                  : [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                }
              ],
            }

            if (dataset?.[0]?.id && goalUnit && goal?.goal) {
              updateEnduranceProgressBar(dataset)
            }

            return setChartData(distanceData)
        }
      }
    }
    const getData = async (userId1: string) => {
      try {
        const newDates = []

        for(let i = 0; i < 31; i++) {
          newDates.push(dayjs().subtract(i + 3, 'd').format('YYYY-MM-DD'))
        }

        const newDatasPromiseArray = newDates.map(async (date) => {

          const datas = (await DataStore.query(
            EnduranceData,
            c => c.userIdType('eq', `${userId1}#${type}`)
              .date('beginsWith', date)
          ))
            .filter(i => ((i[getMeasureUnit(selectedDataType)]) !== null))
          return datas
        })

        const newDatasArray = await Promise.all(newDatasPromiseArray)

        let newDatas: EnduranceData[] = []

        const unit = getEnduranceUnit(goalUnit as EnduranceUnit)

        for (let i = 0; i < 31; i++) {

          if (!(newDatasArray?.[i]?.[0]?.id)) {
            const value: any = {
              id: uuid(),
              date: dayjs().subtract(i + 3, 'd').format('YYYY-MM-DD'),
              userId,
            }

            value[unit] = 0
            newDatas.push(value)
          } else {
            newDatas = newDatas.concat(newDatasArray[i])
          }
        }

        newDatas = _.reverse(newDatas)

        let newLabels = []

        for(let i = 0; i < 31; i++) {
          newLabels.push(dayjs().subtract(i + 3, 'd').format('dd'))
        }

        newLabels = _.reverse(newLabels)

        conformData(newDatas, newLabels)

        setDataSetG(newDatas)

      } catch(e) {
        
      }
    }

    if (type && userIdEl?.current) {
      getData(userIdEl?.current)
    }

  }, [type, userId, selectedDataType, (goal?.goal || ''), goalUnit])


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
      <Box flex={3} my={{ phone: 'm', tablet: 'l' }}>
        <Text variant="header"  my={{ phone: 'm', tablet: 'l' }}>
          3 Month Progress
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
          ) : (
            <Box>
              <Text variant="subheader">
                Nothing here. Need more data.
              </Text>
            </Box>
          )}
      </Box>
      <Box style={{ width: '100%'}} my={{ phone: 'm', tablet: 'l' }}>
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
      <Box style={{ width: '100%'}} flex={2} justifyContent="flex-start" alignItems="center" my={{ phone: 'm', tablet: 'l' }}>
        <Box style={{ width: '100%'}} flex={1} justifyContent="flex-start" alignItems="center">
          {
            goal?.goal
            ? (
              <Box style={{ width: '100%'}} flex={1} justifyContent="flex-start" alignItems="center">
                <Text variant="optionHeader" my={{ phone: 's', tablet: 'm' }}>
                  {`Daily Endurance ${getEnduranceUnitValue(goalUnit)} to Goal`}
                </Text>
                <Box  style={{ width: '100%'}} flex={1} justifyContent="flex-start" alignItems="center" m={{ phone: 's', tablet: 'm' }} >
                  <Box style={{ width: '100%'}} flex={1} m={{ phone: 's', tablet: 'm' }} justifyContent="flex-start" alignItems="center">
                    {(typeof ((datasetG as EnduranceData[])?.[(datasetG as EnduranceData[])?.length - 1]
                      ?.[getEnduranceUnit(goalUnit as EnduranceUnit)] as number) === 'number')
                      && parseFloat(goal?.goal) > 0 ? (
                        <Text variant="optionHeader">
                          {`${math.round(((datasetG as EnduranceData[])
                              ?.[(datasetG as EnduranceData[])?.length - 1]
                              ?.[getEnduranceUnit(goalUnit as EnduranceUnit)] as number))} / ${goal?.goal} ${capitalizeFirstLetter(getEnduranceUnit(goalUnit as EnduranceUnit))}`
                          }
                        </Text>
                      ) : null}
                  </Box>
                  <Box style={{ width: '100%'}} flex={1} m={{ phone: 's', tablet: 'm' }} justifyContent="flex-start" alignItems="center">
                    <Bar progress={enduranceProgressBar} width={200} />
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

export default UserViewEndurance3Months
