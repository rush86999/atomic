import got from 'got';
import { hasuraAdminSecret, hasuraGraphUrl } from './constants';
import { MeetingAssistAttendeeType, MeetingAssistPreferredTimeRangeType, MeetingAssistType, RecurrenceFrequencyType } from './types';
import { v4 as uuid } from 'uuid'
import { RRule } from 'rrule'

import dayjs from 'dayjs';

import duration from 'dayjs/plugin/duration'
import isBetween from 'dayjs/plugin/isBetween'

import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

dayjs.extend(duration)
dayjs.extend(isBetween)
dayjs.extend(timezone)
dayjs.extend(utc)



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


