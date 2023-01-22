import { authApiToken, bucketName, bucketRegion, calendarPremiumDelay, calendarProDelay, classificationUrl, dayOfWeekIntToString, defaultFreemiumUsage, eventVectorName, externalMeetingLabel, googleCalendarResource, googleClientIdAndroid, googleClientIdIos, googleClientIdWeb, googleClientSecretWeb, googleTokenUrl, hasuraAdminSecret, hasuraGraphUrl, meetingLabel, minThresholdScore, onOptaPlanCalendarAdminCallBackUrl, openSearchEndPoint, optaPlannerPassword, optaPlannerUrl, optaPlannerUsername, searchIndex, text2VectorUrl, vectorDimensions, zoomBaseTokenUrl, zoomBaseUrl, zoomClientId, zoomClientSecret, zoomResourceName, zoomTokenUrl } from "@libs/constants"
import {
    BufferTimeNumberType, EventPlusType, EventType, MeetingAssistAttendeeType, MeetingAssistEventType, MeetingAssistPreferredTimeRangeType, MeetingAssistType, EventMeetingPlusType, PreferredTimeRangeType, RemindersForEventType, ValuesToReturnForBufferEventsType, UserPreferenceType,
    CalendarType, WorkTimeType, TimeSlotType, MonthType, DayType, MM, DD, MonthDayType, ActiveSubscriptionType, SubscriptionType,
    AdminBetaTestingType, Time, EventPartPlannerRequestBodyType, InitialEventPartType, InitialEventPartTypePlus, UserPlannerRequestBodyType,
    ReturnBodyForHostForOptaplannerPrepType, ReturnBodyForAttendeeForOptaplannerPrepType,
    ReturnBodyForExternalAttendeeForOptaplannerPrepType, PlannerRequestBodyType, FreemiumType,
    esResponseBody, CategoryType, classificationResponseBody as ClassificationResponseBodyType, BufferTimeObjectType, ReminderType, CategoryEventType,
    EventPlannerResponseBodyType, ReminderTypeAdjusted, CalendarIntegrationType, GoogleReminderType, OverrideTypes,
    GoogleSendUpdatesType,
    GoogleAttendeeType,
    GoogleConferenceDataType,
    GoogleExtendedPropertiesType,
    GoogleSourceType,
    GoogleTransparencyType,
    GoogleVisibilityType,
    GoogleAttachmentType,
    GoogleEventType1,
    ZoomMeetingObjectType,
    ConferenceType,
    CreateGoogleEventResponseType,
    CreateZoomMeetingRequestBodyType,
} from "@libs/types"
import got from "got"
import { v4 as uuid } from 'uuid'
import dayjs from 'dayjs'
// import isoWeek from 'dayjs/plugin/isoWeek'
import duration from 'dayjs/plugin/duration'
import isBetween from 'dayjs/plugin/isBetween'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import _ from "lodash"
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { defaultProvider } from '@aws-sdk/credential-provider-node'
import createAwsOpensearchConnector from 'aws-opensearch-connector'
import { Client } from '@opensearch-project/opensearch'
import AWS from 'aws-sdk'
import { getISODay, setISODay } from 'date-fns'
import { Readable } from "stream"
import { google } from 'googleapis'
import axios from "axios"
import { URLSearchParams } from "node:url"

// dayjs.extend(isoWeek)
dayjs.extend(duration)
dayjs.extend(isBetween)
dayjs.extend(timezone)
dayjs.extend(utc)

const s3Client = new S3Client({
    region: bucketRegion,
})


export async function streamToString(stream: Readable): Promise<string> {
    return await new Promise((resolve, reject) => {
        const chunks: Uint8Array[] = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    });
}


export const getSearchClient = async () => {
    try {
        const credentials = await defaultProvider()()
        const config = new AWS.Config({
            credentials: credentials,
            region: process.env.AWS_REGION ?? 'us-east-1',
        })

        const connector = createAwsOpensearchConnector(config)
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

export const convertEventToVectorSpace2 = async (event: EventType): Promise<number[]> => {
    try {
        if (!event) {
            throw new Error('no event provided to convertEventToVectorSpace2')
        }
        const { summary, notes } = event

        const vector: number[] = await got.post(
            text2VectorUrl,
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Basic ${Buffer.from(`admin:${authApiToken}`).toString('base64')}`,
                },
                json: {
                    sentences: [`${summary}: ${notes}`]
                },
            }
        ).json()

        
        return vector

    } catch (e) {
        
    }
}
export const listMeetingAssistPreferredTimeRangesGivenMeetingId = async (meetingId: string) => {
    try {
        const operationName = 'ListMeetingAssistPrefereredTimeRangesByMeetingId'
        const query = `
            query ListMeetingAssistPrefereredTimeRangesByMeetingId($meetingId: uuid!) {
                Meeting_Assist_Preferred_Time_Range(where: {meetingId: {_eq: $meetingId}}) {
                    attendeeId
                    createdDate
                    dayOfWeek
                    endTime
                    hostId
                    id
                    meetingId
                    startTime
                    updatedAt
                }
             }

        `

        const variables = {
            meetingId
        }

        const res: { data: { Meeting_Assist_Preferred_Time_Range: MeetingAssistPreferredTimeRangeType[] } } = await got.post(
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

        

        return res?.data?.Meeting_Assist_Preferred_Time_Range

    } catch (e) {
        
    }
}

export const listMeetingAssistAttendeesGivenMeetingId = async (meetingId: string) => {
    try {
        const operationName = 'ListMeetingAssistAttendeesByMeetingId'
        const query = `
            query ListMeetingAssistAttendeesByMeetingId($meetingId: uuid!) {
                Meeting_Assist_Attendee(where: {meetingId: {_eq: $meetingId}}) {
                    contactId
                    createdDate
                    emails
                    externalAttendee
                    hostId
                    id
                    imAddresses
                    meetingId
                    name
                    phoneNumbers
                    primaryEmail
                    timezone
                    updatedAt
                    userId
                }
            }
        `

        const variables = {
            meetingId,
        }

        const res: { data: { Meeting_Assist_Attendee: MeetingAssistAttendeeType[] } } = await got.post(
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

        

        return res?.data?.Meeting_Assist_Attendee

    } catch (e) {
        
    }
}

export const getMeetingAssistAttendee = async (id: string) => {
    try {
        const operationName = 'GetMeetingAssistAttendeeById'
        const query = `
            query GetMeetingAssistAttendeeById($id: String!) {
                Meeting_Assist_Attendee_by_pk(id: $id) {
                    contactId
                    createdDate
                    emails
                    hostId
                    id
                    imAddresses
                    meetingId
                    name
                    phoneNumbers
                    primaryEmail
                    timezone
                    updatedAt
                    userId
                    externalAttendee
                }
            }
        `

        const variables = {
            id,
        }

        const res: { data: { Meeting_Assist_Attendee_by_pk: MeetingAssistAttendeeType } } = await got.post(
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

        

        return res?.data?.Meeting_Assist_Attendee_by_pk

    } catch (e) {
        
    }
}

export const getMeetingAssist = async (id: string) => {
    try {
        const operationName = 'GetMeetingAssistById'
        const query = `
            query GetMeetingAssistById($id: uuid!) {
                Meeting_Assist_by_pk(id: $id) {
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
                    guestsCanInviteOthers
                    guestsCanSeeOtherGuests
                    foregroundColor
                    id
                    location
                    minThresholdCount
                    notes
                    priority
                    reminders
                    sendUpdates
                    startDate
                    summary
                    timezone
                    transparency
                    updatedAt
                    useDefaultAlarms
                    userId
                    visibility
                    windowEndDate
                    windowStartDate
                    allowAttendeeUpdatePreferences
                    guaranteeAvailability
                }
            }
        `

        const variables = {
            id,
        }

        const res: { data: { Meeting_Assist_by_pk: MeetingAssistType } } = await got.post(
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

        

        return res?.data?.Meeting_Assist_by_pk
    } catch (e) {
        
    }
}

export const listMeetingAssistEventsForAttendeeGivenDates = async (
    attendeeId: string,
    hostStartDate: string,
    hostEndDate: string,
    userTimezone: string,
    hostTimezone: string,
) => {
    try {
        const operationName = 'ListMeetingAssistEventsForAttendeeGivenDates'
        const query = `
            query ListMeetingAssistEventsForAttendeeGivenDates($attendeeId: String!, $startDate: timestamp!, $endDate: timestamp!) {
                Meeting_Assist_Event(where: {attendeeId: {_eq: $attendeeId}, endDate: {_gte: $startDate}, startDate: {_lte: $endDate}}) {
                    allDay
                    attachments
                    attendeeId
                    attendeesOmitted
                    backgroundColor
                    calendarId
                    colorId
                    createdDate
                    creator
                    endDate
                    endTimeUnspecified
                    eventId
                    eventType
                    extendedProperties
                    externalUser
                    foregroundColor
                    guestsCanModify
                    hangoutLink
                    htmlLink
                    iCalUID
                    id
                    links
                    location
                    locked
                    meetingId
                    notes
                    organizer
                    privateCopy
                    recurrence
                    recurrenceRule
                    recurringEventId
                    source
                    startDate
                    summary
                    timezone
                    transparency
                    updatedAt
                    useDefaultAlarms
                    visibility
                }
            }
        `


        const startDateInHostTimezone = dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true)
        const endDateInHostTimezone = dayjs((hostEndDate.slice(0, 19))).tz(hostTimezone, true)
        const startDateInUserTimezone = dayjs(startDateInHostTimezone).tz(userTimezone).format().slice(0, 19)
        const endDateInUserTimezone = dayjs(endDateInHostTimezone).tz(userTimezone).format().slice(0, 19)

        const res: { data: { Meeting_Assist_Event: MeetingAssistEventType[] } } = await got.post(
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
                        attendeeId,
                        startDate: startDateInUserTimezone,
                        endDate: endDateInUserTimezone,
                    },
                },
            },
        ).json()

        
        return res?.data?.Meeting_Assist_Event

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
          Event(where: {userId: {_eq: $userId}, endDate: {_gte: $startDate, _lt: $endDate}, deleted: {_eq: false}}) {
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

export const processMeetingAssistForOptaplanner = async () => {
    try {

    } catch (e) {
        
    }
}

export const generateNewMeetingEventForAttendee = (
    attendee: MeetingAssistAttendeeType,
    meetingAssist: MeetingAssistType,
    windowStartDate: string,
    hostTimezone: string,
    preferredStartTimeRange?: MeetingAssistPreferredTimeRangeType,
): EventType => {
    let startDate = dayjs(windowStartDate.slice(0, 19)).tz(hostTimezone, true).format()
    if (preferredStartTimeRange?.dayOfWeek > 0) {
        startDate = dayjs(startDate).tz(hostTimezone).isoWeek(preferredStartTimeRange?.dayOfWeek).format()
    }

    if (preferredStartTimeRange?.startTime) {
        const startTime = preferredStartTimeRange?.startTime
        const hour = parseInt(startTime.slice(0, 2), 10)
        const minute = parseInt(startTime.slice(3), 10)

        startDate = dayjs(startDate).tz(hostTimezone).hour(hour).minute(minute).format()
    }


    const eventId = uuid()

    const newEvent: EventType = {
        id:`${eventId}#${meetingAssist.calendarId}`,
        method: 'create',
        title: meetingAssist.summary,
        startDate,
        endDate: dayjs(startDate).tz(hostTimezone).add(meetingAssist.duration, 'm').format(),
        allDay: false,
        notes: meetingAssist.notes,
        timezone: hostTimezone,
        createdDate: dayjs().format(),
        deleted: false,
        priority: meetingAssist.priority,
        isFollowUp: false,
        isPreEvent: false,
        isPostEvent: false,
        modifiable: true,
        sendUpdates: meetingAssist?.sendUpdates,
        status: 'confirmed',
        summary: meetingAssist.summary,
        transparency: meetingAssist?.transparency,
        visibility: meetingAssist?.visibility,
        updatedAt: dayjs().format(),
        calendarId: meetingAssist.calendarId,
        useDefaultAlarms: meetingAssist.useDefaultAlarms,
        timeBlocking: meetingAssist.bufferTime,
        userModifiedTimeBlocking: meetingAssist?.bufferTime ? true : false,
        userModifiedTimePreference: preferredStartTimeRange?.id ? true : false,
        userModifiedReminders: meetingAssist?.reminders?.[0] > -1 ? true : false,
        userModifiedPriorityLevel: true,
        userModifiedModifiable: true,
        duration: meetingAssist?.duration,
        userModifiedDuration: true,
        userId: attendee?.userId,
        anyoneCanAddSelf: false,
        guestsCanInviteOthers: meetingAssist?.guestsCanInviteOthers,
        guestsCanSeeOtherGuests: meetingAssist?.guestsCanSeeOtherGuests,
        originalStartDate: startDate,
        originalAllDay: false,
        meetingId: meetingAssist.id,
        eventId,
    }

    return newEvent
}


export const generateNewMeetingEventForHost = (
    hostAttendee: MeetingAssistAttendeeType,
    meetingAssist: MeetingAssistType,
    windowStartDate: string,
    hostTimezone: string,
    preferredStartTimeRange?: MeetingAssistPreferredTimeRangeType,
): EventType => {
    let startDate = dayjs(windowStartDate.slice(0, 19)).tz(hostTimezone, true).format()
    if (preferredStartTimeRange?.dayOfWeek > 0) {
        startDate = dayjs(startDate).tz(hostTimezone).isoWeek(preferredStartTimeRange?.dayOfWeek).format()
    }

    if (preferredStartTimeRange?.startTime) {
        const startTime = preferredStartTimeRange?.startTime
        const hour = parseInt(startTime.slice(0, 2), 10)
        const minute = parseInt(startTime.slice(3), 10)

        startDate = dayjs(startDate).tz(hostTimezone).hour(hour).minute(minute).format()
    }


    const eventId = uuid()

    const newEvent: EventType = {
        id: `${eventId}#${meetingAssist?.calendarId}`,
        method: 'create',
        title: meetingAssist.summary,
        startDate,
        endDate: dayjs(startDate).tz(hostTimezone).add(meetingAssist.duration, 'm').format(),
        allDay: false,
        notes: meetingAssist.notes,
        timezone: hostTimezone,
        createdDate: dayjs().format(),
        deleted: false,
        priority: meetingAssist.priority,
        isFollowUp: false,
        isPreEvent: false,
        isPostEvent: false,
        modifiable: true,
        sendUpdates: meetingAssist?.sendUpdates,
        status: 'confirmed',
        summary: meetingAssist.summary,
        transparency: meetingAssist?.transparency,
        visibility: meetingAssist?.visibility,
        updatedAt: dayjs().format(),
        calendarId: meetingAssist.calendarId,
        useDefaultAlarms: meetingAssist.useDefaultAlarms,
        timeBlocking: meetingAssist.bufferTime,
        userModifiedTimeBlocking: meetingAssist?.bufferTime ? true : false,
        userModifiedTimePreference: preferredStartTimeRange?.id ? true : false,
        userModifiedReminders: meetingAssist?.reminders?.[0] > -1 ? true : false,
        userModifiedPriorityLevel: true,
        userModifiedModifiable: true,
        duration: meetingAssist?.duration,
        userModifiedDuration: true,
        userId: hostAttendee?.userId,
        anyoneCanAddSelf: false,
        guestsCanInviteOthers: meetingAssist?.guestsCanInviteOthers,
        guestsCanSeeOtherGuests: meetingAssist?.guestsCanSeeOtherGuests,
        originalStartDate: startDate,
        originalAllDay: false,
        meetingId: meetingAssist.id,
        eventId,
    }

    return newEvent
}

export const listPreferredTimeRangesForEvent = async (
    eventId: string,
) => {
    try {
        // validate
        if (!eventId) {
            
        }
        const operationName = 'ListPreferredTimeRangesGivenEventId'
        const query = `
      query ListPreferredTimeRangesGivenEventId($eventId: String!) {
        PreferredTimeRange(where: {eventId: {_eq: $eventId}}) {
          createdDate
          dayOfWeek
          endTime
          eventId
          id
          startTime
          updatedAt
          userId
        }
      }
    `
        const variables = {
            eventId
        }

        const res: { data: { PreferredTimeRange: PreferredTimeRangeType[] } } = await got.post(hasuraGraphUrl, {
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

        
       

        return res?.data?.PreferredTimeRange

    } catch (e) {
        
    }
}

export const createRemindersFromMinutesAndEvent = (
    eventId: string,
    minutes: number[],
    timezone: string,
    useDefault: boolean,
    userId: string,
): RemindersForEventType => {
    return {
        eventId,
        reminders: minutes.map(m => ({
            id: uuid(),
            userId,
            eventId,
            timezone,
            minutes: m,
            useDefault,
            updatedAt: dayjs().format(),
            createdDate: dayjs().format(),
            deleted: true,
        }))
    }
}

export const createBufferTimeForNewMeetingEvent = (
    event: EventMeetingPlusType,
    bufferTime: BufferTimeNumberType,
) => {
    let valuesToReturn: any = {}
    valuesToReturn.newEvent = event
    const eventId = uuid()
    const eventId1 = uuid()
    const preEventId = event?.preEventId || `${eventId}#${event?.calendarId}`
    const postEventId = event?.postEventId || `${eventId1}#${event?.calendarId}`


    if (bufferTime.beforeEvent > 0) {
        const beforeEventOrEmpty: EventPlusType = {
            id: preEventId,
            isPreEvent: true,
            forEventId: event.id,
            notes: 'Buffer time',
            summary: 'Buffer time',
            startDate: dayjs(event.startDate.slice(0, 19)).tz(event.timezone, true).subtract(bufferTime.beforeEvent, 'm').format(),
            endDate: dayjs(event.startDate.slice(0, 19)).tz(event.timezone, true).format(),
            method: 'create',
            userId: event.userId,
            createdDate: dayjs().format(),
            deleted: false,
            priority: 1,
            modifiable: true,
            anyoneCanAddSelf: false,
            guestsCanInviteOthers: false,
            guestsCanSeeOtherGuests: false,
            originalStartDate: dayjs(event.startDate.slice(0, 19)).tz(event.timezone, true).subtract(bufferTime.beforeEvent, 'm').format(),
            originalAllDay: false,
            updatedAt: dayjs().toISOString(),
            calendarId: event?.calendarId,
            timezone: event?.timezone,
            isFollowUp: false,
            isPostEvent: false,
            eventId: preEventId.split('#')[0]
        }

        valuesToReturn.beforeEvent = beforeEventOrEmpty
        valuesToReturn.newEvent = {
            ...valuesToReturn.newEvent,
            preEventId,
            timeBlocking: {
                ...valuesToReturn?.newEvent?.timeBlocking,
                beforeEvent: bufferTime.beforeEvent,
            }
        }
    }

    if (bufferTime.afterEvent > 0) {
        const afterEventOrEmpty: EventPlusType = {
            id: postEventId,
            isPreEvent: false,
            forEventId: event.id,
            isPostEvent: true,
            notes: 'Buffer time',
            summary: 'Buffer time',
            startDate: dayjs(event.endDate.slice(0, 19)).tz(event.timezone, true).format(),
            endDate: dayjs(event.endDate.slice(0, 19)).tz(event.timezone, true).add(bufferTime.afterEvent, 'm').format(),
            method: 'create',
            userId: event?.userId,
            createdDate: dayjs().toISOString(),
            deleted: false,
            priority: 1,
            isFollowUp: false,
            modifiable: true,
            anyoneCanAddSelf: false,
            guestsCanInviteOthers: false,
            guestsCanSeeOtherGuests: false,
            originalStartDate: dayjs(event.endDate.slice(0, 19)).tz(event.timezone, true).format(),
            originalAllDay: false,
            updatedAt: dayjs().toISOString(),
            calendarId: event?.calendarId,
            timezone: event?.timezone,
            eventId: postEventId.split('#')[0]
        }

        valuesToReturn.afterEvent = afterEventOrEmpty
        valuesToReturn.newEvent = {
            ...valuesToReturn.newEvent,
            postEventId,
            timeBlocking: {
                ...valuesToReturn?.newEvent?.timeBlocking,
                afterEvent: bufferTime.afterEvent,
            }
        }
    }



    return valuesToReturn as ValuesToReturnForBufferEventsType
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

export const getGlobalCalendar = async (
    userId: string,
) => {
    try {
        const operationName = 'getGlobalCalendar'
        const query = `
        query getGlobalCalendar($userId: uuid!) {
          Calendar(where: {globalPrimary: {_eq: true}, userId: {_eq: $userId}}) {
            colorId
            backgroundColor
            accessLevel
            account
            createdDate
            defaultReminders
            foregroundColor
            globalPrimary
            id
            modifiable
            primary
            resource
            title
            updatedAt
            userId
          }
        }
    `

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
                    variables: {
                        userId,
                    },
                },
            },
        ).json()

        return res.data.Calendar?.[0]
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
export const convertToTotalWorkingHoursForInternalAttendee = (
    userPreference: UserPreferenceType,
    hostStartDate: string,
    hostTimezone: string,
) => {
    const startTimes = userPreference.startTimes
    const endTimes = userPreference.endTimes
    const dayOfWeekInt = getISODay(dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).toDate())
    const startHour = startTimes.find(i => (i.day === dayOfWeekInt)).hour
    const startMinute = startTimes.find(i => (i.day === dayOfWeekInt)).minutes
    const endHour = endTimes.find(i => (i.day === dayOfWeekInt)).hour
    const endMinute = endTimes.find(i => (i.day === dayOfWeekInt)).minutes

    const startDuration = dayjs.duration({ hours: startHour, minutes: startMinute })
    const endDuration = dayjs.duration({ hours: endHour, minutes: endMinute })
    const totalDuration = endDuration.subtract(startDuration)
    return totalDuration.asHours()
}

export const convertToTotalWorkingHoursForExternalAttendee = (
    attendeeEvents: EventPlusType[],
    hostStartDate: string,
    hostTimezone: string,
    userTimezone: string,
) => {

    const dayOfWeekIntByHost = getISODay(dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).toDate())
    const sameDayEvents = attendeeEvents.filter(e => (getISODay(dayjs(e.startDate.slice(0, 19)).tz(e.timezone || userTimezone, true).tz(hostTimezone).toDate()) === (dayOfWeekIntByHost)))
    const minStartDate = _.minBy(sameDayEvents, (e) => dayjs(e.startDate.slice(0, 19)).tz(e.timezone || userTimezone, true).tz(hostTimezone).unix())
    const maxEndDate = _.maxBy(sameDayEvents, (e) => dayjs(e.endDate.slice(0, 19)).tz(e.timezone || userTimezone, true).tz(hostTimezone).unix())

    let workEndHourByHost = dayjs(maxEndDate.endDate.slice(0, 19)).tz(maxEndDate?.timezone || userTimezone, true).tz(hostTimezone).hour()
    const workEndMinuteByHost = dayjs(maxEndDate.endDate.slice(0, 19)).tz(maxEndDate?.timezone || userTimezone, true).tz(hostTimezone)
        .isBetween(dayjs(maxEndDate.endDate.slice(0, 19)).tz(maxEndDate?.timezone || userTimezone, true).tz(hostTimezone).minute(0), dayjs(maxEndDate.endDate.slice(0, 19)).tz(maxEndDate?.timezone || userTimezone, true).tz(hostTimezone).minute(15), 'minute', '[)')
        ? 15
        : dayjs(maxEndDate.endDate.slice(0, 19)).tz(maxEndDate?.timezone || userTimezone, true).tz(hostTimezone).isBetween(dayjs(maxEndDate.endDate.slice(0, 19)).tz(maxEndDate?.timezone || userTimezone, true).tz(hostTimezone).minute(15), dayjs(maxEndDate.endDate.slice(0, 19)).tz(maxEndDate?.timezone || userTimezone, true).tz(hostTimezone).minute(30), 'minute', '[)')
            ? 30
            : dayjs(maxEndDate.endDate.slice(0, 19)).tz(maxEndDate?.timezone || userTimezone, true).tz(hostTimezone).isBetween(dayjs(maxEndDate.endDate.slice(0, 19)).tz(maxEndDate?.timezone || userTimezone, true).tz(hostTimezone).minute(30), dayjs(maxEndDate.endDate.slice(0, 19)).tz(maxEndDate?.timezone || userTimezone, true).tz(hostTimezone).minute(45), 'minute', '[)')
                ? 45
                : 0
    if (workEndMinuteByHost === 0) {
        if (workEndHourByHost < 23) {
            workEndHourByHost += 1
        }
    }

    const workStartHourByHost = dayjs(minStartDate.startDate.slice(0, 19)).tz(minStartDate?.timezone || userTimezone, true).tz(hostTimezone).hour()
    const workStartMinuteByHost = dayjs(minStartDate.startDate.slice(0, 19)).tz(minStartDate?.timezone || userTimezone, true).tz(hostTimezone)
        .isBetween(dayjs(minStartDate.startDate.slice(0, 19)).tz(minStartDate?.timezone || userTimezone, true).tz(hostTimezone).minute(0), dayjs(minStartDate.startDate.slice(0, 19)).tz(minStartDate?.timezone || userTimezone, true).tz(hostTimezone).minute(15), 'minute', '[)')
        ? 0
        : dayjs(minStartDate.startDate.slice(0, 19)).tz(minStartDate?.timezone || userTimezone, true).tz(hostTimezone).isBetween(dayjs(minStartDate.startDate.slice(0, 19)).tz(minStartDate?.timezone || userTimezone, true).tz(hostTimezone).minute(15), dayjs(minStartDate.startDate.slice(0, 19)).tz(minStartDate?.timezone || userTimezone, true).tz(hostTimezone).minute(30), 'minute', '[)')
            ? 15
            : dayjs(minStartDate.startDate.slice(0, 19)).tz(minStartDate?.timezone || userTimezone, true).tz(hostTimezone).isBetween(dayjs(minStartDate.startDate.slice(0, 19)).tz(minStartDate?.timezone || userTimezone, true).tz(hostTimezone).minute(30), dayjs(minStartDate.startDate.slice(0, 19)).tz(minStartDate?.timezone || userTimezone, true).tz(hostTimezone).minute(45), 'minute', '[)')
                ? 30
                : 45

    
    const startDuration = dayjs.duration({ hours: workStartHourByHost, minutes: workStartMinuteByHost })
    const endDuration = dayjs.duration({ hours: workEndHourByHost, minutes: workEndMinuteByHost })
    const totalDuration = endDuration.subtract(startDuration)
    return totalDuration.asHours()
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
    
    
    const breakLength = userPreferences.breakLength <= 15 ? 15 : userPreferences.breakLength

    for (let i = 0; i < numberOfBreaksToGenerate; i++) {
        const eventId = uuid()
        const breakEvent: EventPlusType = {
            id: `${eventId}#${globalCalendarId || eventMirror.calendarId}`,
            userId: userPreferences.userId,
            title: 'Break',
            startDate: dayjs(eventMirror.startDate.slice(0, 19)).tz(eventMirror.timezone, true).format(),
            endDate: dayjs(eventMirror.startDate.slice(0, 19)).tz(eventMirror.timezone, true).add(breakLength, 'minute').format(),
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
            duration: breakLength,
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

    const breakLength = userPreferences.breakLength <= 15 ? 15 : userPreferences.breakLength

    const breakHoursAvailable = (breakLength / 60) * numberOfBreaksPerDay
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

export const generateBreakEventsForDay = async (
    userPreferences: UserPreferenceType,
    userId: string,
    hostStartDate: string,
    hostTimezone: string,
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

        if (!hostStartDate) {
            
            return null
        }

        if (!hostTimezone) {
            
            return null
        }

        if (isFirstDay) {
            const endTimes = userPreferences.endTimes
            const dayOfWeekInt = getISODay(dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).toDate())

            let startHourByHost = dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).hour()
            let startMinuteByHost = dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).minute()
            const endHour = endTimes.find(i => (i.day === dayOfWeekInt)).hour
            const endMinute = endTimes.find(i => (i.day === dayOfWeekInt)).minutes

            // validate values before calculating
            const startTimes = userPreferences.startTimes
            const workStartHour = startTimes.find(i => (i.day === dayOfWeekInt)).hour
            const workStartMinute = startTimes.find(i => (i.day === dayOfWeekInt)).minutes

            if (dayjs(hostStartDate.slice(0, 19)).isAfter(dayjs(hostStartDate.slice(0, 19)).hour(endHour).minute(endMinute))) {
                // return empty as outside of work time
                return null
            }

            // change to work start time as work start time after start date
            if (dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).isBefore(dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).hour(workStartHour).minute(workStartMinute))) {
                startHourByHost = workStartHour
                startMinuteByHost = workStartMinute
            }

            const workingHours = convertToTotalWorkingHoursForInternalAttendee(userPreferences, hostStartDate, hostTimezone)
            const allEvents = await listEventsForDate(userId, dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).hour(startHourByHost).minute(startMinuteByHost).format(), dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).hour(endHour).minute(endMinute).format(), hostTimezone)
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
                    const duration = dayjs.duration(dayjs(allEvent.endDate.slice(0, 19)).tz(hostTimezone, true).diff(dayjs(allEvent.startDate.slice(0, 19)).tz(hostTimezone, true))).asHours()
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
                .filter(e => (dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).isSame(dayjs(e.startDate.slice(0, 19)).tz(hostTimezone, true), 'day')))

            const breakEvents = oldBreakEvents

            const numberOfBreaksPerDay = userPreferences.minNumberOfBreaks
            
            const breakHoursToGenerate = (userPreferences.breakLength / 60) * numberOfBreaksPerDay
            let breakHoursUsed = 0

            if (breakEvents?.length > 0) {
                for (const breakEvent of breakEvents) {
                    const duration = dayjs.duration(dayjs(breakEvent.endDate.slice(0, 19)).tz(hostTimezone, true).diff(dayjs(breakEvent.startDate.slice(0, 19)).tz(hostTimezone, true))).asHours()
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
        const dayOfWeekInt = getISODay(dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).toDate())

        const endHour = endTimes.find(i => (i.day === dayOfWeekInt)).hour
        const endMinute = endTimes.find(i => (i.day === dayOfWeekInt)).minutes

        // validate values before calculating
        const startTimes = userPreferences.startTimes
        const startHour = startTimes.find(i => (i.day === dayOfWeekInt)).hour
        const startMinute = startTimes.find(i => (i.day === dayOfWeekInt)).minutes

        const workingHours = convertToTotalWorkingHoursForInternalAttendee(userPreferences, hostStartDate, hostTimezone)
        const allEvents = await listEventsForDate(userId, dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).hour(startHour).minute(startMinute).format(), dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).hour(endHour).minute(endMinute).format(), hostTimezone)
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
                const duration = dayjs.duration(dayjs(allEvent.endDate.slice(0, 19)).tz(hostTimezone, true).diff(dayjs(allEvent.startDate.slice(0, 19)).tz(hostTimezone, true))).asHours()
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
            .filter(e => (dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).isSame(dayjs(e.startDate.slice(0, 19)).tz(hostTimezone, true), 'day')))

        const breakEvents = oldBreakEvents

        const numberOfBreaksPerDay = userPreferences.minNumberOfBreaks
        
        const breakHoursToGenerate = (userPreferences.breakLength / 60) * numberOfBreaksPerDay
        let breakHoursUsed = 0

        if (breakEvents?.length > 0) {
            for (const breakEvent of breakEvents) {
                const duration = dayjs.duration(dayjs(breakEvent.endDate.slice(0, 19)).tz(hostTimezone, true).diff(dayjs(breakEvent.startDate.slice(0, 19)).tz(hostTimezone, true))).asHours()
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

export const generateBreakEventsForDate = async (
    userPreferences: UserPreferenceType,
    userId: string,
    hostStartDate: string,
    hostEndDate: string,
    hostTimezone: string,
    globalCalendarId?: string,
): Promise<EventPlusType[] | []> => {
    try {
        const totalBreakEvents = []
        const totalDays = dayjs(hostEndDate.slice(0, 19)).tz(hostTimezone, true).diff(dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true), 'day')
        
        for (let i = 0; i < totalDays; i++) {
            const dayDate = dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true)
                .add(i, 'day').format()

            const newBreakEvents = await generateBreakEventsForDay(userPreferences, userId, dayDate, hostTimezone, globalCalendarId, i === 0)

            if (i === 0) {
                const endTimes = userPreferences.endTimes
                const dayOfWeekInt = getISODay(dayjs(dayDate.slice(0, 19)).tz(hostTimezone, true).toDate())

                let startHour = dayjs(dayDate.slice(0, 19)).tz(hostTimezone, true).hour()
                let startMinute = dayjs(dayDate.slice(0, 19)).tz(hostTimezone, true).minute()
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

                const allEvents = await listEventsForDate(userId, dayjs(dayDate.slice(0, 19)).tz(hostTimezone, true).hour(startHour).minute(startMinute).format(), dayjs(dayDate.slice(0, 19)).tz(hostTimezone, true).hour(endHour).minute(endMinute).format(), hostTimezone)
                const newBreakEventsAdjusted = await adjustStartDatesForBreakEventsForDay(allEvents,
                    newBreakEvents, userPreferences, hostTimezone)
                if (newBreakEventsAdjusted?.length > 0) {
                   
                    totalBreakEvents.push(...newBreakEventsAdjusted)
                }

                continue
            }

            const endTimes = userPreferences.endTimes
            const dayOfWeekInt = getISODay(dayjs(dayDate.slice(0, 19)).tz(hostTimezone, true).toDate())

            const endHour = endTimes.find(i => (i.day === dayOfWeekInt)).hour
            const endMinute = endTimes.find(i => (i.day === dayOfWeekInt)).minutes

            // validate values before calculating
            const startTimes = userPreferences.startTimes
            const startHour = startTimes.find(i => (i.day === dayOfWeekInt)).hour
            const startMinute = startTimes.find(i => (i.day === dayOfWeekInt)).minutes

            const allEvents = await listEventsForDate(userId, dayjs(dayDate.slice(0, 19)).tz(hostTimezone, true).hour(startHour).minute(startMinute).format(), dayjs(dayDate.slice(0, 19)).tz(hostTimezone, true).hour(endHour).minute(endMinute).format(), hostTimezone)
            const newBreakEventsAdjusted = await adjustStartDatesForBreakEventsForDay(allEvents,
                newBreakEvents, userPreferences, hostTimezone)
            if (newBreakEventsAdjusted?.length > 0) {
                
                totalBreakEvents.push(...newBreakEventsAdjusted)
            }
        }

        return totalBreakEvents
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

export const getSubscription = async (
    subscriptionId: string,
): Promise<SubscriptionType> => {
    try {
        const operationName = 'GetSubscriptionById'
        const query = `
    query GetSubscriptionById($id:String!) {
      Subscription_by_pk(id: $id) {
        createdDate
        currency
        deleted
        description
        device
        id
        introductoryPrice
        introductoryPriceAsAmount
        introductoryPriceNumberOfPeriods
        introductoryPricePaymentMode
        introductoryPriceSubscriptionPeriod
        localizedPrice
        paymentMode
        price
        subscriptionPeriodNumber
        subscriptionPeriodUnit
        title
        updatedAt
      }
    }
    `
        const variables = {
            id: subscriptionId,
        }

        const res: { data: { Subscription_by_pk: SubscriptionType } } = await got.post(
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

        return res.data.Subscription_by_pk
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

export const generateWorkTimesForInternalAttendee = (
    hostId: string,
    userId: string,
    userPreference: UserPreferenceType,
    hostTimezone: string,
    userTimezone: string,
): WorkTimeType[] => {
    // 7 days in a week
    const daysInWeek = 7
    const startTimes = userPreference.startTimes
    const endTimes = userPreference.endTimes
    const workTimes: WorkTimeType[] = []

    for (let i = 0; i < daysInWeek; i++) {

        const dayOfWeekInt = i + 1
        const startHour = startTimes.find(i => (i.day === dayOfWeekInt)).hour
        const startMinute = startTimes.find(i => (i.day === dayOfWeekInt)).minutes
        const endHour = endTimes.find(i => (i.day === dayOfWeekInt)).hour
        const endMinute = endTimes.find(i => (i.day === dayOfWeekInt)).minutes

        workTimes.push({
            dayOfWeek: dayOfWeekIntToString[dayOfWeekInt],
            startTime: dayjs(setISODay(dayjs().hour(startHour).minute(startMinute).tz(userTimezone, true).toDate(), i + 1)).tz(hostTimezone).format('HH:mm') as Time,
            endTime: dayjs(setISODay(dayjs().hour(endHour).minute(endMinute).tz(userTimezone, true).toDate(), i + 1)).tz(hostTimezone).format('HH:mm') as Time,
            hostId,
            userId,
        })
    }

    return workTimes
}

const formatToMonthDay = (month: MonthType, day: DayType): MonthDayType => {
    const monthFormat = (month < 9 ? `0${month + 1}` : `${month + 1}`) as MM
    const dayFormat = (day < 10 ? `0${day}` : `${day}`) as DD
    return `--${monthFormat}-${dayFormat}`
}

export const generateTimeSlotsForInternalAttendee = (
    hostStartDate: string,
    hostId: string,
    userPreference: UserPreferenceType,
    hostTimezone: string,
    userTimezone: string,
    isFirstDay?: boolean,
): TimeSlotType[] => {
    if (isFirstDay) {
        // firstday can be started outside of work time
        // prioritize work start time over when it is pressed
        // if firstDay start is after end time return []
        const endTimes = userPreference.endTimes
        const dayOfWeekInt = getISODay(dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).tz(userTimezone).toDate())
        const dayOfWeekIntByHost = getISODay(dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).toDate())
        // month is zero-indexed
        // const month = dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).tz(userTimezone).month()
        const dayOfMonth = dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).tz(userTimezone).date()
        const startHour = dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).tz(userTimezone).hour()
        const startMinute = dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).tz(userTimezone)
            .isBetween(dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).tz(userTimezone).minute(0), dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).tz(userTimezone).minute(15), 'minute', '[)')
            ? 0
            : dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).tz(userTimezone).isBetween(dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).tz(userTimezone).minute(15), dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).tz(userTimezone).minute(30), 'minute', '[)')
                ? 15
                : dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).tz(userTimezone).isBetween(dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).tz(userTimezone).minute(30), dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).tz(userTimezone).minute(45), 'minute', '[)')
                    ? 30
                    : 45


        // convert to host timezone so everything is linked to host timezone
        const monthByHost = dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).month()
        const dayOfMonthByHost = dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).date()
        const startHourByHost = dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).hour()
        const startMinuteByHost = dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true)
            .isBetween(dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).minute(0), dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).minute(15), 'minute', '[)')
            ? 0
            : dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).isBetween(dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).minute(15), dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).minute(30), 'minute', '[)')
                ? 15
                : dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).isBetween(dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).minute(30), dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).minute(45), 'minute', '[)')
                    ? 30
                    : 45

        const endHour = endTimes.find(i => (i.day === dayOfWeekInt)).hour
        const endMinute = endTimes.find(i => (i.day === dayOfWeekInt)).minutes
        const endHourByHost = dayjs(setISODay(dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).tz(userTimezone).hour(endHour).toDate(), dayOfWeekInt)).tz(hostTimezone).hour()
        const endMinuteByHost = dayjs(setISODay(dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).tz(userTimezone).minute(endMinute).toDate(), dayOfWeekInt)).tz(hostTimezone).minute()
        // validate values before calculating
        const startTimes = userPreference.startTimes
        const workStartHour = startTimes.find(i => (i.day === dayOfWeekInt)).hour
        const workStartMinute = startTimes.find(i => (i.day === dayOfWeekInt)).minutes
        const workStartHourByHost = dayjs(setISODay(dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).tz(userTimezone).hour(workStartHour).toDate(), dayOfWeekInt)).tz(hostTimezone).hour()
        const workStartMinuteByHost = dayjs(setISODay(dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).tz(userTimezone).minute(endMinute).toDate(), dayOfWeekInt)).tz(hostTimezone).minute()

        if (dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).isAfter(dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).hour(endHourByHost).minute(endMinuteByHost))) {
            // return empty as outside of work time
            return []
        }

        // change to work start time as after host start time
        if (dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).isBefore(dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).hour(workStartHourByHost).minute(workStartMinuteByHost))) {
            const startDuration = dayjs.duration({ hours: workStartHour, minutes: workStartMinute })
            const endDuration = dayjs.duration({ hours: endHour, minutes: endMinute })
            const totalDuration = endDuration.subtract(startDuration)
            const totalMinutes = totalDuration.asMinutes()
            const timeSlots: TimeSlotType[] = []
            
            for (let i = 0; i < totalMinutes; i += 15) {
                timeSlots.push({
                    dayOfWeek: dayOfWeekIntToString[dayOfWeekIntByHost],
                    startTime: dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).hour(startHourByHost).minute(startMinuteByHost).add(i, 'minute').format('HH:mm') as Time,
                    endTime: dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).hour(startHourByHost).minute(startMinuteByHost).add(i + 15, 'minute').format('HH:mm') as Time,
                    hostId,
                    monthDay: formatToMonthDay(monthByHost as MonthType, dayOfMonthByHost as DayType)
                })
            }
            
            return timeSlots
        }

        const startDuration = dayjs.duration({ hours: startHour, minutes: startMinute })
        const endDuration = dayjs.duration({ hours: endHour, minutes: endMinute })
        const totalDuration = endDuration.subtract(startDuration)
        const totalMinutes = totalDuration.asMinutes()
        const timeSlots: TimeSlotType[] = []
        
        for (let i = 0; i < totalMinutes; i += 15) {
            timeSlots.push({
                dayOfWeek: dayOfWeekIntToString[dayOfWeekInt],
                startTime: dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).hour(startHourByHost).minute(startMinuteByHost).add(i, 'minute').format('HH:mm') as Time,
                endTime: dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).hour(startHourByHost).minute(startMinuteByHost).add(i + 15, 'minute').format('HH:mm') as Time,
                hostId,
                monthDay: formatToMonthDay(monthByHost as MonthType, dayOfMonthByHost as DayType)
            })
        }
        
        return timeSlots
    }

    // not first day start from work start time schedule

    const startTimes = userPreference.startTimes
    const endTimes = userPreference.endTimes
    // const month = dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).tz(userTimezone).month()
    // const dayOfMonth = dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).tz(userTimezone).date()
    const dayOfWeekInt = getISODay(dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).tz(userTimezone).toDate())
    const startHour = startTimes.find(i => (i.day === dayOfWeekInt)).hour
    const startMinute = startTimes.find(i => (i.day === dayOfWeekInt)).minutes
    const endHour = endTimes.find(i => (i.day === dayOfWeekInt)).hour
    const endMinute = endTimes.find(i => (i.day === dayOfWeekInt)).minutes

    const monthByHost = dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).month()
    const dayOfMonthByHost = dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).date()

    const startHourByHost = dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).tz(userTimezone).hour(startHour).tz(hostTimezone).hour()
    const startMinuteByHost = dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).tz(userTimezone).minute(startMinute).tz(hostTimezone).minute()
    const endHourByHost = dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).tz(userTimezone).hour(endHour).tz(hostTimezone).hour()

    
    const startDuration = dayjs.duration({ hours: startHour, minutes: startMinute })
    const endDuration = dayjs.duration({ hours: endHour, minutes: endMinute })
    const totalDuration = endDuration.subtract(startDuration)
    const totalMinutes = totalDuration.asMinutes()
    const timeSlots: TimeSlotType[] = []
    for (let i = 0; i < totalMinutes; i += 15) {
        timeSlots.push({
            dayOfWeek: dayOfWeekIntToString[dayOfWeekInt],
            startTime: dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).hour(startHourByHost).minute(startMinuteByHost).add(i, 'minute').format('HH:mm') as Time,
            endTime: dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).hour(startHourByHost).minute(startMinuteByHost).add(i + 15, 'minute').format('HH:mm') as Time,
            hostId,
            monthDay: formatToMonthDay(monthByHost as MonthType, dayOfMonthByHost as DayType)
        })
    }
    
    return timeSlots
}

