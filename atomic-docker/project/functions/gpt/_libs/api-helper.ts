import OpenAI from "openai";
// import { SESClient, SendEmailCommand, SendEmailCommandInput } from "@aws-sdk/client-ses"
import { EMAIL, googleCalendarResource, googleClientIdAndroid, googleClientIdAtomicWeb, googleClientIdIos, googleClientIdWeb, googleClientSecretAtomicWeb, googleClientSecretWeb, googleTokenUrl, hasuraAdminSecret, hasuraGraphUrl, openAIAPIKey, openAIChatGPTModel } from "./constants";
import { getISODay } from 'date-fns'
import dayjs from 'dayjs'
// import isoWeek from 'dayjs/plugin/isoWeek'
import duration from 'dayjs/plugin/duration'
import isBetween from 'dayjs/plugin/isBetween'
import timezone from 'dayjs/plugin/timezone'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import utc from 'dayjs/plugin/utc'
import got from "got"
import { v4 as uuid } from 'uuid'
import { GoogleSendUpdatesType, GoogleAttendeeType, GoogleConferenceDataType, GoogleExtendedPropertiesType, GoogleReminderType, GoogleSourceType, GoogleTransparencyType, GoogleVisibilityType, GoogleAttachmentType, GoogleEventType1, CalendarIntegrationType, EventType, CalendarType, NotAvailableSlotType, UserPreferenceType, AvailableSlotType, DailyScheduleObjectType, GoogleResType } from "./types";

import { google } from 'googleapis'
import _ from "lodash";
import { agendaPrompt, howToTaskPrompt, summaryPrompt, taskBreakDownPrompt, meetingRequestPrompt, meetingRequestWithAvailabilityPrompt, dailySchedulePrompt1, dailySchedulePrompt2, dailySchedulePrompt3, summarizeAvailabilityPrompt, agendaPromptExampleInput, agendaPromptExampleOutput, summarizeAvailabilityExampleInput, summarizeAvailabilityExampleOutput, dailyScheduleExampleInput, dailyScheduleExampleOutput, summarizeAvailabilityResponsesPrompt, summarizeAvailabilityResponsesPromptExampleInput, summarizeAvailabilityResponsesPromptExampleOutput } from './prompts';
import { Readable } from "stream";
import { ENV } from "@/_utils/env";
import { sendEmail } from "@/_utils/email/email";
import { ChatGPTRoleType } from "./types/OpenAI";

dayjs.extend(duration)
dayjs.extend(isBetween)
dayjs.extend(timezone)
dayjs.extend(utc)
dayjs.extend(localizedFormat)
dayjs.extend(customParseFormat)


const openai = new OpenAI({
    apiKey: openAIAPIKey,
});

export async function streamToString(stream: Readable): Promise<string> {
    return await new Promise((resolve, reject) => {
        const chunks: Uint8Array[] = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    });
}


export const sendAgendaEmail = async (
    email: string,
    name: string,
    title: string,
    body: string,
) => {
    try {

        const template = 'agenda-email'

        await sendEmail({
            template,
            locals: {
                title,
                name,
                body,
                displayName: name,
                email,
                locale: ENV.AUTH_LOCALE_DEFAULT,
                serverUrl: ENV.FUNCTION_SERVER_URL,
                clientUrl: ENV.APP_CLIENT_URL,
            },
            message: {
                to: email,
                headers: {
                    'x-email-template': {
                        prepared: true,
                        value: template,
                      },
                },
            }
        })

    } catch (e) {
        console.log(e, ' unable to send email')
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
        _.uniqBy(events, 'id').forEach(e => console.log(e?.id, e, 'id, e inside upsertEventsPostPlanner '))
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
        console.log(response, response?.data?.insert_Event?.affected_rows, ' response after upserting events')
        response?.data?.insert_Event?.returning?.forEach(e => console.log(e, ' returning  response after upserting events'))
        return response
    } catch (e) {
        console.log(e, ' unable to update event')
    }
}


export const callOpenAI = async (
    prompt: string,
    model: 'gpt-3.5-turbo' = 'gpt-3.5-turbo',
    userData: string,
    exampleInput?: string,
    exampleOutput?: string,

) => {
    try {
        // assistant
        const completion = await openai.chat.completions.create({
            model,
            messages: [
                { role: 'system' as ChatGPTRoleType, content: prompt },
                exampleInput && { role: 'user' as ChatGPTRoleType, content: exampleInput },
                exampleOutput && { role: 'assistant' as ChatGPTRoleType, content: exampleOutput },
                { role: 'user' as ChatGPTRoleType, content: userData }
            ]?.filter(m => !!m),
        });
        console.log(completion?.choices?.[0]?.message?.content, ' response from openaiapi');

        return completion?.choices?.[0]?.message?.content
    } catch (error) {
        if (error.response) {
            console.log(error.response.status, ' openai error status');
            console.log(error.response.data, ' openai error data');
        } else {
            console.log(error.message, ' openai error message');
        }
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

        console.log(res, ' res inside getCalendarIntegration')
        if (res?.data?.Calendar_Integration?.length > 0) {
            return res?.data?.Calendar_Integration?.[0]
        }
    } catch (e) {
        console.log(e, ' unable to get calendar integration')
    }
}

export const refreshGoogleToken = async (
    refreshToken: string,
    clientType: 'ios' | 'android' | 'web' | 'atomic-web'
): Promise<{
    access_token: string,
    expires_in: number, // add seconds to now
    scope: string,
    token_type: string
}> => {
    try {
        console.log('refreshGoogleToken called', refreshToken)
        console.log('clientType', clientType)
        console.log('googleClientIdIos', googleClientIdIos)
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
            case 'atomic-web':
                return got.post(
                    googleTokenUrl,
                    {
                        form: {
                            grant_type: 'refresh_token',
                            refresh_token: refreshToken,
                            client_id: googleClientIdAtomicWeb,
                            client_secret: googleClientSecretAtomicWeb,
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
        console.log(e, ' unable to refresh google token')
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

        console.log(res, ' res inside updateCalendarIntegration')
    } catch (e) {
        console.log(e, ' unable to update calendar integration')
    }
}

export const getGoogleAPIToken = async (
    userId: string,
    resource: string,
    clientType: 'ios' | 'android' | 'web' | 'atomic-web',
) => {
    let integrationId = ''
    try {
        const { id, token, expiresAt, refreshToken } = await getCalendarIntegration(userId, resource)
        integrationId = id
        console.log(id, token, expiresAt, refreshToken, ' id, token, expiresAt, refreshToken')
        if (dayjs().isAfter(dayjs(expiresAt)) || !token) {
            const res = await refreshGoogleToken(refreshToken, clientType)
            console.log(res, ' res from refreshGoogleToken')
            await updateCalendarIntegration(id, res.access_token, res.expires_in)
            return res.access_token
        }
        return token
    } catch (e) {
        console.log(e, ' unable to get api token')
        await updateCalendarIntegration(integrationId, null, null, false)
    }
}


export const createGoogleEvent = async (
    userId: string,
    calendarId: string,
    clientType: 'ios' | 'android' | 'web' | 'atomic-web',
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
): Promise<GoogleResType> => {
    try {
        console.log(generatedId, conferenceDataVersion, conferenceData, ' generatedId, conferenceDataVersion, conferenceData inside createGoogleEvent')
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
                timeZone: timezone,
            }

            data.end = end
        }

        if (endDate && timezone && !endDateTime) {
            const end = {
                date: dayjs(endDate.slice(0, 19)).tz(timezone, true).format('YYYY-MM-DD'),
                timeZone: timezone,
            }

            data.end = end
        }

        if (startDate && timezone && !startDateTime) {
            const start = {
                date: dayjs(startDate.slice(0, 19)).tz(timezone, true).format('YYYY-MM-DD'),
                timeZone: timezone,
            }
            data.start = start
        }

        if (startDateTime && timezone && !startDate) {
            const start = {
                dateTime: startDateTime,
                timeZone: timezone,
            }
            data.start = start
        }

        if (originalStartDate && timezone && !originalStartDateTime) {
            const originalStartTime = {
                date: originalStartDate,
                timeZone: timezone,
            }
            data.originalStartTime = originalStartTime
        }

        if (originalStartDateTime && timezone && !originalStartDate) {
            const originalStartTime = {
                dateTime: dayjs(originalStartDateTime).tz(timezone, true).format(),
                timeZone: timezone,
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

        console.log(res.data)

        console.log(res?.data, ' res?.data from googleCreateEvent')
        return { id: `${res?.data?.id}#${calendarId}`, googleEventId: res?.data?.id, generatedId, calendarId, generatedEventId: generatedId?.split('#')[0] }
    } catch (e) {
        console.log(e, ' createGoogleEvent')
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
        console.log(e, ' unable to get global calendar')
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
          Event(where: {userId: {_eq: $userId}, endDate: {_gte: $startDate}, startDate: {_lte: $endDate}, deleted: {_eq: false}}) {
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
                        endDate: dayjs(endDate.slice(0, 19)).tz(timezone, true).format(),
                    },
                },
            },
        ).json()

        console.log(res, ' res from listEventsforUser')
        return res?.data?.Event

    } catch (e) {
        console.log(e, ' unable to list events for date')
    }
}

