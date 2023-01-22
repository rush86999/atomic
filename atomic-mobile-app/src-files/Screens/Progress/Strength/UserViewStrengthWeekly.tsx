import React, { useState, useEffect, useRef } from 'react';
import { useWindowDimensions, useColorScheme } from 'react-native'
import { DataStore, SortDirection} from '@aws-amplify/datastore'
import { dayjs, RNLocalize } from '@app/date-utils'
import { BarChart } from 'react-native-chart-kit'
import { Bar } from 'react-native-progress'
import {Picker} from '@react-native-picker/picker'
import { RouteProp } from '@react-navigation/native'
import {
  StrengthData, GoalExercise, User,
  Status, PrimaryGoalType,
  ExerciseGoalPreference,
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
  UserViewStrengthWeekly: {
    type: string,
  },
}

type UserViewStrengthWeeklyRouteProp = RouteProp<
  RootRouteStackParamList,
  'UserViewStrengthWeekly'
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
  route: UserViewStrengthWeeklyRouteProp,
  getRealmApp: () => Realm,
}

type data = {
  labels: string[],
  datasets: Dataset[],
}



type pickerItem = 'Weight' | 'Reps'

type measureUnit = 'Weight' | 'Reps'

const getMeasureUnit = (value: measureUnit) => {
  switch(value) {
    case 'Reps':
      return 'reps'
    case 'Weight':
      return 'weight'
    default:
      return 'weight'
  }
}

const getStrengthUnit = (value: measureUnit) => {
  switch(value) {
    case 'Reps':
      return 'Reps'
    case 'Weight':
      return 'Weight'
    default:
      return 'Weight'
  }
}

const getGoalUnitPreference = (type: ExerciseGoalPreference) => {
  switch(type) {
    case ExerciseGoalPreference.REPS:
      return 'Reps'
    case ExerciseGoalPreference.WEIGHT:
      return 'Weight'
    default:
      return 'Weight'
  }
}




