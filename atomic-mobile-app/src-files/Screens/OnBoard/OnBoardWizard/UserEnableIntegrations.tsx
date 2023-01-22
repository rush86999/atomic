import React, {
    useState,
    forwardRef,
    useImperativeHandle,
    useRef,
    useEffect,
    Dispatch,
    SetStateAction,
  } from 'react'
import {saveAllLocalCalendars} from '@progress/Todo/UserTaskHelper2'
import {
    FlatList,
    useColorScheme,
    Platform,
    Pressable,
    Image,
    Appearance,
} from 'react-native'
import { Switch } from 'react-native-ui-lib'
import Toast from 'react-native-toast-message'
import { Overlay } from 'react-native-elements/src'
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin'


import { dayjs } from '@app/date-utils'

import Box from '@components/common/Box'
import Text from '@components/common/Text'
import Button from '@components/Button'
import { palette } from '@theme/theme'

import { CalendarIntegrationType, colorType } from '@dataTypes/Calendar_IntegrationType'
import { CalendarType } from '@app/dataTypes/CalendarType'
import {
    googleConfig,
} from '@app/dataTypes/configs'
import {
    getAPIAuth,
    updateIntegration,
    triggerGooglePeopleSync,
    deleteEventTriggers,
    getIntegrationById,
    deleteEventTriggerByResourceId,
    triggerGoogleCalendarSync,
    listGoogleCalendars,
} from '@screens/Settings/calendar_integrationHelper'

import {
    googleCalendarName,
    googleCalendarResource,
    localCalendarName,
} from '@app/calendar/constants'

import {
    googlePeopleName,
    googlePeopleResource,
    localContactsName,
} from '@app/contacts/constants'
import {
    getAndroidLocalContacts,
    getIosLocalContacts,
    reformatToContactType,
} from '@app/contacts/localContactsHelper'
  
import {
    zoomOAuthStartUrl,
    zoomResourceName
} from '@app/zoom/constants'
import { LocalContact } from '@screens/Contact/types'
import { upsertContact } from '@screens/Contact/ContactHelper'
import Spinner from 'react-native-spinkit'
import { 
    bulkRemoveCalendarsInDb, 
    deleteEventsByCalendarId, 
    getItemsToRemove,
    deleteGoogleCalendarInDb, 
    upsertGoogleCalendarInDb,
 } from '@app/calendar/calendarDbHelper'

import { CalendarListItemResponseType } from '@app/calendar/types'
import { enabledCalendarType } from '@screens/Settings/types'
import { ApolloClient, NormalizedCacheObject, useQuery } from '@apollo/client'
import getCalendarWithResource from '@app/apollo/gql/getCalendarWithResource';
import getCalendarIntegrationByResourceAndName from '@app/apollo/gql/getCalendarIntegrationByResourceAndName'
import listCalendarIntegrations from '@app/apollo/gql/listCalendarIntegrations'
import { listEventsForCalendar } from '../OnBoardHelper';
import { deleteAttendeesForEvents } from '@screens/Calendar/Attendee/AttendeeHelper'
import { deleteConferencesWithIds } from '@screens/Calendar/Conference/ConferenceHelper'
import { deleteRemindersForEvents } from '@screens/Calendar/Reminder/ReminderHelper'
import { getGoogleColors } from '@app/calendar/googleCalendarHelper'
import { AndroidGoogleCalendarCredentials } from '@screens/Settings/types'
import { googleCalendarAndroidAuthUrl, googleClientIdWeb } from '@app/lib/constants'
import { Auth } from '@aws-amplify/auth';
import axios from 'axios'
import InAppBrowser from 'react-native-inappbrowser-reborn'
import qs from 'qs'
import { openZoomOAuthLink } from '@app/zoom/zoomMeetingHelper'



GoogleSignin.configure({
  scopes: ['https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/contacts.readonly'],
  webClientId: googleClientIdWeb,
  offlineAccess: true,
  forceCodeForRefreshToken: true,
})


type checkBoxProps = {
    updateEnabledValue: (index: number, value: boolean, id: string) => Promise<any>,
    index: number,
    enabled: boolean,
    name: string,
    dark: boolean,
    id: string,
}

