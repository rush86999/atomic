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
import { useHeaderHeight } from '@react-navigation/elements'
import Ionicons from 'react-native-vector-icons/Ionicons'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
 import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { useNavigation, RouteProp } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'

import Toast from 'react-native-toast-message'

import Box from '@components/common/Box'
import Text from '@components/common/Text'
import Button from '@components/Button'

import { CategoryType } from '@app/dataTypes/CategoryType'
import {
    addCategoryToUser,
    listUserCategories,
    removeCategory,
    removeEventConnectionsForCategory,
} from '@screens/Category/CategoryHelper'

import { palette } from '@theme/theme'
import { TextField } from 'react-native-ui-lib'

const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
})

type RootRouteStackParamList = {
    UserEditCategories: {
        isUpdate?: string,
  }
}

type UserEditCategoriesRouteProp = RouteProp<
  RootRouteStackParamList,
    'UserEditCategories'
    >

type RootNavigationStackParamList = {
    UserEditCategory: {
        categoryId: string,
        name: string,
    }, 
    UserEditCategories: undefined,
}

type UserEditCategoriesNavigationProp = StackNavigationProp<
  RootNavigationStackParamList,
  'UserEditCategories'
>

type Props = {
    sub: string,
    client: ApolloClient<NormalizedCacheObject>,
    route: UserEditCategoriesRouteProp,
}

const dark = Appearance.getColorScheme() === 'dark'

function UserEditCategories(props: Props) {
    const [categories, setCategories] = useState<CategoryType[]>([])
    const [name, setName] = useState<string>('')

    const client = props?.client
    const userId = props.sub
    const isUpdate = props?.route?.params?.isUpdate

    const navigation = useNavigation<UserEditCategoriesNavigationProp>()

    useEffect(() => {
        (async () => {
            try {
                const existingCategories = await listUserCategories(client, userId)
                if (existingCategories.length === 0) {
                    Toast.show({
                        type: 'warning',
                        position: 'bottom',
                        text1: 'No tags found',
                        text2: 'Please add a tag',
                    })
                }

                setCategories(existingCategories)
                
            } catch (e) {
                
            }
        })()
    }, [isUpdate])

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

    const onPress = (categoryId: string, name: string) => {
        
        if (!categoryId) {
            return
        }
        if (!name) {
            return
        }
        navigation.navigate('UserEditCategory', {
            categoryId,
            name,
        })
    }

    const height = useHeaderHeight()

    return (
        <Box flex={1} justifyContent="center" alignItems="center">
            <Box flex={5}  style={{ width: '100%' }}>
                <FlatList
                    data={categories}
                    renderItem={({ item, index }) => (
                        <Box mt={{ phone: 's', tablet: 'm'}} justifyContent="center" alignItems="center" style={{ width: '100%'}}>
                            <Box style={{  width: '70%'  }} flexDirection="row" justifyContent="space-between" alignItems="center">
                                <Box style={{  width: '70%' }}  justifyContent="center" alignItems="flex-start">
                                    <Text variant="optionHeader">
                                        {item.name}
                                    </Text>
                                </Box>
                                <Box style={{  width: '30%' }}  flexDirection="row" justifyContent="space-between" alignItems="center">
                                    <Pressable hitSlop={15} onPress={() => onPress(item?.id, item?.name)}>
                                        <MaterialCommunityIcons name="playlist-edit" size={24} color={dark ? palette.white : palette.purplePrimary} />
                                    </Pressable>
                                    <Pressable hitSlop={15} onPress={() => removeCategoryForUser(categories?.[index]?.id)}>
                                        <Ionicons name="close" size={24} color={dark ? palette.white : palette.red} />
                                    </Pressable>
                                </Box>
                            </Box>
                        </Box>
                    )}
                    keyExtractor={(item) => item.id}
                />
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

export default UserEditCategories


