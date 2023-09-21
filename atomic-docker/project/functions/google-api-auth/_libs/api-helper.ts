import got from 'got'

import { google } from 'googleapis'

import dayjs from 'dayjs'

import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { googleAuthRedirectUri, googleClientIdAtomicWeb, googleClientIdIos, googleClientIdWeb, googleClientSecretAtomicWeb, googleClientSecretWeb, googleTokenUrl } from './constants'
import { RefreshTokenResponseBodyType } from './types'

dayjs.extend(utc)
dayjs.extend(timezone)


export const getGoogleTokenAndRefreshToken = async (code: string) => {
    try {
        const oauth2Client = new google.auth.OAuth2(
            googleClientIdWeb,
            googleClientSecretWeb,
            googleAuthRedirectUri,
        )

        const { tokens } = await oauth2Client.getToken(code)

        return tokens
    } catch (e) {
        console.log(e, ' unable to get google token and refresh token')
    }
}


export const googleCalendarAtomicWebRefreshToken = async (refreshToken: string): Promise<RefreshTokenResponseBodyType> => {
    try {
        const res: RefreshTokenResponseBodyType = await got.post(
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

        console.log(res, ' refresh token success')
        return res
    } catch (e) {
        console.log(e, ' unable to refresh token')
    }
}
export const googleCalendarWebRefreshToken = async (refreshToken: string): Promise<RefreshTokenResponseBodyType> => {
    try {
        const res: RefreshTokenResponseBodyType = await got.post(
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

        console.log(res, ' refresh token success')
        return res
    } catch (e) {
        console.log(e, ' unable to refresh token')
    }
}

export const googleCalendarIosRefreshToken = async (refreshToken: string): Promise<RefreshTokenResponseBodyType> => {
    try {
        const res: RefreshTokenResponseBodyType = await got.post(
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

        console.log(res, ' refresh token success')
        return res
    } catch (e) {
        console.log(e, ' unable to refresh token')
    }
}


