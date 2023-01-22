import { Auth } from 'aws-amplify'
import { Platform } from 'react-native'
import Toast from 'react-native-toast-message'
import { DataStore } from '@aws-amplify/datastore'
import RNCalendarEvents, { Calendar } from 'react-native-calendar-events'

import { dayjs, RNLocalize } from '@app/date-utils'
import _ from 'lodash'


import { atomicUpsertEventInDb, createNewEvent, getCalendarInDb, meetingTypeStringType, reformatLocalEventsToDbEvents } from '@screens/Calendar/UserCreateCalendarHelper'

import { GroceryToDo, WeeklyToDo, MasterToDo, DailyToDo, Schedule, Day } from '@models'
import { PrimaryGoalType } from '@models'
import { deleteGoogleEvent } from '@app/calendar/googleCalendarHelper'
import { deleteLocalEvent } from '@app/calendar/localCalendarHelper'
import { localCalendarResource, googleCalendarResource } from '@app/calendar/constants'
import { EventType, Time } from '@app/dataTypes/EventType';
import { eventToQueueAuthUrl, calendarToQueueAuthUrl, eventToQueueShortAuthUrl, addToSearchIndexAuthUrl } from '@app/lib/constants'
import axios from 'axios'
import { updateEvent } from '@screens/Calendar/UserEditCalendarHelper'
import { updateCalendarEventLocale } from '@app/calendar/localCalendarHelper'

import {
    LocationType,
    BufferTime,
} from '@app/dataTypes/EventType'
import {
    sendUpdates,
    transparency,
    visibility,
} from '@app/calendar/types'
import { esResponseBody, Person } from '@screens/Calendar/types'
import { CALENDARNAME, DeadlineType } from '@progress/Todo/UserTask'
import { CalendarEventIdElType } from '@progress/Todo/UserTaskHelper'
import { CalendarType } from '@app/dataTypes/CalendarType'
import { getEventWithId, upsertCalendar } from '@app/calendar/calendarDbHelper'
import { palette } from '@theme/theme'
import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { ActiveSubscriptionType } from '@dataTypes/active_subscriptionType'
import listActiveSubscriptions from '@app/apollo/gql/listActiveSubscriptions'
import getEventById from '@app/apollo/gql/getEventById'
import deleteEventById from '@app/apollo/gql/deleteEventById'
import getCalendarById from '@app/apollo/gql/getCalendarById'
import { AdminBetaTestingType } from '@app/dataTypes/Admin_Beta_TestingType'
import getAdminBetaTesting from '@app/apollo/gql/getAdminBetaTesting'
import getCalendarWithResource from '@app/apollo/gql/getCalendarWithResource'
import listEventsNotLocallySynced from '@app/apollo/gql/listEventsNotLocallySynced'
import { getSubscriptionWithId } from '@screens/Payment/PaymentHelper'
import { deleteAttendeesForEvent } from '@screens/Calendar/Attendee/AttendeeHelper'
import { deleteConferencesWithIds } from '@screens/Calendar/Conference/ConferenceHelper'
import { removeRemindersForEvent } from '@screens/Calendar/Reminder/ReminderHelper'
import { deleteZoomMeeting, zoomAvailable } from '@app/zoom/zoomMeetingHelper'
import { getConferenceInDb } from '@screens/Calendar/UserCreateCalendarHelper';


type RecurrenceFrequency = 'daily' | 'weekly'
    | 'monthly' | 'yearly'

type taskType = 'Daily' | 'Weekly' | 'Master' | 'Grocery'

export const getEventForTask = async (
    eventId: string,
    client: ApolloClient<NormalizedCacheObject>,
) => {
    try {
        const event = (await client.query<{ Event_by_pk: EventType }>({
            query: getEventById,
            variables: {
                id: eventId,
            },
        })).data?.Event_by_pk
        return event
    } catch (e) {

    }
}

export const deleteEventForTask = async (
    taskId: string,
    type: taskType,
    client: ApolloClient<NormalizedCacheObject>,
    userId: string,
) => {
    try {
        if (type === 'Daily') {
            const task = await DataStore.query(DailyToDo, taskId)
            if (task?.eventId) {
                await delEventInAppForTask(task?.eventId, client, userId)
            }
        } else if (type === 'Weekly') {
            const task = await DataStore.query(WeeklyToDo, taskId)
            if (task?.eventId) {
                await delEventInAppForTask(task?.eventId, client, userId)
            }
        } else if (type === 'Master') {
            const task = await DataStore.query(MasterToDo, taskId)
            if (task?.eventId) {
                await delEventInAppForTask(task?.eventId, client, userId)
            }
        } else if (type === 'Grocery') {
            const task = await DataStore.query(GroceryToDo, taskId)
            if (task?.eventId) {
                await delEventInAppForTask(task?.eventId, client, userId)
            }
        }
    } catch (e) {

    }
}

