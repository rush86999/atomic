
import { ApolloClient, NormalizedCacheObject, gql } from '@apollo/client';
import { EventType, Time } from '@app/dataTypes/EventType';
import { addToSearchIndexAuthUrl, validateReceiptAuthUrl } from '@app/lib/constants';
import { Auth } from 'aws-amplify';
import axios from 'axios'

import Toast from 'react-native-toast-message'
import { esResponseBody } from '@screens/Calendar/types';
import listPreferredTimeRangesByEventId from '@app/apollo/gql/listPreferredTimeRangesByEventId';
import insertPreferredTimeRanges from '@app/apollo/gql/insertPreferredTimeRanges';
import { PreferredTimeRangeType } from '@app/dataTypes/PreferredTimeRangeType';
import deletePreferredTimeRangesByEventId from '@app/apollo/gql/deletePreferredTimeRangesByEventId';
import deletePreferredTimeRangeById from '@app/apollo/gql/deletePreferredTimeRangeById';
import insertPreferredTimeRange from '@app/apollo/gql/insertPreferredTimeRange';
import { dayjs, RNLocalize } from '@app/date-utils'

export const dayOfWeekIntToString = {
    1: 'MONDAY',
    2: 'TUESDAY',
    3: 'WEDNESDAY',
    4: 'THURSDAY',
    5: 'FRIDAY',
    6: 'SATURDAY',
    7: 'SUNDAY'
}

export const addToSearchIndex = async (
    event: EventType,
) => {
    try {

        const url = addToSearchIndexAuthUrl
        const token = (await Auth.currentSession()).getIdToken().getJwtToken()
        const config = {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        }


        const searchData = {
            search: `${event?.summary}${event?.notes ? `: ${event?.notes}` : ''}`,
            method: 'search',
        }
        const results = await axios.post<{ message: string, event: esResponseBody }>(url, searchData, config)



        if (results?.data?.event?.hits?.hits?.[0]?._id) {

            const deleteData = {
                eventId: results?.data?.event?.hits?.hits?.[0]?._id,
                method: 'delete'
            }

            const deleteResults = await axios.post<{ message: string, event: object }>(url, deleteData, config)

        }

        const addData = {
            eventId: event?.id,
            userId: event?.userId,
            eventDetails: `${event?.summary}: ${event?.notes}`,
            method: 'create'
        }

        const res = await axios.post<{ message: string, event: EventType }>(url, addData, config)

        return res.data.event

    } catch (e) {

    }
}

export const insertPreferredTimeRangeOneForEvent = async (
    client: ApolloClient<NormalizedCacheObject>,
    id: string,
    eventId: string,
    startTime: Time,
    endTime: Time,
    dayOfWeek: number,
    userId: string,
    createdDate: string,
    updatedAt: string,
) => {
    try {

        if (!startTime || !endTime) {
            throw new Error('startTime and endTime are required')
        }

        if (startTime > endTime) {
            Toast.show({
                text1: 'Oops...',
                text2: 'Start time must be before end time',
                type: 'error',
                position: 'top',
            })
            throw new Error('Start time must be before end time')
        }

        if (!eventId) {
            throw new Error('Event ID is required')
        }

        if (!id) {
            throw new Error('ID is required')
        }

        if (!createdDate) {
            throw new Error('Created date is required')
        }

        if (!updatedAt) {
            throw new Error('Updated date is required')
        }

        if (!userId) {
            throw new Error('userId is required')
        }

        const { data } = await client.mutate<{ insert_PreferredTimeRange_one: PreferredTimeRangeType }>({
            mutation: insertPreferredTimeRange,
            variables: {
                preferredTimeRange: {
                    id,
                    eventId,
                    startTime,
                    endTime,
                    dayOfWeek: dayOfWeek === -1 ? null : dayOfWeek,
                    userId,
                    createdDate,
                    updatedAt,
                }
            },
            fetchPolicy: 'no-cache'
        })
        return data.insert_PreferredTimeRange_one
    } catch (e) {

    }
}

export const insertPreferredTimeRangesForEvent = async (
    client: ApolloClient<NormalizedCacheObject>,
    preferredTimeRanges: PreferredTimeRangeType[],
) => {
    try {

        const { data } = await client.mutate<{ insert_PreferredTimeRange: { affected_rows: number, returning: PreferredTimeRangeType[] } }>({
            mutation: insertPreferredTimeRanges,
            variables: {
                preferredTimeRanges,
            },
        });

        return data.insert_PreferredTimeRange.returning;
    } catch (e) {

    }
}

export const deletePreferredTimeRangeWithId = async (
    client: ApolloClient<NormalizedCacheObject>,
    id: string,
) => {
    try {
        const { data } = await client.mutate<{ delete_PreferredTimeRange_by_pk: PreferredTimeRangeType }>({
            mutation: deletePreferredTimeRangeById,
            variables: {
                id,
            },
        });

        return data.delete_PreferredTimeRange_by_pk
    } catch (e) {

    }
}

export const deletePreferredTimeRangesByEvent = async (
    client: ApolloClient<NormalizedCacheObject>,
    eventId: string,
) => {
    try {
        const res = await client.mutate({
            mutation: deletePreferredTimeRangesByEventId,
            variables: {
                eventId,
            },
        });

        return res.data.delete_PreferredTimeRange.affected_rows
    } catch (e) {

    }
}

