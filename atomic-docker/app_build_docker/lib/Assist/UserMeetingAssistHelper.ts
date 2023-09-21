import { ApolloClient, gql, NormalizedCacheObject } from "@apollo/client"
import insertMeetingAssistPreferredTimeRangesMutation from "@lib/apollo/gql/insertMeetingAssistPreferredTimeRangesMutation"
import { MeetingAssistInviteType } from "@lib/dataTypes/MeetingAssistInviteType"
import { MeetingAssistPreferredTimeRangeType } from "@lib/dataTypes/MeetingAssistPreferredTimeRangeType"
import { MeetingAssistType } from "@lib/dataTypes/MeetingAssistType"
import { RRule } from 'rrule'
import { dayjs } from '@lib/date-utils'

// lib/Calendar/UserCreateCalendarHelper.ts
import { getRRuleDay, getRruleFreq } from "@lib/Calendar/UserCreateCalendarHelper"
import { AttendeeDetailsForBulkMeetingCancelledType, AttendeeDetailsForBulkMeetingInviteType, AttendeeDetailsType, MeetingInviteDetailsToHostType } from "@lib/Assist/types"
import Session from "supertokens-web-js/recipe/session";
import { emailMeetingCancelUrl, emailMeetingInfoToHostUrl, emailMeetingInviteUrl, handshakeUrl } from "@lib/Assist/constants"
import axios from "axios"
import qs from 'qs'
import upsertMeetingAssistInvitesMutation from "@lib/apollo/gql/upsertMeetingAssistInvitesMutation"
import { MeetingAssistAttendeeType } from "@lib/dataTypes/MeetingAssistAttendeeType"
import insertAttendeeMutation from "@lib/apollo/gql/insertAttendeeMutation"
import getUserById from "@lib/apollo/gql/getUserById"
import { UserType } from "@lib/dataTypes/UserType"

import { SelectedContactType } from "@pages/Calendar/CreateEventWizard/CreateEventAttendees"
import { Person, RecurrenceFrequencyType } from "@lib/Calendar/types"
import { Dispatch, SetStateAction } from "react"
import { v4 as uuid } from 'uuid'
import _ from "lodash"
import { AttendeeEmailType } from '@lib/dataTypes/AttendeeType';
import updateUserForName from "@lib/apollo/gql/updateUserForName"
import listMeetingAssists from "@lib/apollo/gql/listMeetingAssists"
import deleteMeetingAssistById from "@lib/apollo/gql/deleteMeetingAssistById"
import listMeetingAssistInvites from "@lib/apollo/gql/listMeetingAssistInvites"
import insertMeetingAssistAttendeeOne from "@lib/apollo/gql/insertMeetingAssistAttendeeOne"
import getMeetingAssistById from "@lib/apollo/gql/getMeetingAssistById"
import searchMeetingAssistsQuery from "@lib/apollo/gql/searchMeetingAssistsQuery"



export const listMeetingAssistInvitesGivenMeetingId = async (
    client: ApolloClient<NormalizedCacheObject>,
    meetingId: string,
) => {
    try {
        const meetingAssistInvitesDoc = (await client.query<{ Meeting_Assist_Invite: MeetingAssistInviteType[] }>({
            query: listMeetingAssistInvites,
            variables: {
                meetingId,
            },
        }))?.data?.Meeting_Assist_Invite

        console.log(meetingAssistInvitesDoc, ' successfully listed meeting assist invites given meetingId')

        return meetingAssistInvitesDoc
    } catch (e) {
        console.log(e, ' unable to list meeting assist invites given meetingId')
    }
}

export const getMeetingAssistGivenId = async (
    client: ApolloClient<NormalizedCacheObject>,
    meetingId: string,
) => {
    try {
        const meetingAssistDoc = (await client.query<{ Meeting_Assist_by_pk: MeetingAssistType }>({
            query: getMeetingAssistById,
            variables: {
                id: meetingId,
            },
        }))?.data?.Meeting_Assist_by_pk

        console.log(meetingAssistDoc, ' successfully got meetingAssistDoc')
        return meetingAssistDoc
    } catch (e) {
        console.log(e, ' unable to get meeting assist given Id')
    }
}

