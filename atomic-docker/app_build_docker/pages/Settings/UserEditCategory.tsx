import React, {
  useState,
  useEffect,
  Dispatch,
  SetStateAction,
} from 'react'

import Wizard from '@components/Wizard'
import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { useToast } from '@chakra-ui/react'
import { colorsPalette as Colors } from '@lib/theme/colorsPalette'

import { v4 as uuid } from 'uuid'


import Box from '@components/common/Box'
import Text from '@components/common/Text'
import Button from '@components/Button'


import { DefaultTimeBlockingType, DefaultTimePreferenceTypes } from '@lib/dataTypes/CategoryType'
import { DefaultRemindersType } from '@lib/dataTypes/CategoryType'
import _ from 'lodash'

import EditCategoryStep1 from '@pages/Settings/EditCategoryWizard/EditCategoryStep1'
import EditCategoryStep1a from '@pages/Settings/EditCategoryWizard/EditCategoryStep1a'
import EditCategoryStep1b from '@pages/Settings/EditCategoryWizard/EditCategoryStep1b'
import EditCategoryStep2 from '@pages/Settings/EditCategoryWizard/EditCategoryStep2'
import EditCategoryStep3 from '@pages/Settings/EditCategoryWizard/EditCategoryStep3'
import EditCategoryStep4 from '@pages/Settings/EditCategoryWizard/EditCategoryStep4'
import EditCategoryStep5 from '@pages/Settings/EditCategoryWizard/EditCategoryStep5'
import EditCategoryStep5a from '@pages/Settings/EditCategoryWizard/EditCategoryStep5a'
import EditCategoryStep6 from '@pages/Settings/EditCategoryWizard/EditCategoryStep6'
import RegularCard from '@components/RegularCard'
import { getCategoryWithId, updateCategoryHelper } from '@lib/Category/CategoryHelper'

import { useAppContext } from '@lib/user-context'

import { useRouter } from 'next/router'

const INITIAL_COLOR = Colors.blue30

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

