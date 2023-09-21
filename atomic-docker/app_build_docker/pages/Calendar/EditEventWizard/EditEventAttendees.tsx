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
  Dimensions,
  Appearance,
} from 'react-native'
import TextField from '@components/TextField'
import {

  ListItem,

 } from '@rneui/themed'
import Fab from '@mui/material/Fab';
import AddIcon from '@mui/icons-material/Add';
import { SxProps, useTheme } from '@mui/material/styles'
import Zoom from '@mui/material/Zoom'
import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialIcon from '@mui/material/SpeedDialIcon';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import { pink } from '@mui/material/colors'
import ImportContactsIcon from '@mui/icons-material/ImportContacts';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import EditIcon from '@mui/icons-material/Edit'

import Box from '@components/common/Box'
import Text from '@components/common/Text'
import RegularCard from '@components/RegularCard'

import {
  listUserContactsHelper
} from '@lib/Contact/ContactHelper'
import { email, Person } from '@lib/Calendar/types'


import { ContactType } from '@lib/dataTypes/ContactType'
import { addContactToAttendees, addOneToManualEntries, removeContactFromAttendee, removeEntryFromManualEntries, updateContactSelection, updateEntryInManualEntries } from '@lib/Calendar/CreateEventWizard/wizardHelper'

import { ApolloClient, NormalizedCacheObject } from '@apollo/client'

import { palette } from '@lib/theme/theme'
import { NextApiRequest, NextApiResponse } from 'next';
import supertokensNode from 'supertokens-node'
import { backendConfig } from '../../../config/backendConfig'
import Session from 'supertokens-node/recipe/session'

export async function getServerSideProps({ req, res }: { req: NextApiRequest, res: NextApiResponse }) {
  // Notice how the server uses `API` from `withSSRContext`, instead of the top-level `API`.
  // const SSR = withSSRContext({ req })
  // this runs on the backend, so we must call init on supertokens-node SDK
  supertokensNode.init(backendConfig())
  let session
  try {
    session = await Session.getSession(req, res, {
      overrideGlobalClaimValidators: async function () {
        return []
      },
    })
  } catch (err: any) {
    if (err.type === Session.Error.TRY_REFRESH_TOKEN) {
      return { props: { fromSupertokens: 'needs-refresh' } }
    } else if (err.type === Session.Error.UNAUTHORISED) {
      // this will force the frontend to try and refresh which will fail
      // clearing all cookies and redirecting the user to the login screen.
      return { props: { fromSupertokens: 'needs-refresh' } }
    }
    throw err
  }

  if (!session?.getUserId()) {
    return {
      redirect: {
        destination: '/User/Login/UserLogin',
        permanent: false,
      },
    }
  }

  return {
    props: {
      sub: session.getUserId(),
    }
  }
}

const styles = {
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
  container2: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
  },
}

const fabStyle = {
  position: 'absolute',
  bottom: 16,
  right: 16,
}

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
    <Box flex={1} style={{ width: '100%' }} minHeight="65vh" maxHeight="65vh">
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
            <Box style={{ width: '95%' }} justifyContent="center" alignItems="center">
              <Text variant="subheaderNormal">
                You have no contacts saved.
                Go to settings to enable and sync Contacts from your phone
                or 3rd party provider.
              </Text>
            </Box>
          </Box>
        )
      }
      <Box justifyContent="center" alignItems="center" style={{ width: '100%' }}>
        <Pressable onPress={closeContacts}>
          <Text p={{ phone: 'm', tablet: 'l' }} variant="buttonLink">
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
        <Box p={{ phone: 's', tablet: 'm' }}>
          <Text variant="optionHeader">
            {props?.contact?.name}
          </Text>
        </Box>
        <Box>
          <Text variant="caption">
            {props?.contact?.emails?.filter(i => (i.primary === true))?.[0]?.value}
          </Text>
        </Box>
        <Box p={{ phone: 's', tablet: 'm' }}>
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

/**
const newValue: Person = {
  id: uuid(),
  emails: [{ primary: false, value: '', type: '', displayName: ''}],
  additionalGuests: 0,
}
*/
function ManualEntry(props: manualEntryProps) {
  const [emails, setEmails] = useState<email[]>(props?.emails || [{ primary: true, value: '', displayName: '', type: '' }])
  const [additionalGuests, setAdditionalGuests] = useState<number>(props?.additionalGuests || 0)

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
    setAdditionalGuests(parseInt(text.replace(/[^0-9.]/g, ''), 10))
    updateEntryInManualEntries(manualEntries, setManualEntries, index, attendees, setAttendees, setParentA, parentIndex, emails, undefined, parseInt(text.replace(/[^0-9.]/g, ''), 10))
  }

  return (

      <Box>
        <RegularCard>
          <Box p={{ phone: 's', tablet: 'm' }}>
            <Text variant="optionHeader">
              Email
            </Text>
            <TextField
              placeholder="r@r.com"
              onChange={(e: { target: { value: string } }) => onEmailChange(e?.target?.value)}
              value={emails?.[0]?.value || ''}
              style={{ width: '60%'}}
              validate="email"
              validationMessage="Please input a valid email address"
            />
          </Box>
          <Box p={{ phone: 's', tablet: 'm' }}>
            <Text variant="optionHeader">
              Display Name
            </Text>
            <TextField
              placeholder="name"
              onChange={(e: { target: { value: string } }) => onNameChange(e?.target?.value)}
              value={manualEntries?.[index]?.name || ''}
              style={{ width: '60%'}}
            />
          </Box>
          <Box p={{ phone: 's', tablet: 'm' }}>
            <Text variant="optionHeader">
              Additional Guests?
            </Text>
            <TextField
              type="number"
              onChange={(e: { target: { value: string } }) => onAdditionalGuestsChange(e?.target?.value)}
              value={`${additionalGuests}`}
              placeholder="0"
              style={{ width: '15%' }}
            />
          </Box>
          <Pressable onPress={() => removeEntryFromManualEntries(manualEntries, setManualEntries, attendees, setAttendees, setParentA, index, parentIndex)}>
            <Text variant="buttonLink">
              Remove
            </Text>
          </Pressable>
        </RegularCard>
        </Box>
  
  )
}

