import { formatErrorJSONResponse } from '@libs/api-gateway';
import { onScheduleDailyFeaturesApply7DayWindowToEventTrigger, } from '@libs/api-helper';
import { HasuraTriggerBodyType, } from '@libs/types';




const publisher = async (event) => {
  try {

    const eventItem: HasuraTriggerBodyType = JSON.parse(event.body)



    const payload = eventItem.payload

    // validate
    if (!payload?.body?.userId) {
      return formatErrorJSONResponse({
        message: 'no userId present',
        event,
      })
    }

    if (!payload?.body?.windowStartDate) {
      return formatErrorJSONResponse({
        message: 'no startDate',
        event,
      })
    }

    if (!payload?.body?.windowEndDate) {
      return formatErrorJSONResponse({
        message: 'no endDate',
        event,
      })
    }

    if (!payload?.body?.timezone) {
      return formatErrorJSONResponse({
        message: 'no timezone present',
        event,
      })
    }

    if (!payload?.autopilot?.userId) {
      return formatErrorJSONResponse({
        message: 'no autopilot userId present',
        event,
      })
    }

    if (!payload?.autopilot?.scheduleAt) {
      return formatErrorJSONResponse({
        message: 'no autopilot scheduleAt present',
        event,
      })
    }

    if (!payload?.autopilot?.timezone) {
      return formatErrorJSONResponse({
        message: 'no timezone present',
        event,
      })
    }

    if (!payload?.autopilot?.payload) {
      return formatErrorJSONResponse({
        message: 'no payload present',
        event,
      })
    }

    await onScheduleDailyFeaturesApply7DayWindowToEventTrigger(
      payload?.autopilot,
      payload?.body,
    )

    return {
      statusCode: 200,
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
