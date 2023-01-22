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
    Appearance,
} from 'react-native'
import { Switch, Colors, Picker, PickerValue, TextField } from 'react-native-ui-lib'
import {
    FAB, Overlay,
} from 'react-native-elements/src'

import Box from '@components/common/Box'
import Text from '@components/common/Text'
import Button from '@components/Button'
import RegularCard from '@components/RegularCard'
import { RouteProp } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import Toast from 'react-native-toast-message'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { palette } from '@theme/theme'
import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { UserContactInfoType } from '@dataTypes/UserContactInfoType'
import { addInfoItemToItems, deleteContactInfoItems, listUserContactInfosGivenUserId, removeInfoItemToItems, updateInfoItemIdValue, updateInfoItemNameValue, updateInfoItemPrimaryValue, updateInfoItemTypeValue, upsertContactInfoItems } from '@screens/Contact/ContactHelper'
import _ from 'lodash'
import { dayjs } from '@app/date-utils'

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

type RootStackNavigationParamList = {
    ListUserContactInfo: undefined,
    UserViewSettings: undefined,
}

type ListUserContactInfoNavigationProp = StackNavigationProp<
  RootStackNavigationParamList,
  'ListUserContactInfo'
>

type RootStackEventParamList = {
    ListUserContactInfo: undefined,
}


type ListUserContactInfoRouteProp = RouteProp<
  RootStackEventParamList,
  'ListUserContactInfo'
>

type Props = {
    sub: string,
    route: ListUserContactInfoRouteProp,
    client: ApolloClient<NormalizedCacheObject>,
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
    }, [props?.item?.id])

    useEffect(() => {
        if (name !== props?.item?.name) {
            if (props?.item?.name) {
                setName(props?.item?.name)
            }
        }
    }, [props?.item?.name])

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
            <Box flex={1} m={{ phone: 's', tablet: 'm' }} flexDirection="row" justifyContent="flex-start" alignItems="center" style={{ width: '60%'}}>
                <TextField
                    title="Email or Phone"
                    placeholder="r@r.r"
                    onChangeText={changeId}
                    value={id}
                    style={{ width: '100%' }}
                    keyboardType="email-address"
                    autoComplete="email"
                    textContentType="emailAddress"
                    autoCapitalize="none"
                    autoCorrect={false}
                    onEndEditing={onEndChangeId}
                />
            </Box>
            <Box flex={1} m={{ phone: 's', tablet: 'm' }} flexDirection="row" justifyContent="flex-start" alignItems="center" style={{ width: '60%'}}>
                <TextField
                    title="Name"
                    placeholder="John Doe"
                    onChangeText={changeName}
                    value={name}
                    style={{ width: '100%'}}
                    onEndEditing={onEndChangeName}
                />
            </Box>
            <Box flex={1} m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
                <Text m={{ phone: 's', tablet: 'm' }} variant="optionHeader">
                    Is this a phone or email?
                </Text>     
              <Picker
                modal
                style={{ color: dark ? palette.white : palette.textBlack }}
                placeholder="Send updates to..."
                useNativePicker
                migrateTextField
                value={type}
                onChange={(itemValue: PickerValue) => {
                  
                  changeType(itemValue as 'email' | 'phone')
                }}
              >
                  {_.map(typeOptions, option => (
                    <Picker.Item
                      key={option.value}
                      label={option.label}
                      value={option.value}
                    />
                  ))}
              </Picker>
            </Box>
            <Box m={{ phone: 's', tablet: 'm' }} style={{ width: '90%' }}>
              <Box flexDirection="row" justifyContent="flex-start" mt={{ phone: 's', tablet: 'm' }} style={{ width: '100%' }}>
                  <Text variant="optionHeader">
                      Is this your primary? (Also used for Zoom)
                  </Text>
                </Box>
                <Box flexDirection="row" justifyContent="flex-end" style={{ width: '90%' }}>
                    <Switch
                        onColor={Colors.purple30}
                        offColor={Colors.purple60}
                        value={primary}
                        onValueChange={changePrimary}
                        style={{marginBottom: 20}}
                    />
                </Box>
            </Box>
            <Box alignItems="flex-end" style={{ width: '100%'}}>
                <Box mr={{ phone: 'm', tablet: 'l' }}>
                    <Pressable hitSlop={15} onPress={removeItem}>
                        <Ionicons name="trash" size={24} color={palette.red} />
                    </Pressable>
                </Box>
            </Box>
        </RegularCard>
    )
}



