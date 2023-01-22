

export const IS_PRODUCTION = process.env.NODE_ENV === "production"

export const hasuraGraphUrl = 'https://YOUR-HASURA-DOMAIN/v1/graphql'

export const hasuraAdminSecret = process.env.HASURA_ADMIN_SECRET
export const authApiToken = process.env.API_TOKEN
export const googleTokenUrl = 'https://oauth2.googleapis.com/token'

export const googleCalendarSyncStartUrl = 'YOUR-ATOMIC-AUTH-DOMAIN/api/google-calendar-handshake/start-handshake'
export const googleSignInNormalButton = '/images/google-signin-normal.png'
export const googleSignInDarkButton = '/images/google-signin-dark-normal.png'
export const messyDoodleSVG = '/MessyDoodle.svg'
export const meetingAssistAdminUrl = 'YOUR-BACKEND/prod/schedule-meeting-to-queue-admin'

type dayOfWeekIntToStringType = {
    [key: number]: string,
}

export const dayOfWeekIntToString: dayOfWeekIntToStringType = {
    1: 'MONDAY',
    2: 'TUESDAY',
    3: 'WEDNESDAY',
    4: 'THURSDAY',
    5: 'FRIDAY',
    6: 'SATURDAY',
    7: 'SUNDAY'
}

