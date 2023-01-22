import { formatJSONResponse, formatErrorJSONResponse } from '@libs/api-gateway';
import { v4 as uuidv4 } from 'uuid'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'


import { deleteCalendarWebhookById, getCalendarWebhookById, requestCalendarWatch, insertCalendarWebhook } from '@libs/api-helper';

dayjs.extend(utc)
dayjs.extend(timezone)

const googleCalendarWatch = async (event) => {
  try {

    const body = JSON.parse(event.body)

    // validate
    const calendarId = body?.calendarId
    const userId = body?.userId
    const channelId = body?.channelId

    if (!calendarId) {

      return formatErrorJSONResponse({
        message: 'calendarId missing',
        event,
      })
    }

    if (!userId) {

      return formatErrorJSONResponse({
        message: 'userId is missing',
        event,
      })
    }

    if (!channelId) {

      return formatErrorJSONResponse({
        message: 'channelId is missing',
        event,
      })
    }

    const webhook = await getCalendarWebhookById(channelId)

    // validate
    const token = uuidv4()
    const newChannelId = uuidv4()

    const res = await requestCalendarWatch(
      calendarId,
      newChannelId,
      token,
      userId,
    )

    await deleteCalendarWebhookById(channelId)

    await insertCalendarWebhook({
      calendarId: calendarId,
      createdDate: dayjs().format(),
      expiration: dayjs().add(604800, 's').format(),
      id: newChannelId,
      resourceId: res?.resourceId,
      resourceUri: res?.resourceUri,
      token,
      updatedAt: dayjs().format(),
      userId,
      calendarIntegrationId: webhook?.calendarIntegrationId,
    })

    return formatJSONResponse({
      message: `successfully taken care of googleCalendaryWatch!`,
      event,
    })
  } catch (e) {


    return formatErrorJSONResponse({
      message: `error processing googleCalendarSync: message: ${e?.message}, code: ${e?.statusCode}`,
      event,
    })
  }
}

export const main = googleCalendarWatch


