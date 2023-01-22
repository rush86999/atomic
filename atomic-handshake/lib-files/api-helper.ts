import got from "got"
import { v4 as uuid } from 'uuid'
import { getISODay, setISODay } from 'date-fns'
import dayjs from 'dayjs'
// import isoWeek from 'dayjs/plugin/isoWeek'
import duration from 'dayjs/plugin/duration'
import isBetween from 'dayjs/plugin/isBetween'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import _ from "lodash"
import { authApiToken, hasuraAdminSecret, hasuraGraphUrl, meetingAssistAdminUrl } from "@lib/constants"
import { AvailableSlot, AvailableSlotsByDate, CalendarIntegrationType, CustomAvailableTimeType, EventType, MeetingAssistAttendeeType, MeetingAssistCalendarType, MeetingAssistEventType, MeetingAssistInviteType, MeetingAssistPreferredTimeRangeType, ScheduleAssistWithMeetingQueueBodyType, MeetingAssistType, NotAvailableSlot, Time, UserContactInfoType, UserPreferenceType, RecurrenceFrequencyType, UserType } from "@lib/types"
import { google } from 'googleapis'
import { RRule } from 'rrule'


// dayjs.extend(isoWeek)
dayjs.extend(duration)
dayjs.extend(isBetween)
dayjs.extend(timezone)
dayjs.extend(utc)
dayjs.extend(customParseFormat)
dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

export const getRruleFreq = (
    freq: RecurrenceFrequencyType
) => {
    switch (freq) {
        case 'daily':
            return RRule.DAILY
        case 'weekly':
            return RRule.WEEKLY
        case 'monthly':
            return RRule.MONTHLY
        case 'yearly':
            return RRule.YEARLY
    }
}

