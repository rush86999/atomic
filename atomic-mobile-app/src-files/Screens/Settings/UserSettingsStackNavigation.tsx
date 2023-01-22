import React, { Dispatch, SetStateAction } from 'react'
import {createStackNavigator} from '@react-navigation/stack'

import { RouteProp, useNavigation } from '@react-navigation/native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { Pressable } from 'react-native'

import { DrawerNavigationProp } from '@react-navigation/drawer'
import UserContext from '@navigation/user-context'

import Box from '@components/common/Box'
import { palette } from '@theme/theme'

import UserViewSettings from '@screens/Settings/UserViewSettings'
import UserChangePassword from '@screens/User/Login/UserChangePassword'
import UserViewIntegrations from '@screens/Settings/UserViewIntegrations'
import UserViewCalendarAndContactIntegrations from '@screens/Settings/UserViewCalendarAndContactIntegrations'
import UserViewGoogleCalendarList from '@screens/Settings/UserViewGoogleCalendarList'
import UserEditCategories from '@screens/Settings/UserEditCategories'
import UserEditCategory from '@screens/Settings/UserEditCategory'
import UserSelectPrimaryCalendarForSettings from '@screens/Settings/UserSelectPrimaryCalendarForSettings'
import UserCalendarPreferences from '@screens/Settings/UserCalendarPreferences'
import UserDeleteAccount from '@screens/User/Delete/UserDeleteAccount'
import ListUserContactInfo from '@screens/Contact/ListUserContactInfo'
import UserViewAutopilot from '@screens/Settings/Autopilot/UserViewAutopilot'

import { ApolloClient, ApolloConsumer, NormalizedCacheObject } from '@apollo/client'



type setUserConfirmedType = Dispatch<SetStateAction<boolean>>

type userContextType = {
  sub: string,
  getRealmApp: () => Realm,
  isPro: boolean,
  isPremium: boolean,
  enableTesting: boolean,
  setUserConfirmed: setUserConfirmedType,
  checkUserConfirmed: () => Promise<boolean>,
}

type ListUserContactInfoRouteStackParamList = {
  ListUserContactInfo: undefined,
}

type ListUserContactInfoRouteProp = RouteProp<
  ListUserContactInfoRouteStackParamList,
  'ListUserContactInfo'>

type ListUserContactInfoProps = {
  route: ListUserContactInfoRouteProp,
}

function ListUserContactInfoWithContext(props: ListUserContactInfoProps) {
  return (
    <ApolloConsumer>
      {client => (
      <UserContext.Consumer>
        {({ sub }: userContextType) => (
          <ListUserContactInfo 
            client={client as ApolloClient<NormalizedCacheObject>}
            sub={sub}
            route={props?.route}
          />
        )}
      </UserContext.Consumer>
    )}
  </ApolloConsumer>
  )
}

type UserViewAutopilotRouteStackParamList = {
  UserViewAutopilot: undefined,
}

type UserViewAutopilotRouteProp = RouteProp<
  UserViewAutopilotRouteStackParamList,
  'UserViewAutopilot'>

type UserViewAutopilotProps = {
  route: UserViewAutopilotRouteProp,
}

function UserViewAutopilotWithContext(props: UserViewAutopilotProps) {
  return (
    <ApolloConsumer>
      {client => (
      <UserContext.Consumer>
        {({ sub }: userContextType) => (
          <UserViewAutopilot 
            client={client as ApolloClient<NormalizedCacheObject>}
            sub={sub}
            route={props?.route}
          />
        )}
      </UserContext.Consumer>
    )}
  </ApolloConsumer>
  )
}


function UserCalendarPreferencesWithContext() {
  return (
    <ApolloConsumer>
      {client => (
      <UserContext.Consumer>
        {({ sub }: userContextType) => (
          <UserCalendarPreferences 
            client={client as ApolloClient<NormalizedCacheObject>}
            sub={sub} 
          />
        )}
      </UserContext.Consumer>
    )}
  </ApolloConsumer>
  )
}

function UserSelectPrimaryCalendarForSettingsWithContext() {
  return (
    <ApolloConsumer>
      {client => (
      <UserContext.Consumer>
        {({ sub }: userContextType) => (
          <UserSelectPrimaryCalendarForSettings 
            client={client as ApolloClient<NormalizedCacheObject>}
            userId={sub} 
          />
        )}
      </UserContext.Consumer>
    )}
  </ApolloConsumer>
  )
}

type UserViewGoogleCalendarListRouteStackParamList = {
  UserViewGoogleCalendarList: {
    token: string,
  },
}

type UserViewGoogleCalendarListRouteProp = RouteProp<
  UserViewGoogleCalendarListRouteStackParamList,
  'UserViewGoogleCalendarList'>

