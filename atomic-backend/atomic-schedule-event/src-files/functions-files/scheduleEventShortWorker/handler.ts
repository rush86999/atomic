import { SQSClient, DeleteMessageCommand, } from '@aws-sdk/client-sqs'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import duration from 'dayjs/plugin/duration'
import isBetween from 'dayjs/plugin/isBetween'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

import { MessageQueueType } from './types';
import _ from 'lodash'
import { listEventsForUserGivenDates, listMeetingAssistAttendeesGivenMeetingId, listMeetingAssistEventsForAttendeeGivenDates, listMeetingAssistPreferredTimeRangesGivenMeetingId, listPreferredTimeRangesForEvent, processEventsForOptaPlanner, listEventsForDate, convertMeetingAssistEventTypeToEventPlusType, convertEventToVectorSpace2, searchData3, processUserEventForCategoryDefaults, listCategoriesForEvent, processUserEventForCategoryDefaultsWithUserModifiedCategories, getEventFromPrimaryKey, deleteDocInSearch3, processUserEventWithFoundPreviousEvent, processUserEventWithFoundPreviousEventWithUserModifiedCategories, getUserPreferences, processEventWithFoundPreviousEventWithoutCategories } from '@libs/api-helper';
import { EventPlusType, EventType, MeetingAssistEventType, EventMeetingPlusType, MeetingAssistAttendeeType, RemindersForEventType, BufferTimeObjectType, CategoryType } from '@libs/types';
import { ReturnValueForEachMeetingAssistType } from '../../libs/types';

dayjs.extend(isoWeek)
dayjs.extend(duration)
dayjs.extend(isBetween)
dayjs.extend(timezone)
dayjs.extend(utc)

// Set the AWS Region.
const REGION = 'us-east-1' //e.g. 'us-east-1'
// Create SQS service object.
const sqsClient = new SQSClient({ region: REGION })





const processEventsForPlanning = async (
  mainHostId: string,
  internalAttendees: MeetingAssistAttendeeType[],
  meetingEventPlus: EventMeetingPlusType[], // events with a meetingId
  totalEvents: EventType[],
  oldEvents: EventType[],
  windowStartDate: string,
  windowEndDate: string,
  hostTimezone: string,
  externalAttendees?: MeetingAssistAttendeeType[],
  meetingAssistEvents?: MeetingAssistEventType[],
) => {
  try {
    const events: EventPlusType[] = _.cloneDeep(totalEvents)
    const userModifiedEvents: EventPlusType[] = []

    for (const event of events) {

      // get preferredTimeRanges
      const preferredTimeRanges = await listPreferredTimeRangesForEvent(event?.id)

      if (preferredTimeRanges?.length > 0) {

        userModifiedEvents.push({
          ...event,
          preferredTimeRanges: preferredTimeRanges,
        })
      } else {
        userModifiedEvents.push(event)
      }

    }


    return processEventsForOptaPlanner(
      mainHostId,
      internalAttendees,
      meetingEventPlus,
      [],
      userModifiedEvents,
      windowStartDate,
      windowEndDate,
      hostTimezone,
      oldEvents,
      externalAttendees,
      meetingAssistEvents,
      [],
      [],
    )

  } catch (e) {

  }
}

