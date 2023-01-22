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
    copyPriorityLevel: boolean,
    setParentCopyPriorityLevel: Dispatch<SetStateAction<boolean>>,
    copyTimePreference: boolean,
    setParentCopyTimePreference: Dispatch<SetStateAction<boolean>>,
    copyReminders: boolean,
    setParentCopyReminders: Dispatch<SetStateAction<boolean>>,
}

function EditCategoryStep2(props: Props) {
    const [copyTimePreference, setCopyTimePreference] = useState<boolean>(props?.copyTimePreference ?? false)
    const [copyReminders, setCopyReminders] = useState<boolean>(props?.copyReminders ?? false)
    const [copyPriorityLevel, setCopyPriorityLevel] = useState<boolean>(props?.copyPriorityLevel ?? false)
    const [isMessage1, setIsMessage1] = useState<boolean>(false)
    const [isMessage2, setIsMessage2] = useState<boolean>(false)

    const setParentCopyTimePreference = props?.setParentCopyTimePreference
    const setParentCopyReminders = props?.setParentCopyReminders
    const setParentCopyPriorityLevel = props?.setParentCopyPriorityLevel

    useEffect(() => {
        if (copyTimePreference !== props?.copyTimePreference) {
            setCopyTimePreference(props?.copyTimePreference ?? false)
        }

        if (copyReminders !== props?.copyReminders) {
            setCopyReminders(props?.copyReminders ?? false)
        }
    }, [props?.copyTimePreference, props?.copyReminders])

    const changeCopyPriorityLevel = (value: boolean) => {
        setCopyPriorityLevel(value)
        setParentCopyPriorityLevel(value)
    }

    const changeCopyTimePreference = (value: boolean) => {
        setCopyTimePreference(value)
        setParentCopyTimePreference(value)
    }

    const changeCopyReminders = (value: boolean) => {
        setCopyReminders(value)
        setParentCopyReminders(value)
    }

    return (
        <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%' }}>
            <Box style={{ width: '90%' }} m={{ phone: 's', tablet: 'm' }}>
                <Box flexDirection="row" justifyContent="flex-start" alignItems="center" style={{ width: '100%' }}>
                    <Hint visible={isMessage1} message={'New events whose details are similar to this one will have their priority level set to the level found on this event. If priority changes with time, avoid enabling this feature.'} color={Colors.purple} onBackgroundPress={() => setIsMessage1(false)}>
                        <Pressable onPress={() => setIsMessage1(!isMessage1)}> 
                            <Text variant="buttonLink">Copy over priority level to any new events whose details are similar in context to this event? (Hint)</Text>
                        </Pressable>
                    </Hint>
                </Box>
                <Box flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }}>
                    <Switch
                        onColor={Colors.purple30}
                        offColor={Colors.purple60}
                        value={copyPriorityLevel}
                        onValueChange={changeCopyPriorityLevel}
                        style={{ marginBottom: 20 }}
                    />
                </Box>
            </Box>
            <Box style={{ width: '90%' }} m={{ phone: 's', tablet: 'm' }}>
                <Box flexDirection="row" justifyContent="flex-start" alignItems="center">
                    <Text variant="optionHeader">Copy over time preferences to any new events whose details have similar context?</Text>
                </Box>
                <Box flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }}>
                    <Switch
                        onColor={Colors.purple30}
                        offColor={Colors.purple60}
                        value={copyTimePreference}
                        onValueChange={changeCopyTimePreference}
                        style={{ marginBottom: 20 }}
                    />
                </Box>
            </Box>
            <Box style={{ width: '90%' }} m={{ phone: 's', tablet: 'm' }}>
                <Box flexDirection="row" justifyContent="flex-start" alignItems="center">  
                    <Text variant="optionHeader">Copy over reminders to any new events whose details have similar context?</Text>
                </Box>
                <Box flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }}>
                    <Switch
                        onColor={Colors.purple30}
                        offColor={Colors.purple60}
                        value={copyReminders}   
                        onValueChange={changeCopyReminders} 
                        style={{ marginBottom: 20 }}
                    />  
                </Box>
            </Box>
        </Box>
    )
        
}

export default EditCategoryStep2