export const delEventsForGoalType = async (
    primaryGoalType: PrimaryGoalType,
    secondaryGoalType: string,
    client: ApolloClient<NormalizedCacheObject>,
    userId: string,
) => {
    try {
        const schedules = await DataStore.query(Schedule, c => c.primaryGoalType('eq', primaryGoalType)
            .secondaryGoalType('eq', secondaryGoalType))
        if (schedules?.length > 0) {
            for (const schedule of schedules) {
                if (schedule?.eventId) {
                    await delEventInAppForTask(schedule?.eventId, client, userId)
                }
            }
        }
    } catch (e) {

    }
}

export const createEventFromUTCForTask = async (
    startDate: string,
    endDate: string,
    userId: string,
    client: ApolloClient<NormalizedCacheObject>,
    taskId: string,
    taskType: taskType,
    recurringEndDate?: string,
    frequency?: RecurrenceFrequency,
    interval?: number,
    title?: string,
    deadlineAlarms?: string[],
    notes?: string,
    byWeekDay?: Day[],
    hardDeadline?: string,
    softDeadline?: string,
    selectedCalendarId?: string,
) => {
    try {
        return createNewEvent(
            dayjs.utc(startDate).toISOString(),
            dayjs.utc(endDate).toISOString(),
            userId,
            client,
            selectedCalendarId,
            undefined,
            title,
            false,
            recurringEndDate,
            frequency,
            interval,
            deadlineAlarms,
            notes,
            undefined,
            false,
            false,
            false,
            true,
            false,
            false,
            false,
            false,
            RNLocalize.getTimeZone(),
            taskId,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
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
            title,
            'opaque',
            'private',
            undefined,
            undefined,
            undefined,
            undefined,
            RNLocalize.getTimeZone(),
            undefined,
            undefined,
            deadlineAlarms?.length > 0,
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
            taskType === 'Daily',
            taskType === 'Weekly',
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
            undefined,
            undefined,
            true,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            true,
            true,
            hardDeadline,
            softDeadline,
            undefined,
            undefined,
            undefined,
            undefined,
            dayjs(endDate).diff(dayjs(startDate), 'minute'),
            undefined,
            true,
            undefined,
            undefined,
            byWeekDay,
        )
    } catch (e) {

    }
}

export const createEventForTask = async (
    startDate: string,
    endDate: string,
    userId: string,
    client: ApolloClient<NormalizedCacheObject>,
    taskId: string,
    taskType: taskType,
    priority: number,
    recurringEndDate?: string,
    frequency?: RecurrenceFrequency,
    interval?: number,
    title?: string,
    deadlineAlarms?: string[],
    notes?: string,
    byWeekDay?: Day[],
    hardDeadline?: string,
    softDeadline?: string,
    selectedCalendarId?: string,
) => {
    try {
        return createNewEvent(
            startDate,
            endDate,
            userId,
            client,
            selectedCalendarId,
            undefined,
            title,
            false,
            recurringEndDate,
            frequency,
            interval,
            deadlineAlarms,
            notes,
            undefined,
            false,
            false,
            false,
            true,
            false,
            false,
            false,
            false,
            RNLocalize.getTimeZone(),
            taskId,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
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
            title,
            'opaque',
            'private',
            undefined,
            undefined,
            undefined,
            undefined,
            RNLocalize.getTimeZone(),
            undefined,
            undefined,
            deadlineAlarms?.length > 0,
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
            taskType === 'Daily',
            taskType === 'Weekly',
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
            undefined,
            undefined,
            true,
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            true,
            true,
            hardDeadline,
            softDeadline,
            undefined,
            undefined,
            undefined,
            undefined,
            dayjs(endDate).diff(dayjs(startDate), 'minute'),
            undefined,
            true,
            undefined,
            undefined,
            byWeekDay,
            priority,
        )
    } catch (e) {

    }
}

