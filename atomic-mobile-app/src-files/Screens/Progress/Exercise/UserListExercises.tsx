import React, { useState, useEffect } from 'react'
import {
  StyleSheet,
  Platform,
  FlatList,
  SafeAreaView,
 } from 'react-native'
import { SearchBar, FAB } from 'react-native-elements/src'

import { GraphQLResult, API } from '@aws-amplify/api'

import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'

import Box from '@components/common/Box'
import Text from '@components/common/Text'
import Button from '@components/Button'
import LightRegularCard from '@components/LightRegularCard'

import {
  PrimaryGoalType,
  ExerciseType,
} from '@models'
import ListExerciseByName from '@graphql/Queries/ListExerciseByName'
import ListExercises from '@graphql/Queries/ListExercises'

import {
  ListExerciseByNameQuery,
  ListExerciseByNameQueryVariables,
  ListExercisesQuery,
  ListExercisesQueryVariables,
} from '@app/API'

type RootNavigationStackParamList = {
  UserCreateActivateSpecificExercise: {
    name: string,
    goalType: PrimaryGoalType,
    exerciseId: string,
  },
  UserCreateSpecificExercise: undefined,
  UserListExercises: undefined,
}

type UserListExercisesNavigationProp = StackNavigationProp<
  RootNavigationStackParamList,
  'UserListExercises'
>

const styles = StyleSheet.create({
  safeArea: {
    alignItems: 'flex-end',
  },
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  fab: {
    margin: 16,
    marginTop: 0,
  },
})

const rescapeUnsafe = (safe: string) => safe
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#039;/g, '\'')
  .replace(/-/gi, ' ')

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}


const getExerciseType = (value: ExerciseType) => {
  switch(value) {
    case ExerciseType.REPS:
      return PrimaryGoalType.ENDURANCE
    case ExerciseType.MINUTES:
      return PrimaryGoalType.ENDURANCE
    case ExerciseType.DISTANCE:
      return PrimaryGoalType.ENDURANCE
    case ExerciseType.KILOS:
      return PrimaryGoalType.STRENGTH
    case ExerciseType.POUNDS:
      return PrimaryGoalType.STRENGTH
  }
}

