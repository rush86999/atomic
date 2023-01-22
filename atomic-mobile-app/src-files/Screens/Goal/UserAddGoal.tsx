import React, { useState, useEffect, useRef } from 'react'
import { useColorScheme } from 'react-native'
import DatePicker from 'react-native-date-picker'
import { TextField, Colors, Wizard } from 'react-native-ui-lib'
import {Picker} from '@react-native-picker/picker'
import { useNavigation, RouteProp, StackActions } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { DataStore, SortDirection } from '@aws-amplify/datastore'
import { dayjs, RNLocalize } from '@app/date-utils'
import utc from 'dayjs/plugin/utc'
import {
    Keyboard,
    TouchableWithoutFeedback,
} from 'react-native'
import Toast from 'react-native-toast-message'

import { v4 as uuid } from 'uuid'
import {
  User,
  PrimaryGoalType,
  Goal,
  GoalExercise,
  Status,
  ExerciseGoalPreference,
} from '@models'

import Box from '@components/common/Box'
import Text from '@components/common/Text'
import Button from '@components/Button'
import RegularCard from '@components/RegularCard'

import { palette } from '@theme/theme'

import dropDown from '@assets/icons/chevronDown.png'
import { ApolloClient, NormalizedCacheObject } from '@apollo/client'


const escapeUnsafe = (unsafe: string) => unsafe
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;')
  .replace(/ /gi, '-')

type RootNavigationStackParamList = {
  UserProgressActiveComponents: {
    isUpdate?: string,
  },
  UserAddGoal: undefined,
}

type UserAddGoalNavigationProp = StackNavigationProp<
  RootNavigationStackParamList,
  'UserAddGoal'
>

type unitType = 'freeStyle' | 'picker' | 'fixed'

type dataType = 'secondaryGoalName' | 'null' | 'secondaryExerciseName'

