import React, { useState, useEffect } from 'react'
import {
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
 } from 'react-native'
 import { useHeaderHeight } from '@react-navigation/elements'
import { TextArea, Wizard, TextField } from 'react-native-ui-lib'
import { useNavigation, RouteProp } from '@react-navigation/native'
import { StackActions } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { API, GraphQLResult } from '@aws-amplify/api'
import Toast from 'react-native-toast-message'
import _ from 'lodash'
import {
  Exercise, ExerciseType,
} from '@models'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import RegularCard from '@components/RegularCard'
import Button from '@components/Button'


import ListRoutinesByName from '@graphql/Queries/ListRoutinesByName'
import ListExerciseByName from '@graphql/Queries/ListExerciseByName'
import ListExercises from '@graphql/Queries/ListExercises'


import CreateExerciseRoutine from '@graphql/Mutations/CreateExerciseRoutine'
import CreateRoutine from '@graphql/Mutations/CreateRoutine'
import CreateExercise from '@graphql/Mutations/CreateExercise'

import {
  CreateExerciseRoutineMutation,
  CreateExerciseRoutineMutationVariables,
  CreateExerciseRoutineInput,
  ListRoutinesByNameQuery,
  ListRoutinesByNameQueryVariables,
  CreateRoutineMutation,
  CreateRoutineMutationVariables,
  ListExerciseByNameQuery,
  ListExerciseByNameQueryVariables,
  ListExercisesQuery,
  ListExercisesQueryVariables,
  CreateExerciseMutation,
  CreateExerciseMutationVariables,
} from '@app/API'

import UserCreateRoutineListExercises from './UserCreateRoutineListExercises'
import UserCreateRoutineFinalStep from './UserCreateRoutineFinalStep'



const escapeUnsafe = (unsafe: string) => unsafe
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;')
  .replace(/ /gi, '-')



const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})

type RootStackNavigationParamList = {
UserCreateRoutine: undefined,
UserCreateActivateRoutine: {
  name: string,
  routineId: string,
 },
}


type UserCreateRoutineNavigationProp = StackNavigationProp<
  RootStackNavigationParamList,
  'UserCreateRoutine'
>




type item = 'reps' | 'miles' | 'minutes' | 'kg' | 'lbs'


type SelectExercise = {
  exercise: Exercise
  checked: boolean,
}

type nameProps = {
  name: string | null,
  changeDescription: (newDescription: string) => void,
  description: string | null,
  setName: (text: string) => void,
  renderNextButton: () => JSX.Element,
}

function RoutineName(props: nameProps) {
  const {
    name,
    changeDescription,
    description,
    renderNextButton,
    setName,
  } = props

  const height = useHeaderHeight()

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        keyboardVerticalOffset={height + 64}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <Box flex={1} justifyContent="center" alignItems="center">
          <Box flex={1}  justifyContent="flex-end" alignItems="center">
            <RegularCard>
              <TextField
                onChangeText={setName}
                value={name}
                placeholder="Type name here..."
                style={{ width: '40%'}}
              />
              <TextField
                placeholder="description"
                onChangeText={(text: string) => changeDescription(text)}
                value={description || ''}
                style={{ width: '40%'}}
                multiline
              />
            </RegularCard>
          </Box>
          <Box flex={1} m={{ phone: 's', tablet: 'm' }}>
            <Box flex={1} flexDirection="row" justifyContent="space-between" alignItems="center">
              <Box style={{ width: '45%' }} />
              {renderNextButton()}
            </Box>
          </Box>
        </Box>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  )

}

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}


