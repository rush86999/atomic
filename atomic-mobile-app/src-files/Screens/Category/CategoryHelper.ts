import { v4 as uuid } from 'uuid'

import { dayjs } from '@app/date-utils'

import { ApolloClient, gql, NormalizedCacheObject } from '@apollo/client'
import { EventType } from '@app/dataTypes/EventType'
import removeCategoriesForEvent from '@app/apollo/gql/removeCategoriesForEvent'
import { CategoryType, DefaultRemindersType, DefaultTimeBlockingType, DefaultTimePreferenceTypes } from '@app/dataTypes/CategoryType';
import createCategoryMutation from '@app/apollo/gql/createCategoryMutation'
import listCategoriesForUser from '@app/apollo/gql/listCategoriesForUser'
import updateCategoryForName from '@app/apollo/gql/updateCategoryForName'
import deleteCategoryById from '@app/apollo/gql/deleteCategoryById'
import removeEventConnectionsForCategoryMutation from '@app/apollo/gql/removeEventConnectionsForCategoryMutation'
import listCategoriesForEventId from '@app/apollo/gql/listCategoriesForEventId'
import listEventsForCategoryQuery from '@app/apollo/gql/listEventsForCategoryQuery'
import removeCategoryEventConnection from '@app/apollo/gql/removeCategoryEventConnection'
import getCategoryById from '@app/apollo/gql/getCategoryById'
import { CategoryEventType } from '@app/dataTypes/Category_EventType'
import _ from 'lodash'



export const createCategory = async (
  client: ApolloClient<NormalizedCacheObject>,
  category: string,
  userId: string,
) => {
  try {
    const newCategoryValue = {
      id: uuid(),
      userId,
      name: category,
      updatedAt: dayjs().toISOString(),
      createdDate: dayjs().toISOString(),
    }

    const { data } = await client.mutate<{ insert_Category_one: CategoryType }>({
      mutation: createCategoryMutation,
      variables: newCategoryValue,
    })


    return data?.insert_Category_one

  } catch (e) {

  }
}

export const listUserCategories = async (
  client: ApolloClient<NormalizedCacheObject>,
  userId: string,
) => {
  try {
    const { data } = await client.query<{
      Category: CategoryType[]
    }>({
      query: listCategoriesForUser,
      variables: {
        userId,
      },
      fetchPolicy: 'no-cache'
    })


    return data?.Category

  } catch (e) {

  }
}

export const updateCategoryName = async (
  client: ApolloClient<NormalizedCacheObject>,
  newName: string,
  categoryId: string
) => {
  try {
    const { data } = await client.mutate<{
      update_Category_by_pk: CategoryType
    }>({
      mutation: updateCategoryForName,
      variables: {
        id: categoryId,
        name: newName,
        updatedAt: dayjs().toISOString(),
      },
    })


    return data?.update_Category_by_pk

  } catch (e) {

  }
}

export const removeCategory = async (
  client: ApolloClient<NormalizedCacheObject>,
  categoryId: string,
) => {
  try {
    const { data } = await client.mutate<{
      delete_Category_by_pk: CategoryType
    }>({
      mutation: deleteCategoryById,
      variables: {
        id: categoryId,
      },
    })


    return data?.delete_Category_by_pk

  } catch (e) {

  }
}

