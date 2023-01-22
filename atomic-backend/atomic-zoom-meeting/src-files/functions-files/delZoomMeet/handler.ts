import { formatErrorJSONResponse } from '@libs/api-gateway';
import { deleteZoomMeeting, getZoomAPIToken } from '@libs/api-helper';
import { DeleteZoomMeetObjectType } from '@libs/types';




const publisher = async (event) => {
  try {

    const eventItem: DeleteZoomMeetObjectType = JSON.parse(event.body)

    // validate
    if (!eventItem?.meetingId) {
      return formatErrorJSONResponse({
        message: 'no meetingId present',
        event,
      })
    }

    if (!eventItem?.userId) {
      return formatErrorJSONResponse({
        message: 'no userId',
        event,
      })
    }

    const zoomToken = await getZoomAPIToken(event?.userId)

    await deleteZoomMeeting(
      zoomToken,
      eventItem?.meetingId,
      eventItem?.scheduleForReminder,
      eventItem?.cancelMeetingReminder,
    )

    return {
      statusCode: 202,
      body: JSON.stringify({
        message: 'event added to queue',
        event,
      }),
    }

  } catch (e) {



    message: `error processing queue mesages: message: ${e?.message}, code: ${e?.statusCode}`,
      event,
    }))
}
}

export const main = publisher;
