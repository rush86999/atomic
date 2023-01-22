
import { CalendarEventReadable } from 'react-native-calendar-events'
import {
  TimelineEventProps,
} from 'react-native-calendars'

import _ from 'lodash'
import { v4 as uuid } from 'uuid'
import { Dispatch, SetStateAction } from 'react'
import { RRule } from 'rrule'

import { dayjs, RNLocalize } from '@app/date-utils'

import {
  createGoogleEvent,
} from '@app/calendar/googleCalendarHelper'

import { palette } from '@theme/theme'

import {
  CalendarType,
} from '@app/dataTypes/CalendarType'
import {
  Time,
  BufferTime,
} from '@app/dataTypes/EventType'
import {
  CalendarIntegrationType,
} from '@dataTypes/calendar_integrationType'
import {
  EventType,
  recurrenceRule,
  attachment,
  LocationType,
  creator,
  organizer,
  extendedProperties,
  source,
  link,
} from '@app/dataTypes/EventType'
import {
  googleMeetName,
  googleCalendarResource,
  localCalendarName,
  localCalendarResource,
} from '@app/calendar/constants'
import {
  GoogleAttendeeType,
  ConferenceDataType,
  GoogleReminderType,
  sendUpdates,
  transparency,
  visibility,
} from '@app/calendar/types'
import {
  zoomName,
  zoomResourceName,
} from '@app/zoom/constants'
import {
  zoomAvailable,
  createZoomMeeting,
} from '@app/zoom/zoomMeetingHelper'
import {
  accessRole,
  Person,
  RecurrenceFrequencyType,
} from '@screens/Calendar/types'
import {
  upsertCategoryEventConnection,
} from '@screens/Category/CategoryHelper'
import {
  createReminderForEvent,
} from '@screens/Calendar/Reminder/ReminderHelper'
import {
  parameterType,
  entryPoint,
  appType,
  conferenceNameType,
  ConferenceType,
} from '@app/dataTypes/ConferenceType'
import { upsertAttendeesInDb } from '@screens/Calendar/Attendee/AttendeeHelper'
import { createCalendarEventLocale, fetchAllLocalEvents, getLocalCalendar } from '@app/calendar/localCalendarHelper'
import { marked, TimelineEventExtendedProps } from '@screens/Calendar/UserViewCalendar'
import { Day } from '@models'
import { ApolloClient, NormalizedCacheObject, gql } from '@apollo/client';
import getCalendarById from '@app/apollo/gql/getCalendarById'
import getGlobalPrimaryCalendar from '@app/apollo/gql/getGlobalPrimaryCalendar'
import getAnyCalendar from '@app/apollo/gql/getAnyCalendar'
import getCalendarWithResource from '@app/apollo/gql/getCalendarWithResource'
import getCalendarIntegrationByResource from '@app/apollo/gql/getCalendarIntegrationByResourceAndName'
import listAllEvents from '@app/apollo/gql/listAllEvents'
import listCategoriesForEvents from '@app/apollo/gql/listCategoriesForEvents'
import getConferenceById from '@app/apollo/gql/getConferenceById'
import deleteEventById from '@app/apollo/gql/deleteEventById'
import { CategoryEventType } from '@app/dataTypes/Category_EventType'

export interface NewEventTime {
  hour: number;
  minutes: number;
  date?: string;
}

export const syncLocalCalendar = async (
  client: ApolloClient<NormalizedCacheObject>,
  userId: string,
) => {
  try {
    const events = await fetchAllLocalEvents(
      dayjs().subtract(2, 'y').format(),
      dayjs().add(2, 'y').format()
    )

    const reformattedEvents = reformatLocalEventsToDbEvents(events, userId)
    const promises = reformattedEvents.map(e => atomicUpsertEventInDb(
      client,
      e?.id,
      e?.eventId,
      userId,
      e?.startDate,
      e?.endDate,
      e?.createdDate,
      e?.deleted,
      e?.priority,
      e?.isFollowUp,
      e?.isPreEvent,
      e?.isPostEvent,
      e?.modifiable,
      e?.anyoneCanAddSelf,
      e?.guestsCanInviteOthers,
      e?.guestsCanSeeOtherGuests,
      e?.originalStartDate,
      e?.originalAllDay,
      e?.updatedAt,
      e?.calendarId,
      e?.title,
      e?.allDay,
      e?.recurrenceRule,
      e?.location,
      e?.notes,
      e?.attachments,
      e?.links,
      e?.timezone,
      e?.taskId,
      e?.taskType,
      e?.followUpEventId,
      e?.preEventId,
      e?.postEventId,
      e?.forEventId,
      e?.conferenceId,
      e?.maxAttendees,
      e?.sendUpdates,
      e?.status,
      e?.summary,
      e?.transparency,
      e?.visibility,
      e?.recurringEventId,
      e?.iCalUID,
      e?.htmlLink,
      e?.colorId,
      e?.creator,
      e?.organizer,
      e?.endTimeUnspecified,
      e?.recurrence,
      e?.originalTimezone,
      e?.attendeesOmitted,
      e?.extendedProperties,
      e?.hangoutLink,
      e?.guestsCanModify,
      e?.locked,
      e?.source,
      e?.eventType,
      e?.privateCopy,
      e?.backgroundColor,
      e?.foregroundColor,
      e?.useDefaultAlarms,
    ))
    await Promise.all(promises)
  } catch (e) {

  }
}

export const reformatLocalEventsToDbEvents = (
  events: CalendarEventReadable[],
  userId: string,
): EventType[] => {
  const formattedEvents: EventType[] = events.map(e => ({
    id: `${e?.id}#${e?.calendarId}`,
    eventId: e?.id,
    userId,
    title: e?.title,
    startDate: e?.startDate,
    endDate: e?.endDate,
    allDay: e?.allDay,
    location: { title: e?.location },
    notes: e?.notes || e?.description,
    timezone: e?.timeZone,
    createdDate: dayjs().toISOString(),
    deleted: false,
    modifiable: true,
    calendarId: e?.calendar?.id,
    originalStartDate: e?.occurrenceDate,
    updatedAt: dayjs().toISOString(),
    isFollowUp: false,
    isPreEvent: false,
    isPostEvent: false,
    anyoneCanAddSelf: false,
    guestsCanInviteOthers: false,
    guestsCanSeeOtherGuests: false,
    originalAllDay: false,
    priority: 1,
  }))
  return formattedEvents
}
export const getCurrentEvents = async (
  client: ApolloClient<NormalizedCacheObject>,
  userId: string,
) => {
  try {
    const { data } = await client.query<{ Event: EventType[] }>({
      query: listAllEvents,
      variables: {
        userId,
        start: dayjs().subtract(2, 'y').format(),
        end: dayjs().add(2, 'y').format(),
      },
      fetchPolicy: 'no-cache'
    })

    return data?.Event

  } catch (e) {

  }
}

export const reformatEventsForCalendar = (
  events: TimelineEventExtendedProps[],
): { [key: string]: TimelineEventExtendedProps[] } => _.groupBy(events, e => dayjs(e?.start).format('YYYY-MM-DD'))

export const reformatToEventsUIForCalendarFromDb = async (
  events: EventType[],
  client: ApolloClient<NormalizedCacheObject>,
) => {
  try {

    if (!(events?.length > 0)) {
      return
    }

    const tags = (await client.query<{ Category_Event: CategoryEventType[] }>({
      query: listCategoriesForEvents,
      variables: {
        eventIds: events?.map(e => e.id),
      },
    }))?.data?.Category_Event?.map(c => ({
      id: c.Category.id,
      name: c.Category.name,
      color: c.Category.color,
      eventId: c.eventId,
    }))

    const eventsModified: TimelineEventExtendedProps[] = events?.map((e) => {
      const tagsForEvent = tags?.filter(t => (t.eventId === e.id))
      const tagsModified = tagsForEvent?.map(t => ({
        id: t.id,
        name: t.name,
        color: t.color
      }))
      return {
        id: e?.id,
        start: dayjs.tz(e?.startDate.slice(0, 19), e?.timezone || RNLocalize.getTimeZone()).format(),
        end: dayjs.tz(e?.endDate.slice(0, 19), e?.timezone || RNLocalize.getTimeZone()).format(),
        title: e?.title || e?.summary,
        summary: e?.notes,
        color: tagsForEvent?.[0]?.color || e?.backgroundColor,
        tags: tagsModified,
        unlink: e?.unlink,
        priority: e?.priority,
        modifiable: e?.modifiable,
      }
    })
    return eventsModified
  } catch (e) {

  }
}

export const setCurrentEventsForCalendar = async (
  userId: string,
  client: ApolloClient<NormalizedCacheObject>,
  setEvents: Dispatch<SetStateAction<TimelineEventExtendedProps[]>>,
  setEventsByDate: Dispatch<SetStateAction<{ [key: string]: TimelineEventExtendedProps[] } | {}>>,
  setMarked: Dispatch<SetStateAction<marked>>,

) => {
  try {
    if (!userId) {

      return
    }
    if (!client) {

      return
    }
    const eventsFromDb = await getCurrentEvents(client, userId)

    const events = await reformatToEventsUIForCalendarFromDb(eventsFromDb, client)

    const eventsForCalendar = reformatEventsForCalendar(events)

    setEvents(events)
    setEventsByDate(eventsForCalendar)
    const newMarked = events?.reduce((acc: marked, e) => {
      const date = dayjs(e.start).format('YYYY-MM-DD')
      if (!acc?.[date]) {
        acc[date] = { marked: true, dotColor: e.color }
      }
      return acc
    }, {})

    setMarked(newMarked)

  } catch (e) {


  }
}

