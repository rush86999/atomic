import React, {
    useState,
    useEffect,
    Dispatch,
    SetStateAction,
} from 'react'
import {
    FlatList,
    Pressable,
    Dimensions,
} from 'react-native'

import Switch1 from '@components/Switch'
import {
    Overlay,
} from '@rneui/themed'
import Fab from '@mui/material/Fab';
import AddIcon from '@mui/icons-material/Add';
import { SxProps, useTheme } from '@mui/material/styles'
import Zoom from '@mui/material/Zoom'
import TextField from '@components/TextField'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import Button from '@components/Button'
import RegularCard from '@components/RegularCard'
import { useToast } from '@chakra-ui/react'
import { IoIosTrash } from "react-icons/io";
import { palette } from '@lib/theme/theme'
import { UserContactInfoType } from '@lib/dataTypes/UserContactInfoType'
import { addInfoItemToItems, deleteContactInfoItems, listUserContactInfosGivenUserId, removeInfoItemToItems, updateInfoItemIdValue, updateInfoItemNameValue, updateInfoItemPrimaryValue, updateInfoItemTypeValue, upsertContactInfoItems } from '@lib/Contact/ContactHelper'
import _ from 'lodash'
import { dayjs } from '@lib/date-utils'
import { useAppContext } from '@lib/user-context'

import { useRouter } from 'next/router'
import { pink } from '@mui/material/colors'
import { NextApiRequest, NextApiResponse } from 'next';
import supertokensNode from 'supertokens-node'
import { backendConfig } from '../../config/backendConfig'
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

const fabStyle = {
  position: 'absolute',
  bottom: 16,
  right: 16,
}



type InfoItemProp = {
    item: UserContactInfoType,
    infoItems: UserContactInfoType[],
    setInfoItems: Dispatch<SetStateAction<UserContactInfoType[]>>,
    index: number,
    removeInfoItemToItems: (
        index: number,
        infoItems: UserContactInfoType[],
        setInfoItems: Dispatch<SetStateAction<UserContactInfoType[]>>,
    ) => UserContactInfoType[],
    submitItemsWithNewItem: (newInfoItems: UserContactInfoType[]) => Promise<void>,
}

const typeOptions = [
    { label: 'Email', value: 'email' },
    { label: 'Phone', value: 'phone'}
]

function InfoItem(props: InfoItemProp) {
    const [id, setId] = useState<string>(props?.item?.id)
    const [name, setName] = useState<string>(props?.item?.name)
    const [type, setType] = useState<'email' | 'phone'>(props?.item?.type)
    const [primary, setPrimary] = useState<boolean>(props?.item?.primary)
    


    useEffect(() => {
        if (id !== props?.item?.id) {
            if (props?.item?.id) {
                setId(props?.item?.id)
            }
        }
    }, [id, props?.item?.id])

    useEffect(() => {
        if (name !== props?.item?.name) {
            if (props?.item?.name) {
                setName(props?.item?.name)
            }
        }
    }, [name, props?.item?.name])

    const changeId = (value: string) => {
        setId(value)
    }

    const onEndChangeId = () => updateInfoItemIdValue(
            props?.item,
            props?.index,
            id,
            props?.infoItems,
            props?.setInfoItems,
        )

    const changeName = (value: string) => {
        setName(value)
        
    }

    const onEndChangeName = () => updateInfoItemNameValue(
            props?.item,
            props?.index,
            name,
            props?.infoItems,
            props?.setInfoItems,
        )

    const changeType = (value: 'email' | 'phone') => {
        setType(value)
        updateInfoItemTypeValue(
            props?.item,
            props?.index,
            value,
            props?.infoItems,
            props?.setInfoItems,
        )
    }

    const changePrimary = (value: boolean) => {
        setPrimary(value)
        updateInfoItemPrimaryValue(
            props?.item,
            props?.index,
            value,
            props?.infoItems,
            props?.setInfoItems,
        )
    }

    const removeItem = async () => {
        const newInfoItems = removeInfoItemToItems(props?.index, props?.infoItems, props?.setInfoItems)
        await props?.submitItemsWithNewItem(newInfoItems)
    }

    return (
        
        <RegularCard>
            <Box flex={1} pt={{ phone: 'm', tablet: 's' }} flexDirection="row" justifyContent="flex-start" alignItems="center" style={{ width: '60%'}}>
                <TextField
                label="Email or Phone"
                placeholder="r@r.r"
                onChange={(e: { target: { value: string } }) => changeId(e?.target?.value)}
                value={id}
                style={{ width: '100%' }}
                type="email"
                
                onBlur={onEndChangeId}
            />
        </Box>
        <Box flex={1} pt={{ phone: 'm', tablet: 's' }} flexDirection="row" justifyContent="flex-start" alignItems="center" style={{ width: '60%'}}>
            <TextField
                label="Name"
                placeholder="John Doe"
                onChange={(e: { target: { value: string } }) => changeName(e?.target?.value)}
                value={name}
                style={{ width: '100%'}}
                onBlur={onEndChangeName}
            />
        </Box>
        <Box flex={1} pt={{ phone: 'm', tablet: 's' }} justifyContent="center" alignItems="center">
            <Text pt={{ phone: 'm', tablet: 's' }} variant="optionHeader">
                Is this a phone or email?
            </Text> 
            <select value={type} onChange={(e) => changeType(e?.target?.value as 'email' | 'phone')} className="select select-primary w-full max-w-xs">
                <option disabled selected>Send updates to...</option>
                {_.map(typeOptions, option => (
                    <option
                        key={option.value}
                        value={option.value}
                    >{option.label}</option>
                    ))}
            </select>   
            
        </Box>
        <Box pt={{ phone: 'm', tablet: 's' }} style={{ width: '90%' }}>
            <Box flexDirection="row" justifyContent="flex-start" pt={{ phone: 'm', tablet: 's' }} style={{ width: '100%' }}>
                <Text variant="optionHeader">
                    Is this your primary? (Also used for Zoom)
                </Text>
            </Box>
            <Box flexDirection="row" justifyContent="flex-end" style={{ width: '90%' }}>
                <Switch1
                    checked={primary}
                    onValueChange={changePrimary}
                    style={{marginBottom: 20}}
                />
            </Box>
        </Box>
        <Box alignItems="flex-end" style={{ width: '100%'}}>
            <Box mr={{ phone: 'm', tablet: 'l' }}>
                <Pressable hitSlop={15} onPress={removeItem}>
                    <IoIosTrash size="3em" color={palette.red} />
                </Pressable>
            </Box>
        </Box>
        </RegularCard>
        
    )
}



