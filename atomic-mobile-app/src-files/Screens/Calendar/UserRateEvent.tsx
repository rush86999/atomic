import React, { useState, useEffect } from 'react'

import Toast from 'react-native-toast-message'

import { dayjs } from '@app/date-utils'
import { getISODay, setISODay } from 'date-fns'
import { EventType, Time } from '@app/dataTypes/EventType'
import StarRating from 'react-native-star-rating-widget'
import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import getEventById from '@app/apollo/gql/getEventById'
import updateEventForPositiveRating from '@app/apollo/gql/updateEventForPositiveRating'
import updateEventForNegativeRating from '@app/apollo/gql/updateEventForNegativeRating'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import { addToSearchIndex } from '@screens/Calendar/UserTrainCalendarHelper'
import { Pressable } from 'react-native'

// dayjs.extend(utc)
// dayjs.extend(isoWeek)
/*
    This is the component that allows the user to rate the event.
    It is a modal that pops up when the user taps on the rate option in the right click menu.
    Update event based on the rating.
*/

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

    const updateEvent = async () => {
        try {
            if (rating === 0) {
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

            

            if (Math.round(rating - 3) > 0) {
                const positiveImpactScore = Math.round(rating - 3)
                const positiveImpactDayOfWeek = getISODay(dayjs(existingEvent.startDate).toDate())
                const positiveImpactTime: Time = dayjs(existingEvent.startDate).toDate().toTimeString().slice(0, 5) as Time
                
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
            
            Toast.show({
                type: 'success',
                position: 'top',
                text1: 'Time Block rated successfully',
                text2: '',
                visibilityTime: 1000,
                autoHide: true,
            })
            // setIsModalVisible(false)
            props.hideRating()
        } catch (error) {
            Toast.show({
                type: 'error',
                position: 'top',
                text1: 'Failed to rate event',
                text2: '',
                visibilityTime: 1000,
                autoHide: true,
            })

            
        }
    }

    useEffect(() => {
        if (rating > 0) {
            updateEvent()
        }
    }, [rating])

    return (
        <Box>
            <Text m={{ phone: 's', tablet: 'm' }} variant="rating">
                rate your productivity level
            </Text>
            <StarRating
                rating={rating}
                onChange={setRating}
                starSize={56}
            />
            <Box m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
            <Pressable onPress={() => props.hideRating()}>
                <Text variant="buttonLink">
                    Close
                </Text>
            </Pressable>
            </Box>
        </Box>
    )
}

export default UserRateEvent

