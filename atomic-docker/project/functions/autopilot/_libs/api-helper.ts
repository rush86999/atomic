import got from "got"
import { getISODay } from 'date-fns'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import duration from 'dayjs/plugin/duration'
import isBetween from 'dayjs/plugin/isBetween'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import _ from "lodash"

import { AutopilotType, ScheduleAssistWithMeetingQueueBodyType,UserPreferenceType } from "./types"
import { authApiToken, featuresApplyAdminUrl, hasuraAdminSecret, hasuraGraphUrl, hasuraMetadataUrl, onScheduledTriggerDailyFeaturesApplyWebhookProdAdminUrl, onScheduledTriggerDailyScheduleAssistWebhookProdAdminUrl, scheduleAssistUrl } from "./constants"

dayjs.extend(isoWeek)
dayjs.extend(duration)
dayjs.extend(isBetween)
dayjs.extend(timezone)
dayjs.extend(utc)

function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min); // The maximum is inclusive and the minimum is inclusive
}


export const triggerFeaturesApplyUrl = async (
    body: ScheduleAssistWithMeetingQueueBodyType,
) => {
    try {
        const url = featuresApplyAdminUrl

        const res = await got.post(
            url, {
            headers: {
                'Authorization': `Basic ${Buffer.from(`admin:${authApiToken}`).toString('base64')}`,
                'content-type': 'application/json',
            },
            json: body,
        }
        ).json()

        console.log(res, ' successfully called featuresApplyAdminUrl')
    } catch (e) {
        console.log(e, ' unable to trigger features apply url')
    }
}

export const triggerScheduleAssistUrl = async (
    body: ScheduleAssistWithMeetingQueueBodyType,
) => {
    try {
        const url = scheduleAssistUrl

        const res = await got.post(
            url, {
            headers: {
                'Authorization': `Basic ${Buffer.from(`admin:${authApiToken}`).toString('base64')}`,
                'content-type': 'application/json',
            },
            json: body,
        }
        ).json()

        console.log(res, ' successfully called featuresApplyAdminUrl')
    } catch (e) {
        console.log(e, ' unable to trigger features apply url')
    }
}

export const getUserPreferences = async (userId: string): Promise<UserPreferenceType> => {
    try {
        if (!userId) {
            console.log('userId is null')
            return null
        }
        const operationName = 'getUserPreferences'
        const query = `
    query getUserPreferences($userId: uuid!) {
      User_Preference(where: {userId: {_eq: $userId}}) {
        startTimes
        endTimes
        backToBackMeetings
        copyAvailability
        copyCategories
        copyIsBreak
        copyModifiable
        copyPriorityLevel
        copyReminders
        copyTimeBlocking
        copyTimePreference
        createdDate
        deleted
        followUp
        id
        isPublicCalendar
        maxNumberOfMeetings
        maxWorkLoadPercent
        publicCalendarCategories
        reminders
        updatedAt
        userId
        minNumberOfBreaks
        breakColor
        breakLength
        copyColor
        copyIsExternalMeeting
        copyIsMeeting
        onBoarded
      }
    }    
  `
        const res: { data: { User_Preference: UserPreferenceType[] } } = await got.post(
            hasuraGraphUrl,
            {
                headers: {
                    'X-Hasura-Admin-Secret': hasuraAdminSecret,
                    'Content-Type': 'application/json',
                    'X-Hasura-Role': 'admin'
                },
                json: {
                    operationName,
                    query,
                    variables: {
                        userId,
                    },
                },
            },
        ).json()
        return res?.data?.User_Preference?.[0]
    } catch (e) {
        console.log(e, ' getUserPreferences')
    }
}