export const generateRecurringMeetingAssists = (
    originalMeetingAssist: MeetingAssistType,
) => {
    // validate
    if (!originalMeetingAssist?.frequency) {

        return
    }

    if (!originalMeetingAssist?.interval) {

        return
    }

    if (!originalMeetingAssist?.until) {

        return
    }



    const recurringMeetingAssists: MeetingAssistType[] = []

    const timeWindows = generateDatesForFutureMeetingAssistsUsingRrule(
        originalMeetingAssist?.windowStartDate,
        originalMeetingAssist?.windowEndDate,
        originalMeetingAssist?.frequency as RecurrenceFrequencyType,
        originalMeetingAssist?.interval,
        originalMeetingAssist?.until
    )



    for (let i = 0; i < timeWindows.length; i++) {

        if (i === 0) {
            continue
        }

        const meetingId = uuid()
        const newRecurringMeetingAssist: MeetingAssistType = {
            id: meetingId,
            userId: originalMeetingAssist?.userId,
            summary: originalMeetingAssist?.summary,
            notes: originalMeetingAssist?.notes,
            windowStartDate: timeWindows[i]?.windowStartDate,
            windowEndDate: timeWindows[i]?.windowEndDate,
            timezone: originalMeetingAssist?.timezone,
            location: originalMeetingAssist?.location,
            priority: 1,
            enableConference: originalMeetingAssist?.enableConference,
            conferenceApp: originalMeetingAssist?.conferenceApp,
            sendUpdates: originalMeetingAssist?.sendUpdates,
            guestsCanInviteOthers: originalMeetingAssist?.guestsCanInviteOthers,
            transparency: originalMeetingAssist?.transparency,
            visibility: originalMeetingAssist?.visibility,
            createdDate: dayjs().format(),
            updatedAt: dayjs().format(),
            colorId: originalMeetingAssist?.colorId,
            backgroundColor: originalMeetingAssist?.backgroundColor,
            foregroundColor: originalMeetingAssist?.foregroundColor,
            useDefaultAlarms: originalMeetingAssist?.useDefaultAlarms,
            reminders: originalMeetingAssist?.reminders,
            cancelIfAnyRefuse: originalMeetingAssist?.cancelIfAnyRefuse,
            enableHostPreferences: originalMeetingAssist?.enableHostPreferences,
            enableAttendeePreferences: originalMeetingAssist?.enableAttendeePreferences,
            attendeeCanModify: originalMeetingAssist?.attendeeCanModify,
            expireDate: originalMeetingAssist?.expireDate,
            cancelled: originalMeetingAssist?.cancelled,
            duration: originalMeetingAssist?.duration,
            calendarId: originalMeetingAssist?.calendarId,
            bufferTime: originalMeetingAssist?.bufferTime,
            anyoneCanAddSelf: originalMeetingAssist?.anyoneCanAddSelf,
            guestsCanSeeOtherGuests: originalMeetingAssist?.guestsCanSeeOtherGuests,
            minThresholdCount: originalMeetingAssist?.minThresholdCount,
            guaranteeAvailability: originalMeetingAssist?.guaranteeAvailability,
            frequency: originalMeetingAssist?.frequency,
            interval: originalMeetingAssist?.interval,
            until: originalMeetingAssist?.until,
            originalMeetingId: originalMeetingAssist?.id,
            attendeeRespondedCount: originalMeetingAssist?.attendeeRespondedCount,
            attendeeCount: originalMeetingAssist?.attendeeCount,
        }

        recurringMeetingAssists.push(newRecurringMeetingAssist)
    }

    recurringMeetingAssists?.forEach(a => 
    return recurringMeetingAssists
    }

export const generateDatesForFutureMeetingAssistsUsingRrule = (
        windowStartDate: string,
        windowEndDate: string,
        frequency: RecurrenceFrequencyType,
        interval: number,
        until: string,
    ) => {
        const ruleStartDate = new RRule({
            dtstart: dayjs(windowStartDate).utc().toDate(),
            freq: getRruleFreq(frequency),
            interval,
            until: dayjs(until).utc().toDate(),
        })



        const windowStartDatesForRecurrence = ruleStartDate.all()?.map(
            d => dayjs.utc(d).format()
        )

        windowStartDatesForRecurrence?.forEach(e => 

    const ruleEndDate = new RRule({
            dtstart: dayjs(windowEndDate).utc().toDate(),
            freq: getRruleFreq(frequency),
            interval,
            until: dayjs(until).utc().toDate(),
        })



            const windowEndDatesForRecurrence = ruleEndDate.all()?.map(
                d => dayjs.utc(d).format()
            )

            windowEndDatesForRecurrence?.forEach(e =>

    // reformat into windowStartDates and windowEndDates
    const timeWindows = windowStartDatesForRecurrence?.slice(0, windowEndDatesForRecurrence?.length)?.map((windowStartDate, inx) => {
                return {
                    windowStartDate,
                    windowEndDate: windowEndDatesForRecurrence?.[inx],
                }
            })

                return timeWindows
            }


export const getUserPreferences = async (userId: string): Promise<UserPreferenceType | null> => {
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

                    return null
                }
            }

            export const getUserGivenId = async (
                userId: string,
            ) => {
                try {
                    const operationName = 'GetUserById'
                    const query = `
            query GetUserById($id: uuid!) {
                User_by_pk(id: $id) {
                    createdDate
                    deleted
                    email
                    id
                    name
                    updatedAt
                    userPreferenceId
                }
            }
        `

                    const variables = {
                        id: userId,
                    }

                    const res: { data: { User_by_pk: UserType } } = await got.post(
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



                    return res?.data?.User_by_pk
                } catch (e) {

                }
            }

            export const insertMeetingAssists = async (
                meetingAssists: MeetingAssistType[],
            ) => {
                try {

                    const operationName = 'InsertMeetingAssist'
                    const query = `
            mutation InsertMeetingAssist($meetingAssists: [Meeting_Assist_insert_input!]!) {
                insert_Meeting_Assist(objects: $meetingAssists) {
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
                        meetingAssists,
                    }

                    const res: { data: { insert_Meeting_Assist: { affected_rows: number, returning: MeetingAssistType[] } } } = await got.post(
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



                    return res?.data?.insert_Meeting_Assist?.affected_rows
                } catch (e) {

                }
            }

            export const upsertMeetingAssistCalendars = async (
                calendarList: MeetingAssistCalendarType[]
            ) => {
                try {
                    const operationName = 'UpsertMeetingAssistCalendarList'
                    const query = `
            mutation UpsertMeetingAssistCalendarList($calendarList: [Meeting_Assist_Calendar_insert_input!]!) {
                insert_Meeting_Assist_Calendar(objects: $calendarList, on_conflict: {
                    constraint: Meeting_Assist_Calendar_pkey, 
                    update_columns: [
                        accessLevel,
                    account,
                    attendeeId,
                    backgroundColor,
                    colorId,
                    defaultReminders,
                    foregroundColor,
                    modifiable,
                    primary,
                    resource,
                    title,
                    ]}) {
                    affected_rows
                    returning {
                        accessLevel
                        account
                        attendeeId
                        backgroundColor
                        colorId
                        defaultReminders
                        foregroundColor
                        id
                        modifiable
                        primary
                        resource
                        title
                    }
                }
            }
        `

                    const variables = {
                        calendarList
                    }

                    const res: { data: { insert_Meeting_Assist_Calendar: { affected_rows: number, returning: MeetingAssistCalendarType[] } } } = await got.post(
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

            export const upsertMeetingAssistEvents = async (
                events: MeetingAssistEventType[],
            ) => {
                try {
                    const operationName = 'upsertMeetingAssistEvents'
                    const query = `
            mutation upsertMeetingAssistEvents($events: [Meeting_Assist_Event_insert_input!]!) {
                insert_Meeting_Assist_Event(objects: $events, on_conflict: {
                    constraint: Meeting_Assist_Event_pkey, 
                    update_columns: [
                        allDay,
                        attachments,
                        attendeeId,
                        attendeesOmitted,
                        backgroundColor,
                        calendarId,
                        colorId,
                        createdDate,
                        creator,
                        endDate,
                        endTimeUnspecified,
                        eventType,
                        extendedProperties,
                        externalUser,
                        foregroundColor,
                        guestsCanModify,
                        hangoutLink,
                        htmlLink,
                        iCalUID,
                        links,
                        location,
                        locked,
                        meetingId,
                        notes,
                        organizer,
                        privateCopy,
                        recurrence,
                        recurrenceRule,
                        recurringEventId,
                        source,
                        startDate,
                        summary,
                        timezone,
                        transparency,
                        updatedAt,
                        useDefaultAlarms,
                        visibility,
                        eventId,
                    ]}) {
                    affected_rows
                    returning {
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
                    eventId
                    }
                }
            }
        `

                    const variables = {
                        events
                    }

                    const res: any = await got.post(
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



                    res?.errors?.forEach((e: any) => 
    } catch (e) {

                }
            }

            export const googleCalendarSync = async (
                token: string, // access_token returned by Google Auth
                windowStartDate: string,
                windowEndDate: string,
                attendeeId: string,
                hostTimezone: string,
            ) => {
                try {
                    const googleCalendar = google.calendar({
                        version: 'v3',
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    })

                    const calendarListRes = await googleCalendar.calendarList.list()

                    const calendarList = calendarListRes?.data?.items

                    if ((calendarList && !(calendarList?.length > 0)) || !calendarList) {

                        throw new Error('no calendars were found from google calendar')
                    }

                    const calendarListModified: any = calendarList.map(c => ({
                        id: c.id || c?.summary,
                        attendeeId,
                        title: c?.summary,
                        backgroundColor: c?.backgroundColor,
                        accessLevel: c?.accessRole,
                        modifiable: true,
                        defaultReminders: c?.defaultReminders,
                        primary: c?.primary,
                        colorId: c?.colorId,
                        foregroundColor: c?.foregroundColor,
                    }))

                    // validate
                    if (!calendarListModified) {
                        throw new Error('no calendarListModified')
                    }

                    await upsertMeetingAssistCalendars(calendarListModified)

                    const timeMin = dayjs(windowStartDate.slice(0, 19)).format()
                    const timeMax = dayjs(windowEndDate.slice(0, 19)).format()

                    const calendarListAsMeetingAssistCalendar = calendarListModified as MeetingAssistCalendarType[]

                    for (let i = 0; i < calendarListAsMeetingAssistCalendar?.length; i++) {
                        const initialVariables = {
                            calendarId: calendarListAsMeetingAssistCalendar?.[i]?.id,
                            showDeleted: false,
                            singleEvents: true,
                            timeMin,
                            timeMax,
                            timeZone: hostTimezone,
                        }

                        const res = await googleCalendar.events.list(initialVariables)

                        const events = res?.data?.items

                        if (!events || !(events?.length > 0)) {
                            return null
                        }

                        // format events for insert
                        // filter events without id or timezone
                        const formattedEvents: any[] = events
                            ?.filter(e => !!e?.id)
                            ?.filter(e => (!!e?.start?.timeZone || !!e?.end?.timeZone))
                            ?.map(event => {
                                return {
                                    id: `${event?.id}#${calendarListAsMeetingAssistCalendar?.[i]?.id}`, //
                                    attendeeId, //
                                    htmlLink: event?.htmlLink, //
                                    createdDate: event?.created, //
                                    updatedAt: event?.updated, //
                                    summary: event?.summary, //
                                    notes: event?.description, // 
                                    location: {
                                        title: event?.location,
                                    }, // 
                                    colorId: event?.colorId, //
                                    creator: event?.creator, //
                                    organizer: event?.organizer, //
                                    startDate: event?.start?.dateTime || dayjs(event?.start?.date).tz(event?.start?.timeZone || dayjs.tz.guess(), true).format(), //
                                    endDate: event?.end?.dateTime || dayjs(event?.end?.date).tz(event?.end?.timeZone || dayjs.tz.guess(), true).format(), //
                                    allDay: event?.start?.date ? true : false, //
                                    timezone: event?.start?.timeZone || event?.end?.timeZone, //
                                    endTimeUnspecified: event?.endTimeUnspecified, //
                                    recurrence: event?.recurrence, //
                                    transparency: event?.transparency, //
                                    visibility: event?.visibility, //
                                    iCalUID: event?.iCalUID, //
                                    attendeesOmitted: event?.attendeesOmitted, //
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
                                        : null, //
                                    hangoutLink: event?.hangoutLink, //
                                    anyoneCanAddSelf: event?.anyoneCanAddSelf,
                                    guestsCanInviteOthers: event?.guestsCanInviteOthers,
                                    guestsCanModify: event?.guestsCanModify, //
                                    guestsCanSeeOtherGuests: event?.guestsCanSeeOtherGuests,
                                    source: event?.source, //
                                    attachments: event?.attachments, //
                                    eventType: event?.eventType, //
                                    privateCopy: event?.privateCopy, //
                                    locked: event?.locked, //
                                    calendarId: calendarListAsMeetingAssistCalendar?.[i]?.id, //
                                    useDefaultAlarms: event?.reminders?.useDefault, //
                                    externalUser: true, //
                                    eventId: event?.id,
                                }
                            })

                        if (!(formattedEvents?.length > 0)) {
                            continue
                        }
                        await upsertMeetingAssistEvents(formattedEvents)
                    }



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
                    until
                    originalMeetingId
                    interval
                    frequency
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
                    timezone
                    updatedAt
                    userId
                    primaryEmail
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
                Meeting_Assist_Event(where: {attendeeId: {_eq: $attendeeId}, startDate: {_lte: $endDate}, endDate: {_gte: $startDate}}) {
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
            export const updateMeetingAssistAttendee = async (attendee: MeetingAssistAttendeeType) => {
                try {
                    const operationName = 'UpdateMeetingAssistAttendeeById'
                    const query = `mutation UpdateMeetingAssistAttendeeById($id: String!${attendee?.emails?.[0]?.value ? ', $emails: jsonb' : ''}${attendee?.hostId ? ', $hostId: uuid!' : null}${attendee?.imAddresses?.[0]?.username ? ', $imAddresses: jsonb' : ''}${attendee?.meetingId ? ', $meetingId: uuid!' : ''}${attendee?.name ? ', $name: String' : ''}${attendee?.phoneNumbers?.[0]?.value ? ', $phoneNumbers: jsonb' : ''}${attendee?.timezone ? ', $timezone: String' : ''}${attendee?.userId ? ', $userId: uuid!' : ''}${attendee?.externalAttendee !== undefined ? ', $externalAttendee: Boolean}' : ''}}) {
            update_Meeting_Assist_Attendee_by_pk(pk_columns: {id: $id}, _set: {${attendee?.emails?.[0]?.value ? 'emails: $emails' : ''}${attendee?.externalAttendee ? ', externalAttendee: true' : ''}${attendee?.hostId ? ', hostId: $hostId' : ''}${attendee?.imAddresses?.[0]?.username ? ', imAddresses: $imAddresses' : ''}${attendee?.meetingId ? ', meetingId: $meetingId' : ''}${attendee?.name ? ', name: $name' : ''}${attendee?.phoneNumbers?.[0]?.value ? ', phoneNumbers: $phoneNumbers' : ''}${attendee?.timezone ? ', timezone: $timezone' : ''}${attendee?.userId ? ', userId: $userId' : ''}}) {
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
                timezone
                updatedAt
                userId
            }
        }
        `

                    let values: any = {
                        id: attendee?.id,
                    }

                    if (attendee?.name) {
                        values.name = attendee?.name
                    }

                    if (attendee?.hostId) {
                        values.hostId = attendee?.hostId
                    }

                    if (attendee?.userId) {
                        values.userId = attendee?.userId
                    }

                    if (attendee?.emails?.[0]?.value) {
                        values.emails = attendee?.emails
                    }

                    if (attendee?.phoneNumbers?.[0]?.value) {
                        values.phoneNumbers = attendee?.phoneNumbers
                    }

                    if (attendee?.imAddresses?.[0]?.username) {
                        values.imAddresses = attendee?.imAddresses
                    }

                    if (attendee?.meetingId) {
                        values.meetingId = attendee?.meetingId
                    }

                    if (attendee?.timezone) {
                        values.timezone = attendee?.timezone
                    }

                    const variables = values

                    const res: { data: { update_Meeting_Assist_Attendee_by_pk: MeetingAssistAttendeeType } } = await got.post(
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

            export const generatePreferredTimesForRecurringMeetingAssist = (
                originalPreferredTimes: MeetingAssistPreferredTimeRangeType[],
                recurringMeetingAssist: MeetingAssistType,
                recurringAttendee: MeetingAssistAttendeeType,
            ) => {


                const recurringPreferredTimes: MeetingAssistPreferredTimeRangeType[] = []

                for (const preferredTime of originalPreferredTimes) {
                    const recurringPreferredTime: MeetingAssistPreferredTimeRangeType = {
                        id: uuid(),
                        meetingId: recurringMeetingAssist?.id,
                        startTime: preferredTime?.startTime,
                        endTime: preferredTime?.endTime,
                        updatedAt: dayjs().format(),
                        createdDate: dayjs().format(),
                        hostId: recurringMeetingAssist?.userId,
                        attendeeId: recurringAttendee?.id,
                    }

                    if (preferredTime?.dayOfWeek && (preferredTime?.dayOfWeek > 0)) {
                        recurringPreferredTime.dayOfWeek = preferredTime.dayOfWeek
                    }

                    recurringPreferredTimes.push(recurringPreferredTime)
                }

                return recurringPreferredTimes
            }

            export const generateAttendeesAndPreferredTimesForRecurringMeetingAssist = (
                originalAttendees: MeetingAssistAttendeeType[],
                recurringMeetingAssist: MeetingAssistType,
                originalPreferredTimes?: MeetingAssistPreferredTimeRangeType[],
            ) => {

                const recurringAttendees: MeetingAssistAttendeeType[] = []

                const recurringPreferredTimes: MeetingAssistPreferredTimeRangeType[] = []

                for (const originalAttendee of originalAttendees) {

                    const recurringAttendee: MeetingAssistAttendeeType = {
                        id: uuid(),
                        name: originalAttendee?.name,
                        hostId: originalAttendee?.hostId,
                        userId: originalAttendee?.userId,
                        emails: originalAttendee?.emails,
                        contactId: originalAttendee?.contactId,
                        phoneNumbers: originalAttendee?.phoneNumbers,
                        imAddresses: originalAttendee?.imAddresses,
                        meetingId: recurringMeetingAssist?.id,
                        createdDate: dayjs().format(),
                        updatedAt: dayjs().format(),
                        timezone: recurringMeetingAssist?.timezone,
                        externalAttendee: originalAttendee?.externalAttendee,
                        primaryEmail: originalAttendee?.primaryEmail,

                    }

                    const attendeeIndex = originalPreferredTimes?.findIndex(o => (o?.attendeeId === originalAttendee?.id))




                    if (originalPreferredTimes && (originalPreferredTimes?.length > 0) && (typeof attendeeIndex === 'number') && (attendeeIndex > -1)) {
                        const recurringPreferredTimesForAttendee = generatePreferredTimesForRecurringMeetingAssist(
                            originalPreferredTimes?.filter(o => (o?.attendeeId === originalAttendee?.id)),
                            recurringMeetingAssist,
                            recurringAttendee,
                        )

                        recurringPreferredTimes.push(...recurringPreferredTimesForAttendee)
                    }



                    recurringAttendees.push(recurringAttendee)
                }




                return { recurringAttendees, recurringPreferredTimes }
            }


            export const generateAttendeesAndPreferredTimesForRecurringMeetingAssists = (
                originalAttendees: MeetingAssistAttendeeType[],
                recurringMeetingAssists: MeetingAssistType[],
                originalPreferredTimes?: MeetingAssistPreferredTimeRangeType[],
            ) => {
                const recurringAttendees: MeetingAssistAttendeeType[] = []
                const recurringPreferredTimes: MeetingAssistPreferredTimeRangeType[] = []



                for (const recurringMeetingAssist of recurringMeetingAssists) {
                    const newRecurringAttendeesAndPreferredTimes = generateAttendeesAndPreferredTimesForRecurringMeetingAssist(
                        originalAttendees,
                        recurringMeetingAssist,
                        originalPreferredTimes
                    )

                    recurringAttendees.push(...(newRecurringAttendeesAndPreferredTimes?.recurringAttendees))
                    if (newRecurringAttendeesAndPreferredTimes?.recurringPreferredTimes?.length > 0) {
                        recurringPreferredTimes.push(...(newRecurringAttendeesAndPreferredTimes?.recurringPreferredTimes))
                    }
                }




                return { recurringAttendees, recurringPreferredTimes }
            }

            export const insertMeetingAssistAttendees = async (
                attendees: MeetingAssistAttendeeType[]
            ) => {
                try {

                    const operationName = 'InsertMeetingAssistAttendees'
                    const query = `
            mutation InsertMeetingAssistAttendees($attendees: [Meeting_Assist_Attendee_insert_input!]!) {
                insert_Meeting_Assist_Attendee(objects: $attendees) {
                    affected_rows
                    returning {
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
            }
        `

                    const variables = {
                        attendees,
                    }

                    const res: { data: { insert_Meeting_Assist_Attendee: { affected_rows: number, returning: MeetingAssistAttendeeType[] } } } = await got.post(
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


                    return res?.data?.insert_Meeting_Assist_Attendee?.affected_rows
                } catch (e) {

                }
            }

            export const upsertOneMeetingAssistAttendee = async (attendee: MeetingAssistAttendeeType) => {
                try {
                    const operationName = 'InsertMeetingAssistAttendee'
                    const query = `
            mutation InsertMeetingAssistAttendee($attendee: Meeting_Assist_Attendee_insert_input!) {
                insert_Meeting_Assist_Attendee_one(object: $attendee, 
                    on_conflict: {
                    constraint: Meeting_Assist_Attendee_pkey, 
                    update_columns: [
                        contactId,
                        emails,
                        externalAttendee,
                        imAddresses,
                        name,
                        phoneNumbers,
                        primaryEmail,
                        timezone,
                        updatedAt,
                        userId,
                ]}) {
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
                        attendee,
                    }

                    const res: { data: { insert_Meeting_Assist_Attendee_one: MeetingAssistAttendeeType } } = await got.post(
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


                    return res?.data?.insert_Meeting_Assist_Attendee_one
                } catch (e) {

                }
            }

            export const deleteMeetingAssistAttendee = async (id: string) => {
                try {
                    const operationName = 'DeletMeetingAssistAttendee'
                    const query = `
            mutation DeletMeetingAssistAttendee($id: String!) {
                delete_Meeting_Assist_Attendee_by_pk(id: $id) {
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
                        id,
                    }

                    const res: { data: { delete_Meeting_Assist_Attendee_by_pk: MeetingAssistAttendeeType } } = await got.post(
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



                    return res?.data?.delete_Meeting_Assist_Attendee_by_pk

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
                    timezone
                    updatedAt
                    userId
                    externalAttendee
                    primaryEmail
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

            export const getMeetingAssistAttendeeByEmail = async (primaryEmail: string, meetingId: string) => {
                try {
                    const operationName = 'ListMeetingAssistAttendeeByEmail'
                    const query = `
            query ListMeetingAssistAttendeeByEmail($meetingId: uuid!, $primaryEmail: String) {
                Meeting_Assist_Attendee(where: {meetingId: {_eq: $meetingId}, primaryEmail: {_eq: $primaryEmail}}, limit: 1) {
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
                        primaryEmail,
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



                    return res?.data?.Meeting_Assist_Attendee?.[0]
                } catch (e) {

                }
            }

            export const updateMeetingAssistAttendanceCount = async (id: string, attendeeCount: number, attendeeRespondedCount: number) => {
                try {
                    const operationName = 'UpdateMeetingAssistCount'
                    const query = `
        mutation UpdateMeetingAssistCount($id: uuid!, $attendeeCount: Int!, $attendeeRespondedCount: Int!) {
            update_Meeting_Assist_by_pk(pk_columns: {id: $id}, _set: {attendeeCount: $attendeeCount, attendeeRespondedCount: $attendeeRespondedCount}) {
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
              guestsCanInviteOthers
              id
              guestsCanSeeOtherGuests
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
                        attendeeCount,
                        attendeeRespondedCount,
                    }

                    const res: { data: { update_Meeting_Assist_by_pk: MeetingAssistType } } = await got.post(
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



                    return res?.data?.update_Meeting_Assist_by_pk
                } catch (e) {

                }
            }

            export const getUserContactInfo = async (id: string) => {
                try {
                    const operationName = 'GetUserContactInfo'
                    const query = `
            query GetUserContactInfo($id: String!) {
                User_Contact_Info_by_pk(id: $id) {
                    createdDate
                    id
                    name
                    primary
                    type
                    updatedAt
                    userId
                }
            }
        `

                    const variables = {
                        id,
                    }

                    const res: { data: { User_Contact_Info_by_pk: UserContactInfoType } } = await got.post(
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



                    return res?.data?.User_Contact_Info_by_pk
                } catch (e) {

                }
            }

            export const listEventsForUserGivenDates = async (
                userId: string,
                hostStartDate: string,
                hostEndDate: string,
                userTimezone: string,
                hostTimezone: string,
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
                    const startDateInHostTimezone = dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true)
                    const endDateInHostTimezone = dayjs((hostEndDate.slice(0, 19))).tz(hostTimezone, true)
                    const startDateInUserTimezone = dayjs(startDateInHostTimezone).tz(userTimezone).format().slice(0, 19)
                    const endDateInUserTimezone = dayjs(endDateInHostTimezone).tz(userTimezone).format().slice(0, 19)


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
                                    startDate: startDateInUserTimezone,
                                    endDate: endDateInUserTimezone,
                                },
                            },
                        },
                    ).json()


                    return res?.data?.Event
                } catch (e) {

                }
            }

            export const findEventsForUserGivenMeetingId = async (
                userId: string,
                hostStartDate: string,
                hostEndDate: string,
                userTimezone: string,
                hostTimezone: string,
                meetingId: string,
            ) => {
                try {
                    const operationName = 'findEventsForUserGivenMeetingId'
                    const query = `
            query findEventsForUserGivenMeetingId($userId: uuid!, $startDate: timestamp!, $endDate: timestamp!, $meetingId: String!) {
                Event(where: {userId: {_eq: $userId}, startDate: {_lte: $endDate}, endDate: {_gte: $startDate}, deleted: {_neq: true}, allDay: {_neq: true}, meetingId: {_eq: $meetingId}}, limit: 1) {
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
                    const startDateInHostTimezone = dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true)
                    const endDateInHostTimezone = dayjs((hostEndDate.slice(0, 19))).tz(hostTimezone, true)
                    const startDateInUserTimezone = dayjs(startDateInHostTimezone).tz(userTimezone).format().slice(0, 19)
                    const endDateInUserTimezone = dayjs(endDateInHostTimezone).tz(userTimezone).format().slice(0, 19)


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
                                    startDate: startDateInUserTimezone,
                                    endDate: endDateInUserTimezone,
                                    meetingId,
                                },
                            },
                        },
                    ).json()


                    return res?.data?.Event
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

            export const generateAvailableSlotsforTimeWindow = (
                windowStartDate: string,
                windowEndDate: string,
                slotDuration: number,
                hostPreferences: UserPreferenceType,
                hostTimezone: string,
                userTimezone: string,
                notAvailableSlotsInUserTimezone?: NotAvailableSlot[],
            ) => {
                const diffDays = dayjs(windowEndDate).diff(dayjs(windowStartDate), 'd')

                const startDatesForEachDay = []
                const availableSlots: AvailableSlot[] = []
                const availableSlotsByDate: AvailableSlotsByDate = {}
                for (let i = 0; i <= diffDays; i++) {
                    startDatesForEachDay.push(dayjs(windowStartDate.slice(0, 19)).tz(hostTimezone, true).add(i, 'day').format())
                }
                if (diffDays < 1) {
                    const generatedSlots = generateAvailableSlotsForDate(
                        slotDuration,
                        dayjs(windowStartDate.slice(0, 19)).tz(hostTimezone, true).format(),
                        hostPreferences,
                        hostTimezone,
                        userTimezone,
                        notAvailableSlotsInUserTimezone,
                        true,
                        true,
                        dayjs(windowEndDate.slice(0, 19)).tz(hostTimezone, true).format(),
                    )
                    //  0123456789
                    //  2020-04-02T08:02:17-05:00
                    availableSlots.push(...generatedSlots)
                    availableSlotsByDate[`${windowStartDate?.slice(0, 10)}`] = generatedSlots
                } else {
                    for (let i = 0; i < startDatesForEachDay.length; i++) {

                        if (i === 0) {
                            const generatedSlots = generateAvailableSlotsForDate(
                                slotDuration,
                                startDatesForEachDay?.[i],
                                hostPreferences,
                                hostTimezone,
                                userTimezone,
                                notAvailableSlotsInUserTimezone,
                                true,
                                false,
                                dayjs(windowEndDate.slice(0, 19)).tz(hostTimezone, true).format(),
                            )
                            //  0123456789
                            //  2020-04-02T08:02:17-05:00
                            availableSlots.push(...generatedSlots)
                            availableSlotsByDate[`${startDatesForEachDay?.[i]?.slice(0, 10)}`] = generatedSlots
                            continue
                        }

                        if (i === (startDatesForEachDay.length - 1)) {
                            const generatedSlots = generateAvailableSlotsForDate(
                                slotDuration,
                                startDatesForEachDay?.[i],
                                hostPreferences,
                                hostTimezone,
                                userTimezone,
                                notAvailableSlotsInUserTimezone,
                                false,
                                true,
                                dayjs(windowEndDate.slice(0, 19)).tz(hostTimezone, true).format(),
                            )

                            availableSlots.push(...generatedSlots)
                            availableSlotsByDate[`${startDatesForEachDay?.[i]?.slice(0, 10)}`] = generatedSlots
                            continue
                        }

                        const generatedSlots = generateAvailableSlotsForDate(
                            slotDuration,
                            startDatesForEachDay?.[i],
                            hostPreferences,
                            hostTimezone,
                            userTimezone,
                            notAvailableSlotsInUserTimezone,
                        )

                        availableSlots.push(...generatedSlots)
                        availableSlotsByDate[`${startDatesForEachDay?.[i]?.slice(0, 10)}`] = generatedSlots
                    }
                }

                return { availableSlots, availableSlotsByDate }
            }

            /**
             * @params notAvailableSlotsInUserTimezone - events with transparency: 'opaque' as not available 
             */
            export const generateAvailableSlotsForDate = (
                slotDuration: number,
                userStartDate: string,
                hostPreferences: UserPreferenceType,
                hostTimezone: string,
                userTimezone: string,
                notAvailableSlotsInUserTimezone?: NotAvailableSlot[],
                isFirstDay?: boolean,
                isLastDay?: boolean,
                userEndDate?: string,
            ) => {

                if (isFirstDay && isLastDay && userEndDate) {

                    const endTimesByHost = hostPreferences.endTimes
                    const dayOfWeekIntByUser = getISODay(dayjs(userStartDate).toDate())

                    const dayOfMonthByUser = dayjs(userStartDate).date()
                    let startHourByUser = dayjs(userStartDate).hour()

                    const flooredValue = Math.floor(60 / slotDuration)

                    let minuteValueByUser = 0
                    if (dayjs(userStartDate).minute() !== 0) {
                        for (let i = 0; i < flooredValue; i++) {
                            const endMinutes = (i + 1) * slotDuration
                            const startMinutes = i * slotDuration
                            if (
                                dayjs(userStartDate)
                                    .isBetween(
                                        dayjs(userStartDate).minute(startMinutes),
                                        dayjs(userStartDate).minute(endMinutes),
                                        'minute', '[)')
                            ) {
                                minuteValueByUser = endMinutes
                            }
                        }
                    }


                    if (
                        dayjs(userStartDate)
                            .isBetween(
                                dayjs(userStartDate).minute((flooredValue * slotDuration)),
                                dayjs(userStartDate).minute(59),
                                'minute', '[)',
                            )
                    ) {
                        startHourByUser += 1
                        minuteValueByUser = 0
                    }

                    const startMinuteByUser = minuteValueByUser

                    const endHourByHost = endTimesByHost?.find(i => (i.day === dayOfWeekIntByUser))?.hour ?? 20
                    const endMinuteByHost = endTimesByHost?.find(i => (i.day === dayOfWeekIntByUser))?.minutes ?? 0
                    const endHourByUser = dayjs(userEndDate).hour()
                    const endMinuteByUser = dayjs(userEndDate).minute()


                    // validate values before calculating
                    const startTimes = hostPreferences.startTimes
                    const workStartHourByHost = startTimes?.find(i => (i.day === dayOfWeekIntByUser))?.hour || 8
                    const workStartMinuteByHost = startTimes?.find(i => (i.day === dayOfWeekIntByUser))?.minutes || 0
                    const workStartHourByUser = dayjs(userStartDate).tz(hostTimezone).hour(workStartHourByHost).tz(userTimezone).hour()
                    const workStartMinuteByUser = dayjs(userStartDate).tz(hostTimezone).minute(workStartMinuteByHost).tz(userTimezone).minute()

                    if (dayjs(userStartDate).isAfter(dayjs(userStartDate).tz(hostTimezone).hour(endHourByHost).minute(endMinuteByHost))) {
                        // return empty as outside of work time
                        return []
                    }

                    // change to work start time as after host start time
                    if (dayjs(userStartDate).isBefore(dayjs(userStartDate).tz(hostTimezone).hour(workStartHourByHost).minute(workStartMinuteByHost))) {
                        const startDuration = dayjs.duration({ hours: workStartHourByUser, minutes: workStartMinuteByUser })
                        const endDuration = dayjs.duration({ hours: endHourByUser, minutes: endMinuteByUser })
                        const totalDuration = endDuration.subtract(startDuration)
                        const totalMinutes = totalDuration.asMinutes()

                        const availableSlots: AvailableSlot[] = []

                        for (let i = 0; i < totalMinutes; i += slotDuration) {
                            if (i > totalMinutes) {
                                continue
                            }

                            availableSlots.push({
                                id: uuid(),
                                startDate: dayjs(userStartDate).hour(startHourByUser).minute(startMinuteByUser).add(i, 'minute').format(),
                                endDate: dayjs(userStartDate).hour(startHourByUser).minute(startMinuteByUser).add(i + slotDuration, 'minute').format(),
                            })
                        }


                        // filter out unavailable times
                        const filteredAvailableSlots = availableSlots.filter(a => {
                            const foundIndex = notAvailableSlotsInUserTimezone?.findIndex(na => {
                                const partA = (dayjs(a.endDate).isBetween(dayjs(na.startDate).add(1, 'm'), dayjs(na.endDate).subtract(1, 'm'), 'm', '[]'))

                                const partB = (dayjs(a.startDate).isBetween(dayjs(na.startDate).add(1, 'm'), dayjs(na.endDate).subtract(1, 'm'), 'm', '[]'))

                                const partC = ((dayjs(na.startDate).format() === dayjs(a.startDate).format()) && (dayjs(na.endDate).format() === dayjs(a.endDate).format()))

                                const isNotAvailable = partA || partB || partC


                                return isNotAvailable
                            })



                            if ((foundIndex !== undefined) && (foundIndex > -1)) {
                                return false
                            }

                            return true
                        })



                        return filteredAvailableSlots
                    }


                    const startDuration = dayjs.duration({ hours: startHourByUser, minutes: startMinuteByUser })
                    const endDuration = dayjs.duration({ hours: endHourByUser, minutes: endMinuteByUser })
                    const totalDuration = endDuration.subtract(startDuration)
                    const totalMinutes = totalDuration.asMinutes()
                    const availableSlots: AvailableSlot[] = []

                    for (let i = 0; i < totalMinutes; i += slotDuration) {
                        if (i > slotDuration) {
                            continue
                        }
                        availableSlots.push({
                            id: uuid(),
                            startDate: dayjs(userStartDate).hour(startHourByUser).minute(startMinuteByUser).add(i, 'minute').format(),
                            endDate: dayjs(userStartDate).hour(startHourByUser).minute(startMinuteByUser).add(i + slotDuration, 'minute').format(),
                        })
                    }
                    const filteredAvailableSlots = availableSlots.filter(a => {
                        const foundIndex = notAvailableSlotsInUserTimezone?.findIndex(na => {
                            const partA = (dayjs(a.endDate).isBetween(dayjs(na.startDate).add(1, 'm'), dayjs(na.endDate).subtract(1, 'm'), 'm', '[]'))

                            const partB = (dayjs(a.startDate).isBetween(dayjs(na.startDate).add(1, 'm'), dayjs(na.endDate).subtract(1, 'm'), 'm', '[]'))

                            const partC = ((dayjs(na.startDate).format() === dayjs(a.startDate).format()) && (dayjs(na.endDate).format() === dayjs(a.endDate).format()))

                            const isNotAvailable = partA || partB || partC



                            return isNotAvailable
                        })



                        if ((foundIndex !== undefined) && (foundIndex > -1)) {
                            return false
                        }

                        return true
                    })


                    return filteredAvailableSlots
                }

                if (isFirstDay) {
                    // firstday can be started outside of work time
                    // if firstDay start is after end time -- return []
                    const endTimesByHost = hostPreferences.endTimes
                    const dayOfWeekIntByUser = getISODay(dayjs(userStartDate).toDate())

                    // month is zero-indexed
                    // const month = dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).tz(userTimezone).month()
                    const dayOfMonthByUser = dayjs(userStartDate).date()
                    let startHourByUser = dayjs(userStartDate).hour()
                    // create slot sizes
                    const flooredValue = Math.floor(60 / slotDuration)

                    let minuteValueByUser = 0
                    if (dayjs(userStartDate).minute() !== 0) {
                        for (let i = 0; i < flooredValue; i++) {
                            const endMinutes = (i + 1) * slotDuration
                            const startMinutes = i * slotDuration
                            if (
                                dayjs(userStartDate)
                                    .isBetween(
                                        dayjs(userStartDate).minute(startMinutes),
                                        dayjs(userStartDate).minute(endMinutes),
                                        'minute', '[)')
                            ) {
                                minuteValueByUser = endMinutes
                            }
                        }
                    }

                    if (
                        dayjs(userStartDate)
                            .isBetween(
                                dayjs(userStartDate).minute((flooredValue * slotDuration)),
                                dayjs(userStartDate).minute(59),
                                'minute', '[)',
                            )
                    ) {
                        startHourByUser += 1
                        minuteValueByUser = 0
                    }

                    const startMinuteByUser = minuteValueByUser


                    // convert to user timezone so everything is linked to user timezone


                    const endHourByHost = endTimesByHost?.find(i => (i.day === dayOfWeekIntByUser))?.hour ?? 20
                    const endMinuteByHost = endTimesByHost?.find(i => (i.day === dayOfWeekIntByUser))?.minutes ?? 0
                    const endHourByUser = dayjs(userStartDate).tz(hostTimezone).hour(endHourByHost).tz(userTimezone).hour()
                    const endMinuteByUser = dayjs(userStartDate).tz(hostTimezone).minute(endMinuteByHost).tz(userTimezone).minute()


                    // validate values before calculating
                    const startTimes = hostPreferences.startTimes
                    const workStartHourByHost = startTimes?.find(i => (i.day === dayOfWeekIntByUser))?.hour || 8
                    const workStartMinuteByHost = startTimes?.find(i => (i.day === dayOfWeekIntByUser))?.minutes || 0
                    const workStartHourByUser = dayjs(userStartDate).tz(hostTimezone).hour(workStartHourByHost).tz(userTimezone).hour()
                    const workStartMinuteByUser = dayjs(userStartDate).tz(hostTimezone).minute(workStartMinuteByHost).tz(userTimezone).minute()


                    if (dayjs(userStartDate).isAfter(dayjs(userStartDate).tz(hostTimezone).hour(endHourByHost).minute(endMinuteByHost))) {
                        // return empty as outside of work time
                        return []
                    }

                    // change to work start time as after host start time
                    if (dayjs(userStartDate).isBefore(dayjs(userStartDate).tz(hostTimezone).hour(workStartHourByHost).minute(workStartMinuteByHost))) {
                        const startDuration = dayjs.duration({ hours: workStartHourByUser, minutes: workStartMinuteByUser })
                        const endDuration = dayjs.duration({ hours: endHourByUser, minutes: endMinuteByUser })
                        const totalDuration = endDuration.subtract(startDuration)
                        const totalMinutes = totalDuration.asMinutes()

                        const availableSlots: AvailableSlot[] = []

                        for (let i = 0; i < totalMinutes; i += slotDuration) {
                            if (i > totalMinutes) {
                                continue
                            }

                            availableSlots.push({
                                id: uuid(),
                                startDate: dayjs(userStartDate).hour(startHourByUser).minute(startMinuteByUser).add(i, 'minute').format(),
                                endDate: dayjs(userStartDate).hour(startHourByUser).minute(startMinuteByUser).add(i + slotDuration, 'minute').format(),
                            })
                        }


                        // filter out unavailable times
                        const filteredAvailableSlots = availableSlots.filter(a => {
                            const foundIndex = notAvailableSlotsInUserTimezone?.findIndex(na => {
                                const partA = (dayjs(a.endDate).isBetween(dayjs(na.startDate).add(1, 'm'), dayjs(na.endDate).subtract(1, 'm'), 'm', '[]'))

                                const partB = (dayjs(a.startDate).isBetween(dayjs(na.startDate).add(1, 'm'), dayjs(na.endDate).subtract(1, 'm'), 'm', '[]'))

                                const partC = ((dayjs(na.startDate).format() === dayjs(a.startDate).format()) && (dayjs(na.endDate).format() === dayjs(a.endDate).format()))

                                const isNotAvailable = partA || partB || partC


                                return isNotAvailable
                            })



                            if ((foundIndex !== undefined) && (foundIndex > -1)) {
                                return false
                            }

                            return true
                        })



                        return filteredAvailableSlots
                    }

                    const startDuration = dayjs.duration({ hours: startHourByUser, minutes: startMinuteByUser })
                    const endDuration = dayjs.duration({ hours: endHourByUser, minutes: endMinuteByUser })
                    const totalDuration = endDuration.subtract(startDuration)
                    const totalMinutes = totalDuration.asMinutes()
                    const availableSlots: AvailableSlot[] = []

                    for (let i = 0; i < totalMinutes; i += slotDuration) {
                        if (i > slotDuration) {
                            continue
                        }
                        availableSlots.push({
                            id: uuid(),
                            startDate: dayjs(userStartDate).hour(startHourByUser).minute(startMinuteByUser).add(i, 'minute').format(),
                            endDate: dayjs(userStartDate).hour(startHourByUser).minute(startMinuteByUser).add(i + slotDuration, 'minute').format(),
                        })
                    }
                    const filteredAvailableSlots = availableSlots.filter(a => {
                        const foundIndex = notAvailableSlotsInUserTimezone?.findIndex(na => {
                            const partA = (dayjs(a.endDate).isBetween(dayjs(na.startDate).add(1, 'm'), dayjs(na.endDate).subtract(1, 'm'), 'm', '[]'))

                            const partB = (dayjs(a.startDate).isBetween(dayjs(na.startDate).add(1, 'm'), dayjs(na.endDate).subtract(1, 'm'), 'm', '[]'))

                            const partC = ((dayjs(na.startDate).format() === dayjs(a.startDate).format()) && (dayjs(na.endDate).format() === dayjs(a.endDate).format()))

                            const isNotAvailable = partA || partB || partC



                            return isNotAvailable
                        })



                        if ((foundIndex !== undefined) && (foundIndex > -1)) {
                            return false
                        }

                        return true
                    })


                    return filteredAvailableSlots
                }

                // not first day start from work start time schedule

                const startTimesByHost = hostPreferences.startTimes

                const endTimesByHost = hostPreferences.endTimes

                const dayOfWeekIntByHost = getISODay(dayjs(userStartDate).tz(hostTimezone).toDate())
                const dayOfMonthByUser = dayjs(userStartDate).date()

                // convert to user timezone so everything is linked to user timezone
                const endHourByHost = (endTimesByHost?.find(i => (i.day === dayOfWeekIntByHost))?.hour) ?? 20
                const endMinuteByHost = endTimesByHost?.find(i => (i.day === dayOfWeekIntByHost))?.minutes ?? 0
                let endHourByUser = dayjs(userStartDate).tz(hostTimezone).hour(endHourByHost).minute(endMinuteByHost).tz(userTimezone).hour()
                let endMinuteByUser = dayjs(userStartDate).tz(hostTimezone).hour(endHourByHost).minute(endMinuteByHost).tz(userTimezone).minute()

                // if last day change end time to hostStartDate provided
                if (isLastDay && userEndDate) {
                    endHourByUser = dayjs(userEndDate).hour()
                    // create slot sizes
                    const flooredValue = Math.floor(60 / slotDuration)

                    let minuteValueByUser = 0
                    for (let i = 0; i < flooredValue; i++) {
                        const endMinutes = (i + 1) * slotDuration
                        const startMinutes = i * slotDuration
                        if (
                            dayjs(userEndDate)
                                .isBetween(
                                    dayjs(userEndDate).minute(startMinutes),
                                    dayjs(userEndDate).minute(endMinutes), 'minute', '[)')
                        ) {
                            minuteValueByUser = startMinutes
                        }
                    }

                    endMinuteByUser = minuteValueByUser
                }


                const startHourByHost = startTimesByHost?.find(i => (i.day === dayOfWeekIntByHost))?.hour as number
                const startMinuteByHost = startTimesByHost?.find(i => (i.day === dayOfWeekIntByHost))?.minutes as number
                const startHourByUser = dayjs(userStartDate).tz(hostTimezone).hour(startHourByHost).minute(startMinuteByHost).tz(userTimezone).hour()
                const startMinuteByUser = dayjs(userStartDate).tz(hostTimezone).hour(startHourByHost).minute(startMinuteByHost).tz(userTimezone).minute()

                const startDuration = dayjs.duration({ hours: startHourByUser, minutes: startMinuteByUser })
                const endDuration = dayjs.duration({ hours: endHourByUser, minutes: endMinuteByUser })
                const totalDuration = endDuration.subtract(startDuration)
                const totalMinutes = totalDuration.asMinutes()

                const availableSlots: AvailableSlot[] = []

                for (let i = 0; i < totalMinutes; i += slotDuration) {
                    if (i > totalMinutes) {
                        continue
                    }

                    availableSlots.push({
                        id: uuid(),
                        startDate: dayjs(userStartDate).tz(hostTimezone).hour(startHourByUser).minute(startMinuteByUser).add(i, 'minute').format(),
                        endDate: dayjs(userStartDate).tz(hostTimezone).hour(startHourByUser).minute(startMinuteByUser).add(i + slotDuration, 'minute').format(),
                    })
                }



                // filter out unavailable times
                const filteredAvailableSlots = availableSlots.filter(a => {
                    const foundIndex = notAvailableSlotsInUserTimezone?.findIndex(na => {
                        const partA = (dayjs(a.endDate).isBetween(dayjs(na.startDate).add(1, 'm'), dayjs(na.endDate).subtract(1, 'm'), 'm', '[]'))

                        const partB = (dayjs(a.startDate).isBetween(dayjs(na.startDate).add(1, 'm'), dayjs(na.endDate).subtract(1, 'm'), 'm', '[]'))

                        const partC = ((dayjs(na.startDate).format() === dayjs(a.startDate).format()) && (dayjs(na.endDate).format() === dayjs(a.endDate).format()))

                        const isNotAvailable = partA || partB || partC



                        return isNotAvailable
                    })



                    if ((foundIndex !== undefined) && (foundIndex > -1)) {
                        return false
                    }

                    return true
                })



                return filteredAvailableSlots

            }

            export const cancelMeetingAssist = async (
                id: string,
            ) => {
                try {
                    const operationName = 'CancelMeetingAssist'
                    const query = `
            mutation CancelMeetingAssist($id: uuid!) {
                update_Meeting_Assist_by_pk(pk_columns: {id: $id}, _set: {cancelled: true}) {
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
                }
            }
        `

                    const variables = {
                        id,
                    }

                    const res: { data: { update_Meeting_Assist_by_pk: MeetingAssistType } } = await got.post(
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



                    return res?.data?.update_Meeting_Assist_by_pk
                } catch (e) {

                }
            }


            export const deleteMeetingAssistPreferredTimesByIds = async (ids: string[]) => {
                try {
                    const operationName = 'deleteMeetingAssistPreferredTimesByIds'
                    const query = `
            mutation deleteMeetingAssistPreferredTimesByIds($ids: [uuid!]!) {
                delete_Meeting_Assist_Preferred_Time_Range(where: {id: {_in: $ids}}) {
                    affected_rows
                    returning {
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
            }
        `

                    const variables = {
                        ids,
                    }

                    const res: { data: { delete_Meeting_Assist_Preferred_Time_Range: { affected_rows: number, returning: MeetingAssistPreferredTimeRangeType[] } } } = await got.post(
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



                    return res?.data?.delete_Meeting_Assist_Preferred_Time_Range?.affected_rows

                } catch (e) {

                }
            }

            export const upsertMeetingAssistPreferredTimes = async (
                preferredTimes: MeetingAssistPreferredTimeRangeType[],
            ) => {
                try {

                    const operationName = 'insertMeetingAssistPreferredTimes'
                    const query = `
            mutation insertMeetingAssistPreferredTimes($preferredTimes: [Meeting_Assist_Preferred_Time_Range_insert_input!]!) {
                insert_Meeting_Assist_Preferred_Time_Range(objects: $preferredTimes, 
                    on_conflict: {
                    constraint: Meeting_Assist_Preferred_Time_Ranges_pkey, 
                    update_columns: [
                        attendeeId,
                        dayOfWeek,
                        endTime,
                        hostId,
                        meetingId,
                        startTime,
                        updatedAt,
                    ]
                    }) {
                    affected_rows
                    returning {
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
            }
        `

                    const variables = {
                        preferredTimes: preferredTimes?.map(pt => ({ ...pt, dayOfWeek: pt?.dayOfWeek === -1 ? null : pt?.dayOfWeek })),
                    }

                    const res: { data: { insert_Meeting_Assist_Preferred_Time_Range: { affected_rows: number, returning: MeetingAssistPreferredTimeRangeType[] } } } = await got.post(
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



                    return res?.data?.insert_Meeting_Assist_Preferred_Time_Range?.affected_rows

                } catch (e) {

                }
            }

            // encode base64
            export const BtoA = (str: string) => Buffer.from(str).toString('base64')
            // decode base64
            export const AtoB = (str: string) => Buffer.from(str, 'base64').toString()

            // admin auth call
            // 'Basic ' + BtoA(`admin:${authApiToken}`)

            export const startMeetingAssist = async (
                body: ScheduleAssistWithMeetingQueueBodyType,
            ) => {
                try {
                    const res = await got.post(
                        meetingAssistAdminUrl,
                        {
                            headers: {
                                'Authorization': 'Basic ' + BtoA(`admin:${authApiToken}`),
                                'Content-Type': 'application/json',
                            },
                            json: body,
                        },
                    )


                } catch (e) {

                }
            }

            export const getCustomAvailableTimes = (
                slotDuration: number,
                hostStartDate: string,
                hostPreferences: UserPreferenceType,
                hostTimezone: string,
                userTimezone: string,
                isFirstDay?: boolean,
                isLastDay?: boolean,
            ): CustomAvailableTimeType | null => {
                if (isFirstDay) {
                    const endTimesByHost = hostPreferences.endTimes
                    const dayOfWeekIntByUser = getISODay(dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).tz(userTimezone).toDate())

                    let startHourByUser = dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).tz(userTimezone).hour()

                    // const dayOfMonthByUser = dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).tz(userTimezone).date()

                    // create slot sizes
                    const flooredValue = Math.floor(60 / slotDuration)

                    let minuteValueByUser = 0
                    for (let i = 0; i < flooredValue; i++) {
                        const endMinutes = (i + 1) * slotDuration
                        const startMinutes = i * slotDuration
                        if (
                            dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).tz(userTimezone)
                                .isBetween(
                                    dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).tz(userTimezone).minute(startMinutes),
                                    dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).tz(userTimezone).minute(endMinutes), 'minute', '[)')
                        ) {
                            minuteValueByUser = endMinutes
                        }
                    }

                    if (
                        dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).tz(userTimezone)
                            .isBetween(
                                dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).tz(userTimezone).minute((flooredValue * slotDuration)),
                                dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).tz(userTimezone).minute(59), 'minute', '[)')
                    ) {
                        startHourByUser += 1
                        minuteValueByUser = 0
                    }

                    const startMinuteByUser = minuteValueByUser

                    const endHourByHost = (endTimesByHost?.find(i => (i.day === dayOfWeekIntByUser))?.hour) ?? 20
                    const endMinuteByHost = endTimesByHost?.find(i => (i.day === dayOfWeekIntByUser))?.minutes ?? 0
                    const endHourByUser = dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).hour(endHourByHost).tz(userTimezone).hour()
                    const endMinuteByUser = dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).minute(endMinuteByHost).tz(userTimezone).minute()

                    // validate values before calculating
                    const startTimes = hostPreferences.startTimes
                    const workStartHourByHost = startTimes?.find(i => (i.day === dayOfWeekIntByUser))?.hour || 8
                    const workStartMinuteByHost = startTimes?.find(i => (i.day === dayOfWeekIntByUser))?.minutes || 0
                    const workStartHourByUser = dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).hour(workStartHourByHost).tz(userTimezone).hour()
                    const workStartMinuteByUser = dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).minute(workStartMinuteByHost).tz(userTimezone).minute()

                    if (dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).isAfter(dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).hour(endHourByHost).minute(endMinuteByHost))) {
                        // return empty as outside of work time
                        return null
                    }

                    // change to work start time as after host start time
                    if (dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).isBefore(dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).hour(workStartHourByHost).minute(workStartMinuteByHost))) {
                        return {
                            startTime: dayjs(hostStartDate?.slice(0, 19)).tz(hostTimezone, true).tz(userTimezone).hour(workStartHourByUser).minute(workStartMinuteByUser).format('HH:mm') as Time,
                            endTime: dayjs(hostStartDate?.slice(0, 19)).tz(hostTimezone, true).tz(userTimezone).hour(endHourByUser).minute(endMinuteByUser).format('HH:mm') as Time,
                            dayOfWeekInt: dayOfWeekIntByUser,
                        }
                    }


                    return {
                        startTime: dayjs(hostStartDate?.slice(0, 19)).tz(hostTimezone, true).tz(userTimezone).hour(startHourByUser).minute(startMinuteByUser).format('HH:mm') as Time,
                        endTime: dayjs(hostStartDate?.slice(0, 19)).tz(hostTimezone, true).tz(userTimezone).hour(endHourByUser).minute(endMinuteByUser).format('HH:mm') as Time,
                        dayOfWeekInt: dayOfWeekIntByUser,
                    }
                }

                // not first day start from work start time schedule
                const startTimesByHost = hostPreferences.startTimes
                const endTimesByHost = hostPreferences.endTimes

                const dayOfWeekIntByHost = getISODay(dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).toDate())
                const dayOfWeekIntByUser = getISODay(dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).tz(userTimezone).toDate())


                const startHourByHost = startTimesByHost?.find(i => (i.day === dayOfWeekIntByHost))?.hour as number
                const startMinuteByHost = startTimesByHost?.find(i => (i.day === dayOfWeekIntByHost))?.minutes as number
                const startHourByUser = dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).hour(startHourByHost).minute(startMinuteByHost).tz(userTimezone).hour()
                const startMinuteByUser = dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).hour(startHourByHost).minute(startMinuteByHost).tz(userTimezone).minute()

                // convert to user timezone so everything is linked to user timezone
                const endHourByHost: number = (endTimesByHost?.find(i => (i.day === dayOfWeekIntByHost))?.hour) ?? 20
                const endMinuteByHost = endTimesByHost?.find(i => (i.day === dayOfWeekIntByHost))?.minutes ?? 0

                // if last day change end time to hostStartDate provided
                if (isLastDay) {
                    const endHourByUser = dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).tz(userTimezone).hour()
                    // create slot sizes
                    const flooredValue = Math.floor(60 / slotDuration)

                    let minuteValueByUser = 0

                    for (let i = 0; i < flooredValue; i++) {
                        const endMinutes = (i + 1) * slotDuration
                        const startMinutes = i * slotDuration
                        if (
                            dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).tz(userTimezone)
                                .isBetween(
                                    dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).tz(userTimezone).minute(startMinutes),
                                    dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).tz(userTimezone).minute(endMinutes), 'minute', '[)')
                        ) {
                            minuteValueByUser = startMinutes
                        }
                    }

                    const endMinuteByUser = minuteValueByUser
                    return {
                        startTime: dayjs(hostStartDate?.slice(0, 19)).tz(hostTimezone, true).tz(userTimezone).hour(startHourByUser).minute(startMinuteByUser).format('HH:mm') as Time,
                        endTime: dayjs(hostStartDate?.slice(0, 19)).tz(hostTimezone, true).tz(userTimezone).hour(endHourByUser).minute(endMinuteByUser).format('HH:mm') as Time,
                        dayOfWeekInt: dayOfWeekIntByUser,
                    }
                }

                const endHourByUser = dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).hour(endHourByHost).minute(endMinuteByHost).tz(userTimezone).hour()
                const endMinuteByUser = dayjs(hostStartDate.slice(0, 19)).tz(hostTimezone, true).hour(endHourByHost).minute(endMinuteByHost).tz(userTimezone).minute()

                return {
                    startTime: dayjs(hostStartDate?.slice(0, 19)).tz(hostTimezone, true).tz(userTimezone).hour(startHourByUser).minute(startMinuteByUser).format('HH:mm') as Time,
                    endTime: dayjs(hostStartDate?.slice(0, 19)).tz(hostTimezone, true).tz(userTimezone).hour(endHourByUser).minute(endMinuteByUser).format('HH:mm') as Time,
                    dayOfWeekInt: dayOfWeekIntByUser,
                }

            }


            export const getMeetingAssistInviteGivenId = async (
                id: string,
            ) => {
                try {
                    const operationName = 'GetMeetingAssistInviteByKey'
                    const query = `
            query GetMeetingAssistInviteByKey($id: uuid!) {
                Meeting_Assist_Invite_by_pk(id: $id) {
                    createdDate
                    email
                    hostId
                    hostName
                    id
                    meetingId
                    name
                    response
                    updatedAt
                    userId
                }
            }
        `

                    const variables = {
                        id,
                    }

                    const res: { data: { Meeting_Assist_Invite_by_pk: MeetingAssistInviteType } } = await got.post(
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



                    return res?.data?.Meeting_Assist_Invite_by_pk

                } catch (e) {

                }
            }

            export const listMeetingAssistInvitesGivenMeetingId = async (
                meetingId: string,
            ) => {
                try {
                    const operationName = 'listMeetingAssistInviteByMeetingId'
                    const query = `
            query listMeetingAssistInviteByMeetingId($meetingId: uuid!) {
                Meeting_Assist_Invite(where: {meetingId: {_eq: $meetingId}}) {
                    createdDate
                    email
                    hostId
                    hostName
                    id
                    meetingId
                    name
                    response
                    updatedAt
                    userId
                }
            }
        `

                    const variables = {
                        meetingId,
                    }

                    const res: { data: { Meeting_Assist_Invite: MeetingAssistInviteType[] } } = await got.post(
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



                    return res?.data?.Meeting_Assist_Invite

                } catch (e) {

                }
            }

            // attendeeId ==== inviteId
            export const updateMeetingAssistInviteResponse = async (
                id: string,
                response: string,
            ) => {
                try {
                    const operationName = 'updateMeetingAssistInviteResponse'
                    const query = `
            mutation updateMeetingAssistInviteResponse($id: String!, $response: String) {
                update_Meeting_Assist_Invite_by_pk(pk_columns: {id: $id}, _set: {response: $response}) {
                    createdDate
                    email
                    hostId
                    hostName
                    id
                    meetingId
                    name
                    response
                    updatedAt
                    userId
                }
            }
        `

                    const variables = {
                        id,
                        response,
                    }

                    const res: { data: { update_Meeting_Assist_Invite_by_pk: MeetingAssistInviteType } } = await got.post(
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



                    return res?.data?.update_Meeting_Assist_Invite_by_pk

                } catch (e) {

                }
            }


            export const createRecurringMeetingAssists = async (
                originalMeetingAssist: MeetingAssistType,
                originalPreferredTimes?: MeetingAssistPreferredTimeRangeType[],
            ) => {
                try {


                    const meetingAssistAttendees = await listMeetingAssistAttendeesGivenMeetingId(originalMeetingAssist?.id)



                    if (!(meetingAssistAttendees && (meetingAssistAttendees?.length > 0))) {

                        return
                    }

                    const recurringMeetingAssists = generateRecurringMeetingAssists(originalMeetingAssist)



                    if (!(recurringMeetingAssists && (recurringMeetingAssists?.length > 0))) {

                        return
                    }

                    await insertMeetingAssists(recurringMeetingAssists)

                    const recurringMeetingAssistAttendeesAndRecurringPreferredTimes = generateAttendeesAndPreferredTimesForRecurringMeetingAssists(meetingAssistAttendees, recurringMeetingAssists, originalPreferredTimes)




                    await insertMeetingAssistAttendees(recurringMeetingAssistAttendeesAndRecurringPreferredTimes.recurringAttendees)

                    if (recurringMeetingAssistAttendeesAndRecurringPreferredTimes?.recurringPreferredTimes?.length > 0) {
                        await upsertMeetingAssistPreferredTimes(recurringMeetingAssistAttendeesAndRecurringPreferredTimes?.recurringPreferredTimes)
                    }
                } catch (e) {

                }
            }