export const generateTimeSlotsLiteForInternalAttendee = (
    hostStartDate: string,
    hostId: string,
    userPreference: UserPreferenceType,
    hostTimezone: string,
    userTimezone: string,
    isFirstDay?: boolean,
): TimeSlotType[] => {
    if (isFirstDay) {
        const endTimes = userPreference.endTimes

        const dayOfWeekInt = getISODay(dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).toDate())

        const startHourOfHostDateByHost = dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).hour()
        const startMinuteOfHostDateByHost = dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true)
            .isBetween(dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).minute(0), dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).minute(30), 'minute', '[)')
            ? 0
            : dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).isBetween(dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).minute(30), dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).minute(59), 'minute', '[)')
                ? 30
                : 0

        // convert to host timezone so everything is linked to host timezone
        const monthByHost = dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).month()
        const dayOfMonthByHost = dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).date()
        const startHourByHost = dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).hour()
        const startMinuteByHost = dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true)
            .isBetween(dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).minute(0), dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).minute(30), 'minute', '[)')
            ? 0
            : dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).isBetween(dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).minute(30), dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).minute(59), 'minute', '[)')
                ? 30
                : 0

        const endHour = endTimes.find(i => (i.day === dayOfWeekInt)).hour
        const endMinute = endTimes.find(i => (i.day === dayOfWeekInt)).minutes
        const endHourByHost = dayjs(setISODay(dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).tz(userTimezone).hour(endHour).toDate(), dayOfWeekInt)).tz(hostTimezone).hour()
        const endMinuteByHost = dayjs(setISODay(dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).tz(userTimezone).minute(endMinute).toDate(), dayOfWeekInt)).tz(hostTimezone).minute()

        // validate values before calculating
        const startTimes = userPreference.startTimes
        const workStartHour = startTimes.find(i => (i.day === dayOfWeekInt)).hour
        const workStartMinute = startTimes.find(i => (i.day === dayOfWeekInt)).minutes
        const workStartHourByHost = dayjs(setISODay(dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).tz(userTimezone).hour(workStartHour).toDate(), dayOfWeekInt)).tz(hostTimezone).hour()
        const workStartMinuteByHost = dayjs(setISODay(dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).tz(userTimezone).minute(endMinute).toDate(), dayOfWeekInt)).tz(hostTimezone).minute()

        if (dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).isAfter(dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).hour(endHourByHost).minute(endMinuteByHost))) {
            // return empty as outside of work time
            return []
        }

        // change to work start time as before start time
        if (dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).isBefore(dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).hour(workStartHourByHost).minute(workStartMinuteByHost))) {
            const startDuration = dayjs.duration({ hours: workStartHour, minutes: workStartMinute })
            const endDuration = dayjs.duration({ hours: endHour, minutes: endMinute })
            const totalDuration = endDuration.subtract(startDuration)
            const totalMinutes = totalDuration.asMinutes()
            const timeSlots: TimeSlotType[] = []
            for (let i = 0; i < totalMinutes; i += 30) {
                timeSlots.push({
                    dayOfWeek: dayOfWeekIntToString[dayOfWeekInt],
                    startTime: dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).hour(startHourByHost).minute(startMinuteByHost).add(i, 'minute').format('HH:mm') as Time,
                    endTime: dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).hour(startHourByHost).minute(startMinuteByHost).add(i + 30, 'minute').format('HH:mm') as Time,
                    hostId,
                    monthDay: formatToMonthDay(monthByHost as MonthType, dayOfMonthByHost as DayType),
                })
            }
            
            return timeSlots
        }

        const startDuration = dayjs.duration({ hours: startHourOfHostDateByHost, minutes: startMinuteOfHostDateByHost })
        const endDuration = dayjs.duration({ hours: endHour, minutes: endMinute })
        const totalDuration = endDuration.subtract(startDuration)
        const totalMinutes = totalDuration.asMinutes()
        const timeSlots: TimeSlotType[] = []
        for (let i = 0; i < totalMinutes; i += 30) {
            timeSlots.push({
                dayOfWeek: dayOfWeekIntToString[dayOfWeekInt],
                startTime: dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).hour(startHourByHost).minute(startMinuteByHost).add(i, 'minute').format('HH:mm') as Time,
                endTime: dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).hour(startHourByHost).minute(startMinuteByHost).add(i + 30, 'minute').format('HH:mm') as Time,
                hostId,
                monthDay: formatToMonthDay(monthByHost as MonthType, dayOfMonthByHost as DayType),
            })
        }
        
        return timeSlots
    }
    const startTimes = userPreference.startTimes
    const endTimes = userPreference.endTimes
    
    const dayOfWeekInt = getISODay(dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).tz(userTimezone).toDate())
    const startHour = startTimes.find(i => (i.day === dayOfWeekInt)).hour
    const startMinute = startTimes.find(i => (i.day === dayOfWeekInt)).minutes
    const endHour = endTimes.find(i => (i.day === dayOfWeekInt)).hour
    const endMinute = endTimes.find(i => (i.day === dayOfWeekInt)).minutes

    const monthByHost = dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).month()
    const dayOfMonthByHost = dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).date()
    const dayOfWeekIntByHost = getISODay(dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).toDate())
    const startHourByHost = dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).tz(userTimezone).hour(startHour).tz(hostTimezone).hour()
    const startMinuteByHost = dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).tz(userTimezone).minute(startMinute).tz(hostTimezone).minute()
    // const endHourByHost = dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).tz(userTimezone).hour(endHour).tz(hostTimezone).hour()

    const startDuration = dayjs.duration({ hours: startHour, minutes: startMinute })
    const endDuration = dayjs.duration({ hours: endHour, minutes: endMinute })
    const totalDuration = endDuration.subtract(startDuration)
    const totalMinutes = totalDuration.asMinutes()
    const timeSlots: TimeSlotType[] = []
    for (let i = 0; i < totalMinutes; i += 30) {
        timeSlots.push({
            dayOfWeek: dayOfWeekIntToString[dayOfWeekIntByHost],
            startTime: dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).hour(startHourByHost).minute(startMinuteByHost).add(i, 'minute').format('HH:mm') as Time,
            endTime: dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).hour(startHourByHost).minute(startMinuteByHost).add(i + 30, 'minute').format('HH:mm') as Time,
            hostId,
            monthDay: formatToMonthDay(monthByHost as MonthType, dayOfMonthByHost as DayType),
        })
    }
    
    return timeSlots
}

export const validateEventDates = (event: EventPlusType, userPreferences: UserPreferenceType): boolean => {

    // if no timezone remove
    if (!event?.timezone) {
        return false
    }

    const diff = dayjs(event.endDate.slice(0, 19)).tz(event.timezone, true).diff(dayjs(event.startDate.slice(0, 19)).tz(event.timezone, true), 'm')
    const diffDay = dayjs(event.endDate.slice(0, 19)).tz(event.timezone, true).diff(dayjs(event.startDate.slice(0, 19)).tz(event.timezone, true), 'd')
    const diffHours = dayjs(event.endDate.slice(0, 19)).tz(event.timezone, true).diff(dayjs(event.startDate.slice(0, 19)).tz(event.timezone, true), 'h')

    const isoWeekDay = getISODay(dayjs(event?.startDate.slice(0, 19)).tz(event?.timezone, true).toDate())
    const endHour = userPreferences.endTimes.find(e => (e?.day === isoWeekDay))?.hour
    const endMinutes = userPreferences.endTimes.find(e => (e?.day === isoWeekDay))?.minutes
    const startHour = userPreferences.startTimes.find(e => (e?.day === isoWeekDay))?.hour
    const startMinutes = userPreferences.startTimes.find(e => (e?.day === isoWeekDay))?.minutes

    if (dayjs(event.startDate.slice(0, 19)).tz(event.timezone, true).isAfter(dayjs(event?.startDate.slice(0, 19)).tz(event.timezone, true).hour(endHour).minute(endMinutes))) {
        return false
    }

    if (dayjs(event.startDate.slice(0, 19)).tz(event.timezone, true).isBefore(dayjs(event?.startDate.slice(0, 19)).tz(event.timezone, true).hour(startHour).minute(startMinutes))) {
        return false
    }

    if (diff === 0) {
        
        return false
    }

    if (diff < 0) {
        
        return false
    }

    if (diffDay >= 1) {
        
        return false
    }

    // if difference in hours > 23 likely all day event
    if (diffHours > 23) {
        
        return false
    }

    return true

}

export const validateEventDatesForExternalAttendee = (event: EventPlusType): boolean => {

    // if no timezone remove
    if (!event?.timezone) {
        return false
    }

    const diff = dayjs(event.endDate.slice(0, 19)).tz(event.timezone, true).diff(dayjs(event.startDate.slice(0, 19)).tz(event.timezone, true), 'm')
    const diffDay = dayjs(event.endDate.slice(0, 19)).tz(event.timezone, true).diff(dayjs(event.startDate.slice(0, 19)).tz(event.timezone, true), 'd')
    const diffHours = dayjs(event.endDate.slice(0, 19)).tz(event.timezone, true).diff(dayjs(event.startDate.slice(0, 19)).tz(event.timezone, true), 'h')


    if (diff === 0) {
        
        return false
    }

    if (diff < 0) {
        
        return false
    }

    if (diffDay >= 1) {
        
        return false
    }

    // if difference in hours > 23 likely all day event
    if (diffHours > 23) {
        
        return false
    }

    return true

}

export const generateEventParts = (event: EventPlusType, hostId: string): InitialEventPartType[] => {

    
    const minutes = dayjs(event.endDate.slice(0, 19)).tz(event.timezone, true).diff(dayjs(event.startDate.slice(0, 19)).tz(event.timezone, true), 'm')
    
    const parts = Math.floor(minutes / 15)
    const remainder = minutes % 15
    const eventParts: InitialEventPartType[] = []
    for (let i = 0; i < parts; i++) {
        eventParts.push({
            ...event,
            groupId: event.id,
            eventId: event.id,
            startDate: event.startDate.slice(0, 19),
            endDate: event.endDate.slice(0, 19),
            part: i + 1,
            lastPart: remainder > 0 ? parts + 1 : parts,
            hostId,
        })
    }

    if (remainder > 0) {
        eventParts.push({
            ...event,
            groupId: event.id,
            eventId: event.id,
            startDate: event.startDate.slice(0, 19),
            endDate: event.endDate.slice(0, 19),
            part: parts + 1,
            lastPart: parts + 1,
            hostId,
        })
    }
    
    return eventParts
}

export const generateEventPartsLite = (event: EventPlusType, hostId: string): InitialEventPartType[] => {

    const minutes = dayjs(event.endDate.slice(0, 19)).tz(event.timezone, true).diff(dayjs(event.startDate.slice(0, 19)).tz(event.timezone, true), 'm')
    const parts = Math.floor(minutes / 30)
    const remainder = minutes % 30
    const eventParts: InitialEventPartType[] = []
    for (let i = 0; i < parts; i++) {
        eventParts.push({
            ...event,
            groupId: event.id,
            eventId: event.id,
            startDate: event.startDate.slice(0, 19),
            endDate: event.endDate.slice(0, 19),
            part: i + 1,
            lastPart: remainder > 0 ? parts + 1 : parts,
            hostId,
        })
    }

    if (remainder > 0) {
        eventParts.push({
            ...event,
            groupId: event.id,
            eventId: event.id,
            startDate: event.startDate.slice(0, 19),
            endDate: event.endDate.slice(0, 19),
            part: parts + 1,
            lastPart: parts + 1,
            hostId,
        })
    }
    return eventParts
}

export const modifyEventPartsForSingularPreBufferTime = (eventParts: InitialEventPartType[], forEventId: string): InitialEventPartType[] => {
    const preBufferBeforeEventParts: InitialEventPartType[] = []
    const preBufferActualEventParts: InitialEventPartType[] = []

    const preBufferGroupId = uuid()

    for (let i = 0; i < eventParts.length; i++) {
        if ((eventParts[i].forEventId === forEventId) && (eventParts[i].isPreEvent)) {
            
            preBufferBeforeEventParts.push({
                ...eventParts[i],
                groupId: preBufferGroupId,
            })
        }
    }

    for (let i = 0; i < eventParts.length; i++) {
        if (eventParts[i].id === forEventId) {
            
            preBufferActualEventParts.push({
                ...eventParts[i],
                groupId: preBufferGroupId,
            })
        }
    }

    const preBufferBeforeEventPartsSorted = preBufferBeforeEventParts.sort((a, b) => (a.part - b.part))
    const preBufferActualEventPartsSorted = preBufferActualEventParts.sort((a, b) => (a.part - b.part))

    const preBufferEventPartsTotal = preBufferBeforeEventPartsSorted.concat(preBufferActualEventPartsSorted)

    for (let i = 0; i < preBufferEventPartsTotal.length; i++) {
        preBufferEventPartsTotal[i].part = i + 1
        preBufferEventPartsTotal[i].lastPart = preBufferEventPartsTotal.length

    }
   
    return preBufferEventPartsTotal
}
export const modifyEventPartsForMultiplePreBufferTime = (eventParts: InitialEventPartType[]): InitialEventPartType[] => {
    const uniquePreBufferPartForEventIds: string[] = []
    const preBufferEventPartsTotal: InitialEventPartType[] = []

    for (let i = 0; i < eventParts.length; i++) {
        if (eventParts[i].forEventId && eventParts[i].isPreEvent) {
            const foundPart = uniquePreBufferPartForEventIds.find(e => (e === eventParts[i].forEventId))
            // if found skip
            if (foundPart) {
                continue
            } else {
                uniquePreBufferPartForEventIds.push(eventParts[i].forEventId)
            }
        }
    }

    // fill up preBufferEventPartsTotal
    for (let i = 0; i < uniquePreBufferPartForEventIds.length; i++) {
        const returnedEventPartTotal = modifyEventPartsForSingularPreBufferTime(eventParts, uniquePreBufferPartForEventIds[i])
        preBufferEventPartsTotal.push(...returnedEventPartTotal)
    }

    // remove old values
    const eventPartsFiltered = _.differenceBy(eventParts, preBufferEventPartsTotal, 'id')
    const concatenatedValues = eventPartsFiltered.concat(preBufferEventPartsTotal)
   
    return concatenatedValues

}

export const modifyEventPartsForMultiplePostBufferTime = (eventParts: InitialEventPartType[]): InitialEventPartType[] => {
    const uniquePostBufferPartForEventIds: string[] = []
    const postBufferEventPartsTotal: InitialEventPartType[] = []

    for (let i = 0; i < eventParts.length; i++) {
        if (eventParts[i].forEventId && eventParts[i].isPostEvent) {
            const foundPart = uniquePostBufferPartForEventIds.find(e => (e === eventParts[i].forEventId))
            // if found skip
            if (foundPart) {
                continue
            } else {
                uniquePostBufferPartForEventIds.push(eventParts[i].forEventId)
            }
        }
    }

    // fill up preBufferEventPartsTotal
    for (let i = 0; i < uniquePostBufferPartForEventIds.length; i++) {
        const returnedEventPartTotal = modifyEventPartsForSingularPostBufferTime(eventParts, uniquePostBufferPartForEventIds[i])
        postBufferEventPartsTotal.push(...returnedEventPartTotal)
    }

    // remove old values
    const eventPartsFiltered = _.differenceBy(eventParts, postBufferEventPartsTotal, 'id')
    // add new values
    const concatenatedValues = eventPartsFiltered.concat(postBufferEventPartsTotal)

    return concatenatedValues

}

export const modifyEventPartsForSingularPostBufferTime = (eventParts: InitialEventPartType[], forEventId: string): InitialEventPartType[] => {
    const postBufferAfterEventParts: InitialEventPartType[] = []
    const postBufferActualEventParts: InitialEventPartType[] = []

    const postBufferGroupId = uuid()

    for (let i = 0; i < eventParts.length; i++) {
        if (eventParts[i].id == forEventId) {
            postBufferActualEventParts.push({
                ...eventParts[i],
                groupId: postBufferGroupId,
            })
        }
    }

    for (let i = 0; i < eventParts.length; i++) {
        if ((eventParts[i].forEventId === forEventId) && eventParts[i].isPostEvent) {
            postBufferAfterEventParts.push({
                ...eventParts[i],
                groupId: postBufferGroupId,
            })
        }
    }

    const postBufferActualEventPartsSorted = postBufferActualEventParts.sort((a, b) => (a.part - b.part))
    const postBufferAfterEventPartsSorted = postBufferAfterEventParts.sort((a, b) => (a.part - b.part))

    const postBufferEventPartsTotal = postBufferActualEventPartsSorted.concat(postBufferAfterEventPartsSorted)

    const preEventId = postBufferEventPartsTotal?.[0]?.preEventId
    const actualEventPreviousLastPart = postBufferEventPartsTotal?.[0]?.lastPart

    for (let i = 0; i < postBufferEventPartsTotal.length; i++) {
        if (preEventId) {
            postBufferEventPartsTotal[i].lastPart = actualEventPreviousLastPart + postBufferAfterEventPartsSorted.length
        } else {
            postBufferEventPartsTotal[i].part = i + 1
            postBufferEventPartsTotal[i].lastPart = postBufferEventPartsTotal.length
        }
    }

    // add values for postBuffer part
    for (let i = 0; i < postBufferAfterEventPartsSorted.length; i++) {
        if (postBufferEventPartsTotal?.[postBufferActualEventPartsSorted?.length + i]) {
            postBufferEventPartsTotal[postBufferActualEventPartsSorted?.length + i].part = actualEventPreviousLastPart + i + 1
        }
    }


    // change preEventId's last part and eventId
    const preEventParts = eventParts.filter(e => (e.eventId === preEventId))
    const preBufferEventParts = preEventParts?.map(e => ({ ...e, groupId: postBufferGroupId, lastPart: actualEventPreviousLastPart + postBufferAfterEventPartsSorted.length }))
    const concatenatedValues = preBufferEventParts.concat(postBufferEventPartsTotal)
   
    return concatenatedValues
}

export const formatEventTypeToPlannerEvent = (event: InitialEventPartTypePlus, userPreference: UserPreferenceType, workTimes: WorkTimeType[], hostTimezone: string): EventPartPlannerRequestBodyType => {
    const {
        allDay,
        part,
        forEventId,
        groupId,
        eventId,
        isBreak,
        isExternalMeeting,
        isExternalMeetingModifiable,
        isMeeting,
        isMeetingModifiable,
        isPostEvent,
        isPreEvent,
        modifiable,
        negativeImpactDayOfWeek,
        negativeImpactScore,
        negativeImpactTime,
        positiveImpactDayOfWeek,
        positiveImpactScore,
        positiveImpactTime,
        preferredDayOfWeek,
        preferredEndTimeRange,
        preferredStartTimeRange,
        preferredTime,
        priority,
        startDate,
        endDate,
        taskId,
        userId,
        weeklyTaskList,
        dailyTaskList,
        hardDeadline,
        softDeadline,
        recurringEventId,
        lastPart,
        preferredTimeRanges,
        hostId,
        meetingId,
    } = event

    if (allDay) {
        return null
    }

    const totalWorkingHours = convertToTotalWorkingHoursForInternalAttendee(userPreference, dayjs(event.startDate.slice(0, 19)).tz(event.timezone, true).tz(hostTimezone).format(), hostTimezone)

    const user: UserPlannerRequestBodyType = {
        id: event.userId,
        maxWorkLoadPercent: userPreference.maxWorkLoadPercent,
        backToBackMeetings: userPreference.backToBackMeetings,
        maxNumberOfMeetings: userPreference.maxNumberOfMeetings,
        minNumberOfBreaks: userPreference.minNumberOfBreaks,
        workTimes,
        hostId,
    }

    const eventPlannerRequestBody: EventPartPlannerRequestBodyType = {
        groupId,
        eventId,
        part,
        lastPart,
        startDate,
        endDate,
        taskId,
        hardDeadline,
        softDeadline,
        userId,
        user,
        priority,
        isPreEvent,
        isPostEvent,
        forEventId,
        positiveImpactScore,
        negativeImpactScore,
        positiveImpactDayOfWeek: dayOfWeekIntToString[positiveImpactDayOfWeek] ?? null,
        positiveImpactTime,
        negativeImpactDayOfWeek: dayOfWeekIntToString[negativeImpactDayOfWeek] ?? null,
        negativeImpactTime,
        modifiable,
        preferredDayOfWeek: dayOfWeekIntToString[preferredDayOfWeek] ?? null,
        preferredTime,
        isMeeting,
        isExternalMeeting,
        isExternalMeetingModifiable,
        isMeetingModifiable,
        dailyTaskList,
        weeklyTaskList,
        gap: isBreak,
        preferredStartTimeRange,
        preferredEndTimeRange,
        totalWorkingHours,
        recurringEventId,
        hostId,
        meetingId,
        event: {
            id: eventId,
            userId,
            hostId,
            preferredTimeRanges: preferredTimeRanges?.map(e => ({ dayOfWeek: dayOfWeekIntToString?.[e?.dayOfWeek] ?? null, startTime: e?.startTime, endTime: e?.endTime, eventId, userId, hostId })) ?? null,
        }
    }
    return eventPlannerRequestBody
}

export const formatEventTypeToPlannerEventForExternalAttendee = (event: InitialEventPartTypePlus, workTimes: WorkTimeType[], attendeeEvents: EventPlusType[], hostTimezone: string): EventPartPlannerRequestBodyType => {
    const {
        allDay,
        part,
        forEventId,
        groupId,
        eventId,
        isBreak,
        isExternalMeeting,
        isExternalMeetingModifiable,
        isMeeting,
        isMeetingModifiable,
        isPostEvent,
        isPreEvent,
        modifiable,
        negativeImpactDayOfWeek,
        negativeImpactScore,
        negativeImpactTime,
        positiveImpactDayOfWeek,
        positiveImpactScore,
        positiveImpactTime,
        preferredDayOfWeek,
        preferredEndTimeRange,
        preferredStartTimeRange,
        preferredTime,
        priority,
        startDate,
        endDate,
        taskId,
        userId,
        weeklyTaskList,
        dailyTaskList,
        hardDeadline,
        softDeadline,
        recurringEventId,
        lastPart,
        preferredTimeRanges,
        hostId,
        meetingId,
    } = event

    if (allDay) {
        return null
    }

    const totalWorkingHours = convertToTotalWorkingHoursForExternalAttendee(attendeeEvents, dayjs(event.startDate.slice(0, 19)).tz(event.timezone, true).tz(hostTimezone).format(), hostTimezone, event?.timezone)

    const user: UserPlannerRequestBodyType = {
        id: event.userId,
        maxWorkLoadPercent: 100,
        backToBackMeetings: false,
        maxNumberOfMeetings: 99,
        minNumberOfBreaks: 0,
        workTimes,
        hostId,
    }

    const eventPlannerRequestBody: EventPartPlannerRequestBodyType = {
        groupId,
        eventId,
        part,
        lastPart,
        startDate,
        endDate,
        taskId,
        hardDeadline,
        softDeadline,
        userId,
        user,
        priority,
        isPreEvent,
        isPostEvent,
        forEventId,
        positiveImpactScore,
        negativeImpactScore,
        positiveImpactDayOfWeek: dayOfWeekIntToString[positiveImpactDayOfWeek] ?? null,
        positiveImpactTime,
        negativeImpactDayOfWeek: dayOfWeekIntToString[negativeImpactDayOfWeek] ?? null,
        negativeImpactTime,
        modifiable,
        preferredDayOfWeek: dayOfWeekIntToString[preferredDayOfWeek] ?? null,
        preferredTime,
        isMeeting,
        isExternalMeeting,
        isExternalMeetingModifiable,
        isMeetingModifiable,
        dailyTaskList,
        weeklyTaskList,
        gap: isBreak,
        preferredStartTimeRange,
        preferredEndTimeRange,
        totalWorkingHours,
        recurringEventId,
        hostId,
        meetingId,
        event: {
            id: eventId,
            userId,
            hostId,
            preferredTimeRanges: preferredTimeRanges?.map(e => ({ dayOfWeek: dayOfWeekIntToString?.[e?.dayOfWeek] ?? null, startTime: e?.startTime, endTime: e?.endTime, eventId, userId, hostId })) ?? null,
        }
    }
    return eventPlannerRequestBody
}

export const convertMeetingPlusTypeToEventPlusType = (event: EventMeetingPlusType): EventPlusType => {

    const newEvent: EventPlusType = {
        ...event,
        preferredTimeRanges: event?.preferredTimeRanges?.map(pt => ({
            id: pt.id,
            eventId: event.id,
            dayOfWeek: pt?.dayOfWeek,
            startTime: pt?.startTime,
            endTime: pt?.endTime,
            updatedAt: pt?.updatedAt,
            createdDate: pt?.createdDate,
            userId: event?.userId,
        })) || null
    }

    return newEvent
}

