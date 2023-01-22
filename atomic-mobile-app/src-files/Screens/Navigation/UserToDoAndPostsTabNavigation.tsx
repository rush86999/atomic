import React from 'react'
import {
  Appearance,
 } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { useDrawerStatus, DrawerNavigationProp } from '@react-navigation/drawer'


import UserListPostsStackNavigation from '@post/UserListPostsStackNavigation'
import UserTaskStackNavigation from '@progress/Todo/UserTaskStackNavigation'
import UserCalendarStackNavigation from '@screens/Calendar/UserCalendarStackNavigation'


import { palette } from '@theme/theme'

const Tab = createBottomTabNavigator()

type RootStackParamList = {
  UserToDoAndPostsTabNavigation: undefined
}

type navigationProp = DrawerNavigationProp<
  RootStackParamList,
  'UserToDoAndPostsTabNavigation'
>

function UserToDoAndPostsTabNavigation() {

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {

          if (route.name === 'UserTaskNavigation') {

            return <FontAwesome5 name="tasks" color={color} size={size} />
          } else if (route.name === 'UserListPosts') {
            const iconName = focused ? 'image-multiple' : 'image-multiple-outline'
            return <MaterialCommunityIcons name={iconName} size={size} color={color} />
          } else if (route.name === 'UserCalendar') {
            const iconName = focused ? 'ios-calendar' : 'ios-calendar-outline'
            return <Ionicons name={iconName} size={size} color={color} />
          }

        },
        headerTintColor: palette.white,
        headerShown: false,
      })}
      initialRouteName="UserTaskNavigation"
    >
      <Tab.Screen
        name="UserTaskNavigation"
        component={UserTaskStackNavigation}
        options={{
          tabBarLabel: 'Tasks',
          tabBarActiveTintColor: palette.white,
        }}
      />
      <Tab.Screen
        name="UserCalendar"
        component={UserCalendarStackNavigation}
        options={{
          tabBarLabel: 'Calendar',
          tabBarActiveTintColor: palette.white,
        }}
      />
      <Tab.Screen
        name="UserListPosts"
        component={UserListPostsStackNavigation}
        options={{
          tabBarLabel: 'Community',
          tabBarActiveTintColor: palette.white,
        }}
      />
    </Tab.Navigator>
  )
}

export default UserToDoAndPostsTabNavigation
