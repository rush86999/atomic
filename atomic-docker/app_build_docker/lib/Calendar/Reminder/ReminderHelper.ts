import { v4 as uuid } from 'uuid'
import { dayjs } from '@lib/date-utils'

// dayjs.extend(utc)
// dayjs.extend(timezone)

import { ApolloClient, gql, NormalizedCacheObject } from '@apollo/client'
import deleteRemindersForEventId from '@lib/apollo/gql/deleteRemindersForEventId'
import listRemindersForEventId from '@lib/apollo/gql/listRemindersForEventId'
import deleteRemindersForEventIds from '@lib/apollo/gql/deleteRemindersForEventIds'
import { ReminderType } from '@lib/dataTypes/ReminderType'


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
    console.log(e, ' error removing reminders')
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
    console.log(results, ' results inside removeRemindersForEvent')
    return results
  } catch (e) {
    console.log(e, ' error removing reminders')
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
    console.log(alarms, ' alarms inside updateRemindersForEvent')
    await removeRemindersForEvent(client, eventId)
    if (alarms) {
      const reminderValues = alarms?.map((a) => generateReminderValues(
        userId,
        eventId,
        (typeof a === 'string') && a,
        timezone || dayjs.tz.guess(),
        (typeof a === 'number') && a,
        useDefaultAlarms,
      ))
      await createRemindersForEvent(client, reminderValues)
    }
  } catch (e) {
    console.log(e, ' error updating reminders')
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
    console.log(reminderValuesToUpsert, ' reminderValuesToUpsert inside createRemindersForEvent')
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
          console.log('insert_Reminder', data)
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

    console.log(results, ' results inside createRemindersForEvent')
    return results
  } catch (e) {
    console.log(e, ' error creating reminders')
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
          console.log('insert_Reminder', data)
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

    console.log(results, ' results inside createReminderForEvent')
    return results
  } catch (e) {
    console.log(e, ' unable to create reminder for event')
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
    console.log(results, ' Reminder - inside listRemindersForEvents')
    return results
  } catch (e) {
    console.log(e, ' unable to list reminders for event')
  }
}
/** end */