export const createDailyFeaturesApplyEventTrigger = async (
    autopilot: AutopilotType,
    body: ScheduleAssistWithMeetingQueueBodyType,
) => {
    try {
        const res: {
            message: string,
            event_id: string,
        } = await got.post(hasuraMetadataUrl, {
            headers: {
                'X-Hasura-Admin-Secret': hasuraAdminSecret,
                'X-Hasura-Role': 'admin',
                'content-type': 'application/json'
            },
            json: {
                type: 'create_scheduled_event',
                args: {
                    webhook: onScheduledTriggerDailyFeaturesApplyWebhookProdAdminUrl,
                    schedule_at: dayjs.utc(autopilot?.scheduleAt).format(),
                    payload: {
                        autopilot,
                        body,
                    },
                    headers: [
                        {
                            name: 'Authorization',
                            value: `Basic ${Buffer.from(`admin:${authApiToken}`).toString('base64')}`,
                        },
                        {
                            name: 'Content-Type',
                            value: 'application/json',
                        }
                    ]
                }
            }
        }).json()

        console.log(res?.message, ' successfully created  weekly scheduled trigger')
        return res?.event_id
    } catch (e) {
        console.log(e, ' unable to create weekly features apply event triggers')
    }
}

export const upsertAutopilotOne = async (
    autopilot: AutopilotType
) => {
    try {
        const operationName = 'UpsertAutopilotOne'
        const query = `
            mutation UpsertAutopilotOne($autopilot: Autopilot_insert_input!) {
                insert_Autopilot_one(object: $autopilot, on_conflict: {constraint: Autopilot_pkey, update_columns: [
                payload,
                scheduleAt,
                timezone,
                updatedAt,
                ]}) {
                createdDate
                id
                payload
                scheduleAt
                timezone
                updatedAt
                userId
                }
            }
          `

        const variables = {
            autopilot,
        }

        const res: { data: { insert_Autopilot_one: AutopilotType } } = await got.post(
            hasuraGraphUrl,
            {
                headers: {
                    'X-Hasura-Admin-Secret': hasuraAdminSecret,
                    'Content-Type': 'application/json',
                    'X-Hasura-Role': 'admin'
                },
                json: {
                    operationName,
                    query,
                    variables,
                },
            },
        ).json()

        console.log(res, ' successfully upserted autopilot one')

    } catch (e) {
        console.log(e, ' unable to upsert autopilot one')
    }
}

export const createInitialFeaturesApplyToEventTrigger = async (
    oldAutopilot: AutopilotType,
    oldBody: ScheduleAssistWithMeetingQueueBodyType,
) => {
    try {
        const userPreferences = await getUserPreferences(oldBody?.userId)
        const startTimes = userPreferences.startTimes
        const dayOfWeekInt = getISODay(dayjs(oldBody?.windowEndDate?.slice(0, 19)).tz(oldBody?.timezone, true).toDate())

        let newWindowStartDate = ''
        let newWindowEndDate = ''
        // for prod
        const startHour = startTimes.find(i => (i.day === dayOfWeekInt)).hour
        const randomStartHour = getRandomIntInclusive(0, startHour - 1)
        const randomStartMinute = getRandomIntInclusive(0, 59)
        newWindowStartDate = dayjs(oldBody?.windowStartDate?.slice(0, 19)).tz(oldBody?.timezone, true).hour(randomStartHour).minute(randomStartMinute).format()
        newWindowEndDate = dayjs(oldBody?.windowStartDate?.slice(0, 19)).tz(oldBody?.timezone, true).hour(randomStartHour).minute(randomStartMinute).add(6, 'd').format()

        // for dev
        // newWindowStartDate = dayjs(oldBody?.windowStartDate?.slice(0, 19)).tz(oldBody?.timezone, true).format()
        // newWindowEndDate = dayjs(oldBody?.windowStartDate?.slice(0, 19)).tz(oldBody?.timezone, true).add(6, 'd').format()

        const newBody: ScheduleAssistWithMeetingQueueBodyType = {
            ...oldBody,
            windowStartDate: newWindowStartDate,
            windowEndDate: newWindowEndDate,
        }

        const newAutopilot: AutopilotType = {
            ...oldAutopilot,
            scheduleAt: dayjs(newWindowStartDate?.slice(0, 19)).tz(oldAutopilot?.timezone, true).utc().format(),
            updatedAt: dayjs().format(),
            payload: newBody,
        }

        const autopilotId = await createDailyFeaturesApplyEventTrigger(
            newAutopilot,
            newBody,
        )

        newAutopilot.id = autopilotId

        await upsertAutopilotOne(newAutopilot)


    } catch (e) {
        console.log(e, ' unable to create initial features apply to event trigger')
    }
}

