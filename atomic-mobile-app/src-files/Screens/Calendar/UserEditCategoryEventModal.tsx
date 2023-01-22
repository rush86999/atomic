import React, {
    useState,
    useEffect,
} from 'react'
import {
   FlatList,
   Pressable,
   useColorScheme,
} from 'react-native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { Picker } from '@react-native-picker/picker'
import Toast from 'react-native-toast-message'

import Box from '@components/common/Box'
import Text from '@components/common/Text'
import Button from '@components/Button'


import { palette } from '@theme/theme'
import {
  CategoryType
} from '@app/dataTypes/CategoryType'

import { dayjs, RNLocalize } from '@app/date-utils'
import utc from 'dayjs/plugin/utc'

import _ from 'lodash'
import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { listCategoriesForEvent, listUserCategories, removeCategoryConnectionForEvent, upsertCategoryEventConnection } from '@screens/Category/CategoryHelper'
import getEventById from '@app/apollo/gql/getEventById'
import updateEventForUserModifiedCategories from '@app/apollo/gql/updateEventForUserModifiedCategories'
import { EventType } from '@app/dataTypes/EventType'

// dayjs.extend(utc)

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

    const dark = useColorScheme() === 'dark'

    const client = props?.client
    const eventId = props?.eventId

    // get categories
    useEffect(() => {
        (async () => {
            try {
                const userCategories = await listUserCategories(client, props?.sub)
                setCategories(userCategories)
                setSelectedTag(userCategories?.[0])
                setSelectedTagId(userCategories?.[0]?.id)
            } catch (e) {
                
            }
        })()
    }, [])

    // get event categories
    useEffect(() => {
        (async () => {
            try {
                
                const existingCategories = await listCategoriesForEvent(client, eventId)
                
                setEventTags(existingCategories)
            } catch (e) {
                
            }
        })()
    }, [])

    const addItemToTags = async (): Promise<any> => {
        try {
            if (!selectedTag?.id) {
                Toast.show({
                    type: 'error',
                    text1: 'Select a tag',
                    text2: 'Please select a tag'
                })
                return null
            }
            const newCategories = _.uniqWith(eventTags.concat([selectedTag]), _.isEqual)
            setEventTags(newCategories)

            const foundIndex = eventTags.findIndex((cat) => cat.id === selectedTag.id)
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
        <Box>
            <Box m={{ phone: 'm', tablet: 'l' }} justifyContent="center" alignItems="center">
                <Text variant="optionHeader">
                    Manage tags to this event
                </Text>
            </Box>
             <Box flex={1} justifyContent="center" alignItems="center">
                <FlatList
                    data={eventTags}
                    renderItem={({ item }) => (
                        <Box justifyContent="center" alignItems="center">
                            <Box flexDirection="row" alignItems="center" justifyContent="space-between" style={{ width: '60%'}}>
                                <Text variant="optionHeader">
                                    {item.name}
                                </Text>
                                <Pressable hitSlop={15} onPress={() => removeItemFromTags(item?.id)}>
                                    <Ionicons name="close" size={24} color={palette.red} />
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
                    style={{ height: 150, width: '100%' }}
                >
                    {categories.map((category) => (   
                        <Picker.Item color={dark ? palette.white : palette.textBlack} key={category.id} value={category?.id} label={category?.name} />
                    ))}
                </Picker>
            </Box>
            <Box pt={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
                <Button onPress={addItemToTags}>
                    Add
                </Button>
            </Box>
            <Box pt={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
            <Button onPress={props.hideTags}>
                Done
            </Button>
            </Box>
        </Box>
    )
}

export default UserEditCategoryEventModal


