import got from "got"
import { authApiToken, eventVectorName, googleCalendarResource, googleCalendarStopWatchUrl, googleClientIdAndroid, googleClientIdIos, googleClientIdWeb, googleClientSecretWeb, googleColorUrl, googleMeetResource, googleTokenUrl, hasuraAdminSecret, hasuraGraphUrl, openSearchEndPoint, searchIndex, selfGoogleCalendarWebhookPublicUrl, text2VectorUrl, vectorDimensions, zoomBaseTokenUrl, zoomBaseUrl, zoomClientId, zoomClientSecret, zoomResourceName } from "./constants"
import { ActiveSubscriptionType, AdminBetaTestingType, CalendarType, CalendarWebhookType, esResponseBody, EventPlusType, EventResourceType, EventType, GoogleAttachmentType, GoogleAttendeeType, GoogleConferenceDataType, GoogleEventType1, GoogleExtendedPropertiesType, GoogleReminderType, GoogleSendUpdatesType, GoogleSourceType, GoogleTransparencyType, GoogleVisibilityType, MeetingAssistAttendeeType, OverrideTypes, ReminderType, UserPreferenceType } from "./types"
import _ from 'lodash'
import { v4 as uuid } from 'uuid'
import { getISODay } from 'date-fns'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import duration from 'dayjs/plugin/duration'
// import isoWeek from 'dayjs/plugin/isoWeek'
import isBetween from 'dayjs/plugin/isBetween'
import timezone from 'dayjs/plugin/timezone'
import { AttendeeType, CalendarIntegrationType, CalendarWatchRequestResourceType, colorTypeResponse, ConferenceType } from "@functions/googleCalendarSync/types"
import { google } from 'googleapis'
import { defaultProvider } from '@aws-sdk/credential-provider-node'
import createAwsOpensearchConnector from 'aws-opensearch-connector'
import { Client } from '@opensearch-project/opensearch'
import { Config, ConfigurationOptions, AWSError } from "aws-sdk"
import { APIVersions } from "aws-sdk/lib/config"
import { ConfigurationServicePlaceholders } from "aws-sdk/lib/config_service_placeholders"
import { Token } from "aws-sdk/lib/token"
import { initialGoogleCalendarSync2 } from "@functions/googleCalendarSync/handler"
import { EventTriggerType } from "@functions/googlePeopleSync/types"
import axios from "axios"
import qs from 'qs'

dayjs.extend(utc)
dayjs.extend(duration)
// dayjs.extend(isoWeek)
dayjs.extend(isBetween)
dayjs.extend(timezone)


export const insertEventTriggers = async (
    objects: EventTriggerType[],
) => {
    try {
        const operationName = 'insertEventTriggers'
        const query = `
      mutation insertEventTriggers($objects: [Event_Trigger_insert_input!]!) {
        insert_Event_Trigger(objects: $objects) {
          affected_rows
        }
      }
    `
        const variables = {
            objects
        }

        const res: { data: { insert_Event_Trigger: { affected_rows: number } } } = await got.post(
            hasuraGraphUrl,
            {
                json: {
                    operationName,
                    query,
                    variables,
                },
                headers: {
                    'X-Hasura-Admin-Secret': hasuraAdminSecret,
                    'Content-Type': 'application/json',
                    'X-Hasura-Role': 'admin'
                },
            },
        ).json()


    } catch (e) {

    }
}

export const getEventTriggerByResourceId = async (
    resourceId: string,
) => {
    try {
        if (!resourceId) {

            return
        }

        const operationName = 'GetEventTriggerByResourceId'
        const query = `
    query GetEventTriggerByResourceId($resourceId: String) {
      Event_Trigger(where: {resourceId: {_eq: $resourceId}}) {
        createdAt
        id
        name
        resource
        resourceId
        updatedAt
        userId
      }
    }
    `
        const response: { data: { Event_Trigger: EventTriggerType[] } } = await got.post(
            hasuraGraphUrl,
            {
                headers: {
                    'X-Hasura-Admin-Secret': hasuraAdminSecret,
                    'Content-Type': 'application/json',
                    'X-Hasura-Role': 'admin'
                },
                json: {
                    operationName,
                    query,
                    variables: {
                        resourceId,
                    },
                },
            },
        ).json()

        return response?.data?.Event_Trigger?.[0]

    } catch (e) {

    }
}

export const deleteEventTriggerById = async (
    id: string,
) => {
    try {
        const operationName = 'deleteEventTriggerById'
        const query = `
      mutation deleteEventTriggerById($id: uuid!) {
        delete_Event_Trigger_by_pk(id: $id) {
          id
        }
      }
    `
        const res = await got.post(
            hasuraGraphUrl,
            {
                headers: {
                    'X-Hasura-Admin-Secret': hasuraAdminSecret,
                    'Content-Type': 'application/json',
                    'X-Hasura-Role': 'admin'
                },
                json: {
                    operationName,
                    query,
                    variables: {
                        id,
                    },
                },
            },
        ).json()

    } catch (e) {

    }
}

export const resetGoogleSyncForCalendar = async (
    calendarId: string,
    userId: string,
    clientType: 'ios' | 'android' | 'web',
) => {
    try {
        const operationName = 'updateCalendar'
        const query = `mutation updateCalendar($id: String!, $changes: Calendar_set_input) {
      update_Calendar_by_pk(pk_columns: {id: $id}, _set: $changes) {
        pageToken
        syncToken
      }
    }
    `
        const variables = {
            id: calendarId,
            changes: {
                pageToken: null,
                syncToken: null
            }
        }

        const response = await got.post(hasuraGraphUrl, {
            headers: {
                'X-Hasura-Admin-Secret': hasuraAdminSecret,
                'X-Hasura-Role': 'admin'
            },
            json: {
                operationName,
                query,
                variables,
            }
        }).json()

        // const { token: authToken } = await getGoogleIntegration(calendarIntegrationId)
        return initialGoogleCalendarSync2(
            calendarId,
            userId,
            clientType,
        )
    } catch (e) {

    }

}

export const deleteMeetingAssistsGivenIds = async (
    ids: string[],
) => {
    try {
        const operationName = 'DeleteMeetingAssistsByIds'
        const query = `
            mutation DeleteMeetingAssistsByIds($ids: [uuid!]!) {
                delete_Meeting_Assist(where: {id: {_in: $ids}}) {
                    affected_rows
                    returning {
                    allowAttendeeUpdatePreferences
                    anyoneCanAddSelf
                    attendeeCanModify
                    attendeeCount
                    attendeeRespondedCount
                    backgroundColor
                    bufferTime
                    calendarId
                    cancelIfAnyRefuse
                    cancelled
                    colorId
                    conferenceApp
                    createdDate
                    duration
                    enableAttendeePreferences
                    enableConference
                    enableHostPreferences
                    endDate
                    eventId
                    expireDate
                    foregroundColor
                    frequency
                    guaranteeAvailability
                    guestsCanInviteOthers
                    guestsCanSeeOtherGuests
                    id
                    interval
                    location
                    minThresholdCount
                    notes
                    originalMeetingId
                    priority
                    reminders
                    sendUpdates
                    startDate
                    summary
                    timezone
                    transparency
                    until
                    updatedAt
                    useDefaultAlarms
                    userId
                    visibility
                    windowEndDate
                    windowStartDate
                    }
                }
            }
        `

        const variables = {
            ids,
        }

        const res = await got.post(hasuraGraphUrl, {
            headers: {
                'X-Hasura-Admin-Secret': hasuraAdminSecret,
                'X-Hasura-Role': 'admin'
            },
            json: {
                operationName,
                query,
                variables,
            }
        }).json()


    } catch (e) {

    }
}

