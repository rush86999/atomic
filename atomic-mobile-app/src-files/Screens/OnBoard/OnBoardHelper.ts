
import _ from 'lodash'
import { v4 as uuid } from 'uuid'
import { Dispatch } from 'react'

import { dayjs } from '@app/date-utils'


import { palette } from '@theme/theme'
import {
    CalendarType,
} from '@app/dataTypes/CalendarType'
import { CategoryType } from '@app/dataTypes/CategoryType'
import { EndTimeType, StartTimeType, UserPreferenceType } from '@app/dataTypes/User_PreferenceType'
import { Auth } from '@aws-amplify/auth';
import RNCalendarEvents from 'react-native-calendar-events';
import { CALENDARNAME } from '@screens/Progress/Todo/UserTask'
import { Platform } from 'react-native'
import { localCalendarResource } from '@app/calendar/constants';
import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import updateCalendarToGlobalPrimary from '@app/apollo/gql/updateCalendarToGlobalPrimary'
import { createCategory, listUserCategories } from '@screens/Category/CategoryHelper'
import upsertUserPreference from '@app/apollo/gql/upsertUserPreference'
import getGlobalPrimaryCalendar from '@app/apollo/gql/getGlobalPrimaryCalendar'
import getAnyCalendar from '@app/apollo/gql/getAnyCalendar'
import { UserType } from '@app/dataTypes/UserType'
import getUserById from '@app/apollo/gql/getUserById'
import upsertUser from '@app/apollo/gql/upsertUser'
import updateUserForUserPreferenceId from '@app/apollo/gql/updateUserForUserPreferenceId'
import upsertCalendar from '@app/apollo/gql/upsertCalendar'
import { EventType } from '@app/dataTypes/EventType'
import listEventsForCalendarId from '@app/apollo/gql/listEventsForCalendarId'
import updateUserPreferenceOnBoardedMutation from '@app/apollo/gql/updateUserPreferenceOnBoardedMutation'
import updateCalendarDropGlobalPrimary from '@app/apollo/gql/updateCalendarDropGlobalPrimary'
import getUserPreferenceForUser from '@app/apollo/gql/getUserPreferenceForUser'
import updateCalendarsDropGlobalPrimary from '@app/apollo/gql/updateCalendarsDropGlobalPrimary'


const DEFAULTCATEGORIES: CategoryType[] = [
    {
        id: uuid(),
        name: 'External Meeting',
        createdDate: dayjs().toISOString(),
        updatedAt: dayjs().toISOString(),
        deleted: false,
        userId: '',
    },
    {
        id: uuid(),
        name: 'Meeting',
        createdDate: dayjs().toISOString(),
        updatedAt: dayjs().toISOString(),
        deleted: false,
        userId: '',
    },
    {
        id: uuid(),
        name: 'Life Milestone',
        createdDate: dayjs().toISOString(),
        updatedAt: dayjs().toISOString(),
        deleted: false,
        userId: '',
    },
    {
        id: uuid(),
        name: 'Sports',
        createdDate: dayjs().toISOString(),
        updatedAt: dayjs().toISOString(),
        deleted: false,
        userId: '',
    },
    {
        id: uuid(),
        name: 'Social Meetup',
        createdDate: dayjs().toISOString(),
        updatedAt: dayjs().toISOString(),
        deleted: false,
        userId: '',
    },
    {
        id: uuid(),
        name: 'Break',
        createdDate: dayjs().toISOString(),
        updatedAt: dayjs().toISOString(),
        deleted: false,
        userId: '',
    }
]

const STARTTIMES: StartTimeType[] = [
    {
        day: 1,
        hour: 7,
        minutes: 0,
    },
    {
        day: 2,
        hour: 7,
        minutes: 0,
    },
    {
        day: 3,
        hour: 7,
        minutes: 0,
    },
    {
        day: 4,
        hour: 7,
        minutes: 0,
    },
    {
        day: 5,
        hour: 7,
        minutes: 0,
    },
    {
        day: 6,
        hour: 7,
        minutes: 0,
    },
    {
        day: 7,
        hour: 7,
        minutes: 0,
    },
]

