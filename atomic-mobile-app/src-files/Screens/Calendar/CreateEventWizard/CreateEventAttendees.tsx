import React, {
useState,
useEffect,
Dispatch,
SetStateAction,
} from 'react'
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Pressable,
} from 'react-native'
import { TextField } from 'react-native-ui-lib'
import {
  SpeedDial,
  ListItem,
  FAB,
 } from 'react-native-elements/src'
import LinearGradient from 'react-native-linear-gradient'


import Box from '@components/common/Box'
import Text from '@components/common/Text'
import Button from '@components/Button'
import RegularCard from '@components/RegularCard'

import {
  listUserContactsHelper
} from '@screens/Contact/ContactHelper'
import { email, Person } from '@screens/Calendar/types'

import { ContactType } from '@app/dataTypes/ContactType'
import { addContactToAttendees, addOneToManualEntries, removeContactFromAttendee, removeEntryFromManualEntries, updateContactSelection, updateEntryInManualEntries } from '@screens/Calendar/CreateEventWizard/wizardHelper'
import materialTheme from '@constants/Theme'
import { ApolloClient, NormalizedCacheObject } from '@apollo/client'

const styles = StyleSheet.create({
  safeArea: {
    alignItems: 'flex-end',
  },
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  fab: {
    margin: 16,
    marginTop: 0,
  },
})

export type SelectedContactType = ContactType & {
  selected: boolean,
}

type Props = {
  attendees: Person[],
  setParentAttendees: Dispatch<SetStateAction<Person[]>>,
  userId: string,
  client: ApolloClient<NormalizedCacheObject>,
}

type selectedContactProps = {
  contact: SelectedContactType,
  addContactToAttendees: typeof addContactToAttendees
  removeContactFromAttendee: typeof removeContactFromAttendee,
  updateContactSelection: typeof updateContactSelection,
  contacts: SelectedContactType[],
  setContacts: Dispatch<SetStateAction<SelectedContactType[]>>,
  setParentA: Dispatch<SetStateAction<Person[]>>,
  attendees: Person[],
  setAttendees: Dispatch<SetStateAction<Person[]>>,
  index: number,
}

type selectedContactsProps = {
  addContactToAttendees: typeof addContactToAttendees
  removeContactFromAttendee: typeof removeContactFromAttendee,
  updateContactSelection: typeof updateContactSelection,
  contacts: SelectedContactType[],
  setParentA: Dispatch<SetStateAction<Person[]>>,
  attendees: Person[],
  setAttendees: Dispatch<SetStateAction<Person[]>>,
  closeContacts: () => void,
}

function Contacts(props: selectedContactsProps) {
  const [contacts, setContacts] = useState<SelectedContactType[]>(props?.contacts)
  const closeContacts = props?.closeContacts
  return (
    <Box flex={1}>
      {
        contacts?.length > 0
        ? (
          <FlatList
            data={contacts}
            renderItem={({ item, index }) => (
              <Contact
                contact={item}
                addContactToAttendees={props?.addContactToAttendees}
                removeContactFromAttendee={props?.removeContactFromAttendee}
                updateContactSelection={props?.updateContactSelection}
                contacts={contacts}
                setContacts={setContacts}
                setParentA={props?.setParentA}
                attendees={props?.attendees}
                setAttendees={props?.setAttendees}
                index={index}
              />
            )}
            keyExtractor={(item, index) => `${item}-${index}`}
          />
        ) : (
          <Box flex={1} justifyContent="center" alignItems="center">
            <Text variant="subheader">
              You have no contacts saved.
              Go to settings to enable and sync Contacts from your phone
              or 3rd party provider.
            </Text>
          </Box>
        )
      }
      <Box justifyContent="center" alignItems="center" style={{ width: '100%' }}>
        <Pressable onPress={closeContacts}>
          <Text m={{ phone: 'm', tablet: 'l' }} variant="buttonLink">
            Close
          </Text>
        </Pressable>
      </Box>
    </Box>
  )
}

