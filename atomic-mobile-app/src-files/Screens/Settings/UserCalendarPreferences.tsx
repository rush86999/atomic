import React, {
  useState,
  useEffect,
} from 'react'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { ApolloClient, gql, NormalizedCacheObject } from '@apollo/client'
import Toast from 'react-native-toast-message'

import Box from '@components/common/Box'
import Text from '@components/common/Text'
import { EndTimeType, StartTimeType } from '@app/dataTypes/User_PreferenceType'

import EditPreferenceStep1 from '@screens/Settings/UserPreferenceWizard/EditPreferenceStep1'
import EditPreferenceStep2 from '@screens/Settings/UserPreferenceWizard/EditPreferenceStep2'
import EditPreferenceStep3 from '@screens/Settings/UserPreferenceWizard/EditPreferenceStep3'
import EditPreferenceStep5 from '@screens/Settings/UserPreferenceWizard/EditPreferenceStep5'
import EditPreferenceStep6 from '@screens/Settings/UserPreferenceWizard/EditPreferenceStep6'
import _ from 'lodash'
import Button from '@components/Button'
import { Wizard } from 'react-native-ui-lib'
import RegularCard from '@components/RegularCard'
import { getUserPreference } from '@screens/OnBoard/OnBoardHelper'

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
        hour: 19,
        minutes: 0,
    },
    {
        day: 2,
        hour: 19,
        minutes: 0,
    },
    {
        day: 3,
        hour: 19,
        minutes: 0,
    },
    {
        day: 4,
        hour: 19,
        minutes: 0,
    },
    {
        day: 5,
        hour: 19,
        minutes: 0,
    },
    {
        day: 6,
        hour: 19,
        minutes: 0,
    },
    {
        day: 7,
        hour: 19,
        minutes: 0,
    }
]

type RootStackNavigationParamList = {
   UserCalendarPreferences: undefined,
   UserViewCalendar: undefined,
}

type UserCalendarPreferencesNavigationProp = StackNavigationProp<
  RootStackNavigationParamList,
  'UserCalendarPreferences'
>

type Props = {
    sub: string,
    client: ApolloClient<NormalizedCacheObject>,
}