export const listUserMeetingAssistsGivenUserId = async (
    client: ApolloClient<NormalizedCacheObject>,
    userId: string,
) => {
    try {
        const meetingAssists = (await client.query<{ Meeting_Assist: MeetingAssistType[] }>({
            query: listMeetingAssists,
            variables: {
                userId,
            },
        }))?.data?.Meeting_Assist

        console.log(meetingAssists, ' successfully returned meeting assists')

        return meetingAssists
    } catch (e) {
        console.log(e, ' unable to list user meeting assists given userId')
    }
}

export const getUserGivenId = async (
    client: ApolloClient<NormalizedCacheObject>,
    userId: string,
) => {
    try {
        const existingUser = (await client.query<{ User_by_pk: UserType }>({
            query: getUserById,
            variables: {
                id: userId,
            },
        }))?.data?.User_by_pk

        console.log(existingUser, ' successfully gotten userId')

        return existingUser
    } catch (e) {
        console.log(e, ' unable to get user given Id inside getUserGivenId')
    }
}

export const deleteMeetingAssistGivenId = async (
    client: ApolloClient<NormalizedCacheObject>,
    id: string,
) => {
    try {
        const deletedMeetingAssistDoc = (await client.mutate<{ delete_Meeting_Assist_by_pk: MeetingAssistType }>({
            mutation: deleteMeetingAssistById,
            variables: {
                id,
            },
        }))?.data?.delete_Meeting_Assist_by_pk

        console.log(deletedMeetingAssistDoc, ' successfully deleted meeting assist doc')
    } catch (e) {
        console.log(e, ' unable to delete meeting assist given id')
    }
}

export const updateUserNameGivenId = async (
    client: ApolloClient<NormalizedCacheObject>,
    userId: string,
    name: string,
) => {
    try {
        const userDoc = (await client.mutate<{ update_User_by_pk: UserType }>({
            mutation: updateUserForName,
            variables: {
                id: userId,
                name,
            },
        }))?.data?.update_User_by_pk

        console.log(userDoc, ' successfully updated userDoc')
    } catch (e) {
        console.log(e, ' uanble to update user name given id')
    }
}

export const insertMeetingAssistAttendee = async (
    client: ApolloClient<NormalizedCacheObject>,
    attendee: MeetingAssistAttendeeType,
) => {
    try {
        const meetingAssistAttendeeDoc = (await client.mutate<{ insert_Meeting_Assist_Attendee_one: MeetingAssistAttendeeType }>({
            mutation: insertMeetingAssistAttendeeOne,
            variables: {
                attendee,
            },
        }))?.data?.insert_Meeting_Assist_Attendee_one

        console.log(meetingAssistAttendeeDoc, ' successfully inserted meeting assist attendee')

        return meetingAssistAttendeeDoc
    } catch (e) {
        console.log(e, ' unable to insert attendee one')
    }
}

export const upsertMeetingAssistMany = async (
    client: ApolloClient<NormalizedCacheObject>,
    meetingAssists: MeetingAssistType[],
) => {
    try {
        console.log(meetingAssists, ' meetingAssistsinside upsertMeetingAssistMany')
        const upsertMeetingAssistsMutation = gql`
            mutation InsertMeetingAssists($meetingAssists: [Meeting_Assist_insert_input!]!) {
                insert_Meeting_Assist(objects: $meetingAssists, on_conflict: {constraint: Meeting_Assist_pkey, update_columns: [
                    allowAttendeeUpdatePreferences,
                    anyoneCanAddSelf,
                    attendeeCanModify,
                    attendeeCount,
                    attendeeRespondedCount,
                    backgroundColor,
                    bufferTime,
                    calendarId,
                    cancelIfAnyRefuse,
                    cancelled,
                    colorId,
                    conferenceApp,
                    duration,
                    enableAttendeePreferences,
                    enableConference,
                    enableHostPreferences,
                    endDate,
                    eventId,
                    expireDate,
                    foregroundColor,
                    frequency,
                    guaranteeAvailability,
                    guestsCanInviteOthers,
                    guestsCanSeeOtherGuests,
                    interval,
                    location,
                    minThresholdCount,
                    notes,
                    originalMeetingId,
                    priority,
                    reminders,
                    sendUpdates,
                    startDate,
                    summary,
                    timezone,
                    transparency,
                    until,
                    updatedAt,
                    useDefaultAlarms,
                    userId,
                    visibility,
                    windowEndDate,
                    windowStartDate,
                    lockAfter,
                ]}) {
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
                        lockAfter
                    }
                }
            }
        `

        const meetingAssistsDataDoc = (await client.mutate<{ insert_Meeting_Assist: { affected_rows: number, returning: MeetingAssistType[] } }>({
            mutation: upsertMeetingAssistsMutation,
            variables: {
                meetingAssists,
            },
        }))?.data?.insert_Meeting_Assist

        console.log(meetingAssistsDataDoc?.affected_rows, ' successfully created multiple meeting assists')

        return meetingAssistsDataDoc?.affected_rows
    } catch (e) {
        console.log(e, ' unable to upsert meeting assist many')
    }
}



