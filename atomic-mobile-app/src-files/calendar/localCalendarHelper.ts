import RNCalendarEvents, { RecurrenceFrequency } from 'react-native-calendar-events'
import Toast from "react-native-toast-message"
import { localCalendarName } from '@app/calendar/constants'
import { Platform } from 'react-native'
import { dayjs, RNLocalize } from '@app/date-utils'
import { palette } from '@theme/theme'


export const getLocalCalendar = async () => {
  const oldStatus = await RNCalendarEvents.checkPermissions()
  let status
  if (oldStatus !== 'authorized') {
    const newStatus = await RNCalendarEvents.requestPermissions()

    status = newStatus
  }

  if (status === 'authorized' || oldStatus === 'authorized') {
    const newCalendars = await RNCalendarEvents.findCalendars()

    const atomicCalendars = newCalendars.filter(each => each.title === localCalendarName)


    if (atomicCalendars?.[0]?.id) {

      const calendarId = atomicCalendars?.[0]?.id
      return calendarId
    }

    const defaultCalendarSource = Platform.OS === 'ios'
      ? newCalendars.filter(each => each.source === 'Default')?.[0].source
      : { isLocalAccount: true, name: localCalendarName, type: '' }

    const newCalendarId = Platform.OS === 'ios' ? await RNCalendarEvents.saveCalendar({
      title: localCalendarName,
      color: palette['purple'],
      entityType: 'event',
      source: undefined,
      name: localCalendarName,
      ownerAccount: 'personal',
      accessLevel: 'owner',
    }) : await RNCalendarEvents.saveCalendar({
      title: localCalendarName,
      color: palette['purple'],
      entityType: 'event',
      source: defaultCalendarSource as { isLocalAccount: boolean; name: string; type: string; },
      name: localCalendarName,
      ownerAccount: 'personal',
      accessLevel: 'owner',
    })

    const calendarId = newCalendarId
    return calendarId
  } else {
    Toast.show({
      type: 'error',
      text1: 'Need Calendar Access',
      text2: 'Trying to save event to your local calendar requires access'
    })
  }
}

export const createCalendarEventLocale = async (
  calendarId: string,
  startDate: string,
  endDate: string,
  recurringEndDate?: string,
  frequency?: RecurrenceFrequency,
  interval?: number,
  title?: string,
  deadlineAlarms?: string[] | number[],
  notes?: string,
  location?: string,
): Promise<string> => {
  if (!(calendarId)) {

    return
  }
  try {
    if (Platform.OS === 'ios') {
      const newEventId = await RNCalendarEvents.saveEvent((title || notes), {
        calendarId: calendarId,
        startDate: dayjs(startDate).valueOf(),
        endDate: dayjs(endDate).isValid() ? dayjs(endDate).valueOf() : dayjs(startDate).valueOf(),
        notes,
        location,
        alarms: deadlineAlarms?.length > 0
          ? typeof deadlineAlarms?.[0] === 'string'
            ? [...deadlineAlarms.map(i => ({
              date: dayjs(i).format(),
            }))]
            : [...deadlineAlarms.map(i => ({
              date: -i
            }))]
          : undefined,
        timeZone: RNLocalize.getTimeZone(),
        recurrenceRule: (frequency
          && interval
          && recurringEndDate)
          ? {
            frequency,
            interval,
            endDate: dayjs(recurringEndDate).valueOf(),
            occurrence: undefined
          }
          : undefined,
      })
      return newEventId
    } else if (Platform.OS === 'android') {
      const newEventId = await RNCalendarEvents.saveEvent((title || notes), {
        calendarId,
        startDate: dayjs(startDate).valueOf(),
        endDate: dayjs(endDate).isValid() ? dayjs(endDate).valueOf() : dayjs(startDate).valueOf(),
        description: notes,
        alarms: deadlineAlarms?.length > 0
          ? typeof deadlineAlarms?.[0] === 'string'
            ? [...deadlineAlarms.map(i => ({
              date: dayjs(i).format(),
            }))]
            : [...deadlineAlarms.map(i => ({
              date: i
            }))]
          : undefined,
        timeZone: RNLocalize.getTimeZone(),
        location,
        recurrenceRule: (frequency
          && interval
          && recurringEndDate)
          ? {
            frequency,
            interval,
            endDate: dayjs(recurringEndDate).valueOf(),
            occurrence: undefined
          }
          : undefined,
      })
      return newEventId
    }
  } catch (e) {

  }
}