export const setPreferredTimeForUnModifiableEvent = (event: EventPartPlannerRequestBodyType, timezone: string): EventPartPlannerRequestBodyType => {
    // set preferred DayOfWeek and Time if not set
    if (!event?.modifiable) {
        if (!event?.preferredDayOfWeek && !event?.preferredTime) {
            const newEvent = {
                ...event,
                preferredDayOfWeek: dayOfWeekIntToString[getISODay(dayjs(event.startDate.slice(0, 19)).tz(timezone, true).toDate())],
                preferredTime: dayjs(event.startDate.slice(0, 19)).tz(timezone, true).format('HH:mm') as Time,
            }
            return newEvent
        }
        return event
    }
    return event
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

export const tagEventsForDailyOrWeeklyTask = async (events: EventPartPlannerRequestBodyType[]): Promise<EventPartPlannerRequestBodyType[] | null> => {
    try {
        const filteredEvents = events.filter(e => (e.recurringEventId))
        if (filteredEvents?.length > 0) {
            const originalEvents = await listEventsWithIds(_.uniq(filteredEvents.map(e => (e?.recurringEventId))))
            if (originalEvents?.length > 0) {
                const taggedFilteredEvents = filteredEvents.map((e) => tagEventForDailyOrWeeklyTask(e, originalEvents.find(oe => (oe.id === e.recurringEventId))))
                // reconstruct events
                const newEvents = events.map(e => {
                    if (e?.recurringEventId) {
                        const taggedFilteredEvent = taggedFilteredEvents.find(te => (te?.eventId === e?.eventId))
                        if (taggedFilteredEvent?.eventId) {
                            return taggedFilteredEvent
                        } else {
                            return e
                        }
                    }
                    return e
                })
                return newEvents
            }
            
            return events
        }
        return events
    } catch (e) {
        
    }
}

// recurring events are not tagged with weekly or daily task boolean so need to be done manually
export const tagEventForDailyOrWeeklyTask = (eventToSubmit: EventPartPlannerRequestBodyType, event: EventPlusType) => {
    // validate
    if (!event?.id) {
        
        return null
    }

    if (!eventToSubmit?.eventId) {
        
        return null
    }

    if (eventToSubmit?.recurringEventId) {
        // const originalEvent = await getEventFromPrimaryKey(event.recurringEventId)
        if (event?.weeklyTaskList) {
            return {
                ...eventToSubmit,
                weeklyTaskList: event.weeklyTaskList,
            }
        }
        if (event?.dailyTaskList) {
            return {
                ...eventToSubmit,
                dailyTaskList: event.dailyTaskList,
            }
        }
        return eventToSubmit
    }
    return eventToSubmit
}

export const generateUserPlannerRequestBody = (userPreference: UserPreferenceType, userId: string, workTimes: WorkTimeType[], hostId: string): UserPlannerRequestBodyType => {
    const {
        maxWorkLoadPercent,
        backToBackMeetings,
        maxNumberOfMeetings,
        minNumberOfBreaks,
    } = userPreference
    const user: UserPlannerRequestBodyType = {
        id: userId,
        maxWorkLoadPercent,
        backToBackMeetings,
        maxNumberOfMeetings,
        minNumberOfBreaks,
        workTimes,
        hostId,
    }
    return user
}

export const generateUserPlannerRequestBodyForExternalAttendee = (userId: string, workTimes: WorkTimeType[], hostId: string): UserPlannerRequestBodyType => {
    // add default values for user request body
    const user: UserPlannerRequestBodyType = {
        id: userId,
        maxWorkLoadPercent: 100,
        backToBackMeetings: false,
        maxNumberOfMeetings: 99,
        minNumberOfBreaks: 0,
        workTimes,
        hostId,
    }
    return user
}

export const processEventsForOptaPlannerForMainHost = async (
    mainHostId: string,
    allHostEvents: EventPlusType[],
    windowStartDate: string,
    windowEndDate: string,
    hostTimezone: string,
    oldHostEvents: EventPlusType[],
    newHostReminders?: RemindersForEventType[],
    newHostBufferTimes?: BufferTimeObjectType[],
): Promise<ReturnBodyForHostForOptaplannerPrepType> => {
    try {

        const newBufferTimeArray: EventPlusType[] = []
        newHostBufferTimes?.forEach(newHostBufferTime => {
            if (newHostBufferTime?.beforeEvent?.id) {
                
                newBufferTimeArray.push(newHostBufferTime.beforeEvent)
            }

            if (newHostBufferTime?.afterEvent?.id) {
                
                newBufferTimeArray.push(newHostBufferTime.afterEvent)
            }
        })

        const modifiedAllHostEvents = _.cloneDeep(allHostEvents)

        modifiedAllHostEvents.push(...newBufferTimeArray)

        // get user preferences
        const userPreferences = await getUserPreferences(mainHostId)

        // get global primary calendar
        const globalPrimaryCalendar = await getGlobalCalendar(mainHostId)

        // generate timeslots

        const diffDays = dayjs(windowEndDate.slice(0, 19)).diff(dayjs(windowStartDate.slice(0, 19)), 'day')

        const modifiedAllEventsWithBreaks: EventPlusType[] = []

        const startDatesForEachDay = []

        for (let i = 0; i <= diffDays; i++) {
            startDatesForEachDay.push(dayjs(windowStartDate.slice(0, 19)).tz(hostTimezone, true).add(i, 'day').format())

        }

        // add breaks to all events
        let parentBreaks: EventPlusType[] = []
        
        const breaks = await generateBreakEventsForDate(userPreferences, mainHostId, windowStartDate, windowEndDate, hostTimezone, globalPrimaryCalendar?.id)

        if (breaks?.length > 0) {
            // modifiedAllEvents.push(...breaks)
            const allEventsWithDuplicateFreeBreaks = _.differenceBy(modifiedAllHostEvents, breaks, 'id')
            modifiedAllEventsWithBreaks.push(...allEventsWithDuplicateFreeBreaks)
            modifiedAllEventsWithBreaks.push(...breaks)
            parentBreaks.push(...breaks)
        } else {
            modifiedAllEventsWithBreaks.push(...modifiedAllHostEvents)
        }
        


        const workTimes = generateWorkTimesForInternalAttendee(mainHostId, mainHostId, userPreferences, hostTimezone, hostTimezone)
        const timeslots = []
       
        for (let i = 0; i < startDatesForEachDay.length; i++) {
            if (i === 0) {
                // const mostRecentEvent = _.minBy(modifiedAllEventsWithBreaks, (e) => dayjs(e?.startDate).unix())
                const timeslotsForDay = await generateTimeSlotsLiteForInternalAttendee(startDatesForEachDay?.[i], mainHostId, userPreferences, hostTimezone, hostTimezone, true)
                timeslots.push(...timeslotsForDay)
                continue
            }
            const timeslotsForDay = await generateTimeSlotsLiteForInternalAttendee(startDatesForEachDay?.[i], mainHostId, userPreferences, hostTimezone, hostTimezone, false)
            timeslots.push(...timeslotsForDay)
        }
            
        

        // generate event parts
        const filteredAllEvents = _.uniqBy(modifiedAllEventsWithBreaks.filter(e => (validateEventDates(e, userPreferences))), 'id')
        let eventParts: EventPartPlannerRequestBodyType[] = []
    
        const eventPartMinisAccumulated = []
        for (const event of filteredAllEvents) {
            // const preferredTimeRanges = await listPreferredTimeRangesForEvent(event?.id)
            // const eventPlus: EventPlusType = { ...event, preferredTimeRanges }
            const eventPartMinis = generateEventPartsLite(event, mainHostId)
            eventPartMinisAccumulated.push(...eventPartMinis)
        }

        const modifiedEventPartMinisPreBuffer = modifyEventPartsForMultiplePreBufferTime(eventPartMinisAccumulated)
        const modifiedEventPartMinisPreAndPostBuffer = modifyEventPartsForMultiplePostBufferTime(modifiedEventPartMinisPreBuffer)
        const formattedEventParts: EventPartPlannerRequestBodyType[] = modifiedEventPartMinisPreAndPostBuffer.map(e => formatEventTypeToPlannerEvent(e, userPreferences, workTimes, hostTimezone))
        if (formattedEventParts.length > 0) {
            eventParts.push(...formattedEventParts)
        }
        

        if (eventParts.length > 0) {
           
            const newEventPartsWithPreferredTimeSet = eventParts.map(e => setPreferredTimeForUnModifiableEvent(e, allHostEvents.find(f => (f.id === e.eventId))?.timezone))
           
            const newEventParts = await tagEventsForDailyOrWeeklyTask(newEventPartsWithPreferredTimeSet)
           
            const userPlannerRequestBody = generateUserPlannerRequestBody(userPreferences, userPreferences.userId, workTimes, mainHostId)
            

            const modifiedNewEventParts: EventPartPlannerRequestBodyType[] = newEventParts.map((eventPart) => {
                const oldEvent = filteredAllEvents.find((event) => (event.id === eventPart.eventId))
                return {
                    groupId: eventPart?.groupId,
                    eventId: eventPart?.eventId,
                    part: eventPart?.part,
                    lastPart: eventPart?.lastPart,
                    meetingId: eventPart?.meetingId,
                    hostId: mainHostId,
                    startDate: dayjs(eventPart?.startDate.slice(0, 19)).tz(oldEvent.timezone, true).format(),
                    endDate: dayjs(eventPart?.endDate.slice(0, 19)).tz(oldEvent.timezone, true).format(),
                    userId: eventPart?.userId,
                    user: eventPart?.user,
                    priority: eventPart?.priority,
                    isPreEvent: eventPart?.isPreEvent,
                    isPostEvent: eventPart?.isPostEvent,
                    positiveImpactScore: eventPart?.positiveImpactScore,
                    negativeImpactScore: eventPart?.negativeImpactScore,
                    modifiable: eventPart?.modifiable,
                    isMeeting: eventPart?.isMeeting,
                    isExternalMeeting: eventPart?.isExternalMeeting,
                    isExternalMeetingModifiable: eventPart?.isExternalMeetingModifiable,
                    isMeetingModifiable: eventPart?.isMeetingModifiable,
                    dailyTaskList: eventPart?.dailyTaskList,
                    weeklyTaskList: eventPart?.weeklyTaskList,
                    gap: eventPart?.gap,
                    totalWorkingHours: eventPart?.totalWorkingHours,
                    hardDeadline: eventPart?.hardDeadline,
                    softDeadline: eventPart?.softDeadline,
                    forEventId: eventPart?.forEventId,
                    positiveImpactDayOfWeek: eventPart?.positiveImpactDayOfWeek,
                    positiveImpactTime: eventPart?.positiveImpactTime,
                    negativeImpactDayOfWeek: eventPart?.negativeImpactDayOfWeek,
                    negativeImpactTime: eventPart?.negativeImpactTime,
                    preferredDayOfWeek: eventPart?.preferredDayOfWeek,
                    preferredTime: eventPart?.preferredTime,
                    preferredStartTimeRange: eventPart?.preferredStartTimeRange,
                    preferredEndTimeRange: eventPart?.preferredEndTimeRange,
                    event: eventPart?.event,
                }
            })

            return modifiedNewEventParts?.length > 0
                ? {
                    userId: mainHostId,
                    hostId: mainHostId,
                    eventParts: modifiedNewEventParts,
                    allEvents: filteredAllEvents,
                    breaks: parentBreaks,
                    oldEvents: oldHostEvents,
                    timeslots,
                    userPlannerRequestBody,
                    newHostReminders,
                    newHostBufferTimes,
                } : null
        }
    } catch (e) {
        
    }
}

export const processEventsForOptaPlannerForInternalAttendees = async (
    mainHostId: string,
    allEvents: EventPlusType[],
    windowStartDate: string,
    windowEndDate: string,
    hostTimezone: string,
    internalAttendees: MeetingAssistAttendeeType[],
    oldEvents: EventType[],
    oldMeetingEvents: EventMeetingPlusType[],
    newHostReminders?: RemindersForEventType[],
    newHostBufferTimes?: BufferTimeObjectType[],
): Promise<ReturnBodyForAttendeeForOptaplannerPrepType> => {
    try {

        const newBufferTimeArray: EventPlusType[] = []
        newHostBufferTimes?.forEach(newHostBufferTime => {
            if (newHostBufferTime?.beforeEvent?.id) {
                
                newBufferTimeArray.push(newHostBufferTime.beforeEvent)
            }

            if (newHostBufferTime?.afterEvent?.id) {
                
                newBufferTimeArray.push(newHostBufferTime.afterEvent)
            }
        })

        const filteredOldMeetingEvents = oldMeetingEvents?.map(m => {
            const foundIndex = allEvents?.findIndex(a => (a?.id === m?.id))

            if (foundIndex > -1) {
                return null
            }
            return m
        })?.filter(e => (e !== null))


        const modifiedAllEvents = _.cloneDeep(allEvents)

        // add smart meeting events to all events
        if (filteredOldMeetingEvents?.[0]?.id) {
            modifiedAllEvents.push(...(filteredOldMeetingEvents?.map(a => convertMeetingPlusTypeToEventPlusType(a))))
        }

        modifiedAllEvents.push(...newBufferTimeArray)

        // get user preferences
        const unfilteredUserPreferences: UserPreferenceType[] = []
        for (const internalAttendee of internalAttendees) {
            const userPreference = await getUserPreferences(internalAttendee?.userId)
            unfilteredUserPreferences.push(userPreference)
        }

        const userPreferences: UserPreferenceType[] = _.uniqWith(unfilteredUserPreferences, _.isEqual)

        // global primary calendars
        const unfilteredGlobalPrimaryCalendars: CalendarType[] = []
        for (const internalAttendee of internalAttendees) {
            const globalPrimaryCalendar = await getGlobalCalendar(internalAttendee?.userId)
            unfilteredGlobalPrimaryCalendars.push(globalPrimaryCalendar)
        }

        const globalPrimaryCalendars = _.uniqWith(unfilteredGlobalPrimaryCalendars, _.isEqual)

        const modifiedAllEventsWithBreaks: EventPlusType[] = []

        // add breaks to all events
        let parentBreaks: EventPlusType[] = []
        for (const userPreference of userPreferences) {
            const globalPrimaryCalendar = globalPrimaryCalendars.find(g => (g?.userId === userPreference?.userId))
            if (!globalPrimaryCalendar) {
                throw new Error('no global primary calendar found')
            }
            const userId = userPreference?.userId

            
            const breaks = await generateBreakEventsForDate(userPreference, userId, windowStartDate, windowEndDate, hostTimezone, globalPrimaryCalendar?.id)

            if (breaks?.length > 0) {
                // modifiedAllEvents.push(...breaks)
                const allEventsWithDuplicateFreeBreaks = _.differenceBy(modifiedAllEvents, breaks, 'id')
                modifiedAllEventsWithBreaks.push(...allEventsWithDuplicateFreeBreaks)
                modifiedAllEventsWithBreaks.push(...breaks)
                parentBreaks.push(...breaks)
            } else {
                modifiedAllEventsWithBreaks.push(...modifiedAllEvents)
            }
            
        }

        // generate timeslots

        const diffDays = dayjs(windowEndDate.slice(0, 19)).diff(dayjs(windowStartDate.slice(0, 19)), 'day')
        const startDatesForEachDay = []

        for (let i = 0; i <= diffDays; i++) {
            startDatesForEachDay.push(dayjs(windowStartDate.slice(0, 19)).tz(hostTimezone, true).add(i, 'day').format())

        }

        const unfilteredWorkTimes: WorkTimeType[] = []
        for (const internalAttendee of internalAttendees) {
            const userPreference = userPreferences.find(u => (u.userId === internalAttendee.userId))
            const attendeeTimezone = internalAttendee?.timezone
            const workTimesForAttendee = generateWorkTimesForInternalAttendee(mainHostId, internalAttendee.userId, userPreference, hostTimezone, attendeeTimezone)
            unfilteredWorkTimes.push(...workTimesForAttendee)
        }

        const workTimes: WorkTimeType[] = _.uniqWith(unfilteredWorkTimes, _.isEqual)

        const unfilteredTimeslots = []
        const timeslots = []

        for (let i = 0; i < startDatesForEachDay.length; i++) {
            if (i === 0) {
                for (const internalAttendee of internalAttendees) {
                    const userPreference = userPreferences.find(u => (u.userId === internalAttendee.userId))
                    // const mostRecentEvent = _.minBy(modifiedAllEventsWithBreaks, (e) => dayjs(e?.startDate).unix())
                    const timeslotsForDay = await generateTimeSlotsLiteForInternalAttendee(startDatesForEachDay?.[i], mainHostId, userPreference, hostTimezone, internalAttendee?.timezone, true)
                    unfilteredTimeslots.push(...timeslotsForDay)
                }
                continue
            }
            for (const internalAttendee of internalAttendees) {
                const userPreference = userPreferences.find(u => (u.userId === internalAttendee.userId))
                const timeslotsForDay = await generateTimeSlotsLiteForInternalAttendee(startDatesForEachDay?.[i], mainHostId, userPreference, hostTimezone, internalAttendee?.timezone, false)
                unfilteredTimeslots.push(...timeslotsForDay)
            }
        }

        timeslots.push(...(_.uniqWith(unfilteredTimeslots, _.isEqual)))
        
        

        // generate event parts
        const unfilteredAllEvents: EventPlusType[] = []
        for (const internalAttendee of internalAttendees) {
            const userPreference = userPreferences.find(u => (u.userId === internalAttendee.userId))
            const modifiedAllEventsWithBreaksWithUser = modifiedAllEventsWithBreaks.filter(e => (e.userId === internalAttendee.userId))
            const events = modifiedAllEventsWithBreaksWithUser.filter(e => (validateEventDates(e, userPreference)))
            unfilteredAllEvents.push(...events)
        }
        const filteredAllEvents = _.uniqBy(unfilteredAllEvents, 'id')
        let eventParts: EventPartPlannerRequestBodyType[] = []

        const eventPartMinisAccumulated = []
        for (const event of filteredAllEvents) {
            // const preferredTimeRanges = await listPreferredTimeRangesForEvent(event?.id)
            // const eventPlus: EventPlusType = { ...event, preferredTimeRanges }
            const eventPartMinis = generateEventPartsLite(event, mainHostId)
            eventPartMinisAccumulated.push(...eventPartMinis)
        }

        const modifiedEventPartMinisPreBuffer = modifyEventPartsForMultiplePreBufferTime(eventPartMinisAccumulated)
        const modifiedEventPartMinisPreAndPostBuffer = modifyEventPartsForMultiplePostBufferTime(modifiedEventPartMinisPreBuffer)
        const formattedEventParts: EventPartPlannerRequestBodyType[] = []
        for (const userPreference of userPreferences) {
            const formattedEventPartsForUser: EventPartPlannerRequestBodyType[] = modifiedEventPartMinisPreAndPostBuffer.filter(e => (e?.userId === userPreference?.userId)).map(e => formatEventTypeToPlannerEvent(e, userPreference, workTimes, hostTimezone))
            formattedEventParts.push(...formattedEventPartsForUser)
        }

        if (formattedEventParts.length > 0) {
            eventParts.push(...(_.uniqWith(formattedEventParts, _.isEqual)))
        }
        

        if (eventParts.length > 0) {
           
            const newEventPartsWithPreferredTimeSet = eventParts.map(e => setPreferredTimeForUnModifiableEvent(e, allEvents.find(f => (f.id === e.eventId))?.timezone))
            
            const newEventParts = await tagEventsForDailyOrWeeklyTask(newEventPartsWithPreferredTimeSet)
            
            const unfilteredUserList: UserPlannerRequestBodyType[] = []
            for (const userPreference of userPreferences) {
                const userPlannerRequestBody = generateUserPlannerRequestBody(userPreference, userPreference?.userId, workTimes, mainHostId)
                
                unfilteredUserList.push(userPlannerRequestBody)
            }

            const userList: UserPlannerRequestBodyType[] = _.uniqWith(unfilteredUserList, _.isEqual)

            const modifiedNewEventParts: EventPartPlannerRequestBodyType[] = newEventParts.map((eventPart) => {
                const oldEvent = filteredAllEvents.find((event) => (event.id === eventPart.eventId))
                return {
                    groupId: eventPart?.groupId,
                    eventId: eventPart?.eventId,
                    part: eventPart?.part,
                    lastPart: eventPart?.lastPart,
                    meetingId: eventPart?.meetingId,
                    hostId: mainHostId,
                    startDate: dayjs(eventPart?.startDate.slice(0, 19)).tz(oldEvent.timezone, true).tz(hostTimezone).format(),
                    endDate: dayjs(eventPart?.endDate.slice(0, 19)).tz(oldEvent.timezone, true).tz(hostTimezone).format(),
                    userId: eventPart?.userId,
                    user: eventPart?.user,
                    priority: eventPart?.priority,
                    isPreEvent: eventPart?.isPreEvent,
                    isPostEvent: eventPart?.isPostEvent,
                    positiveImpactScore: eventPart?.positiveImpactScore,
                    negativeImpactScore: eventPart?.negativeImpactScore,
                    modifiable: eventPart?.modifiable,
                    isMeeting: eventPart?.isMeeting,
                    isExternalMeeting: eventPart?.isExternalMeeting,
                    isExternalMeetingModifiable: eventPart?.isExternalMeetingModifiable,
                    isMeetingModifiable: eventPart?.isMeetingModifiable,
                    dailyTaskList: eventPart?.dailyTaskList,
                    weeklyTaskList: eventPart?.weeklyTaskList,
                    gap: eventPart?.gap,
                    totalWorkingHours: eventPart?.totalWorkingHours,
                    hardDeadline: eventPart?.hardDeadline,
                    softDeadline: eventPart?.softDeadline,
                    forEventId: eventPart?.forEventId,
                    positiveImpactDayOfWeek: eventPart?.positiveImpactDayOfWeek,
                    positiveImpactTime: eventPart?.positiveImpactTime,
                    negativeImpactDayOfWeek: eventPart?.negativeImpactDayOfWeek,
                    negativeImpactTime: eventPart?.negativeImpactTime,
                    preferredDayOfWeek: eventPart?.preferredDayOfWeek,
                    preferredTime: eventPart?.preferredTime,
                    preferredStartTimeRange: eventPart?.preferredStartTimeRange,
                    preferredEndTimeRange: eventPart?.preferredEndTimeRange,
                    event: eventPart?.event,
                }
            })


            return modifiedNewEventParts?.length > 0
                ? {
                    userIds: internalAttendees.map(a => a.userId),
                    hostId: mainHostId,
                    eventParts: modifiedNewEventParts,
                    allEvents: filteredAllEvents,
                    oldEvents,
                    timeslots,
                    userList,
                    newHostReminders,
                    newHostBufferTimes,
                } : null
        }
    } catch (e) {
        
    }
}

export const convertMeetingAssistEventTypeToEventPlusType = (
    event: MeetingAssistEventType,
    userId: string,
): EventPlusType => {
    return {
        id: event?.id,
        userId: userId,
        title: event?.summary,
        startDate: event?.startDate,
        endDate: event?.endDate,
        allDay: event?.allDay,
        recurrenceRule: event?.recurrenceRule,
        location: event?.location,
        notes: event?.notes,
        attachments: event?.attachments,
        links: event?.links,
        timezone: event?.timezone,
        createdDate: event?.createdDate,
        deleted: false,
        priority: 1,
        isFollowUp: false,
        isPreEvent: false,
        isPostEvent: false,
        modifiable: false,
        anyoneCanAddSelf: true,
        guestsCanInviteOthers: true,
        guestsCanSeeOtherGuests: true,
        originalStartDate: event?.startDate,
        originalAllDay: event?.allDay,
        summary: event?.summary,
        transparency: event?.transparency,
        visibility: event?.visibility,
        recurringEventId: event?.recurringEventId,
        updatedAt: event?.updatedAt,
        iCalUID: event?.iCalUID,
        htmlLink: event?.htmlLink,
        colorId: event?.colorId,
        creator: event?.creator,
        organizer: event?.organizer,
        endTimeUnspecified: event?.endTimeUnspecified,
        recurrence: event?.recurrence,
        originalTimezone: event?.timezone,
        extendedProperties: event?.extendedProperties,
        hangoutLink: event?.hangoutLink,
        guestsCanModify: event?.guestsCanModify,
        locked: event?.locked,
        source: event?.source,
        eventType: event?.eventType,
        privateCopy: event?.privateCopy,
        calendarId: event?.calendarId,
        backgroundColor: event?.backgroundColor,
        foregroundColor: event?.foregroundColor,
        useDefaultAlarms: event?.useDefaultAlarms,
        meetingId: event?.meetingId,
        eventId: event?.eventId,
    }
}

export const generateWorkTimesForExternalAttendee = (
    hostId: string,
    userId: string,
    attendeeEvents: EventPlusType[],
    hostTimezone: string,
    userTimezone: string,
) => {
    // 7 days in a week
    const daysInWeek = 7

    const workTimes: WorkTimeType[] = []

    for (let i = 0; i < daysInWeek; i++) {

        const dayOfWeekInt = i + 1

        const sameDayEvents = attendeeEvents.filter(e => (getISODay(dayjs(e.startDate.slice(0, 19)).tz(e.timezone || userTimezone, true).tz(hostTimezone).toDate()) === (i + 1)))
        const minStartDate = _.minBy(sameDayEvents, (e) => dayjs(e.startDate.slice(0, 19)).tz(e.timezone || userTimezone, true).tz(hostTimezone).unix())
        const maxEndDate = _.maxBy(sameDayEvents, (e) => dayjs(e.endDate.slice(0, 19)).tz(e.timezone || userTimezone, true).tz(hostTimezone).unix())
        const startHour = dayjs(minStartDate.startDate.slice(0, 19)).tz(minStartDate.timezone || userTimezone, true).tz(hostTimezone).hour()
        const startMinute = dayjs(minStartDate.startDate.slice(0, 19)).tz(minStartDate.timezone || userTimezone, true).tz(hostTimezone)
            .isBetween(dayjs(minStartDate.startDate.slice(0, 19)).tz(minStartDate.timezone || userTimezone, true).tz(hostTimezone).minute(0), dayjs(minStartDate.startDate.slice(0, 19)).tz(minStartDate.timezone || userTimezone, true).tz(hostTimezone).minute(15), 'minute', '[)')
            ? 0
            : dayjs(minStartDate.startDate.slice(0, 19)).tz(minStartDate.timezone || userTimezone, true).tz(hostTimezone).isBetween(dayjs(minStartDate.startDate.slice(0, 19)).tz(minStartDate.timezone || userTimezone, true).tz(hostTimezone).minute(15), dayjs(minStartDate.startDate.slice(0, 19)).tz(minStartDate.timezone || userTimezone, true).tz(hostTimezone).minute(30), 'minute', '[)')
                ? 15
                : dayjs(minStartDate.startDate.slice(0, 19)).tz(minStartDate.timezone || userTimezone, true).tz(hostTimezone).isBetween(dayjs(minStartDate.startDate.slice(0, 19)).tz(minStartDate.timezone || userTimezone, true).tz(hostTimezone).minute(30), dayjs(minStartDate.startDate.slice(0, 19)).tz(minStartDate.timezone || userTimezone, true).tz(hostTimezone).minute(45), 'minute', '[)')
                    ? 30
                    : 45

        let endHour = dayjs(maxEndDate.endDate.slice(0, 19)).tz(maxEndDate.timezone || userTimezone, true).tz(hostTimezone).hour()
        const endMinute = dayjs(maxEndDate.endDate.slice(0, 19)).tz(maxEndDate.timezone || userTimezone, true).tz(hostTimezone)
            .isBetween(dayjs(maxEndDate.endDate.slice(0, 19)).tz(maxEndDate.timezone || userTimezone, true).tz(hostTimezone).minute(0), dayjs(maxEndDate.endDate.slice(0, 19)).tz(maxEndDate.timezone || userTimezone, true).tz(hostTimezone).minute(15), 'minute', '[)')
            ? 15
            : dayjs(maxEndDate.endDate.slice(0, 19)).tz(maxEndDate.timezone || userTimezone, true).tz(hostTimezone).isBetween(dayjs(maxEndDate.endDate.slice(0, 19)).tz(maxEndDate.timezone || userTimezone, true).tz(hostTimezone).minute(15), dayjs(maxEndDate.endDate.slice(0, 19)).tz(maxEndDate.timezone || userTimezone, true).tz(hostTimezone).minute(30), 'minute', '[)')
                ? 30
                : dayjs(maxEndDate.endDate.slice(0, 19)).tz(maxEndDate.timezone || userTimezone, true).tz(hostTimezone).isBetween(dayjs(maxEndDate.endDate.slice(0, 19)).tz(maxEndDate.timezone || userTimezone, true).tz(hostTimezone).minute(30), dayjs(maxEndDate.endDate.slice(0, 19)).tz(maxEndDate.timezone || userTimezone, true).tz(hostTimezone).minute(45), 'minute', '[)')
                    ? 45
                    : 0
        if (endMinute === 0) {
            if (endHour < 23) {
                endHour += 1
            }
        }


        workTimes.push({
            dayOfWeek: dayOfWeekIntToString[dayOfWeekInt],
            startTime: dayjs(setISODay(dayjs().hour(startHour).minute(startMinute).tz(hostTimezone, true).toDate(), i + 1)).tz(hostTimezone).format('HH:mm') as Time,
            endTime: dayjs(setISODay(dayjs().hour(endHour).minute(endMinute).tz(hostTimezone, true).toDate(), i + 1)).tz(hostTimezone).format('HH:mm') as Time,
            hostId,
            userId,
        })
    }


    return workTimes
}

export const generateTimeSlotsForExternalAttendee = (
    hostStartDate: string,
    hostId: string,
    attendeeEvents: EventPlusType[],
    hostTimezone: string,
    userTimezone: string,
    isFirstDay?: boolean,
) => {
    if (isFirstDay) {
        const dayOfWeekIntByHost = getISODay(dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).toDate())
        // convert to host timezone so everything is linked to host timezone
        const monthByHost = dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).month()
        const dayOfMonthByHost = dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).date()
        const startHourOfHostDateByHost = dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).hour()
        const startMinuteOfHostDateByHost = dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true)
            .isBetween(dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).minute(0), dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).minute(15), 'minute', '[)')
            ? 0
            : dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).isBetween(dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).minute(15), dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).minute(30), 'minute', '[)')
                ? 15
                : dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).isBetween(dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).minute(30), dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).minute(45), 'minute', '[)')
                    ? 30
                    : 45

        const sameDayEvents = attendeeEvents.filter(e => (getISODay(dayjs(e.startDate.slice(0, 19)).tz(userTimezone, true).tz(hostTimezone).toDate()) === dayOfWeekIntByHost))
        // const minStartDate = _.minBy(sameDayEvents, (e) => dayjs(e.startDate.slice(0, 19)).tz(userTimezone, true).tz(hostTimezone).unix())
        const maxEndDate = _.maxBy(sameDayEvents, (e) => dayjs(e.endDate.slice(0, 19)).tz(userTimezone, true).tz(hostTimezone).unix())

        let workEndHourByHost = dayjs(maxEndDate.endDate.slice(0, 19)).tz(maxEndDate.timezone || userTimezone, true).tz(hostTimezone).hour()
        const workEndMinuteByHost = dayjs(maxEndDate.endDate.slice(0, 19)).tz(maxEndDate.timezone || userTimezone, true).tz(hostTimezone)
            .isBetween(dayjs(maxEndDate.endDate.slice(0, 19)).tz(maxEndDate.timezone || userTimezone, true).tz(hostTimezone).minute(0), dayjs(maxEndDate.endDate.slice(0, 19)).tz(maxEndDate.timezone || userTimezone, true).tz(hostTimezone).minute(15), 'minute', '[)')
            ? 15
            : dayjs(maxEndDate.endDate.slice(0, 19)).tz(maxEndDate.timezone || userTimezone, true).tz(hostTimezone).isBetween(dayjs(maxEndDate.endDate.slice(0, 19)).tz(maxEndDate.timezone || userTimezone, true).tz(hostTimezone).minute(15), dayjs(maxEndDate.endDate.slice(0, 19)).tz(maxEndDate.timezone || userTimezone, true).tz(hostTimezone).minute(30), 'minute', '[)')
                ? 30
                : dayjs(maxEndDate.endDate.slice(0, 19)).tz(maxEndDate.timezone || userTimezone, true).tz(hostTimezone).isBetween(dayjs(maxEndDate.endDate.slice(0, 19)).tz(maxEndDate.timezone || userTimezone, true).tz(hostTimezone).minute(30), dayjs(maxEndDate.endDate.slice(0, 19)).tz(maxEndDate.timezone || userTimezone, true).tz(hostTimezone).minute(45), 'minute', '[)')
                    ? 45
                    : 0
        if (workEndMinuteByHost === 0) {
            if (workEndHourByHost < 23) {
                workEndHourByHost += 1
            }
        }

        const minStartDate = _.minBy(sameDayEvents, (e) => dayjs(e.startDate.slice(0, 19)).tz(userTimezone, true).tz(hostTimezone).unix())

        const workStartHourByHost = dayjs(minStartDate.startDate.slice(0, 19)).tz(minStartDate.timezone || userTimezone, true).tz(hostTimezone).hour()
        const workStartMinuteByHost = dayjs(minStartDate.startDate.slice(0, 19)).tz(minStartDate.timezone || userTimezone, true).tz(hostTimezone)
            .isBetween(dayjs(minStartDate.startDate.slice(0, 19)).tz(minStartDate.timezone || userTimezone, true).tz(hostTimezone).minute(0), dayjs(minStartDate.startDate.slice(0, 19)).tz(minStartDate.timezone || userTimezone, true).tz(hostTimezone).minute(15), 'minute', '[)')
            ? 0
            : dayjs(minStartDate.startDate.slice(0, 19)).tz(minStartDate.timezone || userTimezone, true).tz(hostTimezone).isBetween(dayjs(minStartDate.startDate.slice(0, 19)).tz(minStartDate.timezone || userTimezone, true).tz(hostTimezone).minute(15), dayjs(minStartDate.startDate.slice(0, 19)).tz(minStartDate.timezone || userTimezone, true).tz(hostTimezone).minute(30), 'minute', '[)')
                ? 15
                : dayjs(minStartDate.startDate.slice(0, 19)).tz(minStartDate.timezone || userTimezone, true).tz(hostTimezone).isBetween(dayjs(minStartDate.startDate.slice(0, 19)).tz(minStartDate.timezone || userTimezone, true).tz(hostTimezone).minute(30), dayjs(minStartDate.startDate.slice(0, 19)).tz(minStartDate.timezone || userTimezone, true).tz(hostTimezone).minute(45), 'minute', '[)')
                    ? 30
                    : 45

        // change to work start time as work start time is  after host start time
        if (dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).isBefore(dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).hour(workStartHourByHost).minute(workStartMinuteByHost))) {

            const startDuration = dayjs.duration({ hours: workStartHourByHost, minutes: workStartMinuteByHost })
            const endDuration = dayjs.duration({ hours: workEndHourByHost, minutes: workEndMinuteByHost })
            const totalDuration = endDuration.subtract(startDuration)
            const totalMinutes = totalDuration.asMinutes()

            const timeSlots: TimeSlotType[] = []

            
            for (let i = 0; i < totalMinutes; i += 15) {
                timeSlots.push({
                    dayOfWeek: dayOfWeekIntToString[dayOfWeekIntByHost],
                    startTime: dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).hour(startHourOfHostDateByHost).minute(startMinuteOfHostDateByHost).add(i, 'minute').format('HH:mm') as Time,
                    endTime: dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).hour(startHourOfHostDateByHost).minute(startMinuteOfHostDateByHost).add(i + 15, 'minute').format('HH:mm') as Time,
                    hostId,
                    monthDay: formatToMonthDay(monthByHost as MonthType, dayOfMonthByHost as DayType)
                })
            }
            
            return timeSlots
        }

        const startDuration = dayjs.duration({ hours: startHourOfHostDateByHost, minutes: startMinuteOfHostDateByHost })
        const endDuration = dayjs.duration({ hours: workEndHourByHost, minutes: workEndMinuteByHost })
        const totalDuration = endDuration.subtract(startDuration)
        const totalMinutes = totalDuration.asMinutes()

        const timeSlots: TimeSlotType[] = []
        
        for (let i = 0; i < totalMinutes; i += 15) {
            timeSlots.push({
                dayOfWeek: dayOfWeekIntToString[dayOfWeekIntByHost],
                startTime: dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).hour(startHourOfHostDateByHost).minute(startMinuteOfHostDateByHost).add(i, 'minute').format('HH:mm') as Time,
                endTime: dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).hour(startHourOfHostDateByHost).minute(startMinuteOfHostDateByHost).add(i + 15, 'minute').format('HH:mm') as Time,
                hostId,
                monthDay: formatToMonthDay(monthByHost as MonthType, dayOfMonthByHost as DayType)
            })
        }

        
        return timeSlots
    }

    // not first day start from work start time schedule

    const dayOfWeekIntByHost = getISODay(dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).toDate())
    // convert to host timezone so everything is linked to host timezone
    const monthByHost = dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).month()
    const dayOfMonthByHost = dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).date()

    const sameDayEvents = attendeeEvents.filter(e => (getISODay(dayjs(e.startDate.slice(0, 19)).tz(e.timezone || userTimezone, true).tz(hostTimezone).toDate()) === (dayOfWeekIntByHost)))
    const minStartDate = _.minBy(sameDayEvents, (e) => dayjs(e.startDate.slice(0, 19)).tz(e.timezone || userTimezone, true).tz(hostTimezone).unix())
    const maxEndDate = _.maxBy(sameDayEvents, (e) => dayjs(e.endDate.slice(0, 19)).tz(e.timezone || userTimezone, true).tz(hostTimezone).unix())

    let workEndHourByHost = dayjs(maxEndDate.endDate.slice(0, 19)).tz(maxEndDate?.timezone || userTimezone, true).tz(hostTimezone).hour()
    const workEndMinuteByHost = dayjs(maxEndDate.endDate.slice(0, 19)).tz(maxEndDate?.timezone || userTimezone, true).tz(hostTimezone)
        .isBetween(dayjs(maxEndDate.endDate.slice(0, 19)).tz(maxEndDate?.timezone || userTimezone, true).tz(hostTimezone).minute(0), dayjs(maxEndDate.endDate.slice(0, 19)).tz(maxEndDate?.timezone || userTimezone, true).tz(hostTimezone).minute(15), 'minute', '[)')
        ? 15
        : dayjs(maxEndDate.endDate.slice(0, 19)).tz(maxEndDate?.timezone || userTimezone, true).tz(hostTimezone).isBetween(dayjs(maxEndDate.endDate.slice(0, 19)).tz(maxEndDate?.timezone || userTimezone, true).tz(hostTimezone).minute(15), dayjs(maxEndDate.endDate.slice(0, 19)).tz(maxEndDate?.timezone || userTimezone, true).tz(hostTimezone).minute(30), 'minute', '[)')
            ? 30
            : dayjs(maxEndDate.endDate.slice(0, 19)).tz(maxEndDate?.timezone || userTimezone, true).tz(hostTimezone).isBetween(dayjs(maxEndDate.endDate.slice(0, 19)).tz(maxEndDate?.timezone || userTimezone, true).tz(hostTimezone).minute(30), dayjs(maxEndDate.endDate.slice(0, 19)).tz(maxEndDate?.timezone || userTimezone, true).tz(hostTimezone).minute(45), 'minute', '[)')
                ? 45
                : 0
    if (workEndMinuteByHost === 0) {
        if (workEndHourByHost < 23) {
            workEndHourByHost += 1
        }
    }

    const workStartHourByHost = dayjs(minStartDate.startDate.slice(0, 19)).tz(minStartDate?.timezone || userTimezone, true).tz(hostTimezone).hour()
    const workStartMinuteByHost = dayjs(minStartDate.startDate.slice(0, 19)).tz(minStartDate?.timezone || userTimezone, true).tz(hostTimezone)
        .isBetween(dayjs(minStartDate.startDate.slice(0, 19)).tz(minStartDate?.timezone || userTimezone, true).tz(hostTimezone).minute(0), dayjs(minStartDate.startDate.slice(0, 19)).tz(minStartDate?.timezone || userTimezone, true).tz(hostTimezone).minute(15), 'minute', '[)')
        ? 0
        : dayjs(minStartDate.startDate.slice(0, 19)).tz(minStartDate?.timezone || userTimezone, true).tz(hostTimezone).isBetween(dayjs(minStartDate.startDate.slice(0, 19)).tz(minStartDate?.timezone || userTimezone, true).tz(hostTimezone).minute(15), dayjs(minStartDate.startDate.slice(0, 19)).tz(minStartDate?.timezone || userTimezone, true).tz(hostTimezone).minute(30), 'minute', '[)')
            ? 15
            : dayjs(minStartDate.startDate.slice(0, 19)).tz(minStartDate?.timezone || userTimezone, true).tz(hostTimezone).isBetween(dayjs(minStartDate.startDate.slice(0, 19)).tz(minStartDate?.timezone || userTimezone, true).tz(hostTimezone).minute(30), dayjs(minStartDate.startDate.slice(0, 19)).tz(minStartDate?.timezone || userTimezone, true).tz(hostTimezone).minute(45), 'minute', '[)')
                ? 30
                : 45

    
    const startDuration = dayjs.duration({ hours: workStartHourByHost, minutes: workStartMinuteByHost })
    const endDuration = dayjs.duration({ hours: workEndHourByHost, minutes: workEndMinuteByHost })
    const totalDuration = endDuration.subtract(startDuration)
    const totalMinutes = totalDuration.asMinutes()
    const timeSlots: TimeSlotType[] = []
    for (let i = 0; i < totalMinutes; i += 15) {
        timeSlots.push({
            dayOfWeek: dayOfWeekIntToString[dayOfWeekIntByHost],
            startTime: dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).hour(workStartHourByHost).minute(workStartMinuteByHost).add(i, 'minute').format('HH:mm') as Time,
            endTime: dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).hour(workStartHourByHost).minute(workStartMinuteByHost).add(i + 15, 'minute').format('HH:mm') as Time,
            hostId,
            monthDay: formatToMonthDay(monthByHost as MonthType, dayOfMonthByHost as DayType)
        })
    }

    
    return timeSlots

}

