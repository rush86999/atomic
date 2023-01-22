import { formatErrorJSONResponse } from '@libs/api-gateway';
import { getZoomAPIToken, updateZoomMeeting } from '@libs/api-helper';
import { UpdateZoomMeetObjectType } from '@libs/types';




const publisher = async (event) => {
  try {

    const eventItem: UpdateZoomMeetObjectType = JSON.parse(event.body)

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

    await updateZoomMeeting(
      zoomToken,
      eventItem?.meetingId,
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
