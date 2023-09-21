import React, {
  useState,
  useEffect,
} from 'react'

import { gql } from '@apollo/client'
import { useToast } from '@chakra-ui/react'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import { EndTimeType, StartTimeType } from '@lib/dataTypes/User_PreferenceType'

import EditPreferenceStep1 from '@pages/Settings/UserPreferenceWizard/EditPreferenceStep1'
import EditPreferenceStep2 from '@pages/Settings/UserPreferenceWizard/EditPreferenceStep2'
import EditPreferenceStep3 from '@pages/Settings/UserPreferenceWizard/EditPreferenceStep3'
import EditPreferenceStep5 from '@pages/Settings/UserPreferenceWizard/EditPreferenceStep5'
import EditPreferenceStep6 from '@pages/Settings/UserPreferenceWizard/EditPreferenceStep6'
import _ from 'lodash'
import Button from '@components/Button'
import Wizard from '@components/Wizard'
import RegularCard from '@components/RegularCard'
import { getUserPreference } from '@lib/OnBoard/OnBoardHelper2'
import { useAppContext } from '@lib/user-context'

import { useRouter } from 'next/router'

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

import { NextApiRequest, NextApiResponse } from 'next';
import supertokensNode from 'supertokens-node'
import { backendConfig } from '@config/backendConfig'
import Session from 'supertokens-node/recipe/session'

export async function getServerSideProps({ req, res }: { req: NextApiRequest, res: NextApiResponse }) {
    // Notice how the server uses `API` from `withSSRContext`, instead of the top-level `API`.
    // const SSR = withSSRContext({ req })
    // this runs on the backend, so we must call init on supertokens-node SDK
    supertokensNode.init(backendConfig())
    let session
    try {
        session = await Session.getSession(req, res, {
            overrideGlobalClaimValidators: async function () {
                return []
            },
        })
    } catch (err: any) {
        if (err.type === Session.Error.TRY_REFRESH_TOKEN) {
            return { props: { fromSupertokens: 'needs-refresh' } }
        } else if (err.type === Session.Error.UNAUTHORISED) {
            // this will force the frontend to try and refresh which will fail
            // clearing all cookies and redirecting the user to the login screen.
            return { props: { fromSupertokens: 'needs-refresh' } }
        }
        throw err
    }

    if (!session?.getUserId()) {
        return {
            redirect: {
                destination: '/User/Login/UserLogin',
                permanent: false,
            },
        }
    }

    return {
        props: {
        sub: session.getUserId(),
        }
    }
}

