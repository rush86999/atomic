import React, { useState } from 'react'
import {
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  useColorScheme,
 } from 'react-native'
import { TextField } from 'react-native-ui-lib'
import { useHeaderHeight } from '@react-navigation/elements'
import {Picker} from '@react-native-picker/picker'
import { useNavigation } from '@react-navigation/native'

import { StackNavigationProp } from '@react-navigation/stack'

import { GraphQLResult, API } from '@aws-amplify/api'

import Toast from 'react-native-toast-message'

import {
  ExerciseType, PrimaryGoalType,
} from '@models'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import RegularCard from '@components/RegularCard'

import Button from '@components/Button'
import { palette } from '@theme/theme'

import CreateExercise from '@graphql/Mutations/CreateExercise'

import ListExerciseByName from '@graphql/Queries/ListExerciseByName'

import {
  CreateExerciseMutation,
  CreateExerciseMutationVariables,
  ListExerciseByNameQuery,
  ListExerciseByNameQueryVariables,
} from '@app/API'


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})

type RootStackNavigationParamList = {
UserCreateSpecificExercise: undefined,
UserCreateActivateSpecificExercise: {
  name: string,
  goalType: PrimaryGoalType,
  exerciseId: string,
 },
};

type UserCreateSpecificExerciseNavigationProp = StackNavigationProp<
  RootStackNavigationParamList,
  'UserCreateSpecificExercise'
>

const escapeUnsafe = (unsafe: string) => unsafe
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;')
  .replace(/ /gi, '-')

const exerciseType = {
  'reps': ExerciseType.REPS,
  'minutes': ExerciseType.MINUTES,
  'miles': ExerciseType.DISTANCE,
  'kg': ExerciseType.KILOS,
  'lbs': ExerciseType.POUNDS,
}

const primaryGoalType = {
  'reps': PrimaryGoalType.ENDURANCE,
  'minutes': PrimaryGoalType.ENDURANCE,
  'miles': PrimaryGoalType.ENDURANCE,
  'kg': PrimaryGoalType.STRENGTH,
  'lbs': PrimaryGoalType.STRENGTH,
}

type item = 'reps' | 'miles' | 'minutes' | 'kg' | 'lbs'

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function UserCreateSpecificExercise() {
  const [name, setName] = useState<string>()

  const [description, setDescription] = useState<string | null>(null)
  const [selectedStat, setSelectedStat] = useState<item>('reps')
  const [type, setType] = useState<ExerciseType>(exerciseType?.[selectedStat])

  const navigation = useNavigation<UserCreateSpecificExerciseNavigationProp>()
  const height = useHeaderHeight()

  const dark = useColorScheme() === 'dark'


  /** check if available */
  const checkIfAvailable = async (value: string) => {
    try {

      const listExerciseData = await API
        .graphql({
          query: ListExerciseByName,
          variables: {
            name: {
              eq: escapeUnsafe(capitalizeFirstLetter(value)),
            },
            nId: 'null',
          } as ListExerciseByNameQueryVariables,
        }) as GraphQLResult<ListExerciseByNameQuery>

        const exerciseData = listExerciseData?.data?.listExerciseByName?.items

      if (exerciseData && exerciseData.length > 0) {
        // setAvailable(true)
        return false
      } else {
        // setAvailable(false)
        return true
      }
    } catch(e) {
      
    }
  }

  // test pattern
  const testDescription = (text: string) => /^(\d\.\)(\s\S+)+\.?)(\r{2})?\n+/gmi.test(text)

  /** create new exercise */
  const createExercise = async () => {
    try {
      
      // setError(null)
      if (!type || !name) {
        Toast.show({
              type: 'error',
              text1: `Missing info`,
              text2: `You are missing info`
           })

          return
      }

      const isAvailable = await checkIfAvailable(name)

      if (!isAvailable) {

        Toast.show({
              type: 'error',
              text1: `Not available`,
              text2: `${name} is not available. Please go back and try another or select existing exercise from list`
           })

           // setError(`${name} is not available`)

          return
      }

      if (description?.length > 0) {
        // test for pattern
        const result = testDescription(description)

        if (!result) {
          Toast.show({
            type: 'error',
            text1: `Wrong Pattern`,
            text2: `Description should follow 1.) ...<Enter>2.) ...`
          })
          return
        }
      }



      const exerciseData = await API
        .graphql({
          query: CreateExercise,
          variables: {
            input: {
              name: escapeUnsafe(capitalizeFirstLetter(name)),
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
            text2: `You have created ${exercise?.name} exercise 🙌`
         });

      // const popAction = StackActions.pop(1);
      //
      // navigation.dispatch(popAction);

      if (primaryGoalType[selectedStat] as PrimaryGoalType) {
        navigation.navigate(
          'UserCreateActivateSpecificExercise', {
            name,
            goalType: primaryGoalType[selectedStat] as PrimaryGoalType,
            exerciseId: exercise.id,
          }
        )
      }
    } catch(e) {
      
      Toast.show({
            type: 'error',
            text1: `Something went wrong`,
            text2: `Please try again later`
         });
    }
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        keyboardVerticalOffset={height + 64}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <Box flex={1} justifyContent="center" alignItems="center">
          <Box flex={0.2} my={{ phone: 's', tablet: 'm' }}>
            <Box flex={1} my={{ phone: 's', tablet: 'm' }}>
              {name ? (
                <Text variant="subheader">
                  {`${capitalizeFirstLetter(name)}`}
                </Text>
              ) : (
                <Text variant="subheader">
                  {`Exercise`}
                </Text>
              )}
            </Box>
          </Box>
          <Box flex={2} justifyContent="center" alignItems="center">
            <RegularCard my={{ phone: 's', tablet: 'm' }}>
              <Box my={{ phone: 'm', tablet: 'l' }}>
                <TextField
                  onChangeText={setName}
                  value={name}
                  placeholder="Type name here..."
                  style={{ width: '40%'}}
                />
                <TextField
                  title="Description"
                  placeholder="Please follow the format 1.) <Space> ... <Enter> <Enter> 2.) <Space> ... <Enter> <Enter>"
                  style={{ width: '60%'}}
                  onChangeText={(text: string) => setDescription(text)}
                  value={description}
                  multiline
                />
              </Box>
              <Box>
                <Text variant="optionHeader">
                  {"Pick a measure type"}
                </Text>
                <Picker
                  selectedValue={selectedStat}
                  onValueChange={(newSelectedStat: item) => {
                    
                    setType(exerciseType?.[newSelectedStat]);
                    setSelectedStat(newSelectedStat);
                    
                  }}
                  style={{ color: dark ? palette.white : palette.textBlack}}
                >
                  <Picker.Item color={dark ? palette.white : palette.textBlack} key="reps" value="reps" label="reps" />
                  <Picker.Item color={dark ? palette.white : palette.textBlack} key="miles" value="miles" label="miles" />
                  <Picker.Item color={dark ? palette.white : palette.textBlack} key="minutes" value="minutes" label="minutes" />
                  <Picker.Item color={dark ? palette.white : palette.textBlack} key="kg" value="kg" label="kg" />
                  <Picker.Item color={dark ? palette.white : palette.textBlack} key="lbs" value="lbs" label="lbs" />
                </Picker>
              </Box>
              <Box my={{ phone: 's', tablet: 'm' }}>
                <Button onPress={createExercise}>
                  Create
                </Button>
              </Box>
            </RegularCard>
          </Box>
        </Box>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  )
}

export default UserCreateSpecificExercise
