import React, {
    useState,
    useEffect,
  } from 'react'
  import {
    FlatList,
    Platform,
    StyleSheet,
    Pressable,
    KeyboardAvoidingView,
    Appearance,
} from 'react-native'
import { TextField } from 'react-native-ui-lib'
import { useHeaderHeight } from '@react-navigation/elements'
import Ionicons from 'react-native-vector-icons/Ionicons'

import Box from '@components/common/Box'
import Text from '@components/common/Text'
import Button from '@components/Button'

import { palette } from '@theme/theme'
import {
    CategoryType
} from '@app/dataTypes/CategoryType'
import {
    addCategoryToUser,
    listUserCategories,
    removeCategory,
    removeEventConnectionsForCategory,
} from '@screens/Category/CategoryHelper'
import { ApolloClient, NormalizedCacheObject } from '@apollo/client'


const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
})

type Props = {
    sub: string,
    client: ApolloClient<NormalizedCacheObject>,
}

const dark = Appearance.getColorScheme() === 'dark'

function UserAddTags(props: Props) {
    const [categories, setCategories] = useState<CategoryType[]>([])
    const [name, setName] = useState<string>('')

    const userId = props?.sub
    const client = props?.client
    const height = useHeaderHeight()
    useEffect(() => {
        (async () => {
            try {
                const categories = await listUserCategories(client, userId)
                setCategories(categories)
            } catch (error) {
                
            }
        })()
    }, [])

    const addCategory = async () => {
        try {
            if (name.length === 0) {
                return
            }
            const newCategory = await addCategoryToUser(client, userId, name)
            setCategories([...categories, newCategory])
            setName('')
        } catch (error) {
            
        }
    }

    const removeCategoryForUser = async (categoryId: string) => {
        try {
            setCategories(categories.filter(category => category.id !== categoryId))
            await removeCategory(client, categoryId)
            await removeEventConnectionsForCategory(client, categoryId)
        } catch (error) {
            
        }
    }

    return (
        <Box flex={1} justifyContent="space-around" alignItems="center" style={{ width: '100%' }}>
            <Box flex={4} mt={{ phone: 'm', tablet: 'l' }} justifyContent="center" alignItems="center" style={{ width: '100%' }}>
                <Box justifyContent="center" alignItems="center" style={{ width: '100%' }}>
                <FlatList
                    data={categories}
                    renderItem={({ item, index }) => (
                        <Box m={{ phone: 'xs', tablet: 's' }} style={{ width: '100%' }} alignItems="center" justifyContent="center">
                            <Box style={{ width: '50%' }} flexDirection="row" justifyContent="space-between">
                                <Text variant="optionHeader">
                                    {item.name}
                                </Text>
                                <Pressable hitSlop={15} onPress={() => removeCategoryForUser(categories?.[index]?.id)}>
                                    <Ionicons name="close" size={24} color={dark ? palette.white : palette.red} />
                                </Pressable>
                            </Box>
                        </Box>
                    )}
                    keyExtractor={(item) => item.id}
                />
                </Box>
            </Box>
            <Box flex={1}>
                <Box m={{ phone: 'xs', tablet: 's' }}>
                    <KeyboardAvoidingView
                        keyboardVerticalOffset={height + 64}
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                        style={styles.container}
                    >
                        <TextField
                            onChangeText={setName}
                            value={name}
                            placeholder="Get together"
                            title="Tag"
                            style={{ width: '60%' }}
                        />
                    </KeyboardAvoidingView>
                </Box>
            </Box>
            <Box flex={1} m={{ phone: 'xs', tablet: 's' }} justifyContent="center" alignItems="center">
                <Button onPress={addCategory}>
                    Add New Tag
                </Button>
            </Box>
        </Box>
    )
}

export default UserAddTags