export const deleteEvent = async (client: ApolloClient<NormalizedCacheObject>, userId: string, eventId: string) => {
    try {


        await deleteAttendeesForEvent(client, eventId)
        const originalEvent = await getEventWithId(client, eventId)

        if (originalEvent?.conferenceId) {

            const isZoomAvailable = await zoomAvailable(client, userId)
            const conference = await getConferenceInDb(client, originalEvent?.conferenceId)

            if (isZoomAvailable && (conference?.app === 'zoom')) {
                await deleteZoomMeeting(userId, parseInt(originalEvent?.conferenceId, 10))
            }

            await deleteConferencesWithIds(client, [originalEvent?.conferenceId])
        }

        await removeRemindersForEvent(client, eventId)

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
            search: `${originalEvent?.summary}${originalEvent?.notes ? `: ${originalEvent?.notes}` : ''}`,
            method: 'search',
        }
        const results = await axios.post<{ message: string, event: esResponseBody }>(url, searchData, config)





        if (results?.data?.event?.hits?.hits?.[0]?._id === eventId) {

            const deleteData = {
                eventId: results?.data?.event?.hits?.hits?.[0]?._id,
                method: 'delete'
            }

            const deleteResults = await axios.post<{ message: string, event: object }>(url, deleteData, config)

        }

        await delEventInAppForTask(eventId, client, userId)
    } catch (e) {

    }
}

export const delEventInAppForTask = async (
    eventId: string,
    client: ApolloClient<NormalizedCacheObject>,
    userId: string,
) => {
    try {

        const eventDoc = (await client.query<{ Event_by_pk: EventType }>({
            query: getEventById,
            variables: {
                id: eventId,
            },
        }))?.data?.Event_by_pk

        if (eventDoc?.id) {
            const calendarId = eventDoc?.calendarId
            const calendarDoc = (await client.query<{ Calendar_by_pk: CalendarType }>({
                query: getCalendarById,
                variables: {
                    id: calendarId,
                },
            })).data?.Calendar_by_pk

            if (calendarDoc?.id) {
                const resource = calendarDoc?.resource

                if (resource === googleCalendarResource) {

                    await deleteGoogleEvent(client, userId, calendarId, eventId.split('#')[0])
                    await client.mutate<{ delete_Event_by_pk: EventType }>({
                        mutation: deleteEventById,
                        variables: {
                            id: eventId,
                        },
                        update(cache, { data }) {
                            const deletedEvent = data?.delete_Event_by_pk
                            const normalizedId = cache.identify({ id: deletedEvent.id, __typename: deletedEvent.__typename })
                            cache.evict({ id: normalizedId })
                            cache.gc()
                        }
                    })
                } else if (resource === localCalendarResource) {
                    await deleteLocalEvent(eventId, true)
                    await client.mutate<{ delete_Event_by_pk: EventType }>({
                        mutation: deleteEventById,
                        variables: {
                            id: eventId,
                        },
                        update(cache, { data }) {
                            const deletedEvent = data?.delete_Event_by_pk
                            const normalizedId = cache.identify({ id: deletedEvent.id, __typename: deletedEvent.__typename })
                            cache.evict({ id: normalizedId })
                            cache.gc()
                        }
                    })
                }
            }
        }
    } catch (e) {

    }
}