export const getCalendarInDb = async (
  client: ApolloClient<NormalizedCacheObject>,
  userId: string,
  calendarId?: string,
  globalPrimary?: boolean,
  resource?: string,
) => {
  try {
    if (calendarId) {
      const calendar = (await client.query<{ Calendar_by_pk: CalendarType }>({
        query: getCalendarById,
        variables: {
          id: calendarId,
        },
      })).data?.Calendar_by_pk
      return calendar
    } else if (globalPrimary && !calendarId) {
      const calendar = (await client.query<{ Calendar: CalendarType[] }>({
        query: getGlobalPrimaryCalendar,
        variables: {
          userId,
        },
      })).data?.Calendar?.[0]
      return calendar
    } else if (!globalPrimary && !calendarId && !resource) {
      const calendar = (await client.query<{ Calendar: CalendarType[] }>({
        query: getAnyCalendar,
        variables: {
          userId,
        },
      })).data?.Calendar?.[0]
      return calendar
    } else if (!globalPrimary && !calendarId && resource?.length > 0) {
      const calendar = (await client.query<{ Calendar: CalendarType[] }>({
        query: getCalendarWithResource,
        variables: {
          userId,
          resource,
        },
      })).data?.Calendar?.[0]
      return calendar
    }

  } catch (e) {

  }
}

export const upsertLocalCalendar = async (
  client: ApolloClient<NormalizedCacheObject>,
  id: string,
  userId: string,
  title: string,
  backgroundColor: string,
  accessLevel?: accessRole,
  resource?: string,
  globalPrimary?: boolean,
  foregroundColor?: string,
) => {
  try {
    const calendarValueToUpsert = {
      id,
      userId,
      title,
      backgroundColor,
      accessLevel,
      resource,
      globalPrimary,
      deleted: false,
      createdDate: dayjs().toISOString(),
      updatedAt: dayjs().toISOString(),
    }

    const upsertCalendar = gql`
    mutation InsertCalendar($calendars: [Calendar_insert_input!]!) {
            insert_Calendar(
                objects: $calendars,
                on_conflict: {
                    constraint: Calendar_pkey,
                    update_columns: [
                      title,
                      colorId,
                      account,
                      ${accessLevel ? 'accessLevel,' : ''}
                      ${resource ? 'resource,' : ''}
                      modifiable,
                      defaultReminders,
                      ${globalPrimary ? 'globalPrimary,' : ''}
                      backgroundColor,
                      ${foregroundColor ? 'foregroundColor,' : ''}
                      deleted,
                      updatedAt,
                    ]
                }){
                returning {
                  id
                }
              }
       }
    `

    const result = await client.mutate<{ insert_Calendar: { returning: CalendarType[] } }>({
      mutation: upsertCalendar,
      variables: {
        calendars: [calendarValueToUpsert],
      },
    })

    return result.data?.insert_Calendar?.returning[0]

  } catch (e) {

  }
}

export const setNewEvent = (
  timeString: string,
  timeObject: NewEventTime,
  eventsByDate: { [key: string]: TimelineEventProps[] },
  setEventsByDate: Dispatch<SetStateAction<{ [key: string]: TimelineEventProps[] } | {}>>,
  title?: string,
  color?: string,
) => {
  const hourString = `${(timeObject.hour + 1).toString().padStart(2, '0')}`
  const minutesString = `${timeObject.minutes.toString().padStart(2, '0')}`

  const newEvent = {
    id: 'draft',
    start: `${timeString}`,
    end: `${timeObject.date} ${hourString}:${minutesString}:00`,
    title: title || 'New Event',
    color: color || palette.transparentPurple
  }

  if (timeObject.date) {
    if (eventsByDate[timeObject.date]) {
      eventsByDate[timeObject.date] = [...eventsByDate[timeObject.date], newEvent];
      setEventsByDate(eventsByDate)
    } else {
      eventsByDate[timeObject.date] = [newEvent];
      setEventsByDate({ ...eventsByDate });
    }
  }
}

export const getRruleFreq = (
  freq: RecurrenceFrequencyType
) => {
  switch (freq) {
    case 'daily':
      return RRule.DAILY
    case 'weekly':
      return RRule.WEEKLY
    case 'monthly':
      return RRule.MONTHLY
    case 'yearly':
      return RRule.YEARLY
  }
}

