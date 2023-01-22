import React, { useState, useEffect, useCallback } from 'react'
import {
  FlatList,
  Pressable,
  StyleSheet,
  Platform,
  Appearance,
} from 'react-native'

import { DataStore, SortDirection } from '@aws-amplify/datastore'
import { GraphQLResult, API } from '@aws-amplify/api'
import { dayjs } from '@app/date-utils'
import _ from 'lodash'

import { useNavigation, RouteProp, useFocusEffect } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'

import Ionicons from 'react-native-vector-icons/Ionicons'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import AntDesign from 'react-native-vector-icons/AntDesign'
import Feather from 'react-native-vector-icons/Feather'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import { Modal, Constants }  from 'react-native-ui-lib'

import Box from '@components/common/Box'
import Text from '@components/common/Text'
import RegularCard from '@components/RegularCard'
import Button from '@components/Button'
import { palette } from '@theme/theme'

import {
  UserActivateType,
  PrimaryGoalType,
  Goal,
  Schedule,
  Status,
  GoalExercise,
  User,
} from '@models'


import UserViewEnduranceStats from '@progress/Exercise/UserViewEnduranceStats'
import UserViewHabitStats from '@progress/Habit/UserViewHabitStats'
import UserViewLimitStats from '@progress/Limit/UserViewLimitStats'
import UserViewMeditationStats from '@progress/Meditation/UserViewMeditationStats'
import UserViewSkillStats from '@progress/NewSkill/UserViewSkillStats'
import UserViewStepStats from '@progress/Steps/UserViewStepStats'
import UserViewStrengthStats from '@progress/Strength/UserViewStrengthStats'
import UserViewWeightStats from '@progress/Weight/UserViewWeightStats'

import ListActivateTypesByUser from '@graphql/Queries/ListActivateTypesByUser'
import {
  ListActivateTypesByUserQuery,
  ListActivateTypesByUserQueryVariables,
} from '@app/API'



const styles = StyleSheet.create({
  addIcon: {
    backgroundColor: palette.purplePrimary,
    height: 60,
    width: 60,
    borderRadius: 60 / 2,
  },
  offIcon: {
    backgroundColor: palette.purplePrimary,
    height: 60,
    width: 60,
    borderRadius: 60 / 2,
  },
  viewStats: {
    backgroundColor: palette.purplePrimary,
    width: 60,
    height: 60,
    borderRadius: 60 / 2,
    flexDirection: 'row',
  },
  placeholderStats: {
    width: 60,
    height: 60,
    borderRadius: 60 / 2,
    flexDirection: 'row',
  },
  activeGoal: {
    backgroundColor: palette.purplePrimary,
    height: 60,
    width: 60,
    borderRadius: 60 / 2,
    flexDirection: 'row',
  },
  offGoal: {
    backgroundColor: palette.grey,
    height: 60,
    width: 60,
    borderRadius: 60 / 2,
    flexDirection: 'row',
  },
  activeSchedule: {
    backgroundColor: palette.purplePrimary,
    height: 60,
    width: 60,
    borderRadius: 60 / 2,
    flexDirection: 'row',
  },
  offSchedule: {
    backgroundColor: palette.grey,
    height: 60,
    width: 60,
    borderRadius: 60 / 2,
    flexDirection: 'row',
  },
  roundedModal: {
    marginBottom: Constants.isIphoneX ? 0 : 20,
    borderRadius: 12
  }
})

const escapeUnsafe = (unsafe: string) => unsafe
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;')
  .replace(/ /gi, '-')

import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { deleteEvent } from '@progress/Todo/UserTaskHelper2'

type unitType = 'freeStyle' | 'picker' | 'fixed'

type dataType = 'secondaryGoalName' | 'null' | 'secondaryExerciseName'

type RootNavigationStackParamList = {
  UserAddSchedule: {
    primaryGoalType: PrimaryGoalType,
    secondaryGoalType?: string,
  },
  UserAddGoal: {
    primaryGoalType: PrimaryGoalType,
    secondaryGoalName?: string,
    scheduleId?: string,

    goalUnit?: string,

    unitType: unitType,
    dataType: dataType,
  },
  UserAddEndurance: { type: string }
  UserViewEndurance3Months: { type: string }
  UserViewEnduranceAnnually: { type: string }
  UserViewEnduranceCalendar: { type: string }
  UserViewEnduranceMonthly: { type: string }
  UserViewEnduranceStats: { type: string }
  UserViewEnduranceWeekly: { type: string }
  UserAddExercise: undefined
  UserViewExercise3Months: undefined
  UserViewExerciseAnnually: undefined
  UserViewExerciseCalendar: undefined
  UserViewExerciseMonthly: undefined
  UserViewExerciseStats: undefined
  UserViewExeciseMonthly: undefined
  UserViewExerciseWeekly: undefined
  UserAddFruitServing: undefined
  UserViewFruitCalendar: undefined
  UserViewFruitServing3Months: undefined
  UserViewFruitServingAnnually: undefined
  UserViewFruitServingMonthly: undefined
  UserViewFruitServingStats: undefined
  UserViewFruitServingWeekly: undefined
  UserAddHabit: { type: string }
  UserViewHabitCalendar: { type: string }
  UserViewHabit3Months: { type: string }
  UserViewHabitAnnually: { type: string  }
  UserViewHabitMonthly: { type: string }
  UserViewHabitStats: {
    type: string
  }
  UserViewHabitWeekly: {
    type: string
  }
  UserAddLimit: {
    type: string
  }
  UserViewLimitCalendar: {
    type: string
  }
  UserViewLimit3Months: {
    type: string
  }
  UserViewLimitAnnually: {
    type: string
  }
  UserViewLimitMonthly: {
    type: string
  }
  UserViewLimitStats: {
    type: string
  }
  UserViewLimitWeekly: {
    type: string
  }
  UserAddMeditation: undefined
  UserViewMeditationCalendar: undefined
  UserViewMeditation3Months: undefined
  UserViewMeditationAnnually: undefined
  UserViewMeditationMonthly: undefined
  UserViewMeditationStats: undefined
  UserViewMeditationWeekly: undefined
  UserAddSkill: {
    type: string
  }
  UserViewSkillCalendar: {
    type: string
  }
  UserViewSkill3Months: {
    type: string
  }
  UserViewSkillAnnually: {
    type: string
  }
  UserViewSkillMonthly: {
    type: string
  }
  UserViewSkillStats: {
    type: string
  }
  UserViewSkillWeekly: {
    type: string
  }
  UserAddRoutine: {
    routineId: string
  }
  UserViewRoutineCalendar: {
    type: string
  }
  UserAddSleep: undefined
  UserViewSleepCalendar: undefined
  UserViewSleep3Months: undefined
  UserViewSleepAnnually: undefined
  UserViewSleepMonthly: undefined
  UserViewSleepStats: undefined
  UserViewSleepWeekly: undefined
  UserAddStep: undefined
  UserViewStepCalendar: undefined
  UserViewStep3Months: undefined
  UserViewStepAnnually: undefined
  UserViewStepMonthly: undefined
  UserViewStepStats: undefined
  UserViewStepWeekly: undefined
  UserAddStrength: {
    type: string
  }
  UserViewStrength3Months: {
    type: string
  }
  UserViewStrengthAnnually: {
    type: string
  }
  UserViewStrengthCalendar: {
    type: string
  }
  UserViewStrengthMonthly: {
    type: string
  }
  UserViewStrengthStats: {
    type: string
  }
  UserViewStrengthWeekly: {
    type: string
  }
  UserAddVegetable: undefined
  UserViewVegetableCalendar: undefined
  UserViewVegetable3Months: undefined
  UserViewVegetableAnnually: undefined
  UserViewVegetableMonthly: undefined
  UserViewVegetableStats: undefined
  UserViewVegetableWeekly: undefined
  UserAddWaist: undefined
  UserViewWaistCalendar: undefined
  UserViewWaist3Months: undefined
  UserViewWaistAnnually: undefined
  UserViewWaistMonthly: undefined
  UserViewWaistStats: undefined
  UserViewWaistWeekly: undefined
  UserAddWater: undefined
  UserViewWaterCalendar: undefined
  UserViewWater3Months: undefined
  UserViewWaterAnnually: undefined
  UserViewWaterMonthly: undefined
  UserViewWaterStats: undefined
  UserViewWaterWeekly: undefined
  UserAddWeight: undefined
  UserViewWeightCalendar: undefined
  UserViewWeight3Months: undefined
  UserViewWeightAnnually: undefined
  UserViewWeightMonthly: undefined
  UserViewWeightStats: undefined
  UserViewWeightWeekly: undefined
  UserProgressActiveComponents: undefined
}

type UserProgressActiveComponentsNavigationProp = StackNavigationProp<
  RootNavigationStackParamList,
  'UserProgressActiveComponents'
>

type RootRouteStackParamList = {
  UserProgressActiveComponents: {
    isUpdate?: string,
  }
}

type UserProgressActiveComponentsRouteProp = RouteProp<
  RootRouteStackParamList,
  'UserProgressActiveComponents'
>

type Props = {
  route: UserProgressActiveComponentsRouteProp,
  sub: string,
  getRealmApp: () => Realm,
  client: ApolloClient<NormalizedCacheObject>,
}


function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

const dark = Appearance.getColorScheme() === 'dark'

