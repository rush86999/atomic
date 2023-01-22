import React, { useState, useEffect, useCallback } from 'react'
import {
  FlatList,
  Platform,
} from 'react-native'

import { DataStore } from '@aws-amplify/datastore'

import _ from 'lodash'
import {TextField} from 'react-native-ui-lib'

import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { GraphQLResult, API } from '@aws-amplify/api'

import Box from '@components/common/Box'
import Text from '@components/common/Text'
import LightRegularCard from '@components/LightRegularCard'
import Button from '@components/Button'


import {
  UserActivateType,
  PrimaryGoalType,
  UserProfile,
} from '@models'

import {
  UserProfile as UserProfileRealm,
} from '@realm/UserProfile'

import ListActivateTypesByUser from '@graphql/Queries/ListActivateTypesByUser'

import {
  ListActivateTypesByUserQuery,
  ListActivateTypesByUserQueryVariables,
} from '@app/API'




type RootNavigationStackParamList = {
  UserCreateActivateNewSkill: {
    name: string,
    activateId?: string,
  },
  UserCreateActivateSpecificExercise: {
    name: string,
    goalType: PrimaryGoalType,
    activateId: string,
    exerciseId: string,
  },
  UserListExercises: undefined,
  UserCreateActivateMeditate: {
    activateId: string,
  },
  UserCreateActivateRoutine: {
    name: string,
    activateId: string,
    routineId: string,
  },
  UserListRoutines: undefined,
  UserCreateActivateHabit: {
    name: string,
    activateId?: string,
  },
  UserCreateActivateLimit: {
    name: string,
    activateId?: string,
  },
  UserCreateActivateSteps: {
    activateId: string,
  },
  UserCreateActivateWeight: {
    activateId: string,
  },
  UserProgressInactiveComponents: undefined,
}

type UserProgressInactiveComponentsNavigationProp = StackNavigationProp<
  RootNavigationStackParamList,
  'UserProgressInactiveComponents'
>

type Props = {
  sub: string,
  getRealmApp: () => Realm,
}


const PrimaryGoalNameTypes = [
  PrimaryGoalType.HABITTYPE,
  PrimaryGoalType.LIMITTYPE,
  PrimaryGoalType.NEWSKILLTYPE,
]

const PrimaryExerciseTypes = [
  PrimaryGoalType.STRENGTH,
  PrimaryGoalType.ENDURANCE,
]


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

