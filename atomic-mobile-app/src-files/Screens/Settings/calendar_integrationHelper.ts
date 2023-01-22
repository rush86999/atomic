import { authorize, refresh } from 'react-native-app-auth'
import { v4 as uuid } from 'uuid'
import { dayjs, RNLocalize } from '@app/date-utils'
import axios from 'axios'
import { Auth } from 'aws-amplify'
import qs from 'qs'
import { retry } from '@lifeomic/attempt'
import { Platform } from 'react-native'


import { ConfigType } from '@app/dataTypes/ConfigType'
import { hasuraApiUrl } from '@app/lib/constants'

import {
  googleCalendarSyncUrl,
  googleCalendarURL,
  googleCalendarName,
  googleCalendarResource,
  localCalendarName,
  localCalendarResource,
} from '@app/calendar/constants'

import {
  googlePeopleSyncUrl,
  googlePeopleName,
  googlePeopleResource,
  localContactsName,
  localContactsResource,
} from '@app/contacts/constants'

import { zoomName, zoomResourceName } from '@app/zoom/constants'

import {
  CalendarListResponseType,
  CalendarListItemResponseType,
} from '@app/calendar/types'

import { CalendarIntegrationType, colorType } from '@app/dataTypes/Calendar_IntegrationType'
import { ApolloClient, gql, NormalizedCacheObject } from '@apollo/client'
import getCalendarIntegrationById from '@app/apollo/gql/getCalendarIntegrationById'
import upsertCalendarIntegrations from '@app/apollo/gql/upsertCalendarIntegrations'
import listCalendarIntegrations from '@app/apollo/gql/listCalendarIntegrations'


const INTEGRATIONS = [
  {
    id: uuid(),
    resource: googleCalendarResource,
    name: googleCalendarName,
    enabled: false,
    syncEnabled: false,
    updatedAt: dayjs().format(),
    createdDate: dayjs().format(),
    deleted: false,
    clientType: Platform.OS,
  },
  {
    id: uuid(),
    resource: zoomResourceName,
    name: zoomName,
    enabled: false,
    syncEnabled: false,
    updatedAt: dayjs().format(),
    createdDate: dayjs().toISOString(),
    deleted: false,
    clientType: Platform.OS,
  },
  {
    id: uuid(),
    resource: googlePeopleResource,
    name: googlePeopleName,
    enabled: false,
    syncEnabled: false,
    updatedAt: dayjs().format(),
    createdDate: dayjs().toISOString(),
    deleted: false,
    clientType: Platform.OS,
  },
  {
    id: uuid(),
    resource: localContactsResource,
    name: localContactsName,
    enabled: false,
    syncEnabled: false,
    updatedAt: dayjs().format(),
    createdDate: dayjs().toISOString(),
    deleted: false,
    clientType: Platform.OS,
  },
  {
    id: uuid(),
    resource: localCalendarResource,
    name: localCalendarName,
    enabled: false,
    syncEnabled: false,
    updatedAt: dayjs().format(),
    createdDate: dayjs().toISOString(),
    deleted: false,
    clientType: Platform.OS,
  },
]


export const deleteEventTriggerById = async (
  id: string,
) => {
  try {
    const token = (await Auth.currentSession()).getIdToken().getJwtToken()
    const operationName = 'deleteEventTriggerById'
    const query = `
      mutation deleteEventTriggerById($id: uuid!) {
        delete_Event_Trigger_by_pk(id: $id) {
          id
        }
      }
    `
    const variables = { id }
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      }
    }

    const data = {
      operationName,
      query,
      variables,
    }

    const response = await axios.post(
      hasuraApiUrl,
      data,
      config
    )

  } catch (e) {

  }
}

export const deleteEventTriggerByResourceId = async (
  resourceId: string,
) => {
  try {
    const token = (await Auth.currentSession()).getIdToken().getJwtToken()
    const operationName = 'deleteEventTriggerByResourceId'
    const query = `
      mutation deleteEventTriggerByResourceId($resourceId: String!) {
        delete_Event_Trigger(where: {resourceId: {_eq: $resourceId}}) {
          affected_rows
        }
      }
    `
    const variables = { resourceId }
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
    const data = {
      operationName,
      query,
      variables,
    }
    const response = await axios.post(
      hasuraApiUrl,
      data,
      config
    )

  } catch (e) {

  }
}

