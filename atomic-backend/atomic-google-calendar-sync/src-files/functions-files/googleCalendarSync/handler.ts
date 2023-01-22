import { formatJSONResponse, formatErrorJSONResponse } from '@libs/api-gateway';
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { google } from 'googleapis'
import { v4 as uuidv4 } from 'uuid'
import { deleteAttendees, deleteConferences, deleteEvents, deleteReminders, getGoogleAPIToken, getGoogleCalendarInDb, getGoogleColor, getGoogleIntegration, insertRemindersGivenEventResource, requestCalendarWatch, updateGoogleCalendarTokensInDb, updateGoogleIntegration, upsertAttendees2, insertCalendarWebhook, upsertConference2, upsertEvents2, getCalendarWebhookByCalendarId, stopCalendarWatch, deleteCalendarWebhookById } from '@libs/api-helper';
import {
  EventResourceType,
  colorTypeResponse,
} from './types'


import {
  googleCalendarResource,
} from '../../libs/constants'

dayjs.extend(utc)
dayjs.extend(timezone)

export const initialGoogleCalendarSync2 = async (
  calendarId: string,
  userId: string,
  clientType: 'ios' | 'android' | 'web',
  colorItem?: colorTypeResponse,
) => {
  try {
    let pageToken = ''
    let localItems: EventResourceType[] | [] = []

    const token = await getGoogleAPIToken(userId, googleCalendarResource, clientType)

    const googleCalendar = google.calendar({
      version: 'v3',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    const initialVariables = {
      calendarId,
      showDeleted: true,
      singleEvents: true,
    }

    const res = await googleCalendar.events.list(initialVariables)


    // {
    //   "accessRole": "my_accessRole",
    //   "defaultReminders": [],
    //   "description": "my_description",
    //   "etag": "my_etag",
    //   "items": [],
    //   "kind": "my_kind",
    //   "nextPageToken": "my_nextPageToken",
    //   "nextSyncToken": "my_nextSyncToken",
    //   "summary": "my_summary",
    //   "timeZone": "my_timeZone",
    //   "updated": "my_updated"
    // }
    const { items, nextPageToken, nextSyncToken } = res.data

    localItems = items as EventResourceType[]
    pageToken = nextPageToken

    await updateGoogleCalendarTokensInDb(calendarId, nextSyncToken, nextPageToken)
    const status = 'cancelled'

    const deletedEvents = localItems.filter((e) => (e?.status === status))

    if (deletedEvents?.[0]?.id) {

      const promises = [
        deleteAttendees(deletedEvents, calendarId),
        deleteReminders(deletedEvents, userId, calendarId)
      ]

      await Promise.all(promises)
      // remove any index
      // const toDeleteText = deletedEvents?.map(e => (`${e?.summary}${e?.description ? `: ${e?.description}` : ''}`))
      // 
      // const vectors = await Promise.all(toDeleteText?.map(t => convertTextToVectorSpace2(t)))
      // const results = await Promise.all(vectors?.map(v => searchData3(userId, v)))
      // 
      // for (const r of results) {
      //   if (r?.hits?.hits?.[0]?._id) {
      //     const id = r?.hits?.hits?.[0]?._id
      //     const foundEvent = deletedEvents.find(e => e?.id === id)
      //     if (foundEvent) {
      //       await deleteDocInSearch3(r?.hits?.hits?.[0]?._id)
      //     }
      //   }
      // }
      const alreadyDeletedEvents = await deleteEvents(deletedEvents, calendarId)
      await deleteConferences(alreadyDeletedEvents)
    }

    const eventsToUpsert = localItems?.filter((e) => (e?.status !== status))

    // no events to upsert exit
    if (!(eventsToUpsert?.[0]?.id)) {

      const variables: any = {
        calendarId,
        showDeleted: true,
        singleEvents: true,
      }

      if (pageToken) {
        variables.pageToken = pageToken
        const res = await googleCalendar.events.list(variables)


        const { items, nextPageToken, nextSyncToken } = res.data

        localItems = items as EventResourceType[]
        pageToken = nextPageToken

        await updateGoogleCalendarTokensInDb(calendarId, nextSyncToken, nextPageToken)

        const deletedEvents = localItems.filter((e) => (e?.status === status))

        if (deletedEvents?.[0]?.id) {
          const promises = [
            deleteAttendees(deletedEvents, calendarId),
            deleteReminders(deletedEvents, userId, calendarId)
          ]

          await Promise.all(promises)
          // remove any index
          // const toDeleteText = deletedEvents.map(e => (`${e?.summary}${e?.description ? `: ${e?.description}` : ''}`))
          // 
          // const vectors = await Promise.all(toDeleteText.map(t => convertTextToVectorSpace2(t)))
          // const results = await Promise.all(vectors.map(v => searchData3(userId, v)))
          // 
          // for (const r of results) {
          //   if (r?.hits?.hits?.[0]?._id) {
          //     const id = r?.hits?.hits?.[0]?._id
          //     const foundEvent = deletedEvents.find(e => e?.id === id)
          //     if (foundEvent) {
          //       await deleteDocInSearch3(r?.hits?.hits?.[0]?._id)
          //     }
          //   }
          // }
          const alreadyDeletedEvents = await deleteEvents(deletedEvents, calendarId)
          await deleteConferences(alreadyDeletedEvents)
        }

        const eventsToUpsert2 = localItems?.filter((e) => (e?.status !== status))

        if (eventsToUpsert2?.[0]?.id) {
          const promises = [
            deleteReminders(eventsToUpsert2, userId, calendarId),
            insertRemindersGivenEventResource(eventsToUpsert2, userId, calendarId),
            upsertAttendees2(eventsToUpsert2, userId, calendarId),
          ]
          await upsertConference2(eventsToUpsert2, userId, calendarId)
          await Promise.all(promises)
          await upsertEvents2(eventsToUpsert2, userId, calendarId, colorItem)
        }
      }
    } else {

      const promises = [
        deleteReminders(eventsToUpsert, userId, calendarId),
        insertRemindersGivenEventResource(eventsToUpsert, userId, calendarId),
        upsertAttendees2(eventsToUpsert, userId, calendarId),
      ]
      await upsertConference2(eventsToUpsert, userId, calendarId)
      await Promise.all(promises)
      await upsertEvents2(eventsToUpsert, userId, calendarId, colorItem)
    }
    let count = 0
    if (pageToken) {
      // fetch all pages
      while (pageToken) {

        const variables = {
          // Calendar identifier. To retrieve calendar IDs call the calendarList.list method. If you want to access the primary calendar of the currently logged in user, use the "primary" keyword.
          calendarId,
          // Whether to include deleted events (with status equals "cancelled") in the result. Cancelled instances of recurring events (but not the underlying recurring event) will still be included if showDeleted and singleEvents are both False. If showDeleted and singleEvents are both True, only single instances of deleted events (but not the underlying recurring events) are returned. Optional. The default is False.
          showDeleted: true,
          // Whether to expand recurring events into instances and only return single one-off events and instances of recurring events, but not the underlying recurring events themselves. Optional. The default is False.
          singleEvents: true,
          // Token specifying which result page to return. Optional.
          pageToken,
        }
        const res = await googleCalendar.events.list(variables)


        const { items, nextPageToken, nextSyncToken } = res.data

        localItems = items as EventResourceType[]
        pageToken = nextPageToken
        // tokens in case something goes wrong
        // update pageToken and syncToken

        await updateGoogleCalendarTokensInDb(calendarId, nextSyncToken, nextPageToken)

        const deletedEvents = localItems.filter((e) => (e?.status === status))

        if (deletedEvents?.[0]?.id) {

          const promises = [
            deleteAttendees(deletedEvents, calendarId),
            deleteReminders(deletedEvents, userId, calendarId)
          ]
          await Promise.all(promises)
          // remove any index
          // const toDeleteText = deletedEvents.map(e => (`${e?.summary}${e?.description ? `: ${e?.description}` : ''}`))
          // 
          // const vectors = await Promise.all(toDeleteText.map(t => convertTextToVectorSpace2(t)))
          // const results = await Promise.all(vectors.map(v => searchData3(userId, v)))
          // 
          // for (const r of results) {
          //   if (r?.hits?.hits?.[0]?._id) {
          //     const id = r?.hits?.hits?.[0]?._id
          //     const foundEvent = deletedEvents.find(e => e?.id === id)
          //     if (foundEvent) {
          //       await deleteDocInSearch3(r?.hits?.hits?.[0]?._id)
          //     }
          //   }
          // }
          const alreadyDeletedEvents = await deleteEvents(deletedEvents, calendarId)
          await deleteConferences(alreadyDeletedEvents)
        }

        const eventsToUpsert = localItems?.filter((e) => (e?.status !== status))

        // no events to upsert exit
        if (!(eventsToUpsert?.[0]?.id)) {

          const variables: any = {
            calendarId,
            showDeleted: true,
            singleEvents: true,
          }

          if (pageToken) {
            variables.pageToken = pageToken
            const res = await googleCalendar.events.list(variables)


            const { items, nextPageToken, nextSyncToken } = res.data

            localItems = items as EventResourceType[]
            pageToken = nextPageToken

            await updateGoogleCalendarTokensInDb(calendarId, nextSyncToken, nextPageToken)

            const deletedEvents = localItems.filter((e) => (e?.status === status))

            if (deletedEvents?.[0]?.id) {
              const promises = [
                deleteAttendees(deletedEvents, calendarId),
                deleteReminders(deletedEvents, userId, calendarId)
              ]

              await Promise.all(promises)
              // remove any index
              // const toDeleteText = deletedEvents.map(e => (`${e?.summary}${e?.description ? `: ${e?.description}` : ''}`))
              // 
              // const vectors = await Promise.all(toDeleteText.map(t => convertTextToVectorSpace2(t)))
              // const results = await Promise.all(vectors.map(v => searchData3(userId, v)))
              // 
              // for (const r of results) {
              //   if (r?.hits?.hits?.[0]?._id) {
              //     const id = r?.hits?.hits?.[0]?._id
              //     const foundEvent = deletedEvents.find(e => e?.id === id)
              //     if (foundEvent) {
              //       await deleteDocInSearch3(r?.hits?.hits?.[0]?._id)
              //     }
              //   }
              // }
              const alreadyDeletedEvents = await deleteEvents(deletedEvents, calendarId)
              await deleteConferences(alreadyDeletedEvents)
            }

            const eventsToUpsert2 = localItems?.filter((e) => (e?.status !== status))

            if (eventsToUpsert2?.[0]?.id) {
              const promises = [
                deleteReminders(eventsToUpsert2, userId, calendarId),
                insertRemindersGivenEventResource(eventsToUpsert2, userId, calendarId),
                upsertAttendees2(eventsToUpsert2, userId, calendarId),
              ]
              await upsertConference2(eventsToUpsert2, userId, calendarId)
              await Promise.all(promises)
              await upsertEvents2(eventsToUpsert2, userId, calendarId, colorItem)
            }
          }
          count++
          continue
        }


        const promises = [
          deleteReminders(eventsToUpsert, userId, calendarId),
          insertRemindersGivenEventResource(eventsToUpsert, userId, calendarId),
          upsertAttendees2(eventsToUpsert, userId, calendarId),
        ]
        await upsertConference2(eventsToUpsert, userId, calendarId)
        await Promise.all(promises)
        await upsertEvents2(eventsToUpsert, userId, calendarId, colorItem)
        count++
      }
    }
    return true
  } catch (e) {

    return false
  }
}


const googleCalendarSync = async (event) => {
  try {

    // custom validation
    /**
      axios post Body - stringified
      {
        calendarIntegrationId: string,
        calendarId: string,
        userId: string,
        eventTriggerId: string,
        isInitialSync: boolean,
        timezone: string,
      }
     */
    let calendarIntegrationId = ''
    let calendarId = ''
    let userId = ''
    let timezone = ''
    const bodyObj = JSON.parse(event.body)
    // initial axios post


    calendarIntegrationId = bodyObj?.calendarIntegrationId
    calendarId = bodyObj?.calendarId
    userId = bodyObj?.userId
    timezone = bodyObj?.timezone

    if (!timezone) {
      return formatErrorJSONResponse({
        message: 'no timezone present',
        event,
      })
    }

    if (!calendarIntegrationId) {
      return formatErrorJSONResponse({
        message: 'no calendarIntegrationId found',
        event,
      })
    }

    if (!calendarId) {
      return formatErrorJSONResponse({
        message: 'no calendarId found',
        event,
      })
    }

    if (!userId) {
      return formatErrorJSONResponse({
        message: 'no userId found',
        event,
      })
    }

    let syncEnabled = true

    const googleIntegration = await getGoogleIntegration(calendarIntegrationId)
    const clientType = googleIntegration?.clientType

    const calendarInDb = await getGoogleCalendarInDb(calendarId)

    const id = calendarInDb?.id

    const authToken = await getGoogleAPIToken(userId, googleCalendarResource, clientType)
    // const { pageToken, syncToken, id }

    if (!id) {

      return formatErrorJSONResponse({
        message: `${id} -id, calendar was deleted`,
        event,
      })
    }

    if (!clientType) {
      return formatErrorJSONResponse({
        message: 'clientType is not available',
        event,
      })
    }

    // get colorItem
    const colorItem = await getGoogleColor(authToken)


    syncEnabled = await initialGoogleCalendarSync2(calendarId, userId, clientType, colorItem)

    // if sync is not enabled let the user go through oauth again if needed
    if (syncEnabled === false) {
      await updateGoogleIntegration(calendarIntegrationId, syncEnabled)
      return formatJSONResponse({
        message: `sync is disabled for googleCalendarSync`,
        event,
      })
    }

    // create push notification
    const channelId = uuidv4()
    const token = uuidv4()



    const webhook = await getCalendarWebhookByCalendarId(calendarId)

    if (webhook?.id) {
      await stopCalendarWatch(webhook?.id, webhook?.resourceId)
      await deleteCalendarWebhookById(webhook?.id)
    }

    const res = await requestCalendarWatch(
      calendarId,
      channelId,
      token,
      userId,
    )

    await insertCalendarWebhook({
      calendarId,
      createdDate: dayjs().format(),
      expiration: dayjs().add(604800, 's').format(),
      id: channelId,
      resourceId: res?.resourceId,
      resourceUri: res?.resourceUri,
      token,
      updatedAt: dayjs().format(),
      userId,
      calendarIntegrationId,
    })

    return formatJSONResponse({
      message: `successfully taken care of googleCalendarySync!`,
      event,
    })
  } catch (e) {


    return formatErrorJSONResponse({
      message: `error processing googleCalendarSync: message: ${e?.message}, code: ${e?.statusCode}`,
      event,
    })
  }
}

export const main = googleCalendarSync


