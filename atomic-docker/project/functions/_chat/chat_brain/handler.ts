
import { ChatBrainBodyType } from './types';
import { callOpenAI } from '@chat/_libs/api-helper';

import OpenAI from 'openai';
import { defaultOpenAIAPIKey, openAIChatGPT35Model } from '@chat/_libs/constants';
import { categorizeSkillFromUserInputExampleInput, categorizeSkillFromUserInputExampleOutput, categorizeSkillFromUserInputPrompt } from '@chat/_libs/prompts/categorizeSkillFromUserInput';
import { SkillMessageHistoryType, SkillType } from '@chat/_libs/types/Messaging/MessagingTypes';
import { dayjs } from '@chat/_libs/datetime/date-utils';
import { askAvailabilityControlCenterForPending } from '@chat/_libs/skills/askCalendar/askAvailability/api-helper';
import { askEventControlCenter } from '@chat/_libs/skills/askCalendar/findEvent/api-helper';
import { nextEventControlCenter } from '@chat/_libs/skills/askCalendar/nextEvent/api-helper';
import { addTaskControlCenter } from '@chat/_libs/skills/orderCalendar/addTask/api-helper';
import { blockOffTimeControlCenter } from '@chat/_libs/skills/orderCalendar/blockOffTime/api-helper';
import { cancelMeetingControlCenterPending } from '@chat/_libs/skills/orderCalendar/cancelMeeting/api-helper';
import { queryEventsControlCenter } from '@chat/_libs/skills/askCalendar/findEvents/api-helper';
import { createEventControlCenter } from '@chat/_libs/skills/orderCalendar/createEvent/api-helper';
import { deleteEventControlCenter } from '@chat/_libs/skills/orderCalendar/deleteEvent/api-helper';
import { deletePriorityControlCenter } from '@chat/_libs/skills/orderCalendar/deletePriority/api-helper';
import { deleteTaskControlCenter } from '@chat/_libs/skills/orderCalendar/deleteTask/api-helper';
import { EAPTToPreferredTimesControlCenter } from '@chat/_libs/skills/orderCalendar/editAddPreferredTimeToPreferredTimes/api-helper';
import { editEventControlCenter } from '@chat/_libs/skills/orderCalendar/editEvent/api-helper';
import { ERPT2PTControlCenter } from '@chat/_libs/skills/orderCalendar/editRemovePreferredTimeToPreferredTimes/api-helper';
import { FMTWPControlCenter } from '@chat/_libs/skills/orderCalendar/findMeetingTimeWithPermission/api-helper';
import { generateMeetingInviteControlCenter } from '@chat/_libs/skills/orderCalendar/generateMeetingInvite/api-helper';
import { RAPControlCenter } from '@chat/_libs/skills/orderCalendar/removeAllPreferedTimes/api-helper';
import { RCEControlCenter } from '@chat/_libs/skills/orderCalendar/resolveConflictingEvents/api-helper';
import { scheduleMeetingControlCenter } from '@chat/_libs/skills/orderCalendar/scheduleMeeting/api-helper';
import { sendMeetingInviteControlCenter } from '@chat/_libs/skills/orderCalendar/sendMeetingInvite/api-helper';
import { updateMeetingControlCenter } from '@chat/_libs/skills/orderCalendar/updateMeeting/api-helper';
import { updatePriorityControlCenter } from '@chat/_libs/skills/orderCalendar/updatePriority/api-helper';
import { updateTaskControlCenter } from '@chat/_libs/skills/orderCalendar/updateTask/api-helper';


const openai = new OpenAI({
  apiKey: defaultOpenAIAPIKey,
})