export const findLocalCalendars = async () => {
  try {
    const oldStatus = await RNCalendarEvents.checkPermissions()
    let status
    if (oldStatus !== 'authorized') {
      const newStatus = await RNCalendarEvents.requestPermissions()

      status = newStatus
    }

    if (status === 'authorized' || oldStatus === 'authorized') {
      const newCalendars = await RNCalendarEvents.findCalendars()
      return newCalendars
    } else {
      Toast.show({
        type: 'error',
        text1: 'Need Calendar Access',
        text2: 'Trying to save event to your local calendar requires access'
      })
    }
  } catch (e) {

  }
}

export const fetchAllLocalEvents = async (
  startDate: string,
  endDate: string,
) => {
  try {
    const oldStatus = await RNCalendarEvents.checkPermissions()
    let status
    if (oldStatus !== 'authorized') {
      const newStatus = await RNCalendarEvents.requestPermissions()

      status = newStatus
    }

    if (status === 'authorized' || oldStatus === 'authorized') {
      const events = await RNCalendarEvents.fetchAllEvents(startDate, endDate)
      return events
    } else {
      Toast.show({
        type: 'error',
        text1: 'Need Calendar Access',
        text2: 'Trying to save event to your local calendar requires access'
      })
    }
  } catch (e) {

  }
}

export const deleteLocalEvent = async (
  eventId: string,
  futureEvents?: boolean,
  exceptionDate?: string,
) => {
  try {
    await RNCalendarEvents.removeEvent(eventId, { futureEvents, exceptionDate })
  } catch (e) {

  }
}

export const updateCalendarEventLocale = async (
  calendarId: string,
  eventId: string,
  startDate: string,
  endDate: string,
  recurringEndDate?: string,
  frequency?: RecurrenceFrequency,
  interval?: number,
  title?: string,
  deadlineAlarms?: string[] | number[],
  notes?: string,
  location?: string,
) => {
  try {
    if (!(calendarId)) {

      return
    }
    if (Platform.OS === 'ios') {
      const newEventId = await RNCalendarEvents.saveEvent((title || notes), {
        id: eventId,
        calendarId: calendarId,
        startDate: dayjs(startDate).valueOf(),
        endDate: dayjs(endDate).isValid() ? dayjs(endDate).valueOf() : dayjs(startDate).valueOf(),
        notes,
        location,
        alarms: deadlineAlarms?.length > 0
          ? typeof deadlineAlarms?.[0] === 'string'
            ? [...deadlineAlarms.map(i => ({
              date: dayjs(i).format(),
            }))]
            : [...deadlineAlarms.map(i => ({
              date: -i
            }))]
          : undefined,
        timeZone: RNLocalize.getTimeZone(),
        recurrenceRule: (frequency
          && interval
          && recurringEndDate)
          ? {
            frequency,
            interval,
            endDate: dayjs(recurringEndDate).valueOf(),
            occurrence: undefined
          }
          : undefined,
      })
      return newEventId
    } else if (Platform.OS === 'android') {
      const newEventId = await RNCalendarEvents.saveEvent((title || notes), {
        id: eventId,
        calendarId,
        startDate: dayjs(startDate).valueOf(),
        endDate: dayjs(endDate).isValid() ? dayjs(endDate).valueOf() : dayjs(startDate).valueOf(),
        description: notes,
        alarms: deadlineAlarms?.length > 0
          ? typeof deadlineAlarms?.[0] === 'string'
            ? [...deadlineAlarms.map(i => ({
              date: dayjs(i).format(),
            }))]
            : [...deadlineAlarms.map(i => ({
              date: i
            }))]
          : undefined,
        timeZone: RNLocalize.getTimeZone(),
        location,
        recurrenceRule: (frequency
          && interval
          && recurringEndDate)
          ? {
            frequency,
            interval,
            endDate: dayjs(recurringEndDate).valueOf(),
            occurrence: undefined
          }
          : undefined,
      })
      return newEventId
    }

  } catch (e) {

  }
}