export const listAutopilotsGivenUserId = async (
    userId: string,
) => {
    try {
        const operationName = 'ListAutopilotsGivenUserId'
        const query = `
            query ListAutopilotsGivenUserId($userId: uuid!) {
                Autopilot(where: {userId: {_eq: $userId}}) {
                    createdDate
                    id
                    payload
                    scheduleAt
                    timezone
                    updatedAt
                    userId
                }
            }
        `

        const variables = {
            userId,
        }

        const res: { data: { Autopilot: AutopilotType[] } } = await got.post(
            hasuraGraphUrl,
            {
                headers: {
                    'X-Hasura-Admin-Secret': hasuraAdminSecret,
                    'Content-Type': 'application/json',
                    'X-Hasura-Role': 'admin'
                },
                json: {
                    operationName,
                    query,
                    variables,
                },
            },
        ).json()

        console.log(res, ' successfully listed autopilots given userId')

        return res?.data?.Autopilot?.[0]

    } catch (e) {
        console.log(e, ' unable to listAutopilotGivenUserId')
    }
}

export const deleteAutopilotGivenId = async (
    id: string,
) => {
    try {
        const operationName = 'DeleteAutopilotById'
        const query = `
            mutation DeleteAutopilotById($id: uuid!) {
                delete_Autopilot_by_pk(id: $id) {
                createdDate
                id
                payload
                scheduleAt
                timezone
                updatedAt
                userId
                }
            }
          `
        const variables = {
            id,
        }

        const res: { data: { delete_Autopilot_by_pk: AutopilotType } } = await got.post(
            hasuraGraphUrl,
            {
                headers: {
                    'X-Hasura-Admin-Secret': hasuraAdminSecret,
                    'Content-Type': 'application/json',
                    'X-Hasura-Role': 'admin'
                },
                json: {
                    operationName,
                    query,
                    variables,
                },
            },
        ).json()

        console.log(res, ' deleted autopilot by id')
    } catch (e) {
        console.log(e, ' unable to delete autopilot')
    }
}

export const onScheduleDailyFeaturesApply7DayWindowToEventTrigger = async (
    oldAutopilot: AutopilotType,
    oldBody: ScheduleAssistWithMeetingQueueBodyType,
) => {
    try {
        // validate

        const dbAutopilot = await listAutopilotsGivenUserId(oldAutopilot?.userId)

        if (!dbAutopilot?.id) {
            console.log(dbAutopilot?.id, ' autopilot deleted')
            return
        }

        await triggerFeaturesApplyUrl(oldBody)

        const userPreferences = await getUserPreferences(oldBody?.userId)
        const startTimes = userPreferences.startTimes
        const dayOfWeekInt = getISODay(dayjs(oldBody?.windowEndDate?.slice(0, 19)).tz(oldBody?.timezone, true).toDate())

        let newWindowStartDate = ''
        let newWindowEndDate = ''
        // prod
        const startHour = startTimes.find(i => (i.day === dayOfWeekInt)).hour
        const randomStartHour = getRandomIntInclusive(0, startHour - 1)
        const randomStartMinute = getRandomIntInclusive(0, 59)
        newWindowStartDate = dayjs(oldBody?.windowStartDate?.slice(0, 19)).tz(oldBody?.timezone, true).hour(randomStartHour).minute(randomStartMinute).add(1, 'd').format()
        newWindowEndDate = dayjs(oldBody?.windowStartDate?.slice(0, 19)).tz(oldBody?.timezone, true).hour(randomStartHour).minute(randomStartMinute).add(7, 'd').format()

        // dev
        // newWindowStartDate = dayjs(oldBody?.windowStartDate?.slice(0, 19)).tz(oldBody?.timezone, true).add(5, 'm').format()
        // newWindowEndDate = dayjs(oldBody?.windowStartDate?.slice(0, 19)).tz(oldBody?.timezone, true).add(5, 'm').add(6, 'd').format()

        const newBody: ScheduleAssistWithMeetingQueueBodyType = {
            ...oldBody,
            windowStartDate: newWindowStartDate,
            windowEndDate: newWindowEndDate,
        }

        const newAutopilot: AutopilotType = {
            ...oldAutopilot,
            scheduleAt: dayjs(newWindowStartDate?.slice(0, 19)).tz(oldAutopilot?.timezone, true).utc().format(),
            updatedAt: dayjs().format(),
            payload: newBody,
        }

        const autopilotId = await createDailyFeaturesApplyEventTrigger(
            newAutopilot,
            newBody,
        )

        newAutopilot.id = autopilotId

        await deleteAutopilotGivenId(dbAutopilot.id)

        await upsertAutopilotOne(newAutopilot)

    } catch (e) {
        console.log(e, ' unable to schedule daily schedule assist event triggers')
    }
}

