import React from 'react'
import { RouteProp } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'

import { useNavigation } from '@react-navigation/native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { Pressable } from 'react-native'
import { DrawerNavigationProp } from '@react-navigation/drawer'
import Box from '@components/common/Box'

import UserContext from '@navigation/user-context'

type userContextType = {
  sub: string,
  getRealmApp: () => Realm,
}

import UserProgressInactiveComponents from '@progress/UserProgressInactiveComponents'
import UserCreateActivateSpecificExercise from '@progress/Exercise/UserCreateActivateSpecificExercise'
import UserCreateSpecificExercise from '@progress/Exercise/UserCreateSpecificExercise'
import UserListExercises from '@progress/Exercise/UserListExercises'
import UserCreateRoutine from '@progress/Routine/UserCreateRoutine'
import UserListRoutines from '@progress/Routine/UserListRoutines'
import UserCreateActivateHabit from '@progress/Habit/UserCreateActivateHabit'
import UserCreateActivateLimit from '@progress/Limit/UserCreateActivateLimit'
import UserCreateActivateMeditate from '@progress/Meditation/UserCreateActivateMeditate'
import UserCreateActivateNewSkill from '@progress/NewSkill/UserCreateActivateNewSkill'
import UserCreateActivateRoutine from '@progress/Routine/UserCreateActivateRoutine'
import UserCreateActivateSteps from '@progress/Steps/UserCreateActivateSteps'
import UserCreateActivateWeight from '@progress/Weight/UserCreateActivateWeight'

import {
  PrimaryGoalType,
} from '@models'

import { palette } from '@theme/theme'

type UserCreateActivateSpecificExerciseStackParamList = {
UserCreateActivateSpecificExercise: {
  name: string,
  goalType: PrimaryGoalType,
  exerciseId: string,
  activateId?: string,
  },
}

type UserCreateActivateSpecificExerciseRouteProp = RouteProp<
  UserCreateActivateSpecificExerciseStackParamList,
  'UserCreateActivateSpecificExercise'
>

type UserCreateActivateSpecificExerciseProps = {
  route: UserCreateActivateSpecificExerciseRouteProp,
}

function UserCreateActivateSpecificExerciseWithContext(props: UserCreateActivateSpecificExerciseProps) {
  return (
    <UserContext.Consumer>
      {({ sub }: userContextType) =>
      (
        <UserCreateActivateSpecificExercise sub={sub} {...props} />
      )}
    </UserContext.Consumer>
  )
}

function UserProgressInactiveComponentsWithContext() {
  return (
    <UserContext.Consumer>
      {({ sub, getRealmApp }: userContextType) =>
      (
        <UserProgressInactiveComponents getRealmApp={getRealmApp} sub={sub} />
      )}
    </UserContext.Consumer>
  )
}


type UserCreateActivateHabitStackParamList = {
  UserCreateActivateHabit: {
    name: string,
    activateId?: string,
  },
}

type UserCreateActivateHabitRouteProp = RouteProp<
  UserCreateActivateHabitStackParamList,
  'UserCreateActivateHabit'
>

type UserCreateActivateHabitProps = {
  route: UserCreateActivateHabitRouteProp,
}

function UserCreateActivateHabitWithContext(props: UserCreateActivateHabitProps) {
  return (
    <UserContext.Consumer>
      {({ sub }: userContextType) =>
      (
        <UserCreateActivateHabit sub={sub} {...props} />
      )}
    </UserContext.Consumer>
  )
}

type UserCreateActivateLimitStackParamList = {
  UserCreateActivateLimit: {
    name: string,
    activateId?: string,
  },
}

type UserCreateActivateLimitRouteProp = RouteProp<
  UserCreateActivateLimitStackParamList,
  'UserCreateActivateLimit'
>

type UserCreateActivateLimitProps = {
  route: UserCreateActivateLimitRouteProp,
}

