import React, { useState, useEffect, useRef } from 'react';
import { useWindowDimensions } from 'react-native'
import { DataStore, SortDirection} from '@aws-amplify/datastore'
import { dayjs, RNLocalize } from '@app/date-utils'

import { LineChart } from 'react-native-chart-kit'
import { Bar } from 'react-native-progress'
import RNFS from 'react-native-fs'
import { S3Client } from '@aws-sdk/client-s3'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import Toast from 'react-native-toast-message'

import Spinner from 'react-native-spinkit'
import { Buffer } from '@craftzdog/react-native-buffer'
import {
  GenericExerciseData, Goal, User,
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
  UserViewExercise3Months: undefined,
}

type UserViewExercise3MonthsNavigationProp = StackNavigationProp<
  RootStackParamList,
  'UserViewExercise3Months'
>

interface Dataset {
  /** The data corresponding to the x-axis label. */
  data: number[];

  /** A function returning the color of the stroke given an input opacity value. */
  color?: (opacity: number) => string;

  /** A function returning array of the colors of the stroke given an input opacity value for each data value. */
  colors?: Array<(opacity: number) => string>;

  /** The width of the stroke. Defaults to 2. */
  strokeWidth?: number;

  /** A boolean indicating whether to render dots for this line */
  withDots?: boolean;

  /** Override of LineChart's withScrollableDot property just for this dataset */
  withScrollableDot?: boolean;
}


type Props = {
  sub: string,
}

type data = {
  labels: string[],
  datasets: Dataset[],
}