function Contact(props: selectedContactProps) {
  const [selected, setSelected] = useState<boolean>(props?.attendees.findIndex(i => i.id === props?.contact.id) > -1)

  const updateSelected = () => {
    const value = !selected
    setSelected(value)

    if (value === true) {
      props?.updateContactSelection(
        value,
        props?.contact,
        props?.contacts,
        props?.setContacts,
        props?.index,
      )

      props?.addContactToAttendees(
        props?.contact,
        props?.attendees,
        props?.setAttendees,
        props?.setParentA,
      )
    } else if (value === false) {
      props?.updateContactSelection(
        value,
        props?.contact,
        props?.contacts,
        props?.setContacts,
        props?.index,
      )

      props?.removeContactFromAttendee(
        props?.contact,
        props?.attendees,
        props?.setAttendees,
        props?.setParentA,
      )
    }
  }

  return (
    <Box>
      <RegularCard>
        <Box m={{ phone: 's', tablet: 'm' }}>
          <Text variant="optionHeader">
            {props?.contact?.name}
          </Text>
        </Box>
        <Box>
          <Text variant="caption">
            {props?.contact?.emails?.filter(i => (i.primary === true))?.[0]?.value}
          </Text>
        </Box>
        <Box m={{ phone: 's', tablet: 'm' }}>
          <Pressable onPress={updateSelected}>
            <Text variant="buttonLink">
              {selected ? 'Remove' : 'Add' }
            </Text>
          </Pressable>
        </Box>
      </RegularCard>
    </Box>
  )
}

type manualEntryProps = Person & {
  updateEntryInManualEntries: typeof updateEntryInManualEntries,
  removeEntryFromManualEntries: typeof removeEntryFromManualEntries,
  index: number,
  setManualEntries: Dispatch<SetStateAction<Person[]>>,
  manualEntries: Person[],
  setParentA: Dispatch<SetStateAction<Person[]>>,
  parentIndex: number,
  attendees: Person[],
  setAttendees: Dispatch<SetStateAction<Person[]>>,
}

type manualEntriesProps = {
  setManualEntries: Dispatch<SetStateAction<Person[]>>,
  manualEntries: Person[],
  attendees: Person[],
  setAttendees: Dispatch<SetStateAction<Person[]>>,
  setParentA: Dispatch<SetStateAction<Person[]>>,
  closeManual: () => void,
  updateEntryInManualEntries: typeof updateEntryInManualEntries,
  removeEntryFromManualEntries: typeof removeEntryFromManualEntries,
  addOneToManualEntries: typeof addOneToManualEntries,
}