export const generateTimeSlotsLiteForExternalAttendee = (
    hostStartDate: string,
    hostId: string,
    attendeeEvents: EventPlusType[],
    hostTimezone: string,
    userTimezone: string,
    isFirstDay?: boolean,
) => {
    if (isFirstDay) {
        const dayOfWeekIntByHost = getISODay(dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).toDate())
        // convert to host timezone so everything is linked to host timezone
        const monthByHost = dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).month()
        const dayOfMonthByHost = dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).date()
        const startHourOfHostDateByHost = dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).hour()
        const startMinuteOfHostDateByHost = dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true)
            .isBetween(dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).minute(0), dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).minute(30), 'minute', '[)')
            ? 0
            : dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).isBetween(dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).minute(30), dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).minute(59), 'minute', '[)')
                ? 30
                : 0

        const sameDayEvents = attendeeEvents.filter(e => (getISODay(dayjs(e.startDate.slice(0, 19)).tz(e?.timezone || userTimezone, true).tz(hostTimezone).toDate()) === (dayOfWeekIntByHost)))
        // const minStartDate = _.minBy(sameDayEvents, (e) => dayjs(e.startDate.slice(0, 19)).tz(userTimezone, true).tz(hostTimezone).unix())
        const maxEndDate = _.maxBy(sameDayEvents, (e) => dayjs(e.endDate.slice(0, 19)).tz(e?.timezone || userTimezone, true).tz(hostTimezone).unix())

        let workEndHourByHost = dayjs(maxEndDate.endDate.slice(0, 19)).tz(maxEndDate?.timezone || userTimezone, true).tz(hostTimezone).hour()
        const workEndMinuteByHost = dayjs(maxEndDate.endDate.slice(0, 19)).tz(maxEndDate?.timezone || userTimezone, true).tz(hostTimezone)
            .isBetween(dayjs(maxEndDate.endDate.slice(0, 19)).tz(maxEndDate?.timezone || userTimezone, true).tz(hostTimezone).minute(0), dayjs(maxEndDate.endDate.slice(0, 19)).tz(maxEndDate?.timezone || userTimezone, true).tz(hostTimezone).minute(30), 'minute', '[)')
            ? 30
            : dayjs(maxEndDate.endDate.slice(0, 19)).tz(maxEndDate?.timezone || userTimezone, true).tz(hostTimezone).isBetween(dayjs(maxEndDate.endDate.slice(0, 19)).tz(maxEndDate?.timezone || userTimezone, true).tz(hostTimezone).minute(30), dayjs(maxEndDate.endDate.slice(0, 19)).tz(maxEndDate?.timezone || userTimezone, true).tz(hostTimezone).minute(59), 'minute', '[)')
                ? 0
                : 30
        if (workEndMinuteByHost === 0) {
            if (workEndHourByHost < 23) {
                workEndHourByHost += 1
            }
        }

        const minStartDate = _.minBy(sameDayEvents, (e) => dayjs(e.startDate.slice(0, 19)).tz(e?.timezone || userTimezone, true).tz(hostTimezone).unix())

        const workStartHourByHost = dayjs(minStartDate.startDate.slice(0, 19)).tz(minStartDate?.timezone || userTimezone, true).tz(hostTimezone).hour()
        const workStartMinuteByHost = dayjs(minStartDate.startDate.slice(0, 19)).tz(minStartDate?.timezone || userTimezone, true).tz(hostTimezone)
            .isBetween(dayjs(minStartDate.startDate.slice(0, 19)).tz(minStartDate?.timezone || userTimezone, true).tz(hostTimezone).minute(0), dayjs(minStartDate.startDate.slice(0, 19)).tz(minStartDate?.timezone || userTimezone, true).tz(hostTimezone).minute(30), 'minute', '[)')
            ? 0
            : dayjs(minStartDate.startDate.slice(0, 19)).tz(minStartDate?.timezone || userTimezone, true).tz(hostTimezone).isBetween(dayjs(minStartDate.startDate.slice(0, 19)).tz(minStartDate?.timezone || userTimezone, true).tz(hostTimezone).minute(30), dayjs(minStartDate.startDate.slice(0, 19)).tz(minStartDate?.timezone || userTimezone, true).tz(hostTimezone).minute(59), 'minute', '[)')
                ? 30
                : 0

        // change to work start time as work start time is  after host start time
        if (dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).isBefore(dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).hour(workStartHourByHost).minute(workStartMinuteByHost))) {

            const startDuration = dayjs.duration({ hours: workStartHourByHost, minutes: workStartMinuteByHost })
            const endDuration = dayjs.duration({ hours: workEndHourByHost, minutes: workEndMinuteByHost })
            const totalDuration = endDuration.subtract(startDuration)
            const totalMinutes = totalDuration.asMinutes()

            const timeSlots: TimeSlotType[] = []

            
            for (let i = 0; i < totalMinutes; i += 30) {
                timeSlots.push({
                    dayOfWeek: dayOfWeekIntToString[dayOfWeekIntByHost],
                    startTime: dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).hour(startHourOfHostDateByHost).minute(startMinuteOfHostDateByHost).add(i, 'minute').format('HH:mm') as Time,
                    endTime: dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).hour(startHourOfHostDateByHost).minute(startMinuteOfHostDateByHost).add(i + 30, 'minute').format('HH:mm') as Time,
                    hostId,
                    monthDay: formatToMonthDay(monthByHost as MonthType, dayOfMonthByHost as DayType)
                })
            }
            
            return timeSlots
        }

        const startDuration = dayjs.duration({ hours: startHourOfHostDateByHost, minutes: startMinuteOfHostDateByHost })
        const endDuration = dayjs.duration({ hours: workEndHourByHost, minutes: workEndMinuteByHost })
        const totalDuration = endDuration.subtract(startDuration)
        const totalMinutes = totalDuration.asMinutes()

        const timeSlots: TimeSlotType[] = []
        
        for (let i = 0; i < totalMinutes; i += 30) {
            timeSlots.push({
                dayOfWeek: dayOfWeekIntToString[dayOfWeekIntByHost],
                startTime: dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).hour(startHourOfHostDateByHost).minute(startMinuteOfHostDateByHost).add(i, 'minute').format('HH:mm') as Time,
                endTime: dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).hour(startHourOfHostDateByHost).minute(startMinuteOfHostDateByHost).add(i + 30, 'minute').format('HH:mm') as Time,
                hostId,
                monthDay: formatToMonthDay(monthByHost as MonthType, dayOfMonthByHost as DayType)
            })
        }

        
        return timeSlots
    }

    // not first day start from work start time schedule

    const dayOfWeekIntByHost = getISODay(dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).toDate())
    // convert to host timezone so everything is linked to host timezone
    const monthByHost = dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).month()
    const dayOfMonthByHost = dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).date()

    const sameDayEvents = attendeeEvents.filter(e => (getISODay(dayjs(e.startDate.slice(0, 19)).tz(userTimezone, true).tz(hostTimezone).toDate()) === (dayOfWeekIntByHost)))
    const minStartDate = _.minBy(sameDayEvents, (e) => dayjs(e.startDate.slice(0, 19)).tz(userTimezone, true).tz(hostTimezone).unix())
    const maxEndDate = _.maxBy(sameDayEvents, (e) => dayjs(e.endDate.slice(0, 19)).tz(userTimezone, true).tz(hostTimezone).unix())

    let workEndHourByHost = dayjs(maxEndDate.endDate.slice(0, 19)).tz(maxEndDate?.timezone || userTimezone, true).tz(hostTimezone).hour()
    const workEndMinuteByHost = dayjs(maxEndDate.endDate.slice(0, 19)).tz(maxEndDate?.timezone || userTimezone, true).tz(hostTimezone)
        .isBetween(dayjs(maxEndDate.endDate.slice(0, 19)).tz(maxEndDate?.timezone || userTimezone, true).tz(hostTimezone).minute(0), dayjs(maxEndDate.endDate.slice(0, 19)).tz(maxEndDate?.timezone || userTimezone, true).tz(hostTimezone).minute(30), 'minute', '[)')
        ? 30
        : dayjs(maxEndDate.endDate.slice(0, 19)).tz(maxEndDate?.timezone || userTimezone, true).tz(hostTimezone).isBetween(dayjs(maxEndDate.endDate.slice(0, 19)).tz(maxEndDate?.timezone || userTimezone, true).tz(hostTimezone).minute(30), dayjs(maxEndDate.endDate.slice(0, 19)).tz(maxEndDate?.timezone || userTimezone, true).tz(hostTimezone).minute(59), 'minute', '[)')
            ? 0
            : 30
    if (workEndMinuteByHost === 0) {
        if (workEndHourByHost < 23) {
            workEndHourByHost += 1
        }
    }

    const workStartHourByHost = dayjs(minStartDate.startDate.slice(0, 19)).tz(minStartDate?.timezone || userTimezone, true).tz(hostTimezone).hour()
    const workStartMinuteByHost = dayjs(minStartDate.startDate.slice(0, 19)).tz(minStartDate?.timezone || userTimezone, true).tz(hostTimezone)
        .isBetween(dayjs(minStartDate.startDate.slice(0, 19)).tz(minStartDate?.timezone || userTimezone, true).tz(hostTimezone).minute(0), dayjs(minStartDate.startDate.slice(0, 19)).tz(minStartDate?.timezone || userTimezone, true).tz(hostTimezone).minute(30), 'minute', '[)')
        ? 0
        : dayjs(minStartDate.startDate.slice(0, 19)).tz(minStartDate?.timezone || userTimezone, true).tz(hostTimezone).isBetween(dayjs(minStartDate.startDate.slice(0, 19)).tz(minStartDate?.timezone || userTimezone, true).tz(hostTimezone).minute(30), dayjs(minStartDate.startDate.slice(0, 19)).tz(minStartDate?.timezone || userTimezone, true).tz(hostTimezone).minute(59), 'minute', '[)')
            ? 30
            : 0

    
    const startDuration = dayjs.duration({ hours: workStartHourByHost, minutes: workStartMinuteByHost })
    const endDuration = dayjs.duration({ hours: workEndHourByHost, minutes: workEndMinuteByHost })
    const totalDuration = endDuration.subtract(startDuration)
    const totalMinutes = totalDuration.asMinutes()
    const timeSlots: TimeSlotType[] = []
    for (let i = 0; i < totalMinutes; i += 30) {
        timeSlots.push({
            dayOfWeek: dayOfWeekIntToString[dayOfWeekIntByHost],
            startTime: dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).hour(workStartHourByHost).minute(workStartMinuteByHost).add(i, 'minute').format('HH:mm') as Time,
            endTime: dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).hour(workStartHourByHost).minute(workStartMinuteByHost).add(i + 30, 'minute').format('HH:mm') as Time,
            hostId,
            monthDay: formatToMonthDay(monthByHost as MonthType, dayOfMonthByHost as DayType)
        })
    }

    
    return timeSlots

}

export const processEventsForOptaPlannerForExternalAttendees = async (
    userIds: string[],
    mainHostId: string,
    allExternalEvents: MeetingAssistEventType[],
    windowStartDate: string,
    windowEndDate: string,
    hostTimezone: string,
    externalAttendees: MeetingAssistAttendeeType[],
    oldExternalMeetingEvents?: EventMeetingPlusType[], // converted from external events
): Promise<ReturnBodyForExternalAttendeeForOptaplannerPrepType> => {
    try {
        const modifiedAllExternalEvents = allExternalEvents.map(e => convertMeetingAssistEventTypeToEventPlusType(e, externalAttendees.find(a => (a.id === e.attendeeId))?.userId))

        // add newly generated meeting event to rest
        const oldConvertedMeetingEvents = oldExternalMeetingEvents.map(a => convertMeetingPlusTypeToEventPlusType(a))?.filter(e => !!e)
        if (oldConvertedMeetingEvents?.length > 0) {
            modifiedAllExternalEvents.push(...oldConvertedMeetingEvents)
        }

        // generate timeslots

        const diffDays = dayjs(windowEndDate.slice(0, 19)).diff(dayjs(windowStartDate.slice(0, 19)), 'day')

        const startDatesForEachDay = []

        for (let i = 0; i <= diffDays; i++) {
            startDatesForEachDay.push(dayjs(windowStartDate.slice(0, 19)).tz(hostTimezone, true).add(i, 'day').format())

        }

        const unfilteredWorkTimes: WorkTimeType[] = []

        for (const externalAttendee of externalAttendees) {
            const workTimesForAttendee = generateWorkTimesForExternalAttendee(mainHostId, externalAttendee?.userId, modifiedAllExternalEvents, hostTimezone, externalAttendee?.timezone)
            unfilteredWorkTimes.push(...workTimesForAttendee)
        }

        const workTimes: WorkTimeType[] = _.uniqWith(unfilteredWorkTimes, _.isEqual)


        const unfilteredTimeslots: TimeSlotType[] = []
        const timeslots: TimeSlotType[] = []

       
        for (let i = 0; i < startDatesForEachDay.length; i++) {
            if (i === 0) {
                for (const externalAttendee of externalAttendees) {
                    // const mostRecentEvent = _.minBy(modifiedAllExternalEvents, (e) => dayjs(e?.startDate).unix())
                    const timeslotsForDay = await generateTimeSlotsLiteForExternalAttendee(startDatesForEachDay?.[i], mainHostId, modifiedAllExternalEvents, hostTimezone, externalAttendee?.timezone, true)
                    unfilteredTimeslots.push(...timeslotsForDay)
                }

                continue
            }
            for (const externalAttendee of externalAttendees) {
                const timeslotsForDay = await generateTimeSlotsLiteForExternalAttendee(startDatesForEachDay?.[i], mainHostId, modifiedAllExternalEvents, hostTimezone, externalAttendee?.timezone, false)
                unfilteredTimeslots.push(...timeslotsForDay)
            }
        }
        timeslots.push(...(_.uniqWith(unfilteredTimeslots, _.isEqual)))
            
        

        // generate event parts
        const filteredAllEvents = _.uniqBy(modifiedAllExternalEvents.filter(e => (validateEventDatesForExternalAttendee(e))), 'id')
        let eventParts: EventPartPlannerRequestBodyType[] = []
     
        const eventPartMinisAccumulated = []
        for (const event of filteredAllEvents) {

            const eventPartMinis = generateEventPartsLite(event, mainHostId)
            eventPartMinisAccumulated.push(...eventPartMinis)
        }

        const modifiedEventPartMinisPreBuffer = modifyEventPartsForMultiplePreBufferTime(eventPartMinisAccumulated)
        const modifiedEventPartMinisPreAndPostBuffer = modifyEventPartsForMultiplePostBufferTime(modifiedEventPartMinisPreBuffer)
        const formattedEventParts: EventPartPlannerRequestBodyType[] = modifiedEventPartMinisPreAndPostBuffer.map(e => formatEventTypeToPlannerEventForExternalAttendee(e, workTimes, filteredAllEvents, hostTimezone))
        if (formattedEventParts.length > 0) {
            eventParts.push(...formattedEventParts)
        }
        

        if (eventParts.length > 0) {
            
            const newEventPartsWithPreferredTimeSet = eventParts.map(e => setPreferredTimeForUnModifiableEvent(e, allExternalEvents.find(f => (f.id === e.eventId))?.timezone))
           
            const newEventParts = await tagEventsForDailyOrWeeklyTask(newEventPartsWithPreferredTimeSet)
           
            const userList: UserPlannerRequestBodyType[] = []
            for (const externalAttendee of externalAttendees) {
                const userPlannerRequestBody = generateUserPlannerRequestBodyForExternalAttendee(externalAttendee?.userId, workTimes, mainHostId)
                
                userList.push(userPlannerRequestBody)
            }


            const modifiedNewEventParts: EventPartPlannerRequestBodyType[] = newEventParts.map((eventPart) => {
                const oldEvent = filteredAllEvents?.find((event) => (event.id === eventPart.eventId))
                return {
                    groupId: eventPart?.groupId,
                    eventId: eventPart?.eventId,
                    part: eventPart?.part,
                    lastPart: eventPart?.lastPart,
                    meetingId: eventPart?.meetingId,
                    hostId: mainHostId,
                    startDate: dayjs(eventPart?.startDate.slice(0, 19)).tz(oldEvent.timezone, true).tz(hostTimezone).format(),
                    endDate: dayjs(eventPart?.endDate.slice(0, 19)).tz(oldEvent.timezone, true).tz(hostTimezone).format(),
                    userId: eventPart?.userId,
                    user: eventPart?.user,
                    priority: eventPart?.priority,
                    isPreEvent: eventPart?.isPreEvent,
                    isPostEvent: eventPart?.isPostEvent,
                    positiveImpactScore: eventPart?.positiveImpactScore,
                    negativeImpactScore: eventPart?.negativeImpactScore,
                    modifiable: eventPart?.modifiable,
                    isMeeting: eventPart?.isMeeting,
                    isExternalMeeting: eventPart?.isExternalMeeting,
                    isExternalMeetingModifiable: eventPart?.isExternalMeetingModifiable,
                    isMeetingModifiable: eventPart?.isMeetingModifiable,
                    dailyTaskList: eventPart?.dailyTaskList,
                    weeklyTaskList: eventPart?.weeklyTaskList,
                    gap: eventPart?.gap,
                    totalWorkingHours: eventPart?.totalWorkingHours,
                    hardDeadline: eventPart?.hardDeadline,
                    softDeadline: eventPart?.softDeadline,
                    forEventId: eventPart?.forEventId,
                    positiveImpactDayOfWeek: eventPart?.positiveImpactDayOfWeek,
                    positiveImpactTime: eventPart?.positiveImpactTime,
                    negativeImpactDayOfWeek: eventPart?.negativeImpactDayOfWeek,
                    negativeImpactTime: eventPart?.negativeImpactTime,
                    preferredDayOfWeek: eventPart?.preferredDayOfWeek,
                    preferredTime: eventPart?.preferredTime,
                    preferredStartTimeRange: eventPart?.preferredStartTimeRange,
                    preferredEndTimeRange: eventPart?.preferredEndTimeRange,
                    event: eventPart?.event,
                }
            })


            return modifiedNewEventParts?.length > 0
                ? {
                    userIds,
                    hostId: mainHostId,
                    eventParts: modifiedNewEventParts,
                    allEvents: filteredAllEvents,
                    oldAttendeeEvents: allExternalEvents,
                    timeslots,
                    userList,
                } : null
        }
    } catch (e) {
        
    }
}

export const optaPlanWeekly = async (
    timeslots: TimeSlotType[],
    userList: UserPlannerRequestBodyType[],
    eventParts: EventPartPlannerRequestBodyType[],
    singletonId: string,
    hostId: string,
    fileKey: string,
    delay: number,
    callBackUrl: string,
) => {
    try {
        // populate timeslots with events
        const requestBody: PlannerRequestBodyType = {
            singletonId,
            hostId,
            timeslots,
            userList,
            eventParts,
            fileKey,
            delay,
            callBackUrl,
        }

        await got.post(
            `${optaPlannerUrl}/timeTable/admin/solve-day`,
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Basic ${Buffer.from(`${optaPlannerUsername}:${optaPlannerPassword}`).toString('base64')}`,
                },
                json: requestBody,
            }
        ).json()

        
    } catch (e) {
        
    }
}

export const updateFreemiumById = async (
    id: string,
    usage: number,
) => {
    try {
        const operationName = 'UpdateFreemiumById'
        const query = `
            mutation UpdateFreemiumById($id: uuid!, $usage: Int!) {
                update_Freemium_by_pk(pk_columns: {id: $id}, _set: {usage: $usage}) {
                    createdAt
                    id
                    period
                    updatedAt
                    usage
                    userId
                }
            }
        `

        const variables = {
            id,
            usage,
        }

        const response: { data: { update_Freemium_by_pk: FreemiumType, } } = await got.post(hasuraGraphUrl, {
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
        

        return response?.data?.update_Freemium_by_pk
    } catch (e) {
        
    }
}

export const getFreemiumByUserId = async (
    userId: string,
) => {
    try {
        const operationName = 'GetFreemiumByUserId'
        const query = `
            query GetFreemiumByUserId($userId: uuid!) {
                Freemium(where: {userId: {_eq: $userId}}) {
                    createdAt
                    id
                    period
                    updatedAt
                    usage
                    userId
                }
            }
        `

        const variables = {
            userId,
        }

        const res: { data: { Freemium: FreemiumType[] } } = await got.post(
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

        

        return res?.data?.Freemium?.[0]
    } catch (e) {
        
    }
}

// attendeeMeetingEvents include hostMeeting as well
export const processEventsForOptaPlanner = async (
    mainHostId: string,
    internalAttendees: MeetingAssistAttendeeType[],
    meetingEventPlus: EventMeetingPlusType[], // events with a meetingId
    allEvents: EventPlusType[],
    windowStartDate: string,
    windowEndDate: string,
    hostTimezone: string,
    oldEvents: EventType[],
    externalAttendees?: MeetingAssistAttendeeType[],
    meetingAssistEvents?: MeetingAssistEventType[],
    newHostReminders?: RemindersForEventType[],
    newHostBufferTimes?: BufferTimeObjectType[],
) => {
    try {

        const freemiumOfUser = await getFreemiumByUserId(mainHostId)

        const allHostEvents = allEvents.filter(e => (e.userId === mainHostId))

        const oldHostEvents = oldEvents.filter(e => (e?.userId === mainHostId))

        // either or - either there are internal attendees that have main host included
        // or main host is not part of internal attendees

        const hostIsInternalAttendee = internalAttendees.some(ia => (ia?.userId === mainHostId))


        let returnValuesFromInternalAttendees: ReturnBodyForAttendeeForOptaplannerPrepType | {} = {}
        let returnValuesFromHost: ReturnBodyForHostForOptaplannerPrepType | {} = {}

        if (hostIsInternalAttendee) {

            returnValuesFromInternalAttendees = await processEventsForOptaPlannerForInternalAttendees(
                mainHostId,
                allEvents,
                windowStartDate,
                windowEndDate,
                hostTimezone,
                internalAttendees,
                oldEvents,
                meetingEventPlus,
                newHostReminders,
                newHostBufferTimes,
            )
        } else {
            // host is not part of internal attendees
            returnValuesFromHost = await processEventsForOptaPlannerForMainHost(
                mainHostId,
                allHostEvents,
                windowStartDate,
                windowEndDate,
                hostTimezone,
                oldHostEvents,
                newHostReminders,
                newHostBufferTimes,
            )
        }

        const externalMeetingEventPlus = meetingEventPlus.map(e => {
            const foundIndex = externalAttendees?.findIndex(a => (a?.userId === e?.userId))
            if (foundIndex > -1) {
                return e
            }
            return null
        })?.filter(e => (e !== null))

        const returnValuesFromExternalAttendees: ReturnBodyForExternalAttendeeForOptaplannerPrepType = externalAttendees?.length > 0 ? await processEventsForOptaPlannerForExternalAttendees(
            externalAttendees?.map(a => a.userId),
            mainHostId,
            meetingAssistEvents,
            windowStartDate,
            windowEndDate,
            hostTimezone,
            externalAttendees,
            externalMeetingEventPlus, // events with meetingId
        ) : null

        const eventParts: EventPartPlannerRequestBodyType[] = []
        const allEventsForPlanner: EventPlusType[] = []
        const breaks: EventPlusType[] = []
        const oldEventsForPlanner: EventPlusType[] = []
        const oldAttendeeEvents: MeetingAssistEventType[] = []
        const unfilteredTimeslots: TimeSlotType[] = []
        const unfilteredUserList: UserPlannerRequestBodyType[] = []

        // validate
        if (!((returnValuesFromHost as ReturnBodyForHostForOptaplannerPrepType)?.eventParts?.length > 0)) {
            throw new Error('no event parts produced something went wrong in optaplanner')
        }

        // start filling up the arrays for optaPlanner
        if ((returnValuesFromHost as ReturnBodyForHostForOptaplannerPrepType)?.eventParts?.length > 0) {
            eventParts.push(...((returnValuesFromHost as ReturnBodyForHostForOptaplannerPrepType)?.eventParts))

        }

        if (allHostEvents?.length > 0) {
            allEventsForPlanner.push(...allHostEvents)
        }


        if ((returnValuesFromHost as ReturnBodyForHostForOptaplannerPrepType)?.breaks?.length > 0) {
            breaks.push(...((returnValuesFromHost as ReturnBodyForHostForOptaplannerPrepType)?.breaks))
        }

        if ((returnValuesFromHost as ReturnBodyForHostForOptaplannerPrepType)?.oldEvents?.length > 0) {
            oldEventsForPlanner.push(...((returnValuesFromHost as ReturnBodyForHostForOptaplannerPrepType)?.oldEvents))
        }

        if ((returnValuesFromHost as ReturnBodyForHostForOptaplannerPrepType)?.timeslots?.length > 0) {
            unfilteredTimeslots.push(...((returnValuesFromHost as ReturnBodyForHostForOptaplannerPrepType)?.timeslots))
        }

        if ((returnValuesFromHost as ReturnBodyForHostForOptaplannerPrepType)?.userPlannerRequestBody?.id) {
            unfilteredUserList.push((returnValuesFromHost as ReturnBodyForHostForOptaplannerPrepType)?.userPlannerRequestBody)
        }


        if ((returnValuesFromInternalAttendees as ReturnBodyForAttendeeForOptaplannerPrepType)?.userList?.[0]?.id) {

            unfilteredUserList.push(...((returnValuesFromInternalAttendees as ReturnBodyForAttendeeForOptaplannerPrepType)?.userList))
        }

        if ((returnValuesFromInternalAttendees as ReturnBodyForAttendeeForOptaplannerPrepType)?.eventParts?.length > 0) {
            eventParts.push(...((returnValuesFromInternalAttendees as ReturnBodyForAttendeeForOptaplannerPrepType)?.eventParts))
        }

        if ((returnValuesFromInternalAttendees as ReturnBodyForAttendeeForOptaplannerPrepType)?.allEvents?.length > 0) {
            allEventsForPlanner.push(...((returnValuesFromInternalAttendees as ReturnBodyForAttendeeForOptaplannerPrepType)?.allEvents))
        }

        if (((returnValuesFromInternalAttendees as ReturnBodyForAttendeeForOptaplannerPrepType)?.oldEvents?.length > 0)) {
            oldEventsForPlanner.push(...((returnValuesFromInternalAttendees as ReturnBodyForAttendeeForOptaplannerPrepType)?.oldEvents))
        }

        if ((returnValuesFromInternalAttendees as ReturnBodyForAttendeeForOptaplannerPrepType)?.timeslots?.length > 0) {
            unfilteredTimeslots.push(...((returnValuesFromInternalAttendees as ReturnBodyForAttendeeForOptaplannerPrepType)?.timeslots))
        }



        if (returnValuesFromExternalAttendees?.eventParts?.length > 0) {
            eventParts.push(...(returnValuesFromExternalAttendees?.eventParts))

        }

        if ((returnValuesFromExternalAttendees?.allEvents)?.length > 0) {
            allEventsForPlanner.push(...(returnValuesFromExternalAttendees?.allEvents))
        }

        if (returnValuesFromExternalAttendees?.oldAttendeeEvents?.length > 0) {
            oldAttendeeEvents.push(...(returnValuesFromExternalAttendees?.oldAttendeeEvents))
        }

        if (returnValuesFromExternalAttendees?.timeslots?.length > 0) {
            unfilteredTimeslots.push(...(returnValuesFromExternalAttendees?.timeslots))
        }

        if (returnValuesFromExternalAttendees?.userList?.length > 0) {
            unfilteredUserList.push(...(returnValuesFromExternalAttendees?.userList))
        }


        // create duplicate free data
        const duplicateFreeEventParts = _.uniqWith(eventParts, _.isEqual)
        const duplicateFreeAllEvents = _.uniqWith(allEventsForPlanner, _.isEqual)
        const duplicateFreeBreaks = _.uniqWith(breaks, _.isEqual)
        const duplicateFreeOldEvents = _.uniqWith(oldEvents, _.isEqual)
        const duplicateFreeOldAttendeeEvents = _.uniqWith(oldAttendeeEvents, _.isEqual)
        const duplicateFreeTimeslots = _.uniqWith(unfilteredTimeslots, _.isEqual)
        const singletonId = uuid()

        // validate eventParts
        if (!duplicateFreeEventParts || (duplicateFreeEventParts?.length === 0)) {
            throw new Error('Event Parts length is 0 or do not exist')
        }

        const params = {
            Body: JSON.stringify({
                singletonId,
                hostId: mainHostId,
                eventParts: duplicateFreeEventParts,
                allEvents: duplicateFreeAllEvents,
                breaks: duplicateFreeBreaks,
                oldEvents: duplicateFreeOldEvents,
                oldAttendeeEvents: duplicateFreeOldAttendeeEvents,
                newHostReminders,
                newHostBufferTimes,
            }),
            Bucket: bucketName,
            Key: `${mainHostId}/${singletonId}.json`,
            ContentType: 'application/json',
        }

        const s3Command = new PutObjectCommand(params)

        const s3Response = await s3Client.send(s3Command)

        

        await optaPlanWeekly(duplicateFreeTimeslots,
            unfilteredUserList,
            duplicateFreeEventParts,
            singletonId,
            mainHostId,
            `${mainHostId}/${singletonId}.json`,
            calendarProDelay,
            onOptaPlanCalendarAdminCallBackUrl,
        )
        
        // update freemium if not active subscription

        if (!(activeSubscriptions?.length > 0)) {
            await updateFreemiumById(freemiumOfUser?.id, freemiumOfUser?.usage - 1)
        }

    } catch (e) {
        
    }
}

export const getUserCategories = async (userId) => {
    try {
        const operationName = 'getUserCategories'
        const query = `
      query getUserCategories($userId: uuid!) {
        Category(where: {userId: {_eq: $userId}}) {
          name
          userId
          copyAvailability
          copyTimeBlocking
          copyTimePreference
          copyReminders
          copyPriorityLevel
          copyModifiable
          defaultAvailability
          defaultTimeBlocking
          defaultTimePreference
          defaultReminders
          defaultPriorityLevel
          defaultModifiable
          copyIsBreak
          color
          deleted
          id
          updatedAt
        }
      }
    `
        const variables = {
            userId
        }

        const res: { data: { Category: CategoryType[] } } = await got.post(
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
            }
        ).json()

        return res?.data?.Category
    } catch (e) {
        
    }
}

export const findBestMatchCategory2 = async (event: EventPlusType, possibleLabels: CategoryType[]): Promise<ClassificationResponseBodyType> => {
    try {
        // validate
        if (!event) {
            throw new Error('no event passed inside findBestMatchCategory2')
        }

        if (!possibleLabels) {
            throw new Error('no possible labels passed inside findBestMatchCategory2')
        }

        const { summary, notes } = event
        const sentence = `${summary}${notes ? `: ${notes}` : ''}`

        const res: ClassificationResponseBodyType = await got.post(
            classificationUrl,
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Basic ${Buffer.from(`admin:${authApiToken}`).toString('base64')}`,
                },
                json: {
                    sentence,
                    labels: possibleLabels.map(a => a?.name),
                },
            }
        ).json()
        
        return res
    } catch (e) {
        
    }
}

export const processBestMatchCategories = (body: ClassificationResponseBodyType, newPossibleLabels: string[]) => {
    const { scores } = body
    let bestMatchCategory = ''
    let bestMatchScore = 0
    for (let i = 0; i < newPossibleLabels.length; i++) {
        const label = newPossibleLabels[i]
        const score = scores[i]
        if (score > minThresholdScore) {
            if (score > bestMatchScore) {
                bestMatchCategory = label
                bestMatchScore = score
            }
        }
    }

    return bestMatchCategory
}

const addToBestMatchCategories = (newEvent: EventPlusType, newPossibleLabels: string[], scores: number[], categories: CategoryType[]): CategoryType[] | [] => {
    const bestMatchCategories = []

    //  if meeting  categories meet threshold add to results
    const meetingIndex = newPossibleLabels.indexOf(meetingLabel)
    const externalMeetingIndex = newPossibleLabels.indexOf(externalMeetingLabel)

    if ((meetingIndex > -1) && (scores[meetingIndex] > minThresholdScore)) {
        bestMatchCategories.push(categories?.find(category => category.name === meetingLabel))
    }

    if ((externalMeetingIndex > -1) && (scores[externalMeetingIndex] > minThresholdScore)) {
        bestMatchCategories.push(categories?.find(category => category.name === externalMeetingLabel))
    }

    // if event is classified as meeting type or external type then also copy over
    if (newEvent.isMeeting && (meetingIndex > -1)) {
        bestMatchCategories.push(categories?.find(category => category.name === meetingLabel))
    }

    if (newEvent.isExternalMeeting && (externalMeetingIndex > -1)) {
        bestMatchCategories.push(categories?.find(category => category.name === externalMeetingLabel))
    }

    return bestMatchCategories

}


export const processEventForMeetingTypeCategories = (newEvent: EventPlusType, bestMatchCategory: CategoryType, newPossibleLabels: string[], scores: number[], categories: CategoryType[]): CategoryType[] | [] => {
    // include meeting and conference types if any

    const bestMatchCategories = addToBestMatchCategories(newEvent, newPossibleLabels, scores, categories)

    if (bestMatchCategories?.length > 0) {
        return (bestMatchCategories as CategoryType[]).concat([bestMatchCategory])

    }

    return [bestMatchCategory]

}

export const getUniqueLabels = (labels: CategoryType[]) => {
    const uniqueLabels = _.uniqBy(labels, 'id')
    return uniqueLabels
}

export const copyOverCategoryDefaults = (event: EventPlusType, category: CategoryType): EventPlusType => {

    return {
        ...event,
        transparency: !event?.userModifiedAvailability ? (category?.defaultAvailability ? 'transparent' : 'opaque') : event.transparency,
        // preferredDayOfWeek: !event?.userModifiedTimePreference ? (category?.defaultTimePreference?.preferredDayOfWeek) : event.preferredDayOfWeek,
        // preferredTime: !event?.userModifiedTimePreference ? (category?.defaultTimePreference?.preferredTime) : event.preferredTime,
        // preferredStartTimeRange: !event?.userModifiedTimePreference ? (category?.defaultTimePreference?.preferredStartTimeRange) : event.preferredStartTimeRange,
        // preferredEndTimeRange: !event?.userModifiedTimePreference ? (category?.defaultTimePreference?.preferredEndTimeRange) : event.preferredEndTimeRange,
        priority: (!event?.userModifiedPriorityLevel ? (category?.defaultPriorityLevel) : event?.priority) || 1,
        modifiable: !event?.userModifiedModifiable ? (category?.defaultModifiable) : event.modifiable,
        isBreak: !event?.userModifiedIsBreak ? (category?.defaultIsBreak) : event.isBreak,
        isMeeting: !event?.userModifiedIsMeeting ? (category?.defaultIsMeeting) : (category?.name === meetingLabel ? true : event.isMeeting),
        isExternalMeeting: !event?.userModifiedIsExternalMeeting ? (category?.defaultIsExternalMeeting) : (category?.name === externalMeetingLabel ? true : event.isExternalMeeting),
        isMeetingModifiable: !event?.userModifiedModifiable ? (category?.defaultMeetingModifiable) : event.isMeetingModifiable,
        isExternalMeetingModifiable: !event?.userModifiedModifiable ? (category?.defaultExternalMeetingModifiable) : event.isExternalMeetingModifiable,
        backgroundColor: !event?.userModifiedColor ? (category?.color) : event.backgroundColor,
        preferredTimeRanges: !event?.userModifiedTimePreference && (category?.defaultTimePreference?.length > 0)
            ? (category?.defaultTimePreference?.map(tp => ({ ...tp, id: uuid(), eventId: event?.id, createdDate: dayjs().toISOString(), updatedAt: dayjs().toISOString(), userId: event?.userId })))
            : event.preferredTimeRanges,
    }
}

