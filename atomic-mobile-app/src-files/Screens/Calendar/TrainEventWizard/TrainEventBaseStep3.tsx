import React, {
  useState,
  Dispatch,
  SetStateAction,
} from 'react'
import { Colors, Hint, Switch } from 'react-native-ui-lib'

import Box from '@components/common/Box'
import Text from '@components/common/Text'
import { Pressable } from 'react-native'

type Props = {
    copyIsMeeting: boolean,
    setParentCopyIsMeeting: Dispatch<SetStateAction<boolean>>,
    copyIsExternalMeeting: boolean,
    setParentCopyIsExternalMeeting: Dispatch<SetStateAction<boolean>>,
    copyDuration: boolean,
    setParentCopyDuration: Dispatch<SetStateAction<boolean>>,
    copyColor: boolean,
    setParentCopyColor: Dispatch<SetStateAction<boolean>>,
}

function TrainEventBaseStep3(props: Props) {
    const [copyIsMeeting, setCopyIsMeeting] = useState<boolean>(props?.copyIsMeeting ?? false)
    const [copyIsExternalMeeting, setCopyIsExternalMeeting] = useState<boolean>(props?.copyIsExternalMeeting ?? false)
    const [copyDuration, setCopyDuration] = useState<boolean>(props?.copyDuration ?? false)
    const [copyColor, setCopyColor] = useState<boolean>(props?.copyColor ?? false)
    const [isMessage1, setIsMessage1] = useState<boolean>(false)
    const [isMessage2, setIsMessage2] = useState<boolean>(false)
    const [isMessage3, setIsMessage3] = useState<boolean>(false)
    const [isMessage4, setIsMessage4] = useState<boolean>(false)

    const setParentCopyIsExternalMeeting = props?.setParentCopyIsExternalMeeting
    const setParentCopyDuration = props?.setParentCopyDuration
    const setParentCopyIsMeeting = props?.setParentCopyIsMeeting
    const setParentCopyColor = props?.setParentCopyColor
    
    const changeCopyIsExternalMeeting = (value: boolean) => {
        setCopyIsExternalMeeting(value)
        setParentCopyIsExternalMeeting(value)
    }

    const changeCopyDuration = (value: boolean) => {
        setCopyDuration(value)
        setParentCopyDuration(value)
    }

     const changeCopyIsMeeting = (value: boolean) => {
        setCopyIsMeeting(value)
        setParentCopyIsMeeting(value)
     }
    
    const changeCopyColor = (value: boolean) => {
        setCopyColor(value)
        setParentCopyColor(value)
    }

    return (
        <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%'}}>
            <Box flex={1} style={{ width: '90%' }} m={{ phone: 's', tablet: 'm' }}>
                <Box flexDirection="row" justifyContent="flex-start" alignItems="center">
                    <Hint visible={isMessage1} message={'Event will be tagged with Meeting topic and settings for the tag will be applied to the event. Note: training settings override tag settings for schedule assists in case of overlap.'} color={Colors.purple} onBackgroundPress={() => setIsMessage1(false)}>
                        <Pressable onPress={() => setIsMessage1(!isMessage1)}>
                            <Text variant="buttonLink">Classify any new events whose details are similar as a 'Meeting type event'? (Hint) </Text>
                        </Pressable>
                    </Hint>
                </Box>
                <Box flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }}>
                    <Switch
                        onColor={Colors.purple30}
                        offColor={Colors.purple60}
                        value={copyIsMeeting}
                        onValueChange={changeCopyIsMeeting}
                        style={{ marginBottom: 20 }}
                    />
                </Box>
            </Box>
            <Box flex={1} style={{ width: '90%' }} m={{ phone: 's', tablet: 'm' }}>
                <Box flexDirection="row" justifyContent="flex-start" alignItems="center">
                    <Hint visible={isMessage2} message={'Tag with External Meeting topic is a meeting with contact outside the organization. Event will be tagged with external meeting topic and settings for the tag will be applied to the event. Note: training settings override tag settings for schedule assists in case of overlap.'} color={Colors.purple} onBackgroundPress={() => setIsMessage2(false)}>
                        <Pressable onPress={() => setIsMessage2(!isMessage2)}>  
                            <Text variant="buttonLink">Classify any new events whose details have similar context as an 'External Meeting type event'? (Hint) </Text>
                        </Pressable>
                    </Hint>
                </Box>
                <Box flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }}>
                    <Switch
                        onColor={Colors.purple30}
                        offColor={Colors.purple60}
                        value={copyIsExternalMeeting}
                        onValueChange={changeCopyIsExternalMeeting}
                    />
                </Box>
            </Box>
            <Box flex={1} style={{ width: '90%' }} m={{ phone: 's', tablet: 'm' }}>
                <Box flexDirection="row" justifyContent="flex-start" alignItems="center"> 
                    <Hint visible={isMessage3} message={'New events whose details are similar will change their end time to match the duration to this event. Usually useful to sync task events from 3rd party apps.'} color={Colors.purple} onBackgroundPress={() => setIsMessage3(false)}>
                        <Pressable onPress={() => setIsMessage3(!isMessage3)}> 
                            <Text variant="buttonLink">Copy over duration value to any new events whose details have similar context? (Hint)</Text>
                        </Pressable>
                    </Hint>
                </Box>
                <Box flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }}>
                    <Switch
                        onColor={Colors.purple30}
                        offColor={Colors.purple60}
                        value={copyDuration}
                        onValueChange={changeCopyDuration}
                    />
                </Box>
            </Box>
            <Box flex={1} style={{ width: '90%' }} m={{ phone: 's', tablet: 'm' }}>
                <Box flexDirection="row" justifyContent="flex-start" alignItems="center"> 
                    <Text variant="optionHeader">Copy over background color to any new events whose details have similar context? </Text>
                </Box>
                <Box flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }}>
                    <Switch
                        onColor={Colors.purple30}
                        offColor={Colors.purple60}
                        value={copyColor}
                        onValueChange={changeCopyColor}
                    />
                </Box>
            </Box>
        </Box>
    )
}

export default TrainEventBaseStep3