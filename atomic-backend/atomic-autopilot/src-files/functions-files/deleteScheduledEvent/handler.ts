import { formatErrorJSONResponse } from '@libs/api-gateway';
import { deleteScheduledEventForAutopilot } from '@libs/api-helper';
import { DeleteScheduledEventBody } from '@libs/types';




const publisher = async (event) => {
  try {

    const eventItem: DeleteScheduledEventBody = JSON.parse(event.body)

    // validate
    if (!eventItem) {
      return formatErrorJSONResponse({
        message: 'eventId missing',
        event,
      })
    }

    await deleteScheduledEventForAutopilot(eventItem)

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'event deleted',
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