export const createRemindersAndTimeBlockingForBestMatchCategory = async (
    id: string,
    userId: string,
    newEvent: EventPlusType,
    bestMatchCategory: CategoryType,
    newReminders1?: ReminderType[],
    newTimeBlocking1?: BufferTimeObjectType,
    previousEvent?: EventPlusType
) => {
    try {
        // validate
        if (!bestMatchCategory?.id) {
            throw new Error('bestMatchCategory is required')
        }
        if (!newEvent?.id) {
            throw new Error('newEvent is required')
        }

        if (!id) {
            throw new Error('id is required')
        }

        if (!userId) {
            throw new Error('userId is required')
        }

        let newTimeBlocking = newTimeBlocking1 || {}
        let newReminders = newReminders1 || []
        // create reminders
        const oldReminders = await listRemindersForEvent(id, userId)
        const reminders = createRemindersUsingCategoryDefaultsForEvent(newEvent, bestMatchCategory, oldReminders, previousEvent)
        
        if ((reminders?.length > 0)
            && bestMatchCategory?.copyReminders
            && !newEvent?.userModifiedReminders) {
            newReminders.push(...reminders)
        }

        if (
            !newEvent?.userModifiedTimeBlocking
            && bestMatchCategory?.copyTimeBlocking
        ) {
            // create time blocking
            const timeBlocking = createPreAndPostEventsForCategoryDefaults(bestMatchCategory, newEvent, previousEvent)
            
            if (timeBlocking?.beforeEvent) {
                (newTimeBlocking as BufferTimeObjectType).beforeEvent = timeBlocking.beforeEvent

            }

            if (timeBlocking?.afterEvent) {
                (newTimeBlocking as BufferTimeObjectType).afterEvent = timeBlocking.afterEvent
            }

            if (timeBlocking?.newEvent?.preEventId || timeBlocking?.newEvent?.postEventId) {
                newEvent = timeBlocking.newEvent
            }
        }
        return { newEvent, newReminders, newTimeBlocking }
    } catch (e) {
        
    }
}

export const createCategoryEvents = async (
    categoryEvents: CategoryEventType[],
) => {
    try {
        for (const categoryEvent of categoryEvents) {
            const variables = {
                categoryId: categoryEvent?.categoryId,
                eventId: categoryEvent?.eventId,
            }
            const operationName = 'ConnectionByCategoryIdAndEventId'
            const query = `
        query ConnectionByCategoryIdAndEventId($categoryId: uuid!, $eventId: String!) {
          Category_Event(where: {categoryId: {_eq: $categoryId}, eventId: {_eq: $eventId}}) {
            createdDate
            categoryId
            deleted
            eventId
            id
            updatedAt
            userId
          }
        }

      `

            const res: { data: { Category_Event: CategoryEventType[] } } = await got.post(hasuraGraphUrl, {
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

            if (!res?.data?.Category_Event?.[0]) {

                const variables2 = {
                    id: categoryEvent.id,
                    categoryId: categoryEvent?.categoryId,
                    eventId: categoryEvent?.eventId,
                    createdDate: categoryEvent?.createdDate,
                    updatedAt: categoryEvent?.updatedAt,
                    userId: categoryEvent?.userId,
                }
                const operationName2 = 'InsertCategory_Event'
                const query2 = `
          mutation InsertCategory_Event($id: uuid!, $categoryId: uuid!, $createdDate: timestamptz, $eventId: String!, $updatedAt: timestamptz, $userId: uuid!) {
            insert_Category_Event_one(object: {categoryId: $categoryId, createdDate: $createdDate, deleted: false, eventId: $eventId, id: $id, updatedAt: $updatedAt, userId: $userId}) {
              categoryId
              createdDate
              deleted
              eventId
              id
              updatedAt
              userId
            }
          }
        `
                const res2 = await got.post(hasuraGraphUrl, {
                    headers: {
                        'X-Hasura-Admin-Secret': hasuraAdminSecret,
                        'X-Hasura-Role': 'admin'
                    },
                    json: {
                        operationName: operationName2,
                        query: query2,
                        variables: variables2,
                    }
                }).json()

                
            }
        }
    } catch (e) {
        
    }
}

const copyOverCategoryDefaultsForMeetingType = (event, categories: CategoryType[]) => {

    const meetingCategory = categories?.find(category => category.name === meetingLabel)
    const externalCategory = categories?.find(category => category.name === externalMeetingLabel)

    let newEventMeeting = null
    let newEventExternal = null

    if (meetingCategory?.id) {
        newEventMeeting = copyOverCategoryDefaults(event, meetingCategory)
    }

    if (externalCategory?.id) {
        newEventExternal = copyOverCategoryDefaults(event, externalCategory)
    }

    return { newEventMeeting, newEventExternal }
}

export const listRemindersForEvent = async (
    eventId: string,
    userId: string,
) => {
    try {
        // validate
        if (!eventId) {
            
            return
        }

        if (!userId) {
            
            return
        }
        // get reminders
        
        const operationName = 'listRemindersForEvent'
        const query = `
    query listRemindersForEvent($userId: uuid!, $eventId: String!) {
      Reminder(where: {userId: {_eq: $userId}, eventId: {_eq: $eventId}, deleted: {_neq: true}}) {
        eventId
        id
        minutes
        reminderDate
        timezone
        updatedAt
        useDefault
        userId
        deleted
        createdDate
      }
    }
  `
        const res: { data: { Reminder: ReminderType[] } } = await got.post(
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
                        eventId,
                    },
                },
            },
        ).json()

        
        return res?.data?.Reminder
    } catch (e) {
        
    }
}

export const createRemindersUsingCategoryDefaultsForEvent = (event: EventPlusType, bestMatchCategory: CategoryType, oldReminders: ReminderType[], previousEvent: EventPlusType): ReminderType[] => {
    // validate time blocking
    if (event.userModifiedReminders) {
        return null
    }

    if (previousEvent?.copyReminders) {
        return null
    }


    if (previousEvent?.id && bestMatchCategory?.copyReminders) {
        return null
    }

    const reminders = bestMatchCategory?.defaultReminders
    if (!(reminders?.length > 0)) {
        return oldReminders
    }

    const newReminders = []
    reminders.forEach(reminder => {
        newReminders.push({
            id: uuid(),
            minutes: reminder,
            eventId: event.id,
            userId: event.userId,
            // event: event,
            updatedAt: dayjs().toISOString(),
            createdDate: dayjs().toISOString(),
            deleted: false,
        })
    })
    return newReminders

}

export const createPreAndPostEventsForCategoryDefaults = (bestMatchCategory: CategoryType, event: EventPlusType, previousEvent?: EventPlusType) => {

    //  validate time blocking
    if (previousEvent?.copyTimeBlocking) {
        return null
    }

    if (previousEvent?.id && bestMatchCategory?.copyTimeBlocking) {
        return null
    }

    // user modified time blocking do not override
    if (event?.userModifiedTimeBlocking) {
        return null
    }
    const eventId = uuid()
    const eventId1 = uuid()
    const preEventId = event?.preEventId || `${eventId}#${event?.calendarId}`
    const postEventId = event?.postEventId || `${eventId1}#${event?.calendarId}`

    let valuesToReturn: any = {}
    valuesToReturn.newEvent = event

    if (bestMatchCategory?.defaultTimeBlocking?.afterEvent) {
        // const formattedZoneAfterEventEndDate = formatInTimeZone(addMinutes(zonedTimeToUtc(event.endDate.slice(0, 19), event.timezone), bestMatchCategory.defaultTimeBlocking.afterEvent).toISOString(), event.timezone, "yyyy-MM-dd'T'HH:mm:ssXXX")
        // const formattedZoneAfterEventStartDate = formatInTimeZone(zonedTimeToUtc(event.endDate.slice(0, 19), event.timezone).toISOString(), event.timezone, "yyyy-MM-dd'T'HH:mm:ssXXX")

        const formattedZoneAfterEventEndDate = dayjs(event.endDate.slice(0, 19)).tz(event?.timezone, true).add(bestMatchCategory.defaultTimeBlocking.afterEvent, 'm').format()
        const formattedZoneAfterEventStartDate = dayjs(event.endDate.slice(0, 19)).tz(event?.timezone, true).format()

        const afterEvent: EventPlusType = {
            id: postEventId,
            isPreEvent: false,
            forEventId: event.id,
            isPostEvent: true,
            notes: 'Buffer time',
            summary: 'Buffer time',
            startDate: formattedZoneAfterEventStartDate,
            endDate: formattedZoneAfterEventEndDate,
            method: event?.postEventId ? 'update' : 'create',
            userId: event?.userId,
            createdDate: dayjs().toISOString(),
            deleted: false,
            priority: 1,
            isFollowUp: false,
            modifiable: true,
            anyoneCanAddSelf: false,
            guestsCanInviteOthers: false,
            guestsCanSeeOtherGuests: false,
            originalStartDate: formattedZoneAfterEventStartDate,
            originalAllDay: false,
            updatedAt: dayjs().toISOString(),
            calendarId: event?.calendarId,
            timezone: event?.timezone,
            eventId: postEventId.split('#')[0]
        }
        valuesToReturn.afterEvent = afterEvent
        valuesToReturn.newEvent = {
            ...valuesToReturn.newEvent,
            postEventId,
            timeBlocking: {
                ...valuesToReturn?.newEvent?.timeBlocking,
                afterEvent: bestMatchCategory.defaultTimeBlocking.afterEvent,
            }
        }
    }

    if (bestMatchCategory?.defaultTimeBlocking?.beforeEvent) {
        // const formattedZoneBeforeEventStartDate = formatInTimeZone(subMinutes(zonedTimeToUtc(event.startDate.slice(0, 19), event.timezone), bestMatchCategory.defaultTimeBlocking.beforeEvent).toISOString(), event.timezone, "yyyy-MM-dd'T'HH:mm:ssXXX")
        // const formattedZoneBeforeEventEndDate = formatInTimeZone(zonedTimeToUtc(event.startDate.slice(0, 19), event.timezone).toISOString(), event.timezone, "yyyy-MM-dd'T'HH:mm:ssXXX")

        const formattedZoneBeforeEventStartDate = dayjs(event.startDate.slice(0, 19)).tz(event.timezone, true).subtract(bestMatchCategory.defaultTimeBlocking.beforeEvent, 'm').format()
        const formattedZoneBeforeEventEndDate = dayjs(event.startDate.slice(0, 19)).tz(event.timezone, true).format()

        const beforeEvent: EventPlusType = {
            id: preEventId,
            isPreEvent: true,
            isPostEvent: false,
            forEventId: event.id,
            notes: 'Buffer time',
            summary: 'Buffer time',
            startDate: formattedZoneBeforeEventStartDate,
            endDate: formattedZoneBeforeEventEndDate,
            method: event?.preEventId ? 'update' : 'create',
            userId: event?.userId,
            createdDate: dayjs().toISOString(),
            deleted: false,
            priority: 1,
            isFollowUp: false,
            modifiable: true,
            anyoneCanAddSelf: false,
            guestsCanInviteOthers: false,
            guestsCanSeeOtherGuests: false,
            originalStartDate: formattedZoneBeforeEventStartDate,
            originalAllDay: false,
            updatedAt: dayjs().toISOString(),
            calendarId: event?.calendarId,
            timezone: event?.timezone,
            eventId: preEventId.split('#')[0]
        }
        valuesToReturn.beforeEvent = beforeEvent
        valuesToReturn.newEvent = {
            ...valuesToReturn.newEvent,
            preEventId,
            timeBlocking: {
                ...valuesToReturn?.newEvent?.timeBlocking,
                beforeEvent: bestMatchCategory.defaultTimeBlocking.beforeEvent,
            }
        }
    }

    return valuesToReturn
}

export const updateValuesForMeetingTypeCategories = async (
    event,
    newEvent1: EventPlusType,
    bestMatchCategories: CategoryType[],
    userId: string,
    newReminders1?: ReminderType[],
    newTimeBlocking1?: { beforeEvent?: EventPlusType, afterEvent?: EventPlusType },
    previousEvent?: EventPlusType,
) => {
    try {
        if (!(bestMatchCategories?.length > 0)) {
            throw new Error('bestMatchCategories cannot be empty inside updateValuesForMeetingTypeCategories ')
        }
        let newEvent = newEvent1
        let newReminders = newReminders1 || []
        let newBufferTime = newTimeBlocking1 || {}
        const newCategoryConstantEvents = copyOverCategoryDefaultsForMeetingType(event, bestMatchCategories)
        

        if (newCategoryConstantEvents?.newEventMeeting?.id) {
            newEvent = { ...newEvent, ...newCategoryConstantEvents.newEventMeeting }
            const meetingCategory = bestMatchCategories?.find(category => category.name === meetingLabel)

            // create reminders
            const oldReminders = await listRemindersForEvent(newCategoryConstantEvents.newEventMeeting.id, userId)
            const reminders = createRemindersUsingCategoryDefaultsForEvent(newEvent, meetingCategory, oldReminders, previousEvent)
            
            if (reminders?.length > 0) {
                newReminders.push(...reminders)
                newReminders = _.uniqBy(newReminders, 'minutes')
            }

            // create time blocking
            const bufferTime = createPreAndPostEventsForCategoryDefaults(meetingCategory, newEvent, previousEvent)
            
            if (bufferTime?.beforeEvent) {
                newBufferTime.beforeEvent = bufferTime.beforeEvent

            }

            if (bufferTime?.afterEvent) {
                newBufferTime.afterEvent = bufferTime.afterEvent
            }

            if (bufferTime?.newEvent?.preEventId || bufferTime?.newEvent?.postEventId) {
                newEvent = bufferTime.newEvent
            }
        }

        if (newCategoryConstantEvents?.newEventExternal?.id) {
            newEvent = { ...newEvent, ...newCategoryConstantEvents.newEventExternal }
            const externalCategory = bestMatchCategories?.find(category => category.name === externalMeetingLabel)

            // create reminders
            const oldReminders = await listRemindersForEvent(newCategoryConstantEvents.newEventExternal.id, userId)
            const reminders = createRemindersUsingCategoryDefaultsForEvent(newEvent, externalCategory, oldReminders, previousEvent)
            
            if (reminders?.length > 0) {
                newReminders.push(...reminders)
                newReminders = _.uniqBy(newReminders, 'minutes')
            }

            // create time blocking
            const timeBlocking = createPreAndPostEventsForCategoryDefaults(externalCategory, newEvent, previousEvent)
            
            if (timeBlocking?.beforeEvent) {
                newBufferTime.beforeEvent = timeBlocking.beforeEvent

            }

            if (timeBlocking?.afterEvent) {
                newBufferTime.afterEvent = timeBlocking.afterEvent
            }

            if (timeBlocking?.newEvent?.preEventId || timeBlocking?.newEvent?.postEventId) {
                newEvent = timeBlocking.newEvent
            }
        }
        return { newEvent, newReminders, newTimeBlocking: newBufferTime }
    } catch (e) {
        
    }
}


export const processUserEventForCategoryDefaults = async (event: EventPlusType, vector: number[]) => {
    try {
        const { id, userId } = event
        
        //  create new event datatype in elastic search
        // await putDataInSearch(id, vector, userId)

        // find categories and copy over defaults if any
        const categories: CategoryType[] = await getUserCategories(userId)

        if (!categories?.[0]?.id) {
            throw new Error('categories is not available processUserEventForCategoryDefaults')
        }

        // labelConstants are already part of categories                                                          
        
        const body = await findBestMatchCategory2(event, categories)
        
        const { labels, scores } = body

        const bestMatchLabel = processBestMatchCategories(body, labels)
        

        if (bestMatchLabel) {
            const bestMatchCategory = categories?.find(category => category.name === bestMatchLabel)
            let bestMatchPlusMeetingCategories = await processEventForMeetingTypeCategories(event, bestMatchCategory, labels, scores, categories)
            if (bestMatchPlusMeetingCategories?.length > 0) {
                bestMatchPlusMeetingCategories = getUniqueLabels(bestMatchPlusMeetingCategories)
                
            }
            //  copy over category defaults
            const newCategoryDefaultEvent = copyOverCategoryDefaults(event, bestMatchCategory)
            

            // create new event
            let newEvent: EventPlusType = newCategoryDefaultEvent ?? event
            
            let newReminders: ReminderType[] = []
            let newTimeBlocking: BufferTimeObjectType = {}

            const {
                newEvent: newEvent1,
                newReminders: newReminders1,
                newTimeBlocking: newTimeBlocking1,
            } = await createRemindersAndTimeBlockingForBestMatchCategory(id, userId, newEvent, bestMatchCategory, newReminders, newTimeBlocking)
            newEvent = newEvent1
            newReminders = newReminders1
            newTimeBlocking = newTimeBlocking1

            if (bestMatchPlusMeetingCategories?.length > 0) {
                const categoryEvents: CategoryEventType[] = bestMatchPlusMeetingCategories.map(c => {
                    const categoryEvent: CategoryEventType = {
                        categoryId: c.id,
                        eventId: id,
                        userId,
                        id: uuid(),
                        createdDate: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    } as CategoryEventType
                    return categoryEvent
                })
                
                await createCategoryEvents(categoryEvents)
                const {
                    newEvent: newEvent1,
                    newReminders: newReminders1,
                    newTimeBlocking: newTimeBlocking1,
                } = await updateValuesForMeetingTypeCategories(event, newEvent, bestMatchPlusMeetingCategories, userId, newReminders, newTimeBlocking)
                newEvent = newEvent1
                newReminders = newReminders1
                newTimeBlocking = newTimeBlocking1
            }

            newEvent.vector = vector

            
            
            

            return {
                newEvent,
                newReminders,
                newTimeBlocking
            }
        }
        // no best match category was found
        // just return the event to planner
        // get this week's events
        event.vector = vector
        return {
            newEvent: event,
        }
    } catch (e) {
        
    }
}


export const listCategoriesForEvent = async (
    eventId: string
) => {
    try {
        
        const operationName = 'listCategoriesForEvent'
        const query = `
      query listCategoriesForEvent($eventId: String!) {
        Category_Event(where: {eventId: {_eq: $eventId}}) {
          Category {
            color
            copyAvailability
            copyIsBreak
            copyIsExternalMeeting
            copyIsMeeting
            copyModifiable
            copyPriorityLevel
            copyReminders
            copyTimeBlocking
            copyTimePreference
            createdDate
            defaultAvailability
            defaultExternalMeetingModifiable
            defaultIsBreak
            defaultIsExternalMeeting
            defaultIsMeeting
            defaultMeetingModifiable
            defaultModifiable
            defaultPriorityLevel
            defaultReminders
            defaultTimeBlocking
            defaultTimePreference
            deleted
            id
            name
            updatedAt
            userId
          }
          categoryId
          createdDate
          deleted
          eventId
          id
          updatedAt
          userId
        }
      }
    `
        const res: { data: { Category_Event: CategoryEventType[] } } = await got.post(
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
                        eventId,
                    },
                },
            },
        ).json()
        
        const categories: CategoryType[] = res?.data?.Category_Event?.map(
            (category) => category?.Category
        )
            ?.filter((category) => (category?.id !== null))
        
        return categories
    } catch (e) {
        
    }
}

export const processBestMatchCategoriesNoThreshold = (body, newPossibleLabels) => {
    const { scores } = body
    let bestMatchCategory = ''
    let bestMatchScore = 0
    for (let i = 0; i < newPossibleLabels.length; i++) {
        const label = newPossibleLabels[i]
        const score = scores[i]

        if (score > bestMatchScore) {
            bestMatchCategory = label
            bestMatchScore = score
        }
    }

    return bestMatchCategory
}

export const processUserEventForCategoryDefaultsWithUserModifiedCategories = async (event: EventPlusType, vector: number[]) => {
    try {
        const { id, userId } = event
        
        //  create new event datatype in elastic search
        // await putDataInSearch(id, vector, userId)

        // get event categories and copy over defaults if any
        const categories: CategoryType[] = await listCategoriesForEvent(event?.id)

        // labelConstants are already part of categories
        
        const body = await findBestMatchCategory2(event, categories)
        
        const { labels, scores } = body

        const bestMatchLabel = processBestMatchCategoriesNoThreshold(body, labels)
        
        let bestMatchCategory: CategoryType | null = null
        // create new event
        let newEvent: EventPlusType = event
        
        let newReminders: ReminderType[] = []
        let newTimeBlocking: BufferTimeObjectType | object = {}
        if (bestMatchLabel) {
            bestMatchCategory = categories.find(category => category.name === bestMatchLabel)
            labels.push(meetingLabel, externalMeetingLabel)
            scores.push(0, 0)
            let bestMatchPlusMeetingCategories = processEventForMeetingTypeCategories(event, bestMatchCategory, labels, scores, categories)
            if (bestMatchPlusMeetingCategories?.length > 0) {
                bestMatchPlusMeetingCategories = getUniqueLabels(bestMatchPlusMeetingCategories)
                
                const categoryEvents: CategoryEventType[] = bestMatchPlusMeetingCategories.map(c => {
                    const categoryEvent: CategoryEventType = {
                        categoryId: c.id,
                        eventId: id,
                        userId,
                        id: uuid(),
                        createdDate: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    } as CategoryEventType
                    return categoryEvent
                })
                
                await createCategoryEvents(categoryEvents)
                const {
                    newEvent: newEvent1,
                    newReminders: newReminders1,
                    newTimeBlocking: newTimeBlocking1,
                } = await updateValuesForMeetingTypeCategories(event, newEvent, bestMatchPlusMeetingCategories, userId, newReminders, newTimeBlocking)
                newEvent = newEvent1
                newReminders = newReminders1
                newTimeBlocking = newTimeBlocking1
            }
        }

        //  copy over category defaults
        let newCategoryDefaultEvent: EventPlusType | null = null
        if (bestMatchCategory) {
            newCategoryDefaultEvent = copyOverCategoryDefaults(event, bestMatchCategory)
        }
        

        // create new event
        newEvent = newCategoryDefaultEvent ?? newEvent ?? event
        
        const {
            newEvent: newEvent1,
            newReminders: newReminders1,
            newTimeBlocking: newTimeBlocking1,
        } = await createRemindersAndTimeBlockingForBestMatchCategory(id, userId, newEvent, bestMatchCategory, newReminders, newTimeBlocking as BufferTimeObjectType)

        newEvent = newEvent1
        newReminders = newReminders1
        newTimeBlocking = newTimeBlocking1 as BufferTimeObjectType

        if (categories?.length > 1) {
            const {
                newEvent: newEvent1,
                newReminders: newReminders1,
                newTimeBlocking: newTimeBlocking1,
            } = await updateValuesForMeetingTypeCategories(event, newEvent, categories, userId, newReminders, newTimeBlocking as BufferTimeObjectType)
            newEvent = newEvent1
            newReminders = newReminders1
            newTimeBlocking = newTimeBlocking1
        }

        newEvent.vector = vector

        
        
        

        return {
            newEvent,
            newReminders,
            newTimeBlocking
        }
    } catch (e) {
        
    }
}


