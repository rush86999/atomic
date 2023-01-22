import React from 'react'
import { RouteProp } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'

import UserContext from '@navigation/user-context'
import { ApolloClient, ApolloConsumer, NormalizedCacheObject } from '@apollo/client'
import { useNavigation } from '@react-navigation/native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { Pressable } from 'react-native'
import { DrawerNavigationProp } from '@react-navigation/drawer'
import Box from '@components/common/Box'

type userContextType = {
  sub: string,
  getRealmApp: () => Realm,
}

import UserAddSchedule from '@screens/Schedule/UserAddSchedule'
import UserAddGoal from '@screens/Goal/UserAddGoal'
import UserProgressActiveComponents from '@progress/UserProgressActiveComponents'
import UserAddEndurance from '@progress/Exercise/UserAddEndurance'
import UserViewEndurance3Months from '@progress/Exercise/UserViewEndurance3Months'
import UserViewEnduranceAnnually from '@progress/Exercise/UserViewEnduranceAnnually'
import UserViewEnduranceCalendar from '@progress/Exercise/UserViewEnduranceCalendar'
import UserViewEnduranceMonthly from '@progress/Exercise/UserViewEnduranceMonthly'
import UserViewEnduranceWeekly from '@progress/Exercise/UserViewEnduranceWeekly'

import UserAddHabit from '@progress/Habit/UserAddHabit'
import UserViewHabit3Months from '@progress/Habit/UserViewHabit3Months'
import UserViewHabitAnnually from '@progress/Habit/UserViewHabitAnnually'
import UserViewHabitCalendar from '@progress/Habit/UserViewHabitCalendar'
import UserViewHabitMonthly from '@progress/Habit/UserViewHabitMonthly'
import UserViewHabitWeekly from '@progress/Habit/UserViewHabitWeekly'
import UserAddLimit from '@progress/Limit/UserAddLimit'
import UserViewLimit3Months from '@progress/Limit/UserViewLimit3Months'
import UserViewLimitAnnually from '@progress/Limit/UserViewLimitAnnually'
import UserViewLimitCalendar from '@progress/Limit/UserViewLimitCalendar'
import UserViewLimitMonthly from '@progress/Limit/UserViewLimitMonthly'
import UserViewLimitWeekly from '@progress/Limit/UserViewLimitWeekly'
import UserAddMeditation from '@progress/Meditation/UserAddMeditation'
import UserViewMeditation3Months from '@progress/Meditation/UserViewMeditation3Months'
import UserViewMeditationAnnually from '@progress/Meditation/UserViewMeditationAnnually'
import UserViewMeditationCalendar from '@progress/Meditation/UserViewMeditationCalendar'
import UserViewMeditationMonthly from '@progress/Meditation/UserViewMeditationMonthly'
import UserViewMeditationWeekly from '@progress/Meditation/UserViewMeditationWeekly'
import UserAddSkill from '@progress/NewSkill/UserAddSkill'
import UserViewSkill3Months from '@progress/NewSkill/UserViewSkill3Months'
import UserViewSkillAnnually from '@progress/NewSkill/UserViewSkillAnnually'
import UserViewSkillCalendar from '@progress/NewSkill/UserViewSkillCalendar'
import UserViewSkillMonthly from '@progress/NewSkill/UserViewSkillMonthly'
import UserViewSkillWeekly from '@progress/NewSkill/UserViewSkillWeekly'
import UserAddRoutine from '@progress/Routine/UserAddRoutine'
import UserViewRoutineCalendar from '@progress/Routine/UserViewRoutineCalendar'
import UserAddStep from '@progress/Steps/UserAddStep'
import UserViewStep3Months from '@progress/Steps/UserViewStep3Months'
import UserViewStepAnnually from '@progress/Steps/UserViewStepAnnually'
import UserViewStepCalendar from '@progress/Steps/UserViewStepCalendar'
import UserViewStepMonthly from '@progress/Steps/UserViewStepMonthly'
import UserViewStepWeekly from '@progress/Steps/UserViewStepWeekly'
import UserAddStrength from '@progress/Strength/UserAddStrength'
import UserViewStrength3Months from '@progress/Strength/UserViewStrength3Months'
import UserViewStrengthAnnually from '@progress/Strength/UserViewStrengthAnnually'
import UserViewStrengthCalendar from '@progress/Strength/UserViewStrengthCalendar'
import UserViewStrengthMonthly from '@progress/Strength/UserViewStrengthMonthly'
import UserViewStrengthWeekly from '@progress/Strength/UserViewStrengthWeekly'
import UserAddWeight from '@progress/Weight/UserAddWeight'
import UserViewWeight3Months from '@progress/Weight/UserViewWeight3Months'
import UserViewWeightAnnually from '@progress/Weight/UserViewWeightAnnually'
import UserViewWeightCalendar from '@progress/Weight/UserViewWeightCalendar'
import UserViewWeightMonthly from '@progress/Weight/UserViewWeightMonthly'
import UserViewWeightWeekly from '@progress/Weight/UserViewWeightWeekly'

import UserCommentPost from '@post/UserCommentPost'
import UserCreatePost from '@post/UserCreatePost'
import UserUpdatePost from '@post/UserUpdatePost'
import UserViewPost from '@post/UserViewPost'
import UserListPostsNavigation from '@post/UserListPostsStackNavigation'


import {
  PrimaryGoalType,
  Comment,
  Post,
} from '@models'

import {
  Post as PostRealm,
} from '@realm/Post'

import { palette } from '@theme/theme'

import {
  GetPostQuery,
} from '@app/API'

type unitType = 'freeStyle' | 'picker' | 'fixed'

type dataType = 'secondaryGoalName' | 'null' | 'secondaryExerciseName'


type UserAddScheduleRouteStackParamList = {
  UserAddSchedule: {
    primaryGoalType: PrimaryGoalType,
    secondaryGoalType?: string,
  },
}

type UserAddScheduleRouteProp = RouteProp<
  UserAddScheduleRouteStackParamList,
  'UserAddSchedule'>

type UserAddScheduleProps = {
  route: UserAddScheduleRouteProp,
}

function UserAddScheduleWithContext(props: UserAddScheduleProps) {
  return (
    <ApolloConsumer>
      {client => (
        <UserContext.Consumer>
          {({ sub }: userContextType) =>
          (
            <UserAddSchedule client={client as ApolloClient<NormalizedCacheObject>} sub={sub} {...props} />
          )}
        </UserContext.Consumer>
      )}
    </ApolloConsumer>
  )
}

type UserCommentPostRouteStackParamList = {
  UserCommentPost: {
    postId: string,
    commentCount: number,
    userId: string,
    userAvatar: string,
    username: string,
    profileId: string,
    postUserId: string,
    postUserName: string,
    comment?: Comment,
  },
}

type UserCommentPostRouteProp = RouteProp<
  UserCommentPostRouteStackParamList,
  'UserCommentPost'
>

type UserCommentPostProps = {
  route: UserCommentPostRouteProp,
}

