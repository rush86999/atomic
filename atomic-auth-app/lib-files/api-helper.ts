import got from "got"
import { v4 as uuid } from 'uuid'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import duration from 'dayjs/plugin/duration'
import isBetween from 'dayjs/plugin/isBetween'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import _ from "lodash"
import { googleClientIdWeb, googleClientSecretWeb, googleRedirectUrl, googleTokenUrl, hasuraAdminSecret, hasuraGraphUrl } from "@lib/constants"
import { CalendarIntegrationType, ZoomWebhookRequestType, ZoomWebhookValidationRequestType } from "@lib/types"
import { google } from 'googleapis'
import type { NextApiResponse } from 'next'
import crypto, { BinaryLike } from 'crypto'


dayjs.extend(isoWeek)
dayjs.extend(duration)
dayjs.extend(isBetween)
dayjs.extend(timezone)
dayjs.extend(utc)

const oauth2Client = new google.auth.OAuth2(
    googleClientIdWeb,
    googleClientSecretWeb,
    googleRedirectUrl,
)




export const validateZoomWebook = (request: ZoomWebhookValidationRequestType, response: NextApiResponse) => {
    const hashForValidate = crypto.createHmac('sha256', process.env.ZOOM_WEBHOOK_SECRET_TOKEN as BinaryLike).update(request.body.payload.plainToken).digest('hex')

    return response.status(200).json({
        plainToken: request.body.payload.plainToken,
        encryptedToken: hashForValidate
    })

}

export const verifyZoomWebhook = (request: ZoomWebhookRequestType) => {
    const message = `v0:${request.headers['x-zm-request-timestamp']}:${JSON.stringify(request.body)}`

    const hashForVerify = crypto.createHmac('sha256', process.env.ZOOM_WEBHOOK_SECRET_TOKEN as BinaryLike).update(message).digest('hex')

    const signature = `v0=${hashForVerify}`

    if (request.headers['x-zm-signature'] === signature) {
        // Webhook request came from Zoom
        return true
    }

    throw new Error('Failed zoom webhook verification using secret token & sha256')
}



export const exchangeCodeForTokens = async (code: string) => {
    try {
        let { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens)
        return tokens
    } catch (e) {

    }
}

export const generateGoogleAuthUrl = (state: string) => {


    // Access scopes for read-only Drive activity.
    const scopes = [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/contacts.readonly'
    ]

    // Generate a url that asks permissions for the Calendar activity scope
    const authorizationUrl = oauth2Client.generateAuthUrl({
        // 'online' (default) or 'offline' (gets refresh_token)
        access_type: 'online',
        /** Pass in the scopes array defined above.
          * Alternatively, if only one scope is needed, you can pass a scope URL as a string */
        scope: scopes,
        // Enable incremental authorization. Recommended as a best practice.
        include_granted_scopes: true,
        state,
    })



    return authorizationUrl
}