export const getEventFromPrimaryKey = async (eventId: string): Promise<EventPlusType> => {
    try {
        const operationName = 'getEventFromPrimaryKey'
        const query = `
    query getEventFromPrimaryKey($eventId: String!) {
      Event_by_pk(id: $eventId) {
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
        const res: { data: { Event_by_pk: EventPlusType } } = await got.post(
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
                        eventId,
                    },
                },
            },
        ).json()
        
        return res?.data?.Event_by_pk
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

export const copyOverPreviousEventDefaults = (
    event: EventPlusType,
    previousEvent: EventPlusType,
    category?: CategoryType,
    userPreferences?: UserPreferenceType,
): EventPlusType => {

    const previousDuration = dayjs.duration(dayjs(previousEvent.endDate.slice(0, 19)).tz(previousEvent?.timezone, true).diff(dayjs(previousEvent.startDate.slice(0, 19)).tz(previousEvent?.timezone, true))).asMinutes()
    return {
        ...event,
        transparency: !event?.userModifiedAvailability
            ? (previousEvent?.copyAvailability
                ? previousEvent.transparency
                : (category?.copyAvailability
                    ? previousEvent?.transparency
                    : (category?.defaultAvailability
                        ? 'transparent'
                        : (userPreferences?.copyAvailability
                            ? previousEvent?.transparency
                            : event?.transparency))))
            : event.transparency,
        preferredTime: !event?.userModifiedTimePreference
            ? (previousEvent?.copyTimePreference && previousEvent?.preferredTime
                ? previousEvent.preferredTime
                : (category?.copyTimePreference && previousEvent?.preferredTime
                    ? previousEvent?.preferredTime
                    : (userPreferences?.copyTimePreference && previousEvent?.preferredTime
                        ? previousEvent?.preferredTime
                        : event?.preferredTime)))
            : event.preferredTime,
        preferredDayOfWeek: !event?.userModifiedTimePreference
            ? (previousEvent?.copyTimePreference && previousEvent?.preferredDayOfWeek
                ? previousEvent.preferredDayOfWeek
                : (category?.copyTimePreference && previousEvent?.preferredDayOfWeek
                    ? previousEvent?.preferredDayOfWeek
                    : (userPreferences?.copyTimePreference && previousEvent?.preferredDayOfWeek
                        ? previousEvent?.preferredDayOfWeek
                        : event?.preferredDayOfWeek)))
            : event.preferredDayOfWeek,
        preferredStartTimeRange: !event?.userModifiedTimePreference
            ? (previousEvent?.copyTimePreference && previousEvent?.preferredStartTimeRange
                ? previousEvent.preferredStartTimeRange
                : (category?.copyTimePreference && previousEvent?.preferredStartTimeRange
                    ? previousEvent?.preferredStartTimeRange
                    : (userPreferences?.copyTimePreference && previousEvent?.preferredStartTimeRange
                        ? previousEvent?.preferredStartTimeRange
                        : event?.preferredStartTimeRange)))
            : event.preferredStartTimeRange,
        preferredEndTimeRange: !event?.userModifiedTimePreference
            ? (previousEvent?.copyTimePreference && previousEvent?.preferredEndTimeRange
                ? previousEvent.preferredEndTimeRange
                : (category?.copyTimePreference && previousEvent?.preferredEndTimeRange
                    ? previousEvent?.preferredEndTimeRange
                    : (userPreferences?.copyTimePreference && previousEvent?.preferredEndTimeRange
                        ? previousEvent?.preferredEndTimeRange
                        : event?.preferredEndTimeRange)))
            : event.preferredEndTimeRange,
        priority: (!event?.userModifiedPriorityLevel ? (previousEvent?.copyPriorityLevel ? previousEvent.priority : (category?.copyPriorityLevel ? previousEvent?.priority : (category?.defaultPriorityLevel ? category?.defaultPriorityLevel : (userPreferences?.copyPriorityLevel ? previousEvent?.priority : event?.priority)))) : event?.priority) || 1,
        isBreak: !event?.userModifiedIsBreak ? (previousEvent?.copyIsBreak ? previousEvent.isBreak : (category?.copyIsBreak ? previousEvent?.isBreak : (category?.defaultIsBreak ? category?.defaultIsBreak : (userPreferences?.copyIsBreak ? previousEvent?.isBreak : event?.isBreak)))) : event.isBreak,
        isMeeting: !event?.userModifiedIsMeeting ? (previousEvent?.copyIsMeeting ? previousEvent.isMeeting : (category?.copyIsMeeting ? previousEvent?.isMeeting : (category?.defaultIsMeeting ? category?.defaultIsMeeting : (userPreferences?.copyIsMeeting ? previousEvent?.isMeeting : (category?.name === meetingLabel ? true : event?.isMeeting))))) : event.isMeeting,
        isExternalMeeting: !event?.userModifiedIsExternalMeeting ? (previousEvent?.copyIsExternalMeeting ? previousEvent.isExternalMeeting : (category?.copyIsExternalMeeting ? previousEvent?.isExternalMeeting : (category?.defaultIsExternalMeeting ? category?.defaultIsExternalMeeting : (userPreferences?.copyIsExternalMeeting ? previousEvent?.isExternalMeeting : (category?.name === externalMeetingLabel ? true : event?.isExternalMeeting))))) : event.isExternalMeeting,
        modifiable: !event?.userModifiedModifiable ? (previousEvent?.copyModifiable ? previousEvent.modifiable : (category?.copyModifiable ? previousEvent?.modifiable : (category?.defaultModifiable ? category?.defaultModifiable : (userPreferences?.copyModifiable ? previousEvent?.modifiable : event?.modifiable)))) : event.modifiable,
        isMeetingModifiable: !event?.userModifiedModifiable ? (previousEvent?.copyIsMeeting ? previousEvent.isMeeting : (category?.copyIsMeeting ? previousEvent?.isMeeting : (category?.defaultIsMeeting ? category?.defaultIsMeeting : (userPreferences?.copyIsMeeting ? previousEvent?.isMeeting : event?.isMeeting)))) : event.isMeetingModifiable,
        isExternalMeetingModifiable: !event?.userModifiedModifiable ? (previousEvent?.copyIsExternalMeeting ? previousEvent.isExternalMeeting : (category?.copyIsExternalMeeting ? previousEvent?.isExternalMeeting : (category?.defaultIsExternalMeeting ? category?.defaultIsExternalMeeting : (userPreferences?.copyIsExternalMeeting ? previousEvent?.isExternalMeeting : event?.isExternalMeeting)))) : event.isExternalMeetingModifiable,
        duration: !event?.userModifiedDuration ? (previousEvent?.copyDuration ? (previousEvent.duration || previousDuration) : event?.duration) : event.duration,
        endDate: !event?.userModifiedDuration ? (previousEvent?.copyDuration ? dayjs(event.startDate.slice(0, 19)).tz(event.timezone, true).add((previousEvent.duration || previousDuration), 'minutes').format() : event?.endDate) : event.endDate,
        preferredTimeRanges: !event?.userModifiedTimePreference
            ? ((previousEvent?.copyTimePreference && (previousEvent.preferredTimeRanges?.length > 0))
                ? previousEvent.preferredTimeRanges
                : (category?.copyTimePreference && (previousEvent.preferredTimeRanges?.length > 0)
                    ? previousEvent?.preferredTimeRanges
                    : (userPreferences?.copyTimePreference && (previousEvent.preferredTimeRanges?.length > 0)
                        ? previousEvent?.preferredTimeRanges
                        : (category?.defaultTimePreference?.length > 0
                            ? category?.defaultTimePreference?.map(tp => ({ ...tp, eventId: event?.id, id: uuid(), createdDate: dayjs().toISOString(), updatedAt: dayjs().toISOString(), userId: event?.userId }))
                            : event?.preferredTimeRanges))))
            : event.preferredTimeRanges,

        copyAvailability: !previousEvent?.unlink ? previousEvent.copyAvailability : false,
        copyTimePreference: !previousEvent?.unlink ? previousEvent.copyTimePreference : false,
        copyPriorityLevel: !previousEvent?.unlink ? previousEvent.copyPriorityLevel : false,
        copyIsBreak: !previousEvent?.unlink ? previousEvent.copyIsBreak : false,
        copyModifiable: !previousEvent?.unlink ? previousEvent.copyModifiable : false,
        copyIsMeeting: !previousEvent?.unlink ? previousEvent.copyIsMeeting : false,
        copyIsExternalMeeting: !previousEvent?.unlink ? previousEvent.copyIsExternalMeeting : false,
        copyDuration: !previousEvent?.unlink ? previousEvent.copyDuration : false,
        copyCategories: !previousEvent?.unlink ? previousEvent.copyCategories : false,
        copyReminders: !previousEvent?.unlink ? previousEvent.copyReminders : false,
        copyTimeBlocking: !previousEvent?.unlink ? previousEvent.copyTimeBlocking : false,
        copyColor: !previousEvent?.unlink ? previousEvent.copyColor : false,
        unlink: !previousEvent?.unlink ? false : true,

        positiveImpactDayOfWeek: !previousEvent?.unlink ? previousEvent.positiveImpactDayOfWeek : null,
        positiveImpactScore: !previousEvent?.unlink ? previousEvent.positiveImpactScore : null,
        negativeImpactDayOfWeek: !previousEvent?.unlink ? previousEvent.negativeImpactDayOfWeek : null,
        negativeImpactScore: !previousEvent?.unlink ? previousEvent.negativeImpactScore : null,
        positiveImpactTime: !previousEvent?.unlink ? previousEvent.positiveImpactTime : null,
        negativeImpactTime: !previousEvent?.unlink ? previousEvent.negativeImpactTime : null,

        backgroundColor: !event?.userModifiedColor ? (previousEvent?.copyColor ? previousEvent.backgroundColor : (category?.color ? category?.color : (userPreferences?.copyColor ? previousEvent?.backgroundColor : event?.backgroundColor))) : event.backgroundColor,
        colorId: ((previousEvent?.copyColor && previousEvent?.colorId) ? previousEvent.colorId : ((userPreferences?.copyColor && previousEvent?.colorId) ? previousEvent?.colorId : event?.colorId)),
    }
}

export const createPreAndPostEventsFromPreviousEvent = (event: EventPlusType, previousEvent: EventPlusType) => {
    //  validate time blocking
    if (!previousEvent?.copyTimeBlocking) {
        
        return null
    }

    // user modified time blocking do not override
    if (event.userModifiedTimeBlocking) {
        
        return null
    }

    const eventId = uuid()
    const eventId1 = uuid()

    const preEventId = event?.preEventId || `${eventId}#${event?.calendarId}`
    const postEventId = event?.postEventId || `${eventId1}#${event?.calendarId}`

    // await upsertEvents([beforeEvent, afterEvent])

    let valuesToReturn: any = {}
    valuesToReturn.newEvent = event

    if (previousEvent?.timeBlocking?.afterEvent) {
        // const formattedZoneAfterEventEndDate = formatInTimeZone(addMinutes(zonedTimeToUtc(event.endDate.slice(0, 19), event.timezone), previousEvent?.timeBlocking?.afterEvent), event.timezone, "yyyy-MM-dd'T'HH:mm:ssXXX")
        // const formattedZoneAfterEventStartDate = formatInTimeZone(zonedTimeToUtc(event.endDate.slice(0, 19), event.timezone), event.timezone, "yyyy-MM-dd'T'HH:mm:ssXXX")

        const formattedZoneAfterEventEndDate = dayjs(event.endDate.slice(0, 19)).tz(event.timezone, true).add(previousEvent?.timeBlocking?.afterEvent, 'm').format()
        const formattedZoneAfterEventStartDate = dayjs(event.endDate.slice(0, 19)).tz(event.timezone, true).format()

        const afterEvent: EventPlusType = {
            id: postEventId,
            isPreEvent: false,
            forEventId: event.id,
            isPostEvent: true,
            notes: 'Buffer time',
            summary: 'Buffer time',
            startDate: formattedZoneAfterEventStartDate,
            endDate: formattedZoneAfterEventEndDate,
            method: event?.postEventId ? 'update' : 'create',
            userId: event?.userId,
            createdDate: dayjs().toISOString(),
            deleted: false,
            priority: 1,
            isFollowUp: false,
            modifiable: true,
            anyoneCanAddSelf: false,
            guestsCanInviteOthers: false,
            guestsCanSeeOtherGuests: false,
            originalStartDate: formattedZoneAfterEventStartDate,
            originalAllDay: false,
            updatedAt: dayjs().toISOString(),
            calendarId: event?.calendarId,
            timezone: event?.timezone,
            eventId: postEventId.split('#')[0]
        }
        valuesToReturn.afterEvent = afterEvent
        valuesToReturn.newEvent = {
            ...valuesToReturn.newEvent,
            postEventId,
            timeBlocking: {
                ...valuesToReturn?.newEvent?.timeBlocking,
                afterEvent: previousEvent?.timeBlocking?.afterEvent,
            }
        }
    }

    if (previousEvent?.timeBlocking?.beforeEvent) {
        // const formattedZoneBeforeEventStartDate = formatInTimeZone(subMinutes(zonedTimeToUtc(event.startDate.slice(0, 19), event.timezone), previousEvent?.timeBlocking?.beforeEvent), event.timezone, "yyyy-MM-dd'T'HH:mm:ssXXX")
        // const formattedZoneBeforeEventEndDate = formatInTimeZone(zonedTimeToUtc(event.startDate.slice(0, 19), event.timezone), event.timezone, "yyyy-MM-dd'T'HH:mm:ssXXX")

        const formattedZoneBeforeEventStartDate = dayjs(event.startDate.slice(0, 19)).tz(event.timezone, true).subtract(previousEvent?.timeBlocking?.beforeEvent, 'm').format()
        const formattedZoneBeforeEventEndDate = dayjs(event.startDate.slice(0, 19)).tz(event.timezone, true).format()

        const beforeEvent: EventPlusType = {
            id: preEventId,
            isPreEvent: true,
            isPostEvent: false,
            forEventId: event.id,
            notes: 'Buffer time',
            summary: 'Buffer time',
            startDate: formattedZoneBeforeEventStartDate,
            endDate: formattedZoneBeforeEventEndDate,
            method: event?.preEventId ? 'update' : 'create',
            userId: event?.userId,
            createdDate: dayjs().toISOString(),
            deleted: false,
            priority: 1,
            isFollowUp: false,
            modifiable: true,
            anyoneCanAddSelf: false,
            guestsCanInviteOthers: false,
            guestsCanSeeOtherGuests: false,
            originalStartDate: formattedZoneBeforeEventStartDate,
            originalAllDay: false,
            updatedAt: dayjs().toISOString(),
            calendarId: event?.calendarId,
            timezone: event?.timezone,
            eventId: preEventId.split('#')[0]
        }
        valuesToReturn.beforeEvent = beforeEvent
        valuesToReturn.newEvent = {
            ...valuesToReturn.newEvent,
            preEventId,
            timeBlocking: {
                ...valuesToReturn?.newEvent?.timeBlocking,
                beforeEvent: previousEvent?.timeBlocking?.beforeEvent,
            }
        }
    }

    return valuesToReturn

}

export const createRemindersFromPreviousEventForEvent = async (event: EventPlusType, previousEvent: EventPlusType, userId: string): Promise<ReminderType[]> => {
    // validate time blocking
    if (event.userModifiedReminders) {
        
        return null
    }

    if (!previousEvent?.id) {
        
        return null
    }

    if (!previousEvent?.copyReminders) {
        
        return null
    }

    const reminders = await listRemindersForEvent(previousEvent.id, userId)

    return reminders?.map(reminder => ({
        ...reminder,
        eventId: event.id,
        id: uuid(),
        // event: event,
        updatedAt: dayjs().toISOString(),
        createdDate: dayjs().toISOString(),
        deleted: false,
    }))

}

const copyOverMeetingAndExternalMeetingDefaultsWithPreviousEventFound = (
    event: EventPlusType,
    previousEvent: EventPlusType,
    category: CategoryType,
    userPreferences: UserPreferenceType,
): EventPlusType => {
    return {
        ...event,
        transparency: !event?.userModifiedAvailability ? (previousEvent?.copyAvailability ? previousEvent.transparency : (category.copyAvailability ? previousEvent?.transparency : (category.defaultAvailability ? 'transparent' : (userPreferences?.copyAvailability ? previousEvent?.transparency : event?.transparency)))) : event.transparency,
        preferredTime: !event?.userModifiedTimePreference ? (previousEvent?.copyTimePreference ? previousEvent.preferredTime : (category.copyTimePreference ? previousEvent?.preferredTime : (userPreferences?.copyTimePreference ? previousEvent?.preferredTime : event?.preferredTime))) : event.preferredTime,
        preferredDayOfWeek: !event?.userModifiedTimePreference ? (previousEvent?.copyTimePreference ? previousEvent.preferredDayOfWeek : (userPreferences?.copyTimePreference ? previousEvent?.preferredDayOfWeek : event?.preferredDayOfWeek)) : event.preferredDayOfWeek,
        preferredStartTimeRange: !event?.userModifiedTimePreference ? (previousEvent?.copyTimePreference ? previousEvent.preferredStartTimeRange : (category.copyTimePreference ? previousEvent?.preferredStartTimeRange : (userPreferences?.copyTimePreference ? previousEvent?.preferredStartTimeRange : event?.preferredStartTimeRange))) : event.preferredStartTimeRange,
        preferredEndTimeRange: !event?.userModifiedTimePreference ? (previousEvent?.copyTimePreference ? previousEvent.preferredEndTimeRange : (category.copyTimePreference ? previousEvent?.preferredEndTimeRange : (userPreferences?.copyTimePreference ? previousEvent?.preferredEndTimeRange : event?.preferredEndTimeRange))) : event.preferredEndTimeRange,
        priority: (!event?.userModifiedPriorityLevel ? (previousEvent?.copyPriorityLevel ? previousEvent.priority : (category.copyPriorityLevel ? previousEvent?.priority : (category.defaultPriorityLevel ? category?.defaultPriorityLevel : (userPreferences?.copyPriorityLevel ? previousEvent?.priority : event?.priority)))) : event?.priority) || 1,
        isBreak: !event?.userModifiedIsBreak ? (previousEvent?.copyIsBreak ? previousEvent.isBreak : (category.copyIsBreak ? previousEvent?.isBreak : (category.defaultIsBreak ? category?.defaultIsBreak : (userPreferences?.copyIsBreak ? previousEvent?.isBreak : event?.isBreak)))) : event.isBreak,
        isMeeting: !event?.userModifiedIsMeeting ? (previousEvent?.copyIsMeeting ? previousEvent.isMeeting : (category.copyIsMeeting ? previousEvent?.isMeeting : (category.defaultIsMeeting ? category?.defaultIsMeeting : (userPreferences?.copyIsMeeting ? previousEvent?.isMeeting : (category.name === meetingLabel ? true : event?.isMeeting))))) : event.isMeeting,
        isExternalMeeting: !event?.userModifiedIsExternalMeeting ? (previousEvent?.copyIsExternalMeeting ? previousEvent.isExternalMeeting : (category.copyIsExternalMeeting ? previousEvent?.isExternalMeeting : (category.defaultIsExternalMeeting ? category?.defaultIsExternalMeeting : (userPreferences?.copyIsExternalMeeting ? previousEvent?.isExternalMeeting : (category.name === externalMeetingLabel ? true : event?.isExternalMeeting))))) : event.isExternalMeeting,
        isMeetingModifiable: !event?.userModifiedModifiable ? category.defaultMeetingModifiable ? category?.defaultMeetingModifiable : event?.isMeetingModifiable : event.isMeetingModifiable,
        isExternalMeetingModifiable: !event?.userModifiedModifiable ? category.defaultExternalMeetingModifiable ? category?.defaultExternalMeetingModifiable : event?.isExternalMeetingModifiable : event.isExternalMeetingModifiable,
        backgroundColor: !event?.userModifiedColor ? (previousEvent?.copyColor ? previousEvent.backgroundColor : (category.color ? category?.color : (userPreferences?.copyColor ? previousEvent?.backgroundColor : event?.backgroundColor))) : event.backgroundColor,
        colorId: ((previousEvent?.copyColor && previousEvent?.colorId) ? previousEvent.colorId : ((userPreferences?.copyColor && previousEvent?.colorId) ? previousEvent?.colorId : event?.colorId)),
        preferredTimeRanges: !event?.userModifiedTimePreference
            ? (previousEvent?.copyTimePreference && (previousEvent?.preferredTimeRanges?.length > 0)
                ? previousEvent.preferredTimeRanges
                : (category.copyTimePreference && (previousEvent?.preferredTimeRanges?.length > 0)
                    ? previousEvent?.preferredTimeRanges
                    : (userPreferences?.copyTimePreference && (previousEvent?.preferredTimeRanges?.length > 0)
                        ? previousEvent?.preferredTimeRanges
                        : (category.defaultTimePreference?.map(tp => ({ ...tp, eventId: event?.id, id: uuid(), createdDate: dayjs().toISOString(), updatedAt: dayjs().toISOString(), userId: event?.userId }))
                            ? category?.defaultTimePreference?.map(tp => ({ ...tp, eventId: event?.id, id: uuid(), createdDate: dayjs().toISOString(), updatedAt: dayjs().toISOString(), userId: event?.userId }))
                            : event?.preferredTimeRanges))))
            : event.preferredTimeRanges,
    }

}

export const copyOverCategoryMeetingAndExternalMeetingDefaultsWithFoundPreviousEvent = (
    event: EventPlusType,
    categories: CategoryType[],
    userPreferences: UserPreferenceType,
    previousEvent: EventPlusType,
) => {
    // validate values
    if (!(categories?.length > 0)) {
        
        return
    }

    if (!userPreferences?.id) {
        
        return
    }

    if (!previousEvent?.id) {
        
        return
    }
    if (!event?.id) {
        
        return
    }

    const meetingCategory = categories.find(category => category.name === meetingLabel)
    const externalCategory = categories.find(category => category.name === externalMeetingLabel)

    let newEventMeeting: EventPlusType | {} = {}
    let newEventExternal: EventPlusType | {} = {}

    if (meetingCategory?.id) {
        newEventMeeting = copyOverMeetingAndExternalMeetingDefaultsWithPreviousEventFound(
            event,
            previousEvent,
            meetingCategory,
            userPreferences,
        )
    }

    if (externalCategory?.id) {
        newEventExternal = copyOverMeetingAndExternalMeetingDefaultsWithPreviousEventFound(
            event,
            previousEvent,
            meetingCategory,
            userPreferences,
        )
    }

    return { newEventMeeting, newEventExternal }
}
export const createRemindersAndTimeBlockingFromPreviousEventGivenUserPreferences = async (
    userId: string,
    newEvent: EventPlusType,
    newReminders1?: ReminderType[],
    newTimeBlocking1?: BufferTimeObjectType,
    previousEvent?: EventPlusType,
    userPreferences?: UserPreferenceType,
) => {
    try {
        let newReminders = newReminders1 || []
        let newTimeBlocking = newTimeBlocking1 || {}
        if (!newEvent?.userModifiedReminders
            && userPreferences?.copyReminders) {
            const reminders = await createRemindersFromPreviousEventForEvent(newEvent, previousEvent, userId)

            
            if ((reminders?.length > 0)
                && !newEvent?.userModifiedReminders) {
                newReminders.push(...reminders)
            }
        }

        if (
            !newEvent?.userModifiedTimeBlocking
            && userPreferences?.copyTimeBlocking
        ) {
            // create time blocking
            const timeBlocking = createPreAndPostEventsFromPreviousEvent(newEvent, previousEvent)
            
            if (timeBlocking?.beforeEvent) {
                (newTimeBlocking as BufferTimeObjectType).beforeEvent = timeBlocking.beforeEvent

            }

            if (timeBlocking?.afterEvent) {
                (newTimeBlocking as BufferTimeObjectType).afterEvent = timeBlocking.afterEvent
            }

            if (timeBlocking?.newEvent?.preEventId || timeBlocking?.newEvent?.postEventId) {
                newEvent = timeBlocking.newEvent
            }
        }
        return { newEvent, newReminders, newTimeBlocking }


    } catch (e) {
        
    }
}

export const updateValuesForEventWithPreviousEventPlusMeetingAndExternalMeeting = async (
    event: EventPlusType,
    newEvent1: EventPlusType,
    bestMatchCategories: CategoryType[],
    newReminders1: ReminderType[],
    newTimeBlocking1: BufferTimeObjectType,
    userId: string,
    userPreferences: UserPreferenceType,
    previousEvent: EventPlusType,
) => {
    try {
        let newEvent = newEvent1
        let newReminders = newReminders1 || []
        let newTimeBlocking = newTimeBlocking1 || {}
        const { newEventMeeting, newEventExternal } = copyOverCategoryMeetingAndExternalMeetingDefaultsWithFoundPreviousEvent(
            event,
            bestMatchCategories,
            userPreferences,
            previousEvent,
        )

        if ((newEventMeeting as EventPlusType)?.id) {
            newEvent = { ...newEvent, ...newEventMeeting }
            const meetingCategory = bestMatchCategories.find(category => category.name === meetingLabel)

            // create reminders
            const oldReminders = await listRemindersForEvent((newEventMeeting as EventPlusType)?.id, userId)
            const reminders = createRemindersUsingCategoryDefaultsForEvent(newEvent, meetingCategory, oldReminders, previousEvent)
            
            if (
                (reminders?.length > 0)
                && !newEvent?.userModifiedReminders
            ) {
                newReminders.push(...reminders)
                newReminders = _.uniqBy(newReminders, 'minutes')
            }

            // create time blocking
            if (!newEvent?.userModifiedTimeBlocking) {
                const timeBlocking = createPreAndPostEventsForCategoryDefaults(meetingCategory, newEvent, previousEvent)
                
                if (timeBlocking?.beforeEvent) {
                    newTimeBlocking.beforeEvent = timeBlocking.beforeEvent

                }

                if (timeBlocking?.afterEvent) {
                    newTimeBlocking.afterEvent = timeBlocking.afterEvent
                }

                if (timeBlocking?.newEvent?.preEventId || timeBlocking?.newEvent?.postEventId) {
                    newEvent = timeBlocking.newEvent
                }
            }
        }

        if ((newEventExternal as EventPlusType)?.id) {
            newEvent = { ...newEvent, ...newEventExternal }
            const externalCategory = bestMatchCategories.find(category => category.name === externalMeetingLabel)

            // create reminders
            const oldReminders = await listRemindersForEvent((newEventExternal as EventPlusType).id, userId)
            const reminders = createRemindersUsingCategoryDefaultsForEvent(newEvent, externalCategory, oldReminders, previousEvent)
            
            if (
                (reminders?.length > 0)
                && !newEvent?.userModifiedReminders
            ) {
                newReminders.push(...reminders)
                newReminders = _.uniqBy(newReminders, 'minutes')
            }

            // create time blocking
            if (!newEvent?.userModifiedTimeBlocking) {
                const timeBlocking = createPreAndPostEventsForCategoryDefaults(externalCategory, newEvent)
                
                if (timeBlocking?.beforeEvent) {
                    newTimeBlocking.beforeEvent = timeBlocking.beforeEvent

                }

                if (timeBlocking?.afterEvent) {
                    newTimeBlocking.afterEvent = timeBlocking.afterEvent
                }

                if (timeBlocking?.newEvent?.preEventId || timeBlocking?.newEvent?.postEventId) {
                    newEvent = timeBlocking.newEvent
                }
            }
        }

        return { newEvent, newReminders, newTimeBlocking }

    } catch (e) {
        
    }
}

export const createRemindersAndTimeBlockingFromPreviousEvent = async (
    userId: string,
    newEvent: EventPlusType,
    newReminders1: ReminderType[],
    newTimeBlocking1: BufferTimeObjectType,
    previousEvent?: EventPlusType
) => {
    try {
        let newReminders = newReminders1 || []
        let newTimeBlocking = newTimeBlocking1 || {}
        const reminders = await createRemindersFromPreviousEventForEvent(newEvent, previousEvent, userId)

        
        if ((reminders?.length > 0)
            && !newEvent?.userModifiedReminders
            && previousEvent?.copyReminders
        ) {
            newReminders.push(...reminders)
        }

        if (
            !newEvent?.userModifiedTimeBlocking
            && previousEvent?.copyTimeBlocking
        ) {
            // create time blocking
            const timeBlocking = createPreAndPostEventsFromPreviousEvent(newEvent, previousEvent)
            
            if (timeBlocking?.beforeEvent) {
                newTimeBlocking.beforeEvent = timeBlocking.beforeEvent

            }

            if (timeBlocking?.afterEvent) {
                newTimeBlocking.afterEvent = timeBlocking.afterEvent
            }

            if (timeBlocking?.newEvent?.preEventId || timeBlocking?.newEvent?.postEventId) {
                newEvent = timeBlocking.newEvent
            }
        }
        return { newEvent, newReminders, newTimeBlocking }

    } catch (e) {
        
    }
}


export const processEventWithFoundPreviousEventAndCopyCategories = async (
    id: string,
    previousEvent: EventPlusType,
    oldEvent: EventPlusType,
    userPreferences: UserPreferenceType,
    bestMatchCategory1: CategoryType,
    userId: string,
    bestMatchCategories1: CategoryType[],
    newModifiedEvent1: EventPlusType,
    newReminders1: ReminderType[] = [],
    newTimeBlocking1: BufferTimeObjectType = {},
    previousCategories: CategoryType[] = [],
    previousMeetingCategoriesWithMeetingLabel: CategoryType[] = [],
    previousMeetingCategoriesWithExternalMeetingLabel: CategoryType[] = [],
) => {
    try {
        // validate
        if (!id) {
            
            return null
        }

        if (!previousEvent) {
            
            return null
        }

        if (!oldEvent) {
            
            return null
        }

        if (!userPreferences) {
            
            return null
        }

        if (!bestMatchCategory1) {
            
            return null
        }

        if (!userId) {
            
            return null
        }

        if (!bestMatchCategories1) {
            
            return null
        }

        if (!newModifiedEvent1) {
            
            return null
        }

        let bestMatchCategories: CategoryType[] = bestMatchCategories1 || []
        let bestMatchCategory: CategoryType | object = bestMatchCategory1 || {}
        let newModifiedEvent: EventPlusType | object = newModifiedEvent1 || {}
        let newReminders: ReminderType[] = newReminders1 || []
        let newTimeBlocking: BufferTimeObjectType = newTimeBlocking1 || {}

        if (
            !previousEvent?.unlink
            && !oldEvent?.userModifiedCategories
        ) {
            // copy over categories from previous event
            if ((previousEvent?.copyCategories || userPreferences?.copyCategories) && (previousCategories?.length > 0)) {
                const categoryEvents: CategoryEventType[] = previousCategories.map(c => {
                    const categoryEvent: CategoryEventType = {
                        categoryId: c.id,
                        eventId: id,
                        userId,
                        id: uuid(),
                        createdDate: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    } as CategoryEventType
                    return categoryEvent
                })
                
                await createCategoryEvents(categoryEvents)
            }

            if (previousCategories?.[0]?.id) {
                // find previous bestMatchCategory
                const body = await findBestMatchCategory2(oldEvent, previousCategories)
                
                const { labels } = body

                const bestMatchLabel = processBestMatchCategoriesNoThreshold(body, labels)
                

                bestMatchCategory = previousCategories.find(category => category.name === bestMatchLabel)

                if ((bestMatchCategory as CategoryType)?.id) {
                    // copy over previousEvent or category defaults
                    newModifiedEvent = copyOverPreviousEventDefaults(oldEvent, previousEvent, bestMatchCategory as CategoryType, userPreferences)
                }
            } else {
                // copy over previousEvent or category defaults
                newModifiedEvent = copyOverPreviousEventDefaults(oldEvent, previousEvent, undefined, userPreferences)
            }

            if ((userPreferences?.copyReminders
                || userPreferences?.copyTimeBlocking)
                && (newModifiedEvent as EventPlusType)?.id) {

                const {
                    newEvent: newEvent1,
                    newReminders: newReminders1,
                    newTimeBlocking: newTimeBlocking1,
                } = await createRemindersAndTimeBlockingFromPreviousEventGivenUserPreferences(userId, newModifiedEvent as EventPlusType, newReminders, newTimeBlocking as BufferTimeObjectType, previousEvent, userPreferences)

                if (newEvent1?.id) {
                    newModifiedEvent = newEvent1
                }

                if (newReminders1?.length > 0) {
                    newReminders = newReminders1
                }

                if (newTimeBlocking1?.afterEvent || newTimeBlocking1?.beforeEvent) {
                    newTimeBlocking = newTimeBlocking1
                }
            }

            if (
                ((bestMatchCategory as CategoryType)?.defaultReminders
                    || (bestMatchCategory as CategoryType)?.defaultTimeBlocking)
                && (newModifiedEvent as EventPlusType)?.id
            ) {

                const {
                    newEvent: newEvent3,
                    newReminders: newReminders3,
                    newTimeBlocking: newTimeBlocking3,
                } = await updateValuesForEventWithPreviousEventPlusMeetingAndExternalMeeting(oldEvent, newModifiedEvent as EventPlusType, bestMatchCategories, newReminders, newTimeBlocking, userId, userPreferences, previousEvent)

                if (newEvent3) {
                    newModifiedEvent = newEvent3
                }

                if (newReminders3) {
                    newReminders = newReminders3
                }

                if (newTimeBlocking3) {
                    newTimeBlocking = newTimeBlocking3
                }
            }

            if (((bestMatchCategory as CategoryType)?.copyReminders
                || (bestMatchCategory as CategoryType)?.copyTimeBlocking)
                && (newModifiedEvent as EventPlusType)?.id) {
                const {
                    newEvent: newEvent2,
                    newReminders: newReminders2,
                    newTimeBlocking: newTimeBlocking2,
                } = await createRemindersAndTimeBlockingForBestMatchCategory(id, userId, newModifiedEvent as EventPlusType, bestMatchCategory as CategoryType, newReminders, newTimeBlocking)
                if (newEvent2?.id) {
                    newModifiedEvent = newEvent2
                }

                if (newReminders2?.[0]?.id) {
                    newReminders = newReminders2
                }

                if ((newTimeBlocking2 as BufferTimeObjectType)?.beforeEvent?.id || (newTimeBlocking2 as BufferTimeObjectType)?.afterEvent?.id) {
                    newTimeBlocking = newTimeBlocking2
                }
            }

            if (
                (previousMeetingCategoriesWithMeetingLabel?.[0]?.copyReminders
                    || previousMeetingCategoriesWithMeetingLabel?.[0]?.copyTimeBlocking)
                && (newModifiedEvent as EventPlusType)?.id
            ) {
                const {
                    newEvent: newEvent2,
                    newReminders: newReminders2,
                    newTimeBlocking: newTimeBlocking2,
                } = await createRemindersAndTimeBlockingForBestMatchCategory(id, userId, newModifiedEvent as EventPlusType, previousMeetingCategoriesWithMeetingLabel?.[0], newReminders, newTimeBlocking)
                if (newEvent2?.id) {
                    newModifiedEvent = newEvent2
                }

                if (newReminders2?.[0]?.id) {
                    newReminders = newReminders2
                }

                if (newTimeBlocking2?.afterEvent?.id || newTimeBlocking2?.beforeEvent?.id) {
                    newTimeBlocking = newTimeBlocking2
                }
            }

            if ((previousMeetingCategoriesWithExternalMeetingLabel?.[0]?.copyReminders
                || previousMeetingCategoriesWithExternalMeetingLabel?.[0]?.copyTimeBlocking)
                && (newModifiedEvent as EventPlusType)?.id) {
                const {
                    newEvent: newEvent2,
                    newReminders: newReminders2,
                    newTimeBlocking: newTimeBlocking2,
                } = await createRemindersAndTimeBlockingForBestMatchCategory(id, userId, newModifiedEvent as EventPlusType, previousMeetingCategoriesWithExternalMeetingLabel?.[0], newReminders, newTimeBlocking)
                if (newEvent2) {
                    newModifiedEvent = newEvent2
                }

                if (newReminders2) {
                    newReminders = newReminders2
                }

                if (newTimeBlocking2) {
                    newTimeBlocking = newTimeBlocking2
                }
            }

            if ((previousEvent?.copyReminders
                || previousEvent?.copyTimeBlocking)
                && (newModifiedEvent as EventPlusType)?.id) {

                const {
                    newEvent: newEvent1,
                    newReminders: newReminders1,
                    newTimeBlocking: newTimeBlocking1,
                } = await createRemindersAndTimeBlockingFromPreviousEvent(userId, newModifiedEvent as EventPlusType, newReminders, newTimeBlocking)

                if (newEvent1?.id) {
                    newModifiedEvent = newEvent1
                }

                if (newReminders1?.[0]?.id) {
                    newReminders = newReminders1
                }

                if ((newTimeBlocking1 as BufferTimeObjectType)?.afterEvent?.id || (newTimeBlocking1 as BufferTimeObjectType)?.beforeEvent?.id) {
                    newTimeBlocking = newTimeBlocking1
                }
            }

            bestMatchCategories = getUniqueLabels(bestMatchCategories)
            
        }

        
        
        

        return {
            newModifiedEvent,
            newReminders,
            newTimeBlocking,
        }
    } catch (e) {
        
    }
}

export const processEventWithFoundPreviousEventWithoutCategories = async (
    previousEvent: EventPlusType,
    event: EventPlusType,
    userPreferences: UserPreferenceType,
    userId: string,
    newReminders: ReminderType[] = [],
    newTimeBlocking: BufferTimeObjectType = {},
) => {
    try {
        // validate
        
        if (!previousEvent) {
            
            return null
        }

        if (!userPreferences) {
            
            return null
        }

        if (!userId) {
            
            return null
        }

        if (!event) {
            
            return null
        }

        let newModifiedEvent = event

        if (
            !previousEvent?.unlink
        ) {
            newModifiedEvent = copyOverPreviousEventDefaults(event, previousEvent, undefined, userPreferences)
            
            if ((userPreferences?.copyReminders
                || userPreferences?.copyTimeBlocking)
                && (event as EventPlusType)?.id) {

                const {
                    newEvent: newEvent1,
                    newReminders: newReminders1,
                    newTimeBlocking: newTimeBlocking1,
                } = await createRemindersAndTimeBlockingFromPreviousEventGivenUserPreferences(userId, newModifiedEvent as EventPlusType, newReminders, newTimeBlocking as BufferTimeObjectType, previousEvent, userPreferences)

                if (newEvent1?.id) {
                    newModifiedEvent = newEvent1
                }

                if (newReminders1?.length > 0) {
                    newReminders = newReminders1
                }

                if (newTimeBlocking1?.afterEvent || newTimeBlocking1?.beforeEvent) {
                    newTimeBlocking = newTimeBlocking1
                }
            }

            if ((previousEvent?.copyReminders
                || previousEvent?.copyTimeBlocking)
                && (event as EventPlusType)?.id) {

                const {
                    newEvent: newEvent1,
                    newReminders: newReminders1,
                    newTimeBlocking: newTimeBlocking1,
                } = await createRemindersAndTimeBlockingFromPreviousEvent(userId, newModifiedEvent as EventPlusType, newReminders, newTimeBlocking)

                if (newEvent1?.id) {
                    newModifiedEvent = newEvent1
                }

                if (newReminders1?.[0]?.id) {
                    newReminders = newReminders1
                }

                if ((newTimeBlocking1 as BufferTimeObjectType)?.afterEvent?.id || (newTimeBlocking1 as BufferTimeObjectType)?.beforeEvent?.id) {
                    newTimeBlocking = newTimeBlocking1
                }
            }
        }

        
        
        

        return {
            newModifiedEvent,
            newReminders,
            newTimeBlocking,
        }

    } catch (e) {
        
    }
}

export const processUserEventWithFoundPreviousEvent = async (event: EventPlusType, previousEventId: string) => {
    try {
        const { id, userId } = event
        
        // validate
        if (!id || !userId) {
            throw new Error('id or userId is missing')
        }
        // get previous event
        const previousEvent = await getEventFromPrimaryKey(previousEventId)
        const preferredTimeRanges = await listPreferredTimeRangesForEvent(previousEventId)
        previousEvent.preferredTimeRanges = preferredTimeRanges
        
        // find categories and copy over defaults if any
        const categories: CategoryType[] = await getUserCategories(userId)
        

        // labelConstants are already part of categories
        // 

        const body: ClassificationResponseBodyType = await findBestMatchCategory2(event, categories)
        
        const { labels, scores } = body

        const bestMatchLabel = processBestMatchCategories(body, labels)
        
        let bestMatchCategory: CategoryType | object = {}
        if (bestMatchLabel) {
            bestMatchCategory = categories.find(category => category.name === bestMatchLabel)
        }

        let bestMatchCategoriesPlusMeetingType = []
        if ((bestMatchCategory as CategoryType)?.id) {
            bestMatchCategoriesPlusMeetingType = await processEventForMeetingTypeCategories(event, bestMatchCategory as CategoryType, labels, scores, categories)
            
        }

        // getUserPreferences
        const userPreferences = await getUserPreferences(userId)
        
        if (!userPreferences) {
            throw new Error('userPreferences is missing')
        }

        let newModifiedEvent = event
        let newReminders: ReminderType[] = []
        let newTimeBlocking: BufferTimeObjectType = {}

        

        if ((previousEvent?.copyCategories
            || userPreferences?.copyCategories)
            && !previousEvent?.unlink
            && !event?.userModifiedCategories) {

            // get previous categories for event
            const previousCategories = await listCategoriesForEvent(previousEvent.id)
            

            if (
                userPreferences?.id
                && newModifiedEvent?.id
            ) {
                // meeting and external meeting categories
                const previousMeetingCategoriesWithMeetingLabel = previousCategories.filter(category => category.name === meetingLabel)
                // meeting and external meeting categories
                const previousMeetingCategoriesWithExternalMeetingLabel = previousCategories.filter(category => category.name === externalMeetingLabel)
                const {
                    newModifiedEvent: newModifiedEvent1,
                    newReminders: newReminders1,
                    newTimeBlocking: newTimeBlocking1,
                } = await processEventWithFoundPreviousEventAndCopyCategories(
                    id,
                    previousEvent,
                    event,
                    userPreferences,
                    bestMatchCategory as CategoryType,
                    userId,
                    bestMatchCategoriesPlusMeetingType,
                    newModifiedEvent,
                    newReminders,
                    newTimeBlocking,
                    previousCategories,
                    previousMeetingCategoriesWithMeetingLabel,
                    previousMeetingCategoriesWithExternalMeetingLabel,
                )
                
                
                newModifiedEvent = newModifiedEvent1 as EventPlusType
                newReminders = newReminders1
                newTimeBlocking = newTimeBlocking1 as BufferTimeObjectType

            } else {
                const {
                    newModifiedEvent: newModifiedEvent1,
                    newReminders: newReminders1,
                    newTimeBlocking: newTimeBlocking1,
                } = await processEventWithFoundPreviousEventWithoutCategories(previousEvent, newModifiedEvent, userPreferences, userId, newReminders, newTimeBlocking)
                
                
                newModifiedEvent = newModifiedEvent1 as EventPlusType
                newReminders = newReminders1
                newTimeBlocking = newTimeBlocking1 as BufferTimeObjectType
            }
        }

        if (
            userPreferences?.id
            && !previousEvent?.copyCategories
            && !userPreferences?.copyCategories
            && !event?.userModifiedCategories
            && event?.id
            && previousEvent?.id
        ) {

            if (
                (bestMatchCategory as CategoryType)?.id
                && (bestMatchCategoriesPlusMeetingType?.length > 0)
            ) {
                // copy over previousEvent or category defaults
                newModifiedEvent = copyOverPreviousEventDefaults(event, previousEvent, bestMatchCategory as CategoryType, userPreferences)
                
                if (newModifiedEvent?.id) {
                    const {
                        newEvent: newEvent1,
                        newReminders: newReminders1,
                        newTimeBlocking: newTimeBlocking1,
                    } = await createRemindersAndTimeBlockingForBestMatchCategory(id, userId, newModifiedEvent, bestMatchCategory as CategoryType, newReminders, newTimeBlocking)
                    
                    
                    newModifiedEvent = newEvent1
                    newReminders = newReminders1
                    newTimeBlocking = newTimeBlocking1

                    
                    
                    

                    //  Meeting and external meeting categories always override other categories
                    const {
                        newEvent: newEvent2,
                        newReminders: newReminders2,
                        newTimeBlocking: newTimeBlocking2,
                    } = await updateValuesForEventWithPreviousEventPlusMeetingAndExternalMeeting(event, newModifiedEvent, bestMatchCategoriesPlusMeetingType, newReminders, newTimeBlocking, userId, userPreferences, previousEvent)
                    
                    
                    newModifiedEvent = newEvent2
                    newReminders = newReminders2
                    newTimeBlocking = newTimeBlocking2

                    
                    
                    
                }
            } else {
                const {
                    newModifiedEvent: newModifiedEvent1,
                    newReminders: newReminders1,
                    newTimeBlocking: newTimeBlocking1,
                } = await processEventWithFoundPreviousEventWithoutCategories(previousEvent, newModifiedEvent, userPreferences, userId, newReminders, newTimeBlocking)
                
                
                newModifiedEvent = newModifiedEvent1 as EventPlusType
                newReminders = newReminders1
                newTimeBlocking = newTimeBlocking1 as BufferTimeObjectType
            }

        }

        // create new event
        const newEvent: EventPlusType = newModifiedEvent ?? event
        

        return {
            newEvent,
            newReminders,
            newTimeBlocking
        }

    } catch (e) {
        
    }
}

export const processUserEventWithFoundPreviousEventWithUserModifiedCategories = async (event: EventPlusType, previousEventId: string) => {
    try {
        // validate
        if (!event?.id) {
            throw new Error('event is missing')
        }
        if (!previousEventId) {
            throw new Error('previousEventId is missing')
        }

        // get event categories and copy over defaults if any
        const categories: CategoryType[] = await listCategoriesForEvent(event?.id)
        if (!categories?.[0]?.id) {
            throw new Error('categories is missing')
        }
        
        // get previous event
        const previousEvent = await getEventFromPrimaryKey(previousEventId)
        const preferredTimeRanges = await listPreferredTimeRangesForEvent(previousEventId)
        previousEvent.preferredTimeRanges = preferredTimeRanges
        if (!previousEvent?.id) {
            throw new Error('previousEvent is missing')
        }
        // labelConstants are already part of categories
        
        const body = await findBestMatchCategory2(event, categories)
        
        if (body?.labels?.[0]) {
            const { labels } = body

            const bestMatchLabel = processBestMatchCategoriesNoThreshold(body, labels)
            
            if (bestMatchLabel) {
                let bestMatchCategory = categories.find(category => category.name === bestMatchLabel)
                if (!bestMatchCategory) {
                    throw new Error('bestMatchCategory is missing')
                }
                // getUserPreferences
                const userPreferences = await getUserPreferences(event?.userId)
                
                if (!userPreferences) {
                    throw new Error('userPreferences is missing')
                }
                let newModifiedEvent = copyOverPreviousEventDefaults(event, previousEvent, bestMatchCategory, userPreferences)
                
                let newReminders: ReminderType[] = []
                let newTimeBlocking: BufferTimeObjectType = {}


                if ((categories?.length > 0)
                    && newModifiedEvent?.id
                ) {
                    //  Meeting and external meeting categories always override other categories
                    const {
                        newEvent: newEvent1,
                        newReminders: newReminders1,
                        newTimeBlocking: newTimeBlocking1,
                    } = await updateValuesForEventWithPreviousEventPlusMeetingAndExternalMeeting(event, newModifiedEvent, categories, newReminders, newTimeBlocking, event?.userId, userPreferences, previousEvent)
                    newModifiedEvent = newEvent1
                    newReminders = newReminders1 || []
                    newTimeBlocking = newTimeBlocking1 || {}

                    
                    
                    

                }

                // create new event
                const newEvent: EventPlusType = newModifiedEvent ?? event
                

                return {
                    newEvent,
                    newReminders,
                    newTimeBlocking
                }
            }
        }
    } catch (e) {
        
    }
}

export const deleteOptaPlan = async (
    userId: string,
) => {
    try {
        // delete OptaPlanner
        
        await got.delete(
            `${optaPlannerUrl}/timeTable/admin/delete/${userId}`,
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Basic ${Buffer.from(`${optaPlannerUsername}:${optaPlannerPassword}`).toString('base64')}`,
                },
            }
        ).json()

        
    } catch (e) {
        
    }
}

export const validateEventsFromOptaplanner = (unsortedEvents: EventPlannerResponseBodyType[]) => {
    const sortedEvents = unsortedEvents.sort((a, b) => {
        if (a.part < b.part) {
            return -1
        }
        if (a.part > b.part) {
            return 1
        }
        return 0
    })
    const firstPartStartTime = sortedEvents?.[0]?.timeslot?.startTime
    const firstPartEndTime = sortedEvents?.[0]?.timeslot?.endTime
    const lastPartEndTime = sortedEvents?.[sortedEvents?.length - 1]?.timeslot?.endTime

    const startHour = parseInt(firstPartStartTime.split(':')[0], 10)
    const startMinute = parseInt(firstPartStartTime.split(':')[1], 10)
    const endHour = parseInt(lastPartEndTime.split(':')[0], 10)
    const endMinute = parseInt(lastPartEndTime.split(':')[1], 10)

    // actual minutes expected
    const firstPartEndHour = parseInt(firstPartEndTime.split(':')[0], 10)
    const firstPartEndMinute = parseInt(firstPartEndTime.split(':')[1], 10)
    const durationMinutes = dayjs.duration(dayjs().hour(startHour).minute(startMinute).diff(dayjs().hour(firstPartEndHour).minute(firstPartEndMinute))).asMinutes()

    const plannerDurationMinutes = dayjs.duration(dayjs().hour(startHour).minute(startMinute).diff(dayjs().hour(endHour).minute(endMinute))).asMinutes()

    const expectedDurationMinutes = sortedEvents?.[0]?.lastPart * durationMinutes

    const diffMinutes = Math.abs(plannerDurationMinutes - expectedDurationMinutes)

    if (Math.round(diffMinutes) > 0) {
        
        
        
        
        for (const sortedEvent of sortedEvents) {
            
        }

        throw new Error('plannerDurationMinutes are not equal to expectedDurationMinutes inside validateEventFromOptaplanner and more than 30 minutes apart')
    }
}

export const getMonthDayFromSlot = (monthDay: MonthDayType): { month: MonthType, day: DayType } => {
    // --12-01
    const monthString = monthDay.slice(2, 4)
    const dayString = monthDay.slice(5, 7)
    const month = (parseInt(monthString, 10) - 1) as MonthType
    const day = parseInt(dayString, 10) as DayType
    return { month, day }
}

export const formatPlannerEventsToEventAndAdjustTime = (events: EventPlannerResponseBodyType[], oldEvent: EventPlusType, hostTimezone: string): EventPlusType => {
    // validate
    if (!events?.[0]?.id) {
        
        return null
    }

    if (!oldEvent?.id) {
        
        return null
    }

    if (!oldEvent?.calendarId) {
        throw new Error('no calendarId inside oldEvent')
    }

    if (!dayjs(events?.[0]?.startDate).isValid()) {
        
        throw new Error('startDate is not valid before formatting')
    }

    if (!dayjs(events?.[0]?.endDate).isValid()) {
        
        throw new Error('startDate is not valid before formatting')
    }

    // validate if something went wrong with the planner

    const sortedEvents = events.sort((a, b) => {
        if (a.part < b.part) {
            return -1
        }
        if (a.part > b.part) {
            return 1
        }
        return 0
    })

    // events validated add them to search


    // const oldEventResponse = sortedEvents[0]
    const firstPart = sortedEvents[0]
    const lastPart = sortedEvents[sortedEvents.length - 1]
    // const isoWeekStart = isoWeekOfStartDates.find(isoObject => (isoObject.isoWeekDay === dayOfWeekStringToInt[firstPart.timeslot.dayOfWeek]))?.isoWeek
    // const isoWeekEnd = isoWeekOfStartDates.find(isoObject => (isoObject.isoWeekDay === dayOfWeekStringToInt[lastPart.timeslot.dayOfWeek]))?.isoWeek

    const monthDay = firstPart?.timeslot?.monthDay
    const { month, day } = getMonthDayFromSlot(monthDay)

    const startHour = firstPart?.timeslot?.startTime ? parseInt(firstPart.timeslot.startTime.split(':')[0], 10)
        : dayjs(oldEvent.startDate.slice(0, 19)).tz(oldEvent.timezone, true).hour()

    const startMinute = firstPart?.timeslot?.startTime ? parseInt(firstPart.timeslot.startTime.split(':')[1], 10)
        : dayjs(oldEvent.startDate.slice(0, 19)).tz(oldEvent.timezone, true).minute()
    const startDate = firstPart?.timeslot?.monthDay ? dayjs(oldEvent.startDate.slice(0, 19)).tz(oldEvent.timezone, true)
        .tz(hostTimezone)
        .month(month)
        .date(day)
        .hour(startHour).minute(startMinute)
        .tz(oldEvent.timezone)
        .format()
        : dayjs(oldEvent.startDate.slice(0, 19))
            .tz(oldEvent.timezone, true)
            .hour(startHour)
            .minute(startMinute)
            .format()

    const endHour = lastPart?.timeslot?.endTime ? parseInt(lastPart.timeslot.endTime.split(':')[0], 10)
        : dayjs(oldEvent.endDate.slice(0, 19)).tz(oldEvent.timezone, true).hour()
    const endMinute = lastPart?.timeslot?.endTime ? parseInt(lastPart.timeslot.endTime.split(':')[1], 10)
        : dayjs(oldEvent.endDate.slice(0, 19)).tz(oldEvent.timezone, true).minute()
    const endDate = lastPart?.timeslot?.monthDay ? dayjs(oldEvent.endDate.slice(0, 19)).tz(oldEvent.timezone, true)
        .tz(hostTimezone)
        .month(month)
        .date(day)
        .hour(endHour)
        .minute(endMinute)
        .tz(oldEvent.timezone)
        .format()
        : dayjs(oldEvent.endDate.slice(0, 19))
            .tz(oldEvent.timezone, true)
            .minute(endMinute)
            .hour(endHour)
            .format()

    
        .date(day)
        .hour(startHour).minute(startMinute).format(), ` oldEvent.id, startDate, firstPart?.timeslot?.dayOfWeek, firstPart?.timeslot?.monthDay, firstPart?.timeslot?.startTime, startHour, startMinute, dayjs(oldEvent.startDate.slice(0, 19)).tz(oldEvent.timezone, true).month(month)
  .date(day)
  .hour(startHour).minute(startMinute).format(),`)


    
        .month(month)
        .date(day)
        .hour(endHour).minute(endMinute).format(), ` oldEvent.id, endDate, lastPart?.timeslot?.dayOfWeek, lastPart?.timeslot?.monthDay, lastPart?.timeslot?.endTime, endHour, endMinute, dayjs(oldEvent.endDate.slice(0, 19)).tz(oldEvent.timezone, true)
    .month(month)
    .date(day)
    .hour(endHour).minute(endMinute).format()`)

    const newEvent: EventPlusType = {
        ...oldEvent,
        startDate,
        endDate,
    }
    

    if (!dayjs(startDate).isValid()) {
        throw new Error('startDate is not valid after formatting')
    }

    if (!dayjs(endDate).isValid()) {
        throw new Error('startDate is not valid after formatting')
    }

    return newEvent

}

export const putDataInSearch = async (
    id: string,
    vector: number[],
    userId: string,
) => {
    try {
        const client = await getSearchClient()
        const response = await client.index({
            id,
            index: searchIndex,
            body: { [eventVectorName]: vector, userId },
            refresh: true
        })
        
        
    } catch (e) {
        
    }
}


export const compareEventsToFilterUnequalEvents = (newEvent: EventPlusType, oldEvent?: EventPlusType) => {

    // validate
    if (!oldEvent?.id) {
        
        return true
    }

    if (!newEvent?.id) {
        
        throw new Error(`${newEvent} --- ${newEvent?.id}, no  newEvent?.id inside compareEventsToFilterUnequalEvents- bug`)
    }

    const oldEventModified = {
        ...oldEvent,
        startDate: dayjs(oldEvent.startDate.slice(0, 19)).tz(oldEvent.timezone, true).format(),
        endDate: dayjs(oldEvent.endDate.slice(0, 19)).tz(oldEvent.timezone, true).format()
    }

    const newEventModified = {
        ...newEvent,
        startDate: dayjs(newEvent.startDate.slice(0, 19)).tz(newEvent.timezone, true).format(),
        endDate: dayjs(newEvent.endDate.slice(0, 19)).tz(newEvent.timezone, true).format(),
    }
    
    return !_.isEqual(newEventModified, oldEventModified)
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
        title
        backgroundColor
        account
        accessLevel
        createdDate
        defaultReminders
        primary
        globalPrimary
        foregroundColor
        pageToken
        syncToken
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

export const refreshZoomToken = async (
    refreshToken: string,
):Promise<{
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

export const createGoogleEventWithId = async (
    userId: string,
    calendarId: string,
    clientType: 'ios' | 'android' | 'web',
    eventId: string,
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

        // create request body
        let data: any = {}

        if (endDateTime && timezone && !endDate) {

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

        data.id = eventId

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

        // create request body
        let data: any = {}

        if (endDateTime && timezone && !endDate) {

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

        if ((reminders?.overrides?.length > 0) || (reminders?.useDefault)) {
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

        

        
        return { id: `${res?.data?.id}#${calendarId}`, googleEventId: res?.data?.id, generatedId, calendarId, generatedEventId: generatedId.split('#')[0] }
    } catch (e) {
        
    }
}

export const postPlannerModifyEventInCalendar = async (
    newEvent: EventPlusType, 
    userId: string, 
    method: 'update' | 'create' | 'createWithId', 
    resource: string,
    isTimeBlocking: boolean, 
    clientType: 'ios' | 'android' | 'web', 
    newReminders?: ReminderType[],
    attendees?: MeetingAssistAttendeeType[],
    conference?: ConferenceType,
): Promise<string | CreateGoogleEventResponseType> => {
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

                const idResponseBody: CreateGoogleEventResponseType = await createGoogleEvent(
                    userId,
                    newEvent.calendarId,
                    clientType,
                    newEvent?.id, // generatedId
                    newEvent?.endDate,
                    newEvent?.startDate,
                    conference?.id ? 1 : 0,
                    undefined,
                    undefined,
                    undefined,
                    attendees?.map(a => ({ email: a?.primaryEmail?.trim(), id: a?.id, displayName: a?.name })),
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
                
                    newEvent?.startDate, ' idResponseBody, newEvent?.endDate,  newEvent?.startDate')
                return idResponseBody
            }
        } else if (method === 'createWithId') {
            // createGoogleEventWithId
            
            // create task events only
            if (resource === googleCalendarResource) {
                const googleReminders: GoogleReminderType = newReminders?.length > 0 ? formatRemindersForGoogle(newReminders) : undefined

                await createGoogleEventWithId(
                    userId,
                    newEvent.calendarId,
                    clientType,
                    newEvent?.eventId, // createdId for host event
                    newEvent?.endDate,
                    newEvent?.startDate,
                    conference?.id ? 1 : 0,
                    undefined,
                    undefined,
                    undefined,
                    attendees?.map(a => ({ email: a?.primaryEmail, id: a?.id, displayName: a?.name })),
                    conference?.id ? {
                        type: conference?.app === 'zoom' ? 'addOn' : 'hangoutsMeet',
                        name: conference?.name,
                        conferenceId: conference?.id,
                        entryPoints: conference?.entryPoints,
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
                
            }

        }

        
    } catch (e) {
        
        
            newEvent?.startDate, ' error - newEvent?.id, newEvent?.endDate,  newEvent?.startDate')
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
                            unlink,
                            copyColor,
                            userModifiedColor,
                            byWeekDay,
                            localSynced,
                            meetingId,
                            eventId,
                        ]
                    }){
                    returning {
                        id
                    }
                    affected_rows
                }
            }
        `
       
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
        
        
        return response
    } catch (e) {
        
    }
}

export const deleteRemindersWithIds = async (
    eventIds: string[],
    userId: string,
) => {
    try {
        // validate
        if (!(eventIds?.filter(e => !!e)?.length > 0)) {
            return
        }
        
        const operationName = 'deleteRemindersWithIds'
        const query = `
      mutation deleteRemindersWithIds($userId: uuid!, $eventIds: [String!]!) {
        delete_Reminder(where: {userId: {_eq: $userId}, eventId: {_in: $eventIds}}) {
          affected_rows
        }
      }    
    `

        const variables = {
            userId,
            eventIds,
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

export const insertReminders = async (
    reminders: ReminderTypeAdjusted[],
) => {
    try {
        // validate
        if (!(reminders?.filter(e => !!(e?.eventId))?.length > 0)) {
            return
        }

        const operationName = 'InsertReminder'
        const query = `
            mutation InsertReminder($reminders: [Reminder_insert_input!]!) {
                insert_Reminder(objects: $reminders) {
                    affected_rows
                    returning {
                        id
                        createdDate
                        deleted
                        eventId
                        method
                        minutes
                        reminderDate
                        timezone
                        updatedAt
                        useDefault
                        userId
                    }
                }
            }
        `
        const variables = {
            reminders
        }

        const response: { data: { insert_Reminder: { returning: ReminderType[] } } } = await got.post(hasuraGraphUrl, {
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

export const deletePreferredTimeRangesForEvents = async (
    eventIds: string[],
) => {
    try {
        const operationName = 'DeletePreferredTimeRangesGivenEvents'
        const query = `mutation DeletePreferredTimeRangesGivenEvents($eventIds: [String!]!) {
                delete_PreferredTimeRange(where: {eventId: {_in: $eventIds}}) {
                    affected_rows
                }
            }
        `

        const variables = {
            eventIds
        }

        const res: { data: { delete_PreferredTimeRange: { affected_rows: number } } } = await got.post(hasuraGraphUrl, {
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
export const deletePreferredTimeRangesForEvent = async (
    eventId: string,
) => {
    try {
        if (!eventId) {
            
            return
        }

        const operationName = 'DeletePreferredTimeRangesGivenEvent'
        const query = `
      mutation DeletePreferredTimeRangesGivenEvent($eventId: String!) {
        delete_PreferredTimeRange(where: {eventId: {_eq: $eventId}}) {
          affected_rows
        }
      }
    `

        const variables = {
            eventId,
        }

        const res: { data: { delete_PreferredTimeRange: { affected_rows: number } } } = await got.post(hasuraGraphUrl, {
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

export const insertPreferredTimeRanges = async (
    preferredTimeRanges: PreferredTimeRangeType[]
) => {
    try {
        // validate
        if (!(preferredTimeRanges?.length > 0)) {
            
            return
        }

        const operationName = 'InsertPreferredTimeRanges'
        const query = `
      mutation InsertPreferredTimeRanges($preferredTimeRanges: [PreferredTimeRange_insert_input!]!) {
        insert_PreferredTimeRange(objects: $preferredTimeRanges) {
          affected_rows
          returning {
            createdDate
            dayOfWeek
            endTime
            eventId
            id
            startTime
            updatedAt
            userId
          }
        }
      }
    `

        const variables = {
            preferredTimeRanges,
        }

        const response: { data: { insert_PreferredTimeRange: { returning: PreferredTimeRangeType[], affected_rows: number } } } = await got.post(hasuraGraphUrl, {
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

export const updateAllCalendarEventsPostPlanner = async (
    plannerEvents: EventPlannerResponseBodyType[][],
    eventsToValidate: EventPlannerResponseBodyType[][],
    allEvents: EventPlusType[],
    oldEvents: EventPlusType[],
    hostTimezone: string,
    hostBufferTimes?: BufferTimeObjectType[],
    newHostReminders?: RemindersForEventType[],
    breaks?: EventPlusType[],
    oldAttendeeExternalEvents?: MeetingAssistEventType[],
) => {
    try {
        // validate events
        eventsToValidate.forEach(e => validateEventsFromOptaplanner(e))
        // format planner events returned to app events
        const eventsToUpdate: EventPlusType[] = plannerEvents.map(e => formatPlannerEventsToEventAndAdjustTime(e, allEvents?.find(event => event.id === e[0].eventId), hostTimezone))
       

        // filter out external events
        const filteredAllEvents = allEvents.map(e => {
            const foundIndex = oldAttendeeExternalEvents?.findIndex(a => (a?.id === e?.id))
            if (foundIndex > -1) {
                return null
            }
            return e
        })
        ?.filter(e => (e !== null))
        

        // get all meetingIds to create a bank of sister events for main meeting event for internal attendees
        const eventsWithMeetingIds = filteredAllEvents?.filter(e => !!(e?.meetingId)) || []
        const meetingIdsOfInternalAttendees = _.uniqBy(filteredAllEvents, 'meetingId')
            ?.filter(e => !!(e?.meetingId))
            ?.map(e => (e.meetingId))
            
        

        

        const eventsToBeCreatedWithNewId: { 
            meetingId: string, 
            event: EventPlusType, 
            conference?: ConferenceType, 
            attendees?: MeetingAssistAttendeeType[],
            resource?: string,
            clientType?: 'ios' | 'android' | 'web'
         }[] = []

        if (meetingIdsOfInternalAttendees && (meetingIdsOfInternalAttendees?.length > 0)) {
            const meetingAssists = await listMeetingAssistsGivenMeetingIds(meetingIdsOfInternalAttendees) || []
            // loop through each and add each meeting assist event sin host event & external attendee
            for (const meetingAssist of meetingAssists) {

                const attendees = await listMeetingAssistAttendeesGivenMeetingId(meetingAssist?.id)
                const externalAttendees = attendees?.filter(a => !!(a?.externalAttendee))

                const eventForMeetingIdHostOnly = eventsWithMeetingIds?.filter(e => (e?.meetingId === meetingAssist?.id))
                    ?.filter(e => (e?.userId === meetingAssist?.userId))
                    ?.filter (e => (e?.method === 'create'))
                    ?.filter(e => {
                        const externalIndex = externalAttendees?.findIndex(a => (a?.userId === e?.userId))
                        if (externalIndex > -1) {
                            return false
                        }

                        return true
                    })?.[0]

                const eventsForMeetingIdSinHost = eventsWithMeetingIds?.filter(e => (e?.meetingId === meetingAssist?.id))
                    ?.filter(e => (e?.userId !== meetingAssist?.userId))
                    ?.filter (e => (e?.method === 'create'))
                    ?.filter(e => {
                        const externalIndex = externalAttendees?.findIndex(a => (a?.userId === e?.userId))
                        if (externalIndex > -1) {
                            return false
                        }

                        return true
                    })
                
                
                
                for (const eventForMeetingIdSinHost of eventsForMeetingIdSinHost) {

                    // synchronize dates for new create events
                    eventForMeetingIdSinHost.startDate = dayjs(eventForMeetingIdHostOnly.startDate.slice(0, 19)).tz(eventForMeetingIdHostOnly.timezone, true).tz(eventForMeetingIdSinHost.timezone).format()
                    eventForMeetingIdSinHost.endDate = dayjs(eventForMeetingIdHostOnly.endDate.slice(0, 19)).tz(eventForMeetingIdHostOnly.timezone, true).tz(eventForMeetingIdSinHost.timezone).format()

                    eventsToBeCreatedWithNewId.push({
                        meetingId: meetingAssist?.id,
                        event: eventForMeetingIdSinHost,
                    })
                }

                // synchronize dates for events with meetingIds
                // regardless of method === create or update

                const eventsForMeetingIdSinHostAnyMethod = eventsWithMeetingIds?.filter(e => (e?.meetingId === meetingAssist?.id))
                    ?.filter(e => (e?.userId !== meetingAssist?.userId))
                    ?.filter(e => {
                        const externalIndex = externalAttendees?.findIndex(a => (a?.userId === e?.userId))
                        if (externalIndex > -1) {
                            return false
                        }

                        return true
                    })


                const eventForMeetingIdHostOnlyAnyMethod = eventsWithMeetingIds?.filter(e => (e?.meetingId === meetingAssist?.id))
                    ?.filter(e => (e?.userId === meetingAssist?.userId))
                    ?.filter(e => {
                        const externalIndex = externalAttendees?.findIndex(a => (a?.userId === e?.userId))
                        if (externalIndex > -1) {
                            return false
                        }

                        return true
                    })?.[0]
                
                if (eventForMeetingIdHostOnlyAnyMethod?.id) {
                    eventsForMeetingIdSinHostAnyMethod?.forEach(e => {
                        e.startDate = dayjs(eventForMeetingIdHostOnlyAnyMethod.startDate.slice(0, 19)).tz(eventForMeetingIdHostOnlyAnyMethod.timezone, true).tz(e.timezone).format()
                        e.endDate = dayjs(eventForMeetingIdHostOnlyAnyMethod.endDate.slice(0, 19)).tz(eventForMeetingIdHostOnlyAnyMethod.timezone, true).tz(e.timezone).format()
                    })
                }
            }
        }

        // filter out unmodifiable events, unequal events, external events, attendee new meeting events (to be created later)
        const filteredEventsToUpdate = eventsToUpdate.filter(e1 => {
            const foundOldEvent = oldEvents?.find(e2 => (e2?.id === e1?.id))
            
            if (foundOldEvent) {
                return compareEventsToFilterUnequalEvents(e1, foundOldEvent)
            }
            return true
        })
        ?.filter(e => {
            const eventExists = oldAttendeeExternalEvents?.find(a => (a?.id === e?.id))
            
            return !eventExists
        })
        ?.filter(e => {
            const createEventSinHostIndex = eventsToBeCreatedWithNewId?.findIndex(c => c?.event?.id === e?.id)

            if (createEventSinHostIndex > -1) {
                return false
            }
            return true
        })
        ?.filter(e => !!e)

        // events validated, add event vectors to search
        for (let i = 0; i < filteredAllEvents.length; i++) {
            if (filteredAllEvents[i]?.vector) {
                await putDataInSearch(filteredAllEvents[i].id, filteredAllEvents[i].vector, filteredAllEvents[i].userId)
            }
        }

        let createPromises: Promise<CreateGoogleEventResponseType>[] = []
        // let eventsToBeCreatedWithNewIdPromises: Promise<undefined>[] = []
        let updatePromises: Promise<string>[] = []
        const eventsToUpsert: EventPlusType[] = []
        const deleteReminders: ReminderTypeAdjusted[] = []
        const insertReminderObjects: ReminderTypeAdjusted[] = []
        const insertPreferredTimeRangeObjects: PreferredTimeRangeType[] = []
        const deletePreferredTimeRangeObjects: PreferredTimeRangeType[] = []

        const eventToFilterForUpdateConferences: EventPlusType[] = []

        const eventsToRemove: EventPlusType[] = []

       
        // deletePreferredTimeRangesForEvent
        // insertPreferredTimeRanges
        for (const eventToUpdate of filteredEventsToUpdate) {
            
            const { resource } = await getCalendarWithId(eventToUpdate.calendarId)
            const calendarIntegration = await getCalendarIntegration(eventToUpdate.userId, resource)
            const clientType = calendarIntegration?.clientType
            const beforeEventIndex = hostBufferTimes?.findIndex(bufferTimes => (bufferTimes?.beforeEvent?.id === eventToUpdate.id))
            
            const afterEventIndex = hostBufferTimes?.findIndex(bufferTimes => (bufferTimes?.afterEvent?.id === eventToUpdate.id))
            
            const remindersObjectForEvent = newHostReminders?.find(reminder => reminder.eventId === eventToUpdate.id)
            const breakIndex = breaks?.findIndex(breakEvent => breakEvent.id === eventToUpdate.id)
            if (beforeEventIndex > -1) {
                
                if (resource === googleCalendarResource) {
                    
                    if (hostBufferTimes?.[beforeEventIndex]?.beforeEvent?.method === 'create') {
                        
                        createPromises.push(
                            postPlannerModifyEventInCalendar(
                                eventToUpdate,
                                eventToUpdate.userId,
                                'create',
                                resource,
                                true,
                                clientType,
                                remindersObjectForEvent?.reminders,
                            ) as Promise<CreateGoogleEventResponseType>
                        )
                        
                        eventToUpdate.method = null
                        

                        if (remindersObjectForEvent?.reminders?.length > 0) {
                            insertReminderObjects.push(...remindersObjectForEvent?.reminders)
                        }

                        const oldPreferredTimeRanges = await listPreferredTimeRangesForEvent(eventToUpdate.id)
                        if (!_.isEqual(oldPreferredTimeRanges, eventToUpdate.preferredTimeRanges)) {
                            if (oldPreferredTimeRanges?.length > 0) {
                                deletePreferredTimeRangeObjects.push(...oldPreferredTimeRanges)
                            }

                            if (eventToUpdate?.preferredTimeRanges?.length > 0) {
                                insertPreferredTimeRangeObjects.push(...eventToUpdate.preferredTimeRanges)
                            }
                        }
                    } else if (hostBufferTimes?.[beforeEventIndex]?.beforeEvent?.method === 'update') {
                        const oldEventToUpdate = filteredAllEvents?.find(e => (e?.id === eventToUpdate?.id))

                        // do not change dates that are not modifiable
                        if (!eventToUpdate?.modifiable && oldEventToUpdate?.id) {
                            eventToUpdate.startDate = oldEventToUpdate.startDate
                            eventToUpdate.endDate = oldEventToUpdate.endDate
                            eventToUpdate.timezone = oldEventToUpdate.timezone
                        }

                        updatePromises.push(
                            postPlannerModifyEventInCalendar(
                                eventToUpdate,
                                eventToUpdate?.userId,
                                'update',
                                resource,
                                true,
                                clientType,
                                remindersObjectForEvent?.reminders,
                            ) as Promise<string>
                        )

                        if (remindersObjectForEvent?.reminders?.length > 0) {
                            // get old reminders and add for removal
                            const oldReminders = await listRemindersForEvent(eventToUpdate?.id, eventToUpdate?.userId)
                            if (oldReminders?.length > 0) {
                                deleteReminders.push(...oldReminders)
                            }
                            insertReminderObjects.push(...remindersObjectForEvent?.reminders)
                        }

                        const oldPreferredTimeRanges = await listPreferredTimeRangesForEvent(eventToUpdate.id)
                        if (!_.isEqual(oldPreferredTimeRanges, eventToUpdate.preferredTimeRanges)) {
                            if (oldPreferredTimeRanges?.length > 0) {
                                deletePreferredTimeRangeObjects.push(...oldPreferredTimeRanges)
                            }

                            if (eventToUpdate?.preferredTimeRanges?.length > 0) {
                                insertPreferredTimeRangeObjects.push(...eventToUpdate.preferredTimeRanges)
                            }
                        }
                    }
                }

                eventsToUpsert.push(
                    eventToUpdate
                )
            } else if (afterEventIndex > -1) {
                
                if (resource === googleCalendarResource) {
                    if (hostBufferTimes?.[afterEventIndex]?.afterEvent?.method === 'create') {
                        createPromises.push(
                            postPlannerModifyEventInCalendar(
                                eventToUpdate,
                                eventToUpdate.userId,
                                'create',
                                resource,
                                true,
                                clientType,
                            ) as Promise<CreateGoogleEventResponseType>
                        )
                        
                        eventToUpdate.method = null
                        

                        if (remindersObjectForEvent?.reminders?.length > 0) {
                            insertReminderObjects.push(...remindersObjectForEvent?.reminders)
                        }

                        const oldPreferredTimeRanges = await listPreferredTimeRangesForEvent(eventToUpdate.id)
                        if (!_.isEqual(oldPreferredTimeRanges, eventToUpdate.preferredTimeRanges)) {
                            if (oldPreferredTimeRanges?.length > 0) {
                                deletePreferredTimeRangeObjects.push(...oldPreferredTimeRanges)
                            }

                            if (eventToUpdate?.preferredTimeRanges?.length > 0) {
                                insertPreferredTimeRangeObjects.push(...eventToUpdate.preferredTimeRanges)
                            }
                        }
                    } else if (hostBufferTimes?.[afterEventIndex]?.afterEvent?.method === 'update') {

                        const oldEventToUpdate = filteredAllEvents?.find(e => (e?.id === eventToUpdate?.id))

                        // do not change dates that are not modifiable
                        if (!eventToUpdate?.modifiable && oldEventToUpdate?.id) {
                            eventToUpdate.startDate = oldEventToUpdate.startDate
                            eventToUpdate.endDate = oldEventToUpdate.endDate
                            eventToUpdate.timezone = oldEventToUpdate.timezone
                        }
                        
                        updatePromises.push(
                            postPlannerModifyEventInCalendar(
                                eventToUpdate,
                                eventToUpdate?.userId,
                                'update',
                                resource,
                                true,
                                clientType,
                            ) as Promise<string>
                        )

                        if (remindersObjectForEvent?.reminders?.length > 0) {
                            // get old reminders and add for removal
                            const oldReminders = await listRemindersForEvent(eventToUpdate?.id, eventToUpdate?.userId)
                            if (oldReminders?.length > 0) {
                                deleteReminders.push(...oldReminders)
                            }
                            insertReminderObjects.push(...remindersObjectForEvent?.reminders)
                        }

                        const oldPreferredTimeRanges = await listPreferredTimeRangesForEvent(eventToUpdate.id)
                        if (!_.isEqual(oldPreferredTimeRanges, eventToUpdate.preferredTimeRanges)) {
                            if (oldPreferredTimeRanges?.length > 0) {
                                deletePreferredTimeRangeObjects.push(...oldPreferredTimeRanges)
                            }

                            if (eventToUpdate?.preferredTimeRanges?.length > 0) {
                                insertPreferredTimeRangeObjects.push(...eventToUpdate.preferredTimeRanges)
                            }
                        }
                    }
                }

                eventsToUpsert.push(
                    eventToUpdate
                )
            } else if (breakIndex > -1) {
                
                if (resource === googleCalendarResource) {
                    if (breaks?.[breakIndex]?.method === 'create') {
                        createPromises.push(
                            postPlannerModifyEventInCalendar(
                                eventToUpdate,
                                eventToUpdate.userId,
                                'create',
                                resource,
                                false,
                                clientType,
                                remindersObjectForEvent?.reminders,
                            ) as Promise<CreateGoogleEventResponseType>
                        )
                        
                        eventToUpdate.method = null
                        

                        if (remindersObjectForEvent?.reminders?.length > 0) {
                            insertReminderObjects.push(...remindersObjectForEvent?.reminders)
                        }

                        const oldPreferredTimeRanges = await listPreferredTimeRangesForEvent(eventToUpdate.id)
                        if (!_.isEqual(oldPreferredTimeRanges, eventToUpdate.preferredTimeRanges)) {
                            if (oldPreferredTimeRanges?.length > 0) {
                                deletePreferredTimeRangeObjects.push(...oldPreferredTimeRanges)
                            }

                            if (eventToUpdate?.preferredTimeRanges?.length > 0) {
                                insertPreferredTimeRangeObjects.push(...eventToUpdate.preferredTimeRanges)
                            }
                        }

                        breaks[breakIndex].method = null

                    } else if (breaks?.[breakIndex]?.method === 'update') {

                        const oldEventToUpdate = filteredAllEvents?.find(e => (e?.id === eventToUpdate?.id))

                        // do not change dates that are not modifiable
                        if (!eventToUpdate?.modifiable && oldEventToUpdate?.id) {
                            eventToUpdate.startDate = oldEventToUpdate.startDate
                            eventToUpdate.endDate = oldEventToUpdate.endDate
                            eventToUpdate.timezone = oldEventToUpdate.timezone
                        }

                        updatePromises.push(
                            postPlannerModifyEventInCalendar(
                                eventToUpdate,
                                eventToUpdate.userId,
                                'update',
                                resource,
                                false,
                                clientType,
                                remindersObjectForEvent?.reminders,
                            ) as Promise<string>
                        )

                        if (remindersObjectForEvent?.reminders?.length > 0) {
                            // get old reminders and add for removal
                            const oldReminders = await listRemindersForEvent(eventToUpdate?.id, eventToUpdate?.userId)
                            if (oldReminders?.length > 0) {
                                deleteReminders.push(...oldReminders)
                            }
                            
                            insertReminderObjects.push(...remindersObjectForEvent?.reminders)
                        }

                        const oldPreferredTimeRanges = await listPreferredTimeRangesForEvent(eventToUpdate.id)
                        if (!_.isEqual(oldPreferredTimeRanges, eventToUpdate.preferredTimeRanges)) {
                            if (oldPreferredTimeRanges?.length > 0) {
                                deletePreferredTimeRangeObjects.push(...oldPreferredTimeRanges)
                            }

                            if (eventToUpdate?.preferredTimeRanges?.length > 0) {
                                insertPreferredTimeRangeObjects.push(...eventToUpdate.preferredTimeRanges)
                            }
                        }

                        breaks[breakIndex].method = null
                    }
                }
                eventsToUpsert.push(
                    eventToUpdate
                )
            } else {
                
                if (resource === googleCalendarResource) {
                    
                    if (eventToUpdate?.method === 'create') {

                        

                        if (eventToUpdate?.meetingId) {
                            const meetingAssist = await getMeetingAssist(eventToUpdate?.meetingId)

                            if (meetingAssist?.userId !== eventToUpdate?.userId) {

                                // event to be removed from final update
                                eventsToRemove.push(eventToUpdate)
                                // do not create event --- only 1 event for host other users skipped and added via invitation
                                
                                
                                
                                
                                

                                continue
                                
                            } else if (meetingAssist?.userId === eventToUpdate?.userId) {

                                // get attendees
                                
                                const attendees = await listMeetingAssistAttendeesGivenMeetingId(eventToUpdate?.meetingId)
                                
                                let conference: ConferenceType | {} = {}
                                
                                if (meetingAssist?.enableConference) {
                                    
                                    //  create conference if not zoom
                                    // check if zoom available
                                    const zoomToken = await getZoomAPIToken(meetingAssist?.userId)

                                    

                                    conference = zoomToken ? {} : {
                                        id: uuid(),
                                        userId: meetingAssist?.userId,
                                        calendarId: eventToUpdate?.calendarId,
                                        app: 'google',
                                        name: eventToUpdate?.summary,
                                        notes: eventToUpdate?.notes,
                                        updatedAt: dayjs().format(),
                                        createdDate: dayjs().format(),
                                        deleted: false,
                                        isHost: true,
                                    }

                                    

                                    if (zoomToken) {

                                        
                                        const hostAttendee = attendees?.find(a => (a?.userId === meetingAssist?.userId))

                                        

                                        const zoomObject = await createZoomMeeting(
                                            zoomToken,
                                            eventToUpdate?.startDate,
                                            meetingAssist?.timezone,
                                            eventToUpdate?.summary,
                                            meetingAssist?.duration,
                                            hostAttendee?.name,
                                            hostAttendee?.primaryEmail,
                                            attendees?.map(a => (a?.primaryEmail))
                                        )

                                        

                                        if (zoomObject) {
                                            conference = {
                                                id: `${zoomObject?.id}`,
                                                userId: eventToUpdate?.userId,
                                                calendarId: eventToUpdate?.calendarId,
                                                app: 'zoom',
                                                name: zoomObject?.agenda,
                                                notes: zoomObject?.agenda,
                                                joinUrl: zoomObject?.join_url,
                                                startUrl: zoomObject?.start_url,
                                                isHost: true,
                                                updatedAt: dayjs().format(),
                                                createdDate: dayjs().format(),
                                                deleted: false,
                                                entryPoints: [{
                                                    entryPointType: 'video',
                                                    label: zoomObject?.join_url,
                                                    password: zoomObject?.password,
                                                    uri: zoomObject?.join_url,
                                                }]
                                            } as ConferenceType

                                            eventToFilterForUpdateConferences.push(eventToUpdate)
                                        }
                                    }       
                                }

                                

                                createPromises.push(
                                    postPlannerModifyEventInCalendar(
                                        eventToUpdate,
                                        eventToUpdate.userId,
                                        'create',
                                        resource,
                                        false,
                                        clientType,
                                        undefined,
                                        attendees,
                                        (conference as ConferenceType)?.id ? conference as ConferenceType : undefined,
                                    ) as Promise<CreateGoogleEventResponseType>
                                )

                                // insert conference
                                if ((conference as ConferenceType)?.id) {
                                    await insertConference(conference  as ConferenceType)
                                    // update event conferenceId
                                    eventToUpdate.conferenceId = (conference as ConferenceType)?.id
                                }

                                if (remindersObjectForEvent?.reminders?.length > 0) {
                                    
                                    insertReminderObjects.push(...remindersObjectForEvent?.reminders)
                                }

                                if (eventToUpdate?.preferredTimeRanges?.length > 0) {
                                    insertPreferredTimeRangeObjects.push(...eventToUpdate.preferredTimeRanges)
                                }

                                // update createEventsWithId
                                // filter externalAttendees
                                const externalAttendees = attendees?.filter(a => !!(a?.externalAttendee))
                                if ((conference as ConferenceType)?.id) {
                                    eventsToBeCreatedWithNewId
                                    ?.filter(c => !!c)
                                    ?.forEach(c => {
                                        const externalIndex = externalAttendees?.findIndex(e => (e?.userId === c?.event?.userId))

                                        if ((c?.meetingId === meetingAssist?.id) && (externalIndex === -1)) {
                                            
                                            c.conference = conference as ConferenceType
                                        }
                                    })
                                }

                                // add attendees & resource & clientType
                                eventsToBeCreatedWithNewId
                                ?.filter(c => !!c)
                                ?.forEach(c => {
                                    const externalIndex = externalAttendees?.findIndex(e => (e?.userId === c?.event?.userId))

                                    if ((c?.meetingId === meetingAssist?.id) && (externalIndex === -1)) {
                                        c.attendees = attendees
                                        c.event.method = null
                                        c.resource = resource
                                        c.clientType = clientType
                                    }
                                })
                            }
                                
                        }
                         
                        eventToUpdate.method = null
                    } else {
                        const oldEventToUpdate = filteredAllEvents?.find(e => (e?.id === eventToUpdate?.id))

                        // do not change dates that are not modifiable
                        if (!eventToUpdate?.modifiable && oldEventToUpdate?.id) {
                            eventToUpdate.startDate = oldEventToUpdate.startDate
                            eventToUpdate.endDate = oldEventToUpdate.endDate
                            eventToUpdate.timezone = oldEventToUpdate.timezone
                        }

                        updatePromises.push(
                            postPlannerModifyEventInCalendar(
                                eventToUpdate,
                                eventToUpdate.userId,
                                'update',
                                resource,
                                false,
                                clientType,
                                remindersObjectForEvent?.reminders,
                            ) as Promise<string>
                        )

                        eventToUpdate.method = null

                        if (remindersObjectForEvent?.reminders?.length > 0) {
                            // get old reminders and add for removal
                            // get old reminders and add for removal
                            const oldReminders = await listRemindersForEvent(eventToUpdate?.id, eventToUpdate?.userId)
                            if (oldReminders?.length > 0) {
                                deleteReminders.push(...oldReminders)
                            }
                            insertReminderObjects.push(...remindersObjectForEvent?.reminders)
                        }
    
                        const oldPreferredTimeRanges = await listPreferredTimeRangesForEvent(eventToUpdate.id)
                        if (!_.isEqual(oldPreferredTimeRanges, eventToUpdate.preferredTimeRanges)) {
                            if (oldPreferredTimeRanges?.length > 0) {
                                deletePreferredTimeRangeObjects.push(...oldPreferredTimeRanges)
                            }
    
                            if (eventToUpdate?.preferredTimeRanges?.length > 0) {
                                insertPreferredTimeRangeObjects.push(...eventToUpdate.preferredTimeRanges)
                            }
                        }
                    }
                }

                
                eventsToUpsert.push(
                    eventToUpdate
                )
                   
            }
        }

        const idResponseBodies = await Promise.all(createPromises)
       
        const cloneEventsToUpsert = _.cloneDeep(eventsToUpsert)

        const eventsToEdit: EventPlusType[] = []

        const idModifiedEventsToUpsert: EventPlusType[] = eventsToUpsert.map(e1 => {
            const idResponseBody = idResponseBodies?.find(r => (r.generatedId === e1.id))
            if (idResponseBody?.id) {
                const generatedIdEditIndex = eventsToEdit?.findIndex(e => (e?.id === e1?.id))

                const newIdEditIndex = eventsToEdit?.findIndex(e => (e?.id === idResponseBody?.id))

                

                if ((generatedIdEditIndex > -1) || (newIdEditIndex > -1)) {

                    if (generatedIdEditIndex > -1) {
                        const genIdEditedEvent = eventsToEdit[generatedIdEditIndex]

                        

                        genIdEditedEvent.id = idResponseBody?.id
                        genIdEditedEvent.eventId = idResponseBody?.googleEventId

                        if (genIdEditedEvent?.preEventId) {
                            

                            const clonePreEvent = cloneEventsToUpsert.find(e2 => (e2.id === genIdEditedEvent.preEventId))

                            if (clonePreEvent?.id) {
                                
                                clonePreEvent.forEventId = idResponseBody.id

                                const genIdOfPreEventIndex = eventsToEdit?.findIndex(e => (e?.id === genIdEditedEvent.preEventId))
                                const newIdOfPreEventResponseBody = idResponseBodies?.find(c => (c?.generatedId === genIdEditedEvent.preEventId))

                                if (newIdOfPreEventResponseBody?.id) {
                                    clonePreEvent.id = newIdOfPreEventResponseBody?.id
                                    clonePreEvent.eventId = newIdOfPreEventResponseBody?.googleEventId

                                    const newIdOfPreEventIndex = eventsToEdit?.findIndex(e => (e?.id === newIdOfPreEventResponseBody?.id))

                                    if (genIdOfPreEventIndex > -1) {
                                        
                                        eventsToEdit[genIdOfPreEventIndex].forEventId = idResponseBody.id
                                        eventsToEdit[genIdOfPreEventIndex].id = newIdOfPreEventResponseBody?.id
                                        eventsToEdit[genIdOfPreEventIndex].eventId = newIdOfPreEventResponseBody?.googleEventId
                                    } else if (newIdOfPreEventIndex > -1) {
                                        
                                        eventsToEdit[newIdOfPreEventIndex].forEventId = idResponseBody.id
                                    } else {

                                        eventsToEdit.push(clonePreEvent)
                                    }
                                } 
                            }
                        }

                        if (genIdEditedEvent?.postEventId) {
                            
                            const clonePostEvent = cloneEventsToUpsert.find(e2 => (e2.id === genIdEditedEvent.postEventId))

                            if (clonePostEvent?.id) {
                                
                                clonePostEvent.forEventId = idResponseBody.id

                                const genIdOfPostEventIndex = eventsToEdit?.findIndex(e => (e?.id === genIdEditedEvent.postEventId))
                                const newIdOfPostEventResponseBody = idResponseBodies?.find(c => (c?.generatedId === genIdEditedEvent.postEventId))

                                if (newIdOfPostEventResponseBody?.id) {
                                    clonePostEvent.id = newIdOfPostEventResponseBody?.id
                                    clonePostEvent.eventId = newIdOfPostEventResponseBody?.googleEventId

                                    const newIdOfPostEventIndex = eventsToEdit?.findIndex(e => (e?.id === `${newIdOfPostEventResponseBody}#${clonePostEvent.calendarId}`))

                                    if (genIdOfPostEventIndex > -1) {
                                        
                                        eventsToEdit[genIdOfPostEventIndex].forEventId = idResponseBody.id
                                        eventsToEdit[genIdOfPostEventIndex].id = newIdOfPostEventResponseBody?.id
                                        eventsToEdit[genIdOfPostEventIndex].eventId = newIdOfPostEventResponseBody?.googleEventId
                                    } else if (newIdOfPostEventIndex > -1) {
                                        
                                        eventsToEdit[newIdOfPostEventIndex].forEventId = idResponseBody.id
                                    } else {

                                        eventsToEdit.push(clonePostEvent)
                                    }
                                }
                                
                            }
                        }

                        // take care of before and after forEventId
                        if (genIdEditedEvent?.forEventId) {
                            if (genIdEditedEvent?.isPreEvent) {
                                
                                
                                const forEvent = cloneEventsToUpsert.find(e2 => (e2.id === genIdEditedEvent.forEventId))

                                if (forEvent?.id) {
                                    
                                    forEvent.preEventId = idResponseBody.id
                                    const genIdOfForEventIndex = eventsToEdit?.findIndex(e => (e?.id === forEvent?.id))
                                    const newIdOfForEventResponseBody = idResponseBodies?.find(c => (c?.generatedId === forEvent?.id))

                                    if (newIdOfForEventResponseBody?.id) {
                                        forEvent.id = newIdOfForEventResponseBody?.id
                                        forEvent.eventId = newIdOfForEventResponseBody?.googleEventId

                                        const newIdOfForEventIndex = eventsToEdit?.findIndex(e => (e?.id === newIdOfForEventResponseBody?.id))

                                        if (genIdOfForEventIndex > -1) {
                                            
                                            eventsToEdit[genIdOfForEventIndex].preEventId = idResponseBody.id
                                            eventsToEdit[genIdOfForEventIndex].id = newIdOfForEventResponseBody?.id
                                            eventsToEdit[genIdOfForEventIndex].eventId = newIdOfForEventResponseBody?.googleEventId

                                        } else if (newIdOfForEventIndex > -1) {
                                            
                                            eventsToEdit[newIdOfForEventIndex].preEventId = idResponseBody.id
                                        } else {

                                            eventsToEdit.push(forEvent)
                                        }
                                    }
                                }
                            } else if (genIdEditedEvent?.isPostEvent) {
                                
                                const forEvent = cloneEventsToUpsert.find(e2 => (e2.id === genIdEditedEvent.forEventId))
                                if (forEvent?.id) {
                                    
                                    forEvent.postEventId = idResponseBody.id
                                    const genIdOfForEventIndex = eventsToEdit?.findIndex(e => (e?.id === forEvent?.id))
                                    const newIdOfForEventResponseBody = idResponseBodies?.find(c => (c?.generatedId === forEvent?.id))

                                    if (newIdOfForEventResponseBody?.id) {
                                         const newIdOfForEventIndex = eventsToEdit?.findIndex(e => (e?.id === newIdOfForEventResponseBody?.id))

                                        if (genIdOfForEventIndex > -1) {
                                            
                                            eventsToEdit[genIdOfForEventIndex].postEventId = idResponseBody.id
                                            eventsToEdit[genIdOfForEventIndex].id = newIdOfForEventResponseBody?.id
                                            eventsToEdit[genIdOfForEventIndex].eventId = newIdOfForEventResponseBody?.googleEventId
                                        } else if (newIdOfForEventIndex > -1) {
                                            
                                            eventsToEdit[newIdOfForEventIndex].postEventId = idResponseBody.id
                                        } else {
                                            eventsToEdit.push(forEvent)
                                        }
                                    }
                                   
                                }
                            }
                        }
                        
                       // take care of preferred time ranges
                        insertPreferredTimeRangeObjects?.forEach(pt => {
                            if (pt?.eventId === e1.id) {
                                pt.eventId = idResponseBody?.id
                            }
                        })

                        // take care of reminders
                        insertReminderObjects?.forEach(r => {
                            if (r?.eventId === e1.id) {
                                r.eventId = idResponseBody?.id
                            }
                        })

                        // take care of meeting assist events of

                        if (e1?.meetingId) {
                            eventsToBeCreatedWithNewId
                            ?.filter(c => (c?.meetingId === e1?.meetingId))
                            ?.filter(c => !!(c?.event?.id))
                                ?.forEach(c => {
                                    
                                    c.event.id = `${idResponseBody?.googleEventId}#${c.event.calendarId}`
                                    c.event.eventId = idResponseBody?.googleEventId
                                    // c.event.startDate = dayjs(editedEvent.startDate.slice(0, 19)).tz(editedEvent.timezone, true).tz(c.event.timezone).format()
                                    // c.event.endDate = dayjs(editedEvent.endDate.slice(0, 19)).tz(editedEvent.timezone, true).tz(c.event.timezone).format()

                                })
                        }

                    } else if (newIdEditIndex > -1) {
                        
                        const newIdWithEditedEvent = eventsToEdit[newIdEditIndex]
                        

                        if (newIdWithEditedEvent?.preEventId) {
                            

                            const clonePreEvent = cloneEventsToUpsert.find(e2 => (e2.id === newIdWithEditedEvent.preEventId))
                            const genIdOrNewIdWithPreEventEditedEvent = eventsToEdit?.find(e3 => (e3.id === newIdWithEditedEvent?.preEventId))

                            if (genIdOrNewIdWithPreEventEditedEvent?.id) {
                                

                                genIdOrNewIdWithPreEventEditedEvent.forEventId = idResponseBody.id

                                const preEventWithNewIdResponseBody = idResponseBodies?.find(i => (i.generatedId === genIdOrNewIdWithPreEventEditedEvent?.id))
                                
                                if (preEventWithNewIdResponseBody?.id) {

                                    genIdOrNewIdWithPreEventEditedEvent.id = preEventWithNewIdResponseBody?.id
                                    genIdOrNewIdWithPreEventEditedEvent.eventId = preEventWithNewIdResponseBody.googleEventId
                                }

                            }

                            if (clonePreEvent?.id) {
                                
                                clonePreEvent.forEventId = idResponseBody.id

                                const genIdWithPreEventIndex = eventsToEdit?.findIndex(e => (e?.id === newIdWithEditedEvent.preEventId))
                                const newIdWithPreEventResponseBody = idResponseBodies?.find(c => (c?.generatedId === newIdWithEditedEvent.preEventId))

                                if (newIdWithPreEventResponseBody?.id) {
                                    clonePreEvent.id = newIdWithPreEventResponseBody?.id
                                    clonePreEvent.eventId = newIdWithPreEventResponseBody?.googleEventId

                                    const newIdWithPreEventIndex = eventsToEdit?.findIndex(e => (e?.id === newIdWithPreEventResponseBody?.id))

                                    if (genIdWithPreEventIndex > -1) {
                                        
                                        eventsToEdit[genIdWithPreEventIndex].forEventId = idResponseBody.id
                                        eventsToEdit[genIdWithPreEventIndex].id = newIdWithPreEventResponseBody?.id
                                        eventsToEdit[genIdWithPreEventIndex].eventId = newIdWithPreEventResponseBody?.googleEventId
                                    } else if (newIdWithPreEventIndex > -1) {
                                        
                                        eventsToEdit[newIdWithPreEventIndex].forEventId = idResponseBody.id
                                    } else {

                                        eventsToEdit.push(clonePreEvent)
                                    }
                                }
                                
                            }
                        }

                        if (newIdWithEditedEvent?.postEventId) {

                            const clonePostEvent = cloneEventsToUpsert?.find(e2 => (e2.id === newIdWithEditedEvent.postEventId))

                            const genIdOrNewIdWithPostEventEditedEvent = eventsToEdit?.find(e3 => (e3.id === newIdWithEditedEvent?.postEventId))

                            if (genIdOrNewIdWithPostEventEditedEvent?.id) {
                                

                                genIdOrNewIdWithPostEventEditedEvent.forEventId = idResponseBody.id

                                const postEventWithNewIdResponseBody = idResponseBodies?.find(i => (i.generatedId === genIdOrNewIdWithPostEventEditedEvent?.id))
                                
                                if (postEventWithNewIdResponseBody?.id) {

                                    genIdOrNewIdWithPostEventEditedEvent.id = postEventWithNewIdResponseBody?.id
                                    genIdOrNewIdWithPostEventEditedEvent.eventId = postEventWithNewIdResponseBody.googleEventId
                                }

                            }

                            if (clonePostEvent?.id) {
                                clonePostEvent.forEventId = newIdWithEditedEvent.id

                                const genIdWithPostEventIndex = eventsToEdit?.findIndex(e => (e?.id === newIdWithEditedEvent.postEventId))
                                const newIdWithPostEventResponseBody = idResponseBodies?.find(c => (c?.generatedId === newIdWithEditedEvent.postEventId))

                                if (newIdWithPostEventResponseBody?.id) {
                                    clonePostEvent.id = newIdWithPostEventResponseBody?.id
                                    clonePostEvent.eventId = newIdWithPostEventResponseBody?.googleEventId

                                    const eventsToEditPostEventWithCreateIdIndex = eventsToEdit?.findIndex(e => (e?.id === `${newIdWithPostEventResponseBody}#${clonePostEvent.calendarId}`))

                                    if (genIdWithPostEventIndex > -1) {

                                        eventsToEdit[genIdWithPostEventIndex].forEventId = newIdWithEditedEvent.id
                                        eventsToEdit[genIdWithPostEventIndex].id = newIdWithPostEventResponseBody?.id
                                        eventsToEdit[genIdWithPostEventIndex].eventId = newIdWithPostEventResponseBody?.googleEventId
                                    } else if (eventsToEditPostEventWithCreateIdIndex > -1) {

                                        eventsToEdit[eventsToEditPostEventWithCreateIdIndex].forEventId = newIdWithEditedEvent.id
                                    } else {

                                        eventsToEdit.push(clonePostEvent)
                                    }
                                }
                            }
                        }

                        // take care of before and after forEventId
                        if (newIdWithEditedEvent?.forEventId) {
                            
                            if (newIdWithEditedEvent?.isPreEvent) {
                                
                                const forEvent = cloneEventsToUpsert.find(e2 => (e2.id === newIdWithEditedEvent.forEventId))
                                
                                if (forEvent?.id) {
                                    

                                    forEvent.preEventId = newIdWithEditedEvent.id
                                    const genIdOfForEventIndex = eventsToEdit?.findIndex(e => (e?.id === forEvent?.id))
                                    const newIdOfForEventResponseBody = idResponseBodies?.find(c => (c?.generatedId === forEvent?.id))

                                    if (newIdOfForEventResponseBody?.id) {
                                        forEvent.id = newIdOfForEventResponseBody?.id
                                        forEvent.eventId = newIdOfForEventResponseBody?.googleEventId

                                        const newIdOfForEventIndex = eventsToEdit?.findIndex(e => (e?.id === newIdOfForEventResponseBody?.id))
                                        if (genIdOfForEventIndex > -1) {

                                            
                                            eventsToEdit[genIdOfForEventIndex].preEventId = idResponseBody.id
                                            eventsToEdit[genIdOfForEventIndex].id = newIdOfForEventResponseBody?.id
                                            eventsToEdit[genIdOfForEventIndex].eventId = newIdOfForEventResponseBody?.googleEventId
        
                                        } else if (newIdOfForEventIndex > -1) {
                                            
                                            eventsToEdit[newIdOfForEventIndex].preEventId = idResponseBody.id
                                        } else {

                                            eventsToEdit.push(forEvent)
                                        }
                                    }
                                }
                            } else if (newIdWithEditedEvent?.isPostEvent) {
                                const forEvent = cloneEventsToUpsert?.find(e2 => (e2.id === newIdWithEditedEvent.forEventId))
                                if (forEvent?.id) {
                                    
                                    forEvent.postEventId = idResponseBody.id
                                    const genIdOfForEventIndex = eventsToEdit?.findIndex(e => (e?.id === forEvent?.id))
                                    const newIdOfForEventResponseBody = idResponseBodies?.find(c => (c?.generatedId === forEvent?.id))

                                    if (newIdOfForEventResponseBody?.id) {
                                        const newIdOfForEventIndex = eventsToEdit?.findIndex(e => (e?.id === newIdOfForEventResponseBody?.id))

                                        if (genIdOfForEventIndex > -1) {
                                            
                                            eventsToEdit[genIdOfForEventIndex].postEventId = idResponseBody.id
                                            eventsToEdit[genIdOfForEventIndex].id = newIdOfForEventResponseBody?.id
                                            eventsToEdit[genIdOfForEventIndex].eventId = newIdOfForEventResponseBody?.googleEventId
                                        } else if (newIdOfForEventIndex > -1) {
                                            eventsToEdit[newIdOfForEventIndex].postEventId = idResponseBody.id
                                        } else {
                                            eventsToEdit.push(forEvent)
                                        }
                                    }
                                    
                                }
                            }
                        }

                        // take care of preferred time ranges
                        // take care of preferred time ranges
                        insertPreferredTimeRangeObjects?.forEach(pt => {
                            if (pt?.eventId === e1.id) {
                                pt.eventId = idResponseBody?.id
                            }
                        })

                        // take care of reminders
                        insertReminderObjects?.forEach(r => {
                            if (r?.eventId === e1.id) {
                                r.eventId = idResponseBody?.id
                            }
                        })

                        // take care of meeting assist events of

                        if (e1?.meetingId) {
                            eventsToBeCreatedWithNewId
                            ?.filter(c => (c?.meetingId === e1?.meetingId))
                            ?.filter(c => !!(c?.event?.id))
                                ?.forEach(c => {
                                    
                                    c.event.id = `${idResponseBody.googleEventId}#${c?.event?.calendarId}`
                                    c.event.eventId = idResponseBody?.googleEventId
                                    // c.event.startDate = dayjs(createdAndEditedEvent.startDate.slice(0, 19)).tz(createdAndEditedEvent.timezone, true).tz(c.event.timezone).format()
                                    // c.event.endDate = dayjs(createdAndEditedEvent.endDate.slice(0, 19)).tz(createdAndEditedEvent.timezone, true).tz(c.event.timezone).format()

                                })
                        }

                    }

                } else {
                    
                    const cloneEvent = cloneEventsToUpsert?.find(e2 => (e2?.id === e1?.id))

                    if (cloneEvent?.id) {

                        cloneEvent.id = idResponseBody?.id
                        cloneEvent.eventId = idResponseBody?.googleEventId

                        if (cloneEvent?.preEventId) {
                            
                            
                            const clonePreEvent = cloneEventsToUpsert.find(e2 => (e2.id === cloneEvent.preEventId))

                            if (clonePreEvent?.id) {
                                
                                clonePreEvent.forEventId = idResponseBody.id
                            
                                const genIdOfPreEventIndex = eventsToEdit?.findIndex(e => (e?.id === cloneEvent.preEventId))
                                const newIdOfPreEventResponseBody = idResponseBodies?.find(c => (c?.generatedId === cloneEvent.preEventId))

                                if (newIdOfPreEventResponseBody?.id) {
                                    clonePreEvent.id = newIdOfPreEventResponseBody?.id
                                    clonePreEvent.eventId = newIdOfPreEventResponseBody?.googleEventId

                                    const newIdOfPreEventIndex = eventsToEdit?.findIndex(e => (e?.id === newIdOfPreEventResponseBody?.id))

                                    if (genIdOfPreEventIndex > -1) {
                                        
                                        eventsToEdit[genIdOfPreEventIndex].forEventId = idResponseBody.id
                                        eventsToEdit[genIdOfPreEventIndex].id = newIdOfPreEventResponseBody?.id
                                        eventsToEdit[genIdOfPreEventIndex].eventId = newIdOfPreEventResponseBody?.googleEventId
                                    } else if  (newIdOfPreEventIndex > -1) {
                                        
                                        eventsToEdit[newIdOfPreEventIndex].forEventId = idResponseBody.id
                                    } else {

                                        eventsToEdit.push(clonePreEvent)
                                    } 
                                }
                                  
                            }
                            

                        }

                        if (cloneEvent?.postEventId) {
                            
                            
                            const clonePostEvent = cloneEventsToUpsert?.find(e2 => (e2.id === cloneEvent.postEventId))

                            if (clonePostEvent?.id) {
                                
                                
                                clonePostEvent.forEventId = idResponseBody.id
                            
                                const genIdOfPostEventIndex = eventsToEdit?.findIndex(e => (e?.id === cloneEvent.postEventId))
                                const newIdOfPostEventResponseBody = idResponseBodies?.find(c => (c?.generatedId === cloneEvent.postEventId))

                                if (newIdOfPostEventResponseBody?.id) {
                                    clonePostEvent.id = newIdOfPostEventResponseBody?.id
                                    clonePostEvent.eventId = newIdOfPostEventResponseBody?.googleEventId

                                    const newIdOfPostEventIndex = eventsToEdit?.findIndex(e => (e?.id === newIdOfPostEventResponseBody?.id))

                                    if (genIdOfPostEventIndex > -1) {
                                        
                                        eventsToEdit[genIdOfPostEventIndex].forEventId = idResponseBody.id
                                        eventsToEdit[genIdOfPostEventIndex].id = newIdOfPostEventResponseBody?.id
                                        eventsToEdit[genIdOfPostEventIndex].eventId = newIdOfPostEventResponseBody?.googleEventId
                                    } else if  (newIdOfPostEventIndex > -1) {
                                        
                                        eventsToEdit[newIdOfPostEventIndex].forEventId = idResponseBody.id
                                    } else {

                                        eventsToEdit.push(clonePostEvent)
                                    }
                                }
                            }
                        }

                        eventsToEdit.push(cloneEvent)

                        // take care of before and after forEventId
                        if (e1?.forEventId) {
                            if (e1?.isPreEvent) {
                                
                                
                                const forEvent = cloneEventsToUpsert?.find(e2 => (e2.id === e1.forEventId))
                                
                                if (forEvent?.id) {
                                    
                                    forEvent.preEventId = idResponseBody.id
                                    const genIdOfForEventIndex = eventsToEdit?.findIndex(e => (e?.id === forEvent?.id))
                                    const newIdOfForEventResponseBody = idResponseBodies?.find(c => (c?.generatedId === forEvent?.id))

                                    if (newIdOfForEventResponseBody?.id) {
                                        forEvent.id = newIdOfForEventResponseBody?.id
                                        forEvent.eventId = newIdOfForEventResponseBody?.googleEventId

                                        const newIdOfForEventIndex = eventsToEdit?.findIndex(e => (e?.id === newIdOfForEventResponseBody?.id))
                                        
                                        if (genIdOfForEventIndex > -1) {
                                            
                                            eventsToEdit[genIdOfForEventIndex].preEventId = idResponseBody.id
                                            eventsToEdit[genIdOfForEventIndex].id = newIdOfForEventResponseBody?.id
                                            eventsToEdit[genIdOfForEventIndex].eventId = newIdOfForEventResponseBody?.googleEventId

                                        } else if (newIdOfForEventIndex > -1) {

                                            
                                            eventsToEdit[newIdOfForEventIndex].preEventId = idResponseBody.id
                                        } else {

                                            eventsToEdit.push(forEvent)
                                        }
                                    }
                                }
                            } else if (e1?.isPostEvent) {

                                
                                const forEvent = cloneEventsToUpsert?.find(e2 => (e2.id === e1.forEventId))
                                
                                if (forEvent?.id) {
                                    
                                    
                                    forEvent.postEventId = idResponseBody.id
                                    const genIdOfForEventIndex = eventsToEdit?.findIndex(e => (e?.id === forEvent?.id))
                                    const newIdOfForEventResponseBody = idResponseBodies?.find(c => (c?.generatedId === forEvent?.id))

                                    if (newIdOfForEventResponseBody?.id) {
                                        const newIdOfForEventIndex = eventsToEdit?.findIndex(e => (e?.id === newIdOfForEventResponseBody?.id))

                                        if (genIdOfForEventIndex > -1) {
                                            
                                            eventsToEdit[genIdOfForEventIndex].postEventId = idResponseBody.id
                                            eventsToEdit[genIdOfForEventIndex].id = newIdOfForEventResponseBody?.id
                                            eventsToEdit[genIdOfForEventIndex].eventId = newIdOfForEventResponseBody?.googleEventId
                                        } else if (newIdOfForEventIndex > -1) {
                                            
                                            eventsToEdit[newIdOfForEventIndex].postEventId = idResponseBody.id
                                        } else {
                                            eventsToEdit.push(forEvent)
                                        }
                                    }
                                    
                                }
                            }
                        }

                        // take care of preferred time ranges
                        insertPreferredTimeRangeObjects?.forEach(pt => {
                            if (pt?.eventId === e1.id) {
                                pt.eventId = idResponseBody?.id
                            }
                        })

                        // take care of reminders
                        insertReminderObjects?.forEach(r => {
                            if (r?.eventId === e1.id) {
                                r.eventId = idResponseBody?.id
                            }
                        })

                        // take care of meeting assist events of

                        if (e1?.meetingId) {
                            eventsToBeCreatedWithNewId
                            ?.filter(c => (c?.meetingId === e1?.meetingId))
                            ?.filter(c => !!(c?.event?.id))
                            ?.forEach(c => {
                                
                                c.event.id = `${idResponseBody.googleEventId}#${c?.event?.calendarId}`
                                c.event.eventId = idResponseBody?.googleEventId

                                // c.event.startDate = dayjs(cloneEvent.startDate.slice(0, 19)).tz(cloneEvent.timezone, true).tz(c.event.timezone).format()
                                // c.event.endDate = dayjs(cloneEvent.endDate.slice(0, 19)).tz(cloneEvent.timezone, true).tz(c.event.timezone).format()

                            })
                        }
                    }

                    
                    
                }

                eventsToRemove.push(e1)
                return e1  
            }

            return e1
        })

        // eventsToBeCreatedWithNewId?.forEach(c => {
        //     const eventToBeCreatedWithNewId = c.event

        //     if (c.resource && c.clientType) {

        //         eventsToBeCreatedWithNewIdPromises.push(
        //             postPlannerModifyEventInCalendar(
        //                 eventToBeCreatedWithNewId,
        //                 eventToBeCreatedWithNewId.userId,
        //                 'createWithId',
        //                 c.resource,
        //                 false,
        //                 c.clientType,
        //                 undefined,
        //                 c.attendees,
        //                 (c?.conference as ConferenceType)?.id ? c?.conference as ConferenceType : undefined,
        //             ) as Promise<undefined>
        //         )
        //     }
        // })

        const eventsWithMeetingAssistSinHost = eventsToBeCreatedWithNewId?.map(c => (c?.event)) || []


        // await Promise.all(eventsToBeCreatedWithNewIdPromises)

        const eventsMinusEventsToRemove = _.differenceBy(idModifiedEventsToUpsert, eventsToRemove, 'id')
        // eventsToSlice has duplicates for ForEvent

        const finalEventsToUpsert = eventsMinusEventsToRemove
            .concat(eventsWithMeetingAssistSinHost)
            .concat(_.uniqBy(eventsToEdit, 'id'))
            ?.filter(e => !!e)

        // update existing conferences
        
       

        await processEventsForUpdatingConferences(finalEventsToUpsert?.filter(e => (!(eventToFilterForUpdateConferences?.find(f => (e?.conferenceId === f?.conferenceId))))))
        
        
        
        await Promise.all(
            [
                Promise.all(updatePromises?.filter(e => !!(e))),
                upsertEventsPostPlanner(finalEventsToUpsert.map(e => _.omit(e, ['vector', 'preferredTimeRanges']))),
                
            ]
        )

       
        const deleteReminderIds = deleteReminders.filter(r => !!(r?.eventId))?.map(r => (r?.eventId))
        const insertRemindersFiltered: ReminderTypeAdjusted[] = insertReminderObjects.filter(r => !!(r?.eventId))
       
        await deleteRemindersWithIds(_.uniq(deleteReminderIds), filteredEventsToUpdate?.[0]?.userId)
        await insertReminders(insertRemindersFiltered)
        const distinctToDeletePreferredTimeRangeObjects = _.uniqBy(deletePreferredTimeRangeObjects, 'eventId')
        // await Promise.all(distinctToDeletePreferredTimeRangeObjects?.map(e => deletePreferredTimeRangesForEvent(e?.eventId)))
        // deletePreferredTimeRangesForEvents
        const eventIdsForPts = distinctToDeletePreferredTimeRangeObjects?.map(pt => (pt?.eventId))
        await deletePreferredTimeRangesForEvents(eventIdsForPts)
        await insertPreferredTimeRanges(insertPreferredTimeRangeObjects)
    } catch (e) {
        
    }
}

