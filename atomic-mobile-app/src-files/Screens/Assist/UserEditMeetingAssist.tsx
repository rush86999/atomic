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

import Text from '@components/common/Text'
import RegularCard from '@components/RegularCard'
import { ConferenceAppType, MeetingAssistType } from '@dataTypes/MeetingAssistType'
import { CalendarType } from '@dataTypes/CalendarType'
import { MeetingAssistInviteType } from '@dataTypes/MeetingAssistInviteType'
import { ContactType } from 'aws-sdk/clients/route53domains'
import { UserType } from '@dataTypes/UserType'
import { RecurrenceFrequencyType } from '@screens/Assist/types'
import { convertInviteeTypeToCancelEmailRecipients, getMeetingAssistGivenId, getUserGivenId, listMeetingAssistInvitesGivenMeetingId, sendBulkMeetingCancelEmail, updateUserNameGivenId, upsertMeetingAssistInviteMany, upsertMeetingAssistOne } from '@screens/Assist/UserMeetingAssistHelper'
import getGlobalPrimaryCalendar from '@app/apollo/gql/getGlobalPrimaryCalendar'
import { zoomAvailable } from '@app/zoom/zoomMeetingHelper'


import EditMeetingAssistBaseStep from '@screens/Assist/EditMeetingAssistWizard/EditMeetingAssistBaseStep'
import EditMeetingAssistVirtualMeet from '@screens/Assist/EditMeetingAssistWizard/EditMeetingAssistVirtualMeet'
import EditMeetingAssistBaseStep3 from '@screens/Assist/EditMeetingAssistWizard/EditMeetingAssistBaseStep3'
import EditMeetingAssistAlarms from './EditMeetingAssistWizard/EditMeetingAssistAlarms'
import EditMeetingAssistBaseStep5 from './EditMeetingAssistWizard/EditMeetingAssistBaseStep5'
import EditMeetingAssistBaseStep6 from './EditMeetingAssistWizard/EditMeetingAssistBaseStep6'
import EditMeetingAssistBaseStep7 from './EditMeetingAssistWizard/EditMeetingAssistBaseStep7'
import EditMeetingAssistInvitees from './EditMeetingAssistWizard/EditMeetingAssistInvitees'
import EditMeetingAssistRecurStepAlt from './EditMeetingAssistWizard/EditMeetingAssistRecurStepAlt'
import { googleMeetAvailable } from '@app/calendar/googleCalendarHelper'

type RootStackNavigationParamList = {
    UserEditMeetingAssist: undefined,
    UserListMeetingAssists: undefined,
}

type UserEditMeetingAssistNavigationProp = StackNavigationProp<
  RootStackNavigationParamList,
  'UserEditMeetingAssist'
>

type RootStackEventParamList = {
    UserEditMeetingAssist: {
        meetingId: string,
    },
}

type UserEditMeetingAssistRouteProp = RouteProp<
  RootStackEventParamList,
  'UserEditMeetingAssist'
>

type Props = {
    sub: string,
    route: UserEditMeetingAssistRouteProp,
    client: ApolloClient<NormalizedCacheObject>,
}

