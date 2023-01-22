import React, { useState, useEffect } from 'react'
import {
  FlatList,
  useColorScheme,
} from 'react-native'
import { ApolloClient, NormalizedCacheObject, useQuery } from '@apollo/client'
import { Switch } from 'react-native-ui-lib'

import { RouteProp } from '@react-navigation/native'
import Toast from 'react-native-toast-message'

import Box from '@components/common/Box'
import Text from '@components/common/Text'
import { palette } from '@theme/theme'

import { CalendarIntegrationType } from '@dataTypes/calendar_integrationType'
import { CalendarType } from '@app/dataTypes/CalendarType'

import {
  triggerGoogleCalendarSync,
  listGoogleCalendars,
  deleteEventTriggerByResourceId,
} from '@screens/Settings/calendar_integrationHelper'
 
import {
   googleCalendarName,
   googleCalendarResource,
} from '@app/calendar/constants'

import Spinner from 'react-native-spinkit'
import { CalendarListItemResponseType } from '@app/calendar/types'
import { enabledCalendarType } from '@screens/Settings/types'
import { deleteEventsByCalendarId, deleteGoogleCalendarInDb, upsertGoogleCalendarInDb } from '@app/calendar/calendarDbHelper'
import getCalendarWithResource from '@app/apollo/gql/getCalendarWithResource'
import getCalendarIntegrationByResourceAndName from '@app/apollo/gql/getCalendarIntegrationByResourceAndName'
import { listEventsForCalendar } from '@screens/OnBoard/OnBoardHelper'
import { deleteAttendeesForEvents } from '@screens/Calendar/Attendee/AttendeeHelper'
import { deleteRemindersForEvents } from '@screens/Calendar/Reminder/ReminderHelper'
import { deleteConferencesWithIds } from '@screens/Calendar/Conference/ConferenceHelper'


type RootRouteStackParamList = {
  UserViewGoogleCalendarList: {
    token: string,
  },
}

type UserViewGoogleCalendarListRouteProp = RouteProp<
  RootRouteStackParamList,
  'UserViewGoogleCalendarList'>

type checkBoxProps = {
  updateEnabledValue: (index: number, value: boolean, id: string) => Promise<any>,
  index: number,
  enabled: boolean,
  name: string,
  dark: boolean,
  id: string,
}

type renderItem = {
  item: enabledCalendarType,
  index: number,
}
function CalendarCheckBox(props: checkBoxProps) {
  const {
    enabled: oldEnabled,
    updateEnabledValue,
    index,
    name,
    dark,
    id,
  } = props
  const [enabled, setEnabled] = useState<boolean>(oldEnabled)

  const updateEnabled = (value: boolean) => {
    setEnabled(value)
    updateEnabledValue(index, value, id)
  }

  return (
     <Box mb={{ phone: 's', tablet: 'm' }} flex={1} style={{ width: '90%'}} flexDirection="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Text variant="optionHeader" style={{ color: dark ? palette.white : palette.darkGray }}>
            {name}
          </Text>
        </Box>
        <Box style={{ width: '30%'}}>
          <Switch
            onValueChange={updateEnabled}
            value={enabled}
          />
        </Box>
  
      </Box>
  )
}

type Props = {
    sub: string,
    route: UserViewGoogleCalendarListRouteProp,
    client: ApolloClient<NormalizedCacheObject>,
}