function UserCommentPostWithContext(props: UserCommentPostProps) {
  return (
    <UserContext.Consumer>
      {({ sub, getRealmApp }: userContextType) =>
      (
        <UserCommentPost getRealmApp={getRealmApp} sub={sub} {...props} />
      )}
    </UserContext.Consumer>
  )
}

type UserCreatePostRouteStackParamList = {
  UserCreatePost: {
    postId: string,
    userId: string,
    avatar: string,
    username: string,
    profileId: string,
  },
}

type UserCreatePostRouteProp = RouteProp<
  UserCreatePostRouteStackParamList,
  'UserCreatePost'
>

type UserCreatePostProps = {
  route: UserCreatePostRouteProp,
}

function UserCreatePostWithContext(props: UserCreatePostProps) {
  return (
    <UserContext.Consumer>
      {({ getRealmApp }: userContextType) =>
      (
        <UserCreatePost getRealmApp={getRealmApp} {...props} />
      )}
    </UserContext.Consumer>
  )
}

type UserUpdatePostRouteStackParamList = {
  UserUpdatePost: {
    postId: string,
  },
}

type UserUpdatePostRouteProp = RouteProp<
  UserUpdatePostRouteStackParamList,
  'UserUpdatePost'
>

type UserUpdatePostProps = {
  route: UserUpdatePostRouteProp,
}

function UserUpdatePostWithContext(props: UserUpdatePostProps) {
  return (
    <UserContext.Consumer>
      {({ getRealmApp }: userContextType) =>
      (
        <UserUpdatePost getRealmApp={getRealmApp} {...props} />
      )}
    </UserContext.Consumer>
  )
}

type UserViewPostRouteStackParamList = {
  UserViewPost: {
    postId?: string,
    userId?: string,
    userAvatar?: string,
    username?: string,
    profileId?: string,
  },
}

type UserViewPostRouteProp = RouteProp<
  UserViewPostRouteStackParamList,
  'UserViewPost'
>


type UserViewPostProps = {
  route: UserViewPostRouteProp,
  post: GetPostQuery['getPost'],
  userId?: string,
  userAvatar?: string,
  username?: string,
  profileId?: string,
  handleExternalData?: () => void,
}

function UserViewPostWithContext(props: UserViewPostProps) {
  return (
    <UserContext.Consumer>
      {({ getRealmApp }: userContextType) =>
      (
        <UserViewPost getRealmApp={getRealmApp} {...props} />
      )}
    </UserContext.Consumer>
  )
}

type UserAddGoalRouteStackParamList = {
  UserAddGoal: {
    primaryGoalType: PrimaryGoalType,
    secondaryGoalName?: string,
    scheduleId?: string,
    goalUnit?: string,
    unitType: unitType,
    dataType: dataType,
  },
}

type UserAddGoalRouteProp = RouteProp<
  UserAddGoalRouteStackParamList,
  'UserAddGoal'
>

type UserAddGoalProps = {
  route: UserAddGoalRouteProp,
}

function UserAddGoalWithContext(props: UserAddGoalProps) {
  return (
    <ApolloConsumer>
      {client =>
        (
          <UserContext.Consumer>
            {({ sub }: userContextType) =>
            (
              <UserAddGoal client={client as ApolloClient<NormalizedCacheObject>} sub={sub} {...props} />
            )}
          </UserContext.Consumer>
        )
      }
    </ApolloConsumer>
  )
}

type UserAddEnduranceRouteStackParamList = {
 UserAddEndurance: {
   type: string,
  },
}

type UserAddEnduranceRouteProp = RouteProp<
  UserAddEnduranceRouteStackParamList,
  'UserAddEndurance'
>

type UserAddEnduranceProps = {
  route: UserAddEnduranceRouteProp,
}

function UserAddEnduranceWithContext(props: UserAddEnduranceProps) {
  return (
     <ApolloConsumer>
      {client =>
        (
        <UserContext.Consumer>
          {({ sub, getRealmApp }: userContextType) =>
          (
            <UserAddEndurance client={client as ApolloClient<NormalizedCacheObject>} sub={sub} getRealmApp={getRealmApp} {...props} />
          )}
        </UserContext.Consumer>
        )}
    </ApolloConsumer>
  )
}

type UserViewEndurance3MonthsRouteStackParamList = {
  UserViewEndurance3Months: {
    type: string,
  },
}

type UserViewEndurance3MonthsRouteProp = RouteProp<
  UserViewEndurance3MonthsRouteStackParamList,
  'UserViewEndurance3Months'
>

type UserViewEndurance3MonthsProps = {
  route: UserViewEndurance3MonthsRouteProp,
}

function UserViewEndurance3MonthsWithContext(props: UserViewEndurance3MonthsProps) {
  return (
    <UserContext.Consumer>
      {({ sub, getRealmApp }: userContextType) =>
      (
        <UserViewEndurance3Months getRealmApp={getRealmApp} sub={sub} {...props} />
      )}
    </UserContext.Consumer>
  )
}

type UserViewEnduranceAnnuallyRouteStackParamList = {
  UserViewEnduranceAnnually: {
    type: string,
  },
}

type UserViewEnduranceAnnuallyRouteProp = RouteProp<
  UserViewEnduranceAnnuallyRouteStackParamList,
  'UserViewEnduranceAnnually'
>

type UserViewEnduranceAnnuallyProps = {
  route: UserViewEnduranceAnnuallyRouteProp,
}

function UserViewEnduranceAnnuallyWithContext(props: UserViewEnduranceAnnuallyProps) {
  return (
    <UserContext.Consumer>
      {({ sub, getRealmApp }: userContextType) =>
      (
        <UserViewEnduranceAnnually getRealmApp={getRealmApp} sub={sub} {...props} />
      )}
    </UserContext.Consumer>
  )
}

type UserViewEnduranceCalendarRouteStackParamList = {
  UserViewEnduranceCalendar: {
    type: string,
  },
}

type UserViewEnduranceCalendarRouteProp = RouteProp<
  UserViewEnduranceCalendarRouteStackParamList,
  'UserViewEnduranceCalendar'
>

type UserViewEnduranceCalendarProps = {
  route: UserViewEnduranceCalendarRouteProp,
}

function UserViewEnduranceCalendarWithContext(props: UserViewEnduranceCalendarProps) {
  return (
    <UserContext.Consumer>
      {({ sub, getRealmApp }: userContextType) =>
      (
        <UserViewEnduranceCalendar getRealmApp={getRealmApp} sub={sub} {...props} />
      )}
    </UserContext.Consumer>
  )
}

type UserViewEnduranceMonthlyRouteStackParamList = {
  UserViewEnduranceMonthly: {
    type: string,
  },
}

type UserViewEnduranceMonthlyRouteProp = RouteProp<
  UserViewEnduranceMonthlyRouteStackParamList,
  'UserViewEnduranceMonthly'
>

type UserViewEnduranceMonthlyProps = {
  route: UserViewEnduranceMonthlyRouteProp,
}

function UserViewEnduranceMonthlyWithContext(props: UserViewEnduranceMonthlyProps) {
  return (
    <UserContext.Consumer>
      {({ sub, getRealmApp }: userContextType) =>
      (
        <UserViewEnduranceMonthly getRealmApp={getRealmApp} sub={sub} {...props} />
      )}
    </UserContext.Consumer>
  )
}