export const createAgenda = async (
    userId: string,
    isAllDay: boolean,
    timezone: string,
    startDate: string,
    endDate: string,
    mainTopic: string,
    email?: string,
    name?: string,
    relevantPoints?: string[],
    goals?: string[],
    location?: string,
    isTwo?: boolean,
) => {
    try {
        console.log('create agenda called')

        const prompt = agendaPrompt
        const exampleInput = agendaPromptExampleInput
        const exampleOutput = agendaPromptExampleOutput
        // create prompt
        const userData = `
            Here's the main topic, relevant important points and / or goals: 
            Main topic: ${mainTopic}. 
            Relevant points:  ${relevantPoints?.reduce((prev, curr) => (`${prev}, ${curr},`), '')}. 
            Goals: ${goals?.reduce((prev, curr) => (`${prev}, ${curr}`), '')}.`

        // get res from openai
        console.log(userData, ' userData')

        const openAIRes = await callOpenAI(prompt, openAIChatGPTModel, userData, exampleInput, exampleOutput)
        console.log(openAIRes, ' openAIRes')
        // validate openai res
        if (!openAIRes) {
            console.log('no openAIRes')
            throw new Error('no openAIRes present inside createAgenda')
        }

        // create event

        // get primary calendar
        const primaryCalendar = await getGlobalCalendar(userId)

        // validate
        if (!primaryCalendar?.id) {
            console.log('no primryCalendar')
            throw new Error('no primary calendar found inside createAgenda')
        }

        // get client type
        const calIntegration = await getCalendarIntegration(
            userId,
            googleCalendarResource,
        )

        // validate
        if (!calIntegration?.clientType) {
            throw new Error('no client type inside calendar integration inside create agenda')
        }

        const eventsToUpsert: EventType[] = []

        if (isAllDay) {
            console.log('inside isAllDay')
            // create in google calendar
            const googleRes = await createGoogleEvent(
                userId,
                primaryCalendar?.id,
                calIntegration?.clientType,
                uuid(),
                !isAllDay && endDate,
                !isAllDay && startDate,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                mainTopic,
                openAIRes,
                timezone,
                // 2020-04-02T08:02:17-05:00
                isAllDay && startDate?.slice(0, 10),
                isAllDay && endDate?.slice(0, 10),
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
                location,
                undefined,
            )
            
            console.log(googleRes, ' googleRes')
            
            const eventToUpsert: EventType = {
                id: googleRes?.id,
                userId,
                title: mainTopic,
                startDate,
                endDate,
                allDay: isAllDay,
                notes: openAIRes,
                timezone,
                createdDate: dayjs().format(),
                deleted: false,
                priority: 1,
                isFollowUp: false,
                isPreEvent: false,
                isPostEvent: false,
                modifiable: false,
                anyoneCanAddSelf: false,
                guestsCanInviteOthers: false,
                guestsCanSeeOtherGuests: true,
                originalStartDate: undefined,
                originalAllDay: undefined,
                summary: mainTopic,
                updatedAt: dayjs().format(),
                calendarId: primaryCalendar?.id,
                eventId: googleRes?.googleEventId,
            }

            if (location) {
                eventToUpsert.location.title = location
            }

            eventsToUpsert.push(eventToUpsert)
        }

        if (isTwo) {
            console.log('isTwo called')
            // create in google calendar
            const googleRes = await createGoogleEvent(
                userId,
                primaryCalendar?.id,
                calIntegration?.clientType,
                uuid(),
                endDate,
                startDate,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                mainTopic,
                openAIRes,
                timezone,
                // 2020-04-02T08:02:17-05:00
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
                location,
                undefined,
            )

            const eventToUpsert: EventType = {
                id: googleRes?.id,
                userId,
                title: mainTopic,
                startDate,
                endDate,
                allDay: false,
                notes: openAIRes,
                timezone,
                createdDate: dayjs().format(),
                deleted: false,
                priority: 1,
                isFollowUp: false,
                isPreEvent: false,
                isPostEvent: false,
                modifiable: false,
                anyoneCanAddSelf: false,
                guestsCanInviteOthers: false,
                guestsCanSeeOtherGuests: true,
                originalStartDate: undefined,
                originalAllDay: undefined,
                summary: mainTopic,
                updatedAt: dayjs().format(),
                calendarId: primaryCalendar?.id,
                eventId: googleRes?.googleEventId,
            }

            if (location) {
                eventToUpsert.location.title = location
            }

            eventsToUpsert.push(eventToUpsert)
        }

        if (!isAllDay) {

            // create in google calendar
            const googleRes = await createGoogleEvent(
                userId,
                primaryCalendar?.id,
                calIntegration?.clientType,
                uuid(),
                endDate,
                startDate,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                mainTopic,
                openAIRes,
                timezone,
                // 2020-04-02T08:02:17-05:00
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
                location,
                undefined,
            )

            const eventToUpsert: EventType = {
                id: googleRes?.id,
                userId,
                title: mainTopic,
                startDate,
                endDate,
                allDay: false,
                notes: openAIRes,
                timezone,
                createdDate: dayjs().format(),
                deleted: false,
                priority: 1,
                isFollowUp: false,
                isPreEvent: false,
                isPostEvent: false,
                modifiable: false,
                anyoneCanAddSelf: false,
                guestsCanInviteOthers: false,
                guestsCanSeeOtherGuests: true,
                originalStartDate: undefined,
                originalAllDay: undefined,
                summary: mainTopic,
                updatedAt: dayjs().format(),
                calendarId: primaryCalendar?.id,
                eventId: googleRes?.googleEventId,
            }

            if (location) {
                eventToUpsert.location.title = location
            }

            eventsToUpsert.push(eventToUpsert)
        }

        // upsert event
        await upsertEventsPostPlanner(eventsToUpsert)

        // send email
        if (email) {
            await sendAgendaEmail(
                email,
                name,
                mainTopic,
                openAIRes,
            )
        }

    } catch (e) {
        console.log(e, ' unable to create agenda')
    }
}

export const formatEventsForSummary = (
    events: EventType[],
) => {

    let formattedEventString = ''

    for (const event of events) {

        formattedEventString += `
            start date: ${event?.startDate},
            end date: ${event?.endDate}
            title: ${event?.summary},
            description: ${event?.notes}.

        `
    }

    return formattedEventString
}

export const sendSummaryEmail = async (
    email: string,
    name: string,
    body: string,
    startDate: string,
    endDate: string,
    timezone: string,
) => {
    try {
        const template = 'availability-summary-email'
        await sendEmail({
            template,
            locals: {
                name,
                startDate: dayjs(startDate?.slice(0, 19)).tz(timezone).format('L LT'),
                endDate: dayjs(endDate?.slice(0, 19)).tz(timezone).format('L LT'),
                body, 
                displayName: name,
                email,
                locale: ENV.AUTH_LOCALE_DEFAULT,
                serverUrl: ENV.FUNCTION_SERVER_URL,
                clientUrl: ENV.APP_CLIENT_URL,
            },
            message: {
                to: email,
                headers: {
                    'x-email-template': {
                        prepared: true,
                        value: template,
                      },
                },
            }
        })
    } catch (e) {
        console.log(e, ' unable to send summary email')
    }
}

export const createSummaryOfTimePeriod = async (
    userId: string,
    startDate: string,
    endDate: string,
    timezone: string,
    email?: string,
    name?: string,
) => {
    try {

        // create prompt

        // list events given windowstartdate and enddate
        const events = await listEventsForDate(userId, startDate, endDate, timezone)

        // validate
        if (!(events?.length > 0)) {
            throw new Error('no events found inside create summary to time period')
        }

        const formattedEventString = formatEventsForSummary(events)

        const prompt = summaryPrompt

        const userData = `Here are the events: ${formattedEventString}`

        // get res from openai

        const openAIRes = await callOpenAI(prompt, openAIChatGPTModel, userData)

        // validate openai res
        if (!openAIRes) {
            throw new Error('no openAIRes present inside createAgenda')
        }

        if (email) {
            // send email
            await sendSummaryEmail(
                email,
                name,
                openAIRes,
                startDate,
                endDate,
                timezone,
            )
        }

        return openAIRes

    } catch (e) {
        console.log(e, ' unable to create summary of time period')
    }
}

export const emailTaskBreakDown = async (
    email: string,
    name: string,
    body: string,
) => {
    try {
        const template = 'email-task-breakdown'

        await sendEmail({
            template,
            locals: {
                name,
                body,
                displayName: name,
                email,
                locale: ENV.AUTH_LOCALE_DEFAULT,
                serverUrl: ENV.FUNCTION_SERVER_URL,
                clientUrl: ENV.APP_CLIENT_URL,
            },
            message: {
                to: email,
                headers: {
                    'x-email-template': {
                        prepared: true,
                        value: template,
                      },
                },
            }
        })
    } catch (e) {
        console.log(e, ' unable to send task break down')
    }
}