type checkBoxProps2 = {
    updateEnabledValue: (index: number, value: boolean, id: string) => Promise<any>,
    index: number,
    enabled: boolean,
    name: string,
    dark: boolean,
    id: string,
    calendars: CalendarType[],
}

type RenderItemType = {
    item: enabledCalendarType,
    index: number,
}
type RenderItemType2 = {
    item: CalendarIntegrationType,
    index: number,
}

type googleRenderItem = {
    item: enabledCalendarType,
    index: number,
  }

type googleCheckBoxProps = {
    updateEnabledValue: (index: number, value: boolean, id: string) => Promise<void | void[]>,
    index: number,
    enabled: boolean,
    name: string,
    dark: boolean,
    id: string,
}

type Props = {
    sub: string,
    client: ApolloClient<NormalizedCacheObject>,
    isPro: boolean,
    isPremium: boolean,
    enableTesting: boolean,
}
const dark = Appearance.getColorScheme() === 'dark'
const googleButtonNormal = dark ? require('@assets/images/google-signin-dark-normal.png') : require('@assets/images/google-signin-normal.png')
const googleButtonPressed = dark ? require('@assets/images/google-signin-dark-pressed.png') : require('@assets/images/google-signin-pressed.png')


const IntegrationCheckBox = forwardRef((props: checkBoxProps, ref) => {
    const {
      enabled: oldEnabled,
      updateEnabledValue,
      index,
      name,
      dark,
      id,
    } = props
    const [enabled, setEnabled] = useState<boolean>(oldEnabled)
    const [pressed, setPressed] = useState<boolean>(false)
  
    const updateEnabled = async (value: boolean) => {
      setEnabled(value)
      return updateEnabledValue(index, value, id)
    }
  
    const disableEnabled = async () => {
      setEnabled(false)
      return updateEnabledValue(index, false, id)
    }
  
    useImperativeHandle(ref, () => ({
        disableEnabled,
    }))

    const onPressIn = () => setPressed(true)
    const onPressOut = () => setPressed(false)

    const onPress = async () => updateEnabled(!enabled)
        

    if ((name === googleCalendarName) || (name === googlePeopleName)) {
        return (
            <Box flex={1} mt={{ phone: 'm', tablet: 'l' }} justifyContent="center" alignItems="stretch">
                <Box flex={1} flexDirection="row" justifyContent="space-between" alignItems="center">
                    <Box mr={{ phone: 's', tablet: 'm' }}>
                    <Text variant="optionHeader" style={{ color: dark ? palette.white : palette.darkGray }}>
                        {name}
                    </Text>
                    </Box>
                    <Box ml={{ phone: 's', tablet: 'm' }}>
                        {enabled
                            ? <Text variant="optionHeader">On</Text>
                            : <Text variant="optionHeader">Off</Text>
                        }
                    </Box>
            
                </Box>
                <Box flex={1} mt={{ phone: 'm', tablet: 'l' }}>
                    {enabled
                        ? (
                            <Pressable onPress={onPress}>
                                <Text textAlign="center" variant="buttonLink">
                                    Disable
                                </Text>
                            </Pressable>
                        ) : (
                            <Pressable onPressIn={onPressIn} onPressOut={onPressOut} onPress={onPress}>
                                <Image
                                    source={pressed ? googleButtonPressed : googleButtonNormal}
                                    style={{ width: 240, height: 50 }}
                                />
                            </Pressable>
                        )}
                </Box>
            </Box>
        )
    }
  
    return (
      <Box flex={1} mt={{ phone: 'm', tablet: 'l' }} flexDirection="row" justifyContent="space-between" alignItems="center">
        <Box mr={{ phone: 's', tablet: 'm' }}>
          <Text variant="optionHeader" style={{ color: dark ? palette.white : palette.darkGray }}>
            {name}
          </Text>
        </Box>
        <Box ml={{ phone: 's', tablet: 'm' }}>
          <Switch
            onValueChange={updateEnabled}
            value={enabled}
          />
        </Box>
  
      </Box>
    )
})