type UserViewEnduranceWeeklyRouteStackParamList = {
  UserViewEnduranceWeekly: {
    type: string,
  },
}

type UserViewEnduranceWeeklyRouteProp = RouteProp<
  UserViewEnduranceWeeklyRouteStackParamList,
  'UserViewEnduranceWeekly'
>

type UserViewEnduranceWeeklyProps = {
  route: UserViewEnduranceWeeklyRouteProp,
}

function UserViewEnduranceWeeklyWithContext(props: UserViewEnduranceWeeklyProps) {
  return (
    <UserContext.Consumer>
      {({ sub, getRealmApp }: userContextType) =>
      (
        <UserViewEnduranceWeekly getRealmApp={getRealmApp} sub={sub} {...props} />
      )}
    </UserContext.Consumer>
  )
}


type UserAddHabitRouteStackParamList = {
 UserAddHabit: {
   type: string,
  },
}

type UserAddHabitRouteProp = RouteProp<
  UserAddHabitRouteStackParamList,
  'UserAddHabit'
>

type UserAddHabitProps = {
  route: UserAddHabitRouteProp,
}

function UserAddHabitWithContext(props: UserAddHabitProps) {
  return (
     <ApolloConsumer>
      {client => 
        (
        <UserContext.Consumer>
          {({ sub, getRealmApp }: userContextType) =>
          (
            <UserAddHabit client={client as ApolloClient<NormalizedCacheObject>} getRealmApp={getRealmApp} sub={sub} {...props} />
          )}
        </UserContext.Consumer>
        )
      }
    </ApolloConsumer>
  )
}

type UserViewHabit3MonthsRouteStackParamList = {
  UserViewHabit3Months: {
    type: string,
  },
}

type UserViewHabit3MonthsRouteProp = RouteProp<
  UserViewHabit3MonthsRouteStackParamList,
  'UserViewHabit3Months'
>

type UserViewHabit3MonthsProps = {
  route: UserViewHabit3MonthsRouteProp,
}

function UserViewHabit3MonthsWithContext(props: UserViewHabit3MonthsProps) {
  return (
    <UserContext.Consumer>
      {({ sub, getRealmApp }: userContextType) =>
      (
        <UserViewHabit3Months getRealmApp={getRealmApp} sub={sub} {...props} />
      )}
    </UserContext.Consumer>
  )
}

type UserViewHabitAnnuallyRouteStackParamList = {
  UserViewHabitAnnually: {
    type: string,
  },
}

type UserViewHabitAnnuallyRouteProp = RouteProp<
  UserViewHabitAnnuallyRouteStackParamList,
  'UserViewHabitAnnually'
>

type UserViewHabitAnnuallyProps = {
  route: UserViewHabitAnnuallyRouteProp,
}

function UserViewHabitAnnuallyWithContext(props: UserViewHabitAnnuallyProps) {
  return (
    <UserContext.Consumer>
      {({ sub, getRealmApp }: userContextType) =>
      (
        <UserViewHabitAnnually getRealmApp={getRealmApp} sub={sub} {...props} />
      )}
    </UserContext.Consumer>
  )
}

type UserViewHabitCalendarRouteStackParamList = {
  UserViewHabitCalendar: {
    type: string,
  },
}

type UserViewHabitCalendarRouteProp = RouteProp<
  UserViewHabitCalendarRouteStackParamList,
  'UserViewHabitCalendar'
>

type UserViewHabitCalendarProps = {
  route: UserViewHabitCalendarRouteProp,
}

function UserViewHabitCalendarWithContext(props: UserViewHabitCalendarProps) {
  return (
    <UserContext.Consumer>
      {({ sub, getRealmApp }: userContextType) =>
      (
        <UserViewHabitCalendar getRealmApp={getRealmApp} sub={sub} {...props} />
      )}
    </UserContext.Consumer>
  )
}

type UserViewHabitMonthlyRouteStackParamList = {
  UserViewHabitMonthly: {
    type: string,
  },
}

type UserViewHabitMonthlyRouteProp = RouteProp<
  UserViewHabitMonthlyRouteStackParamList,
  'UserViewHabitMonthly'
>

type UserViewHabitMonthlyProps = {
  route: UserViewHabitMonthlyRouteProp,
}

function UserViewHabitMonthlyWithContext(props: UserViewHabitMonthlyProps) {
  return (
    <UserContext.Consumer>
      {({ sub, getRealmApp }: userContextType) =>
      (
        <UserViewHabitMonthly getRealmApp={getRealmApp} sub={sub} {...props} />
      )}
    </UserContext.Consumer>
  )
}

type UserViewHabitWeeklyRouteStackParamList = {
  UserViewHabitWeekly: {
    type: string,
  },
}

type UserViewHabitWeeklyRouteProp = RouteProp<
  UserViewHabitWeeklyRouteStackParamList,
  'UserViewHabitWeekly'
>

type UserViewHabitWeeklyProps = {
  route: UserViewHabitWeeklyRouteProp,
}

function UserViewHabitWeeklyWithContext(props: UserViewHabitWeeklyProps) {
  return (
    <UserContext.Consumer>
      {({ sub, getRealmApp }: userContextType) =>
      (
        <UserViewHabitWeekly getRealmApp={getRealmApp} sub={sub} {...props} />
      )}
    </UserContext.Consumer>
  )
}

type UserAddLimitRouteStackParamList = {
 UserAddLimit: {
   type: string,
  },
}

type UserAddLimitRouteProp = RouteProp<
  UserAddLimitRouteStackParamList,
  'UserAddLimit'
>

type UserAddLimitProps = {
  route: UserAddLimitRouteProp,
}

function UserAddLimitWithContext(props: UserAddLimitProps) {
  return (
     <ApolloConsumer>
      {client => (
        <UserContext.Consumer>
          {({ sub, getRealmApp }: userContextType) =>
            (
              <UserAddLimit client={client as ApolloClient<NormalizedCacheObject>} getRealmApp={getRealmApp} sub={sub} {...props} />
            )}
          </UserContext.Consumer>
      )}
      </ApolloConsumer>
  )
}

type UserViewLimit3MonthsRouteStackParamList = {
  UserViewLimit3Months: {
    type: string,
  },
}

type UserViewLimit3MonthsRouteProp = RouteProp<
  UserViewLimit3MonthsRouteStackParamList,
  'UserViewLimit3Months'
>

type UserViewLimit3MonthsProps = {
  route: UserViewLimit3MonthsRouteProp,
}

function UserViewLimit3MonthsWithContext(props: UserViewLimit3MonthsProps) {
  return (
    <UserContext.Consumer>
      {({ sub, getRealmApp }: userContextType) =>
      (
        <UserViewLimit3Months getRealmApp={getRealmApp} sub={sub} {...props} />
      )}
    </UserContext.Consumer>
  )
}

type UserViewLimitAnnuallyRouteStackParamList = {
  UserViewLimitAnnually: {
    type: string,
  },
}

