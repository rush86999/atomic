import { Request, Response } from 'express'


import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

import { google } from 'googleapis'
import { v4 as uuidv4 } from 'uuid'
import { deleteAttendees, deleteConferences, deleteEvents, deleteReminders, getGoogleAPIToken, getGoogleCalendarInDb, getGoogleColor, getGoogleIntegration, insertRemindersGivenEventResource, requestCalendarWatch, updateGoogleCalendarTokensInDb, updateGoogleIntegration, upsertAttendees2, insertCalendarWebhook, upsertConference2, upsertEvents2, getCalendarWebhookByCalendarId, stopCalendarWatch, deleteCalendarWebhookById, addToQueueForVectorSearch, addlocalItemsToEvent2VectorObjects } from '@google_calendar_sync/_libs/api-helper';
import {
  EventResourceType,
  colorTypeResponse,
} from '../_libs/types/googleCalendarSync/types'


import {
  googleCalendarResource,
} from '@google_calendar_sync/_libs/constants'
import { EventObjectForVectorType } from '@google_calendar_sync/_libs/types/event2Vectors/types';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc)
dayjs.extend(timezone)


export const initialGoogleCalendarSync2 = async (
  calendarId: string,
  userId: string,
  clientType: 'ios' | 'android' | 'web' | 'atomic-web',
  colorItem?: colorTypeResponse,
) => {
  try {
    let pageToken = ''
    let localItems: EventResourceType[] | [] = []
    const event2VectorObjects: EventObjectForVectorType[] | [] = []

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
    console.log(res.data)

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
    console.log(' initial events list')
    localItems = items as EventResourceType[]
    pageToken = nextPageToken

    // localItems
    addlocalItemsToEvent2VectorObjects(localItems, event2VectorObjects, calendarId)

    await updateGoogleCalendarTokensInDb(calendarId, nextSyncToken, nextPageToken)
    const status = 'cancelled'

    const deletedEvents = localItems.filter((e) => (e?.status === status))

    if (deletedEvents?.[0]?.id) {
      console.log(' initial delete events')
      const promises = [
        deleteAttendees(deletedEvents, calendarId),
        deleteReminders(deletedEvents, userId, calendarId)
      ]

      await Promise.all(promises)

      const alreadyDeletedEvents = await deleteEvents(deletedEvents, calendarId)
      await deleteConferences(alreadyDeletedEvents)
    }

    const eventsToUpsert = localItems?.filter((e) => (e?.status !== status))

    // no events to upsert exit
    if (!(eventsToUpsert?.[0]?.id)) {
      console.log('no events to upsert check next pagetoken')
      const variables: any = {
        calendarId,
        showDeleted: true,
        singleEvents: true,
      }

      if (pageToken) {
        variables.pageToken = pageToken
        const res = await googleCalendar.events.list(variables)
        console.log(res.data)

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
      console.log(' initial events upsert')
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
        console.log(res.data)

        const { items, nextPageToken, nextSyncToken } = res.data

        localItems = items as EventResourceType[]
        pageToken = nextPageToken
        // tokens in case something goes wrong
        // update pageToken and syncToken
        addlocalItemsToEvent2VectorObjects(localItems, event2VectorObjects, calendarId)

        await updateGoogleCalendarTokensInDb(calendarId, nextSyncToken, nextPageToken)

        const deletedEvents = localItems.filter((e) => (e?.status === status))

        if (deletedEvents?.[0]?.id) {
          console.log(count, '- loop count,  deleted events')
          const promises = [
            deleteAttendees(deletedEvents, calendarId),
            deleteReminders(deletedEvents, userId, calendarId)
          ]
          await Promise.all(promises)
          
          
          const alreadyDeletedEvents = await deleteEvents(deletedEvents, calendarId)
          await deleteConferences(alreadyDeletedEvents)
        }

        const eventsToUpsert = localItems?.filter((e) => (e?.status !== status))

        // no events to upsert exit
        if (!(eventsToUpsert?.[0]?.id)) {
          console.log('no events to upsert check next pagetoken')
          const variables: any = {
            calendarId,
            showDeleted: true,
            singleEvents: true,
          }

          if (pageToken) {
            variables.pageToken = pageToken
            const res = await googleCalendar.events.list(variables)
            console.log(res.data)

            const { items, nextPageToken, nextSyncToken } = res.data

            localItems = items as EventResourceType[]
            pageToken = nextPageToken

            addlocalItemsToEvent2VectorObjects(localItems, event2VectorObjects, calendarId)

            await updateGoogleCalendarTokensInDb(calendarId, nextSyncToken, nextPageToken)

            const deletedEvents = localItems.filter((e) => (e?.status === status))

            if (deletedEvents?.[0]?.id) {
              const promises = [
                deleteAttendees(deletedEvents, calendarId),
                deleteReminders(deletedEvents, userId, calendarId)
              ]

              await Promise.all(promises)
              
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

        console.log(count, '- loop count,  upsert events')
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

    await addToQueueForVectorSearch(userId, event2VectorObjects)

    return true
  } catch (e) {
    console.log(e, ' unable to initial google sync')
    return false
  }
}


const handler = async (req: Request, res: Response) => {
  try {
    console.log(req, ' event')
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
    const bodyObj = req.body
    // initial axios post
    console.log(req?.body, ' axios post')

    calendarIntegrationId = bodyObj?.calendarIntegrationId
    calendarId = bodyObj?.calendarId
    userId = bodyObj?.userId
    timezone = bodyObj?.timezone

    if (!timezone) {
      return res.status(400).json({
        message: 'no timezone present',
        event: bodyObj,
      })
    }

    if (!calendarIntegrationId) {
      return res.status(400).json({
        message: 'no calendarIntegrationId found',
        event: bodyObj,
      })
    }

    if (!calendarId) {
      return res.status(400).json({
        message: 'no calendarId found',
        event: bodyObj,
      })
    }

    if (!userId) {
      return res.status(400).json({
        message: 'no userId found',
        event: bodyObj,
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
      console.log(id, '-id, calendar was deleted')
      return res.status(400).json({
        message: `${id} -id, calendar was deleted`,
        event: bodyObj,
      })
    }

    if (!clientType) {
      return res.status(400).json({
        message: 'clientType is not available',
        event: bodyObj,
      })
    }

    // get colorItem
    const colorItem = await getGoogleColor(authToken)
    console.log(colorItem, ' colorItem inside googleCalendarSync')

    syncEnabled = await initialGoogleCalendarSync2(calendarId, userId, clientType, colorItem)

    // if sync is not enabled let the user go through oauth again if needed
    if (syncEnabled === false) {
      await updateGoogleIntegration(calendarIntegrationId, syncEnabled)
      return res.status(200).json({
        message: `sync is disabled for googleCalendarSync`,
        event: bodyObj,
      })
    }

    // create push notification
    const channelId = uuidv4()
    const token = uuidv4()

    console.log(channelId, token, ' channelId, token')

    const webhook = await getCalendarWebhookByCalendarId(calendarId)

    if (webhook?.id) {
      await stopCalendarWatch(webhook?.id, webhook?.resourceId)
      await deleteCalendarWebhookById(webhook?.id)
    }

    const response = await requestCalendarWatch(
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
      resourceId: response?.resourceId,
      resourceUri: response?.resourceUri,
      token,
      updatedAt: dayjs().format(),
      userId,
      calendarIntegrationId,
    })

    return res.status(200).json({
      message: `successfully taken care of googleCalendarySync!`,
      event: bodyObj,
    })
  } catch (e) {
    console.log(e, ' unable sync google calendar')

    return res.status(400).json({
      message: `error processing googleCalendarSync: message: ${e?.message}, code: ${e?.statusCode}`,
      event: e,
    })
  }
}

export default handler


