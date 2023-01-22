
import { formatErrorJSONResponse } from '@libs/api-gateway';
import { sendBulkCancelToMeetingEmail } from '@libs/api-helpter';
import { BulkMeetingCancelledDetailsToAttendeeType } from '@libs/types';




const publisher = async (event) => {
  try {

    const eventItem: BulkMeetingCancelledDetailsToAttendeeType = JSON.parse(event.body)
    // validate

    if (!(eventItem?.attendees?.length > 0)) {
      return formatErrorJSONResponse({
        message: 'missing attendees',
        event,
      })
    }

    if (!eventItem?.hostName) {
      return formatErrorJSONResponse({
        message: 'missing hostName',
        event,
      })
    }

    if (!eventItem?.hostEmail) {
      return formatErrorJSONResponse({
        message: 'missing hostEmail',
        event,
      })
    }

    await sendBulkCancelToMeetingEmail(eventItem)

    return {
      statusCode: 202,
      body: JSON.stringify({
        message: 'email for meeting cancel sent',
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
