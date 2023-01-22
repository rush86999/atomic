import { ApolloClient, gql, NormalizedCacheObject } from "@apollo/client"
import insertMeetingAssistPreferredTimeRangesMutation from "@app/apollo/gql/insertMeetingAssistPreferredTimeRangesMutation"
import { MeetingAssistInviteType } from "@app/dataTypes/MeetingAssistInviteType"
import { MeetingAssistPreferredTimeRangeType } from "@app/dataTypes/MeetingAssistPreferredTimeRangeType"
import { MeetingAssistType } from "@app/dataTypes/MeetingAssistType"
import { RRule } from 'rrule'
import { dayjs, RNLocalize } from '@app/date-utils'
import { getRRuleDay, getRruleFreq } from "@screens/Calendar/UserCreateCalendarHelper"
import { AttendeeDetailsForBulkMeetingCancelledType, AttendeeDetailsForBulkMeetingInviteType, AttendeeDetailsType, MeetingInviteDetailsToHostType } from "@screens/Assist/types"
import { Auth } from '@aws-amplify/auth';
import { emailMeetingCancelUrl, emailMeetingInfoToHostUrl, emailMeetingInviteUrl, handshakeUrl } from "@screens/Assist/constants"
import axios from "axios"
import qs from 'qs'
import upsertMeetingAssistInvitesMutation from "@app/apollo/gql/upsertMeetingAssistInvitesMutation"
import { MeetingAssistAttendeeType } from "@app/dataTypes/MeetingAssistAttendeeType"
import insertAttendeeMutation from "@app/apollo/gql/insertAttendeeMutation"
import getUserById from "@app/apollo/gql/getUserById"
import { UserType } from "@app/dataTypes/UserType"
import { RecurrenceFrequency } from 'react-native-calendar-events'
import { SelectedContactType } from "@screens/Calendar/CreateEventWizard/CreateEventAttendees"
import { Person } from "@screens/Calendar/types"
import { Dispatch, SetStateAction } from "react"
import { v4 as uuid } from 'uuid'
import _ from "lodash"
import { email } from '@app/dataTypes/AttendeeType';
import updateUserForName from "@app/apollo/gql/updateUserForName"
import listMeetingAssists from "@app/apollo/gql/listMeetingAssists"
import deleteMeetingAssistById from "@app/apollo/gql/deleteMeetingAssistById"
import listMeetingAssistInvites from "@app/apollo/gql/listMeetingAssistInvites"
import insertMeetingAssistAttendeeOne from "@app/apollo/gql/insertMeetingAssistAttendeeOne"
import getMeetingAssistById from "@app/apollo/gql/getMeetingAssistById"
import searchMeetingAssistsQuery from "@app/apollo/gql/searchMeetingAssistsQuery"



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



        return meetingAssistInvitesDoc
    } catch (e) {

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


        return meetingAssistDoc
    } catch (e) {

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



        return meetingAssists
    } catch (e) {

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



        return existingUser
    } catch (e) {

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


    } catch (e) {

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


    } catch (e) {

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



        return meetingAssistAttendeeDoc
    } catch (e) {

    }
}

export const upsertMeetingAssistMany = async (
    client: ApolloClient<NormalizedCacheObject>,
    meetingAssists: MeetingAssistType[],
) => {
    try {

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



        return meetingAssistsDataDoc?.affected_rows
    } catch (e) {

    }
}



export const upsertMeetingAssistOne = async (
    client: ApolloClient<NormalizedCacheObject>,
    meetingAssist: MeetingAssistType,
) => {
    try {

        const upsertMeetingAssistGraphql = gql`
           mutation InsertMeetingAssist($meetingAssist: Meeting_Assist_insert_input!) {
                insert_Meeting_Assist_one(object: $meetingAssist, on_conflict: {constraint: Meeting_Assist_pkey, update_columns: [allowAttendeeUpdatePreferences, anyoneCanAddSelf, attendeeCanModify, attendeeCount, attendeeRespondedCount, backgroundColor, bufferTime, calendarId, cancelIfAnyRefuse, cancelled, colorId, conferenceApp, duration, enableAttendeePreferences, enableConference, enableHostPreferences, endDate, eventId, expireDate, foregroundColor, frequency, guaranteeAvailability, guestsCanInviteOthers, guestsCanSeeOtherGuests, interval, location, minThresholdCount, notes, originalMeetingId, priority, reminders, sendUpdates, startDate, summary, timezone, transparency, until, updatedAt, useDefaultAlarms, userId, visibility, windowEndDate, windowStartDate]}) {
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


        `

        const meetingAssistDoc = (await client.mutate<{ insert_Meeting_Assist_one: MeetingAssistType }>({
            mutation: upsertMeetingAssistGraphql,
            variables: {
                meetingAssist,
            },
        }))?.data?.insert_Meeting_Assist_one



        return meetingAssistDoc
    } catch (e) {

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



        return meetingAssistInviteDocData?.affected_rows
    } catch (e) {

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



        return meetingAssistInviteDocData?.affected_rows
    } catch (e) {

    }
}

export const generateDatesForFutureMeetingAssistsUsingRrule = async (
    windowStartDate: string,
    windowEndDate: string,
    frequency: RecurrenceFrequency,
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

    }
}

export const searchMeetingAssists = async (
    client: ApolloClient<NormalizedCacheObject>,
    userId: string,
    summary: string,
): Promise<MeetingAssistType[] | []> => {
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



        return results
    } catch (e) {

    }
}


export const sendBulkMeetingCancelEmail = async (
    attendees: AttendeeDetailsForBulkMeetingCancelledType[],
    hostEmail: string,
    hostName: string,
) => {
    try {
        const url = emailMeetingCancelUrl

        const accessToken = (await Auth.currentSession()).getIdToken().getJwtToken()

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



    } catch (e) {

    }
}

export const sendBulkMeetingInviteEmail = async (
    attendees: AttendeeDetailsForBulkMeetingInviteType[],
    hostEmail: string,
    hostName: string,
) => {
    try {


        const url = emailMeetingInviteUrl

        const accessToken = (await Auth.currentSession()).getIdToken().getJwtToken()

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



    } catch (e) {

    }
}

export const convertInviteeTypeToCancelEmailRecipients = (
    invitees: MeetingAssistInviteType[],
) => {
    const cancelEmails = invitees?.map(i => ({
        email: i?.email,
        name: i?.name,
    }))

    return cancelEmails
}

export const convertInviteeTypeToInviteEmailRecipients = (
    invitees: MeetingAssistInviteType[],
    meetingId: string,
) => {

    const inviteeEmails = invitees?.map(i => ({
        email: i?.email,
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

        const accessToken = (await Auth.currentSession()).getIdToken().getJwtToken()

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



    } catch (e) {

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
        name: c?.name,
        email: (c?.emails?.find(e => (e?.primary)))?.value,
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