type UserViewLimitAnnuallyRouteProp = RouteProp<
  UserViewLimitAnnuallyRouteStackParamList,
  'UserViewLimitAnnually'
>

type UserViewLimitAnnuallyProps = {
  route: UserViewLimitAnnuallyRouteProp,
}

function UserViewLimitAnnuallyWithContext(props: UserViewLimitAnnuallyProps) {
  return (
    <UserContext.Consumer>
      {({ sub, getRealmApp }: userContextType) =>
      (
        <UserViewLimitAnnually getRealmApp={getRealmApp} sub={sub} {...props} />
      )}
    </UserContext.Consumer>
  )
}

type UserViewLimitCalendarRouteStackParamList = {
  UserViewLimitCalendar: {
    type: string,
  },
}

type UserViewLimitCalendarRouteProp = RouteProp<
  UserViewLimitCalendarRouteStackParamList,
  'UserViewLimitCalendar'
>

type UserViewLimitCalendarProps = {
  route: UserViewLimitCalendarRouteProp,
}

function UserViewLimitCalendarWithContext(props: UserViewLimitCalendarProps) {
  return (
    <UserContext.Consumer>
      {({ sub, getRealmApp }: userContextType) =>
      (
        <UserViewLimitCalendar getRealmApp={getRealmApp} sub={sub} {...props} />
      )}
    </UserContext.Consumer>
  )
}

type UserViewLimitMonthlyRouteStackParamList = {
  UserViewLimitMonthly: {
    type: string,
  },
}

type UserViewLimitMonthlyRouteProp = RouteProp<
  UserViewLimitMonthlyRouteStackParamList,
  'UserViewLimitMonthly'
>

type UserViewLimitMonthlyProps = {
  route: UserViewLimitMonthlyRouteProp,
}

function UserViewLimitMonthlyWithContext(props: UserViewLimitMonthlyProps) {
  return (
    <UserContext.Consumer>
      {({ sub, getRealmApp }: userContextType) =>
      (
        <UserViewLimitMonthly getRealmApp={getRealmApp} sub={sub} {...props} />
      )}
    </UserContext.Consumer>
  )
}

type UserViewLimitWeeklyRouteStackParamList = {
  UserViewLimitWeekly: {
    type: string,
  },
}

type UserViewLimitWeeklyRouteProp = RouteProp<
  UserViewLimitWeeklyRouteStackParamList,
  'UserViewLimitWeekly'
>

type UserViewLimitWeeklyProps = {
  route: UserViewLimitWeeklyRouteProp,
}

function UserViewLimitWeeklyWithContext(props: UserViewLimitWeeklyProps) {
  return (
    <UserContext.Consumer>
      {({ sub, getRealmApp }: userContextType) =>
      (
        <UserViewLimitWeekly getRealmApp={getRealmApp} sub={sub} {...props} />
      )}
    </UserContext.Consumer>
  )
}

function UserAddMeditationWithContext() {
  return (
     <ApolloConsumer>
      {client => (
        <UserContext.Consumer>
          {({ sub, getRealmApp }: userContextType) =>
          (
            <UserAddMeditation client={client as ApolloClient<NormalizedCacheObject>} getRealmApp={getRealmApp} sub={sub} />
          )}
        </UserContext.Consumer>
      )}
      </ApolloConsumer>
  )
}

function UserViewMeditation3MonthsWithContext() {
  return (
    <UserContext.Consumer>
      {({ sub, getRealmApp }: userContextType) =>
      (
        <UserViewMeditation3Months getRealmApp={getRealmApp} sub={sub} />
      )}
    </UserContext.Consumer>
  )
}

function UserViewMeditationAnnuallyWithContext() {
  return (
    <UserContext.Consumer>
      {({ sub, getRealmApp }: userContextType) =>
      (
        <UserViewMeditationAnnually getRealmApp={getRealmApp} sub={sub} />
      )}
    </UserContext.Consumer>
  )
}

function UserViewMeditationCalendarWithContext() {
  return (
    <UserContext.Consumer>
      {({ sub, getRealmApp }: userContextType) =>
      (
        <UserViewMeditationCalendar getRealmApp={getRealmApp} sub={sub} />
      )}
    </UserContext.Consumer>
  )
}

function UserViewMeditationMonthlyWithContext() {
  return (
    <UserContext.Consumer>
      {({ sub, getRealmApp }: userContextType) =>
      (
        <UserViewMeditationMonthly getRealmApp={getRealmApp} sub={sub} />
      )}
    </UserContext.Consumer>
  )
}

function UserViewMeditationWeeklyWithContext() {
  return (
    <UserContext.Consumer>
      {({ sub, getRealmApp }: userContextType) =>
      (
        <UserViewMeditationWeekly getRealmApp={getRealmApp} sub={sub} />
      )}
    </UserContext.Consumer>
  )
}

type UserAddSkillRouteStackParamList = {
 UserAddSkill: {
   type: string,
  },
}

type UserAddSkillRouteProp = RouteProp<
  UserAddSkillRouteStackParamList,
  'UserAddSkill'
>

type UserAddSkillProps = {
  route: UserAddSkillRouteProp,
}

function UserAddSkillWithContext(props: UserAddSkillProps) {
  return (
     <ApolloConsumer>
      {client => (
        <UserContext.Consumer>
          {({ sub, getRealmApp }: userContextType) =>
            (
              <UserAddSkill client={client as ApolloClient<NormalizedCacheObject>} getRealmApp={getRealmApp} sub={sub} {...props} />
            )}
        </UserContext.Consumer>
      )}
    </ApolloConsumer>
  )
}

type UserViewSkill3MonthsRouteStackParamList = {
  UserViewSkill3Months: {
    type: string,
  },
}

type UserViewSkill3MonthsRouteProp = RouteProp<
  UserViewSkill3MonthsRouteStackParamList,
  'UserViewSkill3Months'
>

type UserViewSkill3MonthsProps = {
  route: UserViewSkill3MonthsRouteProp,
}

function UserViewSkill3MonthsWithContext(props: UserViewSkill3MonthsProps) {
  return (
    <UserContext.Consumer>
      {({ sub, getRealmApp }: userContextType) =>
      (
        <UserViewSkill3Months getRealmApp={getRealmApp} sub={sub} {...props} />
      )}
    </UserContext.Consumer>
  )
}

type UserViewSkillAnnuallyRouteStackParamList = {
  UserViewSkillAnnually: {
    type: string,
  },
}

type UserViewSkillAnnuallyRouteProp = RouteProp<
  UserViewSkillAnnuallyRouteStackParamList,
  'UserViewSkillAnnually'
>

type UserViewSkillAnnuallyProps = {
  route: UserViewSkillAnnuallyRouteProp,
}

function UserViewSkillAnnuallyWithContext(props: UserViewSkillAnnuallyProps) {
  return (
    <UserContext.Consumer>
      {({ sub, getRealmApp }: userContextType) =>
      (
        <UserViewSkillAnnually getRealmApp={getRealmApp} sub={sub} {...props} />
      )}
    </UserContext.Consumer>
  )
}

