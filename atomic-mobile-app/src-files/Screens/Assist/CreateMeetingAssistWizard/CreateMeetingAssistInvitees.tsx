import React, {
    useState,
    useEffect,
    Dispatch,
    SetStateAction,
} from 'react'
import {
    FlatList,
    Platform,
    SafeAreaView,
    StyleSheet,
    Pressable,
    TextInputSubmitEditingEventData,
    NativeSyntheticEvent,
    Appearance,
    ScrollView,
} from 'react-native'
import { TextField } from 'react-native-ui-lib'
import {
  SpeedDial,
  ListItem,
  FAB,
  SearchBar,
 } from 'react-native-elements/src'
import LinearGradient from 'react-native-linear-gradient'

import Box from '@components/common/Box'
import Text from '@components/common/Text'
import Button from '@components/Button'
import RegularCard from '@components/RegularCard'

import {
    listUserContactsHelper,
    searchContactsByName,
} from '@screens/Contact/ContactHelper'

import { ContactType } from '@app/dataTypes/ContactType'
import { addContactToInvitees, addOneToManualEntries, removeContactFromInvitee, removeContactFromSearchInvitee, removeEntryFromManualEntries, updateContactSelection, updateEntryInManualEntries, updateSearchContactSelection } from '@screens/Assist/UserMeetingAssistHelper'
import materialTheme from '@constants/Theme'
import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { MeetingAssistInviteType } from '@app/dataTypes/MeetingAssistInviteType'
import { palette } from '@theme/theme'

const dark = Appearance.getColorScheme() === 'dark'

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
  invitees: MeetingAssistInviteType[],
  setParentInvitees: Dispatch<SetStateAction<MeetingAssistInviteType[]>>,
  userId: string,
  client: ApolloClient<NormalizedCacheObject>,
  hostName: string,
  meetingId: string,
}

type selectedContactProps = {
  contact: SelectedContactType,
  addContactToInvitees: typeof addContactToInvitees
  removeContactFromInvitee: typeof removeContactFromInvitee,
  updateContactSelection: typeof updateContactSelection,
  contacts: SelectedContactType[],
  setContacts: Dispatch<SetStateAction<SelectedContactType[]>>,
  setParentI: Dispatch<SetStateAction<MeetingAssistInviteType[]>>,
  invitees: MeetingAssistInviteType[],
  setInvitees: Dispatch<SetStateAction<MeetingAssistInviteType[]>>,
  index: number,
  hostId: string,
  hostName: string,
  meetingId: string,
}

type SelectedSearchContactTypeProps = {
  contact: SelectedContactType,
  addContactToInvitees: typeof addContactToInvitees
  removeContactFromSearchInvitee: typeof removeContactFromSearchInvitee,
  updateSearchContactSelection: typeof updateSearchContactSelection,
  contacts: SelectedContactType[],
  searchResults: SelectedContactType[],
  setContacts: Dispatch<SetStateAction<SelectedContactType[]>>,
  setParentI: Dispatch<SetStateAction<MeetingAssistInviteType[]>>,
  setSearchResults: Dispatch<SetStateAction<SelectedContactType[]>>,
  invitees: MeetingAssistInviteType[],
  setInvitees: Dispatch<SetStateAction<MeetingAssistInviteType[]>>,
  index: number,
  hostId: string,
  hostName: string,
  meetingId: string,
}