export const upsertMeetingAssistOne = async (
    client: ApolloClient<NormalizedCacheObject>,
    meetingAssist: MeetingAssistType,
) => {
    try {
        console.log(meetingAssist, ' meetingAssist inside upsertMeetingAssistOne')
        const upsertMeetingAssistGraphql = gql`
           mutation InsertMeetingAssist($meetingAssist: Meeting_Assist_insert_input!) {
                insert_Meeting_Assist_one(object: $meetingAssist, on_conflict: {constraint: Meeting_Assist_pkey, update_columns: [allowAttendeeUpdatePreferences, anyoneCanAddSelf, attendeeCanModify, attendeeCount, attendeeRespondedCount, backgroundColor, bufferTime, calendarId, cancelIfAnyRefuse, cancelled, colorId, conferenceApp, duration, enableAttendeePreferences, enableConference, enableHostPreferences, endDate, eventId, expireDate, foregroundColor, frequency, guaranteeAvailability, guestsCanInviteOthers, guestsCanSeeOtherGuests, interval, location, minThresholdCount, notes, originalMeetingId, priority, reminders, sendUpdates, startDate, summary, timezone, transparency, until, updatedAt, useDefaultAlarms, userId, visibility, windowEndDate, windowStartDate, lockAfter]}) {
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
                    lockAfter
                }
            }
        `

        const meetingAssistDoc = (await client.mutate<{ insert_Meeting_Assist_one: MeetingAssistType }>({
            mutation: upsertMeetingAssistGraphql,
            variables: {
                meetingAssist,
            },
        }))?.data?.insert_Meeting_Assist_one

        console.log(meetingAssistDoc, ' successfully added meetingAssistDoc')

        return meetingAssistDoc
    } catch (e) {
        console.log(e, ' unable to upsert meeting assist')
    }
}

export const upsertMeetingAssistInviteMany = async (
    client: ApolloClient<NormalizedCacheObject>,
    meetingAssistInvites: MeetingAssistInviteType[],
) => {
    try {
        const upsertMeetingAssistInviteGraphql = gql`
            mutation InsertMeetingAssistInvite($meetingAssistInvites: [Meeting_Assist_Invite_insert_input!]!) {
                insert_Meeting_Assist_Invite(
                    objects: $meetingAssistInvites, 
                    on_conflict: {
                    constraint: Meeting_Assist_Invite_pkey, 
                    update_columns: [
                        email,
                        hostId,
                        hostName,
                        meetingId,
                        name,
                        response,
                        updatedAt,
                        userId,
                        contactId,
                    ]}) {
                    affected_rows
                    returning {
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
                    contactId
                    }
                }
            }
        `

        const meetingAssistInviteDocData = (await client.mutate<{ insert_Meeting_Assist_Invite: { affected_rows: number, returning: MeetingAssistInviteType[] } }>({
            mutation: upsertMeetingAssistInviteGraphql,
            variables: {
                meetingAssistInvites,
            },
        }))?.data?.insert_Meeting_Assist_Invite

        console.log(meetingAssistInviteDocData?.affected_rows, ' successfully inserted meetingAssistInviteDocs')

        return meetingAssistInviteDocData?.affected_rows
    } catch (e) {
        console.log(e, ' unable to upsert meeting assist invite')
    }
}