function UserEditCategory() {
    const [copyAvailability, setCopyAvailability] = useState<boolean>(false)
    const [copyTimeBlocking, setCopyTimeBlocking] = useState<boolean>(false)
    const [copyTimePreference, setCopyTimePreference] = useState<boolean>(false)
    const [copyReminders, setCopyReminders] = useState<boolean>(false)
    const [copyPriorityLevel, setCopyPriorityLevel] = useState<boolean>(false)
    const [copyModifiable, setCopyModifiable] = useState<boolean>(false)
    const [defaultAvailability, setDefaultAvailability] = useState<boolean>(false)
    const [defaultTimeBlocking, setDefaultTimeBlocking] = useState<DefaultTimeBlockingType>()
    const [defaultTimePreference, setDefaultTimePreference] = useState<DefaultTimePreferenceTypes>()
    const [defaultReminders, setDefaultReminders] = useState<number[]>()
    const [defaultPriorityLevel, setDefaultPriorityLevel] = useState<number>()
    const [defaultModifiable, setDefaultModifiable] = useState<boolean>(false)
    const [copyIsBreak, setCopyIsBreak] = useState<boolean>(false)
    const [defaultIsBreak, setDefaultIsBreak] = useState<boolean>(false)
    const [color, setColor] = useState<string>(INITIAL_COLOR)
    const [copyIsMeeting, setCopyIsMeeting] = useState<boolean>(false)
    const [copyIsExternalMeeting, setCopyIsExternalMeeting] = useState<boolean>(false)
    const [defaultIsMeeting, setDefaultIsMeeting] = useState<boolean>(false)
    const [defaultIsExternalMeeting, setDefaultIsExternalMeeting] = useState<boolean>(false)
    const [defaultMeetingModifiable, setDefaultMeetingModifiable] = useState<boolean>(false)
    const [defaultExternalMeetingModifiable, setDefaultExternalMeetingModifiable] = useState<boolean>(false)

    const [name, setName] = useState<string>('')
    const [activeIndex, setActiveIndex] = useState<number>(0)
    const [completedStep, setCompletedStep] = useState<number | undefined>()

    const router = useRouter()
    const { sub, client } = useAppContext()
    const categoryId = router.query?.categoryId as string
    const toast = useToast()
    
    useEffect(() => {
        if (categoryId) {
            (async () => {
                const category = await getCategoryWithId(client, categoryId)
                console.log(category, 'category inside useEffect of UserEditCategory')
                if (category) {
                    setName(category.name)
                    setColor(category.color)
                    setCopyAvailability(category.copyAvailability)
                    setCopyTimeBlocking(category.copyTimeBlocking)
                    setCopyTimePreference(category.copyTimePreference)
                    setCopyReminders(category.copyReminders)
                    setCopyPriorityLevel(category.copyPriorityLevel)
                    setCopyModifiable(category.copyModifiable)
                    setDefaultAvailability(category.defaultAvailability)
                    setDefaultTimeBlocking(category.defaultTimeBlocking)
                    setDefaultTimePreference(category.defaultTimePreference)
                    setDefaultReminders(category.defaultReminders)
                    setDefaultPriorityLevel(category.defaultPriorityLevel)
                    setDefaultModifiable(category.defaultModifiable)
                    setCopyIsBreak(category.copyIsBreak)
                    setDefaultIsBreak(category.defaultIsBreak)
                    setCopyIsMeeting(category.copyIsMeeting)
                    setCopyIsExternalMeeting(category.copyIsExternalMeeting)
                    setDefaultIsMeeting(category.defaultIsMeeting)
                    setDefaultIsExternalMeeting(category.defaultIsExternalMeeting)
                    setDefaultMeetingModifiable(category.defaultMeetingModifiable)
                    setDefaultExternalMeetingModifiable(category.defaultExternalMeetingModifiable)
                }
            })()
        }
    }, [categoryId, client])
    

    const updateCategory = async () => {
        try {
            if (!categoryId || !client) {
                return
            }
            const existingCategory = await getCategoryWithId(client, categoryId)
            if (!existingCategory) {
                toast({
                    status: 'error',
                    title: 'Error',
                    description: 'Error updating tag',
                    duration: 9000,
                    isClosable: true,
                })
                return
            }
            console.log(categoryId, name, copyAvailability, copyTimeBlocking,
            copyTimePreference, copyReminders, copyPriorityLevel, copyModifiable, defaultAvailability,
            defaultTimeBlocking, defaultTimePreference, defaultReminders, defaultPriorityLevel, 
            defaultModifiable, copyIsBreak, defaultIsBreak, copyIsMeeting, copyIsExternalMeeting,
            color,
                defaultIsMeeting,
                defaultIsExternalMeeting,
                defaultMeetingModifiable,
                defaultExternalMeetingModifiable, ` categoryId, name, copyAvailability, copyTimeBlocking,
            copyTimePreference, copyReminders, copyPriorityLevel, copyModifiable, defaultAvailability,
            defaultTimeBlocking, defaultTimePreference, defaultReminders, defaultPriorityLevel, 
            defaultModifiable, copyIsBreak, defaultIsBreak, copyIsMeeting, copyIsExternalMeeting,
            color,
                defaultIsMeeting,
                defaultIsExternalMeeting,
                defaultMeetingModifiable,
                defaultExternalMeetingModifiable, inside updateCategory for UserEditCategory`)
            const result = await updateCategoryHelper(
                client, 
                categoryId,
                name,
                copyAvailability,
                copyTimeBlocking,
                copyTimePreference,
                copyReminders,
                copyPriorityLevel,
                copyModifiable,
                defaultAvailability,
                defaultTimeBlocking,
                defaultTimePreference,
                defaultReminders,
                defaultPriorityLevel,
                defaultModifiable,
                copyIsBreak,
                defaultIsBreak,
                color,
                copyIsMeeting,
                copyIsExternalMeeting,
                defaultIsMeeting,
                defaultIsExternalMeeting,
                defaultMeetingModifiable,
                defaultExternalMeetingModifiable,
            )

            console.log(result, ' result after update for category')
            toast({
                title: 'Tag updated',
                description: `${name} updated successfully`,
                status: 'success',
                duration: 9000,
                isClosable: true,
            })
            router.push({ pathname: '/Settings/UserEditCategories', query: { isUpdate: uuid() }})
        } catch (e) {
            console.log(e, ' error for updateCategory inside UserEditCategory')
            toast({
                status: 'error',
                title: 'Error',
                description: 'Error updating tag',
                duration: 9000,
                isClosable: true,
            })
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
            return <Box pt={{ phone: 'm', tablet: 's' }} />
        }

        return (
            <Box ml={{ phone: 's', tablet: 'm' }} mb={{ phone: 's', tablet: 'm' }}>
                <Button onClick={goToPrevStep}>
                    Back
                </Button>
            </Box>
        )
    }

    const goToNextStep = () => {
        
        const prevActiveIndex = activeIndex
        const prevCompletedStep = completedStep

        if (prevActiveIndex === 10) {
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
        if (activeIndex === 9) {
            return <Box pt={{ phone: 'm', tablet: 's' }} mb={{ phone: 's', tablet: 'm' }} />
        }

        return (
            <Box mr={{ phone: 's', tablet: 'm' }} mb={{ phone: 's', tablet: 'm' }}>
                <Button onClick={goToNextStep}>
                    Next
                </Button>
            </Box>
        )
    }

    const renderCurrentStep = () => {
        
        switch (activeIndex) {
            case 0:
                return (
                    <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
                        <EditCategoryStep1
                            name={name}
                            setParentName={setName}
                            copyAvailability={copyAvailability}
                            setParentCopyAvailability={setCopyAvailability}
                            copyTimeBlocking={copyTimeBlocking}
                            setParentCopyTimeBlocking={setCopyTimeBlocking}
                        />
                        <Box style={{ width: '100%' }} flexDirection="row" justifyContent="space-between" alignItems="center">
                                <Box />
                                {renderNextButton()}
                        </Box>
                    </Box>
                )
            case 1:
                return (
                    <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
                        <EditCategoryStep1a
                            copyTimePreference={copyTimePreference}
                            setParentCopyTimePreference={setCopyTimePreference}
                            copyReminders={copyReminders}
                            setParentCopyReminders={setCopyReminders}
                            copyPriorityLevel={copyPriorityLevel}
                            setParentCopyPriorityLevel={setCopyPriorityLevel}
                        />
                        <Box style={{ width: '100%' }} flexDirection="row" justifyContent="space-between" alignItems="center">
                            {renderPrevButton()}
                            {renderNextButton()}
                        </Box>
                    </Box>

                )
            case 2: 
                return (
                    <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
                        <EditCategoryStep1b
                            copyModifiable={copyModifiable}
                            setParentCopyModifiable={setCopyModifiable}
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
                        <EditCategoryStep2
                            defaultAvailability={defaultAvailability}
                            setParentDefaultAvailability={setDefaultAvailability}
                            defaultTimeBlocking={defaultTimeBlocking}
                            setParentDefaultTimeBlocking={setDefaultTimeBlocking}
                        />
                        <Box style={{ width: '100%' }} flexDirection="row" justifyContent="space-between" alignItems="center">
                            {renderPrevButton()}
                            {renderNextButton()}
                        </Box>
                    </Box>
                )
            case 4:
                return (
                    <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
                        <EditCategoryStep3
                            defaultPriorityLevel={defaultPriorityLevel}
                            setParentDefaultPriorityLevel={setDefaultPriorityLevel}
                            defaultModifiable={defaultModifiable}
                            setParentDefaultModifiable={setDefaultModifiable}
                        />
                        <Box style={{ width: '100%' }} flexDirection="row" justifyContent="space-between" alignItems="center">
                            {renderPrevButton()}
                            {renderNextButton()}
                        </Box>
                    </Box>
                )
            case 5:
                return (
                    <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
                        <EditCategoryStep4
                            defaultTimePreferences={defaultTimePreference}
                            setParentDefaultTimePreference={setDefaultTimePreference}
                        />
                        <Box style={{ width: '100%' }} flexDirection="row" justifyContent="space-between" alignItems="center">
                            {renderPrevButton()}
                            {renderNextButton()}
                        </Box>
                    </Box>
                )
            case 6:
                return (
                    <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
                        <EditCategoryStep5
                            defaultReminders={defaultReminders as DefaultRemindersType}
                            setParentDefaultReminders={setDefaultReminders as Dispatch<SetStateAction<DefaultRemindersType>>}
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
                        <EditCategoryStep5a
                            copyIsBreak={copyIsBreak}
                            setParentCopyIsBreak={setCopyIsBreak}
                            defaultIsBreak={defaultIsBreak}
                            setParentDefaultIsBreak={setDefaultIsBreak}
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
                        <EditCategoryStep6
                            color={color}
                            setParentColor={setColor}
                            copyIsMeeting={copyIsMeeting}
                            setParentCopyIsMeeting={setCopyIsMeeting}
                            copyIsExternalMeeting={copyIsExternalMeeting}
                            setParentCopyIsExternalMeeting={setCopyIsExternalMeeting}
                            defaultIsMeeting={defaultIsMeeting}
                            setParentDefaultIsMeeting={setDefaultIsMeeting}
                            defaultIsExternalMeeting={defaultIsExternalMeeting}
                            setParentDefaultIsExternalMeeting={setDefaultIsExternalMeeting}
                            defaultMeetingModifiable={defaultMeetingModifiable}
                            setParentDefaultMeetingModifiable={setDefaultMeetingModifiable}
                            defaultExternalMeetingModifiable={defaultExternalMeetingModifiable}
                            setParentDefaultExternalMeetingModifiable={setDefaultExternalMeetingModifiable}
                        />
                        <Box style={{ width: '100%' }} flexDirection="row" justifyContent="space-between" alignItems="center">
                            {renderPrevButton()}
                            {renderNextButton()}
                        </Box>
                    </Box>
                )
            case 9:
                return (
                    <Box style={{ width: '100%' }} alignItems="center" justifyContent="center">
                        <Box style={{ width: '100%' }} alignItems="center" justifyContent="center" minHeight="70vh">
                            <Box style={{ width: '100%' }} p={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
                                <Text variant="subheaderNormal">
                                    {name}
                                </Text>
                            </Box>
                            <Box justifyContent="center" alignItems="center">
                                <Box pt={{ phone: 'm', tablet: 's' }}>
                                    <Button onClick={updateCategory}>
                                        Update
                                    </Button>
                                </Box>
                            </Box>
                        </Box>
                        <Box flexDirection="row" justifyContent="flex-start" width="100%">
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
                        label: 'Step 6',
                    },
                    {
                        index: 6,
                        label: 'Step 7',
                    },
                     {
                        index: 7,
                        label: 'Step 8',
                    },
                     {
                        index: 8,
                        label: 'Step 9',
                    },
                    {
                        index: 9,
                        label: name,
                    },
                ]}

                completed={completedStep}
                activeIndex={activeIndex}
            />
            {renderCurrentStep()}
        </Box>
    )
}

export default UserEditCategory
