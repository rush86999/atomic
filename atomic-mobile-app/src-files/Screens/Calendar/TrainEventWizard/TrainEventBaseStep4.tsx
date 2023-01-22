import React, {
  useState,
  Dispatch,
  SetStateAction,
} from 'react'
import { Colors, Switch, Hint } from 'react-native-ui-lib'
import { Pressable } from 'react-native'
import Box from '@components/common/Box'
import Text from '@components/common/Text'

type Props = {

    copyPriorityLevel: boolean,
    setParentCopyPriorityLevel: Dispatch<SetStateAction<boolean>>,
    copyReminders: boolean,
    setParentCopyReminders: Dispatch<SetStateAction<boolean>>,
}

function TrainEventBaseStep(props: Props) {
    const [copyPriorityLevel, setCopyPriorityLevel] = useState<boolean>(props?.copyPriorityLevel ?? false)
    const [copyReminders, setCopyReminders] = useState<boolean>(props?.copyReminders ?? false)
    const [isMessage1, setIsMessage1] = useState<boolean>(false)
    const [isMessage2, setIsMessage2] = useState<boolean>(false)

    const setParentCopyPriorityLevel = props?.setParentCopyPriorityLevel
    const setParentCopyReminders = props?.setParentCopyReminders

    const changeCopyPriorityLevel = (value: boolean) => {
        setCopyPriorityLevel(value)
        setParentCopyPriorityLevel(value)
    }

    const changeCopyReminders = (value: boolean) => {
        setCopyReminders(value)
        setParentCopyReminders(value)
    }

    return (
        <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%'}}>
            <Box style={{ width: '90%' }} m={{ phone: 's', tablet: 'm' }}>
                <Box flexDirection="row" justifyContent="flex-start" alignItems="center" style={{ width: '100%' }}>
                    <Hint visible={isMessage1} message={'New events whose details are similar to this one will have their priority level set to the level found on this event. If priority changes with time, avoid enabling this feature.'} color={Colors.purple} onBackgroundPress={() => setIsMessage1(false)}>
                        <Pressable onPress={() => setIsMessage1(!isMessage1)}>    
                            <Text variant="buttonLink">Copy over priority level to any new events whose details are similar in context to this event? (Hint)</Text>
                        </Pressable>
                    </Hint>
                </Box>
                <Box flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }} style={{ width: '100%' }}>
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
                <Box flexDirection="row" justifyContent="flex-start" alignItems="center" style={{ width: '100%' }}>
                    <Text variant="optionHeader">Copy over reminders to any new events whose details are similar in context to this event?</Text>
                </Box>
                <Box flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }} style={{ width: '100%' }}>
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

export default TrainEventBaseStep