const ENDTIMES: EndTimeType[] = [
    {
        day: 1,
        hour: 19,
        minutes: 0,
    },
    {
        day: 2,
        hour: 19,
        minutes: 0,
    },
    {
        day: 3,
        hour: 19,
        minutes: 0,
    },
    {
        day: 4,
        hour: 19,
        minutes: 0,
    },
    {
        day: 5,
        hour: 19,
        minutes: 0,
    },
    {
        day: 6,
        hour: 19,
        minutes: 0,
    },
    {
        day: 7,
        hour: 19,
        minutes: 0,
    },
]

export const listEventsForCalendar = async (
    client: ApolloClient<NormalizedCacheObject>,
    calendarId: string,
) => {
    try {
        const { data } = await client.query<{
            Event: EventType[]
        }>({
            query: listEventsForCalendarId,
            variables: {
                calendarId,
            },
        })


        return data?.Event
    } catch (e) {

    }
}

export const dropPrimaryLabelForCalendars = async (
    client: ApolloClient<NormalizedCacheObject>,
    calendarIds: string[],
): Promise<void | null> => {
    try {
        if (!(calendarIds?.length > 0)) {

            return null
        }
        const { data } = await client.mutate<{
            update_Calendar: { affected_rows: number, returning: CalendarType[] }
        }>({
            mutation: updateCalendarsDropGlobalPrimary,
            variables: {
                ids: calendarIds,
            },
            update(cache, { data }) {
                const deletedCalendars = data?.update_Calendar?.returning
                const normalizedIds = deletedCalendars.map(c => cache.identify({ id: c.id, __typename: c.__typename }))
                normalizedIds.forEach(id => cache.evict({ id }))
                cache.gc()
            }
        })



    } catch (e) {

    }
}

export const dropPrimaryLabelForCalendar = async (
    client: ApolloClient<NormalizedCacheObject>,
    calendarId: string,
): Promise<void | null> => {
    try {
        if (!calendarId) {

            return null
        }
        const { data } = await client.mutate<{
            update_Calendar_by_pk: CalendarType
        }>({
            mutation: updateCalendarDropGlobalPrimary,
            variables: {
                id: calendarId,
            },
        })



    } catch (e) {

    }
}
export const setPrimaryCalendar = async (
    client: ApolloClient<NormalizedCacheObject>,
    calendar: CalendarType,
) => {
    try {
        const { data } = await client.mutate<{ update_Calendar_by_pk: CalendarType }>({
            mutation: updateCalendarToGlobalPrimary,
            variables: {
                id: calendar.id,
            },
        })


    } catch (e) {
        console.error(e, ' setPrimaryCalendar')
    }
}

export const generateDefaultCategories = async (
    client: ApolloClient<NormalizedCacheObject>,
    userId: string,
) => {
    try {
        const existingCategories = await listUserCategories(client, userId)

        if (existingCategories.length === 0) {

            DEFAULTCATEGORIES.forEach(async (category) => {
                await createCategory(client, category?.name, userId)
            })
        }
    } catch (e) {
        console.error(e, ' generateDefaultCategories')
    }
}

export const getUserPreference = async (
    client: ApolloClient<NormalizedCacheObject>,
    userId: string,
) => {
    try {
        const { data } = await client.query<{ User_Preference: UserPreferenceType[] }>({
            query: getUserPreferenceForUser,
            variables: {
                userId,
            },
            fetchPolicy: 'no-cache',
        })

        if (data?.User_Preference?.length > 0) {

            return data.User_Preference[0]
        }
        return null
    } catch (e) {
        console.error(e, ' getUserPreference')
    }
}

export const updateUserForPreferenceId = async (
    client: ApolloClient<NormalizedCacheObject>,
    userId: string,
    preferenceId: string,
) => {
    try {
        const { data } = await client.mutate<{ update_User_by_pk: UserType }>({
            mutation: updateUserForUserPreferenceId,
            variables: {
                id: userId,
                userPreferenceId: preferenceId,
            },
        })


    } catch (e) {
        console.error(e, ' updateUserForPreferenceId')
    }
}