export const incrementalGoogleCalendarSync2 = async (
    calendarId: string,
    userId: string,
    clientType: 'ios' | 'android' | 'web',
    parentSyncToken: string,
    parentPageToken?: string,
    colorItem?: colorTypeResponse,
) => {
    try {
        let pageToken = parentPageToken
        let syncToken = parentSyncToken
        let localItems: EventResourceType[] | [] = []

        const token = await getGoogleAPIToken(userId, googleCalendarResource, clientType)

        const googleCalendar = google.calendar({
            version: 'v3',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })

        const initialVariables: any = {
            // Calendar identifier. To retrieve calendar IDs call the calendarList.list method. If you want to access the primary calendar of the currently logged in user, use the "primary" keyword.
            calendarId,
            // Whether to include deleted events (with status equals "cancelled") in the result. Cancelled instances of recurring events (but not the underlying recurring event) will still be included if showDeleted and singleEvents are both False. If showDeleted and singleEvents are both True, only single instances of deleted events (but not the underlying recurring events) are returned. Optional. The default is False.
            showDeleted: true,
            // Whether to expand recurring events into instances and only return single one-off events and instances of recurring events, but not the underlying recurring events themselves. Optional. The default is False.
            singleEvents: true,
            syncToken,
        }

        if (parentPageToken) {
            initialVariables.pageToken = parentPageToken
        }

        const res = await googleCalendar.events.list(initialVariables)


        // {
        //   "accessRole": "my_accessRole",
        //   "defaultReminders": [],
        //   "description": "my_description",
        //   "etag": "my_etag",
        //   "items": [],
        //   "kind": "my_kind",
        //   "nextPageToken": "my_nextPageToken",
        //   "nextSyncToken": "my_nextSyncToken",
        //   "summary": "my_summary",
        //   "timeZone": "my_timeZone",
        //   "updated": "my_updated"
        // }
        const { items, nextPageToken, nextSyncToken } = res.data

        localItems = items as EventResourceType[]
        pageToken = nextPageToken
        syncToken = nextSyncToken

        await updateGoogleCalendarTokensInDb(calendarId, nextSyncToken, nextPageToken)
        const status = 'cancelled'

        const deletedEvents = localItems.filter((e) => (e?.status === status))

        if (deletedEvents?.[0]?.id) {

            // remove any index
            const toDeleteText = deletedEvents.map(e => (`${e?.summary}${e?.description ? `: ${e?.description}` : ''}`))

            const vectors = await Promise.all(toDeleteText.map(t => convertTextToVectorSpace2(t)))
            const results = await Promise.all(vectors.map(v => searchData3(userId, v)))

            for (const r of results) {
                if (r?.hits?.hits?.[0]?._id) {
                    const id = r?.hits?.hits?.[0]?._id
                    const foundEvent = deletedEvents.find(e => e?.id === id)
                    if (foundEvent) {
                        await deleteDocInSearch3(r?.hits?.hits?.[0]?._id)
                    }
                }
            }



            const returnedDeletedEventValues = await deleteEvents(deletedEvents, calendarId)
            const meetingIdsToDelete = returnedDeletedEventValues
                ?.filter(e => !!(e?.meetingId))
                ?.map(e => (e?.meetingId))

            if (meetingIdsToDelete && (meetingIdsToDelete?.length > 0)) {
                await deleteMeetingAssistsGivenIds(meetingIdsToDelete)
            }

            // delete any virtual conferences
            await deleteConferences(returnedDeletedEventValues)


            const promises = [
                deleteAttendees(deletedEvents, calendarId),
                deleteReminders(deletedEvents, userId, calendarId)
            ]

            await Promise.all(promises)
        }

        const eventsToUpsert = localItems?.filter((e) => (e?.status !== status))

        // no events to upsert check next pagetoken
        if (!(eventsToUpsert?.[0]?.id)) {

            const variables: any = {
                // Calendar identifier. To retrieve calendar IDs call the calendarList.list method. If you want to access the primary calendar of the currently logged in user, use the "primary" keyword.
                calendarId,
                // Whether to include deleted events (with status equals "cancelled") in the result. Cancelled instances of recurring events (but not the underlying recurring event) will still be included if showDeleted and singleEvents are both False. If showDeleted and singleEvents are both True, only single instances of deleted events (but not the underlying recurring events) are returned. Optional. The default is False.
                showDeleted: true,
                // Whether to expand recurring events into instances and only return single one-off events and instances of recurring events, but not the underlying recurring events themselves. Optional. The default is False.
                singleEvents: true,
                syncToken,
            }

            if (pageToken) {
                variables.pageToken = pageToken
                const res = await googleCalendar.events.list(variables)


                const { items, nextPageToken, nextSyncToken } = res.data

                localItems = items as EventResourceType[]
                pageToken = nextPageToken
                syncToken = nextSyncToken

                await updateGoogleCalendarTokensInDb(calendarId, nextSyncToken, nextPageToken)
                const deletedEvents = localItems.filter((e) => (e?.status === status))

                if (deletedEvents?.[0]?.id) {

                    // remove any index
                    const toDeleteText = deletedEvents.map(e => (`${e?.summary}${e?.description ? `: ${e?.description}` : ''}`))

                    const vectors = await Promise.all(toDeleteText.map(t => convertTextToVectorSpace2(t)))
                    const results = await Promise.all(vectors.map(v => searchData3(userId, v)))

                    for (const r of results) {
                        if (r?.hits?.hits?.[0]?._id) {
                            const id = r?.hits?.hits?.[0]?._id
                            const foundEvent = deletedEvents.find(e => e?.id === id)
                            if (foundEvent) {
                                await deleteDocInSearch3(r?.hits?.hits?.[0]?._id)
                            }
                        }
                    }



                    const returnedDeletedEventValues = await deleteEvents(deletedEvents, calendarId)
                    const meetingIdsToDelete = returnedDeletedEventValues
                        ?.filter(e => !!(e?.meetingId))
                        ?.map(e => (e?.meetingId))

                    if (meetingIdsToDelete && (meetingIdsToDelete?.length > 0)) {
                        await deleteMeetingAssistsGivenIds(meetingIdsToDelete)
                    }

                    await deleteConferences(returnedDeletedEventValues)

                    const promises = [
                        deleteAttendees(deletedEvents, calendarId),
                        deleteReminders(deletedEvents, userId, calendarId)
                    ]

                    await Promise.all(promises)
                }

                const eventsToUpsert2 = localItems?.filter((e) => (e?.status !== status))
                if (eventsToUpsert2?.[0]?.id) {

                    await upsertEvents2(eventsToUpsert2, userId, calendarId, colorItem)
                    await upsertConference2(eventsToUpsert2, userId, calendarId)

                    const promises = [
                        deleteReminders(eventsToUpsert2, userId, calendarId),
                        insertRemindersGivenEventResource(eventsToUpsert2, userId, calendarId),
                        upsertAttendees2(eventsToUpsert2, userId, calendarId),

                    ]

                    await Promise.all(promises)
                }
            }
        } else {

            await upsertEvents2(eventsToUpsert, userId, calendarId, colorItem)
            await upsertConference2(eventsToUpsert, userId, calendarId)
            await deleteReminders(eventsToUpsert, userId, calendarId)
            const promises = [
                insertRemindersGivenEventResource(eventsToUpsert, userId, calendarId),
                upsertAttendees2(eventsToUpsert, userId, calendarId),
            ]
            await Promise.all(promises)

        }

        if (pageToken) {
            // fetch all pages
            while (pageToken) {
                const variables: any = {
                    // Calendar identifier. To retrieve calendar IDs call the calendarList.list method. If you want to access the primary calendar of the currently logged in user, use the "primary" keyword.
                    calendarId,
                    // Token specifying which result page to return. Optional.
                    pageToken,
                    // Whether to include deleted events (with status equals "cancelled") in the result. Cancelled instances of recurring events (but not the underlying recurring event) will still be included if showDeleted and singleEvents are both False. If showDeleted and singleEvents are both True, only single instances of deleted events (but not the underlying recurring events) are returned. Optional. The default is False.
                    showDeleted: true,
                    // Whether to expand recurring events into instances and only return single one-off events and instances of recurring events, but not the underlying recurring events themselves. Optional. The default is False.
                    singleEvents: true,
                    syncToken,
                }

                const res = await googleCalendar.events.list(variables)


                const { items, nextPageToken, nextSyncToken } = res.data

                localItems = items as EventResourceType[]
                pageToken = nextPageToken
                syncToken = nextSyncToken
                // tokens in case something goes wrong
                // update pageToken and syncToken

                await updateGoogleCalendarTokensInDb(calendarId, nextSyncToken, nextPageToken)

                const deletedEvents = localItems.filter((e) => (e?.status === status))

                if (deletedEvents?.[0]?.id) {

                    // remove any index
                    const toDeleteText = deletedEvents.map(e => (`${e?.summary}${e?.description ? `: ${e?.description}` : ''}`))

                    const vectors = await Promise.all(toDeleteText.map(t => convertTextToVectorSpace2(t)))
                    const results = await Promise.all(vectors.map(v => searchData3(userId, v)))

                    for (const r of results) {
                        if (r?.hits?.hits?.[0]?._id) {
                            const id = r?.hits?.hits?.[0]?._id
                            const foundEvent = deletedEvents.find(e => e?.id === id)
                            if (foundEvent) {
                                await deleteDocInSearch3(r?.hits?.hits?.[0]?._id)
                            }
                        }
                    }



                    const returnedDeletedEventValues = await deleteEvents(deletedEvents, calendarId)
                    const meetingIdsToDelete = returnedDeletedEventValues
                        ?.filter(e => !!(e?.meetingId))
                        ?.map(e => (e?.meetingId))

                    if (meetingIdsToDelete && (meetingIdsToDelete?.length > 0)) {
                        await deleteMeetingAssistsGivenIds(meetingIdsToDelete)
                    }

                    await deleteConferences(returnedDeletedEventValues)

                    const promises = [
                        deleteAttendees(deletedEvents, calendarId),
                        deleteReminders(deletedEvents, userId, calendarId)
                    ]

                    await Promise.all(promises)
                }

                const eventsToUpsert = localItems?.filter((e) => (e?.status !== status))

                // no events to upsert check next pagetoken
                if (!(eventsToUpsert?.[0]?.id)) {

                    const variables: any = {
                        // Calendar identifier. To retrieve calendar IDs call the calendarList.list method. If you want to access the primary calendar of the currently logged in user, use the "primary" keyword.
                        calendarId,
                        // Whether to include deleted events (with status equals "cancelled") in the result. Cancelled instances of recurring events (but not the underlying recurring event) will still be included if showDeleted and singleEvents are both False. If showDeleted and singleEvents are both True, only single instances of deleted events (but not the underlying recurring events) are returned. Optional. The default is False.
                        showDeleted: true,
                        // Whether to expand recurring events into instances and only return single one-off events and instances of recurring events, but not the underlying recurring events themselves. Optional. The default is False.
                        singleEvents: true,
                        syncToken,
                    }

                    if (pageToken) {
                        variables.pageToken = pageToken
                        const res = await googleCalendar.events.list(variables)


                        const { items, nextPageToken, nextSyncToken } = res.data

                        localItems = items as EventResourceType[]
                        pageToken = nextPageToken
                        syncToken = nextSyncToken

                        await updateGoogleCalendarTokensInDb(calendarId, nextSyncToken, nextPageToken)
                        const deletedEvents = localItems.filter((e) => (e?.status === status))

                        if (deletedEvents?.[0]?.id) {

                            // remove any index
                            const toDeleteText = deletedEvents.map(e => (`${e?.summary}${e?.description ? `: ${e?.description}` : ''}`))

                            const vectors = await Promise.all(toDeleteText.map(t => convertTextToVectorSpace2(t)))
                            const results = await Promise.all(vectors.map(v => searchData3(userId, v)))

                            for (const r of results) {
                                if (r?.hits?.hits?.[0]?._id) {
                                    const id = r?.hits?.hits?.[0]?._id
                                    const foundEvent = deletedEvents.find(e => e?.id === id)
                                    if (foundEvent) {
                                        await deleteDocInSearch3(r?.hits?.hits?.[0]?._id)
                                    }
                                }
                            }



                            const returnedDeletedEventValues = await deleteEvents(deletedEvents, calendarId)
                            const meetingIdsToDelete = returnedDeletedEventValues
                                ?.filter(e => !!(e?.meetingId))
                                ?.map(e => (e?.meetingId))

                            if (meetingIdsToDelete && (meetingIdsToDelete?.length > 0)) {
                                await deleteMeetingAssistsGivenIds(meetingIdsToDelete)
                            }

                            await deleteConferences(returnedDeletedEventValues)

                            const promises = [
                                deleteAttendees(deletedEvents, calendarId),
                                deleteReminders(deletedEvents, userId, calendarId)
                            ]

                            await Promise.all(promises)
                        }

                        const eventsToUpsert2 = localItems?.filter((e) => (e?.status !== status))
                        if (eventsToUpsert2) {

                            await upsertEvents2(eventsToUpsert2, userId, calendarId, colorItem)
                            await upsertConference2(eventsToUpsert2, userId, calendarId)

                            const promises = [
                                deleteReminders(eventsToUpsert2, userId, calendarId),
                                insertRemindersGivenEventResource(eventsToUpsert2, userId, calendarId),
                                upsertAttendees2(eventsToUpsert2, userId, calendarId),
                            ]

                            await Promise.all(promises)

                        }
                    }
                    continue
                }

                await upsertEvents2(eventsToUpsert, userId, calendarId, colorItem)
                await upsertConference2(eventsToUpsert, userId, calendarId)

                const promises = [
                    deleteReminders(eventsToUpsert, userId, calendarId),
                    insertRemindersGivenEventResource(eventsToUpsert, userId, calendarId),
                    upsertAttendees2(eventsToUpsert, userId, calendarId),
                ]

                await Promise.all(promises)

            }

            await updateGoogleCalendarTokensInDb(calendarId, nextSyncToken, nextPageToken)
        }

        return true
    } catch (e) {

        if (e.code === 410) {
            // reset sync
            await resetGoogleSyncForCalendar(calendarId, userId, clientType)
            return true
        }
        return false
    }
}

export const getCalendarWebhookById = async (
    channelId: string,
) => {
    try {
        const operationName = 'GetCalendarPushNotificationById'
        const query = `query GetCalendarPushNotificationById($id: String!) {
      Calendar_Push_Notification_by_pk(id: $id) {
        calendarId
        createdDate
        expiration
        id
        resourceId
        resourceUri
        token
        updatedAt
        userId
        calendarIntegrationId
      }
    }
    `

        const variables = {
            id: channelId,
        }

        const res: { data: { Calendar_Push_Notification_by_pk: CalendarWebhookType } } = await got.post(
            hasuraGraphUrl,
            {
                headers: {
                    'X-Hasura-Admin-Secret': hasuraAdminSecret,
                    'Content-Type': 'application/json',
                    'X-Hasura-Role': 'admin'
                },
                json: {
                    operationName,
                    query,
                    variables,
                },
            },
        ).json()


        return res?.data?.Calendar_Push_Notification_by_pk
    } catch (e) {


    }
}

export const convertTextToVectorSpace2 = async (
    text: string,
): Promise<number[]> => {
    try {
        if (!text) {
            throw new Error('no text provided insdie convertTextToVectorSpace')
        }

        const vector: number[] = await got.post(
            text2VectorUrl,
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Basic ${Buffer.from(`admin:${authApiToken}`).toString('base64')}`,
                },
                json: {
                    sentences: [text]
                },
            }
        ).json()


        return vector
    } catch (e) {

    }
}

export const deleteDocInSearch3 = async (
    id: string,
) => {
    try {
        const client = await getSearchClient()
        const response = await client.delete({
            id,
            index: searchIndex,
        })


    } catch (e) {

    }
}

export const getSearchClient = async () => {
    try {
        const credentials = await defaultProvider()()

        const connector = createAwsOpensearchConnector({
            credentials: credentials,
            region: process.env.AWS_REGION ?? 'us-east-1',
            getCredentials: function (cb) {
                return cb(null, null)
            },
            loadFromPath: function (path: string): Config & ConfigurationServicePlaceholders & APIVersions {
                return
            },
            update: function (options: ConfigurationOptions & ConfigurationServicePlaceholders & APIVersions & { [key: string]: any }, allowUnknownKeys: any): void {
                return
            },
            getToken: function (callback: (err: AWSError, token: Token) => void): void {
                return
            },
            getPromisesDependency: function (): void | PromiseConstructor {
                throw new Error("Function not implemented.")
            },
            setPromisesDependency: function (dep: any): void {
                throw new Error("Function not implemented.")
            }
        })
        return new Client({
            ...connector,
            node: `https://${openSearchEndPoint}`,
        })
    } catch (e) {

    }

}

export const searchData3 = async (
    userId: string,
    searchVector: number[],
): Promise<esResponseBody> => {
    try {
        const client = await getSearchClient()
        const response = await client.search({
            index: searchIndex,
            body: {
                "size": vectorDimensions,
                "query": {
                    "script_score": {
                        "query": {
                            "bool": {
                                "filter": {
                                    "term": {
                                        userId,
                                    }
                                }
                            }
                        },
                        "script": {
                            "lang": "knn",
                            "source": "knn_score",
                            "params": {
                                "field": eventVectorName,
                                "query_value": searchVector,
                                "space_type": "cosinesimil"
                            }
                        }
                    }
                },
                "min_score": 1.2
            }
        })

        return response.body
    } catch (e) {

    }
}

export const deleteCalendarWebhookById = async (
    channelId: string,
) => {
    try {
        const operationName = 'DeleteCalendarPushNotificationById'
        const query = `
      mutation DeleteCalendarPushNotificationById($id: String!) {
        delete_Calendar_Push_Notification_by_pk(id: $id) {
          calendarId
          createdDate
          expiration
          id
          resourceId
          resourceUri
          token
          updatedAt
          userId
        }
      }
      `

        const variables = {
            id: channelId,
        }

        const res: { data: { delete_Calendar_Push_Notification_by_pk: CalendarWebhookType } } = await got.post(
            hasuraGraphUrl,
            {
                headers: {
                    'X-Hasura-Admin-Secret': hasuraAdminSecret,
                    'Content-Type': 'application/json',
                    'X-Hasura-Role': 'admin'
                },
                json: {
                    operationName,
                    query,
                    variables,
                },
            },
        ).json()



    } catch (e) {

    }
}

export const stopCalendarWatch = async (
    id: string,
    resourceId: string,
) => {
    try {
        const res = await got.post(
            googleCalendarStopWatchUrl,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
                json: {
                    id,
                    resourceId,
                },
            },
        )

    } catch (e) {

    }
}

export const getCalendarWebhookByCalendarId = async (
    calendarId: string,
) => {
    try {
        const operationName = 'GetCalendarPushNotificationByCalendarId'
        const query = `
      query GetCalendarPushNotificationByCalendarId($calendarId: String!) {
        Calendar_Push_Notification(where: {calendarId: {_eq: $calendarId}}, limit: 1) {
          calendarId
          createdDate
          expiration
          id
          resourceId
          resourceUri
          token
          updatedAt
          userId
        }
      }
    `

        const variables = {
            calendarId,
        }

        const res: { data: { Calendar_Push_Notification: CalendarWebhookType[] } } = await got.post(
            hasuraGraphUrl,
            {
                headers: {
                    'X-Hasura-Admin-Secret': hasuraAdminSecret,
                    'Content-Type': 'application/json',
                    'X-Hasura-Role': 'admin'
                },
                json: {
                    operationName,
                    query,
                    variables,
                },
            },
        ).json()


        return res?.data?.Calendar_Push_Notification?.[0]
    } catch (e) {

    }
}