export const upsertAutopilotMany = async (
    autopilots: AutopilotType[],
) => {
    try {
        const operationName = 'UpsertAutopilotMany'
        const query = `
        mutation UpsertAutopilotMany($autopilots: [Autopilot_insert_input!]!) {
            insert_Autopilot(objects: $autopilots, on_conflict: {constraint: Autopilot_pkey, update_columns: [
                   payload,
                scheduleAt,
                timezone,
                updatedAt,
            ]}) {
              affected_rows
              returning {
                createdDate
                id
                payload
                scheduleAt
                timezone
                updatedAt
                userId
              }
            }
          }
          `
        const variables = {
            autopilots,
        }
        const res: { data: { insert_Autopilot: AutopilotType[] } } = await got.post(
            hasuraGraphUrl,
            {
                headers: {
                    'X-Hasura-Admin-Secret': hasuraAdminSecret,
                    'Content-Type': 'application/json',
                    'X-Hasura-Role': 'admin'
                },
                json: {
                    operationName,
                    query,
                    variables,
                },
            },
        ).json()

        console.log(res, ' successfully upserted autopilot many')
    } catch (e) {
        console.log(e, ' unable to upsert autopilots many')
    }
}

export const getAutopilotGivenId = async (
    id: string,
) => {
    try {
        const operationName = 'GetAutopilotById'
        const query = `
            query GetAutopilotById($id: uuid!) {
                Autopilot_by_pk(id: $id) {
                createdDate
                id
                payload
                scheduleAt
                timezone
                updatedAt
                userId
                }
            }
        `

        const variables = {
            id,
        }

        const res: { data: { Autopilot_by_pk: AutopilotType } } = await got.post(
            hasuraGraphUrl,
            {
                headers: {
                    'X-Hasura-Admin-Secret': hasuraAdminSecret,
                    'Content-Type': 'application/json',
                    'X-Hasura-Role': 'admin'
                },
                json: {
                    operationName,
                    query,
                    variables,
                },
            },
        ).json()

        console.log(res, ' successfully got autopilot given Id')

        return res?.data?.Autopilot_by_pk

    } catch (e) {
        console.log(e, ' unable to get autopilot given Id')
    }
}

export const deleteScheduledEventForAutopilot = async (
    eventId: string,
) => {
    try {
        const jsonBody = {
            type: 'delete_scheduled_event',
            args: {
                type: 'one_off',
                event_id: eventId,
            }
        }

        const res = await got.post(
            hasuraMetadataUrl,
            {
                headers: {
                    'X-Hasura-Admin-Secret': hasuraAdminSecret,
                    'Content-Type': 'application/json',
                    'X-Hasura-Role': 'admin'
                },
                json: jsonBody,
            }
        ).json()

        console.log(res, ' successfully deleted scheduled event trigger')
    } catch (e) {
        console.log(e, ' unable to delete scheduled event for autopilot')
    }
}