function UserCreateActivateLimitWithContext(props: UserCreateActivateLimitProps) {
  return (
    <UserContext.Consumer>
      {({ sub }: userContextType) =>
      (
        <UserCreateActivateLimit sub={sub} {...props} />
      )}
    </UserContext.Consumer>
  )
}

type UserCreateActivateMeditateRouteStackParamList = {
  UserCreateActivateMeditate: {
    activateId: string,
  }
}

type UserCreateActivateMeditateRouteProp = RouteProp<
  UserCreateActivateMeditateRouteStackParamList,
  'UserCreateActivateMeditate'
>

type UserCreateActivateMeditateProps = {
  route: UserCreateActivateMeditateRouteProp,
}

function UserCreateActivateMeditateWithContext(props: UserCreateActivateMeditateProps) {
  return (
    <UserContext.Consumer>
      {({ sub }: userContextType) =>
      (
        <UserCreateActivateMeditate sub={sub} {...props} />
      )}
    </UserContext.Consumer>
  )
}

type UserCreateActivateNewSkillStackParamList = {
  UserCreateActivateNewSkill: {
    name: string,
    activateId?: string,
  },
}

type UserCreateActivateNewSkillRouteProp = RouteProp<
  UserCreateActivateNewSkillStackParamList,
  'UserCreateActivateNewSkill'
>

type UserCreateActivateNewSkillProps = {
  route: UserCreateActivateNewSkillRouteProp,
}

function UserCreateActivateNewSkillWithContext(props: UserCreateActivateNewSkillProps) {
  return (
    <UserContext.Consumer>
      {({ sub }: userContextType) =>
      (
        <UserCreateActivateNewSkill sub={sub} {...props} />
      )}
    </UserContext.Consumer>
  )
}

type UserCreateActivateRoutineStackParamList = {
  UserCreateActivateRoutine: {
    name: string,
    activateId?: string,
    routineId: string,
  },
}

type UserCreateActivateRoutineRouteProp = RouteProp<
  UserCreateActivateRoutineStackParamList,
  'UserCreateActivateRoutine'
>

type UserCreateActivateRoutineProps = {
  route: UserCreateActivateRoutineRouteProp,
}

function UserCreateActivateRoutineWithContext(props: UserCreateActivateRoutineProps) {
  return (
    <UserContext.Consumer>
      {({ sub }: userContextType) =>
      (
        <UserCreateActivateRoutine sub={sub} {...props} />
      )}
    </UserContext.Consumer>
  )
}


type UserCreateActivateStepsRouteStackParamList = {
  UserCreateActivateSteps: {
    activateId: string,
  }
}

type UserCreateActivateStepsRouteProp = RouteProp<
  UserCreateActivateStepsRouteStackParamList,
  'UserCreateActivateSteps'
>

type UserCreateActivateStepsProps = {
  route: UserCreateActivateStepsRouteProp,
}

function UserCreateActivateStepsWithContext(props: UserCreateActivateStepsProps) {
  return (
    <UserContext.Consumer>
      {({ sub }: userContextType) =>
      (
        <UserCreateActivateSteps sub={sub} {...props} />
      )}
    </UserContext.Consumer>
  )
}


type UserCreateActivateWeightRouteStackParamList = {
  UserCreateActivateWeight: {
    activateId: string,
  }
}

type UserCreateActivateWeightRouteProp = RouteProp<
  UserCreateActivateWeightRouteStackParamList,
  'UserCreateActivateWeight'
>

type UserCreateActivateWeightProps = {
  route: UserCreateActivateWeightRouteProp,
}

function UserCreateActivateWeightWithContext(props: UserCreateActivateWeightProps) {
  return (
    <UserContext.Consumer>
      {({ sub }: userContextType) =>
      (
        <UserCreateActivateWeight sub={sub} {...props} />
      )}
    </UserContext.Consumer>
  )
}