export const editEventForTask = async (
    id: string,
    startDate: string,
    endDate: string,
    userId: string,
    client: ApolloClient<NormalizedCacheObject>,
    selectedCalendarId: string,
    categoryIds?: string[],
    title?: string,
    allDay?: boolean,
    recurringEndDate?: string,
    frequency?: RecurrenceFrequency,
    interval?: number,
    alarms?: string[] | number[],
    notes?: string,
    location?: LocationType,
    isFollowUp?: boolean,
    isPreEvent?: boolean,
    isPostEvent?: boolean,
    modifiable?: boolean,
    anyoneCanAddSelf?: boolean,
    guestsCanInviteOthers?: boolean,
    guestsCanSeeOtherGuests?: boolean,
    originalAllDay?: boolean,
    timezone?: string,
    taskId?: string,
    taskType?: string,
    followUpEventId?: string,
    preEventId?: string,
    postEventId?: string,
    forEventId?: string,
    zoomMeet?: boolean,
    googleMeet?: boolean,
    meetingTypeString?: meetingTypeStringType,
    zoomPassword?: string,
    zoomPrivateMeeting?: boolean,
    attendees?: Person[],
    conferenceId?: string,
    maxAttendees?: number,
    sendUpdates?: sendUpdates,
    status?: string,
    summary?: string,
    transparency?: transparency,
    visibility?: visibility,
    recurringEventId?: string,
    iCalUID?: string,
    htmlLink?: string,
    colorId?: string,
    originalTimezone?: string,
    backgroundColor?: string,
    foregroundColor?: string,
    useDefaultAlarms?: boolean,
    positiveImpactScore?: number,
    negativeImpactScore?: number,
    positiveImpactDayOfWeek?: number,
    positiveImpactTime?: Time,
    negativeImpactDayOfWeek?: number,
    negativeImpactTime?: Time,
    preferredDayOfWeek?: number,
    preferredTime?: Time,
    isExternalMeeting?: boolean,
    isExternalMeetingModifiable?: boolean,
    isMeetingModifiable?: boolean,
    isMeeting?: boolean,
    dailyTaskList?: boolean,
    weeklyTaskList?: boolean,
    isBreak?: boolean,
    preferredStartTimeRange?: Time,
    preferredEndTimeRange?: Time,
    copyAvailability?: boolean,
    copyTimeBlocking?: boolean,
    copyTimePreference?: boolean,
    copyReminders?: boolean,
    copyPriorityLevel?: boolean,
    copyModifiable?: boolean,
    copyCategories?: boolean,
    copyIsBreak?: boolean,
    timeBlocking?: BufferTime,
    userModifiedAvailability?: boolean,
    userModifiedTimeBlocking?: boolean,
    userModifiedTimePreference?: boolean,
    userModifiedReminders?: boolean,
    userModifiedPriorityLevel?: boolean,
    userModifiedCategories?: boolean,
    userModifiedModifiable?: boolean,
    userModifiedIsBreak?: boolean,
    hardDeadline?: string,
    softDeadline?: string,
    copyIsMeeting?: boolean,
    copyIsExternalMeeting?: boolean,
    userModifiedIsMeeting?: boolean,
    userModifiedIsExternalMeeting?: boolean,
    duration?: number,
    copyDuration?: boolean,
    userModifiedDuration?: boolean,
    method?: 'create' | 'update',
    unlink?: boolean,
    byWeekDay?: Day[],
    priority?: number,
) => {
    try {

        return updateEvent(
            id,
            startDate,
            endDate,
            userId,
            client,
            selectedCalendarId,
            categoryIds,
            title,
            allDay,
            recurringEndDate,
            frequency,
            interval,
            alarms,
            notes,
            location,
            isFollowUp,
            isPreEvent,
            isPostEvent,
            modifiable,
            anyoneCanAddSelf,
            guestsCanInviteOthers,
            guestsCanSeeOtherGuests,
            originalAllDay,
            timezone,
            taskId,
            taskType,
            followUpEventId,
            preEventId,
            postEventId,
            forEventId,
            zoomMeet,
            googleMeet,
            meetingTypeString,
            zoomPassword,
            zoomPrivateMeeting,
            attendees,
            conferenceId,
            maxAttendees,
            sendUpdates,
            status,
            summary,
            transparency,
            visibility,
            recurringEventId,
            iCalUID,
            htmlLink,
            colorId,
            originalTimezone,
            backgroundColor,
            foregroundColor,
            useDefaultAlarms,
            positiveImpactScore,
            negativeImpactScore,
            positiveImpactDayOfWeek,
            positiveImpactTime,
            negativeImpactDayOfWeek,
            negativeImpactTime,
            preferredDayOfWeek,
            preferredTime,
            isExternalMeeting,
            isExternalMeetingModifiable,
            isMeetingModifiable,
            isMeeting,
            dailyTaskList,
            weeklyTaskList,
            isBreak,
            preferredStartTimeRange,
            preferredEndTimeRange,
            copyAvailability,
            copyTimeBlocking,
            copyTimePreference,
            copyReminders,
            copyPriorityLevel,
            copyModifiable,
            copyCategories,
            copyIsBreak,
            timeBlocking,
            userModifiedAvailability,
            userModifiedTimeBlocking,
            userModifiedTimePreference,
            userModifiedReminders,
            userModifiedPriorityLevel,
            userModifiedCategories,
            userModifiedModifiable,
            userModifiedIsBreak,
            hardDeadline,
            softDeadline,
            copyIsMeeting,
            copyIsExternalMeeting,
            userModifiedIsMeeting,
            userModifiedIsExternalMeeting,
            duration,
            copyDuration,
            userModifiedDuration,
            method,
            unlink,
            byWeekDay,
            priority,
        )
    } catch (e) {

    }
}