export const atomicUpsertEventInDb = async (
  client: ApolloClient<NormalizedCacheObject>,
  id: string,
  eventId: string,
  userId: string,
  startDate?: string,
  endDate?: string,
  createdDate?: string,
  deleted?: boolean,
  priority?: number,
  isFollowUp?: boolean,
  isPreEvent?: boolean,
  isPostEvent?: boolean,
  modifiable?: boolean,
  anyoneCanAddSelf?: boolean,
  guestsCanInviteOthers?: boolean,
  guestsCanSeeOtherGuests?: boolean,
  originalStartDate?: string,
  originalAllDay?: boolean,
  updatedAt?: string,
  calendarId?: string,
  title?: string,
  allDay?: boolean,
  recurrenceRule?: recurrenceRule,
  location?: LocationType,
  notes?: string,
  attachments?: attachment[],
  links?: link[],
  timezone?: string,
  taskId?: string,
  taskType?: string,
  followUpEventId?: string,
  preEventId?: string,
  postEventId?: string,
  forEventId?: string,
  conferenceId?: string,
  maxAttendees?: number,
  sendUpdates?: sendUpdates,
  status?: string,
  summary?: string,
  transparency?: transparency,
  visibility?: visibility,
  recurringEventId?: string,
  iCalUID?: string,
  htmlLink?: string,
  colorId?: string,
  creator?: creator,
  organizer?: organizer,
  endTimeUnspecified?: boolean,
  recurrence?: string[],
  originalTimezone?: string,
  attendeesOmitted?: boolean,
  extendedProperties?: extendedProperties,
  hangoutLink?: string,
  guestsCanModify?: boolean,
  locked?: boolean,
  source?: source,
  eventType?: string,
  privateCopy?: boolean,
  backgroundColor?: string,
  foregroundColor?: string,
  useDefaultAlarms?: boolean,
  positiveImpactScore?: number,
  negativeImpactScore?: number,
  positiveImpactDayOfWeek?: number,
  positiveImpactTime?: Time,
  negativeImpactDayOfWeek?: number,
  negativeImpactTime?: Time,
  preferredDayOfWeek?: number,
  preferredTime?: Time,
  isExternalMeeting?: boolean,
  isExternalMeetingModifiable?: boolean,
  isMeetingModifiable?: boolean,
  isMeeting?: boolean,
  dailyTaskList?: boolean,
  weeklyTaskList?: boolean,
  isBreak?: boolean,
  preferredStartTimeRange?: Time,
  preferredEndTimeRange?: Time,
  copyAvailability?: boolean,
  copyTimeBlocking?: boolean,
  copyTimePreference?: boolean,
  copyReminders?: boolean,
  copyPriorityLevel?: boolean,
  copyModifiable?: boolean,
  copyCategories?: boolean,
  copyIsBreak?: boolean,
  timeBlocking?: BufferTime,
  userModifiedAvailability?: boolean,
  userModifiedTimeBlocking?: boolean,
  userModifiedTimePreference?: boolean,
  userModifiedReminders?: boolean,
  userModifiedPriorityLevel?: boolean,
  userModifiedCategories?: boolean,
  userModifiedModifiable?: boolean,
  userModifiedIsBreak?: boolean,
  hardDeadline?: string,
  softDeadline?: string,
  copyIsMeeting?: boolean,
  copyIsExternalMeeting?: boolean,
  userModifiedIsMeeting?: boolean,
  userModifiedIsExternalMeeting?: boolean,
  duration?: number,
  copyDuration?: boolean,
  userModifiedDuration?: boolean,
  method?: 'create' | 'update',
  unlink?: boolean,
  byWeekDay?: string[],
  localSynced?: boolean,
  copyColor?: boolean,
  userModifiedColor?: boolean,
  meetingId?: string,
) => {
  try {

    const upsertEvent = gql`
       mutation InsertEvent($events: [Event_insert_input!]!) {
            insert_Event(
                objects: $events,
                on_conflict: {
                    constraint: Event_pkey,
                    update_columns: [
                      ${eventId ? 'eventId,' : ''}
                      ${meetingId ? 'meetingId,' : ''}
                      ${startDate ? 'startDate,' : ''}
                      ${endDate ? 'endDate,' : ''}
                      ${allDay ? 'allDay,' : ''}
                      ${recurrence !== undefined ? 'recurrence,' : ''}
                      ${recurrenceRule?.endDate !== undefined ? 'recurrenceRule,' : ''}
                      ${location?.title !== undefined ? 'location,' : ''}
                      ${notes !== undefined ? 'notes,' : ''}
                      ${attachments?.[0] !== undefined ? 'attachments,' : ''}
                      ${links?.[0] !== undefined ? 'links,' : ''}
                      ${timezone !== undefined ? 'timezone,' : ''}
                      ${taskId !== undefined ? 'taskId,' : ''}
                      ${taskType !== undefined ? 'taskType,' : ''}
                      ${priority !== undefined ? 'priority,' : ''}
                      ${followUpEventId !== undefined ? 'followUpEventId,' : ''}
                      ${isFollowUp !== undefined ? 'isFollowUp,' : ''}
                      ${isPreEvent !== undefined ? 'isPreEvent,' : ''}
                      ${isPostEvent !== undefined ? 'isPostEvent,' : ''}
                      ${preEventId !== undefined ? 'preEventId,' : ''}
                      ${postEventId !== undefined ? 'postEventId,' : ''}
                      ${modifiable !== undefined ? 'modifiable,' : ''}
                      ${forEventId !== undefined ? 'forEventId,' : ''}
                      ${conferenceId !== undefined ? 'conferenceId,' : ''}
                      ${maxAttendees !== undefined ? 'maxAttendees,' : ''}
                      ${attendeesOmitted !== undefined ? 'attendeesOmitted,' : ''}
                      ${sendUpdates !== undefined ? 'sendUpdates,' : ''}
                      ${anyoneCanAddSelf !== undefined ? 'anyoneCanAddSelf,' : ''}
                      ${guestsCanInviteOthers !== undefined ? 'guestsCanInviteOthers,' : ''}
                      ${guestsCanSeeOtherGuests !== undefined ? 'guestsCanSeeOtherGuests,' : ''}
                      ${originalStartDate !== undefined ? 'originalStartDate,' : ''}
                      ${originalTimezone !== undefined ? 'originalTimezone,' : ''}
                      ${originalAllDay !== undefined ? 'originalAllDay,' : ''}
                      ${status !== undefined ? 'status,' : ''}
                      ${summary !== undefined ? 'summary,' : ''}
                      ${transparency !== undefined ? 'transparency,' : ''}
                      ${visibility !== undefined ? 'visibility,' : ''}
                      ${recurringEventId !== undefined ? 'recurringEventId,' : ''}
                      ${htmlLink !== undefined ? 'htmlLink,' : ''}
                      ${colorId !== undefined ? 'colorId,' : ''}
                      ${creator !== undefined ? 'creator,' : ''}
                      ${organizer !== undefined ? 'organizer,' : ''}
                      ${endTimeUnspecified !== undefined ? 'endTimeUnspecified,' : ''}
                      ${extendedProperties !== undefined ? 'extendedProperties,' : ''}
                      ${hangoutLink !== undefined ? 'hangoutLink,' : ''}
                      ${guestsCanModify !== undefined ? 'guestsCanModify,' : ''}
                      ${locked !== undefined ? 'locked,' : ''}
                      ${source !== undefined ? 'source,' : ''}
                      ${eventType !== undefined ? 'eventType,' : ''}
                      ${privateCopy !== undefined ? 'privateCopy,' : ''}
                      ${backgroundColor !== undefined ? 'backgroundColor,' : ''}
                      ${foregroundColor !== undefined ? 'foregroundColor,' : ''}
                      ${useDefaultAlarms !== undefined ? 'useDefaultAlarms,' : ''}
                      ${positiveImpactScore !== undefined ? 'positiveImpactScore,' : ''}
                      ${negativeImpactScore !== undefined ? 'negativeImpactScore,' : ''}
                      ${positiveImpactDayOfWeek !== undefined ? 'positiveImpactDayOfWeek,' : ''}
                      ${positiveImpactTime !== undefined ? 'positiveImpactTime,' : ''}
                      ${negativeImpactDayOfWeek !== undefined ? 'negativeImpactDayOfWeek,' : ''}
                      ${negativeImpactTime !== undefined ? 'negativeImpactTime,' : ''}
                      ${preferredDayOfWeek !== undefined ? 'preferredDayOfWeek,' : ''}
                      ${preferredTime !== undefined ? 'preferredTime,' : ''}
                      ${isExternalMeeting !== undefined ? 'isExternalMeeting,' : ''}
                      ${isExternalMeetingModifiable !== undefined ? 'isExternalMeetingModifiable,' : ''}
                      ${isMeetingModifiable !== undefined ? 'isMeetingModifiable,' : ''}
                      ${isMeeting !== undefined ? 'isMeeting,' : ''}
                      ${dailyTaskList !== undefined ? 'dailyTaskList,' : ''}
                      ${weeklyTaskList !== undefined ? 'weeklyTaskList,' : ''}
                      ${isBreak !== undefined ? 'isBreak,' : ''}
                      ${preferredStartTimeRange !== undefined ? 'preferredStartTimeRange,' : ''}
                      ${preferredEndTimeRange !== undefined ? 'preferredEndTimeRange,' : ''}
                      ${deleted !== undefined ? 'deleted,' : ''}
                      ${updatedAt !== undefined ? 'updatedAt,' : ''}
                      ${iCalUID !== undefined ? 'iCalUID,' : ''}
                      ${calendarId !== undefined ? 'calendarId,' : ''}
                      ${copyAvailability !== undefined ? 'copyAvailability,' : ''}
                      ${copyTimeBlocking !== undefined ? 'copyTimeBlocking,' : ''}
                      ${copyTimePreference !== undefined ? 'copyTimePreference,' : ''}
                      ${copyReminders !== undefined ? 'copyReminders,' : ''}
                      ${copyPriorityLevel !== undefined ? 'copyPriorityLevel,' : ''}
                      ${copyModifiable !== undefined ? 'copyModifiable,' : ''}
                      ${copyCategories !== undefined ? 'copyCategories,' : ''}
                      ${copyIsBreak !== undefined ? 'copyIsBreak,' : ''}
                      ${timeBlocking !== undefined ? 'timeBlocking,' : ''}
                      ${userModifiedAvailability !== undefined ? 'userModifiedAvailability,' : ''}
                      ${userModifiedTimeBlocking !== undefined ? 'userModifiedTimeBlocking,' : ''}
                      ${userModifiedTimePreference !== undefined ? 'userModifiedTimePreference,' : ''}
                      ${userModifiedReminders !== undefined ? 'userModifiedReminders,' : ''}
                      ${userModifiedPriorityLevel !== undefined ? 'userModifiedPriorityLevel,' : ''}
                      ${userModifiedCategories !== undefined ? 'userModifiedCategories,' : ''}
                      ${userModifiedModifiable !== undefined ? 'userModifiedModifiable,' : ''}
                      ${userModifiedIsBreak !== undefined ? 'userModifiedIsBreak,' : ''}
                      ${hardDeadline !== undefined ? 'hardDeadline,' : ''}
                      ${softDeadline !== undefined ? 'softDeadline,' : ''}
                      ${copyIsMeeting !== undefined ? 'copyIsMeeting,' : ''}
                      ${copyIsExternalMeeting !== undefined ? 'copyIsExternalMeeting,' : ''}
                      ${userModifiedIsMeeting !== undefined ? 'userModifiedIsMeeting,' : ''}
                      ${userModifiedIsExternalMeeting !== undefined ? 'userModifiedIsExternalMeeting,' : ''}
                      ${duration !== undefined ? 'duration,' : ''}
                      ${copyDuration !== undefined ? 'copyDuration,' : ''}
                      ${userModifiedDuration !== undefined ? 'userModifiedDuration,' : ''}
                      ${method !== undefined ? 'method,' : ''}
                      ${unlink !== undefined ? 'unlink,' : ''}
                      ${copyColor !== undefined ? 'copyColor,' : ''}
                      ${userModifiedColor !== undefined ? 'userModifiedColor,' : ''}
                      ${byWeekDay?.[0] !== undefined ? 'byWeekDay,' : ''},
                      ${localSynced !== undefined ? 'localSynced,' : ''}
                      ${title !== undefined ? 'title,' : ''}
                    ]
                }){
                returning {
                  id
                  startDate
                  endDate
                  allDay
                  recurrence
                  recurrenceRule
                  location
                  notes
                  attachments
                  links
                  timezone
                  taskId
                  taskType
                  priority
                  followUpEventId
                  isFollowUp
                  isPreEvent
                  isPostEvent
                  preEventId
                  postEventId
                  modifiable
                  forEventId
                  conferenceId
                  maxAttendees
                  attendeesOmitted
                  sendUpdates
                  anyoneCanAddSelf
                  guestsCanInviteOthers
                  guestsCanSeeOtherGuests
                  originalStartDate
                  originalTimezone
                  originalAllDay
                  status
                  summary
                  title
                  transparency
                  visibility
                  recurringEventId
                  iCalUID
                  htmlLink
                  colorId
                  creator
                  organizer
                  endTimeUnspecified
                  extendedProperties
                  hangoutLink
                  guestsCanModify
                  locked
                  source
                  eventType
                  privateCopy
                  backgroundColor
                  foregroundColor
                  useDefaultAlarms
                  deleted
                  createdDate
                  updatedAt
                  userId
                  calendarId
                  positiveImpactScore
                  negativeImpactScore
                  positiveImpactDayOfWeek
                  positiveImpactTime
                  negativeImpactDayOfWeek
                  negativeImpactTime
                  preferredDayOfWeek
                  preferredTime
                  isExternalMeeting
                  isExternalMeetingModifiable
                  isMeetingModifiable
                  isMeeting
                  dailyTaskList
                  weeklyTaskList
                  isBreak
                  preferredStartTimeRange
                  preferredEndTimeRange
                  copyAvailability
                  copyTimeBlocking
                  copyTimePreference
                  copyReminders
                  copyPriorityLevel
                  copyModifiable
                  copyCategories
                  copyIsBreak
                  userModifiedAvailability
                  userModifiedTimeBlocking
                  userModifiedTimePreference
                  userModifiedReminders
                  userModifiedPriorityLevel
                  userModifiedCategories
                  userModifiedModifiable
                  userModifiedIsBreak
                  hardDeadline
                  softDeadline
                  copyIsMeeting
                  copyIsExternalMeeting
                  userModifiedIsMeeting
                  userModifiedIsExternalMeeting
                  duration
                  copyDuration
                  userModifiedDuration
                  method
                  unlink
                  copyColor
                  userModifiedColor
                  byWeekDay
                  localSynced
                  timeBlocking
                  meetingId
                  eventId
                }
                affected_rows
              }
       }
    `
    let event: EventType = {
      id,
      eventId,
      meetingId,
      userId,
      startDate,
      endDate,
      createdDate,
      deleted,
      priority: 1,
      isFollowUp: false,
      isPreEvent: false,
      isPostEvent: false,
      modifiable: false,
      anyoneCanAddSelf: false,
      guestsCanInviteOthers: false,
      guestsCanSeeOtherGuests: false,
      originalStartDate: startDate,
      originalAllDay: false,
      updatedAt: undefined,
      calendarId: undefined,
    }

    if (priority) {
      event.priority = priority
    }

    if (isFollowUp !== undefined) {
      event.isFollowUp = isFollowUp
    }

    if (isPreEvent !== undefined) {
      event.isPreEvent = isPreEvent
    }

    if (isPostEvent !== undefined) {
      event.isPostEvent = isPostEvent
    }

    if (modifiable !== undefined) {
      event.modifiable = modifiable
    }

    if (anyoneCanAddSelf !== undefined) {
      event.anyoneCanAddSelf = anyoneCanAddSelf
    }

    if (guestsCanInviteOthers !== undefined) {
      event.guestsCanInviteOthers = guestsCanInviteOthers
    }

    if (guestsCanSeeOtherGuests !== undefined) {
      event.guestsCanSeeOtherGuests = guestsCanSeeOtherGuests
    }

    if (originalStartDate !== undefined) {
      event.originalStartDate = originalStartDate
    }

    if (originalAllDay !== undefined) {
      event.originalAllDay = originalAllDay
    }

    if (updatedAt !== undefined) {
      event.updatedAt = updatedAt
    }

    if (calendarId !== undefined) {
      event.calendarId = calendarId
    }

    if (title !== undefined) {
      event.title = title
    }

    if (allDay !== undefined) {
      event.allDay = allDay
    }

    if (recurrenceRule !== undefined) {
      event.recurrenceRule = recurrenceRule
    }

    if (location !== undefined) {
      event.location = location
    }

    if (notes !== undefined) {
      event.notes = notes
    }

    if (attachments !== undefined) {
      event.attachments = attachments
    }

    if (links !== undefined) {
      event.links = links
    }

    if (timezone !== undefined) {
      event.timezone = timezone
    }

    if (taskId !== undefined) {
      event.taskId = taskId
    }

    if (taskType !== undefined) {
      event.taskType = taskType
    }

    if (followUpEventId !== undefined) {
      event.followUpEventId = followUpEventId
    }

    if (preEventId !== undefined) {
      event.preEventId = preEventId
    }

    if (postEventId !== undefined) {
      event.postEventId = postEventId
    }

    if (forEventId !== undefined) {
      event.forEventId = forEventId
    }

    if (conferenceId !== undefined) {
      event.conferenceId = conferenceId
    }

    if (maxAttendees !== undefined) {
      event.maxAttendees = maxAttendees
    }

    if (sendUpdates !== undefined) {
      event.sendUpdates = sendUpdates
    }

    if (status !== undefined) {
      event.status = status
    }

    if (summary !== undefined) {
      event.summary = summary
    }

    if (transparency !== undefined) {
      event.transparency = transparency
    }

    if (visibility !== undefined) {
      event.visibility = visibility
    }

    if (recurringEventId !== undefined) {
      event.recurringEventId = recurringEventId
    }

    if (iCalUID !== undefined) {
      event.iCalUID = iCalUID
    }

    if (htmlLink !== undefined) {
      event.htmlLink = htmlLink
    }

    if (colorId !== undefined) {
      event.colorId = colorId
    }

    if (creator !== undefined) {
      event.creator = creator
    }

    if (organizer !== undefined) {
      event.organizer = organizer
    }

    if (endTimeUnspecified !== undefined) {
      event.endTimeUnspecified = endTimeUnspecified
    }

    if (recurrence !== undefined) {
      event.recurrence = recurrence
    }

    if (originalTimezone !== undefined) {
      event.originalTimezone = originalTimezone
    }

    if (attendeesOmitted !== undefined) {
      event.attendeesOmitted = attendeesOmitted
    }

    if (hangoutLink !== undefined) {
      event.hangoutLink = hangoutLink
    }

    if (guestsCanModify !== undefined) {
      event.guestsCanModify = guestsCanModify
    }

    if (locked !== undefined) {
      event.locked = locked
    }

    if (source !== undefined) {
      event.source = source
    }

    if (eventType !== undefined) {
      event.eventType = eventType
    }

    if (privateCopy !== undefined) {
      event.privateCopy = privateCopy
    }

    if (guestsCanSeeOtherGuests !== undefined) {
      event.guestsCanSeeOtherGuests = guestsCanSeeOtherGuests
    }

    if (backgroundColor !== undefined) {
      event.backgroundColor = backgroundColor
    }

    if (foregroundColor !== undefined) {
      event.foregroundColor = foregroundColor
    }

    if (useDefaultAlarms !== undefined) {
      event.useDefaultAlarms = useDefaultAlarms
    }

    if (positiveImpactScore !== undefined) {
      event.positiveImpactScore = positiveImpactScore
    }

    if (negativeImpactScore !== undefined) {
      event.negativeImpactScore = negativeImpactScore
    }

    if (positiveImpactDayOfWeek !== undefined) {
      event.positiveImpactDayOfWeek = positiveImpactDayOfWeek
    }

    if (negativeImpactDayOfWeek !== undefined) {
      event.negativeImpactDayOfWeek = negativeImpactDayOfWeek
    }

    if (positiveImpactTime !== undefined) {
      event.positiveImpactTime = positiveImpactTime
    }

    if (negativeImpactTime !== undefined) {
      event.negativeImpactTime = negativeImpactTime
    }

    if (preferredDayOfWeek !== undefined) {
      event.preferredDayOfWeek = preferredDayOfWeek
    }

    if (preferredTime !== undefined) {
      event.preferredTime = preferredTime
    }

    if (isExternalMeeting !== undefined) {
      event.isExternalMeeting = isExternalMeeting
    }

    if (isExternalMeetingModifiable !== undefined) {
      event.isExternalMeetingModifiable = isExternalMeetingModifiable
    }

    if (isMeetingModifiable !== undefined) {
      event.isMeetingModifiable = isMeetingModifiable
    }

    if (isMeeting !== undefined) {
      event.isMeeting = isMeeting
    }

    if (dailyTaskList !== undefined) {
      event.dailyTaskList = dailyTaskList
    }

    if (weeklyTaskList !== undefined) {
      event.weeklyTaskList = weeklyTaskList
    }

    if (isBreak !== undefined) {
      event.isBreak = isBreak
    }

    if (preferredStartTimeRange !== undefined) {
      event.preferredStartTimeRange = preferredStartTimeRange
    }

    if (preferredEndTimeRange !== undefined) {
      event.preferredEndTimeRange = preferredEndTimeRange
    }

    if (copyAvailability !== undefined) {
      event.copyAvailability = copyAvailability
    }

    if (copyTimeBlocking !== undefined) {
      event.copyTimeBlocking = copyTimeBlocking
    }

    if (copyTimePreference !== undefined) {
      event.copyTimePreference = copyTimePreference
    }

    if (copyReminders !== undefined) {
      event.copyReminders = copyReminders
    }

    if (copyPriorityLevel !== undefined) {
      event.copyPriorityLevel = copyPriorityLevel
    }

    if (copyModifiable !== undefined) {
      event.copyModifiable = copyModifiable
    }

    if (copyCategories !== undefined) {
      event.copyCategories = copyCategories
    }

    if (copyIsBreak !== undefined) {
      event.copyIsBreak = copyIsBreak
    }

    if (timeBlocking !== undefined) {
      event.timeBlocking = timeBlocking
    }

    if (userModifiedAvailability !== undefined) {
      event.userModifiedAvailability = userModifiedAvailability
    }

    if (userModifiedTimeBlocking !== undefined) {
      event.userModifiedTimeBlocking = userModifiedTimeBlocking
    }

    if (userModifiedTimePreference !== undefined) {
      event.userModifiedTimePreference = userModifiedTimePreference
    }

    if (userModifiedReminders !== undefined) {
      event.userModifiedReminders = userModifiedReminders
    }

    if (userModifiedPriorityLevel !== undefined) {
      event.userModifiedPriorityLevel = userModifiedPriorityLevel
    }

    if (userModifiedCategories !== undefined) {
      event.userModifiedCategories = userModifiedCategories
    }

    if (userModifiedModifiable !== undefined) {
      event.userModifiedModifiable = userModifiedModifiable
    }

    if (userModifiedIsBreak !== undefined) {
      event.userModifiedIsBreak = userModifiedIsBreak
    }

    if (hardDeadline !== undefined) {
      event.hardDeadline = hardDeadline
    }

    if (softDeadline !== undefined) {
      event.softDeadline = softDeadline
    }

    if (copyIsMeeting !== undefined) {
      event.copyIsMeeting = copyIsMeeting
    }

    if (copyIsExternalMeeting !== undefined) {
      event.copyIsExternalMeeting = copyIsExternalMeeting
    }

    if (userModifiedIsMeeting !== undefined) {
      event.userModifiedIsMeeting = userModifiedIsMeeting
    }

    if (userModifiedIsExternalMeeting !== undefined) {
      event.userModifiedIsExternalMeeting = userModifiedIsExternalMeeting
    }

    if (duration !== undefined) {
      event.duration = duration
    }

    if (copyDuration !== undefined) {
      event.copyDuration = copyDuration
    }

    if (userModifiedDuration !== undefined) {
      event.userModifiedDuration = userModifiedDuration
    }

    if (method !== undefined) {
      event.method = method
    }

    if (unlink !== undefined) {
      event.unlink = unlink
    }

    if (copyColor !== undefined) {
      event.copyColor = copyColor
    }

    if (userModifiedColor !== undefined) {
      event.userModifiedColor = userModifiedColor
    }

    if (byWeekDay !== undefined) {
      event.byWeekDay = byWeekDay
    }

    if (localSynced !== undefined) {
      event.localSynced = localSynced
    }

    event.eventId = eventId

    if (meetingId !== undefined) {
      event.meetingId = meetingId
    }


    const variables = {
      events: [event]
    }

    const response = await client.mutate<{ insert_Event: { returning: EventType[], affected_rows: number } }>({
      mutation: upsertEvent,
      variables,
      update(cache, { data }) {
        if (data?.insert_Event?.affected_rows > 0) {

        }

        cache.modify({
          fields: {
            Event(existingEvents = []) {
              const newEventRef = cache.writeFragment({
                data: data?.insert_Event?.returning?.[0],
                fragment: gql`
                    fragment NewEvent on Event {
                      id
                      startDate
                      endDate
                      allDay
                      recurrence
                      recurrenceRule
                      location
                      notes
                      attachments
                      links
                      timezone
                      taskId
                      taskType
                      priority
                      followUpEventId
                      isFollowUp
                      isPreEvent
                      isPostEvent
                      preEventId
                      postEventId
                      modifiable
                      forEventId
                      conferenceId
                      maxAttendees
                      attendeesOmitted
                      sendUpdates
                      anyoneCanAddSelf
                      guestsCanInviteOthers
                      guestsCanSeeOtherGuests
                      originalStartDate
                      originalTimezone
                      originalAllDay
                      status
                      summary
                      title
                      transparency
                      visibility
                      recurringEventId
                      iCalUID
                      htmlLink
                      colorId
                      creator
                      organizer
                      endTimeUnspecified
                      extendedProperties
                      hangoutLink
                      guestsCanModify
                      locked
                      source
                      eventType
                      privateCopy
                      backgroundColor
                      foregroundColor
                      useDefaultAlarms
                      deleted
                      createdDate
                      updatedAt
                      userId
                      calendarId
                      positiveImpactScore
                      negativeImpactScore
                      positiveImpactDayOfWeek
                      positiveImpactTime
                      negativeImpactDayOfWeek
                      negativeImpactTime
                      preferredDayOfWeek
                      preferredTime
                      isExternalMeeting
                      isExternalMeetingModifiable
                      isMeetingModifiable
                      isMeeting
                      dailyTaskList
                      weeklyTaskList
                      isBreak
                      preferredStartTimeRange
                      preferredEndTimeRange
                      copyAvailability
                      copyTimeBlocking
                      copyTimePreference
                      copyReminders
                      copyPriorityLevel
                      copyModifiable
                      copyCategories
                      copyIsBreak
                      userModifiedAvailability
                      userModifiedTimeBlocking
                      userModifiedTimePreference
                      userModifiedReminders
                      userModifiedPriorityLevel
                      userModifiedCategories
                      userModifiedModifiable
                      userModifiedIsBreak
                      hardDeadline
                      softDeadline
                      copyIsMeeting
                      copyIsExternalMeeting
                      userModifiedIsMeeting
                      userModifiedIsExternalMeeting
                      duration
                      copyDuration
                      userModifiedDuration
                      method
                      unlink
                      copyColor
                      userModifiedColor
                      byWeekDay
                      localSynced
                      timeBlocking
                      meetingId
                      eventId
                    }
                  `
              });
              const filteredEvents = existingEvents?.filter((e: EventType) => (e?.id !== data?.insert_Event?.returning?.[0]?.id)) || []

              if (filteredEvents?.length > 0) {
                return filteredEvents.concat([newEventRef])
              }
              return [newEventRef]
            }
          }
        })
      }
    })

    return response?.data?.insert_Event?.returning?.[0]
  } catch (e) {

  }
}