type RootStackParamList = {
  UserProgressInactiveComponents: undefined,
  UserCreateActivateSpecificExercise: {
    name: string,
    goalType: PrimaryGoalType,
    exerciseId: string,
    activateId: string,
  },
  UserListExercises: undefined,
  UserListRoutines: undefined,
  UserCreateRoutine: undefined,
  UserCreateSpecificExercise: undefined,
  UserCreateActivateHabit: {
    name: string,
    activateId?: string,
  },
  UserCreateActivateLimit: {
    name: string,
    activateId?: string,
  },
  UserCreateActivateMeditate: {
    activateId: string,
  },
  UserCreateActivateNewSkill: {
    name: string,
    activateId?: string,
  },
  UserCreateActivateRoutine: {
    name: string,
    activateId: string,
  },
  UserCreateActivateSteps: {
    activateId: string,
  },
  UserCreateActivateWeight: {
    activateId: string,
  },
  UserProgressInactiveComponentsStackNavigation: undefined,
}

type NavigationProps = DrawerNavigationProp<RootStackParamList, 'UserProgressInactiveComponentsStackNavigation'>

function UserProgressInactiveComponentsStackNavigation() {
  const Stack = createStackNavigator<RootStackParamList>()

  const navigation = useNavigation<NavigationProps>()

  return (
    <Stack.Navigator initialRouteName="UserProgressInactiveComponents" screenOptions={{ headerTintColor: palette.white }}>
      <Stack.Screen
        name="UserProgressInactiveComponents"
        component={UserProgressInactiveComponentsWithContext}
        options={{
          title: 'Inactive Trackers',
          headerLeft: () => (
            <Box ml={{ phone: 's', tablet: 'm' }}>
              <Pressable onPress={() => navigation.toggleDrawer()}>
                <Ionicons name="menu" size={24} color={palette.white} />
              </Pressable>
            </Box>
          )
         }}
      />
      <Stack.Screen
        name="UserCreateActivateSpecificExercise"
        component={UserCreateActivateSpecificExerciseWithContext}
        options={({ route }) => ({ title: `Activate ${route.params.name} Tracker` })}
      />
      <Stack.Screen
        name="UserCreateSpecificExercise"
        component={UserCreateSpecificExercise}
        options={{ title: 'Create Exercise' }}
      />
      <Stack.Screen
        name="UserCreateRoutine"
        component={UserCreateRoutine}
        options={{ title: 'Create Routine' }}
      />
      <Stack.Screen
        name="UserListExercises"
        component={UserListExercises}
        options={{ title: 'Exercise List' }}
      />
      <Stack.Screen
        name="UserListRoutines"
        component={UserListRoutines}
        options={{ title: 'Routine List' }}
      />
      {
}
      <Stack.Screen
        name="UserCreateActivateHabit"
        component={UserCreateActivateHabitWithContext}
        options={({ route }) => ({ title: `Activate ${route.params.name} Tracker` })}
      />
      <Stack.Screen
        name="UserCreateActivateLimit"
        component={UserCreateActivateLimitWithContext}
        options={({ route }) => ({ title: `Activate ${route.params.name} Tracker` })}
      />
      <Stack.Screen
        name="UserCreateActivateMeditate"
        component={UserCreateActivateMeditateWithContext}
        options={{ title: 'Activate Meditate Tracker' }}
      />
      <Stack.Screen
        name="UserCreateActivateNewSkill"
        component={UserCreateActivateNewSkillWithContext}
        options={({ route }) => ({ title: `Activate ${route.params.name} Tracker` })}
      />
      <Stack.Screen
        name="UserCreateActivateRoutine"
        component={UserCreateActivateRoutineWithContext}
        options={({ route }) => ({ title: `Activate ${route.params.name} Tracker` })}
      />
      {
}
      <Stack.Screen
        name="UserCreateActivateSteps"
        component={UserCreateActivateStepsWithContext}
        options={{ title: 'Activate Steps Tracker' }}
      />
      {
}
      <Stack.Screen
        name="UserCreateActivateWeight"
        component={UserCreateActivateWeightWithContext}
        options={{ title: 'Activate Weight Tracker' }}
      />
    </Stack.Navigator>
  )
}

export default UserProgressInactiveComponentsStackNavigation