function UserViewStrengthWeekly(props: Props) {
  const [datasetG, setDataSetG] = useState<StrengthData[] | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [chartData, setChartData] = useState<data | null>(null)
  const [goal, setGoal] = useState<GoalExercise | null>(null)
  const [strengthProgressBar, setStrengthProgressBar] = useState<number>(0)
  const [selectedDataType, setSelectedDataType] = useState<'Weight' | 'Reps'>('Weight')
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
    const getStrengthGoal = async (userId1: string) => {
      try {

        const goals = await DataStore.query(GoalExercise, c => c.userId('eq', userId1)
          .date('beginsWith', dayjs().format('YYYY'))
          .status('eq', Status.ACTIVE)
          .primaryGoalType('eq', PrimaryGoalType.STRENGTH)
          .secondaryGoalType('eq', type), {
            page: 0,
            limit: 100,
            sort: s => s.date(SortDirection.DESCENDING),
          })

        const goals1 = await DataStore.query(
          GoalExercise,
          c => c.userId('eq', userId1)
            .date('beginsWith', dayjs().subtract(1, 'y').format('YYYY'))
            .status('eq', Status.ACTIVE)
            .primaryGoalType('eq', PrimaryGoalType.STRENGTH)
            .secondaryGoalType('eq', type),
            {
              page: 0,
              limit: 100,
              sort: s => s.date(SortDirection.DESCENDING),
            },
          )

        if (goals && goals.length > 0) {
          setGoal(goals[0])
          setSelectedDataType(getGoalUnitPreference(goals[0].goalUnit as ExerciseGoalPreference))
        } else if (goals1 && goals1.length > 0) {
          setGoal(goals1[0])
          setSelectedDataType(getGoalUnitPreference(goals[0].goalUnit as ExerciseGoalPreference))
        }
      } catch (e) {
        
      }
    }
    if (userIdEl?.current) {
      getStrengthGoal(userIdEl?.current);
    }
  }, [userId])


  useEffect(() => {
    const updateStrengthProgressBar = (dataset: StrengthData[]) => {
      const currentGoal = goal?.goal as string
      const newStrengthProgressBar: number = (((dataset as StrengthData[])?.[(dataset as StrengthData[])?.length - 1]?.[getMeasureUnit(selectedDataType)] as number) > parseFloat(currentGoal))
        ? 1
        : typeof ((dataset as StrengthData[])?.[(dataset as StrengthData[])?.length - 1]?.[getMeasureUnit(selectedDataType)] as number) === 'number'
          ? math.chain(((dataset as StrengthData[])?.[(dataset as StrengthData[])?.length - 1]?.[getMeasureUnit(selectedDataType)] as number)).divide(parseFloat(currentGoal)).done()
          : 0

      setStrengthProgressBar(newStrengthProgressBar)
    }
    const conformData = (dataset: StrengthData[], labels: string[]) => {
      if (labels?.[0] && dataset?.[0]?.id) {
        switch(selectedDataType) {
          case 'Reps':
            const repsDataset = dataset.map((i: StrengthData) => {
              
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

            if (dataset?.[0]?.id && selectedDataType && goal?.goal) {
              updateStrengthProgressBar(dataset)
            }

            return setChartData(repsData)
          case 'Weight':
            const weightDataset = dataset.map((i: StrengthData) => {

              const value: number = typeof (i?.weight) === 'number'
              && (i?.weight > -1)
              ? math.round(i?.weight)
              : 0
              return value
            })
            const weightData: data = {
              labels,
              datasets: [
                {
                  data: typeof weightDataset?.[0] === 'number'
                  ? weightDataset as number[]
                  : [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                }
              ],
            }

            if (dataset?.[0]?.id && selectedDataType && goal?.goal) {
              updateStrengthProgressBar(dataset)
            }
            

            return setChartData(weightData)
        }
      }
    }
    const getData = async (userId1: string) => {
      try {
        const newDates = []

        for(let i = 0; i < 7; i++) {
          newDates.push(dayjs().subtract(i, 'd').format('YYYY-MM-DD'))
        }

        const unit = getMeasureUnit(selectedDataType)

        const newDatasPromiseArray = newDates.map(async (date) => {

          const datas = (await DataStore.query(
            StrengthData,
            c => c.userIdType('eq', `${userId1}#${type}`)
              .date('beginsWith', date)
          ))

          if (datas?.[0]?.[unit]) {
            if (unit === 'weight') {

              const sumValue = datas.filter(i => ((i[unit]) !== null)).map(i => i?.[unit]).reduce((acc, c) => (acc + c))
              const repsDatas = datas.filter(i => ((i.reps) !== null))
              const avgValue = math.chain(sumValue).divide(repsDatas.length).done()
              const newValue: any = {
                id: uuid(),
                date,
                userId,
                [unit]: avgValue,
              }

              return [newValue]

            } else {
              const sumValue = datas.map(i => i?.[unit]).reduce((acc, c) => (acc + c))
              const newValue: any = {
                id: uuid(),
                date,
                userId,
                [unit]: sumValue,
              }

              return [newValue]
            }
          }
          return datas
        })

        const newDatasArray = await Promise.all(newDatasPromiseArray)

        let newDatas: StrengthData[] = []

        for (let i = 0; i < 7; i++) {

          if (!(newDatasArray?.[i]?.[0]?.[unit])) {
            const value: any = {
              id: uuid(),
              date: dayjs().subtract(i, 'd').format('YYYY-MM-DD'),
              userId,
              [unit]: 0
            }
            newDatas.push(value)
          } else {
            newDatas = newDatas.concat(newDatasArray[i])
          }
        }

        newDatas = _.reverse(newDatas)

        let newLabels = []

        for(let i = 0; i < 7; i++) {
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

  }, [userId, selectedDataType, (goal?.goal || '')])


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
    <Box style={{ width: '100%'}} flex={3} my={{ phone: 'm', tablet: 'l' }}>
      <Text variant="header"  my={{ phone: 'm', tablet: 'l' }}>
        Daily Progress
      </Text>
      {chartData?.datasets?.[0]?.data?.[0] > -1
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
    <Box style={{ width: '100%'}} my={{ phone: 'm', tablet: 'l' }}>
      <Picker
        style={{ color: dark ? palette.white : palette.textBlack }}
        selectedValue={selectedPickerItem}
        onValueChange={(item: pickerItem) => { setSelectedPickerItem(item); setSelectedDataType(item); }}
      >
        <Picker.Item color={dark ? palette.white : palette.textBlack} key="Weight" value="Weight" label="Weight" />
        <Picker.Item color={dark ? palette.white : palette.textBlack} key="Reps" value="Reps" label="Reps" />
      </Picker>
    </Box>
    <Box style={{ width: '100%'}} flex={2} justifyContent="flex-start" alignItems="center" my={{ phone: 'm', tablet: 'l' }}>
      <Box style={{ width: '100%'}} flex={1} justifyContent="flex-start" alignItems="center">
        {
          goal?.goal
          ? (
            <Box style={{ width: '100%'}} flex={1} justifyContent="flex-start" alignItems="center">
              <Text variant="optionHeader" my={{ phone: 's', tablet: 'm' }}>
                {`Daily Strength ${getStrengthUnit(getGoalUnitPreference(goal?.goalUnit as ExerciseGoalPreference))} to Goal`}
              </Text>
              <Box  style={{ width: '100%'}} flex={1} justifyContent="flex-start" alignItems="center" m={{ phone: 's', tablet: 'm' }} >
                <Box style={{ width: '100%'}} flex={1} m={{ phone: 's', tablet: 'm' }} justifyContent="flex-start" alignItems="center">
                  {(typeof ((datasetG as StrengthData[])?.[(datasetG as StrengthData[])?.length - 1]
                    ?.[getMeasureUnit(selectedDataType)] as number) === 'number')
                    && parseFloat(goal?.goal) > 0 ? (
                      <Text variant="optionHeader">
                        {`${math.round(((datasetG as StrengthData[])
                            ?.[(datasetG as StrengthData[])?.length - 1]
                            ?.[getMeasureUnit(selectedDataType)] as number))} / ${goal?.goal} ${getStrengthUnit(selectedDataType)}`
                        }
                      </Text>
                    ) : null}
                </Box>
                <Box style={{ width: '100%'}} flex={1} m={{ phone: 's', tablet: 'm' }} justifyContent="flex-start" alignItems="center">
                  <Bar progress={strengthProgressBar} width={200} />
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

export default UserViewStrengthWeekly
