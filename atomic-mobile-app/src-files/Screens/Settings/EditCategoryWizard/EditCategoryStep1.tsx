import React, {
    useState,
    Dispatch,
    SetStateAction,
    useEffect,
} from 'react'
import { Colors, Switch, TextField, Hint } from 'react-native-ui-lib'

import Box from '@components/common/Box'
import Text from '@components/common/Text'
import { Pressable } from 'react-native'

type Props = {
    name: string,
    setParentName: Dispatch<SetStateAction<string>>,
    copyAvailability: boolean,
    setParentCopyAvailability: Dispatch<SetStateAction<boolean>>,
    copyTimeBlocking: boolean,
    setParentCopyTimeBlocking: Dispatch<SetStateAction<boolean>>,
}

function EditCategoryStep1(props: Props) {
    const [name, setName] = useState(props.name)
    const [copyAvailability, setCopyAvailability] = useState<boolean>(props?.copyAvailability ?? false)
    const [copyTimeBlocking, setCopyTimeBlocking] = useState<boolean>(props?.copyTimeBlocking ?? false)

    const [isMessage1, setIsMessage1] = useState<boolean>(false)
    const [isMessage2, setIsMessage2] = useState<boolean>(false)

    const setParentName = props?.setParentName
    const setParentCopyAvailability = props?.setParentCopyAvailability
    const setParentCopyTimeBlocking = props?.setParentCopyTimeBlocking

    useEffect(() => {
        if (name !== props?.name) {
            setName(props?.name)
        }

        if (copyAvailability !== props?.copyAvailability) {
            setCopyAvailability(props?.copyAvailability ?? false)
        }

        if (copyTimeBlocking !== props?.copyTimeBlocking) {
            setCopyTimeBlocking(props?.copyTimeBlocking ?? false)
        }
    }, [props?.name, props?.copyAvailability, props?.copyTimeBlocking])

    const changeCopyAvailability = (value: boolean) => {
        setCopyAvailability(value)
        setParentCopyAvailability(value)
    }

    const changeCopyTimeBlocking = (value: boolean) => {
        setCopyTimeBlocking(value)
        setParentCopyTimeBlocking(value)
    }

    const changeName = (value: string) => {
        setName(value)
        setParentName(value)
    }

    return (
        <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%'}}>
            <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '90%' }} m={{ phone: 's', tablet: 'm' }}>
                <TextField
                    title="Name"
                    placeholder="social"
                    onChangeText={changeName}
                    value={name}
                    style={{ width: '40%'}}
                />
            </Box>
            <Box flex={1} style={{ width: '90%' }} m={{ phone: 's', tablet: 'm' }}>  
                <Box flexDirection="row" justifyContent="flex-start" alignItems="center">
                    <Hint visible={isMessage1} message={'Event availability shown in your calendar will be copied over to any new events whose details are similar to this one. Helpful for task events that are synced or created inside Atomic.'} color={Colors.purple} onBackgroundPress={() => setIsMessage1(false)}>
                        <Pressable onPress={() => setIsMessage1(!isMessage1)}> 
                            <Text variant="buttonLink" mt={{ phone: 's', tablet: 'm' }}>Copy over transparency of event to any new events whose details have similar context? (Hint)</Text>
                        </Pressable>
                    </Hint>
                </Box>
                <Box flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }}>
                    <Switch
                        onColor={Colors.purple30}
                        offColor={Colors.purple60}
                        value={copyAvailability}
                        onValueChange={changeCopyAvailability}
                        style={{marginBottom: 20}}
                    />
                </Box>
            </Box>
            <Box flex={1} style={{ width: '90%' }} m={{ phone: 's', tablet: 'm' }}>
                <Box flexDirection="row" justifyContent="flex-start" alignItems="center">
                    <Hint visible={isMessage2} message={'Blocked time for before and after the event will be copied over to new events whose details are similar to this one.'} color={Colors.purple} onBackgroundPress={() => setIsMessage2(false)}>
                        <Pressable onPress={() => setIsMessage2(!isMessage2)}>
                            <Text variant="optionHeader" mt={{ phone: 's', tablet: 'm' }}>Copy over buffer times to any new events whose details have similar context? (Hint)</Text>
                        </Pressable>
                    </Hint>
                </Box>
                <Box flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }}>
                    <Switch
                        onColor={Colors.purple30}
                        offColor={Colors.purple60}
                        value={copyTimeBlocking}
                        onValueChange={changeCopyTimeBlocking}
                        style={{ marginBottom: 20 }}
                    />
                </Box>
            </Box>
        </Box>
    )
}

export default EditCategoryStep1