function ManualEntry(props: manualEntryProps) {
  const [emails, setEmails] = useState<email[]>(props?.emails)
  const [additionalGuests, setAdditionalGuests] = useState<number>(props?.additionalGuests)

  const updateEntryInManualEntries = props?.updateEntryInManualEntries
  const removeEntryFromManualEntries = props?.removeEntryFromManualEntries
  const setManualEntries = props?.setManualEntries
  const manualEntries = props?.manualEntries
  const index = props?.index
  const setParentA = props?.setParentA
  const parentIndex = props?.parentIndex
  const attendees = props?.attendees
  const setAttendees = props?.setAttendees

  const onEmailChange = (value: string) => {
    setEmails([{ ...emails?.[0], primary: true, value, type: '' }])
    updateEntryInManualEntries(manualEntries, setManualEntries, index, attendees, setAttendees, setParentA, parentIndex, [{ ...emails?.[0], primary: true, value, type: '' }], undefined, additionalGuests)
  }

  const onNameChange = (value: string) => {
    setEmails([{ ...emails?.[0], primary: true, displayName: value, type: '' }])
    updateEntryInManualEntries(manualEntries, setManualEntries, index, attendees, setAttendees, setParentA, parentIndex, [{ ...emails?.[0], primary: true, displayName: value, type: '' }], value, additionalGuests)
  }

  const onAdditionalGuestsChange = (text: string) => {
    setAdditionalGuests(parseInt(text.replace(/[^0-9.]/g, ''), 10) || 0)
    updateEntryInManualEntries(manualEntries, setManualEntries, index, attendees, setAttendees, setParentA, parentIndex, emails, undefined, parseInt(text.replace(/[^0-9.]/g, ''), 10) || 0)
  }

  return (
    <Box>
      <RegularCard>
        <Box m={{ phone: 's', tablet: 'm' }}>
          <Text variant="optionHeader">
            Email
          </Text>
          <TextField
            placeholder="r@r.com"
            onChangeText={(text: string) => onEmailChange(text)}
            value={emails?.[0]?.value || ''}
            style={{ width: '60%'}}
            autoCapitalize="none"
          />
        </Box>
        <Box m={{ phone: 's', tablet: 'm' }}>
          <Text variant="optionHeader">
            Display Name
          </Text>
          <TextField
            placeholder="name"
            onChangeText={(text: string) => onNameChange(text)}
            value={manualEntries?.[index]?.name || ''}
            style={{ width: '60%'}}
          />
        </Box>
        <Box m={{ phone: 's', tablet: 'm' }}>
          <Text variant="optionHeader">
            Additional Guests?
          </Text>
          <TextField
            type="numeric"
            onChangeText={(text: string) => onAdditionalGuestsChange(text)}
            value={`${additionalGuests}`}
            placeholder="0"
            style={{ width: '15%' }}
          />
        </Box>
        <Button onPress={() => removeEntryFromManualEntries(manualEntries, setManualEntries, attendees, setAttendees, setParentA, index, parentIndex)}>
          Remove
        </Button>
      </RegularCard>
    </Box>
  )
}

function ManualEntries(props: manualEntriesProps) {
  const closeManual = props?.closeManual
  const addNewEntry = () => {
    const addOneToManualEntries = props?.addOneToManualEntries
    addOneToManualEntries(
      props?.manualEntries,
      props?.setManualEntries,
      props?.attendees,
      props?.setAttendees,
      props?.setParentA,
    )
  }
  return (
    <Box flex={1} style={{ width: '100%' }}>
      {
        props?.manualEntries?.length > 0
        ? (
          <FlatList
            data={props?.manualEntries}
            renderItem={({ item, index }) => (
              <ManualEntry
                {...item}
                updateEntryInManualEntries={props?.updateEntryInManualEntries}
                removeEntryFromManualEntries={props?.removeEntryFromManualEntries}
                index={index}
                setManualEntries={props?.setManualEntries}
                manualEntries={props?.manualEntries}
                setParentA={props?.setParentA}
                parentIndex={props?.attendees.findIndex(a => (a?.id === item?.id))}
                attendees={props?.attendees}
                setAttendees={props?.setAttendees}
              />
            )}
            keyExtractor={(item) => item?.id}
          />
        ) : (
          <Box flex={1} justifyContent="center" alignItems="center">
            <Text variant="subheader">
              Add a New Entry
            </Text>
          </Box>
        )
      }
      <Box justifyContent="center" alignItems="center" style={{ width: '100%' }}>
        <Pressable onPress={closeManual}>
          <Text m={{ phone: 'm', tablet: 'l' }} variant="buttonLink">
            Close
          </Text>
        </Pressable>
      </Box>
      <Box style={styles.container} pointerEvents="box-none">
        <SafeAreaView style={styles.safeArea} pointerEvents="box-none">
          <FAB
            icon={{
              name: 'add',
              type: 'ionicon',
              color: '#fff',
             }}
            onPress={addNewEntry}
            style={styles.fab}
          />
        </SafeAreaView>
      </Box>
    </Box>
  )
}