function UserEditMeetingAssist(props: Props) {
    const [notes, setNotes] = useState<string>('')
    const [summary, setSummary] = useState<string>('')
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
    const [visibility, setVisibility] = useState<'default' | 'public' | 'private'>()
    const [useDefaultAlarms, setUseDefaultAlarms] = useState<boolean>(true)
    const [alarms, setAlarms] = useState<number[]>([])
    const [cancelIfAnyRefuse, setCancelIfAnyRefuse] = useState<boolean>(false)
    const [enableAttendeePreferences, setEnableAttendeePreferences] = useState<boolean>(true)
    const [attendeeCanModify, setAttendeeCanModify] = useState<boolean>(false)
    const [expireDate, setExpireDate] = useState<Date>(new Date())
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
    const [frequency, setFrequency] = useState<RecurrenceFrequencyType>('weekly')
    const [interval, setInterval] = useState<number>(1)
    const [until, setUntil] = useState<Date>(new Date())
    const [calendar, setCalendar] = useState<CalendarType>()
    const [searchName, setSearchName] = useState<string>('')
    const [contactResults, setContactResults] = useState<ContactType[]>()
    const [invitees, setInvitees] = useState<MeetingAssistInviteType[]>([])
    const [activeIndex, setActiveIndex] = useState<number>(0)
    const [completedStep, setCompletedStep] = useState<number | undefined>()
    const [hostName, setHostName] = useState<string>('')
    const [user, setUser] = useState<UserType | undefined>()
    const [meetingAssist, setMeetingAssist] = useState<MeetingAssistType>()
    const [cancel, setCancel] = useState<boolean>(false)

    const meetingId = props?.route?.params?.meetingId
    
    const client = props?.client
    const userId = props?.sub
    const navigation = useNavigation<UserEditMeetingAssistNavigationProp>()
    
    useEffect(() => {
        (async () => {
            try {
                const oldMeetingAssist = await getMeetingAssistGivenId(client, meetingId)
                if (!oldMeetingAssist?.id) {
                    Toast.show({
                        type: 'error',
                        text1: 'No Meeting Assist found',
                        text2: 'Seems like there is no Meeting Assist found. Let us know.'
                    })
                }

                setMeetingAssist(oldMeetingAssist)
                setNotes(oldMeetingAssist?.notes)
                setSummary(oldMeetingAssist?.summary)
                setWindowStartDate(dayjs(oldMeetingAssist?.windowStartDate).toDate())
                setWindowEndDate(dayjs(oldMeetingAssist?.windowEndDate).toDate())
                setLocation(oldMeetingAssist?.location?.title)
                setZoomMeet(oldMeetingAssist?.conferenceApp === 'zoom')
                setGoogleMeet(oldMeetingAssist?.conferenceApp === 'google')
                setSendUpdates(oldMeetingAssist?.sendUpdates as 'all' | 'externalOnly')
                setGuestsCanInviteOthers(oldMeetingAssist?.guestsCanInviteOthers)
                setTransparency(oldMeetingAssist?.transparency)
                setVisibility(oldMeetingAssist?.visibility)
                setUseDefaultAlarms(oldMeetingAssist?.useDefaultAlarms)
                setAlarms(oldMeetingAssist?.reminders)
                setCancelIfAnyRefuse(oldMeetingAssist?.cancelIfAnyRefuse)
                setEnableAttendeePreferences(oldMeetingAssist?.enableAttendeePreferences)
                setAttendeeCanModify(oldMeetingAssist?.attendeeCanModify)
                setExpireDate(dayjs(oldMeetingAssist?.expireDate).toDate())
                setDuration(oldMeetingAssist?.duration)
                setEnableConference(oldMeetingAssist?.enableConference)
                setConferenceApp(oldMeetingAssist?.conferenceApp)
                setIsBufferTime(!!(oldMeetingAssist?.bufferTime))
                setBeforeEventMinutes(oldMeetingAssist?.bufferTime?.beforeEvent)
                setAfterEventMinutes(oldMeetingAssist?.bufferTime?.afterEvent)
                setAnyoneCanAddSelf(oldMeetingAssist?.anyoneCanAddSelf)
                setGuestsCanSeeOtherGuests(oldMeetingAssist?.guestsCanSeeOtherGuests)
                setMinThresholdCount(oldMeetingAssist?.minThresholdCount)
                setGuaranteeAvailability(oldMeetingAssist?.guaranteeAvailability)
                setIsRecurring(!!(oldMeetingAssist?.until))
                setFrequency(oldMeetingAssist?.frequency)
                setInterval(oldMeetingAssist?.interval)
                setUntil(dayjs(oldMeetingAssist?.until).toDate())


            } catch (e) {
                
            }
        })()
    }, [client, meetingId])

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
        })).data?.Calendar?.[0]
        if (!result?.id) {
            
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

    useEffect(() => {
        (async () => {
            try {
                const oldMeetingAssistInvites = await listMeetingAssistInvitesGivenMeetingId(client, meetingId)

                setInvitees(oldMeetingAssistInvites)
            } catch (e) {
                
            }
        })()
    }, [client, userId])

    const editMeetingAssistInvitees = async () => {
        try {
            if (invitees?.length > 0) {
                await upsertMeetingAssistInviteMany(client, invitees)
            }
        } catch (e) {
            
        }
    }

    const editMeetingAssist = async () => {
        try {
            const newMeetingAssist: MeetingAssistType = {
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
                attendeeRespondedCount: meetingAssist?.attendeeRespondedCount,
                attendeeCount: meetingAssist?.attendeeCount,
                cancelled: cancel,
                frequency,
                interval,
                until: dayjs(until).format(),
                originalMeetingId: isRecurring ? meetingId : undefined,
            }

            

            await upsertMeetingAssistOne(
                client,
                newMeetingAssist,
            )

            await editMeetingAssistInvitees()

            if (cancel) {
                if (invitees?.length > 0) {
                    const cancelRecipients = convertInviteeTypeToCancelEmailRecipients(invitees)

                    const filteredInviteeEmails = cancelRecipients?.filter(i => !!(i?.email))

                    if (filteredInviteeEmails?.length > 0) {
                        await sendBulkMeetingCancelEmail(filteredInviteeEmails, user?.email, hostName || user?.name)
                    }
                }
            }

            if (hostName && (user?.name !== hostName)) {
                await updateUserNameGivenId(
                    client,
                    userId,
                    hostName
                )
            }

            Toast.show({
                type: 'success',
                text1: 'Meeting Assist Edited',
                text2: 'Meeting Assist edited successfully',
                visibilityTime: 3000,
            })

            navigation.navigate('UserListMeetingAssists')

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
            <Box m={{ phone: 's', tablet: 'm' }}>
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
        if (activeIndex === 10) {
          return <Box mt={{ phone: 's', tablet: 'm' }}/>
        }

        if ((activeIndex === 9) && (invitees?.length === 0)) {
            return <Box mt={{ phone: 's', tablet: 'm' }}/>
        }
    
        return (
          <Box m={{ phone: 's', tablet: 'm' }}>
            <Button onPress={goToNextStep}>
              Next
            </Button>
          </Box>
        )
    }

    const renderSubmitButton = () => {
        return (
            <Box mt={{ phone: 'm', tablet: 'l' }}>
                <Button onPress={editMeetingAssist}>
                    Submit
                </Button>
            </Box>
        )
    }

    const renderCurrentStep = () => {

        switch(activeIndex) {
            case 0: 
                return (
                    <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
                        <EditMeetingAssistBaseStep
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
                            cancel={cancel} 
                            setParentCancel={setCancel} 
                        />
                        <Box style={{ width: '100%' }} justifyContent="center" alignItems="center">
                            {renderSubmitButton()}
                        </Box>
                        <Box style={{ width: '100%' }} flexDirection="row" justifyContent="space-between" alignItems="center">
                            <Box />
                            {renderNextButton()}
                        </Box>
                    </Box>
                )
            
            case 1: 
                return (
                    <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
                        <EditMeetingAssistVirtualMeet
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
                        <Box style={{ width: '100%' }} justifyContent="center" alignItems="center">
                            {renderSubmitButton()}
                        </Box>
                        <Box flexDirection="row" justifyContent="space-between" alignItems="center">
                            {renderPrevButton()}
                            {renderNextButton()}
                        </Box>
                    </Box>
                )
            case 2:
                return (
                    <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
                        <EditMeetingAssistBaseStep3
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
                        <Box style={{ width: '100%' }} justifyContent="center" alignItems="center">
                            {renderSubmitButton()}
                        </Box>
                        <Box flexDirection="row" justifyContent="space-between" alignItems="center">
                            {renderPrevButton()}
                            {renderNextButton()}
                        </Box>
                    </Box>
                )
            case 3:
                return (
                    <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
                        <EditMeetingAssistAlarms
                            useDefaultAlarms={useDefaultAlarms}
                            alarms={alarms}
                            setParentAlarms={setAlarms}
                            setParentUseDefaultAlarms={setUseDefaultAlarms}
                        />
                        <Box style={{ width: '100%' }} justifyContent="center" alignItems="center">
                            {renderSubmitButton()}
                        </Box>
                        <Box flexDirection="row" justifyContent="space-between" alignItems="center">
                            {renderPrevButton()}
                            {renderNextButton()}
                        </Box>
                    </Box>
                )
            case 4:
                return (
                    <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
                        <EditMeetingAssistBaseStep5
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
                        <Box style={{ width: '100%' }} justifyContent="center" alignItems="center">
                            {renderSubmitButton()}
                        </Box>
                        <Box flexDirection="row" justifyContent="space-between" alignItems="center">
                            {renderPrevButton()}
                            {renderNextButton()}
                        </Box>
                    </Box>
                )
            case 5:
                return (
                    <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
                        <EditMeetingAssistBaseStep6
                            isBufferTime={isBufferTime}
                            beforeEventMinutes={beforeEventMinutes}
                            afterEventMinutes={afterEventMinutes}
                            setParentIsBufferTime={setIsBufferTime}
                            setParentBeforeEventMinutes={setBeforeEventMinutes}
                            setParentAfterEventMinutes={setAfterEventMinutes}
                        />
                        <Box style={{ width: '100%' }} justifyContent="center" alignItems="center">
                            {renderSubmitButton()}
                        </Box>
                        <Box flexDirection="row" justifyContent="space-between" alignItems="center">
                            {renderPrevButton()}
                            {renderNextButton()}
                        </Box>
                    </Box>
                )
            
            case 6:
                return (
                    <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
                        <EditMeetingAssistBaseStep7
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
                        <Box style={{ width: '100%' }} justifyContent="center" alignItems="center">
                            {renderSubmitButton()}
                        </Box>
                        <Box flexDirection="row" justifyContent="space-between" alignItems="center">
                            {renderPrevButton()}
                            {renderNextButton()}
                        </Box>
                    </Box>
                )
            
            case 7:
                return (
                    <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
                        <EditMeetingAssistRecurStepAlt
                            frequency={frequency}
                            interval={interval}
                            until={until}
                            setParentFrequency={setFrequency}
                            setParentInterval={setInterval}
                            setParentUntil={setUntil}
                        />
                        <Box style={{ width: '100%' }} justifyContent="center" alignItems="center">
                            {renderSubmitButton()}
                        </Box>
                        <Box flexDirection="row" justifyContent="space-between" alignItems="center">
                            {renderPrevButton()}
                            {renderNextButton()}
                        </Box>
                    </Box>
                )
            
            case 8:
                return (
                    <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center">
                        <EditMeetingAssistInvitees
                            invitees={invitees}
                            userId={userId}
                            client={client}
                            hostName={hostName}
                            meetingId={meetingId} 
                            setParentInvitees={setInvitees}
                        />
                        <Box style={{ width: '100%' }} justifyContent="center" alignItems="center">
                            {renderSubmitButton()}
                        </Box>
                         <Box flexDirection="row" justifyContent="space-between" alignItems="center">
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
                                    Edit Meeting Assist
                                </Text>
                            </Box>
                            {renderSubmitButton()}
                        </Box>
                        <Box flexDirection="row" justifyContent="space-between" alignItems="center" style={{ width: '75%' }}>
                            {renderPrevButton()}
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
                <Wizard.Step state={getStepState(9)} label={'Update Event'}/>
            </Wizard>
            {renderCurrentStep()}
        </Box>
    )

}

export default UserEditMeetingAssist

