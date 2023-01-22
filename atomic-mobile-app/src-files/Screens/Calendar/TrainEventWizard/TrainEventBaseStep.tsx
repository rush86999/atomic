import React, {
  useState,
  Dispatch,
  SetStateAction,
  useEffect,
  useCallback,
} from 'react'
import { Colors, Switch, Hint } from 'react-native-ui-lib'
import { useFocusEffect } from '@react-navigation/native'
import { Pressable } from 'react-native'
import Box from '@components/common/Box'
import Text from '@components/common/Text'

type Props = {
    copyAvailability: boolean,
    setParentCopyAvailability: Dispatch<SetStateAction<boolean>>,
    copyTimeBlocking: boolean,
    setParentCopyTimeBlocking: Dispatch<SetStateAction<boolean>>,
    copyTimePreference: boolean,
    setParentCopyTimePreference: Dispatch<SetStateAction<boolean>>,
}

function TrainEventBaseStep(props: Props) {
    const [copyAvailability, setCopyAvailability] = useState<boolean>(props?.copyAvailability ?? false)
    const [copyTimeBlocking, setCopyTimeBlocking] = useState<boolean>(props?.copyTimeBlocking ?? false)
    const [copyTimePreference, setCopyTimePreference] = useState<boolean>(props?.copyTimePreference ?? false)
    const [isMessage1, setIsMessage1] = useState<boolean>(false)
    const [isMessage2, setIsMessage2] = useState<boolean>(false)

    const setParentCopyAvailability = props?.setParentCopyAvailability
    const setParentCopyTimeBlocking = props?.setParentCopyTimeBlocking
    const setParentCopyTimePreference = props?.setParentCopyTimePreference


    const changeCopyAvailability = (value: boolean) => {
        setCopyAvailability(value)
        setParentCopyAvailability(value)
    }

    const changeCopyTimeBlocking = (value: boolean) => {
        setCopyTimeBlocking(value)
        setParentCopyTimeBlocking(value)
    }

    const changeCopyTimePreference = (value: boolean) => {
        setCopyTimePreference(value)
        setParentCopyTimePreference(value)
    }


    return (
        <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%'}}>
            <Box flex={1} style={{ width: '95%' }} m={{ phone: 's', tablet: 'm' }}>
                <Box flexDirection="row" justifyContent="flex-start" alignItems="center">
                    <Hint visible={isMessage1} message={'Event availability shown in your calendar will be copied over to any new events whose details are similar to this one. Helpful for task events that are synced or created inside Atomic.'} color={Colors.purple} onBackgroundPress={() => setIsMessage1(false)}>
                        <Pressable onPress={() => setIsMessage1(!isMessage1)}>    
                            <Text variant="buttonLink">Copy over transparency of event to any new events whose details have similar context? (Hint)</Text>
                        </Pressable>    
                    </Hint>
                </Box>
                <Box flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }}>
                    <Switch
                        onColor={Colors.purple30}
                        offColor={Colors.purple60}
                        value={copyAvailability || props?.copyAvailability}
                        onValueChange={changeCopyAvailability}
                        style={{marginBottom: 20}}
                    />
                </Box>
            </Box>
            <Box flex={1} style={{ width: '95%' }} m={{ phone: 's', tablet: 'm' }}>
                <Box flexDirection="row" justifyContent="flex-start" alignItems="center">
                    <Hint visible={isMessage2} message={'Blocked time for before and after the event will be copied over to new events whose details are similar to this one.'} color={Colors.purple} onBackgroundPress={() => setIsMessage2(false)}>
                        <Pressable onPress={() => setIsMessage2(!isMessage2)}>   
                            <Text variant="buttonLink">Copy over buffer times to any new events whose details have similar context? (Hint)</Text>
                        </Pressable>
                    </Hint>
                </Box>
                <Box flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }}>
                    <Switch
                        onColor={Colors.purple30}
                        offColor={Colors.purple60}
                        value={copyTimeBlocking || props?.copyTimeBlocking}
                        onValueChange={changeCopyTimeBlocking}
                        style={{ marginBottom: 20 }}
                    />
                </Box>
            </Box>
            <Box flex={1} style={{ width: '95%' }} m={{ phone: 's', tablet: 'm' }}>
                <Box flexDirection="row" justifyContent="flex-start" alignItems="center">  
                    <Text variant="optionHeader">Copy over time preference to any new events whose details have similar context for scheduling assists?</Text>
                </Box>
                <Box flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }}>
                    <Switch
                        onColor={Colors.purple30}
                        offColor={Colors.purple60}
                        value={copyTimePreference || props?.copyTimePreference}
                        onValueChange={changeCopyTimePreference}
                        style={{ marginBottom: 20 }}
                    />
                </Box>
            </Box>
        </Box>
    )
}

export default TrainEventBaseStep