function SearchContact(props: SelectedSearchContactTypeProps) {
  const [selected, setSelected] = useState<boolean>(props?.invitees.findIndex(i => i.id === props?.contact.id) > -1)
  const { hostId, hostName, meetingId } = props
  const updateSelected = () => {
    const value = !selected
    setSelected(value)

    if (value === true) {
      props?.updateSearchContactSelection(
        value,
        props?.contact,
        props?.contacts,
        props?.searchResults,
        props?.setContacts,
        props?.setSearchResults,
        props?.index,
      )

      props?.addContactToInvitees(
        props?.contact,
        props?.invitees,
        props?.setInvitees,
        props?.setParentI,
        hostId, 
        hostName, 
        meetingId,
      )
    } else if (value === false) {
      props?.updateSearchContactSelection(
        value,
        props?.contact,
        props?.contacts,
        props?.searchResults,
        props?.setContacts,
        props?.setSearchResults,
        props?.index,
      )

      props?.removeContactFromSearchInvitee(
        props?.contact,
        props?.invitees,
        props?.searchResults,
        props?.setInvitees,
        props?.setSearchResults,
        props?.setParentI,
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

type selectedContactsProps = {
  contacts: SelectedContactType[],
  setParentI: Dispatch<SetStateAction<MeetingAssistInviteType[]>>,
  invitees: MeetingAssistInviteType[],
  setInvitees: Dispatch<SetStateAction<MeetingAssistInviteType[]>>,
  closeContacts: () => void,
  hostId: string,
  hostName: string,
  meetingId: string,
  client: ApolloClient<NormalizedCacheObject>,
}

function Contact(props: selectedContactProps) {
  const [selected, setSelected] = useState<boolean>(props?.invitees.findIndex(i => i.id === props?.contact.id) > -1)
  const { hostId, hostName, meetingId } = props
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

      props?.addContactToInvitees(
        props?.contact,
        props?.invitees,
        props?.setInvitees,
        props?.setParentI,
        hostId, 
        hostName, 
        meetingId,
      )
    } else if (value === false) {
      props?.updateContactSelection(
        value,
        props?.contact,
        props?.contacts,
        props?.setContacts,
        props?.index,
      )

      props?.removeContactFromInvitee(
        props?.contact,
        props?.invitees,
        props?.setInvitees,
        props?.setParentI,
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


function Contacts(props: selectedContactsProps) {
  const [contacts, setContacts] = useState<SelectedContactType[]>(props?.contacts)
  const [searchResults, setSearchResults] = useState<SelectedContactType[]>()
  const [search, setSearch] = useState<string>('')

  const { hostId, hostName, meetingId, client } = props

  const updateSearch = (text: string) => setSearch(text)

  const onCancelSearch = () => {
    setSearch('')
    setSearchResults([])
  }

  const onClearSearch = () => setSearch('')

  const onSubmitSearch = async ({ nativeEvent: { text }}: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => {
    try {
      if (!text) {
        return
      }

      

      const newResults = await searchContactsByName(
        client,
        hostId,
        text,
      )

      

      if (newResults?.length > 0) {
        setSearchResults(newResults?.map(c => ({ ...c, selected: props?.invitees?.findIndex(i => i?.id === c?.id) > -1 })))
      }
    } catch (e) {
      
    }
  }

  const closeContacts = props?.closeContacts

  
  return (
    <Box flex={1}>
      <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%' }}>
        <Box>
          <SearchBar
            round
            placeholder="Type Name Here And Enter..."
            onChangeText={updateSearch}
            value={search}
            onSubmitEditing={onSubmitSearch}
            onClear={onClearSearch}
            onCancel={onCancelSearch}
            platform={Platform.OS === 'ios' ? 'ios' : 'android'}
            autoCapitalize="none"
            containerStyle={{ backgroundColor: dark ? palette.black : null }}
          />
        </Box>

        {searchResults?.length > 0
        ? (
          <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%'}}>
            <FlatList
              data={contacts}
              renderItem={({ item, index }) => (
                <SearchContact
                  contact={item}
                  addContactToInvitees={addContactToInvitees}
                  removeContactFromSearchInvitee={removeContactFromSearchInvitee}
                  updateSearchContactSelection={updateSearchContactSelection}
                  contacts={contacts}
                  searchResults={searchResults}
                  setContacts={setContacts}
                  setParentI={props?.setParentI}
                  setSearchResults={setSearchResults}
                  invitees={props?.invitees}
                  setInvitees={props?.setInvitees}
                  index={index}
                  hostId={hostId} 
                  hostName={hostName}
                  meetingId={meetingId}
                />
              )}
              keyExtractor={(item, index) => `${item}-${index}`}
            />
          </Box>
        ) : (
        <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%'}}>
        {
          contacts?.length > 0
          ? (
            <FlatList
              data={contacts}
              renderItem={({ item, index }) => (
                <Contact
                  contact={item}
                  addContactToInvitees={addContactToInvitees}
                  removeContactFromInvitee={removeContactFromInvitee}
                  updateContactSelection={updateContactSelection}
                  contacts={contacts}
                  setContacts={setContacts}
                  setParentI={props?.setParentI}
                  invitees={props?.invitees}
                  setInvitees={props?.setInvitees}
                  index={index}
                  hostId={hostId} 
                  hostName={hostName}
                  meetingId={meetingId}
                />
              )}
              keyExtractor={(item, index) => `${item}-${index}`}
            />
          ) : (
            <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '90%'}}>
              <Text variant="subheaderNormal">
                You have no contacts saved.
                Go to settings to enable and sync Contacts from your phone
                or 3rd party provider.
              </Text>
            </Box>
          )
        }
        </Box>
        )}
        <Box justifyContent="center" alignItems="center" style={{ width: '100%' }}>
          <Pressable onPress={closeContacts}>
            <Text m={{ phone: 'm', tablet: 'l' }} variant="buttonLink">
              Close
            </Text>
          </Pressable>
        </Box>
      </Box>
    </Box>
  )
}

type ManualEntryTypeProps = MeetingAssistInviteType & {
  index: number,
  setManualEntries: Dispatch<SetStateAction<MeetingAssistInviteType[]>>,
  manualEntries: MeetingAssistInviteType[],
  setParentI: Dispatch<SetStateAction<MeetingAssistInviteType[]>>,
  parentIndex: number,
  invitees: MeetingAssistInviteType[],
  setInvitees: Dispatch<SetStateAction<MeetingAssistInviteType[]>>,
}

type ManualEntriesTypeProps = {
  setManualEntries: Dispatch<SetStateAction<MeetingAssistInviteType[]>>,
  manualEntries: MeetingAssistInviteType[],
  invitees: MeetingAssistInviteType[],
  setInvitees: Dispatch<SetStateAction<MeetingAssistInviteType[]>>,
  setParentI: Dispatch<SetStateAction<MeetingAssistInviteType[]>>,
  closeManual: () => void,
  hostId: string,
  hostName: string,
  meetingId: string,
}

function ManualEntry(props: ManualEntryTypeProps) {
  const [email, setEmail] = useState<string>(props?.email)
  const [name, setName] = useState<string>('')
  const setManualEntries = props?.setManualEntries
  const manualEntries = props?.manualEntries
  const index = props?.index
  const setParentI = props?.setParentI
  const parentIndex = props?.parentIndex
  const invitees = props?.invitees
  const setInvitees = props?.setInvitees

  
  


  const onEmailChange = (value: string) => {
    setEmail(value)
    updateEntryInManualEntries(manualEntries, setManualEntries, index, invitees, setInvitees, setParentI, parentIndex, value, name)
  }

  const onNameChange = (value: string) => {
    setName(value)
    updateEntryInManualEntries(manualEntries, setManualEntries, index, invitees, setInvitees, setParentI, parentIndex, email, value)
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
            onChangeText={onEmailChange}
            value={email || ''}
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
            onChangeText={onNameChange}
            value={name || manualEntries?.[index]?.name || ''}
            style={{ width: '60%'}}
          />
        </Box>
        <Button onPress={() => removeEntryFromManualEntries(manualEntries, setManualEntries, invitees, setInvitees, setParentI, index, parentIndex)}>
          Remove
        </Button>
      </RegularCard>
    </Box>
  )
}

function ManualEntries(props: ManualEntriesTypeProps) {
  const closeManual = props?.closeManual
  const addNewEntry = () => {

    addOneToManualEntries(
      props?.manualEntries,
      props?.setManualEntries,
      props?.invitees,
      props?.setInvitees,
      props?.setParentI,
      props?.hostId,
      props?.hostName,
      props?.meetingId,
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
                index={index}
                setManualEntries={props?.setManualEntries}
                manualEntries={props?.manualEntries}
                setParentI={props?.setParentI}
                parentIndex={props?.invitees.findIndex(a => (a?.id === item?.id))}
                invitees={props?.invitees}
                setInvitees={props?.setInvitees}
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


function CreateMeetingAssistInvitees(props: Props) {
  const [invitees, setInvitees] = useState<MeetingAssistInviteType[]>(props?.invitees)
  const [isManual, setIsManual] = useState<boolean>(false)
  const [manualEntries, setManualEntries] = useState<MeetingAssistInviteType[]>([])
  const [isContacts, setIsContacts] = useState<boolean>(false)
  const [contacts, setContacts] = useState<SelectedContactType[]>([])
  const [isOpen, setIsOpen] = useState<boolean>(false)

  const userId = props?.userId
  const meetingId = props?.meetingId
  const hostName = props?.hostName

  const setParentInvitees = props?.setParentInvitees
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
        invitees={invitees}
        setInvitees={setInvitees}
        setParentI={setParentInvitees}
        closeManual={closeManual}
        hostId={userId}
        hostName={hostName}
        meetingId={meetingId}
      />
    )
  }

  if (isContacts) {
    return (
      <Contacts
        contacts={contacts}
        setParentI={setParentInvitees}
        invitees={invitees}
        setInvitees={setInvitees}
        closeContacts={closeContacts}
        hostId={userId}
        hostName={hostName}
        meetingId={meetingId}
        client={client}
      />
    )
  }

   return (
   <Box flex={1} style={{ width: '100%' }}>
     {
       invitees?.length > 0
       ? (
         <FlatList
           data={invitees}
           renderItem={({ item }) => (
            <Box style={{ borderColor: palette.transparent, borderWidth: 3 }}>
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
                    {item?.email}
                  </ListItem.Subtitle>
                </ListItem.Content>
              </ListItem>
             </Box>
           )}
           keyExtractor={(item) => item?.id}
         />
       ) : (
         <Box flex={1} justifyContent="center" alignItems="center">
           <Text variant="subheader">
             Add an invitee from your contacts or manually enter one
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

export default CreateMeetingAssistInvitees