function UserCreateRoutine() {
  const [name, setName] = useState<string | null>(null)
  const [routineDescription, setRoutineDescription] = useState<string | null>(null)
  const [exercises, setExercises] = useState<SelectExercise[] | []>([])
  const [exerciseToken, setExerciseToken] = useState<string>('')
  const [exerciseByNameToken, setExerciseByNameToken] = useState<string>('')
  const [newExerciseName, setNewExerciseName] = useState<string | null>(null)
  const [type, setType] = useState<ExerciseType | null>(null)
  const [description, setDescription] = useState<string | null>(null)
  const [selectedStat, setSelectedStat] = useState<item | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState<number>(0)
  const [activeIndex, setActiveIndex] = useState<number>(0)
  const [completedStep, setCompletedStep] = useState<number | undefined>()
  const [searchInput, setSearchInput] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<SelectExercise[] | []>([])
  const [isOverlay, setIsOverlay] = useState<boolean>(false)
  const [selectionCount, setSelectionCount] = useState<number>(0)

  const navigation = useNavigation<UserCreateRoutineNavigationProp>()
  const height = useHeaderHeight()

  useEffect(() => {
    const listExercises = async () => {
      try {

        const listExercisesData = await API
          .graphql({
            query: ListExercises,
          }) as GraphQLResult<ListExercisesQuery>

        const exerciseData = listExercisesData?.data?.listExercises?.items

        const newToken = listExercisesData?.data?.listExercises?.nextToken

        if (exerciseData && exerciseData.length > 0) {
          const selectExerciseData: any[] = exerciseData.map(i => ({ exercise: i, checked: false }))

          setExercises(selectExerciseData)
        }

        if (newToken) {
          setExerciseToken(newToken)
        }
      } catch(e) {
        
      }
    }
    listExercises()
  }, [])


 const globalSearch = async (text: string, localSearchResults: SelectExercise[] | []) => {
     try {

       const listExerciseByNameData = await API.
        graphql({
          query: ListExerciseByName,
          variables: {
            nId: 'null',
            name: {
              beginsWith: escapeUnsafe(capitalizeFirstLetter(text)),
            }
          } as ListExerciseByNameQueryVariables,
        }) as GraphQLResult<ListExerciseByNameQuery>

      const exerciseData = listExerciseByNameData?.data?.listExerciseByName?.items



       if (exerciseData && exerciseData.length > 0) {
         const newExerciseData: any[] = exerciseData.map(i => ({ exercise: i, checked: false }))
         const totalSearchResults = [
           ...localSearchResults,
           ...newExerciseData,
         ]

         const newSearchResults = _.uniqWith(totalSearchResults, (i1, i2) => i1.exercise.id === i2.exercise.id)

         setSearchResults(newSearchResults)
       }
     } catch(e) {
       
     }
 }

 const localSearch = (text: string) => {
   if (text === '') {
     return setSearchResults([])
   }
   const newSearchResults = exercises.filter(item => (new RegExp(`${text
     .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i'))
     .test(item.exercise.name))

    return globalSearch(text, newSearchResults)

 }

 const onSelectExercise = (index: number) => {
   
   if (searchResults?.[0]?.exercise) {

     const item: SelectExercise = searchResults[index]

     item.checked = !(item.checked)

     if (item.checked) {
       setSelectionCount(selectionCount + 1)
     } else {
       setSelectionCount(selectionCount - 1)
     }

     const newSearchResults = [
       ...searchResults.slice(0, index),
       item,
       ...searchResults.slice(index + 1)
     ]

     setSearchResults(newSearchResults)

     const itemExercise: SelectExercise | undefined = exercises.find(i => i.exercise.id === item.exercise.id)

     const itemIndex: number | undefined = exercises.findIndex(i => i.exercise.id === item.exercise.id)

     if (itemExercise && itemIndex) {
       itemExercise.checked = !(itemExercise.checked)

       const newExercises = [
         ...exercises.slice(0, itemIndex),
         itemExercise,
         ...exercises.slice(itemIndex + 1)
       ]

       setExercises(newExercises)

     }
   } else {
     const item: SelectExercise = exercises?.[index]

     item.checked = !(item.checked)

     if (item.checked) {
       setSelectionCount(selectionCount + 1)
     } else {
       setSelectionCount(selectionCount - 1)
     }

     const newExercises = [
       ...exercises.slice(0, index),
       item,
       ...exercises.slice(index + 1)
     ]

     

     setExercises(newExercises)
   }
 }

 const onActiveIndexChanged = (index: number) => setActiveIndex(index)

  const addMoreToExerciseList = async () => {
    try {

      if (!exerciseToken) {
        
        return
      }

      const moreExercisesData = await API.
        graphql({
          query: ListExercises,
          variables: {
            nextToken: exerciseToken,
          } as ListExercisesQueryVariables,
        }) as GraphQLResult<ListExercisesQuery>

      const exerciseData = moreExercisesData?.data?.listExercises?.items

      const newExerciseToken = moreExercisesData?.data?.listExercises?.nextToken

      const newExerciseData: any[] = exerciseData.map(i =>  ({ exercise: i, checked: false }))

      const newExercises = [
        ...exercises,
        ...newExerciseData,
      ]

      setExercises(newExercises)

      if (newExerciseToken) {
        setExerciseToken(newExerciseToken)
      }
    } catch(e) {
      
    }
  }

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
    <Box m={{ phone: 's', tablet: 'm' }}>
      <Button onPress={goToPrevStep}>
        Back
      </Button>
    </Box>
  )}

  const goToNextStep = () => {
    const prevActiveIndex = activeIndex
    const prevCompletedStep = completedStep

    if (prevActiveIndex === 2) {
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
    if (activeIndex === 2) {
      return <Box mt={{ phone: 's', tablet: 'm' }}/>
    }

    return (
      <Box m={{ phone: 's', tablet: 'm' }}>
        <Button onPress={goToNextStep}>
          Next
        </Button>
      </Box>
    )
  }

  const checkExerciseAvailability = async (value: string) => {
    try {

      const exerciseObject = await API.
        graphql({
          query: ListExerciseByName,
          variables: {
            name: {
              eq: escapeUnsafe(capitalizeFirstLetter(value)),
            },
            nId: 'null',
          } as ListExerciseByNameQueryVariables
        }) as GraphQLResult<ListExerciseByNameQuery>

        const exerciseData = exerciseObject?.data?.listExerciseByName?.items
      
      if (exerciseData?.[0]?.id) {
        return false
      }
        return true
    } catch(e) {
      
    }
  }

  const checkRoutineAvailibility = async (value: string) => {
    try {

      const routinesByNameData = await API.
        graphql({
          query: ListRoutinesByName,
          variables: {
            nId: 'null',
            name: {
              eq: escapeUnsafe(capitalizeFirstLetter(value)),
            }
          } as ListRoutinesByNameQueryVariables,
        }) as GraphQLResult<ListRoutinesByNameQuery>

        const routineData = routinesByNameData?.data?.listRoutinesByName?.items

      if (routineData?.[0]?.id) {
        return false
      }
      return true
    } catch(e) {
      
    }
  }

  const createExerciseRoutines = async (routine: any) => {
    try {
      
      
      if (exercises?.[0]?.exercise?.id && selectionCount > 0) {
        const exerciseRoutinePromises = (exercises as SelectExercise[])?.map(async (selectExercise) => {
          if (selectExercise.checked) {

            return API.
              graphql({
                query: CreateExerciseRoutine,
                variables: {
                  input: {
                    routineId: routine.id,
                    exerciseId: selectExercise.exercise.id,
                  }  as CreateExerciseRoutineInput,
                } as CreateExerciseRoutineMutationVariables,
              }) as GraphQLResult<CreateExerciseRoutineMutation>
          }
          return
        })

        const results = await Promise.all(exerciseRoutinePromises)

        
        return true
      } else {
        return false
      }

    } catch(e) {
      
    }
  }

  const createExercise = async () => {
    try {
      setError(null)
      if (!type|| !newExerciseName || !description) {
        Toast.show({
              type: 'error',
              text1: `Missing info`,
              text2: `You are missing info`
           })

          return
      }

      const isAvailable = await checkExerciseAvailability(newExerciseName)

      

      if (!isAvailable) {

        Toast.show({
              type: 'error',
              text1: `Not available`,
              text2: `${newExerciseName} is not available`
           });

           setError(`${newExerciseName} is not available`)

          return
      }


    const exerciseData = await API
      .graphql({
        query: CreateExercise,
        variables: {
          input: {
            name: escapeUnsafe(capitalizeFirstLetter(newExerciseName)),
            type,
            description,
            nId: 'null',
          }
        } as CreateExerciseMutationVariables,
      }) as GraphQLResult<CreateExerciseMutation>

    const exercise = exerciseData?.data?.createExercise

    Toast.show({
          type: 'success',
          text1: 'Exercise created',
          text2: `You have created ${newExerciseName} exercise 🙌`
       });

    const newExercises = [
      ...exercises,
      {
        exercise,
        checked: true,
      }
    ]

    setExercises(newExercises as any)
    setIsOverlay(!isOverlay)

    } catch(e) {
      
      Toast.show({
            type: 'error',
            text1: `Something went wrong`,
            text2: `Please try again later`
         });
    }
  }

  const createRoutine = async () => {
    try {
      setError(null)
      if (!name) {
        Toast.show({
              type: 'error',
              text1: `Missing info`,
              text2: `You are missing info`
           });

          return
      }

      if (!(selectionCount > 0)) {
        Toast.show({
              type: 'error',
              text1: `Missing Workout Selection`,
              text2: `Please select exercises for the new workout`
           });

          return
      }

      const isAvailable = await checkRoutineAvailibility(name)

      if (!isAvailable) {
        Toast.show({
              type: 'error',
              text1: `Not available`,
              text2: `${name} is not available`
           });

           setError(`${name} is not available`)

          return
      }




      const createRoutineData = await API.
        graphql({
          query: CreateRoutine,
          variables: {
            input: {
              name: escapeUnsafe(capitalizeFirstLetter(name)),
              description: routineDescription || '',
              nId: 'null',
            }
          } as CreateRoutineMutationVariables,
        }) as GraphQLResult<CreateRoutineMutation>

      const routine = createRoutineData?.data?.createRoutine

      const results = await createExerciseRoutines(routine)

      if (!results) {
        
        return
      }

      Toast.show({
            type: 'success',
            text1: 'Workout Created',
            text2: `You have created ${name} workout 🙌`
         })

      navigation.navigate('UserCreateActivateRoutine', { name, routineId: routine.id })

    } catch(e) {
      
    }
  }

  const renderCreateRoutineButton = () => {
    if (selectionCount > 0) {
      return (
        <Box m={{ phone: 's', tablet: 'm' }}>
          <Button onPress={createRoutine}>
            Create
          </Button>
        </Box>
      )
    }

    return (
      <Box>
        <Text variant="subheader">
          You forgot to select exercises for Workout
        </Text>
      </Box>
    )
  }

  const openOverlay = () => setIsOverlay(true)

  const toggleOverlay = () => setIsOverlay(!isOverlay)


  const searchInputChanged = (text: string) => {
    localSearch(text)
    setSearchInput(text)
  }

  const onCancelSearch = () => {
    localSearch('')
    setSearchInput('')
  }

  const onClearSearch = () => setSearchInput('')

  const onDescriptionChange = (text: string) => setDescription(text)

  const onExerciseType = (newType: ExerciseType) => setType(newType)

  const onSelectedStat = (newSelectedStat: item) => setSelectedStat(newSelectedStat)

  const onNewExerciseName = (text: string) => setNewExerciseName(text)

  const onRoutineDescriptionChange = (text: string) => setRoutineDescription(text)

  const renderCurrentStep = () => {
    switch(activeIndex) {
      case 0:
        return (
          <RoutineName
            name={name}
            setName={setName}
            changeDescription={onRoutineDescriptionChange}
            description={description}
            renderNextButton={renderNextButton}
          />
        )

      case 1:
        return (
          <UserCreateRoutineListExercises
            searchInputChanged={searchInputChanged}
            openOverlay={openOverlay}
            isOverlay={isOverlay}
            exercises={exercises}
            searchResults={searchResults}
            onNewExerciseName={onNewExerciseName}
            error={error}
            searchInput={searchInput}
            onCancelSearch={onCancelSearch}
            onClearSearch={onClearSearch}
            onSelectExercise={onSelectExercise}
            toggleOverlay={toggleOverlay}
            newExerciseName={newExerciseName}
            description={description}
            selectedStat={selectedStat}
            onExerciseType={onExerciseType}
            onSelectedStat={onSelectedStat}
            onDescriptionChange={onDescriptionChange}
            createExercise={createExercise}
            addMoreToExerciseList={addMoreToExerciseList}
            renderPrevButton={renderPrevButton}
            renderNextButton={renderNextButton}
          />
        )
      case 2:
        return (
          <UserCreateRoutineFinalStep
            renderCreateRoutineButton={renderCreateRoutineButton}
            name={name}
            renderPrevButton={renderPrevButton}
          />
        )
      default:
        return (
          <Box justifyContent="center" alignItems="center">
            <RegularCard>
              <Text variant="header">
                Oops... something went wrong
              </Text>
            </RegularCard>
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
        <Wizard.Step state={getStepState(0)} label={'Type Workout Name'}/>
        <Wizard.Step state={getStepState(1)} label={'Select Exercises for Workout'}/>
        <Wizard.Step state={getStepState(2)} label={'Create Workout'}/>
      </Wizard>
      {renderCurrentStep()}
    </Box>
  )


}

export default UserCreateRoutine
