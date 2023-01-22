import React, {
  useState,
  Dispatch,
  SetStateAction,
} from 'react'
import { Colors, Switch, ColorSwatch, Hint, } from 'react-native-ui-lib'

import Box from '@components/common/Box'
import Text from '@components/common/Text'
import _ from 'lodash'
import { Pressable } from 'react-native'

import UserEditCategoryColor from '@screens/Settings/EditCategoryWizard/UserEditCategoryColor'

type Props = {
    color: string,
    setParentColor: Dispatch<SetStateAction<string>>,
    copyIsMeeting: boolean,
    setParentCopyIsMeeting: Dispatch<SetStateAction<boolean>>,
    copyIsExternalMeeting: boolean,
    setParentCopyIsExternalMeeting: Dispatch<SetStateAction<boolean>>,
    defaultIsMeeting: boolean,
    setParentDefaultIsMeeting: Dispatch<SetStateAction<boolean>>,
    defaultIsExternalMeeting: boolean,
    setParentDefaultIsExternalMeeting: Dispatch<SetStateAction<boolean>>,
    defaultMeetingModifiable: boolean,  
    setParentDefaultMeetingModifiable: Dispatch<SetStateAction<boolean>>,
    defaultExternalMeetingModifiable: boolean,
    setParentDefaultExternalMeetingModifiable: Dispatch<SetStateAction<boolean>>,
}

