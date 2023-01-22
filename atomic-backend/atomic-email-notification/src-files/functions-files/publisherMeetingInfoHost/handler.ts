
import { formatErrorJSONResponse } from '@libs/api-gateway';
import { sendMeetingInviteDetailsToHost } from '@libs/api-helpter';
import { MeetingInviteDetailsToHostType } from '@libs/types';




const publisher = async (event) => {
  try {

    const eventItem: MeetingInviteDetailsToHostType = JSON.parse(event.body)

    await sendMeetingInviteDetailsToHost(eventItem)


    return {
      statusCode: 202,
      body: JSON.stringify({
        message: 'email for meeting invite sent to host',
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
