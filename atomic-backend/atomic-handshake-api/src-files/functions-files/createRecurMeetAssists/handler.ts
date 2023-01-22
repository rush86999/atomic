import { formatErrorJSONResponse, formatJSONResponse } from '@libs/api-gateway';
import { CreateRecurringMeetingAssistType } from '../../libs/types';
import { createRecurringMeetingAssists } from '@libs/api-helper';


const createRecurringMeetingAssistsHandler = async (event) => {
  try {
    const createRecurringMeetingBody: CreateRecurringMeetingAssistType = JSON.parse(event.body)

    const originalMeetingAssist = createRecurringMeetingBody?.originalMeetingAssist
    const originalPreferredTimes = createRecurringMeetingBody?.originalPreferredTimes


    if (!originalMeetingAssist?.id) {
      return formatErrorJSONResponse({
        message: 'no originalMeetingAssistt present',
        event,
      })
    }

    await createRecurringMeetingAssists(
      originalMeetingAssist,
      originalPreferredTimes
    )


    return formatJSONResponse({
      message: `successfully created meeting assists`,
      event,
    });

  } catch (e) {

    return formatErrorJSONResponse({
      message: 'no originalMeetingAssistt present',
      event: e,
    })
  }
};

export const main = createRecurringMeetingAssistsHandler;
