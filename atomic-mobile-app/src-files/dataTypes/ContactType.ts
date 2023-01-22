

export type contactEmail = {
  primary: boolean,
  value: string,
  type?: string,
  displayName?: string,
}

export type contactPhone = {
  primary: boolean,
  value: string,
  type?: string,
}

export type imAddress = {
  primary: boolean,
  username: string,
  service: string,
  type?: string,
}

export type linkAddress = {
  primary: boolean,
  value: string,
  type?: string,
}

export type ContactType = {
  id: string,
  userId: string,
  name?: string,
  firstName?: string,
  middleName?: string,
  lastName?: string,
  maidenName?: string,
  namePrefix?: string,
  nameSuffix?: string,
  nickname?: string,
  phoneticFirstName?: string,
  phoneticMiddleName?: string,
  phoneticLastName?: string,
  company?: string,
  jobTitle?: string,
  department?: string,
  notes?: string,
  imageAvailable: boolean,
  contactType?: string,
  emails?: contactEmail[],
  phoneNumbers?: contactPhone[],
  imAddresses?: imAddress[],
  linkAddresses?: linkAddress[],
  app?: string,
  updatedAt: string,
  createdDate: string,
  deleted: boolean
}