export const updateUserPreferenceOnBoarded = async (
    client: ApolloClient<NormalizedCacheObject>,
    userId: string,
    onBoarded: boolean,
): Promise<void> => {
    try {
        const { data } = await client.mutate<{ update_User_Preference: { affected_rows: number, returning: UserPreferenceType[] } }>({
            mutation: updateUserPreferenceOnBoardedMutation,
            variables: {
                userId,
                onBoarded,
            },
            update(cache, { data }) {
                if (data?.update_User_Preference?.affected_rows > 0) {

                }

                cache.modify({
                    fields: {
                        User_Preference(existingUserPreferences = []) {

                            return [{ ...existingUserPreferences?.[0], onBoarded: data?.update_User_Preference?.returning?.[0]?.onBoarded }];
                        }
                    }
                })
            }
        })



    } catch (e) {

    }
}
export const createUserPreference = async (
    client: ApolloClient<NormalizedCacheObject>,
    userId: string,
) => {
    try {
        const existinguser_preference = await getUserPreference(client, userId)
        const id = uuid()
        if (!existinguser_preference) {
            const userPreferenceValues = {
                id,
                userId,
                createdDate: dayjs().toISOString(),
                updatedAt: dayjs().toISOString(),
                deleted: false,
                maxWorkLoadPercent: 85,
                backToBackMeetings: false,
                minNumberOfBreaks: 1,
                maxNumberOfMeetings: 4,
                breakLength: 15,
                startTimes: STARTTIMES,
                endTimes: ENDTIMES,
                breakColor: palette.greenPrimary,
                onBoarded: false,
                copyAvailability: true,
                copyTimeBlocking: true,
                copyTimePreference: true,
                copyReminders: true,
                copyPriorityLevel: true,
                copyModifiable: true,
                copyCategories: true,
                copyIsBreak: true,
                copyIsMeeting: true,
                copyIsExternalMeeting: true,
                copyColor: true,
            }

            const { data } = await client.mutate<{ insert_User_Preference_one: UserPreferenceType }>({
                mutation: upsertUserPreference,
                variables: {
                    userPreference: userPreferenceValues,
                }
            })

            await updateUserForPreferenceId(client, userId, id)


        }
    } catch (e) {
        console.error(e, ' createuser_preference')
    }
}

export const createDefaultPrimaryCalendar = async (
    client: ApolloClient<NormalizedCacheObject>,
    userId: string,
) => {
    try {
        const existingCalendar = (await client.query<{ Calendar: CalendarType[] }>({
            query: getGlobalPrimaryCalendar,
            variables: {
                userId,
            },
        })).data?.Calendar?.[0]

        if (!existingCalendar) {
            const calendarDoc = (await client.query<{ Calendar: CalendarType[] }>({
                query: getAnyCalendar,
                variables: {
                    userId,
                },
            })).data?.Calendar?.[0]

            if (calendarDoc) {
                await client.mutate<{ update_Calendar_by_pk: CalendarType }>({
                    mutation: updateCalendarToGlobalPrimary,
                    variables: {
                        id: calendarDoc?.id,
                    },
                })
            }
        }
    } catch (e) {
        console.error(e, ' createDefaultPrimaryCalendar')
    }
}

export const createDefaultUser = async (
    client: ApolloClient<NormalizedCacheObject>,
    userId: string,
) => {
    try {
        const existingUser = (await client.query<{ User_by_pk: UserType }>({
            query: getUserById,
            variables: {
                id: userId,
            },
        }))?.data?.User_by_pk

        if (!existingUser) {
            const userInfo = await Auth.currentUserInfo()
            const email = userInfo?.attributes?.email
            const valuesToUpsert = {
                id: userId,
                createdDate: dayjs().toISOString(),
                updatedAt: dayjs().toISOString(),
                deleted: false,
                email,
                name: userInfo?.attributes?.name || '',
            }
            await client.mutate<{ insert_User_one: UserType }>({
                mutation: upsertUser,
                variables: {
                    user: valuesToUpsert,
                },
            })

        }
    } catch (e) {
        console.error(e, ' createDefaultUser')
    }
}