export const createDeadlineForTask = async (
    client: ApolloClient<NormalizedCacheObject>,
    userId: string,
    title: string,
    duration: number,
    taskId: string,
    taskType: taskType,
    priority: number,
    softDeadline?: string,
    hardDeadline?: string,
    reminders?: number[],
    categoryIds?: string[],
    colorId?: string,
    backgroundColor?: string,
    notes?: string,
) => {
    try {
        const calendarDoc = await getCalendarInDb(client, userId, undefined, true)
        const calendarId = calendarDoc?.id
        if (calendarId) {
            const eventId = await createNewEvent(
                dayjs().add(1, 'h').format(),
                dayjs().add(1, 'h').add(duration, 'minute').format(),
                userId,
                client,
                calendarId,
                categoryIds,
                title,
                false,
                undefined,
                undefined,
                undefined,
                reminders,
                notes || title,
                undefined,
                false,
                false,
                false,
                true,
                false,
                false,
                false,
                false,
                RNLocalize.getTimeZone(),
                taskId,
                taskType,
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
                title,
                'opaque',
                'private',
                undefined,
                undefined,
                undefined,
                colorId,
                undefined,
                backgroundColor,
                undefined,
                reminders?.length === 0,
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
                taskType === 'Daily',
                taskType === 'Weekly',
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
                undefined,
                undefined,
                undefined,
                true,
                true,
                categoryIds?.length > 0,
                true,
                true,
                true,
                true,
                hardDeadline,
                softDeadline,
                undefined,
                undefined,
                undefined,
                undefined,
                duration,
                undefined,
                true,
                undefined,
                undefined,
                undefined,
                priority,
            )
            return eventId
        }

    } catch (e) {

    }
}

export const createDeadlineEventForTaskList = async (
    client: ApolloClient<NormalizedCacheObject>,
    userId: string,
    title: string,
    duration: number,
    taskId: string,
    taskType: taskType,
    priority: number,
    softDeadline?: string,
    hardDeadline?: string,
): Promise<EventType> => {
    try {
        let calendarDoc: CalendarType = null
        calendarDoc = await getCalendarInDb(client, userId, undefined, true)




        if (!calendarDoc || (calendarDoc?.resource !== googleCalendarResource)) {
            calendarDoc = await getCalendarInDb(client, userId, undefined, undefined, googleCalendarResource)
        }




        const calendarId = calendarDoc?.id



        if (calendarId && (calendarDoc?.resource === googleCalendarResource)) {
            const colorId = calendarDoc?.colorId
            const backgroundColor = calendarDoc?.backgroundColor

            const startDate = dayjs().add(1, 'h').format()
            const endDate = dayjs().add(1, 'h').add(duration, 'minute').format()
            const dailyTaskList = taskType === 'Daily'
            const weeklyTaskList = taskType === 'Weekly'
            const eventId = await createNewEvent(
                startDate,
                endDate,
                userId,
                client,
                calendarId,
                undefined,
                title,
                false,
                undefined,
                undefined,
                undefined,
                undefined,
                title,
                undefined,
                false,
                false,
                false,
                true,
                false,
                false,
                false,
                false,
                RNLocalize.getTimeZone(),
                taskId,
                taskType,
                undefined,
                undefined,
                undefined,
                undefined,
                false,
                false,
                undefined,
                undefined,
                false,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                title,
                'opaque',
                'private',
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                backgroundColor,
                undefined,
                true,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                false,
                true,
                true,
                false,
                dailyTaskList,
                weeklyTaskList,
                false,
                undefined,
                undefined,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                false,
                undefined,
                false,
                false,
                false,
                false,
                true,
                false,
                true,
                true,
                hardDeadline,
                softDeadline,
                false,
                false,
                true,
                true,
                duration,
                false,
                true,
                'create',
                false,
                undefined,
                priority,
            )

            return {
                id: `${eventId}#${calendarId}`,
                eventId,
                userId,
                dailyTaskList,
                weeklyTaskList,
                calendarId,
                title,
                duration,
                taskId,
                taskType,
                priority,
                colorId,
                backgroundColor,
                startDate,
                endDate,
                createdDate: dayjs().toISOString(),
                updatedAt: dayjs().toISOString(),
                deleted: false,
                timezone: RNLocalize.getTimeZone(),
                isFollowUp: false,
                isPreEvent: false,
                isPostEvent: false,
                modifiable: true,
                anyoneCanAddSelf: false,
                guestsCanInviteOthers: false,
                guestsCanSeeOtherGuests: false,
                originalStartDate: dayjs().format(),
                originalAllDay: false,
                summary: title,
                transparency: 'opaque',
                visibility: 'private',
                isBreak: false,
                userModifiedAvailability: false,
                userModifiedPriorityLevel: true,
                userModifiedModifiable: true,
                userModifiedIsBreak: true,
                softDeadline,
                hardDeadline,
                userModifiedDuration: true,
                method: 'update',
                notes: title,
            }
        }
    } catch (e) {

    }
}

