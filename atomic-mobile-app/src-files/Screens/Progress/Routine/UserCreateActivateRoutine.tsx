import React, { useEffect, useRef } from 'react'
import { Platform } from 'react-native'
import { useNavigation, RouteProp } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { DataStore } from '@aws-amplify/datastore'
import { API, GraphQLResult } from '@aws-amplify/api'
import { v4 as uuid } from 'uuid'
import RNCalendarEvents from 'react-native-calendar-events'
import Toast from 'react-native-toast-message'
import {
  UserActivateType,
  PrimaryGoalType,
  User,
  ExerciseType,
} from '@models'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import RegularCard from '@components/RegularCard'
import Button from '@components/Button'

import GetRoutine from '@graphql/Queries/GetRoutine'

import {
  GetRoutineQuery,
  GetRoutineQueryVariables,
} from '@app/API'
import { palette } from '@theme/theme'



type RootNavigationStackParamList = {
  UserProgressActiveComponents: {
    isUpdate?: string,
  },
  UserCreateActivateRoutine: undefined,
}

type RootRouteStackParamList = {
UserCreateActivateRoutine: {
  name: string,
  activateId?: string,
  routineId: string,
  },
}

type UserCreateActivateRoutineNavigationProp = StackNavigationProp<
  RootNavigationStackParamList,
  'UserCreateActivateRoutine'
>


type UserCreateActivateRoutineRouteProp = RouteProp<RootRouteStackParamList, 'UserCreateActivateRoutine'>;

type Props = {
  sub: string,
  route: UserCreateActivateRoutineRouteProp,
}


const rescapeUnsafe = (safe: string) => safe
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#039;/g, '\'')
  .replace(/-/gi, ' ')

const escapeUnsafe = (unsafe: string) => unsafe
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;')
  .replace(/ /gi, '-')

const ATOMICCALENDARNAME = 'Atomic Calendar'

const getExerciseType = (value: ExerciseType) => {
  switch(value) {
    case ExerciseType.REPS:
      return PrimaryGoalType.ENDURANCE
    case ExerciseType.MINUTES:
      return PrimaryGoalType.ENDURANCE
    case ExerciseType.DISTANCE:
      return PrimaryGoalType.ENDURANCE
    case ExerciseType.KILOS:
      return PrimaryGoalType.STRENGTH
    case ExerciseType.POUNDS:
      return PrimaryGoalType.STRENGTH
  }
}

