
import { dayjs } from '@lib/date-utils'

// dayjs.extend(utc)

import {
  AttendeeEmailType,
  AttendeePhoneNumberType,
  AttendeeImAddressType,
  AttendeeType,
} from '@lib/dataTypes/AttendeeType'
import { ApolloClient, gql, NormalizedCacheObject } from '@apollo/client'
import deleteAttendeesByEventId from '@lib/apollo/gql/deleteAttendeesByEventId'
import listAttendeesByEventId from '@lib/apollo/gql/listAttendeesByEventId'
import deleteAttendeesByEventIds from '@lib/apollo/gql/deleteAttendeesByEventIds'

export const upsertAttendeesInDb = async (
  client: ApolloClient<NormalizedCacheObject>,
  id: string,
  userId: string,
  eventId: string,
  emails: AttendeeEmailType[],
  name?: string | null,
  contactId?: string | null,
  phoneNumbers?: AttendeePhoneNumberType[] | null,
  imAddresses?: AttendeeImAddressType[] | null,
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
        if (data?.insert_Attendee?.affected_rows && data?.insert_Attendee?.affected_rows > 0) {
          console.log('insert_Attendee?.affected_rows', data)
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

    console.log(data, ' successfully inserted attendees for event')

  } catch (e) {
    console.log(e, ' unable to save attendees in db')
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
        if (data?.delete_Attendee?.affected_rows && data?.delete_Attendee?.affected_rows > 0) {
          console.log('delete_Attendee?.affected_rows', data)
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

    console.log(res?.data?.delete_Attendee?.affected_rows, 'successfully removed attendees for event')

  } catch (e) {
    console.log(e, ' unable to remove attendees for event')
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

    console.log(res?.data?.delete_Attendee?.affected_rows, 'successfully removed attendees for event')

  } catch (e) {
    console.log(e, ' unable to remove attendees for event')
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

    console.log(data?.Attendee, ' successfully received attendees')
    return data?.Attendee
  } catch (e) {
    console.log(e, ' unable to get attendees for event')
  }
}

/** end */
