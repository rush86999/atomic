import React, {
    useState,
    useEffect,
} from 'react'

import { ApolloClient, gql, NormalizedCacheObject } from '@apollo/client'
import { useToast } from '@chakra-ui/react'

import Box from '@components/common/Box'
import Text from '@components/common/Text'

import Button from '@components/Button'
import Wizard from '@components/Wizard'
import RegularCard from '@components/RegularCard'
import { useAppContext } from '@lib/user-context'
import { useRouter } from 'next/router'
import { ConferenceAppType } from '@lib/dataTypes/MeetingAssistType'
import { UserContactInfoType } from '@lib/dataTypes/UserContactInfoType'
import { UserType } from '@lib/dataTypes/UserType'
import { zoomAvailable } from '@lib/zoom/zoomMeetingHelper'
import { listUserContactInfosGivenUserId } from '@lib/Contact/ContactHelper'
import { googleMeetAvailable } from '@lib/calendarLib/googleCalendarHelper'
import { getUserGivenId } from '@lib/Assist/UserMeetingAssistHelper'
import { getChatMeetingPreferences, upsertChatMeetingPreferencesGivenUserId } from '@lib/OnBoard/OnBoardHelper3'
import { v4 as uuid } from 'uuid'
import { ChatMeetingPreferencesType } from '@lib/dataTypes/ChatMeetingPreferenceType'
import { dayjs } from '@lib/date-utils'
import { SendUpdatesType, TransparencyType, VisibilityType } from '@lib/calendarLib/types'
import CMPWStep1 from './ChatMeetingPreferenceWizard/CMPWStep1'
import CMPWStep2 from './ChatMeetingPreferenceWizard/CMPWStep2'
import CMPWStep3 from './ChatMeetingPreferenceWizard/CMPWStep3'
import CMPWStep4 from './ChatMeetingPreferenceWizard/CMPWStep4'
import CMPWStep5 from './ChatMeetingPreferenceWizard/CMPWStep5';
import _ from 'lodash'
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