function UserCalendarPreferences() {
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

    const router = useRouter()
    const { sub, client } = useAppContext()
    const userId = sub
    const toast = useToast()
    
    // get user preferences
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
                console.log(e, ' error in useEffect for UserCalendarPreferences')
            }
        })()
    }, [client, userId])

    // save user preferences
    const saveuser_preferences = async () => {
        try {
            // validate
            if (maxWorkLoadPercent < 0 || maxWorkLoadPercent > 100) {
                toast({
                    title: 'Invalid max work load percent',
                    description: 'Max work load percent must be between 0 and 100',
                    status: 'error',
                    duration: 9000,
                    isClosable: true,
                })
                return
            }

            if (minNumberOfBreaks < 0) {
                toast({
                    title: 'Invalid min number of breaks',
                    description: 'Min number of breaks must be greater than 0',
                    status: 'error',
                    duration: 9000,
                    isClosable: true,
                })
                return
            }

            if ((minNumberOfBreaks > 0) && (breakLength <= 0)) {
                toast({
                    title: 'Invalid break length',
                    description: 'Break length must be greater than 0',
                    status: 'error',
                    duration: 9000,
                    isClosable: true,
                })
                return
            }

            if (maxNumberOfMeetings < 0) {
                toast({
                    title: 'Invalid max number of meetings',
                    description: 'Max number of meetings must be greater than 0',
                    status: 'error',
                    duration: 9000,
                    isClosable: true,
                })
                return
            }

            // save
            const existinguser_preferences = await getUserPreference(client, userId)
            if (!existinguser_preferences) {
                toast({
                    title: 'Error',
                    description: 'Error saving user preferences',
                    status: 'error',
                    duration: 9000,
                    isClosable: true,
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

            console.log(valuesToUpsert, ' valuesToUpsert inside upsertUserPreference for userId: ', userId, 'part of UserCalendarPreferences')

            await client.mutate({
                mutation: upsertUserPreferenceMutation,
                variables: {
                    userPreference: valuesToUpsert,
                },
            })

            toast({
                title: 'Success',
                description: 'User preferences saved',
                status: 'success',
                duration: 9000,
                isClosable: true,
            })

            router.back()
        } catch (e) {
            console.log(e, ' error in saveuser_preferences')
        }
    }

    
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
                <Button onClick={goToPrevStep}>
                    Back
                </Button>
            </Box>
        )
    }

    const goToNextStep = () => {
        /*
            0 - EditPreferenceStep1
            1 - EditPreferenceStep2
            2 - EditPreferenceStep3
            3 - EditPreferenceStep4
            4 - EditPreferenceStep5
        */
        
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
            <Button onClick={goToNextStep}>
            Next
            </Button>
        </Box>
        )
    }

    const renderCurrentStep = () => {
        /*
            0 - EditPreferenceStep1
            1 - EditPreferenceStep2
            2 - EditPreferenceStep3
            3 - EditPreferenceStep4
            4 - EditPreferenceStep5
        */
        
        switch (activeIndex) {
            case 0:
                return (
                    <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
                        <EditPreferenceStep1
                            reminders={reminders}
                            setParentReminders={setReminders}
                        />
                        <Box pt={{ phone: 'm', tablet: 's' }} mb={{ phone: 's', tablet: 'm' }} style={{ width: '100%' }} flexDirection="row" justifyContent="space-between" alignItems="center">
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
                        <Box pt={{ phone: 'm', tablet: 's' }} mb={{ phone: 's', tablet: 'm' }} style={{ width: '100%' }} flexDirection="row" justifyContent="space-between" alignItems="center">
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
                        <Box pt={{ phone: 'm', tablet: 's' }} mb={{ phone: 's', tablet: 'm' }} style={{ width: '100%' }} flexDirection="row" justifyContent="space-between" alignItems="center">
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
                        <Box pt={{ phone: 'm', tablet: 's' }} mb={{ phone: 's', tablet: 'm' }} style={{ width: '100%' }} flexDirection="row" justifyContent="space-between" alignItems="center">
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
                        <Box  pt={{ phone: 'm', tablet: 's' }} mb={{ phone: 's', tablet: 'm' }} style={{ width: '100%' }} flexDirection="row" justifyContent="space-between" alignItems="center">
                            {renderPrevButton()}
                            {renderNextButton()}
                        </Box>
                    </Box>
                )
            case 5:
                return (
                    <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
                        <Box justifyContent="center" alignItems="center" minHeight="60vh">
                            <Box style={{ width: '100%' }} p={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
                                <Text variant="subheaderNormal">
                                    Save User Preferences
                                </Text>
                            </Box>
                            <Box justifyContent="center" alignItems="center"  p={{ phone: 's', tablet: 'm' }}>
                                <Button onClick={saveuser_preferences}>
                                    Submit
                                </Button>
                            </Box>
                        </Box>
                        <Box  pt={{ phone: 'm', tablet: 's' }} mb={{ phone: 's', tablet: 'm' }} flexDirection="row" justifyContent="flex-start" width="100%">
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
            <Wizard
                items={[
                    {
                        index: 0,
                        label: 'Step 1',
                    },
                    {
                        index: 1,
                        label: 'Step 2',
                    },
                    {
                        index: 2,
                        label: 'Step 3',
                    },
                    {
                        index: 3,
                        label: 'Step 4',
                    },
                     {
                        index: 4,
                        label: 'Step 5',
                    },
                     {
                        index: 5,
                        label: 'Save Preferences',
                    },
                ]}

                completed={completedStep}
                activeIndex={activeIndex}
            />
            {renderCurrentStep()}
        </Box>
    )
}


export default UserCalendarPreferences
