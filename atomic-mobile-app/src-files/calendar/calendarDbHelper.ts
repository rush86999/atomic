import { CalendarType } from "@app/dataTypes/CalendarType";
import { CalendarListItemResponseType } from "@app/calendar/types";
import { googleCalendarResource } from '@app/calendar/constants';
import _ from "lodash";
import { ApolloClient, gql, NormalizedCacheObject } from "@apollo/client";
import deleteCalendarById from "@app/apollo/gql/deleteCalendarById";
import deleteEventsByCalendarIdMutation from "@app/apollo/gql/deleteEventsByCalendarIdMutation";
import deleteCalendarsByIds from "@app/apollo/gql/deleteCalendarsByIds";
import getCalendarWithResource from "@app/apollo/gql/getCalendarWithResource";
import { EventType } from "@app/dataTypes/EventType";
import getEventById from "@app/apollo/gql/getEventById";

export const upsertCalendar = async (
    client: ApolloClient<NormalizedCacheObject>,
    calendar: CalendarType,
) => {
    try {


        const upsertCalendarMutation = gql`
        mutation InsertCalendar($calendars: [Calendar_insert_input!]!) {
            insert_Calendar(objects: $calendars, on_conflict: {constraint: Calendar_pkey, update_columns: [
                ${calendar?.title ? 'title,' : ''} 
                ${calendar?.colorId ? 'colorId,' : ''} 
                ${calendar?.account ? 'account,' : ''} 
                ${calendar?.accessLevel ? 'accessLevel,' : ''} 
                ${calendar?.resource ? 'resource,' : ''} 
                ${calendar?.modifiable !== undefined ? 'modifiable,' : ''} 
                ${calendar?.defaultReminders?.length > 0 ? 'defaultReminders,' : ''} 
                ${calendar?.globalPrimary !== undefined ? 'globalPrimary,' : ''} 
                ${calendar?.backgroundColor ? 'backgroundColor,' : ''} 
                ${calendar?.foregroundColor ? 'foregroundColor,' : ''} 
                ${calendar?.deleted !== undefined ? 'deleted,' : ''} 
                ${calendar?.updatedAt ? 'updatedAt,' : ''}
                ${calendar?.pageToken ? 'pageToken,' : ''} 
                ${calendar?.syncToken ? 'syncToken,' : ''} 
            ]}) {
                returning {
                    id
                    title
                    colorId
                    account
                    accessLevel
                    modifiable
                    resource
                    defaultReminders
                    globalPrimary
                    deleted
                    createdDate
                    updatedAt
                    userId
                    foregroundColor
                    backgroundColor
                    pageToken
                    syncToken
                }
                affected_rows
            }
        }
        `
        let valueToUpsert: any = {
            id: calendar?.id,
            createdDate: calendar?.createdDate,
            updatedAt: calendar?.updatedAt,
            userId: calendar?.userId,
            deleted: calendar?.deleted,
        }

        if (calendar?.title) {
            valueToUpsert = {
                ...valueToUpsert,
                title: calendar.title,
            }
        }

        if (calendar?.colorId) {
            valueToUpsert = {
                ...valueToUpsert,
                colorId: calendar.colorId,
            }
        }

        if (calendar?.account) {
            valueToUpsert = {
                ...valueToUpsert,
                account: calendar.account,
            }
        }

        if (calendar?.accessLevel) {
            valueToUpsert = {
                ...valueToUpsert,
                accessLevel: calendar.accessLevel,
            }
        }

        if (calendar?.resource) {
            valueToUpsert = {
                ...valueToUpsert,
                resource: calendar.resource,
            }
        }

        if (calendar?.modifiable !== undefined) {
            valueToUpsert = {
                ...valueToUpsert,
                modifiable: calendar.modifiable,
            }
        }

        if (calendar?.defaultReminders?.length > 0) {
            valueToUpsert = {
                ...valueToUpsert,
                defaultReminders: calendar.defaultReminders,
            }
        }

        if (calendar?.globalPrimary !== undefined) {
            valueToUpsert = {
                ...valueToUpsert,
                globalPrimary: calendar.globalPrimary,
            }
        }

        if (calendar?.backgroundColor) {
            valueToUpsert = {
                ...valueToUpsert,
                backgroundColor: calendar.backgroundColor,
            }
        }

        if (calendar?.foregroundColor) {
            valueToUpsert = {
                ...valueToUpsert,
                foregroundColor: calendar.foregroundColor,
            }
        }

        if (calendar?.deleted !== undefined) {
            valueToUpsert = {
                ...valueToUpsert,
                deleted: calendar.deleted,
            }
        }

        if (calendar?.updatedAt) {
            valueToUpsert = {
                ...valueToUpsert,
                updatedAt: calendar.updatedAt,
            }
        }

        if (calendar?.pageToken) {
            valueToUpsert = {
                ...valueToUpsert,
                pageToken: calendar.pageToken,
            }
        }

        if (calendar?.syncToken) {
            valueToUpsert = {
                ...valueToUpsert,
                syncToken: calendar.syncToken,
            }
        }

        const { data } = await client.mutate<{ insert_Calendar: { returning: CalendarType[], affected_rows: number } }>({
            mutation: upsertCalendarMutation,
            variables: {
                calendars: [valueToUpsert],
            },
            update(cache, { data }) {
                if (data?.insert_Calendar?.affected_rows > 0) {

                }

                cache.modify({
                    fields: {
                        Calendar(existingCalendars = []) {
                            const newCalendarRef = cache.writeFragment({
                                data: data?.insert_Calendar?.returning?.[0],
                                fragment: gql`
                                    fragment NewCalendar on Calendar {
                                    id
                                    title
                                    colorId
                                    account
                                    accessLevel
                                    modifiable
                                    resource
                                    defaultReminders
                                    globalPrimary
                                    deleted
                                    createdDate
                                    updatedAt
                                    userId
                                    foregroundColor
                                    backgroundColor
                                    pageToken
                                    syncToken
                                    }
                                `
                            });
                            const filteredCalendars = existingCalendars?.filter((e: CalendarType) => (e?.id !== data?.insert_Calendar?.returning?.[0]?.id)) || []

                            if (filteredCalendars?.length > 0) {
                                return filteredCalendars.concat([newCalendarRef])
                            }
                            return [newCalendarRef]
                        }
                    }
                })
            }
        })

        return data.insert_Calendar.returning[0]

    } catch (error) {

    }
}
export const upsertGoogleCalendarInDb = async (
    client: ApolloClient<NormalizedCacheObject>,
    calendarItemResponse: CalendarListItemResponseType,
    userId: string,
) => {
    try {

        const calendar: CalendarType = {
            id: calendarItemResponse.id,
            title: calendarItemResponse.summary,
            backgroundColor: calendarItemResponse?.backgroundColor,
            foregroundColor: calendarItemResponse?.foregroundColor,
            colorId: calendarItemResponse?.colorId,
            resource: googleCalendarResource,
            accessLevel: calendarItemResponse?.accessRole,
            defaultReminders: calendarItemResponse?.defaultReminders,
            modifiable: true,
            deleted: false,
            createdDate: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            userId,
        }

        return upsertCalendar(client, calendar)
    } catch (e) {

    }
}

