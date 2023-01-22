import React, {
    useState,
    Dispatch,
    SetStateAction,
    useEffect,
} from 'react'
 import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
    Appearance,
} from 'react-native'
import { useHeaderHeight } from '@react-navigation/elements'
import { TextField } from 'react-native-ui-lib'
import Ionicons from 'react-native-vector-icons/Ionicons'
import Box from '@components/common/Box'
import Text from '@components/common/Text'

import { palette } from '@theme/theme'
import _ from 'lodash'

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%'
    },
})

type Props = {
    reminders: number[],
    setParentReminders: Dispatch<SetStateAction<number[]>>,
}

const dark = Appearance.getColorScheme() === 'dark'

function EditPreferenceStep1(props: Props) {
    const [reminders, setReminders] = useState<number[]>(props?.reminders || [])
    const [reminder, setReminder] = useState<number>(0)
    
    useEffect(() => {
        if (!_.isEqual(reminders, props?.reminders)) {
            setReminders(props?.reminders || [])
        }
    }, [props?.reminders?.length])
    
    const setParentReminders = props?.setParentReminders


    const addItemToReminders = () => {
        const newReminders = _.uniqWith((reminders || []).concat([reminder]), _.isEqual)
        setReminders(newReminders)
        setParentReminders(newReminders)
    }

    const removeItemFromReminders = (item: number) => {
        const newReminders = _.without(reminders, item)
        setReminders(newReminders)
        setParentReminders(newReminders)
    }

    const height = useHeaderHeight()

    return (
        <KeyboardAvoidingView
            keyboardVerticalOffset={height + 64}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <Box flex={1} justifyContent="center" alignItems="center">
                <Box flex={1} justifyContent="center" alignItems="center">
                    <Text variant="subheaderNormal">
                        Default Reminders
                    </Text>
                </Box>
                <Box flex={3} mt={{ phone: 'm', tablet: 'l' }} alignItems="center" style={{ width: '100%' }}>
                    <Box alignItems="center" style={{ width: '100%' }}>
                        <FlatList
                            data={reminders}
                            renderItem={({ item }) => (
                                <Box style={{ width: '100%' }} alignItems="center" justifyContent="center">
                                    <Box style={{ width: '70%' }} flexDirection="row" justifyContent="space-between">
                                        <Text variant="optionHeader">
                                            {`${item} minutes before`}
                                        </Text>
                                        <Pressable hitSlop={15} onPress={() => removeItemFromReminders(item)}>
                                            <Ionicons name="close" size={24} color={palette.red} />
                                        </Pressable>
                                    </Box>
                                </Box>
                            )}
                            keyExtractor={(item, index) => `${item}-${index}`}
                        />
                    </Box>
                </Box>
                <Box flex={1} justifyContent="center" alignItems="center">
                    <Box m={{ phone: 'xs', tablet: 's' }}>

                            <TextField
                                type="numeric"
                                onChangeText={(text: string) => setReminder(parseInt(text.replace(/[^0-9.]/g, ''), 10) || 0)}
                                value={`${reminder}`}
                                placeholder="0"
                                style={{ width: '40%' }}
                                title="Reminder"
                            />
                        
                    </Box>
                </Box>
                <Box flex={1} m={{ phone: 'xs', tablet: 's' }} justifyContent="center" alignItems="center">
                    <Pressable onPress={addItemToReminders}>
                        <Box flex={1} flexDirection="row" justifyContent="space-between" alignItems="center" style={{ width: '10%'}}>
                            <Ionicons name="add" size={24} color={dark ? palette.white : palette.purplePrimary} />
                            <Text variant="buttonLink">
                                Add
                            </Text>
                        </Box>
                    </Pressable>
                </Box>
            </Box>
        </KeyboardAvoidingView>
    )

}

export default EditPreferenceStep1