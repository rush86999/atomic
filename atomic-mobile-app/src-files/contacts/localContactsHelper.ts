import { RxDatabase, RxDocument } from 'rxdb'
import { Platform, PermissionsAndroid } from 'react-native'
import axios from 'axios'
import { Auth } from 'aws-amplify'
import { dayjs, RNLocalize } from '@app/date-utils'
import utc from 'dayjs/plugin/utc'
import { v4 as uuid } from 'uuid'
import Toast from 'react-native-toast-message'
import Contacts from 'react-native-contacts'
import { AtomicDatabase } from '@app/dataTypes/ConfigType'

import {
  LocalContact,
} from '@screens/Contact/types'
import {
  Person,
} from '@screens/Calendar/types'
import {
  ContactType,
} from '@app/dataTypes/ContactType'
import { localContactsResource } from '@app/contacts/constants'


export const getAndroidLocalContacts = async () => {
  try {

    await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
      {
        'title': 'Contacts',
        'message': 'Atomic would like to view your contacts in order help arrange meet ups with your contacts in the future',
        'buttonPositive': 'Please accept'
      }
    )

    const contacts = await Contacts.getAll()

    return contacts
  } catch (e) {

  }
}

export const getIosLocalContacts = async () => {
  try {
    const permissions = await Contacts.checkPermission()
    if (permissions === 'authorized') {
      const contacts = await Contacts.getAllWithoutPhotos()
      return contacts
    } else {
      const permissions = await Contacts.requestPermission()

      if (permissions === 'authorized') {
        const contacts = await Contacts.getAllWithoutPhotos()
        return contacts
      } else {
        Toast.show({
          type: 'info',
          text1: 'Need permissions',
          text2: 'Atomic need your permissions to read Contacts to allow sharing of availability for meetings'
        })
      }
    }

  } catch (e) {

  }
}

export const reformatToPerson = (
  contacts: LocalContact[]
): Person[] => {

  const persons: Person[] = contacts.map(c => ({
    id: c?.recordID || uuid(),
    name: c?.givenName,
    emails: c?.emailAddresses.map(e => ({ primary: false, value: e?.email, displayName: e?.label, type: '' })),
    imAddresses: c?.imAddresses.map(i => ({ primary: false, username: i?.username, service: i?.service, type: '' })),
    phoneNumbers: c?.phoneNumbers.map(p => ({ primary: false, value: p?.number, type: '' })),
  }))
  return persons
}

export const reformatToContactType = (
  contacts: LocalContact[],
  userId: string,
): ContactType[] => {

  const contactTypes: ContactType[] = contacts.map(c => ({
    id: c?.recordID || uuid(),
    userId,
    name: c?.givenName,
    firstName: c?.givenName,
    middleName: c?.middleName,
    lastName: c?.familyName,
    namePrefix: c?.prefix,
    nameSuffix: c?.suffix,
    company: c?.company,
    jobTitle: c?.jobTitle,
    department: c?.department,
    imageAvailable: false,
    emails: c?.emailAddresses.map(e => ({ primary: false, value: e?.email, displayName: e?.label })),
    phoneNumbers: c?.phoneNumbers.map(p => ({ primary: false, value: p?.number })),
    imAddresses: c?.imAddresses.map(i => ({ primary: false, username: i?.username, service: i?.service })),
    app: localContactsResource,
    updatedAt: dayjs().toISOString(),
    createdDate: dayjs().toISOString(),
    deleted: false,
  }))

  return contactTypes
}