export const removeEventConnectionsForCategory = async (
  client: ApolloClient<NormalizedCacheObject>,
  categoryId: string,
) => {
  try {
    const { data } = await client.mutate<{
      delete_Category_Event: { affected_rows: number, returning: CategoryEventType[] }
    }>({
      mutation: removeEventConnectionsForCategoryMutation,
      variables: {
        categoryId,
      },
      update(cache, { data }) {
        const deletedCategoryEvents = data?.delete_Category_Event?.returning
        const normalizedIds = deletedCategoryEvents.map(c => cache.identify({ id: c.id, __typename: c.__typename }))
        normalizedIds.forEach(id => cache.evict({ id }))
        cache.gc()
      }
    })


    return data?.delete_Category_Event

  } catch (e) {

  }
}
export const upsertCategoryEventConnection = async (
  client: ApolloClient<NormalizedCacheObject>,
  userId: string,
  categoryId: string,
  eventId: string,
) => {
  try {

    const upsertCategoryEvent = gql`
        mutation InsertCategory_Event($category_events: [Category_Event_insert_input!]!) {
          insert_Category_Event(
            objects: $category_events,
            on_conflict: {
                constraint: Category_Event_pkey,
                update_columns: [
                  ${categoryId ? 'categoryId,' : ''}
                  ${eventId ? 'eventId,' : ''} 
                  deleted, 
                  updatedAt,
                ]
            }){
            returning {
              id
              categoryId
              createdDate
              deleted
              eventId
              updatedAt
              userId
              Category {
                color
                copyAvailability
                copyIsBreak
                copyIsExternalMeeting
                copyIsMeeting
                copyModifiable
                copyPriorityLevel
                copyReminders
                copyTimeBlocking
                copyTimePreference
                createdDate
                defaultAvailability
                defaultExternalMeetingModifiable
                defaultIsBreak
                defaultIsExternalMeeting
                defaultIsMeeting
                defaultMeetingModifiable
                defaultModifiable
                defaultPriorityLevel
                defaultReminders
                defaultTimeBlocking
                defaultTimePreference
                deleted
                id
                name
                updatedAt
                userId
              }
            }
            affected_rows
          }
        } 
      `

    const variables = {
      category_events: [
        {
          id: uuid(),
          userId,
          categoryId,
          eventId,
          deleted: false,
          updatedAt: dayjs().toISOString(),
          createdDate: dayjs().toISOString(),
        }
      ]
    }

    const { data } = await client.mutate<{ insert_Category_Event: { returning: CategoryEventType[], affected_rows: number } }>({
      mutation: upsertCategoryEvent,
      variables,
      update(cache, { data }) {
        if (data?.insert_Category_Event?.affected_rows > 0) {

        }

        cache.modify({
          fields: {
            Category_Event(existingCategoryEvents = []) {
              const newCategoryEventRefs = data?.insert_Category_Event?.returning.map(c => (cache.writeFragment({
                data: c,
                fragment: gql`
                    fragment NewCategory_Event on Category_Event {
                      id
                      categoryId
                      createdDate
                      deleted
                      eventId
                      updatedAt
                      userId
                    }
                  `
              })))
              return [...existingCategoryEvents, ...newCategoryEventRefs];
            }
          }
        })
      }
    })


  } catch (e) {

  }
}

export const listEventsForCategory = async (
  client: ApolloClient<NormalizedCacheObject>,
  categoryId: string,
) => {
  try {
    const { data } = await client.query<{
      Event: EventType[]
    }>({
      query: listEventsForCategoryQuery,
      variables: {
        categoryId,
      },
    })


    return data?.Event
  } catch (e) {

  }
}

export const listCategoriesForEvent = async (
  client: ApolloClient<NormalizedCacheObject>,
  eventId: string,
) => {
  try {
    const categoryData = (await client.query<{ Category: CategoryType[] }>({
      query: listCategoriesForEventId,
      variables: {
        eventId: eventId,
      },
    }))

    const categories = categoryData?.data?.Category

    return categories
  } catch (e) {

  }
}

export const removeCategoryConnectionForEvent = async (
  client: ApolloClient<NormalizedCacheObject>,
  categoryId: string,
  eventId: string,
) => {
  try {
    const { data } = await client.mutate<{
      delete_Category_Event: { affected_rows: number, returning: CategoryEventType[] }
    }>({
      mutation: removeCategoryEventConnection,
      variables: {
        categoryId,
        eventId,
      },
      update(cache, { data }) {
        const normalizedIds = data?.delete_Category_Event?.returning?.map(c => cache.identify({ id: c.id, __typename: c.__typename }))
        normalizedIds.forEach(id => cache.evict({ id }))
        cache.gc()
      }
    })


    return data?.delete_Category_Event

  } catch (e) {

  }
}

export const removeAllCategoriesForEvent = async (
  client: ApolloClient<NormalizedCacheObject>,
  eventId: string,
) => {
  try {
    const { data } = await client.mutate<{ delete_Category_Event: { affected_rows: number, returning: CategoryEventType[] } }>({
      mutation: removeCategoriesForEvent,
      variables: {
        eventId,
      },
      update(cache, { data }) {
        const normalizedIds = data?.delete_Category_Event?.returning?.map(c => cache.identify({ id: c.id, __typename: c.__typename }))
        normalizedIds.forEach(id => cache.evict({ id }))
        cache.gc()
      }
    })


  } catch (e) {

  }
}

export const addCategoryToUser = async (
  client: ApolloClient<NormalizedCacheObject>,
  userId: string,
  name: string,
) => {
  try {
    const newCategoryValue = {
      id: uuid(),
      userId,
      name,
      updatedAt: dayjs().toISOString(),
      createdDate: dayjs().toISOString(),
    }

    const { data } = await client.mutate<{ insert_Category_one: CategoryType }>({
      mutation: createCategoryMutation,
      variables: newCategoryValue,
    })


    return data?.insert_Category_one
  } catch (e) {

  }
}

export const getCategoryWithId = async (
  client: ApolloClient<NormalizedCacheObject>,
  categoryId: string,
) => {
  try {
    const { data } = await client.query<{
      Category_by_pk: CategoryType
    }>({
      query: getCategoryById,
      variables: {
        id: categoryId,
      },
    })


    return data?.Category_by_pk
  } catch (e) {

  }
}