function UserCreateActivateRoutine(props: Props) {

  const userIdEl = useRef<string>(null)
  const calendarEventIdEl = useRef<string>('')


  const name = props?.route?.params?.name
  const sub = props?.sub
  const activateId = props?.route?.params?.activateId
  const routineId = props?.route?.params?.routineId

  const navigation = useNavigation<UserCreateActivateRoutineNavigationProp>()

  useEffect(() => {
    (async () => {
      try {
        if (!sub) {
          return
        }
        const userData = await DataStore.query(User, c => c.sub('eq', sub), {
          page: 0,
          limit: 1,
        })

        if (userData?.length > 0) {
          const [user] = userData
          userIdEl.current = user.id
        }
      } catch(e) {
      }
    })()
  }, [sub])

  useEffect(() => {
    (async () => {
      const oldStatus = await RNCalendarEvents.checkPermissions()
      let status
      if (oldStatus !== 'authorized') {
        const newStatus = await RNCalendarEvents.requestPermissions();

        status = newStatus
      }

      if (status === 'authorized' || oldStatus === 'authorized') {
        const newCalendars = await RNCalendarEvents.findCalendars();

        const atomicCalendars = newCalendars?.filter(each => each.title === ATOMICCALENDARNAME)

        if (atomicCalendars && atomicCalendars?.length > 0) {
          calendarEventIdEl.current = atomicCalendars[0].id
          return
        }

        const defaultCalendarSource = Platform.OS === 'ios'
          ? newCalendars?.filter(each => each?.source === 'Default')?.[0]?.source
          : { isLocalAccount: true, name: ATOMICCALENDARNAME, type: '' }

          const newCalendarId = Platform.OS === 'ios' ? await RNCalendarEvents.saveCalendar({
            title: ATOMICCALENDARNAME,
            color: palette['purple'],
            entityType: 'event',
            source: undefined,
            name: ATOMICCALENDARNAME,
            ownerAccount: 'personal',
            accessLevel: 'owner',
          }) : await RNCalendarEvents.saveCalendar({
            title: ATOMICCALENDARNAME,
            color: palette['purple'],
            entityType: 'event',
            source: defaultCalendarSource as { isLocalAccount: boolean; name: string; type: string; },
            name: ATOMICCALENDARNAME,
            ownerAccount: 'personal',
            accessLevel: 'owner',
          })
          calendarEventIdEl.current = newCalendarId
      } else {
        Toast.show({
          type: 'error',
          text1: 'Need Calendar Access',
          text2: 'Task Reminder works by setting reminders in your calendar and thus needs access to remind you of breaks and active time'
        })
      }
    })();
  }, [])

  const checkAvailability = async (value: string) => {
    try {
      const activeComponent = await DataStore.query(UserActivateType, c => c.userId('eq', sub)
      .primaryGoalType('eq', PrimaryGoalType.ROUTINE)
      .secondaryGoalType('eq', value)
      .activated('eq', true))

      if (activeComponent && activeComponent.length > 0) {
        return false
      }
      return true
    } catch(e) {
    }
  }








  const getRoutine = async () => {
    try {
      if (!routineId) {
        
        return
      }

      const getRoutineData = await API
        .graphql({
          query: GetRoutine,
          variables: {
            id: routineId,
          } as GetRoutineQueryVariables
        }) as GraphQLResult<GetRoutineQuery>

      const routine = getRoutineData?.data?.getRoutine

      

      return routine
    } catch(e) {
      
    }
  }

  const getExerciseUserActivateType = async (
    type: ExerciseType,
    secondaryGoalName: string,
  ) => {
    try {
      const exerciseActivateDatas = await DataStore.query(
        UserActivateType,
        c => c.primaryGoalType('eq', getExerciseType(type))
          .secondaryGoalType('eq', escapeUnsafe(secondaryGoalName))
      )

      const exerciseActivateType = exerciseActivateDatas?.[0]
      
      return exerciseActivateType
    } catch(e) {
      
    }
  }

  const activateExerciseType = async (exerciseActivateId: string) => {
    try {
      if (!exerciseActivateId) {
        
        return
      }

      const original = await DataStore.query(UserActivateType, exerciseActivateId)

      const updatedComponent = await DataStore.save(
        UserActivateType.copyOf(
          original, updated => {
            if (!(original?.activated)) {
              updated.activated = true
            }

          }
        )
      )
      
    } catch(e) {
      
    }
  }

  const createExerciseType = async (
    type: ExerciseType,
    secondaryGoalName: string,
    exerciseId: string,
  ) => {
    try {
      const exerciseType = await DataStore.save(
        new UserActivateType({
          userId: userIdEl?.current,
          primaryGoalType: getExerciseType(type),
          secondaryGoalType: escapeUnsafe(secondaryGoalName),
          secondaryGoalName: secondaryGoalName,
          activated: true,
          exerciseId,
        })
      )

      

    } catch(e) {
      
    }
  }

  const createNewActiveComponent = async (): Promise<null | undefined> => {
    try {

      const isAvailable = await checkAvailability(name)

      if (!isAvailable) {
        Toast.show({
          type: 'error',
          text1: 'Not available',
          text2: `You have already activated ${name} component`
        })

        return
      }


      const routine = await getRoutine()

      
      const exerciseRoutines = routine?.exercises?.items

      if (!(exerciseRoutines?.[0]?.id)) {
        
        return
      }

      const exerciseActivatePromises = exerciseRoutines.map(async (item) => {
          return getExerciseUserActivateType(
            item?.exercise?.type,
            item?.exercise?.name,
          )
      })

      const exerciseActivateTypes = await Promise.all(exerciseActivatePromises)

      const exerciseActivatedPromises = exerciseActivateTypes.map(async (item, index) => {
        try {
          if (!(item?.id)) {
            return createExerciseType(
              exerciseRoutines?.[index]?.exercise?.type,
              exerciseRoutines?.[index]?.exercise?.name,
              exerciseRoutines?.[index]?.exerciseId,
            )
          } else {
            return activateExerciseType(item.id)
          }
        } catch(e) {
          
        }
      })

      const exerciseTypesActivated = await Promise.all(exerciseActivatedPromises)

      

      if (activateId) {
        const original = await DataStore.query(UserActivateType, activateId)

        const updatedComponent = await DataStore.save(
          UserActivateType.copyOf(
            original, updated => {
              updated.activated = true
            }
          )
        )

        
      } else {

        const userActivateComponent = new UserActivateType({
          userId: userIdEl?.current,
          primaryGoalType: PrimaryGoalType.ROUTINE,
          secondaryGoalType: escapeUnsafe(name),
          secondaryGoalName: name,
          activated: true,
          routineId,
        })

        const componentActivated = await DataStore.save(userActivateComponent)
        
      }

      Toast.show({
            type: 'success',
            text1: 'Component activated',
            text2: `You have activated ${name} component 🙌`
         });

       navigation.navigate('UserProgressActiveComponents', {
         isUpdate: uuid(),
       })

    } catch(e) {

      
      Toast.show({
            type: 'error',
            text1: `Something went wrong`,
            text2: `Please try again later`
         });
    }
  }





  return (
    <Box flex={1} justifyContent="center" alignItems="center">
      <Box my={{ phone: 's', tablet: 'm'}}>
        <RegularCard>
          {name ? (
            <Text variant="subheader">
              {`${rescapeUnsafe(name)}`}
            </Text>
          ) : null}
          <Box m={{ phone: 's', tablet: 'm' }}>
            <Button onPress={createNewActiveComponent}>
              Confirm Activate
            </Button>
          </Box>
        </RegularCard>
      </Box>
    </Box>
  )

}

export default UserCreateActivateRoutine
