
import { dayjs, RNLocalize } from '@app/date-utils'
import utc from 'dayjs/plugin/utc'

// dayjs.extend(utc)

import {
  email,
  phoneNumber,
  imAddress,
  AttendeeType,
} from '@app/dataTypes/AttendeeType'
import { ApolloClient, gql, NormalizedCacheObject } from '@apollo/client'
import deleteAttendeesByEventId from '@app/apollo/gql/deleteAttendeesByEventId'
import listAttendeesByEventId from '@app/apollo/gql/listAttendeesByEventId'
import deleteAttendeesByEventIds from '@app/apollo/gql/deleteAttendeesByEventIds'

export const upsertAttendeesInDb = async (
  client: ApolloClient<NormalizedCacheObject>,
  id: string,
  userId: string,
  eventId: string,
  emails: email[],
  name?: string | null,
  contactId?: string | null,
  phoneNumbers?: phoneNumber[] | null,
  imAddresses?: imAddress[] | null,
  additionalGuests?: number | null,
  optional?: boolean | null,
  resource?: boolean | null,
) => {
  try {
    const upsertQuery = gql`
    mutation InsertAttendee($attendees: [Attendee_insert_input!]!) {
            insert_Attendee(
                objects: $attendees,
                on_conflict: {
                    constraint: Attendee_pkey,
                    update_columns: [
                      ${name ? 'name,' : ''},
                      ${contactId ? 'contactId,' : ''},
                      emails,
                      ${phoneNumbers ? 'phoneNumbers,' : ''},
                      ${imAddresses ? 'imAddresses,' : ''},
                      eventId,
                      ${additionalGuests ? 'additionalGuests,' : ''},
                      ${optional ? 'optional,' : ''},
                      ${resource ? 'resource,' : ''},
                      responseStatus,
                      comment,
                      deleted,
                      updatedAt,
                    ]
                }){
                returning {
                  id
                  additionalGuests
                  comment
                  contactId
                  createdDate
                  deleted
                  emails
                  eventId
                  imAddresses
                  name
                  optional
                  phoneNumbers
                  resource
                  responseStatus
                  updatedAt
                  userId
                }
                affected_rows
              }
            }
          `

    const { data } = await client.mutate<{ insert_Attendee: { returning: AttendeeType[], affected_rows: number } }>({
      mutation: upsertQuery,
      variables: {
        attendees: [
          {
            id,
            userId,
            eventId,
            emails,
            name,
            contactId,
            phoneNumbers,
            imAddresses,
            additionalGuests,
            optional,
            resource,
            updatedAt: dayjs().toISOString(),
            createdDate: dayjs().toISOString(),
            deleted: false,
          },
        ],
      },
      update(cache, { data }) {
        if (data?.insert_Attendee?.affected_rows > 0) {

        }

        cache.modify({
          fields: {
            Attendee(existingAttendees = []) {
              const newAttendeeRef = cache.writeFragment({
                data: data?.insert_Attendee?.returning?.[0],
                fragment: gql`
                    fragment NewAttendee on Attendee {
                      id
                      additionalGuests
                      comment
                      contactId
                      createdDate
                      deleted
                      emails
                      eventId
                      imAddresses
                      name
                      optional
                      phoneNumbers
                      resource
                      responseStatus
                      updatedAt
                      userId
                    }
                  `
              });
              return [...existingAttendees, newAttendeeRef];
            }
          }
        })
      }
    })



  } catch (e) {

  }
}

export const deleteAttendeesForEvents = async (
  client: ApolloClient<NormalizedCacheObject>,
  eventIds: string[],
) => {
  try {
    const res = await client.mutate<{ delete_Attendee: { affected_rows: number } }>({
      mutation: deleteAttendeesByEventIds,
      variables: {
        eventIds,
      },
      update(cache, { data }) {
        if (data?.delete_Attendee?.affected_rows > 0) {

        }

        cache.modify({
          fields: {
            Attendee(existingAttendees: AttendeeType[] = []) {
              const filteredAttendees = existingAttendees.filter(e => {
                return !eventIds.includes(e.eventId)
              })
              return filteredAttendees;
            }
          }
        })
      }
    })



  } catch (e) {

  }
}
export const deleteAttendeesForEvent = async (
  client: ApolloClient<NormalizedCacheObject>,
  eventId: string,
) => {
  try {
    const res = await client.mutate<{ delete_Attendee: { affected_rows: number } }>({
      mutation: deleteAttendeesByEventId,
      variables: {
        eventId,
      },
    })



  } catch (e) {

  }
}
export const listAttendeesForEvent = async (
  client: ApolloClient<NormalizedCacheObject>,
  eventId: string,
) => {
  try {
    const { data } = await client.query<{ Attendee: AttendeeType[] }>({
      query: listAttendeesByEventId,
      variables: {
        eventId,
      },
    })


    return data?.Attendee
  } catch (e) {

  }
}

/** end */