type UserViewGoogleCalendarListProps = {
  route: UserViewGoogleCalendarListRouteProp,
}
function UserViewGoogleCalendarListWithContext(props: UserViewGoogleCalendarListProps) {
  return (
    <ApolloConsumer>
    {client => (
      <UserContext.Consumer>
        {({ sub, isPro, isPremium, enableTesting }: userContextType) => (
          <UserViewGoogleCalendarList 
            sub={sub} 
            client={client as ApolloClient<NormalizedCacheObject>}
            isPro={isPro}
            isPremium={isPremium}
            enableTesting={enableTesting}
            {...props}
          />
        )}
      </UserContext.Consumer>
    )}
  </ApolloConsumer>
  )
}

type UserEditCategoriesRouteStackParamList = {
    UserEditCategories: {
        isUpdate?: string,
  }
}

type UserEditCategoriesRouteProp = RouteProp<
  UserEditCategoriesRouteStackParamList,
    'UserEditCategories'
    >

type UserEditCategoriesProps = {
    route: UserEditCategoriesRouteProp,
}

function UserEditCategoriesWithContext(props: UserEditCategoriesProps) {
  return (
    <ApolloConsumer>
    {client => (
      <UserContext.Consumer>
        {({ sub }: userContextType) => (
          <UserEditCategories 
            sub={sub} 
              client={client as ApolloClient<NormalizedCacheObject>}
              {...props}
          />
        )}
      </UserContext.Consumer>
    )}
  </ApolloConsumer>
  )
}

type UserEditCategoryRouteStackParamList = {
  UserEditCategory: {
    categoryId: string,
    name: string,
  },
}

type UserEditCategoryRouteProp = RouteProp<
  UserEditCategoryRouteStackParamList,
  'UserEditCategory'>

type UserEditCategoryProps = {
  route: UserEditCategoryRouteProp,
}

function UserEditCategoryWithContext(props: UserEditCategoryProps) {
  return (
    <ApolloConsumer>
      {client => (
        <UserContext.Consumer>
          {({ sub }: userContextType) => (
            <UserEditCategory
              {...props} 
              sub={sub} 
              client={client as ApolloClient<NormalizedCacheObject>}
            />
          )}
        </UserContext.Consumer>
      )}
    </ApolloConsumer>
  )
}

function UserViewIntegrationsWithContext() {
  return (
    <UserContext.Consumer>
      {({ sub }: userContextType) => (
        <UserViewIntegrations sub={sub} />
      )}
    </UserContext.Consumer>
  )
}


function UserDeleteAccountWithContext() {
  return (
    <UserContext.Consumer>
      {({ checkUserConfirmed, getRealmApp, setUserConfirmed }: userContextType) => (
        <UserDeleteAccount
          checkUserConfirmed={checkUserConfirmed}
          getRealmApp={getRealmApp}
          setUserConfirmed={setUserConfirmed}
        />
      )}
    </UserContext.Consumer>
  )
}

function UserViewCalendarAndContactIntegrationsWithContext() {
  return (
    <ApolloConsumer>
      {client => (
          <UserContext.Consumer>
          {({ sub, isPro, isPremium, enableTesting }: userContextType) => (
            <UserViewCalendarAndContactIntegrations
              sub={sub}
              client={client as ApolloClient<NormalizedCacheObject>}
              isPro={isPro}
              isPremium={isPremium}
              enableTesting={enableTesting}
             />
          )}
        </UserContext.Consumer>
      )}
    </ApolloConsumer>
  )
}

const rescapeUnsafe = (safe: string) => safe
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#039;/g, '\'')
  .replace(/-/gi, ' ')

type RootStackParamList = {
  UserViewGoogleCalendarList: undefined,
  UserSelectPrimaryCalendarForSettings: undefined,
  UserViewSettings: undefined,
  UserChangePassword: undefined,
  UserViewIntegrations: { sub: string },
  UserViewCalendarAndContactIntegrations: { sub: string },
  UserSettingsStackNavigation: undefined,
  UserEditCategories: undefined,
  UserEditCategory: { categoryId: string, name: string },
  UserListProducts: undefined,
  UserCalendarPreferences: undefined,
  UserDeleteAccount: undefined,
  ListUserContactInfo: undefined,
  UserViewAutopilot: undefined,
}

type NavigationProps = DrawerNavigationProp<RootStackParamList, 'UserSettingsStackNavigation'>

