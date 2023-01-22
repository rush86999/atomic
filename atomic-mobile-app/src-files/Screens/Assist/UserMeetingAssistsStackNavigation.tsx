import React, { Dispatch, SetStateAction } from 'react'

import {createStackNavigator} from '@react-navigation/stack'

import { RouteProp, useNavigation } from '@react-navigation/native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { Pressable } from 'react-native'

import { DrawerNavigationProp } from '@react-navigation/drawer'
import { ApolloClient, ApolloConsumer, NormalizedCacheObject } from '@apollo/client'


import UserContext from '@navigation/user-context'
import Box from '@components/common/Box'
import { palette } from '@theme/theme'

import UserListMeetingAssists from '@screens/Assist/UserListMeetingAssists'
import UserEditMeetingAssist from '@screens/Assist/UserEditMeetingAssist'

type userContextType = {
    sub: string,
    getRealmApp: () => Realm,
    isPro: boolean,
    isPremium: boolean,
    enableTesting: boolean,
}

type UserListMeetingAssistsRouteStackParamList = {
    UserListMeetingAssists: undefined,
}

type UserListMeetingAssistsRouteProp = RouteProp<
  UserListMeetingAssistsRouteStackParamList,
  'UserListMeetingAssists'>

type UserListMeetingAssistsProps = {
  route: UserListMeetingAssistsRouteProp,
}

function UserListMeetingAssistsWithContext(props: UserListMeetingAssistsProps) {
    return (
      <ApolloConsumer>
        {client => (
        <UserContext.Consumer>
          {({ sub }: userContextType) => (
            <UserListMeetingAssists 
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

  type UserEditMeetingAssistRouteStackParamList = {
    UserEditMeetingAssist: {
        meetingId: string,
    },
}

type UserEditMeetingAssistRouteProp = RouteProp<
  UserEditMeetingAssistRouteStackParamList,
  'UserEditMeetingAssist'>

type UserEditMeetingAssistProps = {
  route: UserEditMeetingAssistRouteProp,
}

function UserEditMeetingAssistWithContext(props: UserEditMeetingAssistProps) {
    return (
      <ApolloConsumer>
        {client => (
        <UserContext.Consumer>
          {({ sub }: userContextType) => (
            <UserEditMeetingAssist 
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

  type RootStackParamList = {
    UserListMeetingAssists: undefined,
    UserEditMeetingAssist: {
        meetingId: string,
    },
    UserMeetingAssistsStackNavigation: undefined,
  }

  type NavigationProps = DrawerNavigationProp<RootStackParamList, 'UserMeetingAssistsStackNavigation'>


function UserMeetingAssistsStackNavigation() {
    const Stack = createStackNavigator<RootStackParamList>()
    const navigation = useNavigation<NavigationProps>()


    return (
        <Stack.Navigator initialRouteName="UserListMeetingAssists">
            <Stack.Screen
                name="UserListMeetingAssists"
                component={UserListMeetingAssistsWithContext}
                options={{ title:
                'Meeting Assists',
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
                name="UserEditMeetingAssist"
                component={UserEditMeetingAssistWithContext}
                options={{ title: 'Edit Meeting Assist', headerLeft: () => (
                    <Box ml={{ phone: 's', tablet: 'm' }}>
                    <Pressable onPress={() => navigation.navigate('UserListMeetingAssists')}>
                        <Ionicons name="ios-chevron-back" size={24} color={palette.white} />
                    </Pressable>
                    </Box>
                ), }}
            />
        </Stack.Navigator>
    )

}
  

export default UserMeetingAssistsStackNavigation

