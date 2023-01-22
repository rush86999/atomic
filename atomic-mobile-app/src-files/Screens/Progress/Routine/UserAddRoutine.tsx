import React, { useState, useEffect, useRef } from 'react'
import { DataStore, SortDirection} from '@aws-amplify/datastore'
import { API, GraphQLResult } from '@aws-amplify/api'
import { dayjs } from '@app/date-utils'
import Toast from 'react-native-toast-message';
import {
  Constants,
  Spacings,
  Carousel,
} from 'react-native-ui-lib'
import { useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import {
  User, ExerciseType,
  Status, PrimaryGoalType, Point, UserProfile,
  Schedule, Exercise, RoutineData,
} from '@models'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import * as math from 'mathjs'

import {
  getRoutine as GetRoutine,
  getExercise as GetExercise,
} from '@graphql/queries'

import {
  GetRoutineQuery,
  GetRoutineQueryVariables,
  GetExerciseQuery,
  GetExerciseQueryVariables,
} from '@app/API'

import {
  UserProfile as UserProfileRealm,
} from '@realm/UserProfile'

import UserAddEnduranceMini from './UserAddEnduranceMini'
import UserAddStrengthMini from './UserAddStrengthMini'
import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { getRoutine } from '../../../graphql/queries';
import { getEventWithId } from '@app/calendar/calendarDbHelper';





const rescapeUnsafe = (safe: string) => safe
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#039;/g, '\'')
  .replace(/-/gi, ' ');

  type RootStackParamList = {
  UserAddRoutine: { routineId: string },
  UserFindRoutine: { sub: string },
};

  type UserAddRoutineNavigationProp = StackNavigationProp<
    RootStackParamList,
    'UserAddRoutine'
  >

  type UserAddRoutineProp = RouteProp<RootStackParamList, 'UserAddRoutine'>;

    type Props = {
      sub: string,
      route: UserAddRoutineProp,
      getRealmApp: () => Realm,
      client: ApolloClient<NormalizedCacheObject>
    }

    // route.params will have values needed

function UserAddRoutine(props: Props) {

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  // const [point, setPoint] = useState<Point | null>(null)
  const [exercises, setExercises] = useState<Exercise[] | []>([])
  /** submitted count */

  const [numberOfPagesShown, setNumberOfPagesShown] = useState<number>(0)

  const [userId, setUserId] = useState<string | null>(null)

  const { route: { params: { routineId } }, sub, getRealmApp } = props

  const realm = getRealmApp()
  const client = props?.client

  const navigation = useNavigation<UserAddRoutineNavigationProp>();

  const carousel = useRef<typeof Carousel | null>(null)
  const routineDataEl = useRef<RoutineData>(null)
  const pointRewardEl = useRef<number>(null)
  const pointEl = useRef<Point>(null)
  const profileIdEl = useRef<string>(null)
  const userProfileEl = useRef<UserProfile>(null)
  const userIdEl = useRef<string>(null)
  const submittedCountEl = useRef<number>(0)
  const submittedArrayEl = useRef<boolean[]>([])

  /** change carousel width based on orientation */
  const getWidth = () => {
    return Constants.windowWidth - Spacings.s5 * 2;
  };

  const [width, setWidth] = useState<number>(getWidth())



  const onPagePress = (index: number) => {
    if (carousel && carousel.current) {
      carousel.current.goToPage(index, true);
    }
  };

  /** get exercises */
  useEffect(() => {
    const getExerciseData = async (exerciseRoutines: GetRoutineQuery['getRoutine']['exercises']['items']) => {
      try {
        const exercisePromises = exerciseRoutines.map(async (item: any) => {
          try {
            // return DataStore.query(Exercise, item?.exerciseId)
            const exerciseObject = await API.
              graphql({
                query: GetExercise,
                variables: {
                  id: item?.exerciseId,
                } as GetExerciseQueryVariables,
              }) as GraphQLResult<GetExerciseQuery>

            

            const newExercise = exerciseObject?.data?.getExercise

            if (newExercise) {
              return newExercise
            }

            return null
          } catch(e) {
            
          }
        })

        const exerciseData = (await Promise.all(exercisePromises))
          .filter(item => (item !== null))

        return exerciseData
      } catch(e) {
        // 
        return null
      }
    }
    const getExerciseRoutineData = async () => {
      try {
        
        if (routineId) {

          
          const routineData = await API
            .graphql({
              query: getRoutine,
              variables: {
                id: routineId,
              } as GetRoutineQueryVariables,
            }) as GraphQLResult<GetRoutineQuery>

          const routineExercises = routineData?.data?.getRoutine?.exercises?.items

          

          if (routineExercises?.length > 0) {

            const exerciseData = await getExerciseData(routineExercises)

            if (exerciseData && exerciseData as typeof exerciseData && exerciseData.length > 0) {
                const newExerciseData = exerciseData as unknown as Exercise[]

                /** create submittedArray length */
                const newSubmittedArray = newExerciseData.map(() => false)
                setExercises(newExerciseData)
                // setSubmittedArray(newSubmittedArray)
                submittedArrayEl.current = newSubmittedArray
                setNumberOfPagesShown(newExerciseData.length)
            }

          }
        }

      } catch(e) {
        
      }
    }
    getExerciseRoutineData()
  }, [routineId])


  useEffect(() => {
    const getPointReward = async () => {
      try {
        const userData = await DataStore.query(User, c => c.sub('eq', sub), {
          page: 0,
          limit: 1,
        })

        if (userData && userData.length > 0) {
          const { id } = userData[0]
          setUserId(id)
          userIdEl.current = id
          // check if schedule available and adjust PointSystem accordingly
          const scheduleDatas = await DataStore.query(Schedule, c => c.userId('eq', id)
            .date('beginsWith', dayjs().format('YYYY'))
            .status('eq', Status.ACTIVE)
            .primaryGoalType('eq', PrimaryGoalType.ROUTINE))
          const event = await getEventWithId(client, scheduleDatas?.[0]?.eventId)
          if (scheduleDatas?.length > 0
            && (event?.endDate
              && dayjs().isAfter(dayjs(event?.endDate))
              || !(event?.endDate)
            )) {

              pointRewardEl.current = 2

          } else {

              pointRewardEl.current = 1

          }
        }
      } catch (e) {
        // 
      }
    }
    getPointReward()
  }, [sub])

  // get userProfileId
  useEffect(() => {
    const getUserProfileRealm = async () => {
      const userProfiles = realm.objects<UserProfileRealm>('UserProfile')
      if (!(userProfiles?.[0]?.id)) {
        
      } else {
        const [profile] = userProfiles
        profileIdEl.current = profile?.id
        
        const original = await DataStore.query(User, profile?.userId)

        const updatedUser = await DataStore.save(
          User.copyOf(
            original, updated => {
              updated.profileId = profile?.id
            }
          )
        )

        
      }
    }
    const getProfileId = async (userId: string) => {
      try {
        const userData = await DataStore.query(User, userId)

        if (userData && userData.profileId) {
          const profileIdData = userData.profileId

          if ((profileIdData !== 'null') && profileIdData) {
            // setProfileId(profileIdData)
            profileIdEl.current = profileIdData
          } else {
            await getUserProfileRealm()
          }
        }
      } catch (e) {
          
      }
    }
    if (userIdEl.current) {
      getProfileId(userIdEl.current)
    }
  }, [userId])

  // get userProfile
  useEffect(() => {
    const getUserProfile = async () => {
      try {
        // const getProfileData = await DataStore.query(UserProfile, profileIdEl?.current)

        const profileDatas = realm.objects<UserProfileRealm>('UserProfile')

        if (!(profileDatas?.length > 0)) {
          return
        }

        const [getProfileData] = profileDatas

        if (getProfileData?.pointId) {

          setUserProfile(getProfileData)
          userProfileEl.current = getProfileData
        }

      } catch (e) {
        // 
      }
    }
    getUserProfile()
  }, [])

  // getPoint
  useEffect(() => {
    const getPoint = async () => {
      try {

        if (userProfileEl?.current?.pointId) {
          const pointData = await DataStore.query(Point, userProfileEl?.current?.pointId)
          if (pointData?.id) {
            // setPoint(pointData)
            pointEl.current = pointData
          }
        }
      } catch (e) {
        // 
      }
    }
    getPoint()
  }, [userProfile?.pointId])

  // get already registered strengthData if any
  useEffect(() => {
    const getRoutineData = async (userId1: string) => {
      try {
         const routineDatas = await DataStore.query(RoutineData, (c) => c.userIdType('eq', `${userId1}#${routineId}`), {
           sort: s => s.date(SortDirection.DESCENDING),
           page: 0,
           limit: 1,
         })

        if (routineDatas && routineDatas[0] && routineDatas[0].id) {
          const { date } = routineDatas[0]

          if (dayjs(date).isSameOrAfter(dayjs().hour(0))) {
            // const { id } = routineDatas[0]
            // setRoutineDataId(id)
            routineDataEl.current = routineDatas[0]
          }
        }
      } catch (e) {
        
      }
    }
    if (userIdEl?.current) {
      getRoutineData(userIdEl?.current)
    }
  }, [userId])


  // update userPoint
  const updateUserPoint = async () => {
    try {
      if (pointEl?.current?.currentDate) {
        /** must not update if routine data already exists
        as points are already added */
          if (!routineDataEl?.current?.id) {
            if (dayjs(pointEl?.current.currentDate).format('YYYY-MM-DD') !== dayjs().format('YYYY-MM-DD')) {

              const updatedPoint = await DataStore.save(
                Point.copyOf(
                  pointEl?.current, updated =>  {

                    /** cannot update min and max until next day as a background task
                    unable to update */
                    /** update max min based on previous values */
                    if (typeof (pointEl?.current.currentPoints) === 'number') {

                      if (!(typeof (pointEl?.current?.max) === 'number')) {
                        updated.max = pointEl?.current.currentPoints
                        updated.maxDate = pointEl?.current.currentDate || dayjs().format()

                      } else if ((pointEl?.current?.max) < (pointEl?.current.currentPoints)) {
                        updated.max = pointEl?.current.currentPoints || 0
                        updated.maxDate = pointEl?.current.currentDate || dayjs().format()

                      }

                      if (!(typeof (pointEl?.current?.min) === 'number')) {
                        updated.min = pointEl?.current.currentPoints
                        updated.minDate = pointEl?.current.currentDate || dayjs().format()

                      } else if ((pointEl?.current?.currentPoints) < (pointEl?.current?.min)) {
                        updated.min = pointEl?.current.currentPoints || 0
                        updated.minDate = pointEl?.current.currentDate || dayjs().format()

                      }

                     }

                     if (!(typeof pointEl?.current.points === 'number') && !(typeof (pointEl?.current?.currentPoints) === 'number')) {
                       // do nothing
                       
                     } else if ((typeof (pointEl?.current?.currentPoints) === 'number') && !(typeof (pointEl?.current.points) === 'number')) {
                       
                     } else if (!(typeof (pointEl?.current?.currentPoints) === 'number') && typeof (pointEl?.current.points) === 'number') {

                       

                     } else {
                       const newValue = math.chain(pointEl?.current.points).add((pointEl?.current?.currentPoints)).done()
                       // set currentValue to today's value
                       updated.currentPoints = pointRewardEl.current
                       updated.points = newValue
                     }

                    updated.currentDate = dayjs().format()

                    updated.currentPoints = pointRewardEl.current

                    updated.currentDate = dayjs().format()


                    if (!(typeof (pointEl?.current.dayCount) === 'number')) {
                      updated.dayCount = 1
                      
                    } else {
                      const newDayCount = math.chain(pointEl?.current.dayCount).add(1).done()
                      updated.dayCount = newDayCount
                    }
                  }
                )
              )
              
            }
          }
      } else {

        if (!(pointEl?.current)) {
          
          return
        }

        
        const updatedPoint = await DataStore.save(
          Point.copyOf(
            pointEl?.current, updated =>  {

              updated.currentDate = dayjs().format()

              updated.currentPoints = pointRewardEl.current

              updated.currentDate = dayjs().format()


              if (!(typeof (pointEl?.current.dayCount) === 'number')) {
                updated.dayCount = 1
                
              } else {
                const newDayCount = math.chain(pointEl?.current.dayCount).add(1).done()
                updated.dayCount = newDayCount
              }
            }
          )
        )
        
      }
    } catch (e) {
      
    }
  }

  const addToSubmittedCount = () => (submittedCountEl.current += 1)

  const createRoutineData = async () => {
    if (exercises.length !== (submittedCountEl?.current)) {
      const notSubmittedIndex = submittedArrayEl?.current?.findIndex(item => item === false)
      Toast.show({
            type: 'error',
            text1: `Missing info`,
            text2: `You did not save ${exercises[notSubmittedIndex].name}`
         });

        return
    }
    try {
      if (!(routineDataEl?.current?.id) && routineId) {


        const getRoutineData = await API.
          graphql({
            query: GetRoutine,
            variables: {
              id: routineId,
            } as GetRoutineQueryVariables,
          }) as GraphQLResult<GetRoutineQuery>

          const routine = getRoutineData?.data?.getRoutine

        if (routine?.name && userIdEl?.current) {

          const routineData = new RoutineData({
            date: dayjs().format(),
            userId: userIdEl?.current,
            type: routine?.name,
            userIdType: `${userIdEl?.current}#${routine?.name}`,
            ttl: dayjs().add(1, 'y').unix(),
          })
          await DataStore.save(
            routineData
          )

          await updateUserPoint()

          Toast.show({
                type: 'success',
                text1: `${rescapeUnsafe(routine.name)} recorded`,
                text2: `You are awarded ${pointRewardEl?.current} points! 🙌`
             })

          routineDataEl.current = routineData

        }
      }
    } catch (e) {
      Toast.show({
            type: 'error',
            text1: 'Oops...',
            text2: `Something went wrong 🤭`
         });
      }
  }

  const updateSubmittedArray = async (index: number) => {

    if (!submittedArrayEl?.current[index]) {
      const newSubmittedArray = [
        ...submittedArrayEl?.current.slice(0, index),
        true,
        ...submittedArrayEl?.current.slice(index + 1)
      ]

      submittedArrayEl.current = newSubmittedArray
      addToSubmittedCount()
      try {
        if (exercises.length === submittedCountEl?.current) {
          await createRoutineData()
        }
      } catch(e) {
        
      }
    }
  }


  return (
    <Box flex={1} justifyContent="center" alignItems="center">
      <Carousel
        key={numberOfPagesShown}
        ref={carousel}
        pageWidth={width}
        itemSpacings={Spacings.s3}
        containerMarginHorizontal={Spacings.s2}
        initialPage={0}
        containerStyle={{height: 'auto'}}
        pageControlPosition={Carousel.pageControlPositions.UNDER}
        pageControlProps={{onPagePress}}
        allowAccessibleLayout
        >
      {
        exercises?.[0]?.id
        ?
        (exercises as Exercise[]).map((item, index) => (
          <Box my={{ phone: 's', tablet: 'm' }}>
            {
              ((item.type === ExerciseType.POUNDS)
              || (item.type === ExerciseType.KILOS))
              ? (
                  <UserAddStrengthMini
                    client={client}
                  sub={sub}
                  type={item.name}
                  updateSubmittedArray={updateSubmittedArray}
                  index={index}
                  getRealmApp={getRealmApp}
                />
              ) : (
                  <UserAddEnduranceMini
                    client={client}
                  sub={sub}
                  type={item.name}
                  updateSubmittedArray={updateSubmittedArray}
                  index={index}
                  getRealmApp={getRealmApp}
                />
              )
            }
          </Box>
        )) : (
          <Box my={{ phone: 's', tablet: 'm' }}>
            <Text variant="caption">
              Add a routine to get started
            </Text>
          </Box>
        )
      }
      </Carousel>
    </Box>
  )
}

export default UserAddRoutine