const processQueries = async (userId: string, timezone: string, messageHistoryObject: SkillMessageHistoryType) => {
  try {
    // const userInput = messageHistoryObject?.messages?.[messageHistoryObject?.messages?.length - 1]?.content
    // extractQueryUserInputTimeToJSONTemplate
    const userCurrentTime = dayjs().tz(timezone).format('dddd, YYYY-MM-DDTHH:mm:ssZ')

    switch (messageHistoryObject.skill) {
      case 'ask-availability':
        const messageHistoryObjectReturnedAskAvailability = await askAvailabilityControlCenterForPending(
          openai,
          userId,
          timezone,
          messageHistoryObject,
          userCurrentTime,
        )

        return messageHistoryObjectReturnedAskAvailability

      case 'find-event':
        const messageHistoryObjectReturnedAskEvent = await askEventControlCenter(
          openai,
          userId,
          timezone,
          messageHistoryObject,
          userCurrentTime,
          messageHistoryObject?.query,
        )

        return messageHistoryObjectReturnedAskEvent
      case 'find-events':
        const messageHistoryObjectReturnedAskEvents = await queryEventsControlCenter(
          openai,
          userId,
          timezone,
          messageHistoryObject,
          userCurrentTime,
          messageHistoryObject?.query,
        )

        return messageHistoryObjectReturnedAskEvents
      case 'find-next-event':
        const messageHistoryObjectReturnedNextEvent = await nextEventControlCenter(
          openai, userId, timezone, messageHistoryObject, userCurrentTime, messageHistoryObject?.query,
        )

        return messageHistoryObjectReturnedNextEvent

      case 'add-task':
        const messageHistoryObjectReturnedAddTask = await addTaskControlCenter(
          openai,
          userId,
          timezone,
          messageHistoryObject,
          userCurrentTime,
          messageHistoryObject?.query,
        )

        return messageHistoryObjectReturnedAddTask

      case 'block-off-time':
        const messageHistoryObjectReturnedBockOffTime = await blockOffTimeControlCenter(
          openai,
          userId,
          timezone,
          messageHistoryObject,
          userCurrentTime,
          messageHistoryObject.query,
        )

        return messageHistoryObjectReturnedBockOffTime
      case 'cancel-meeting':
        const messageHistoryObjectReturnedCancelMeeting = await cancelMeetingControlCenterPending(
          openai,
          userId,
          timezone,
          messageHistoryObject,
          userCurrentTime,
          messageHistoryObject.query,
        )

        return messageHistoryObjectReturnedCancelMeeting

      case 'create-event':
        const messageHistoryObjectReturnedCreateEvent = await createEventControlCenter(
          openai, userId, timezone, messageHistoryObject, userCurrentTime, messageHistoryObject.query,
        )

        return messageHistoryObjectReturnedCreateEvent

      case 'delete-event':
        const messageHistoryObjectReturnedDeleteEvent = await deleteEventControlCenter(
          openai, userId, timezone, messageHistoryObject, userCurrentTime, messageHistoryObject.query,
        )

        return messageHistoryObjectReturnedDeleteEvent

      case 'delete-priority':
        const messageHistoryObjectReturnedDeletePriority = await deletePriorityControlCenter(openai, userId, timezone, messageHistoryObject, userCurrentTime, messageHistoryObject.query)

        return messageHistoryObjectReturnedDeletePriority

      case 'delete-task':
        const messageHistoryObjectReturnedDeleteTask = await deleteTaskControlCenter(openai, userId, timezone, messageHistoryObject, userCurrentTime, messageHistoryObject?.query)
        return messageHistoryObjectReturnedDeleteTask
      case 'edit-add-preferred-time-to-preferred-times':
        // EAPTToPreferredTimesControlCenterPending
        const messageHistoryObjectReturnedEAPT = await EAPTToPreferredTimesControlCenter(openai, userId, timezone, messageHistoryObject, userCurrentTime, messageHistoryObject?.query)
        return messageHistoryObjectReturnedEAPT

      case 'edit-event':
        // editEventControlCenterPending
        const messageHistoryObjectReturnedEditEvent = await editEventControlCenter(openai, userId, timezone, messageHistoryObject, userCurrentTime, messageHistoryObject?.query)
        return messageHistoryObjectReturnedEditEvent

      case 'edit-remove-preferred-time-to-preferred-times':
        // ERPT2PTControlCenterPending
        const messageHistoryObjectReturnedERPT2PTs = await ERPT2PTControlCenter(openai, userId, timezone, messageHistoryObject, userCurrentTime, messageHistoryObject?.query)
        return messageHistoryObjectReturnedERPT2PTs

      case 'find-meeting-time-with-permission':
        // findMeetingTimeWithPermissionControlCenterPending
        const messageHistoryObjectReturnedFMTWP = await FMTWPControlCenter(
          openai, userId, timezone, messageHistoryObject, userCurrentTime, messageHistoryObject?.query
        )

        return messageHistoryObjectReturnedFMTWP
      case 'generate-meeting-invite':
        // generateMeetingInviteControlCenterPending
        const messageHistoryObjectReturnedGMI = await generateMeetingInviteControlCenter(
          openai, userId, timezone, messageHistoryObject, userCurrentTime, messageHistoryObject?.query
        )

        return messageHistoryObjectReturnedGMI

      case 'remove-all-preferred-times':
        // RAPControlCenterPending
        const messageHistoryObjectReturnedRAP = await RAPControlCenter(
          openai, userId, timezone, messageHistoryObject, userCurrentTime, messageHistoryObject?.query
        )

        return messageHistoryObjectReturnedRAP

      case 'resolve-conflicting-events':
        const messageHistoryObjectReturnedRCE = await RCEControlCenter(
          openai, userId, timezone, messageHistoryObject, userCurrentTime, messageHistoryObject?.query
        )

        return messageHistoryObjectReturnedRCE

      case 'schedule-meeting':
        // scheduleMeetingControlCenterPending
        const messageHistoryObjectReturnedScheduleMeeting = await scheduleMeetingControlCenter(
          openai, userId, timezone, messageHistoryObject, userCurrentTime, messageHistoryObject?.query
        )

        return messageHistoryObjectReturnedScheduleMeeting

      case 'send-meeting-invite':
        // sendMeetingInviteControlCenterPending
        const messageHistoryObjectReturnedSMI = await sendMeetingInviteControlCenter(
          openai, userId, timezone, messageHistoryObject, userCurrentTime, messageHistoryObject?.query
        )

        return messageHistoryObjectReturnedSMI

      case 'update-meeting':
        // updateMeetingControlCenterPending
        const messageHistoryObjectReturnedUpdateMeeting = await updateMeetingControlCenter(
          openai, userId, timezone, messageHistoryObject, userCurrentTime, messageHistoryObject?.query
        )

        return messageHistoryObjectReturnedUpdateMeeting

      case 'update-priority':
        // updatePriorityControlCenterPending
        const messageHistoryObjectReturnedUpdatePriority = await updatePriorityControlCenter(
          openai, userId, timezone, messageHistoryObject, userCurrentTime, messageHistoryObject?.query
        )

        return messageHistoryObjectReturnedUpdatePriority

      case 'update-task':
        // updateTaskControlCenterPending
        const messageHistoryObjectReturnedUpdateTask = await updateTaskControlCenter(
          openai, userId, timezone, messageHistoryObject, userCurrentTime, messageHistoryObject?.query
        )

        return messageHistoryObjectReturnedUpdateTask

      default:
        const messageHistoryObjectReturnedAskEventsDefault = await queryEventsControlCenter(
          openai,
          userId,
          timezone,
          messageHistoryObject,
          userCurrentTime,
          messageHistoryObject?.query,
        )

        return messageHistoryObjectReturnedAskEventsDefault
    }
  } catch (e) {
    console.log(e, ' unable to process pending queries')
  }
}

