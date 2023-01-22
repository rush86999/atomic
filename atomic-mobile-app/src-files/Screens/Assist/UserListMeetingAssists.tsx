import React, { useState, useEffect } from 'react'
import { Wizard } from 'react-native-ui-lib'
import { useNavigation, RouteProp } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import Toast from 'react-native-toast-message'
import { ApolloClient, ApolloQueryResult, NormalizedCacheObject, OperationVariables, useQuery } from '@apollo/client'
import { dayjs, RNLocalize } from '@app/date-utils'
import { v4 as uuid } from 'uuid'
import Box from '@components/common/Box'
import Button from '@components/Button'

import Text from '@components/common/Text'
import RegularCard from '@components/RegularCard'
import listMeetingAssists from '@app/apollo/gql/listMeetingAssists';
import { MeetingAssistType } from '@dataTypes/MeetingAssistType'
import Spinner from 'react-native-spinkit'
import { palette } from '@theme/theme'
import { Appearance, FlatList, NativeSyntheticEvent, Platform, Pressable, TextInputSubmitEditingEventData } from 'react-native'
import { RecurrenceFrequencyType } from '@screens/Calendar/types'
import { deleteMeetingAssistGivenId, searchMeetingAssists } from '@screens/Assist/UserMeetingAssistHelper'
import { Overlay, SearchBar, } from 'react-native-elements/src'
import Ionicons from 'react-native-vector-icons/Ionicons'

type RootStackNavigationParamList = {
    UserListMeetingAssists: undefined,
    UserViewCalendar: undefined,
    UserEditMeetingAssist: {
        meetingId: string,
    }
}

type UserListMeetingAssistsNavigationProp = StackNavigationProp<
  RootStackNavigationParamList,
  'UserListMeetingAssists'
>

type RootStackEventParamList = {
    UserListMeetingAssists: undefined,
}

type UserListMeetingAssistsRouteProp = RouteProp<
  RootStackEventParamList,
  'UserListMeetingAssists'
>

type Props = {
    sub: string,
    route: UserListMeetingAssistsRouteProp,
    client: ApolloClient<NormalizedCacheObject>,
}

const dark = Appearance.getColorScheme() === 'dark'

const getFrequencyVocab = (value: RecurrenceFrequencyType) => {
    switch(value) {
        case 'daily':
            return 'days'
        case 'weekly':
            return 'weeks'
        case 'monthly':
            return 'months'
        case 'yearly':
            return 'years'
    }
}

type MeetingAssistItemType = {
    item: MeetingAssistType,
    navigation: UserListMeetingAssistsNavigationProp,
    client: ApolloClient<NormalizedCacheObject>,
    refetch: (variables?: Partial<OperationVariables>) => Promise<ApolloQueryResult<{
        Meeting_Assist: MeetingAssistType[];
    }>>
}

