import { formatErrorJSONResponse } from '@libs/api-gateway';
import { getZoomAPIToken, getZoomMeeting } from '@libs/api-helper';
import { GetZoomMeetObjectType } from '@libs/types';




const publisher = async (event) => {
  try {

    const eventItem: GetZoomMeetObjectType = JSON.parse(event.body)

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

    const res = await getZoomMeeting(
      zoomToken,
      eventItem?.meetingId,
    )

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'event added to queue',
        event: res,
      }),
    }

  } catch (e) {



    message: `error processing queue mesages: message: ${e?.message}, code: ${e?.statusCode}`,
      event,
    }))
}
}

export const main = publisher;