const processEachMeetingAssist = async (
  windowStartDate: string,
  windowEndDate: string,
  hostTimezone: string,
  meetingId: string,
  meetingEvent: EventType,
  listedEvents: EventPlusType[],
): Promise<ReturnValueForEachMeetingAssistType> => {
  try {
    const attendees = await listMeetingAssistAttendeesGivenMeetingId(meetingId)

    const externalAttendees = attendees.filter(a => !!a?.externalAttendee)

    const internalAttendees = attendees.filter(a => !a?.externalAttendee)
    // original meeting asssit events
    const meetingAssistEvents: MeetingAssistEventType[] = []
    // events for each user
    const events: EventType[] = []
    // events with a meetingId
    const meetingEvents: EventType[] = []
    meetingEvents.push(meetingEvent)
    // get events
    if (externalAttendees?.length > 0) {
      for (let i = 0; i < externalAttendees?.length; i++) {
        const newMeetingAssistEvents = await listMeetingAssistEventsForAttendeeGivenDates(
          externalAttendees[i].id,
          windowStartDate,
          windowEndDate,
          externalAttendees[i].timezone,
          hostTimezone,
        )


        const meetingAssistEventForMeeting = newMeetingAssistEvents.find(m => (m.meetingId === meetingId))
        const filteredMeetingAssistEvents = newMeetingAssistEvents.filter(e => (e?.meetingId !== meetingId))
        meetingAssistEvents.push(...filteredMeetingAssistEvents)
        if (meetingAssistEventForMeeting?.id) {
          meetingEvents.push(convertMeetingAssistEventTypeToEventPlusType(meetingAssistEventForMeeting, externalAttendees[i]?.userId))
        }

      }
    }

    for (let i = 0; i < internalAttendees.length; i++) {
      const newEvents = await listEventsForUserGivenDates(
        internalAttendees[i].userId,
        windowStartDate,
        windowEndDate,
        internalAttendees[i].timezone,
        hostTimezone,
      )
      const meetingAssistEventForMeeting = newEvents.find(e => (e?.meetingId === meetingId))
      const filteredNewEvents = newEvents.filter(e => (e?.meetingId !== meetingId))
      events.push(...filteredNewEvents)
      if (meetingAssistEventForMeeting?.id) {
        meetingEvents.push(meetingAssistEventForMeeting)
      }
    }

    const preferredTimesRanges = await listMeetingAssistPreferredTimeRangesGivenMeetingId(meetingId)

    const newUserModifiedMeetingEvents: EventMeetingPlusType[] = meetingEvents.map(me => ({
      ...me,
      preferredTimeRanges: preferredTimesRanges,
    }))

    const userModifiedEvents: EventPlusType[] = []

    for (const event of events) {

      // get preferredTimeRanges
      const preferredTimeRanges = await listPreferredTimeRangesForEvent(event?.id)
      if (preferredTimeRanges?.length > 0) {

        userModifiedEvents.push({
          ...event,
          preferredTimeRanges: preferredTimeRanges,
        })
      } else {
        userModifiedEvents.push(event)
      }
    }

    const filteredEvents = userModifiedEvents?.map(e => {
      const foundIndex = listedEvents.findIndex(l => (l?.id === e?.id))
      if (foundIndex > -1) {
        return null
      }
      return e
    })?.filter(e => (e !== null))

    return {
      events: filteredEvents,
      meetingAssistEvents,
      meetingEventsPlus: newUserModifiedMeetingEvents,
      internalAttendees,
      externalAttendees,
    }



  } catch (e) {

  }
}

