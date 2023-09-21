/* eslint-disable react/no-unknown-property */
import React, { useState } from 'react'
import { useToast } from '@chakra-ui/react'
import { ApolloClient, ApolloQueryResult, NormalizedCacheObject, OperationVariables, useQuery } from '@apollo/client'
import { dayjs } from '@lib/date-utils'
import Box from '@components/common/Box'
import Button from '@components/Button'
import { useRouter } from 'next/router'
import Text from '@components/common/Text'
import RegularCard from '@components/RegularCard'
import listMeetingAssists from '@lib/apollo/gql/listMeetingAssists';
import { MeetingAssistType } from '@lib/dataTypes/MeetingAssistType'

import { palette } from '@lib/theme/theme'
import { ActivityIndicator, Appearance, FlatList, NativeSyntheticEvent, Platform, Pressable, TextInputSubmitEditingEventData } from 'react-native'
import { RecurrenceFrequencyType } from '@lib/Calendar/types'
import { deleteMeetingAssistGivenId, searchMeetingAssists } from '@lib/Assist/UserMeetingAssistHelper'

import { Overlay, SearchBar } from '@rneui/themed'
// IoMdTrash
import { IoMdTrash } from "react-icons/io";
import { useAppContext } from '@lib/user-context'
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
    client: ApolloClient<NormalizedCacheObject>,
    refetch: (variables?: Partial<OperationVariables>) => Promise<ApolloQueryResult<{
        Meeting_Assist: MeetingAssistType[];
    }>>
}