function UserListExercises() {
  const [exercises, setExercises] = useState<any[] | []>([])
  const [exerciseToken, setExerciseToken] = useState<string>('')

  const [keyword, setKeyword] = useState<string>('')
  const [results, setResults] = useState<ListExerciseByNameQuery['listExerciseByName']['items'] | []>([])

  const [keywordToken, setKeywordToken] = useState<string>('')


  const navigation = useNavigation<UserListExercisesNavigationProp>()

  // get initial exercises
  useEffect(() => {
    const listExercises = async () => {
      try {

        const listExercisesData = await API
          .graphql({
            query: ListExercises,
          }) as GraphQLResult<ListExercisesQuery>

        const exerciseData = listExercisesData?.data?.listExercises?.items

        const newToken = listExercisesData?.data?.listExercises?.nextToken

        if (exerciseData?.[0]?.id) {

          setExercises(exerciseData)
        }

        if (newToken) {
          setExerciseToken(newToken)
        }
      } catch(e) {
        
      }
    }
    listExercises()
  }, [])

  const loadMoreData = async () => {
    try {


      const listExercisesData = await API
        .graphql({
          query: ListExercises,
          variables: {
            nextToken: exerciseToken,
          } as ListExercisesQueryVariables,
        }) as GraphQLResult<ListExercisesQuery>

      const exerciseData = listExercisesData?.data?.listExercises?.items

      const newToken = listExercisesData?.data?.listExercises?.nextToken


      if (exerciseData?.length > 0) {

        setExercises((exercises as any[]).concat(exerciseData))
      }

      if (newToken) {
        setExerciseToken(newToken)
      }
    } catch(e) {
      // 
    }
  }

  const navigateToActivation = (index: number) => {
    const exercise = exercises[index]

    navigation.navigate('UserCreateActivateSpecificExercise', {
      name: rescapeUnsafe(capitalizeFirstLetter(exercise?.name)),
      goalType: getExerciseType(exercise.type as ExerciseType),
      exerciseId: exercise.id,
    })
  }

  const updateSearch = async (text: string) => {

    // active search
    setKeyword(text)


    const listExerciseByNameData = await API.
     graphql({
       query: ListExerciseByName,
       variables: {
         nId: 'null',
         name: {
           beginsWith: text,
         }
       } as ListExerciseByNameQueryVariables,
     }) as GraphQLResult<ListExerciseByNameQuery>

    const exerciseData = listExerciseByNameData?.data?.listExerciseByName?.items

    if (exerciseData?.[0]?.id) {
      setResults(exerciseData)
    }

  }

  const loadMoreSearchData  = async () => {
    try {
      // const exercises = await DataStore.query(Exercise,
      //   c => c.name('beginsWith', keyword), {
      //     page: keywordPage + 1,
      //   })
      //
      //   if (exercises?.length > 0) {
      //     setResults((results as Exercise[]).concat(exercises))
      //     setKeywordPage(keywordPage + 1)
      //   }

      const listExerciseByNameData = await API.
       graphql({
         query: ListExerciseByName,
         variables: {
           nId: 'null',
           name: {
             beginsWith: keyword,
           },
           nextToken: keywordToken,
         } as ListExerciseByNameQueryVariables,
       }) as GraphQLResult<ListExerciseByNameQuery>

      const exerciseData = listExerciseByNameData?.data?.listExerciseByName?.items

      const newToken = listExerciseByNameData?.data?.listExerciseByName?.nextToken

      if (exerciseData && exerciseData.length > 0) {

        setExercises(exerciseData)
      }

      if (newToken) {
        setKeywordToken(newToken)
      }

    } catch(e) {
      // 
    }
  }

  const onClearSearch = () => setKeyword('')

  const onCancelSearch = () => {
    setKeyword('')
    setResults([])
  }

 

  const navigateToCreateExercise = () => navigation.navigate('UserCreateSpecificExercise')

  return (
    <Box flex={1} alignItems="center" justifyContent="center">
      <SearchBar
        round
        placeholder="Filter with keyword"
        onChangeText={updateSearch}
        value={keyword}
        onClear={onClearSearch}
        onCancel={onCancelSearch}
        platform={Platform.OS === 'ios' ? 'ios' : 'android'}
      />
      {
        results?.[0]?.id
        ? (
          <FlatList
            data={results}
            renderItem={({ item, index }) =>
              (
                <LightRegularCard
                  alignItems="center"
                  justifyContent="center"
                >
                  <Box flex={1}>
                    <Text variant="subheader">
                      {rescapeUnsafe(capitalizeFirstLetter(item?.name))}
                    </Text>
                  </Box>
                  <Box flex={8} mt={{ phone: 's', tablet: 'm' }}>
                    <Box flex={1} flexDirection="row">
                      <Text variant="body">
                        {item?.description}
                      </Text>
                    </Box>
                  </Box>
                  <Box flex={1}>
                    <Button onPress={() => navigateToActivation(index)}>
                      Choose
                    </Button>
                  </Box>
                </LightRegularCard>
              )
            }
            keyExtractor={item => item.id}
            onEndReachedThreshold={0.3}
            onEndReached={loadMoreSearchData}
          />
        ) : (
          <FlatList
            data={exercises}
            renderItem={({ item, index }) =>
              (
                <LightRegularCard
                  alignItems="center"
                  justifyContent="center"
                >
                  <Box flex={1}>
                    <Text variant="subheader">
                      {rescapeUnsafe(capitalizeFirstLetter(item?.name))}
                    </Text>
                  </Box>
                  <Box flex={8} mt={{ phone: 's', tablet: 'm' }}>
                    <Box flex={1} flexDirection="row">
                      <Text variant="body">
                        {item?.description}
                      </Text>
                    </Box>
                  </Box>
                  <Box flex={1}>
                    <Button onPress={() => navigateToActivation(index)}>
                      Choose
                    </Button>
                  </Box>
                </LightRegularCard>
              )
            }
            keyExtractor={item => item.id}
            onEndReachedThreshold={0.3}
            onEndReached={loadMoreData}
          />
        )
      }
      <Box style={styles.container} pointerEvents="box-none">
        <SafeAreaView style={styles.safeArea} pointerEvents="box-none">
          <FAB
            icon={{
              name: 'add',
              type: 'ionicon',
              color: '#fff',
             }}
            onPress={navigateToCreateExercise}
            style={styles.fab}
          />
        </SafeAreaView>
      </Box>
    </Box>
  )
}

export default UserListExercises