function MeetingAssistItem(props: MeetingAssistItemType) {
    const [isDelete, setIsDelete] = useState<boolean>(false)

    const deleteItem = async () => {
        try {
            await deleteMeetingAssistGivenId(props?.client, props?.item?.id)
            await props?.refetch()
        } catch (e) {
            
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Something went wrong with deletion',
            })
        }
    }

    const navigateToEditMeetingAssist = () => {
        props?.navigation?.navigate('UserEditMeetingAssist', { meetingId: props?.item?.id })
    }

    const enableDeletion = async () => {
        try {
            await deleteItem()       
        } catch (e) {
            
        }
        setIsDelete(false)
    }

    const disableDeletion = () => setIsDelete(false)

    const showDeletion = () => setIsDelete(true)

    return (
        <RegularCard>
            <Box flex={1} justifyContent="center" alignItems="center"  style={{ width: '100%'}}>
                <Text m={{ phone: 's', tablet: 'm' }} variant="cardTitle" style={{ color: dark ? palette.white : palette.darkGray }}>
                    {props?.item?.summary}
                </Text>
                <Box  m={{ phone: 's', tablet: 'm' }} style={{ width: '60%'}}>
                    <Text variant="cardCaption" style={{ color: dark ? palette.white : palette.darkGray }}>
                        {props?.item?.notes}
                    </Text>
                </Box>
                <Box  m={{ phone: 's', tablet: 'm' }} style={{ width: '60%'}}>
                    <Text variant="cardCaption">
                        Time Window Start: {dayjs(props?.item?.windowStartDate).format('MM/DD/YYYY h:mm A')}
                    </Text>
                </Box>
                <Box  m={{ phone: 's', tablet: 'm' }} style={{ width: '60%'}}>
                    <Text variant="cardCaption">
                        Time Window End: {dayjs(props?.item?.windowEndDate).format('MM/DD/YYYY h:mm A')}
                    </Text>
                </Box>
                <Box  m={{ phone: 's', tablet: 'm' }} style={{ width: '60%'}}>
                    <Text variant="cardCaption">
                        Duration: {props?.item?.duration}
                    </Text>
                </Box>
                {props?.item?.location?.address?.streetName
                    ? (
                        <Box m={{ phone: 's', tablet: 'm' }} style={{ width: '60%' }}>
                            <Text variant="cardCaption" style={{ color: dark ? palette.white : palette.darkGray }}>
                                {props?.item?.location?.address?.streetName}
                            </Text>
                        </Box>
                    ) : null}
                
                    {props?.item?.conferenceApp === 'zoom' 
                    ? (
                            <Box m={{ phone: 's', tablet: 'm' }} style={{ width: '60%'}}>
                                <Text variant="cardCaption" style={{ color: dark ? palette.white : palette.darkGray }}>
                                    Conference App: Zoom
                                </Text>
                            </Box>
                        ) : null}
                
                
                    {props?.item?.conferenceApp === 'google' 
                        ? (
                            <Box m={{ phone: 's', tablet: 'm' }} style={{ width: '60%'}}>
                                <Text variant="cardCaption" style={{ color: dark ? palette.white : palette.darkGray }}>
                                    Conference App: Google
                                </Text>
                            </Box>
                        ) : null}
                <Box m={{ phone: 's', tablet: 'm' }} style={{ width: '60%'}}>
                    <Text variant="cardCaption">
                        Responded: {props?.item?.attendeeRespondedCount}
                    </Text>
                </Box>
                {
                    props?.item?.cancelled
                    ? (
                        <Box m={{ phone: 's', tablet: 'm' }} style={{ width: '60%'}}>
                            <Text variant="cardCaption">
                                Cancelled
                            </Text>
                        </Box>
                    ) : null
                }
                {
                    props?.item?.frequency
                    ? (
                        <Box m={{ phone: 's', tablet: 'm' }} style={{ width: '60%'}}>
                            <Text variant="cardCaption">
                                {`${props?.item?.interval > 1 ? 'Every ' + props?.item?.interval : ''} ${props?.item?.interval > 1 ? getFrequencyVocab(props?.item?.frequency) : props?.item?.frequency?.[0]?.toUpperCase() + props?.item?.frequency?.slice(1)}`}
                            </Text>
                        </Box>
                    ) : null
                }
                {
                    props?.item?.until
                    ? (
                        <Box  m={{ phone: 's', tablet: 'm' }} style={{ width: '60%'}}>
                            <Text variant="cardCaption">
                                Until: {dayjs(props?.item?.until).format('MM/DD/YYYY h:mm A')}
                            </Text>
                        </Box>
                    ) : null
                }
                <Box m={{ phone: 's', tablet: 'm' }} style={{ width: '60%'}}>
                    <Text variant="cardCaption" style={{ color: dark ? palette.white : palette.darkGray }}>
                        {`Visibility: ${props?.item?.visibility ?? 'default'}`}
                    </Text>
                </Box>
                <Box m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center" width="100%">
                    <Button onPress={navigateToEditMeetingAssist}>
                        Edit
                    </Button>  
                </Box>
                <Box width="100%" flexDirection="row" justifyContent="flex-end">
                    <Pressable onPress={showDeletion}>
                        <Box p={{ phone: 's', tablet: 'm' }}>
                            <Ionicons name="trash" size={24} color={dark ? palette.white : palette.purplePrimary} />
                        </Box>
                    </Pressable>
                </Box>      
            </Box>
            <Box>
                <Overlay overlayStyle={{ backgroundColor: dark ? palette.black : palette.white }} isVisible={isDelete} onBackdropPress={disableDeletion}>
                    <Box justifyContent="center" alignItems="center" style={{ width: '80%', backgroundColor: dark ? palette.black : palette.white}}>
                        <Box m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
                        <Text variant="optionHeader">
                            Do you want to delete this meeting assist?
                        </Text>
                        </Box>
                        <Box justifyContent="center" alignItems="center">
                        <Box m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
                            <Button onPress={enableDeletion}>
                            Okay
                            </Button>  
                        </Box>
                        <Button disabled onPress={disableDeletion}>
                            Cancel
                        </Button>  
                        </Box>
                    </Box>
                </Overlay>
            </Box>
        </RegularCard>
    )
}

