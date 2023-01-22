import React, { useState, useEffect } from 'react'
import {
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
  FlatList,
  SafeAreaView,
 } from 'react-native'
import { SearchBar, FAB } from 'react-native-elements/src'
import { GraphQLResult, API } from '@aws-amplify/api'
import { useNavigation, RouteProp } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'

import Box from '@components/common/Box'
import Text from '@components/common/Text'
import Button from '@components/Button'
import LightRegularCard from '@components/LightRegularCard'


import ListRoutines from '@graphql/Queries/ListRoutines'
import ListRoutinesByName from '@graphql/Queries/ListRoutinesByName'

import {
  ListRoutinesQuery,
  ListRoutinesQueryVariables,
  ListRoutinesByNameQuery,
  ListRoutinesByNameQueryVariables,
} from '@app/API'


type RootRouteStackParamList = {
  UserListRoutines: {
    isUpdate?: string,
  }
}

type UserListRoutinesRouteProp = RouteProp<
  RootRouteStackParamList,
  'UserListRoutines'
>

type Props = {
  route: UserListRoutinesRouteProp,
}

type RootNavigationStackParamList = {
  UserCreateActivateRoutine: {
    name: string,
  },
  UserCreateRoutine: undefined,
  UserListRoutines: undefined,
}

type UserListRoutinesNavigationProp = StackNavigationProp<
  RootNavigationStackParamList,
  'UserListRoutines'
>

const { width: winWidth } = Dimensions.get('window')

