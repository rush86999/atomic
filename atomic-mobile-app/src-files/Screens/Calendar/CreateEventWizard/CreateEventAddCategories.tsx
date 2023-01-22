import React, {
  useState,
  Dispatch,
  SetStateAction,
} from 'react'
import {
   FlatList,
   Pressable,
    useColorScheme,
   Appearance
} from 'react-native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { Colors, Picker, PickerValue } from 'react-native-ui-lib'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import Button from '@components/Button'
import { addItemToCategories, removeItemFromCategories } from '@screens/Calendar/CreateEventWizard/wizardHelper'

import { palette } from '@theme/theme'

import {
  CategoryType
} from '@app/dataTypes/CategoryType'



type Props = {
    setParentSelectedCategories: Dispatch<SetStateAction<CategoryType[]>>,
    selectedCategories: CategoryType[],
    categories: CategoryType[],
}

const dark = Appearance.getColorScheme() === 'dark'

function CreateEventAddCategories(props: Props) {
    const [selectedTagObject, setSelectedTagObject] = useState<CategoryType>(null)
    const [selectedTag, setSelectedTag] = useState<string>('')

    const dark = useColorScheme() === 'dark'
    const setParentSelectedCategories = props?.setParentSelectedCategories
    const tags = props?.categories
    const [selectedTagObjects, setSelectedTagObjects] = useState<CategoryType[]>(props?.selectedCategories)

    type itemType = {
        value: string,
        label: string,
    }
    const changeSelectedTag = (item: PickerValue) => {
        
        setSelectedTag((item as itemType).value)
        setSelectedTagObject(tags.find(tag => tag.id === (item as itemType).value))
    }

    return (
        <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%'}}>
        <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%'}}>
            <Text variant="optionHeader">
                Add tags to this event
            </Text>
        </Box>
        <Box flex={2} justifyContent="flex-start" alignItems="center" style={{ width: '100%'}}>
            <Picker
                placeholder="Select Tags"
                topBarProps={{title: 'Tags'}}
                floatingPlaceholder
                value={selectedTag}
                enableModalBlur={false}
                showSearch
                searchPlaceholder={'Search a tag'}
                searchStyle={{ color: Colors.purple30, placeholderTextColor: Colors.grey50 }}
                onChange={changeSelectedTag}
                style={{ fontSize: 20, lineHeight: 24, width: 150, color: dark ? palette.white : palette.textBlack }}
                
            >
                {tags.map((category) => (   
                    <Picker.Item  key={category.id} value={category.id} label={category.name} />
                ))}
            </Picker>
        </Box>
        <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%'}}>
            <FlatList
                data={selectedTagObjects}
                renderItem={({ item, index }) => (
                    <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%'}}>
                        <Box flexDirection="row" justifyContent="space-between" alignItems="center" style={{ width: '60%'}}>
                            <Text variant="optionHeader">
                                {item.name}
                            </Text>
                            <Pressable hitSlop={15} onPress={() => removeItemFromCategories(selectedTagObjects, setSelectedTagObjects, setParentSelectedCategories, index)}>
                                <Ionicons name="close" size={24} color={palette.red} />
                            </Pressable>
                        </Box>
                    </Box>
                )}
                keyExtractor={(item) => item.id}
            />
        </Box>
        <Box flex={0.5}  justifyContent="center" alignItems="center" style={{ width: '100%'}}>
            <Pressable onPress={() => addItemToCategories(setSelectedTag, selectedTagObject, setSelectedTagObject, selectedTagObjects, setSelectedTagObjects, setParentSelectedCategories)}>
                <Box flex={1} flexDirection="row" justifyContent="space-between" alignItems="center" style={{ width: '10%'}}>
                    <Ionicons name="add" size={24} color={dark ? palette.white : palette.purplePrimary} />
                    <Text variant="buttonLink">
                        Add
                    </Text>
                </Box>
            </Pressable>
        </Box>
    </Box>
    )
}

export default CreateEventAddCategories