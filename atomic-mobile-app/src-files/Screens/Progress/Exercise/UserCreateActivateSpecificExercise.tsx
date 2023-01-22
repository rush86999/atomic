import React, { useState, useEffect, useRef } from 'react'
import { Platform } from 'react-native'
import { useNavigation, RouteProp } from '@react-navigation/native'

import { StackNavigationProp } from '@react-navigation/stack'
import { DataStore } from '@aws-amplify/datastore'
import { v4 as uuid } from 'uuid'
import RNCalendarEvents from 'react-native-calendar-events'
import Toast from 'react-native-toast-message'

import {
  UserActivateType,
  PrimaryGoalType,
  Day, 
  User,
} from '@models'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import RegularCard from '@components/RegularCard'

import Button from '@components/Button'

type RootRouteStackParamList = {
  UserCreateActivateSpecificExercise: {
    name: string,
    goalType: PrimaryGoalType,
    exerciseId: string,
    activateId?: string,
  },
}

type RootNavigationStackParamList = {
  UserProgressActiveComponents: {
    isUpdate?: string,
  },
  UserCreateActivateSpecificExercise: undefined,
}

type UserCreateActivateSpecificExerciseNavigationProp = StackNavigationProp<
  RootNavigationStackParamList,
  'UserCreateActivateSpecificExercise'
>

type UserCreateActivateSpecificExerciseRouteProp = RouteProp<RootRouteStackParamList, 'UserCreateActivateSpecificExercise'>


type Props = {
  sub: string,
  route: UserCreateActivateSpecificExerciseRouteProp,
}


const escapeUnsafe = (unsafe: string) => unsafe
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;')
  .replace(/ /gi, '-');

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

const ATOMICCALENDARNAME = 'Atomic Calendar'

function UserCreateActivateSpecificExercise(props: Props) {
  const [activeIndex, setActiveIndex] = useState<number>(0)
  const [completedStep, setCompletedStep] = useState<number | undefined>()

  const userIdEl = useRef(null)
  const calendarEventIdEl = useRef<string>('')

  const name = props?.route?.params?.name
  const goalType = props?.route?.params?.goalType
  const exerciseId = props?.route?.params?.exerciseId
  const activateId = props?.route?.params?.activateId
  const sub = props?.sub


  const navigation = useNavigation<UserCreateActivateSpecificExerciseNavigationProp>()

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
      .primaryGoalType('eq', goalType)
      .secondaryGoalType('eq', value)
      .activated('eq', true))

      if (activeComponent && activeComponent.length > 0) {
        return false
      }
      return true
    } catch(e) {
      
    }
  }







  const createNewActiveComponent = async () => {
    try {

      const isAvailable = await checkAvailability(name)

      if (!isAvailable) {
        Toast.show({
          type: 'error',
          text1: 'Not available',
          text2: `You have already activated ${capitalizeFirstLetter(name)} component`
        })

        return
      }


      if (activateId) {
        const original = await DataStore.query(UserActivateType, activateId)


        
      } else {

        const userActivateComponent = new UserActivateType({
          userId: userIdEl?.current,
          primaryGoalType: goalType,
          secondaryGoalType: escapeUnsafe(name),
          secondaryGoalName: name,
          activated: true,
          exerciseId,
        })

        await DataStore.save(userActivateComponent)
      }

      Toast.show({
            type: 'success',
            text1: 'Component activated',
            text2: `You have activated ${rescapeUnsafe(capitalizeFirstLetter(name))} component 🙌`
         })

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
          <Box my={{ phone: 's', tablet: 'm'}}>
            <Text variant="subheader">
              {name}
            </Text>
          </Box>
          <Button onPress={createNewActiveComponent}>
            Confirm Activate
          </Button>
        </RegularCard>
      </Box>
    </Box>
  )
}


export default UserCreateActivateSpecificExercise
