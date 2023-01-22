import { formatErrorJSONResponse } from '@libs/api-gateway';
import { createZoomMeeting, getZoomAPIToken } from '@libs/api-helper';
import { CreateZoomMeetObjectType } from '@libs/types';




const publisher = async (event) => {
  try {

    const eventItem: CreateZoomMeetObjectType = JSON.parse(event.body)

    // validate
    if (!eventItem?.startDate) {
      return formatErrorJSONResponse({
        message: 'no startDate present',
        event,
      })
    }

    if (!eventItem?.timezone) {
      return formatErrorJSONResponse({
        message: 'no timezone',
        event,
      })
    }

    if (!eventItem?.agenda) {
      return formatErrorJSONResponse({
        message: 'no agenda',
        event,
      })
    }

    if (!eventItem?.duration) {
      return formatErrorJSONResponse({
        message: 'no duration',
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

    const res = await createZoomMeeting(
      zoomToken,
      eventItem?.startDate,
      eventItem?.timezone,
      eventItem?.agenda,
      eventItem?.duration,
      eventItem?.contactName,
      eventItem?.contactEmail,
      eventItem?.meetingInvitees,
      eventItem?.privateMeeting,
    )

    return {
      statusCode: 202,
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
