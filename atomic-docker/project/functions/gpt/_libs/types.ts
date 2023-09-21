

export type GoogleSendUpdatesType = 'all' | 'externalOnly' | 'none'

export type GoogleAttendeeType = {
    additionalGuests?: number,
    comment?: string,
    displayName?: string,
    email: string,
    id?: string,
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted',
}

type GoogleEntryPointType = {
    accessCode?: string,
    label?: string,
    entryPointType: 'video' | 'phone' | 'sip' | 'more',
    meetingCode?: string,
    passcode?: string,
    password?: string,
    pin?: string,
    uri?: string,
}

export type GoogleConferenceDataType = {
    type: 'hangoutsMeet' | 'addOn',
    iconUri?: string,
    name?: string,
    requestId?: string,
    conferenceId?: string,
    createRequest?: {
        "requestId": string,
        "conferenceSolutionKey": {
            "type": 'hangoutsMeet' | 'addOn',
        },
    },
    entryPoints?: GoogleEntryPointType[],
}

export type GoogleExtendedPropertiesType = {
    private?: object,
    shared?: object,
}

type OverrideType = {
    method?: 'email' | 'popup', // reminder type
    minutes?: number,
}

export type OverrideTypes = OverrideType[]

export type GoogleReminderType = {
    overrides: OverrideTypes,
    useDefault: boolean, // use calendar defaults
}

export type GoogleSourceType = {
    title?: string,
    url?: string,
}

export type GoogleTransparencyType = 'opaque' | 'transparent' // available or not

export type GoogleVisibilityType = 'default' | 'public' | 'private' | 'confidential'

export type GoogleAttachmentType = {
    title: string,
    fileUrl: string,
    mimeType: string,
    iconLink: string,
    fileId: string
}

export type GoogleEventType1 = 'default' | 'outOfOffice' | 'focusTime'

export type ColorType = {
    id: string,
    background: string,
    foreground: string,
    itemType: 'calendar' | 'event',
}

export type CalendarIntegrationType = {
    id: string,
    userId: string,
    token?: string,
    refreshToken?: string,
    resource?: string,
    name?: string,
    enabled?: boolean,
    syncEnabled?: boolean,
    deleted?: boolean,
    appId?: string,
    appEmail?: string,
    appAccountId?: string,
    contactName?: string,
    contactEmail?: string,
    colors?: ColorType[],
    clientType?: 'ios' | 'android' | 'web' | 'atomic-web',
    expiresAt?: string,
    updatedAt: string,
    createdDate: string,
    pageToken?: string,
    syncToken?: string,
}

export type RecurrenceRuleType = {
    frequency: string,
    endDate: string,
    occurrence?: number,
    interval: number,
    byWeekDay?: string[],
} | {
    frequency: string,
    endDate?: string,
    occurrence: number,
    interval: number,
    byWeekDay?: string[],
}

export type LocationType = {
    title: string,
    proximity?: string,
    radius?: number,
    coords?: {
        latitude?: number,
        longitude?: number,
    },
    address?: {
        houseNumber?: number,
        prefixDirection?: string,
        prefixType?: string,
        streetName?: string,
        streetType?: string,
        suffixDirection?: string,
        city?: string,
        state?: string,
        postalCode?: string,
        country?: string
    }
}

export type LinkType = {
    title: string,
    link: string
}

export type SendUpdatesType = 'all' | 'externalOnly' | 'none'

export type TransparencyType = 'opaque' | 'transparent' // available or not

export type VisibilityType = 'default' | 'public' | 'private' | 'confidential'


export type CreatorType = {
    id?: string,
    email?: string,
    displayName?: string,
    self?: boolean
}

export type OrganizerType = {
    id: string,
    email: string,
    displayName: string,
    self: boolean
}

export type ExtendedPropertiesType = {
    private?: {
        keys?: string[],
        values?: string[],
    },
    shared?: {
        keys?: string[],
        values?: string[]
    },
}

export type BufferTimeNumberType = {
    beforeEvent: number
    afterEvent: number
}

export type MM = '01' | '02' | '03' | '04' | '05' | '06' | '07' | '08' | '09' | '10' | '11' | '12'

export type HH = '00' | '01' | '02' | '03' | '04' | '05' | '06' | '07' | '08' | '09' | '10' | '11' | '12' | '13' | '14' | '15' | '16' | '17' | '18' | '19' | '20' | '21' | '22' | '23'

export type Time = `${HH}:${MM}`


