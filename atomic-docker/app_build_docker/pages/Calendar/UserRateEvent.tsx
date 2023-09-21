import React, { useState, useEffect } from 'react'
import { useToast } from '@chakra-ui/react'
import { dayjs } from '@lib/date-utils'
import { getISODay } from 'date-fns'
import { EventType, Time } from '@lib/dataTypes/EventType'
import StarRating from 'react-native-star-rating-widget'
import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import getEventById from '@lib/apollo/gql/getEventById'
import updateEventForPositiveRating from '@lib/apollo/gql/updateEventForPositiveRating'
import updateEventForNegativeRating from '@lib/apollo/gql/updateEventForNegativeRating'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import { addToSearchIndex } from '@lib/Calendar/UserTrainCalendarHelper'
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
    userId: string,
    eventId: string,
    hideRating: () => void,
    isRateEvent: boolean,
    client: ApolloClient<NormalizedCacheObject>,
}

function UserRateEvent(props: Props) {
    const [rating, setRating] = useState(0)
    // const [isModalVisible, setIsModalVisible] = useState(true)

    const client = props?.client
    const { eventId } = props
    const toast = useToast()

    useEffect(() => {
    const updateEvent = async () => {
        try {
            if (rating === 0) {
                return
            }

            if (!eventId) {
                console.log('no eventId')
                return
            }

            const existingEvent = (await client.query<{ Event_by_pk: EventType }>({
                query: getEventById,
                variables: {
                    id: eventId,
                },
            })).data?.Event_by_pk
            if (!existingEvent) {
                throw new Error('Event not found')
            }

            console.log(rating, ' rating')

            if (Math.round(rating - 3) > 0) {
                const positiveImpactScore = Math.round(rating - 3)
                const positiveImpactDayOfWeek = getISODay(dayjs(existingEvent.startDate).toDate())
                const positiveImpactTime: Time = dayjs(existingEvent.startDate).toDate().toTimeString().slice(0, 5) as Time
                console.log(positiveImpactScore, ' positiveScore')
                await client.mutate({
                    mutation: updateEventForPositiveRating,
                    variables: {
                        id: existingEvent.id,
                        positiveImpactScore,
                        positiveImpactDayOfWeek,
                        positiveImpactTime,

                    },
                })
            } else if (Math.round(rating - 3) < 0) {
                const negativeImpactScore = Math.abs(Math.round(3 - rating))
                const negativeImpactDayOfWeek = getISODay(dayjs(existingEvent.startDate).toDate())
                const negativeImpactTime: Time = dayjs(existingEvent.startDate).toDate().toTimeString().slice(0, 5) as Time
                console.log(negativeImpactScore, ' negativeScore')
                await client.mutate({
                    mutation: updateEventForNegativeRating,
                    variables: {
                        id: existingEvent.id,
                        negativeImpactScore,
                        negativeImpactDayOfWeek,
                        negativeImpactTime,
                    },
                })
            }

            await addToSearchIndex(existingEvent)
            
            toast({
                status: 'success',
                title: 'Event rated successfully',
                description: 'Event rated successfully',
                duration: 9000,
                isClosable: true,
            })
            // setIsModalVisible(false)
            props.hideRating()
        } catch (error) {
            toast({
                status: 'error',
                title: 'Failed to rate event',
                description: 'Failed to rate event',
                duration: 9000,
                isClosable: true,
            })

            console.log(error, ' error inside userrateevent')
        }
    }
        if (rating > 0) {
            updateEvent()
        }
    }, [client, eventId, props, rating, toast])

    return (
        <Box flex={1} justifyContent="center" alignItems="center">
            <Box flex={1} justifyContent="center" alignItems="center">
                <Text p={{ phone: 's', tablet: 'm' }} variant="rating">
                    rate your productivity level
                </Text>
                <StarRating
                    rating={rating}
                    onChange={setRating}
                    starSize={56}
                />
            </Box>
            <Box p={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
                <button className="btn btn-link no-underline hover:no-underline" onClick={props.hideRating}>
                    Close
                </button>
           
            </Box>
        </Box>
    )
}

export default UserRateEvent

