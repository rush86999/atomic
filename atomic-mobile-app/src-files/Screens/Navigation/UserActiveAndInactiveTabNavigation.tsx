import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { useNavigation } from '@react-navigation/native'
import { useDrawerStatus, DrawerNavigationProp } from '@react-navigation/drawer'
import {
  Appearance,
 } from 'react-native'

import UserProgressActiveComponentsStackNavigation from '@progress/UserProgressActiveComponentsStackNavigation'
import UserProgressInactiveComponentsStackNavigation from '@progress/UserProgressInactiveComponentsStackNavigation'

import {
  palette,
 } from '@theme/theme'

const Tab = createBottomTabNavigator()

type RootStackParamList = {
  UserActiveAndInactiveTabNavigation: undefined
}

type navigationProp = DrawerNavigationProp<
  RootStackParamList,
  'UserActiveAndInactiveTabNavigation'
>

function UserActiveAndInactiveTabNavigation() {

  const darkMode = Appearance.getColorScheme() === 'dark'

  const navigation = useNavigation<navigationProp>()
  const isDrawerOpen = useDrawerStatus()

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {

          if (route.name === 'UserProgressActiveComponentsStackNavigation') {

            return <MaterialCommunityIcons name="database" color={color} size={size} />
          } else if (route.name === 'UserProgressInactiveComponentsStackNavigation') {
            return <MaterialCommunityIcons name="database-plus" size={size} color={color} />
          }
        },
        headerTintColor: palette.white,
        headerShown: false,
      })}
      initialRouteName="UserProgressActiveComponents"
    >
      <Tab.Screen
        name="UserProgressActiveComponentsStackNavigation"
        component={UserProgressActiveComponentsStackNavigation}
        options={{
          tabBarLabel: 'Active Trackers',
          tabBarActiveTintColor: palette.white,
        }}
      />
      <Tab.Screen
        name="UserProgressInactiveComponentsStackNavigation"
        component={UserProgressInactiveComponentsStackNavigation}
        options={{
          tabBarLabel: 'Inactive Trackers',
          tabBarActiveTintColor: palette.white,
        }}
      />
    </Tab.Navigator>
  )
}

export default UserActiveAndInactiveTabNavigation
