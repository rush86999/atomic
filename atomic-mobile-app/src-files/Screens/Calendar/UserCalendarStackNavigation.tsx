import React from 'react'
import { RouteProp } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { ApolloClient, ApolloConsumer, NormalizedCacheObject } from '@apollo/client'
import UserContext from '@navigation/user-context'

import { useNavigation } from '@react-navigation/native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { Pressable } from 'react-native'
import { DrawerNavigationProp } from '@react-navigation/drawer'
import Box from '@components/common/Box'

type userContextType = {
    sub: string
    getRealmApp: () => Realm,
    isPro: boolean,
    isPremium: boolean,
    enableTesting: boolean,
}

import UserAddFollowUp from '@screens/Calendar/UserAddFollowUp'
import UserCreateEvent from '@screens/Calendar/UserCreateEvent'
import UserEditEvent from '@screens/Calendar/UserEditEvent'
import UserTrainEvent from '@screens/Calendar/UserTrainEvent'
import UserViewCalendar from '@screens/Calendar/UserViewCalendar'
import UserEventTimePreferences from '@screens/Calendar/UserEventTimePreferences'
import UserCreateMeetingAssist from '@screens/Assist/UserCreateMeetingAssist'

import { palette } from '@theme/theme'

type UserCreateMeetingAssistStackEventParamList = {
  UserCreateMeetingAssist: undefined,
}

type UserCreateMeetingAssistRouteProp = RouteProp<
  UserCreateMeetingAssistStackEventParamList,
  'UserCreateMeetingAssist'
>

type UserCreateMeetingAssistProps = {
  route: UserCreateMeetingAssistRouteProp,
}

function UserCreateMeetingAssistWithContext(props: UserCreateMeetingAssistProps) {
  return (
      <ApolloConsumer>
        {client => (
          <UserContext.Consumer>
            {({ sub }: userContextType) =>
            (
              <UserCreateMeetingAssist client={client as ApolloClient<NormalizedCacheObject>} sub={sub} {...props} />
            )}
          </UserContext.Consumer>
        )}
    </ApolloConsumer>
  )
}


type UserEventTimePreferencesStackEventParamList = {
    UserEventTimePreferences: {
        eventId: string,
    },
}

type UserEventTimePreferencesRouteProp = RouteProp<
UserEventTimePreferencesStackEventParamList,
  'UserEventTimePreferences'
  >

type UserEventTimePreferencesProps = {
  userId: string,
  route: UserEventTimePreferencesRouteProp,
}

function UserEventTimePreferencesWithContext(props: UserEventTimePreferencesProps) {
    return (
        <ApolloConsumer>
          {client => (
            <UserContext.Consumer>
              {({ sub }: userContextType) =>
              (
                <UserEventTimePreferences client={client as ApolloClient<NormalizedCacheObject>} userId={sub} {...props} />
              )}
            </UserContext.Consumer>
          )}
      </ApolloConsumer>
    )
}



type UserAddFollowUpStackEventParamList = {
    UserAddFollowUp: {
        eventId: string,
        sub: string,
    },
}

type UserAddFollowUpRouteProp = RouteProp<
UserAddFollowUpStackEventParamList,
  'UserAddFollowUp'
    >

type UserAddFollowUpProps = {
  sub: string,
  route: UserAddFollowUpRouteProp,
}

function UserAddFollowUpWithContext(props: UserAddFollowUpProps) {
    return (
        <ApolloConsumer>
          {client => (
            <UserContext.Consumer>
              {({ sub }: userContextType) =>
              (
                <UserAddFollowUp client={client as ApolloClient<NormalizedCacheObject>} sub={sub} {...props} />
              )}
            </UserContext.Consumer>
          )}
      </ApolloConsumer>
    )
}

type UserCreateEventStackEventParamList = {
    UserCreateEvent: {
      hour: number;
      minutes?: number;
      date: string // YYYY-MM-DD
    },
  }
  
  type UserCreateEventRouteProp = RouteProp<
  UserCreateEventStackEventParamList,
    'UserCreateEvent'
  >
  
  type UserCreateEventProps = {
    sub: string,
    route: UserCreateEventRouteProp,
  }

function UserCreateEventWithContext(props: UserCreateEventProps) {
    return (
        <ApolloConsumer>
          {client => 
            (
              <UserContext.Consumer>
                {({ sub }: userContextType) =>
                  (
                    <UserCreateEvent client={client as ApolloClient<NormalizedCacheObject>} sub={sub} {...props} />
                  )}
              </UserContext.Consumer>
            )}
        </ApolloConsumer>
    )
}

type UserEditEventStackEventParamList = {
    UserEditEvent: {
        eventId: string,
    },
}

type UserEditEventRouteProp = RouteProp<
  UserEditEventStackEventParamList,
  'UserEditEvent'