function UserViewExercise3Months(props: Props) {
  const [dataset, setDataSet] = useState<GenericExerciseData[] | null>(null)
  // const [userId, setUserId] = useState<string | null>(null)
  const [labels, setLabels] = useState<string[] | null>(null)
  const [chartData, setChartData] = useState<data | null>(null)
  const [goal, setGoal] = useState<Goal | null>(null)
  const [exerciseProgressBar, setExerciseProgressBar] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)

  const userIdEl  = useRef(null)
  const avatarEl = useRef<string>('')
  const usernameEl = useRef<string>('')
  const profileIdEl = useRef<string>('')
  const credIdEl = useRef<string>('')
  const s3El = useRef<S3Client>(null)
  const viewShotEl = useRef<ViewShot>(null)
  const localImagePathEl = useRef<string>('')
  const activePostEl = useRef<PostRealm>(null)

  const navigation = useNavigation<UserViewExercise3MonthsNavigationProp>()

  const { sub } = props

  // close realm
  useEffect(() => {
    return () => {
      // closeRealm()
    }
  }, [])

  // get s3 and credId
  useEffect(() => {
    getS3AndCredId(s3El, credIdEl)
    // getS3();
  }, []);

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
          // 
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
          // setUserId(id)
          userIdEl.current = id
        }
      } catch (e) {
        // 
      }
    }

    if (sub) {
      getUserId()
    }
  }, [sub])

  // get Goal
  useEffect(() => {
    const getExerciseGoal = async (userId1: string) => {
      try {

        const goals = await DataStore.query(Goal, c => c.userId('eq', userId1)
        .date('beginsWith', dayjs().format('YYYY'))
        .status('eq', Status.ACTIVE)
        .primaryGoalType('eq', PrimaryGoalType.GENERICEXERCISE), {
          page: 0,
          limit: 1,
          sort: s => s.date(SortDirection.DESCENDING),
        })

        const goals1 = await DataStore.query(
          Goal,
          c => c.userId('eq', userId1)
            .date('beginsWith', dayjs().subtract(1, 'y').format('YYYY'))
            .status('eq', Status.ACTIVE)
            .primaryGoalType('eq', PrimaryGoalType.GENERICEXERCISE),
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
        // 
      }
    }
    if (userIdEl?.current) {
      getExerciseGoal(userIdEl?.current);
    }
  }, [userIdEl?.current])

  // update exerciseProgress
  useEffect(() => {
    const updateGenericExerciseProgressBar = () => {
      const currentGoal = goal?.goal as string
      const newGenericExerciseProgressBar: number = (((dataset as GenericExerciseData[])[(dataset as GenericExerciseData[]).length - 1]['minutes'] as number) > parseFloat(currentGoal))
        ? 1
        : (math.chain(((dataset as GenericExerciseData[])[(dataset as GenericExerciseData[]).length - 1]['minutes'] as number)).divide(parseFloat(currentGoal)).done())

      setExerciseProgressBar(newGenericExerciseProgressBar)
    }
    if (dataset && dataset.length > 0 && goal?.goal) {
      updateGenericExerciseProgressBar()
    }
  }, [dataset?.length, goal?.goal])

  /** get data */
  useEffect(() => {
    const getData = async (userId1: string) => {
      try {
        const newDates = []

        for(let i = 90; i >= 0; i - 3) {
          newDates.push(dayjs().subtract(i, 'd').format('YYYY-MM-DD'))
        }

        const newDatasPromiseArray = newDates.map(async (date) => {

          const datas = await DataStore.query(
            GenericExerciseData,
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

        const newDatas: GenericExerciseData[] = []

        for(let i = 0; i < newDatasArray.length; i++) {
          newDatas.concat(newDatasArray[i])
        }

        const newLabels = []

        for(let i = 90; i >= 0; i - 3) {
          newLabels.push(dayjs().subtract(i, 'd').format('ddd'))
        }

        // remove null values
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
        // 
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
        const repsDataset = dataset.map((i: GenericExerciseData) => i.minutes)
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

  const chartConfig = {
    // fillShadowGradient: palette.purplePrimary,
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
      // base64 image string
      const base64ImageString = await RNFS.readFile(localImagePathEl?.current, 'base64')

      // Getting the file type, ie: jpeg, png or gif
      // const type = base64ImageString.split(';')[0].split('/')[1]

      // Let's assume the variable "base64" is one.
      const base64Data = Buffer.from(base64ImageString.replace(/^data:image\/\w+;base64,/, ""), 'base64')

      if (activePostEl?.current?.id) {
        // upload file
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
      // 
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
      // 
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
          3 Month Progress
        </Text>
        {chartData?.datasets?.length > 0
          ? (
            <ViewShot ref={viewShotEl} options={{ format: "jpg", quality: 0.9 }}>
              <LineChart
                data={(chartData as data)}
                width={useWindowDimensions().width}
                height={useWindowDimensions().width/2}
                yAxisLabel=""
                yAxisSuffix=""
                chartConfig={chartConfig}
                bezier
              />
            </ViewShot>
          ) : null}
      </Box>
      <Box my={{ phone: 'm', tablet: 'l' }}>
        <Text variant="header">
          Daily Exercise
        </Text>
        <Box>
          {
            exerciseProgressBar > 0
            && goal?.goal
            ? (
              <Box m={{ phone: 's', tablet: 'm' }} >
                <Box style={{ width: '100%' }} flexDirection="row" justifyContent="space-between">
                  <Text variant="caption">
                    Exercise
                  </Text>
                  {(((dataset as GenericExerciseData[])[(dataset as GenericExerciseData[]).length - 1]
                    ['minutes'] as number) > 0)
                    && goal?.goal ? (
                      <Text variant="caption">
                        {`${((dataset as GenericExerciseData[])
                        [(dataset as GenericExerciseData[]).length - 1]
                        ['minutes'] as number)}/${goal?.goal} Minutes`
                        }
                      </Text>
                    ) : null}
                </Box>
                <Bar progress={exerciseProgressBar} width={200} />
              </Box>
            ) : null
          }
        </Box>
      </Box>
      <Box my={{ phone: 'm', tablet: 'l' }}>
        <Text variant="header">
          Goal Exercise
        </Text>
        {
          goal
          && goal.goal
          && (goal.status === Status.ACTIVE)
          ? (
            <Box flexDirection="row" justifyContent="flex-start" alignItems="center">
              <Text variant="caption" style={{ textAlign: 'center', fontSize: 48, color: palette.purplePrimary }}>
                {"??? "}
              </Text>
              <Text variant="caption">
                {`${goal.goal} Minutes`}
              </Text>
            </Box>
          ) : null
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


export default UserViewExercise3Months