export const createInitialSelectedCalendar = async (
    client: ApolloClient<NormalizedCacheObject>,
    userId: string,
    setSelectedCalendar: Dispatch<string>,
) => {
    try {
        const existingCalendar = (await client.query<{ Calendar: CalendarType[] }>({
            query: getGlobalPrimaryCalendar,
            variables: {
                userId,
            },
        })).data?.Calendar?.[0]

        if (!existingCalendar) {
            const oldCalendarDoc = (await client.query<{ Calendar: CalendarType[] }>({
                query: getAnyCalendar,
                variables: {
                    userId,
                },
            })).data?.Calendar?.[0]

            if (oldCalendarDoc) {
                await client.mutate<{ update_Calendar_by_pk: CalendarType }>({
                    mutation: updateCalendarToGlobalPrimary,
                    variables: {
                        id: oldCalendarDoc?.id,
                    },
                })
                setSelectedCalendar(oldCalendarDoc?.id)
            } else {
                const oldStatus = await RNCalendarEvents.checkPermissions()
                let status
                if (oldStatus !== 'authorized') {
                    const newStatus = await RNCalendarEvents.requestPermissions()

                    status = newStatus
                }

                if (status === 'authorized' || oldStatus === 'authorized') {
                    const newCalendars = await RNCalendarEvents.findCalendars()

                    const atomicCalendars = newCalendars.filter(each => each.title === CALENDARNAME)


                    if (atomicCalendars?.[0]?.id) {

                        const calendarValues = {
                            id: atomicCalendars[0].id,
                            userId,
                            createdDate: dayjs().toISOString(),
                            updatedAt: dayjs().toISOString(),
                            deleted: false,
                            title: CALENDARNAME,
                            globalPrimary: true,
                            backgroundColor: atomicCalendars[0].color,
                            resource: localCalendarResource,
                            modifiable: true,
                        }
                        const calendarDoc = (await client.mutate<{ insert_Calendar_one: CalendarType }>({
                            mutation: upsertCalendar,
                            variables: {
                                calendar: calendarValues,
                            },
                        }))?.data?.insert_Calendar_one


                        setSelectedCalendar(calendarDoc?.id)

                        return
                    }

                    const defaultCalendarSource = Platform.OS === 'ios'
                        ? newCalendars.filter(each => each.source === 'Default')?.[0].source
                        : { isLocalAccount: true, name: CALENDARNAME, type: '' }

                    const newCalendarId = Platform.OS === 'ios' ? await RNCalendarEvents.saveCalendar({
                        title: CALENDARNAME,
                        color: palette['purple'],
                        entityType: 'event',
                        source: undefined,
                        name: CALENDARNAME,
                        ownerAccount: 'personal',
                        accessLevel: 'owner',
                    }) : await RNCalendarEvents.saveCalendar({
                        title: CALENDARNAME,
                        color: palette['purple'],
                        entityType: 'event',
                        source: defaultCalendarSource as { isLocalAccount: boolean; name: string; type: string; },
                        name: CALENDARNAME,
                        ownerAccount: 'personal',
                        accessLevel: 'owner',
                    })

                    const newReCalendars = await RNCalendarEvents.findCalendars()

                    const newlyCreatedCalendarArray = newReCalendars.filter(each => each.title === CALENDARNAME)
                    const calendarValues = {
                        id: newCalendarId,
                        userId,
                        createdDate: dayjs().toISOString(),
                        updatedAt: dayjs().toISOString(),
                        deleted: false,
                        title: CALENDARNAME,
                        globalPrimary: true,
                        backgroundColor: newlyCreatedCalendarArray?.[0]?.color,
                        resource: localCalendarResource,
                        modifiable: true,
                    }
                    const calendarDoc = (await client.mutate<{ insert_Calendar_one: CalendarType }>({
                        mutation: upsertCalendar,
                        variables: {
                            calendar: calendarValues,
                        },
                    }))?.data?.insert_Calendar_one

                    setSelectedCalendar(calendarDoc?.id)
                }
            }
        } else {
            setSelectedCalendar(existingCalendar?.id)
        }
    } catch (e) {
        console.error(e, ' createInitialSelectedCalendar')
    }
}