function MeetingAssistItem(props: MeetingAssistItemType) {
    const [isDelete, setIsDelete] = useState<boolean>(false)
    const router = useRouter()
    const toast = useToast()
    const deleteItem = async () => {
        try {
            await deleteMeetingAssistGivenId(props?.client, props?.item?.id)
            await props?.refetch()
        } catch (e) {
            console.log(e, ' unable to delete item')
            toast({
                status: 'error',
                title: 'Error',
                description: 'Something went wrong with deletion',
                duration: 9000,
                isClosable: true,
            })
        }
    }

    const navigateToEditMeetingAssist = () => {
        router.push({ pathname: '/Assist/UserEditMeetingAssist', query: { meetingId: props?.item?.id } })
    }

    const enableDeletion = async () => {
        try {
            await deleteItem()       
        } catch (e) {
            console.log(e, ' unable to delete')
        }
        setIsDelete(false)
    }

    const disableDeletion = () => setIsDelete(false)

    const showDeletion = () => setIsDelete(true)

    return (
        <RegularCard>
            <Box justifyContent="center" alignItems="center"  style={{ width: '100%'}}>
                <Text pt={{ phone: 'm', tablet: 's' }} variant="cardTitle" style={{ color: palette.darkGray }}>
                    {props?.item?.summary}
                </Text>
                <Box  pt={{ phone: 'm', tablet: 's' }} style={{ width: '60%'}}>
                    <Text variant="cardCaption" style={{ color: palette.darkGray }}>
                        {props?.item?.notes}
                    </Text>
                </Box>
                <Box  pt={{ phone: 'm', tablet: 's' }} style={{ width: '60%'}}>
                    <Text variant="cardCaption">
                        Time Window Start: {dayjs(props?.item?.windowStartDate).format('MM/DD/YYYY h:mm A')}
                    </Text>
                </Box>
                <Box  pt={{ phone: 'm', tablet: 's' }} style={{ width: '60%'}}>
                    <Text variant="cardCaption">
                        Time Window End: {dayjs(props?.item?.windowEndDate).format('MM/DD/YYYY h:mm A')}
                    </Text>
                </Box>
                <Box  pt={{ phone: 'm', tablet: 's' }} style={{ width: '60%'}}>
                    <Text variant="cardCaption">
                        Duration: {props?.item?.duration}
                    </Text>
                </Box>
                {props?.item?.location?.address?.streetName
                    ? (
                        <Box pt={{ phone: 'm', tablet: 's' }} style={{ width: '60%' }}>
                            <Text variant="cardCaption" style={{ color: palette.darkGray }}>
                                {props?.item?.location?.address?.streetName}
                            </Text>
                        </Box>
                    ) : null}
                
                    {props?.item?.conferenceApp === 'zoom' 
                    ? (
                            <Box pt={{ phone: 'm', tablet: 's' }} style={{ width: '60%'}}>
                                <Text variant="cardCaption" style={{ color: palette.darkGray }}>
                                    Conference App: Zoom
                                </Text>
                            </Box>
                        ) : null}
                
                
                    {props?.item?.conferenceApp === 'google' 
                        ? (
                            <Box pt={{ phone: 'm', tablet: 's' }} style={{ width: '60%'}}>
                                <Text variant="cardCaption" style={{ color: palette.darkGray }}>
                                    Conference App: Google
                                </Text>
                            </Box>
                        ) : null}
                <Box pt={{ phone: 'm', tablet: 's' }} style={{ width: '60%'}}>
                    <Text variant="cardCaption">
                        Responded: {props?.item?.attendeeRespondedCount}
                    </Text>
                </Box>
                {
                    props?.item?.cancelled
                    ? (
                        <Box pt={{ phone: 'm', tablet: 's' }} style={{ width: '60%'}}>
                            <Text variant="cardCaption">
                                Cancelled
                            </Text>
                        </Box>
                    ) : null
                }
                {
                    props?.item?.frequency
                    ? (
                        <Box pt={{ phone: 'm', tablet: 's' }} style={{ width: '60%'}}>
                            <Text variant="cardCaption">
                                {`${props?.item?.interval && props?.item?.interval > 1 ? 'Every ' + props?.item?.interval : ''} ${props?.item?.interval && props?.item?.interval > 1 ? getFrequencyVocab(props?.item?.frequency) : props?.item?.frequency?.[0]?.toUpperCase() + props?.item?.frequency?.slice(1)}`}
                            </Text>
                        </Box>
                    ) : null
                }
                {
                    props?.item?.until
                    ? (
                        <Box  pt={{ phone: 'm', tablet: 's' }} style={{ width: '60%'}}>
                            <Text variant="cardCaption">
                                Until: {dayjs(props?.item?.until).format('MM/DD/YYYY h:mm A')}
                            </Text>
                        </Box>
                    ) : null
                }
                <Box pt={{ phone: 'm', tablet: 's' }} style={{ width: '60%'}}>
                    <Text variant="cardCaption" style={{ color: palette.darkGray }}>
                        {`Visibility: ${props?.item?.visibility ?? 'default'}`}
                    </Text>
                </Box>
                <Box pt={{ phone: 'm', tablet: 's' }} justifyContent="center" alignItems="center" width="100%">
                    <Button onClick={navigateToEditMeetingAssist}>
                        Edit
                    </Button>  
                </Box>
                <Box width="100%" flexDirection="row" justifyContent="flex-end">
                    <Pressable onPress={showDeletion}>
                        <Box pt={{ phone: 'm', tablet: 's' }}>
                            <IoMdTrash size="3em" color={palette.purplePrimary} />
                        </Box>
                    </Pressable>
                </Box>      
            </Box>
            <Box>
                <Overlay overlayStyle={{ backgroundColor: palette.white, justifyContent: 'center', alignItems: 'center' }} isVisible={isDelete} onBackdropPress={disableDeletion}>
                    <Box justifyContent="center" alignItems="center" style={{ width: '80%', backgroundColor: palette.white}}>
                        <Box pt={{ phone: 'm', tablet: 's' }} justifyContent="center" alignItems="center">
                        <Text variant="optionHeader">
                            Do you want to delete this meeting assist?
                        </Text>
                        </Box>
                        <Box justifyContent="center" alignItems="center">
                        <Box pt={{ phone: 'm', tablet: 's' }} justifyContent="center" alignItems="center">
                            <Button onClick={enableDeletion}>
                            Okay
                            </Button>  
                        </Box>
                        <Button disabled onClick={disableDeletion}>
                            Cancel
                        </Button>  
                        </Box>
                    </Box>
                </Overlay>
            </Box>
        </RegularCard>
    )
}

function UserListMeetingAssists() {
    const [searchResults, setSearchResults] = useState<MeetingAssistType[]>()
    const [search, setSearch] = useState<string>('')

    // const sub = props?.sub
    // const client = props?.client
    const router = useRouter()
    const { sub, client } = useAppContext()
    const toast = useToast()

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

    console.log(searchResults && searchResults?.length > 0, ' searchResults?.length > 0')

    const onSubmitSearch = async (
    ) => {
        try {
            // validate
            if (!search) {
                return
            }

            console.log(search, ' text search')

            const newResults = await searchMeetingAssists(
                client,
                sub,
                search,
            )
            
            // searchMeetingAssists
            console.log(newResults, ' newResults inside onSubmitSearch')

            if (newResults && newResults?.length > 0) {
                setSearchResults(newResults)
            }
            
        } catch (e) {
            console.log(e, ' onsubmit search')
        }
    }
    //<ActivityIndicator size="large" color="#00ff00" />
    if (assistLoading) {
        return (
            <Box backgroundColor="primaryCardBackground" flex={1} justifyContent="center" alignItems="center" style={{ width: '100%'}} minHeight="80vh">
                <ActivityIndicator size="large" color={palette.white} />
            </Box>
        )
    }

    if (assistError) {
        toast({
            status: 'error',
            title: 'Error',
            description: assistError.message,
            duration: 9000,
            isClosable: true,
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
        />
    )


    return (
        <Box flex={1}>
            <Box>
                <form>   
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





