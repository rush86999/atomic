/* eslint-disable react/no-unknown-property */
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
    Dimensions,
    ColorValue,
} from 'react-native'
import TextField from '@components/TextField'
import {
  ListItem,

  SearchBar,
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
import EditIcon from '@mui/icons-material/Edit';


import Box from '@components/common/Box'
import Text from '@components/common/Text'
import Button from '@components/Button'
import RegularCard from '@components/RegularCard'

import {
    listUserContactsHelper,
    searchContactsByName,
} from '@lib/Contact/ContactHelper'

import { ContactType } from '@lib/dataTypes/ContactType'
import { addContactToInvitees, addOneToManualEntries, removeContactFromInvitee, removeContactFromSearchInvitee, removeEntryFromManualEntries, updateContactSelection, updateEntryInManualEntries, updateSearchContactSelection } from '@lib/Assist/UserMeetingAssistHelper'

import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { MeetingAssistInviteType } from '@lib/dataTypes/MeetingAssistInviteType'
import { palette } from '@lib/theme/theme'

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
      if (props?.searchResults) {
        if (props?.setSearchResults) {
          props?.updateSearchContactSelection(
            value,
            props?.contact,
            props?.contacts,
            props?.searchResults,
            props?.setContacts,
            props?.setSearchResults,
            props?.index,
          )
        }
        
      }
      

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
      if (props?.contacts) {
        if (props?.searchResults) {
          if (props?.setSearchResults) {
             props?.updateSearchContactSelection(
              value,
              props?.contact,
              props?.contacts,
              props?.searchResults,
              props?.setContacts,
              props?.setSearchResults,
              props?.index,
            )
          }
         
        }
        
      }
      

      if (props?.searchResults) {
        if (props?.setSearchResults) {
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


function Contacts(props: selectedContactsProps) {
  const [contacts, setContacts] = useState<SelectedContactType[]>(props?.contacts)
  const [searchResults, setSearchResults] = useState<SelectedContactType[]>(props?.contacts)
  const [search, setSearch] = useState<string>('')

  const { hostId, hostName, meetingId, client } = props

  const updateSearch = (text: string) => setSearch(text)

  const onCancelSearch = () => {
    setSearch('')
    setSearchResults([])
  }

  const onClearSearch = () => setSearch('')

  const onSubmitSearch = async () => {
    try {
      // validate
      if (!search) {
        return
      }

      console.log(search, ' search search')

      const newResults = await searchContactsByName(
        client,
        hostId,
        search,
      )

      console.log(newResults, ' newResults post searchContactsByName')

      if (newResults?.length > 0) {
        setSearchResults(newResults?.map(c => ({ ...c, selected: props?.invitees?.findIndex(i => i?.id === c?.id) > -1 })))
      }
    } catch (e) {
      console.log(e, ' unable to submit search results')
    }
  }

  const closeContacts = props?.closeContacts

  console.log(searchResults && searchResults?.length > 0, ' searchResults?.length > 0')
  return (
    <Box flex={1}  minHeight="65vh" maxHeight="65vh" style={{ width: '100%' }}>
      <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%' }}>
        <Box style={{ width: '80%' }}>
          <form className="m-4">   
              <label htmlFor="default-search" className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white">Search</label>
              <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <svg aria-hidden="true" className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  </div>
                  <input value={search} onChange={(e) => updateSearch(e?.target?.value)} type="search" id="default-search" className="block w-full p-4 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-purple-500 dark:focus:border-purple-500" placeholder="Type Name Here And Enter..." required />
                  <button onClick={onSubmitSearch} className="text-white absolute right-2.5 bottom-2.5 bg-purple-700 hover:bg-purple-800 focus:ring-4 focus:outline-none focus:ring-purple-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-purple-600 dark:hover:bg-purple-700 dark:focus:ring-purple-800">Search</button>
              </div>
          </form>
        </Box>

        {searchResults && searchResults?.length > 0
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
            <Text p={{ phone: 'm', tablet: 'l' }} variant="buttonLink">
              Close
            </Text>
          </Pressable>
        </Box>
      </Box>
    </Box>
  )
}

type ManualEntryTypeProps = MeetingAssistInviteType & {
  // updateEntryInManualEntries: typeof updateEntryInManualEntries,
  // removeEntryFromManualEntries: typeof removeEntryFromManualEntries,
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
  // updateEntryInManualEntries: typeof updateEntryInManualEntries,
  // removeEntryFromManualEntries: typeof removeEntryFromManualEntries,
  // addOneToManualEntries: typeof addOneToManualEntries,
  hostId: string,
  hostName: string,
  meetingId: string,
}

function ManualEntry(props: ManualEntryTypeProps) {
  const [email, setEmail] = useState<string>(props?.email || '')
  const [name, setName] = useState<string>('')
  const setManualEntries = props?.setManualEntries
  const manualEntries = props?.manualEntries
  const index = props?.index
  const setParentI = props?.setParentI
  const parentIndex = props?.parentIndex
  const invitees = props?.invitees
  const setInvitees = props?.setInvitees

  

  console.log(manualEntries, ' manualEntries')
  console.log(invitees, ' invitees')


  const onEmailChange = (e: { target: { value: string } }) => {
    setEmail(e?.target?.value)
    updateEntryInManualEntries(manualEntries, setManualEntries, index, invitees, setInvitees, setParentI, parentIndex, e?.target?.value, name)
  }

  const onNameChange = (e: { target: { value: string } }) => {
    setName(e?.target?.value)
    updateEntryInManualEntries(manualEntries, setManualEntries, index, invitees, setInvitees, setParentI, parentIndex, email, e?.target?.value)
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
              onChange={onEmailChange}
              value={email || ''}
              style={{ width: '60%'}}
              type="email"
              validate="email"
              validationMessage="Please provide a valid email address"
            />
          
        </Box>
        <Box p={{ phone: 's', tablet: 'm' }}>
          <Text variant="optionHeader">
            Display Name
          </Text>
          
            <TextField
              placeholder="name"
              onChange={onNameChange}
              value={name || manualEntries?.[index]?.name || ''}
              style={{ width: '60%'}}
            />
          
        </Box>
        <Button onClick={() => removeEntryFromManualEntries(manualEntries, setManualEntries, invitees, setInvitees, setParentI, index, parentIndex)}>
          Remove
        </Button>
      </RegularCard>
    </Box>

  )
}

function ManualEntries(props: ManualEntriesTypeProps) {
  const [pageOffset, setPageOffset] = useState<number>(0)

  const {height: fullHeight} = Dimensions.get('window')

  const theme = useTheme()

  const transitionDuration = {
    enter: theme.transitions.duration.enteringScreen,
    exit: theme.transitions.duration.leavingScreen,
  }



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
              <AddIcon sx={{ color: pink[500] }}  />
            </Fab>
          </Zoom>

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

  console.log(invitees, ' parentInvitees')

  // get any contacts
  useEffect(() => {
    (async () => {
      if (!client || !userId) {
        return
      }
      const newContacts = await listUserContactsHelper(client, userId)
      
      if (newContacts && newContacts?.length > 0) {
        setContacts(newContacts
          .map(c => ({ ...c, selected: false } as SelectedContactType))
          // .filter(c => (c?.emails?.[0]?.value?.length > 0))
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
   <Box flex={1} style={{ width: '100%' }} minHeight="65vh" maxHeight="65vh">
     {
       invitees?.length > 0
       ? (
         <FlatList
           data={invitees}
           renderItem={({ item }) => (
            <Box>
              <ListItem
                 containerStyle={{ 
                   backgroundColor: palette.white,
                   borderBottomWidth: StyleSheet.hairlineWidth,
                   borderColor: palette.darkGray
                 }}
                 
              >
                <ListItem.Content>
                  <ListItem.Title style={{ color: palette?.textBlack, fontWeight: 'bold' }}>
                    {item?.name}
                  </ListItem.Title>
                  <ListItem.Subtitle style={{ color: palette?.textBlack, }}>
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

export default CreateMeetingAssistInvitees