function UserCalendarPreferences(props: Props) {
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

    const client = props?.client
    const userId = props.sub
    const navigation = useNavigation<UserCalendarPreferencesNavigationProp>()
    
    useEffect(() => {
        (async () => {
            try {
                const existinguser_preferences = await getUserPreference(client, userId)
                setReminders(existinguser_preferences?.reminders)
                setStartTimes((existinguser_preferences?.startTimes as StartTimeType[]) || (DEFAULT_START_TIMES as StartTimeType[]))
                setEndTimes((existinguser_preferences?.endTimes as EndTimeType[]) || (DEFAULT_END_TIMES as EndTimeType[]))
                setCopyAvailability(existinguser_preferences?.copyAvailability)
                setCopyTimeBlocking(existinguser_preferences?.copyTimeBlocking)
                setCopyTimePreference(existinguser_preferences?.copyTimePreference)
                setCopyReminders(existinguser_preferences?.copyReminders)
                setCopyPriorityLevel(existinguser_preferences?.copyPriorityLevel)
                setCopyModifiable(existinguser_preferences?.copyModifiable)
                setCopyCategories(existinguser_preferences?.copyCategories)
                setCopyIsBreak(existinguser_preferences?.copyIsBreak)
                setMaxWorkLoadPercent(existinguser_preferences?.maxWorkLoadPercent || 85)
                setMinNumberOfBreaks(existinguser_preferences?.minNumberOfBreaks || 1)
                setBreakLength(existinguser_preferences?.breakLength || 30)
                setBackToBackMeetings(existinguser_preferences?.backToBackMeetings)
                setMaxNumberOfMeetings(existinguser_preferences?.maxNumberOfMeetings)
                setCopyIsMeeting(existinguser_preferences?.copyIsMeeting)
                setCopyIsExternalMeeting(existinguser_preferences?.copyIsExternalMeeting)
                setCopyColor(existinguser_preferences?.copyColor)
                setBreakColor(existinguser_preferences?.breakColor || '#F7EBF7')
            } catch (e) {
                
            }
        })()
    }, [])

    const saveuser_preferences = async () => {
        try {
            if (maxWorkLoadPercent < 0 || maxWorkLoadPercent > 100) {
                Toast.show({
                    text1: 'Invalid max work load percent',
                    text2: 'Max work load percent must be between 0 and 100',
                    type: 'error',
                })
                return
            }

            if (minNumberOfBreaks < 0) {
                Toast.show({
                    text1: 'Invalid min number of breaks',
                    text2: 'Min number of breaks must be greater than 0',
                    type: 'error',
                })
                return
            }

            if ((minNumberOfBreaks > 0) && (breakLength <= 0)) {
                Toast.show({
                    text1: 'Invalid break length',
                    text2: 'Break length must be greater than 0',
                    type: 'error',
                })
                return
            }

            if (maxNumberOfMeetings < 0) {
                Toast.show({
                    text1: 'Invalid max number of meetings',
                    text2: 'Max number of meetings must be greater than 0',
                    type: 'error',
                })
                return
            }

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
                            ${(startTimes?.length > 0)
                                && !_.isEqual(startTimes, existinguser_preferences?.startTimes) ? 'startTimes,' : ''}
                            ${(endTimes?.length > 0)
                                && !_.isEqual(endTimes, existinguser_preferences?.endTimes) ? 'endTimes,' : ''}
                            ${copyAvailability !== undefined ? 'copyAvailability,' : ''}
                            ${copyTimeBlocking !== undefined ? 'copyTimeBlocking,' : ''}
                            ${copyTimePreference !== undefined ? 'copyTimePreference,' : ''}
                            ${copyReminders !== undefined ? 'copyReminders,' : ''}
                            ${copyPriorityLevel !== undefined ? 'copyPriorityLevel,' : ''}
                            ${copyModifiable !== undefined ? 'copyModifiable,' : ''}
                            ${copyCategories !== undefined ? 'copyCategories,' : ''}
                            ${copyIsBreak !== undefined ? 'copyIsBreak,' : ''}
                            ${maxWorkLoadPercent !== undefined ? 'maxWorkLoadPercent,' : ''}
                            ${maxNumberOfMeetings !== undefined ? 'maxNumberOfMeetings,' : ''}
                            ${minNumberOfBreaks !== undefined ? 'minNumberOfBreaks,' : ''}
                            ${breakLength !== undefined ? 'breakLength,' : ''}
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

            if ((reminders?.length > 0)
                && !_.isEqual(reminders, existinguser_preferences?.reminders)) {
                valuesToUpsert.reminders = reminders
            }

            if ((startTimes?.length > 0)
                && !_.isEqual(startTimes, existinguser_preferences?.startTimes)) {
                valuesToUpsert.startTimes = startTimes
            }

            if ((endTimes?.length > 0)
                && !_.isEqual(endTimes, existinguser_preferences?.endTimes)) {
                valuesToUpsert.endTimes = endTimes
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

            Toast.show({
                text1: 'Success',
                text2: 'User preferences saved',
                type: 'success',
            })

            navigation.goBack()
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
            return <Box ml={{ phone: 's', tablet: 'm' }}/>
        }

        return (
            <Box ml={{ phone: 's', tablet: 'm' }}>
                <Button onPress={goToPrevStep}>
                    Back
                </Button>
            </Box>
        )
    }

    const goToNextStep = () => {
        
        const prevActiveIndex = activeIndex
        const prevCompletedStep = completedStep

        if (prevActiveIndex === 5) {
            return
        }

        let newActiveIndex = prevActiveIndex + 1

        if (!prevCompletedStep || (prevCompletedStep < prevActiveIndex)) {
            const newCompletedStep = prevActiveIndex
            setCompletedStep(newCompletedStep)
        }

        if (newActiveIndex !== prevActiveIndex) {
            setActiveIndex(newActiveIndex)
        }
    }

    const renderNextButton = () => {
        if (activeIndex === 5) {
        return <Box mr={{ phone: 's', tablet: 'm' }}/>
        }

        return (
        <Box mr={{ phone: 's', tablet: 'm' }}>
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

    const renderCurrentStep = () => {
        
        switch (activeIndex) {
            case 0:
                return (
                    <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
                        <EditPreferenceStep1
                            reminders={reminders}
                            setParentReminders={setReminders}
                        />
                        <Box mt={{ phone: 's', tablet: 'm' }} mb={{ phone: 's', tablet: 'm' }} style={{ width: '100%' }} flexDirection="row" justifyContent="space-between" alignItems="center">
                            <Box />
                            {renderNextButton()}
                        </Box>
                    </Box>
                )
            case 1:
                return (
                    <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
                        <EditPreferenceStep2
                            startTimes={startTimes}
                            setParentStartTimes={setStartTimes}
                            endTimes={endTimes}
                            setParentEndTimes={setEndTimes}
                        />
                        <Box mt={{ phone: 's', tablet: 'm' }} mb={{ phone: 's', tablet: 'm' }} style={{ width: '100%' }} flexDirection="row" justifyContent="space-between" alignItems="center">
                            {renderPrevButton()}
                            {renderNextButton()}
                        </Box>
                    </Box>   
                )
            case 2:
                return (
                    <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
                        <EditPreferenceStep3
                            copyAvailability={copyAvailability}
                            setParentCopyAvailability={setCopyAvailability}
                            copyTimeBlocking={copyTimeBlocking}
                            setParentCopyTimeBlocking={setCopyTimeBlocking}
                            copyTimePreference={copyTimePreference}
                            setParentCopyTimePreference={setCopyTimePreference}
                            copyReminders={copyReminders}
                            setParentCopyReminders={setCopyReminders}
                            copyPriorityLevel={copyPriorityLevel}
                            setParentCopyPriorityLevel={setCopyPriorityLevel}
                            copyModifiable={copyModifiable}
                            setParentCopyModifiable={setCopyModifiable}
                        />
                        <Box mt={{ phone: 's', tablet: 'm' }} mb={{ phone: 's', tablet: 'm' }} style={{ width: '100%' }} flexDirection="row" justifyContent="space-between" alignItems="center">
                            {renderPrevButton()}
                            {renderNextButton()}
                        </Box>
                    </Box>
                )
            case 3:
                return (
                    <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
                        <EditPreferenceStep5
                            copyCategories={copyCategories}
                            setParentCopyCategories={setCopyCategories}
                            copyIsBreak={copyIsBreak}
                            setParentCopyIsBreak={setCopyIsBreak}
                            maxWorkLoadPercent={maxWorkLoadPercent}
                            setParentMaxWorkLoadPercent={setMaxWorkLoadPercent}
                            minNumberOfBreaks={minNumberOfBreaks}
                            setParentMinNumberOfBreaks={setMinNumberOfBreaks}
                            breakLength={breakLength}
                            setParentBreakLength={setBreakLength}
                        />
                        <Box mt={{ phone: 's', tablet: 'm' }} mb={{ phone: 's', tablet: 'm' }} style={{ width: '100%' }} flexDirection="row" justifyContent="space-between" alignItems="center">
                            {renderPrevButton()}
                            {renderNextButton()}
                        </Box>
                    </Box>
                )
            case 4:
                return (
                    <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
                        <EditPreferenceStep6
                            backToBackMeetings={backToBackMeetings}
                            setParentBackToBackMeetings={setBackToBackMeetings}
                            copyIsMeeting={copyIsMeeting}
                            setParentCopyIsMeeting={setCopyIsMeeting}
                            copyIsExternalMeeting={copyIsExternalMeeting}
                            setParentCopyIsExternalMeeting={setCopyIsExternalMeeting}
                            copyColor={copyColor}
                            setParentCopyColor={setCopyColor}
                            breakColor={breakColor}
                            setParentBreakColor={setBreakColor}
                        />
                        <Box  mt={{ phone: 's', tablet: 'm' }} mb={{ phone: 's', tablet: 'm' }} style={{ width: '100%' }} flexDirection="row" justifyContent="space-between" alignItems="center">
                            {renderPrevButton()}
                            {renderNextButton()}
                        </Box>
                    </Box>
                )
            case 5:
                return (
                    <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
                        <Box flex={1} justifyContent="center" alignItems="center">
                            <Box style={{ width: '100%' }} m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
                                <Text variant="subheaderNormal">
                                    Save User Preferences
                                </Text>
                            </Box>
                            <Box justifyContent="center" alignItems="center"  m={{ phone: 's', tablet: 'm' }}>
                                <Button onPress={saveuser_preferences}>
                                    Submit
                                </Button>
                            </Box>
                        </Box>
                        <Box  mt={{ phone: 's', tablet: 'm' }} mb={{ phone: 's', tablet: 'm' }} flexDirection="row" justifyContent="flex-start" width="100%">
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
    
    return (
        <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
            <Wizard testID={'uilib.wizard'} activeIndex={activeIndex} onActiveIndexChanged={onActiveIndexChanged}>
                <Wizard.Step state={getStepState(0)} label={'Step 1'} />
                <Wizard.Step state={getStepState(1)} label={'Step 2'} />
                <Wizard.Step state={getStepState(2)} label={'Step 3'} />
                <Wizard.Step state={getStepState(3)} label={'Step 4'} />
                <Wizard.Step state={getStepState(4)} label={'Step 5'} />
                <Wizard.Step state={getStepState(5)} label={'Save Preferences'} />
            </Wizard>
            {renderCurrentStep()}
        </Box>
    )
}


export default UserCalendarPreferences
