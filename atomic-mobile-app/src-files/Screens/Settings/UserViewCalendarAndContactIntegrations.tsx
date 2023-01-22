import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
} from 'react'
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

import { ApolloClient, NormalizedCacheObject, useQuery } from '@apollo/client'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { dayjs } from '@app/date-utils'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import Button from '@components/Button'
import { palette } from '@theme/theme'

import { CalendarIntegrationType, colorType } from '@dataTypes/calendar_integrationType'
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
   zoomResourceName
 } from '@app/zoom/constants'
import { LocalContact } from '@screens/Contact/types'
import { upsertContact } from '@screens/Contact/ContactHelper'
import Spinner from 'react-native-spinkit'
import { getGoogleColors } from '@app/calendar/googleCalendarHelper'
import { bulkRemoveCalendarsInDb, deleteEventsByCalendarId, getItemsToRemove } from '@app/calendar/calendarDbHelper'
import {saveAllLocalCalendars} from '@progress/Todo/UserTaskHelper2'
import listCalendarIntegrations from '@app/apollo/gql/listCalendarIntegrations'
import _ from 'lodash'
import getCalendarIntegrationByResourceAndName from '@app/apollo/gql/getCalendarIntegrationByResourceAndName'
import { googleCalendarAndroidAuthUrl, googleClientIdWeb } from '@app/lib/constants'
import { Auth } from '@aws-amplify/auth';
import axios from 'axios'
import { AndroidGoogleCalendarCredentials } from '@screens/Settings/types'
import { openZoomOAuthLink } from '@app/zoom/zoomMeetingHelper'


GoogleSignin.configure({
  scopes: ['https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/contacts.readonly'],
  webClientId: googleClientIdWeb,
  offlineAccess: true,
  forceCodeForRefreshToken: true,
})

type RootNavigationStackParamList = {
  UserViewGoogleCalendarList: {
    token: string,
  },
  UserViewCalendarAndContactIntegrations: undefined,
}

type UserViewCalendarAndContactIntegrationsNavigationProp = StackNavigationProp<
  RootNavigationStackParamList,
  'UserViewCalendarAndContactIntegrations'
>

type checkBoxProps = {
  updateEnabledValue: (index: number, value: boolean, id: string) => Promise<any>,
  index: number,
  enabled: boolean,
  name: string,
  dark: boolean,
  id: string,
}

type renderItem = {
  item: CalendarIntegrationType,
  index: number,
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
                                <Text variant="buttonLink">
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

function UserViewCalendarAndContactIntegrations(props: Props) {
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

    const { loading: googleIntegrationLoading, error: googleIntegrationError, data: googleIntegrationData, refetch: googleIntRefetch } = useQuery<{ Calendar_Integration: CalendarIntegrationType[] }>(getCalendarIntegrationByResourceAndName, {
        variables: {
            name: googleCalendarName,
            resource: googleCalendarResource,
            userId: userId,
        }
    })

    const { loading: integrationLoading, error: integrationError, data: integrationData, refetch: calIntRefetch } = useQuery<{ Calendar_Integration: CalendarIntegrationType[] }>(listCalendarIntegrations, {
        variables: {
            userId: userId,
        }
    })
    
    const googleCalendarEnabled = googleIntegrationData?.Calendar_Integration?.[0]?.enabled
    const integrations = integrationData?.Calendar_Integration

  const navigation = useNavigation<UserViewCalendarAndContactIntegrationsNavigationProp>()
  

  const disableGoogleCalendarCheckBox = () => {
    setSelectedIndex(-1)
    setSelectedId('')
    setSelectedValue(false)
    setIsWarning(false)
    googleCalendarElement.current.disableEnabled()
  }

  const enableGoogleCalendarCheckBox = async () => {
    try {
      setIsWarning(false)


      await submitIntegration(
        selectedIndex,
        selectedValue,
        selectedId,
      )

      await googleIntRefetch()
      await calIntRefetch()

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


      await submitIntegration(
        index,
        value,
        id,
      )

      await googleIntRefetch()
      await calIntRefetch()
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

      await googleIntRefetch()
      
    } catch (e) {
      
      await calIntRefetch()
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

          const results: {
            data: {
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
        
        const calendarGooglePeopleIntegrationId: string = calendarGooglePeopleIntegration.id

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


        await googleIntRefetch()
        await calIntRefetch()


        navigation.navigate('UserViewGoogleCalendarList', { token: newAccessToken })
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
        
         navigation.navigate('UserViewGoogleCalendarList', { token: oldAccessToken })
      }

    } catch (e) {
      
      await calIntRefetch()
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
          await openZoomOAuthLink(userId, 'settings-nav/cal-integrations')
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

      await googleIntRefetch()
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

          const results: {
            data: {
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
        
        const calendarGooglecalendar_integrationId: string = calendarGooglecalendar_integration.id

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


        await googleIntRefetch()
        await calIntRefetch()

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
      
    } catch (e: any) {
      
      if (e.code === statusCodes.SIGN_IN_CANCELLED) {
            
        } else if (e.code === statusCodes.IN_PROGRESS) {
            
        } else if (e.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
            
        } else {
        }
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

          const results: {
            data: {
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
        
        const calendarGooglePeopleIntegrationId: string = calendarGooglePeopleIntegration.id

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

        return navigation.navigate('UserViewGoogleCalendarList', { token: newAccessToken })
      }
      return navigation.navigate('UserViewGoogleCalendarList', { token: oldAccessToken })
    } catch (e: any) {
      

      if (e.code === statusCodes.SIGN_IN_CANCELLED) {
            
        } else if (e.code === statusCodes.IN_PROGRESS) {
            
        } else if (e.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
            
        } else {
        }
    }
  }

  const renderItem = ({ item, index }: renderItem) => {
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


  return (
    <Box flex={1} justifyContent="center" alignItems="center">
      {
        integrations?.length > 0
          ? (
            <Box flex={1} justifyContent="center" alignItems="center">
              <Box flex={3} justifyContent="center" alignItems="center">
                <FlatList
                  data={integrations}
                  keyExtractor={item => item.id}
                  renderItem={renderItem}
                  />
              </Box>
              {googleCalendarEnabled
                ? (
                  <Box flex={1} justifyContent="center" alignItems="center">
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
            <Text variant="header" style={{ color: dark ? palette.white : palette.darkGray }}>
              Still loading
            </Text>
          </Box>
        )
      }
      <Box>
        <Overlay overlayStyle={{ backgroundColor: dark ? palette.black : palette.white }} isVisible={isWarning} onBackdropPress={disableGoogleCalendarCheckBox}>
          <Box justifyContent="center" alignItems="center" style={{ width: '80%', backgroundColor: dark ? palette.black : palette.white}}>
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

export default UserViewCalendarAndContactIntegrations