type UserViewSkillCalendarRouteStackParamList = {
  UserViewSkillCalendar: {
    type: string,
  },
}

type UserViewSkillCalendarRouteProp = RouteProp<
  UserViewSkillCalendarRouteStackParamList,
  'UserViewSkillCalendar'
>

type UserViewSkillCalendarProps = {
  route: UserViewSkillCalendarRouteProp,
}

function UserViewSkillCalendarWithContext(props: UserViewSkillCalendarProps) {
  return (
    <UserContext.Consumer>
      {({ sub, getRealmApp }: userContextType) =>
      (
        <UserViewSkillCalendar getRealmApp={getRealmApp} sub={sub} {...props} />
      )}
    </UserContext.Consumer>
  )
}

type UserViewSkillMonthlyRouteStackParamList = {
  UserViewSkillMonthly: {
    type: string,
  },
}

type UserViewSkillMonthlyRouteProp = RouteProp<
  UserViewSkillMonthlyRouteStackParamList,
  'UserViewSkillMonthly'
>

type UserViewSkillMonthlyProps = {
  route: UserViewSkillMonthlyRouteProp,
}

function UserViewSkillMonthlyWithContext(props: UserViewSkillMonthlyProps) {
  return (
    <UserContext.Consumer>
      {({ sub, getRealmApp }: userContextType) =>
      (
        <UserViewSkillMonthly getRealmApp={getRealmApp} sub={sub} {...props} />
      )}
    </UserContext.Consumer>
  )
}

type UserViewSkillWeeklyRouteStackParamList = {
  UserViewSkillWeekly: {
    type: string,
  },
}

type UserViewSkillWeeklyRouteProp = RouteProp<
  UserViewSkillWeeklyRouteStackParamList,
  'UserViewSkillWeekly'
>

type UserViewSkillWeeklyProps = {
  route: UserViewSkillWeeklyRouteProp,
}

function UserViewSkillWeeklyWithContext(props: UserViewSkillWeeklyProps) {
  return (
    <UserContext.Consumer>
      {({ sub, getRealmApp }: userContextType) =>
      (
        <UserViewSkillWeekly getRealmApp={getRealmApp} sub={sub} {...props} />
      )}
    </UserContext.Consumer>
  )
}

type UserAddRoutineRouteStackParamList = {
 UserAddRoutine: {
   routineId: string,
  },
}

type UserAddRoutineRouteProp = RouteProp<
  UserAddRoutineRouteStackParamList,
  'UserAddRoutine'
>

type UserAddRoutineProps = {
  route: UserAddRoutineRouteProp,
}

function UserAddRoutineWithContext(props: UserAddRoutineProps) {
  return (
    <ApolloConsumer>
      {client => (
        <UserContext.Consumer>
          {({ sub, getRealmApp }: userContextType) =>
          (
            <UserAddRoutine client={client as ApolloClient<NormalizedCacheObject>} getRealmApp={getRealmApp} sub={sub} {...props} />
          )}
        </UserContext.Consumer>
      )}
    </ApolloConsumer>
  )
}

type UserViewRoutineCalendarRouteStackParamList = {
  UserViewRoutineCalendar: {
    type: string,
  },
}

type UserViewRoutineCalendarRouteProp = RouteProp<
  UserViewRoutineCalendarRouteStackParamList,
  'UserViewRoutineCalendar'
>

type UserViewRoutineCalendarProps = {
  route: UserViewRoutineCalendarRouteProp,
}

function UserViewRoutineCalendarWithContext(props: UserViewRoutineCalendarProps) {
  return (
    <UserContext.Consumer>
      {({ sub, getRealmApp }: userContextType) =>
      (
        <UserViewRoutineCalendar getRealmApp={getRealmApp} sub={sub} {...props} />
      )}
    </UserContext.Consumer>
  )
}


function UserAddStepWithContext() {
  return (
     <ApolloConsumer>
      {client => (
        <UserContext.Consumer>
          {({ sub, getRealmApp }: userContextType) =>
          (
            <UserAddStep client={client as ApolloClient<NormalizedCacheObject>} getRealmApp={getRealmApp} sub={sub} />
          )}
        </UserContext.Consumer>
      )}
      </ApolloConsumer>
  )
}

function UserViewStep3MonthsWithContext() {
  return (
    <UserContext.Consumer>
      {({ sub, getRealmApp }: userContextType) =>
      (
        <UserViewStep3Months getRealmApp={getRealmApp} sub={sub} />
      )}
    </UserContext.Consumer>
  )
}

function UserViewStepAnnuallyWithContext() {
  return (
    <UserContext.Consumer>
      {({ sub, getRealmApp }: userContextType) =>
      (
        <UserViewStepAnnually getRealmApp={getRealmApp} sub={sub} />
      )}
    </UserContext.Consumer>
  )
}

function UserViewStepCalendarWithContext() {
  return (
    <UserContext.Consumer>
      {({ sub, getRealmApp }: userContextType) =>
      (
        <UserViewStepCalendar getRealmApp={getRealmApp} sub={sub} />
      )}
    </UserContext.Consumer>
  )
}

function UserViewStepMonthlyWithContext() {
  return (
    <UserContext.Consumer>
      {({ sub, getRealmApp }: userContextType) =>
      (
        <UserViewStepMonthly getRealmApp={getRealmApp} sub={sub} />
      )}
    </UserContext.Consumer>
  )
}

function UserViewStepWeeklyWithContext() {
  return (
    <UserContext.Consumer>
      {({ sub, getRealmApp }: userContextType) =>
      (
        <UserViewStepWeekly getRealmApp={getRealmApp} sub={sub} />
      )}
    </UserContext.Consumer>
  )
}

type UserAddStrengthRouteStackParamList = {
 UserAddStrength: {
   type: string,
  },
}

type UserAddStrengthRouteProp = RouteProp<
  UserAddStrengthRouteStackParamList,
  'UserAddStrength'
>

type UserAddStrengthProps = {
  route: UserAddStrengthRouteProp,
}

function UserAddStrengthWithContext(props: UserAddStrengthProps) {
  return (
    <ApolloConsumer>
      {client => (
        <UserContext.Consumer>
          {({ sub, getRealmApp }: userContextType) =>
            (
              <UserAddStrength client={client as ApolloClient<NormalizedCacheObject>} sub={sub} getRealmApp={getRealmApp} {...props} />
            )}
        </UserContext.Consumer>
      )}
      </ApolloConsumer>
  )
}

type UserViewStrength3MonthsRouteStackParamList = {
  UserViewStrength3Months: {
    type: string,
  },
}

type UserViewStrength3MonthsRouteProp = RouteProp<
  UserViewStrength3MonthsRouteStackParamList,
  'UserViewStrength3Months'
>

type UserViewStrength3MonthsProps = {
  route: UserViewStrength3MonthsRouteProp,
}

function UserViewStrength3MonthsWithContext(props: UserViewStrength3MonthsProps) {
  return (
    <UserContext.Consumer>
      {({ sub, getRealmApp }: userContextType) =>
      (
        <UserViewStrength3Months getRealmApp={getRealmApp} sub={sub} {...props} />
      )}
    </UserContext.Consumer>
  )
}