>

type UserEditEventProps = {
  sub: string,
  route: UserEditEventRouteProp,
}

function UserEditEventWithContext(props: UserEditEventProps) {
    return (
      <ApolloConsumer>
        {client => (
          <UserContext.Consumer>
            {({ sub }: userContextType) =>
            (
              <UserEditEvent client={client as ApolloClient<NormalizedCacheObject>} sub={sub} {...props} />
            )}
          </UserContext.Consumer>
        )}
      </ApolloConsumer>
    )
}


type UserTrainEventStackEventParamList = {
    UserTrainEvent: {
        eventId: string,
    },
}

type UserTrainEventRouteProp = RouteProp<
  UserTrainEventStackEventParamList,
  'UserTrainEvent'
>

type UserTrainEventProps = {
    sub: string,
    route: UserTrainEventRouteProp,
}

function UserTrainEventWithContext(props: UserTrainEventProps) {
    return (
      <ApolloConsumer>
        {client => (
          <UserContext.Consumer>
            {({ sub }: userContextType) =>
            (
              <UserTrainEvent client={client as ApolloClient<NormalizedCacheObject>} sub={sub} {...props} />
            )}
          </UserContext.Consumer>
        )}
      </ApolloConsumer>
    )
}

type UserViewCalendarRouteStackParamList = {
    UserViewCalendar: undefined,
}

type UserViewCalendarRouteProp = RouteProp<
  UserViewCalendarRouteStackParamList,
  'UserViewCalendar'>

type UserViewCalendarProps = {
    sub: string,
    route: UserViewCalendarRouteProp,
    isPro: boolean,
    isPremium: boolean,
    enableTesting: boolean,
}

function UserViewCalendarWithContext(props: UserViewCalendarProps) {
    return (
      <ApolloConsumer>
        {client => (
          <UserContext.Consumer>
            {({ sub, isPro, isPremium, enableTesting }: userContextType) =>
            (
              <UserViewCalendar 
                client={client as ApolloClient<NormalizedCacheObject>} 
                isPro={isPro} 
                isPremium={isPremium} 
                enableTesting={enableTesting} 
                sub={sub} {...props} 
              />
            )}
          </UserContext.Consumer>
        )}
    </ApolloConsumer>
    )
}

type RootStackParamList = {
    UserAddFollowUp: {
        eventId: string,
        sub: string,
    },
    UserCreateEvent: {
        hour: number;
        minutes?: number;
        date: string // YYYY-MM-DD
    },
    UserEditEvent: {
        eventId: string,
    },
    UserTrainEvent: {
        eventId: string,
    },
    UserEventTimePreferences: {
      eventId: string,
    },
    UserCreateMeetingAssist: undefined,
    UserViewCalendar: undefined,
    UserCalendarStackNavigation: undefined,
}

type NavigationProps = DrawerNavigationProp<RootStackParamList, 'UserCalendarStackNavigation'>

function UserCalendarStackNavigation() {
    const Stack = createStackNavigator<RootStackParamList>()

    const navigation = useNavigation<NavigationProps>()

    return (
      <Stack.Navigator initialRouteName="UserViewCalendar" screenOptions={{ headerTintColor: palette.white }}>
             <Stack.Screen
                name="UserCreateMeetingAssist"
                component={UserCreateMeetingAssistWithContext}
                options={{ title: 'Create a new Meeting Assist' }}
            />
            <Stack.Screen
                name="UserEventTimePreferences"
                component={UserEventTimePreferencesWithContext}
                options={{ title: 'Time Preferences' }}
            />
            <Stack.Screen
                name="UserAddFollowUp"
                component={UserAddFollowUpWithContext}
                options={{ title: 'Add Follow Up' }}
            />
            <Stack.Screen
                name="UserCreateEvent"
                component={UserCreateEventWithContext}
                options={{ title: 'Add Event' }}
            />
            <Stack.Screen
                name="UserEditEvent"
                component={UserEditEventWithContext}
                options={{ title: 'Modify Event' }}
            />
            <Stack.Screen
                name="UserTrainEvent"
                component={UserTrainEventWithContext}
                options={{ title: 'Train Event' }}
            />
            <Stack.Screen
                name="UserViewCalendar"
                component={UserViewCalendarWithContext}
                options={{
                    title: 'Calendar',
                    headerLeft: () => (
                      <Box ml={{ phone: 's', tablet: 'm' }}>
                        <Pressable onPress={() => navigation.toggleDrawer()}>
                          <Ionicons name="menu" size={24} color={palette.white} />
                        </Pressable>
                      </Box>
                    ),
                    headerTintColor: palette.white,
                  }}
            />
        </Stack.Navigator>
    )
}

export default UserCalendarStackNavigation