export const submitCalendarForQueue = async (
    client: ApolloClient<NormalizedCacheObject>,
    userId: string,
    startDate: string,
    endDate: string,
) => {
    try {

        const calendar = await getCalendarInDb(client, userId, undefined, undefined, googleCalendarResource)
        if (!calendar) {

            return
        }

        const token = (await Auth.currentSession()).getIdToken().getJwtToken()
        const config = {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        }
        const body = {
            userId,
            startDate,
            endDate: endDate,
            timezone: RNLocalize.getTimeZone(),
        }

        const url = calendarToQueueAuthUrl
        const results = await axios.post(url, body, config)
        if (results.data.message) {
            Toast.show({
                type: 'success',
                position: 'top',
                text1: 'Running Schedule Assist... check back in a few minutes',
            })
        }
        
    } catch (e) {

    }
}

export const getCurrentActiveSubscriptions = async (
    client: ApolloClient<NormalizedCacheObject>,
    userId: string,
) => {
    try {
        const active_subscriptionsDoc = (await client.query<{ Active_Subscription: ActiveSubscriptionType[] }>({
            query: listActiveSubscriptions,
            variables: {
                userId,
                currentDate: dayjs().format(),
            },
            fetchPolicy: 'no-cache',
        }))?.data?.Active_Subscription

        return active_subscriptionsDoc
    } catch (e) {

    }
}

export const getadmin_beta_testing = async (
    client: ApolloClient<NormalizedCacheObject>,
) => {
    try {
        return (await client.query<{ Admin_Beta_Testing: AdminBetaTestingType[] }>({ query: getAdminBetaTesting }))?.data?.Admin_Beta_Testing?.[0]
    } catch (e) {

    }
}

export const submitEventForQueue = async (
    event: EventType,
    client: ApolloClient<NormalizedCacheObject>,
    userId: string,
    isDaily?: boolean,
) => {
    try {
        const activeSubscriptions = await getCurrentActiveSubscriptions(client, userId)
        const subscriptions = await Promise.all(activeSubscriptions?.map(async (activeSubscription) => getSubscriptionWithId(client, activeSubscription.subscriptionId)))
        const isPro = subscriptions?.some(subscription => (subscription.title === 'Pro'))
        const isPremium = subscriptions?.some(subscription => (subscription.title === 'Premium'))
        const enableTesting = (await getadmin_beta_testing(client))?.enableTesting
        const calendar = await getCalendarInDb(client, userId, undefined, undefined, googleCalendarResource)
        if (!calendar) {

            return
        }
        if (enableTesting || isPremium || isPro) {
            const token = (await Auth.currentSession()).getIdToken().getJwtToken()
            const url = isDaily === true ? eventToQueueShortAuthUrl : eventToQueueAuthUrl
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
            }
            const filteredEvent = _.omit(event, ['__typename'])
            const results = await axios.post(url, filteredEvent, config)
            if (results.data.message) {
                Toast.show({
                    type: 'success',
                    position: 'top',
                    text2: 'Event added to queue for schedule assist',
                    text1: 'Planning Week',
                })
            }
        } else {
            Toast.show({
                type: 'info',
                text1: 'Need Paid Plan',
                text2: 'Please use a paid plan to use this service.'
            })
        }

    } catch (e) {

    }
}

export const submitDailyTaskEventForQueue = async (
    event: EventType,
    client: ApolloClient<NormalizedCacheObject>,
    userId: string,
) => {
    try {
        const activeSubscriptions = await getCurrentActiveSubscriptions(client, userId)
        const subscriptions = await Promise.all(activeSubscriptions?.map(async (activeSubscription) => getSubscriptionWithId(client, activeSubscription.subscriptionId)))
        const isPro = subscriptions?.some(subscription => (subscription.title === 'Pro'))
        const isPremium = subscriptions?.some(subscription => (subscription.title === 'Premium'))
        const enableTesting = (await getadmin_beta_testing(client))?.enableTesting
        if (enableTesting || isPremium || isPro) {
            const token = (await Auth.currentSession()).getIdToken().getJwtToken()
            const url = eventToQueueShortAuthUrl
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
            }
            const filteredEvent = _.omit(event, ['__typename'])
            const results = await axios.post(url, filteredEvent, config)
            if (results.data.message) {
                Toast.show({
                    type: 'success',
                    position: 'top',
                    text2: 'Event added to queue for schedule assist',
                    text1: 'Planning Week',
                })
            }
        } else {
            Toast.show({
                type: 'info',
                text1: 'Need Paid Plan',
                text2: 'Please use a paid plan to use this service.'
            })
        }

    } catch (e) {

    }
}