type UserViewStrengthAnnuallyRouteStackParamList = {
  UserViewStrengthAnnually: {
    type: string,
  },
}

type UserViewStrengthAnnuallyRouteProp = RouteProp<
  UserViewStrengthAnnuallyRouteStackParamList,
  'UserViewStrengthAnnually'
>

type UserViewStrengthAnnuallyProps = {
  route: UserViewStrengthAnnuallyRouteProp,
}

function UserViewStrengthAnnuallyWithContext(props: UserViewStrengthAnnuallyProps) {
  return (
    <UserContext.Consumer>
      {({ sub, getRealmApp }: userContextType) =>
      (
        <UserViewStrengthAnnually getRealmApp={getRealmApp} sub={sub} {...props} />
      )}
    </UserContext.Consumer>
  )
}

type UserViewStrengthCalendarRouteStackParamList = {
  UserViewStrengthCalendar: {
    type: string,
  },
}

type UserViewStrengthCalendarRouteProp = RouteProp<
  UserViewStrengthCalendarRouteStackParamList,
  'UserViewStrengthCalendar'
>

type UserViewStrengthCalendarProps = {
  route: UserViewStrengthCalendarRouteProp,
}

function UserViewStrengthCalendarWithContext(props: UserViewStrengthCalendarProps) {
  return (
    <UserContext.Consumer>
      {({ sub, getRealmApp }: userContextType) =>
      (
        <UserViewStrengthCalendar getRealmApp={getRealmApp} sub={sub} {...props} />
      )}
    </UserContext.Consumer>
  )
}

type UserViewStrengthMonthlyRouteStackParamList = {
  UserViewStrengthMonthly: {
    type: string,
  },
}

type UserViewStrengthMonthlyRouteProp = RouteProp<
  UserViewStrengthMonthlyRouteStackParamList,
  'UserViewStrengthMonthly'
>

type UserViewStrengthMonthlyProps = {
  route: UserViewStrengthMonthlyRouteProp,
}

function UserViewStrengthMonthlyWithContext(props: UserViewStrengthMonthlyProps) {
  return (
    <UserContext.Consumer>
      {({ sub, getRealmApp }: userContextType) =>
      (
        <UserViewStrengthMonthly getRealmApp={getRealmApp} sub={sub} {...props} />
      )}
    </UserContext.Consumer>
  )
}

type UserViewStrengthWeeklyRouteStackParamList = {
  UserViewStrengthWeekly: {
    type: string,
  },
}

type UserViewStrengthWeeklyRouteProp = RouteProp<
  UserViewStrengthWeeklyRouteStackParamList,
  'UserViewStrengthWeekly'
>

type UserViewStrengthWeeklyProps = {
  route: UserViewStrengthWeeklyRouteProp,
}

function UserViewStrengthWeeklyWithContext(props: UserViewStrengthWeeklyProps) {
  return (
    <UserContext.Consumer>
      {({ sub, getRealmApp }: userContextType) =>
      (
        <UserViewStrengthWeekly getRealmApp={getRealmApp} sub={sub} {...props} />
      )}
    </UserContext.Consumer>
  )
}




function UserAddWeightWithContext() {
  return (
     <ApolloConsumer>
      {client => (
        <UserContext.Consumer>
          {({ sub, getRealmApp }: userContextType) =>
            (
              <UserAddWeight client={client as ApolloClient<NormalizedCacheObject>} getRealmApp={getRealmApp} sub={sub} />
            )}
        </UserContext.Consumer>
        )}
      </ApolloConsumer>
  )
}

function UserViewWeight3MonthsWithContext() {
  return (
    <UserContext.Consumer>
      {({ sub, getRealmApp }: userContextType) =>
      (
        <UserViewWeight3Months getRealmApp={getRealmApp} sub={sub} />
      )}
    </UserContext.Consumer>
  )
}

function UserViewWeightAnnuallyWithContext() {
  return (
    <UserContext.Consumer>
      {({ sub, getRealmApp }: userContextType) =>
      (
        <UserViewWeightAnnually getRealmApp={getRealmApp} sub={sub} />
      )}
    </UserContext.Consumer>
  )
}

function UserViewWeightCalendarWithContext() {
  return (
    <UserContext.Consumer>
      {({ sub, getRealmApp }: userContextType) =>
      (
        <UserViewWeightCalendar getRealmApp={getRealmApp} sub={sub} />
      )}
    </UserContext.Consumer>
  )
}

function UserViewWeightMonthlyWithContext() {
  return (
    <UserContext.Consumer>
      {({ sub, getRealmApp }: userContextType) =>
      (
        <UserViewWeightMonthly getRealmApp={getRealmApp} sub={sub} />
      )}
    </UserContext.Consumer>
  )
}

function UserViewWeightWeeklyWithContext() {
  return (
    <UserContext.Consumer>
      {({ sub, getRealmApp }: userContextType) =>
      (
        <UserViewWeightWeekly getRealmApp={getRealmApp} sub={sub} />
      )}
    </UserContext.Consumer>
  )
}

type UserProgressActiveComponentsRouteStackParamList = {
  UserProgressActiveComponents: {
    isUpdate?: string,

  }
}

type UserProgressActiveComponentsRouteProp = RouteProp<
  UserProgressActiveComponentsRouteStackParamList,
  'UserProgressActiveComponents'
>

type UserProgressActiveComponentsProps = {
  route: UserProgressActiveComponentsRouteProp,
}

