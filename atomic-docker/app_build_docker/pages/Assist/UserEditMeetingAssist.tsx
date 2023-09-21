import React, { useState, useEffect } from 'react'
import Wizard from '@components/Wizard'

import { useToast } from '@chakra-ui/react'
import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { dayjs } from '@lib/date-utils'
import { v4 as uuid } from 'uuid'
import Box from '@components/common/Box'
import Button from '@components/Button'

import Text from '@components/common/Text'
import RegularCard from '@components/RegularCard'
import { ConferenceAppType, MeetingAssistType } from '@lib/dataTypes/MeetingAssistType'
import { CalendarType } from '@lib/dataTypes/CalendarType'
import { MeetingAssistInviteType } from '@lib/dataTypes/MeetingAssistInviteType'

import { UserType } from '@lib/dataTypes/UserType'
import { AttendeeDetailsForBulkMeetingCancelledType, RecurrenceFrequencyType } from '@lib/Assist/types'
import { convertInviteeTypeToCancelEmailRecipients, getMeetingAssistGivenId, getUserGivenId, listMeetingAssistInvitesGivenMeetingId, sendBulkMeetingCancelEmail, updateUserNameGivenId, upsertMeetingAssistInviteMany, upsertMeetingAssistOne } from '@lib/Assist/UserMeetingAssistHelper'
import getGlobalPrimaryCalendar from '@lib/apollo/gql/getGlobalPrimaryCalendar'
import { zoomAvailable } from '@lib/zoom/zoomMeetingHelper'


import EditMeetingAssistBaseStep from '@pages/Assist/EditMeetingAssistWizard/EditMeetingAssistBaseStep'
import EditMeetingAssistVirtualMeet from '@pages/Assist/EditMeetingAssistWizard/EditMeetingAssistVirtualMeet'
import EditMeetingAssistBaseStep3 from '@pages/Assist/EditMeetingAssistWizard/EditMeetingAssistBaseStep3'
import EditMeetingAssistAlarms from './EditMeetingAssistWizard/EditMeetingAssistAlarms'
import EditMeetingAssistBaseStep5 from './EditMeetingAssistWizard/EditMeetingAssistBaseStep5'
import EditMeetingAssistBaseStep6 from './EditMeetingAssistWizard/EditMeetingAssistBaseStep6'
import EditMeetingAssistBaseStep7 from './EditMeetingAssistWizard/EditMeetingAssistBaseStep7'
import EditMeetingAssistInvitees from './EditMeetingAssistWizard/EditMeetingAssistInvitees'
import EditMeetingAssistRecurStepAlt from './EditMeetingAssistWizard/EditMeetingAssistRecurStepAlt'
import { googleMeetAvailable } from '@lib/calendarLib/googleCalendarHelper'
import { useRouter } from 'next/router'
import { useAppContext } from '@lib/user-context'
import { ContactType } from '@lib/dataTypes/ContactType'
import { NextApiRequest, NextApiResponse } from 'next';
import supertokensNode from 'supertokens-node'
import { backendConfig } from '../../config/backendConfig'
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