export const upsertEvents2 = async (
    events: EventResourceType[],
    userId: string,
    calendarId: string,
    colorItem?: colorTypeResponse,
) => {
    try {


        if (!events?.[0]?.id) return null

        // format events for insert
        const formattedEvents = events
            .filter(e => !!e?.id)
            ?.filter(e => (!!e?.start?.timeZone || !!e?.end?.timeZone))
            .map(event => {
                return {
                    id: `${event?.id}#${calendarId}`,
                    userId,
                    status: event?.status,
                    htmlLink: event?.htmlLink,
                    createdDate: event?.created,
                    updatedAt: event?.updated,
                    summary: event?.summary,
                    notes: event?.description,
                    location: {
                        title: event?.location,
                    },
                    colorId: event?.colorId,
                    creator: event?.creator,
                    organizer: event?.organizer,
                    startDate: event?.start?.dateTime || dayjs(event?.start?.date).tz(event?.start?.timeZone || dayjs.tz.guess(), true).format(),
                    endDate: event?.end?.dateTime || dayjs(event?.end?.date).tz(event?.end?.timeZone || dayjs.tz.guess(), true).format(),
                    allDay: event?.start?.date ? true : false,
                    timezone: event?.start?.timeZone || event?.end?.timeZone,
                    endTimeUnspecified: event?.endTimeUnspecified,
                    recurrence: event?.recurrence,
                    recurringEventId: event?.recurringEventId,
                    originalStartDate: event?.originalStartTime?.dateTime || event?.originalStartTime?.date,
                    originalAllDay: event?.originalStartTime?.date ? true : false,
                    originalTimezone: event?.originalStartTime?.timeZone,
                    transparency: event?.transparency,
                    visibility: event?.visibility,
                    iCalUID: event?.iCalUID,
                    attendeesOmitted: event?.attendeesOmitted,
                    extendedProperties: (event?.extendedProperties?.private
                        || event?.extendedProperties?.shared)
                        ? {
                            private: event?.extendedProperties?.private && {
                                keys: Object.keys(event?.extendedProperties?.private),
                                values: Object.values(event?.extendedProperties?.private),
                            },
                            shared: event?.extendedProperties?.shared && {
                                keys: Object.keys(event?.extendedProperties?.shared),
                                values: Object.values(event?.extendedProperties?.shared),
                            }
                        }
                        : null,
                    hangoutLink: event?.hangoutLink,
                    anyoneCanAddSelf: event?.anyoneCanAddSelf,
                    guestsCanInviteOthers: event?.guestsCanInviteOthers,
                    guestsCanModify: event?.guestsCanModify,
                    guestsCanSeeOtherGuests: event?.guestsCanSeeOtherGuests,
                    source: event?.source,
                    attachments: event?.attachments,
                    eventType: event?.eventType,
                    privateCopy: event?.privateCopy,
                    locked: event?.locked,
                    calendarId,
                    backgroundColor: colorItem?.event?.[`${event?.colorId}`]?.background,
                    foregroundColor: colorItem?.event?.[`${event?.colorId}`]?.foreground,
                    useDefaultAlarms: event?.reminders?.useDefault,
                    eventId: event?.id,
                }
            })

        if (!(formattedEvents?.length > 0)) {
            return
        }
        /*
          dynamically generate upsert query based on the number of columns
          and set the update_columns to the columns that are not undefined
        */
        const operationName = 'InsertEvent'
        const query = `
      mutation InsertEvent($events: [Event_insert_input!]!) {
        insert_Event(
            objects: $events,
            on_conflict: {
                constraint: Event_pkey,
                update_columns: [
                  startDate,
                  endDate,
                  allDay,
                  recurrence,
                  location,
                  notes,
                  attachments,
                  timezone,
                  attendeesOmitted,
                  anyoneCanAddSelf,
                  guestsCanInviteOthers,
                  guestsCanSeeOtherGuests,
                  originalStartDate,
                  originalTimezone,
                  originalAllDay,
                  status,
                  summary,
                  transparency,
                  visibility,
                  recurringEventId,
                  htmlLink,
                  colorId,
                  creator,
                  organizer,
                  endTimeUnspecified,
                  extendedProperties,
                  hangoutLink,
                  guestsCanModify,
                  locked,
                  source,
                  eventType,
                  privateCopy,
                  backgroundColor,
                  foregroundColor,
                  updatedAt,
                  iCalUID,
                  calendarId,
                  useDefaultAlarms,
                  eventId,
                ]
            }){
            returning {
              id
            }
          }
        }
      `
        const variables = {
            events: formattedEvents
        }


        const response: any = await got.post(hasuraGraphUrl, {
            headers: {
                'X-Hasura-Admin-Secret': hasuraAdminSecret,
                'X-Hasura-Role': 'admin'
            },
            json: {
                operationName,
                query,
                variables,
            }
        }).json()



        response?.errors?.forEach(e => 
    } catch (e) {

    }
}

export const upsertConference2 = async (
    events: EventResourceType[],
    userId: string,
    calendarId: string,
) => {
    try {
        const formattedConference: ConferenceType[] = events.map((e) => {
            return {
                id: e?.conferenceData?.conferenceId,
                userId,
                type: e?.conferenceData?.conferenceSolution?.key?.type,
                status: e?.conferenceData?.createRequest?.status?.statusCode,
                calendarId,
                iconUri: e?.conferenceData?.conferenceSolution?.iconUri,
                name: e?.conferenceData?.conferenceSolution?.name,
                notes: e?.conferenceData?.notes,
                entryPoints: e?.conferenceData?.entryPoints,
                key: e?.conferenceData?.conferenceSolution?.key?.type,
                deleted: false,
                app: googleMeetResource,
                updatedAt: dayjs().utc().toISOString(),
                createdDate: dayjs().toISOString(),
                isHost: false,
            }
        })
        if (!(formattedConference?.filter(c => !!(c?.id))?.length > 0)) {
            return
        }

        /*
        dynamically generate upsert query based on the number of columns
        and set the update_columns to the columns that are not undefined
        */

        const operationName = 'InsertConference'
        const query = `
      mutation InsertConference($conferences: [Conference_insert_input!]!) {
            insert_Conference(
                objects: $conferences,
                on_conflict: {
                    constraint: Conference_pkey,
                    update_columns: [
                      requestId,
                      type,
                      status,
                      calendarId,
                      iconUri,
                      name,
                      notes,
                      entryPoints,
                      parameters,
                      app,
                      key,
                      deleted,
                      updatedAt,
                    ]
                }) {
          returning {
            id
          }
        }
      }
      `
        const variables = {
            conferences: formattedConference
        }
        const response = await got.post(hasuraGraphUrl, {
            headers: {
                'X-Hasura-Admin-Secret': hasuraAdminSecret,
                'X-Hasura-Role': 'admin'
            },
            json: {
                operationName,
                query,
                variables,
            }
        }).json()


    } catch (e) {

    }
}


export const insertCalendarWebhook = async (
    webhook: CalendarWebhookType,
) => {
    try {
        const operationName = 'InsertCalendarPushNotification'
        const query = `mutation InsertCalendarPushNotification($webhook: Calendar_Push_Notification_insert_input!) {
      insert_Calendar_Push_Notification_one(object: $webhook, 
        on_conflict: {
          constraint: Calendar_Push_Notification_calendarId_key, 
          update_columns: [
            id,
            expiration,
            resourceId,
            resourceUri,
            token,
            updatedAt,
            userId,
            calendarIntegrationId,
          ]}) {
            calendarId
            createdDate
            expiration
            id
            resourceId
            resourceUri
            token
            updatedAt
            userId
            calendarIntegrationId
          }
        }
      `
        const variables = {
            webhook,
        }

        const response: { data: { insert_Calendar_Push_Notification_one: CalendarWebhookType } } = await got.post(hasuraGraphUrl, {
            headers: {
                'X-Hasura-Admin-Secret': hasuraAdminSecret,
                'X-Hasura-Role': 'admin'
            },
            json: {
                operationName,
                query,
                variables,
            }
        }).json()



        return response?.data?.insert_Calendar_Push_Notification_one

    } catch (e) {

    }
}

export const upsertAttendees2 = async (
    events: EventResourceType[],
    userId: string,
    calendarId: string,
) => {
    try {
        const attendees: AttendeeType[] = []
        events
            .filter(e => !!(e?.attendees?.[0]?.id))
            .forEach((e) => {
                e?.attendees?.forEach((a) => {
                    attendees.push({
                        id: a?.id,
                        userId,
                        name: a?.displayName,
                        emails: [{ primary: false, value: a?.email, displayName: a?.displayName, type: '' }],
                        eventId: `${e?.id}#${calendarId}`,
                        additionalGuests: a?.additionalGuests,
                        comment: a?.comment,
                        responseStatus: a?.responseStatus,
                        optional: a?.optional,
                        resource: a?.resource,
                        deleted: false,
                        updatedAt: dayjs().utc().toISOString(),
                        createdDate: dayjs().toISOString(),
                    })
                })
            })

        if (!(attendees?.[0]?.emails?.[0])) {
            return
        }

        const operationName = 'InsertAttendee'

        const query = `
        mutation InsertAttendee($attendees: [Attendee_insert_input!]!) {
            insert_Attendee(
                objects: $attendees,
                on_conflict: {
                    constraint: Attendee_pkey,
                    update_columns: [
                      name,
                      contactId,
                      emails,
                      phoneNumbers,
                      imAddresses,
                      eventId,
                      additionalGuests,
                      optional,
                      resource,
                      responseStatus,
                      comment,
                      deleted,
                      updatedAt,
                    ]
                }){
                returning {
                  id
                }
              }
       }
    `
        const variables = {
            attendees,
        }

        const response = await got.post(hasuraGraphUrl, {
            headers: {
                'X-Hasura-Admin-Secret': hasuraAdminSecret,
                'X-Hasura-Role': 'admin'
            },
            json: {
                operationName,
                query,
                variables,
            }
        }).json()



    } catch (e) {

    }
}

export const updateGoogleIntegration = async (
    calendarIntegrationId: string,
    syncEnabled?: boolean,
) => {
    try {
        const operationName = 'updateCalendarIntegration'
        const query = `mutation updateCalendarIntegration($id: uuid!, ${syncEnabled !== undefined ? ' $syncEnabled: Boolean,' : ''}) {
        update_Calendar_Integration_by_pk(pk_columns: {id: $id}, _set: {${syncEnabled !== undefined ? ' syncEnabled: $syncEnabled,' : ''} }) {
          id
          name
          refreshToken
          resource
          syncEnabled
          token
          updatedAt
          userId
          expiresAt
          enabled
          deleted
          createdDate
          clientType
        }
      }
    `
        let variables: any = {
            id: calendarIntegrationId
        }

        if (syncEnabled === false) {
            variables = { ...variables, syncEnabled }
        }

        const response = await got.post(hasuraGraphUrl, {
            headers: {
                'X-Hasura-Admin-Secret': hasuraAdminSecret,
                'X-Hasura-Role': 'admin'
            },
            json: {
                operationName,
                query,
                variables,
            }
        }).json()


    } catch (e) {

    }
}


export const updateGoogleCalendarTokensInDb = async (
    calendarId: string,
    syncToken?: string,
    pageToken?: string,
) => {
    try {
        const operationName = 'updateCalendar'
        const query = `mutation updateCalendar($id: String!, ${syncToken !== undefined ? ' $syncToken: String,' : ''} ${pageToken !== undefined ? ' $pageToken: String,' : ''}) {
        update_Calendar_by_pk(pk_columns: {id: $id}, _set: {${pageToken !== undefined ? ' pageToken : $pageToken,' : ''} ${syncToken !== undefined ? ' syncToken: $syncToken,' : ''} }) {
          id
          pageToken
          syncToken
          updatedAt
          userId
          deleted
          createdDate
        }
      }
    `
        let variables: any = {
            id: calendarId,
        }

        if (syncToken?.length > 0) {
            variables = { ...variables, syncToken }
        }

        if (pageToken?.length > 0) {
            variables = { ...variables, pageToken }
        }

        const response = await got.post(hasuraGraphUrl, {
            headers: {
                'X-Hasura-Admin-Secret': hasuraAdminSecret,
                'X-Hasura-Role': 'admin'
            },
            json: {
                operationName,
                query,
                variables,
            }
        }).json()


    } catch (e) {

    }
}

export const getCalendarWithId = async (
    calendarId: string,
) => {
    try {
        // get Calendar
        const operationName = 'getCalendar'
        const query = `
    query getCalendar($id: String!) {
      Calendar_by_pk(id: $id) {
        resource
        updatedAt
        userId
        account
        colorId
        id
        modifiable
      }
    }
  `
        const variables = {
            id: calendarId,
        }

        const res: { data: { Calendar_by_pk: CalendarType } } = await got.post(
            hasuraGraphUrl,
            {
                headers: {
                    'X-Hasura-Admin-Secret': hasuraAdminSecret,
                    'Content-Type': 'application/json',
                    'X-Hasura-Role': 'admin'
                },
                json: {
                    operationName,
                    query,
                    variables,
                },
            },
        ).json()


        return res?.data?.Calendar_by_pk


    } catch (e) {

    }
}

export const requestCalendarWatch = async (
    calendarId: string,
    channelId: string,
    token: string,
    userId: string,
) => {
    try {
        const { resource } = await getCalendarWithId(calendarId)
        const calendarIntegration = await getCalendarIntegration(userId, resource)
        const clientType = calendarIntegration?.clientType

        const authToken = await getGoogleAPIToken(userId, googleCalendarResource, clientType)

        const googleCalendar = google.calendar({
            version: 'v3',
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
        })

        const reqBody: CalendarWatchRequestResourceType = {
            id: channelId,
            token,
            type: 'webhook',
            address: selfGoogleCalendarWebhookPublicUrl,
        }

        const res = await googleCalendar.events.watch({
            calendarId,
            singleEvents: true,
            requestBody: reqBody,
        })

        const response = res?.data

        return response
    } catch (e) {

    }
}

export const listCalendarsForUser = async (
    userId: string,
) => {
    try {
        const operationName = 'ListCalendarsForUser'
        const query = `
      query ListCalendarsForUser($userId: uuid!) {
        Calendar(where: {userId: {_eq: $userId}}) {
          id
          title
          colorId
          account
          accessLevel
          modifiable
          resource
          defaultReminders
          globalPrimary
          deleted
          createdDate
          updatedAt
          userId
          foregroundColor
          backgroundColor
          pageToken
          syncToken
        }
      }
    `
        const variables = {
            userId,
        }

        const res: { data: { Calendar: CalendarType[] } } = await got.post(
            hasuraGraphUrl,
            {
                headers: {
                    'X-Hasura-Admin-Secret': hasuraAdminSecret,
                    'Content-Type': 'application/json',
                    'X-Hasura-Role': 'admin'
                },
                json: {
                    operationName,
                    query,
                    variables,
                },
            }).json()

        return res.data.Calendar
    } catch (e) {

    }
}

export const insertRemindersGivenEventResource = async (
    events: EventResourceType[],
    userId: string,
    calendarId: string,
) => {
    try {
        if (!(events?.filter(e => !!(e?.id))?.length > 0)) {
            return
        }
        const reminders = []
        events
            .filter(e => ((e?.reminders?.useDefault) || (e?.reminders?.overrides?.[0]?.minutes > -1)))
            .forEach((event) => {

                const eventId = event?.id
                const timezone = event?.start?.timeZone

                if (event?.reminders?.useDefault) {
                    reminders.push({
                        eventId: `${eventId}#${calendarId}`,
                        userId,
                        useDefault: event?.reminders?.useDefault,
                        timezone,
                    })
                } else {

                    event?.reminders?.overrides.forEach((o) => {
                        reminders.push({
                            eventId: `${eventId}#${calendarId}`,
                            userId,
                            timezone,
                            method: o?.method,
                            minutes: o?.minutes,
                            useDefault: false,
                        })
                    })
                }
            })


        if (!(reminders?.length > 0)) {
            return
        }

        const operationName = 'InsertReminder'
        const query = `
    mutation InsertReminder($reminders: [Reminder_insert_input!]!) {
            insert_Reminder(
                objects: $reminders,
                ){
                returning {
                  id
                }
              }
       }
      `
        const variables = {
            reminders
        }

        const response = await got.post(hasuraGraphUrl, {
            headers: {
                'X-Hasura-Admin-Secret': hasuraAdminSecret,
                'X-Hasura-Role': 'admin'
            },
            json: {
                operationName,
                query,
                variables,
            }
        }).json()

    } catch (e) {

    }
}

export const getGoogleIntegration = async (
    calendarIntegrationId: string,
) => {
    try {
        const operationName = 'getCalendarIntegration'
        const query = `query getCalendarIntegration($id: uuid!){
      Calendar_Integration_by_pk(id: $id) {
        id
        name
        token
        refreshToken
        clientType
      }
    }`
        const variables = { id: calendarIntegrationId }

        const response: { data: { Calendar_Integration_by_pk: CalendarIntegrationType } } = await got.post(hasuraGraphUrl, {
            headers: {
                'X-Hasura-Admin-Secret': hasuraAdminSecret,
                'X-Hasura-Role': 'admin'
            },
            json: {
                operationName,
                query,
                variables,
            }
        }).json()
        // just to check

        if (response?.data?.Calendar_Integration_by_pk) {
            const {
                data:
                {
                    Calendar_Integration_by_pk: {
                        token,
                        refreshToken,
                        clientType,
                    },
                },
            } = response

            return { token, refreshToken, clientType }
        }
    } catch (e) {

    }
}

export const getGoogleColor = async (
    token: string,
) => {
    try {
        const config = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
        const body: colorTypeResponse = await got.get(googleColorUrl, config).json()

        return body
    } catch (e) {

    }
}

export const getGoogleCalendarInDb = async (
    calendarId: string,
) => {
    try {
        const operationName = 'GetCalendarById'
        const query = `query GetCalendarById($id: String!) {
      Calendar_by_pk(id: $id) {
        id
        title
        colorId
        account
        accessLevel
        modifiable
        resource
        defaultReminders
        globalPrimary
        deleted
        createdDate
        updatedAt
        userId
        foregroundColor
        backgroundColor
        pageToken
        syncToken
      }
    }`
        const variables = { id: calendarId }

        const response: { data: { Calendar_by_pk: CalendarType } } = await got.post(hasuraGraphUrl, {
            headers: {
                'X-Hasura-Admin-Secret': hasuraAdminSecret,
                'X-Hasura-Role': 'admin'
            },
            json: {
                operationName,
                query,
                variables,
            }
        }).json()
        // just to check

        if (response?.data?.Calendar_by_pk) {
            const {
                data:
                {
                    Calendar_by_pk: {
                        pageToken,
                        syncToken,
                        id,
                    },
                },
            } = response

            return { pageToken, syncToken, id }
        }
    } catch (e) {

    }
}

export const getCurrentActiveSubscriptions = async (
    userId: string,
) => {
    try {
        const operationName = 'GetCurrentActiveSubscriptions'
        const query = `
      query GetCurrentActiveSubscriptions($userId: uuid!, $currentDate: timestamptz!) {
        Active_Subscription(where: {userId: {_eq: $userId}, endDate: {_gte: $currentDate}, status: {_eq: true}}) {
          createdDate
          deleted
          endDate
          id
          startDate
          status
          subscriptionId
          transactionId
          updatedAt
          userId
        }
      }
    `
        const variables = {
            userId,
            currentDate: dayjs().toISOString(),
        }

        const res: { data: { Active_Subscription: ActiveSubscriptionType[] } } = await got.post(
            hasuraGraphUrl,
            {
                headers: {
                    'X-Hasura-Admin-Secret': hasuraAdminSecret,
                    'Content-Type': 'application/json',
                    'X-Hasura-Role': 'admin'
                },
                json: {
                    operationName,
                    query,
                    variables,
                },
            }).json()

        return res.data.Active_Subscription
    } catch (e) {

    }
}

export const getAdminBetaTesting = async () => {
    try {
        const operationName = 'GetAdminBetaTesting'
        const query = `
      query GetAdminBetaTesting {
        Admin_Beta_Testing {
          deleted
          enableTesting
          id
          createdDate
          updatedAt
        }
      }
    `

        const res: { data: { Admin_Beta_Testing: AdminBetaTestingType[] } } = await got.post(
            hasuraGraphUrl,
            {
                headers: {
                    'X-Hasura-Admin-Secret': hasuraAdminSecret,
                    'Content-Type': 'application/json',
                    'X-Hasura-Role': 'admin'
                },
                json: {
                    operationName,
                    query,
                },
            }).json()

        return res.data.Admin_Beta_Testing?.[0]

    } catch (e) {

    }
}

export const deleteAttendees = async (
    events: EventResourceType[],
    calendarId: string,
) => {
    try {
        const eventIds = events.map(e => `${e?.id}#${calendarId}`)

        if (!(eventIds?.filter(e => !!e)?.length > 0)) {
            return
        }

        const operationName = 'DeleteAttendees'
        const query = `
      mutation DeleteAttendees($eventIds: [String!]!) {
        delete_Attendee(where: {eventId: {_in: $eventIds}}) {
          affected_rows
        }
      }            
      `
        const variables = {
            eventIds,
        }

        const results = await got.post(hasuraGraphUrl, {
            headers: {
                'X-Hasura-Admin-Secret': hasuraAdminSecret,
                'X-Hasura-Role': 'admin'
            },
            json: {
                operationName,
                query,
                variables,
            }
        }).json()

    } catch (e) {

    }
}

export const refreshZoomToken = async (
    refreshToken: string,
): Promise<{
    access_token: string,
    token_type: 'bearer',
    refresh_token: string,
    expires_in: number,
    scope: string
}> => {
    try {
        const username = zoomClientId;
        const password = zoomClientSecret;

        return axios({
            data: new URLSearchParams({
                refresh_token: refreshToken,
                grant_type: 'refresh_token',
            }).toString(),
            baseURL: zoomBaseTokenUrl,
            url: '/oauth/token',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            auth: {
                username,
                password,
            },
        }).then(({ data }) => Promise.resolve(data))
    } catch (e) {

    }
}

export const getZoomAPIToken = async (
    userId: string,
) => {
    let integrationId = ''
    try {

        const { id, token, expiresAt, refreshToken } = await getCalendarIntegration(userId, zoomResourceName)
        if (!refreshToken) {

            return
        }

        integrationId = id

        if (dayjs().isAfter(dayjs(expiresAt)) || !token) {
            const res = await refreshZoomToken(refreshToken)

            await updateCalendarIntegration(id, res.access_token, res.expires_in)
            return res.access_token
        }

        return token


    } catch (e) {

        await updateCalendarIntegration(integrationId, null, null, false)
    }
}

export const deleteZoomMeeting = async (
    zoomToken: string,
    conferenceId: number,
    scheduleForReminder?: boolean,
    cancelMeetingReminder?: boolean,
) => {
    try {
        let params: any = {}
        if (
            cancelMeetingReminder
            || scheduleForReminder
        ) {

            if (cancelMeetingReminder) {
                params = { cancel_meeting_reminder: cancelMeetingReminder }
            }

            if (scheduleForReminder) {
                params = { ...params, schedule_for_reminder: scheduleForReminder }
            }
        }

        const stringifiedObject = Object.keys(params)?.length > 0 ? qs.stringify(params) : ''

        if (stringifiedObject) {
            await got.delete(
                `${zoomBaseUrl}/meetings/` + conferenceId + '?' + stringifiedObject,
                {
                    headers: {
                        Authorization: `Bearer ${zoomToken}`,
                        ContentType: 'application/json',
                    }
                }
            )
        } else {
            await got.delete(
                `${zoomBaseUrl}/meetings/` + conferenceId,
                {
                    headers: {
                        Authorization: `Bearer ${zoomToken}`,
                        ContentType: 'application/json',
                    }
                }
            )
        }



    } catch (e) {

    }
}

export const listConferencesWithHosts = async (
    ids: string[]
) => {
    try {
        const operationName = 'ListConferencesWithHostId'
        const query = `
            query ListConferencesWithHostId($ids: [String!]!) {
                Conference(where: {id: {_in: $ids}, isHost: {_eq: true}}) {
                    app
                    calendarId
                    createdDate
                    deleted
                    entryPoints
                    hangoutLink
                    iconUri
                    id
                    isHost
                    joinUrl
                    key
                    name
                    notes
                    parameters
                    requestId
                    startUrl
                    status
                    type
                    updatedAt
                    userId
                    zoomPrivateMeeting
                }
            }
        `

        const variables = {
            ids,
        }

        const res: { data: { Conference: ConferenceType[] } } = await got.post(hasuraGraphUrl, {
            headers: {
                'X-Hasura-Admin-Secret': hasuraAdminSecret,
                'X-Hasura-Role': 'admin'
            },
            json: {
                operationName,
                query,
                variables,
            }
        }).json()



        return res?.data?.Conference
    } catch (e) {

    }
}

export const deleteConferencesInDb = async (
    conferenceIds: string[]
) => {
    try {
        const operationName = 'deleteConferences'
        const query = `
            mutation deleteConferences($ids: [String!]!) {
                delete_Conference(where: {id: {_in: $ids}}) {
                    affected_rows
                }
            }    
        `
        const variables = {
            ids: conferenceIds
        }
        const results = await got.post(hasuraGraphUrl, {
            headers: {
                'X-Hasura-Admin-Secret': hasuraAdminSecret,
                'X-Hasura-Role': 'admin'
            },
            json: {
                operationName,
                query,
                variables,
            }
        }).json()


    } catch (e) {

    }
}

export const deleteConferences = async (
    events: {
        eventId: string,
        id: string,
        calendarId: string,
        meetingId: string,
        conferenceId?: string,
    }[],
) => {
    try {

        const conferenceIds = events?.map(e => (e?.conferenceId))

        const truthy = conferenceIds.filter(cId => !!cId)

        if (!(truthy?.[0])) {
            return
        }

        // delete zoom meetings if any

        const conferences = await listConferencesWithHosts(conferenceIds)

        for (const conference of conferences) {
            const zoomToken = await getZoomAPIToken(conference?.userId)

            if (zoomToken && (typeof parseInt(conference?.id, 10) === 'number')) {
                await deleteZoomMeeting(zoomToken, parseInt(conference?.id, 10))
            }
        }

        // delete in db
        await deleteConferencesInDb(conferenceIds)

    } catch (e) {

    }
}

export const deleteEvents = async (
    events: EventResourceType[],
    calendarId: string,
) => {
    try {
        const eventIds = events.map(e => `${e?.id}#${calendarId}`)

        if (!(eventIds?.filter(e => !!e)?.length > 0)) {
            return
        }
        const operationName = 'deleteEvents'
        const query = `
            mutation deleteEvents($eventIds: [String!]!) {
                delete_Event(where: {id: {_in: $eventIds}}) {
                    affected_rows
                    returning {
                        eventId
                        id
                        calendarId
                        meetingId
                        conferenceId
                    }
                }
            }

        `
        const variables = {
            eventIds
        }

        const res: {
            data: {
                delete_Event: {
                    affected_rows: number,
                    returning: {
                        eventId: string,
                        id: string,
                        calendarId: string,
                        meetingId: string,
                        conferenceId?: string,
                    }[]
                }
            }
        } = await got.post(hasuraGraphUrl, {
            headers: {
                'X-Hasura-Admin-Secret': hasuraAdminSecret,
                'X-Hasura-Role': 'admin'
            },
            json: {
                operationName,
                query,
                variables,
            }
        }).json()

        return res?.data?.delete_Event?.returning
    } catch (e) {

    }
}

export const deleteReminders = async (
    events: EventResourceType[],
    userId: string,
    calendarId: string,
) => {
    try {
        if (!(events?.filter(e => !!(e?.id))?.length > 0)) {
            return
        }
        const operationName = 'deleteReminders'
        const delEvents = events.map(e => (`${e?.id}#${calendarId}`))
        const query = `
      mutation deleteReminders($userId: uuid!, $eventIds: [String!]!) {
        delete_Reminder(where: {userId: {_eq: $userId}, eventId: {_in: $eventIds}}) {
          affected_rows
        }
      }    
    `

        const variables = {
            userId,
            eventIds: delEvents
        }

        const response = await got.post(hasuraGraphUrl, {
            headers: {
                'X-Hasura-Admin-Secret': hasuraAdminSecret,
                'X-Hasura-Role': 'admin'
            },
            json: {
                operationName,
                query,
                variables,
            }
        }).json()

    } catch (e) {

    }
}

export const getUserPreferences = async (userId: string): Promise<UserPreferenceType> => {
    try {
        if (!userId) {

            return null
        }
        const operationName = 'getUserPreferences'
        const query = `
    query getUserPreferences($userId: uuid!) {
      User_Preference(where: {userId: {_eq: $userId}}) {
        startTimes
        endTimes
        backToBackMeetings
        copyAvailability
        copyCategories
        copyIsBreak
        copyModifiable
        copyPriorityLevel
        copyReminders
        copyTimeBlocking
        copyTimePreference
        createdDate
        deleted
        followUp
        id
        isPublicCalendar
        maxNumberOfMeetings
        maxWorkLoadPercent
        publicCalendarCategories
        reminders
        updatedAt
        userId
        minNumberOfBreaks
        breakColor
        breakLength
        copyColor
        copyIsExternalMeeting
        copyIsMeeting
        onBoarded
      }
    }    
  `
        const res: { data: { User_Preference: UserPreferenceType[] } } = await got.post(
            hasuraGraphUrl,
            {
                headers: {
                    'X-Hasura-Admin-Secret': hasuraAdminSecret,
                    'Content-Type': 'application/json',
                    'X-Hasura-Role': 'admin'
                },
                json: {
                    operationName,
                    query,
                    variables: {
                        userId,
                    },
                },
            },
        ).json()
        return res?.data?.User_Preference?.[0]
    } catch (e) {

    }
}

export const convertToTotalWorkingHours = (
    userPreference: UserPreferenceType,
    startDate: string,
    timezone: string,
) => {
    const startTimes = userPreference.startTimes
    const endTimes = userPreference.endTimes
    const dayOfWeekInt = getISODay(dayjs(startDate.slice(0, 19)).tz(timezone, true).toDate())
    const startHour = startTimes.find(i => (i.day === dayOfWeekInt)).hour
    const startMinute = startTimes.find(i => (i.day === dayOfWeekInt)).minutes
    const endHour = endTimes.find(i => (i.day === dayOfWeekInt)).hour
    const endMinute = endTimes.find(i => (i.day === dayOfWeekInt)).minutes

    const startDuration = dayjs.duration({ hours: startHour, minutes: startMinute })
    const endDuration = dayjs.duration({ hours: endHour, minutes: endMinute })
    const totalDuration = endDuration.subtract(startDuration)
    return totalDuration.asHours()
}

export const listEventsWithIds = async (ids: string[]) => {
    try {
        const operationName = 'listEventsWithIds'

        const query = `
    query listEventsWithIds($ids: [String!]!) {
      Event(where: {id: {_in: $ids}}) {
        allDay
        anyoneCanAddSelf
        attachments
        attendeesOmitted
        backgroundColor
        calendarId
        colorId
        conferenceId
        copyAvailability
        copyCategories
        copyDuration
        copyIsBreak
        copyIsExternalMeeting
        copyIsMeeting
        copyModifiable
        copyPriorityLevel
        copyReminders
        copyTimeBlocking
        copyTimePreference
        createdDate
        creator
        dailyTaskList
        deleted
        duration
        endDate
        endTimeUnspecified
        eventId
        eventType
        extendedProperties
        followUpEventId
        forEventId
        foregroundColor
        guestsCanInviteOthers
        guestsCanModify
        guestsCanSeeOtherGuests
        hangoutLink
        hardDeadline
        htmlLink
        iCalUID
        id
        isBreak
        isExternalMeeting
        isExternalMeetingModifiable
        isFollowUp
        isMeeting
        isMeetingModifiable
        isPostEvent
        isPreEvent
        links
        location
        locked
        maxAttendees
        meetingId
        method
        modifiable
        negativeImpactDayOfWeek
        negativeImpactScore
        negativeImpactTime
        notes
        organizer
        originalAllDay
        originalStartDate
        originalTimezone
        positiveImpactDayOfWeek
        positiveImpactScore
        positiveImpactTime
        postEventId
        preEventId
        preferredDayOfWeek
        preferredEndTimeRange
        preferredStartTimeRange
        preferredTime
        priority
        privateCopy
        recurrence
        recurrenceRule
        recurringEventId
        sendUpdates
        softDeadline
        source
        startDate
        status
        summary
        taskId
        taskType
        timeBlocking
        timezone
        title
        transparency
        unlink
        updatedAt
        useDefaultAlarms
        userId
        userModifiedAvailability
        userModifiedCategories
        userModifiedDuration
        userModifiedIsBreak
        userModifiedIsExternalMeeting
        userModifiedIsMeeting
        userModifiedModifiable
        userModifiedPriorityLevel
        userModifiedReminders
        userModifiedTimeBlocking
        userModifiedTimePreference
        visibility
        weeklyTaskList
        byWeekDay
        localSynced
        userModifiedColor
        copyColor
      }
    }    
    `

        const res: { data: { Event: EventType[] } } = await got.post(
            hasuraGraphUrl,
            {
                headers: {
                    'X-Hasura-Admin-Secret': hasuraAdminSecret,
                    'Content-Type': 'application/json',
                    'X-Hasura-Role': 'admin'
                },
                json: {
                    operationName,
                    query,
                    variables: {
                        ids,
                    },
                },
            },
        ).json()

        return res?.data?.Event
    } catch (e) {

    }
}

export const listEventsForDate = async (
    userId: string,
    startDate: string,
    endDate: string,
    timezone: string,
) => {
    try {
        const operationName = 'listEventsForDate'
        const query = `
        query listEventsForDate($userId: uuid!, $startDate: timestamp!, $endDate: timestamp!) {
          Event(where: {userId: {_eq: $userId}, startDate: {_gte: $startDate, _lt: $endDate}, deleted: {_eq: false}}) {
            allDay
            anyoneCanAddSelf
            attachments
            attendeesOmitted
            backgroundColor
            calendarId
            colorId
            conferenceId
            copyAvailability
            copyCategories
            copyDuration
            copyIsBreak
            copyIsExternalMeeting
            copyIsMeeting
            copyModifiable
            copyPriorityLevel
            copyReminders
            copyTimeBlocking
            copyTimePreference
            createdDate
            creator
            dailyTaskList
            deleted
            duration
            endDate
            endTimeUnspecified
            eventId
            eventType
            extendedProperties
            followUpEventId
            forEventId
            foregroundColor
            guestsCanInviteOthers
            guestsCanModify
            guestsCanSeeOtherGuests
            hangoutLink
            hardDeadline
            htmlLink
            iCalUID
            id
            isBreak
            isExternalMeeting
            isExternalMeetingModifiable
            isFollowUp
            isMeeting
            isMeetingModifiable
            isPostEvent
            isPreEvent
            links
            location
            locked
            maxAttendees
            meetingId
            method
            modifiable
            negativeImpactDayOfWeek
            negativeImpactScore
            negativeImpactTime
            notes
            organizer
            originalAllDay
            originalStartDate
            originalTimezone
            positiveImpactDayOfWeek
            positiveImpactScore
            positiveImpactTime
            postEventId
            preEventId
            preferredDayOfWeek
            preferredEndTimeRange
            preferredStartTimeRange
            preferredTime
            priority
            privateCopy
            recurrence
            recurrenceRule
            recurringEventId
            sendUpdates
            softDeadline
            source
            startDate
            status
            summary
            taskId
            taskType
            timeBlocking
            timezone
            title
            transparency
            unlink
            updatedAt
            useDefaultAlarms
            userId
            userModifiedAvailability
            userModifiedCategories
            userModifiedDuration
            userModifiedIsBreak
            userModifiedIsExternalMeeting
            userModifiedIsMeeting
            userModifiedModifiable
            userModifiedPriorityLevel
            userModifiedReminders
            userModifiedTimeBlocking
            userModifiedTimePreference
            visibility
            weeklyTaskList
            byWeekDay
            localSynced
            userModifiedColor
            copyColor
            copyExternalMeetingModifiable
            userModifiedExternalMeetingModifiable
            userModifiedMeetingModifiable
          }
        }
            `
        const res: { data: { Event: EventType[] } } = await got.post(
            hasuraGraphUrl,
            {
                headers: {
                    'X-Hasura-Admin-Secret': hasuraAdminSecret,
                    'Content-Type': 'application/json',
                    'X-Hasura-Role': 'admin'
                },
                json: {
                    operationName,
                    query,
                    variables: {
                        userId,
                        startDate: dayjs(startDate.slice(0, 19)).tz(timezone, true).format(),
                        endDate: dayjs(endDate).tz(timezone, true).format(),
                    },
                },
            },
        ).json()


        return res?.data?.Event

    } catch (e) {

    }
}

export const shouldGenerateBreakEventsForDay = (
    workingHours: number,
    userPreferences: UserPreferenceType,
    allEvents: EventPlusType[],
) => {
    // validate
    if (!userPreferences?.breakLength) {

        return false
    }

    if (!(allEvents?.length > 0)) {

        return false
    }

    const breakEvents = allEvents.filter((event) => event.isBreak)
    const numberOfBreaksPerDay = userPreferences.minNumberOfBreaks

    const breakHoursAvailable = (userPreferences.breakLength / 60) * numberOfBreaksPerDay
    let breakHoursUsed = 0
    for (const breakEvent of breakEvents) {
        const duration = dayjs.duration(dayjs(dayjs(breakEvent.endDate.slice(0, 19)).format('YYYY-MM-DDTHH:mm:ss')).diff(dayjs(breakEvent.startDate.slice(0, 19)).format('YYYY-MM-DDTHH:mm:ss'))).asHours()
        breakHoursUsed += duration
    }

    if (breakHoursUsed >= breakHoursAvailable) {

        return false
    }

    if (!(allEvents?.length > 0)) {

        return false
    }
    let hoursUsed = 0
    for (const event of allEvents) {
        const duration = dayjs.duration(dayjs(dayjs(event.endDate.slice(0, 19)).format('YYYY-MM-DDTHH:mm:ss')).diff(dayjs(event.startDate.slice(0, 19)).format('YYYY-MM-DDTHH:mm:ss'))).asHours()
        hoursUsed += duration
    }

    if (hoursUsed >= workingHours) {

        return false
    }

    return true
}

export const generateBreaks = (
    userPreferences: UserPreferenceType,
    numberOfBreaksToGenerate: number,
    eventMirror: EventPlusType,
    globalCalendarId?: string,
): EventPlusType[] => {
    const breaks = []
    // validate
    if (!userPreferences?.breakLength) {

        return breaks
    }

    if (!numberOfBreaksToGenerate) {

        return breaks
    }

    if (!eventMirror) {

        return breaks
    }

    for (let i = 0; i < numberOfBreaksToGenerate; i++) {
        const eventId = uuid()
        const breakEvent: EventPlusType = {
            id: `${eventId}#${globalCalendarId || eventMirror.calendarId}}`,
            userId: userPreferences.userId,
            title: 'Break',
            startDate: dayjs(eventMirror.startDate.slice(0, 19)).tz(eventMirror.timezone, true).format(),
            endDate: dayjs(eventMirror.startDate.slice(0, 19)).tz(eventMirror.timezone, true).add(userPreferences.breakLength, 'minute').format(),
            allDay: false,
            notes: 'Break',
            timezone: eventMirror.timezone,
            createdDate: dayjs().toISOString(),
            updatedAt: dayjs().toISOString(),
            deleted: false,
            priority: 1,
            isFollowUp: false,
            isPreEvent: false,
            modifiable: true,
            anyoneCanAddSelf: false,
            guestsCanInviteOthers: false,
            guestsCanSeeOtherGuests: false,
            originalStartDate: eventMirror.startDate,
            originalAllDay: false,
            calendarId: globalCalendarId || eventMirror.calendarId,
            backgroundColor: userPreferences.breakColor || '#F7EBF7',
            isBreak: true,
            duration: userPreferences.breakLength,
            userModifiedDuration: true,
            userModifiedColor: true,
            isPostEvent: false,
            method: 'create',
            eventId,
        }
        breaks.push(breakEvent)
    }

    return breaks
}

export const generateBreakEventsForDay = async (
    userPreferences: UserPreferenceType,
    userId: string,
    startDate: string,
    timezone: string,
    eventsToBeBreaks: EventPlusType[] = [],
    globalCalendarId?: string,
    isFirstDay?: boolean,
) => {
    try {
        // validate
        if (!userPreferences?.breakLength) {

            return null
        }

        if (!userId) {

            return null
        }

        if (!startDate) {

            return null
        }

        if (!timezone) {

            return null
        }

        if (isFirstDay) {
            const endTimes = userPreferences.endTimes
            const dayOfWeekInt = getISODay(dayjs(startDate.slice(0, 19)).tz(timezone, true).toDate())

            let startHour = dayjs(startDate.slice(0, 19)).tz(timezone, true).hour()
            let startMinute = dayjs(startDate.slice(0, 19)).tz(timezone, true).minute()
            const endHour = endTimes.find(i => (i.day === dayOfWeekInt)).hour
            const endMinute = endTimes.find(i => (i.day === dayOfWeekInt)).minutes

            // validate values before calculating
            const startTimes = userPreferences.startTimes
            const workStartHour = startTimes.find(i => (i.day === dayOfWeekInt)).hour
            const workStartMinute = startTimes.find(i => (i.day === dayOfWeekInt)).minutes

            if (dayjs(startDate.slice(0, 19)).isAfter(dayjs(startDate.slice(0, 19)).hour(endHour).minute(endMinute))) {
                // return empty as outside of work time
                return null
            }

            // change to work start time as before start time
            if (dayjs(startDate.slice(0, 19)).isBefore(dayjs(startDate.slice(0, 19)).hour(workStartHour).minute(workStartMinute))) {
                startHour = workStartHour
                startMinute = workStartMinute
            }

            const workingHours = convertToTotalWorkingHours(userPreferences, startDate, timezone)
            const allEvents = await listEventsForDate(userId, dayjs(startDate.slice(0, 19)).tz(timezone, true).hour(startHour).minute(startMinute).format(), dayjs(startDate.slice(0, 19)).tz(timezone, true).hour(endHour).minute(endMinute).format(), timezone)
            if (!(allEvents?.length > 0)) {

                return null
            }
            const shouldGenerateBreaks = shouldGenerateBreakEventsForDay(workingHours, userPreferences, allEvents)
            // validate
            if (!shouldGenerateBreaks) {

                return null
            }

            let hoursUsed = 0

            if (allEvents?.length > 0) {
                for (const allEvent of allEvents) {
                    const duration = dayjs.duration(dayjs(allEvent.endDate.slice(0, 19)).tz(timezone, true).diff(dayjs(allEvent.startDate.slice(0, 19)).tz(timezone, true))).asHours()
                    hoursUsed += duration
                }
            }

            let hoursAvailable = workingHours - hoursUsed
            hoursAvailable -= (workingHours * userPreferences.maxWorkLoadPercent)
            // no hours available
            if (hoursAvailable <= 0) {

                return null
            }

            const oldBreakEvents = allEvents.filter((event) => event.isBreak)
                .filter(e => (dayjs(startDate.slice(0, 19)).tz(timezone, true).isSame(dayjs(e.startDate.slice(0, 19)).tz(timezone, true), 'day')))

            const breakEvents = eventsToBeBreaks.concat(oldBreakEvents)

            const numberOfBreaksPerDay = userPreferences.minNumberOfBreaks

            const breakHoursToGenerate = (userPreferences.breakLength / 60) * numberOfBreaksPerDay
            let breakHoursUsed = 0

            if (breakEvents?.length > 0) {
                for (const breakEvent of breakEvents) {
                    const duration = dayjs.duration(dayjs(breakEvent.endDate.slice(0, 19)).tz(timezone, true).diff(dayjs(breakEvent.startDate.slice(0, 19)).tz(timezone, true))).asHours()
                    breakHoursUsed += duration
                }
            }

            const actualBreakHoursToGenerate = breakHoursToGenerate - breakHoursUsed

            if (actualBreakHoursToGenerate > hoursAvailable) {

                return null
            }



            const breakLengthAsHours = userPreferences.breakLength / 60

            const numberOfBreaksToGenerate = Math.floor(actualBreakHoursToGenerate / breakLengthAsHours)


            if (numberOfBreaksToGenerate < 1) {

                return null
            }

            const eventMirror = allEvents.find((event) => !event.isBreak)

            const newEvents = generateBreaks(
                userPreferences,
                numberOfBreaksToGenerate,
                eventMirror,
                globalCalendarId,
            )

            return newEvents

        }

        const endTimes = userPreferences.endTimes
        const dayOfWeekInt = getISODay(dayjs(startDate.slice(0, 19)).tz(timezone, true).toDate())

        const endHour = endTimes.find(i => (i.day === dayOfWeekInt)).hour
        const endMinute = endTimes.find(i => (i.day === dayOfWeekInt)).minutes

        // validate values before calculating
        const startTimes = userPreferences.startTimes
        const startHour = startTimes.find(i => (i.day === dayOfWeekInt)).hour
        const startMinute = startTimes.find(i => (i.day === dayOfWeekInt)).minutes

        const workingHours = convertToTotalWorkingHours(userPreferences, startDate, timezone)
        const allEvents = await listEventsForDate(userId, dayjs(startDate.slice(0, 19)).tz(timezone, true).hour(startHour).minute(startMinute).format(), dayjs(startDate.slice(0, 19)).tz(timezone, true).hour(endHour).minute(endMinute).format(), timezone)
        if (!(allEvents?.length > 0)) {

            return null
        }
        const shouldGenerateBreaks = shouldGenerateBreakEventsForDay(workingHours, userPreferences, allEvents)
        // validate
        if (!shouldGenerateBreaks) {

            return null
        }

        let hoursUsed = 0

        if (allEvents?.length > 0) {
            for (const allEvent of allEvents) {
                const duration = dayjs.duration(dayjs(allEvent.endDate.slice(0, 19)).tz(timezone, true).diff(dayjs(allEvent.startDate.slice(0, 19)).tz(timezone, true))).asHours()
                hoursUsed += duration
            }
        }

        let hoursAvailable = workingHours - hoursUsed
        hoursAvailable -= (workingHours * userPreferences.maxWorkLoadPercent)

        // no hours available
        if (hoursAvailable <= 0) {

            return null
        }

        const oldBreakEvents = allEvents.filter((event) => event.isBreak)
            .filter(e => (dayjs(startDate.slice(0, 19)).tz(timezone, true).isSame(dayjs(e.startDate.slice(0, 19)).tz(timezone, true), 'day')))

        const breakEvents = eventsToBeBreaks.concat(oldBreakEvents)

        const numberOfBreaksPerDay = userPreferences.minNumberOfBreaks

        const breakHoursToGenerate = (userPreferences.breakLength / 60) * numberOfBreaksPerDay
        let breakHoursUsed = 0

        if (breakEvents?.length > 0) {
            for (const breakEvent of breakEvents) {
                const duration = dayjs.duration(dayjs(breakEvent.endDate.slice(0, 19)).tz(timezone, true).diff(dayjs(breakEvent.startDate.slice(0, 19)).tz(timezone, true))).asHours()
                breakHoursUsed += duration
            }
        }

        const actualBreakHoursToGenerate = breakHoursToGenerate - breakHoursUsed

        if (actualBreakHoursToGenerate > hoursAvailable) {

            return null
        }



        const breakLengthAsHours = userPreferences.breakLength / 60

        const numberOfBreaksToGenerate = Math.floor(actualBreakHoursToGenerate / breakLengthAsHours)


        if (numberOfBreaksToGenerate < 1) {

            return null
        }

        const eventMirror = allEvents.find((event) => !event.isBreak)

        const newEvents = generateBreaks(
            userPreferences,
            numberOfBreaksToGenerate,
            eventMirror,
            globalCalendarId,
        )

        return newEvents

    } catch (e) {

    }
}

export const adjustStartDatesForBreakEventsForDay = (
    allEvents: EventPlusType[],
    breakEvents: EventPlusType[],
    userPreference: UserPreferenceType,
    timezone: string,
): EventPlusType[] => {
    // validate 
    if (!allEvents?.[0]?.id) {

        return
    }


    const startTimes = userPreference.startTimes
    const endTimes = userPreference.endTimes
    const dayOfWeekInt = getISODay(dayjs(allEvents?.[0]?.startDate.slice(0, 19)).tz(timezone, true).toDate())
    const startHour = startTimes.find(i => (i.day === dayOfWeekInt)).hour
    const startMinute = startTimes.find(i => (i.day === dayOfWeekInt)).minutes
    const endHour = endTimes.find(i => (i.day === dayOfWeekInt)).hour
    const endMinute = endTimes.find(i => (i.day === dayOfWeekInt)).minutes
    const newBreakEvents = []
    /**
     * const startDuration = dayjs.duration({ hours: startHour, minutes: startMinute })
      const endDuration = dayjs.duration({ hours: endHour, minutes: endMinute })
      const totalDuration = endDuration.subtract(startDuration)
      return totalDuration.asHours()
     */

    const startOfWorkingDay = dayjs(allEvents[0]?.startDate.slice(0, 19)).tz(timezone, true)
        .hour(startHour).minute(startMinute)

    const endOfWorkingDay = dayjs(allEvents[0]?.endDate.slice(0, 19)).tz(timezone, true)
        .hour(endHour).minute(endMinute)

    const filteredEvents = allEvents.filter(e => (!e.isBreak))
    if (breakEvents?.length > 0) {
        for (const breakEvent of breakEvents) {
            let foundSpace = false
            let index = 0
            while ((!foundSpace) && (index < filteredEvents.length)) {
                const possibleEndDate = dayjs(filteredEvents[index].startDate.slice(0, 19)).tz(timezone, true)

                const possibleStartDate = dayjs(possibleEndDate.format().slice(0, 19)).tz(timezone, true).subtract(userPreference.breakLength, 'minute')
                let isBetweenStart = true
                let isBetweenEnd = true
                let betweenIndex = 0
                let betweenWorkingDayStart = true
                let betweenWorkingDayEnd = true
                let isBetweenBreakStart = true
                let isBetweenBreakEnd = true

                while ((isBetweenStart || isBetweenEnd || !betweenWorkingDayStart || !betweenWorkingDayEnd || isBetweenBreakStart || isBetweenBreakEnd) && (betweenIndex < filteredEvents.length)) {
                    isBetweenStart = possibleStartDate.isBetween(dayjs(filteredEvents[betweenIndex].startDate.slice(0, 19)).tz(timezone, true), dayjs(filteredEvents[betweenIndex].endDate.slice(0, 19)).tz(timezone, true), 'minute', '[)')

                    isBetweenEnd = possibleEndDate.isBetween(dayjs(filteredEvents[betweenIndex].startDate.slice(0, 19)).tz(timezone, true), dayjs(filteredEvents[betweenIndex].endDate.slice(0, 19)).tz(timezone, true), 'minute', '(]')

                    betweenWorkingDayStart = possibleStartDate.isBetween(startOfWorkingDay, endOfWorkingDay, 'minute', '[)')

                    betweenWorkingDayEnd = possibleEndDate.isBetween(startOfWorkingDay, endOfWorkingDay, 'minute', '(]')

                    for (const breakEvent of breakEvents) {
                        isBetweenBreakStart = possibleStartDate.isBetween(dayjs(breakEvent.startDate.slice(0, 19)).tz(timezone, true), dayjs(breakEvent.endDate.slice(0, 19)).tz(timezone, true), 'minute', '[)')

                        isBetweenBreakEnd = possibleEndDate.isBetween(dayjs(breakEvent.startDate.slice(0, 19)).tz(timezone, true), dayjs(breakEvent.endDate.slice(0, 19)).tz(timezone, true), 'minute', '(]')
                    }

                    betweenIndex++
                }

                foundSpace = (!isBetweenStart && !isBetweenEnd && betweenWorkingDayStart && betweenWorkingDayEnd && !isBetweenBreakStart && !isBetweenBreakEnd)

                if (foundSpace) {
                    const newBreakEvent = {
                        ...breakEvent,
                        startDate: possibleStartDate.toISOString(),
                        endDate: possibleEndDate.toISOString(),
                    }
                    newBreakEvents.push(newBreakEvent)
                }

                index++
            }
        }
    }

    return newBreakEvents
}

export const generateBreakEventsForDate = async (
    userPreferences: UserPreferenceType,
    userId: string,
    startDate: string,
    endDate: string,
    timezone: string,
    eventsToBeBreaks: EventPlusType[] = [],
    globalCalendarId?: string,
): Promise<EventPlusType[] | []> => {
    try {
        const totalBreakEvents = []
        const totalDays = dayjs(endDate.slice(0, 19)).tz(timezone, true).diff(dayjs(startDate.slice(0, 19)).tz(timezone, true), 'day')

        for (let i = 0; i < totalDays; i++) {
            const dayDate = dayjs(startDate.slice(0, 19)).tz(timezone, true)
                .add(i, 'day').format()
            const eventsToBeBreaksForDay = eventsToBeBreaks.filter(e => dayjs(e.startDate.slice(0, 19)).tz(e.timezone, true).isSame(dayDate, 'day'))
            const newBreakEvents = await generateBreakEventsForDay(userPreferences, userId, dayDate, timezone, eventsToBeBreaksForDay, globalCalendarId, i === 0)

            if (i === 0) {
                const endTimes = userPreferences.endTimes
                const dayOfWeekInt = getISODay(dayjs(dayDate.slice(0, 19)).tz(timezone, true).toDate())

                let startHour = dayjs(dayDate.slice(0, 19)).tz(timezone, true).hour()
                let startMinute = dayjs(dayDate.slice(0, 19)).tz(timezone, true).minute()
                const endHour = endTimes.find(i => (i.day === dayOfWeekInt)).hour
                const endMinute = endTimes.find(i => (i.day === dayOfWeekInt)).minutes

                // validate values before calculating
                const startTimes = userPreferences.startTimes
                const workStartHour = startTimes.find(i => (i.day === dayOfWeekInt)).hour
                const workStartMinute = startTimes.find(i => (i.day === dayOfWeekInt)).minutes

                if (dayjs(dayDate.slice(0, 19)).isAfter(dayjs(dayDate.slice(0, 19)).hour(endHour).minute(endMinute))) {
                    // return empty as outside of work time
                    continue
                }

                // change to work start time as before start time
                if (dayjs(dayDate.slice(0, 19)).isBefore(dayjs(dayDate.slice(0, 19)).hour(workStartHour).minute(workStartMinute))) {
                    startHour = workStartHour
                    startMinute = workStartMinute
                }

                const allEvents = await listEventsForDate(userId, dayjs(dayDate.slice(0, 19)).tz(timezone, true).hour(startHour).minute(startMinute).format(), dayjs(dayDate.slice(0, 19)).tz(timezone, true).hour(endHour).minute(endMinute).format(), timezone)
                const newBreakEventsAdjusted = await adjustStartDatesForBreakEventsForDay(allEvents,
                    newBreakEvents, userPreferences, timezone)
                if (newBreakEventsAdjusted?.length > 0) {
                    newBreakEventsAdjusted.forEach(b =>
                        totalBreakEvents.push(...newBreakEventsAdjusted)
                }

                continue
            }

            const endTimes = userPreferences.endTimes
            const dayOfWeekInt = getISODay(dayjs(dayDate.slice(0, 19)).tz(timezone, true).toDate())

            const endHour = endTimes.find(i => (i.day === dayOfWeekInt)).hour
            const endMinute = endTimes.find(i => (i.day === dayOfWeekInt)).minutes

            // validate values before calculating
            const startTimes = userPreferences.startTimes
            const startHour = startTimes.find(i => (i.day === dayOfWeekInt)).hour
            const startMinute = startTimes.find(i => (i.day === dayOfWeekInt)).minutes

            const allEvents = await listEventsForDate(userId, dayjs(dayDate.slice(0, 19)).tz(timezone, true).hour(startHour).minute(startMinute).format(), dayjs(dayDate.slice(0, 19)).tz(timezone, true).hour(endHour).minute(endMinute).format(), timezone)
            const newBreakEventsAdjusted = await adjustStartDatesForBreakEventsForDay(allEvents,
                newBreakEvents, userPreferences, timezone)
            if (newBreakEventsAdjusted?.length > 0) {
                newBreakEventsAdjusted.forEach(b =>
                    totalBreakEvents.push(...newBreakEventsAdjusted)
            }
        }

        return totalBreakEvents
    } catch (e) {

    }
}

export const upsertEventsPostPlanner = async (
    events: EventType[]
) => {
    try {
        const operationName = 'InsertEvent'
        const query = `
      mutation InsertEvent($events: [Event_insert_input!]!) {
        insert_Event(
            objects: $events,
            on_conflict: {
                constraint: Event_pkey,
                update_columns: [
                    userId,
                    title,
                    startDate,
                    endDate,
                    allDay,
                    recurrenceRule,
                    location,
                    notes,
                    attachments,
                    links,
                    timezone,
                    createdDate,
                    deleted,
                    taskId,
                    taskType,
                    priority,
                    followUpEventId,
                    isFollowUp,
                    isPreEvent,
                    isPostEvent,
                    preEventId,
                    postEventId,
                    modifiable,
                    forEventId,
                    conferenceId,
                    maxAttendees,
                    sendUpdates,
                    anyoneCanAddSelf,
                    guestsCanInviteOthers,
                    guestsCanSeeOtherGuests,
                    originalStartDate,
                    originalAllDay,
                    status,
                    summary,
                    transparency,
                    visibility,
                    recurringEventId,
                    updatedAt,
                    iCalUID,
                    htmlLink,
                    colorId,
                    creator,
                    organizer,
                    endTimeUnspecified,
                    recurrence,
                    originalTimezone,
                    attendeesOmitted,
                    extendedProperties,
                    hangoutLink,
                    guestsCanModify,
                    locked,
                    source,
                    eventType,
                    privateCopy,
                    calendarId,
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
                    copyColor,
                    userModifiedColor,
                    byWeekDay,
                    localSynced,
                ]
            }){
            returning {
              id
            }
            affected_rows
          }
        }
      `
        _.uniqBy(events, 'id').forEach(e => 
        const variables = {
            events: _.uniqBy(events, 'id'),
        }

            const response: { data: { insert_Event: { affected_rows: number, returning: { id: string }[] } } } = await got.post(hasuraGraphUrl, {
                headers: {
                    'X-Hasura-Admin-Secret': hasuraAdminSecret,
                    'X-Hasura-Role': 'admin'
                },
                json: {
                    operationName,
                    query,
                    variables,
                }
            }).json()

            response?.data?.insert_Event?.returning?.forEach(e => 
        return response
            } catch (e) {

            }
        }

export const formatRemindersForGoogle = (reminders: ReminderType[]): GoogleReminderType => {
            const googleOverrides: OverrideTypes = reminders.map(reminder => {
                return {
                    method: 'email',
                    minutes: reminder.minutes,
                }
            })
            const googleReminders: GoogleReminderType = {
                overrides: googleOverrides,
                useDefault: false,
            }
            return googleReminders
        }

        export const refreshGoogleToken = async (
            refreshToken: string,
            clientType: 'ios' | 'android' | 'web'
        ): Promise<{
            access_token: string,
            expires_in: number, // add seconds to now
            scope: string,
            token_type: string
        }> => {
            try {



                switch (clientType) {
                    case 'ios':
                        return got.post(
                            googleTokenUrl,
                            {
                                form: {
                                    grant_type: 'refresh_token',
                                    refresh_token: refreshToken,
                                    client_id: googleClientIdIos,
                                },
                                headers: {
                                    'Content-Type': 'application/x-www-form-urlencoded',
                                },
                            },
                        ).json()
                    case 'android':
                        return got.post(
                            googleTokenUrl,
                            {
                                form: {
                                    grant_type: 'refresh_token',
                                    refresh_token: refreshToken,
                                    client_id: googleClientIdAndroid,
                                },
                                headers: {
                                    'Content-Type': 'application/x-www-form-urlencoded',
                                },
                            },
                        ).json()
                    case 'web':
                        return got.post(
                            googleTokenUrl,
                            {
                                form: {
                                    grant_type: 'refresh_token',
                                    refresh_token: refreshToken,
                                    client_id: googleClientIdWeb,
                                    client_secret: googleClientSecretWeb,
                                },
                                headers: {
                                    'Content-Type': 'application/x-www-form-urlencoded',
                                },
                            },
                        ).json()
                }

                /*  
                {
                  "access_token": "1/fFAGRNJru1FTz70BzhT3Zg",
                  "expires_in": 3920, // add seconds to now
                  "scope": "https://www.googleapis.com/auth/drive.metadata.readonly",
                  "token_type": "Bearer"
                }
                */
            } catch (e) {

            }
        }

        export const updateCalendarIntegration = async (
            id: string,
            token?: string,
            expiresIn?: number,
            enabled?: boolean,
        ) => {
            try {
                const operationName = 'updateCalendarIntegration'
                const query = `
      mutation updateCalendarIntegration($id: uuid!,${token !== undefined ? ' $token: String,' : ''}${expiresIn !== undefined ? ' $expiresAt: timestamptz,' : ''}${enabled !== undefined ? ' $enabled: Boolean,' : ''}) {
        update_Calendar_Integration_by_pk(pk_columns: {id: $id}, _set: {${token !== undefined ? 'token: $token,' : ''}${expiresIn !== undefined ? ' expiresAt: $expiresAt,' : ''}${enabled !== undefined ? ' enabled: $enabled,' : ''}}) {
          id
          name
          refreshToken
          token
          clientType
          userId
          updatedAt
        }
      }
    `
                const variables = {
                    id,
                    token,
                    expiresAt: dayjs().add(expiresIn, 'seconds').toISOString(),
                    enabled,
                }

                const res = await got.post(
                    hasuraGraphUrl,
                    {
                        json: {
                            operationName,
                            query,
                            variables,
                        },
                        headers: {
                            'X-Hasura-Admin-Secret': hasuraAdminSecret,
                            'Content-Type': 'application/json',
                            'X-Hasura-Role': 'admin'
                        },
                    },
                ).json()


            } catch (e) {

            }
        }

        export const getCalendarIntegration = async (
            userId: string,
            resource: string,
        ) => {
            try {
                const operationName = 'getCalendarIntegration'
                const query = `
      query getCalendarIntegration($userId: uuid!, $resource: String!) {
        Calendar_Integration(where: {userId: {_eq: $userId}, resource: {_eq: $resource}}) {
          token
          expiresAt
          id
          refreshToken
          resource
          name
          clientType
        }
      }
    `
                const variables = {
                    userId,
                    resource,
                }

                const res: { data: { Calendar_Integration: CalendarIntegrationType[] } } = await got.post(
                    hasuraGraphUrl,
                    {
                        json: {
                            operationName,
                            query,
                            variables,
                        },
                        headers: {
                            'X-Hasura-Admin-Secret': hasuraAdminSecret,
                            'Content-Type': 'application/json',
                            'X-Hasura-Role': 'admin'
                        },
                    },
                ).json()


                if (res?.data?.Calendar_Integration?.length > 0) {
                    return res?.data?.Calendar_Integration?.[0]
                }
            } catch (e) {

            }
        }

        export const getGoogleAPIToken = async (
            userId: string,
            resource: string,
            clientType: 'ios' | 'android' | 'web',
        ) => {
            let integrationId = ''
            try {
                const { id, token, expiresAt, refreshToken } = await getCalendarIntegration(userId, resource)
                integrationId = id

                if (dayjs().isAfter(dayjs(expiresAt)) || !token) {
                    const res = await refreshGoogleToken(refreshToken, clientType)

                    await updateCalendarIntegration(id, res.access_token, res.expires_in)
                    return res.access_token
                }
                return token
            } catch (e) {

                await updateCalendarIntegration(integrationId, null, null, false)
            }
        }


        export const patchGoogleEvent = async (
            userId: string,
            calendarId: string,
            eventId: string,
            clientType: 'ios' | 'android' | 'web',
            endDateTime?: string, // either endDateTime or endDate - all day vs specific period
            startDateTime?: string,
            conferenceDataVersion?: 0 | 1,
            maxAttendees?: number,
            sendUpdates?: GoogleSendUpdatesType,
            anyoneCanAddSelf?: boolean,
            attendees?: GoogleAttendeeType[],
            conferenceData?: GoogleConferenceDataType,
            summary?: string,
            description?: string,
            timezone?: string, // required for recurrence
            startDate?: string,
            endDate?: string,
            extendedProperties?: GoogleExtendedPropertiesType,
            guestsCanInviteOthers?: boolean,
            guestsCanModify?: boolean,
            guestsCanSeeOtherGuests?: boolean,
            originalStartDateTime?: string,
            originalStartDate?: string,
            recurrence?: string[],
            reminders?: GoogleReminderType,
            source?: GoogleSourceType,
            status?: string,
            transparency?: GoogleTransparencyType,
            visibility?: GoogleVisibilityType,
            iCalUID?: string,
            attendeesOmitted?: boolean,
            hangoutLink?: string,
            privateCopy?: boolean,
            locked?: boolean,
            attachments?: GoogleAttachmentType[],
            eventType?: GoogleEventType1,
            location?: string,
            colorId?: string,
        ) => {
            try {
                // get token =
                const token = await getGoogleAPIToken(userId, googleCalendarResource, clientType)
                // let url = `${googleUrl}/${encodeURI(calendarId)}/events/${encodeURI(eventId)}`

                // const config = {
                //   headers: {
                //     Authorization: `Bearer ${token}`,
                //     'Content-Type': 'application/json',
                //     'Accept': 'application/json',
                //   },
                // }

                const googleCalendar = google.calendar({
                    version: 'v3',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })

                let variables: any = {
                    // Calendar identifier. To retrieve calendar IDs call the calendarList.list method. If you want to access the primary calendar of the currently logged in user, use the "primary" keyword.
                    calendarId,
                    // Version number of conference data supported by the API client. Version 0 assumes no conference data support and ignores conference data in the event's body. Version 1 enables support for copying of ConferenceData as well as for creating new conferences using the createRequest field of conferenceData. The default is 0.
                    conferenceDataVersion,
                    // Event identifier.
                    eventId,
                    // The maximum number of attendees to include in the response. If there are more than the specified number of attendees, only the participant is returned. Optional.
                    maxAttendees,
                    // Guests who should receive notifications about the event update (for example, title changes, etc.).
                    sendUpdates,
                    // Request body metadata
                    requestBody: {
                        // request body parameters
                        // {
                        //   "anyoneCanAddSelf": false,
                        //   "attachments": [],
                        //   "attendees": [],
                        //   "attendeesOmitted": false,
                        //   "colorId": "my_colorId",
                        //   "conferenceData": {},
                        //   "created": "my_created",
                        //   "creator": {},
                        //   "description": "my_description",
                        //   "end": {},
                        //   "endTimeUnspecified": false,
                        //   "etag": "my_etag",
                        //   "eventType": "my_eventType",
                        //   "extendedProperties": {},
                        //   "gadget": {},
                        //   "guestsCanInviteOthers": false,
                        //   "guestsCanModify": false,
                        //   "guestsCanSeeOtherGuests": false,
                        //   "hangoutLink": "my_hangoutLink",
                        //   "htmlLink": "my_htmlLink",
                        //   "iCalUID": "my_iCalUID",
                        //   "id": "my_id",
                        //   "kind": "my_kind",
                        //   "location": "my_location",
                        //   "locked": false,
                        //   "organizer": {},
                        //   "originalStartTime": {},
                        //   "privateCopy": false,
                        //   "recurrence": [],
                        //   "recurringEventId": "my_recurringEventId",
                        //   "reminders": {},
                        //   "sequence": 0,
                        //   "source": {},
                        //   "start": {},
                        //   "status": "my_status",
                        //   "summary": "my_summary",
                        //   "transparency": "my_transparency",
                        //   "updated": "my_updated",
                        //   "visibility": "my_visibility"
                        // }
                    },
                }


                // create request body
                let requestBody: any = {}


                if (endDate && timezone && !endDateTime) {
                    const end = {
                        date: dayjs(endDateTime.slice(0, 19)).tz(timezone, true)
                            .format('YYYY-MM-DD'),
                        timezone,
                    }
                    requestBody.end = end
                }

                // if (endDateTime && timezone && !endDate && (recurrence?.length > 0)) {
                //   const end = {
                //     dateTime: dayjs(endDateTime).tz(timezone, true)
                //       .format('YYYY-MM-DDTHH:mm:ss'),
                //     timezone
                //   }
                //   requestBody.end = end
                // }

                if (endDateTime && timezone && !endDate) {

                    const end = {
                        dateTime: endDateTime,
                        timezone
                    }
                    requestBody.end = end


                }

                if (startDate && timezone && !startDateTime) {
                    const start = {
                        date: dayjs(startDateTime.slice(0, 19)).tz(timezone, true).format('YYYY-MM-DD'),
                        timezone,
                    }
                    requestBody.start = start
                }

                // if (startDateTime && timezone && !startDate && (recurrence?.length > 0)) {
                //   const start = {
                //     dateTime: dayjs(startDateTime).tz(timezone, true).format('YYYY-MM-DDTHH:mm:ss'),
                //     timezone,
                //   }
                //   requestBody.start = start
                // }

                if (startDateTime && timezone && !startDate) {

                    const start = {
                        dateTime: startDateTime,
                        timezone,
                    }
                    requestBody.start = start


                }

                if (originalStartDate && timezone && !originalStartDateTime) {
                    const originalStartTime = {
                        date: dayjs(originalStartDate.slice(0, 19)).tz(timezone, true).format('YYYY-MM-DD'),
                        timezone,
                    }
                    requestBody.originalStartTime = originalStartTime
                }

                if (originalStartDateTime && timezone && !originalStartDate) {
                    const originalStartTime = {
                        dateTime: originalStartDateTime,
                        timezone,
                    }
                    requestBody.originalStartTime = originalStartTime
                }

                if (anyoneCanAddSelf) {
                    // data = { ...data, anyoneCanAddSelf }
                    requestBody.anyoneCanAddSelf = anyoneCanAddSelf
                }

                if (attendees?.[0]?.email) {
                    // data = { ...data, attendees }
                    requestBody.attendees = attendees
                }

                if (conferenceData?.createRequest) {
                    // data = {
                    //   ...data,
                    //   conferenceData: {
                    //     createRequest: {
                    //       conferenceSolutionKey: {
                    //         type: conferenceData.type
                    //       },
                    //       requestId: conferenceData?.requestId || uuidv1(),
                    //     }
                    //   }
                    // }
                    requestBody.conferenceData = {
                        createRequest: {
                            conferenceSolutionKey: {
                                type: conferenceData.type
                            },
                            requestId: conferenceData?.requestId || uuid(),
                        }
                    }
                } else if (conferenceData?.entryPoints?.[0]) {
                    // data = {
                    //   ...data,
                    //   conferenceData: {
                    //     conferenceSolution: {
                    //       iconUri: conferenceData?.iconUri,
                    //       key: {
                    //         type: conferenceData?.type,
                    //       },
                    //       name: conferenceData?.name,
                    //     },
                    //     entryPoints: conferenceData?.entryPoints,
                    //   },
                    // }
                    requestBody.conferenceData = {
                        conferenceSolution: {
                            iconUri: conferenceData?.iconUri,
                            key: {
                                type: conferenceData?.type,
                            },
                            name: conferenceData?.name,
                        },
                        entryPoints: conferenceData?.entryPoints,
                    }
                }

                if (description?.length > 0) {
                    // data = { ...data, description }
                    requestBody.description = description
                }

                if (extendedProperties?.private || extendedProperties?.shared) {
                    // data = { ...data, extendedProperties }
                    requestBody.extendedProperties = extendedProperties
                }

                if (guestsCanInviteOthers) {
                    // data = { ...data, guestsCanInviteOthers }
                    requestBody.guestsCanInviteOthers = guestsCanInviteOthers
                }

                if (guestsCanModify) {
                    // data = { ...data, guestsCanModify }
                    requestBody.guestsCanModify = guestsCanModify
                }

                if (guestsCanSeeOtherGuests) {
                    // data = { ...data, guestsCanSeeOtherGuests }
                    requestBody.guestsCanSeeOtherGuests = guestsCanSeeOtherGuests
                }

                if (locked) {
                    // data = { ...data, locked }
                    requestBody.locked = locked
                }

                if (privateCopy) {
                    // data = { ...data, privateCopy }
                    requestBody.privateCopy = privateCopy
                }

                if (recurrence?.[0]) {
                    // data = { ...data, recurrence }
                    requestBody.recurrence = recurrence
                }

                if (reminders) {
                    // data = { ...data, reminders }
                    requestBody.reminders = reminders
                }

                if (source?.title || source?.url) {
                    // data = { ...data, source }
                    requestBody.source = source
                }

                if (attachments?.[0]?.fileId) {
                    // data = { ...data, attachments }
                    requestBody.attachments = attachments
                }

                if (eventType?.length > 0) {
                    // data = { ...data, eventType }
                    requestBody.eventType = eventType
                }

                if (status) {
                    // data = { ...data, status }
                    requestBody.status = status
                }

                if (transparency) {
                    // data = { ...data, transparency }
                    requestBody.transparency = transparency
                }

                if (visibility) {
                    // data = { ...data, visibility }
                    requestBody.visibility = visibility
                }

                if (iCalUID?.length > 0) {
                    // data = { ...data, iCalUID }
                    requestBody.iCalUID = iCalUID
                }

                if (attendeesOmitted) {
                    // data = { ...data, attendeesOmitted }
                    requestBody.attendeesOmitted = attendeesOmitted
                }

                if (hangoutLink?.length > 0) {
                    // data = { ...data, hangoutLink }
                    requestBody.hangoutLink = hangoutLink
                }

                if (summary?.length > 0) {
                    // data = { ...data, summary }
                    requestBody.summary = summary
                }

                if (location?.length > 0) {
                    // data = { ...data, location }
                    requestBody.location = location
                }

                if (colorId) {
                    requestBody.colorId = colorId
                }

                variables.requestBody = requestBody
                // Do the magic

                const res = await googleCalendar.events.patch(variables)

            } catch (e) {

            }
        }

        export const createGoogleEvent = async (
            userId: string,
            calendarId: string,
            clientType: 'ios' | 'android' | 'web',
            generatedId?: string,
            endDateTime?: string, // either endDateTime or endDate - all day vs specific period
            startDateTime?: string,
            conferenceDataVersion?: 0 | 1,
            maxAttendees?: number,
            sendUpdates?: GoogleSendUpdatesType,
            anyoneCanAddSelf?: boolean,
            attendees?: GoogleAttendeeType[],
            conferenceData?: GoogleConferenceDataType,
            summary?: string,
            description?: string,
            timezone?: string, // required for recurrence
            startDate?: string, // all day
            endDate?: string, // all day
            extendedProperties?: GoogleExtendedPropertiesType,
            guestsCanInviteOthers?: boolean,
            guestsCanModify?: boolean,
            guestsCanSeeOtherGuests?: boolean,
            originalStartDateTime?: string,
            originalStartDate?: string,
            recurrence?: string[],
            reminders?: GoogleReminderType,
            source?: GoogleSourceType,
            status?: string,
            transparency?: GoogleTransparencyType,
            visibility?: GoogleVisibilityType,
            iCalUID?: string,
            attendeesOmitted?: boolean,
            hangoutLink?: string,
            privateCopy?: boolean,
            locked?: boolean,
            attachments?: GoogleAttachmentType[],
            eventType?: GoogleEventType1,
            location?: string,
            colorId?: string,
        ) => {
            try {
                // get token =
                const token = await getGoogleAPIToken(userId, googleCalendarResource, clientType)

                const googleCalendar = google.calendar({
                    version: 'v3',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })

                // const token = await getAPIToken(userId, googleCalendarResource, googleCalendarName)
                // let url = `${googleUrl}/${encodeURI(calendarId)}/events`

                // const config = {
                //   headers: {
                //     Authorization: `Bearer ${token}`,
                //     'Content-Type': 'application/json',
                //     'Accept': 'application/json',
                //   },
                // }

                // if any query parameters build them
                // first
                if (
                    maxAttendees
                    || sendUpdates
                    || (conferenceDataVersion > 0)
                ) {
                    // url = `${url}?`
                    let params: any = {}

                    if (maxAttendees) {
                        params = { ...params, maxAttendees }
                    }

                    if (sendUpdates) {
                        params = { ...params, sendUpdates }
                    }

                    if (conferenceDataVersion > 0) {
                        params = { ...params, conferenceDataVersion }
                    }

                    if (
                        params?.maxAttendees
                        || params?.sendUpdates
                        || (params?.conferenceDataVersion > -1)
                    ) {
                        // url = `${url}${qs.stringify(params)}`
                    }
                }


                // create request body
                let data: any = {}

                if (endDateTime && timezone && !endDate) {
                    // BUG: calling dayjs here offsets endDateTime value
                    const end = {
                        dateTime: endDateTime,
                        timezone,
                    }

                    data.end = end
                }

                if (endDate && timezone && !endDateTime) {
                    const end = {
                        date: dayjs(endDate.slice(0, 19)).tz(timezone, true).format('YYYY-MM-DD'),
                        timezone,
                    }

                    data.end = end
                }

                if (startDate && timezone && !startDateTime) {
                    const start = {
                        date: dayjs(startDate.slice(0, 19)).tz(timezone, true).format('YYYY-MM-DD'),
                        timezone,
                    }
                    data.start = start
                }

                if (startDateTime && timezone && !startDate) {
                    const start = {
                        dateTime: startDateTime,
                        timezone,
                    }
                    data.start = start
                }

                if (originalStartDate && timezone && !originalStartDateTime) {
                    const originalStartTime = {
                        date: originalStartDate,
                        timezone,
                    }
                    data.originalStartTime = originalStartTime
                }

                if (originalStartDateTime && timezone && !originalStartDate) {
                    const originalStartTime = {
                        dateTime: dayjs(originalStartDateTime).tz(timezone, true).format(),
                        timezone,
                    }
                    data.originalStartTime = originalStartTime
                }

                if (anyoneCanAddSelf) {
                    data = { ...data, anyoneCanAddSelf }
                }

                if (attendees?.[0]?.email) {
                    data = { ...data, attendees }
                }

                if (conferenceData?.createRequest) {
                    data = {
                        ...data,
                        conferenceData: {
                            createRequest: {
                                conferenceSolutionKey: {
                                    type: conferenceData.type
                                },
                                requestId: conferenceData?.requestId || uuid(),
                            }
                        }
                    }
                } else if (conferenceData?.entryPoints?.[0]) {
                    data = {
                        ...data,
                        conferenceData: {
                            conferenceSolution: {
                                iconUri: conferenceData?.iconUri,
                                key: {
                                    type: conferenceData?.type,
                                },
                                name: conferenceData?.name,
                            },
                            entryPoints: conferenceData?.entryPoints,
                        },
                    }
                }

                if (description?.length > 0) {
                    data = { ...data, description }
                }

                if (extendedProperties?.private || extendedProperties?.shared) {
                    data = { ...data, extendedProperties }
                }

                if (guestsCanInviteOthers) {
                    data = { ...data, guestsCanInviteOthers }
                }

                if (guestsCanModify) {
                    data = { ...data, guestsCanModify }
                }

                if (guestsCanSeeOtherGuests) {
                    data = { ...data, guestsCanSeeOtherGuests }
                }

                if (locked) {
                    data = { ...data, locked }
                }

                if (privateCopy) {
                    data = { ...data, privateCopy }
                }

                if (recurrence?.[0]) {
                    data = { ...data, recurrence }
                }

                if (reminders) {
                    data = { ...data, reminders }
                }

                if (source?.title || source?.url) {
                    data = { ...data, source }
                }

                if (attachments?.[0]?.fileId) {
                    data = { ...data, attachments }
                }

                if (eventType?.length > 0) {
                    data = { ...data, eventType }
                }

                if (status) {
                    data = { ...data, status }
                }

                if (transparency) {
                    data = { ...data, transparency }
                }

                if (visibility) {
                    data = { ...data, visibility }
                }

                if (iCalUID?.length > 0) {
                    data = { ...data, iCalUID }
                }

                if (attendeesOmitted) {
                    data = { ...data, attendeesOmitted }
                }

                if (hangoutLink?.length > 0) {
                    data = { ...data, hangoutLink }
                }

                if (summary?.length > 0) {
                    data = { ...data, summary }
                }

                if (location?.length > 0) {
                    data = { ...data, location }
                }

                if (colorId) {
                    data.colorId = colorId
                }

                // if (id) {
                //   data = { ...data, id }
                // }

                // const results = await got.post<eventResponse>(
                //   url,
                //   {
                //     json: data,
                //     ...config,
                //   },
                // ).json()

                const res = await googleCalendar.events.insert({
                    // Calendar identifier. To retrieve calendar IDs call the calendarList.list method. If you want to access the primary calendar of the currently logged in user, use the "primary" keyword.
                    calendarId,
                    // Version number of conference data supported by the API client. Version 0 assumes no conference data support and ignores conference data in the event's body. Version 1 enables support for copying of ConferenceData as well as for creating new conferences using the createRequest field of conferenceData. The default is 0.
                    conferenceDataVersion,
                    // The maximum number of attendees to include in the response. If there are more than the specified number of attendees, only the participant is returned. Optional.
                    maxAttendees,
                    // Whether to send notifications about the creation of the new event. Note that some emails might still be sent. The default is false.
                    sendUpdates,

                    // Request body metadata
                    requestBody: data,
                })




                return { id: res?.data?.id, generatedId }
            } catch (e) {

            }
        }

        export const postPlannerModifyEventInCalendar = async (
            newEvent: EventPlusType,
            userId: string,
            method: 'update' | 'create',
            resource: string, isTimeBlocking: boolean,
            clientType: 'ios' | 'android' | 'web',
            newReminders?: ReminderType[],
            attendees?: MeetingAssistAttendeeType[],
            conference?: ConferenceType,
        ): Promise<string | { id: string, generatedId: string }> => {
            try {

                if (method === 'update') {
                    // update event

                    if (resource === googleCalendarResource) {
                        const googleReminders: GoogleReminderType = newReminders?.length > 0 ? formatRemindersForGoogle(newReminders) : undefined

                        // update event
                        await patchGoogleEvent(
                            userId,
                            newEvent.calendarId,
                            newEvent.eventId,
                            clientType,
                            newEvent.endDate,
                            newEvent.startDate,
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                            newEvent.timezone,
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                            googleReminders,
                            undefined,
                            undefined,
                            newEvent.transparency,
                            newEvent?.visibility,
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                            newEvent?.colorId,
                        )
                        return newEvent.id
                    }
                    // else if (resource === outlookCalendarResource) {
                    //   // await updateOutlookEvent(newEvent)
                    // }
                } else if (method === 'create') {

                    // create task events only
                    if (resource === googleCalendarResource) {
                        const googleReminders: GoogleReminderType = newReminders?.length > 0 ? formatRemindersForGoogle(newReminders) : undefined

                        const idAndGenIdObject = await createGoogleEvent(
                            userId,
                            newEvent.calendarId,
                            clientType,
                            newEvent?.eventId, // generatedId
                            newEvent?.endDate,
                            newEvent?.startDate,
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                            attendees?.map(a => ({ email: a?.primaryEmail, id: a?.id, displayName: a?.name })),
                            conference?.id ? {
                                type: conference?.app === 'zoom' ? 'addOn' : 'hangoutsMeet',
                                name: conference?.name,
                                conferenceId: conference?.id,
                                entryPoints: conference?.entryPoints,
                                createRequest: conference?.app === 'google' ? {
                                    requestId: conference?.requestId,
                                    conferenceSolutionKey: {
                                        type: 'hangoutsMeet',
                                    }
                                } : undefined,
                            } : undefined,
                            newEvent.summary || newEvent?.title,
                            newEvent.notes,
                            newEvent.timezone,
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                            newEvent?.recurrence,
                            googleReminders,
                            undefined,
                            undefined,
                            newEvent.transparency,
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                            isTimeBlocking ? 'focusTime' : 'default',
                            undefined,
                            newEvent?.colorId,
                        )

                        newEvent?.startDate, ' idAndGenIdObject, newEvent?.endDate,  newEvent?.startDate')
                        return idAndGenIdObject
                    }
                }
            } catch (e) {


                newEvent?.startDate, ' error - newEvent?.id, newEvent?.endDate,  newEvent?.startDate')
            }
        }

        export const generateBreakEventsForCalendarSync = async (
            userId: string,
            timezone: string,
            clientType: 'ios' | 'android' | 'web',
        ) => {
            try {
                // validate
                if (!userId) {

                    return
                }

                if (!timezone) {

                    return
                }

                if (!clientType) {

                    return
                }
                const userPreferences = await getUserPreferences(userId)

                const breakEvents = await generateBreakEventsForDate(userPreferences, userId, dayjs().tz(timezone, true).format(), dayjs().tz(timezone, true).add(7, 'd').format(), timezone)

                const results = await Promise.all(breakEvents.map(b => postPlannerModifyEventInCalendar(b, userId, 'create', googleCalendarResource, false, clientType))) as {
                    id: string;
                    generatedId: string;
                }[]


                if (!(breakEvents?.length > 0)) {

                    return
                }
                const eventsToUpsert = []
                for (const result of results) {
                    const foundEvent = (breakEvents as EventPlusType[])?.find(e => (e?.eventId === result?.generatedId))
                    if (foundEvent?.id) {
                        foundEvent.id = `${result?.id}#${foundEvent?.calendarId}`
                        foundEvent.eventId = result?.id
                        eventsToUpsert.push(foundEvent)
                    }
                }
                await upsertEventsPostPlanner(eventsToUpsert)
            } catch (e) {

            }
        }
