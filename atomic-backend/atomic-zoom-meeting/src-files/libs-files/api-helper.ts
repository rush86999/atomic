import got from "got"
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import duration from 'dayjs/plugin/duration'
import isBetween from 'dayjs/plugin/isBetween'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { hasuraAdminSecret, hasuraGraphUrl, zoomBaseTokenUrl, zoomBaseUrl, zoomClientId, zoomClientSecret, zoomResourceName, zoomTokenUrl } from "./constants"
import { CalendarIntegrationType, CreateMeetingResponseType, CreateZoomMeetingRequestBodyType, ZoomMeetingObjectType } from "./types"
import qs from 'qs'
import axios from "axios"

dayjs.extend(isoWeek)
dayjs.extend(duration)
dayjs.extend(isBetween)
dayjs.extend(timezone)
dayjs.extend(utc)

// update zoom meeting
export const updateZoomMeetingStartDate = async (
    zoomToken: string,
    meetingId: number,
    startDate: string,
    timezone: string,
) => {
    try {
        const reqBody = {
            start_time: dayjs(startDate?.slice(0, 19)).format('YYYY-MM-DDTHH:mm:ss'),
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


export const updateZoomMeeting = async (
    zoomToken: string,
    meetingId: number,
    startDate?: string,
    timezone?: string,
    agenda?: string,
    duration?: number,
    contactName?: string,
    contactEmail?: string,
    meetingInvitees?: string[],
    privateMeeting?: boolean,
) => {
    try {
        //valdiate
        if (startDate && dayjs().isAfter(dayjs(startDate))) {

            throw new Error('starttime is in the past')
        }

        let settings: any = {}

        if (privateMeeting) {
            settings = { ...settings, private_meeting: privateMeeting }
        }

        if ((contactName?.length > 0) && (contactEmail?.length > 0)) {
            settings = {
                contact_name: contactName,
                contact_email: contactEmail,
            }
        }

        if (meetingInvitees?.length > 0) {
            settings = { ...settings, meeting_invitees: meetingInvitees }
        }

        let reqBody: any = {}

        if (Object.keys(settings)?.length > 0) {
            reqBody.settings = settings
        }

        if (startDate && timezone) {
            reqBody.start_time = dayjs(startDate?.slice(0, 19)).format('YYYY-MM-DDTHH:mm:ss')
            reqBody.timezone = timezone
        }

        if (agenda) {
            reqBody.agenda = agenda
        }

        if (duration) {
            reqBody.duration = duration
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
    privateMeeting?: boolean,
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

        if (privateMeeting) {
            settings.private_meeting = true
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

export const getZoomMeeting = async (
    zoomToken: string,
    meetingId: number,
) => {
    try {
        const res: CreateMeetingResponseType = await got(`${zoomBaseUrl}/meetings/${meetingId}`, {
            headers: {
                Authorization: `Bearer ${zoomToken}`,
                ContentType: 'application/json',
            }
        }).json()

        return res
    } catch (e) {

    }
}

export const deleteZoomMeeting = async (
    zoomToken: string,
    meetingId: number,
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
                `${zoomBaseUrl}/meetings/` + meetingId + '?' + stringifiedObject,
                {
                    headers: {
                        Authorization: `Bearer ${zoomToken}`,
                        ContentType: 'application/json',
                    }
                }
            )
        } else {
            await got.delete(
                `${zoomBaseUrl}/meetings/` + meetingId,
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