export const insertMeetingAssistPreferredTimeRanges = async (
    client: ApolloClient<NormalizedCacheObject>,
    meetingAssistPreferredTimeRanges: MeetingAssistPreferredTimeRangeType[],
) => {
    try {
        const meetingAssistInviteDocData = (await client.mutate<{ insert_Meeting_Assist_Preferred_Time_Range: { affected_rows: number, returning: MeetingAssistPreferredTimeRangeType[] } }>({
            mutation: insertMeetingAssistPreferredTimeRangesMutation,
            variables: {
                meetingAssistPreferredTimeRanges,
            },
        }))?.data?.insert_Meeting_Assist_Preferred_Time_Range

        console.log(meetingAssistInviteDocData?.affected_rows, ' successfully inserted meeting assist time ranges ')

        return meetingAssistInviteDocData?.affected_rows
    } catch (e) {
        console.log(e, ' unable to upsert meeting assist preferred time ranges')
    }
}

export const generateDatesForFutureMeetingAssistsUsingRrule = async (
    windowStartDate: string,
    windowEndDate: string,
    frequency: RecurrenceFrequencyType,
    interval: number,
    until: string,
) => {
    try {
        const ruleStartDate = new RRule({
            dtstart: dayjs(windowStartDate).toDate(),
            freq: getRruleFreq(frequency),
            interval,
            until: dayjs(until).toDate(),
        })

        const windowStartDatesForRecurrence = ruleStartDate.all()?.map(
            d => dayjs.utc(d).format()
        )

        const ruleEndDate = new RRule({
            dtstart: dayjs(windowEndDate).toDate(),
            freq: getRruleFreq(frequency),
            interval,
            until: dayjs(until).toDate(),
        })

        const windowEndDatesForRecurrence = ruleEndDate.all()?.map(
            d => dayjs.utc(d).format()
        )

        // reformat into windowStartDates and windowEndDates
        const timeWindows = windowStartDatesForRecurrence?.slice(0, windowEndDatesForRecurrence?.length)?.map((windowStartDate, inx) => {
            return {
                windowStartDate,
                windowEndDate: windowEndDatesForRecurrence?.[inx],
            }
        })

        return timeWindows
    } catch (e) {
        console.log(e, ' generate dates for meeting assists recurrence')
    }
}

export const searchMeetingAssists = async (
    client: ApolloClient<NormalizedCacheObject>,
    userId: string,
    summary: string,
): Promise<MeetingAssistType[] | [] | undefined> => {
    try {
        const formattedSummary = `%${summary}%`

        const results = (await client.query<{ Meeting_Assist: MeetingAssistType[] }>({
            query: searchMeetingAssistsQuery,
            variables: {
                userId,
                name: formattedSummary,
            },
            fetchPolicy: 'no-cache',
        }))?.data?.Meeting_Assist

        console.log(results, ' results inside searchMeetingAssists')

        return results
    } catch (e) {
        console.log(e, ' unable to search meeting assists')
    }
}


export const sendBulkMeetingCancelEmail = async (
    attendees: AttendeeDetailsForBulkMeetingCancelledType[],
    hostEmail: string,
    hostName: string,
) => {
    try {
        const url = emailMeetingCancelUrl

        const accessToken = await Session.getAccessToken()

        const config = {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        }

        const data = {
            attendees,
            hostName,
            hostEmail,
        }

        const results = await axios.post(url, data, config)

        console.log(results, ' succesfully sent cancel notifications for meeting assist')

    } catch (e) {
        console.log(e, ' unable to send bulk meeting cancel meeting')
    }
}

export const sendBulkMeetingInviteEmail = async (
    attendees: AttendeeDetailsForBulkMeetingInviteType[],
    hostEmail: string,
    hostName: string,
) => {
    try {
        console.log(attendees, ' AttendeeDetailsForBulkMeetingInviteType inside sendBulkMeetingInviteEmail')

        const url = emailMeetingInviteUrl

        const accessToken = await Session.getAccessToken()

        const config = {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        }

        const data = {
            attendees,
            hostName,
            hostEmail,
        }

        const results = await axios.post(url, data, config)

        console.log(results, ' successfully sent to email to invites')

    } catch (e) {
        console.log(e, ' unable to send bulk meeting invite email')
    }
}

