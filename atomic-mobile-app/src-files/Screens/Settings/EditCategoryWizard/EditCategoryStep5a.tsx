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
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet } from 'react-native'
import { palette } from '@theme/theme'

type Props = {
    copyIsBreak: boolean,
    setParentCopyIsBreak: Dispatch<SetStateAction<boolean>>,
    defaultIsBreak: boolean,
    setParentDefaultIsBreak: Dispatch<SetStateAction<boolean>>,
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
})


function EditCategoryStep5a(props: Props) {
    const [copyIsBreak, setCopyIsBreak] = useState<boolean>(props?.copyIsBreak ?? false)
    const [defaultIsBreak, setDefaultIsBreak] = useState<boolean>(props?.defaultIsBreak ?? false)

    const setParentCopyIsBreak = props?.setParentCopyIsBreak
    const setParentDefaultIsBreak = props?.setParentDefaultIsBreak

    const changeCopyIsBreak = (value: boolean) => {
        setCopyIsBreak(value)
        setParentCopyIsBreak(value)
    }

    const changeDefaultIsBreak = (value: boolean) => {
        setDefaultIsBreak(value)
        setParentDefaultIsBreak(value)
    }

    return (
        <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%' }}>
            <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '90%' }} m={{ phone: 's', tablet: 'm' }}>
                <Box flexDirection="row" justifyContent="flex-start" alignItems="center" style={{ width: '100%' }} >
                    <Text variant="optionHeader">Copy over break value to any new events whose details have similar context? </Text>
                </Box>
                <Box flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }} style={{ width: '100%' }}>
                    <Switch
                        onColor={Colors.purple30}
                        offColor={Colors.purple60}
                        value={copyIsBreak}
                        onValueChange={changeCopyIsBreak}
                        style={{ marginBottom: 20 }}
                    />
                </Box>
            </Box>
            <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '90%' }} m={{ phone: 's', tablet: 'm' }}>
                <Box flexDirection="row" justifyContent="flex-start" alignItems="center" style={{ width: '100%' }}>
                    <Text variant="optionHeader">Set any new events as break events with the given tag for scheduling assists? </Text>
                </Box>
                <Box flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }} style={{ width: '100%' }}>
                    <Switch
                        onColor={Colors.purple30}
                        offColor={Colors.purple60}
                        value={defaultIsBreak}
                        onValueChange={changeDefaultIsBreak}
                        style={{ marginBottom: 20 }}
                    />
                </Box>
            </Box>
        </Box>
    )
}

export default EditCategoryStep5a

