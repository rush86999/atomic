
export const bucketRegion = 'YOUR-AWS-REGION'
export const bucketName = 'YOUR-AWS-S3-BUCKET'

export const hasuraGraphUrl = 'YOUR-HASURA-BACKEND/v1/graphql'

export const hasuraAdminSecret = process.env.HASURA_ADMIN_SECRET
export const dayOfWeekIntToString = {
    1: 'MONDAY',
    2: 'TUESDAY',
    3: 'WEDNESDAY',
    4: 'THURSDAY',
    5: 'FRIDAY',
    6: 'SATURDAY',
    7: 'SUNDAY'
}

export const optaPlannerUrl = 'YOUR-PLANNER-DOMAIN'
export const optaPlannerUsername = process.env.OPTAPLANNER_USERNAME
export const optaPlannerPassword = process.env.OPTAPLANNER_PASSWORD

export const calendarProDelay = 90000
export const calendarFreeDelay = 60000

export const onOptaPlanCalendarAdminCallBackUrl = 'YOUR-BACKEND/prod/on-opta-plan-post-process-calendar-admin'

