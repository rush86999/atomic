import React, { Dispatch, SetStateAction } from 'react'
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
  DrawerItem,
} from '@react-navigation/drawer'
import { ApolloClient, ApolloConsumer, ApolloProvider, NormalizedCacheObject } from '@apollo/client'

import {
  Auth,
 } from 'aws-amplify'
 import {
   Appearance,
 } from 'react-native'

import Icon from 'react-native-vector-icons/FontAwesome'

import Box from '@components/common/Box'
import { palette } from '@theme/theme'
import UserActiveAndInactiveTabNavigation from '@navigation/UserActiveAndInactiveTabNavigation'
import UserToDoAndPostsTabNavigation from '@navigation/UserToDoAndPostsTabNavigation'
import UserProfileStackNavigation from '@profile/UserProfileStackNavigation'
import UserSettingsStackNavigation from '@screens/Settings/UserSettingsStackNavigation'
import UserMeetingAssistsStackNavigation from '@screens/Assist/UserMeetingAssistsStackNavigation'
import UserListProducts from '@screens/Payment/UserListProducts'
import UserContext from '@navigation/user-context';
import Spinner from 'react-native-spinkit'

type userContextType = {
  sub: string,
  getRealmApp: () => Realm,
  checkUserConfirmed: () => Promise<boolean>,
  isPro: boolean,
  isPremium: boolean,
  enableTesting: boolean,
  setUserConfirmed: Dispatch<SetStateAction<boolean>>,
  client: ApolloClient<NormalizedCacheObject> | null,
}

function UserListProductsWithContext() {
  return (
    <ApolloConsumer>
    {(client) => (
      <UserContext.Consumer>
        {({ sub }: userContextType) => (
          <UserListProducts client={client as ApolloClient<NormalizedCacheObject>} sub={sub} />
        )}
      </UserContext.Consumer>
    )}
    </ApolloConsumer>
  )
}

const Drawer = createDrawerNavigator()

function CustomDrawerContent(props: any) {
  return (
    <DrawerContentScrollView contentContainerStyle={{ flex: 1, justifyContent: 'space-between' }} {...props}>
      <Box>
        <DrawerItemList {...props} />
      </Box>
      <DrawerItem
        label="Sign Out"
        onPress={() => Auth.signOut()}
        icon={({ color, size }) => <Icon name="sign-out" color={color} size={size} />}
      />
    </DrawerContentScrollView>
  )
}
type Props = {
  client: null | ApolloClient<NormalizedCacheObject>,
}

/**
 * 
 * @param props 
 * @returns 
 * <Drawer.Screen
          name="UserListProducts"
          component={UserListProductsWithContext}
          options={{
            drawerLabel: 'Go Pro',
            headerTitle: 'Go Pro',
            headerShown: true,
            headerTintColor: palette.white,
          }}
        />
 */
function UserDrawerNavigation(props: Props ) {
  const darkMode = Appearance.getColorScheme() === 'dark'
  const client = props?.client
  if (!client) {
    return (
      <Box backgroundColor="primaryCardBackground" flex={1} justifyContent="center" alignItems="center" style={{ width: '100%'}}>
          <Spinner isVisible={true} type="ThreeBounce" size={100} color={darkMode ? palette.textBlack : palette.white} />
      </Box>
      )
  }
  return (
    <ApolloProvider client={client}>
      <Drawer.Navigator
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          drawerActiveTintColor: palette.white,
          drawerInactiveTintColor: palette.white,
          headerShown: false,
        }}
      >
        <Drawer.Screen
          name="UserToDoAndPostsTabNavigation"
          component={UserToDoAndPostsTabNavigation}
          options={{
            drawerLabel: 'Home',
            headerTitle: 'Home',
          }}

        />
        <Drawer.Screen
          name="UserMeetingAssistsStackNavigation"
          component={UserMeetingAssistsStackNavigation}
          options={{
            drawerLabel: 'Meeting Assists',
            headerTitle: 'Meeting Assists',
          }}
        />
        <Drawer.Screen
          name="UserActiveAndInactiveTabNavigation"
          component={UserActiveAndInactiveTabNavigation}
          options={{
            drawerLabel: 'Trackers',
            headerTitle: 'Trackers',
          }}
        />
        <Drawer.Screen
          name="UserProfileStackNavigation"
          component={UserProfileStackNavigation}
          options={{
            drawerLabel: 'Profile',
            headerTitle: 'Profile',
          }}
        />
        <Drawer.Screen
          name="UserSettingsStackNavigation"
          component={UserSettingsStackNavigation}
          options={{
            drawerLabel: 'Settings',
            headerTitle: 'Settings',
          }}
        />
      </Drawer.Navigator>
    </ApolloProvider>
  )
}

export default UserDrawerNavigation
