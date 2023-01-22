import React, { useEffect, useRef } from 'react'
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
  User,
} from '@models'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import RegularCard from '@components/RegularCard'
import Button from '@components/Button'



type RootStackNavigationParamList = {
  UserProgressActiveComponents: {
    isUpdate?: string,
  },
  UserCreateActivateWeight: undefined,
}

type RootRouteStackParamList = {
  UserCreateActivateWeight: {
    activateId: string,
  }
}

type UserCreateActivateWeightRouteProp = RouteProp<
  RootRouteStackParamList,
  'UserCreateActivateWeight'
>

type UserCreateActivateWeightNavigationProp = StackNavigationProp<
  RootStackNavigationParamList,
  'UserCreateActivateWeight'
>


type Props = {
  route: UserCreateActivateWeightRouteProp,
  sub: string,
}


const ATOMICCALENDARNAME = 'Atomic Calendar'


function UserCreateActivateWeight(props: Props) {

  const userIdEl = useRef<string>(null)
  const calendarEventIdEl = useRef<string>('')

  const { sub } = props

  const activateId = props?.route?.params?.activateId

  const navigation = useNavigation<UserCreateActivateWeightNavigationProp>()

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

        if (atomicCalendars && atomicCalendars?.[0]?.title) {
          
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
      .primaryGoalType('eq', PrimaryGoalType.WEIGHT)
      .secondaryGoalType('eq', value)
      .activated('eq', true))

      if (activeComponent && activeComponent.length > 0) {
        return false
      }
      return true
    } catch(e) {
      
    }
  }







  const createNewActiveComponent = async (): Promise<undefined | null> => {
    try {
      const isAvailable = await checkAvailability('null')

      if (!isAvailable) {
        Toast.show({
          type: 'error',
          text1: 'Not available',
          text2: `You have already activated step component`
        })

        return
      }


      const original = await DataStore.query(UserActivateType, activateId)

      const updatedComponent = await DataStore.save(
        UserActivateType.copyOf(
          original, updated => {
            updated.activated = true
          }
        )
      )

      

      Toast.show({
            type: 'success',
            text1: 'Component activated',
            text2: `You have activated Weight Component 🙌`
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
          <Box my={{ phone: 's', tablet: 'm'}}>
            <Text variant="subheader">
              Weight
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

export default UserCreateActivateWeight
