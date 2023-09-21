import React, {
    useState,
    useEffect,
} from 'react'
import {
   FlatList,
   Pressable,
   useColorScheme,
} from 'react-native'

import { IoIosClose } from "react-icons/io"
import { Picker } from '@react-native-picker/picker'
import { useToast } from '@chakra-ui/react'

import Box from '@components/common/Box'
import Text from '@components/common/Text'
import Button from '@components/Button'


import { palette } from '@lib/theme/theme'
import {
  CategoryType
} from '@lib/dataTypes/CategoryType'


import _ from 'lodash'
import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { listCategoriesForEvent, listUserCategories, removeCategoryConnectionForEvent, upsertCategoryEventConnection } from '@lib/Category/CategoryHelper'
import getEventById from '@lib/apollo/gql/getEventById'
import updateEventForUserModifiedCategories from '@lib/apollo/gql/updateEventForUserModifiedCategories'
import { EventType } from '@lib/dataTypes/EventType'
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


type Props = {
    eventId: string,
    sub: string,
    hideTags: () => void, // TODO: //     add enable to edit
    client: ApolloClient<NormalizedCacheObject>,
}

function UserEditCategoryEventModal(props: Props) {
    const [selectedTag, setSelectedTag] = useState<CategoryType>(null)
    const [eventTags, setEventTags] = useState<CategoryType[]>([])
    const [categories, setCategories] = useState<CategoryType[]>([])
    const [selectedTagId, setSelectedTagId] = useState<string>('')

    // const dark = useColorScheme() === 'dark'

    const client = props?.client
    const eventId = props?.eventId
    const toast = useToast()

    // get categories
    useEffect(() => {
        (async () => {
            try {
                const userCategories = await listUserCategories(client, props?.sub)
                setCategories(userCategories)
                setSelectedTag(userCategories?.[0])
                setSelectedTagId(userCategories?.[0]?.id)
            } catch (e) {
                console.log(e, ' error in useEffect for UserEditcategory_event')
            }
        })()
    }, [client, props?.sub])

    // get event categories
    useEffect(() => {
        (async () => {
            try {
                
                const existingCategories = await listCategoriesForEvent(client, eventId)
                console.log(existingCategories, ' existingCategories in useEffect for UserEditcategory_event')
                setEventTags(existingCategories)
            } catch (e) {
                console.log(e, 'error for get categories')
            }
        })()
    }, [client, eventId])

    const addItemToTags = async (): Promise<any> => {
        try {
            if (!selectedTag?.id) {
                toast({
                    status: 'error',
                    title: 'Select a tag',
                    description: 'Please select a tag',
                    duration: 9000,
                    isClosable: true,
                })
                return null
            }
            const newCategories = _.uniqWith(eventTags?.concat([selectedTag]), _.isEqual)
            setEventTags(newCategories)

            const foundIndex = eventTags?.findIndex((cat) => cat?.id === selectedTag?.id)
            if (foundIndex === -1) {

                await upsertCategoryEventConnection(client, props.sub, selectedTag.id, eventId)

                // update Event
                const existingEvent = (await client.query<{ Event_by_pk: EventType }>({
                    query: getEventById,
                    variables: {
                        id: eventId,
                    },
                })).data?.Event_by_pk
                if (existingEvent?.id) {
                    await client.mutate({
                        mutation: updateEventForUserModifiedCategories,
                        variables: {
                            id: existingEvent.id,
                        },
                    })
                }
            }
        } catch (e) {
            console.log(e, 'error in addItemToTags')
        }
    }

    const removeItemFromTags = async (categoryId: string) => {
        try {
            const newCategories = eventTags.filter((cat) => cat.id !== categoryId)
            setEventTags(newCategories)
            
            await removeCategoryConnectionForEvent(client, categoryId, eventId)

            // update Event
            const existingEvent = (await client.query<{ Event_by_pk: EventType }>({
                query: getEventById,
                variables: {
                    id: eventId,
                },
            })).data?.Event_by_pk
            if (existingEvent?.id) {
                await client.mutate({
                    mutation: updateEventForUserModifiedCategories,
                    variables: {
                        id: existingEvent.id,
                    },
                })
            }
        } catch (e) {
            console.log(e, 'error in removeItemFromTags')
        }
    }

    const changeSelectedTag = (id: string) => {
        const foundCategory = categories.find((cat) => (cat.id === id))
        if (foundCategory) {
            setSelectedTag(foundCategory)
            setSelectedTagId(id)
        }
    }
    

    return (
        <Box width="100%">
            <Box p={{ phone: 'm', tablet: 'l' }} justifyContent="center" alignItems="center">
                <Text variant="optionHeader">
                    Manage tags to this event
                </Text>
            </Box>
             <Box flex={1} justifyContent="center" alignItems="center" width="100%">
                <FlatList
                    data={eventTags}
                    renderItem={({ item }) => (
                        <Box justifyContent="center" alignItems="center">
                            <Box flexDirection="row" alignItems="center" justifyContent="space-between" style={{ width: '60%'}}>
                                <Text variant="optionHeader">
                                    {item.name}
                                </Text>
                                <Pressable hitSlop={15} onPress={() => removeItemFromTags(item?.id)}>
                                    <IoIosClose size="3em" color={palette.red} />
                                </Pressable>
                            </Box>
                        </Box>
                    )}
                    keyExtractor={(item) => item.id}
                />
            </Box>
            <Box flex={3} justifyContent="center" alignItems="center">
                <Picker
                    selectedValue={selectedTagId}
                    onValueChange={changeSelectedTag}
                >
                    {categories.map((category) => (   
                        <Picker.Item color={palette.textBlack} key={category?.id} value={category?.id} label={category?.name} />
                    ))}
                </Picker>
            </Box>
            <Box pt={{ phone: 'm', tablet: 's' }} justifyContent="center" alignItems="center">
                <Button onClick={addItemToTags}>
                    Add
                </Button>
            </Box>
            <Box pt={{ phone: 'm', tablet: 's' }} justifyContent="center" alignItems="center">
            <Button onClick={props.hideTags}>
                Done
            </Button>
            </Box>
        </Box>
    )
}

export default UserEditCategoryEventModal