const processEventShortApplyFeatures = async (event: EventPlusType) => {
  try {
    const hostId = event?.userId
    const windowStartDate = event?.startDate
    const windowEndDate = dayjs(event?.startDate?.slice(0, 19)).tz(event?.timezone, true).hour(23).minute(59).format()
    const hostTimezone = event?.timezone

    const preferredTimeRangesForEvent = await listPreferredTimeRangesForEvent(event?.id)
    event.preferredTimeRanges = preferredTimeRangesForEvent

    const events: EventPlusType[] = await listEventsForDate(hostId, windowStartDate, windowEndDate, hostTimezone)

    const userModifiedEvents: EventPlusType[] = []
    const newModifiedReminders: RemindersForEventType[] = []
    const newModifiedTimeBlockings: BufferTimeObjectType[] = []

    userModifiedEvents.push(...events)

    // 1. convert to vector space
    const { userId } = event
    const vector = await convertEventToVectorSpace2(event)


    // 2. find closest event
    const res = await searchData3(userId, vector)

    const results = res?.hits?.hits?.[0]


    // validate results
    if (!(results?._id) && !event?.userModifiedCategories) {

      // no previous event found use CategoryDefaults
      const {
        newEvent,
        newReminders,
        newTimeBlocking: newBufferTimes,
      } = await processUserEventForCategoryDefaults(event, vector)


      userModifiedEvents.push(newEvent)
      newModifiedReminders.push({
        eventId: newEvent?.id,
        reminders: newReminders,
      })
      newModifiedTimeBlockings.push(newBufferTimes)
    }

    if (!(results?._id) && event?.userModifiedCategories) {

      // no previous event found use user modified categories and category defaults
      const categories: CategoryType[] = await listCategoriesForEvent(event?.id)

      if (categories?.[0]?.id) {
        const {
          newEvent,
          newReminders,
          newTimeBlocking,
        } = await processUserEventForCategoryDefaultsWithUserModifiedCategories(event, vector)


        userModifiedEvents.push(newEvent)
        newModifiedReminders.push({
          eventId: newEvent?.id,
          reminders: newReminders,
        })
        newModifiedTimeBlockings.push(newTimeBlocking)
      } else {
        //  create new event datatype in elastic search
        // await putDataInSearch(event?.id, vector, userId)
        event.vector = vector
        userModifiedEvents.push(event)
      }
    }

    // previous event found use previous event to copy over values
    if (results?._id && !event?.userModifiedCategories) {
      // valdate as might be old deleted event
      const previousEvent = await getEventFromPrimaryKey(results?._id)
      if (previousEvent?.id) {
        const preferredTimeRanges = await listPreferredTimeRangesForEvent(results?._id)
        previousEvent.preferredTimeRanges = preferredTimeRanges
      }

      // there is no event found so change direction
      if (!previousEvent) {

        await deleteDocInSearch3(results?._id)
        if (!event?.userModifiedCategories) {

          // no previous event found use CategoryDefaults
          const {
            newEvent,
            newReminders,
            newTimeBlocking,
          } = await processUserEventForCategoryDefaults(event, vector)


          userModifiedEvents.push(newEvent)
          newModifiedReminders.push({
            eventId: newEvent?.id,
            reminders: newReminders,
          })
          newModifiedTimeBlockings.push(newTimeBlocking)
        }

      } else {
        const {
          newEvent,
          newReminders,
          newTimeBlocking,
        } = await processUserEventWithFoundPreviousEvent(event, results?._id)


        userModifiedEvents.push(newEvent)
        newModifiedReminders.push({
          eventId: newEvent?.id,
          reminders: newReminders,
        })
        newModifiedTimeBlockings.push(newTimeBlocking)
      }
    }

    if (results?._id && event?.userModifiedCategories) {
      // valdate as might be old deleted event
      const previousEvent = await getEventFromPrimaryKey(results?._id)
      if (previousEvent?.id) {
        const preferredTimeRanges = await listPreferredTimeRangesForEvent(results?._id)
        previousEvent.preferredTimeRanges = preferredTimeRanges
      }

      if (!previousEvent) {

        await deleteDocInSearch3(results?._id)

        if (event?.userModifiedCategories) {


          // no previous event found use user modified categories and category defaults
          const categories: CategoryType[] = await listCategoriesForEvent(event?.id)

          if (categories?.[0]?.id) {
            const {
              newEvent,
              newReminders,
              newTimeBlocking,
            } = await processUserEventForCategoryDefaultsWithUserModifiedCategories(event, vector)


            userModifiedEvents.push(newEvent)
            newModifiedReminders.push({
              eventId: newEvent?.id,
              reminders: newReminders,
            })
            newModifiedTimeBlockings.push(newTimeBlocking)
          } else {
            //  create new event datatype in elastic search
            // await putDataInSearch(event?.id, vector, userId)
            event.vector = vector
            userModifiedEvents.push(event)
          }
        }
      } else {
        // const categories: CategoryType[] = await listCategoriesForEvent(event?.id)
        const categories: CategoryType[] = await listCategoriesForEvent(event?.id)

        if (categories?.[0]?.id) {
          const {
            newEvent,
            newReminders,
            newTimeBlocking,
          } = await processUserEventWithFoundPreviousEventWithUserModifiedCategories(event, results?._id)


          userModifiedEvents.push(newEvent)
          newModifiedReminders.push({
            eventId: newEvent?.id,
            reminders: newReminders,
          })
          newModifiedTimeBlockings.push(newTimeBlocking)
        } else {

          // get previous event
          const previousEvent = await getEventFromPrimaryKey(results?._id)
          const preferredTimeRanges = await listPreferredTimeRangesForEvent(results?._id)
          previousEvent.preferredTimeRanges = preferredTimeRanges

          if (!previousEvent?.id) {
            throw new Error('previousEvent is missing')
          }
          const userPreferences = await getUserPreferences(userId)

          const {
            newModifiedEvent: newModifiedEvent1,
            newReminders: newReminders1,
            newTimeBlocking: newTimeBlocking1,
          } = await processEventWithFoundPreviousEventWithoutCategories(previousEvent, event, userPreferences, userId)

          userModifiedEvents.push(newModifiedEvent1)
          newModifiedReminders.push({
            eventId: newModifiedEvent1?.id,
            reminders: newReminders1,
          })
          newModifiedTimeBlockings.push(newTimeBlocking1)
        }
      }
    }

    const eventsWithMeetingId = events.filter(e => (!!e?.meetingId))

    const meetingAssistEvents: MeetingAssistEventType[] = []
    const meetingEventPlus: EventMeetingPlusType[] = []
    const internalAttendees: MeetingAssistAttendeeType[] = []
    const externalAttendees: MeetingAssistAttendeeType[] = []
    const filteredEvents: EventType[] = []

    /**
     * queue for each
     * parentKey: hostId/singletonId
     * oldChildKey: hostId/meetingId
     */

    filteredEvents.push(...userModifiedEvents)
    filteredEvents.push(...eventsWithMeetingId)

    for (const eventWithMeetingId of eventsWithMeetingId) {
      const returnValuesForEachMeeting = await processEachMeetingAssist(
        windowStartDate,
        windowEndDate,
        hostTimezone,
        eventWithMeetingId?.meetingId,
        eventWithMeetingId,
        events,
      )

      if (returnValuesForEachMeeting?.events?.length > 0) {
        const newEvents = returnValuesForEachMeeting?.events

        filteredEvents.push(...newEvents)
        events.push(...newEvents)
      }

      if (returnValuesForEachMeeting?.meetingAssistEvents?.length > 0) {
        meetingAssistEvents.push(...(returnValuesForEachMeeting?.meetingAssistEvents))
      }

      if (returnValuesForEachMeeting?.meetingEventsPlus) {
        meetingEventPlus.push(...(returnValuesForEachMeeting?.meetingEventsPlus))
      }

      if (returnValuesForEachMeeting?.internalAttendees) {
        internalAttendees.push(...(returnValuesForEachMeeting?.internalAttendees))
      }

      if (returnValuesForEachMeeting?.externalAttendees) {
        externalAttendees.push(...(returnValuesForEachMeeting?.externalAttendees))
      }
    }

    return processEventsForPlanning(
      hostId,
      _.uniqWith(internalAttendees, _.isEqual),
      meetingEventPlus,
      _.uniqWith(filteredEvents, _.isEqual),
      events,
      windowStartDate,
      windowEndDate,
      hostTimezone,
      _.uniqWith(externalAttendees, _.isEqual),
      meetingAssistEvents?.length > 0 ? _.uniqWith(meetingAssistEvents, _.isEqual) : null,
    )

  } catch (e) {

  }
}


const processQueueMessage = async (event: EventPlusType) => {
  try {


    if (!event?.id) {
      throw new Error('no userId provided inside atomic meeting assist')
    }


    return processEventShortApplyFeatures(event)

  } catch (e) {

  }
}

const scheduleEventWorker = async (event: { Records: MessageQueueType[] }) => {
  try {

    // SQS may invoke with multiple messages
    const deletePromises = []
    for (const message of event.Records) {
      const deleteParams = {
        QueueUrl: process.env.EVENT_QUEUE_URL,
        ReceiptHandle: message.receiptHandle,
      }
      deletePromises.push(sqsClient.send(new DeleteMessageCommand(deleteParams)))
    }

    await Promise.all(deletePromises)

    const promises = []
    for (const message of event.Records) {

      const bodyData = JSON.parse(message.body)

      promises.push(processQueueMessage(bodyData))
    }

    await Promise.all(promises)

  } catch (e) {

  }
};

export const main = scheduleEventWorker;