export const getMinimalCalendarIntegration = async (
    userId: string,
    resource: string,
) => {
    try {
        const operationName = 'getCalendarIntegration'
        const query = `
      query getCalendarIntegration($userId: uuid!, $resource: String!) {
        Calendar_Integration(where: {userId: {_eq: $userId}, resource: {_eq: $resource}}) {
            appAccountId
            appEmail
            appId
            clientType
            colors
            contactEmail
            contactFirstName
            contactLastName
            contactName
            createdDate
            deleted
            enabled
            expiresAt
            id
            name
            pageToken
            password
            phoneCountry
            phoneNumber
            refreshToken
            resource
            syncEnabled
            syncToken
            token
            updatedAt
            userId
            username
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

export const refreshGoogleToken = async (
    refreshToken: string,
    clientType: 'ios' | 'android' | 'web'
): Promise<{
    access_token: string,
    expires_in: number, // add seconds to now
    scope: string,
    token_type: string
} | undefined> => {
    try {



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


export const getGoogleAPIToken = async (
    userId: string,
    resource: string,
    clientType: 'ios' | 'android' | 'web',
) => {
    let integrationId = ''
    try {
        const res = await getMinimalCalendarIntegration(userId, resource)
        if (!res) {

            throw new Error('no calendar integration available')
        }

        const { id, token, expiresAt, refreshToken } = res
        if (!refreshToken) {
            throw new Error('no refresh token provided from calendar integration')
        }
        integrationId = id

        if (dayjs().isAfter(dayjs(expiresAt)) || !token) {
            const res = await refreshGoogleToken(refreshToken, clientType)

            if (res) {
                await updateAccessTokenCalendarIntegration(id, res.access_token, res.expires_in)
                return res.access_token
            }
        }
        return token
    } catch (e) {

        await updateAccessTokenCalendarIntegration(integrationId, null, null, false)
    }
}

export const deAuthZoomGivenUserId = async (
    appId: string,
) => {
    try {
        const operationName = 'DeAuthZoomByAppId'
        const query = `
            mutation DeAuthZoomByAppId($appId: String!) {
                update_Calendar_Integration(where: {appId: {_eq: $appId}}, _set: {expiresAt: null, refreshToken: null, token: null, enabled: false, syncEnabled: false}) {
                    affected_rows
                    returning {
                        appAccountId
                        appEmail
                        appId
                        clientType
                        colors
                        contactEmail
                        contactFirstName
                        contactLastName
                        contactName
                        createdDate
                        deleted
                        enabled
                        expiresAt
                        id
                        name
                        pageToken
                        password
                        phoneCountry
                        phoneNumber
                        refreshToken
                        resource
                        syncEnabled
                        syncToken
                        token
                        updatedAt
                        userId
                        username
                    }
                }
            }
        `

        const variables = {
            appId,
        }

        const res: { data: { update_Calendar_Integration: { affected_rows: number, returning: CalendarIntegrationType[] } } } = await got.post(
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

export const updateAccessTokenCalendarIntegration = async (
    id: string,
    token: string | null,
    expiresIn: number | null,
    enabled?: boolean,
    refreshToken?: string | null,
) => {
    try {
        const operationName = 'updateCalendarIntegration'
        const query = `
      mutation updateCalendarIntegration($id: uuid!,${token !== undefined ? ' $token: String,' : ''}${refreshToken !== undefined ? ' $refreshToken: String,' : ''}${expiresIn !== undefined ? ' $expiresAt: timestamptz,' : ''}${enabled !== undefined ? ' $enabled: Boolean,' : ''}) {
        update_Calendar_Integration_by_pk(pk_columns: {id: $id}, _set: {${token !== undefined ? 'token: $token,' : ''}${refreshToken !== undefined ? ' refreshToken: $refreshToken,' : ''}${expiresIn !== undefined ? ' expiresAt: $expiresAt,' : ''}${enabled !== undefined ? ' enabled: $enabled,' : ''}}) {
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
        let variables: any = {
            id,
            token,
            expiresAt: expiresIn ? dayjs().add(expiresIn, 'seconds').toISOString() : null,

        }

        if (enabled !== undefined) {
            variables.enabled = enabled
        }

        if (refreshToken !== undefined) {
            variables.refreshToken = refreshToken
        }

        const res: { data: { update_Calendar_Integration_by_pk: CalendarIntegrationType } } = await got.post(
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


export const updateZoomIntegration = async (
    id: string,
    appAccountId: string,
    appEmail: string,
    appId: string,
    token: string | null,
    expiresIn: number | null,
    refreshToken?: string,
    contactFirstName?: string,
    contactLastName?: string,
    phoneCountry?: string, // 'US'
    phoneNumber?: string, // '+1 1234567891'
    enabled?: boolean,
) => {
    try {
        //${token !== undefined ? ' $token: String,' : ''}
        // 
        const operationName = 'updateCalendarIntegrationById'
        const query = `
            mutation updateCalendarIntegrationById(
                    $id: uuid!,
                    $appAccountId: String!,
                    $appEmail: String!,
                    $appId: String!,
                    ${token !== undefined ? ' $token: String,' : ''}
                    ${refreshToken !== undefined ? ' $refreshToken: String,' : ''}
                    ${expiresIn !== undefined ? ' $expiresAt: timestamptz,' : ''}
                    ${enabled !== undefined ? ' $enabled: Boolean,' : ''}
                    ${contactFirstName !== undefined ? ' $contactFirstName: String,' : ''}
                    ${contactLastName !== undefined ? ' $contactLastName: String,' : ''}
                    ${phoneCountry !== undefined ? ' $phoneCountry: String,' : ''}
                    ${phoneNumber !== undefined ? ' $phoneNumber: String,' : ''}
                ) {
                update_Calendar_Integration_by_pk(pk_columns: {id: $id}, _set: {
                    appAccountId: $appAccountId,
                    appEmail: $appEmail,
                    appId: $appId,
                    ${token !== undefined ? 'token: $token,' : ''}
                    ${expiresIn !== undefined ? ' expiresAt: $expiresAt,' : ''}
                    ${refreshToken !== undefined ? 'refreshToken: $refreshToken,' : ''}
                    ${contactFirstName !== undefined ? 'contactFirstName: $contactFirstName,' : ''}
                    ${contactLastName !== undefined ? 'contactLastName: $contactLastName,' : ''}
                    ${phoneCountry !== undefined ? 'phoneCountry: $phoneCountry,' : ''}
                    ${phoneNumber !== undefined ? 'phoneNumber: $phoneNumber,' : ''}
                    ${enabled !== undefined ? ' enabled: $enabled,' : ''}
                }) {
                    appAccountId
                    appEmail
                    appId
                    clientType
                    colors
                    contactEmail
                    contactFirstName
                    contactLastName
                    contactName
                    createdDate
                    deleted
                    enabled
                    expiresAt
                    id
                    name
                    pageToken
                    password
                    phoneCountry
                    phoneNumber
                    refreshToken
                    resource
                    syncEnabled
                    syncToken
                    token
                    updatedAt
                    userId
                    username
                }
            }
        `

        const variables = {
            id,
            appAccountId,
            appEmail,
            appId,
            token,
            expiresAt: expiresIn ? dayjs().add(expiresIn, 'seconds').toISOString() : null,
            refreshToken,
            contactFirstName,
            contactLastName,
            phoneCountry,
            phoneNumber,
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



