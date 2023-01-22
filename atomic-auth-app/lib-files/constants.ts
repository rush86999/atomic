import { v4 as uuid } from 'uuid'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import duration from 'dayjs/plugin/duration'
import isBetween from 'dayjs/plugin/isBetween'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

dayjs.extend(isoWeek)
dayjs.extend(duration)
dayjs.extend(isBetween)
dayjs.extend(timezone)
dayjs.extend(utc)

export const IS_PRODUCTION = process.env.NODE_ENV === "production"
export const BASE_URL = process.env.BASE_URL || `https://${process.env.VERCEL_URL}`

export const hasuraGraphUrl = 'YOUR-HASURA-BACKEND/v1/graphql'

export const hasuraAdminSecret = process.env.HASURA_ADMIN_SECRET

export const googleTokenUrl = 'https://oauth2.googleapis.com/token'
export const googleClientSecretWeb = process.env.GOOGLE_CLIENT_SECRET_WEB
export const googleClientIdWeb = process.env.GOOGLE_CLIENT_ID_WEB
export const googleRedirectUrl = 'https://YOUR-AUTH-DOMAIN/api/google-calendar-handshake/oauth2callback'
export const handshakeUrl = process.env.HANDSHAKE_URL
export const zoomAuthUrl = 'https://zoom.us/oauth/authorize'
export const zoomResourceName = 'zoom'

export const appUrl = process.env.NEXT_PUBLIC_APP_URL