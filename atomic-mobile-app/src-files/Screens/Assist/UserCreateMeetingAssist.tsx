import React, { useState, useEffect } from 'react'
import { Wizard } from 'react-native-ui-lib'
import { useNavigation, RouteProp } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import Toast from 'react-native-toast-message'
import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { dayjs, RNLocalize } from '@app/date-utils'
import { v4 as uuid } from 'uuid'
import Box from '@components/common/Box'
import Button from '@components/Button'

import {
    ConferenceAppType,
  MeetingAssistType
} from '@app/dataTypes/MeetingAssistType'

import {
  MeetingAssistAttendeeType
} from '@app/dataTypes/MeetingAssistAttendeeType'

import {
  MeetingAssistInviteType
} from '@app/dataTypes/MeetingAssistInviteType'


import {
  zoomAvailable
} from '@app/zoom/zoomMeetingHelper'

import {
  googleMeetAvailable,
} from '@app/calendar/googleCalendarHelper'

import getGlobalPrimaryCalendar from '@app/apollo/gql/getGlobalPrimaryCalendar'
import { CalendarType } from '@app/dataTypes/CalendarType'
import { convertInviteeTypeToInviteEmailRecipients, getUserGivenId, insertMeetingAssistAttendee, sendBulkMeetingInviteEmail, sendMeetingInfoToHostEmail, updateUserNameGivenId, upsertMeetingAssistInviteMany, upsertMeetingAssistOne } from '@screens/Assist/UserMeetingAssistHelper'
import { ContactType } from '@app/dataTypes/ContactType'
import { UserType } from '@app/dataTypes/UserType'
import { RecurrenceFrequencyType } from '@screens/Calendar/types'
import CreateMeetingAssistBaseStep from '@screens/Assist/CreateMeetingAssistWizard/CreateMeetingAssistBaseStep'
import CreateMeetingAssistVirtualMeet from '@screens/Assist/CreateMeetingAssistWizard/CreateMeetingAssistVirtualMeet'
import CreateMeetingAssistBaseStep3 from '@screens/Assist/CreateMeetingAssistWizard/CreateMeetingAssistBaseStep3'
import CreateMeetingAssistAlarms from '@screens/Assist/CreateMeetingAssistWizard/CreateMeetingAssistAlarms'
import CreateMeetingAssistBaseStep5 from '@screens/Assist/CreateMeetingAssistWizard/CreateMeetingAssistBaseStep5'
import CreateMeetingAssistBaseStep6 from '@screens/Assist/CreateMeetingAssistWizard/CreateMeetingAssistBaseStep6'
import CreateMeetingAssistBaseStep7 from '@screens/Assist/CreateMeetingAssistWizard/CreateMeetingAssistBaseStep7'
import CreateMeetingAssistRecurStepAlt from '@screens/Assist/CreateMeetingAssistWizard/CreateMeetingAssistRecurStepAlt'
import CreateMeetingAssistInvitees from '@screens/Assist/CreateMeetingAssistWizard/CreateMeetingAssistInvitees'
import Text from '@components/common/Text'
import RegularCard from '@components/RegularCard'
import { UserContactInfoType } from '@dataTypes/UserContactInfoType'
import { listUserContactInfosGivenUserId } from '@screens/Contact/ContactHelper'

type RootStackNavigationParamList = {
    UserCreateMeetingAssist: undefined,
    UserViewCalendar: undefined,
}

type UserCreateMeetingAssistNavigationProp = StackNavigationProp<
  RootStackNavigationParamList,
  'UserCreateMeetingAssist'
>

type RootStackEventParamList = {
  UserCreateMeetingAssist: undefined,
}

type UserCreateMeetingAssistRouteProp = RouteProp<
  RootStackEventParamList,
  'UserCreateMeetingAssist'
>

type Props = {
  sub: string,
  route: UserCreateMeetingAssistRouteProp,
  client: ApolloClient<NormalizedCacheObject>,
}