export type EventType = {
    id: string,
    userId: string,
    title?: string,
    startDate: string,
    endDate: string,
    allDay?: boolean,
    recurrenceRule?: RecurrenceRuleType,
    location?: LocationType,
    notes?: string,
    attachments?: GoogleAttachmentType[],
    links?: LinkType[],
    timezone?: string,
    createdDate: string,
    deleted: boolean,
    taskId?: string,
    taskType?: string,
    priority: number,
    followUpEventId?: string,
    isFollowUp: boolean,
    isPreEvent: boolean,
    isPostEvent: boolean,
    preEventId?: string,
    postEventId?: string,
    modifiable: boolean,
    forEventId?: string,
    conferenceId?: string,
    maxAttendees?: number,
    sendUpdates?: SendUpdatesType,
    anyoneCanAddSelf: boolean,
    guestsCanInviteOthers: boolean,
    guestsCanSeeOtherGuests: boolean,
    originalStartDate: string,
    originalAllDay: boolean,
    status?: string,
    summary?: string,
    transparency?: TransparencyType,
    visibility?: VisibilityType,
    recurringEventId?: string,
    updatedAt: string,
    iCalUID?: string,
    htmlLink?: string,
    colorId?: string,
    creator?: CreatorType,
    organizer?: OrganizerType,
    endTimeUnspecified?: boolean,
    recurrence?: string[],
    originalTimezone?: string,
    attendeesOmitted?: boolean,
    extendedProperties?: ExtendedPropertiesType,
    hangoutLink?: string,
    guestsCanModify?: boolean,
    locked?: boolean,
    source?: GoogleSourceType,
    eventType?: string,
    privateCopy?: boolean,
    calendarId: string,
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
    timeBlocking?: BufferTimeNumberType,
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
    copyColor?: boolean,
    userModifiedColor?: boolean,
    byWeekDay?: string[],
    localSynced?: boolean,
    meetingId?: string,
    eventId: string,
}


type DefaultReminder = {
    method: string,
    minutes: number,
}

export type CalendarType = {
    id: string,
    title?: string,
    backgroundColor?: string,
    foregroundColor?: string,
    colorId?: string,
    account?: object,
    accessLevel?: string,
    resource?: string,
    modifiable?: boolean,
    defaultReminders?: DefaultReminder[],
    // weird behavior by enabling primary here commented out for now
    // primary?: boolean,
    globalPrimary?: boolean,
    pageToken?: string,
    syncToken?: string,
    deleted: boolean,
    createdDate: string,
    updatedAt: string,
    userId: string,
}

type DayOfWeekIntType = 1 | 2 | 3 | 4 | 5 | 6 | 7

type StartTimeType = {
    day: DayOfWeekIntType,
    hour: number,
    minutes: number,
}

type EndTimeType = {
    day: DayOfWeekIntType,
    hour: number,
    minutes: number,
}

export type NotAvailableSlotType = {
    startDate: string,
    endDate: string,
}

export type UserPreferenceType = {
    id: string,
    userId: string,
    reminders?: number[], // invite part
    followUp?: number[], // invite part
    isPublicCalendar?: boolean,
    publicCalendarCategories?: string[],
    startTimes?: StartTimeType[],
    endTimes?: EndTimeType[],
    copyAvailability?: boolean,
    copyTimeBlocking?: boolean,
    copyTimePreference?: boolean,
    copyReminders?: boolean,
    copyPriorityLevel?: boolean,
    copyModifiable?: boolean,
    copyCategories?: boolean,
    copyIsBreak?: boolean,
    maxWorkLoadPercent: number,
    minNumberOfBreaks: number,
    breakLength: number,
    breakColor?: string,
    backToBackMeetings: boolean,
    maxNumberOfMeetings: number,
    copyIsMeeting?: boolean,
    copyIsExternalMeeting?: boolean,
    copyColor?: boolean,
    updatedAt?: string,
    createdDate?: string,
    deleted: boolean
}

export type AvailableSlotType = {
    id: string,
    startDate: string,
    endDate: string,
}

export type MeetingRequestBodyType = {
    userId: string,
    email: string,
    shareAvailability: boolean,
    receiver: string,
    sender: string,
    receiverCharacteristics?: string[],
    receiverGoals?: string[],
    senderCharacteristics?: string[],
    senderGoals?: string[],
    windowStartDate?: string,
    windowEndDate?: string,
    senderTimezone?: string,
    receiverTimezone?: string,
    slotDuration?: number,
}

export type DailyScheduleObjectType = {
    start_time: string,
    end_time: string,
    task: string,
}

export type HowToTaskRequestBodyType = {
    userId: string,
    task: string,
    isAllDay: boolean,
    timezone: string,
    startDate: string,
    endDate: string,
    email?: string,
    name?: string,
    isTwo?: boolean,
}

export type CreateDayScheduleBodyType = {
    userId: string,
    tasks: string[], // make sure to add previous events inside tasks when submitting
    isAllDay: boolean,
    timezone: string,
    startDate: string,
    endDate: string,
    email?: string,
    name?: string,
    isTwo?: boolean,
}

export type BreakDownTaskRequestBodyType = {
    userId: string,
    task: string,
    isAllDay: boolean,
    timezone: string,
    startDate: string,
    endDate: string,
    email?: string,
    name?: string,
    isTwo?: boolean
}

export type CreatePeriodSummaryRequestBodyType = {
    userId: string,
    startDate: string,
    endDate: string,
    timezone: string,
    email?: string,
    name?: string,
}

export type CreateAgendaRequestBodyType = {
    userId: string,
    isAllDay: boolean,
    timezone: string,
    email: string,
    name: string,
    startDate: string,
    endDate: string,
    mainTopic: string,
    relevantPoints?: string[],
    goals?: string[],
    location?: string,
    isTwo?: boolean,
}


export type GoogleResType = { id: string, googleEventId: string, generatedId: string, calendarId: string, generatedEventId: string }




