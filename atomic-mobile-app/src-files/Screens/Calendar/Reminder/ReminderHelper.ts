import { v4 as uuid } from 'uuid'
import { dayjs, RNLocalize } from '@app/date-utils'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

 dayjs.extend(utc)
// dayjs.extend(timezone)

import { ApolloClient, gql, NormalizedCacheObject } from '@apollo/client'
import deleteRemindersForEventId from '@app/apollo/gql/deleteRemindersForEventId'
import listRemindersForEventId from '@app/apollo/gql/listRemindersForEventId'
import deleteRemindersForEventIds from '@app/apollo/gql/deleteRemindersForEventIds'
import { ReminderType } from '@app/dataTypes/ReminderType'


export const deleteRemindersForEvents = async (
  client: ApolloClient<NormalizedCacheObject>,
  eventIds: string[],
  userId: string,
) => {
  try {
    const results = (await client.mutate<{ delete_Reminder: { affected_rows: number } }>({
      mutation: deleteRemindersForEventIds,
      variables: {
        eventIds,
        userId,
      },
    })).data?.delete_Reminder?.affected_rows
    return results
  } catch (e) {

  }
}
export const removeRemindersForEvent = async (
  client: ApolloClient<NormalizedCacheObject>,
  eventId: string,
) => {
  try {
    const results = (await client.mutate<{ delete_Reminder: { affected_rows: number, returning: ReminderType[] } }>({
      mutation: deleteRemindersForEventId,
      variables: {
        eventId,
      },
      update(cache, { data }) {
        const deletedReminders = data?.delete_Reminder?.returning
        const normalizedIds = deletedReminders.map(c => cache.identify({ id: c.id, __typename: c.__typename }))
        normalizedIds.forEach(id => cache.evict({ id }))
        cache.gc()
      }
    })).data?.delete_Reminder?.affected_rows

    return results
  } catch (e) {

  }
}

export const updateRemindersForEvent = async (
  client: ApolloClient<NormalizedCacheObject>,
  eventId: string,
  userId: string,
  alarms?: string[] | number[],
  timezone?: string,
  useDefaultAlarms?: boolean,
) => {
  try {

    await removeRemindersForEvent(client, eventId)
    if (alarms) {
      const reminderValues = alarms?.map((a) => generateReminderValues(
        userId,
        eventId,
        (typeof a === 'string') && a,
        timezone || RNLocalize.getTimeZone(),
        (typeof a === 'number') && a,
        useDefaultAlarms,
      ))
      await createRemindersForEvent(client, reminderValues)
    }
  } catch (e) {

  }
}

const generateReminderValues = (
  userId: string,
  eventId: string,
  reminderDate?: string,
  timezone?: string,
  minutes?: number,
  useDefault?: boolean,
) => {
  const reminderValueToUpsert: any = {
    id: uuid(),
    userId,
    eventId,
    deleted: false,
    updatedAt: dayjs().toISOString(),
    createdDate: dayjs().toISOString()
  }

  /**
   *  reminderDate,
    timezone,
    minutes,
    useDefault,
   */
  if (reminderDate) {
    reminderValueToUpsert.reminderDate = reminderDate
  }

  if (timezone) {
    reminderValueToUpsert.timezone = timezone
  }

  if (minutes) {
    reminderValueToUpsert.minutes = minutes
  }

  if (useDefault !== undefined) {
    reminderValueToUpsert.useDefault = useDefault
  }

  return reminderValueToUpsert
}

