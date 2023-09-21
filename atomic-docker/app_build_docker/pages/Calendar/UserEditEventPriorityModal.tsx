import React, {
    useState,
} from 'react'

import { Tooltip } from '@chakra-ui/react'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import TextField from '@components/TextField'

import {EventType} from '@lib/dataTypes/EventType'
import { useToast } from '@chakra-ui/react'
import Button from '@components/Button'
import getEventById from '@lib/apollo/gql/getEventById'
import updateEventForPriority from '@lib/apollo/gql/updateEventForPriority'
import { ApolloClient, gql, NormalizedCacheObject } from '@apollo/client'
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


type Props = {
    eventId: string,
    hidePriority: () => void,
    priority: number,
    client: ApolloClient<NormalizedCacheObject>,
}

function UserEditEventPriorityModal(props: Props) {
    const [priority, setPriority] = useState<number>(props.priority)
    const [isMessage1, setIsMessage1] = useState<boolean>(false)
    const [error, setError] = useState<string>('')
    const [success, setSuccess] = useState<string>('')

    const client = props?.client
    const eventId = props?.eventId

    console.log(props?.priority, '   props?.priority')
    console.log(priority, '   priority')
    console.log(eventId, '   eventId')
    const toast = useToast()

    const updatePriority = async () => {
        try {
            // validate
            if (priority < 1) {
                toast({
                    status: 'error',
                    title: 'Priority must be greater than 0',
                    description: 'Priority must be greater than 0',
                    duration: 9000,
                    isClosable: true,
                })
                setError('Priority must be greater than 0')
                setTimeout(() => setError(''), 3000)
                return
            }

            if (isNaN(priority)) {
                 toast({
                    status: 'error',
                    title: 'Priority must be a number',
                    description: 'Priority must be a number',
                    duration: 9000,
                    isClosable: true,
                })

                setError('Priority must be a number')
                setTimeout(() => setError(''), 3000)
                return
            }

            const existingEvent = (await client.query<{ Event_by_pk: EventType }>({
                query: getEventById,
                variables: {
                    id: eventId,
                },
            })).data?.Event_by_pk
            if (existingEvent) {
                await client.mutate<{ update_Event_by_pk: EventType }>({
                    mutation: updateEventForPriority,
                    variables: {
                        id: existingEvent.id,
                        priority,  
                    },
                    update(cache, { data }) {
                       
                
                        cache.modify({
                            fields: {
                                Event(existingEvents = []) {
                                const newEventRef = cache.writeFragment({
                                  data: data?.update_Event_by_pk,
                                  fragment: gql`
                                    fragment NewEvent on Event {
                                      id
                                      startDate
                                      endDate
                                      allDay
                                      recurrence
                                      recurrenceRule
                                      location
                                      notes
                                      attachments
                                      links
                                      timezone
                                      taskId
                                      taskType
                                      priority
                                      followUpEventId
                                      isFollowUp
                                      isPreEvent
                                      isPostEvent
                                      preEventId
                                      postEventId
                                      modifiable
                                      forEventId
                                      conferenceId
                                      maxAttendees
                                      attendeesOmitted
                                      sendUpdates
                                      anyoneCanAddSelf
                                      guestsCanInviteOthers
                                      guestsCanSeeOtherGuests
                                      originalStartDate
                                      originalTimezone
                                      originalAllDay
                                      status
                                      summary
                                      title
                                      transparency
                                      visibility
                                      recurringEventId
                                      iCalUID
                                      htmlLink
                                      colorId
                                      creator
                                      organizer
                                      endTimeUnspecified
                                      extendedProperties
                                      hangoutLink
                                      guestsCanModify
                                      locked
                                      source
                                      eventType
                                      privateCopy
                                      backgroundColor
                                      foregroundColor
                                      useDefaultAlarms
                                      deleted
                                      createdDate
                                      updatedAt
                                      userId
                                      calendarId
                                      positiveImpactScore
                                      negativeImpactScore
                                      positiveImpactDayOfWeek
                                      positiveImpactTime
                                      negativeImpactDayOfWeek
                                      negativeImpactTime
                                      preferredDayOfWeek
                                      preferredTime
                                      isExternalMeeting
                                      isExternalMeetingModifiable
                                      isMeetingModifiable
                                      isMeeting
                                      dailyTaskList
                                      weeklyTaskList
                                      isBreak
                                      preferredStartTimeRange
                                      preferredEndTimeRange
                                      copyAvailability
                                      copyTimeBlocking
                                      copyTimePreference
                                      copyReminders
                                      copyPriorityLevel
                                      copyModifiable
                                      copyCategories
                                      copyIsBreak
                                      userModifiedAvailability
                                      userModifiedTimeBlocking
                                      userModifiedTimePreference
                                      userModifiedReminders
                                      userModifiedPriorityLevel
                                      userModifiedCategories
                                      userModifiedModifiable
                                      userModifiedIsBreak
                                      hardDeadline
                                      softDeadline
                                      copyIsMeeting
                                      copyIsExternalMeeting
                                      userModifiedIsMeeting
                                      userModifiedIsExternalMeeting
                                      duration
                                      copyDuration
                                      userModifiedDuration
                                      method
                                      unlink
                                      copyColor
                                      userModifiedColor
                                      byWeekDay
                                      localSynced
                                      timeBlocking
                                      meetingId
                                      eventId
                                    }
                                  `
                                });
                                const filteredEvents = existingEvents?.filter((e: EventType) => (e.id !== data?.update_Event_by_pk?.id))
                                return [...filteredEvents, newEventRef];
                              }
                            }
                          })
                      }
                })   
                toast({
                    status: 'success',
                    title: 'Event priority updated successfully',
                    description: 'Event priority updated successfully',
                    duration: 9000,
                    isClosable: true,
                })

                setSuccess('Event priority updated successfully')
                setTimeout(() => setSuccess(''), 3000)
            }
            
            props.hidePriority()
        } catch (e) {
            console.log(e, ' error in useEffect for UserEditEventPriorityModal')
            setError('Oops... something went wrong')
            setTimeout(() => setError(''), 3000)
        }
    }

    const onChangePriority = (e: { target: { value: string } }) => {
        console.log(typeof e?.target?.value === 'number', ' number')
        const intValue = parseInt(e?.target?.value.replace(/[^0-9.]/g, ''), 10)

        if (isNaN(intValue)) {
            setPriority(0)
            return
        }

        setPriority(intValue)
    }


    return (
        <Box justifyContent="center" alignItems="center">
            <Box>
                {success && (
                    <div className="alert alert-success shadow-lg">
                        <div>
                            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span>{success}</span>
                        </div>
                    </div>
                )}
                {error && (
                    <div className="alert alert-error shadow-lg">
                        <div>
                            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span>{error}</span>
                        </div>
                    </div>
                )}
                <Box justifyContent="center" alignItems="center">
                    <Tooltip hasArrow label='Higher values have higher priority over other events' bg='purple.700' color='white'>
                        <Text variant="buttonLink">
                            Priority (Hint)
                        </Text>
                    </Tooltip>
                </Box>
                <Box justifyContent="center" alignItems="flex-start">
                        <TextField
                            label="Priority"
                            value={`${priority}`}
                            onChange={onChangePriority}
                            type="number"
                        />  
                    
                </Box>
                <Box justifyContent="center" alignItems="center">
                    <Button onClick={updatePriority}>
                        Update
                    </Button>
                </Box>
                <Box justifyContent="center" alignItems="center">
                    <button className="btn btn-link no-underline hover:no-underline" onClick={props.hidePriority}>
                        Close
                    </button>
                    
                </Box>
            </Box> 
        </Box>
    )
}

export default UserEditEventPriorityModal
