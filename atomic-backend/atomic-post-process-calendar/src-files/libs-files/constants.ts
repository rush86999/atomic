
export const bucketRegion = 'YOUR-AWS-REGION'
export const bucketName = 'YOUR-AWS-S3-BUCKET-REGION'

export const hasuraGraphUrl = 'YOUR-HASURA-BACKEND/v1/graphql'

export const hasuraAdminSecret = process.env.HASURA_ADMIN_SECRET
export const authApiToken = process.env.API_TOKEN
export const dayOfWeekIntToString = {
    1: 'MONDAY',
    2: 'TUESDAY',
    3: 'WEDNESDAY',
    4: 'THURSDAY',
    5: 'FRIDAY',
    6: 'SATURDAY',
    7: 'SUNDAY'
}

export const optaPlannerUrl = 'YOUR-PLANNER-DOMAIN-API'
export const optaPlannerUsername = process.env.OPTAPLANNER_USERNAME
export const optaPlannerPassword = process.env.OPTAPLANNER_PASSWORD

export const calendarPremiumDelay = 300000
export const calendarProDelay = 60000
export const onOptaPlanCalendarAdminCallBackUrl = 'YOUR-BACKEND/prod/on-opta-plan-post-process-calendar-admin'

export const defaultFreemiumUsage = 5
export const text2VectorUrl = 'YOUR-BACKEND/text2vector'
export const openSearchEndPoint = 'YOUR-OPENSEARCH-ENDPOINT'
export const eventVectorName = 'event-vector'
export const vectorDimensions = 384
export const searchIndex = 'knn-events-index'
export const classificationUrl = 'YOUR-BACKEND/classification'
export const minThresholdScore = 0.6
export const externalMeetingLabel = 'External Meeting'
export const meetingLabel = 'Meeting'
export const googleCalendarResource = 'google'
export const googleClientIdIos = 'YOUR-GOOGLE-CLIENT-ID-IOS.apps.googleusercontent.com'
export const googleClientIdAndroid = 'YOUR-GOOGLE-CLIENT-ID-ANDROID.apps.googleusercontent.com'
export const googleClientIdWeb = 'YOUR-GOOGLE-CLIENT-ID-WEB.apps.googleusercontent.com'
export const googleTokenUrl = 'https://oauth2.googleapis.com/token'
export const googleClientSecretWeb = process.env.GOOGLE_CLIENT_SECRET_WEB
export const zoomResourceName = 'zoom'
export const zoomClientSecret = process.env.ZOOM_CLIENT_SECRET
export const zoomClientId = 'YOUR-ZOOM-CLIENT-ID'
export const zoomTokenUrl = 'https://zoom.us/oauth/token'
export const zoomBaseUrl = 'https://api.zoom.us/v2'
export const zoomBaseTokenUrl = 'https://zoom.us'