function UserViewGoogleCalendarList(props: Props) {
    const { sub } = props
    const client = props?.client

    const [calendarList, setCalendarList] = useState<CalendarListItemResponseType[]>([])
    const [loading, setLoading] = useState<boolean>(false)
    const [enabledCalendars, setEnabledCalendars] = useState<enabledCalendarType[]>([])
    const [enableAllCalendars, setEnableAllCalendars] = useState<boolean>(false)
    const [disableLoading, setDisableLoading] = useState<boolean>(false)

    const token = props.route?.params?.token


    const { loading: existingCalendarLoading, error: existingCalendarError, data } = useQuery<{ Calendar: CalendarType[] }>(getCalendarWithResource, {
        variables: { userId: sub, resource: googleCalendarResource },
    })

    const { loading: integrationLoading, error: integrationError, data: integrationData } = useQuery<{ Calendar_Integration: CalendarIntegrationType[] }>(getCalendarIntegrationByResourceAndName, {
        variables: {
            name: googleCalendarName,
            resource: googleCalendarResource,
            userId: sub,
        }
    })


    if (existingCalendarError) {
        Toast.show({
            type: 'error',
            text1: 'Error loading calendars',
            text2: existingCalendarError.toString(),
        })
    }

    if (integrationError) {
        Toast.show({
            type: 'error',
            text1: 'Error loading calendars',
            text2: integrationError.toString(),
        })
    }

    const calendars = data?.Calendar
    const calendarIntegrations = integrationData?.Calendar_Integration

    useEffect(() => {
        if (!token) return
        (async () => {
            try {
                setLoading(true)
                const results = await listGoogleCalendars(token)
                
                const existingEnabledCalendars = results.map(calendar => {
                    const calendarId = calendar.id
                    const calendarName = calendar.summary
                    const calendarIndex = calendars?.findIndex(c => c.id === calendarId)
                    return {
                        id: calendarId,
                        name: calendarName,
                        enabled: (calendarIndex > -1),
                    }
                })
                setCalendarList(results)
                setEnabledCalendars(existingEnabledCalendars)
                setLoading(false)
                setDisableLoading(true)
            } catch (e) {
                
                setLoading(false)
                Toast.show({
                    type: 'error',
                    text1: 'Error getting calendars',
                    text2: e.toString(),
                })
                setDisableLoading(true)
            }
        })()
    }, [token, calendars?.length])

    const dark = useColorScheme() === 'dark'
    const updateEnabledCalendarValue = async (index: number, value: boolean) => {
        try {
            const newEnabledCalendars = enabledCalendars.map((c, idx) => {
                if (idx === index) {
                    return {
                        ...c,
                        enabled: value,
                    }
                }
                return c
            })
            setEnabledCalendars(newEnabledCalendars)
        } catch (e) {
            
            Toast.show({
                type: 'error',
                text1: 'Error updating enabled value',
                text2: e.toString(),
            })
        }
    }
    const upsertCalendarInDb = async (index: number) => {
        try {
            
            return upsertGoogleCalendarInDb(
                client,
                calendarList?.[index],
                sub,
            )
        } catch (e) {
            
        }
    }
    const deleteCalendarInDb = async (index: number) => {
        try {
            await deleteGoogleCalendarInDb(client, calendarList?.[index]?.id)
        } catch (e) {
            
        }
    }

    const deleteEventTriggerInDb = async (index: number) => {
        try {
            await deleteEventTriggerByResourceId(calendarList?.[index]?.id)
        } catch (e) {
            
        }
    }
    
    const triggerCalendarSync = async (
        index: number,
    ) => {
        try {
            return triggerGoogleCalendarSync(calendarIntegrations?.[0]?.id, calendarList?.[index]?.id, sub)
        } catch (e) {
            
        }
    }

    const addCalendarToSync = async (index: number) => {
        try {
            updateEnabledCalendarValue(index, true)
            await Promise.all([
                upsertCalendarInDb(index),
                triggerCalendarSync(index),
            ])

             Toast.show({
                type: 'success',
                text1: 'Pick a Primary Calendar',
                text2: 'Make sure to pick a primary calendar under settings or Atomic will not work properly ',
            })
        } catch (e) {
            
        }
    }

    const removeCalendarFromSync = async (index: number) => {
        try {
            updateEnabledCalendarValue(index, false)

            const eventsToDelete = await listEventsForCalendar(client, calendarList?.[index]?.id)
            await deleteAttendeesForEvents(client, eventsToDelete.map(e => e.id))
            const conferenceIds = eventsToDelete.map(e => e.conferenceId)
                .filter(id => !!id)

            await deleteRemindersForEvents(client, eventsToDelete.map(e => e.id), sub)
            await Promise.all([
                deleteEventTriggerInDb(index),
                deleteEventsByCalendarId(client, calendarList?.[index]?.id),
            ])

            if (conferenceIds?.length > 0) {
                await deleteConferencesWithIds(client, conferenceIds)
            }

            await deleteCalendarInDb(index)
        } catch (e) {
            
        }
    }

    const addAllCalendarToSync = async () => {
        try {
            const promises = []
            for (let i = 0; i < calendarList.length; i++) {
                promises.push(addCalendarToSync(i))
            }
            await Promise.all(promises)
        } catch (e) {
            
        }
    }

    const removeAllCalendarFromSync = async () => {
        try {
            const promises = []
            for (let i = 0; i < calendarList.length; i++) {
                promises.push(removeCalendarFromSync(i))
            }
            await Promise.all(promises)
        } catch (e) {
            
        }
    }

    const updateEnabledValue = async (index: number, value: boolean) => {
        try {
            
            const newEnabledCalendars = enabledCalendars
                .slice(0, index)
                .concat([{ ...(enabledCalendars?.[index]), enabled: value }])
                .concat(enabledCalendars.slice(index + 1))

            setEnabledCalendars(newEnabledCalendars)
            
            if (value) {
                return addCalendarToSync(index)
            } else {
                return removeCalendarFromSync(index)
            }
        } catch (e) {
            
            Toast.show({
                type: 'error',
                text1: 'Error updating enabled value',
                text2: e.toString(),
            })
        }
    }

    const updateAllCalendars = async (value: boolean) => {
        try {
            if (value) {
                
                setEnableAllCalendars(true)
                return addAllCalendarToSync()
            }
            setEnableAllCalendars(false)
            return removeAllCalendarFromSync()
        } catch (e) {
            
            Toast.show({
                type: 'error',
                text1: 'Error updating all calendars',
                text2: e.toString(),
            })
        }
    }

    const renderItem = ({ item, index }: renderItem) => {
        return (
            <CalendarCheckBox
                updateEnabledValue={updateEnabledValue}
                index={index}
                enabled={item?.enabled}
                name={item?.name}
                dark={dark}
                id={item?.id}
            />
        )
    }

    if (loading || existingCalendarLoading || integrationLoading || !disableLoading) {
        return (
        <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%'}}>
            <Spinner isVisible={true} type="ThreeBounce" size={100} color="#FFFFFF" />
        </Box>
        )
    }

    if (!(calendarIntegrations?.length > 0)) {
        Toast.show({
            type: 'error',
            text1: 'Google Not Enabled',
            text2: 'Google calendar integration is not enabled'
        })
    }

    return (
        <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%' }}>
            <Box flex={1} style={{ width: '80%' }} flexDirection="row" justifyContent="space-around" alignItems="center">
                <Box>
                    <Text variant="optionHeader" style={{ color: dark ? palette.white : palette.darkGray }}>
                    All Google Calendars
                    </Text>
                </Box>
                <Box>
                    <Switch
                    onValueChange={updateAllCalendars}
                    value={enableAllCalendars}
                    />
                </Box>
            </Box>
            <Box style={{ width: '90%' }} flex={3} justifyContent="center" alignItems="center">
            <FlatList
                style={{ flex: 1 }}
                data={enabledCalendars}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                extraData={`${enabledCalendars.map(i => i?.id)}`}
            />
            </Box>
        </Box>
    )
}

export default UserViewGoogleCalendarList