export const getRRuleDay = (value: Day | undefined) => {
  switch (value) {
    case Day.MO:
      return RRule.MO
    case Day.TU:
      return RRule.TU
    case Day.WE:
      return RRule.WE
    case Day.TH:
      return RRule.TH
    case Day.FR:
      return RRule.FR
    case Day.SA:
      return RRule.SA
    case Day.SU:
      return RRule.SU
    default:
      return undefined
  }
}

export const createNewEventInLocale = async (
  client: ApolloClient<NormalizedCacheObject>,
  startDate: string,
  endDate: string,
  userId: string,
  title?: string,
  allDay?: boolean,
  recurringEndDate?: string,
  frequency?: RecurrenceFrequencyType,
  interval?: number,
  deadlineAlarms?: string[] | number[],
  notes?: string,
  location?: LocationType,
  isFollowUp?: boolean,
  isPreEvent?: boolean,
  isPostEvent?: boolean,
  modifiable?: boolean,
  anyoneCanAddSelf?: boolean,
  guestsCanInviteOthers?: boolean,
  guestsCanSeeOtherGuests?: boolean,
  originalAllDay?: boolean,
  alarms?: string[] | number[],
  timezone?: string,
  taskId?: string,
  taskType?: string,
  followUpEventId?: string,
  preEventId?: string,
  postEventId?: string,
  forEventId?: string,
  conferenceId?: string,
  maxAttendees?: number,
  sendUpdates?: sendUpdates,
  status?: string,
  summary?: string,
  transparency?: transparency,
  visibility?: visibility,
  recurringEventId?: string,
  iCalUID?: string,
  htmlLink?: string,
  colorId?: string,
  originalTimezone?: string,
  backgroundColor?: string,
  foregroundColor?: string,
  useDefaultAlarms?: boolean,
  positiveImpactScore?: number,
  negativeImpactScore?: number,
  positiveImpactDayOfWeek?: number,
  positiveImpactTime?: Time,
  negativeImpactDayOfWeek?: number,
  negativeImpactTime?: Time,
  preferredDayOfWeek?: number,
  preferredTime?: Time,
  isExternalMeeting?: boolean,
  isExternalMeetingModifiable?: boolean,
  isMeetingModifiable?: boolean,
  isMeeting?: boolean,
  dailyTaskList?: boolean,
  weeklyTaskList?: boolean,
  isBreak?: boolean,
  preferredStartTimeRange?: Time,
  preferredEndTimeRange?: Time,
  copyAvailability?: boolean,
  copyTimeBlocking?: boolean,
  copyTimePreference?: boolean,
  copyReminders?: boolean,
  copyPriorityLevel?: boolean,
  copyModifiable?: boolean,
  copyCategories?: boolean,
  copyIsBreak?: boolean,
  timeBlocking?: BufferTime,
  userModifiedAvailability?: boolean,
  userModifiedTimeBlocking?: boolean,
  userModifiedTimePreference?: boolean,
  userModifiedReminders?: boolean,
  userModifiedPriorityLevel?: boolean,
  userModifiedCategories?: boolean,
  userModifiedModifiable?: boolean,
  userModifiedIsBreak?: boolean,
  hardDeadline?: string,
  softDeadline?: string,
  copyIsMeeting?: boolean,
  copyIsExternalMeeting?: boolean,
  userModifiedIsMeeting?: boolean,
  userModifiedIsExternalMeeting?: boolean,
  duration?: number,
  copyDuration?: boolean,
  userModifiedDuration?: boolean,
  method?: 'create' | 'update',
  unlink?: boolean,
  byWeekDay?: Day[],
  priority?: number,
) => {
  try {

    const calendarId = await getLocalCalendar()

    if (!calendarId) {

      return
    }

    const inDbCalendar = await getCalendarInDb(client, userId, calendarId)

    if (!(inDbCalendar?.id)) {
      await upsertLocalCalendar(client, calendarId, userId, localCalendarName,
        palette['purple'], 'owner', localCalendarResource)
    }

    let rule: any = {}

    if (recurringEndDate?.length > 0 && frequency) {
      rule = new RRule({
        freq: getRruleFreq(frequency),
        interval,
        until: dayjs(endDate).toDate(),
        byweekday: byWeekDay?.map(i => getRRuleDay(i)),
      })
    }

    const eventId = await createCalendarEventLocale(
      calendarId,
      startDate,
      endDate || startDate,
      recurringEndDate,
      frequency,
      interval,
      title || 'New Event',
      deadlineAlarms,
      notes,
      location?.title,
    )

    await atomicUpsertEventInDb(
      client,
      `${eventId}#${inDbCalendar?.id ?? calendarId}`,
      eventId,
      userId,
      dayjs(startDate).format(),
      dayjs(endDate).format(),
      dayjs().toISOString(),
      false,
      priority || 1,
      isFollowUp ?? false,
      isPreEvent ?? false,
      isPostEvent ?? false,
      modifiable ?? true,
      anyoneCanAddSelf ?? false,
      guestsCanInviteOthers ?? false,
      guestsCanSeeOtherGuests ?? true,
      dayjs(startDate).format(),
      originalAllDay ?? false,
      dayjs().toISOString(),
      inDbCalendar?.id ?? calendarId,
      title ?? 'New Event',
      allDay ?? false,
      frequency
      && recurringEndDate
      && interval
      && { frequency, endDate: recurringEndDate, interval },
      location,
      notes,
      undefined,
      undefined,
      timezone ?? RNLocalize.getTimeZone(),
      taskId,
      taskType,
      followUpEventId,
      preEventId,
      postEventId,
      forEventId,
      conferenceId,
      maxAttendees,
      sendUpdates,
      status,
      summary,
      transparency,
      visibility,
      recurringEventId,
      iCalUID,
      htmlLink,
      colorId,
      undefined,
      undefined,
      false,
      frequency
      && recurringEndDate
      && interval
      && [rule.toString()],
      originalTimezone,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      backgroundColor,
      foregroundColor,
      useDefaultAlarms,
      positiveImpactScore,
      negativeImpactScore,
      positiveImpactDayOfWeek,
      positiveImpactTime,
      negativeImpactDayOfWeek,
      negativeImpactTime,
      preferredDayOfWeek,
      preferredTime,
      isExternalMeeting,
      isExternalMeetingModifiable,
      isMeetingModifiable,
      isMeeting,
      dailyTaskList,
      weeklyTaskList,
      isBreak,
      preferredStartTimeRange,
      preferredEndTimeRange,
      copyAvailability,
      copyTimeBlocking,
      copyTimePreference,
      copyReminders,
      copyPriorityLevel,
      copyModifiable,
      copyCategories,
      copyIsBreak,
      timeBlocking,
      userModifiedAvailability,
      userModifiedTimeBlocking,
      userModifiedTimePreference,
      userModifiedReminders,
      userModifiedPriorityLevel,
      userModifiedCategories,
      userModifiedModifiable,
      userModifiedIsBreak,
      hardDeadline,
      softDeadline,
      copyIsMeeting,
      copyIsExternalMeeting,
      userModifiedIsMeeting,
      userModifiedIsExternalMeeting,
      duration,
      copyDuration,
      userModifiedDuration,
      method,
      unlink,
    )

    const promises = alarms?.map(a => createReminderForEvent(
      client,
      userId,
      eventId,
      (typeof a === 'string') && a,
      timezone,
      (typeof a === 'number') && a,
      useDefaultAlarms,
    ))
    await Promise.all(promises)

    return eventId
  } catch (e) {

  }
}