export const convertInviteeTypeToCancelEmailRecipients = (
    invitees: MeetingAssistInviteType[],
) => {
    const cancelEmails = invitees?.map(i => ({
        email: i?.email || '',
        name: i?.name,
    }))

    return cancelEmails
}

export const convertInviteeTypeToInviteEmailRecipients = (
    invitees: MeetingAssistInviteType[],
    meetingId: string,
) => {

    const inviteeEmails = invitees?.map(i => ({
        email: i?.email || '',
        name: i?.name,
        link: generateInviteLink(meetingId, i?.id, i?.email)
    }))

    return inviteeEmails
}

export const sendMeetingInfoToHostEmail = async (
    attendees: AttendeeDetailsType[],
    hostEmail: string,
    hostName: string,
    title: string,
    notes: string,
    windowStartDate: string,
    windowEndDate: string,
    timezone: string,
) => {
    try {
        console.log(attendees, ' AttendeeDetailsType inside sendMeetingInfoToHostEmail')
        const accessToken = await Session.getAccessToken()

        const config = {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        }

        const data: MeetingInviteDetailsToHostType = {
            attendees,
            hostEmail,
            hostName,
            title,
            notes,
            windowStartDate,
            windowEndDate,
            timezone,
        }

        const url = emailMeetingInfoToHostUrl

        const results = await axios.post(url, data, config)

        console.log(results, ' successfully sent email to host')

    } catch (e) {
        console.log(e, ' unable to send email to host')
    }
}

export const generateInviteLink = (
    meetingId: string,
    attendeeId: string,
    primaryEmail?: string,
) => (primaryEmail && (`${handshakeUrl}?${qs.stringify({ meetingId, attendeeId, primaryEmail })}`) || `${handshakeUrl}?${qs.stringify({ meetingId, attendeeId })}`)

export const addContactToInvitees = (
    c: SelectedContactType,
    invitees: MeetingAssistInviteType[],
    setI: Dispatch<SetStateAction<MeetingAssistInviteType[]>>,
    setParentI: Dispatch<SetStateAction<MeetingAssistInviteType[]>>,
    hostId: string,
    hostName: string,
    meetingId: string,
) => {
    const formattedC: MeetingAssistInviteType = {
        id: uuid(),
        name: c?.name || '',
        email: (c?.emails?.find((e: { primary: boolean }) => (e?.primary)))?.value,
        hostId,
        hostName,
        meetingId,
        createdDate: dayjs().format(),
        updatedAt: dayjs().format(),
        userId: c?.userId,
        contactId: c?.id,
    }

    const newInvitees = invitees.concat([formattedC])
    setI(newInvitees)
    setParentI(newInvitees)
}

export const addOneToManualEntries = (
    i: MeetingAssistInviteType[],
    setI: Dispatch<SetStateAction<MeetingAssistInviteType[]>>,
    invitees: MeetingAssistInviteType[],
    setInvitees: Dispatch<SetStateAction<MeetingAssistInviteType[]>>,
    setParentI: Dispatch<SetStateAction<MeetingAssistInviteType[]>>,
    hostId: string,
    hostName: string,
    meetingId: string,
) => {
    const newValue: MeetingAssistInviteType = {
        id: uuid(),
        hostId,
        email: '',
        hostName,
        meetingId,
        name: '',
        createdDate: dayjs().format(),
        updatedAt: dayjs().format(),
    }

    const newMe = _.uniqWith(i.concat([newValue]), _.isEqual)
    setI(newMe)
    const newInvitees = _.uniqWith(invitees.concat([newValue]), _.isEqual)
    setInvitees(newInvitees)
    setParentI(newInvitees)
}


export const removeContactFromInvitee = (
    c: SelectedContactType,
    invitees: MeetingAssistInviteType[],
    setInvitees: Dispatch<SetStateAction<MeetingAssistInviteType[]>>,
    setParentI: Dispatch<SetStateAction<MeetingAssistInviteType[]>>,
) => {
    const foundIndex = invitees.findIndex(a => (a?.id === c?.id))

    if (foundIndex > -1) {
        const newAttendees = invitees.slice(0, foundIndex)
            .concat(invitees.slice(foundIndex + 1))

        setInvitees(newAttendees)
        setParentI(newAttendees)
    }
}