const assistant_brain = async (event) => {
  const body = event

  try {

    console.log(body, ' body inside assistant_brain')
    const bodyObject: ChatBrainBodyType = JSON.parse(Buffer.from(body).toString())
    console.log(bodyObject, ' bodyObject inside assistant_brain')
    const userId = bodyObject?.userId
    const timezone = bodyObject?.timezone
    const messageHistoryObject = bodyObject?.chat


    // validate 
    if (!userId) {
      throw new Error('no userId provided')
    }

    if (!timezone) {
      throw new Error('no timezone provided')
    }

    if (!messageHistoryObject) {
      throw new Error('no messageHistoryObject')
    }

    if (messageHistoryObject?.skill === 'pending') {

      // find out which skill
      const openAIResSkill = await callOpenAI(openai, categorizeSkillFromUserInputPrompt, openAIChatGPT35Model, messageHistoryObject?.messages?.[messageHistoryObject?.messages?.length - 1]?.content, categorizeSkillFromUserInputExampleInput, categorizeSkillFromUserInputExampleOutput)
      console.log(openAIResSkill, ' openAIResSkill')
      messageHistoryObject.skill = openAIResSkill as SkillType

    }


    const res = await processQueries(userId, timezone, messageHistoryObject)

    return JSON.stringify(res)
  } catch (e) {
    console.log(e, ' unable to connect with or process handler')
    return JSON.stringify(e)
  }
};

export default assistant_brain;