function ManualEntries(props: manualEntriesProps) {
  const [pageOffset, setPageOffset] = useState<number>(0)

  const { height: fullHeight } = Dimensions.get('window')
  
  const theme = useTheme()

  const transitionDuration = {
    enter: theme.transitions.duration.enteringScreen,
    exit: theme.transitions.duration.leavingScreen,
  }

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
    <Box flex={1} style={{ width: '100%' }} minHeight="65vh" maxHeight="65vh">

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
              <Text p={{ phone: 'm', tablet: 'l' }} variant="buttonLink">
                Close
              </Text>
            </Pressable>
          </Box>

            <Zoom
              in
              timeout={transitionDuration}
              style={{
                transitionDelay: `${transitionDuration.exit}ms`,
              }}
              unmountOnExit
            >
              <Fab sx={fabStyle as SxProps} aria-label={'Add'} color="primary" onClick={addNewEntry}>
                <AddIcon sx={{ color: pink[500] }} />
              </Fab>
            </Zoom>
        </Box>
    </Box>
  )
}

function EditEventAttendees(props: Props) {
  const [attendees, setAttendees] = useState<Person[]>(props?.attendees)
  const [isManual, setIsManual] = useState<boolean>(false)
  const [manualEntries, setManualEntries] = useState<Person[]>([])
  const [isContacts, setIsContacts] = useState<boolean>(false)
  const [contacts, setContacts] = useState<SelectedContactType[]>([])
  const [isOpen, setIsOpen] = useState<boolean>(false)
  // const [contactChecks, setContactChecks] = useState<boolean[]>([])

  const userId = props?.userId
  // const parentAttendees = props?.attendees
  const setParentAttendees = props?.setParentAttendees
  const client = props?.client

  // get any contacts
  useEffect(() => {
    (async () => {
      if (!client || !userId) {
        return
      }
      const newContacts = await listUserContactsHelper(client, userId)
      console.log(newContacts, ' newContacts')
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

  const actions = [
    { icon: <ImportContactsIcon color="secondary" />, name: 'Import Contacts', method: onContactsChange },
    { icon: <KeyboardIcon color="secondary" />, name: 'Manual Entry', method: onManualChange },
  ]

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
   <Box flex={1} style={{ width: '100%' }} minHeight="65vh" maxHeight="65vh">
      {
        attendees?.length > 0
        ? (
          <FlatList
            data={attendees}
            renderItem={({ item }) => (
              <ListItem
                  containerStyle={{ 
                    backgroundColor: palette.white,
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderColor: palette.darkGray
                  }}
              >
                <ListItem.Content>
                  <ListItem.Title style={{ color: palette.textBlack, fontWeight: 'bold' }}>
                    {item?.name}
                  </ListItem.Title>
                  <ListItem.Subtitle style={{ color: palette.textBlack, }}>
                    {item?.emails?.[0]?.value}
                  </ListItem.Subtitle>
                </ListItem.Content>
              </ListItem>
            )}
            keyExtractor={(item) => item?.id}
          />
        ) : (
          <Box flex={1} justifyContent="center" alignItems="center">
            <Box style={{ width: '90%'}} justifyContent="center" alignItems="center">
              <Text variant="subheaderNormal">
                Add an attendee from your contacts or manually enter one
              </Text>
            </Box>
          </Box>
        )
      }
      <div className="absolute inset-0 z-20 pointer-events-none">
        <SpeedDial
            ariaLabel="Calendar SpeedDial"
            sx={{ position: 'absolute', bottom: 24, right: 24, zIndex: 'speedDial' }}
            icon={<SpeedDialIcon icon={<EditIcon />} sx={{ color: pink[500] }} />}
        >
            {actions.map((action) => (
                <SpeedDialAction
                    key={action.name}
                    icon={action.icon}
                    tooltipTitle={action.name}
                    FabProps={{
                        onClick: action.method,
                    }}
                />
            ))}
        </SpeedDial>
      </div>
   </Box>
 )
}

export default EditEventAttendees
/** end */