export const removeContactFromSearchInvitee = (
    c: SelectedContactType,
    invitees: MeetingAssistInviteType[],
    searchResults: SelectedContactType[],
    setInvitees: Dispatch<SetStateAction<MeetingAssistInviteType[]>>,
    setSearchResults: Dispatch<SetStateAction<SelectedContactType[]>>,
    setParentI: Dispatch<SetStateAction<MeetingAssistInviteType[]>>,
) => {
    const foundIndex = invitees.findIndex(a => (a?.id === c?.id))

    if (foundIndex > -1) {
        const newInvitees = invitees.slice(0, foundIndex)
            .concat(invitees.slice(foundIndex + 1))

        setInvitees(newInvitees)
        setParentI(newInvitees)
    }

    const foundSearchIndex = searchResults?.findIndex(a => (a?.id === c?.id))

    if (foundSearchIndex > -1) {
        const newSearchInvitees = searchResults.slice(0, foundIndex)
            .concat(searchResults.slice(foundIndex + 1))

        setSearchResults(newSearchInvitees)
    }
}

export const removeEntryFromManualEntries = (
    manualEntries: MeetingAssistInviteType[],
    setManualEntries: Dispatch<SetStateAction<MeetingAssistInviteType[]>>,
    invitees: MeetingAssistInviteType[],
    setInvitees: Dispatch<SetStateAction<MeetingAssistInviteType[]>>,
    setParentI: Dispatch<SetStateAction<MeetingAssistInviteType[]>>,
    index: number,
    parentIndex: number,
) => {
    const newEntries = manualEntries.slice(0, index)
        .concat(manualEntries.slice(index + 1))
    setManualEntries(newEntries)
    const newAttendees = invitees.slice(0, parentIndex)
        .concat(invitees.slice(parentIndex + 1))
    setInvitees(newAttendees)
    setParentI(newAttendees)
}

export const updateContactSelection = (
    value: boolean,
    selectedCo: SelectedContactType,
    a: SelectedContactType[],
    setA: Dispatch<SetStateAction<SelectedContactType[]>>,
    index: number,
) => {
    const newA = _.cloneDeep(a.slice(0, index)
        .concat([{ ...selectedCo, selected: value }])
        .concat(a.slice(index + 1)))
    setA(newA)
}

export const updateSearchContactSelection = (
    value: boolean,
    selectedCo: SelectedContactType,
    a: SelectedContactType[],
    searchA: SelectedContactType[],
    setA: Dispatch<SetStateAction<SelectedContactType[]>>,
    setSearchA: Dispatch<SetStateAction<SelectedContactType[]>>,
    searchIndex: number,
) => {
    const findIndex = a?.findIndex(p => (p?.id === selectedCo?.id))

    if (findIndex > -1) {
        const newA = _.cloneDeep(a.slice(0, findIndex)
            .concat([{ ...selectedCo, selected: value }])
            .concat(a.slice(findIndex + 1)))
        setA(newA)
    }


    const newSearchA = _.cloneDeep(searchA.slice(0, searchIndex)
        .concat([{ ...selectedCo, selected: value }])
        .concat(a.slice(searchIndex + 1)))
    setSearchA(newSearchA)
}

export const updateEntryInManualEntries = (
    i: MeetingAssistInviteType[],
    setI: Dispatch<SetStateAction<MeetingAssistInviteType[]>>,
    index: number,
    invitees: MeetingAssistInviteType[],
    setInviteees: Dispatch<SetStateAction<MeetingAssistInviteType[]>>,
    setParentI: Dispatch<SetStateAction<MeetingAssistInviteType[]>>,
    parentIndex: number,
    email?: string,
    displayName?: string,
) => {
    const oldDoc = i[index]
    const newDoc: MeetingAssistInviteType = {
        ...oldDoc,
        name: displayName || oldDoc?.name,
        email: email || oldDoc?.email,
    }

    const newI = i.slice(0, index)
        .concat([newDoc])
        .concat(i.slice(index + 1))
    setI(newI)
    const newInvitees = invitees.slice(0, parentIndex)
        .concat([newDoc])
        .concat(invitees.slice(parentIndex + 1))
    setInviteees(newInvitees)
    setParentI(newInvitees)
}

