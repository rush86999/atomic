import React, {
    useState,
    useEffect,
    useCallback,
  } from 'react'
import { useNavigation, RouteProp, useFocusEffect } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import Toast from 'react-native-toast-message'
import { dayjs } from '@app/date-utils'

import Button from '@components/Button'
import { Wizard } from 'react-native-ui-lib'
import RegularCard from '@components/RegularCard'
import { 
    generateDefaultCategories, 
    createUserPreference, 
    createDefaultUser,
    createInitialSelectedCalendar,
    getUserPreference,
    updateUserPreferenceOnBoarded,
} from '@screens/OnBoard/OnBoardHelper'
import { createInitialCalendarIntegrations } from '@screens/Settings/calendar_integrationHelper'

import Box from '@components/common/Box'
import Text from '@components/common/Text'
import { EndTimeType, StartTimeType } from '@app/dataTypes/User_PreferenceType'

import { taskType } from '@screens/Progress/Todo/UserTask'

import UserEnableIntegrations from '@screens/OnBoard/OnBoardWizard/UserEnableIntegrations'
import UserSelectPrimaryCalendar from '@screens/OnBoard/OnBoardWizard/UserSelectPrimaryCalendar'
import UserAddTags from '@screens/OnBoard/OnBoardWizard/UserAddTags'
import UserDefaultAlarms from '@screens/OnBoard/OnBoardWizard/UserDefaultAlarms'
import UserWorkDay from '@screens/OnBoard/OnBoardWizard/UserWorkDay'
import UserPreferenceForTimeBlockElements from '@screens/OnBoard/OnBoardWizard/UserPreferenceForTimeBlockElements'
import UserPreferenceForTimeBlockElements2 from '@screens/OnBoard/OnBoardWizard/UserPreferenceForTimeBlockElements2'
import UserPreferenceForTimeBlockElements3 from '@screens/OnBoard/OnBoardWizard/UserPreferenceForTimeBlockElements3'
import _ from 'lodash'
import { ApolloClient, gql, NormalizedCacheObject, useQuery } from '@apollo/client'
import { UserType } from '@app/dataTypes/UserType'
import getUserById from '@app/apollo/gql/getUserById'
import { Pressable, useColorScheme } from 'react-native'
import Spinner from 'react-native-spinkit'
import { palette } from '@theme/theme'
import { getGlobalPrimaryCalendarFunction } from '@screens/Schedule/ScheduleHelper'
import { UserContactInfoType } from '@dataTypes/UserContactInfoType'


const DEFAULT_START_TIMES = [
    {
        day: 1,
        hour: 7,
        minutes: 0,
    },
    {
        day: 2,
        hour: 7,
        minutes: 0,
    },
    {
        day: 3,
        hour: 7,
        minutes: 0,
    },
    {
        day: 4,
        hour: 7,
        minutes: 0,  
    },
    {
        day: 5,
        hour: 7,
        minutes: 0,  
    },
    {
        day: 6,
        hour: 7,
        minutes: 0,
    },
    {
        day: 7,
        hour: 7,
        minutes: 0,
    }
]

const DEFAULT_END_TIMES = [
    {
        day: 1,
        hour: 23,
        minutes: 0,
    },
    {
        day: 2,
        hour: 23,
        minutes: 0,
    },
    {
        day: 3,
        hour: 23,
        minutes: 0,
    },
    {
        day: 4,
        hour: 23,
        minutes: 0,
    },
    {
        day: 5,
        hour: 23,
        minutes: 0,
    },
    {
        day: 6,
        hour: 23,
        minutes: 0,
    },
    {
        day: 7,
        hour: 23,
        minutes: 0,
    }
]

type UserOnBoardRouteStackParamList = {
  UserOnBoard: {
    taskType: taskType | undefined,
  },
}

type UserOnBoardRouteProp = RouteProp<
  UserOnBoardRouteStackParamList,
  'UserOnBoard'>


type RootStackNavigationParamList = {
    UserTask: {
        taskType: taskType | undefined,
    },
    UserOnBoard: undefined,
}

type UserOnBoardNavigationProp = StackNavigationProp<
  RootStackNavigationParamList,
  'UserOnBoard'