function UserChatMeetingPreferences() {
    const [sendUpdates, setSendUpdates] = useState<SendUpdatesType>('all')
    const [guestsCanInviteOthers, setGuestsCanInviteOthers] = useState<boolean>(true)
    const [transparency, setTransparency] = useState<TransparencyType>('opaque')
    const [visibility, setVisibility] = useState<VisibilityType>('default')
    const [useDefaultAlarms, setUseDefaultAlarms] = useState<boolean>(true)
    const [alarms, setAlarms] = useState<number[]>([])
    const [duration, setDuration] = useState<number>(30)
    const [enableConference, setEnableConference] = useState<boolean>(false)
    const [conferenceApp, setConferenceApp] = useState<ConferenceAppType | null | undefined>('google')
    const [zoomMeet, setZoomMeet] = useState<boolean>(false)
    const [googleMeet, setGoogleMeet] = useState<boolean>(false)
    const [isBufferTime, setIsBufferTime] = useState<boolean>(false)
    const [beforeEventMinutes, setBeforeEventMinutes] = useState<number>(0)
    const [afterEventMinutes, setAfterEventMinutes] = useState<number>(0)
    const [anyoneCanAddSelf, setAnyoneCanAddSelf] = useState<boolean>(true)
    const [guestsCanSeeOtherGuests, setGuestsCanSeeOtherGuests] = useState<boolean>(true)
    const [name, setName] = useState<string>('')
    const [user, setUser] = useState<UserType>()
    const [isZoomAvailable, setIsZoomAvailable] = useState<boolean>(false)
    const [isGoogleMeetAvailable, setIsGoogleMeetAvailable] = useState<boolean>(false)
    const [primaryEmail, setPrimaryEmail] = useState<string>('')
    const [id, setId] = useState<string>('')
    const [activeIndex, setActiveIndex] = useState<number>(0)
    const [completedStep, setCompletedStep] = useState<number | undefined>()
    const [chatMeetingPreferences, setChatMeetingPreferences] = useState<ChatMeetingPreferencesType>()
    const [lockAfter, setLockAfter] = useState<boolean>(false)


    const { sub, client } = useAppContext()
    const userId = sub
    console.log(sub, ' sub inside userchatmeetingpreferences')
    const router = useRouter()
    const toast = useToast()


    useEffect(() => {
        (async () => {
        if (!userId || !client) {
            return
        }
        const isAvailable = await zoomAvailable(client, userId)
        if (isAvailable) {
            setIsZoomAvailable(true)
        }
        })()
    }, [client, userId])

    // check if google available
    useEffect(() => {
        (async () => {
        if (!userId || !client) {
            return
        }
        const isAvailable = await googleMeetAvailable(client, userId)
        if (isAvailable) {
            setIsGoogleMeetAvailable(isAvailable)
        }
        })()
    }, [client, userId])

    // get user and update if necessary
    
    // get chat meeting preferences
    useEffect(() => {
        (async () => {
            try {
                if (!userId) {
                    return
                }

                const newId = uuid()

                let oldOrNewChatMeetingPreferences: ChatMeetingPreferencesType = await getChatMeetingPreferences(client, userId)

                if (!oldOrNewChatMeetingPreferences?.id) {
                    oldOrNewChatMeetingPreferences = {
                        id: newId,
                        userId,
                        timezone: dayjs.tz.guess(),
                        enableConference: true,
                        updatedAt: dayjs().format(),
                        createdDate: dayjs().format()
                    }
                    
                    await upsertChatMeetingPreferencesGivenUserId(client, oldOrNewChatMeetingPreferences)
                }

                if (oldOrNewChatMeetingPreferences?.sendUpdates) {
                    setSendUpdates(oldOrNewChatMeetingPreferences?.sendUpdates)
                }

                if (oldOrNewChatMeetingPreferences?.guestsCanInviteOthers !== undefined) {
                    setGuestsCanInviteOthers(oldOrNewChatMeetingPreferences?.guestsCanInviteOthers)
                }

                if (oldOrNewChatMeetingPreferences?.transparency) {
                    setTransparency(oldOrNewChatMeetingPreferences?.transparency)
                }

                if (oldOrNewChatMeetingPreferences?.visibility) {
                    setVisibility(oldOrNewChatMeetingPreferences?.visibility)
                }

                if (oldOrNewChatMeetingPreferences?.useDefaultAlarms !== undefined) {
                    setUseDefaultAlarms(oldOrNewChatMeetingPreferences?.useDefaultAlarms)
                }

                if (oldOrNewChatMeetingPreferences?.reminders) {
                    setAlarms(oldOrNewChatMeetingPreferences?.reminders)
                }

                if (oldOrNewChatMeetingPreferences?.duration) {
                    setDuration(oldOrNewChatMeetingPreferences?.duration)
                }

                if (oldOrNewChatMeetingPreferences?.enableConference !== undefined) {
                    setEnableConference(oldOrNewChatMeetingPreferences?.enableConference)
                }

                if (oldOrNewChatMeetingPreferences?.conferenceApp) {
                    setConferenceApp(oldOrNewChatMeetingPreferences?.conferenceApp)
                    if (oldOrNewChatMeetingPreferences?.conferenceApp === 'zoom') {
                        setZoomMeet(true)
                    } else if (oldOrNewChatMeetingPreferences?.conferenceApp === 'google') {
                        setGoogleMeet(true)
                    }
                }

                if (oldOrNewChatMeetingPreferences?.bufferTime) {
                    setIsBufferTime(true)

                    if (oldOrNewChatMeetingPreferences?.bufferTime?.beforeEvent) {
                        setBeforeEventMinutes(oldOrNewChatMeetingPreferences?.bufferTime?.beforeEvent)
                    }

                    if (oldOrNewChatMeetingPreferences?.bufferTime?.afterEvent) {
                        setAfterEventMinutes(oldOrNewChatMeetingPreferences?.bufferTime?.afterEvent)
                    }
                }

                if (oldOrNewChatMeetingPreferences?.anyoneCanAddSelf !== undefined) {
                    setAnyoneCanAddSelf(oldOrNewChatMeetingPreferences?.anyoneCanAddSelf)
                }

                if (oldOrNewChatMeetingPreferences?.guestsCanSeeOtherGuests !== undefined) {
                    setGuestsCanSeeOtherGuests(oldOrNewChatMeetingPreferences?.guestsCanSeeOtherGuests)
                }

                const oldUser = await getUserGivenId(client, userId)
                setUser(oldUser)

                if (oldOrNewChatMeetingPreferences?.name) {
                    setName(oldOrNewChatMeetingPreferences?.name)
                } else if (oldUser?.name) {
                    setName(oldUser?.name)
                }

                if (oldOrNewChatMeetingPreferences?.primaryEmail) {
                    setPrimaryEmail(oldOrNewChatMeetingPreferences?.primaryEmail)
                } else {
                    const oldDbInfoItems = await listUserContactInfosGivenUserId(client, userId)
                    if (oldDbInfoItems && oldDbInfoItems?.length > 0) {
                        const email = oldDbInfoItems?.find(i => ((!!i?.primary && (i?.type === 'email'))))?.id
                        setPrimaryEmail(email)
                    }
                }

                if (oldOrNewChatMeetingPreferences?.id) {
                    setId(oldOrNewChatMeetingPreferences?.id)
                } else {
                    setId(newId)
                }

                if (oldOrNewChatMeetingPreferences?.lockAfter !== undefined) {
                    setLockAfter(oldOrNewChatMeetingPreferences?.lockAfter ?? true)
                }

                setChatMeetingPreferences(oldOrNewChatMeetingPreferences)

            } catch (e) {
                console.log(e, ' unable to get chat meeting preferences')
            }
        })()
    }, [client, userId])

    const saveChatMeetingPreferences = async () => {
        try {
            const updatedChatMeetingPreferences: ChatMeetingPreferencesType = {
                ...chatMeetingPreferences,
                id,
                userId,
                sendUpdates,
                guestsCanInviteOthers,
                transparency,
                visibility,
                useDefaultAlarms,
                reminders: alarms,
                duration,
                enableConference,
                conferenceApp,
                anyoneCanAddSelf,
                guestsCanSeeOtherGuests,
                name,
                primaryEmail,
                updatedAt: dayjs().format(),
            }

            if (isBufferTime) {
                updatedChatMeetingPreferences.bufferTime = {
                    beforeEvent: beforeEventMinutes,
                    afterEvent: afterEventMinutes,
                }
            }

            await upsertChatMeetingPreferencesGivenUserId(client, _.omit(updatedChatMeetingPreferences, ['__typename']) as ChatMeetingPreferencesType)
            
            toast({
                status: 'success',
                title: 'Meeting Preferences for chat saved',
                description: 'Meeting Preferencest saved successfully',
                duration: 9000,
                isClosable: true,
            })
        } catch (e) {
            console.log(e, ' unable to save chat meeting preferences')
            toast({
                status: 'error',
                title: 'Oops...',
                description: 'Looks like something went wrong',
                duration: 9000,
                isClosable: true,
            })
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
          return <Box pt={{ phone: 'm', tablet: 's' }}/>
        }

        return (
          <Box mr={{ phone: 's', tablet: 'm' }} mb={{ phone: 's', tablet: 'm' }} pt={{ phone: 's', tablet: 'm'}}>
            <Button onClick={goToNextStep}>
              Next
            </Button>
          </Box>
        )
    }

    const renderCurrentStep = () => {

        switch(activeIndex) {
            case 0:
                return (
                    <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
                        <CMPWStep1
                            sendUpdates={sendUpdates}
                            guestsCanInviteOthers={guestsCanInviteOthers}
                            transparency={transparency}
                            visibility={visibility}
                            name={name}
                            setParentSendUpdates={setSendUpdates}
                            setParentGuestsCanInviteOthers={setGuestsCanInviteOthers}
                            setParentTransparency={setTransparency}
                            setParentVisibility={setVisibility}
                            setParentName={setName}
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
                        <CMPWStep2
                            useDefaultAlarms={useDefaultAlarms}
                            alarms={alarms}
                            setParentAlarms={setAlarms}
                            setParentUseDefaultAlarms={setUseDefaultAlarms}
                        />
                        <Box flexDirection="row" justifyContent="space-between" alignItems="center"  style={{ width: '100%'}}>
                            {renderPrevButton()}
                            {renderNextButton()}
                        </Box>
                    </Box>
                )
            case 2:
                return (
                    <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
                        <CMPWStep3
                            isZoomAvailable={isZoomAvailable}
                            isGoogleMeetAvailable={isGoogleMeetAvailable}
                            zoomMeet={zoomMeet}
                            googleMeet={googleMeet}
                            enableConference={enableConference}
                            setParentZoomMeet={setZoomMeet}
                            setParentGoogleMeet={setGoogleMeet}
                            setParentEnableConference={setEnableConference}
                            setParentConferenceApp={setConferenceApp}
                        />
                        <Box flexDirection="row" justifyContent="space-between" alignItems="center"  style={{ width: '100%'}}>
                            {renderPrevButton()}
                            {renderNextButton()}
                        </Box>
                    </Box>
                )
            case 3:
                return (
                    <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
                        <CMPWStep4
                           isBufferTime={isBufferTime}
                           beforeEventMinutes={beforeEventMinutes}
                           afterEventMinutes={afterEventMinutes}
                           setParentIsBufferTime={setIsBufferTime}
                           setParentBeforeEventMinutes={setBeforeEventMinutes}
                           setParentAfterEventMinutes={setAfterEventMinutes}
                        />
                        <Box flexDirection="row" justifyContent="space-between" alignItems="center"  style={{ width: '100%'}}>
                            {renderPrevButton()}
                            {renderNextButton()}
                        </Box>
                    </Box>
                )
            
            case 4:
                return (
                    <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
                        <CMPWStep5
                            anyoneCanAddSelf={anyoneCanAddSelf}
                            guestsCanSeeOtherGuests={guestsCanSeeOtherGuests}
                            primaryEmail={primaryEmail}
                            lockAfter={lockAfter}
                            setParentAnyoneCanAddSelf={setAnyoneCanAddSelf}
                            setParentGuestsCanSeeOtherGuests={setGuestsCanSeeOtherGuests}
                            setParentPrimaryEmail={setPrimaryEmail}
                            setParentLockAfter={setLockAfter}
                        />
                        <Box flexDirection="row" justifyContent="space-between" alignItems="center"  style={{ width: '100%'}}>
                            {renderPrevButton()}
                            {renderNextButton()}
                        </Box>
                    </Box>
                )
            
            case 5:
                return (
                    <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
                        <Box flex={1} style={{ width: '100%' }} p={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center" minHeight="65vh" maxHeight="65vh">
                            <Box p={{ phone: 'm', tablet: 'l'}}>
                                <Text variant="subheaderNormal">
                                    Save Meeting Preferences via Chat
                                </Text>
                            </Box>
                            <Box pt={{ phone: 'm', tablet: 'l' }}>
                                <Button onClick={saveChatMeetingPreferences}>
                                    Save
                                </Button>
                            </Box>
                        </Box>
                        <Box flexDirection="row" justifyContent="space-between" alignItems="center" style={{ width: '100%' }}>
                            {renderPrevButton()}
                            {renderNextButton()}
                            <Box />
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
        <Box flex={1} justifyContent="center" alignItems="center" height="100%" style={{ width: '100%' }}>
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
                        label: 'Last Step',
                    },
                ]}

                completed={completedStep}
                activeIndex={activeIndex}
            />
            {renderCurrentStep()}
        </Box>
    )
}   


export default UserChatMeetingPreferences