export const createNewEventInGoogle = async (
  startDate: string,
  endDate: string,
  userId: string,
  client: ApolloClient<NormalizedCacheObject>,
  calendar: CalendarType,
  conferenceData?: ConferenceDataType,
  attendees?: GoogleAttendeeType[],
  title?: string,
  allDay?: boolean,
  recurringEndDate?: string,
  frequency?: RecurrenceFrequencyType,
  interval?: number,
  notes?: string,
  location?: LocationType,
  isFollowUp?: boolean,
  isPreEvent?: boolean,
  isPostEvent?: boolean,
  modifiable?: boolean,
  anyoneCanAddSelf?: boolean,
  guestsCanInviteOthers?: boolean,
  guestsCanSeeOtherGuests?: boolean,
  originalAllDay?: boolean,
  alarms?: string[] | number[],
  timezone?: string,
  taskId?: string,
  taskType?: string,
  followUpEventId?: string,
  preEventId?: string,
  postEventId?: string,
  forEventId?: string,
  maxAttendees?: number,
  sendUpdates?: sendUpdates,
  status?: string,
  transparency?: transparency,
  visibility?: visibility,
  iCalUID?: string,
  backgroundColor?: string,
  foregroundColor?: string,
  colorId?: string,
  originalTimezone?: string,
  useDefaultAlarms?: boolean,
  positiveImpactScore?: number,
  negativeImpactScore?: number,
  positiveImpactDayOfWeek?: number,
  positiveImpactTime?: Time,
  negativeImpactDayOfWeek?: number,
  negativeImpactTime?: Time,
  preferredDayOfWeek?: number,
  preferredTime?: Time,
  isExternalMeeting?: boolean,
  isExternalMeetingModifiable?: boolean,
  isMeetingModifiable?: boolean,
  isMeeting?: boolean,
  dailyTaskList?: boolean,
  weeklyTaskList?: boolean,
  isBreak?: boolean,
  preferredStartTimeRange?: Time,
  preferredEndTimeRange?: Time,
  copyAvailability?: boolean,
  copyTimeBlocking?: boolean,
  copyTimePreference?: boolean,
  copyReminders?: boolean,
  copyPriorityLevel?: boolean,
  copyModifiable?: boolean,
  copyCategories?: boolean,
  copyIsBreak?: boolean,
  timeBlocking?: BufferTime,
  userModifiedAvailability?: boolean,
  userModifiedTimeBlocking?: boolean,
  userModifiedTimePreference?: boolean,
  userModifiedReminders?: boolean,
  userModifiedPriorityLevel?: boolean,
  userModifiedCategories?: boolean,
  userModifiedModifiable?: boolean,
  userModifiedIsBreak?: boolean,
  hardDeadline?: string,
  softDeadline?: string,
  copyIsMeeting?: boolean,
  copyIsExternalMeeting?: boolean,
  userModifiedIsMeeting?: boolean,
  userModifiedIsExternalMeeting?: boolean,
  duration?: number,
  copyDuration?: boolean,
  userModifiedDuration?: boolean,
  method?: 'create' | 'update',
  unlink?: boolean,
  byWeekDay?: Day[],
  priority?: number,
) => {
  try {

    let rule: any = {}

    if ((recurringEndDate?.length > 0) && frequency) {
      rule = new RRule({
        freq: getRruleFreq(frequency),
        interval,
        until: dayjs(recurringEndDate).toDate(),
        byweekday: byWeekDay?.map(i => getRRuleDay(i))
      })
    }

    let modifiedAlarms: GoogleReminderType = null

    if (typeof alarms?.[0] === 'string') {
      modifiedAlarms = {
        useDefault: false, overrides: alarms.map(i => ({
          method: 'email',
          minutes: dayjs(startDate).diff(i, 'm'),
        }))
      }
    } else if (typeof alarms?.[0] === 'number') {
      modifiedAlarms = { useDefault: false, overrides: alarms.map(i => ({ method: 'email', minutes: i as number })) }
    } else if (useDefaultAlarms) {
      modifiedAlarms = { useDefault: useDefaultAlarms }
    }

    const eventId = await createGoogleEvent(
      client,
      userId,
      calendar?.id,
      endDate,
      startDate,
      undefined,
      maxAttendees,
      sendUpdates,
      anyoneCanAddSelf,
      attendees,
      conferenceData,
      title,
      notes,
      timezone,
      allDay && dayjs(startDate).format('YYYY-MM-DD'),
      allDay && (endDate || startDate),
      undefined,
      guestsCanInviteOthers,
      false,
      guestsCanSeeOtherGuests,
      recurringEndDate && dayjs(startDate).format(),
      originalAllDay
      && recurringEndDate
      && dayjs(startDate).format('YYYY-MM-DD'),
      frequency
      && recurringEndDate
      && interval
      && [rule.toString()],
      modifiedAlarms,
      undefined,
      status,
      transparency,
      visibility,
      iCalUID,
      false,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      location?.title,
    )



    await atomicUpsertEventInDb(
      client,
      `${eventId}#${calendar?.id}`,
      eventId,
      userId,
      dayjs(startDate).format(),
      dayjs(endDate).format(),
      dayjs().toISOString(),
      false,
      priority || 1,
      isFollowUp ?? false,
      isPreEvent ?? false,
      isPostEvent ?? false,
      modifiable ?? true,
      anyoneCanAddSelf ?? false,
      guestsCanInviteOthers ?? false,
      guestsCanSeeOtherGuests ?? true,
      dayjs(startDate).format(),
      originalAllDay ?? false,
      dayjs().toISOString(),
      calendar?.id,
      title ?? 'New Event',
      allDay ?? false,
      frequency
      && recurringEndDate
      && interval
      && { frequency, endDate: recurringEndDate, interval },
      location,
      notes,
      undefined,
      undefined,
      timezone ?? RNLocalize.getTimeZone(),
      taskId,
      taskType,
      followUpEventId,
      preEventId,
      postEventId,
      forEventId,
      conferenceData?.conferenceId,
      maxAttendees,
      sendUpdates,
      status,
      title,
      transparency,
      visibility,
      recurringEndDate
      && frequency
      && eventId,
      iCalUID,
      undefined,
      colorId,
      undefined,
      undefined,
      false,
      frequency
      && recurringEndDate
      && interval
      && [rule.toString()],
      originalTimezone,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      backgroundColor,
      foregroundColor,
      useDefaultAlarms,
      positiveImpactScore,
      negativeImpactScore,
      positiveImpactDayOfWeek,
      positiveImpactTime,
      negativeImpactDayOfWeek,
      negativeImpactTime,
      preferredDayOfWeek,
      preferredTime,
      isExternalMeeting,
      isExternalMeetingModifiable,
      isMeetingModifiable,
      isMeeting,
      dailyTaskList,
      weeklyTaskList,
      isBreak,
      preferredStartTimeRange,
      preferredEndTimeRange,
      copyAvailability,
      copyTimeBlocking,
      copyTimePreference,
      copyReminders,
      copyPriorityLevel,
      copyModifiable,
      copyCategories,
      copyIsBreak,
      timeBlocking,
      userModifiedAvailability,
      userModifiedTimeBlocking,
      userModifiedTimePreference,
      userModifiedReminders,
      userModifiedPriorityLevel,
      userModifiedCategories,
      userModifiedModifiable,
      userModifiedIsBreak,
      hardDeadline,
      softDeadline,
      copyIsMeeting,
      copyIsExternalMeeting,
      userModifiedIsMeeting,
      userModifiedIsExternalMeeting,
      duration,
      copyDuration,
      userModifiedDuration,
      method,
      unlink,
      byWeekDay as string[],
    )

    if (alarms?.length > 0) {
      const promises = alarms?.map((a: any) => createReminderForEvent(
        client,
        userId,
        eventId,
        (typeof a === 'string') && a,
        timezone,
        (typeof a === 'number') && a,
        useDefaultAlarms,
      ))

      await Promise.all(promises)
    }


    return eventId
  } catch (e) {

  }
}

