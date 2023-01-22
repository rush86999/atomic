import React from 'react'
import {
  useNavigation,
 } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { NavigatorScreenParams } from '@react-navigation/native'
import Box from '@components/common/Box'
import Text from '@components/common/Text'


type RootNavigationStackParamList = {
  UserToDoAndPostsTabNavigation: undefined,
  UserChangePassword: undefined,
  UserViewIntegrations: undefined,
  UserViewSettings: undefined,
  UserViewCalendarAndContactIntegrations: undefined,
  UserSelectPrimaryCalendarForSettings: undefined,
  UserEditCategories: undefined,
  UserCalendarPreferences: undefined,
  UserDeleteAccount: undefined,
  ListUserContactInfo: undefined,
  UserViewAutopilot: undefined,
}

type StackNavigationParamList = {
  UserSettingsStackNavigation: NavigatorScreenParams<RootNavigationStackParamList>
}

type UserViewSettingsNavigationProp = StackNavigationProp<
  StackNavigationParamList,
  'UserSettingsStackNavigation'
>


function UserViewSettings() {

  const navigation = useNavigation<UserViewSettingsNavigationProp>()

  const navigateToChangePass = () => navigation.navigate('UserSettingsStackNavigation', { screen: 'UserChangePassword', initial: false })

  const navigateToIntegrations = () => navigation.navigate('UserSettingsStackNavigation', { screen: 'UserViewIntegrations', initial: false })

  const navigateToCalendarIntegrations = () => navigation.navigate('UserSettingsStackNavigation', { screen: 'UserViewCalendarAndContactIntegrations', initial: false })

  const navigateToPrimaryCalendar = () => navigation.navigate('UserSettingsStackNavigation', { screen: 'UserSelectPrimaryCalendarForSettings', initial: false })

  const navigateToCategories = () => navigation.navigate('UserSettingsStackNavigation', { screen: 'UserEditCategories', initial: false })

  const navigateToCalendarPreferences = () => navigation.navigate('UserSettingsStackNavigation', { screen: 'UserCalendarPreferences', initial: false})

  const navigateToUserDeleteAccount = () => navigation.navigate('UserSettingsStackNavigation', { screen: 'UserDeleteAccount', initial: false})

  const navigateToListUserContactInfo = () => navigation.navigate('UserSettingsStackNavigation', { screen: 'ListUserContactInfo', initial: false})

  const navigateToUserViewAutopilot = () => navigation.navigate('UserSettingsStackNavigation', { screen: 'UserViewAutopilot', initial: false})

  return (
    <Box flex={1} justifyContent="center" alignItems="center">
      <Box m={{ phone: 'm', tablet: 'l' }}>
        <Text variant="buttonLink" onPress={navigateToListUserContactInfo}>
          Your Contact Info
        </Text>
      </Box>
      <Box m={{ phone: 'm', tablet: 'l' }}>
        <Text variant="buttonLink" onPress={navigateToUserViewAutopilot}>
          Autopilot
        </Text>
      </Box>
      <Box m={{ phone: 'm', tablet: 'l' }}>
        <Text variant="buttonLink" onPress={navigateToChangePass}>
          Change Password
        </Text>
      </Box>
      <Box m={{ phone: 'm', tablet: 'l' }}>
        <Text variant="buttonLink" onPress={navigateToIntegrations}>
          Integrations
        </Text>
      </Box>
      <Box m={{ phone: 'm', tablet: 'l' }}>
        <Text variant="buttonLink" onPress={navigateToCalendarIntegrations}>
          Calendar & Contact Integrations
        </Text>
      </Box>
      <Box m={{ phone: 'm', tablet: 'l' }}>
        <Text variant="buttonLink" onPress={navigateToPrimaryCalendar}>
          Select Primary Calendar
        </Text>
      </Box>
      <Box m={{ phone: 'm', tablet: 'l' }}>
        <Text variant="buttonLink" onPress={navigateToCalendarPreferences}>
          Calendar Preferences
        </Text>
      </Box>
      <Box m={{ phone: 'm', tablet: 'l' }}>
        <Text variant="buttonLink" onPress={navigateToCategories}>
          Edit Tags
        </Text>
      </Box>
      <Box m={{ phone: 'm', tablet: 'l' }}>
        <Text variant="redLink" onPress={navigateToUserDeleteAccount}>
          Delete Account
        </Text>
      </Box>
      
    </Box>
  )

}

export default UserViewSettings