function CalendarCheckBox(props: checkBoxProps2) {
    const {
      enabled: oldEnabled,
      updateEnabledValue,
    index,
    name,
    dark,
    id,
    calendars,
    } = props
    const [enabled, setEnabled] = useState<boolean>(oldEnabled)

    useEffect(() => {
        (async () => {
            try {

                const index = calendars.findIndex(i => (i?.id === id))
                if (index !== -1) {
                    setEnabled(true)
                }
            } catch (e) {
                
            }
        })()
    }, [calendars?.length])
  
    const updateEnabled = async (value: boolean) => {
      setEnabled(value)
      return updateEnabledValue(index, value, id)
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

type GoogleProps = {
    sub: string, 
    token: string,
    setParentIsGoogleCalendarList: Dispatch<SetStateAction<boolean>>,
    client: ApolloClient<NormalizedCacheObject>,
    isPro: boolean,
    isPremium: boolean,
    enableTesting: boolean,
}

function UserViewGoogleCalendarList(props: GoogleProps) {
    const { sub } = props
    const client = props?.client
    
    const [calendarList, setCalendarList] = useState<CalendarListItemResponseType[]>([])
    const [loading, setLoading] = useState<boolean>(false)
    const [enabledCalendars, setEnabledCalendars] = useState<enabledCalendarType[]>([])
    const [enableAllCalendars, setEnableAllCalendars] = useState<boolean>(false)
    const [disableLoading, setDisableLoading] = useState<boolean>(false)

    const token = props?.token
    const isPro = props?.isPro
    const isPremium = props?.isPremium
    const enableTesting = props?.enableTesting

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
            text1: 'Error getting calendars',
            text2: existingCalendarError.toString(),
        })
    }

    if (integrationError) {
        Toast.show({
            type: 'error',
            text1: 'Error getting calendar integrations',
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
                text2: 'Make sure to pick a primary calendar in the next step (or under settings) or Atomic will not work properly ',
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
            if (!enableTesting && !isPro && !isPremium) {
                const count = enabledCalendars.filter(c => c.enabled).length
                if (count > 1) {
                    Toast.show({
                        text1: 'Only 1 calendar allowed',
                        text2: 'Upgrade to Premium or Pro to enable more than 1 calendar',
                        type: 'error',
                    })
                    return
                }
            }
            const newEnabledCalendars = enabledCalendars
                ?.slice(0, index)
                ?.concat([{ ...(enabledCalendars?.[index]), enabled: value }])
                ?.concat(enabledCalendars?.slice(index + 1) || [])
                ?.filter(f => !!f)

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
                if (!enableTesting && !isPro && !isPremium) {
                    Toast.show({
                        text1: 'Only 1 calendar allowed',
                        text2: 'Upgrade to Premium or Pro to enable more than 1 calendar',
                        type: 'error',
                    })
                    return
                }
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

    const closeGoogleCalendarList = () => props.setParentIsGoogleCalendarList(false)

    const renderItem = ({ item, index }: RenderItemType) => {
        
        return (
            <CalendarCheckBox
                updateEnabledValue={updateEnabledValue}
                index={index}
                enabled={item?.enabled}
                name={item?.name}
                dark={dark}
                id={item?.id}
                calendars={calendars}
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
        <Box flex={1} justifyContent="space-around" alignItems="center" style={{ width: '100%' }}>
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
            <Box flex={1}>
                <Pressable onPress={closeGoogleCalendarList}>
                    <Text variant="buttonLink" >
                        Close Google Calendar List
                    </Text>
                </Pressable>
            </Box>
        </Box>
    )
}
  
function UserEnableIntegrations(props: Props) {
    const [loading, setLoading] = useState<boolean>(false)
    const [isWarning, setIsWarning] = useState<boolean>(false)
    const [selectedIndex, setSelectedIndex] = useState<number>(-1)
    const [selectedId, setSelectedId] = useState<string>()
    const [selectedValue, setSelectedValue] = useState<boolean>(false)
    const [isGoogleCalendarList, setIsGoogleCalendarList] = useState<boolean>(false)
    const [googleToken, setGoogleToken] = useState<string>()

    const googleCalendarElement = useRef<any>()

    const dark = useColorScheme() === 'dark'
    const { sub: userId } = props
    const client = props?.client
    const isPro = props?.isPro
    const isPremium = props?.isPremium
    const enableTesting = props?.enableTesting

    useEffect(() => {
        InAppBrowser.mayLaunchUrl(`${zoomOAuthStartUrl}?${qs.stringify({ userId, path: 'todo/task/onboard' })}`, ['']);
    }, [])

    const { loading: googleIntegrationLoading, error: googleIntegrationError, data: googleIntegrationData } = useQuery<{ Calendar_Integration: CalendarIntegrationType[] }>(getCalendarIntegrationByResourceAndName, {
        variables: {
            name: googleCalendarName,
            resource: googleCalendarResource,
            userId: userId,
        }
    })

    const { loading: integrationLoading, error: integrationError, data: integrationData, refetch } = useQuery<{ Calendar_Integration: CalendarIntegrationType[] }>(listCalendarIntegrations, {
        variables: {
            userId: userId,
        }
    })
    
    const googleCalendarEnabled = googleIntegrationData?.Calendar_Integration?.[0]?.enabled
    const integrations = integrationData?.Calendar_Integration

    useEffect(() => {
        (async () => {
            if (!(integrations?.length > 0)) {
                await refetch()
            }
        })()
    }, [(integrations?.length > 0) || 0])

    

    
    
    const disableGoogleCalendarCheckBox = () => {
        setSelectedIndex(-1)
        setSelectedId('')
        setSelectedValue(false)
        setIsWarning(false)
        googleCalendarElement?.current?.disableEnabled()
    }
    
    const enableGoogleCalendarCheckBox = async () => {
    try {
        setIsWarning(false)


        await submitIntegration(
        selectedIndex,
        selectedValue,
        selectedId,
        )
        await refetch()
        setSelectedIndex(-1)
        setSelectedId('')
        setSelectedValue(false)
    } catch (e) {
        setIsWarning(false)
        
        Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Something went wrong',
        })
    }
    }
    
    const updateEnabledValue = async (index: number, value: boolean, id: string) => {
        const selectedIntegration = integrations[index]
        if (
            (selectedIntegration.name === googleCalendarName)
            && (value === false)
        ) {
            setSelectedIndex(index)
            setSelectedId(id)
            setSelectedValue(value)
            setIsWarning(true)
        } else {


            await  submitIntegration(
                index,
                value,
                id,
            )

            await refetch()
        }
    
    }
    
    const disableGoogleCalendarSync = async (
        integrationId: string
    ) => {
    try {
        await updateIntegration(
        client,
        integrationId,
        false,
        null,
        null,
        null,
        )
        
        await deleteEventTriggers(userId, googleCalendarResource, googleCalendarName)
        
        const itemsToRemove = await getItemsToRemove(client, userId, googleCalendarResource)
        
        await bulkRemoveCalendarsInDb(client, itemsToRemove.map(i => (i?.id)))

        const eventsToRemovePromise = []

        for (const item of itemsToRemove) {
        if (item?.id) {
            eventsToRemovePromise.push(
            deleteEventsByCalendarId(client, item.id)
            )
        }
        }

        await Promise.all(eventsToRemovePromise)
        
    } catch (e) {
        
        await refetch()
    }
    }

    const enableGoogleCalendarSync = async(
        integrationId: string,
    ) => {
    try {
        const doc = await getIntegrationById(client, integrationId)
        const oldAccessToken = doc?.token
        const oldRefreshToken = doc?.refreshToken
        const oldExpiresAt = doc?.expiresAt

        if (dayjs().isAfter(dayjs(oldExpiresAt)) || !oldAccessToken) {
        let newAccessToken = ''
        let newRefreshToken = ''
        let newExpiresAt = ''
        if (Platform.OS === 'ios') {
          const { accessToken: newAccessToken1, refreshToken: newRefreshToken1, expiresAt: newExpiresAt1 } = await getAPIAuth(googleConfig)
          newAccessToken = newAccessToken1
          newRefreshToken = newRefreshToken1
          newExpiresAt = newExpiresAt1
        } else if (Platform.OS === 'android') {
          await GoogleSignin.hasPlayServices()
          const { serverAuthCode } = await GoogleSignin.signIn()

          const url = googleCalendarAndroidAuthUrl
          const token = (await Auth.currentSession()).getIdToken().getJwtToken()
          const config = {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }

          const data = {
            code: serverAuthCode,
          }

          const results: { data: {
            message: string,
            event: AndroidGoogleCalendarCredentials
            },
          } = await axios.post(url, data, config)
          

          const { refresh_token: newRefreshToken1, access_token: newAccessToken1, expiry_date: newExpiresAt1 } = results?.data?.event
          
          newAccessToken = newAccessToken1
          newRefreshToken = newRefreshToken1
          newExpiresAt = dayjs(newExpiresAt1).format()

        }

        const colors = await getGoogleColors(newAccessToken)

        const modifiedColors = []

        const calendarColor = colors?.calendar
        const eventColor = colors?.event

        for (const property in calendarColor) {
            const color: colorType = {
            id: property,
            itemType: 'calendar',
            background: calendarColor[property]?.background,
            foreground: calendarColor[property]?.foreground,
            }
            modifiedColors.push(color)
        }

        for (const property in eventColor) {
            const color: colorType = {
            id: property,
            itemType: 'event',
            background: eventColor[property]?.background,
            foreground: eventColor[property]?.foreground,
            }
            modifiedColors.push(color)
        }

        await updateIntegration(
            client,
            integrationId,
            true,
            newAccessToken,
            newRefreshToken,
            newExpiresAt,
            true,
            modifiedColors,
            undefined,
            undefined,
            Platform.OS === 'android' ? 'web' : Platform.OS,
        )
        
        const calendarGooglePeopleIntegration = (await client.query<{ Calendar_Integration: CalendarIntegrationType[] }>({
            query: getCalendarIntegrationByResourceAndName,
            variables: {
              userId: userId,
              name: googlePeopleName,
              resource: googlePeopleResource,
            },
          })).data?.Calendar_Integration?.[0]
        
        const calendarGooglePeopleIntegrationId: string = calendarGooglePeopleIntegration?.id

        await updateIntegration(
            client,
            calendarGooglePeopleIntegrationId,
            undefined,
            newAccessToken,
            newRefreshToken,
            newExpiresAt,
            undefined,
            undefined,
            undefined,
            undefined,
            Platform.OS,
        )


        await refetch()

        
        setGoogleToken(newAccessToken)
        setIsGoogleCalendarList(true)
        } else {
            const colors = await getGoogleColors(oldAccessToken)

            const modifiedColors = []

            const calendarColor = colors?.calendar
            const eventColor = colors?.event

            for (const property in calendarColor) {
                const color: colorType = {
                id: property,
                itemType: 'calendar',
                background: calendarColor[property]?.background,
                foreground: calendarColor[property]?.foreground,
                }
                modifiedColors.push(color)
            }

            for (const property in eventColor) {
                const color: colorType = {
                id: property,
                itemType: 'event',
                background: eventColor[property]?.background,
                foreground: eventColor[property]?.foreground,
                }
                modifiedColors.push(color)
            }
            await updateIntegration(
                client,
                integrationId,
                true,
                oldAccessToken,
                oldRefreshToken,
                oldExpiresAt,
                true,
                modifiedColors,
                undefined,
                undefined,
                Platform.OS,
            )
            
            await refetch()
            setGoogleToken(oldAccessToken)
            setIsGoogleCalendarList(true)
        }

    } catch (e: any) {
        
        if (e.code === statusCodes.SIGN_IN_CANCELLED) {
            
        } else if (e.code === statusCodes.IN_PROGRESS) {
            
        } else if (e.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
            
        } else {
        }
        await refetch()
    }
    }

    const disableZoomAuth = async (
        integrationId: string,
    ) => {
        try {
            await updateIntegration(
                client,
                integrationId,
                false,
                null,
                null,
                null,
                undefined,
                undefined,
                null,
                null,
            )
        } catch (e) {
            
        }
    }

    const enableZoomAuth = async () => {
        try {
            await openZoomOAuthLink(userId, 'todo-posts-nav/task/onboard')
        } catch (e) {
            
        }
    }

    const disableGoogleContactSync = async (
        integrationId: string,
    ) => {
    try {
        await updateIntegration(
            client,
            integrationId,
            false,
            null,
            null,
            null,
            undefined,
            undefined,
            null,
            null,
        )
        await deleteEventTriggerByResourceId(integrationId)
    } catch (e) {
        
    }
    }
    
    const enableGoogleContactSync = async(
    integrationId: string,
    ) => {
    try {
        const doc = await getIntegrationById(client, integrationId)
        const oldAccessToken = doc?.token
        const oldRefreshToken = doc?.refreshToken
        const oldExpiresAt = doc?.expiresAt

        if (dayjs().isAfter(dayjs(oldExpiresAt)) || !oldAccessToken) {
        let newAccessToken = ''
        let newRefreshToken = ''
        let newExpiresAt = ''
        if (Platform.OS === 'ios') {
          const { accessToken: newAccessToken1, refreshToken: newRefreshToken1, expiresAt: newExpiresAt1 } = await getAPIAuth(googleConfig)
          newAccessToken = newAccessToken1
          newRefreshToken = newRefreshToken1
          newExpiresAt = newExpiresAt1
        } else if (Platform.OS === 'android') {
          await GoogleSignin.hasPlayServices()
          const { serverAuthCode } = await GoogleSignin.signIn()

          const url = googleCalendarAndroidAuthUrl
          const token = (await Auth.currentSession()).getIdToken().getJwtToken()
          const config = {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }

          const data = {
            code: serverAuthCode,
          }

          const results: { data: {
            message: string,
            event: AndroidGoogleCalendarCredentials
            },
          } = await axios.post(url, data, config)
          

          const { refresh_token: newRefreshToken1, access_token: newAccessToken1, expiry_date: newExpiresAt1 } = results?.data?.event
          
          newAccessToken = newAccessToken1
          newRefreshToken = newRefreshToken1
          newExpiresAt = dayjs(newExpiresAt1).format()

        }
        await updateIntegration(
            client,
            integrationId,
            true,
            newAccessToken,
            newRefreshToken,
            newExpiresAt,
            true,
            undefined,
            undefined,
            undefined,
            Platform.OS === 'android' ? 'web' : Platform.OS,
        )

        const calendarGooglecalendar_integration = (await client.query<{ Calendar_Integration: CalendarIntegrationType[] }>({
            query: getCalendarIntegrationByResourceAndName,
            variables: {
              userId: userId,
              name: googleCalendarName,
              resource: googleCalendarResource,
            },
          })).data?.Calendar_Integration?.[0]
        
        const calendarGooglecalendar_integrationId: string = calendarGooglecalendar_integration?.id

        await updateIntegration(
            client,
            calendarGooglecalendar_integrationId,
            undefined,
            newAccessToken,
            newRefreshToken,
            newExpiresAt,
            undefined,
            undefined,
            undefined,
            undefined,
            Platform.OS,
        )

        await refetch()

            
        } else {
            await updateIntegration(
                client,
                integrationId,
                true,
                oldAccessToken,
                oldRefreshToken,
                oldExpiresAt,
                true,
                undefined,
                undefined,
                undefined,
                Platform.OS,
            )
        }
        
        await triggerGooglePeopleSync(
            integrationId,
            userId,
        )
        
    } catch (e) {
        
    }
    }
    
    const submitIntegration = async (index: number, newEnabled: boolean, id: string) => {
        try {
            if (newEnabled === false) {
            if (integrations?.[index]?.name === googlePeopleName) {

                return disableGoogleContactSync(integrations?.[index]?.id)
            } else if (integrations?.[index]?.name === googleCalendarName) {

                return disableGoogleCalendarSync(integrations?.[index]?.id)
            } else if (integrations?.[index]?.resource === zoomResourceName) {
               
                return disableZoomAuth(integrations?.[index]?.id)
            }

                return updateIntegration(
                    client,
                    id,
                    newEnabled,
                    undefined,
                    undefined,
                    undefined,
                    false,
                    undefined,
                    undefined,
                    undefined,
                    Platform.OS,
                )
            }
            
            if (integrations?.[index]?.name === googleCalendarName) {
                return enableGoogleCalendarSync(integrations?.[index]?.id)
            } else if (integrations?.[index]?.name === googlePeopleName) {
                return enableGoogleContactSync(integrations?.[index]?.id)
            } else if (integrations?.[index]?.resource === zoomResourceName) {

                return enableZoomAuth()
               
            } else if (integrations?.[index]?.name === localContactsName) {
            setLoading(true)
            const contacts = Platform.OS === 'ios'
                ? await getIosLocalContacts()
                : getAndroidLocalContacts()

            const reformattedContacts = reformatToContactType(contacts as LocalContact[], userId)
            const promises = reformattedContacts.map(c => upsertContact(
                client,
                userId,
                c?.id,
                c?.imageAvailable,
                c?.name,
                c?.firstName,
                c?.middleName,
                c?.lastName,
                c?.maidenName,
                c?.namePrefix,
                c?.nameSuffix,
                c?.nickname,
                c?.phoneticFirstName,
                c?.phoneticMiddleName,
                c?.phoneticLastName,
                c?.company,
                c?.jobTitle,
                c?.department,
                c?.notes,
                c?.contactType,
                c?.emails,
                c?.phoneNumbers,
                c?.imAddresses,
                c?.linkAddresses,
                c?.app,
            ))
            await Promise.all(promises)
            setLoading(false)
            } else if (integrations?.[index]?.name === localCalendarName) {
                await saveAllLocalCalendars(client, userId)
            }

        } catch(e) {
            
            setLoading(false)
            Toast.show({
                type: 'error',
                text1: 'Unable to submit integration',
                text2: 'Please try again',
            })
        }
    }

    const navigateToGoogleCalendars = async () => {
        try {
            const integrationId = integrations.find(i => i.name === googleCalendarName)?.id
            const doc = await getIntegrationById(client, integrationId)
            const oldAccessToken = doc?.token
            const oldRefreshToken = doc?.refreshToken
            const oldExpiresAt = doc?.expiresAt

            if (dayjs().isAfter(dayjs(oldExpiresAt)) || !oldAccessToken) {
            let newAccessToken = ''
        let newRefreshToken = ''
        let newExpiresAt = ''
        if (Platform.OS === 'ios') {
          const { accessToken: newAccessToken1, refreshToken: newRefreshToken1, expiresAt: newExpiresAt1 } = await getAPIAuth(googleConfig)
          newAccessToken = newAccessToken1
          newRefreshToken = newRefreshToken1
          newExpiresAt = newExpiresAt1
        } else if (Platform.OS === 'android') {
          await GoogleSignin.hasPlayServices()
          const { serverAuthCode } = await GoogleSignin.signIn()

          const url = googleCalendarAndroidAuthUrl
          const token = (await Auth.currentSession()).getIdToken().getJwtToken()
          const config = {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }

          const data = {
            code: serverAuthCode,
          }

          const results: { data: {
            message: string,
            event: AndroidGoogleCalendarCredentials
          },
          } = await axios.post(url, data, config)
          

          const { refresh_token: newRefreshToken1, access_token: newAccessToken1, expiry_date: newExpiresAt1 } = results?.data?.event
          
          newAccessToken = newAccessToken1
          newRefreshToken = newRefreshToken1
          newExpiresAt = dayjs(newExpiresAt1).format()

        }
            await updateIntegration(
                client,
                integrationId,
                undefined,
                newAccessToken,
                newRefreshToken,
                newExpiresAt,
                undefined,
                undefined,
                undefined,
                undefined,
                Platform.OS,
            )

            const calendarGooglePeopleIntegration = (await client.query<{ Calendar_Integration: CalendarIntegrationType[] }>({
                query: getCalendarIntegrationByResourceAndName,
                variables: {
                userId: userId,
                name: googlePeopleName,
                resource: googlePeopleResource,
                },
            })).data?.Calendar_Integration?.[0]
            
            const calendarGooglePeopleIntegrationId: string = calendarGooglePeopleIntegration?.id

            await updateIntegration(
                client,
                calendarGooglePeopleIntegrationId,
                undefined,
                newAccessToken,
                newRefreshToken,
                newExpiresAt,
                undefined,
                undefined,
                undefined,
                undefined,
                Platform.OS === 'android' ? 'web' : Platform.OS,
            )

            setGoogleToken(newAccessToken)
            return setIsGoogleCalendarList(true)
            }
            setGoogleToken(oldAccessToken)
            return setIsGoogleCalendarList(true)
        } catch (e) {
            
        }
    }


    const renderItem2 = ({ item, index }: RenderItemType2) => {
        if (item?.name === googleCalendarResource) {
            (
                <Box flex={1}>
                    <IntegrationCheckBox
                        updateEnabledValue={updateEnabledValue}
                        index={index}
                        enabled={item?.enabled}
                        name={item?.name}
                        dark={dark}
                        id={item?.id}
                        ref={googleCalendarElement}
                    />
                </Box>
            )
        }
        return (
            <Box flex={1}>
                <IntegrationCheckBox
                    updateEnabledValue={updateEnabledValue}
                    index={index}
                    enabled={item?.enabled}
                    name={item?.name}
                    dark={dark}
                    id={item?.id}
                />
            </Box>
        )
    }

    if (loading || integrationLoading || googleIntegrationLoading) {
        return (
            <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%'}} backgroundColor="lightRegularCardBackground">
                <Spinner isVisible={true} type="ThreeBounce" size={100} color="#FFFFFF" />
            </Box>
        )
    }

    if (isGoogleCalendarList){
        return (
            <UserViewGoogleCalendarList 
                client={client} 
                token={googleToken} 
                sub={userId} 
                setParentIsGoogleCalendarList={setIsGoogleCalendarList} 
                isPro={isPro}
                isPremium={isPremium}
                enableTesting={enableTesting}
            />
        )
    }

    return (
        <Box flex={1} justifyContent="center" alignItems="center">
          {
            integrations?.length > 0
              ? (
                <Box flex={1} justifyContent="center" alignItems="center">
                    <Box flex={1} justifyContent="center" alignItems="center">
                        <FlatList
                            data={integrations}
                            keyExtractor={item => item.id}
                            renderItem={renderItem2}
                        />
                    </Box>
                  {googleCalendarEnabled
                    ? (
                      <Box m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
                        <Pressable onPress={navigateToGoogleCalendars}>
                          <Text variant="buttonLink">
                            View Google Calendars
                          </Text>
                        </Pressable>
                      </Box>
                    ): (
                      null
                    )}
                </Box>
            ) : (
              <Box flex={1} justifyContent="center" alignItems="center">
                <Text variant="subheader" style={{ color: dark ? palette.white : palette.darkGray }}>
                  Still loading ...
                </Text>
              </Box>
            )
          }
          <Box>
            <Overlay isVisible={isWarning} onBackdropPress={disableGoogleCalendarCheckBox} overlayStyle={{ backgroundColor: dark ? palette.black : palette.white }}>
                <Box justifyContent="center" alignItems="center" style={{ width: '80%', backgroundColor: dark ? palette.black : palette.white }}>
                    <Box m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
                        <Text variant="optionHeader">
                        Disabling Google Calendar will delete all google related events from your calendar
                        </Text>
                    </Box>
                    <Box justifyContent="center" alignItems="center">
                    <Box m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
                        <Button onPress={enableGoogleCalendarCheckBox}>
                        Okay
                        </Button> 
                    </Box>

                    <Button disabled onPress={disableGoogleCalendarCheckBox}>
                    Cancel
                    </Button>   
                    </Box>
                </Box>
            </Overlay>
          </Box>
        </Box>
      )

}

export default UserEnableIntegrations