function UserSettingsStackNavigation() {
  const Stack = createStackNavigator<RootStackParamList>()
  const navigation = useNavigation<NavigationProps>()

  return (
    <Stack.Navigator initialRouteName="UserViewSettings">
        <Stack.Screen
        name="UserViewSettings"
        component={UserViewSettings}
        options={{ title:
          'Settings',
          headerLeft: () => (
            <Box ml={{ phone: 's', tablet: 'm' }}>
              <Pressable onPress={() => navigation.toggleDrawer()}>
                <Ionicons name="menu" size={24} color={palette.white} />
              </Pressable>
            </Box>
          ),
        }}
      />
      <Stack.Screen
        name="UserViewGoogleCalendarList"
        component={UserViewGoogleCalendarListWithContext}
        options={{ title: 'Google Calendar List', headerLeft: () => (
            <Box ml={{ phone: 's', tablet: 'm' }}>
              <Pressable onPress={() => navigation.navigate('UserViewSettings')}>
                <Ionicons name="ios-chevron-back" size={24} color={palette.white} />
              </Pressable>
            </Box>
          ), }}
      />
      <Stack.Screen
        name="UserSelectPrimaryCalendarForSettings"
        component={UserSelectPrimaryCalendarForSettingsWithContext}
        options={{ title: 'Select Primary Calendar', headerLeft: () => (
            <Box ml={{ phone: 's', tablet: 'm' }}>
              <Pressable onPress={() => navigation.navigate('UserViewSettings')}>
                <Ionicons name="ios-chevron-back" size={24} color={palette.white} />
              </Pressable>
            </Box>
          ), }}
      />
      <Stack.Screen
        name="UserCalendarPreferences"
        component={UserCalendarPreferencesWithContext}
        options={{ title: 'Calendar Preferences', headerLeft: () => (
            <Box ml={{ phone: 's', tablet: 'm' }}>
              <Pressable onPress={() => navigation.navigate('UserViewSettings')}>
                <Ionicons name="ios-chevron-back" size={24} color={palette.white} />
              </Pressable>
            </Box>
          ), }}
      />
      <Stack.Screen
        name="UserChangePassword"
        component={UserChangePassword}
        options={{ title: 'Change Password', headerLeft: () => (
            <Box ml={{ phone: 's', tablet: 'm' }}>
              <Pressable onPress={() => navigation.navigate('UserViewSettings')}>
                <Ionicons name="ios-chevron-back" size={24} color={palette.white} />
              </Pressable>
            </Box>
          ), }}
      />
      <Stack.Screen
        name="UserViewIntegrations"
        component={UserViewIntegrationsWithContext}
        options={{ title: 'Integrations', headerLeft: () => (
            <Box ml={{ phone: 's', tablet: 'm' }}>
              <Pressable onPress={() => navigation.navigate('UserViewSettings')}>
                <Ionicons name="ios-chevron-back" size={24} color={palette.white} />
              </Pressable>
            </Box>
          ), }}
      />
      <Stack.Screen
        name="UserViewCalendarAndContactIntegrations"
        component={UserViewCalendarAndContactIntegrationsWithContext}
        options={{ title: 'Calendar & Contact Integrations', headerLeft: () => (
            <Box ml={{ phone: 's', tablet: 'm' }}>
              <Pressable onPress={() => navigation.navigate('UserViewSettings')}>
                <Ionicons name="ios-chevron-back" size={24} color={palette.white} />
              </Pressable>
            </Box>
          ), }}
      />
       <Stack.Screen
        name="UserEditCategories"
        component={UserEditCategoriesWithContext}
        options={{ title: 'Edit Tags', headerLeft: () => (
            <Box ml={{ phone: 's', tablet: 'm' }}>
              <Pressable onPress={() => navigation.navigate('UserViewSettings')}>
                <Ionicons name="ios-chevron-back" size={24} color={palette.white} />
              </Pressable>
            </Box>
          ), }}
      />
      <Stack.Screen
        name="UserEditCategory"
        component={UserEditCategoryWithContext}
        options={({ route }) => ({ title: `${rescapeUnsafe(route?.params?.name)}`, headerLeft: () => (
            <Box ml={{ phone: 's', tablet: 'm' }}>
              <Pressable onPress={() => navigation.navigate('UserEditCategories')}>
                <Ionicons name="ios-chevron-back" size={24} color={palette.white} />
              </Pressable>
            </Box>
          ), })}
        />
        <Stack.Screen
          name="UserDeleteAccount"
          component={UserDeleteAccountWithContext}
          options={() => ({ title: `Delete Account`, headerLeft: () => (
            <Box ml={{ phone: 's', tablet: 'm' }}>
              <Pressable onPress={() => navigation.navigate('UserViewSettings')}>
                <Ionicons name="ios-chevron-back" size={24} color={palette.white} />
              </Pressable>
            </Box>
          ), })}
        />
        <Stack.Screen
          name="ListUserContactInfo"
          component={ListUserContactInfoWithContext}
          options={() => ({ title: `Your Contact Info`, headerLeft: () => (
            <Box ml={{ phone: 's', tablet: 'm' }}>
              <Pressable onPress={() => navigation.navigate('UserViewSettings')}>
                <Ionicons name="ios-chevron-back" size={24} color={palette.white} />
              </Pressable>
            </Box>
          ), })}
        />
        <Stack.Screen
          name="UserViewAutopilot"
          component={UserViewAutopilotWithContext}
          options={() => ({ title: `Autopilot`, headerLeft: () => (
            <Box ml={{ phone: 's', tablet: 'm' }}>
              <Pressable onPress={() => navigation.navigate('UserViewSettings')}>
                <Ionicons name="ios-chevron-back" size={24} color={palette.white} />
              </Pressable>
            </Box>
          ), })}
        />
    </Stack.Navigator>
  )
}

export default UserSettingsStackNavigation
