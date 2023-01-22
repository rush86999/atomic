import React, {
  useState,
  Dispatch,
    SetStateAction,
  
} from 'react'
import { Colors, Switch, TextField } from 'react-native-ui-lib'
import Ionicons from 'react-native-vector-icons/Ionicons'

import Box from '@components/common/Box'
import Text from '@components/common/Text'
import { DefaultRemindersType } from '@app/dataTypes/CategoryType'
import _ from 'lodash'
import Button from '@components/Button'
import { Appearance, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet } from 'react-native'
import { palette } from '@theme/theme'
import { useHeaderHeight } from '@react-navigation/elements'

const dark = Appearance.getColorScheme() === 'dark'

type Props = {
    defaultReminders: DefaultRemindersType,
    setParentDefaultReminders: Dispatch<SetStateAction<DefaultRemindersType>>,
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
})

function EditCategoryStep5(props: Props) {
    const [defaultReminders, setDefaultReminders] = useState<DefaultRemindersType>(props?.defaultReminders || [])
    const [alarm, setAlarm] = useState<number>(0)  
    const [isMessage1, setIsMessage1] = useState<boolean>(false)
    const [isMessage2, setIsMessage2] = useState<boolean>(false)

    const setParentDefaultReminders = props?.setParentDefaultReminders

    

    const changeDefaultReminders = (value: number) => {
        const newAlarms = _.uniqWith(defaultReminders.concat([value]), _.isEqual)
        setDefaultReminders(newAlarms)
        setParentDefaultReminders(newAlarms)
    }

    const removeItemFromDefaultReminders = (item: number) => {
        const newAlarms = _.without(defaultReminders, item)

        setDefaultReminders(newAlarms)
        setParentDefaultReminders(newAlarms)
    }

    const changeAlarm = (value: string) => {
        setAlarm(parseInt(value.replace(/[^0-9.]/g, ''), 10) || 0)
    }

    const height = useHeaderHeight()

    return (
        <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%'}}>
            <Box flex={1} justifyContent="center" alignItems="center">
                <Text variant="optionHeader">
                Add reminders
                </Text>
            </Box>
            <Box flex={2} mt={{ phone: 'm', tablet: 'l' }} justifyContent="center" alignItems="center" style={{ width: '100%' }}>
                <FlatList
                    data={defaultReminders}
                    renderItem={({ item, index }) => (
                        <Box justifyContent="center" alignItems="center" style={{ width: '100%' }}>
                            <Box style={{ width: '70%' }} flexDirection="row" justifyContent="space-between">
                                <Text variant="optionHeader">
                                    {`${item} minutes before`}
                                </Text>
                                <Pressable hitSlop={15} onPress={() => removeItemFromDefaultReminders(item)}>
                                    <Ionicons name="close" size={24} color={palette.red} />
                                </Pressable>
                            </Box>
                        </Box>
                    )}
                    keyExtractor={(item, index) => `${item}-${index}`}
                />
            </Box>
            <Box flex={1} justifyContent="center" alignItems="center">
                <Box m={{ phone: 'xs', tablet: 's' }}>
                    <KeyboardAvoidingView
                        keyboardVerticalOffset={height + 64}
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                        style={styles.container}
                    >
                        <TextField
                            type="numeric"
                            onChangeText={changeAlarm}
                            value={`${alarm}`}
                            placeholder="0"
                            style={{ width: '40%' }}
                            title="Reminder"
                        />
                    </KeyboardAvoidingView>
                </Box>
            </Box>
            <Box flex={1} m={{ phone: 'xs', tablet: 's' }} justifyContent="center" alignItems="center">
                <Pressable onPress={() => changeDefaultReminders(alarm)}>
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

export default EditCategoryStep5
