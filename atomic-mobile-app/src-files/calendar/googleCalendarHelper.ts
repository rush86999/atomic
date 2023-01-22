import { Platform } from 'react-native'

import axios from 'axios'
import { Auth } from 'aws-amplify'
import { refresh } from 'react-native-app-auth'
import { dayjs } from '@app/date-utils'
import qs from 'qs'
import { v4 as uuid } from 'uuid'
import { googleCalendarAndroidAuthRefreshUrl } from '@app/lib/constants'

import { googleConfig } from '@app/dataTypes/configs'

import {
  googleURL,
  googleCalendarURL,
  googleCalendarName,
  googleCalendarResource,
  googleColorUrl,
  selfGoogleCalendarWatchUrl,
} from '@app/calendar/constants'
import {
  calendarResponse,
  eventResponse,
  GoogleAttendeeType,
  ConferenceDataType,
  extendedProperties,
  GoogleReminderType,
  source,
  transparency,
  visibility,
  sendUpdates,
  allowedConferenceSolutionType,
  attachment,
  eventType1,
  DefaultReminderType,
  NotificationType,
  colorResponseType,
  RefreshTokenResponseBodyType,
} from '@app/calendar/types'

import {
  updateCalendarIntegration,
} from '@app/lib/apiHelper'

import { hasuraApiUrl } from '@app/lib/constants'
import { ApolloClient, gql, NormalizedCacheObject } from '@apollo/client'
import getCalendarIntegrationByResource from '@app/apollo/gql/getCalendarIntegrationByResourceAndName';
import { CalendarIntegrationType } from '@dataTypes/calendar_integrationType'
import getCalendarPushNotificationByCalendarId from '@app/apollo/gql/getCalendarPushNotificationByCalendarId'
import { CalendarWebhookType } from '@app/dataTypes/CalendarWebhookType'
import listCalendarPushNotificationsByUserId from '@app/apollo/gql/listCalendarPushNotificationsByUserId'
import deleteCalendarPushNotificationByCalendarId from '@app/apollo/gql/deleteCalendarPushNotificationByCalendarId'




export const checkIfCalendarWebhookExpired = async (
  client: ApolloClient<NormalizedCacheObject>,
  userId: string,
) => {
  try {
    const calendarWebhooks = (await client.query<{ Calendar_Push_Notification: CalendarWebhookType[] }>({
      query: listCalendarPushNotificationsByUserId,
      variables: {
        userId,
      }
    }))?.data?.Calendar_Push_Notification

    for (let i = 0; i < calendarWebhooks.length; i++) {
      if (dayjs().isAfter(dayjs(calendarWebhooks[i]?.expiration))) {
        await enableCalendarWebhook(calendarWebhooks[i])
      }
    }
  } catch (e) {

  }
}

export const enableCalendarWebhook = async (
  webhook: CalendarWebhookType,
) => {
  try {
    const token = (await Auth.currentSession()).getIdToken().getJwtToken()
    const url = selfGoogleCalendarWatchUrl
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }

    const data = {
      calendarId: webhook?.calendarId,
      userId: webhook?.userId,
      channelId: webhook?.id,
    }
    const results = await axios.post(url, data, config)

  } catch (e) {

  }
}

export const deleteCalendarWebhook = async (
  client: ApolloClient<NormalizedCacheObject>,
  calendarId: string,
) => {
  try {

    const res = await client.mutate<{ delete_Calendar_Push_Notification: { affected_rows: number } }>({
      mutation: deleteCalendarPushNotificationByCalendarId,
      variables: {
        calendarId,
      }
    })

  } catch (e) {

  }
}

export const getCalendarWebhook = async (
  client: ApolloClient<NormalizedCacheObject>,
  calendarId: string,
) => {
  try {

    const calendarWebhook = (await client.query<{ Calendar_Push_Notification: CalendarWebhookType[] }>({
      query: getCalendarPushNotificationByCalendarId,
      variables: {
        calendarId,
      }
    }))?.data?.Calendar_Push_Notification?.[0]


    return calendarWebhook

  } catch (e) {

  }
}

export const getGoogleCalendarSyncApiToken = async () => {
  try {
    const token = (await Auth.currentSession()).getIdToken().getJwtToken()
    const url = hasuraApiUrl
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    }
    const operationName = 'GetGoogleCalendarSyncToken'
    const query = `
      query GetGoogleCalendarSyncToken($name: String!, $resource: String!) {
        Admin(where: {name: {_eq: $name}, resource: {_eq: $resource}}) {
          id
          name
          token
          resource
        }
      }
    `
    const variables = {
      name: "googleCalendarSync",
      resource: "aws"
    }

    const data = {
      operationName,
      query,
      variables
    }
    const results = await axios.post(url, data, config)

    if (results?.data?.Admin?.[0]?.id) {
      const token = results?.data?.Admin?.[0]?.token
      return token
    }
  } catch (e) {

  }
}