export type meetingTypeStringType = 'scheduled' | 'recurring_fixed'
export type conferenceName = typeof zoomName | typeof googleMeetName
export type conferenceType = 'hangoutsMeet' | 'addOn'

export const getConferenceInDb = async (
  client: ApolloClient<NormalizedCacheObject>,
  conferenceId: string,
) => {
  try {
    const conference = (await client.query<{ Conference_by_pk: ConferenceType }>({
      query: getConferenceById,
      variables: {
        id: conferenceId,
      },
    })).data?.Conference_by_pk

    return conference
  } catch (e) {

  }
}

export const upsertConferenceInDb = async (
  client: ApolloClient<NormalizedCacheObject>,
  id: string,
  userId: string,
  calendarId: string,
  app: appType,
  requestId?: string | null,
  type?: meetingTypeStringType | null,
  status?: string | null,
  iconUri?: string,
  name?: conferenceNameType | null,
  notes?: string | null,
  entryPoints?: entryPoint[] | null,
  parameters?: {
    addOnParameters?: {
      parameters?: parameterType[],
    }
  } | null,
  key?: string | null,
  hangoutLink?: string | null,
  joinUrl?: string | null,
  startUrl?: string | null,
  zoomPrivateMeeting?: boolean | null,
) => {
  try {
    const conferenceValuesToUpsert: any = {
      id,
      userId,
      calendarId,
      app,
      status,
      updatedAt: dayjs().toISOString(),
      createdDate: dayjs().toISOString(),
      deleted: false,
    }

    if (requestId) {
      conferenceValuesToUpsert.requestId = requestId
    }

    if (type) {
      conferenceValuesToUpsert.type = type
    }

    if (iconUri) {
      conferenceValuesToUpsert.iconUri = iconUri
    }

    if (name) {
      conferenceValuesToUpsert.name = name
    }

    if (entryPoints?.[0]) {
      conferenceValuesToUpsert.entryPoints = entryPoints
    }

    if (parameters) {
      conferenceValuesToUpsert.parameters = parameters
    }

    if (key) {
      conferenceValuesToUpsert.key = key
    }

    if (hangoutLink) {
      conferenceValuesToUpsert.hangoutLink = hangoutLink
    }


    if (joinUrl) {
      conferenceValuesToUpsert.joinUrl = joinUrl
    }

    if (startUrl) {
      conferenceValuesToUpsert.startUrl = startUrl
    }

    if (zoomPrivateMeeting) {
      conferenceValuesToUpsert.zoomPrivateMeeting = zoomPrivateMeeting
    }

    const upsertConference = gql`
      mutation InsertConference($conferences: [Conference_insert_input!]!) {
        insert_Conference(
            objects: $conferences,
            on_conflict: {
                constraint: Conference_pkey,
                update_columns: [
                  ${requestId ? 'requestId,' : ''}
                  ${type ? 'type,' : ''}
                  ${status ? 'status,' : ''}
                  calendarId,
                  ${iconUri ? 'iconUri,' : ''}
                  ${name ? 'name,' : ''}
                  ${notes ? 'notes,' : ''}
                  ${entryPoints ? 'entryPoints,' : ''}
                  ${parameters ? 'parameters,' : ''}
                  app,
                  ${key ? 'key,' : ''}
                  ${hangoutLink ? 'hangoutLink,' : ''}
                  ${joinUrl ? 'joinUrl,' : ''}
                  ${startUrl ? 'startUrl,' : ''}
                  ${zoomPrivateMeeting ? 'zoomPrivateMeeting,' : ''}
                  deleted,
                  updatedAt,
                ]
            }){
            returning {
              id
            }
          }
      }
    `
    const { data } = await client.mutate<{ insert_Conference: { returning: ConferenceType[] } }>({
      mutation: upsertConference,
      variables: {
        conferences: [conferenceValuesToUpsert],
      },
    })

    return data.insert_Conference.returning[0]
  } catch (e) {

  }
}

