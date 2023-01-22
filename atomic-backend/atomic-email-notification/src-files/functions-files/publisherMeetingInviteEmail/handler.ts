
import { formatErrorJSONResponse } from '@libs/api-gateway';
import { sendBulkInviteToMeetingEmail } from '@libs/api-helpter';
import { BulkMeetingInviteDetailsToAttendeeType } from '@libs/types';




const publisher = async (event) => {
  try {

    const eventItem: BulkMeetingInviteDetailsToAttendeeType = JSON.parse(event.body)
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



    await sendBulkInviteToMeetingEmail(eventItem)

    return {
      statusCode: 202,
      body: JSON.stringify({
        message: 'email for meeting invite',
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