export const createDailyDeadline = async (
    client: ApolloClient<NormalizedCacheObject>,
    userId: string,
    taskId: string,
    newDailyTaskText: string,
    newDailyPriority: number,
    newDailyDeadline: string,
    newDailyDeadlineType: DeadlineType,
    newDailyDuration: number,
) => {
    try {
        const notes = newDailyTaskText

        if (!notes) {
            Toast.show({
                type: 'info',
                text1: 'Empty',
                text2: 'Your task is empty'
            })
            return
        }


        const event = await createDeadlineEventForTaskList(client, userId, notes, newDailyDuration, taskId, 'Daily', newDailyPriority, newDailyDeadlineType === 'soft' ? newDailyDeadline : null, newDailyDeadlineType === 'hard' ? newDailyDeadline : null)

        if (event) {
            return event
        }
        return null
    } catch (e) {

    }
}

export const createWeeklyDeadline = async (
    client: ApolloClient<NormalizedCacheObject>,
    userId: string,
    taskId: string,
    newWeeklyTaskText: string,
    newWeeklyPriority: number,
    newWeeklyDeadline: string,
    newWeeklyDeadlineType: DeadlineType,
    newWeeklyDuration: number,
) => {
    try {
        const notes = newWeeklyTaskText

        if (!notes) {
            Toast.show({
                type: 'info',
                text1: 'Empty',
                text2: 'Your task is empty'
            })
            return
        }


        const event = await createDeadlineEventForTaskList(client, userId, notes, newWeeklyDuration, taskId, 'Weekly', newWeeklyPriority, newWeeklyDeadlineType === 'soft' ? newWeeklyDeadline : null, newWeeklyDeadlineType === 'hard' ? newWeeklyDeadlineType : null)
        if (event) {
            return event
        }
    } catch (e) {

    }
}


export const localCalendarPostPlannerSync = async (
    client: ApolloClient<NormalizedCacheObject>,
    userId: string,
) => {
    try {
        const calendarDocs = (await client.query<{ Calendar: CalendarType[] }>({
            query: getCalendarWithResource,
            variables: {
                userId,
                resource: localCalendarResource,
            },
        })).data?.Calendar
        if (calendarDocs.length > 0) {
            await submitCalendarForQueue(client, userId, dayjs().format(), dayjs().add(6, 'd').hour(23).minute(59).format())
            setTimeout(async () => {
                for (let i = 0; i < calendarDocs.length; i++) {
                    const calendarDoc = calendarDocs[i]
                    const calendarId = calendarDoc?.id
                    const eventDocs = (await client.query<{ Event: EventType[] }>({
                        query: listEventsNotLocallySynced,
                        variables: {
                            userId,
                            calendarId,
                        },
                    }))?.data?.Event
                    for (let j = 0; j < eventDocs.length; j++) {
                        const event = eventDocs[j]
                        await updateCalendarEventLocale(
                            event?.calendarId,
                            event?.eventId,
                            event?.startDate,
                            event?.endDate,
                        )

                        await atomicUpsertEventInDb(
                            client,
                            event?.id,
                            event?.eventId,
                            event?.userId,
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
                            dayjs().toISOString(),
                            event?.calendarId,
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
                            'update',
                            undefined,
                            undefined,
                            true,
                        )
                    }

                }
            }, 6000)
        }

    } catch (e) {

    }
}