export const houseKeepSyncEnabledGoogleCalendar = async (
  client: ApolloClient<NormalizedCacheObject>,
  userId: string,
) => {
  try {
    const googleInteg = (await client.query<{ Calendar_Integration: CalendarIntegrationType[] }>({
      query: getCalendarIntegrationByResource,
      variables: {
        userId,
        name: googleCalendarName,
        resource: googleCalendarResource,
      }
    }))?.data?.Calendar_Integration?.[0]

    const oldEnabled = googleInteg?.enabled
    const oldSyncEnabled = googleInteg?.syncEnabled
    const updatedAt = dayjs().toISOString()

    const updateIntegration = gql`
    mutation UpdateCalendarIntegrationById($id: uuid!, $syncEnabled: Boolean) {
      update_Calendar_Integration_by_pk(_set: {syncEnabled: $syncEnabled}, pk_columns: {id: $id}) {
        appAccountId
        appEmail
        appId
        colors
        contactEmail
        contactName
        createdDate
        deleted
        enabled
        expiresAt
        id
        name
        pageToken
        password
        refreshToken
        syncEnabled
        resource
        token
        syncToken
        updatedAt
        userId
        username
        clientType
      }
    }
    `
    let variables: any = {
      id: googleInteg?.id,
    }

    if (oldEnabled && !oldSyncEnabled) {
      variables = {
        ...variables,
        syncEnabled: true,
        updatedAt,
      }
    } else if (!oldEnabled && oldSyncEnabled) {
      variables = {
        ...variables,
        syncEnabled: false,
        updatedAt,
      }
    }

    if (variables?.updatedAt) {
      await client.mutate({
        mutation: updateIntegration,
        variables,
      })
    }
    if (oldEnabled && !oldSyncEnabled) {
      await getGoogleToken(client, userId)
    }

  } catch (e) {

  }
}

export const googleMeetAvailable = async (
  client: ApolloClient<NormalizedCacheObject>,
  userId: string,
) => {
  try {

    const token = await getGoogleToken(client, userId)

    if (token?.length > 0) {
      return true
    }
    return false
  } catch (e) {

  }
}

export const getGoogleToken = async (
  client: ApolloClient<NormalizedCacheObject>,
  userId: string,
) => {
  try {
    const googleInteg = (await client.query<{ Calendar_Integration: CalendarIntegrationType[] }>({
      query: getCalendarIntegrationByResource,
      variables: {
        userId,
        name: googleCalendarName,
        resource: googleCalendarResource,
      }
    }))?.data?.Calendar_Integration?.[0]

    const token = googleInteg?.token
    const expiresAt = googleInteg?.expiresAt
    const oldRefreshToken = googleInteg?.refreshToken

    if (dayjs().isAfter(dayjs(expiresAt))) {

      let newAccessToken = ''
      let newRefreshToken = ''
      let newExpiresAt = ''

      if (Platform.OS === 'ios') {
        const refreshedState = await refresh(googleConfig, {
          refreshToken: oldRefreshToken,
        })

        const {
          accessToken,
          refreshToken,
          accessTokenExpirationDate: expiresAt,
        } = refreshedState

        newAccessToken = accessToken
        newRefreshToken = refreshToken
        newExpiresAt = expiresAt
      } else if (Platform.OS === 'android') {

        const url = googleCalendarAndroidAuthRefreshUrl
        const token = (await Auth.currentSession()).getIdToken().getJwtToken()
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }

        const data = {
          refreshToken: oldRefreshToken,
        }

        const results: {
          data: {
            message: string,
            event: RefreshTokenResponseBodyType
          },
        } = await axios.post(url, data, config)


        newAccessToken = results?.data?.event?.access_token
        newRefreshToken = oldRefreshToken
        newExpiresAt = dayjs().add(results?.data?.event?.expires_in, 'seconds').toISOString()
      }


      await updateCalendarIntegration(
        client,
        googleInteg?.id,
        undefined,
        newAccessToken,
        newRefreshToken,
        newExpiresAt,
        Platform.OS === 'android' ? 'web' : Platform.OS,
      )

      return newAccessToken
    }

    return token
  } catch (e) {

  }
}

export const patchGoogleCalendar = async (
  client: ApolloClient<NormalizedCacheObject>,
  userId: string,
  calendarId: string,
  summary?: string,
  description?: string,
  location?: string,
  timeZone?: string,
  allowedConferenceSolutionTypes?: allowedConferenceSolutionType[],
) => {
  try {
    const token = await getGoogleToken(client, userId)
    let url = `${googleCalendarURL}/${encodeURI(calendarId)}`

    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    }

    let data: any = {}

    if (summary?.length > 0) {
      data = { ...data, summary }
    }

    if (description?.length > 0) {
      data = { ...data, description }
    }

    if (location?.length > 0) {
      data = { ...data, location }
    }

    if (timeZone?.length > 0) {
      data = { ...data, timeZone }
    }

    if (allowedConferenceSolutionTypes?.[0]?.length > 0) {
      data = {
        ...data,
        conferenceProperties: {
          allowedConferenceSolutionTypes,
        },
      }
    }

    const results = await axios.patch<calendarResponse>(url, data, config)



  } catch (e) {

  }
}