function UserProgressInactiveComponents(props: Props) {
  // const [primaryTypes, setPrimaryTypes] = useState<UserActivateType[] | []>([])
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | undefined>()
  // const [nameTypes, setNameTypes] = useState<UserActivateType[] | []>([])
  const [displayTypes, setDisplayTypes] = useState<UserActivateType[] | []>([])
  const [names, setNames] = useState<string[] | []>([])

  const {
    sub,
    getRealmApp,
  } = props

  const realm = getRealmApp()

  // const currentUserProfileEl = useRef<UserProfile>(null)

  const navigation = useNavigation<UserProgressInactiveComponentsNavigationProp>()

  // get current User Profile
  useEffect(() => {
    (async () => {


      const profileDatas = realm.objects<UserProfileRealm>('UserProfile')

      if (!(profileDatas?.length > 0)) {
        return
      }

      const [profileData] = profileDatas
      setCurrentUserProfile(profileData)
      // currentUserProfileEl.current = profileData

    })()
  }, [])

  /**
    At user registration create an initial secondaryGoalType 'null' type for each offered type.
    Query inactive types
   */
  useEffect(() => {
    (async () => {
      try {
        if (!(currentUserProfile) || !(currentUserProfile?.userId)) {
          return
        }

        const inactiveTypes = await DataStore.query(
          UserActivateType, c => c
            .userId('eq', currentUserProfile?.userId)
            .activated('eq', false)
        )

        if (inactiveTypes?.[0]?.id) {
          setDisplayTypes(inactiveTypes)
          
          const newNames = inactiveTypes.map(inactiveType => {
            return inactiveType?.secondaryGoalName
          })
          setNames(newNames)
        } else {
          const inactiveTypesData = await API
            .graphql({
              query: ListActivateTypesByUser,
              variables: {
                userId: currentUserProfile?.userId,
              } as ListActivateTypesByUserQueryVariables
            }) as GraphQLResult<ListActivateTypesByUserQuery>

          const inactiveTypes2 = inactiveTypesData?.data?.listActivateTypesByUser?.items
          const filteredItems = inactiveTypes2.filter(i => (i.activated === false))

          if (filteredItems?.[0]?.id) {
            setDisplayTypes(filteredItems)
            const newNames = filteredItems.map(inactiveType => {
              return inactiveType?.secondaryGoalName
            })
            setNames(newNames)
          }
        }
      } catch(e) {
        
      }
    })()
  }, [(currentUserProfile?.userId)])

  useFocusEffect(
    useCallback(
      () => {
        (async () => {
          try {
            if (!(currentUserProfile) || !(currentUserProfile?.userId)) {
              return
            }
    
            const inactiveTypes = await DataStore.query(
              UserActivateType, c => c
                .userId('eq', currentUserProfile?.userId)
                .activated('eq', false)
            )
    
            if (inactiveTypes?.[0]?.id) {
              setDisplayTypes(inactiveTypes)
              
              const newNames = inactiveTypes.map(inactiveType => {
                return inactiveType?.secondaryGoalName
              })
              setNames(newNames)
            } else {
              const inactiveTypesData = await API
                .graphql({
                  query: ListActivateTypesByUser,
                  variables: {
                    userId: currentUserProfile?.userId,
                  } as ListActivateTypesByUserQueryVariables
                }) as GraphQLResult<ListActivateTypesByUserQuery>
    
              const inactiveTypes2 = inactiveTypesData?.data?.listActivateTypesByUser?.items
              const filteredItems = inactiveTypes2.filter(i => (i.activated === false))
    
              if (filteredItems?.[0]?.id) {
                setDisplayTypes(filteredItems)
                const newNames = filteredItems.map(inactiveType => {
                  return inactiveType?.secondaryGoalName
                })
                setNames(newNames)
              }
            }
          } catch(e) {
            
          }
        })()
      }, [(currentUserProfile?.userId)]
    )
  )

 

  const getNavName = (type: PrimaryGoalType) => {
    switch(type) {
      case PrimaryGoalType.NEWSKILLTYPE:
        return 'UserCreateActivateNewSkill'

      case PrimaryGoalType.MEDITATION:
        return 'UserCreateActivateMeditate'

      case PrimaryGoalType.STEP:
        return 'UserCreateActivateSteps'
      case PrimaryGoalType.STRENGTH:
        return 'UserCreateActivateSpecificExercise'
      case PrimaryGoalType.ENDURANCE:
        return 'UserCreateActivateSpecificExercise'

      case PrimaryGoalType.WEIGHT:
        return 'UserCreateActivateWeight'
      case PrimaryGoalType.ROUTINE:
        return 'UserCreateActivateRoutine'
      case PrimaryGoalType.HABITTYPE:
        return 'UserCreateActivateHabit'
      case PrimaryGoalType.LIMITTYPE:
        return 'UserCreateActivateLimit'
    }
  }

  const getDataName = (type: PrimaryGoalType) => {
    switch(type) {
      case PrimaryGoalType.NEWSKILLTYPE:
        return 'New Skill'
   
      case PrimaryGoalType.MEDITATION:
        return 'Meditate'

      case PrimaryGoalType.STEP:
        return 'Steps'
      case PrimaryGoalType.STRENGTH:
        return 'Strength'
      case PrimaryGoalType.ENDURANCE:
        return 'Endurance'

      case PrimaryGoalType.WEIGHT:
        return 'Weight'
      case PrimaryGoalType.ROUTINE:
        return 'Routine'
      case PrimaryGoalType.HABITTYPE:
        return 'New Habit'
      case PrimaryGoalType.LIMITTYPE:
        return 'New Limit'
    }
  }

  const onNameChange = (text: string, index: number) => {
    const newNames = [
      ...names.slice(0, index),
      text,
      ...names.slice(index + 1)
    ]

    setNames(newNames)
  }

  const updateActivateTypeToActive = async (index: number, name?: string) => {
    try {
      const activateType = displayTypes[index]

      
      

      // navigate to component
      if (((activateType.primaryGoalType === PrimaryGoalType.ENDURANCE) && name)
      || (((activateType.primaryGoalType === PrimaryGoalType.STRENGTH) && name))) {
        navigation.navigate(getNavName(activateType.primaryGoalType as PrimaryGoalType), {
          name,
          goalType: activateType.primaryGoalType  as PrimaryGoalType,
          activateId: activateType.id,
          exerciseId: activateType.exerciseId,
        })
      } else if ((activateType.primaryGoalType === PrimaryGoalType.ROUTINE) && name) {
        navigation.navigate(getNavName(activateType.primaryGoalType as PrimaryGoalType), {
          name,
          activateId: activateType.id,
          routineId: activateType.routineId,
        })
      } else if (name) {
        navigation.navigate(getNavName(activateType.primaryGoalType as PrimaryGoalType), {
          name,
          activateId: activateType.secondaryGoalName ? activateType.id : null,
        })
      } else {
        navigation.navigate(getNavName(activateType.primaryGoalType as PrimaryGoalType), {
          activateId: activateType.id,
        })
      }

    } catch(e) {
      
    }
  }

  const navigateToExercisesAndRoutines = (index: number) => {
    const activateType = displayTypes[index]

    if (activateType.primaryGoalType === PrimaryGoalType.ROUTINE) {
      navigation.navigate('UserListRoutines')
    } else {
      navigation.navigate('UserListExercises')
    }
  }

  type renderItem = {
    item: UserActivateType,
    index: number,
  }

  const renderItem = ({ item, index }: renderItem) => {

    
    

    if ((item.primaryGoalType === PrimaryGoalType.ROUTINE)
      && names?.[index]) {
        return (
          <Box flex={1} justifyContent="center" alignItems="center">
            <LightRegularCard justifyContent="center" alignItems="center">
              <Box my={{ phone: 'xs', tablet: 's' }}>
                <Text variant="lightRegularHeader">
                  {names?.[index]}
                </Text>
              </Box>
              <Button onPress={() => updateActivateTypeToActive(index, names[index])}>
                Activate
              </Button>
              <Box m={{ phone: 'm', tablet: 'l' }} justifyContent="center" alignItems="center">
                <Text variant="subheader">
                  OR
                </Text>
              </Box>
              <Button onPress={() => navigateToExercisesAndRoutines(index)}>
                  List Routines
              </Button>
            </LightRegularCard>
          </Box>
        )
    }

    if (PrimaryExerciseTypes.includes(item.primaryGoalType as PrimaryGoalType)
        && names?.[index]) {
      return (
        <Box flex={1} justifyContent="center" alignItems="center">
          <LightRegularCard justifyContent="center" alignItems="center">
            <Box my={{ phone: 'xs', tablet: 's' }}>
              <Text variant="lightRegularHeader">
                {names?.[index]}
              </Text>
            </Box>
            <Button onPress={() => updateActivateTypeToActive(index, names[index])}>
              Activate
            </Button>
            <Box m={{ phone: 'm', tablet: 'l' }} justifyContent="center" alignItems="center">
              <Text variant="subheader">
                OR
              </Text>
            </Box>
            <Button onPress={() => navigateToExercisesAndRoutines(index)}>
                List Exercises
            </Button>
          </LightRegularCard>
        </Box>
      )
    }

    if (PrimaryExerciseTypes.includes(item.primaryGoalType as PrimaryGoalType)) {
      if (item?.secondaryGoalType === 'null') {
        return (
          <Box flex={1} justifyContent="center" alignItems="center">
            <LightRegularCard justifyContent="center" alignItems="center">
              <Box my={{ phone: 'xs', tablet: 's' }}>
                <Text variant="lightRegularHeader">
                  {getDataName(item?.primaryGoalType as PrimaryGoalType)}
                </Text>
              </Box>
              <Button onPress={() => navigateToExercisesAndRoutines(index)}>
                  List Exercises
              </Button>
            </LightRegularCard>
          </Box>
        )
      }

      return (
        <Box flex={1} justifyContent="center" alignItems="center">
          <LightRegularCard justifyContent="center" alignItems="center">
            <Box my={{ phone: 'xs', tablet: 's' }}>
              <Text variant="lightRegularHeader">
                {capitalizeFirstLetter(rescapeUnsafe(item?.secondaryGoalType))}
              </Text>
            </Box>
            <Box my={{ phone: 'xs', tablet: 's' }}>
              <Button onPress={() => updateActivateTypeToActive(index, names[index])}>
                Activate
              </Button>
            </Box>
            <Box my={{ phone: 'xs', tablet: 's' }}>
              <Button onPress={() => navigateToExercisesAndRoutines(index)}>
                  List Exercises
              </Button>
            </Box>
          </LightRegularCard>
        </Box>
      )
    }

    if (PrimaryGoalNameTypes.includes(item.primaryGoalType as PrimaryGoalType)) {
      if (item?.secondaryGoalType === 'null') {
        return (
          <Box flex={1} justifyContent="center" alignItems="center">
            <LightRegularCard justifyContent="center" alignItems="center">
              <Box my={{ phone: 'xs', tablet: 's' }}>
                <Text variant="lightRegularHeader">
                  {getDataName(item?.primaryGoalType as PrimaryGoalType)}
                </Text>
              </Box>
              <Box my={{ phone: 'xs', tablet: 's' }}>
                <TextField
                  value={names[index] || ''}
                  onChangeText={(text: string) => onNameChange(text, index)}
                  placeholder={names?.[index] || "type name here"}
                  title="name"
                />
              </Box>
              <Button onPress={() => updateActivateTypeToActive(index, names[index])}>
                Activate
              </Button>
            </LightRegularCard>
          </Box>
        )
      }

      return (
        <Box flex={1} justifyContent="center" alignItems="center">
          <LightRegularCard justifyContent="center" alignItems="center">
            <Box my={{ phone: 'xs', tablet: 's' }}>
              <Text variant="lightRegularHeader">
                {capitalizeFirstLetter(rescapeUnsafe(item?.secondaryGoalType))}
              </Text>
            </Box>
            <Button onPress={() => updateActivateTypeToActive(index, names[index])}>
              Activate
            </Button>
          </LightRegularCard>
        </Box>
      )
    }

    if ((item.primaryGoalType === PrimaryGoalType.ROUTINE)) {
        return (
          <Box flex={1} justifyContent="center" alignItems="center">
            <LightRegularCard justifyContent="center" alignItems="center">
              <Box my={{ phone: 'xs', tablet: 's' }}>
                <Text variant="lightRegularHeader">
                  {getDataName(item?.primaryGoalType as PrimaryGoalType)}
                </Text>
              </Box>
              <Button onPress={() => navigateToExercisesAndRoutines(index)}>
                  List Routines
              </Button>
            </LightRegularCard>
          </Box>
        )
    }


    return (
      <Box flex={1} justifyContent="center" alignItems="center">
        <LightRegularCard justifyContent="center" alignItems="center">
          <Box my={{ phone: 'xs', tablet: 's' }}>
            <Text variant="lightRegularHeader">
              {getDataName(item?.primaryGoalType as PrimaryGoalType)}
            </Text>
          </Box>
          <Box>
            {
              (Platform.OS === 'ios')
              && (item?.primaryGoalType === 'STEP')
              ? (
                <Box my={{ phone: 'xs', tablet: 's' }}>
                  <Text variant="optionHeader">
                    Powered by Apple Health
                  </Text>
                </Box>
              ) : null
            }
          </Box>
          <Button onPress={() => updateActivateTypeToActive(index)}>
            Activate
          </Button>
        </LightRegularCard>
      </Box>
    )
  }

  return (
    <Box flex={1}>
      {
        displayTypes?.[0]?.id
        ? (
          <FlatList
            data={displayTypes.filter(i => (i.primaryGoalType !== PrimaryGoalType.TODO))}
            renderItem={renderItem}
            keyExtractor={item => item.id}
          />
        ) : null
      }
    </Box>
  )
}

export default UserProgressInactiveComponents