export const deleteEventTriggers = async (
  userId: string,
  resource: string,
  name: string,
) => {
  try {
    const token = (await Auth.currentSession()).getIdToken().getJwtToken()
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }

    const operationName = 'deleteEventTriggers'
    const query = `
      mutation deleteEventTriggers($userId: uuid!, $resource: String!, $name: String!) {
        delete_Event_Trigger(where: {userId: {_eq: $userId}, resource: {_eq: $resource}, name: {_eq: $name}}) {
          affected_rows
        }
      }
    `

    const variables = {
      userId,
      resource,
      name,
    }

    const data = {
      operationName,
      query,
      variables,
    }

    const results = await axios.post(hasuraApiUrl, data, config)


  } catch (e) {

  }
}

export const listGoogleCalendars = async (googleToken: string) => {
  try {
    let url = googleCalendarURL
    const config = {
      headers: {
        Authorization: `Bearer ${googleToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    }

    let isMore = true

    const calendarList: CalendarListItemResponseType[] = []

    while (isMore) {
      const results = await retry(async () => axios.get<CalendarListResponseType>(url, config), {
        delay: 200,
        factor: 2,
        maxAttempts: 5,
        maxDelay: 500
      })

      const items = results?.data?.items
      calendarList.push(...items)

      url = googleCalendarURL
      if (
        results?.data?.nextPageToken
      ) {
        let params: any = {}
        if (results?.data?.nextPageToken) {
          params.pageToken = results?.data?.nextPageToken
        }
        url = `${url}?${qs.stringify(params)}`
      } else {
        isMore = false
      }
    }

    return calendarList
  } catch (e) {

  }
}

export const triggerGoogleCalendarSync = async (
  calendarIntegrationId: string,
  calendarId: string,
  userId: string,
) => {
  try {
    if (!calendarIntegrationId) {

      return
    }

    if (!calendarId) {

      return
    }

    if (!userId) {

      return
    }
    const token = (await Auth.currentSession()).getIdToken().getJwtToken()

    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }

    const data = {
      calendarIntegrationId,
      calendarId,
      userId,
      isInitialSync: true,
      timezone: RNLocalize.getTimeZone(),
    }

    const url = googleCalendarSyncUrl

    const results = await axios.post(url, data, config)


  } catch (e) {

  }
}


export const triggerGooglePeopleSync = async (
  calendarIntegrationId: string,
  userId: string,
) => {
  try {

    if (!calendarIntegrationId) {

      return
    }

    if (!userId) {

      return
    }
    const token = (await Auth.currentSession()).getIdToken().getJwtToken()

    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }

    const data = {
      calendarIntegrationId,
      userId,
      isInitialSync: true,
    }

    const url = googlePeopleSyncUrl

    const results = await axios.post(url, data, config)


  } catch (e: any) {





  }
}

export const updateIntegration = async (
  client: ApolloClient<NormalizedCacheObject>,
  id: string,
  enabled?: boolean,
  token?: string,
  refreshToken?: string,
  expiresAt?: string,
  syncEnabled?: boolean,
  colors?: colorType[],
  pageToken?: string,
  syncToken?: string,
  clientType?: string,
) => {
  try {
    const updateCalendarIntegration = gql`
      mutation UpdateCalendarIntegrationById($id: uuid!, 
        ${enabled !== undefined ? '$enabled: Boolean,' : ''} 
        ${expiresAt !== undefined ? '$expiresAt: timestamptz,' : ''} 
        ${refreshToken !== undefined ? '$refreshToken: String,' : ''} 
        ${token !== undefined ? '$token: String,' : ''}
        ${syncEnabled !== undefined ? '$syncEnabled: Boolean,' : ''}
        ${colors !== undefined ? '$colors: jsonb,' : ''}
        ${pageToken !== undefined ? '$pageToken: String,' : ''}
        ${syncToken !== undefined ? '$syncToken: String,' : ''}
        ${clientType !== undefined ? '$clientType: String,' : ''}
        $updatedAt: timestamptz) {
          update_Calendar_Integration_by_pk(_set: {
            ${enabled !== undefined ? 'enabled: $enabled,' : ''} 
            ${expiresAt !== undefined ? 'expiresAt: $expiresAt,' : ''} 
            ${refreshToken !== undefined ? 'refreshToken: $refreshToken,' : ''} 
            ${token !== undefined ? 'token: $token,' : ''}
            ${syncEnabled !== undefined ? 'syncEnabled: $syncEnabled,' : ''}
            ${colors !== undefined ? 'colors: $colors,' : ''}
            ${pageToken !== undefined ? 'pageToken: $pageToken,' : ''}
            ${syncToken !== undefined ? 'syncToken: $syncToken,' : ''}
            ${clientType !== undefined ? 'clientType: $clientType,' : ''}
            updatedAt: $updatedAt}, pk_columns: {id: $id}) {
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
          }
      }
    `
    let variables: any = {
      id,
      updatedAt: dayjs().format(),
    }

    if (enabled !== undefined) {
      variables.enabled = enabled
    }

    if (expiresAt !== undefined) {
      if (expiresAt === null) {
        variables.expiresAt = null
      } else {
        variables.expiresAt = dayjs(expiresAt).format()
      }
    }

    if (refreshToken !== undefined) {
      variables.refreshToken = refreshToken
    }

    if (token !== undefined) {
      variables.token = token
    }

    if (syncEnabled !== undefined) {
      variables.syncEnabled = syncEnabled
    }

    if (colors !== undefined) {
      variables.colors = colors
    }

    if (pageToken !== undefined) {
      variables.pageToken = pageToken
    }

    if (syncToken !== undefined) {
      variables.syncToken = syncToken
    }

    if (clientType !== undefined) {
      variables.clientType = clientType
    }

    const results = (await client.mutate<{ update_Calendar_Integration_by_pk: CalendarIntegrationType }>({
      mutation: updateCalendarIntegration,
      variables,
    })).data.update_Calendar_Integration_by_pk

    return results
  } catch (e) {

  }
}

export const getIntegrationById = async (
  client: ApolloClient<NormalizedCacheObject>,
  id: string,
) => {
  try {
    const results = (await client.query<{
      Calendar_Integration_by_pk: CalendarIntegrationType
    }>({
      query: getCalendarIntegrationById,
      variables: {
        id,
      },
    })).data.Calendar_Integration_by_pk

    return results
  } catch (e) {

  }
}



export const createInitialCalendarIntegrations = async (
  client: ApolloClient<NormalizedCacheObject>,
  sub: string,
) => {
  try {
    const results = (await client.query<{
      Calendar_Integration: CalendarIntegrationType[]
    }>({
      query: listCalendarIntegrations,
      variables: { userId: sub },
    })).data.Calendar_Integration

    if (!(results?.length > 0) || !results) {
      const calendar_integrations = INTEGRATIONS.map(i => ({ ...i, userId: sub }))
      const { data } = await client.mutate<{ insert_Calendar_Integration: { returning: CalendarIntegrationType[] } }>({
        mutation: upsertCalendarIntegrations,
        variables: { calendar_integrations }
      })

    }
  } catch (e) {

  }
}

export const getAPIAuth = async (config: ConfigType) => {
  try {
    const authState = await authorize(config)

    const expiresAt = authState.accessTokenExpirationDate

    if (dayjs().isAfter(dayjs(expiresAt))) {
      const refreshedState = await refresh(config, {
        refreshToken: authState.refreshToken,
      })

      const {
        accessToken,
        refreshToken,
        accessTokenExpirationDate: expiresAt,
      } = refreshedState

      return { accessToken, refreshToken, expiresAt }
    }

    const { accessToken, refreshToken } = authState

    return { accessToken, refreshToken, expiresAt }
  } catch (e) {

  }
}