export const deleteZoomMeeting = async (
    zoomToken: string,
    meetingId: number,
) => {
    try {
        await got.delete(
            `${zoomBaseUrl}/meetings/${meetingId}`,
            {
                headers: {
                    Authorization: `Bearer ${zoomToken}`,
                    ContentType: 'application/json',
                }
            }
        )

        
    } catch (e) {
        
    }
}

export const getZoomMeeting = async (
    zoomToken: string,
    meetingId: number,
) => {
    try {
        const res: ZoomMeetingObjectType = await got(`${zoomBaseUrl}/meetings/${meetingId}`, {
            headers: {
                    Authorization: `Bearer ${zoomToken}`,
                    ContentType: 'application/json',
                }
        }).json()

        return res
    } catch (e) {
        
    }
}

export const updateZoomMeetingStartDate = async (
    zoomToken: string,
    meetingId: number,
    startDate: string,
    timezone: string,
) => {
    try {
        const reqBody = {
            start_time: dayjs(startDate?.slice(0, 19)).utc().format(),
            timezone,
        }

        await got.patch(
            `${zoomBaseUrl}/meetings/${meetingId}`,
            {
                json: reqBody,
                headers: {
                    Authorization: `Bearer ${zoomToken}`,
                    ContentType: 'application/json',
                }
            }
        ).json()

        
    } catch (e) {
        
    }
}