export const createConference = async (
  startDate: string,
  endDate: string,
  client: ApolloClient<NormalizedCacheObject>,
  calendarId: string,
  zoomMeet: boolean = false,
  googleMeet: boolean = false,
  userId: string,
  meetingTypeString: meetingTypeStringType,
  attendees: GoogleAttendeeType[],
  requestId?: string,
  summary?: string,
  taskType?: string,
  notes?: string,
  zoomPassword?: string,
  zoomPrivateMeeting?: boolean,
) => {
  try {
    if (zoomMeet && googleMeet) {
      throw new Error('cannot create both zoom and google meet')
    }

    if (!zoomMeet && !googleMeet) {
      throw new Error('must create either zoom or google meet')
    }

    if (!startDate || !endDate) {
      throw new Error('startDate and endDate are required')
    }

    if (!calendarId) {
      throw new Error('calendarId is required')
    }

    let newConferenceId: string | number = ''
    let newJoinUrl = ''
    let newStartUrl = ''
    let newConferenceStatus = ''
    let conferenceName: conferenceName = zoomName
    let conferenceType: conferenceType = 'addOn'
    let conferenceData: ConferenceDataType = {
      type: 'addOn',
      name: conferenceName,
      requestId: uuid(),
      conferenceId: newConferenceId,
      createRequest: false,
      entryPoints: [{
        label: zoomName,
        entryPointType: 'video',
        uri: newJoinUrl,
        password: zoomPassword,
      }]
    }
    let newRequestId = requestId || uuid()
    if (zoomMeet) {
      const isZoomAvailable = await zoomAvailable(client, userId)

      if (isZoomAvailable) {

        const zoomInteg = (await client.query<{ Calendar_Integration: CalendarIntegrationType[] }>({
          query: getCalendarIntegrationByResource,
          variables: {
            userId,
            name: zoomName,
            resource: zoomResourceName,
          }
        }))?.data?.Calendar_Integration?.[0]
        const {
          id: zoomConferenceId,
          join_url: zoomJoinUrl,
          start_url: zoomStartUrl,
          status: zoomStatus,
        } = await createZoomMeeting(
          userId,
          dayjs(startDate).format(),
          RNLocalize.getTimeZone(),
          summary ?? taskType ?? notes,
          dayjs.duration({ hours: dayjs(endDate).hour(), minutes: dayjs(endDate).minute() }).asMinutes(),
          zoomInteg?.contactName,
          zoomInteg?.contactEmail,
          attendees.map(i => i?.email),
          zoomPrivateMeeting,
        )


        newConferenceId = zoomConferenceId
        newJoinUrl = zoomJoinUrl
        newStartUrl = zoomStartUrl
        newConferenceStatus = zoomStatus
        conferenceName = zoomName
        conferenceType = 'addOn'
        conferenceData = {
          type: conferenceType,
          name: conferenceName,
          requestId: newRequestId,
          conferenceId: `${newConferenceId}`,
          createRequest: false,
          entryPoints: [{
            label: zoomName,
            entryPointType: 'video',
            uri: newJoinUrl,
            password: zoomPassword,
          }]
        }
      }
    } else if (googleMeet) {
      newConferenceId = uuid()
      conferenceName = googleMeetName
      conferenceType = 'hangoutsMeet'
      conferenceData = {
        type: conferenceType,
        conferenceId: newConferenceId,
        name: conferenceName,
        requestId: newRequestId,
        createRequest: true,
      }
    }

    await upsertConferenceInDb(
      client,
      typeof newConferenceId === 'number' ? `${newConferenceId}` : newConferenceId,
      userId,
      calendarId,
      zoomMeet ? zoomResourceName : googleCalendarResource,
      newRequestId,
      meetingTypeString,
      undefined,
      undefined,
      zoomMeet ? zoomName : googleMeetName,
      notes,
      conferenceData?.entryPoints,
      undefined,
      undefined,
      undefined,
      newJoinUrl,
      newStartUrl,
      zoomPrivateMeeting,
    )

    return {
      newConferenceId,
      newJoinUrl,
      newStartUrl,
      newConferenceStatus,
      conferenceName,
      conferenceType,
      conferenceData,
    }
  } catch (e) {

  }
}

