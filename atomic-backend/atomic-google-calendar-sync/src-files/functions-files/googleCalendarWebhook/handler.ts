import { formatJSONResponse, formatErrorJSONResponse } from '@libs/api-gateway';

import { getCalendarWebhookById, getGoogleAPIToken, getGoogleCalendarInDb, getGoogleColor, getGoogleIntegration, incrementalGoogleCalendarSync2, updateGoogleIntegration } from '@libs/api-helper';
import { googleCalendarResource } from '../../libs/constants';
import { CalendarWebhookHeaders } from './types';


const googleCalendarWebhook = async (event) => {
  try {

    const headers: CalendarWebhookHeaders = event.headers

    if (headers['X-Goog-Resource-State'] === 'sync') {
      return formatJSONResponse({
        message: 'sync received successfully',
        event,
      })
    }

    // 
    const channelId = headers['X-Goog-Channel-ID']

    const webhook = await getCalendarWebhookById(channelId)

    // validate
    const token = headers['X-Goog-Channel-Token']

    if (webhook?.token !== token) {

      return formatErrorJSONResponse({
        message: 'tokens are not equal',
        event,
      })
    }

    // start incremental sync

    const googleIntegration = await getGoogleIntegration(webhook?.calendarIntegrationId)
    const clientType = googleIntegration?.clientType

    if (!clientType) {
      return formatErrorJSONResponse({
        message: 'clientType is not available',
        event,
      })
    }

    const calendarInDb = await getGoogleCalendarInDb(webhook?.calendarId)

    const pageToken = calendarInDb?.pageToken
    const syncToken = calendarInDb?.syncToken

    const authToken = await getGoogleAPIToken(webhook?.userId, googleCalendarResource, clientType)

    const colorItem = await getGoogleColor(authToken)


    if (!calendarInDb?.id) {

      return formatErrorJSONResponse({
        message: `${calendarInDb?.id} -id, calendar was deleted`,
        event,
      })
    }

    const syncEnabled = await incrementalGoogleCalendarSync2(webhook?.calendarId, webhook?.userId, clientType, syncToken, pageToken, colorItem)

    // if sync is not enabled let the user go through oauth again if needed
    if (syncEnabled === false) {
      await updateGoogleIntegration(webhook?.calendarIntegrationId, syncEnabled)
      return formatJSONResponse({
        message: `sync is disabled for googleCalendarSync`,
        event,
      })
    }



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

export const main = googleCalendarWebhook