export const breakDownTask = async (
    userId: string,
    task: string,
    isAllDay: boolean,
    timezone: string,
    startDate: string,
    endDate: string,
    email?: string,
    name?: string,
    isTwo?: boolean
) => {
    try {
        console.log('breakDownTask called')
        
        // create prompt
        const prompt = taskBreakDownPrompt
        const userData = `Here's the task: ${task}`

        // get res from openai

        const openAIRes = await callOpenAI(prompt, openAIChatGPTModel, userData)

        // validate openai res
        if (!openAIRes) {
            throw new Error('no openAIRes present inside createAgenda')
        }

        // create event

        // get primary calendar
        const primaryCalendar = await getGlobalCalendar(userId)

        // validate
        if (!primaryCalendar?.id) {
            throw new Error('no primary calendar found inside createAgenda')
        }

        // get client type
        const calIntegration = await getCalendarIntegration(
            userId,
            googleCalendarResource,
        )

        // validate
        if (!calIntegration?.clientType) {
            throw new Error('no client type inside calendar integration inside create agenda')
        }

        const eventsToUpsert: EventType[] = []

        if (isAllDay) {
            // create in google calendar
            const googleRes = await createGoogleEvent(
                userId,
                primaryCalendar?.id,
                calIntegration?.clientType,
                uuid(),
                !isAllDay && endDate,
                !isAllDay && startDate,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                task,
                openAIRes,
                timezone,
                // 2020-04-02T08:02:17-05:00
                isAllDay && startDate?.slice(0, 10),
                isAllDay && endDate?.slice(0, 10),
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
            )

            const eventToUpsert: EventType = {
                id: googleRes?.id,
                userId,
                title: task,
                startDate,
                endDate,
                allDay: isAllDay,
                notes: openAIRes,
                timezone,
                createdDate: dayjs().format(),
                deleted: false,
                priority: 1,
                isFollowUp: false,
                isPreEvent: false,
                isPostEvent: false,
                modifiable: false,
                anyoneCanAddSelf: false,
                guestsCanInviteOthers: false,
                guestsCanSeeOtherGuests: true,
                originalStartDate: undefined,
                originalAllDay: undefined,
                summary: task,
                updatedAt: dayjs().format(),
                calendarId: primaryCalendar?.id,
                eventId: googleRes?.googleEventId,
            }

            eventsToUpsert.push(eventToUpsert)
        }

        if (isTwo) {
            // create in google calendar
            const googleRes = await createGoogleEvent(
                userId,
                primaryCalendar?.id,
                calIntegration?.clientType,
                uuid(),
                endDate,
                startDate,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                task,
                openAIRes,
                timezone,
                // 2020-04-02T08:02:17-05:00
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
            )

            const eventToUpsert: EventType = {
                id: googleRes?.id,
                userId,
                title: task,
                startDate,
                endDate,
                allDay: false,
                notes: openAIRes,
                timezone,
                createdDate: dayjs().format(),
                deleted: false,
                priority: 1,
                isFollowUp: false,
                isPreEvent: false,
                isPostEvent: false,
                modifiable: false,
                anyoneCanAddSelf: false,
                guestsCanInviteOthers: false,
                guestsCanSeeOtherGuests: true,
                originalStartDate: undefined,
                originalAllDay: undefined,
                summary: task,
                updatedAt: dayjs().format(),
                calendarId: primaryCalendar?.id,
                eventId: googleRes?.googleEventId,
            }

            eventsToUpsert.push(eventToUpsert)
        }

        if (!isAllDay) {

            // create in google calendar
            const googleRes = await createGoogleEvent(
                userId,
                primaryCalendar?.id,
                calIntegration?.clientType,
                uuid(),
                endDate,
                startDate,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                task,
                openAIRes,
                timezone,
                // 2020-04-02T08:02:17-05:00
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
            )

            const eventToUpsert: EventType = {
                id: googleRes?.id,
                userId,
                title: task,
                startDate,
                endDate,
                allDay: false,
                notes: openAIRes,
                timezone,
                createdDate: dayjs().format(),
                deleted: false,
                priority: 1,
                isFollowUp: false,
                isPreEvent: false,
                isPostEvent: false,
                modifiable: false,
                anyoneCanAddSelf: false,
                guestsCanInviteOthers: false,
                guestsCanSeeOtherGuests: true,
                originalStartDate: undefined,
                originalAllDay: undefined,
                summary: task,
                updatedAt: dayjs().format(),
                calendarId: primaryCalendar?.id,
                eventId: googleRes?.googleEventId,
            }

            eventsToUpsert.push(eventToUpsert)
        }

        // upsert event
        await upsertEventsPostPlanner(eventsToUpsert)

        if (email) {
            await emailTaskBreakDown(
                email,
                name,
                openAIRes,
            )
        }

    } catch (e) {
        console.log(e, ' unable to break down task')
    }
}

export const sendGenericTaskEmail = async (
    email: string,
    name: string,
    title: string,
    body: string,
) => {
    try {
        const template = 'generic-task-email'
        
        await sendEmail({
            template,
            locals: {
                name,
                title,
                body,
                displayName: name,
                email,
                locale: ENV.AUTH_LOCALE_DEFAULT,
                serverUrl: ENV.FUNCTION_SERVER_URL,
                clientUrl: ENV.APP_CLIENT_URL,
            },
            message: {
                to: email,
                headers: {
                    'x-email-template': {
                        prepared: true,
                        value: template,
                      },
                },
            }
        })
    } catch (e) {
        console.log(e, ' unable to send generic task email')
    }
}

export const howToTask = async (
    userId: string,
    task: string,
    isAllDay: boolean,
    timezone: string,
    startDate: string,
    endDate: string,
    email?: string,
    name?: string,
    isTwo?: boolean,
) => {
    try {
        
        // create prompt
        const prompt = howToTaskPrompt
        const userData = ` Here's the task: ${task}`

        console.log(userData,  ' userData')

        // get res from openai

        const openAIRes = await callOpenAI(prompt, openAIChatGPTModel, userData)

        // validate openai res
        if (!openAIRes) {
            throw new Error('no openAIRes present inside createAgenda')
        }

        console.log(openAIRes, ' openAIRes')

        // create event

        // get primary calendar
        const primaryCalendar = await getGlobalCalendar(userId)

        // validate
        if (!primaryCalendar?.id) {
            throw new Error('no primary calendar found inside createAgenda')
        }

        // get client type
        const calIntegration = await getCalendarIntegration(
            userId,
            googleCalendarResource,
        )

        // validate
        if (!calIntegration?.clientType) {
            throw new Error('no client type inside calendar integration inside create agenda')
        }

        const eventsToUpsert: EventType[] = []

        if (isAllDay) {
            // create in google calendar
            const googleRes = await createGoogleEvent(
                userId,
                primaryCalendar?.id,
                calIntegration?.clientType,
                uuid(),
                !isAllDay && endDate,
                !isAllDay && startDate,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                task,
                openAIRes,
                timezone,
                // 2020-04-02T08:02:17-05:00
                isAllDay && startDate?.slice(0, 10),
                isAllDay && endDate?.slice(0, 10),
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
            )

            const eventToUpsert: EventType = {
                id: googleRes?.id,
                userId,
                title: task,
                startDate,
                endDate,
                allDay: isAllDay,
                notes: openAIRes,
                timezone,
                createdDate: dayjs().format(),
                deleted: false,
                priority: 1,
                isFollowUp: false,
                isPreEvent: false,
                isPostEvent: false,
                modifiable: false,
                anyoneCanAddSelf: false,
                guestsCanInviteOthers: false,
                guestsCanSeeOtherGuests: true,
                originalStartDate: undefined,
                originalAllDay: undefined,
                summary: task,
                updatedAt: dayjs().format(),
                calendarId: primaryCalendar?.id,
                eventId: googleRes?.googleEventId,
            }

            eventsToUpsert.push(eventToUpsert)
        }

        if (isTwo) {
            // create in google calendar
            const googleRes = await createGoogleEvent(
                userId,
                primaryCalendar?.id,
                calIntegration?.clientType,
                uuid(),
                endDate,
                startDate,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                task,
                openAIRes,
                timezone,
                // 2020-04-02T08:02:17-05:00
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
            )

            const eventToUpsert: EventType = {
                id: googleRes?.id,
                userId,
                title: task,
                startDate,
                endDate,
                allDay: false,
                notes: openAIRes,
                timezone,
                createdDate: dayjs().format(),
                deleted: false,
                priority: 1,
                isFollowUp: false,
                isPreEvent: false,
                isPostEvent: false,
                modifiable: false,
                anyoneCanAddSelf: false,
                guestsCanInviteOthers: false,
                guestsCanSeeOtherGuests: true,
                originalStartDate: undefined,
                originalAllDay: undefined,
                summary: task,
                updatedAt: dayjs().format(),
                calendarId: primaryCalendar?.id,
                eventId: googleRes?.googleEventId,
            }

            eventsToUpsert.push(eventToUpsert)
        }

        if (!isAllDay) {

            // create in google calendar
            const googleRes = await createGoogleEvent(
                userId,
                primaryCalendar?.id,
                calIntegration?.clientType,
                uuid(),
                endDate,
                startDate,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                task,
                openAIRes,
                timezone,
                // 2020-04-02T08:02:17-05:00
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
            )

            const eventToUpsert: EventType = {
                id: googleRes?.id,
                userId,
                title: task,
                startDate,
                endDate,
                allDay: false,
                notes: openAIRes,
                timezone,
                createdDate: dayjs().format(),
                deleted: false,
                priority: 1,
                isFollowUp: false,
                isPreEvent: false,
                isPostEvent: false,
                modifiable: false,
                anyoneCanAddSelf: false,
                guestsCanInviteOthers: false,
                guestsCanSeeOtherGuests: true,
                originalStartDate: undefined,
                originalAllDay: undefined,
                summary: task,
                updatedAt: dayjs().format(),
                calendarId: primaryCalendar?.id,
                eventId: googleRes?.googleEventId,
            }

            eventsToUpsert.push(eventToUpsert)
        }

        // upsert event
        await upsertEventsPostPlanner(eventsToUpsert)

        // send email
        if (email) {
            await sendGenericTaskEmail(
                email,
                name,
                task,
                openAIRes,
            )
        }
    } catch (e) {
        console.log(e, ' unable to work generic task')
    }
}