type RootRouteStackParamList = {
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
  RootRouteStackParamList,
  'UserAddGoal'>

type Props = {
  sub: string,
  route: UserAddGoalRouteProp,
  client: ApolloClient<NormalizedCacheObject>,
}

const getGoalUnit = (type: PrimaryGoalType) => {
  switch(type) {

    case PrimaryGoalType.MEDITATION:
      return 'minutes'
    case PrimaryGoalType.ROUTINE:
      return 'minutes'
  
    case PrimaryGoalType.STEP:
      return 'steps'
 
    case PrimaryGoalType.TODO:
      return 'count'

    case PrimaryGoalType.WEIGHT:
      return 'lbs'
    default:
      return 'minutes'
  }
}

// const isUnit = [
//   PrimaryGoalType.HABITTYPE,
//   PrimaryGoalType.LIMITTYPE,
//   PrimaryGoalType.NEWSKILLTYPE,
// ]

const goalPreference = {
  'reps': ExerciseGoalPreference.REPS,
  'miles': ExerciseGoalPreference.DISTANCE,
  'kg': ExerciseGoalPreference.WEIGHT,
  'minutes': ExerciseGoalPreference.MINUTES,
}

type item = 'reps' | 'miles' | 'kg' | 'minutes'

// function capitalizeFirstLetter(string: string) {
//   return string.charAt(0).toUpperCase() + string.slice(1);
// }



function UserAddGoal(props: Props) {
  const [goal, setGoal] = useState<Goal>()
  const [goalExercise, setGoalExercise] = useState<GoalExercise>()
  const [endDate, setEndDate] = useState<Date>(new Date())
  const [goalValue, setGoalValue] = useState<string>('')
  const [selectedUnit, setSelectedUnit] = useState<item>('minutes')
  const [userId, setUserId] = useState<string>('')
  const [activeIndex, setActiveIndex] = useState<number>(0)
  const [completedStep, setCompletedStep] = useState<number | undefined>()

  const userIdEl = useRef<string>(null)

  const dark = useColorScheme() === 'dark'
  


  const sub = props?.sub
  const primaryGoalType = props?.route?.params?.primaryGoalType
  const secondaryGoalName = props?.route?.params?.secondaryGoalName
  const scheduleId = props?.route?.params?.scheduleId
  const unitType = props?.route?.params?.unitType
  const goalUnit = props?.route?.params?.goalUnit
  const dataType = props?.route?.params?.dataType
  
  const [unit, setUnit] = useState<string>(goalUnit || '')

  const navigation = useNavigation<UserAddGoalNavigationProp>()

  // get userId
  useEffect(() => {
    (async () => {
      try {
        if (!sub) {
          return
        }
        const userData = await DataStore.query(User, c => c.sub('eq', sub), {
          page: 0,
          limit: 1,
        })

        if (userData?.length > 0) {
          const [user] = userData
          setUserId(user.id)
          userIdEl.current = user.id
        }
      } catch(e) {
        
      }
    })()
  }, [sub])

  // get Goal
  useEffect(() => {
    const getGoal = async (userId1: string) => {
      try {
        
        if (!userId1) {
          
          return
        }

        const goals = await DataStore.query(Goal, c => c.userId('eq', userId1)
          .date('beginsWith', dayjs().format('YYYY'))
          .status('eq', Status.ACTIVE)
          .primaryGoalType('eq', primaryGoalType)
          .secondaryGoalType('eq', escapeUnsafe(secondaryGoalName)), {
            page: 0,
            limit: 100,
            sort: s => s.date(SortDirection.DESCENDING),
          })

        const goals1 = await DataStore.query(
          Goal,
          c => c.userId('eq', userId1)
            .date('beginsWith', dayjs().subtract(1, 'y').format('YYYY'))
            .status('eq', Status.ACTIVE)
            .primaryGoalType('eq', primaryGoalType)
            .secondaryGoalType('eq', escapeUnsafe(secondaryGoalName)),
            {
              page: 0,
              limit: 100,
              sort: s => s.date(SortDirection.DESCENDING),
            },
          )

        

        if (goals?.[0]?.id) {
          setGoal(goals[0])
          setGoalValue(goals[0]?.goal)
          setUnit(goals[0]?.goalUnit)
          setEndDate(dayjs(goals[0]?.endDate).toDate())
        } else if (goals1?.[0]?.id) {
          setGoal(goals1[0])
          setGoalValue(goals1[0]?.goal)
          setUnit(goals1[0]?.goalUnit)
          setEndDate(dayjs(goals1[0]?.endDate).toDate())
        }
      } catch (e) {
        
      }
    }
    if (userIdEl?.current && (dataType !== 'secondaryExerciseName')) {
      getGoal(userIdEl?.current);
    }
  }, [userId])

  // get Goal Exercise
  useEffect(() => {
    const getGoalExercise = async (userId1: string) => {
      try {

        const goals = await DataStore.query(GoalExercise,
          c => c.userId('eq', userId1)
        .date('beginsWith', dayjs().format('YYYY'))
        .status('eq', Status.ACTIVE)
        .primaryGoalType('eq', primaryGoalType)
        .secondaryGoalType('eq', escapeUnsafe(secondaryGoalName)), {
          page: 0,
          limit: 100,
          sort: s => s.date(SortDirection.DESCENDING),
        })

        const goals1 = await DataStore.query(
          GoalExercise,
          c => c.userId('eq', userId1)
            .date('beginsWith', dayjs().subtract(1, 'y').format('YYYY'))
            .status('eq', Status.ACTIVE)
            .primaryGoalType('eq', primaryGoalType)
            .secondaryGoalType('eq', escapeUnsafe(secondaryGoalName)),
            {
              page: 0,
              limit: 100,
              sort: s => s.date(SortDirection.DESCENDING),
            },
          )

        

        if (goals && goals.length > 0) {
          setGoalExercise(goals[0])
          setGoalValue(goals[0]?.goal)
          setUnit(goals[0]?.goalUnit)
          setEndDate(dayjs(goals[0]?.endDate).toDate())
        } else if (goals1 && goals1.length > 0) {
          setGoalExercise(goals1[0])
          setGoalValue(goals1[0]?.goal)
          setUnit(goals1[0]?.goalUnit)
          setEndDate(dayjs(goals1[0]?.endDate).toDate())
        }
      } catch (e) {
        
      }
    }
    if (userIdEl?.current && (dataType === 'secondaryExerciseName')) {
      getGoalExercise(userIdEl?.current);
    }
  }, [userId])

  const onEndDateChange = (date: Date) => (setEndDate(date))

  const onGoalUnitChange = (text: string) => {
    setUnit(text)
  }

  const createGoal = async (scheduleId?: string | null) => {
    try {
      if (!goalValue) {
        Toast.show({
          type: 'error',
          text1: 'Missing Info',
          text2: 'You will need to select a goal value'
        })
        return
      }
      /** verify end date */
      if (!endDate) {
        Toast.show({
          type: 'error',
          text1: 'Missing Info',
          text2: 'You will need to select an end date for your goal'
        })
        return
      }

      switch(dataType) {
        case 'secondaryExerciseName':
          const newGoal = new GoalExercise({
            userId: userIdEl?.current,
            date: dayjs().format(),
            status: Status.ACTIVE,
            endDate: dayjs(endDate).format(),
            primaryGoalType,
            secondaryGoalType: escapeUnsafe(secondaryGoalName),
            scheduleId: scheduleId || undefined,
            goal: goalValue,
            goalUnit: goalPreference[selectedUnit],
            ttl: dayjs().add(3, 'y').unix(),
          })

          await DataStore.save(newGoal)
          Toast.show({
                type: 'success',
                text1: 'Goal activated',
                text2: `Your goal is ${goalValue} ${selectedUnit} 🙌`
          })
          break
        case 'null':
          const newGoal1 = new Goal({
            userId: userIdEl?.current,
            date: dayjs().format(),
            status: Status.ACTIVE,
            endDate: dayjs(endDate).format(),
            primaryGoalType,
            secondaryGoalType: 'null',
            scheduleId: scheduleId || undefined,
            goal: goalValue,
            goalUnit: unit || 'minutes',
            ttl: dayjs().add(3, 'y').unix(),
          })

          const createdNewGoal = await DataStore.save(newGoal1)
          
          Toast.show({
                type: 'success',
                text1: 'Goal activated',
                text2: `Your goal is ${goalValue} ${unit} 🙌`
          })
          break
        case 'secondaryGoalName':
          const newGoal2 = new Goal({
            userId: userIdEl?.current,
            date: dayjs().format(),
            status: Status.ACTIVE,
            endDate: dayjs(endDate).format(),
            primaryGoalType,
            secondaryGoalType: escapeUnsafe(secondaryGoalName),
            scheduleId: scheduleId || undefined,
            goal: goalValue,
            goalUnit: unit || 'minutes',
            ttl: dayjs().add(3, 'y').unix(),
          })

          await DataStore.save(newGoal2)
          Toast.show({
                type: 'success',
                text1: 'Goal activated',
                text2: `Your goal is ${goalValue} ${unit} 🙌`
          })
          break
      }

       navigation.navigate('UserProgressActiveComponents', { isUpdate: uuid() })

    } catch(e) {
      
      Toast.show({
        type: 'error',
        text1: 'Oops...',
        text2: 'Something went wrong'
      })
    }
  }

  const updateGoal = async (scheduleId?: string | null): Promise<null | undefined> => {
    try {
      if (!goalValue) {
        Toast.show({
          type: 'error',
          text1: 'Missing Info',
          text2: 'You will need to select a goal value'
        })
        
        return
      }
      /** verify end date */
      if (!endDate) {
        Toast.show({
          type: 'error',
          text1: 'Missing Info',
          text2: 'You will need to select an end date for your goal'
        })
        
        return
        }
      if ((dataType === 'null') || (dataType === 'secondaryGoalName')) {
        if (!(goal?.id)) {
          Toast.show({
            type: 'error',
            text1: 'Oops...',
            text2: 'Something went wrong with updating your goal'
          })
          
          return
        }
      }

      if (dataType === 'secondaryExerciseName') {
        if (!(goalExercise?.id)) {
          Toast.show({
            type: 'error',
            text1: 'Oops...',
            text2: 'Something went wrong with updating your goal'
          })
          
          return
        }
      }


      if ((dataType === 'null') || (dataType === 'secondaryGoalName')) {
        const updatedGoal = await DataStore.save(
          Goal.copyOf(
            goal, updated => {
              if (endDate) {
                updated.endDate = dayjs(endDate).format()
              }

              if ((scheduleId !== undefined) && (goal?.scheduleId !== scheduleId)) {
                updated.scheduleId = scheduleId
              }

              if ((goalValue !== undefined) && (goal?.goal !== goalValue)) {
                updated.goal = goalValue
              }

              if ((unit !== undefined) && (goal?.goalUnit !== unit)) {
                updated.goalUnit = unit
              }
            }
          )
        )

        

        Toast.show({
              type: 'success',
              text1: 'Goal updated',
              text2: `Your goal is ${goalValue} ${unit} 🙌`
        })
      } else if (dataType === 'secondaryExerciseName') {
        const updateGoalExercise = await DataStore.save(
          GoalExercise.copyOf(
            goalExercise, updated => {
              if (dayjs(endDate).isValid()) {
                updated.endDate = dayjs(endDate).format()
              }

              if ((scheduleId !== undefined) && (goal?.scheduleId !== scheduleId)) {
                updated.scheduleId = scheduleId
              }

              if ((goalValue !== undefined) && (goal?.goal !== goalValue)) {
                updated.goal = goalValue
              }

              if (goalPreference?.[selectedUnit] && (goal?.goalUnit !== goalPreference?.[selectedUnit])) {
                updated.goalUnit = goalPreference?.[selectedUnit]
              }
            }
          )
        )

        

        Toast.show({
              type: 'success',
              text1: 'Goal updated',
              text2: `Your goal is ${goalValue} ${selectedUnit} 🙌`
        })
      }

       /** pop once */
       // const popAction = StackActions.pop(1)

       // navigation.dispatch(popAction)
       navigation.navigate('UserProgressActiveComponents', { isUpdate: uuid() })

    } catch(e) {
      
      Toast.show({
        type: 'error',
        text1: 'Oops...',
        text2: 'Something went wrong'
      })
    }
  }

  const onSubmit = async () => {
    try {
      if (dataType === 'null' || dataType === 'secondaryGoalName') {
        if (!(goal?.id)) {
          await createGoal(scheduleId)
        } else {
          await updateGoal(scheduleId)
        }
      } else if (dataType === 'secondaryExerciseName') {
        if (!(goalExercise?.id)) {
          await createGoal(scheduleId)
        } else {
          await updateGoal(scheduleId)
        }
      }
    } catch(e) {
      // 
    }
  }

  const onCancel = () => {
    /** pop once */
    // const popAction = StackActions.pop(1)

    // navigation.dispatch(popAction)
    navigation.navigate('UserProgressActiveComponents', { isUpdate: uuid() })
  }

  const onActiveIndexChanged = (index: number) => setActiveIndex(index)

  const goToPrevStep = () => {
    const prevActiveIndex = activeIndex

    const newActiveIndex = prevActiveIndex === 0 ? 0 : prevActiveIndex - 1
    setActiveIndex(newActiveIndex)
  }

  const renderPrevButton = () => {
    if (activeIndex === 0) {
      return <Box mt={{ phone: 's', tablet: 'm' }}/>
    }

    return (
    <Box mt={{ phone: 's', tablet: 'm' }}>
      <Button onPress={goToPrevStep}>
        Back
      </Button>
    </Box>
  )}

  const goToNextStep = () => {
    const prevActiveIndex = activeIndex
    const prevCompletedStep = completedStep

    if (prevActiveIndex === 1) {
      return
    }

    const newActiveIndex = prevActiveIndex + 1

    if (!prevCompletedStep || (prevCompletedStep < prevActiveIndex)) {
      const newCompletedStep = prevActiveIndex
      setCompletedStep(newCompletedStep)
    }

    if (newActiveIndex !== prevActiveIndex) {
      setActiveIndex(newActiveIndex)
    }
  }

  const renderNextButton = () => {
    return (
      <Box mt={{ phone: 's', tablet: 'm' }}>
        <Button onPress={goToNextStep}>
          Next
        </Button>
      </Box>
    )
  }

  const renderCurrentStep = () => {
    switch(activeIndex) {
      case 0:
        return (
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
              <Box flex={0.5} alignItems="center" justifyContent="center">
                <Text variant="header" mt={{ phone: 's', tablet: 'm' }}>
                  Set a Goal?
                </Text>
              </Box>
              <Box flex={0.5} alignItems="center" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }}>
                <TextField
                  type="numeric"
                  onChangeText={(text: string) => setGoalValue(text.replace(/[^0-9.]/g, ''))}
                  value={goalValue}
                  placeholder="20"
                  style={{ width: '15%' }}
                />
              </Box>
              <Box flex={1} style={{ width: '100%' }} alignItems="center" justifyContent="flex-start">
                {
                  renderUnit(unitType)
                }
              </Box>
              <Box style={{ width: '100%' }} flex={1} p={{ phone: 's', tablet: 'm' }} m={{ phone: 's', tablet: 'm' }} flexDirection="row" justifyContent="space-between" alignItems="center">
                <Box />
                {renderNextButton()}
              </Box>
            </Box>
          </TouchableWithoutFeedback>
        )

      case 1:
        return (
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <Box flex={1} alignItems="center" justifyContent="center">
              <Box style={{ width: '100%'}} mt={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
                <Text variant="subheader">
                  Select an End Date
                </Text>
                <DatePicker
                  date={endDate}
                  onDateChange={onEndDateChange}
                  theme={dark ? 'dark' : 'light'}
                />
              </Box>
              <Box justifyContent="center" alignItems="center">
                <Box mt={{ phone: 's', tablet: 'm' }}>
                  <Button onPress={onSubmit}>
                    Submit Goal
                  </Button>
                </Box>
                <Box mt={{ phone: 's', tablet: 'm' }}>
                  <Button onPress={onCancel} primary>
                    Cancel
                  </Button>
                </Box>
              </Box>
              <Box p={{ phone: 's', tablet: 'm' }} m={{ phone: 's', tablet: 'm' }} flexDirection="row" justifyContent="flex-start" width="100%">
                {renderPrevButton()}
              </Box>
            </Box>
          </TouchableWithoutFeedback>
        )
    }
  }

  const renderUnit = (type: unitType) => {
    switch(type) {
      case 'freeStyle':
        return (
          <Text variant="optionHeader">
            {goalUnit}
          </Text>
        )
      case 'fixed':
        return (
          <Text variant="optionHeader">
            {getGoalUnit(primaryGoalType)}
          </Text>
        )
      case 'picker':
        return (
          <Box flex={1} style={{ width: '100%' }} justifyContent="flex-start" alignItems="center">
            {
              primaryGoalType === PrimaryGoalType.ENDURANCE
              ? (
                <Picker
                  selectedValue={selectedUnit}
                  onValueChange={setSelectedUnit}
                  style={{ height: 100, width: '50%', color: dark ? palette.white : palette.textBlack }}
                >
                    <Picker.Item color={dark ? palette.white : palette.textBlack}  key="reps" value="reps" label="reps" />
                    <Picker.Item color={dark ? palette.white : palette.textBlack}  key="miles" value="miles" label="miles" />
                    <Picker.Item color={dark ? palette.white : palette.textBlack}  key="minutes" value="minutes" label="minutes" />
                </Picker>
              ) : (
                <Picker
                  selectedValue={selectedUnit}
                  onValueChange={setSelectedUnit}
                  style={{ height: 100, width: '50%', color: dark ? palette.white : palette.textBlack }}
                >
                    <Picker.Item color={dark ? palette.white : palette.textBlack} key="kg" value="kg" label="kg" />
                    <Picker.Item color={dark ? palette.white : palette.textBlack} key="lbs" value="lbs" label="lbs" />
                    <Picker.Item color={dark ? palette.white : palette.textBlack} key="reps" value="reps" label="reps" />
                </Picker>
              )
            }
          </Box>
      )
    }
  }

  const getStepState = (index: number) => {
    let state = Wizard.States.DISABLED
    if (completedStep && (completedStep >= index)) {
      state = Wizard.States.COMPLETED;
    } else if (activeIndex === index || (completedStep && (completedStep < index))
              || (completedStep === undefined)) {
        state = Wizard.States.ENABLED;
    }

    return state
  }

  return (
    <Box flex={1} justifyContent="center" alignItems="center">
      <Wizard testID={'uilib.wizard'} activeIndex={activeIndex} onActiveIndexChanged={onActiveIndexChanged}>
        <Wizard.Step state={getStepState(0)} label={'Set a Goal'}/>
        <Wizard.Step state={getStepState(1)} label={'Select an End Date'}/>
      </Wizard>
      {renderCurrentStep()}
    </Box>
  )
}

export default UserAddGoal
