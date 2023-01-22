

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
  type?: string,
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
