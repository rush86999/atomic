import { meetingTypeStringType } from '@app/zoom/types'


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

export type appType = 'zoom' | 'google'

export type conferenceNameType = 'Zoom Meeting' | 'Google Meet'

export type ConferenceType = {
  id: string,
  userId: string,
  calendarId: string,
  app: appType,
  requestId?: string,
  type?: meetingTypeStringType,
  status?: string,
  iconUri?: string,
  name?: string,
  notes?: string,
  entryPoints?: entryPoint[],
  parameters?: {
    addOnParameters?: {
      parameters?: parameterType[],
    }
  },
  key?: string,
  hangoutLink?: string,
  joinUrl?: string,
  startUrl?: string,
  zoomPrivateMeeting?: boolean,
  updatedAt: string,
  createdDate: string,
  deleted: boolean
}