function UserProgressActiveComponents(props: Props) {
  const [displayTypes, setDisplayTypes] = useState<UserActivateType[] | []>([])
  // const [names, setNames] = useState<string[] | []>([])
  const [goals, setGoals] = useState<(Goal | null)[] | []>([])
  const [goalExercises, setGoalExercises] = useState<(GoalExercise)[] | []>([])
  const [schedules, setSchedules] = useState<(Schedule | null)[] | []>([])
  const [isGoalDelete, setIsGoalDelete] = useState<number>(-1)
  const [isGoalExerciseDelete, setIsGoalExerciseDelete] = useState<number>(-1)
  const [isScheduleDelete, setIsScheduleDelete] = useState<number>(-1)
  const [userId, setUserId] = useState<string>()
  const isUpdate = props?.route?.params?.isUpdate

  const {
    sub,
    getRealmApp,
  } = props

  const realm = getRealmApp()

  const client = props?.client

  // const currentUserProfileEl = useRef<UserProfile>(null)

  const navigation = useNavigation<UserProgressActiveComponentsNavigationProp>()



   // getUserIdEl and profileIdEl from DataStore
    useEffect(() => {
      (async () => {
        try {
          const users = await DataStore.query(User, c => c.sub('eq', sub), {
            limit: 1,
          })
          if (users?.[0]?.id) {
            setUserId(users?.[0]?.id)
          }
        } catch (e) {
          
        }
      })()
    }, [sub])
  
    useFocusEffect(
      useCallback(() => {
        (async () => {
          try {
            const users = await DataStore.query(User, c => c.sub('eq', sub), {
              limit: 1,
            })

            if (users?.[0]?.id) {
              setUserId(users?.[0]?.id)
            }
            
          } catch (e) {
            
          }
          })()
        }, [sub]
      )
    )

  /**
    At user registration create an initial secondaryGoalType 'null' type for each offered type.
    Query active types
   */
  useEffect(() => {
    (async () => {
      try {


        if (!userId) {
          return
        }

        const activeTypes = await DataStore.query(
          UserActivateType, c => c
            .userId('eq', userId)
            .activated('eq', true)
        )

        

        if (activeTypes?.[0]?.id) {
          setDisplayTypes(activeTypes)
        } else {
          const activeTypesData = await API
            .graphql({
              query: ListActivateTypesByUser,
              variables: {
                userId,
              } as ListActivateTypesByUserQueryVariables
            }) as GraphQLResult<ListActivateTypesByUserQuery>

          const activeTypes2 = activeTypesData?.data?.listActivateTypesByUser?.items
          const filteredItems = activeTypes2.filter(i => (i.activated === true))

          if (filteredItems?.[0]?.id) {
            setDisplayTypes(filteredItems)
          }
        }
      } catch(e) {
        
      }
    })()
  }, [userId, isUpdate])

  useFocusEffect(
    useCallback(
      () => {
        (async () => {
          try {


            if (!userId) {
              return
            }
    
            const activeTypes = await DataStore.query(
              UserActivateType, c => c
                .userId('eq', userId)
                .activated('eq', true)
            )
    
            
    
            if (activeTypes?.[0]?.id) {
              setDisplayTypes(activeTypes)
            } else {
              const activeTypesData = await API
                .graphql({
                  query: ListActivateTypesByUser,
                  variables: {
                    userId,
                  } as ListActivateTypesByUserQueryVariables
                }) as GraphQLResult<ListActivateTypesByUserQuery>
    
              const activeTypes2 = activeTypesData?.data?.listActivateTypesByUser?.items
              const filteredItems = activeTypes2.filter(i => (i.activated === true))
    
              if (filteredItems?.[0]?.id) {
                setDisplayTypes(filteredItems)
              }
            }
          } catch(e) {
            
          }
        })()
      }, [userId, isUpdate]
    )
  )

  /**
    Get goals by userId
   */
   useEffect(() => {
     (async () => {
       try {
         if (!(displayTypes?.length > 0)) {
           
           return
         }

         if (!(userId)) {
           
           return
         }

        const newGoals = await Promise.all(displayTypes.map(async (displayType) => {
          const goals1 = await DataStore.query(Goal, c => c
             .userId('eq', userId)
             .status('eq', Status.ACTIVE)
             .primaryGoalType('eq', displayType.primaryGoalType)
             .secondaryGoalType('eq', displayType.secondaryGoalType))

            if (goals1?.length > 0) {
              const [newValue] = goals1.filter(i => !!i)
              return newValue
            }

          const goals2 = await DataStore.query(Goal, c => c
             .userId('eq', userId)
             .date('beginsWith', dayjs().subtract(1, 'y').format('YYYY'))
             .status('eq', Status.ACTIVE)
             .primaryGoalType('eq', displayType.primaryGoalType)
             .secondaryGoalType('eq', displayType.secondaryGoalType))

            if (goals2?.length > 0) {
              const [newValue] = goals2.filter(i => !!i)
              return newValue
            }

          return null
        }))

        if (newGoals?.length > 0) {
          
          setGoals(newGoals)
        }
       } catch(e) {
         
       }
     })()
   }, [userId, (displayTypes?.length > 0 || 0), isUpdate])

   useFocusEffect(
     useCallback(
      () => {
        (async () => {
          try {
            if (!(displayTypes?.length > 0)) {
              
              return
            }
   
            if (!(userId)) {
              
              return
            }
   
           const newGoals = await Promise.all(displayTypes.map(async (displayType) => {
             const goals1 = await DataStore.query(Goal, c => c
                .userId('eq', userId)
                .status('eq', Status.ACTIVE)
                .primaryGoalType('eq', displayType.primaryGoalType)
                .secondaryGoalType('eq', displayType.secondaryGoalType))
   
               if (goals1?.length > 0) {
                 const [newValue] = goals1.filter(i => !!i)
                 return newValue
               }
   
             const goals2 = await DataStore.query(Goal, c => c
                .userId('eq', userId)
                .date('beginsWith', dayjs().subtract(1, 'y').format('YYYY'))
                .status('eq', Status.ACTIVE)
                .primaryGoalType('eq', displayType.primaryGoalType)
                .secondaryGoalType('eq', displayType.secondaryGoalType))
   
               if (goals2?.length > 0) {
                 const [newValue] = goals2.filter(i => !!i)
                 return newValue
               }
   
             return null
           }))
   
           if (newGoals?.length > 0) {
             
             setGoals(newGoals)
           }
          } catch(e) {
            
          }
        })()
      }, [userId, (displayTypes?.length > 0 || 0), isUpdate]
     )
   )

   /**
     Get goal Exercises by userId
    */
    useEffect(() => {
      (async () => {
        try {
          if (!(displayTypes?.length > 0)) {
            
            return
          }

          if (!(userId)) {
            
            return
          }

         const newGoals = await Promise.all(displayTypes.map(async (displayType) => {
           const newValues = await DataStore.query(GoalExercise, c => c
              .userId('eq', userId)
              .status('eq', Status.ACTIVE)
              .primaryGoalType('eq', displayType.primaryGoalType)
              .secondaryGoalType('eq', displayType.secondaryGoalType),
              {
                page: 0,
                limit: 100,
                sort: s => s.date(SortDirection.DESCENDING),
              },
            )

             if (newValues?.[0]?.id) {
               const [newValue] = newValues
               return newValue
             }

             const goals1 = await DataStore.query(
               GoalExercise,
               c => c.userId('eq', userId)
                 .date('beginsWith', dayjs().subtract(1, 'y').format('YYYY'))
                 .status('eq', Status.ACTIVE)
                 .primaryGoalType('eq', displayType.primaryGoalType)
                 .secondaryGoalType('eq', displayType.secondaryGoalType),
                 {
                   page: 0,
                   limit: 100,
                   sort: s => s.date(SortDirection.DESCENDING),
                 },
               )

               if (goals1?.[0]?.id) {
                 const [newValue] = goals1
                 return newValue
               }

             return null
           }
         ))

         if (newGoals?.length > 0) {
           
           setGoalExercises(newGoals)
         }

        } catch(e) {
          
        }
      })()
    }, [userId, (displayTypes?.length > 0 || 0), isUpdate])

    useFocusEffect(
      useCallback(
        () => {
          (async () => {
            try {
              if (!(displayTypes?.length > 0)) {
                
                return
              }
    
              if (!(userId)) {
                
                return
              }
    
             const newGoals = await Promise.all(displayTypes.map(async (displayType) => {
               const newValues = await DataStore.query(GoalExercise, c => c
                  .userId('eq', userId)
                  .status('eq', Status.ACTIVE)
                  .primaryGoalType('eq', displayType.primaryGoalType)
                  .secondaryGoalType('eq', displayType.secondaryGoalType),
                  {
                    page: 0,
                    limit: 100,
                    sort: s => s.date(SortDirection.DESCENDING),
                  },
                )
    
                 if (newValues?.[0]?.id) {
                   const [newValue] = newValues
                   return newValue
                 }
    
                 const goals1 = await DataStore.query(
                   GoalExercise,
                   c => c.userId('eq', userId)
                     .date('beginsWith', dayjs().subtract(1, 'y').format('YYYY'))
                     .status('eq', Status.ACTIVE)
                     .primaryGoalType('eq', displayType.primaryGoalType)
                     .secondaryGoalType('eq', displayType.secondaryGoalType),
                     {
                       page: 0,
                       limit: 100,
                       sort: s => s.date(SortDirection.DESCENDING),
                     },
                   )
    
                   if (goals1?.[0]?.id) {
                     const [newValue] = goals1
                     return newValue
                   }
    
                 return null
               }
             ))
    
             if (newGoals?.length > 0) {
               
               setGoalExercises(newGoals)
             }
    
            } catch(e) {
              
            }
          })()
        }, [userId, (displayTypes?.length > 0 || 0), isUpdate]
      )
    )

   /**
   Get Schedule by userId
    */
    useEffect(() => {
      (async () => {
        try {
          if (!(userId)) {
            // 
            return
          }

          const newSchedules = await Promise.all(displayTypes.map(async (displayType) => {
            const newValues = displayType?.secondaryGoalType
              ? await DataStore.query(Schedule, c => c
                 .userId('eq', userId)
                 .status('eq', Status.ACTIVE)
                 .primaryGoalType('eq', displayType.primaryGoalType)
                 .secondaryGoalType('eq', displayType.secondaryGoalType))
              : await DataStore.query(Schedule, c => c
                 .userId('eq', userId)
                 .status('eq', Status.ACTIVE)
                 .primaryGoalType('eq', displayType.primaryGoalType)
                 .secondaryGoalType('eq', 'null'))

            if (newValues?.length > 0) {
                
                const [newValue] = newValues
                return newValue
              }
              return null
            }))

          if (newSchedules?.length > 0) {
            
            setSchedules(newSchedules)
          }

        } catch(e) {
          
        }
      })()
    }, [userId, (displayTypes?.length > 0 || 0), isUpdate])

    useFocusEffect(
      useCallback(
        () => {
          (async () => {
            try {
              if (!(userId)) {
                
                return
              }
    
              const newSchedules = await Promise.all(displayTypes.map(async (displayType) => {
                const newValues = displayType?.secondaryGoalType
                  ? await DataStore.query(Schedule, c => c
                     .userId('eq', userId)
                     .status('eq', Status.ACTIVE)
                     .primaryGoalType('eq', displayType.primaryGoalType)
                     .secondaryGoalType('eq', displayType.secondaryGoalType))
                  : await DataStore.query(Schedule, c => c
                     .userId('eq', userId)
                     .status('eq', Status.ACTIVE)
                     .primaryGoalType('eq', displayType.primaryGoalType)
                     .secondaryGoalType('eq', 'null'))
    
                  if (newValues?.length > 0) {
                    
                    const [newValue] = newValues
                    return newValue
                  }
                  return null
                }))
    
              if (newSchedules?.length > 0) {
                
                setSchedules(newSchedules)
              }
    
            } catch(e) {
              
            }
          })()
        }, [userId, (displayTypes?.length > 0 || 0), isUpdate]
      )
    )

  const getDataName = (type: PrimaryGoalType, secondaryName?: string) => {
    switch(type) {
      case PrimaryGoalType.NEWSKILLTYPE:
        return `New Skill: ${secondaryName}`

      case PrimaryGoalType.MEDITATION:
        return 'Meditate'

      case PrimaryGoalType.STEP:
        return 'Steps'
      case PrimaryGoalType.STRENGTH:
        return `Strength: ${secondaryName}`
      case PrimaryGoalType.ENDURANCE:
        return `Endurance: ${secondaryName}`

      case PrimaryGoalType.WEIGHT:
        return 'Weight'
      case PrimaryGoalType.ROUTINE:
        return 'Routine'
      case PrimaryGoalType.HABITTYPE:
        return `New Habit: ${secondaryName}`
      case PrimaryGoalType.LIMITTYPE:
        return `New Limit: ${secondaryName}`
    }
  }

  const hideGoalDeleteModal = () => setIsGoalDelete(-1)

  const hideGoalExerciseDeleteModal = () => setIsGoalExerciseDelete(-1)

  const hideScheduleDeleteModal = () => setIsScheduleDelete(-1)

  const openGoalDeleteModal = (index: number) => setIsGoalDelete(index)

  const openGoalExerciseDeleteModal = (index: number) => setIsGoalExerciseDelete(index)

  const openScheduleDeleteModal = (index: number) => setIsScheduleDelete(index)

  const deleteSchedule = async () => {
    try {

      if (isScheduleDelete < 0) {
        
        return
      }

      const index = isScheduleDelete

      if (!(schedules?.[index])) {
        
        return
      }
      
      await deleteEvent(client, sub, schedules?.[index]?.eventId)

      // await cleanUpActivitySchedule(schedules?.[index]?.primaryGoalType, schedules?.[index]?.secondaryGoalType, true)

      const deletedSchedule = await DataStore.delete(schedules[index])

      

      const newSchedules = schedules
        .slice(0, index)
        .concat([null])
        .concat(schedules
          .slice(index + 1))

      setSchedules(newSchedules)

      hideScheduleDeleteModal()

    } catch(e) {
      
    }
  }

  const deleteGoal = async () => {
    try {
      

      if (isGoalDelete < 0) {
        
        return
      }



      const index = isGoalDelete

      if (!(goals?.[index])) {
        
        return
      }

      const deletedGoal = await DataStore.delete(goals[index])

      

      const newGoals = goals
        .slice(0, index)
        .concat([null])
        .concat(goals.slice(index + 1))

      setGoals(newGoals)

      hideGoalDeleteModal()

    } catch(e) {
      
    }
  }

  const deleteGoalExercise = async () => {
    try {
      

      if (isGoalExerciseDelete < 0) {
        
        return
      }



      const index = isGoalExerciseDelete

      if (!(goalExercises?.[index])) {
        
        return
      }

      const deletedGoalExercise = await DataStore.delete(goalExercises[index])

      

      const newGoalExercises = goalExercises
        .slice(0, index)
        .concat([null])
        .concat(goalExercises.slice(index + 1))

      setGoalExercises(newGoalExercises)

      hideGoalExerciseDeleteModal()

    } catch(e) {
      
    }
  }

  const updateActivateTypeToInactive = async (index: number) => {
    try {
      const activateType = displayTypes[index]

      await DataStore.save(
        UserActivateType.copyOf(
          activateType, updated => {
            updated.activated = false
          }
        )
      )

      const newDisplayTypes = displayTypes
        .slice(0, index)
        .concat(
          displayTypes.slice(index + 1)
        )

      setDisplayTypes(newDisplayTypes)

      const newGoals = goals
        .slice(0, index)
        .concat(
          goals.slice(index + 1)
        )

      setGoals(newGoals)

      const newSchedules = schedules
        .slice(0, index)
        .concat(
          schedules.slice(index + 1)
        )

      setSchedules(newSchedules)

    } catch(e) {
      
    }
  }

  const navigateToAddGoal = (type: PrimaryGoalType, index: number) => {
    switch(type) {

      case PrimaryGoalType.ENDURANCE:
          
        return navigation.navigate('UserAddGoal', {
          primaryGoalType: type,
          secondaryGoalName: displayTypes?.[index]?.secondaryGoalName,
          scheduleId: schedules?.[index]?.id,
          goalUnit: goals?.[index]?.goalUnit ?? displayTypes?.[index]?.unit,
          unitType: 'picker',
          dataType: 'secondaryExerciseName',
         })

      case PrimaryGoalType.HABITTYPE:
        return navigation.navigate('UserAddGoal', {
          primaryGoalType: type,
          secondaryGoalName: displayTypes?.[index]?.secondaryGoalName,
          scheduleId: schedules?.[index]?.id,
          goalUnit: goals?.[index]?.goalUnit ?? displayTypes?.[index]?.unit,
          unitType: 'freeStyle',
          dataType: 'secondaryGoalName',
         })
      case PrimaryGoalType.LIMITTYPE:
        return navigation.navigate('UserAddGoal', {
          primaryGoalType: type,
          secondaryGoalName: displayTypes?.[index]?.secondaryGoalName,
          scheduleId: schedules?.[index]?.id,
          goalUnit: goals?.[index]?.goalUnit ?? displayTypes?.[index]?.unit,
          unitType: 'freeStyle',
          dataType: 'secondaryGoalName',
         })
      case PrimaryGoalType.MEDITATION:
        return navigation.navigate('UserAddGoal', {
          primaryGoalType: type,
          scheduleId: schedules?.[index]?.id,
          goalUnit: goals?.[index]?.goalUnit ?? displayTypes[index]?.unit,
          unitType: 'fixed',
          dataType: 'null',
          secondaryGoalName: 'null',
        })
      case PrimaryGoalType.NEWSKILLTYPE:
        return navigation.navigate('UserAddGoal', {
          primaryGoalType: type,
          secondaryGoalName: displayTypes?.[index]?.secondaryGoalName,
          scheduleId: schedules?.[index]?.id,
          goalUnit: goals?.[index]?.goalUnit ?? displayTypes[index]?.unit,
          unitType: 'freeStyle',
          dataType: 'secondaryGoalName',
         })
      case PrimaryGoalType.ROUTINE:
        return navigation.navigate('UserAddGoal', {
          primaryGoalType: type,
          secondaryGoalName: displayTypes?.[index]?.secondaryGoalName,
          scheduleId: schedules?.[index]?.id,
          goalUnit: goals?.[index]?.goalUnit ?? displayTypes[index]?.unit ?? 'minutes',
          unitType: 'fixed',
          dataType: 'secondaryGoalName',
        })

      case PrimaryGoalType.STEP:
        return navigation.navigate('UserAddGoal', {
          primaryGoalType: type,
          scheduleId: schedules?.[index]?.id,
          goalUnit: goals?.[index]?.goalUnit ?? displayTypes[index]?.unit,
          unitType: 'fixed',
          dataType: 'null',
          secondaryGoalName: 'null',
        })
      case PrimaryGoalType.STRENGTH:
        return navigation.navigate('UserAddGoal', {
          primaryGoalType: type,
          secondaryGoalName: displayTypes[index].secondaryGoalName,
          scheduleId: schedules?.[index]?.id,
          goalUnit: goals?.[index]?.goalUnit ?? displayTypes[index]?.unit,
          unitType: 'picker',
          dataType: 'secondaryExerciseName',
         })

      case PrimaryGoalType.WEIGHT:
        return navigation.navigate('UserAddGoal', {
          primaryGoalType: type,
          scheduleId: schedules?.[index]?.id,
          goalUnit: goals?.[index]?.goalUnit ?? displayTypes[index]?.unit,
          unitType: 'fixed',
          dataType: 'null',
          secondaryGoalName: 'null',
        })
    }
  }

  const navigateToAddSchedule = (type: PrimaryGoalType, index: number) => {
    switch(type) {

      case PrimaryGoalType.ENDURANCE:
        return navigation.navigate('UserAddSchedule', {
          primaryGoalType: type,
          secondaryGoalType: escapeUnsafe(displayTypes[index].secondaryGoalName),

         })

      case PrimaryGoalType.HABITTYPE:
        return navigation.navigate('UserAddSchedule', {
          primaryGoalType: type,
          secondaryGoalType: escapeUnsafe(displayTypes[index].secondaryGoalName),

         })
      case PrimaryGoalType.LIMITTYPE:
        return navigation.navigate('UserAddSchedule', {
          primaryGoalType: type,
          secondaryGoalType: escapeUnsafe(displayTypes[index].secondaryGoalName),

         })
      case PrimaryGoalType.MEDITATION:
        return navigation.navigate('UserAddSchedule', {
          primaryGoalType: type,

          secondaryGoalType: 'null',
        })
      case PrimaryGoalType.NEWSKILLTYPE:
        return navigation.navigate('UserAddSchedule', {
          primaryGoalType: type,
          secondaryGoalType: escapeUnsafe(displayTypes[index].secondaryGoalName),

         })
      case PrimaryGoalType.ROUTINE:
        return navigation.navigate('UserAddSchedule', {
          primaryGoalType: type,
          secondaryGoalType: escapeUnsafe(displayTypes[index].secondaryGoalName),

        })

      case PrimaryGoalType.STEP:
        return navigation.navigate('UserAddSchedule', {
          primaryGoalType: type,

          secondaryGoalType: 'null',
        })
      case PrimaryGoalType.STRENGTH:
        
        return navigation.navigate('UserAddSchedule', {
          primaryGoalType: type,
          secondaryGoalType: escapeUnsafe(displayTypes[index].secondaryGoalName),

         })
   
      case PrimaryGoalType.WEIGHT:
        return navigation.navigate('UserAddSchedule', {
          primaryGoalType: type,

          secondaryGoalType: 'null',
        })
    }
  }

  const navigateToAdd = (type: PrimaryGoalType, name?: string) => {
    
    switch(type) {

      case PrimaryGoalType.ENDURANCE:
        if (!name) {
          return // 
        }
        return navigation.navigate('UserAddEndurance', { type: name })

      case PrimaryGoalType.HABITTYPE:
        if (!name) {
          return // 
        }
        return navigation.navigate('UserAddHabit', { type: name })
      case PrimaryGoalType.LIMITTYPE:
        if (!name) {
          return // 
        }
        return navigation.navigate('UserAddLimit', { type: name })
      case PrimaryGoalType.MEDITATION:
        return navigation.navigate('UserAddMeditation')
      case PrimaryGoalType.NEWSKILLTYPE:
        if (!name) {
          return // 
        }
        return navigation.navigate('UserAddSkill', { type: name })
      case PrimaryGoalType.ROUTINE:
        if (!name) {
          return // 
        }
        return navigation.navigate('UserAddRoutine', { routineId: name })

      case PrimaryGoalType.STEP:
        return navigation.navigate('UserAddStep')
      case PrimaryGoalType.STRENGTH:
        if (!name) {
          return // 
        }
        return navigation.navigate('UserAddStrength', { type: name })

      case PrimaryGoalType.WEIGHT:
        return navigation.navigate('UserAddWeight')
    }
  }

  const navigateToCalendarView = (type: PrimaryGoalType, name?: string) => {
    switch(type) {
      // case PrimaryGoalType.GENERICEXERCISE:
      //   return navigation.navigate('UserViewExerciseCalendar')
      case PrimaryGoalType.ENDURANCE:
        if (!name) {
          return // 
        }
        return navigation.navigate('UserViewEnduranceCalendar', { type: name })
      // case PrimaryGoalType.FRUIT:
      //   return navigation.navigate('UserViewFruitCalendar')
      case PrimaryGoalType.HABITTYPE:
        if (!name) {
          return // 
        }
        return navigation.navigate('UserViewHabitCalendar', { type: name })
      case PrimaryGoalType.LIMITTYPE:
        if (!name) {
          return // 
        }
        return navigation.navigate('UserViewLimitCalendar', { type: name })
      case PrimaryGoalType.MEDITATION:
        return navigation.navigate('UserViewMeditationCalendar')
      case PrimaryGoalType.NEWSKILLTYPE:
        if (!name) {
          return // 
        }
        return navigation.navigate('UserViewSkillCalendar', { type: name })
      // case PrimaryGoalType.SLEEP:
      //   return navigation.navigate('UserViewSleepCalendar')
      case PrimaryGoalType.STEP:
        return navigation.navigate('UserViewStepCalendar')
      case PrimaryGoalType.STRENGTH:
        if (!name) {
          return // 
        }
        return navigation.navigate('UserViewStrengthCalendar', { type: name })
      // case PrimaryGoalType.VEGETABLE:
      //   return navigation.navigate('UserViewVegetableCalendar')
      // case PrimaryGoalType.WAIST:
      //   return navigation.navigate('UserViewWaistCalendar')
      // case PrimaryGoalType.WATER:
      //   return navigation.navigate('UserViewWaterCalendar')
      case PrimaryGoalType.WEIGHT:
        return navigation.navigate('UserViewWeightCalendar')
      case PrimaryGoalType.ROUTINE:
        if (!name) {
          return // 
        }
        return navigation.navigate('UserViewRoutineCalendar', { type: name })
    }
  }

  const navigateTo1YView = (type: PrimaryGoalType, name?: string) => {
    switch(type) {
      // case PrimaryGoalType.GENERICEXERCISE:
      //   return navigation.navigate('UserViewExerciseAnnually')
      case PrimaryGoalType.ENDURANCE:
        if (!name) {
          return // 
        }
        return navigation.navigate('UserViewEnduranceAnnually', { type: name })
      // case PrimaryGoalType.FRUIT:
      //   return navigation.navigate('UserViewFruitServingAnnually')
      case PrimaryGoalType.HABITTYPE:
        if (!name) {
          return // 
        }
        return navigation.navigate('UserViewHabitAnnually', { type: name })
      case PrimaryGoalType.LIMITTYPE:
        if (!name) {
          return // 
        }
        return navigation.navigate('UserViewLimitAnnually', { type: name })
      case PrimaryGoalType.MEDITATION:
        return navigation.navigate('UserViewMeditationAnnually')
      case PrimaryGoalType.NEWSKILLTYPE:
        if (!name) {
          return // 
        }
        return navigation.navigate('UserViewSkillAnnually', { type: name })
      // case PrimaryGoalType.SLEEP:
      //   return navigation.navigate('UserViewSleepAnnually')
      case PrimaryGoalType.STEP:
        return navigation.navigate('UserViewStepAnnually')
      case PrimaryGoalType.STRENGTH:
        if (!name) {
          return // 
        }
        return navigation.navigate('UserViewStrengthAnnually', { type: name })

      case PrimaryGoalType.WEIGHT:
        return navigation.navigate('UserViewWeightAnnually')
    }
  }

  const navigateTo3MView = (type: PrimaryGoalType, name?: string) => {
    switch(type) {

      case PrimaryGoalType.ENDURANCE:
        if (!name) {
          return // 
        }
        return navigation.navigate('UserViewEndurance3Months', { type: name })

      case PrimaryGoalType.HABITTYPE:
        if (!name) {
          return // 
        }
        return navigation.navigate('UserViewHabit3Months', { type: name })
      case PrimaryGoalType.LIMITTYPE:
        if (!name) {
          return // 
        }
        return navigation.navigate('UserViewLimit3Months', { type: name })
      case PrimaryGoalType.MEDITATION:
        return navigation.navigate('UserViewMeditation3Months')
      case PrimaryGoalType.NEWSKILLTYPE:
        if (!name) {
          return // 
        }
        return navigation.navigate('UserViewSkill3Months', { type: name })
      // case PrimaryGoalType.SLEEP:
      //   return navigation.navigate('UserViewSleep3Months')
      case PrimaryGoalType.STEP:
        return navigation.navigate('UserViewStep3Months')
      case PrimaryGoalType.STRENGTH:
        if (!name) {
          return // 
        }
        return navigation.navigate('UserViewStrength3Months', { type: name })

      case PrimaryGoalType.WEIGHT:
        return navigation.navigate('UserViewWeight3Months')
    }
  }

  const navigateTo1MView = (type: PrimaryGoalType, name?: string) => {
    switch(type) {
      // case PrimaryGoalType.GENERICEXERCISE:
      //   return navigation.navigate('UserViewExerciseMonthly')
      case PrimaryGoalType.ENDURANCE:
        if (!name) {
          return // 
        }
        return navigation.navigate('UserViewEnduranceMonthly', { type: name })
      // case PrimaryGoalType.FRUIT:
      //   return navigation.navigate('UserViewFruitServingMonthly')
      case PrimaryGoalType.HABITTYPE:
        if (!name) {
          return // 
        }
        return navigation.navigate('UserViewHabitMonthly', { type: name })
      case PrimaryGoalType.LIMITTYPE:
        if (!name) {
          return // 
        }
        return navigation.navigate('UserViewLimitMonthly', { type: name })
      case PrimaryGoalType.MEDITATION:
        return navigation.navigate('UserViewMeditationMonthly')
      case PrimaryGoalType.NEWSKILLTYPE:
        if (!name) {
          return // 
        }
        return navigation.navigate('UserViewSkillMonthly', { type: name })
      // case PrimaryGoalType.SLEEP:
      //   return navigation.navigate('UserViewSleepMonthly')
      case PrimaryGoalType.STEP:
        return navigation.navigate('UserViewStepMonthly')
      case PrimaryGoalType.STRENGTH:
        if (!name) {
          return // 
        }
        return navigation.navigate('UserViewStrengthMonthly', { type: name })
      // case PrimaryGoalType.VEGETABLE:
      //   return navigation.navigate('UserViewVegetableMonthly')
      // case PrimaryGoalType.WAIST:
      //   return navigation.navigate('UserViewWaistMonthly')
      // case PrimaryGoalType.WATER:
      //   return navigation.navigate('UserViewWaterMonthly')
      case PrimaryGoalType.WEIGHT:
        return navigation.navigate('UserViewWeightMonthly')
    }
  }

  const navigateTo1WView = (type: PrimaryGoalType, name?: string) => {
    switch(type) {
      // case PrimaryGoalType.GENERICEXERCISE:
      //   return navigation.navigate('UserViewExerciseWeekly')
      case PrimaryGoalType.ENDURANCE:
        if (!name) {
          return // 
        }
        return navigation.navigate('UserViewEnduranceWeekly', { type: name })
      // case PrimaryGoalType.FRUIT:
      //   return navigation.navigate('UserViewFruitServingWeekly')
      case PrimaryGoalType.HABITTYPE:
        if (!name) {
          return // 
        }
        return navigation.navigate('UserViewHabitWeekly', { type: name })
      case PrimaryGoalType.LIMITTYPE:
        if (!name) {
          return // 
        }
        return navigation.navigate('UserViewLimitWeekly', { type: name })
      case PrimaryGoalType.MEDITATION:
        return navigation.navigate('UserViewMeditationWeekly')
      case PrimaryGoalType.NEWSKILLTYPE:
        if (!name) {
          return // 
        }
        return navigation.navigate('UserViewSkillWeekly', { type: name })
      // case PrimaryGoalType.SLEEP:
      //   return navigation.navigate('UserViewSleepWeekly')
      case PrimaryGoalType.STEP:
        return navigation.navigate('UserViewStepWeekly')
      case PrimaryGoalType.STRENGTH:
        if (!name) {
          return // 
        }
        return navigation.navigate('UserViewStrengthWeekly', { type: name })

      case PrimaryGoalType.WEIGHT:
        return navigation.navigate('UserViewWeightWeekly')
    }
  }

  type renderItem = {
    item: UserActivateType,
    index: number,
  }

  /**
  functions: -
  1. navigate to different views
  2. deactivate
   */
  const renderItem = ({ item, index }: renderItem) => {
    
    switch(item.primaryGoalType) {
      
      case PrimaryGoalType.ENDURANCE:
        return (
          <RegularCard justifyContent="center" alignItems="center">
            <Box flex={6}>
              <UserViewEnduranceStats
                sub={sub}
                type={item.secondaryGoalType}
                getRealmApp={getRealmApp}
              />
            </Box>
            <Box style={{ width: '100%' }} flex={4} m={{ phone: 'xs', tablet: 's' }}>
              <Box flex={1} m={{ phone: 'xs', tablet: 's' }} flexDirection="row" justifyContent="space-between">
                {
                  goalExercises?.[index]?.id
                  ? (
                    <Box style={styles.activeGoal} justifyContent="center" alignItems="center">
                      <Pressable onPress={() => openGoalExerciseDeleteModal(index)}>
                        <Feather name="target" size={24} color="white" />
                      </Pressable>
                    </Box>
                  )
                  : (
                    <Box style={styles.offGoal} justifyContent="center" alignItems="center">
                      <Pressable onPress={() => navigateToAddGoal(item.primaryGoalType as PrimaryGoalType, index)}>
                        <Feather name="target" size={24} color="white" />
                      </Pressable>
                    </Box>
                  )
                }
                {
                  schedules?.[index]?.id
                  ? (
                    <Box style={styles.activeSchedule} justifyContent="center" alignItems="center">
                      <Pressable onLongPress={() => openScheduleDeleteModal(index)} onPress={() => navigateToAddSchedule(item.primaryGoalType as PrimaryGoalType, index)}>
                        <MaterialIcons name="schedule" size={24} color="white" />
                      </Pressable>
                    </Box>
                  )
                  : (
                    <Box style={styles.offSchedule} justifyContent="center" alignItems="center">
                      <Pressable onPress={() => navigateToAddSchedule(item.primaryGoalType as PrimaryGoalType, index)}>
                        <MaterialIcons name="schedule" size={24} color="white" />
                      </Pressable>
                    </Box>
                  )
                }
                <Box style={styles.viewStats} justifyContent="center" alignItems="center">
                  <Pressable onPress={() => navigateToCalendarView(item.primaryGoalType as PrimaryGoalType, item?.secondaryGoalType)}>
                    <Ionicons name="ios-calendar-outline" size={24} color="white" />
                  </Pressable>
                </Box>
                <Box style={styles.viewStats} justifyContent="center" alignItems="center">
                  <Pressable onPress={() => navigateTo1YView(item.primaryGoalType as PrimaryGoalType, item?.secondaryGoalType)}>
                    <Text variant="body" color="primaryCardText">
                      1Y
                    </Text>
                    <MaterialCommunityIcons name="chart-bell-curve-cumulative" size={24} color="white" />
                  </Pressable>
                </Box>
              </Box>
              <Box flex={1} m={{ phone: 'xs', tablet: 's' }} flexDirection="row" justifyContent="space-between">
                <Box style={styles.viewStats} justifyContent="center" alignItems="center">
                  <Pressable onPress={() => navigateTo3MView(item.primaryGoalType as PrimaryGoalType, item?.secondaryGoalType)}>
                    <Text variant="body" color="primaryCardText">
                      3M
                    </Text>
                    <MaterialCommunityIcons name="chart-bell-curve-cumulative" size={24} color="white" />
                  </Pressable>
                </Box>
                <Box style={styles.viewStats} justifyContent="center" alignItems="center">
                  <Pressable onPress={() => navigateTo1MView(item.primaryGoalType as PrimaryGoalType, item?.secondaryGoalType)}>
                    <Text variant="body" color="primaryCardText">
                      1M
                    </Text>
                    <MaterialCommunityIcons name="chart-bell-curve-cumulative" size={24} color="white" />
                  </Pressable>
                </Box>
                <Box style={styles.viewStats} justifyContent="center" alignItems="center">
                  <Pressable onPress={() => navigateTo1WView(item.primaryGoalType as PrimaryGoalType, item?.secondaryGoalType)}>
                    <Text variant="body" color="primaryCardText">
                      1W
                    </Text>
                    <Ionicons name="ios-stats-chart" size={24} color="white" />
                  </Pressable>
                </Box>
                <Box style={styles.addIcon} justifyContent="center" alignItems="center">
                  <Pressable onPress={() => navigateToAdd(item.primaryGoalType as PrimaryGoalType, item?.secondaryGoalType)}>
                    <Ionicons name="ios-add" size={24} color="white" />
                  </Pressable>
                </Box>
              </Box>
              <Box flex={1} m={{ phone: 'xs', tablet: 's' }} flexDirection="row" justifyContent="flex-end">
                <Box style={styles.offIcon} justifyContent="center" alignItems="center">
                  <Pressable onLongPress={() => updateActivateTypeToInactive(index)}>
                    <AntDesign  name="poweroff" size={24} color="white" />
                  </Pressable>
                </Box>
              </Box>
            </Box>
          </RegularCard>
        )
      
      case PrimaryGoalType.HABITTYPE:
        return (
          <RegularCard justifyContent="center" alignItems="center">
            <Box flex={6}>
              <UserViewHabitStats
                sub={sub}
                type={item.secondaryGoalType}
                getRealmApp={getRealmApp}
              />
            </Box>
            <Box style={{ width: '100%' }} flex={4} m={{ phone: 'xs', tablet: 's' }}>
              <Box flex={1} m={{ phone: 'xs', tablet: 's' }} flexDirection="row" justifyContent="space-between">
                {
                  goals?.[index]?.id
                  ? (
                    <Box style={styles.activeGoal} justifyContent="center" alignItems="center">
                      <Pressable onPress={() => openGoalDeleteModal(index)}>
                        <Feather name="target" size={24} color="white" />
                      </Pressable>
                    </Box>
                  )
                  : (
                    <Box style={styles.offGoal} justifyContent="center" alignItems="center">
                      <Pressable onPress={() => navigateToAddGoal(item.primaryGoalType as PrimaryGoalType, index)}>
                        <Feather name="target" size={24} color="white" />
                      </Pressable>
                    </Box>
                  )
                }
                {
                  schedules?.[index]?.id
                  ? (
                    <Box style={styles.activeSchedule} justifyContent="center" alignItems="center">
                      <Pressable onLongPress={() => openScheduleDeleteModal(index)}  onPress={() => navigateToAddSchedule(item.primaryGoalType as PrimaryGoalType, index)}>
                        <MaterialIcons name="schedule" size={24} color="white" />
                      </Pressable>
                    </Box>
                  )
                  : (
                    <Box style={styles.offSchedule} justifyContent="center" alignItems="center">
                      <Pressable onPress={() => navigateToAddSchedule(item.primaryGoalType as PrimaryGoalType, index)}>
                        <MaterialIcons name="schedule" size={24} color="white" />
                      </Pressable>
                    </Box>
                  )
                }
                <Box style={styles.viewStats} justifyContent="center" alignItems="center">
                  <Pressable onPress={() => navigateToCalendarView(item.primaryGoalType as PrimaryGoalType, item?.secondaryGoalType)}>
                    <Ionicons name="ios-calendar-outline" size={24} color="white" />
                  </Pressable>
                </Box>
                <Box style={styles.viewStats} justifyContent="center" alignItems="center">
                  <Pressable onPress={() => navigateTo1YView(item.primaryGoalType as PrimaryGoalType, item?.secondaryGoalType)}>
                    <Text variant="body" color="primaryCardText">
                      1Y
                    </Text>
                    <MaterialCommunityIcons name="chart-bell-curve-cumulative" size={24} color="white" />
                  </Pressable>
                </Box>
              </Box>
              <Box flex={1} m={{ phone: 'xs', tablet: 's' }} flexDirection="row" justifyContent="space-between">
                <Box style={styles.viewStats} justifyContent="center" alignItems="center">
                  <Pressable onPress={() => navigateTo3MView(item.primaryGoalType as PrimaryGoalType, item?.secondaryGoalType)}>
                    <Text variant="body" color="primaryCardText">
                      3M
                    </Text>
                    <MaterialCommunityIcons name="chart-bell-curve-cumulative" size={24} color="white" />
                  </Pressable>
                </Box>
                <Box style={styles.viewStats} justifyContent="center" alignItems="center">
                  <Pressable onPress={() => navigateTo1MView(item.primaryGoalType as PrimaryGoalType, item?.secondaryGoalType)}>
                    <Text variant="body" color="primaryCardText">
                      1M
                    </Text>
                    <MaterialCommunityIcons name="chart-bell-curve-cumulative" size={24} color="white" />
                  </Pressable>
                </Box>
                <Box style={styles.viewStats} justifyContent="center" alignItems="center">
                  <Pressable onPress={() => navigateTo1WView(item.primaryGoalType as PrimaryGoalType, item?.secondaryGoalType)}>
                    <Text variant="body" color="primaryCardText">
                      1W
                    </Text>
                    <Ionicons name="ios-stats-chart" size={24} color="white" />
                  </Pressable>
                </Box>
                <Box style={styles.addIcon} justifyContent="center" alignItems="center">
                  <Pressable onPress={() => navigateToAdd(item.primaryGoalType as PrimaryGoalType, item?.secondaryGoalType)}>
                    <Ionicons name="ios-add" size={24} color="white" />
                  </Pressable>
                </Box>
              </Box>
              <Box flex={1} m={{ phone: 'xs', tablet: 's' }} flexDirection="row" justifyContent="flex-end">
                <Box style={styles.offIcon} justifyContent="center" alignItems="center">
                  <Pressable onLongPress={() => updateActivateTypeToInactive(index)}>
                    <AntDesign  name="poweroff" size={24} color="white" />
                  </Pressable>
                </Box>
              </Box>
            </Box>
          </RegularCard>
        )
      case PrimaryGoalType.LIMITTYPE:
        return (
          <RegularCard justifyContent="center" alignItems="center">
            <Box flex={6}>
              <UserViewLimitStats
                sub={sub}
                type={item.secondaryGoalType}
                getRealmApp={getRealmApp}
              />
            </Box>
            <Box style={{ width: '100%' }} flex={4} m={{ phone: 'xs', tablet: 's' }}>
              <Box flex={1} m={{ phone: 'xs', tablet: 's' }} flexDirection="row" justifyContent="space-between">
                {
                  goals?.[index]?.id
                  ? (
                    <Box style={styles.activeGoal} justifyContent="center" alignItems="center">
                      <Pressable onPress={() => openGoalDeleteModal(index)}>
                        <Feather name="target" size={24} color="white" />
                      </Pressable>
                    </Box>
                  )
                  : (
                    <Box style={styles.offGoal} justifyContent="center" alignItems="center">
                      <Pressable onPress={() => navigateToAddGoal(item.primaryGoalType as PrimaryGoalType, index)}>
                        <Feather name="target" size={24} color="white" />
                      </Pressable>
                    </Box>
                  )
                }
                {
                  schedules?.[index]?.id
                  ? (
                    <Box style={styles.activeSchedule} justifyContent="center" alignItems="center">
                      <Pressable onLongPress={() => openScheduleDeleteModal(index)} onPress={() => navigateToAddSchedule(item.primaryGoalType as PrimaryGoalType, index)}>
                        <MaterialIcons name="schedule" size={24} color="white" />
                      </Pressable>
                    </Box>
                  )
                  : (
                    <Box style={styles.offSchedule} justifyContent="center" alignItems="center">
                      <Pressable onPress={() => navigateToAddSchedule(item.primaryGoalType as PrimaryGoalType, index)}>
                        <MaterialIcons name="schedule" size={24} color="white" />
                      </Pressable>
                    </Box>
                  )
                }
                <Box style={styles.viewStats} justifyContent="center" alignItems="center">
                  <Pressable onPress={() => navigateToCalendarView(item.primaryGoalType as PrimaryGoalType, item?.secondaryGoalType)}>
                    <Ionicons name="ios-calendar-outline" size={24} color="white" />
                  </Pressable>
                </Box>
                <Box style={styles.viewStats} justifyContent="center" alignItems="center">
                  <Pressable onPress={() => navigateTo1YView(item.primaryGoalType as PrimaryGoalType, item?.secondaryGoalType)}>
                    <Text variant="body" color="primaryCardText">
                      1Y
                    </Text>
                    <MaterialCommunityIcons name="chart-bell-curve-cumulative" size={24} color="white" />
                  </Pressable>
                </Box>
              </Box>
              <Box flex={1} m={{ phone: 'xs', tablet: 's' }} flexDirection="row" justifyContent="space-between">
                <Box style={styles.viewStats} justifyContent="center" alignItems="center">
                  <Pressable onPress={() => navigateTo3MView(item.primaryGoalType as PrimaryGoalType, item?.secondaryGoalType)}>
                    <Text variant="body" color="primaryCardText">
                      3M
                    </Text>
                    <MaterialCommunityIcons name="chart-bell-curve-cumulative" size={24} color="white" />
                  </Pressable>
                </Box>
                <Box style={styles.viewStats} justifyContent="center" alignItems="center">
                  <Pressable onPress={() => navigateTo1MView(item.primaryGoalType as PrimaryGoalType, item?.secondaryGoalType)}>
                    <Text variant="body" color="primaryCardText">
                      1M
                    </Text>
                    <MaterialCommunityIcons name="chart-bell-curve-cumulative" size={24} color="white" />
                  </Pressable>
                </Box>
                <Box style={styles.viewStats} justifyContent="center" alignItems="center">
                  <Pressable onPress={() => navigateTo1WView(item.primaryGoalType as PrimaryGoalType, item?.secondaryGoalType)}>
                    <Text variant="body" color="primaryCardText">
                      1W
                    </Text>
                    <Ionicons name="ios-stats-chart" size={24} color="white" />
                  </Pressable>
                </Box>
                <Box style={styles.addIcon} justifyContent="center" alignItems="center">
                  <Pressable onPress={() => navigateToAdd(item.primaryGoalType as PrimaryGoalType, item?.secondaryGoalType)}>
                    <Ionicons name="ios-add" size={24} color="white" />
                  </Pressable>
                </Box>
              </Box>
              <Box flex={1} m={{ phone: 'xs', tablet: 's' }} flexDirection="row" justifyContent="flex-end">
                <Box style={styles.offIcon} justifyContent="center" alignItems="center">
                  <Pressable onLongPress={() => updateActivateTypeToInactive(index)}>
                    <AntDesign  name="poweroff" size={24} color="white" />
                  </Pressable>
                </Box>
              </Box>
            </Box>
          </RegularCard>
        )
      case PrimaryGoalType.MEDITATION:
        return (
          <RegularCard justifyContent="center" alignItems="center">
            <Box flex={6}>
              <UserViewMeditationStats
                sub={sub}
                getRealmApp={getRealmApp}
              />
            </Box>
            <Box style={{ width: '100%' }} flex={4} m={{ phone: 'xs', tablet: 's' }}>
              <Box flex={1} m={{ phone: 'xs', tablet: 's' }} flexDirection="row" justifyContent="space-between">
                {
                  goals?.[index]?.id
                  ? (
                    <Box style={styles.activeGoal} justifyContent="center" alignItems="center">
                      <Pressable onPress={() => openGoalDeleteModal(index)}>
                        <Feather name="target" size={24} color="white" />
                      </Pressable>
                    </Box>
                  )
                  : (
                    <Box style={styles.offGoal} justifyContent="center" alignItems="center">
                      <Pressable onPress={() => navigateToAddGoal(item.primaryGoalType as PrimaryGoalType, index)}>
                        <Feather name="target" size={24} color="white" />
                      </Pressable>
                    </Box>
                  )
                }
                {
                  schedules?.[index]?.id
                  ? (
                    <Box style={styles.activeSchedule} justifyContent="center" alignItems="center">
                      <Pressable onLongPress={() => openScheduleDeleteModal(index)} onPress={() => navigateToAddSchedule(item.primaryGoalType as PrimaryGoalType, index)}>
                        <MaterialIcons name="schedule" size={24} color="white" />
                      </Pressable>
                    </Box>
                  )
                  : (
                    <Box style={styles.offSchedule} justifyContent="center" alignItems="center">
                      <Pressable onPress={() => navigateToAddSchedule(item.primaryGoalType as PrimaryGoalType, index)}>
                        <MaterialIcons name="schedule" size={24} color="white" />
                      </Pressable>
                    </Box>
                  )
                }
                <Box style={styles.viewStats} justifyContent="center" alignItems="center">
                  <Pressable onPress={() => navigateToCalendarView(item.primaryGoalType as PrimaryGoalType, item?.secondaryGoalType)}>
                    <Ionicons name="ios-calendar-outline" size={24} color="white" />
                  </Pressable>
                </Box>
                <Box style={styles.viewStats} justifyContent="center" alignItems="center">
                  <Pressable onPress={() => navigateTo1YView(item.primaryGoalType as PrimaryGoalType, item?.secondaryGoalType)}>
                    <Text variant="body" color="primaryCardText">
                      1Y
                    </Text>
                    <MaterialCommunityIcons name="chart-bell-curve-cumulative" size={24} color="white" />
                  </Pressable>
                </Box>
              </Box>
              <Box flex={1} m={{ phone: 'xs', tablet: 's' }} flexDirection="row" justifyContent="space-between">
                <Box style={styles.viewStats} justifyContent="center" alignItems="center">
                  <Pressable onPress={() => navigateTo3MView(item.primaryGoalType as PrimaryGoalType, item?.secondaryGoalType)}>
                    <Text variant="body" color="primaryCardText">
                      3M
                    </Text>
                    <MaterialCommunityIcons name="chart-bell-curve-cumulative" size={24} color="white" />
                  </Pressable>
                </Box>
                <Box style={styles.viewStats} justifyContent="center" alignItems="center">
                  <Pressable onPress={() => navigateTo1MView(item.primaryGoalType as PrimaryGoalType, item?.secondaryGoalType)}>
                    <Text variant="body" color="primaryCardText">
                      1M
                    </Text>
                    <MaterialCommunityIcons name="chart-bell-curve-cumulative" size={24} color="white" />
                  </Pressable>
                </Box>
                <Box style={styles.viewStats} justifyContent="center" alignItems="center">
                  <Pressable onPress={() => navigateTo1WView(item.primaryGoalType as PrimaryGoalType, item?.secondaryGoalType)}>
                    <Text variant="body" color="primaryCardText">
                      1W
                    </Text>
                    <Ionicons name="ios-stats-chart" size={24} color="white" />
                  </Pressable>
                </Box>
                <Box style={styles.addIcon} justifyContent="center" alignItems="center">
                  <Pressable onPress={() => navigateToAdd(item.primaryGoalType as PrimaryGoalType, item?.secondaryGoalType)}>
                    <Ionicons name="ios-add" size={24} color="white" />
                  </Pressable>
                </Box>
              </Box>
              <Box flex={1} m={{ phone: 'xs', tablet: 's' }} flexDirection="row" justifyContent="flex-end">
                <Box style={styles.offIcon} justifyContent="center" alignItems="center">
                  <Pressable onLongPress={() => updateActivateTypeToInactive(index)}>
                    <AntDesign  name="poweroff" size={24} color="white" />
                  </Pressable>
                </Box>
              </Box>
            </Box>
          </RegularCard>
        )
      case PrimaryGoalType.NEWSKILLTYPE:
        return (
          <RegularCard justifyContent="center" alignItems="center">
            <Box flex={6}>
              <UserViewSkillStats
                sub={sub}
                type={item.secondaryGoalType}
                getRealmApp={getRealmApp}
              />
            </Box>
            <Box style={{ width: '100%' }} flex={4} m={{ phone: 'xs', tablet: 's' }}>
              <Box flex={1} m={{ phone: 'xs', tablet: 's' }} flexDirection="row" justifyContent="space-between">
                {
                  goals?.[index]?.id
                  ? (
                    <Box style={styles.activeGoal} justifyContent="center" alignItems="center">
                      <Pressable onPress={() => openGoalDeleteModal(index)}>
                        <Feather name="target" size={24} color="white" />
                      </Pressable>
                    </Box>
                  )
                  : (
                    <Box style={styles.offGoal} justifyContent="center" alignItems="center">
                      <Pressable onPress={() => navigateToAddGoal(item.primaryGoalType as PrimaryGoalType, index)}>
                        <Feather name="target" size={24} color="white" />
                      </Pressable>
                    </Box>
                  )
                }
                {
                  schedules?.[index]?.id
                  ? (
                    <Box style={styles.activeSchedule} justifyContent="center" alignItems="center">
                      <Pressable onLongPress={() => openScheduleDeleteModal(index)} onPress={() => navigateToAddSchedule(item.primaryGoalType as PrimaryGoalType, index)}>
                        <MaterialIcons name="schedule" size={24} color="white" />
                      </Pressable>
                    </Box>
                  )
                  : (
                    <Box style={styles.offSchedule} justifyContent="center" alignItems="center">
                      <Pressable onPress={() => navigateToAddSchedule(item.primaryGoalType as PrimaryGoalType, index)}>
                        <MaterialIcons name="schedule" size={24} color="white" />
                      </Pressable>
                    </Box>
                  )
                }
                <Box style={styles.viewStats} justifyContent="center" alignItems="center">
                  <Pressable onPress={() => navigateToCalendarView(item.primaryGoalType as PrimaryGoalType, item?.secondaryGoalType)}>
                    <Ionicons name="ios-calendar-outline" size={24} color="white" />
                  </Pressable>
                </Box>
                <Box style={styles.viewStats} justifyContent="center" alignItems="center">
                  <Pressable onPress={() => navigateTo1YView(item.primaryGoalType as PrimaryGoalType, item?.secondaryGoalType)}>
                    <Text variant="body" color="primaryCardText">
                      1Y
                    </Text>
                    <MaterialCommunityIcons name="chart-bell-curve-cumulative" size={24} color="white" />
                  </Pressable>
                </Box>
              </Box>
              <Box flex={1} m={{ phone: 'xs', tablet: 's' }} flexDirection="row" justifyContent="space-between">
                <Box style={styles.viewStats} justifyContent="center" alignItems="center">
                  <Pressable onPress={() => navigateTo3MView(item.primaryGoalType as PrimaryGoalType, item?.secondaryGoalType)}>
                    <Text variant="body" color="primaryCardText">
                      3M
                    </Text>
                    <MaterialCommunityIcons name="chart-bell-curve-cumulative" size={24} color="white" />
                  </Pressable>
                </Box>
                <Box style={styles.viewStats} justifyContent="center" alignItems="center">
                  <Pressable onPress={() => navigateTo1MView(item.primaryGoalType as PrimaryGoalType, item?.secondaryGoalType)}>
                    <Text variant="body" color="primaryCardText">
                      1M
                    </Text>
                    <MaterialCommunityIcons name="chart-bell-curve-cumulative" size={24} color="white" />
                  </Pressable>
                </Box>
                <Box style={styles.viewStats} justifyContent="center" alignItems="center">
                  <Pressable onPress={() => navigateTo1WView(item.primaryGoalType as PrimaryGoalType, item?.secondaryGoalType)}>
                    <Text variant="body" color="primaryCardText">
                      1W
                    </Text>
                    <Ionicons name="ios-stats-chart" size={24} color="white" />
                  </Pressable>
                </Box>
                <Box style={styles.addIcon} justifyContent="center" alignItems="center">
                  <Pressable onPress={() => navigateToAdd(item.primaryGoalType as PrimaryGoalType, item?.secondaryGoalType)}>
                    <Ionicons name="ios-add" size={24} color="white" />
                  </Pressable>
                </Box>
              </Box>
              <Box flex={1} m={{ phone: 'xs', tablet: 's' }} flexDirection="row" justifyContent="flex-end">
                <Box style={styles.offIcon} justifyContent="center" alignItems="center">
                  <Pressable onLongPress={() => updateActivateTypeToInactive(index)}>
                    <AntDesign  name="poweroff" size={24} color="white" />
                  </Pressable>
                </Box>
              </Box>
            </Box>
          </RegularCard>
        )
      case PrimaryGoalType.ROUTINE:
        return (
          <RegularCard justifyContent="center" alignItems="center">
            <Box flex={6}>
              <Box flex={1} justifyContent="flex-start" alignItems="center" my={{ phone: 'm', tablet: 'l' }}>
                <Text variant="optionHeader">
                  {capitalizeFirstLetter(item?.secondaryGoalName)}
                </Text>
                {goals?.[index]?.goal ? (
                  <Text variant="primarySecondaryHeader">
                    {`Your goal: ${goals?.[index]?.goal} ${capitalizeFirstLetter(goals?.[index]?.goalUnit || 'minutes')}`}
                  </Text>
                ) : null}
              </Box>
            </Box>
            <Box style={{ width: '100%' }} flex={4} m={{ phone: 'xs', tablet: 's' }}>
              <Box flex={1} m={{ phone: 'xs', tablet: 's' }} flexDirection="row" justifyContent="space-between">
                {
                  goals?.[index]?.id
                  ? (
                    <Box style={styles.activeGoal} justifyContent="center" alignItems="center">
                      <Pressable onPress={() => openGoalDeleteModal(index)}>
                        <Feather name="target" size={24} color="white" />
                      </Pressable>
                    </Box>
                  )
                  : (
                    <Box style={styles.offGoal} justifyContent="center" alignItems="center">
                      <Pressable onPress={() => navigateToAddGoal(item.primaryGoalType as PrimaryGoalType, index)}>
                        <Feather name="target" size={24} color="white" />
                      </Pressable>
                    </Box>
                  )
                }
                {
                  schedules?.[index]?.id
                  ? (
                    <Box style={styles.activeSchedule} justifyContent="center" alignItems="center">
                      <Pressable onLongPress={() => openScheduleDeleteModal(index)} onPress={() => navigateToAddSchedule(item.primaryGoalType as PrimaryGoalType, index)}>
                        <MaterialIcons name="schedule" size={24} color="white" />
                      </Pressable>
                    </Box>
                  )
                  : (
                    <Box style={styles.offSchedule} justifyContent="center" alignItems="center">
                      <Pressable onPress={() => navigateToAddSchedule(item.primaryGoalType as PrimaryGoalType, index)}>
                        <MaterialIcons name="schedule" size={24} color="white" />
                      </Pressable>
                    </Box>
                  )
                }
                <Box style={styles.viewStats} justifyContent="center" alignItems="center">
                  <Pressable onPress={() => navigateToCalendarView(item.primaryGoalType as PrimaryGoalType, item?.secondaryGoalType)}>
                    <Ionicons name="ios-calendar-outline" size={24} color="white" />
                  </Pressable>
                </Box>
                <Box style={styles.addIcon} justifyContent="center" alignItems="center">
                  <Pressable onPress={() => navigateToAdd(item.primaryGoalType as PrimaryGoalType, item?.routineId)}>
                    <Ionicons name="ios-add" size={24} color="white" />
                  </Pressable>
                </Box>
              </Box>
              <Box flex={1} m={{ phone: 'xs', tablet: 's' }} flexDirection="row" justifyContent="flex-end">
                <Box style={styles.offIcon} justifyContent="center" alignItems="center">
                  <Pressable onLongPress={() => updateActivateTypeToInactive(index)}>
                    <AntDesign  name="poweroff" size={24} color="white" />
                  </Pressable>
                </Box>
              </Box>
            </Box>
          </RegularCard>
        )
    
      case PrimaryGoalType.STEP:
        return (
          <RegularCard justifyContent="center" alignItems="center">
            <Box flex={6}>
              <UserViewStepStats
                sub={sub}
                getRealmApp={getRealmApp}
              />
            </Box>
            <Box>
              {
                (Platform.OS === 'ios')
                ? (
                  <Box my={{ phone: 'xs', tablet: 's' }}>
                    <Text variant="body">
                      Powered by Apple Health
                    </Text>
                  </Box>
                ) : null
              }
            </Box>
            <Box style={{ width: '100%' }} flex={4} m={{ phone: 'xs', tablet: 's' }}>
              <Box flex={1} m={{ phone: 'xs', tablet: 's' }} flexDirection="row" justifyContent="space-between">
                {
                  goals?.[index]?.id
                  ? (
                    <Box style={styles.activeGoal} justifyContent="center" alignItems="center">
                      <Pressable onPress={() => openGoalDeleteModal(index)}>
                        <Feather name="target" size={24} color="white" />
                      </Pressable>
                    </Box>
                  )
                  : (
                    <Box style={styles.offGoal} justifyContent="center" alignItems="center">
                      <Pressable onPress={() => navigateToAddGoal(item.primaryGoalType as PrimaryGoalType, index)}>
                        <Feather name="target" size={24} color="white" />
                      </Pressable>
                    </Box>
                  )
                }
                {
                  schedules?.[index]?.id
                  ? (
                    <Box style={styles.activeSchedule} justifyContent="center" alignItems="center">
                      <Pressable onLongPress={() => openScheduleDeleteModal(index)}  onPress={() => navigateToAddSchedule(item.primaryGoalType as PrimaryGoalType, index)}>
                        <MaterialIcons name="schedule" size={24} color="white" />
                      </Pressable>
                    </Box>
                  )
                  : (
                    <Box style={styles.offSchedule} justifyContent="center" alignItems="center">
                      <Pressable onPress={() => navigateToAddSchedule(item.primaryGoalType as PrimaryGoalType, index)}>
                        <MaterialIcons name="schedule" size={24} color="white" />
                      </Pressable>
                    </Box>
                  )
                }
                <Box style={styles.viewStats} justifyContent="center" alignItems="center">
                  <Pressable onPress={() => navigateToCalendarView(item.primaryGoalType as PrimaryGoalType)}>
                    <Ionicons name="ios-calendar-outline" size={24} color="white" />
                  </Pressable>
                </Box>
                <Box style={styles.viewStats} justifyContent="center" alignItems="center">
                  <Pressable onPress={() => navigateTo1YView(item.primaryGoalType as PrimaryGoalType)}>
                    <Text variant="body" color="primaryCardText">
                      1Y
                    </Text>
                    <MaterialCommunityIcons name="chart-bell-curve-cumulative" size={24} color="white" />
                  </Pressable>
                </Box>
              </Box>
              <Box flex={1} m={{ phone: 'xs', tablet: 's' }} flexDirection="row" justifyContent="space-between">
                <Box style={styles.viewStats} justifyContent="center" alignItems="center">
                  <Pressable onPress={() => navigateTo3MView(item.primaryGoalType as PrimaryGoalType)}>
                    <Text variant="body" color="primaryCardText">
                      3M
                    </Text>
                    <MaterialCommunityIcons name="chart-bell-curve-cumulative" size={24} color="white" />
                  </Pressable>
                </Box>
                <Box style={styles.viewStats} justifyContent="center" alignItems="center">
                  <Pressable onPress={() => navigateTo1MView(item.primaryGoalType as PrimaryGoalType)}>
                    <Text variant="body" color="primaryCardText">
                      1M
                    </Text>
                    <MaterialCommunityIcons name="chart-bell-curve-cumulative" size={24} color="white" />
                  </Pressable>
                </Box>
                <Box style={styles.viewStats} justifyContent="center" alignItems="center">
                  <Pressable onPress={() => navigateTo1WView(item.primaryGoalType as PrimaryGoalType)}>
                    <Text variant="body" color="primaryCardText">
                      1W
                    </Text>
                    <Ionicons name="ios-stats-chart" size={24} color="white" />
                  </Pressable>
                </Box>
                <Box style={styles.addIcon} justifyContent="center" alignItems="center">
                  <Pressable onPress={() => navigateToAdd(item.primaryGoalType as PrimaryGoalType)}>
                    <Ionicons name="ios-add" size={24} color="white" />
                  </Pressable>
                </Box>
              </Box>
              <Box flex={1} m={{ phone: 'xs', tablet: 's' }} flexDirection="row" justifyContent="flex-end">
                <Box style={styles.offIcon} justifyContent="center" alignItems="center">
                  <Pressable onLongPress={() => updateActivateTypeToInactive(index)}>
                    <AntDesign  name="poweroff" size={24} color="white" />
                  </Pressable>
                </Box>
              </Box>
            </Box>
          </RegularCard>
        )
      case PrimaryGoalType.STRENGTH:
        return (
          <RegularCard justifyContent="center" alignItems="center">
            <Box flex={6}>
              <UserViewStrengthStats
                sub={sub}
                type={item.secondaryGoalType}
                getRealmApp={getRealmApp}
              />
            </Box>
            <Box style={{ width: '100%' }} flex={4} m={{ phone: 'xs', tablet: 's' }}>
              <Box flex={1} m={{ phone: 'xs', tablet: 's' }} flexDirection="row" justifyContent="space-between">
                {
                  goalExercises?.[index]?.id
                  ? (
                    <Box style={styles.activeGoal} justifyContent="center" alignItems="center">
                      <Pressable onPress={() => openGoalExerciseDeleteModal(index)}>
                        <Feather name="target" size={24} color="white" />
                      </Pressable>
                    </Box>
                  )
                  : (
                    <Box style={styles.offGoal} justifyContent="center" alignItems="center">
                      <Pressable onPress={() => navigateToAddGoal(item.primaryGoalType as PrimaryGoalType, index)}>
                        <Feather name="target" size={24} color="white" />
                      </Pressable>
                    </Box>
                  )
                }
                {
                  schedules?.[index]?.id
                  ? (
                    <Box style={styles.activeSchedule} justifyContent="center" alignItems="center">
                      <Pressable onLongPress={() => openScheduleDeleteModal(index)} onPress={() => navigateToAddSchedule(item.primaryGoalType as PrimaryGoalType, index)}>
                        <MaterialIcons name="schedule" size={24} color="white" />
                      </Pressable>
                    </Box>
                  )
                  : (
                    <Box style={styles.offSchedule} justifyContent="center" alignItems="center">
                      <Pressable onPress={() => navigateToAddSchedule(item.primaryGoalType as PrimaryGoalType, index)}>
                        <MaterialIcons name="schedule" size={24} color="white" />
                      </Pressable>
                    </Box>
                  )
                }
                <Box style={styles.viewStats} justifyContent="center" alignItems="center">
                  <Pressable onPress={() => navigateToCalendarView(item.primaryGoalType as PrimaryGoalType, item?.secondaryGoalType)}>
                    <Ionicons name="ios-calendar-outline" size={24} color="white" />
                  </Pressable>
                </Box>
                <Box style={styles.viewStats} justifyContent="center" alignItems="center">
                  <Pressable onPress={() => navigateTo1YView(item.primaryGoalType as PrimaryGoalType, item?.secondaryGoalType)}>
                    <Text variant="body" color="primaryCardText">
                      1Y
                    </Text>
                    <MaterialCommunityIcons name="chart-bell-curve-cumulative" size={24} color="white" />
                  </Pressable>
                </Box>
              </Box>
              <Box flex={1} m={{ phone: 'xs', tablet: 's' }} flexDirection="row" justifyContent="space-between">
                <Box style={styles.viewStats} justifyContent="center" alignItems="center">
                  <Pressable onPress={() => navigateTo3MView(item.primaryGoalType as PrimaryGoalType, item?.secondaryGoalType)}>
                    <Text variant="body" color="primaryCardText">
                      3M
                    </Text>
                    <MaterialCommunityIcons name="chart-bell-curve-cumulative" size={24} color="white" />
                  </Pressable>
                </Box>
                <Box style={styles.viewStats} justifyContent="center" alignItems="center">
                  <Pressable onPress={() => navigateTo1MView(item.primaryGoalType as PrimaryGoalType, item?.secondaryGoalType)}>
                    <Text variant="body" color="primaryCardText">
                      1M
                    </Text>
                    <MaterialCommunityIcons name="chart-bell-curve-cumulative" size={24} color="white" />
                  </Pressable>
                </Box>
                <Box style={styles.viewStats} justifyContent="center" alignItems="center">
                  <Pressable onPress={() => navigateTo1WView(item.primaryGoalType as PrimaryGoalType, item?.secondaryGoalType)}>
                    <Text variant="body" color="primaryCardText">
                      1W
                    </Text>
                    <Ionicons name="ios-stats-chart" size={24} color="white" />
                  </Pressable>
                </Box>
                <Box style={styles.addIcon} justifyContent="center" alignItems="center">
                  <Pressable onPress={() => navigateToAdd(item.primaryGoalType as PrimaryGoalType, item?.secondaryGoalType)}>
                    <Ionicons name="ios-add" size={24} color="white" />
                  </Pressable>
                </Box>
              </Box>
              <Box flex={1} m={{ phone: 'xs', tablet: 's' }} flexDirection="row" justifyContent="flex-end">
                <Box style={styles.offIcon} justifyContent="center" alignItems="center">
                  <Pressable onLongPress={() => updateActivateTypeToInactive(index)}>
                    <AntDesign  name="poweroff" size={24} color="white" />
                  </Pressable>
                </Box>
              </Box>
            </Box>
          </RegularCard>
        )
      
      case PrimaryGoalType.WEIGHT:
        return (
          <RegularCard justifyContent="center" alignItems="center">
            <Box flex={6}>
              <UserViewWeightStats
                sub={sub}
                getRealmApp={getRealmApp}
              />
            </Box>
            <Box style={{ width: '100%' }} flex={4} m={{ phone: 'xs', tablet: 's' }}>
              <Box flex={1} m={{ phone: 'xs', tablet: 's' }} flexDirection="row" justifyContent="space-between">
                {
                  goals?.[index]?.id
                  ? (
                    <Box style={styles.activeGoal} justifyContent="center" alignItems="center">
                      <Pressable onPress={() => openGoalDeleteModal(index)}>
                        <Feather name="target" size={24} color="white" />
                      </Pressable>
                    </Box>
                  )
                  : (
                    <Box style={styles.offGoal} justifyContent="center" alignItems="center">
                      <Pressable onPress={() => navigateToAddGoal(item.primaryGoalType as PrimaryGoalType, index)}>
                        <Feather name="target" size={24} color="white" />
                      </Pressable>
                    </Box>
                  )
                }
                {
                  schedules?.[index]?.id
                  ? (
                    <Box style={styles.activeSchedule} justifyContent="center" alignItems="center">
                      <Pressable onLongPress={() => openScheduleDeleteModal(index)}  onPress={() => navigateToAddSchedule(item.primaryGoalType as PrimaryGoalType, index)}>
                        <MaterialIcons name="schedule" size={24} color="white" />
                      </Pressable>
                    </Box>
                  )
                  : (
                    <Box style={styles.offSchedule} justifyContent="center" alignItems="center">
                      <Pressable onPress={() => navigateToAddSchedule(item.primaryGoalType as PrimaryGoalType, index)}>
                        <MaterialIcons name="schedule" size={24} color="white" />
                      </Pressable>
                    </Box>
                  )
                }
                <Box style={styles.viewStats} justifyContent="center" alignItems="center">
                  <Pressable onPress={() => navigateToCalendarView(item.primaryGoalType as PrimaryGoalType, item?.secondaryGoalType)}>
                    <Ionicons name="ios-calendar-outline" size={24} color="white" />
                  </Pressable>
                </Box>
                <Box style={styles.viewStats} justifyContent="center" alignItems="center">
                  <Pressable onPress={() => navigateTo1YView(item.primaryGoalType as PrimaryGoalType, item?.secondaryGoalType)}>
                    <Text variant="body" color="primaryCardText">
                      1Y
                    </Text>
                    <MaterialCommunityIcons name="chart-bell-curve-cumulative" size={24} color="white" />
                  </Pressable>
                </Box>
              </Box>
              <Box flex={1} m={{ phone: 'xs', tablet: 's' }} flexDirection="row" justifyContent="space-between">
                <Box style={styles.viewStats} justifyContent="center" alignItems="center">
                  <Pressable onPress={() => navigateTo3MView(item.primaryGoalType as PrimaryGoalType, item?.secondaryGoalType)}>
                    <Text variant="body" color="primaryCardText">
                      3M
                    </Text>
                    <MaterialCommunityIcons name="chart-bell-curve-cumulative" size={24} color="white" />
                  </Pressable>
                </Box>
                <Box style={styles.viewStats} justifyContent="center" alignItems="center">
                  <Pressable onPress={() => navigateTo1MView(item.primaryGoalType as PrimaryGoalType, item?.secondaryGoalType)}>
                    <Text variant="body" color="primaryCardText">
                      1M
                    </Text>
                    <MaterialCommunityIcons name="chart-bell-curve-cumulative" size={24} color="white" />
                  </Pressable>
                </Box>
                <Box style={styles.viewStats} justifyContent="center" alignItems="center">
                  <Pressable onPress={() => navigateTo1WView(item.primaryGoalType as PrimaryGoalType, item?.secondaryGoalType)}>
                    <Text variant="body" color="primaryCardText">
                      1W
                    </Text>
                    <Ionicons name="ios-stats-chart" size={24} color="white" />
                  </Pressable>
                </Box>
                <Box style={styles.addIcon} justifyContent="center" alignItems="center">
                  <Pressable onPress={() => navigateToAdd(item.primaryGoalType as PrimaryGoalType, item?.secondaryGoalType)}>
                    <Ionicons name="ios-add" size={24} color="white" />
                  </Pressable>
                </Box>
              </Box>
              <Box flex={1} m={{ phone: 'xs', tablet: 's' }} flexDirection="row" justifyContent="flex-end">
                <Box style={styles.offIcon} justifyContent="center" alignItems="center">
                  <Pressable onLongPress={() => updateActivateTypeToInactive(index)}>
                    <AntDesign  name="poweroff" size={24} color="white" />
                  </Pressable>
                </Box>
              </Box>
            </Box>
          </RegularCard>
        )
    }
  }

  return (
    <Box flex={1} justifyContent="center" alignItems="center">
      {
        displayTypes?.length > 0
        ? (
          <FlatList
            data={displayTypes}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            extraData={isUpdate}
          />
        ) : (
          <Text variant="header" style={{ color: dark ? palette.white : palette.darkGray }}>
            No Active Components, Try activating a component to track
          </Text>
        )
      }
      <Modal
        visible={(isGoalDelete > -1)}
        onDismiss={hideGoalDeleteModal}
        animationType="slide"
      >
        <Box flex={1} justifyContent="center" alignItems="center">
          <Box flex={0.5} justifyContent="flex-end" alignItems="center">
            <Text m={{ phone: 'l', tablet: 'xl' }} variant="optionHeader">
              {`Are you sure you want to delete the goal for ${getDataName(displayTypes?.[isGoalDelete]?.primaryGoalType as PrimaryGoalType,
                  displayTypes?.[isGoalDelete]?.secondaryGoalName)}?`}
            </Text>
          </Box>
          <Box flex={0.5} m={{ phone: 's', tablet: 'm' }} justifyContent="flex-start" alignItems="center">
            <Box m={{ phone: 's', tablet: 'm' }}>
              <Button onPress={deleteGoal}>
                Confirm
              </Button>
            </Box>
            <Box m={{ phone: 's', tablet: 'm' }}>
              <Button onPress={hideGoalDeleteModal} primary>
                Cancel
              </Button>
            </Box>
          </Box>
        </Box>
      </Modal>
      <Modal
        visible={(isGoalExerciseDelete > -1)}
        onDismiss={hideGoalExerciseDeleteModal}
        animationType="slide"
      >
        <Box flex={1} justifyContent="center" alignItems="center">
          <Box flex={0.5} justifyContent="flex-end" alignItems="center">
            <Text m={{ phone: 'l', tablet: 'xl' }} variant="optionHeader">
              {`Are you sure you want to delete the goal for ${getDataName(displayTypes?.[isGoalExerciseDelete]?.primaryGoalType as PrimaryGoalType,
                  displayTypes?.[isGoalExerciseDelete]?.secondaryGoalName)}?`}
            </Text>
          </Box>
          <Box flex={0.5} m={{ phone: 's', tablet: 'm' }} justifyContent="flex-start" alignItems="center">
            <Box m={{ phone: 's', tablet: 'm' }}>
              <Button onPress={deleteGoalExercise}>
                Confirm
              </Button>
            </Box>
            <Box m={{ phone: 's', tablet: 'm' }}>
              <Button onPress={hideGoalExerciseDeleteModal} primary>
                Cancel
              </Button>
            </Box>
          </Box>
        </Box>
      </Modal>
      <Modal
        visible={isScheduleDelete > -1}
        onDismiss={hideScheduleDeleteModal}
        animationType="slide"
      >
        <Box flex={1} justifyContent="center" alignItems="center">
          <Box flex={0.5} justifyContent="flex-end" alignItems="center">
            <Text m={{ phone: 'l', tablet: 'xl' }} variant="optionHeader">
              {`Are you sure you want to delete the schedule for ${getDataName(displayTypes?.[isScheduleDelete]?.primaryGoalType as PrimaryGoalType,
                  displayTypes?.[isScheduleDelete]?.secondaryGoalName)}`}
            </Text>
          </Box>
          <Box flex={0.5} m={{ phone: 's', tablet: 'm' }} justifyContent="flex-start" alignItems="center">
            <Box m={{ phone: 's', tablet: 'm' }}>
              <Button onPress={deleteSchedule}>
                Confirm
              </Button>
            </Box>
            <Box m={{ phone: 's', tablet: 'm' }}>
              <Button onPress={hideScheduleDeleteModal} primary>
                Cancel
              </Button>
            </Box>
          </Box>
        </Box>
      </Modal>
    </Box>
  )
}

export default UserProgressActiveComponents
