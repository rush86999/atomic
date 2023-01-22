import React, {
  useState,
  Dispatch,
  SetStateAction,
} from 'react'
import { Pressable } from 'react-native'
import { Colors, Switch, Hint } from 'react-native-ui-lib'

import Box from '@components/common/Box'
import Text from '@components/common/Text'

type Props = {
    copyModifiable: boolean,
    setParentCopyModifiable: Dispatch<SetStateAction<boolean>>,
    copyCategories: boolean,
    setParentCopyCategories: Dispatch<SetStateAction<boolean>>,
    copyIsBreak: boolean,
    setParentCopyIsBreak: Dispatch<SetStateAction<boolean>>,

}

function TrainEventBaseStep2(props: Props) {
    const [copyModifiable, setCopyModifiable] = useState<boolean>(props?.copyModifiable ?? false)
    const [copyCategories, setCopyCategories] = useState<boolean>(props?.copyCategories ?? false)
    const [copyIsBreak, setCopyIsBreak] = useState<boolean>(props?.copyIsBreak ?? false)
    const [isMessage1, setIsMessage1] = useState<boolean>(false)
    const [isMessage2, setIsMessage2] = useState<boolean>(false)

    const setParentCopyModifiable = props?.setParentCopyModifiable
    const setParentCopyCategories = props?.setParentCopyCategories
    const setParentCopyIsBreak = props?.setParentCopyIsBreak

    const changeCopyModifiable = (value: boolean) => {
        setCopyModifiable(value)
        setParentCopyModifiable(value)
    }

    const changeCopyCategories = (value: boolean) => {
        setCopyCategories(value)
        setParentCopyCategories(value)
    }

    const changeCopyIsBreak = (value: boolean) => {
        setCopyIsBreak(value)
        setParentCopyIsBreak(value)
    }

    return (
        <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%'}}>
            <Box flex={1} style={{ width: '95%' }} m={{ phone: 's', tablet: 'm' }}>
                <Box flexDirection="row" justifyContent="flex-start" alignItems="center">
                    <Hint visible={isMessage1} message={'Copy over start time modifiability of the event to any new events whose details are similar for schedule assists. This keeps the event static and immobile on the calendar.'} color={Colors.purple} onBackgroundPress={() => setIsMessage1(false)}>
                        <Pressable onPress={() => setIsMessage1(!isMessage1)}>    
                            <Text variant="buttonLink">Copy over time modifiable value to any new events whose details are similar for scheduling assists? (Hint) </Text>
                        </Pressable>
                    </Hint>
                </Box>
                <Box flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }}>
                    <Switch
                        onColor={Colors.purple30}
                        offColor={Colors.purple60}
                        value={copyModifiable}
                        onValueChange={changeCopyModifiable}

                    />
                </Box>
            </Box>
            <Box flex={1} style={{ width: '95%' }} m={{ phone: 's', tablet: 'm' }}>
                <Box  flexDirection="row" justifyContent="flex-start" alignItems="center">
                    <Text variant="optionHeader">Copy over tags to any new events whose details have similar context? </Text>
                </Box>
                <Box  flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }}>
                    <Switch
                        onColor={Colors.purple30}
                        offColor={Colors.purple60}
                        value={copyCategories}
                        onValueChange={changeCopyCategories}

                    />
                </Box>
            </Box>
            <Box flex={1} style={{ width: '95%' }} m={{ phone: 's', tablet: 'm' }}>
                <Box flexDirection="row" justifyContent="flex-start" alignItems="center">
                    <Hint visible={isMessage2} message={'Classify any new events whose details are similar as a break for schedule assists.'} color={Colors.purple} onBackgroundPress={() => setIsMessage2(false)}>
                        <Pressable onPress={() => setIsMessage2(!isMessage2)}>  
                            <Text variant="buttonLink">Classify as a break type event for any new events whose details have similar context for scheduling assists? (Hint) </Text>
                        </Pressable>
                    </Hint>
                </Box>
                <Box flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }}>
                    <Switch
                        onColor={Colors.purple30}
                        offColor={Colors.purple60}
                        value={copyIsBreak}
                        onValueChange={changeCopyIsBreak}

                    />
                </Box>
            </Box>
        </Box>
    )
}

export default TrainEventBaseStep2
