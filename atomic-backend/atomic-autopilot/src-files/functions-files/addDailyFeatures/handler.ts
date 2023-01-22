import { formatErrorJSONResponse } from '@libs/api-gateway';
import { createInitialFeaturesApplyToEventTrigger } from '@libs/api-helper';
import { AddDailyFeaturesApplyEventTriggerType } from '@libs/types';




const publisher = async (event) => {
  try {

    const eventItem: AddDailyFeaturesApplyEventTriggerType = JSON.parse(event.body)

    // validate
    if (!eventItem?.body?.userId) {
      return formatErrorJSONResponse({
        message: 'no userId present',
        event,
      })
    }

    if (!eventItem?.body?.windowStartDate) {
      return formatErrorJSONResponse({
        message: 'no startDate',
        event,
      })
    }

    if (!eventItem?.body?.windowEndDate) {
      return formatErrorJSONResponse({
        message: 'no endDate',
        event,
      })
    }

    if (!eventItem?.body?.timezone) {
      return formatErrorJSONResponse({
        message: 'no timezone present',
        event,
      })
    }

    if (!eventItem?.autopilot?.userId) {
      return formatErrorJSONResponse({
        message: 'no autopilot userId present',
        event,
      })
    }

    if (!eventItem?.autopilot?.scheduleAt) {
      return formatErrorJSONResponse({
        message: 'no autopilot scheduleAt present',
        event,
      })
    }

    if (!eventItem?.autopilot?.timezone) {
      return formatErrorJSONResponse({
        message: 'no timezone present',
        event,
      })
    }

    if (!eventItem?.autopilot?.payload) {
      return formatErrorJSONResponse({
        message: 'no payload present',
        event,
      })
    }

    await createInitialFeaturesApplyToEventTrigger(
      eventItem?.autopilot,
      eventItem?.body,
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