function ListUserContactInfo(props: Props) {
    const [infoItems, setInfoItems] = useState<UserContactInfoType[]>()
    const [oldInfoItems, setOldInfoItems] = useState<UserContactInfoType[]>()
    const [newId, setNewId] = useState<string>('')
    const [newName, setNewName] = useState<string>('')
    const [newType, setNewType] = useState<'email' | 'phone'>('email')
    const [isNewItem, setIsNewItem] = useState<boolean>(false)

    const userId = props?.sub
    const client = props?.client

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
                
            }
        })()
    }, [])

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

                    Toast.show({
                        type: 'success',
                        text1: 'Success!',
                        text2: 'Successfully updated your contact info items'
                    })
                }
            }
            
        } catch (e) {
            
            Toast.show({
                type: 'error',
                text1: 'Oops...',
                text2: 'Something went wrong with updating your contact infos. Let us know.'
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

                    Toast.show({
                        type: 'success',
                        text1: 'Success!',
                        text2: 'Successfully updated your contact info items'
                    })
                }
            }
            
        } catch (e) {
            
            Toast.show({
                type: 'error',
                text1: 'Oops...',
                text2: 'Something went wrong with updating your contact infos. Let us know.'
            })
        }
    }

    return (
        <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%' }}>
            <Text variant="subheaderNormal" textAlign="center" m={{ phone: 's', tablet: 'm' }}>
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
                    <Box flex={1} justifyContent="center" alignItems="center" m={{ phone: 'l', tablet: 'm' }}>
                        <Text variant="subheaderNormal">
                            Add atleast 1 Contact entry to verify against for future meeting invites with Atomic
                        </Text>
                    </Box>
                )
            }
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
            <Box>
                <Overlay overlayStyle={{ backgroundColor: dark ? palette.black : palette.white }} isVisible={isNewItem} onBackdropPress={onCancelEntry}>
                    <Box justifyContent="center" alignItems="center" style={{ width: '90%', backgroundColor: dark ? palette.black : palette.white}}>
                        <RegularCard>
                            <Box m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
                                <Text variant="optionHeader">
                                    New Contact Info
                                </Text>
                            </Box>
                            <Box m={{ phone: 's', tablet: 'm' }} flexDirection="row" justifyContent="flex-start" alignItems="center" style={{ width: '90%'}}>
                                <TextField
                                    title="Email or Phone"
                                    placeholder="r@r.r"
                                    onChangeText={setNewId}
                                    value={newId}
                                    style={{ width: '100%'}}
                                    keyboardType="email-address"
                                    autoComplete="email"
                                    textContentType="emailAddress"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                            </Box>
                            <Box m={{ phone: 's', tablet: 'm' }} flexDirection="row" justifyContent="flex-start" alignItems="center" style={{ width: '90%'}}>
                                <TextField
                                    title="Name"
                                    placeholder="John Doe"
                                    onChangeText={setNewName}
                                    value={newName}
                                    style={{ width: '100%'}}
                                />
                            </Box>
                            <Box m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
                                <Text m={{ phone: 's', tablet: 'm' }} variant="optionHeader">
                                    Is this a phone or email?
                                </Text>     
                                <Picker
                                    modal
                                    style={{ color: dark ? palette.white : palette.textBlack }}
                                    placeholder="Send updates to..."
                                    useNativePicker
                                    migrateTextField
                                    value={newType}
                                    onChange={(itemValue: PickerValue) => {
                                    
                                    setNewType(itemValue as 'email' | 'phone')
                                    }}
                                >
                                    {_.map(typeOptions, option => (
                                        <Picker.Item
                                        key={option.value}
                                        label={option.label}
                                        value={option.value}
                                        />
                                    ))}
                                </Picker>
                            </Box>                    
                        </RegularCard>
                        <Box justifyContent="center" alignItems="center">
                            <Box m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
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
            <Box m={{ phone: 's', tablet: 'm' }}>
                <Button onPress={submitItems}>
                    Submit Info
                </Button>
            </Box>
        </Box>
    )
}


export default ListUserContactInfo