export const createGoogleCalendar = async (
  client: ApolloClient<NormalizedCacheObject>,
  userId: string,
  id: string,
  summary: string,
  defaultReminders?: DefaultReminderType[],
  notifications?: NotificationType[],
) => {
  try {
    const token = await getGoogleToken(client, userId)
    let url = googleCalendarURL

    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    }

    let data: any = { id, summaryOverride: summary, selected: true }

    if (defaultReminders?.[0]?.method?.length > 0) {
      data = { ...data, defaultReminders }
    }

    if (notifications?.[0]?.method?.length > 0) {
      data = {
        ...data,
        notificationSettings: {
          notifications,
        }
      }
    }

    const result = await axios.post(url, data, config)

  } catch (e) {

  }
}

export const getGoogleCalendar = async (
  client: ApolloClient<NormalizedCacheObject>,
  userId: string,
  calendarId: string,
) => {
  try {
    const token = await getGoogleToken(client, userId)
    let url = `${googleCalendarURL}/${encodeURI(calendarId)}`

    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    }

    const results = await axios.get(url, config)

    return results
  } catch (e) {

  }
}

export const deleteGoogleEvent = async (
  client: ApolloClient<NormalizedCacheObject>,
  userId: string,
  calendarId: string,
  googleEventId: string,
  sendUpdates: sendUpdates = 'all',
) => {
  try {
    const token = await getGoogleToken(client, userId)
    let url = `${googleURL}/${encodeURI(calendarId)}/events/${encodeURI(googleEventId)}`

    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    }
    if (sendUpdates) {
      url = `${url}?`
      let params = { sendUpdates }

      url = `${url}${qs.stringify(params)}`
    }

    const result = await axios.delete(url, config)

  } catch (e) {

  }
}

export const deleteGoogleCalendar = async (
  client: ApolloClient<NormalizedCacheObject>,
  userId: string,
  calendarId: string,
) => {
  try {
    const token = await getGoogleToken(client, userId)
    let url = `${googleCalendarURL}/${encodeURI(calendarId)}`

    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    }

    const results = await axios.delete(url, config)

  } catch (e) {

  }
}

export const getGoogleColors = async (
  token: string,
) => {
  try {
    const url = googleColorUrl
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    }

    const { data } = await axios.get<colorResponseType>(url, config)

    return data
  } catch (e) {

  }
}

export const clearGoogleCalendar = async (
  client: ApolloClient<NormalizedCacheObject>,
  userId: string,
  calendarId: string,
) => {
  try {
    const token = await getGoogleToken(client, userId)
    let url = `${googleURL}/${encodeURI(calendarId)}/clear`

    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    }

    const results = await axios.post(url, undefined, config)

  } catch (e) {

  }
}