function CreateEventAttendees(props: Props) {
  const [attendees, setAttendees] = useState<Person[]>(props?.attendees)
  const [isManual, setIsManual] = useState<boolean>(false)
  const [manualEntries, setManualEntries] = useState<Person[]>([])
  const [isContacts, setIsContacts] = useState<boolean>(false)
  const [contacts, setContacts] = useState<SelectedContactType[]>([])
  const [isOpen, setIsOpen] = useState<boolean>(false)

  const userId = props?.userId
  const setParentAttendees = props?.setParentAttendees
  const client = props?.client

  useEffect(() => {
    (async () => {
      if (!client || !userId) {
        return
      }
      const newContacts = await listUserContactsHelper(client, userId)
      if (newContacts?.length > 0) {
        setContacts(newContacts
          .map(c => ({ ...c, selected: false } as SelectedContactType))
          .filter(c => (c?.emails?.[0]?.value?.length > 0))
        )
      }
    })()
  }, [client, userId])

  const onManualChange = () => {
    setIsContacts(isManual)
    setIsManual(!isManual)
  }

  const onContactsChange = () => {
    setIsManual(isContacts)
    setIsContacts(!isContacts)
  }

  const closeContacts = () => setIsContacts(false)

  const closeManual = () => setIsManual(false)

  if (isManual) {
    return (
      <ManualEntries
        setManualEntries={setManualEntries}
        manualEntries={manualEntries}
        attendees={attendees}
        setAttendees={setAttendees}
        setParentA={setParentAttendees}
        updateEntryInManualEntries={updateEntryInManualEntries}
        removeEntryFromManualEntries={removeEntryFromManualEntries}
        addOneToManualEntries={addOneToManualEntries}
        closeManual={closeManual}
      />
    )
  }

  if (isContacts) {
    return (
      <Contacts
        addContactToAttendees={addContactToAttendees}
        removeContactFromAttendee={removeContactFromAttendee}
        updateContactSelection={updateContactSelection}
        contacts={contacts}
        setParentA={setParentAttendees}
        attendees={attendees}
        setAttendees={setAttendees}
        closeContacts={closeContacts}
      />
    )
  }

 return (
   <Box flex={1} style={{ width: '100%' }}>
     {
       attendees?.length > 0
       ? (
         <FlatList
           data={attendees}
           renderItem={({ item }) => (
             <ListItem
               linearGradientProps={{
                 colors: [materialTheme.COLORS.GRADIENT_START, materialTheme.COLORS.GRADIENT_END],
                 start: { x: 0, y: 0 },
                 end: { x: 1, y: 0 },
                 locations: [0.2, 1]
               }}
               ViewComponent={LinearGradient}
             >
               <ListItem.Content>
                 <ListItem.Title style={{ color: 'white', fontWeight: 'bold' }}>
                   {item?.name}
                 </ListItem.Title>
                 <ListItem.Subtitle style={{ color: 'white' }}>
                   {item?.emails?.[0]?.value}
                 </ListItem.Subtitle>
               </ListItem.Content>
             </ListItem>
           )}
           keyExtractor={(item) => item?.id}
         />
       ) : (
         <Box flex={1} justifyContent="center" alignItems="center">
           <Text variant="subheader">
             Add an attendee from your contacts or manually enter one
           </Text>
         </Box>
       )
     }
     <SpeedDial
       isOpen={isOpen}
       onOpen={() => setIsOpen(true)}
       onClose={() => setIsOpen(false)}
       icon={{
         name: 'edit',
         color: '#fff',
        }}
       openIcon={{
         name: 'close',
         type: 'ionicon',
         color: '#fff',
        }}
       >
         <SpeedDial.Action
           icon={{
             name: 'typewriter',
             color: '#fff',
             type: 'material-community',
            }}
           title="Manual Entry"
           onPress={onManualChange}
         />
         <SpeedDial.Action
           icon={{
             name: 'contacts',
             color: '#fff',
             type: 'antdesign',
            }}
           title="Import Contacts"
           onPress={onContactsChange}
         />
     </SpeedDial>
   </Box>
 )
}

export default CreateEventAttendees