export const createRemindersForEvent = async (
  client: ApolloClient<NormalizedCacheObject>,
  reminderValuesToUpsert: ReminderType[],
) => {
  try {

    const upsertReminder = gql`
    mutation InsertReminder($reminders: [Reminder_insert_input!]!) {
            insert_Reminder(
                objects: $reminders,
                on_conflict: {
                    constraint: Reminder_pkey,
                    update_columns: [
                      eventId,
                      reminderDate,
                      timezone,
                      method,
                      minutes,
                      useDefault,
                      updatedAt,
                      deleted
                    ]
                }) {
                  affected_rows
                  returning {
                    id
                    reminderDate
                    eventId
                    timezone
                    method
                    minutes
                    useDefault
                    deleted
                    createdDate
                    updatedAt
                    userId
                  }
                }
              }   
       `
    const results = (await client.mutate<{ insert_Reminder: { returning: ReminderType[], affected_rows: number } }>({
      mutation: upsertReminder,
      variables: {
        reminders: reminderValuesToUpsert,
      },
      update(cache, { data }) {
        if (data?.insert_Reminder?.affected_rows > 0) {

        }

        cache.modify({
          fields: {
            Reminder(existingReminders = []) {
              const newReminderRefs = data?.insert_Reminder?.returning.map(c => (cache.writeFragment({
                data: c,
                fragment: gql`
                    fragment NewReminder on Reminder {
                      id
                      reminderDate
                      eventId
                      timezone
                      method
                      minutes
                      useDefault
                      deleted
                      createdDate
                      updatedAt
                      userId
                    }
                  `
              })))
              return [...existingReminders, ...newReminderRefs];
            }
          }
        })
      }
    })).data?.insert_Reminder?.returning


    return results
  } catch (e) {

  }
}

export const createReminderForEvent = async (
  client: ApolloClient<NormalizedCacheObject>,
  userId: string,
  eventId: string,
  reminderDate?: string,
  timezone?: string,
  minutes?: number,
  useDefault?: boolean,
) => {
  try {
    const reminderValueToUpsert: any = {
      id: uuid(),
      userId,
      eventId,
      deleted: false,
      updatedAt: dayjs().toISOString(),
      createdDate: dayjs().toISOString()
    }

    /**
     *  reminderDate,
      timezone,
      minutes,
      useDefault,
     */
    if (reminderDate) {
      reminderValueToUpsert.reminderDate = reminderDate
    }

    if (timezone) {
      reminderValueToUpsert.timezone = timezone
    }

    if (minutes) {
      reminderValueToUpsert.minutes = minutes
    }

    if (useDefault !== undefined) {
      reminderValueToUpsert.useDefault = useDefault
    }


    const upsertReminder = gql`
    mutation InsertReminder($reminders: [Reminder_insert_input!]!) {
            insert_Reminder(
                objects: $reminders,
                on_conflict: {
                    constraint: Reminder_pkey,
                    update_columns: [
                      eventId,
                      ${reminderDate ? 'reminderDate,' : ''},
                      ${timezone ? 'timezone,' : ''},
                      method,
                      ${minutes ? 'minutes,' : ''},
                      ${useDefault ? 'useDefault,' : ''},
                      updatedAt,
                      deleted
                    ]
                }) {
                  affected_rows
                  returning {
                    id
                    reminderDate
                    eventId
                    timezone
                    method
                    minutes
                    useDefault
                    deleted
                    createdDate
                    updatedAt
                    userId
                  }
                }
              }
       `
    const results = (await client.mutate<{ insert_Reminder: { returning: ReminderType[], affected_rows: number } }>({
      mutation: upsertReminder,
      variables: {
        reminders: [reminderValueToUpsert],
      },
      update(cache, { data }) {
        if (data?.insert_Reminder?.affected_rows > 0) {

        }

        cache.modify({
          fields: {
            Reminder(existingReminders = []) {
              const newReminderRefs = data?.insert_Reminder?.returning.map(c => (cache.writeFragment({
                data: c,
                fragment: gql`
                    fragment NewReminder on Reminder {
                      id
                      reminderDate
                      eventId
                      timezone
                      method
                      minutes
                      useDefault
                      deleted
                      createdDate
                      updatedAt
                      userId
                    }
                  `
              })))
              return [...existingReminders, ...newReminderRefs];
            }
          }
        })
      }
    })).data?.insert_Reminder?.returning


    return results
  } catch (e) {

  }
}

export const listRemindersForEvent = async (
  client: ApolloClient<NormalizedCacheObject>,
  eventId: string
) => {
  try {
    const results = (await client.query<{ Reminder: ReminderType[] }>({
      query: listRemindersForEventId,
      variables: {
        eventId,
      },
    })).data?.Reminder

    return results
  } catch (e) {

  }
}
/** end */