function UserCreateMeetingAssist(props: Props) {
    const [notes, setNotes] = useState<string>()
    const [summary, setSummary] = useState<string>()
    const [windowStartDate, setWindowStartDate] = useState<Date>(new Date())
    const [windowEndDate, setWindowEndDate] = useState<Date>(new Date())
    const [location, setLocation] = useState<string>()
    const [isZoomAvailable, setIsZoomAvailable] = useState<boolean>(false)
    const [isGoogleMeetAvailable, setIsGoogleMeetAvailable] = useState<boolean>(false)
    const [zoomMeet, setZoomMeet] = useState<boolean>(false)
    const [googleMeet, setGoogleMeet] = useState<boolean>(false)
    const [sendUpdates, setSendUpdates] = useState<'all' | 'externalOnly'>('all')
    const [guestsCanInviteOthers, setGuestsCanInviteOthers] = useState<boolean>(true)
    const [transparency, setTransparency] = useState<'opaque' | 'transparent'>('opaque')
    const [visibility, setVisibility] = useState<'default' | 'public' | 'private'>('default')
    const [useDefaultAlarms, setUseDefaultAlarms] = useState<boolean>(true)
    const [alarms, setAlarms] = useState<number[]>([])
    const [cancelIfAnyRefuse, setCancelIfAnyRefuse] = useState<boolean>(false)
    const [enableAttendeePreferences, setEnableAttendeePreferences] = useState<boolean>(true)
    const [attendeeCanModify, setAttendeeCanModify] = useState<boolean>(false)
    const [expireDate, setExpireDate] = useState<Date>(dayjs().add(6, 'd').toDate())
    const [duration, setDuration] = useState<number>(30)
    const [enableConference, setEnableConference] = useState<boolean>(false)
    const [conferenceApp, setConferenceApp] = useState<ConferenceAppType>()
    const [isBufferTime, setIsBufferTime] = useState<boolean>(false)
    const [beforeEventMinutes, setBeforeEventMinutes] = useState<number>(0)
    const [afterEventMinutes, setAfterEventMinutes] = useState<number>(0)
    const [anyoneCanAddSelf, setAnyoneCanAddSelf] = useState<boolean>(true)
    const [guestsCanSeeOtherGuests, setGuestsCanSeeOtherGuests] = useState<boolean>(true)
    const [minThresholdCount, setMinThresholdCount] = useState<number>(2)
    const [guaranteeAvailability, setGuaranteeAvailability] = useState<boolean>(false)
    const [isRecurring, setIsRecurring] = useState<boolean>(false)
    const [frequency, setFrequency] = useState<RecurrenceFrequencyType>('daily')
    const [interval, setInterval] = useState<number>(1)
    const [until, setUntil] = useState<Date>(new Date())
    const [calendar, setCalendar] = useState<CalendarType>()
    const [searchName, setSearchName] = useState<string>('')
    const [contactResults, setContactResults] = useState<ContactType[]>()
    const [invitees, setInvitees] = useState<MeetingAssistInviteType[]>([])
    const [activeIndex, setActiveIndex] = useState<number>(0)
    const [completedStep, setCompletedStep] = useState<number | undefined>()
    const [hostName, setHostName] = useState<string>('')
    const [user, setUser] = useState<UserType>()
    const [meetingId, setMeetingId] = useState<string>(uuid())
    const [userInfoItems, setUserInfoItems] = useState<UserContactInfoType[]>()
    
    const userId = props?.sub
    const client = props?.client
    const navigation = useNavigation<UserCreateMeetingAssistNavigationProp>()

    useEffect(() => {
        (async () => {
            try {
                const oldDbInfoItems = await listUserContactInfosGivenUserId(client, userId)
                if (oldDbInfoItems?.length > 0) {
                    setUserInfoItems(oldDbInfoItems)
                }
            } catch (e) {
                
            }
        })()
    }, [])

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

    useEffect(() => {
        (async () => {  
        if (!userId || !client) {
            return
        }
        const result = (await client.query<{ Calendar: CalendarType[] }>({
            query: getGlobalPrimaryCalendar, 
            variables: {
            userId,
            },
            fetchPolicy: 'no-cache',
        })).data?.Calendar?.[0]
        
        
        if (!result?.id) {
            
            Toast.show({
                type: 'error',
                text1: 'Forgot to set Primary Calendar',
                text2: 'Please go to Settings to Set Primary Calendar. This will not work otherwise.'
            })
            return
        }
        setCalendar(result)
        })()
    }, [client, userId])

    useEffect(() => {
        (async () => {
            try {
                const oldUser = await getUserGivenId(client, userId)
                setUser(oldUser)
                if (oldUser?.name) {
                    setHostName(oldUser?.name)
                }
            } catch (e) {
                
            }
        })()
    }, [client, userId])

    const createMeetingAssistInvitees = async () => {
        try {
            
            await upsertMeetingAssistInviteMany(client, invitees)
        } catch (e) {
            
        }
    }

    const createHostAttendee = async (
        meetingId: string,
    ) => {
        try {
            
            if (!userInfoItems || !user) {
                
                Toast.show({
                    type: 'error',
                    text1: 'Oops...',
                    text2: 'Something went wrong, please let us know so we can fix it',
                })
                return
            }

            const attendeeId = uuid()

            const primaryInfoItem = userInfoItems?.find(u => (u.primary && (u.type === 'email')))

            const hostAttendee: MeetingAssistAttendeeType = {
                id: attendeeId,
                name: hostName || primaryInfoItem?.name || user?.name,
                hostId: userId,
                userId,
                emails: [{ primary: true, value: primaryInfoItem?.id || user?.email, type: 'email', displayName: primaryInfoItem?.name || user?.name }],
                meetingId,
                createdDate: dayjs().format(),
                timezone: RNLocalize.getTimeZone(),
                updatedAt: dayjs().format(),
                externalAttendee: false,
                primaryEmail: primaryInfoItem?.id || user?.email,
            }

            await insertMeetingAssistAttendee(client, hostAttendee)

            return attendeeId
            
        } catch (e) {
            
        }
    }

    const createSingleMeetingAssist = async () => {
        try {
            const meetingAssist: MeetingAssistType = {
                id: meetingId,
                userId,
                summary,
                notes,
                windowStartDate: dayjs(windowStartDate).format(),
                windowEndDate: dayjs(windowEndDate).format(),
                timezone: RNLocalize.getTimeZone(),
                location: { title: location },
                priority: 1,
                enableConference,
                conferenceApp,
                sendUpdates,
                guestsCanInviteOthers,
                transparency,
                visibility,
                createdDate: dayjs().format(),
                updatedAt: dayjs().format(),
                useDefaultAlarms,
                reminders: alarms,
                cancelIfAnyRefuse,
                enableAttendeePreferences,
                attendeeCanModify,
                expireDate: dayjs(expireDate).format(),
                duration,
                calendarId: calendar?.id,
                bufferTime: isBufferTime ? {
                    beforeEvent: beforeEventMinutes,
                    afterEvent: afterEventMinutes,
                } : undefined,
                anyoneCanAddSelf,
                guestsCanSeeOtherGuests,
                minThresholdCount,
                guaranteeAvailability,
                attendeeRespondedCount: 1,
                attendeeCount: 1,
                cancelled: false,
                frequency,
                interval,
                until: dayjs(until).format(),
                originalMeetingId: isRecurring ? meetingId : undefined,
            }

            await upsertMeetingAssistOne(
                client,
                meetingAssist,
            )


            await createHostAttendee(meetingId)

            await createMeetingAssistInvitees()

            const inviteeEmails = convertInviteeTypeToInviteEmailRecipients(invitees, meetingId)

            await sendMeetingInfoToHostEmail(inviteeEmails, user?.email, hostName || user?.name, summary, notes, dayjs(windowStartDate).format(), dayjs(windowEndDate).format(), RNLocalize.getTimeZone())

            const filteredInviteeEmails = inviteeEmails?.filter(i => !!(i?.email))

            await sendBulkMeetingInviteEmail(filteredInviteeEmails, user?.email, hostName || user?.name)

            if (hostName && (user?.name !== hostName)) {
                await updateUserNameGivenId(
                    client,
                    userId,
                    hostName
                )
            }

        } catch (e) {
            
        }
    }

    const createMeetingAssist = async () => {
        try {
            if (!(invitees?.length > 0)) {
                Toast.show({
                    type: 'error',
                    text1: 'No invitees set',
                    text2: 'Please add at least 1 invitee',
                })
            }

            await createSingleMeetingAssist()

            Toast.show({
                type: 'success',
                text1: 'Meeting Assist Created',
                text2: 'Meeting Assist created successfully',
                visibilityTime: 3000,
            })

            navigation.navigate('UserViewCalendar')
        
        } catch (e) {
            
        }
    }

    const onActiveIndexChanged = (index: number) => setActiveIndex(index)

    const goToPrevStep = () => {
        const prevActiveIndex = activeIndex
        const newActiveIndex = prevActiveIndex === 0 ? 0 : prevActiveIndex - 1

        if ((activeIndex === 8) && !isRecurring) {
            return setActiveIndex(6)
        }

        setActiveIndex(newActiveIndex)
    }
    
    const renderPrevButton = () => {
        if (activeIndex === 0) {
            return <Box mt={{ phone: 's', tablet: 'm' }}/>
        }

        return (
            <Box ml={{ phone: 's', tablet: 'm' }} mb={{ phone: 's', tablet: 'm' }} mt={{ phone: 's', tablet: 'm' }}>
                <Button onPress={goToPrevStep}>
                    Back
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

    const goToNextStep = () => {
        const prevActiveIndex = activeIndex
        const prevCompletedStep = completedStep
        if (!isRecurring) {
          let newActiveIndex = prevActiveIndex + 1
    
          if (prevActiveIndex === 6) {
            newActiveIndex = 8
          }
    
          if (prevActiveIndex === 8) {
            if (invitees?.length === 0) {
              Toast.show({
                type: 'info',
                text1: 'No invitees added',
                text2: 'Please add at least one invitee in order to add your meeting',
              })
               newActiveIndex = 8
            }
          }
    
          if (prevActiveIndex === 9) {
            return
          }
    
          if (!prevCompletedStep || (prevCompletedStep < prevActiveIndex)) {
            const newCompletedStep = prevActiveIndex
            setCompletedStep(newCompletedStep)
          }
    
          if (newActiveIndex !== prevActiveIndex) {
            return setActiveIndex(newActiveIndex)
          }
    
        }
    
        
    
        if (prevActiveIndex === 9) {
          return
        }
    
        let newActiveIndex = prevActiveIndex + 1
    
        if (prevActiveIndex === 8) {
            if (invitees?.length === 0) {
              Toast.show({
                type: 'info',
                text1: 'No invitees added',
                text2: 'Please add at least one invitee in order to add your meeting',
              })
               newActiveIndex = 8
            }
          }
    
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
          return <Box mt={{ phone: 's', tablet: 'm' }}/>
        }

        if ((activeIndex === 8) && (invitees?.length === 0)) {
            return <Box mt={{ phone: 's', tablet: 'm' }}/>
        }
    
        return (
          <Box mr={{ phone: 's', tablet: 'm' }} mb={{ phone: 's', tablet: 'm' }} mt={{ phone: 's', tablet: 'm'}}>
            <Button onPress={goToNextStep}>
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
                        <CreateMeetingAssistBaseStep
                            notes={notes}
                            summary={summary}
                            windowStartDate={windowStartDate}
                            windowEndDate={windowEndDate}
                            location={location}
                            setParentNotes={setNotes}
                            setParentSummary={setSummary}
                            setParentWindowStartDate={setWindowStartDate}
                            setParentWindowEndDate={setWindowEndDate}
                            setParentLocation={setLocation}
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
                        <CreateMeetingAssistVirtualMeet
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
            case 2:
                return (
                    <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
                        <CreateMeetingAssistBaseStep3
                            sendUpdates={sendUpdates}
                            guestsCanInviteOthers={guestsCanInviteOthers}
                            transparency={transparency}
                            visibility={visibility}
                            hostName={hostName}
                            setParentSendUpdates={setSendUpdates}
                            setParentGuestsCanInviteOthers={setGuestsCanInviteOthers}
                            setParentTransparency={setTransparency}
                            setParentVisibility={setVisibility}
                            setParentHostName={setHostName}
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
                        <CreateMeetingAssistAlarms
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
            case 4:
                return (
                    <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
                        <CreateMeetingAssistBaseStep5
                            cancelIfAnyRefuse={cancelIfAnyRefuse}
                            enableAttendeePreferences={enableAttendeePreferences}
                            attendeeCanModify={attendeeCanModify}
                            expireDate={expireDate}
                            duration={duration}
                            setParentCancelIfAnyRefuse={setCancelIfAnyRefuse}
                            setParentEnableAttendeePreferences={setEnableAttendeePreferences}
                            setParentAttendeeCanModify={setAttendeeCanModify}
                            setParentExpireDate={setExpireDate}
                            setParentDuration={setDuration}
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
                        <CreateMeetingAssistBaseStep6
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
            
            case 6:
                return (
                    <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
                        <CreateMeetingAssistBaseStep7
                            anyoneCanAddSelf={anyoneCanAddSelf}
                            guestsCanSeeOtherGuests={guestsCanSeeOtherGuests}
                            minThresholdCount={minThresholdCount}
                            guaranteeAvailability={guaranteeAvailability}
                            isRecurring={isRecurring}
                            setParentAnyoneCanAddSelf={setAnyoneCanAddSelf}
                            setParentGuestsCanSeeOtherGuests={setGuestsCanSeeOtherGuests}
                            setParentMinThresholdCount={setMinThresholdCount}
                            setParentGuaranteeAvailability={setGuaranteeAvailability}
                            setParentIsRecurring={setIsRecurring}
                        />
                        <Box flexDirection="row" justifyContent="space-between" alignItems="center"  style={{ width: '100%'}}>
                            {renderPrevButton()}
                            {renderNextButton()}
                        </Box>
                    </Box>
                )
            
            case 7:
                return (
                    <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
                        <CreateMeetingAssistRecurStepAlt
                            frequency={frequency}
                            interval={interval}
                            until={until}
                            setParentFrequency={setFrequency}
                            setParentInterval={setInterval}
                            setParentUntil={setUntil}
                        />
                        <Box flexDirection="row" justifyContent="space-between" alignItems="center"  style={{ width: '100%'}}>
                            {renderPrevButton()}
                            {renderNextButton()}
                        </Box>
                    </Box>
                )
            
            case 8:
                return (
                    <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
                        <CreateMeetingAssistInvitees
                            invitees={invitees}
                            userId={userId}
                            client={client}
                            hostName={hostName}
                            meetingId={meetingId} 
                            setParentInvitees={setInvitees}
                        />
                         <Box flexDirection="row" justifyContent="space-between" alignItems="center" style={{ width: '100%'}}>
                            {renderPrevButton()}
                            {renderNextButton()}
                        </Box>
                    </Box>
                )
            
            case 9:
                return (
                    <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
                        <Box flex={1} style={{ width: '100%' }} m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
                            <Box m={{ phone: 'm', tablet: 'l'}}>
                                <Text variant="subheaderNormal">
                                    Create Meeting Assist
                                </Text>
                            </Box>
                            <Box mt={{ phone: 'm', tablet: 'l' }}>
                                <Button onPress={createMeetingAssist}>
                                    Create
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
        <Box flex={1} justifyContent="center" alignItems="center">
            <Wizard testID={'uilib.wizard'} activeIndex={activeIndex} onActiveIndexChanged={onActiveIndexChanged}>
                <Wizard.Step state={getStepState(0)} label={'Set Base'} />
                <Wizard.Step state={getStepState(1)} label={'Select Virtual Meet'}/>
                <Wizard.Step state={getStepState(2)} label={'Continue Base'}/>
                <Wizard.Step state={getStepState(3)} label={'Set Alarms'}/>
                <Wizard.Step state={getStepState(4)} label={'Continue Base'} />
                <Wizard.Step state={getStepState(5)} label={'Continue Base'} />
                <Wizard.Step state={getStepState(6)} label={'Continue Base'} />
                <Wizard.Step state={getStepState(7)} label={'Create Recurrence'}/>
                <Wizard.Step state={getStepState(8)} label={'Add Invitees'}/>
                <Wizard.Step state={getStepState(9)} label={'Create Event'}/>
            </Wizard>
            {renderCurrentStep()}
        </Box>
    )
}



export default UserCreateMeetingAssist