export const deleteGoogleCalendarInDb = async (
    client: ApolloClient<NormalizedCacheObject>,
    calendarId: string,
) => {
    try {
        await client.mutate<{ delete_Calendar_by_pk: CalendarType }>({
            mutation: deleteCalendarById,
            variables: {
                id: calendarId,
            },
        })

    } catch (e) {

    }
}

export const deleteEventsByCalendarId = async (
    client: ApolloClient<NormalizedCacheObject>,
    calendarId: string,
) => {
    try {
        const { data } = await client.mutate<{ delete_Event: { affected_rows: number } }>({
            mutation: deleteEventsByCalendarIdMutation,
            variables: {
                calendarId,
            },
        })


    } catch (e) {

    }
}

export const bulkRemoveCalendarsInDb = async (
    client: ApolloClient<NormalizedCacheObject>,
    items: string[],
) => {
    try {
        const { data } = await client.mutate<{ delete_Calendar: { affected_rows: number } }>({
            mutation: deleteCalendarsByIds,
            variables: {
                ids: items,
            },
        })

    } catch (e) {

    }
}

export const bulkCreateCalendarsInDb = async (
    client: ApolloClient<NormalizedCacheObject>,
    items: CalendarType[],
) => {
    try {
        const upsertCalendarMutation = gql`
        mutation InsertCalendar($calendars: [Calendar_insert_input!]!) {
            insert_Calendar(objects: $calendars, on_conflict: {constraint: Calendar_pkey, update_columns: [
                title,
                colorId,
                account,
                accessLevel,
                resource,
                modifiable,
                defaultReminders,
                globalPrimary,
                backgroundColor,
                foregroundColor,
                deleted,
                updatedAt,
                pageToken,
                syncToken,
            ]}) {
                affected_rows
            }
        }
        `
        const { data } = await client.mutate({
            mutation: upsertCalendarMutation,
            variables: {
                calendars: items,
            },
        })


        return data.insert_Calendar.affected_rows

    } catch (e) {

    }
}

export const getItemsToRemove = async (
    client: ApolloClient<NormalizedCacheObject>,
    userId: string,
    resource: string,
) => {
    try {
        return (await client.query<{ Calendar: CalendarType[] }>({
            query: getCalendarWithResource,
            variables: {
                userId,
                resource,
            },
        })).data?.Calendar
    } catch (e) {

    }
}

export const getEventWithId = async (
    client: ApolloClient<NormalizedCacheObject>,
    eventId: string,
): Promise<EventType> => {
    try {
        return (await client.query<{ Event_by_pk: EventType }>({
            query: getEventById,
            variables: {
                id: eventId,
            },
        })).data?.Event_by_pk
    } catch (e) {

    }
}