function UserProgressActiveComponentsWithContext(props: UserProgressActiveComponentsProps) {
  return (
    <ApolloConsumer>
      {client => (
        <UserContext.Consumer>
          {({ sub, getRealmApp }: userContextType) =>
          (
            <UserProgressActiveComponents client={client as ApolloClient<NormalizedCacheObject>} getRealmApp={getRealmApp} sub={sub} {...props} />
          )}
        </UserContext.Consumer>
      )}
    </ApolloConsumer>
  )
}


  type RootStackParamList = {
    UserAddSchedule: undefined,
    UserAddGoal: {
      primaryGoalType: PrimaryGoalType,
      secondaryGoalName?: string,
      scheduleId?: string,
      goalUnit?: string,
      unitType: unitType,
      dataType: dataType,
    },
    UserProgressActiveComponents: undefined,
    UserAddEndurance: { type: string },
    UserViewEndurance3Months: { type: string },
    UserViewEnduranceAnnually: { type: string },
    UserViewEnduranceCalendar: { type: string },
    UserViewEnduranceMonthly: { type: string },
    UserViewEnduranceWeekly: { type: string },
    UserAddExercise: undefined,
    UserViewExercise3Months: undefined,
    UserViewExerciseAnnually: undefined,
    UserViewExerciseCalendar: undefined,
    UserViewExerciseMonthly: undefined,
    UserViewExerciseWeekly: undefined,
    UserAddFruitServing: undefined,
    UserViewFruitServing3Months: undefined,
    UserViewFruitServingAnnually: undefined,
    UserViewFruitServingCalendar: undefined,
    UserViewFruitServingMonthly: undefined,
    UserViewFruitServingWeekly: undefined,
    UserAddHabit: { type: string },
    UserViewHabit3Months: { type: string },
    UserViewHabitAnnually: { type: string },
    UserViewHabitCalendar: { type: string },
    UserViewHabitMonthly: { type: string },
    UserViewHabitWeekly: { type: string },
    UserAddLimit: { type: string },
    UserViewLimit3Months: { type: string },
    UserViewLimitAnnually: { type: string },
    UserViewLimitCalendar: { type: string },
    UserViewLimitMonthly: { type: string },
    UserViewLimitWeekly: { type: string },
    UserAddMeditation: undefined,
    UserViewMeditation3Months: undefined,
    UserViewMeditationAnnually: undefined,
    UserViewMeditationCalendar: undefined,
    UserViewMeditationMonthly: undefined,
    UserViewMeditationWeekly: undefined,
    UserAddSkill: { type: string },
    UserViewSkill3Months: { type: string },
    UserViewSkillAnnually: { type: string },
    UserViewSkillCalendar: { type: string },
    UserViewSkillMonthly: { type: string },
    UserViewSkillWeekly: { type: string },
    UserAddRoutine: { routineId: string },
    UserViewRoutineCalendar: { type: string },
    UserAddSleep: undefined,
    UserViewSleep3Months: undefined,
    UserViewSleepAnnually: undefined,
    UserViewSleepCalendar: undefined,
    UserViewSleepMonthly: undefined,
    UserViewSleepWeekly: undefined,
    UserAddStep: undefined,
    UserViewStep3Months: undefined,
    UserViewStepAnnually: undefined,
    UserViewStepCalendar: undefined,
    UserViewStepMonthly: undefined,
    UserViewStepWeekly: undefined,
    UserAddStrength: { type: string },
    UserViewStrength3Months: { type: string },
    UserViewStrengthAnnually: { type: string },
    UserViewStrengthCalendar: { type: string },
    UserViewStrengthMonthly: { type: string },
    UserViewStrengthWeekly: { type: string },
    UserAddVegetable: undefined,
    UserViewVegetable3Months: undefined,
    UserViewVegetableAnnually: undefined,
    UserViewVegetableCalendar: undefined,
    UserViewVegetableMonthly: undefined,
    UserViewVegetableWeekly: undefined,
    UserAddWaist: undefined,
    UserViewWaist3Months: undefined,
    UserViewWaistAnnually: undefined,
    UserViewWaistCalendar: undefined,
    UserViewWaistMonthly: undefined,
    UserViewWaistWeekly: undefined,
    UserAddWater: undefined,
    UserViewWater3Months: undefined,
    UserViewWaterAnnually: undefined,
    UserViewWaterCalendar: undefined,
    UserViewWaterMonthly: undefined,
    UserViewWaterWeekly: undefined,
    UserAddWeight: undefined,
    UserViewWeight3Months: undefined,
    UserViewWeightAnnually: undefined,
    UserViewWeightCalendar: undefined,
    UserViewWeightMonthly: undefined,
    UserViewWeightWeekly: undefined,
    UserCommentPost: {
      postId: string,
      commentCount: number,
      userId: string,
      userAvatar: string,
      username: string,
      profileId: string,
      postUserId: string,
      postUserName: string,
      comment?: Comment,
    },
    UserCreatePost: {
      post: PostRealm,
      userId: string,
      avatar: string,
      username: string,
      profileId: string,
    },
    UserUpdatePost: {
      post: Post,
    },
    UserViewPost: {
      post?: Post,
      userId?: string,
      userAvatar?: string,
      username?: string,
      profileId?: string,
    },
    UserListPostsNavigation: {
      post: string | undefined,
    },
    UserProgressActiveComponentsStackNavigation: undefined,
  }

type NavigationProps = DrawerNavigationProp<RootStackParamList, 'UserProgressActiveComponentsStackNavigation'>

const rescapeUnsafe = (safe: string) => safe
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#039;/g, '\'')
  .replace(/-/gi, ' ')

