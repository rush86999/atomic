
type etag = string
// example date =  dayjs().format('YYYY-MM-DD')
type date = string

// with utc offset
// example isostring = dayjs().format('YYYY-MM-DDTHH:mm:ssZ[Z]')
// without T between values in ISO string
// example datetime = dayjs().format('YYYY-MM-DD HH:mm:ssZ[Z]')
type datetime = string
/**
{
  entryPointType: 'video' | 'phone' | 'sip' | 'more',
  entryPointFeatures?: string[],
  uri?: string,
  label?: string,
  pin?: string,
  accessCode?: string,
  meetingCode?: string,
  passcode?: string,
  password?: string
} */
export type entryPoint = {
  accessCode?: string,
  label?: string,
  entryPointType: 'video' | 'phone' | 'sip' | 'more',
  meetingCode?: string,
  passcode?: string,
  password?: string,
  pin?: string,
  uri?: string,
}

export type parameterType = {
  keys: string[],
  values: string[],
}

// export type ConferenceType = {
//   id: string,
//   userId: string,
//   calendarId: string,
//   app: string,
//   requestId?: string,
//   type?: string,
//   status?: string,
//   iconUri?: string,
//   name?: string,
//   notes?: string,
//   entryPoints?: entryPoint[],
//   parameters?: {
//     addOnParameters?: {
//       parameters?: parameterType[],
//     }
//   },
//   key?: string,
//   hangoutLink?: string,
//   joinUrl?: string,
//   startUrl?: string,
//   updatedAt: string,
//   createdDate: string,
//   deleted: boolean
// }

export type email = {
  primary: boolean,
  value: string,
  type: string,
  displayName: string,
}

export type phoneNumber = {
  primary: boolean,
  value: string,
  type: string,
}

export type imAddress = {
  primary: boolean,
  username: string,
  service: string,
  type: string,
}

export type AttendeeType = {
  id: string,
  userId: string,
  name?: string,
  contactId?: string,
  emails: email[],
  phoneNumbers?: phoneNumber[],
  imAddresses?: imAddress[],
  eventId: string,
  additionalGuests?: number,
  comment?: string,
  responseStatus?: string,
  optional?: boolean,
  resource?: boolean,
  updatedAt: string,
  createdDate: string,
  deleted: boolean
}

export type eventTriggerResponse = {
    "message": string,
    "event_id": string
}

export type colorTypeResponse = {
  kind: string,
  updated: datetime,
  calendar: {
    /** colorId */
    [key: string]: {
      background: string,
      foreground: string
    }
  },
  event: {
    /** colorId */
    [key: string]: {
      background: string,
      foreground: string
    }
  }
}

export type eventResource = {
  "kind": "calendar#event",
  "etag": etag,
  "id": string,
  "status": string,
  "htmlLink": string,
  "created": datetime,
  "updated": datetime,
  "summary": string,
  "description": string,
  "location": string,
  "colorId": string,
  "creator": {
    "id": string,
    "email": string,
    "displayName": string,
    "self": boolean
  },
  "organizer": {
    "id": string,
    "email": string,
    "displayName": string,
    "self": boolean
  },
  "start": {
    "date": date,
    "dateTime": datetime,
    "timeZone": string
  },
  "end": {
    "date": date,
    "dateTime": datetime,
    "timeZone": string
  },
  "endTimeUnspecified": boolean,
  "recurrence": [
    string
  ],
  "recurringEventId": string,
  "originalStartTime": {
    "date": date,
    "dateTime": datetime,
    "timeZone": string
  },
  "transparency": string,
  "visibility": string,
  "iCalUID": string,
  "sequence": number,
  "attendees": [
    {
      "id": string,
      "email": string,
      "displayName": string,
      "organizer": boolean,
      "self": boolean,
      "resource": boolean,
      "optional": boolean,
      "responseStatus": string,
      "comment": string,
      "additionalGuests": number
    }
  ],
  "attendeesOmitted": boolean,
  "extendedProperties": {
    "private": {
      (key): string
    },
    "shared": {
      (key): string
    }
  },
  "hangoutLink": string,
  "conferenceData": {
    "createRequest": {
      "requestId": string,
      "conferenceSolutionKey": {
        "type": string
      },
      "status": {
        "statusCode": string
      }
    },
    "entryPoints": [
      {
        entryPointType: 'video' | 'phone' | 'sip' | 'more',
        uri?: string,
        label?: string,
        pin?: string,
        accessCode?: string,
        meetingCode?: string,
        passcode?: string,
        password?: string
      }
    ],
    "conferenceSolution": {
      "key": {
        "type": string
      },
      "name": string,
      "iconUri": string
    },
    "conferenceId": string,
    "signature": string,
    "notes": string,
  },
  "gadget": {
    "type": string,
    "title": string,
    "link": string,
    "iconLink": string,
    "width": number,
    "height": number,
    "display": string,
    "preferences": {
      (key): string
    }
  },
  "anyoneCanAddSelf": boolean,
  "guestsCanInviteOthers": boolean,
  "guestsCanModify": boolean,
  "guestsCanSeeOtherGuests": boolean,
  "privateCopy": boolean,
  "locked": boolean,
  "reminders": {
    "useDefault": boolean,
    "overrides": [
      {
        "method": string,
        "minutes": number
      }
    ]
  },
  "source": {
    "url": string,
    "title": string
  },
  "attachments": [
    {
      "fileUrl": string,
      "title": string,
      "mimeType": string,
      "iconLink": string,
      "fileId": string
    }
  ],
  "eventType": 'default' | 'outOfOffice' | 'focusTime'
}

export type eventListResponse = {
  "kind": "calendar#events",
  "etag": etag,
  "summary": string,
  "description": string,
  "updated": datetime,
  "timeZone": string,
  "accessRole": string,
  "defaultReminders": [
    {
      "method": string,
      "minutes": number
    }
  ],
  "nextPageToken": string,
  "nextSyncToken": string,
  "items": [
    eventResource
  ]
}

export type eventOpenSearchRequest = {
  method: 'create' | 'update' | 'delete' | 'search',
  eventId?: string,
  notes?: string,
  userId: string,
}
