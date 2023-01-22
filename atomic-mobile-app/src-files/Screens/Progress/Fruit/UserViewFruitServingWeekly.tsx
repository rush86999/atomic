import React, { useState, useEffect, useRef } from 'react'
import { useWindowDimensions } from 'react-native'
import { DataStore, SortDirection} from '@aws-amplify/datastore'
import { dayjs } from '@app/date-utils'

import { BarChart } from 'react-native-chart-kit'
import { Bar } from 'react-native-progress'
import RNFS from 'react-native-fs'
import ViewShot from 'react-native-view-shot'
import { S3Client } from '@aws-sdk/client-s3'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import Toast from 'react-native-toast-message'

import Spinner from 'react-native-spinkit'
import { Buffer } from '@craftzdog/react-native-buffer'

import {
  FruitData, Goal, User,
  Status, PrimaryGoalType,
  UserProfile,
} from '@models'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import Button from '@components/Button'
import * as math from 'mathjs'
import { palette } from '@theme/theme'
import {
  
  uploadPicture,
  getS3AndCredId,
  
  capture,
} from '@progress/Todo/UserTaskHelper'
import {
  Post as PostRealm,
} from '@realm/Post'




type RootStackParamList = {
  UserCreatePost: {
    post: PostRealm,
    userId: string,
    avatar: string,
    username: string,
    profileId: string,
  },
  UserViewFruitServingWeekly: undefined,
}

type UserViewFruitServingWeeklyNavigationProp = StackNavigationProp<
  RootStackParamList,
  'UserViewFruitServingWeekly'
>

interface Dataset {
  /** The data corresponding to the x-axis label. */
  data: number[]

  /** A function returning the color of the stroke given an input opacity value. */
  color?: (opacity: number) => string

  /** A function returning array of the colors of the stroke given an input opacity value for each data value. */
  colors?: Array<(opacity: number) => string>

  /** The width of the stroke. Defaults to 2. */
  strokeWidth?: number

  /** A boolean indicating whether to render dots for this line */
  withDots?: boolean

  /** Override of LineChart's withScrollableDot property just for this dataset */
  withScrollableDot?: boolean
}

type Props = {
  sub: string,
  
}

type data = {
  labels: string[],
  datasets: Dataset[],
}


function UserViewFruitServingWeekly(props: Props) {
  const [dataset, setDataSet] = useState<FruitData[] | null>(null)
  
  const [labels, setLabels] = useState<string[] | null>(null)
  const [chartData, setChartData] = useState<data | null>(null)
  const [goal, setGoal] = useState<Goal | null>(null)
  const [fruitProgressBar, setFruitProgressBar] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)

  const userIdEl = useRef(null)
  const avatarEl = useRef<string>('')
  const usernameEl = useRef<string>('')
  const profileIdEl = useRef<string>('')
  const credIdEl = useRef<string>('')
  const s3El = useRef<S3Client>(null)
  const viewShotEl = useRef<ViewShot>(null)
  const localImagePathEl = useRef<string>('')
  const activePostEl = useRef<PostRealm>(null)

  const navigation = useNavigation<UserViewFruitServingWeeklyNavigationProp>()

  const { sub } = props

  
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
  }, [((dataset && dataset[(dataset as FruitData[]).length - 1] && dataset[(dataset as FruitData[]).length - 1].servings) || 0), ((goal && goal?.goal))])

  /** get data */
  useEffect(() => {
    const getData = async (userId1: string) => {
      try {
        const newDates = []

        for(let i = 0; i < 7; i++) {
          newDates.push(dayjs().subtract(i, 'd').format('YYYY-MM-DD'))
        }

        const newDatasPromiseArray = newDates.map(async (date) => {

          const datas = await DataStore.query(
            FruitData,
            c => c.userId('eq', `${userId1}`)
              .date('beginsWith', date),
            {
              page: 0,
              limit: 100,
            }
          )

          return datas
        })



        const newDatasArray = await Promise.all(newDatasPromiseArray)

        const newDatas: FruitData[] = []

        for(let i = 0; i < newDatasArray.length; i++) {
          newDatas.concat(newDatasArray[i])
        }

        const newLabels = []

        for(let i = 0; i < 7; i++) {
          newLabels.push(dayjs().subtract(i, 'd').format('ddd'))
        }

        
        let filteredLabels = newLabels;

        newDatas.forEach((v, i) => {
          if (!v) {
            filteredLabels = [
              ...filteredLabels.slice(0, i),
              ...filteredLabels.slice(i + 1)
            ]
          }
        })


        setLabels(filteredLabels)

        setDataSet(newDatas.filter(v => !!v))

      } catch(e) {
        
      }
    }

    if (userIdEl?.current) {
      getData(userIdEl?.current)
    }

  }, [userIdEl?.current])

  /** conform data to chart format*/
  useEffect(() => {
    const conformData = () => {

      if (labels && labels.length > 0 && dataset && dataset.length > 0) {
        const repsDataset = dataset.map((i: FruitData) => i.servings)
          const data: data = {
            labels,
            datasets: [
              {
                data: (repsDataset as number[]) || [0],
              }
            ]
          }

          return setChartData(data)

        }
    }
    if (dataset && dataset.length > 0 && labels && labels.length > 0) {
      conformData()
    }
  }, [dataset, labels])

  /** chart config */
  const chartConfig = {
    fillShadowGradient: palette.purplePrimary,
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
          Daily Progress
        </Text>
        {chartData?.datasets?.length > 0
          ? (
            <ViewShot ref={viewShotEl} options={{ format: "jpg", quality: 0.9 }}>
              <BarChart
                data={(chartData as data)}
                width={useWindowDimensions().width}
                height={useWindowDimensions().width/2}
                yAxisLabel=""
                yAxisSuffix=""
                chartConfig={chartConfig}
              />
            </ViewShot>
          ) : null}
      </Box>
      <Box my={{ phone: 'm', tablet: 'l' }}>
        <Text variant="header">
          Daily Fruit Servings
        </Text>
        <Box>
          {
            fruitProgressBar > 0
            && goal
            && goal?.goal
            ? (
              <Box m={{ phone: 's', tablet: 'm' }} >
                <Box style={{ width: '100%' }} flexDirection="row" justifyContent="space-between">
                  <Text variant="caption">
                    Fruit
                  </Text>
                  {(((dataset as FruitData[])[(dataset as FruitData[]).length - 1]
                    ['servings'] as number) > 0)
                    && goal?.goal && (
                      <Text variant="caption">
                        {`${((dataset as FruitData[])
                        [(dataset as FruitData[]).length - 1]
                        ['servings'] as number)}/${goal?.goal} Servings`
                        }
                      </Text>
                  )}
                </Box>
                <Bar progress={fruitProgressBar} width={200} />
              </Box>
            ) : null
          }
        </Box>
      </Box>
      <Box my={{ phone: 'm', tablet: 'l' }}>
        <Text variant="header">
          Goal
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

export default UserViewFruitServingWeekly
