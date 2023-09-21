import React, {
  useState,
  useEffect,
} from 'react'
import TextField from '@components/TextField'

import { dayjs } from '@lib/date-utils'
import _ from 'lodash'

import Box from '@components/common/Box'
import Text from '@components/common/Text'
import { createNewEvent } from '@lib/Calendar/UserCreateCalendarHelper'
import { updateEvent } from '@lib/Calendar/UserEditCalendarHelper'

import {EventType} from '@lib/dataTypes/EventType'
import { useToast } from '@chakra-ui/react'
import Button from '@components/Button'
import listCategoriesForEventId from '@lib/apollo/gql/listCategoriesForEventId'
import { CategoryType } from '@lib/dataTypes/CategoryType'
import listRemindersForEventId from '@lib/apollo/gql/listRemindersForEventId'
import updateEventForPreEventId from '@lib/apollo/gql/updateEventForPreEventId'
import { ReminderType } from '@lib/dataTypes/ReminderType'
import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import updateEventForPostEventId from '@lib/apollo/gql/updateEventForPostEventId'

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
    event: EventType,
    hidePrepAndReview: () => void,
    client: ApolloClient<NormalizedCacheObject>,
}

function UserPreAndPostForEventModal(props: Props) {
    const [beforeEventMinutes, setBeforeEventMinutes] = useState<number>(props?.event?.timeBlocking?.beforeEvent ?? 0)
    const [afterEventMinutes, setAfterEventMinutes] = useState<number>(props?.event?.timeBlocking?.afterEvent ?? 0)
    const [pageOffset, setPageOffset] = useState<number>(0)

    const event = props?.event
    const client = props?.client
    console.log(event?.id, ' event id inside userpreandpostforeventmodal')
    console.log(event?.timeBlocking, ' event?.timeBlocking inside userpreandpostforeventmodal')
    console.log(beforeEventMinutes, ' beforeEventMinutes')
    console.log(event?.preEventId, ' event?.preEventId')
    console.log(event?.postEventId, ' event?.postEventId')
    console.log(afterEventMinutes, ' afterEventMinutes')
    const toast = useToast()
    
    useEffect(() => {
        if ((props?.event?.timeBlocking?.beforeEvent > 0) && (props?.event?.timeBlocking?.beforeEvent !== beforeEventMinutes)) {
            setBeforeEventMinutes(props?.event?.timeBlocking?.beforeEvent)
        }
    }, [beforeEventMinutes, props?.event?.timeBlocking?.beforeEvent])

    useEffect(() => {
        if ((props?.event?.timeBlocking?.afterEvent > 0) && (props?.event?.timeBlocking?.afterEvent !== afterEventMinutes)) {
            setAfterEventMinutes(props?.event?.timeBlocking?.afterEvent)
        }
    }, [afterEventMinutes, props?.event?.timeBlocking?.afterEvent])

    const createEvent = async (minutes: number, eventType: 'pre' | 'post') => {
        try {
            // validate
            if (minutes === 0) {
                toast({
                    status: 'error',
                    title: 'Please enter a valid time',
                    description: 'Please enter a valid time',
                    duration: 9000,
                    isClosable: true,
                })
                return
            }

            if (event?.allDay) {
                toast({
                    title: 'All day event',
                    description: 'All day events cannot have prep or debrief events',
                    status: 'success',
                    duration: 9000,
                    isClosable: true,
                })
                return
            }

            const categoryIds = (await client.query<{ Category: CategoryType[] }>({
                query: listCategoriesForEventId,
                variables: {
                eventId: event?.id,
                },
            }))?.data?.Category?.map(c => c?.id)
            
            const reminders = (await client.query<{ Reminder: ReminderType[] }>({
                query: listRemindersForEventId,
                variables: {
                    eventId: event.id,
                },
            })).data?.Reminder?.map(r => r.minutes)

            if (eventType === 'pre') {
                const id = await createNewEvent(
                    dayjs(event.startDate).subtract(minutes, 'minute').format(),
                    dayjs(event.startDate).format(),
                    event?.userId,
                    client,
                    event?.calendarId,
                    categoryIds,
                    'Buffer time',
                    false,
                    undefined,
                    undefined,
                    undefined,
                    reminders,
                    'Buffer time',
                    event?.location,
                    false,
                    true,
                    false,
                    true,
                    false,
                    false,
                    false,
                    false,
                    event?.timezone,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    event?.id,
                    false,
                    false,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    'opaque',
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    event?.colorId,
                    event?.originalTimezone,
                    event?.backgroundColor,
                    event?.foregroundColor,
                    event?.useDefaultAlarms,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    true,
                    true,
                    true,
                    true,
                    true,
                    true,
                    true,
                    true,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    true,
                    true,
                    minutes,
                    undefined,
                    true,
                    'create',
                    undefined,
                )

                console.log(id, ' eventId inside pre createEvent')

                if (id) {
                    // setPreEventId(eventId)
                    return updateForEvent(id, eventType, minutes)
                } else {
                    toast({
                        title: 'Error creating prep event',
                        description: 'Error creating prep event',
                        status: 'error',
                        duration: 9000,
                        isClosable: true,
                    })
                }
                
            } else if (eventType == 'post') {
                const id = await createNewEvent(
                    dayjs(event.endDate).format(),
                    dayjs(event.endDate).add(minutes, 'minute').format(),
                    event?.userId,
                    client,
                    event?.calendarId,
                    categoryIds,
                    'Buffer time',
                    false,
                    undefined,
                    undefined,
                    undefined,
                    reminders,
                    'Buffer time',
                    event?.location,
                    false,
                    false,
                    true,
                    true,
                    false,
                    false,
                    false,
                    false,
                    event?.timezone,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    event?.id,
                    false,
                    false,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    'Buffer time',
                    'opaque',
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    event?.colorId,
                    event?.originalTimezone,
                    event?.backgroundColor,
                    event?.foregroundColor,
                    event?.useDefaultAlarms,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    true,
                    true,
                    true,
                    true,
                    true,
                    true,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    true,
                    minutes,
                    undefined,
                    true,
                    'create',
                    undefined,
                )

                console.log(id, ' eventId inside post createEvent')
                if (id) {
                    // setPostEventId(eventId)
                    return updateForEvent(id, eventType, undefined, minutes)
                } else {
                    toast({
                        title: 'Error creating debrief event',
                        description: 'Error creating debrief event',
                        status: 'error',
                        duration: 9000,
                        isClosable: true,
                    })
                }
            }

        } catch (e) {
            console.log(e, ' unable to create event')
        }
        
    }

    const updateForEvent = async (id: string, eventType: 'pre' | 'post', beforeMinutes?: number, afterMinutes?: number) => {
        console.log(id, ' id inside updateForEvent')
        try {
            if (eventType === 'pre') {

                await client.mutate({
                    mutation: updateEventForPreEventId,
                    variables: {
                        id: event?.id,
                        preEventId: id,
                        timeBlocking: {
                            beforeEvent: beforeMinutes || beforeEventMinutes,
                            afterEvent: afterMinutes || afterEventMinutes || event?.timeBlocking?.afterEvent || 0,
                        }
                    },
                })

            } else if (eventType === 'post') {

                await client.mutate({
                    mutation: updateEventForPostEventId,
                    variables: {
                        id: event?.id,
                        postEventId: id,
                        timeBlocking: {
                            beforeEvent: beforeMinutes || beforeEventMinutes || event?.timeBlocking?.beforeEvent || 0,
                            afterEvent: afterMinutes || afterEventMinutes,
                        }
                    },
                })
            }
        } catch (e) {
            console.log(e,
                'Error updating existing event for prep/debrief')
            toast({
                title: 'Error updating event',
                description: 'Error updating event',
                status: 'error',
                duration: 9000,
                isClosable: true,
            })
        }
    }

    const updateLocalEvent = async (id: string, minutes: number, eventType: 'pre' | 'post') => {
        try {
            // validate
        if (minutes === 0) {
            toast({
                status: 'error',
                
                title: 'Please enter a valid time',
                description: 'Please enter a valid time',
                duration: 9000,
                isClosable: true,
            })
            return
        }

        if (event?.allDay) {
            toast({
                title: 'All day event',
                description: 'All day events cannot have prep or debrief events',
                status: 'success',
                duration: 9000,
                isClosable: true,
            })
            return
        }

        const categoryIds = (await client.query<{ Category: CategoryType[] }>({
            query: listCategoriesForEventId,
            variables: {
              eventId: event?.id,
            },
        }))?.data?.Category?.map(c => c?.id)
        
        const reminders = (await client.query<{ Reminder: ReminderType[] }>({
            query: listRemindersForEventId,
            variables: {
                eventId: event.id,
            },
        })).data?.Reminder?.map(r => r.minutes)

        if (eventType === 'pre') {

            await updateEvent(
                id,
                dayjs(event.startDate).subtract(minutes, 'minute').format(),
                dayjs(event.startDate).format(),
                event?.userId,
                client,
                event?.calendarId,
                categoryIds,
                'Buffer time',
                false,
                undefined,
                undefined,
                undefined,
                reminders,
                'Buffer time',
                event?.location,
                false,
                true,
                false,
                true,
                false,
                false,
                false,
                false,
                event?.timezone,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                event?.id,
                false,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                'Buffer time',
                'opaque',
                undefined,
                undefined,
                undefined,
                undefined,
                event?.colorId,
                event?.originalTimezone,
                event?.backgroundColor,
                event?.foregroundColor,
                event?.useDefaultAlarms,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                true,
                true,
                true,
                true,
                true,
                true,
                true,
                true,
                undefined,
                undefined,
                undefined,
                undefined,
                true,
                true,
                minutes,
                undefined,
                true,
                'update',
                true,
            )
            return updateForEvent(id, eventType, minutes)     
        } else if (eventType === 'post') {

            await updateEvent(
                id,
                dayjs(event.endDate).format(),
                dayjs(event.endDate).add(minutes, 'minute').format(),
                event?.userId,
                client,
                event?.calendarId,
                categoryIds,
                'Buffer time',
                false,
                undefined,
                undefined,
                undefined,
                reminders,
                'Buffer time',
                event?.location,
                false,
                false,
                true,
                true,
                false,
                false,
                false,
                false,
                event?.timezone,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                event?.id,
                false,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                'Buffer time',
                'opaque',
                undefined,
                undefined,
                undefined,
                undefined,
                event?.colorId,
                event?.originalTimezone,
                event?.backgroundColor,
                event?.foregroundColor,
                event?.useDefaultAlarms,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                true,
                undefined,
                undefined,
                true,
                true,
                true,
                true,
                true,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                true,
                'update',
                true,
            )

            return updateForEvent(id, eventType, undefined, minutes)
        }
            
        } catch (e) {
            console.log(e,
                'Error updating existing event for prep/debrief')
            toast({
                title: 'Error updating event',
                description: 'Error updating event',
                status: 'error',
                duration: 9000,
                isClosable: true,
            })
        }
    }

    const onBeforeEventMinutesChange = (e: { target: { value: string } }) => {
        setBeforeEventMinutes(parseInt(e?.target?.value.replace(/[^0-9.]/g, ''), 10))
    }

    const onAfterEventMinutesChange = (e: { target: { value: string } }) => {
        setAfterEventMinutes(parseInt(e?.target?.value.replace(/[^0-9.]/g, ''), 10))
    }
    
    const onSubmit = async () => {
        try {
            const promises = []
            if (event?.preEventId 
                && (beforeEventMinutes > 0)
                && (event?.timeBlocking?.beforeEvent !== beforeEventMinutes)
            ) {
                console.log(event?.id, event?.preEventId, ' event?.id, event?.preEventId inside onSubmit')
                promises.push(updateLocalEvent(event?.preEventId, beforeEventMinutes, 'pre'))
            }
            
            if (
                event?.postEventId 
                && (afterEventMinutes > 0)
                && (event?.timeBlocking?.afterEvent !== afterEventMinutes)
                ) {
                console.log(event?.id, event?.postEventId, ' event?.id, event?.postEventId inside onSubmit')
                promises.push(updateLocalEvent(event?.postEventId, afterEventMinutes, 'post'))
            }
            
            if (!event?.preEventId && (beforeEventMinutes > 0)) {
                console.log(beforeEventMinutes, ' beforeEventMinutes inside onSubmit')
                promises.push(createEvent(beforeEventMinutes, 'pre'))
            }
            
            if (!event?.postEventId && (afterEventMinutes > 0)) {
                console.log(afterEventMinutes, ' afterEventMinutes inside onSubmit')
                promises.push(createEvent(afterEventMinutes, 'post'))
            }

            await Promise.all(promises)

            props.hidePrepAndReview()
        } catch (e) {
            console.log(e, ' Error updating event')
            toast({
                title: 'Error updating event',
                description: 'Error updating event',
                status: 'error',
                duration: 9000,
                isClosable: true,
            })
        }
    }

    return (
        <Box justifyContent="center" alignItems="center" style={{ width: '100%' }}>

            <Box style={{ flex: 1, width: '100%' }} > 
                <Box pt={{ phone: 'm', tablet: 's' }} justifyContent="center" alignItems="center"  style={{ width: '100%' }}>
                    <Box style={{ width: '100%' }} justifyContent="center" alignItems="center">
                        <Box style={{ width: '100%' }} flexDirection="row" justifyContent="space-between" alignItems="center" pt={{ phone: 'm', tablet: 's' }}>
                            <Box>
                                <Text variant="optionHeader">
                                    Prep time before event:
                                </Text>
                            </Box>
                            <Box>
                                <TextField
                                    label="Minutes"
                                    value={`${beforeEventMinutes}`}
                                    onChange={onBeforeEventMinutesChange}
                                    type="number"
                                    
                                />
                            </Box>
                        </Box>
                    </Box>
                    <Box style={{ width: '100%' }} justifyContent="center" alignItems="center">
                        <Box style={{ width: '100%' }} flexDirection="row" justifyContent="space-between" alignItems="center" pt={{ phone: 'm', tablet: 's' }}>
                            <Box>
                                <Text variant="optionHeader">
                                    Review time after event:
                                </Text>
                            </Box>
                            <Box>

                                <TextField
                                    label="Minutes"
                                    value={`${afterEventMinutes}`}
                                    onChange={onAfterEventMinutesChange}
                                    type="number"
                                    
                                />
                            </Box>
                        </Box>
                    </Box>
                </Box>
                <Box>
                    <Button onClick={onSubmit}>
                        Submit
                    </Button>
                </Box>
                <button className="btn btn-link no-underline hover:no-underline" onClick={props.hidePrepAndReview}>
                    Close
                </button>
                
            </Box>
            
        </Box> 
    )
}

export default UserPreAndPostForEventModal