>

type Props = {
    sub: string,
    route: UserOnBoardRouteProp,
    client: ApolloClient<NormalizedCacheObject>,
    isPro: boolean,
    isPremium: boolean,
    enableTesting: boolean,
}

function UserOnBoard(props: Props) {
    const [reminders, setReminders] = useState<number[]>([])
    const [startTimes, setStartTimes] = useState<StartTimeType[]>([])
    const [endTimes, setEndTimes] = useState<EndTimeType[]>([])
    const [copyAvailability, setCopyAvailability] = useState<boolean>(false)
    const [copyTimeBlocking, setCopyTimeBlocking] = useState<boolean>(false)
    const [copyTimePreference, setCopyTimePreference] = useState<boolean>(false)
    const [copyReminders, setCopyReminders] = useState<boolean>(false)
    const [copyPriorityLevel, setCopyPriorityLevel] = useState<boolean>(false)
    const [copyModifiable, setCopyModifiable] = useState<boolean>(false)
    const [copyCategories, setCopyCategories] = useState<boolean>(false)
    const [copyIsBreak, setCopyIsBreak] = useState<boolean>(false)
    const [maxWorkLoadPercent, setMaxWorkLoadPercent] = useState<number>(85)
    const [minNumberOfBreaks, setMinNumberOfBreaks] = useState<number>()
    const [breakLength, setBreakLength] = useState<number>()
    const [backToBackMeetings, setBackToBackMeetings] = useState<boolean>(false)
    const [maxNumberOfMeetings, setMaxNumberOfMeetings] = useState<number>(6)
    const [copyIsMeeting, setCopyIsMeeting] = useState<boolean>(false)
    const [copyIsExternalMeeting, setCopyIsExternalMeeting] = useState<boolean>(false)
    const [copyColor, setCopyColor] = useState<boolean>(false)
    const [activeIndex, setActiveIndex] = useState<number>(0)
    const [completedStep, setCompletedStep] = useState<number | undefined>()
    const [breakColor, setBreakColor] = useState<string>()
    const [selectedCalendarId, setSelectedCalendarId] = useState<string>()
    
    const { loading, error, data, refetch } = useQuery<{ User_by_pk: UserType }>(getUserById, {
        variables: { id: props?.sub },
    })

    const navigation = useNavigation<UserOnBoardNavigationProp>()
    const client = props?.client
    const userId = props?.sub
    const user = data?.User_by_pk
    const isPro = props?.isPro
    const isPremium = props?.isPremium
    const enableTesting = props?.enableTesting
    const taskType = props?.route?.params?.taskType

    if (error) {
        Toast.show({
            type: 'error',
            text1: 'Error',
            text2: error.message,
        })
    }

    useEffect(() => {
    (async () => {
      const user_preferenceDoc = await getUserPreference(client, userId)
      
      if (user_preferenceDoc?.onBoarded) {
        
        return navigation.navigate('UserTask', { taskType })
      }
    })()
  }, [])

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const user_preferenceDoc = await getUserPreference(client, userId)
        
        if (user_preferenceDoc?.onBoarded) {
          
          return navigation.navigate('UserTask', { taskType })
        }
         
      })()
    }, [])
  )



    useEffect(() => {
        (async () => {
            const result = await getGlobalPrimaryCalendarFunction(client, userId)
            if (result?.id) setSelectedCalendarId(result?.id)
        })()
    }, [])

    useEffect(() => {
        (async () => {
            if (!user?.id) {
                return
            }
            await generateDefaultCategories(client, userId)
        })()
    }, [user?.id])

    useEffect(() => {
        (async () => {
            await createDefaultUser(client, userId)
            await refetch()
        })()
    }
    , [])

    useEffect(() => {
        (async () => {
            if (!user?.id) {
                return
            }
            await createUserPreference(client, userId)
        })()
    }
    , [user?.id])

    useEffect(() => {
        (async () => {
            if (!user?.id) {
                return
            }
            await createInitialCalendarIntegrations(client, userId)
        })()
    }
    , [user?.id])

    useEffect(() => {
        (async () => {
            if (!user?.id) {
                return
            }
            await createInitialSelectedCalendar(client, userId, setSelectedCalendarId)
        })()
    }, [user?.id])

    useEffect(() => {
        (async () => {
            try {
                if (!user?.id) {
                    return
                }
                const existinguser_preferences = await getUserPreference(client, userId)
                setReminders(existinguser_preferences?.reminders)
                setStartTimes((existinguser_preferences?.startTimes as StartTimeType[]) || (DEFAULT_START_TIMES as StartTimeType[]))
                setEndTimes((existinguser_preferences?.endTimes as EndTimeType[]) || (DEFAULT_END_TIMES as EndTimeType[]))
                setCopyAvailability(existinguser_preferences?.copyAvailability || false)
                setCopyTimeBlocking(existinguser_preferences?.copyTimeBlocking || false)
                setCopyTimePreference(existinguser_preferences?.copyTimePreference || false)
                setCopyReminders(existinguser_preferences?.copyReminders || false)
                setCopyPriorityLevel(existinguser_preferences?.copyPriorityLevel || false)
                setCopyModifiable(existinguser_preferences?.copyModifiable || false)
                setCopyCategories(existinguser_preferences?.copyCategories || false)
                setCopyIsBreak(existinguser_preferences?.copyIsBreak || false)
                setMaxWorkLoadPercent(existinguser_preferences?.maxWorkLoadPercent || 85)
                setMinNumberOfBreaks(existinguser_preferences?.minNumberOfBreaks || 1)
                setBreakLength(existinguser_preferences?.breakLength || 30)
                setBackToBackMeetings(existinguser_preferences?.backToBackMeetings)
                setMaxNumberOfMeetings(existinguser_preferences?.maxNumberOfMeetings)
                setCopyIsMeeting(existinguser_preferences?.copyIsMeeting || false)
                setCopyIsExternalMeeting(existinguser_preferences?.copyIsExternalMeeting || false)
                setCopyColor(existinguser_preferences?.copyColor)
                setBreakColor(existinguser_preferences?.breakColor || '#F7EBF7')
            } catch (e) {
                
            }
        })()
    }, [user?.id])

    const saveReminders = async () => {
        try {
            const existinguser_preferences = await getUserPreference(client, userId)
            if (!existinguser_preferences) {
                Toast.show({
                    text1: 'Error',
                    text2: 'Error saving user preferences',
                    type: 'error',
                })
                return
            }

            const upsertUserPreferenceMutation = gql`
            mutation InsertUserPreference($userPreference: User_Preference_insert_input!) {
                insert_User_Preference_one(
                    object: $userPreference,
                    on_conflict: {
                    constraint: UserPreference_pkey,
                    update_columns: [
                        ${(reminders?.length > 0)
                            && !_.isEqual(reminders, existinguser_preferences?.reminders) ? 'reminders,' : ''}
                        updatedAt,
                    ]
                    }
                ) {
                    id
                    reminders
                    followUp
                    isPublicCalendar
                    publicCalendarCategories
                    startTimes
                    endTimes
                    copyAvailability
                    copyTimeBlocking
                    copyTimePreference
                    copyReminders
                    copyPriorityLevel
                    copyModifiable
                    copyCategories
                    copyIsBreak
                    maxWorkLoadPercent
                    backToBackMeetings
                    maxNumberOfMeetings
                    minNumberOfBreaks
                    breakLength
                    breakColor
                    copyIsMeeting
                    copyIsExternalMeeting
                    copyColor
                    deleted
                    createdDate
                    updatedAt
                    userId
                }
                }`
            const valuesToUpsert: any = {
                id: existinguser_preferences?.id,
                userId,
            }

            if ((reminders?.length > 0)
            && !_.isEqual(reminders, existinguser_preferences?.reminders)) {
                valuesToUpsert.reminders = reminders
            }
            
            if (valuesToUpsert?.reminders?.length > 0) {
                await client.mutate({
                    mutation: upsertUserPreferenceMutation,
                    variables: {
                        userPreference: valuesToUpsert,
                    },
                })
            }

            
        } catch (e) {
            
        }
    }


    const saveWorkDay = async () => {
        try {
            const existinguser_preferences = await getUserPreference(client, userId)
            if (!existinguser_preferences) {
                Toast.show({
                    text1: 'Error',
                    text2: 'Error saving user preferences',
                    type: 'error',
                })
                return
            }

            const upsertUserPreferenceMutation = gql`
            mutation InsertUserPreference($userPreference: User_Preference_insert_input!) {
                insert_User_Preference_one(
                    object: $userPreference,
                    on_conflict: {
                    constraint: UserPreference_pkey,
                    update_columns: [
                        ${(startTimes?.length > 0)
                            && !_.isEqual(startTimes, existinguser_preferences?.startTimes) ? 'startTimes,' : ''}
                        ${(endTimes?.length > 0)
                        && !_.isEqual(endTimes, existinguser_preferences?.endTimes) ? 'endTimes,' : ''}
                        updatedAt,
                    ]
                    }
                ) {
                    id
                    reminders
                    followUp
                    isPublicCalendar
                    publicCalendarCategories
                    startTimes
                    endTimes
                    copyAvailability
                    copyTimeBlocking
                    copyTimePreference
                    copyReminders
                    copyPriorityLevel
                    copyModifiable
                    copyCategories
                    copyIsBreak
                    maxWorkLoadPercent
                    backToBackMeetings
                    maxNumberOfMeetings
                    minNumberOfBreaks
                    breakLength
                    breakColor
                    copyIsMeeting
                    copyIsExternalMeeting
                    copyColor
                    deleted
                    createdDate
                    updatedAt
                    userId
                }
                }`
            const valuesToUpsert: any = {
                id: existinguser_preferences?.id,
                userId,
            }

            if ((startTimes?.length > 0)
                && !_.isEqual(startTimes, existinguser_preferences?.startTimes)) {
                valuesToUpsert.startTimes = startTimes
            }

            if ((endTimes?.length > 0)
                && !_.isEqual(endTimes, existinguser_preferences?.endTimes)) {
                valuesToUpsert.endTimes = endTimes
            }
            
            if ((valuesToUpsert?.startTimes?.length > 0) || (valuesToUpsert?.endTimes?.length > 0)) {
                const { data } = await client.mutate({
                    mutation: upsertUserPreferenceMutation,
                    variables: {
                        userPreference: valuesToUpsert,
                    },
                })
                
            }
            
        } catch (e) {
            
        }
    }

    const saveUserPreferencesTimeBlock1 = async () => {
        try {
            const existinguser_preferences = await getUserPreference(client, userId)
            if (!existinguser_preferences) {
                Toast.show({
                    text1: 'Error',
                    text2: 'Error saving user preferences',
                    type: 'error',
                })
                return
            }

            const upsertUserPreferenceMutation = gql`
            mutation InsertUserPreference($userPreference: User_Preference_insert_input!) {
                insert_User_Preference_one(
                    object: $userPreference,
                    on_conflict: {
                    constraint: UserPreference_pkey,
                    update_columns: [
                        ${copyAvailability !== undefined ? 'copyAvailability,' : ''}
                        ${copyTimeBlocking !== undefined ? 'copyTimeBlocking,' : ''}
                        ${copyTimePreference !== undefined ? 'copyTimePreference,' : ''}
                        ${copyReminders !== undefined ? 'copyReminders,' : ''}
                        ${copyPriorityLevel !== undefined ? 'copyPriorityLevel,' : ''}
                        ${copyModifiable !== undefined ? 'copyModifiable,' : ''}
                        updatedAt,
                    ]
                    }
                ) {
                    id
                    reminders
                    followUp
                    isPublicCalendar
                    publicCalendarCategories
                    startTimes
                    endTimes
                    copyAvailability
                    copyTimeBlocking
                    copyTimePreference
                    copyReminders
                    copyPriorityLevel
                    copyModifiable
                    copyCategories
                    copyIsBreak
                    maxWorkLoadPercent
                    backToBackMeetings
                    maxNumberOfMeetings
                    minNumberOfBreaks
                    breakLength
                    breakColor
                    copyIsMeeting
                    copyIsExternalMeeting
                    copyColor
                    deleted
                    createdDate
                    updatedAt
                    userId
                }
                }`

            const valuesToUpsert: any = {
                id: existinguser_preferences?.id,
                userId,
            }

            if (copyAvailability !== undefined) {
                valuesToUpsert.copyAvailability = copyAvailability
            }

            if (copyTimeBlocking !== undefined) {
                valuesToUpsert.copyTimeBlocking = copyTimeBlocking
            }

            if (copyTimePreference !== undefined) {
                valuesToUpsert.copyTimePreference = copyTimePreference
            }

            if (copyReminders !== undefined) {
                valuesToUpsert.copyReminders = copyReminders
            }

            if (copyPriorityLevel !== undefined) {
                valuesToUpsert.copyPriorityLevel = copyPriorityLevel
            }

            if (copyModifiable !== undefined) {
                valuesToUpsert.copyModifiable = copyModifiable
            }

            await client.mutate({
                mutation: upsertUserPreferenceMutation,
                variables: {
                    userPreference: valuesToUpsert,
                },
            })

        } catch (e) {
            
        }
    }

    const saveUserPreferencesTimeBlock2 = async () => {
        try {
            const existinguser_preferences = await getUserPreference(client, userId)
            if (!existinguser_preferences) {
                Toast.show({
                    text1: 'Error',
                    text2: 'Error saving user preferences',
                    type: 'error',
                })
                return
            }

            const upsertUserPreferenceMutation = gql`
            mutation InsertUserPreference($userPreference: User_Preference_insert_input!) {
                insert_User_Preference_one(
                    object: $userPreference,
                    on_conflict: {
                    constraint: UserPreference_pkey,
                    update_columns: [
                        ${copyCategories !== undefined ? 'copyCategories,' : ''}
                        ${copyIsBreak !== undefined ? 'copyIsBreak,' : ''}
                        ${maxWorkLoadPercent !== undefined ? 'maxWorkLoadPercent,' : ''}
                        ${maxNumberOfMeetings !== undefined ? 'maxNumberOfMeetings,' : ''}
                        ${minNumberOfBreaks !== undefined ? 'minNumberOfBreaks,' : ''}
                        ${breakLength !== undefined ? 'breakLength,' : ''}
                        updatedAt,
                    ]
                    }
                ) {
                    id
                    reminders
                    followUp
                    isPublicCalendar
                    publicCalendarCategories
                    startTimes
                    endTimes
                    copyAvailability
                    copyTimeBlocking
                    copyTimePreference
                    copyReminders
                    copyPriorityLevel
                    copyModifiable
                    copyCategories
                    copyIsBreak
                    maxWorkLoadPercent
                    backToBackMeetings
                    maxNumberOfMeetings
                    minNumberOfBreaks
                    breakLength
                    breakColor
                    copyIsMeeting
                    copyIsExternalMeeting
                    copyColor
                    deleted
                    createdDate
                    updatedAt
                    userId
                }
                }`

            const valuesToUpsert: any = {
                id: existinguser_preferences?.id,
                userId,
            }

            if (copyCategories !== undefined) {
                valuesToUpsert.copyCategories = copyCategories
            }

            if (copyIsBreak !== undefined) {
                valuesToUpsert.copyIsBreak = copyIsBreak
            }

            if (maxWorkLoadPercent !== undefined) {
                valuesToUpsert.maxWorkLoadPercent = maxWorkLoadPercent
            }

            if (maxNumberOfMeetings !== undefined) {
                valuesToUpsert.maxNumberOfMeetings = maxNumberOfMeetings
            }

            if (minNumberOfBreaks !== undefined) {
                valuesToUpsert.minNumberOfBreaks = minNumberOfBreaks
            }

            if (breakLength !== undefined) {
                valuesToUpsert.breakLength = breakLength
            }

            await client.mutate({
                mutation: upsertUserPreferenceMutation,
                variables: {
                    userPreference: valuesToUpsert,
                },
            })
        } catch (e) {
            
        }
    }

    const saveUserPreferencesTimeBlock3 = async () => {
        try {
            const existinguser_preferences = await getUserPreference(client, userId)
            if (!existinguser_preferences) {
                Toast.show({
                    text1: 'Error',
                    text2: 'Error saving user preferences',
                    type: 'error',
                })
                return
            }

            const upsertUserPreferenceMutation = gql`
            mutation InsertUserPreference($userPreference: User_Preference_insert_input!) {
                insert_User_Preference_one(
                    object: $userPreference,
                    on_conflict: {
                    constraint: UserPreference_pkey,
                    update_columns: [
                        ${copyColor !== undefined ? 'copyColor,' : ''}
                        ${copyIsMeeting !== undefined ? 'copyIsMeeting,' : ''}
                        ${copyIsExternalMeeting !== undefined ? 'copyIsExternalMeeting,' : ''}
                        ${backToBackMeetings !== undefined ? 'backToBackMeetings,' : ''}
                        ${breakColor !== undefined ? 'breakColor,' : ''}
                        updatedAt,
                    ]
                    }
                ) {
                    id
                    reminders
                    followUp
                    isPublicCalendar
                    publicCalendarCategories
                    startTimes
                    endTimes
                    copyAvailability
                    copyTimeBlocking
                    copyTimePreference
                    copyReminders
                    copyPriorityLevel
                    copyModifiable
                    copyCategories
                    copyIsBreak
                    maxWorkLoadPercent
                    backToBackMeetings
                    maxNumberOfMeetings
                    minNumberOfBreaks
                    breakLength
                    breakColor
                    copyIsMeeting
                    copyIsExternalMeeting
                    copyColor
                    deleted
                    createdDate
                    updatedAt
                    userId
                }
                }`

            const valuesToUpsert: any = {
                id: existinguser_preferences?.id,
                userId,
            }

            if (copyColor !== undefined) {
                valuesToUpsert.copyColor = copyColor
            }

            if (copyIsMeeting !== undefined) {
                valuesToUpsert.copyIsMeeting = copyIsMeeting
            }

            if (copyIsExternalMeeting !== undefined) {
                valuesToUpsert.copyIsExternalMeeting = copyIsExternalMeeting
            }

            if (backToBackMeetings !== undefined) {
                valuesToUpsert.backToBackMeetings = backToBackMeetings
            }

            if (breakColor !== undefined) {
                valuesToUpsert.breakColor = breakColor
            }

            await client.mutate({
                mutation: upsertUserPreferenceMutation,
                variables: {
                    userPreference: valuesToUpsert,
                },
            })

        } catch (e) {
            
        }
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
            <Box mb={{ phone: 's', tablet: 'm' }} ml={{ phone: 's', tablet: 'm' }}>
                <Button onPress={goToPrevStep}>
                    Back
                </Button>
            </Box>
        )
    }

    const goToNextStep = async () => {
        try {

            const prevActiveIndex = activeIndex
            const prevCompletedStep = completedStep
            
            if (prevActiveIndex === 9) {
                return
            }


            if (prevActiveIndex === 4) {
                await saveReminders()
            }

            if (prevActiveIndex === 5) {
                
                await saveWorkDay()
            }

            if (prevActiveIndex === 6) {
                await saveUserPreferencesTimeBlock1()
            }

            if (prevActiveIndex === 7) {
                await saveUserPreferencesTimeBlock2()
            }

            if (prevActiveIndex === 8) {
                await saveUserPreferencesTimeBlock3()
            }

            let newActiveIndex = prevActiveIndex + 1

            if (!prevCompletedStep || (prevCompletedStep < prevActiveIndex)) {
                const newCompletedStep = prevActiveIndex
                setCompletedStep(newCompletedStep)
            }
    
            if (newActiveIndex !== prevActiveIndex) {
                setActiveIndex(newActiveIndex)
            }
        } catch (e) {
            
        }
    }

    const renderNextButton = () => {
        if (activeIndex === 9) {
        return <Box mt={{ phone: 's', tablet: 'm' }}/>
        }

        return (
        <Box mb={{ phone: 's', tablet: 'm' }} mr={{ phone: 's', tablet: 'm' }}>
            <Button onPress={goToNextStep}>
                Next
            </Button>
        </Box>
        )
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

    const completeOnboarding = async () => {
        
        await updateUserPreferenceOnBoarded(client, userId, true)
        navigation.navigate('UserTask', { taskType })
    }

    const renderCurrentStep = () => {
        switch (activeIndex) {
            case 0:
                return (
                    <Box style={{ width: '100%'}} flex={1} justifyContent="center" alignItems="center">
                        <Text variant="subheader" m={{ phone: 'm', tablet: 'l' }}>
                            Smart Scheduling with Atomic
                        </Text>
                        <Box m={{ phone: 'm', tablet: 'l' }}>
                            <Text variant="optionHeader" m={{ phone: 'm', tablet: 'l' }}>
                                This wizard will help you setup some sane defaults.
                            </Text>
                            <Text variant="optionHeader" m={{ phone: 'm', tablet: 'l' }}>
                                You can always change these later under settings.
                            </Text>
                            <Text variant="optionHeader" m={{ phone: 'm', tablet: 'l' }}>
                                You are few steps away from using artificial intelligence to make your life more productive.
                            </Text>
                        </Box>
                        <Box style={{ width: '100%' }} p={{ phone: 'm', tablet: 'l' }} m={{ phone: 's', tablet: 'm' }} flexDirection="row" justifyContent="space-between" alignItems="center">
                            <Box />
                            {renderNextButton()}
                        </Box>
                    </Box>

                )
            case 1:
                return (
                    <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
                        <Box style={{ width: '100%' }} flex={1} justifyContent="center" alignItems="center">
                            <UserEnableIntegrations 
                                sub={userId} 
                                client={client} 
                                isPro={isPro}
                                isPremium={isPremium}
                                enableTesting={enableTesting}
                            />
                        </Box>
                        <Box style={{ width: '100%' }} flexDirection="row" justifyContent="space-between" alignItems="center">
                            {renderPrevButton()}
                            {renderNextButton()}
                        </Box>
                    </Box>
                )
            case 2:
                return (
                    <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
                        <UserSelectPrimaryCalendar
                            selectedCalendarId={selectedCalendarId}
                            userId={userId} 
                            setParentSelectedCalendarId={setSelectedCalendarId}
                            client={client}
                        />
                        <Box style={{ width: '100%' }} flexDirection="row" justifyContent="space-between" alignItems="center">
                            {renderPrevButton()}
                            {renderNextButton()}
                        </Box>
                    </Box>
                )
            case 3:
                return (
                    <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
                        <UserAddTags sub={userId} client={client} />
                        <Box style={{ width: '100%' }} flexDirection="row" justifyContent="space-between" alignItems="center">
                            {renderPrevButton()}
                            {renderNextButton()}
                        </Box>
                    </Box>
                )
            case 4:
                return (
                    <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
                        <UserDefaultAlarms reminders={reminders} setParentReminders={setReminders} />
                        <Box style={{ width: '100%' }} flexDirection="row" justifyContent="space-between" alignItems="center">
                            {renderPrevButton()}
                            {renderNextButton()}
                        </Box>
                    </Box>
                )
            case 5:
                return (
                    <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
                        <UserWorkDay startTimes={startTimes} setParentStartTimes={setStartTimes} endTimes={endTimes} setParentEndTimes={setEndTimes} />
                        <Box style={{ width: '100%' }} flexDirection="row" justifyContent="space-between" alignItems="center">
                            {renderPrevButton()}
                            {renderNextButton()}
                        </Box>
                    </Box>
                )
            case 6:
                return (
                    <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
                        <UserPreferenceForTimeBlockElements 
                            copyAvailability={copyAvailability}
                            copyTimeBlocking={copyTimeBlocking}
                            copyTimePreference={copyTimePreference}
                            copyReminders={copyReminders}
                            copyPriorityLevel={copyPriorityLevel}
                            copyModifiable={copyModifiable}
                            setParentCopyAvailability={setCopyAvailability}
                            setParentCopyTimeBlocking={setCopyTimeBlocking}
                            setParentCopyTimePreference={setCopyTimePreference}
                            setParentCopyReminders={setCopyReminders}
                            setParentCopyPriorityLevel={setCopyPriorityLevel}
                            setParentCopyModifiable={setCopyModifiable}  
                        />
                        <Box style={{ width: '100%' }} flexDirection="row" justifyContent="space-between" alignItems="center">
                            {renderPrevButton()}
                            {renderNextButton()}
                        </Box>
                    </Box>
                )
            case 7:
                return (
                    <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
                        <UserPreferenceForTimeBlockElements2
                            copyCategories={copyCategories}
                            copyIsBreak={copyIsBreak}
                            maxWorkLoadPercent={maxWorkLoadPercent}
                            minNumberOfBreaks={minNumberOfBreaks}
                            breakLength={breakLength}
                            setParentCopyCategories={setCopyCategories}
                            setParentCopyIsBreak={setCopyIsBreak}
                            setParentMaxWorkLoadPercent={setMaxWorkLoadPercent}
                            setParentMinNumberOfBreaks={setMinNumberOfBreaks}
                            setParentBreakLength={setBreakLength}
                        />
                        <Box style={{ width: '100%' }} flexDirection="row" justifyContent="space-between" alignItems="center">
                            {renderPrevButton()}
                            {renderNextButton()}
                        </Box>
                    </Box>
                )
            case 8:
                return (
                    <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
                        <UserPreferenceForTimeBlockElements3
                            copyIsMeeting={copyIsMeeting}
                            copyIsExternalMeeting={copyIsExternalMeeting}
                            copyColor={copyColor}
                            backToBackMeetings={backToBackMeetings}
                            breakColor={breakColor}
                            setParentCopyIsMeeting={setCopyIsMeeting}
                            setParentCopyIsExternalMeeting={setCopyIsExternalMeeting}
                            setParentCopyColor={setCopyColor}
                            setParentBackToBackMeetings={setBackToBackMeetings}
                            setParentBreakColor={setBreakColor}
                        />
                        <Box style={{ width: '100%' }} flexDirection="row" justifyContent="space-between" alignItems="center">
                            {renderPrevButton()}
                            {renderNextButton()}
                        </Box>
                    </Box>
                )
            case 9:
                return (
                    <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
                        <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
                            <Text m={{ phone: 's', tablet: 'm' }} variant="subheader">
                                You are almost done!
                            </Text>
                            <Text m={{ phone: 's', tablet: 'm' }} variant="optionHeader">
                                Finalize your choices by pressing below.
                            </Text>
                            <Pressable onPress={completeOnboarding}>
                                <Text variant="buttonLink">
                                    Complete Onboarding
                                </Text>
                            </Pressable>
                        </Box>
                        <Box m={{ phone: 's', tablet: 'm' }} p={{ phone: 's', tablet: 'm' }}  flexDirection="row" justifyContent="flex-start" width="100%">
                            {renderPrevButton()}
                        </Box>
                    </Box>
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

    const darkMode = useColorScheme() === 'dark'

    if (loading) {
        return (
          <Box backgroundColor="primaryCardBackground" flex={1} justifyContent="center" alignItems="center" style={{ width: '100%'}}>
              <Spinner isVisible={true} type="ThreeBounce" size={100} color={darkMode ? palette.textBlack : palette.white} />
          </Box>
          )
      }

    return (
        <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
             <Wizard testID={'uilib.wizard'} activeIndex={activeIndex} onActiveIndexChanged={onActiveIndexChanged}>
                <Wizard.Step state={getStepState(0)} label={'Welcome'} />
                <Wizard.Step state={getStepState(1)} label={'Step 2'} />
                <Wizard.Step state={getStepState(2)} label={'Step 3'} />
                <Wizard.Step state={getStepState(3)} label={'Step 4'} />
                <Wizard.Step state={getStepState(4)} label={'Step 5'} />
                <Wizard.Step state={getStepState(5)} label={'Step 6'} />
                <Wizard.Step state={getStepState(6)} label={'Step 7'} />
                <Wizard.Step state={getStepState(7)} label={'Step 8'} />
                <Wizard.Step state={getStepState(8)} label={'Step 9'} />
                <Wizard.Step state={getStepState(9)} label={'All Done!'} />
            </Wizard>
            {renderCurrentStep()}
        </Box>
    )
}

export default UserOnBoard