export const listPreferredTimeRangesByEvent = async (
    client: ApolloClient<NormalizedCacheObject>,
    eventId: string,
) => {
    try {
        const { data } = await client.query<{ PreferredTimeRange: PreferredTimeRangeType[] }>({
            query: listPreferredTimeRangesByEventId,
            variables: {
                eventId: eventId
            },
            fetchPolicy: 'no-cache'
        })
        return data.PreferredTimeRange
    } catch (e) {

    }
}

export const trainEventForPlanning = async (
    client: ApolloClient<NormalizedCacheObject>,
    id: string,
    copyAvailability?: boolean | null,
    copyTimeBlocking?: boolean | null,
    copyTimePreference?: boolean | null,
    copyReminders?: boolean | null,
    copyPriorityLevel?: boolean | null,
    copyModifiable?: boolean | null,
    copyCategories?: boolean | null,
    copyIsBreak?: boolean | null,
    copyIsMeeting?: boolean | null,
    copyIsExternalMeeting?: boolean | null,
    copyDuration?: boolean | null,
    copyColor?: boolean | null,
) => {
    try {
        const trainEventMutation = gql`
            mutation UpdateEventForTraining($id: String!,
                ${copyAvailability !== undefined ? '$copyAvailability: Boolean,' : ''}
                ${copyTimeBlocking !== undefined ? '$copyTimeBlocking: Boolean,' : ''}
                ${copyTimePreference !== undefined ? '$copyTimePreference: Boolean,' : ''}
                ${copyReminders !== undefined ? '$copyReminders: Boolean,' : ''}
                ${copyPriorityLevel !== undefined ? '$copyPriorityLevel: Boolean,' : ''}
                ${copyModifiable !== undefined ? '$copyModifiable: Boolean,' : ''}
                ${copyCategories !== undefined ? '$copyCategories: Boolean,' : ''}
                ${copyIsBreak !== undefined ? '$copyIsBreak: Boolean,' : ''}
                ${copyIsMeeting !== undefined ? '$copyIsMeeting: Boolean,' : ''}
                ${copyIsExternalMeeting !== undefined ? '$copyIsExternalMeeting: Boolean,' : ''}
                ${copyDuration !== undefined ? '$copyDuration: Boolean,' : ''}
                ${copyColor !== undefined ? '$copyColor: Boolean,' : ''}
            ) {
                update_Event_by_pk(
                    pk_columns: {id: $id}, 
                    _set: {
                        ${copyAvailability !== undefined ? 'copyAvailability: $copyAvailability,' : ''} 
                        ${copyTimeBlocking !== undefined ? 'copyTimeBlocking: $copyTimeBlocking,' : ''} 
                        ${copyTimePreference !== undefined ? 'copyTimePreference: $copyTimePreference,' : ''} 
                        ${copyReminders !== undefined ? 'copyReminders: $copyReminders,' : ''} 
                        ${copyPriorityLevel !== undefined ? 'copyPriorityLevel: $copyPriorityLevel,' : ''} 
                        ${copyModifiable !== undefined ? 'copyModifiable: $copyModifiable,' : ''} 
                        ${copyCategories !== undefined ? 'copyCategories: $copyCategories,' : ''} 
                        ${copyIsBreak !== undefined ? 'copyIsBreak: $copyIsBreak,' : ''} 
                        ${copyIsMeeting !== undefined ? 'copyIsMeeting: $copyIsMeeting,' : ''} 
                        ${copyIsExternalMeeting !== undefined ? 'copyIsExternalMeeting: $copyIsExternalMeeting,' : ''} 
                        ${copyDuration !== undefined ? 'copyDuration: $copyDuration,' : ''} 
                        ${copyColor !== undefined ? 'copyColor: $copyColor,' : ''}
                    }) {
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
                        title
                        timeBlocking
                        meetingId
                        eventId
                }
            }
        `;

        let variables: any = {
            id: id,
        }


        if (copyAvailability !== undefined) {
            variables = {
                ...variables,
                copyAvailability: copyAvailability,
            }
        }

        if (copyTimeBlocking !== undefined) {
            variables = {
                ...variables,
                copyTimeBlocking: copyTimeBlocking,
            }
        }

        if (copyTimePreference !== undefined) {
            variables = {
                ...variables,
                copyTimePreference: copyTimePreference,
            }
        }

        if (copyReminders !== undefined) {
            variables = {
                ...variables,
                copyReminders: copyReminders,
            }
        }

        if (copyPriorityLevel !== undefined) {
            variables = {
                ...variables,
                copyPriorityLevel: copyPriorityLevel,
            }
        }

        if (copyModifiable !== undefined) {
            variables = {
                ...variables,
                copyModifiable: copyModifiable,
            }
        }

        if (copyCategories !== undefined) {
            variables = {
                ...variables,
                copyCategories: copyCategories,
            }
        }

        if (copyIsBreak !== undefined) {
            variables = {
                ...variables,
                copyIsBreak: copyIsBreak,
            }
        }

        if (copyIsMeeting !== undefined) {
            variables = {
                ...variables,
                copyIsMeeting: copyIsMeeting,
            }
        }

        if (copyIsExternalMeeting !== undefined) {
            variables = {
                ...variables,
                copyIsExternalMeeting: copyIsExternalMeeting,
            }
        }

        if (copyDuration !== undefined) {
            variables = {
                ...variables,
                copyDuration: copyDuration,
            }
        }

        if (copyColor !== undefined) {
            variables = {
                ...variables,
                copyColor: copyColor,
            }
        }

        const response = (await client.mutate<{ update_Event_by_pk: EventType }>({
            mutation: trainEventMutation,
            variables,
        }))?.data?.update_Event_by_pk


        if (response) {
            await addToSearchIndex(response)
            return response
        }

    } catch (error) {

    }
}