function UserProgressActiveComponentsStackNavigation() {
  const Stack = createStackNavigator<RootStackParamList>()

  const navigation = useNavigation<NavigationProps>()

  return (
    <Stack.Navigator initialRouteName="UserProgressActiveComponents" screenOptions={{ headerTintColor: palette.white, }}>
      <Stack.Screen
        name="UserAddSchedule"
        component={UserAddScheduleWithContext}
        options={{ title: 'Add a Schedule' }}
      />
      <Stack.Screen
        name="UserCommentPost"
        component={UserCommentPostWithContext}
        options={{ title: 'Comments' }}
      />
      <Stack.Screen
        name="UserListPostsNavigation"
        component={UserListPostsNavigation}
        options={{ title: 'Posts' }}
      />
      <Stack.Screen
        name="UserCreatePost"
        component={UserCreatePostWithContext}
        options={{ title: 'Create Post' }}
      />
      <Stack.Screen
        name="UserUpdatePost"
        component={UserUpdatePostWithContext}
        options={{ title: 'Update Post' }}
      />
      <Stack.Screen
        name="UserViewPost"
        component={UserViewPostWithContext}
        options={{ title: 'View Post' }}
      />
      <Stack.Screen
        name="UserAddGoal"
        component={UserAddGoalWithContext}
        options={({ route }) => ({ title: `Add ${route.params?.secondaryGoalName !== 'null' ? route.params?.secondaryGoalName : 'Goal'} Data` })}
      />
      <Stack.Screen
        name="UserProgressActiveComponents"
        component={UserProgressActiveComponentsWithContext}
        options={{
          title: 'Active Trackers',
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
        name="UserAddEndurance"
        component={UserAddEnduranceWithContext}
        options={({ route }) => ({ title: `Add ${rescapeUnsafe(route.params?.type)} Data` })}
      />
      <Stack.Screen
        name="UserViewEndurance3Months"
        component={UserViewEndurance3MonthsWithContext}
        options={{ title: '3 Months' }}
      />
      <Stack.Screen
        name="UserViewEnduranceAnnually"
        component={UserViewEnduranceAnnuallyWithContext}
        options={{ title: '1 Year' }}
      />
      <Stack.Screen
        name="UserViewEnduranceCalendar"
        component={UserViewEnduranceCalendarWithContext}
        options={{ title: 'Calendar' }}
      />
      <Stack.Screen
        name="UserViewEnduranceMonthly"
        component={UserViewEnduranceMonthlyWithContext}
        options={{ title: '1 Month' }}
      />
      <Stack.Screen
        name="UserViewEnduranceWeekly"
        component={UserViewEnduranceWeeklyWithContext}
        options={{ title: '1 Week' }}
      />
      <Stack.Screen
        name="UserAddHabit"
        component={UserAddHabitWithContext}
        options={({ route }) => ({ title: `Add ${rescapeUnsafe(route?.params?.type)} Data` })}
      />
      <Stack.Screen
        name="UserViewHabit3Months"
        component={UserViewHabit3MonthsWithContext}
        options={{ title: '3 Months' }}
      />
      <Stack.Screen
        name="UserViewHabitAnnually"
        component={UserViewHabitAnnuallyWithContext}
        options={{ title: '1 Year' }}
      />
      <Stack.Screen
        name="UserViewHabitCalendar"
        component={UserViewHabitCalendarWithContext}
        options={{ title: 'Calendar' }}
      />
      <Stack.Screen
        name="UserViewHabitMonthly"
        component={UserViewHabitMonthlyWithContext}
        options={{ title: '1 Month' }}
      />
      <Stack.Screen
        name="UserViewHabitWeekly"
        component={UserViewHabitWeeklyWithContext}
        options={{ title: '1 Week' }}
      />
      <Stack.Screen
        name="UserAddLimit"
        component={UserAddLimitWithContext}
        options={({ route }) => ({ title: `Add ${rescapeUnsafe(route?.params?.type)} Data` })}
      />
      <Stack.Screen
        name="UserViewLimit3Months"
        component={UserViewLimit3MonthsWithContext}
        options={{ title: '3 Months' }}
      />
      <Stack.Screen
        name="UserViewLimitAnnually"
        component={UserViewLimitAnnuallyWithContext}
        options={{ title: '1 Year' }}
      />
      <Stack.Screen
        name="UserViewLimitCalendar"
        component={UserViewLimitCalendarWithContext}
        options={{ title: 'Calendar' }}
      />
      <Stack.Screen
        name="UserViewLimitMonthly"
        component={UserViewLimitMonthlyWithContext}
        options={{ title: '1 Month' }}
      />
      <Stack.Screen
        name="UserViewLimitWeekly"
        component={UserViewLimitWeeklyWithContext}
        options={{ title: '1 Week' }}
      />
      <Stack.Screen
        name="UserAddMeditation"
        component={UserAddMeditationWithContext}
        options={{ title: 'Add Meditation Data' }}
      />
      <Stack.Screen
        name="UserViewMeditation3Months"
        component={UserViewMeditation3MonthsWithContext}
        options={{ title: '3 Months' }}
      />
      <Stack.Screen
        name="UserViewMeditationAnnually"
        component={UserViewMeditationAnnuallyWithContext}
        options={{ title: '1 Year' }}
      />
      <Stack.Screen
        name="UserViewMeditationCalendar"
        component={UserViewMeditationCalendarWithContext}
        options={{ title: 'Calendar' }}
      />
      <Stack.Screen
        name="UserViewMeditationMonthly"
        component={UserViewMeditationMonthlyWithContext}
        options={{ title: '1 Month' }}
      />
      <Stack.Screen
        name="UserViewMeditationWeekly"
        component={UserViewMeditationWeeklyWithContext}
        options={{ title: '1 Week' }}
      />
      <Stack.Screen
        name="UserAddSkill"
        component={UserAddSkillWithContext}
        options={({ route }) => ({ title: `Add ${rescapeUnsafe(route?.params?.type)} Data` })}
      />
      <Stack.Screen
        name="UserViewSkill3Months"
        component={UserViewSkill3MonthsWithContext}
        options={{ title: '3 Months' }}
      />
      <Stack.Screen
        name="UserViewSkillAnnually"
        component={UserViewSkillAnnuallyWithContext}
        options={{ title: '1 Year' }}
      />
      <Stack.Screen
        name="UserViewSkillCalendar"
        component={UserViewSkillCalendarWithContext}
        options={{ title: 'Calendar' }}
      />
      <Stack.Screen
        name="UserViewSkillMonthly"
        component={UserViewSkillMonthlyWithContext}
        options={{ title: '1 Month' }}
      />
      <Stack.Screen
        name="UserViewSkillWeekly"
        component={UserViewSkillWeeklyWithContext}
        options={{ title: '1 Week' }}
      />
      <Stack.Screen
        name="UserAddRoutine"
        component={UserAddRoutineWithContext}
        options={{ title: 'Add Routine Data' }}
      />
      <Stack.Screen
        name="UserViewRoutineCalendar"
        component={UserViewRoutineCalendarWithContext}
        options={{ title: 'Calendar' }}
      />
      <Stack.Screen
        name="UserAddStep"
        component={UserAddStepWithContext}
        options={{ title: 'Add Step Data' }}
      />
      <Stack.Screen
        name="UserViewStep3Months"
        component={UserViewStep3MonthsWithContext}
        options={{ title: '3 Months' }}
      />
      <Stack.Screen
        name="UserViewStepAnnually"
        component={UserViewStepAnnuallyWithContext}
        options={{ title: '1 Year' }}
      />
      <Stack.Screen
        name="UserViewStepCalendar"
        component={UserViewStepCalendarWithContext}
        options={{ title: 'Calendar' }}
      />
      <Stack.Screen
        name="UserViewStepMonthly"
        component={UserViewStepMonthlyWithContext}
        options={{ title: '1 Month' }}
      />
      <Stack.Screen
        name="UserViewStepWeekly"
        component={UserViewStepWeeklyWithContext}
        options={{ title: '1 Week' }}
      />
      <Stack.Screen
        name="UserAddStrength"
        component={UserAddStrengthWithContext}
        options={({ route }) => ({ title: `Add ${rescapeUnsafe(route?.params?.type)} Data` })}
      />
      <Stack.Screen
        name="UserViewStrength3Months"
        component={UserViewStrength3MonthsWithContext}
        options={{ title: '3 Months' }}
      />
      <Stack.Screen
        name="UserViewStrengthAnnually"
        component={UserViewStrengthAnnuallyWithContext}
        options={{ title: '1 Year' }}
      />
      <Stack.Screen
        name="UserViewStrengthCalendar"
        component={UserViewStrengthCalendarWithContext}
        options={{ title: 'Calendar' }}
      />
      <Stack.Screen
        name="UserViewStrengthMonthly"
        component={UserViewStrengthMonthlyWithContext}
        options={{ title: '1 Month' }}
      />
      <Stack.Screen
        name="UserViewStrengthWeekly"
        component={UserViewStrengthWeeklyWithContext}
        options={{ title: '1 Week' }}
      />
      <Stack.Screen
        name="UserAddWeight"
        component={UserAddWeightWithContext}
        options={{ title: 'Add Weight Data' }}
      />
      <Stack.Screen
        name="UserViewWeight3Months"
        component={UserViewWeight3MonthsWithContext}
        options={{ title: '3 Months' }}
      />
      <Stack.Screen
        name="UserViewWeightAnnually"
        component={UserViewWeightAnnuallyWithContext}
        options={{ title: '1 Year' }}
      />
      <Stack.Screen
        name="UserViewWeightCalendar"
        component={UserViewWeightCalendarWithContext}
        options={{ title: 'Calendar' }}
      />
      <Stack.Screen
        name="UserViewWeightMonthly"
        component={UserViewWeightMonthlyWithContext}
        options={{ title: '1 Month' }}
      />
      <Stack.Screen
        name="UserViewWeightWeekly"
        component={UserViewWeightWeeklyWithContext}
        options={{ title: '1 Week' }}
      />
    </Stack.Navigator>
  )
}

export default UserProgressActiveComponentsStackNavigation