export const getOrRequestCalendar = async (calendarEventIdEl: CalendarEventIdElType) => {
    const oldStatus = await RNCalendarEvents.checkPermissions()
    let status
    if (oldStatus !== 'authorized') {
        const newStatus = await RNCalendarEvents.requestPermissions()

        status = newStatus
    }

    if (status === 'authorized' || oldStatus === 'authorized') {
        const newCalendars = await RNCalendarEvents.findCalendars()

        const atomicCalendars = newCalendars.filter(each => each.title === CALENDARNAME)


        if (atomicCalendars?.[0]?.id) {

            calendarEventIdEl.current = atomicCalendars?.[0]?.id
            return
        }

        const defaultCalendarSource = Platform.OS === 'ios'
            ? newCalendars.filter(each => each.source === 'Default')?.[0].source
            : { isLocalAccount: true, name: CALENDARNAME, type: '' }

        const newCalendarId = Platform.OS === 'ios' ? await RNCalendarEvents.saveCalendar({
            title: CALENDARNAME,
            color: palette['purple'],
            entityType: 'event',
            source: undefined,
            name: CALENDARNAME,
            ownerAccount: 'personal',
            accessLevel: 'owner',
        }) : await RNCalendarEvents.saveCalendar({
            title: CALENDARNAME,
            color: palette['purple'],
            entityType: 'event',
            source: defaultCalendarSource as { isLocalAccount: boolean; name: string; type: string; },
            name: CALENDARNAME,
            ownerAccount: 'personal',
            accessLevel: 'owner',
        })

        calendarEventIdEl.current = newCalendarId
    } else {
        Toast.show({
            type: 'error',
            text1: 'Need Calendar Access',
            text2: 'Task Reminder works by setting reminders in your calendar and thus needs access to remind you of breaks and active time'
        })
    }
}

export const reformatLocalToCalendarInDb = (
    calendar: Calendar,
    userId: string,
) => {

    const calendarInDb: CalendarType = {
        id: calendar?.id,
        userId,
        title: calendar?.title,
        backgroundColor: calendar?.color,
        modifiable: calendar?.allowsModifications,
        deleted: false,
        createdDate: dayjs().toISOString(),
        updatedAt: dayjs().toISOString(),
        resource: localCalendarResource,
    }
    return calendarInDb
}

export const saveAllLocalCalendars = async (
    client: ApolloClient<NormalizedCacheObject>,
    userId: string,
) => {
    try {
        const oldStatus = await RNCalendarEvents.checkPermissions()

        let status = oldStatus
        if (oldStatus !== 'authorized') {
            const newStatus = await RNCalendarEvents.requestPermissions()

            status = newStatus
        }



        if (status === 'authorized' || oldStatus === 'authorized') {
            const newCalendars = await RNCalendarEvents.findCalendars()


            const listToExclude = ['Siri Suggestions', 'Birthdays', 'US Holidays']
            for (let i = 0; i < newCalendars.length; i++) {
                const newCalendar = newCalendars[i]

                if (listToExclude.includes(newCalendar.title)) {
                    continue
                }

                const formattedCalendar = reformatLocalToCalendarInDb(newCalendar, userId)
                await upsertCalendar(client, formattedCalendar)
                const localEvents = await RNCalendarEvents.fetchAllEvents(dayjs().subtract(1, 'year').toISOString(), dayjs().add(1, 'year').toISOString(), [newCalendar.id])

                const eventsForDb = reformatLocalEventsToDbEvents(localEvents, userId)
                for (let j = 0; j < eventsForDb.length; j++) {
                    const event = eventsForDb[j]
                    await atomicUpsertEventInDb(
                        client,
                        event?.id,
                        event?.eventId,
                        userId,
                        event?.startDate,
                        event?.endDate,
                        event?.createdDate,
                        false,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        true,
                        event?.anyoneCanAddSelf,
                        event?.guestsCanInviteOthers,
                        event?.guestsCanSeeOtherGuests,
                        event?.originalStartDate,
                        event?.originalAllDay,
                        event?.updatedAt,
                        event?.calendarId,
                        event?.title || event?.summary,
                        event?.allDay,
                        event?.recurrenceRule,
                        event?.location,
                        event?.notes,
                        event?.attachments,
                        event?.links,
                        event?.timezone,
                        event?.taskId,
                        event?.taskType,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        event?.conferenceId,
                        event?.maxAttendees,
                        event?.sendUpdates,
                        event?.status,
                        event?.summary,
                        event?.transparency,
                        event?.visibility,
                        event?.recurringEventId,
                        event?.iCalUID,
                        event?.htmlLink,
                        event?.colorId,
                        event?.creator,
                        event?.organizer,
                        event?.endTimeUnspecified,
                        event?.recurrence,
                        event?.originalTimezone,
                        event?.attendeesOmitted,
                        event?.extendedProperties,
                        event?.hangoutLink,
                        event?.guestsCanModify,
                        event?.locked,
                        event?.source,
                        event?.eventType,
                        event?.privateCopy,
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
                        dayjs(event?.endDate).diff(event?.startDate, 'm'),
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                    )
                }
            }
        }
    } catch (e) {

    }
}