function ListUserContactInfo() {
    const [infoItems, setInfoItems] = useState<UserContactInfoType[]>()
    const [oldInfoItems, setOldInfoItems] = useState<UserContactInfoType[]>()
    const [newId, setNewId] = useState<string>('')
    const [newName, setNewName] = useState<string>('')
    const [newType, setNewType] = useState<'email' | 'phone'>('email')
    const [isNewItem, setIsNewItem] = useState<boolean>(false)
    const [pageOffset, setPageOffset] = useState<number>(0)

    const { height: fullHeight } = Dimensions.get('window')

    const { sub, client } = useAppContext()

    const theme = useTheme()
    const toast = useToast()

  const transitionDuration = {
    enter: theme.transitions.duration.enteringScreen,
    exit: theme.transitions.duration.leavingScreen,
  }

    const userId = sub

    // list old info items
    useEffect(() => {
        (async () => {
            try {
                const oldDbInfoItems = await listUserContactInfosGivenUserId(client, userId)
                if (oldDbInfoItems?.length > 0) {
                    setInfoItems(oldDbInfoItems)
                    setOldInfoItems(oldDbInfoItems)
                }
            } catch (e) {
                console.log(e, ' unable to list user contact info items')
            }
        })()
    }, [client, userId])


    const addNewEntry = () => {
        showNewItem()
    }

    const onSubmitNewEntry = async () => {

        const newInfoItem: UserContactInfoType = {
            id: newId,
            name: newName,
            type: newType,
            userId,
            primary: false,
            updatedAt: dayjs().format(),
            createdDate: dayjs().format(),
        }

        const newInfoItems = infoItems.concat(newInfoItem)
        
        console.log(newInfoItems?.map(c => (_.omit(c, ['__typename']))), ' newInfoItems')

        addInfoItemToItems(
            newInfoItem,
            infoItems,
            setInfoItems,
        )

        hideNewItem()

        await submitItemsWithNewItem(newInfoItems)
    }

    const showNewItem = () => setIsNewItem(true)

    const hideNewItem = () => setIsNewItem(false)

    const onCancelEntry = () => {
        setNewId('')
        setNewName('')
        setNewType('email')
        hideNewItem()
    }

    const submitItemsWithNewItem = async (newInfoItems: UserContactInfoType[]) => {
        try {
            if (!_.isEqual(oldInfoItems, newInfoItems)) {
                const itemIdsToDelete = oldInfoItems
                    ?.filter(o => !_.isEqual(o, newInfoItems?.find(i => (i?.id == o?.id))))
                    ?.map(o => (o?.id))

                if (itemIdsToDelete?.length > 0) {
                    await deleteContactInfoItems(
                        client,
                        itemIdsToDelete,
                    )
                }

                if (newInfoItems?.length > 0) {
                    
                    await upsertContactInfoItems(
                        client,
                        newInfoItems,
                    )

                    setOldInfoItems(newInfoItems)

                    toast({
                        status: 'success',
                        title: 'Success!',
                        description: 'Successfully updated your contact info items',
                        duration: 9000,
                        isClosable: true,
                    })
                }
            }
            
        } catch (e) {
            console.log(e, ' unable to submit items inside list user contact info')
            toast({
                status: 'error',
                title: 'Oops...',
                description: 'Something went wrong with updating your contact infos. Let us know.',
                duration: 9000,
                isClosable: true,
            })
        }
    }

    const submitItems = async () => {
        try {
            if (!_.isEqual(oldInfoItems, infoItems)) {
                const itemIdsToDelete = oldInfoItems?.map(o => (o?.id))

                if (itemIdsToDelete?.length > 0) {
                    await deleteContactInfoItems(
                        client,
                        itemIdsToDelete,
                    )
                }

                if (infoItems?.length > 0) {
                    await upsertContactInfoItems(
                        client,
                        infoItems,
                    )

                    setOldInfoItems(infoItems)

                    toast({
                        status: 'success',
                        title: 'Success!',
                        description: 'Successfully updated your contact info items',
                        duration: 9000,
                        isClosable: true,
                    })
                }
            }
            
        } catch (e) {
            console.log(e, ' unable to submit items inside list user contact info')
            toast({
                status: 'error',
                title: 'Oops...',
                description: 'Something went wrong with updating your contact infos. Let us know.',
                duration: 9000,
                isClosable: true,
            })
        }
    }

    return (
        <Box flex={1} style={{ width: '100%' }}>
            <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%' }}>
                <Text variant="subheaderNormal" textAlign="center" pt={{ phone: 'm', tablet: 's' }}>
                    Your Contact Info to verify future meeting invites
                </Text>
                {
                    infoItems?.length > 0
                    ? (
                        <FlatList
                            data={infoItems}
                            renderItem={({ item, index }) => (
                                <InfoItem
                                    item={item}
                                    index={index}
                                    infoItems={infoItems}
                                    setInfoItems={setInfoItems}
                                    removeInfoItemToItems={removeInfoItemToItems}
                                    submitItemsWithNewItem={submitItemsWithNewItem}
                                />
                            )}
                        />
                    ) : (
                        <Box flex={1} justifyContent="center" alignItems="center" p={{ phone: 'l', tablet: 'm' }}>
                            <Text variant="subheaderNormal">
                                Add atleast 1 Contact entry to verify against for future meeting invites with Atomic
                            </Text>
                        </Box>
                    )
                }

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
                <Box>
                    <Overlay overlayStyle={{ backgroundColor: palette.white, justifyContent: 'center', alignItems: 'center' }} isVisible={isNewItem} onBackdropPress={onCancelEntry}>
                        <Box justifyContent="center" alignItems="center" style={{ width: '90%', backgroundColor: palette.white}}>
                                <RegularCard>
                                    <Box pt={{ phone: 'm', tablet: 's' }} justifyContent="center" alignItems="center">
                                        <Text variant="optionHeader">
                                            New Contact Info
                                        </Text>
                                    </Box>
                                <Box pt={{ phone: 'm', tablet: 's' }} flexDirection="row" justifyContent="flex-start" alignItems="center"
                                    style={{ width: '90%' }}>
                                        <TextField                             label="Email or Phone"                                   placeholder="r@r.r"
                                            
                                        onChange={(e: { target: { value: string } }) => setNewId(e?.target?.value)}
                                        value={newId}
                                        style={{ width: '100%' }}
                                        />
                                    </Box>
                                    <Box pt={{ phone: 'm', tablet: 's' }} flexDirection="row" justifyContent="flex-start" alignItems="center" style={{ width: '90%'}}>
                                        <TextField
                                            label="Name"
                                            placeholder="John Doe"
                                            onChange={(e: { target: { value: string } }) => setNewName(e?.target?.value)}
                                            value={newName}
                                            style={{ width: '100%'}}
                                        />
                                    </Box>
                                    <Box pt={{ phone: 'm', tablet: 's' }} justifyContent="center" alignItems="center">
                                        <Text pt={{ phone: 'm', tablet: 's' }} variant="optionHeader">
                                            Is this a phone or email?
                                        </Text>
                                        <select value={newType} onChange={(e) => setNewType(e?.target?.value as "email" | "phone")} className="select select-primary w-full max-w-xs">
                                            <option disabled selected>Send updates to...</option>
                                            {_.map(typeOptions, option => (
                                                <option
                                                    key={option.value}
                                                    value={option.value}
                                                >{option.label}</option>
                                                ))}
                                        </select>
                                       
                                    </Box>                    
                                </RegularCard>
                                <Box justifyContent="center" alignItems="center">
                                    <Box pt={{ phone: 'm', tablet: 's' }} justifyContent="center" alignItems="center">
                                        <Pressable hitSlop={15} onPress={onSubmitNewEntry}>
                                            <Text variant="buttonLink">
                                                {'+ Add Info'}
                                            </Text>
                                        </Pressable>  
                                    </Box>
                                    <Pressable hitSlop={15} onPress={onCancelEntry}>
                                        <Text variant="greyLink">
                                            Cancel
                                        </Text>
                                    </Pressable>  
                                </Box>     
                            </Box>
                        
                    </Overlay>
                </Box>
                <Box pt={{ phone: 'm', tablet: 's' }}>
                    <Button onClick={submitItems}>
                        Submit Info
                    </Button>
                </Box>
            </Box>
        </Box>
    )
}


export default ListUserContactInfo