function UserEditMeetingAssist() {
    const [notes, setNotes] = useState<string>('')
    const [summary, setSummary] = useState<string>('')
    const [windowStartDate, setWindowStartDate] = useState<Date>(new Date())
    const [windowEndDate, setWindowEndDate] = useState<Date>(new Date())
    const [location, setLocation] = useState<string>('')
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
    const [expireDate, setExpireDate] = useState<Date>(new Date())
    const [duration, setDuration] = useState<number>(30)
    const [enableConference, setEnableConference] = useState<boolean>(false)
    const [conferenceApp, setConferenceApp] = useState<ConferenceAppType | null>('google')
    const [isBufferTime, setIsBufferTime] = useState<boolean>(false)
    const [beforeEventMinutes, setBeforeEventMinutes] = useState<number>(0)
    const [afterEventMinutes, setAfterEventMinutes] = useState<number>(0)
    const [anyoneCanAddSelf, setAnyoneCanAddSelf] = useState<boolean>(true)
    const [guestsCanSeeOtherGuests, setGuestsCanSeeOtherGuests] = useState<boolean>(true)
    const [minThresholdCount, setMinThresholdCount] = useState<number>(2)
    const [guaranteeAvailability, setGuaranteeAvailability] = useState<boolean>(false)
    const [isRecurring, setIsRecurring] = useState<boolean>(false)
    const [frequency, setFrequency] = useState<RecurrenceFrequencyType>('weekly')
    const [interval, setInterval] = useState<number>(1) // every 1, 2... weeks 
    const [until, setUntil] = useState<Date>(new Date())
    // const [selectedCalendarId, setSelectedCalendarId] = useState<string>()
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
    const [lockAfter, setLockAfter] = useState<boolean>(false)

    const router = useRouter()

    const meetingId = router?.query?.meetingId as string
    console.log(meetingId, ' meetingId')
    // const client = props?.client
    // const userId = props?.sub

    const { sub, client } = useAppContext()
    const userId = sub
    const toast = useToast()

    // get meeting assist
    useEffect(() => {
        (async () => {
            try {
                if (!meetingId) {
                    return
                }
                const oldMeetingAssist: MeetingAssistType | undefined = await getMeetingAssistGivenId(client, meetingId)
                if (!oldMeetingAssist?.id) {
                    toast({
                        status: 'error',
                        title: 'No Meeting Assist found',
                        description: 'Seems like there is no Meeting Assist found. Let us know.',
                        duration: 9000,
                        isClosable: true,
                    })

                    return
                }

                setMeetingAssist(oldMeetingAssist)
                setNotes(oldMeetingAssist?.notes || '')
                setSummary(oldMeetingAssist?.summary || '')
                setWindowStartDate(dayjs(oldMeetingAssist?.windowStartDate).toDate())
                setWindowEndDate(dayjs(oldMeetingAssist?.windowEndDate).toDate())
                setLocation(oldMeetingAssist?.location?.title || '')
                setZoomMeet(oldMeetingAssist?.conferenceApp === 'zoom')
                setGoogleMeet(oldMeetingAssist?.conferenceApp === 'google')
                setSendUpdates(oldMeetingAssist?.sendUpdates as 'all' | 'externalOnly')
                setGuestsCanInviteOthers(oldMeetingAssist?.guestsCanInviteOthers || false)
                setTransparency(oldMeetingAssist?.transparency || 'opaque')
                setVisibility(oldMeetingAssist?.visibility || 'default')
                if (oldMeetingAssist?.useDefaultAlarms !== undefined) {
                    setUseDefaultAlarms(oldMeetingAssist?.useDefaultAlarms)
                }
                if (oldMeetingAssist?.reminders && oldMeetingAssist?.reminders?.length > 0) {
                    setAlarms(oldMeetingAssist?.reminders)
                }
                
                if (oldMeetingAssist?.cancelIfAnyRefuse !== undefined) {
                    setCancelIfAnyRefuse(oldMeetingAssist?.cancelIfAnyRefuse)
                }
                
                if (oldMeetingAssist?.enableAttendeePreferences !== undefined) {
                    setEnableAttendeePreferences(oldMeetingAssist?.enableAttendeePreferences)
                }
                
                if (oldMeetingAssist?.attendeeCanModify !== undefined) {
                    setAttendeeCanModify(oldMeetingAssist?.attendeeCanModify)
                }
                
                setExpireDate(dayjs(oldMeetingAssist?.expireDate).toDate())
                if (oldMeetingAssist?.duration !== undefined) {
                    setDuration(oldMeetingAssist?.duration)
                }
                
                if (oldMeetingAssist?.enableConference !== undefined) {
                    setEnableConference(oldMeetingAssist?.enableConference)
                }
                if (oldMeetingAssist?.conferenceApp !== undefined) {
                     setConferenceApp(oldMeetingAssist?.conferenceApp)
                }
               
                setIsBufferTime(!!(oldMeetingAssist?.bufferTime))
                if (oldMeetingAssist?.bufferTime?.beforeEvent !== undefined) {
                     setBeforeEventMinutes(oldMeetingAssist?.bufferTime?.beforeEvent)
                }
                
                if (oldMeetingAssist?.bufferTime?.afterEvent !== undefined) {
                    setAfterEventMinutes(oldMeetingAssist?.bufferTime?.afterEvent)
                }
                
                if (oldMeetingAssist?.anyoneCanAddSelf !== undefined) {
                    setAnyoneCanAddSelf(oldMeetingAssist?.anyoneCanAddSelf)
                }
                
                if (oldMeetingAssist?.guestsCanSeeOtherGuests !== undefined) {
                    setGuestsCanSeeOtherGuests(oldMeetingAssist?.guestsCanSeeOtherGuests)
                }
                
                if (oldMeetingAssist?.minThresholdCount !== undefined) {
                    setMinThresholdCount(oldMeetingAssist?.minThresholdCount)
                }

                if (oldMeetingAssist?.guaranteeAvailability !== undefined) {
                    setGuaranteeAvailability(oldMeetingAssist?.guaranteeAvailability)
                }
                
                
                setIsRecurring(!!(oldMeetingAssist?.until))

                if (oldMeetingAssist?.frequency !== undefined) {
                    setFrequency(oldMeetingAssist?.frequency)
                }
                
                if (oldMeetingAssist?.interval !== undefined) {
                    setInterval(oldMeetingAssist?.interval)
                }
                
                setUntil(dayjs(oldMeetingAssist?.until).toDate())

                if (oldMeetingAssist?.lockAfter) {
                    setLockAfter(oldMeetingAssist?.lockAfter)
                }

            } catch (e) {
                console.log(e, ' unable to get meeting assist')
            }
        })()
    }, [client, meetingId, toast])

     // check if zoom available
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

    // get global primary calendar
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
            console.log(' no primary calendar available')
            return
        }
        // setSelectedCalendarId(result?.id)
        setCalendar(result)
        })()
    }, [client, userId])

    // get user and update if necessary
    useEffect(() => {
        (async () => {
            try {
                const oldUser = await getUserGivenId(client, userId)
                setUser(oldUser)
                if (oldUser?.name) {
                    setHostName(oldUser?.name)
                }
            } catch (e) {
                console.log(e, ' unable to get user')
            }
        })()
    }, [client, userId])

    // list meeting assist invitees
    useEffect(() => {
        (async () => {
            try {
                const oldMeetingAssistInvites = await listMeetingAssistInvitesGivenMeetingId(client, meetingId)

                if (oldMeetingAssistInvites && oldMeetingAssistInvites?.length > 0) {
                    setInvitees(oldMeetingAssistInvites)
                }
                
            } catch (e) {
                console.log(e, ' unable to list meeting assist invites')
            }
        })()
    }, [client, meetingId, userId])

    const editMeetingAssistInvitees = async () => {
        try {
            if (invitees?.length > 0) {
                await upsertMeetingAssistInviteMany(client, invitees)
            }
        } catch (e) {
            console.log(e, ' unable to edit meeting assist')
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
                timezone: dayjs.tz.guess(),
                location: { title: location || '' },
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
                calendarId: calendar?.id || '',
                bufferTime: isBufferTime ? {
                    beforeEvent: beforeEventMinutes,
                    afterEvent: afterEventMinutes,
                } : undefined,
                anyoneCanAddSelf,
                guestsCanSeeOtherGuests,
                minThresholdCount,
                attendeeRespondedCount: meetingAssist?.attendeeRespondedCount || 0,
                attendeeCount: meetingAssist?.attendeeCount,
                cancelled: cancel,
                frequency,
                interval,
                until: dayjs(until).format(),
                originalMeetingId: isRecurring ? meetingId : undefined,
                lockAfter,
            }

            console.log(newMeetingAssist, ' meetingAssist before update')

            await upsertMeetingAssistOne(
                client,
                newMeetingAssist,
            )

            await editMeetingAssistInvitees()

            if (cancel) {
                if (invitees?.length > 0) {
                    const cancelRecipients: AttendeeDetailsForBulkMeetingCancelledType[] = convertInviteeTypeToCancelEmailRecipients(invitees)

                    const filteredInviteeEmails = cancelRecipients?.filter(i => !!(i?.email))

                    if (filteredInviteeEmails?.length > 0) {
                        await sendBulkMeetingCancelEmail(filteredInviteeEmails, user?.email || '', hostName || user?.name || '')
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

            toast({
                status: 'success',
                title: 'Meeting Assist Edited',
                description: 'Meeting Assist edited successfully',
                duration: 9000,
                isClosable: true,
            })

            router.push('/Assist/UserListMeetingAssists')

        } catch (e) {
            console.log(e, ' unable ot edit single meeting assist inside usereditmeetingassist')
        }
    }

    // const onActiveIndexChanged = (index: number) => setActiveIndex(index)

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
            return <Box pt={{ phone: 'm', tablet: 's' }}/>
        }

        return (
            <Box p={{ phone: 's', tablet: 'm' }}>
                <Button onClick={goToPrevStep}>
                    Back
                </Button>
            </Box>
        )
    }

    const goToNextStep = () => {
        const prevActiveIndex = activeIndex
        const prevCompletedStep = completedStep
        /**
         * 0 - EditMeetingAssistBaseStep
         * 1 - EditMeetingAssistVirtualMeet
         * 2 - EditMeetingAssistBaseStep3
         * 3 - EditMeetingAssistAlarms
         * 4 - EditMeetingAssistBaseStep5
         * 5 - EditMeetingAssistBaseStep6
         * 6 - EditMeetingAssistBaseStep7
         * 7 - EditMeetingAssistRecurStepAlt
         * 8 - EditMeetingAssistInvitees
         */
        if (!isRecurring) {
          let newActiveIndex = prevActiveIndex + 1
    
          if (prevActiveIndex === 6) {
            newActiveIndex = 8
          }
    
          // validate invitees list
          if (prevActiveIndex === 8) {
            if (invitees?.length === 0) {
              toast({
                status: 'info',
                title: 'No invitees added',
                description: 'Please add at least one invitee in order to add your meeting',
                duration: 9000,
                isClosable: true,
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
    
        // validate invitees list
        if (prevActiveIndex === 8) {
            if (invitees?.length === 0) {
              toast({
                status: 'info',
                title: 'No invitees added',
                description: 'Please add at least one invitee in order to add your meeting',
                duration: 9000,
                isClosable: true,
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
          return <Box pt={{ phone: 'm', tablet: 's' }}/>
        }

        if ((activeIndex === 9) && (invitees?.length === 0)) {
            return <Box pt={{ phone: 'm', tablet: 's' }}/>
        }
    
        return (
          <Box p={{ phone: 's', tablet: 'm' }}>
            <Button onClick={goToNextStep}>
              Next
            </Button>
          </Box>
        )
    }

    const renderSubmitButton = () => {
        return (
            <Box pt={{ phone: 'm', tablet: 'l' }}>
                <Button onClick={editMeetingAssist}>
                    Submit
                </Button>
            </Box>
        )
    }

    const renderCurrentStep = () => {
        /**
         * 0 - EditMeetingAssistBaseStep
         * 1 - EditMeetingAssistVirtualMeet
         * 2 - EditMeetingAssistBaseStep3
         * 3 - EditMeetingAssistAlarms
         * 4 - EditMeetingAssistBaseStep5
         * 5 - EditMeetingAssistBaseStep6
         * 6 - EditMeetingAssistBaseStep7
         * 7 - EditMeetingAssistRecurStepAlt
         * 8 - EditMeetingAssistInvitees
         */

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
                            lockAfter={lockAfter}
                            setParentAnyoneCanAddSelf={setAnyoneCanAddSelf}
                            setParentGuestsCanSeeOtherGuests={setGuestsCanSeeOtherGuests}
                            setParentMinThresholdCount={setMinThresholdCount}
                            setParentGuaranteeAvailability={setGuaranteeAvailability}
                            setParentIsRecurring={setIsRecurring}
                            setParentLockAfter={setLockAfter}
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
                    <Box style={{ width: '100%' }} flex={1} alignItems="center" justifyContent="center" >
                        <Box flex={1} style={{ width: '100%' }} p={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center" minHeight="65vh" maxHeight="65vh">
                            <Box p={{ phone: 'm', tablet: 'l'}}>
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
                    <Box justifyContent="center" alignItems="center" minHeight="65vh" maxHeight="65vh">
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
            <Wizard
                items={[
                    {
                        index: 0,
                        label: 'Set Base',
                    },
                    {
                        index: 1,
                        label: 'Select Virtual Meet',
                    },
                    {
                        index: 2,
                        label: 'Continue Base',
                    },
                     {
                        index: 3,
                        label: 'Set Alarms',
                    },
                     {
                        index: 4,
                        label: 'Continue Base',
                    },
                     {
                        index: 5,
                        label: 'Continue Base',
                    },
                    {
                        index: 6,
                        label: 'Continue Base',
                    },
                    {
                        index: 7,
                        label: 'Create Recurrence',
                    },
                    {
                        index: 8,
                        label: 'Add Invitees',
                    },
                    {
                        index: 9,
                        label: 'Update Event',
                    },
                ]}

                completed={completedStep}
                activeIndex={activeIndex}
            />
            {renderCurrentStep()}
        </Box>
    )

}

export default UserEditMeetingAssist