export const updateCategoryHelper = async (
  client: ApolloClient<NormalizedCacheObject>,
  categoryId: string,
  name: string,
  copyAvailability?: boolean,
  copyTimeBlocking?: boolean,
  copyTimePreference?: boolean,
  copyReminders?: boolean,
  copyPriorityLevel?: boolean,
  copyModifiable?: boolean,
  defaultAvailability?: boolean,
  defaultTimeBlocking?: DefaultTimeBlockingType | null,
  defaultTimePreference?: DefaultTimePreferenceTypes | null,
  defaultReminders?: DefaultRemindersType | null,
  defaultPriorityLevel?: number,
  defaultModifiable?: boolean,
  copyIsBreak?: boolean,
  defaultIsBreak?: boolean,
  color?: string,
  copyIsMeeting?: boolean,
  copyIsExternalMeeting?: boolean,
  defaultIsMeeting?: boolean,
  defaultIsExternalMeeting?: boolean,
  defaultMeetingModifiable?: boolean,
  defaultExternalMeetingModifiable?: boolean,
) => {
  try {
    const updateCategoryMutation = gql`
      mutation UpdateCategory(
        $id: uuid!, 
        ${name !== undefined ? '$name: String!,' : ''}
        ${color !== undefined ? '$color: String,' : ''}
        ${copyAvailability ? '$copyAvailability: Boolean,' : ''}
        ${copyIsBreak !== undefined ? '$copyIsBreak: Boolean,' : ''}
        ${copyIsExternalMeeting !== undefined ? '$copyIsExternalMeeting: Boolean,' : ''}
        ${copyIsMeeting !== undefined ? '$copyIsMeeting: Boolean,' : ''}
        ${copyModifiable !== undefined ? '$copyModifiable: Boolean,' : ''}
        ${copyPriorityLevel !== undefined ? '$copyPriorityLevel: Boolean,' : ''}
        ${copyReminders !== undefined ? '$copyReminders: Boolean,' : ''}
        ${copyTimeBlocking !== undefined ? '$copyTimeBlocking: Boolean,' : ''}
        ${copyTimePreference !== undefined ? '$copyTimePreference: Boolean,' : ''}
        ${defaultAvailability !== undefined ? '$defaultAvailability: Boolean,' : ''}
        ${defaultExternalMeetingModifiable !== undefined ? '$defaultExternalMeetingModifiable: Boolean,' : ''}
        ${defaultIsBreak !== undefined ? '$defaultIsBreak: Boolean,' : ''}
        ${defaultIsExternalMeeting !== undefined ? '$defaultIsExternalMeeting: Boolean,' : ''}
        ${defaultIsMeeting !== undefined ? '$defaultIsMeeting: Boolean,' : ''}
        ${defaultMeetingModifiable !== undefined ? '$defaultMeetingModifiable: Boolean,' : ''}
        ${defaultModifiable !== undefined ? '$defaultModifiable: Boolean,' : ''}
        ${defaultPriorityLevel !== undefined ? '$defaultPriorityLevel: Int,' : ''}
        ${defaultReminders !== undefined ? '$defaultReminders: jsonb,' : ''}
        ${defaultTimeBlocking !== undefined ? '$defaultTimeBlocking: jsonb,' : ''}
        ${defaultTimePreference !== undefined ? '$defaultTimePreference: jsonb,' : ''}
        $updatedAt: timestamptz,
      ) {
        update_Category_by_pk(pk_columns: {id: $id}, _set: {
          ${name !== undefined ? 'name: $name,' : ''} 
          updatedAt: $updatedAt, 
          ${color !== undefined ? 'color: $color,' : ''} 
          ${copyAvailability ? 'copyAvailability: $copyAvailability,' : ''} 
          ${copyIsBreak !== undefined ? 'copyIsBreak: $copyIsBreak,' : ''} 
          ${copyIsExternalMeeting !== undefined ? 'copyIsExternalMeeting: $copyIsExternalMeeting,' : ''} 
          ${copyIsMeeting !== undefined ? 'copyIsMeeting: $copyIsMeeting,' : ''} 
          ${copyModifiable !== undefined ? 'copyModifiable: $copyModifiable,' : ''} 
          ${copyPriorityLevel !== undefined ? 'copyPriorityLevel: $copyPriorityLevel,' : ''} 
          ${copyReminders !== undefined ? 'copyReminders: $copyReminders,' : ''} 
          ${copyTimeBlocking !== undefined ? 'copyTimeBlocking: $copyTimeBlocking,' : ''} 
          ${copyTimePreference !== undefined ? 'copyTimePreference: $copyTimePreference,' : ''} 
          ${defaultAvailability !== undefined ? 'defaultAvailability: $defaultAvailability,' : ''} 
          ${defaultExternalMeetingModifiable !== undefined ? 'defaultExternalMeetingModifiable: $defaultExternalMeetingModifiable,' : ''} 
          ${defaultIsBreak !== undefined ? 'defaultIsBreak: $defaultIsBreak,' : ''} 
          ${defaultIsExternalMeeting !== undefined ? 'defaultIsExternalMeeting: $defaultIsExternalMeeting,' : ''} 
          ${defaultIsMeeting !== undefined ? 'defaultIsMeeting: $defaultIsMeeting,' : ''} 
          ${defaultMeetingModifiable !== undefined ? 'defaultMeetingModifiable: $defaultMeetingModifiable,' : ''} 
          ${defaultModifiable !== undefined ? 'defaultModifiable: $defaultModifiable,' : ''} 
          ${defaultPriorityLevel !== undefined ? 'defaultPriorityLevel: $defaultPriorityLevel,' : ''} 
          ${defaultReminders !== undefined ? 'defaultReminders: $defaultReminders,' : ''} 
          ${defaultTimeBlocking !== undefined ? 'defaultTimeBlocking: $defaultTimeBlocking,' : ''} 
          ${defaultTimePreference !== undefined ? 'defaultTimePreference: $defaultTimePreference,' : ''}
        }) {
          id
          name
          deleted
          createdDate
          updatedAt
          userId
          copyAvailability
          copyTimeBlocking
          copyTimePreference
          copyReminders
          copyPriorityLevel
          copyModifiable
          defaultAvailability
          defaultTimeBlocking
          defaultTimePreference
          defaultReminders
          defaultPriorityLevel
          defaultModifiable
          copyIsBreak
          defaultIsBreak
          color
          copyIsMeeting
          copyIsExternalMeeting
          defaultIsMeeting
          defaultIsExternalMeeting
          defaultMeetingModifiable
          defaultExternalMeetingModifiable
        }
      }
    `

    const variables: any = {
      id: categoryId,
      updatedAt: new Date().toISOString(),
    }

    if (name !== undefined) {
      variables.name = name
    }

    if (color !== undefined) {
      variables.color = color
    }

    if (copyAvailability !== undefined) {
      variables.copyAvailability = copyAvailability
    }

    if (copyIsBreak !== undefined) {
      variables.copyIsBreak = copyIsBreak
    }

    if (copyIsExternalMeeting !== undefined) {
      variables.copyIsExternalMeeting = copyIsExternalMeeting
    }

    if (copyIsMeeting !== undefined) {
      variables.copyIsMeeting = copyIsMeeting
    }

    if (copyModifiable !== undefined) {
      variables.copyModifiable = copyModifiable
    }

    if (copyPriorityLevel !== undefined) {
      variables.copyPriorityLevel = copyPriorityLevel
    }

    if (copyReminders !== undefined) {
      variables.copyReminders = copyReminders
    }

    if (copyTimeBlocking !== undefined) {
      variables.copyTimeBlocking = copyTimeBlocking
    }

    if (copyTimePreference !== undefined) {
      variables.copyTimePreference = copyTimePreference
    }

    if (defaultAvailability !== undefined) {
      variables.defaultAvailability = defaultAvailability
    }

    if (defaultExternalMeetingModifiable !== undefined) {
      variables.defaultExternalMeetingModifiable = defaultExternalMeetingModifiable
    }

    if (defaultIsBreak !== undefined) {
      variables.defaultIsBreak = defaultIsBreak
    }

    if (defaultIsExternalMeeting !== undefined) {
      variables.defaultIsExternalMeeting = defaultIsExternalMeeting
    }

    if (defaultIsMeeting !== undefined) {
      variables.defaultIsMeeting = defaultIsMeeting
    }

    if (defaultMeetingModifiable !== undefined) {
      variables.defaultMeetingModifiable = defaultMeetingModifiable
    }

    if (defaultModifiable !== undefined) {
      variables.defaultModifiable = defaultModifiable
    }

    if (defaultPriorityLevel !== undefined) {
      variables.defaultPriorityLevel = defaultPriorityLevel
    }

    if (defaultReminders !== undefined) {
      variables.defaultReminders = defaultReminders
    }

    if (defaultTimeBlocking !== undefined) {
      variables.defaultTimeBlocking = defaultTimeBlocking
    }

    if (defaultTimePreference !== undefined) {
      variables.defaultTimePreference = defaultTimePreference
    }

    const { data } = await client.mutate<{
      update_Category_by_pk: CategoryType
    }>({
      mutation: updateCategoryMutation,
      variables,
    })

    return data.update_Category_by_pk
  } catch (e) {

  }
}

