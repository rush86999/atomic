import React, { useState, useEffect, useRef } from 'react'
import { Platform } from 'react-native'
import { useNavigation, RouteProp } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { DataStore } from '@aws-amplify/datastore'
import { v4 as uuid } from 'uuid'
import RNCalendarEvents from 'react-native-calendar-events'
import Toast from 'react-native-toast-message'
import { TextField } from 'react-native-ui-lib'

import {
  UserActivateType,
  PrimaryGoalType,
  User,
} from '@models'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import RegularCard from '@components/RegularCard'
import Button from '@components/Button'



type RootNavigationStackParamList = {
  UserProgressActiveComponents: {
    isUpdate?: string,
  },
  UserCreateActivateLimit: undefined,
}

type RootRouteStackParamList = {
  UserCreateActivateLimit: {
    name: string,
    activateId?: string,
  },
}

type UserCreateActivateLimitNavigationProp = StackNavigationProp<
  RootNavigationStackParamList,
  'UserCreateActivateLimit'
>

type UserCreateActivateLimitRouteProp = RouteProp<
  RootRouteStackParamList,
  'UserCreateActivateLimit'
>


type Props = {
  sub: string,
  route: UserCreateActivateLimitRouteProp,
}


const escapeUnsafe = (unsafe: string) => unsafe
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;')
  .replace(/ /gi, '-')



const ATOMICCALENDARNAME = 'Atomic Calendar'


function UserCreateActivateLimit(props: Props) {
  const [unit, setUnit] = useState<string | undefined>(undefined)

  const userIdEl = useRef<string>(null)
  const calendarEventIdEl = useRef<string>('')


  const name = props?.route?.params?.name
  const activateId = props?.route?.params?.activateId
  const sub = props?.sub

  const navigation = useNavigation<UserCreateActivateLimitNavigationProp>()

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
      .primaryGoalType('eq', PrimaryGoalType.LIMITTYPE)
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
      if (!name) {
        Toast.show({
          type: 'error',
          text1: 'No name provided',
          text2: `Please go back and type a name.`
        })

        return
      }

      if (!unit) {
        Toast.show({
          type: 'error',
          text1: 'No metric provided',
          text2: `Please type a metric to measure progress by.`
        })

        return
      }

      if (name) {
        const isAvailable = await checkAvailability(name)

        if (!isAvailable) {
          Toast.show({
            type: 'error',
            text1: 'Not available',
            text2: `You have already activated ${name} component`
          })

          return
        }


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
            primaryGoalType: PrimaryGoalType.LIMITTYPE,
            secondaryGoalType: escapeUnsafe(name),
            activated: true,
            secondaryGoalName: name,
            unit,
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
      }

    } catch(e) {

      
      Toast.show({
            type: 'error',
            text1: `Something went wrong`,
            text2: `Please try again later`
         });
    }
  }




  const onUnitChange = (text: string) => setUnit(text)



  return (
    <Box flex={1} justifyContent="center">
      <Box my={{ phone: 's', tablet: 'm'}}>
        <RegularCard>
          {name ? (
            <Text variant="subheader">
              {name}
            </Text>
          ) : null}
          <TextField
            onChangeText={onUnitChange}
            value={unit}
            title="metric to measure by"
            placeholder="minutes"
            style={{ width: '40%' }}
            autoCapitalize="none"
          />
          <Button onPress={createNewActiveComponent}>
            Confirm Activate
          </Button>
        </RegularCard>
      </Box>
    </Box>
  )
}


  export default UserCreateActivateLimit