function UserListMeetingAssists(props: Props) {
    const [searchResults, setSearchResults] = useState<MeetingAssistType[]>()
    const [search, setSearch] = useState<string>('')

    const sub = props?.sub
    const client = props?.client
    const navigation = useNavigation<UserListMeetingAssistsNavigationProp>()

    const { loading: assistLoading, error: assistError, data: assistData, refetch } = useQuery<{ Meeting_Assist: MeetingAssistType[] }>(listMeetingAssists, {
        variables: {
            userId: sub,
        }
    })

    const updateSearch = (text: string) => setSearch(text)

    const onClearSearch = () => setSearch('')

    const onCancelSearch = () => {
        setSearch('')
        setSearchResults([])
    }

    

    const onSubmitSearch = async (
        { nativeEvent: { text }}: NativeSyntheticEvent<TextInputSubmitEditingEventData>
    ) => {
        try {
            // validate
            if (!text) {
                return
            }

            

            const newResults = await searchMeetingAssists(
                client,
                sub,
                text,
            )
            
            // searchMeetingAssists
            

            if (newResults?.length > 0) {
                setSearchResults(newResults)
            }
            
        } catch (e) {
            
        }
    }

    if (assistLoading) {
        return (
            <Box backgroundColor="primaryCardBackground" flex={1} justifyContent="center" alignItems="center" style={{ width: '100%'}}>
                <Spinner isVisible={true} type="ThreeBounce" size={100} color={dark ? palette.textBlack : palette.white} />
            </Box>
        )
    }

    if (assistError) {
        Toast.show({
            type: 'error',
            text1: 'Error',
            text2: assistError.message,
        })
    }

    type renderItem = {
        item: MeetingAssistType,
        index: number,
    }

    const renderItem = ({ item, index }: renderItem) => (
        <MeetingAssistItem
            item={item}
            refetch={refetch}
            client={client}
            navigation={navigation}
        />
    )


    return (
        <Box flex={1}>
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
                    <Box flex = { 1 } justifyContent = "center" alignItems = "center" style = {{ width: '100%' }}>
                        <FlatList
                            data={searchResults}
                            keyExtractor={item => item.id}
                            renderItem={renderItem}
                        />
                    </Box>
                )
                : (
                    <Box flex = { 1 } justifyContent = "center" alignItems = "center" style = {{ width: '100%' }}>
                        <FlatList
                            data={assistData?.Meeting_Assist}
                            keyExtractor={item => item.id}
                            renderItem={renderItem}
                        />
                    </Box>
                )
}
        </Box>
    )
}


export default UserListMeetingAssists 