function EditCategoryStep5(props: Props) {
    const [copyIsMeeting, setCopyIsMeeting] = useState<boolean>(props?.copyIsMeeting ?? false)
    const [copyIsExternalMeeting, setCopyIsExternalMeeting] = useState<boolean>(props?.copyIsExternalMeeting ?? false)
    const [defaultIsMeeting, setDefaultIsMeeting] = useState<boolean>(props?.defaultIsMeeting ?? false)
    const [defaultIsExternalMeeting, setDefaultIsExternalMeeting] = useState<boolean>(props?.defaultIsExternalMeeting ?? false)
    const [color, setColor] = useState<string>(props?.color)
    const [enableSelectColor, setEnableSelectColor] = useState<boolean>(false)
    const [defaultMeetingModifiable, setDefaultMeetingModifiable] = useState<boolean>(props?.defaultMeetingModifiable ?? false)
    const [defaultExternalMeetingModifiable, setDefaultExternalMeetingModifiable] = useState<boolean>(props?.defaultExternalMeetingModifiable ?? false)
    const [isMessage1, setIsMessage1] = useState<boolean>(false)
    const [isMessage2, setIsMessage2] = useState<boolean>(false)
    const [isMessage3, setIsMessage3] = useState<boolean>(false)
    const [isMessage4, setIsMessage4] = useState<boolean>(false)
    const [isMessage5, setIsMessage5] = useState<boolean>(false)
    
    const setParentCopyIsMeeting = props?.setParentCopyIsMeeting
    const setParentCopyIsExternalMeeting = props?.setParentCopyIsExternalMeeting
    const setParentDefaultIsMeeting = props?.setParentDefaultIsMeeting
    const setParentDefaultIsExternalMeeting = props?.setParentDefaultIsExternalMeeting
    const setParentColor = props?.setParentColor
    const setParentDefaultMeetingModifiable = props?.setParentDefaultMeetingModifiable
    const setParentDefaultExternalMeetingModifiable = props?.setParentDefaultExternalMeetingModifiable
    
    const changeCopyIsMeeting = (value: boolean) => {
        setCopyIsMeeting(value)
        setParentCopyIsMeeting(value)
    }
    
    const changeCopyIsExternalMeeting = (value: boolean) => {
        setCopyIsExternalMeeting(value)
        setParentCopyIsExternalMeeting(value)
    }
    
    const changeDefaultIsMeeting = (value: boolean) => {
        setDefaultIsMeeting(value)
        setParentDefaultIsMeeting(value)
    }
    
    const changeDefaultIsExternalMeeting = (value: boolean) => {
        setDefaultIsExternalMeeting(value)
        setParentDefaultIsExternalMeeting(value)
    }
    
    const changeColor = (value: string) => {
        setColor(value)
        setParentColor(value)
    }

    const changeDefaultMeetingModifiable = (value: boolean) => {
        setDefaultMeetingModifiable(value)
        setParentDefaultMeetingModifiable(value)
    }

    const changeDefaultExternalMeetingModifiable = (value: boolean) => {
        setDefaultExternalMeetingModifiable(value)
        setParentDefaultExternalMeetingModifiable(value)
    }
    
    if (enableSelectColor) {
        return (
            <UserEditCategoryColor
                color={color}
                setParentColor={changeColor}
                setParentEnableSelectColor={setEnableSelectColor}
            />
        )
    }

    return (
        <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%' }}>
            <Box flex={1} style={{ width: '90%' }} m={{ phone: 's', tablet: 'm' }}> 
                <Box style={{ width: '100%' }} flexDirection="row" justifyContent="flex-start" alignItems="center">  
                    <Text variant="optionHeader">Select color for any new events with the given tag</Text>
                </Box>
                <Box style={{ width: '100%' }} flexDirection="row" justifyContent="flex-end" alignItems="center"> 
                    <Pressable onPress={() => setEnableSelectColor(true)}>
                        <ColorSwatch color={color} selected={true} />
                    </Pressable>
                </Box>
            </Box>
            <Box flex={1} style={{ width: '90%' }} m={{ phone: 's', tablet: 'm' }}>
                <Box flexDirection="row" justifyContent="flex-start" alignItems="center">
                    <Hint visible={isMessage1} message={'Event will be tagged with Meeting topic (if exists) and settings for the tag will be applied to the event. Note: training settings override tag settings for schedule assists in case of overlap.'} color={Colors.purple} onBackgroundPress={() => setIsMessage1(false)}>
                        <Pressable onPress={() => setIsMessage1(!isMessage1)}>
                            <Text variant="optionHeader">Copy over 'meeting type' value to any new event whose details have similar context to a past event and given tag for scheduling assists?</Text>
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
                    <Hint visible={isMessage2} message={'Tag with External Meeting topic (if available) is a meeting with contact outside the organization. Event will be tagged with external meeting topic and settings for the tag will be applied to the event. Note: training settings override tag settings for schedule assists in case of overlap.'} color={Colors.purple} onBackgroundPress={() => setIsMessage2(false)}>
                        <Pressable onPress={() => setIsMessage2(!isMessage2)}>
                            <Text variant="optionHeader">Copy over 'external meeting type' value to any new event whose details have similar context  to a past event and given tag (meeting with a contact outside the organization) for scheduling assists? </Text>
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
                    <Text variant="optionHeader">Classify any new events with the given tag as 'meeting type' event for scheduling assists? </Text>
                </Box>
                <Box flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }}>
                    <Switch
                        onColor={Colors.purple30}
                        offColor={Colors.purple60}
                        value={defaultIsMeeting}
                        onValueChange={changeDefaultIsMeeting}
                        style={{ marginBottom: 20 }}
                    />
                </Box>
            </Box>
            <Box flex={1} style={{ width: '90%' }} m={{ phone: 's', tablet: 'm' }}>
                <Box flexDirection="row" justifyContent="flex-start" alignItems="center">
                    <Text variant="optionHeader">Classify any new events with the given tag as 'external meeting type' event (meeting with a contact outside the organization) for scheduling assists? </Text>
                </Box>
                <Box flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }}>
                    <Switch
                        onColor={Colors.purple30}
                        offColor={Colors.purple60}
                        value={defaultIsExternalMeeting}
                        onValueChange={changeDefaultIsExternalMeeting}
                        style={{ marginBottom: 20 }}
                    />
                </Box>
            </Box>
            <Box flex={1} style={{ width: '90%' }} m={{ phone: 's', tablet: 'm' }}>
                <Box flexDirection="row" justifyContent="flex-start" alignItems="center">
                    <Text variant="optionHeader">By default lock (make static) any new events that are classified as 'meeting type' event with the given tag for scheduling assists? </Text>
                </Box>
                <Box flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }}>
                    <Switch
                        onColor={Colors.purple30}
                        offColor={Colors.purple60}
                        value={defaultMeetingModifiable}
                        onValueChange={changeDefaultMeetingModifiable}
                        style={{ marginBottom: 20 }}
                    />
                </Box>
            </Box>
            <Box flex={1} style={{ width: '90%' }} m={{ phone: 's', tablet: 'm' }}>
                <Box flexDirection="row" justifyContent="flex-start" alignItems="center">
                    <Text variant="optionHeader">By default lock (make static) any new events that are classified as 'external meeting type' event with the given tag for scheduling assists? </Text>
                </Box>
                <Box flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }}>
                    <Switch
                        onColor={Colors.purple30}
                        offColor={Colors.purple60}
                        value={defaultExternalMeetingModifiable}
                        onValueChange={changeDefaultExternalMeetingModifiable}
                        style={{ marginBottom: 20 }}
                    />
                </Box>
            </Box>
        </Box>
    )
}

export default EditCategoryStep5