export const createZoomMeeting = async (
    zoomToken: string,
    startDate: string,
    timezone: string,
    agenda: string,
    duration: number,
    contactName?: string,
    contactEmail?: string,
    meetingInvitees?: string[],
) => {
    try {
        //valdiate
        if (dayjs().isAfter(dayjs(startDate))) {
            
            throw new Error('starttime is in the past')
        }

        
            timezone,
            agenda,
            duration, ` dayjs(startDate?.slice(0, 19)).tz(timezone, true).format('YYYY-MM-DDTHH:mm:ss'),
            timezone,
            agenda,
            duration, createZoomMeeting called`)

        let settings: any = {}
       
        if ((contactName?.length > 0) && (contactEmail?.length > 0)) {
            settings = {
                contact_name: contactName,
                contact_email: contactEmail,
            }
        }

        if (meetingInvitees?.length > 0) {
            settings = { ...settings, meeting_invitees: meetingInvitees?.map(m => ({ email: m })) }
        }

        let reqBody: CreateZoomMeetingRequestBodyType = {}

        if (Object.keys(settings)?.length > 0) {
            reqBody.settings = settings
        }

        reqBody = {
            ...reqBody,
            start_time: dayjs(startDate?.slice(0, 19)).tz(timezone, true).utc().format(),
            // timezone,
            agenda,
            duration,
        }

        

        const res: ZoomMeetingObjectType = await got.post(
            `${zoomBaseUrl}/users/me/meetings`,
            {
                json: reqBody,
                headers: {
                    Authorization: `Bearer ${zoomToken}`,
                    ContentType: 'application/json',
                }
            }
        ).json()
        
        

        return res
    } catch (e) {
        
    }
}

export const insertConferences = async (
conferences: ConferenceType[],
) => {
    try {
        const operationName = 'InsertConferences'
        const query = `
            mutation InsertConferences($conferences: [Conference_insert_input!]!) {
                insert_Conference(objects: $conferences) {
                    affected_rows
                    returning {
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
            }

        `

        const variables = {
            conferences,
        }

        const res: { data: { insert_Conference: { affected_rows: number, returning: ConferenceType[] } } } = await got.post(hasuraGraphUrl, {
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

export const insertConference = async (
    conference: ConferenceType,
) => {
    try {
        const operationName = 'InsertConference'
        const query = `
            mutation InsertConference($conference: Conference_insert_input!) {
                insert_Conference_one(object: $conference) {
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
            conference
        }

        const res: { data: { insert_Conference_one: ConferenceType } } = await got.post(hasuraGraphUrl, {
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

        

        return res?.data?.insert_Conference_one
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

export const processEventsForUpdatingConferences = async (
    finalEventsToUpsert: EventPlusType[],
) => {
    try {
        // filter for conferenceIds
        const eventsWithConferences = finalEventsToUpsert.filter(e => !!(e?.conferenceId))
        
        // get the conferences
        const conferenceIds = eventsWithConferences?.map(e => (e?.conferenceId))
        const conferencesWithHosts = await listConferencesWithHosts(conferenceIds)

        // filter events to available listed conferences
        const eventsWithHostConferences = eventsWithConferences?.filter(e => !!(conferencesWithHosts?.find(c => (c?.userId === e?.userId))))

        if (!(eventsWithHostConferences?.[0]?.id)) {
            
            return
        }

        for (const eventWithHostConference of eventsWithHostConferences) {

            // get zoom token
            const zoomToken = await getZoomAPIToken(eventWithHostConference?.userId)
            const conferenceToEvent = conferencesWithHosts?.find(c => (c?.id === eventWithHostConference?.conferenceId))
            // update zoom conference
            if (zoomToken 
                    && (conferenceToEvent?.app === 'zoom')
                    && (typeof parseInt(conferenceToEvent?.id, 10) === 'number')
                ) {
                 await updateZoomMeetingStartDate(
                    zoomToken,
                    parseInt(conferenceToEvent?.id, 10),
                    eventWithHostConference?.startDate,
                    eventWithHostConference?.timezone,
                )
            }
        }
    } catch (e) {
        
    }
}

export const processEventsForCreatingConferences = async (
    finalEventsToUpsert: EventPlusType[],
    createResults: {
        id: string;
        generatedId: string;
    }[],
) => {
    try {
        // also create zoom meetings if zoom enabled
        const createdEventsWithMeetingId = finalEventsToUpsert
            ?.filter(e => !!(createResults?.find(c => (c?.id === e?.id))))
            ?.filter(e => !!(e?.meetingId))
        
        // unique meetingIds
        const uniqueMeetingIdCreatedEvents = _.uniqBy(createdEventsWithMeetingId, 'meetingId')
        
        // validate
        if (!uniqueMeetingIdCreatedEvents?.[0]) {
            
            return
        }
        // list all meeting assist objects to see which has enbaled conferences
        const meetingAssistObjects = await listMeetingAssistsGivenMeetingIds(uniqueMeetingIdCreatedEvents?.map(e => (e?.meetingId)))
        
        const zoomObjects: (ZoomMeetingObjectType & { meetingId: string, hostId: string })[] = []

        for (const meetingAssist of meetingAssistObjects) {
            // check if zoom available
            const zoomToken = await getZoomAPIToken(meetingAssist?.userId)

            if (zoomToken) {
                // find event
                const meetingEvent = uniqueMeetingIdCreatedEvents?.find(e => (e?.meetingId === meetingAssist?.id))
                // validate
                if (!meetingEvent) {
                    
                    continue
                }
                
                // get attendees
                const attendees = await listMeetingAssistAttendeesGivenMeetingId(meetingEvent?.meetingId)
                
                // validate
                if (!attendees) {
                    
                    continue
                }
                const hostAttendee = attendees?.find(a => (a?.userId === meetingAssist?.userId))

                const zoomObject = await createZoomMeeting(
                    zoomToken,
                    meetingEvent?.startDate,
                    meetingAssist?.timezone,
                    meetingEvent?.summary,
                    meetingAssist?.duration,
                    hostAttendee?.name,
                    hostAttendee?.primaryEmail,
                    attendees?.map(a => (a?.primaryEmail))
                )

                zoomObjects.push({ ...zoomObject, meetingId: meetingAssist?.id, hostId: meetingAssist?.userId })

                
            }
         }
        
         
        if (zoomObjects?.[0]?.id) {
            return zoomObjects
        }

    } catch (e) {
        
    }
}

export const listMeetingAssistsGivenMeetingIds = async (
    meetingIds: string[],
) => {
    try {
        const operationName = 'ListMeetingAssists'
        const query = `
            query ListMeetingAssists($meetingIds: [uuid!]!) {
                Meeting_Assist(where: {id: {_in: $meetingIds}}) {
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
                    guaranteeAvailability
                    guestsCanInviteOthers
                    guestsCanSeeOtherGuests
                    id
                    location
                    notes
                    minThresholdCount
                    priority
                    reminders
                    sendUpdates
                    startDate
                    summary
                    timezone
                    transparency
                    updatedAt
                    useDefaultAlarms
                    userId
                    visibility
                    windowEndDate
                    windowStartDate
                }
            }
        `

        const variables = {
            meetingIds,
        }

        const res: { data: { Meeting_Assist: MeetingAssistType[] } } = await got.post(hasuraGraphUrl, {
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

        

        return res?.data?.Meeting_Assist
    } catch (e) {
        
    }
}