export const listEventsForUserGivenDates = async (
    userId: string,
    senderStartDate: string,
    senderEndDate: string,
    // senderTimezone: string,
    // receiverTimezone: string,
) => {
    try {

        const operationName = 'listEventsForUser'
        const query = `
            query listEventsForUser($userId: uuid!, $startDate: timestamp!, $endDate: timestamp!) {
                Event(where: {userId: {_eq: $userId}, endDate: {_gte: $startDate}, startDate: {_lte: $endDate}, deleted: {_neq: true}, allDay: {_neq: true}}) {
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
        // get events
        // local date
        // const startDateInReceiverTimezone = dayjs(senderStartDate.slice(0, 19)).tz(receiverTimezone, true)
        // const endDateInReceiverTimezone = dayjs((senderEndDate.slice(0, 19))).tz(receiverTimezone, true)
        // const startDateInSenderTimezone = dayjs(startDateInReceiverTimezone).format().slice(0, 19)
        // const endDateInSenderTimezone = dayjs(endDateInReceiverTimezone).format().slice(0, 19)


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
                        startDate: senderStartDate,
                        endDate: senderEndDate,
                    },
                },
            },
        ).json()

        console.log(res, ' res from listEventsforUser')
        return res?.data?.Event
    } catch (e) {
        console.log(e, ' listEventsForUser')
    }
}

export const getUserPreferences = async (userId: string): Promise<UserPreferenceType | null> => {
    try {
        if (!userId) {
            console.log('userId is null')
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
        console.log(e, ' getUserPreferences')
        return null
    }
}

export const generateAvailableSlotsForDate = (
    slotDuration: number,
    senderStartDateInReceiverTimezone: string,
    senderPreferences: UserPreferenceType,
    receiverTimezone: string,
    senderTimezone: string,
    notAvailableSlotsInEventTimezone?: NotAvailableSlotType[],
    isFirstDay?: boolean,
    isLastDay?: boolean,
    senderEndDateInReceiverTimezone?: string,
) => {

    console.log(senderTimezone, ' senderTimezone')
    console.log(receiverTimezone, ' receiverTimezone')


    if (isFirstDay && isLastDay && senderEndDateInReceiverTimezone) {

        const endTimesBySender = senderPreferences.endTimes
        const dayOfWeekIntAsReceiver = getISODay(dayjs(senderStartDateInReceiverTimezone?.slice(0, 19)).tz(receiverTimezone, true).toDate())

        const dayOfMonthAsReceiver = dayjs(senderStartDateInReceiverTimezone?.slice(0, 19)).tz(receiverTimezone, true).date()
        let startHourAsReceiver = dayjs(senderStartDateInReceiverTimezone?.slice(0, 19)).tz(receiverTimezone, true).hour()

        const flooredValue = Math.floor(60 / slotDuration)

        let minuteValueAsReceiver = 0
        if (dayjs(senderStartDateInReceiverTimezone).tz(receiverTimezone).minute() !== 0) {
            for (let i = 0; i < flooredValue; i++) {
                const endMinutes = (i + 1) * slotDuration
                const startMinutes = i * slotDuration
                if (
                    dayjs(senderStartDateInReceiverTimezone).tz(receiverTimezone)
                        .isBetween(
                            dayjs(senderStartDateInReceiverTimezone).tz(receiverTimezone).minute(startMinutes),
                            dayjs(senderStartDateInReceiverTimezone).tz(receiverTimezone).minute(endMinutes),
                            'minute', '[)')
                ) {
                    minuteValueAsReceiver = endMinutes
                }
            }
        }


        if (
            dayjs(senderStartDateInReceiverTimezone).tz(receiverTimezone)
                .isBetween(
                    dayjs(senderStartDateInReceiverTimezone).tz(receiverTimezone).minute((flooredValue * slotDuration)),
                    dayjs(senderStartDateInReceiverTimezone).tz(receiverTimezone).minute(59),
                    'minute', '[)',
                )
        ) {
            startHourAsReceiver += 1
            minuteValueAsReceiver = 0
        }

        const startMinuteAsReceiver = minuteValueAsReceiver

        const endHourWorkBySender = endTimesBySender?.find(i => (i.day === dayOfWeekIntAsReceiver))?.hour ?? 20
        const endMinuteWorkBySender = endTimesBySender?.find(i => (i.day === dayOfWeekIntAsReceiver))?.minutes ?? 0
        const endHourAsReceiver = dayjs(senderEndDateInReceiverTimezone).tz(receiverTimezone).hour()
        const endMinuteAsReceiver = dayjs(senderEndDateInReceiverTimezone).tz(receiverTimezone).minute()


        // validate values before calculating
        const startTimes = senderPreferences.startTimes
        const workStartHourBySender = startTimes?.find(i => (i.day === dayOfWeekIntAsReceiver))?.hour || 8
        const workStartMinuteBySender = startTimes?.find(i => (i.day === dayOfWeekIntAsReceiver))?.minutes || 0

        if (dayjs(senderStartDateInReceiverTimezone).tz(senderTimezone).isAfter(dayjs(senderStartDateInReceiverTimezone).tz(senderTimezone).hour(endHourWorkBySender).minute(endMinuteWorkBySender))) {
            // return empty as outside of work time
            return []
        }

        // change to work start time as sender start time before work start time
        if (dayjs(senderStartDateInReceiverTimezone).tz(senderTimezone).isBefore(dayjs(senderStartDateInReceiverTimezone).tz(senderTimezone).hour(workStartHourBySender).minute(workStartMinuteBySender))) {
            const startDuration = dayjs.duration({ hours: workStartHourBySender, minutes: workStartMinuteBySender })
            const endDuration = dayjs.duration({ hours: endHourAsReceiver, minutes: endMinuteAsReceiver })
            const totalDuration = endDuration.subtract(startDuration)
            const totalMinutes = totalDuration.asMinutes()

            const availableSlotsInReceiverTimezone: AvailableSlotType[] = []
            console.log(senderStartDateInReceiverTimezone, endTimesBySender, dayOfWeekIntAsReceiver, dayOfMonthAsReceiver, startHourAsReceiver, startMinuteAsReceiver, endHourAsReceiver, endMinuteAsReceiver, timezone, `startDate, endTimes, dayOfWeekIntByUser, dayOfMonth, startHour, startMinute, endHour, endMinute totalMinutes, timezone, inside firstDay inside generateTimeslots`)
            for (let i = 0; i < totalMinutes; i += slotDuration) {
                if (i > totalMinutes) {
                    continue
                }

                availableSlotsInReceiverTimezone.push({
                    id: uuid(),
                    startDate: dayjs(senderStartDateInReceiverTimezone).tz(senderTimezone).hour(workStartHourBySender).minute(workStartMinuteBySender).tz(receiverTimezone).add(i, 'minute').second(0).format(),
                    endDate: dayjs(senderStartDateInReceiverTimezone).tz(senderTimezone).hour(workStartHourBySender).minute(workStartMinuteBySender).tz(receiverTimezone).add(i + slotDuration, 'minute').second(0).format(),
                })
            }
            console.log(availableSlotsInReceiverTimezone, ' timeSlots inside generateTimeSlots for first day where startDate is before work start time')

            // filter out unavailable times
            const filteredAvailableSlotsInReceiverTimezone = availableSlotsInReceiverTimezone.filter(a => {
                const foundIndex = notAvailableSlotsInEventTimezone?.findIndex(na => {
                    const partA = (dayjs(a.endDate).tz(receiverTimezone).second(0).isBetween(dayjs(na.startDate).tz(receiverTimezone).second(0).add(1, 'm'), dayjs(na.endDate).tz(receiverTimezone).second(0).subtract(1, 'm'), 'm', '[]'))

                    const partB = (dayjs(a.startDate).tz(receiverTimezone).second(0).isBetween(dayjs(na.startDate).tz(receiverTimezone).second(0).add(1, 'm'), dayjs(na.endDate).tz(receiverTimezone).second(0).subtract(1, 'm'), 'm', '[]'))

                    const partC = ((dayjs(na.startDate).tz(receiverTimezone).second(0).format('YYYY-MM-DDTHH:mm') === dayjs(a.startDate).tz(receiverTimezone).second(0).format('YYYY-MM-DDTHH:mm')) && (dayjs(na.endDate).tz(receiverTimezone).second(0).format('YYYY-MM-DDTHH:mm') === dayjs(a.endDate).tz(receiverTimezone).second(0).format('YYYY-MM-DDTHH:mm')))

                    const isNotAvailable = (partA || partB || partC)

                    // console.log(a, na, ' a, na')
                    return isNotAvailable
                })

                console.log(foundIndex, ' foundIndex')

                if ((foundIndex !== undefined) && (foundIndex > -1)) {
                    return false
                }

                return true
            })

            console.log(filteredAvailableSlotsInReceiverTimezone, ' filteredAvailableSlots')

            return filteredAvailableSlotsInReceiverTimezone
        }


        const startDuration = dayjs.duration({ hours: startHourAsReceiver, minutes: startMinuteAsReceiver })
        const endDuration = dayjs.duration({ hours: endHourAsReceiver, minutes: endMinuteAsReceiver })
        const totalDuration = endDuration.subtract(startDuration)
        const totalMinutes = totalDuration.asMinutes()
        console.log(totalMinutes, ' totalMinutes inside first and last same day')
        const availableSlotsInReceiverTimezone: AvailableSlotType[] = []
        console.log(senderStartDateInReceiverTimezone, endTimesBySender, dayOfWeekIntAsReceiver, endHourWorkBySender, endMinuteWorkBySender, receiverTimezone, `startDate, endTimes, dayOfWeekInt, dayOfMonth, startHour, startMinute, endHour, endMinute totalMinutes, timezone, inside first & last Day inside generateTimeslots`)
        for (let i = 0; i < totalMinutes; i += slotDuration) {
            if (i > totalMinutes) {
                continue
            }
            availableSlotsInReceiverTimezone.push({
                id: uuid(),
                startDate: dayjs(senderStartDateInReceiverTimezone).tz(receiverTimezone).hour(startHourAsReceiver).minute(startMinuteAsReceiver).add(i, 'minute').second(0).format(),
                endDate: dayjs(senderStartDateInReceiverTimezone).tz(receiverTimezone).hour(startHourAsReceiver).minute(startMinuteAsReceiver).add(i + slotDuration, 'minute').second(0).format(),
            })
        }

        console.log(availableSlotsInReceiverTimezone, ' availableSlots inside first & last same day')
        const filteredAvailableSlotsInReceiverTimezone = availableSlotsInReceiverTimezone.filter(a => {
            const foundIndex = notAvailableSlotsInEventTimezone?.findIndex(na => {
                const partA = (dayjs(a.endDate).tz(receiverTimezone).second(0).isBetween(dayjs(na.startDate).tz(receiverTimezone).second(0).add(1, 'm'), dayjs(na.endDate).tz(receiverTimezone).second(0).subtract(1, 'm'), 'm', '[]'))

                const partB = (dayjs(a.startDate).tz(receiverTimezone).second(0).isBetween(dayjs(na.startDate).tz(receiverTimezone).second(0).add(1, 'm'), dayjs(na.endDate).tz(receiverTimezone).second(0).subtract(1, 'm'), 'm', '[]'))

                const partC = ((dayjs(na.startDate).tz(receiverTimezone).second(0).format('YYYY-MM-DDTHH:mm') === dayjs(a.startDate).tz(receiverTimezone).second(0).format('YYYY-MM-DDTHH:mm')) && (dayjs(na.endDate).tz(receiverTimezone).second(0).format('YYYY-MM-DDTHH:mm') === dayjs(a.endDate).tz(receiverTimezone).second(0).format('YYYY-MM-DDTHH:mm')))

                const isNotAvailable = (partA || partB || partC)

                // console.log(a, na, ' a, na')

                return isNotAvailable
            })

            console.log(foundIndex, ' foundIndex')

            if ((foundIndex !== undefined) && (foundIndex > -1)) {
                return false
            }

            return true
        })

        console.log(filteredAvailableSlotsInReceiverTimezone, ' filteredAvailableSlots')
        return filteredAvailableSlotsInReceiverTimezone
    }

    if (isFirstDay) {
        // firstday can be started outside of work time
        // if firstDay start is after end time -- return []
        const endTimesBySender = senderPreferences.endTimes
        const dayOfWeekIntAsReceiver = getISODay(dayjs(senderStartDateInReceiverTimezone).tz(receiverTimezone).toDate())

        // month is zero-indexed
        // const month = dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).tz(userTimezone).month()
        const dayOfMonthAsReceiver = dayjs(senderStartDateInReceiverTimezone).tz(receiverTimezone).date()
        let startHourAsReceiver = dayjs(senderStartDateInReceiverTimezone).tz(receiverTimezone).hour()
        const startHourBySender = dayjs(senderStartDateInReceiverTimezone).tz(senderTimezone).hour()
        const startMinuteBySender = dayjs(senderStartDateInReceiverTimezone).tz(senderTimezone).minute()
        // create slot sizes
        const flooredValue = Math.floor(60 / slotDuration)

        let minuteValueAsReceiver = 0
        if (dayjs(senderStartDateInReceiverTimezone).tz(receiverTimezone).minute() !== 0) {
            for (let i = 0; i < flooredValue; i++) {
                const endMinutes = (i + 1) * slotDuration
                const startMinutes = i * slotDuration
                if (
                    dayjs(senderStartDateInReceiverTimezone).tz(receiverTimezone)
                        .isBetween(
                            dayjs(senderStartDateInReceiverTimezone).tz(receiverTimezone).minute(startMinutes),
                            dayjs(senderStartDateInReceiverTimezone).tz(receiverTimezone).minute(endMinutes),
                            'minute', '[)')
                ) {
                    minuteValueAsReceiver = endMinutes
                }
            }
        }

        if (
            dayjs(senderStartDateInReceiverTimezone).tz(receiverTimezone)
                .isBetween(
                    dayjs(senderStartDateInReceiverTimezone).tz(receiverTimezone).minute((flooredValue * slotDuration)),
                    dayjs(senderStartDateInReceiverTimezone).tz(receiverTimezone).minute(59),
                    'minute', '[)',
                )
        ) {
            startHourAsReceiver += 1
            minuteValueAsReceiver = 0
        }

        const startMinuteAsReceiver = minuteValueAsReceiver


        // convert to user timezone so everything is linked to user timezone


        const endHourBySender = endTimesBySender?.find(i => (i.day === dayOfWeekIntAsReceiver))?.hour ?? 20
        const endMinuteBySender = endTimesBySender?.find(i => (i.day === dayOfWeekIntAsReceiver))?.minutes ?? 0

        // validate values before calculating
        const startTimes = senderPreferences.startTimes
        const workStartHourBySender = startTimes?.find(i => (i.day === dayOfWeekIntAsReceiver))?.hour || 8
        const workStartMinuteBySender = startTimes?.find(i => (i.day === dayOfWeekIntAsReceiver))?.minutes || 0


        if (dayjs(senderStartDateInReceiverTimezone).tz(senderTimezone).isAfter(dayjs(senderStartDateInReceiverTimezone).tz(senderTimezone).hour(endHourBySender).minute(endMinuteBySender))) {
            // return empty as outside of work time
            return []
        }

        // change to work start time as host start time before work start time
        if (dayjs(senderStartDateInReceiverTimezone).tz(senderTimezone).isBefore(dayjs(senderStartDateInReceiverTimezone).tz(senderTimezone).hour(workStartHourBySender).minute(workStartMinuteBySender))) {
            const startDuration = dayjs.duration({ hours: workStartHourBySender, minutes: workStartMinuteBySender })
            const endDuration = dayjs.duration({ hours: endHourBySender, minutes: endMinuteBySender })
            const totalDuration = endDuration.subtract(startDuration)
            const totalMinutes = totalDuration.asMinutes()

            const availableSlotsInReceiverTimezone: AvailableSlotType[] = []
            console.log(senderStartDateInReceiverTimezone, endTimesBySender, dayOfWeekIntAsReceiver, dayOfMonthAsReceiver, startHourAsReceiver, startMinuteAsReceiver, endHourBySender, endMinuteBySender, timezone, `startDate, endTimes, dayOfWeekIntByUser, dayOfMonth, startHour, startMinute, endHour, endMinute totalMinutes, timezone, inside firstDay inside generateTimeslots`)
            for (let i = 0; i < totalMinutes; i += slotDuration) {
                if (i > totalMinutes) {
                    continue
                }

                availableSlotsInReceiverTimezone.push({
                    id: uuid(),
                    startDate: dayjs(senderStartDateInReceiverTimezone).tz(senderTimezone).hour(workStartHourBySender).minute(workStartMinuteBySender).tz(receiverTimezone).add(i, 'minute').second(0).format(),
                    endDate: dayjs(senderStartDateInReceiverTimezone).tz(senderTimezone).hour(workStartHourBySender).minute(workStartMinuteBySender).tz(receiverTimezone).add(i + slotDuration, 'minute').second(0).format(),
                })
            }
            console.log(availableSlotsInReceiverTimezone, ' timeSlots inside generateTimeSlots for first day where startDate is before work start time')

            // filter out unavailable times
            const filteredAvailableSlotsInReceiverTimezone = availableSlotsInReceiverTimezone.filter(a => {
                const foundIndex = notAvailableSlotsInEventTimezone?.findIndex(na => {
                    const partA = (dayjs(a.endDate).tz(receiverTimezone).second(0).isBetween(dayjs(na.startDate).tz(receiverTimezone).second(0).add(1, 'm'), dayjs(na.endDate).tz(receiverTimezone).second(0).subtract(1, 'm'), 'm', '[]'))

                    const partB = (dayjs(a.startDate).tz(receiverTimezone).second(0).isBetween(dayjs(na.startDate).tz(receiverTimezone).second(0).add(1, 'm'), dayjs(na.endDate).tz(receiverTimezone).second(0).subtract(1, 'm'), 'm', '[]'))

                    const partC = ((dayjs(na.startDate).tz(receiverTimezone).second(0).format('YYYY-MM-DDTHH:mm') === dayjs(a.startDate).tz(receiverTimezone).second(0).format('YYYY-MM-DDTHH:mm')) && (dayjs(na.endDate).tz(receiverTimezone).second(0).format('YYYY-MM-DDTHH:mm') === dayjs(a.endDate).tz(receiverTimezone).second(0).format('YYYY-MM-DDTHH:mm')))

                    const isNotAvailable = (partA || partB || partC)

                    // console.log(a, na, ' a, na')
                    return isNotAvailable
                })

                console.log(foundIndex, ' foundIndex')

                if ((foundIndex !== undefined) && (foundIndex > -1)) {
                    return false
                }

                return true
            })

            console.log(filteredAvailableSlotsInReceiverTimezone, ' filteredAvailableSlots')

            return filteredAvailableSlotsInReceiverTimezone
        }

        const startDuration = dayjs.duration({ hours: startHourBySender, minutes: startMinuteBySender })
        const endDuration = dayjs.duration({ hours: endHourBySender, minutes: endMinuteBySender })
        const totalDuration = endDuration.subtract(startDuration)
        const totalMinutes = totalDuration.asMinutes()
        const availableSlotsInReceiverTimezone: AvailableSlotType[] = []
        console.log(senderStartDateInReceiverTimezone, endTimesBySender, dayOfWeekIntAsReceiver, endHourBySender, endMinuteBySender, receiverTimezone, `startDate, endTimes, dayOfWeekInt, dayOfMonth, startHour, startMinute, endHour, endMinute totalMinutes, timezone, inside firstDay inside generateTimeslots`)
        for (let i = 0; i < totalMinutes; i += slotDuration) {
            if (i > totalMinutes) {
                continue
            }
            availableSlotsInReceiverTimezone.push({
                id: uuid(),
                startDate: dayjs(senderStartDateInReceiverTimezone).tz(receiverTimezone).hour(startHourAsReceiver).minute(startMinuteAsReceiver).add(i, 'minute').second(0).format(),
                endDate: dayjs(senderStartDateInReceiverTimezone).tz(receiverTimezone).hour(startHourAsReceiver).minute(startMinuteAsReceiver).add(i + slotDuration, 'minute').second(0).format(),
            })
        }
        const filteredAvailableSlotsInReceiverTimezone = availableSlotsInReceiverTimezone.filter(a => {
            const foundIndex = notAvailableSlotsInEventTimezone?.findIndex(na => {
                const partA = (dayjs(a.endDate).tz(receiverTimezone).second(0).isBetween(dayjs(na.startDate).tz(receiverTimezone).second(0).add(1, 'm'), dayjs(na.endDate).tz(receiverTimezone).second(0).subtract(1, 'm'), 'm', '[]'))

                const partB = (dayjs(a.startDate).tz(receiverTimezone).second(0).isBetween(dayjs(na.startDate).tz(receiverTimezone).second(0).add(1, 'm'), dayjs(na.endDate).tz(receiverTimezone).second(0).subtract(1, 'm'), 'm', '[]'))

                const partC = ((dayjs(na.startDate).tz(receiverTimezone).second(0).format('YYYY-MM-DDTHH:mm') === dayjs(a.startDate).tz(receiverTimezone).second(0).format('YYYY-MM-DDTHH:mm')) && (dayjs(na.endDate).tz(receiverTimezone).second(0).format('YYYY-MM-DDTHH:mm') === dayjs(a.endDate).tz(receiverTimezone).second(0).format('YYYY-MM-DDTHH:mm')))

                const isNotAvailable = (partA || partB || partC)

                // console.log(a, na, ' a, na')

                return isNotAvailable
            })

            console.log(foundIndex, ' foundIndex')

            if ((foundIndex !== undefined) && (foundIndex > -1)) {
                return false
            }

            return true
        })

        console.log(filteredAvailableSlotsInReceiverTimezone, ' filteredAvailableSlots server timezone')
        return filteredAvailableSlotsInReceiverTimezone
    }

    // not first day start from work start time schedule

    const startTimesBySender = senderPreferences.startTimes

    const endTimesBySender = senderPreferences.endTimes

    const dayOfWeekIntAsReceiver = getISODay(dayjs(senderStartDateInReceiverTimezone?.slice(0, 19)).tz(receiverTimezone, true).toDate())
    const dayOfMonthAsReceiver = dayjs(senderStartDateInReceiverTimezone?.slice(0, 19)).tz(receiverTimezone, true).date()

    // convert to user timezone so everything is linked to user timezone
    let endHourBySender = (endTimesBySender?.find(i => (i.day === dayOfWeekIntAsReceiver))?.hour) ?? 20
    let endMinuteBySender = endTimesBySender?.find(i => (i.day === dayOfWeekIntAsReceiver))?.minutes ?? 0

    // if last day change end time to hostStartDate provided
    if (isLastDay && senderEndDateInReceiverTimezone) {
        endHourBySender = dayjs(senderEndDateInReceiverTimezone).tz(senderTimezone).hour()
        // create slot sizes
        const flooredValue = Math.floor(60 / slotDuration)

        let minuteValueBySender = 0
        for (let i = 0; i < flooredValue; i++) {
            const endMinutes = (i + 1) * slotDuration
            const startMinutes = i * slotDuration
            if (
                dayjs(senderEndDateInReceiverTimezone).tz(senderTimezone)
                    .isBetween(
                        dayjs(senderEndDateInReceiverTimezone).tz(senderTimezone).minute(startMinutes),
                        dayjs(senderEndDateInReceiverTimezone).tz(senderTimezone).minute(endMinutes), 'minute', '[)')
            ) {
                minuteValueBySender = startMinutes
            }
        }

        endMinuteBySender = minuteValueBySender
    }


    const startHourBySender = startTimesBySender?.find(i => (i.day === dayOfWeekIntAsReceiver))?.hour as number || 8
    const startMinuteBySender = startTimesBySender?.find(i => (i.day === dayOfWeekIntAsReceiver))?.minutes as number || 0


    const startDuration = dayjs.duration({ hours: startHourBySender, minutes: startMinuteBySender })
    const endDuration = dayjs.duration({ hours: endHourBySender, minutes: endMinuteBySender })
    const totalDuration = endDuration.subtract(startDuration)
    const totalMinutes = totalDuration.asMinutes()

    const availableSlotsInReceiverTimezone: AvailableSlotType[] = []
    console.log(senderStartDateInReceiverTimezone, endTimesBySender, dayOfWeekIntAsReceiver, dayOfMonthAsReceiver, startHourBySender, startMinuteBySender, endHourBySender, endMinuteBySender, timezone, `startDate, endTimes, dayOfWeekIntByHost, dayOfMonth, startHour, startMinute, endHour, endMinute totalMinutes, timezone, inside firstDay inside generateAvailableslots`)
    for (let i = 0; i < totalMinutes; i += slotDuration) {
        if (i > totalMinutes) {
            continue
        }

        availableSlotsInReceiverTimezone.push({
            id: uuid(),
            startDate: dayjs(senderStartDateInReceiverTimezone).tz(senderTimezone).hour(startHourBySender).minute(startMinuteBySender).tz(receiverTimezone).add(i, 'minute').second(0).format(),
            endDate: dayjs(senderStartDateInReceiverTimezone).tz(senderTimezone).hour(startHourBySender).minute(startMinuteBySender).tz(receiverTimezone).add(i + slotDuration, 'minute').second(0).format(),
        })
    }

    console.log(availableSlotsInReceiverTimezone, ' timeSlots inside generateTimeSlots not first day')
    console.log(notAvailableSlotsInEventTimezone,  ' notAvailableSlotsInEventTimezone not first day')

    // filter out unavailable times
    const filteredAvailableSlotsInReceiverTimezone = availableSlotsInReceiverTimezone.filter(a => {
        const foundIndex = notAvailableSlotsInEventTimezone?.findIndex(na => {
            const partA = (dayjs(a.endDate).tz(receiverTimezone).second(0).isBetween(dayjs(na.startDate).tz(receiverTimezone).second(0).add(1, 'm'), dayjs(na.endDate).tz(receiverTimezone).second(0).subtract(1, 'm'), 'm', '[]'))

            const partB = (dayjs(a.startDate).tz(receiverTimezone).second(0).isBetween(dayjs(na.startDate).tz(receiverTimezone).second(0).add(1, 'm'), dayjs(na.endDate).tz(receiverTimezone).second(0).subtract(1, 'm'), 'm', '[]'))

            const partC = ((dayjs(na.startDate).tz(receiverTimezone).second(0).format('YYYY-MM-DDTHH:mm') === dayjs(a.startDate).tz(receiverTimezone).second(0).format('YYYY-MM-DDTHH:mm')) && (dayjs(na.endDate).tz(receiverTimezone).second(0).format('YYYY-MM-DDTHH:mm') === dayjs(a.endDate).tz(receiverTimezone).second(0).format('YYYY-MM-DDTHH:mm')))

            const isNotAvailable = (partA || partB || partC)

            // console.log(a, na, ' a, na')

            return isNotAvailable
        })

        console.log(foundIndex, ' foundIndex')

        if ((foundIndex !== undefined) && (foundIndex > -1)) {
            return false
        }

        return true
    })

    console.log(filteredAvailableSlotsInReceiverTimezone, ' filteredAvailableSlots in receiverTimezone')
    // convert to receiverTimezone before returning values
    return filteredAvailableSlotsInReceiverTimezone

}

export const generateAvailableSlotsforTimeWindow = (
    windowStartDate: string,
    windowEndDate: string,
    slotDuration: number,
    senderPreferences: UserPreferenceType,
    receiverTimezone: string,
    senderTimezone: string,
    notAvailableSlotsInEventTimezone?: NotAvailableSlotType[],
) => {
    const diffDays = dayjs(windowEndDate).diff(dayjs(windowStartDate), 'd')

    const startDatesForEachDay = []
    const availableSlots: AvailableSlotType[] = []

    for (let i = 0; i <= diffDays; i++) {
        startDatesForEachDay.push(dayjs(windowStartDate.slice(0, 19)).tz(receiverTimezone, true).add(i, 'day').format())
    }

    if (diffDays < 1) {

        const generatedSlots = generateAvailableSlotsForDate(
            slotDuration,
            dayjs(windowStartDate.slice(0, 19)).tz(receiverTimezone, true).format(),
            senderPreferences,
            receiverTimezone,
            senderTimezone,
            notAvailableSlotsInEventTimezone,
            true,
            true,
            dayjs(windowEndDate.slice(0, 19)).tz(receiverTimezone, true).format(),
        )
        //  0123456789
        //  2020-04-02T08:02:17-05:00
        availableSlots.push(...generatedSlots)

    } else {
        for (let i = 0; i < startDatesForEachDay.length; i++) {
            const filteredNotAvailableSlotsInEventTimezone = notAvailableSlotsInEventTimezone
                ?.filter(na => (dayjs(na?.startDate).tz(receiverTimezone).format('YYYY-MM-DD') === dayjs(startDatesForEachDay?.[i]).tz(receiverTimezone).format('YYYY-MM-DD')))
            if (i === 0) {
                const generatedSlots = generateAvailableSlotsForDate(
                    slotDuration,
                    startDatesForEachDay?.[i],
                    senderPreferences,
                    receiverTimezone,
                    senderTimezone,
                    filteredNotAvailableSlotsInEventTimezone,
                    true,
                    false,
                    dayjs(windowEndDate.slice(0, 19)).tz(receiverTimezone, true).format(),
                )
                //  0123456789
                //  2020-04-02T08:02:17-05:00
                availableSlots.push(...generatedSlots)

                continue
            }

            if (i === (startDatesForEachDay.length - 1)) {
                
                const generatedSlots = generateAvailableSlotsForDate(
                    slotDuration,
                    startDatesForEachDay?.[i],
                    senderPreferences,
                    receiverTimezone,
                    senderTimezone,
                    filteredNotAvailableSlotsInEventTimezone,
                    false,
                    true,
                    dayjs(windowEndDate.slice(0, 19)).tz(receiverTimezone, true).format(),
                )

                availableSlots.push(...generatedSlots)

                continue
            }


            const generatedSlots = generateAvailableSlotsForDate(
                slotDuration,
                startDatesForEachDay?.[i],
                senderPreferences,
                receiverTimezone,
                senderTimezone,
                filteredNotAvailableSlotsInEventTimezone,
            )

            availableSlots.push(...generatedSlots)

        }
    }

    return { availableSlots }
}

export const generateAvailability = async (
    userId: string,
    windowStartDateInSenderTimezone: string,
    windowEndDateInSenderTimezone: string,
    senderTimezone: string,
    receiverTimezone: string,
    slotDuration: number,
) => {
    try {
        const oldEventsInEventTimezone = await listEventsForUserGivenDates(
            userId,
            windowStartDateInSenderTimezone,
            windowEndDateInSenderTimezone,
        )

        console.log(oldEventsInEventTimezone, ' oldEventsInEventTimezone')

        if (!oldEventsInEventTimezone || (!(oldEventsInEventTimezone?.length > 0))) {
            console.log('no old events in generateAvailability')
        }

        const oldEventsInEventTimezoneFormatted = oldEventsInEventTimezone?.map(e => ({
            ...e,
            startDate: dayjs(e?.startDate.slice(0, 19)).tz(e?.timezone, true).format(),
            endDate: dayjs(e?.endDate.slice(0, 19)).tz(e?.timezone, true).format(),
            timezone: e?.timezone,
        }))


        const notAvailableFromEvents: NotAvailableSlotType[] = oldEventsInEventTimezoneFormatted?.map(e => ({
            startDate: e?.startDate,
            endDate: e?.endDate,
        }))

        const userPreferences = await getUserPreferences(userId)

        const { availableSlots: availableSlotsInReceiverTimezone } = await generateAvailableSlotsforTimeWindow(
            windowStartDateInSenderTimezone,
            windowEndDateInSenderTimezone,
            slotDuration,
            userPreferences,
            receiverTimezone,
            senderTimezone,
            notAvailableFromEvents?.length > 0 ? notAvailableFromEvents : undefined,
        )

        return availableSlotsInReceiverTimezone

    } catch (e) {
        console.log(e, ' unable to generate availability')
    }
}

export const sendMeetingRequestTemplate = async (
    email: string,
    name: string,
    body: string,
) => {
    try {
        const template = 'meeting-request-template'

        await sendEmail({
            template,
            locals: {
                name,
                body, 
                displayName: name,
                email,
                locale: ENV.AUTH_LOCALE_DEFAULT,
                serverUrl: ENV.FUNCTION_SERVER_URL,
                clientUrl: ENV.APP_CLIENT_URL,
            },
            message: {
                to: email,
                headers: {
                    'x-email-template': {
                        prepared: true,
                        value: template,
                      },
                },
            }
        })
    } catch (e) {
        console.log(e, ' unable to send meeting request')
    }
}

export const meetingRequest = async (
    userId: string,
    email: string,
    shareAvailability: boolean,
    receiver: string,
    sender: string,
    receiverCharacteristics?: string[],
    receiverGoals?: string[],
    senderCharacteristics?: string[],
    senderGoals?: string[],
    windowStartDate?: string,
    windowEndDate?: string,
    senderTimezone?: string,
    receiverTimezone?: string,
    slotDuration?: number,
) => {
    try {

        if (
            shareAvailability
            && windowStartDate
            && windowEndDate
            && senderTimezone
            && receiverTimezone
            && slotDuration
        ) {
            // get availability
            const availability = await generateAvailability(
                userId,
                windowStartDate,
                windowEndDate,
                senderTimezone,
                receiverTimezone,
                slotDuration,
            )

            if (!(availability?.length > 0)) {
                throw new Error('no availability present')
            }

            const uniqDates = _.uniqBy(availability, (curr) => (dayjs(curr?.startDate).tz(receiverTimezone).format('YYYY-MM-DD')))

            let availabilityText = ''

            const prompt = summarizeAvailabilityPrompt

            const exampleInput = summarizeAvailabilityExampleInput

            const exampleOutput = summarizeAvailabilityExampleOutput

            let openAIAvailabilityRes = ''

            const miniOpenAISummarizingAvailabilityResponses: string[] = []
            

            for (const uniqDate of uniqDates) {

                const filteredAvailability = availability?.filter(a => (dayjs(a?.startDate).tz(receiverTimezone).format('YYYY-MM-DD') === dayjs(uniqDate?.startDate).tz(receiverTimezone).format('YYYY-MM-DD')))

                if (filteredAvailability?.length > 0) {
                     availabilityText += `${dayjs(uniqDate?.startDate).tz(receiverTimezone).format('L')} - ${filteredAvailability?.map((curr) => (`${dayjs(curr?.startDate).tz(receiverTimezone).format('LT')} - ${dayjs(curr?.endDate).tz(receiverTimezone).format('LT')},`))?.reduce((prev, curr) => (`${prev} ${curr}`), '')}` + '\n\n'

                    const miniAvailabilityText = `${dayjs(uniqDate?.startDate).tz(receiverTimezone).format('L')} - ${filteredAvailability?.map((curr) => (`${dayjs(curr?.startDate).tz(receiverTimezone).format('LT')} - ${dayjs(curr?.endDate).tz(receiverTimezone).format('LT')},`))?.reduce((prev, curr) => (`${prev} ${curr}`), '')}` + '\n\n'


                    const miniUserData = `My availability: ` + miniAvailabilityText

                    console.log(miniUserData, ' newAvailabilityPrompt')

                    const miniOpenAIAvailabilityRes = await callOpenAI(prompt, openAIChatGPTModel, miniUserData, exampleInput, exampleOutput)

                    // validate openai res
                    if (!miniOpenAIAvailabilityRes) {
                        throw new Error('no openAIAvailabilityRes present inside appointmentRequest')
                    }

                    miniOpenAISummarizingAvailabilityResponses.push(miniOpenAIAvailabilityRes) 
                    
                    openAIAvailabilityRes += '\n' + miniOpenAIAvailabilityRes
                }
            }

            console.log(openAIAvailabilityRes, ' openAIAvailabilityRes')

            const availabilityFinalSummaryUserData = miniOpenAISummarizingAvailabilityResponses?.reduce((prev, curr) => (`${prev} ${curr}`), '')

            let finalOpenAIAvailabilitySummaryResponse = ''

            if (availabilityFinalSummaryUserData) {
                finalOpenAIAvailabilitySummaryResponse = await callOpenAI(summarizeAvailabilityResponsesPrompt, openAIChatGPTModel, availabilityFinalSummaryUserData, summarizeAvailabilityResponsesPromptExampleInput, summarizeAvailabilityResponsesPromptExampleOutput)
            }

            const prompt1 = meetingRequestWithAvailabilityPrompt

            // create prompt
            const userData1 = `
                Person of interest: ${receiver},
                ${receiverCharacteristics?.length > 0 ? `person of interest characteristics: ${receiverCharacteristics?.reduce((prev, curr) => (`${prev}, ${curr}`), '')},` : ''}
                ${receiverGoals?.length > 0 ? `person of interest goals: ${receiverGoals?.reduce((prev, curr) => (`${prev}, ${curr}`))},` : ''} 
                Me: ${sender},
                ${senderCharacteristics?.length > 0 ? `my characteristics: ${senderCharacteristics?.reduce((prev, curr) => (`${prev}, ${curr}`))},` : ''}
                ${senderGoals?.length > 0 ? `my goals: ${senderGoals?.reduce((prev, curr) => (`${prev}, ${curr}`), '')}` : ''}
                
            `

            console.log(userData1, ' newPrompt')

            // get res from openai

            let openAIRes = await callOpenAI(prompt1, openAIChatGPTModel, userData1)

            // validate openai res
            if (!openAIRes) {
                throw new Error('no openAIRes present inside appointmentRequest')
            }

            // simpliyAvailabilityPrompt
            console.log(openAIRes, ' openAIRes before availability')

            // openAIRes += '\n\n' + 'My availability:' + '\n' + availabilityText
            openAIRes += '\n\n' + finalOpenAIAvailabilitySummaryResponse
            console.log(openAIRes, ' openAIRes after availability')
            
            // email template to sender
            await sendMeetingRequestTemplate(
                email,
                receiver,
                openAIRes,
            )
        } else {
            // create prompt
            const prompt3 = meetingRequestPrompt
            const userData3 = `Here it is:
                Person of interest: ${receiver},
                ${receiverCharacteristics?.length > 0 ? `person of interest characteristics: ${receiverCharacteristics?.reduce((prev, curr) => (`${prev}, ${curr}`), '')},` : ''}
                ${receiverGoals?.length > 0 ? `person of interest goals: ${receiverGoals?.reduce((prev, curr) => (`${prev}, ${curr}`), '')},` : ''} 
                Me: ${sender},
                ${senderCharacteristics?.length > 0 ? `my characteristics: ${senderCharacteristics?.reduce((prev, curr) => (`${prev}, ${curr}`), '')},` : ''}
                ${senderGoals?.length > 0 ? `my goals: ${senderGoals?.reduce((prev, curr) => (`${prev}, ${curr}`), '')},` : ''}
            `

            // get res from openai

            const openAIRes = await callOpenAI(prompt3, openAIChatGPTModel, userData3)

            // validate openai res
            if (!openAIRes) {
                throw new Error('no openAIRes present inside appointmentRequest')
            }

            // email template to sender

            await sendMeetingRequestTemplate(
                email,
                receiver,
                openAIRes,
            )
        }


    } catch (e) {
        console.log(e, ' unable to reqeust appointment')
    }
}

export const emailDailySchedule = async (
    email: string,
    name: string,
    body: string,
    startDate: string,
) => {
    try {
        const template = 'day-schedule-template'

        await sendEmail({
            template,
            locals: {
                name,
                body,
                startDate: dayjs(startDate).format('L'),
                displayName: name,
                email,
                locale: ENV.AUTH_LOCALE_DEFAULT,
                serverUrl: ENV.FUNCTION_SERVER_URL,
                clientUrl: ENV.APP_CLIENT_URL,
            },
            message: {
                to: email,
                headers: {
                    'x-email-template': {
                        prepared: true,
                        value: template,
                      },
                },
            }
        })
    } catch (e) {
        console.log(e, ' unable to email daily schedule')
    }
}

const delay = retryCount =>
  new Promise(resolve => setTimeout(resolve, 10 ** retryCount))

const getResource = async (apiCall: (...args) => Promise<any>, retryCount: number = 0, lastError: any = null, ...args) => {
  if (retryCount > 5) throw new Error(lastError);
  try {
    return apiCall(...args);
  } catch (e) {
    await delay(retryCount);
    return getResource(apiCall, retryCount + 1, e, ...args);
  }
}

// \n\u2022 bullets
export const createDaySchedule = async (
    userId: string,
    tasks: string[], // make sure to add previous events inside tasks when submitting
    isAllDay: boolean,
    timezone: string,
    startDate: string,
    endDate: string,
    email?: string,
    name?: string,
    isTwo?: boolean,
) => {
    try {

        // get previous events
        const previousEvents = await listEventsForUserGivenDates(userId, startDate, endDate)

        // create prompt
        // h:mm A
        const prompt = `
            ${dailySchedulePrompt1} ${dayjs(startDate?.slice(0, 19)).diff(endDate?.slice(0, 19), 'h')} ${dailySchedulePrompt2}
            ${dayjs(startDate?.slice(0, 19)).tz(timezone, true).format('LT')}. ${dailySchedulePrompt3}
        `
        const exampleInput = dailyScheduleExampleInput
        const exampleOutput = dailyScheduleExampleOutput
        const userData = `
            Here are my tasks:
            ${tasks?.reduce((prev, curr) => (`${prev}, ${curr}`), '')},
            ${previousEvents?.map(e => `From ${dayjs(e?.startDate?.slice(0, 19)).tz(timezone, true).format('h:mm A')} to ${dayjs(e?.endDate?.slice(0, 19)).tz(timezone, true).format('h:mm A')}: ${e?.summary} ${e?.notes}`)
                ?.reduce((prev, curr) => (`${prev}, ${curr}`), '')}
        `
        console.log(userData, ' newPrompt')
        // get res from openai
        const openAIRes = await callOpenAI(prompt, openAIChatGPTModel, userData, exampleInput, exampleOutput)

        // validate openai res
        if (!openAIRes) {
            throw new Error('no openAIRes present inside createAgenda')
        }

        console.log(openAIRes, ' openAIRes')

        // create event

        // get primary calendar
        const primaryCalendar = await getGlobalCalendar(userId)

        // validate
        if (!primaryCalendar?.id) {
            throw new Error('no primary calendar found inside createAgenda')
        }

        // get client type
        const calIntegration = await getCalendarIntegration(
            userId,
            googleCalendarResource,
        )

        // validate
        if (!calIntegration?.clientType) {
            throw new Error('no client type inside calendar integration inside create agenda')
        }

        // format response for all day
        /*
            format is JSON array [{"start_time": "", "end_time": "", "task": ""}]
        */

        const startIndex = openAIRes?.indexOf('[')
        const endIndex = openAIRes?.indexOf(']')

        const finalString = openAIRes.slice(startIndex, endIndex + 1)

        console.log('finalString: ', finalString)

        const parsedText: DailyScheduleObjectType[] = JSON.parse(finalString)

        console.log('parsedText: ', parsedText)

        const filteredParsedText = parsedText?.filter(p => {
            const foundIndex = previousEvents?.findIndex(e => (
                (dayjs(e?.startDate?.slice(0, 19)).tz(timezone, true).hour() === dayjs(p?.start_time, 'h:mm A').hour())
                && (dayjs(e?.startDate?.slice(0, 19)).tz(timezone, true).minute() === dayjs(p?.start_time, 'h:mm A').minute())
            ))
            if (foundIndex > -1) {
                return false
            }

            return true
        })

        const eventsToUpsert: EventType[] = []

        if (isAllDay) {

            const notes = parsedText?.map((taskEvent) => (`${taskEvent?.start_time} - ${taskEvent?.end_time}: ${taskEvent?.task}`))
                ?.reduce((prev, curr) => (`${prev}\n ${curr}`), '')

            const title = `Schedule for ${dayjs(startDate).format('L')}`

            // create in google calendar
            const googleRes = await createGoogleEvent(
                userId,
                primaryCalendar?.id,
                calIntegration?.clientType,
                uuid(),
                !isAllDay && endDate,
                !isAllDay && startDate,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                title,
                notes,
                timezone,
                // 2020-04-02T08:02:17-05:00
                isAllDay && startDate?.slice(0, 10),
                isAllDay && endDate?.slice(0, 10),
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
            )

            const eventToUpsert: EventType = {
                id: googleRes?.id,
                userId,
                title,
                startDate,
                endDate,
                allDay: isAllDay,
                notes,
                timezone,
                createdDate: dayjs().format(),
                deleted: false,
                priority: 1,
                isFollowUp: false,
                isPreEvent: false,
                isPostEvent: false,
                modifiable: false,
                anyoneCanAddSelf: false,
                guestsCanInviteOthers: false,
                guestsCanSeeOtherGuests: true,
                originalStartDate: undefined,
                originalAllDay: undefined,
                summary: title,
                updatedAt: dayjs().format(),
                calendarId: primaryCalendar?.id,
                eventId: googleRes?.googleEventId,
            }

            eventsToUpsert.push(eventToUpsert)
        }

        if (isTwo) {
            // generate events for calendar

            const eventsToUpsertLocal: EventType[] = filteredParsedText?.map((localTask) => ({
                id: uuid(),
                userId,
                title: localTask?.task,
                startDate: dayjs(startDate?.slice(0, 19)).tz(timezone, true).hour(dayjs(localTask?.start_time, 'h:mm A').hour()).minute(dayjs(localTask?.start_time, 'h:mm A').minute()).format(),
                endDate: dayjs(startDate?.slice(0, 19)).tz(timezone, true).hour(dayjs(localTask?.end_time, 'h:mm A').hour()).minute(dayjs(localTask?.end_time, 'h:mm A').minute()).format(),
                allDay: false,
                notes: localTask?.task,
                timezone,
                createdDate: dayjs().format(),
                deleted: false,
                priority: 1,
                isFollowUp: false,
                isPreEvent: false,
                isPostEvent: false,
                modifiable: false,
                anyoneCanAddSelf: false,
                guestsCanInviteOthers: false,
                guestsCanSeeOtherGuests: true,
                originalStartDate: undefined,
                originalAllDay: undefined,
                summary: localTask?.task,
                updatedAt: dayjs().format(),
                calendarId: primaryCalendar?.id,
                eventId: undefined,
            }))

            const googleResValues: GoogleResType[] = []

            for (const eventToUpsertLocal of eventsToUpsertLocal) {
                
                const e = eventToUpsertLocal
                
                const googleResValue: GoogleResType = await getResource(
                    createGoogleEvent, 
                    undefined, 
                    undefined,
                    userId,
                    primaryCalendar?.id,
                    calIntegration?.clientType,
                    e?.id,
                    e?.endDate,
                    e?.startDate,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    e?.title,
                    e?.notes,
                    timezone,
                    // 2020-04-02T08:02:17-05:00
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
                    )
                
                googleResValues.push(googleResValue)
            }

            const eventsToUpsertFinalLocal: EventType[] = eventsToUpsertLocal?.map((e, inx) => ({
                ...e,
                id: googleResValues?.[inx]?.id,
                eventId: googleResValues?.[inx]?.googleEventId,
            }))

            eventsToUpsert.push(...eventsToUpsertFinalLocal)
        }

        if (!isAllDay) {
            // const title = `Schedule for ${dayjs(startDate).format('L')}`

            // generate events for calendar

            const eventsToUpsertLocal: EventType[] = filteredParsedText?.map((localTask) => ({
                id: uuid(),
                userId,
                title: localTask?.task,
                startDate: dayjs(startDate?.slice(0, 19)).tz(timezone).hour(dayjs(localTask?.start_time, 'h:mm A').hour()).minute(dayjs(localTask?.start_time, 'h:mm A').minute()).format(),
                endDate: dayjs(startDate?.slice(0, 19)).tz(timezone).hour(dayjs(localTask?.end_time, 'h:mm A').hour()).minute(dayjs(localTask?.end_time, 'h:mm A').minute()).format(),
                allDay: false,
                notes: localTask?.task,
                timezone,
                createdDate: dayjs().format(),
                deleted: false,
                priority: 1,
                isFollowUp: false,
                isPreEvent: false,
                isPostEvent: false,
                modifiable: false,
                anyoneCanAddSelf: false,
                guestsCanInviteOthers: false,
                guestsCanSeeOtherGuests: true,
                originalStartDate: undefined,
                originalAllDay: undefined,
                summary: localTask?.task,
                updatedAt: dayjs().format(),
                calendarId: primaryCalendar?.id,
                eventId: undefined,
            }))

            const googleResValues: GoogleResType[] = []

            for (const eventToUpsertLocal of eventsToUpsertLocal) {
                
                const e = eventToUpsertLocal
                
                const googleResValue: GoogleResType = await getResource(
                    createGoogleEvent, 
                    undefined, 
                    undefined,
                    userId,
                    primaryCalendar?.id,
                    calIntegration?.clientType,
                    e?.id,
                    e?.endDate,
                    e?.startDate,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    e?.title,
                    e?.notes,
                    timezone,
                    // 2020-04-02T08:02:17-05:00
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
                    )
                
                googleResValues.push(googleResValue)
            }

            const eventsToUpsertFinalLocal: EventType[] = eventsToUpsertLocal?.map((e, inx) => ({
                ...e,
                id: googleResValues?.[inx]?.id,
                eventId: googleResValues?.[inx]?.googleEventId,
            }))

            eventsToUpsert.push(...eventsToUpsertFinalLocal)
        }

        // upsert event
        await upsertEventsPostPlanner(eventsToUpsert)

        //emailDailySchedule
        if (email) {

            const notes = parsedText?.map((taskEvent) => (`${taskEvent?.start_time} - ${taskEvent?.end_time}: ${taskEvent?.task}`))
                ?.reduce((prev, curr) => (`${prev}\n ${curr}`), '')

            const title = `Schedule for ${dayjs(startDate).format('L')}`

            const body = `${title}\n ${notes}`

            await emailDailySchedule(
                email,
                name,
                body,
                startDate,
            )
        }
    } catch (e) {
        console.log(e, ' unable to create daily schedule')
    }
}