export const patchGoogleEvent = async (
  client: ApolloClient<NormalizedCacheObject>,
  userId: string,
  calendarId: string,
  eventId: string,
  endDateTime?: string,
  startDateTime?: string,
  conferenceDataVersion?: 0 | 1,
  maxAttendees?: number,
  sendUpdates?: sendUpdates,
  anyoneCanAddSelf?: boolean,
  attendees?: GoogleAttendeeType[],
  conferenceData?: ConferenceDataType,
  summary?: string,
  description?: string,
  timezone?: string,
  startDate?: string,
  endDate?: string,
  extendedProperties?: extendedProperties,
  guestsCanInviteOthers?: boolean,
  guestsCanModify?: boolean,
  guestsCanSeeOtherGuests?: boolean,
  originalStartDateTime?: string,
  originalStartDate?: string,
  recurrence?: string[],
  reminders?: GoogleReminderType,
  source?: source,
  status?: string,
  transparency?: transparency,
  visibility?: visibility,
  iCalUID?: string,
  attendeesOmitted?: boolean,
  hangoutLink?: string,
  privateCopy?: boolean,
  locked?: boolean,
  attachments?: attachment[],
  eventType?: eventType1,
  location?: string,
) => {
  try {
    const token = await getGoogleToken(client, userId)
    let url = `${googleURL}/${encodeURI(calendarId)}/events/${encodeURI(eventId)}`

    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    }

    if (
      maxAttendees
      || sendUpdates
      || (conferenceDataVersion > -1)
    ) {
      url = `${url}?`
      let params: any = {}

      if (maxAttendees) {
        params.maxAttendees = maxAttendees
      }

      if (sendUpdates) {
        params.sendUpdates = sendUpdates
      }

      if (conferenceDataVersion > -1) {
        params.conferenceDataVersion = conferenceDataVersion
      }

      if (
        params?.maxAttendees
        || params?.sendUpdates
        || (params?.conferenceDataVersion > -1)
      ) {
        url = `${url}${qs.stringify(params)}`
      }
    }


    let data: any = {}

    if (endDate && timezone && !endDateTime) {
      const end = {
        date: dayjs(endDate).format('YYYY-MM-DD'),
        timezone,
      }
      data.end = end
    }

    if (endDateTime && timezone && !endDate) {
      const end = {
        dateTime: dayjs(endDateTime)
          .format(),
        timezone
      }
      data.end = end
    }

    if (startDate && timezone && !startDateTime) {
      const start = {
        date: dayjs(startDate).format('YYYY-MM-DD'),
        timezone,
      }
      data.start = start
    }

    if (startDateTime && timezone && !startDate) {
      const start = {
        dateTime: dayjs(startDateTime).format(),
        timezone,
      }
      data.start = start
    }

    if (originalStartDate && timezone && !originalStartDateTime) {
      const originalStartTime = {
        date: dayjs(originalStartDate).format('YYYY-MM-DD'),
        timezone,
      }
      data.originalStartTime = originalStartTime
    }

    if (originalStartDateTime && timezone && !originalStartDate) {
      const originalStartTime = {
        dateTime: dayjs(originalStartDateTime).format(),
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

    const results = await axios.patch(url, data, config)

  } catch (e) {

  }
}

export const createGoogleEvent = async (
  client: ApolloClient<NormalizedCacheObject>,
  userId: string,
  calendarId: string,
  endDateTime?: string,
  startDateTime?: string,
  conferenceDataVersion?: 0 | 1,
  maxAttendees?: number,
  sendUpdates?: sendUpdates,
  anyoneCanAddSelf?: boolean,
  attendees?: GoogleAttendeeType[],
  conferenceData?: ConferenceDataType,
  summary?: string,
  description?: string,
  timezone?: string,
  startDate?: string,
  endDate?: string,
  extendedProperties?: extendedProperties,
  guestsCanInviteOthers?: boolean,
  guestsCanModify?: boolean,
  guestsCanSeeOtherGuests?: boolean,
  originalStartDateTime?: string,
  originalStartDate?: string,
  recurrence?: string[],
  reminders?: GoogleReminderType,
  source?: source,
  status?: string,
  transparency?: transparency,
  visibility?: visibility,
  iCalUID?: string,
  attendeesOmitted?: boolean,
  hangoutLink?: string,
  privateCopy?: boolean,
  locked?: boolean,
  attachments?: attachment[],
  eventType?: eventType1,
  location?: string,
) => {
  try {
    const token = await getGoogleToken(client, userId)
    let url = `${googleURL}/${encodeURI(calendarId)}/events`

    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    }

    if (
      maxAttendees
      || sendUpdates
      || (conferenceDataVersion > 0)
    ) {
      url = `${url}?`
      let params: any = {}

      if (maxAttendees) {
        params = { ...params, maxAttendees }
      }

      if (sendUpdates) {
        params = { ...params, sendUpdates }
      }

      if (conferenceDataVersion > -1) {
        params = { ...params, conferenceDataVersion }
      }

      if (
        params?.maxAttendees
        || params?.sendUpdates
        || (params?.conferenceDataVersion > -1)
      ) {
        url = `${url}${qs.stringify(params)}`
      }
    }


    let data: any = {}

    if (endDateTime && timezone && !endDate) {
      const end = {
        dateTime: dayjs(endDateTime)
          .format(),
        timezone,
      }

      data.end = end
    }

    if (endDate && timezone && !endDateTime) {
      const end = {
        date: dayjs(endDate).format('YYYY-MM-DD'),
        timezone,
      }

      data.end = end
    }

    if (startDate && timezone && !startDateTime) {
      const start = {
        date: dayjs(startDate).format('YYYY-MM-DD'),
        timezone,
      }
      data.start = start
    }

    if (startDateTime && timezone && !startDate) {
      const start = {
        dateTime: dayjs(startDateTime).format(),
        timezone,
      }
      data.start = start
    }

    if (originalStartDate && timezone && !originalStartDateTime) {
      const originalStartTime = {
        date: dayjs(originalStartDate).format('YYYY-MM-DD'),
        timezone,
      }
      data.originalStartTime = originalStartTime
    }

    if (originalStartDateTime && timezone && !originalStartDate) {
      const originalStartTime = {
        dateTime: dayjs(originalStartDateTime).format(),
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

    const results = await axios.post<eventResponse>(url, data, config)


    return results?.data?.id
  } catch (e: any) {



  }
}