export const createNewEvent = async (
  startDate: string,
  endDate: string,
  userId: string,
  client: ApolloClient<NormalizedCacheObject>,
  selectedCalendarId?: string,
  categoryIds?: string[],
  title?: string,
  allDay?: boolean,
  recurringEndDate?: string,
  frequency?: RecurrenceFrequencyType,
  interval?: number,
  alarms?: string[] | number[],
  notes?: string,
  location?: LocationType,
  isFollowUp?: boolean,
  isPreEvent?: boolean,
  isPostEvent?: boolean,
  modifiable?: boolean,
  anyoneCanAddSelf?: boolean,
  guestsCanInviteOthers?: boolean,
  guestsCanSeeOtherGuests?: boolean,
  originalAllDay?: boolean,
  timezone?: string,
  taskId?: string,
  taskType?: string,
  followUpEventId?: string,
  preEventId?: string,
  postEventId?: string,
  forEventId?: string,
  zoomMeet?: boolean,
  googleMeet?: boolean,
  meetingTypeString?: meetingTypeStringType,
  zoomPassword?: string,
  zoomPrivateMeeting?: boolean,
  attendees?: Person[],
  conferenceId?: string,
  maxAttendees?: number,
  sendUpdates?: sendUpdates,
  status?: string,
  summary?: string,
  transparency?: transparency,
  visibility?: visibility,
  recurringEventId?: string,
  iCalUID?: string,
  htmlLink?: string,
  colorId?: string,
  originalTimezone?: string,
  backgroundColor?: string,
  foregroundColor?: string,
  useDefaultAlarms?: boolean,
  positiveImpactScore?: number,
  negativeImpactScore?: number,
  positiveImpactDayOfWeek?: number,
  positiveImpactTime?: Time,
  negativeImpactDayOfWeek?: number,
  negativeImpactTime?: Time,
  preferredDayOfWeek?: number,
  preferredTime?: Time,
  isExternalMeeting?: boolean,
  isExternalMeetingModifiable?: boolean,
  isMeetingModifiable?: boolean,
  isMeeting?: boolean,
  dailyTaskList?: boolean,
  weeklyTaskList?: boolean,
  isBreak?: boolean,
  preferredStartTimeRange?: Time,
  preferredEndTimeRange?: Time,
  copyAvailability?: boolean,
  copyTimeBlocking?: boolean,
  copyTimePreference?: boolean,
  copyReminders?: boolean,
  copyPriorityLevel?: boolean,
  copyModifiable?: boolean,
  copyCategories?: boolean,
  copyIsBreak?: boolean,
  timeBlocking?: BufferTime,
  userModifiedAvailability?: boolean,
  userModifiedTimeBlocking?: boolean,
  userModifiedTimePreference?: boolean,
  userModifiedReminders?: boolean,
  userModifiedPriorityLevel?: boolean,
  userModifiedCategories?: boolean,
  userModifiedModifiable?: boolean,
  userModifiedIsBreak?: boolean,
  hardDeadline?: string,
  softDeadline?: string,
  copyIsMeeting?: boolean,
  copyIsExternalMeeting?: boolean,
  userModifiedIsMeeting?: boolean,
  userModifiedIsExternalMeeting?: boolean,
  duration?: number,
  copyDuration?: boolean,
  userModifiedDuration?: boolean,
  method?: 'create' | 'update',
  unlink?: boolean,
  byWeekDay?: Day[],
  priority?: number,
) => {
  try {

    let calendar: CalendarType | {} = {}

    if (selectedCalendarId?.length > 0) {
      calendar = await getCalendarInDb(client, userId, selectedCalendarId)
    }

    if (!selectedCalendarId) {
      calendar = await getCalendarInDb(client, userId, undefined, true)
    }

    if (!selectedCalendarId && !calendar && googleCalendarResource) {
      calendar = await getCalendarInDb(client, userId, undefined, undefined, googleCalendarResource)
    }

    if (!((calendar as CalendarType)?.id) && !selectedCalendarId) {
      calendar = await getCalendarInDb(client, userId)
    }

    if (!(calendar as CalendarType)?.id) {

      const eventId = await createNewEventInLocale(
        client,
        startDate,
        endDate,
        userId,
        title,
        allDay,
        recurringEndDate,
        frequency,
        interval,
        alarms,
        notes,
        location,
        isFollowUp,
        isPreEvent,
        isPostEvent,
        modifiable,
        anyoneCanAddSelf,
        guestsCanInviteOthers,
        guestsCanSeeOtherGuests,
        originalAllDay,
        alarms,
        timezone,
        taskId,
        taskType,
        followUpEventId,
        preEventId,
        postEventId,
        forEventId,
        conferenceId,
        maxAttendees,
        sendUpdates,
        status,
        summary,
        transparency,
        visibility,
        recurringEventId,
        iCalUID,
        htmlLink,
        colorId,
        originalTimezone,
        backgroundColor,
        foregroundColor,
        useDefaultAlarms,
        positiveImpactScore,
        negativeImpactScore,
        positiveImpactDayOfWeek,
        positiveImpactTime,
        negativeImpactDayOfWeek,
        negativeImpactTime,
        preferredDayOfWeek,
        preferredTime,
        isExternalMeeting,
        isExternalMeetingModifiable,
        isMeetingModifiable,
        isMeeting,
        dailyTaskList,
        weeklyTaskList,
        isBreak,
        preferredStartTimeRange,
        preferredEndTimeRange,
        copyAvailability,
        copyTimeBlocking,
        copyTimePreference,
        copyReminders,
        copyPriorityLevel,
        copyModifiable,
        copyCategories,
        copyIsBreak,
        timeBlocking,
        userModifiedAvailability,
        userModifiedTimeBlocking,
        userModifiedTimePreference,
        userModifiedReminders,
        userModifiedPriorityLevel,
        userModifiedCategories,
        userModifiedModifiable,
        userModifiedIsBreak,
        hardDeadline,
        softDeadline,
        copyIsMeeting,
        copyIsExternalMeeting,
        userModifiedIsMeeting,
        userModifiedIsExternalMeeting,
        duration,
        copyDuration,
        userModifiedDuration,
        method,
        unlink,
        byWeekDay,
        priority,
      )

      if (categoryIds?.length > 0) {
        const categoryPromises = categoryIds.map(i => upsertCategoryEventConnection(
          client, userId, i, eventId,
        ))

        await Promise.all(categoryPromises)
      }
      return eventId
    }

    if ((calendar as CalendarType)?.resource === localCalendarResource) {
      const eventId = await createNewEventInLocale(
        client,
        startDate,
        endDate,
        userId,
        title,
        allDay,
        recurringEndDate,
        frequency,
        interval,
        alarms,
        notes,
        location,
        isFollowUp,
        isPreEvent,
        isPostEvent,
        modifiable,
        anyoneCanAddSelf,
        guestsCanInviteOthers,
        guestsCanSeeOtherGuests,
        originalAllDay,
        alarms,
        timezone,
        taskId,
        taskType,
        followUpEventId,
        preEventId,
        postEventId,
        forEventId,
        conferenceId,
        maxAttendees,
        sendUpdates,
        status,
        summary,
        transparency,
        visibility,
        recurringEventId,
        iCalUID,
        htmlLink,
        colorId,
        originalTimezone,
        backgroundColor,
        foregroundColor,
        useDefaultAlarms,
        positiveImpactScore,
        negativeImpactScore,
        positiveImpactDayOfWeek,
        positiveImpactTime,
        negativeImpactDayOfWeek,
        negativeImpactTime,
        preferredDayOfWeek,
        preferredTime,
        isExternalMeeting,
        isExternalMeetingModifiable,
        isMeetingModifiable,
        isMeeting,
        dailyTaskList,
        weeklyTaskList,
        isBreak,
        preferredStartTimeRange,
        preferredEndTimeRange,
        copyAvailability,
        copyTimeBlocking,
        copyTimePreference,
        copyReminders,
        copyPriorityLevel,
        copyModifiable,
        copyCategories,
        copyIsBreak,
        timeBlocking,
        userModifiedAvailability,
        userModifiedTimeBlocking,
        userModifiedTimePreference,
        userModifiedReminders,
        userModifiedPriorityLevel,
        userModifiedCategories,
        userModifiedModifiable,
        userModifiedIsBreak,
        hardDeadline,
        softDeadline,
        copyIsMeeting,
        copyIsExternalMeeting,
        userModifiedIsMeeting,
        userModifiedIsExternalMeeting,
        duration,
        copyDuration,
        userModifiedDuration,
        method,
        unlink,
        byWeekDay,
        priority,
      )
      if (categoryIds?.length > 0) {
        const categoryPromises = categoryIds.map(i => upsertCategoryEventConnection(
          client, userId, i, eventId,
        ))

        await Promise.all(categoryPromises)
      }
      return eventId
    }

    if ((calendar as CalendarType)?.resource === googleCalendarResource) {
      const modifiedAttendees: GoogleAttendeeType[] = attendees?.map(a => ({
        additionalGuests: a?.additionalGuests,
        displayName: a?.name,
        email: a?.emails?.[0]?.value,
        id: a?.id,
      }))
      let conferenceData = null
      if (modifiedAttendees?.length > 0) {
        const {
          conferenceData: conferenceData1,
        } = await createConference(
          startDate,
          endDate,
          client,
          (calendar as CalendarType)?.id,
          zoomMeet,
          googleMeet,
          userId,
          meetingTypeString,
          modifiedAttendees,
          undefined,
          summary,
          taskType,
          notes,
          zoomPassword,
          zoomPrivateMeeting,
        )
        conferenceData = conferenceData1
      }


      const eventId = await createNewEventInGoogle(
        startDate,
        endDate,
        userId,
        client,
        calendar as CalendarType,
        conferenceData,
        modifiedAttendees,
        title,
        allDay,
        recurringEndDate,
        frequency,
        interval,
        notes,
        location,
        isFollowUp,
        isPreEvent,
        isPostEvent,
        modifiable,
        anyoneCanAddSelf,
        guestsCanInviteOthers,
        guestsCanSeeOtherGuests,
        originalAllDay,
        alarms,
        timezone,
        taskId,
        taskType,
        followUpEventId,
        preEventId,
        postEventId,
        forEventId,
        maxAttendees,
        sendUpdates,
        status,
        transparency,
        visibility,
        iCalUID,
        backgroundColor,
        foregroundColor,
        colorId,
        originalTimezone,
        useDefaultAlarms,
        positiveImpactScore,
        negativeImpactScore,
        positiveImpactDayOfWeek,
        positiveImpactTime,
        negativeImpactDayOfWeek,
        negativeImpactTime,
        preferredDayOfWeek,
        preferredTime,
        isExternalMeeting,
        isExternalMeetingModifiable,
        isMeetingModifiable,
        isMeeting,
        dailyTaskList,
        weeklyTaskList,
        isBreak,
        preferredStartTimeRange,
        preferredEndTimeRange,
        copyAvailability,
        copyTimeBlocking,
        copyTimePreference,
        copyReminders,
        copyPriorityLevel,
        copyModifiable,
        copyCategories,
        copyIsBreak,
        timeBlocking,
        userModifiedAvailability,
        userModifiedTimeBlocking,
        userModifiedTimePreference,
        userModifiedReminders,
        userModifiedPriorityLevel,
        userModifiedCategories,
        userModifiedModifiable,
        userModifiedIsBreak,
        hardDeadline,
        softDeadline,
        copyIsMeeting,
        copyIsExternalMeeting,
        userModifiedIsMeeting,
        userModifiedIsExternalMeeting,
        duration,
        copyDuration,
        userModifiedDuration,
        method,
        unlink,
        byWeekDay,
        priority,
      )



      if (attendees?.length > 0) {
        const attendeePromises = attendees?.map(a => {
          return upsertAttendeesInDb(
            client,
            uuid(),
            userId,
            eventId,
            a?.emails,
            a?.name,
            a?.id,
            a?.phoneNumbers,
            a?.imAddresses,
            a?.additionalGuests,
            a?.optional,
            a?.resource,
          )
        })
        await Promise.all(attendeePromises)
      }

      if (categoryIds?.length > 0) {
        const categoryPromises = categoryIds.map(i => upsertCategoryEventConnection(
          client, userId, i, eventId,
        ))

        await Promise.all(categoryPromises)
      }

      return eventId
    }

  } catch (e) {

  }
}

export const deleteEventForTask = async (
  eventId: string,
  client: ApolloClient<NormalizedCacheObject>,
) => {
  try {
    const { data } = (await client.mutate<{ delete_Event_by_pk: EventType }>({
      mutation: deleteEventById,
      variables: {
        id: eventId,
      },
      update(cache, { data }) {
        const deletedEvent = data?.delete_Event_by_pk
        const normalizedId = cache.identify({ id: deletedEvent.id, __typename: deletedEvent.__typename })
        cache.evict({ id: normalizedId })
        cache.gc()
      }
    }))

    return data?.delete_Event_by_pk?.id
  } catch (e) {

  }
}