const rescapeUnsafe = (safe: string) => safe
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#039;/g, '\'')
  .replace(/-/gi, ' ')

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

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function UserListRoutines(props: Props) {
  const [routines, setRoutines] = useState<any[] | []>([])

  const [keyword, setKeyword] = useState<string>('')
  const [results, setResults] = useState<any[] | []>([])

  const [truncated, setTruncated] = useState<boolean>(true)
  const [externalData, setExternalData] = useState<boolean>(false)
  const [nextToken, setNextToken] = useState<string>('')
  const [keywordToken, setKeywordToken] = useState<string>('')

  const navigation = useNavigation<UserListRoutinesNavigationProp>()

  const isUpdate = props?.route?.params?.isUpdate
  // get initial routines
  useEffect(() => {
    (async () => {
      try {
        // const newRoutines = await DataStore.query(Routine, Predicates.ALL, {
        //   page,
        // })

        const listRoutinesData = await API
          .graphql({
            query: ListRoutines,
          }) as GraphQLResult<ListRoutinesQuery>

        const newRoutines = listRoutinesData?.data?.listRoutines?.items
        const newToken = listRoutinesData?.data?.listRoutines?.nextToken
        if (newRoutines?.length > 0) {
          // setPage(page + 1)
          if (newToken) {
            setNextToken(newToken)
          }

          setRoutines(newRoutines)
        }
      } catch(e) {
        
      }
    })()
  }, [isUpdate])

  const loadMoreData = async () => {
    try {
      // const newRoutines = await DataStore.query(Routine, Predicates.ALL, {
      //   page: page + 1,
 })

      if (!nextToken) {
        return
      }

      const listRoutinesData = await API
        .graphql({
          query: ListRoutines,
          variables: {
            nextToken,
          } as ListRoutinesQueryVariables,
        }) as GraphQLResult<ListRoutinesQuery>

      const newRoutines = listRoutinesData?.data?.listRoutines?.items
      const newToken = listRoutinesData?.data?.listRoutines?.nextToken

      if (newRoutines?.length > 0) {
        // setPage(page + 1)

        if (newToken) {
          setNextToken(newToken)
        }

        setRoutines((routines as any[]).concat(newRoutines))
      }
    } catch(e) {
      
    }
  }

  const navigateToActivation = (index: number) => {
    const routine = routines[index]

    navigation.navigate('UserCreateActivateRoutine', {
      name: rescapeUnsafe(capitalizeFirstLetter(routine?.name)),
    })
  }

  const updateSearch = async (text: string) => {

    // active search
    setKeyword(text)

    const listRoutinesByNameData = await API
      .graphql({
        query: ListRoutinesByName,
        variables: {
          nId: 'null',
          name: {
            beginsWith: text,
          }
        } as ListRoutinesByNameQueryVariables,
      }) as GraphQLResult<ListRoutinesByNameQuery>

    const routines = listRoutinesByNameData?.data?.listRoutinesByName?.items

    const newToken = listRoutinesByNameData?.data?.listRoutinesByName?.nextToken

    if (routines?.length > 0) {
      setResults(routines)
    }

    if (newToken) {
      setKeywordToken(newToken)
    }

  }

  const loadMoreSearchData  = async () => {
    try {

      if (!keywordToken) {
        return
      }

      const listRoutinesByNameData = await API
        .graphql({
          query: ListRoutinesByName,
          variables: {
            nId: 'null',
            name: {
              beginsWith: keyword,
            },
            nextToken: keywordToken,
          } as ListRoutinesByNameQueryVariables,
        }) as GraphQLResult<ListRoutinesByNameQuery>

        // if (routines?.length > 0) {
        //   setResults((results as Routine[]).concat(routines))
        //   setKeywordPage(keywordPage + 1)
        // }

        const routines = listRoutinesByNameData?.data?.listRoutinesByName?.items

        const newToken = listRoutinesByNameData?.data?.listRoutinesByName?.nextToken

        if (routines?.length > 0) {
          setResults(routines)
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

  const handleExternalData = () => setExternalData(!externalData)

  const truncate = (str: string) => {
    if (handleExternalData) {
      handleExternalData()
    }
    if ((str.length > 85)) {
      // setTruncated(true)

      return str.substr(0, 84) + '\u2026'
    }
    return str
  }

  const untruncate = () => {
    setTruncated(false)
    if (handleExternalData) {
      handleExternalData()
    }
  }

  const hide = () => {
    setTruncated(true)
  }

  const navigateToCreateRoutine = () => navigation.navigate('UserCreateRoutine')

  return (
    <Box flex={1} alignItems="center">
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
        results?.length > 0
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
                  <Box flex={8}>
                    {
                      item?.description
                      && truncated
                      ? (
                        <Box flex={1} flexDirection="row">
                          <Text variant="body">
                            {truncate(item.description)}
                          </Text>
                          {item?.description?.length > 84
                            ? (
                              <TouchableOpacity onPress={untruncate}>
                                <Text color="greyLink" variant="body">
                                  More
                                </Text>
                              </TouchableOpacity>
                            ) : null}
                        </Box>
                      ) : (
                        <Box flex={1} flexDirection="row">
                          <Text variant="body">
                            {item?.description}
                          </Text>
                          {item?.description?.length > 84
                            ? (
                              <TouchableOpacity onPress={hide}>
                                <Text color="greyLink" variant="body">
                                  Hide
                                </Text>
                              </TouchableOpacity>
                            ) : null}
                        </Box>
                      )
                    }
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
            extraData={externalData}
          />
        ) : (
          <FlatList
            data={routines}
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
                  <Box flex={8}>
                    {
                      item?.description
                      && truncated
                      ? (
                        <Box flex={1} flexDirection="row">
                          <Text variant="body">
                            {truncate(item.description)}
                          </Text>
                          {item?.description?.length > 84
                            ? (
                              <TouchableOpacity onPress={untruncate}>
                                <Text color="greyLink" variant="body">
                                  More
                                </Text>
                              </TouchableOpacity>
                            ) : null}
                        </Box>
                      ) : (
                        <Box flex={1} flexDirection="row">
                          <Text variant="body">
                            {item?.description}
                          </Text>
                          {item?.description?.length > 84
                            ? (
                              <TouchableOpacity onPress={hide}>
                                <Text color="greyLink" variant="body">
                                  Hide
                                </Text>
                              </TouchableOpacity>
                            ) : null}
                        </Box>
                      )
                    }
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
            extraData={externalData}
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
            onPress={navigateToCreateRoutine}
            style={styles.fab}
          />
        </SafeAreaView>
      </Box>
    </Box>
  )
}

export default UserListRoutines
