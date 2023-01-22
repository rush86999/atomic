import React, {
  useState,
  Dispatch,
  SetStateAction,
} from 'react'
import { Colors, ColorSwatch, Switch } from 'react-native-ui-lib'

import Box from '@components/common/Box'
import Text from '@components/common/Text'
import EditBreakPreferenceColor from '@screens/Settings/UserPreferenceWizard/EditBreakPreferenceColor'
import { Pressable, ScrollView } from 'react-native'

const INITIAL_COLOR = Colors.blue30

type Props = {
    copyIsMeeting: boolean,
    copyIsExternalMeeting: boolean,
    copyColor: boolean,
    backToBackMeetings: boolean,
    breakColor: string,
    setParentCopyIsMeeting: Dispatch<SetStateAction<boolean>>,
    setParentCopyIsExternalMeeting: Dispatch<SetStateAction<boolean>>,
    setParentCopyColor: Dispatch<SetStateAction<boolean>>,
    setParentBackToBackMeetings: Dispatch<SetStateAction<boolean>>,
    setParentBreakColor: Dispatch<SetStateAction<string>>,
}

function EditPreferenceStep6(props: Props) {
    const [copyIsMeeting, setCopyIsMeeting] = useState<boolean>(props?.copyIsMeeting)
    const [copyIsExternalMeeting, setCopyIsExternalMeeting] = useState<boolean>(props?.copyIsExternalMeeting)
    const [copyColor, setCopyColor] = useState<boolean>(props?.copyColor)
    const [backToBackMeetings, setBackToBackMeetings] = useState<boolean>(props?.backToBackMeetings)
    const [breakColor, setBreakColor] = useState<string>(props?.breakColor || INITIAL_COLOR)
    const [enableSelectColor, setEnableSelectColor] = useState<boolean>(false)
    
    const setParentCopyIsMeeting = props?.setParentCopyIsMeeting
    const setParentCopyIsExternalMeeting = props?.setParentCopyIsExternalMeeting
    const setParentCopyColor = props?.setParentCopyColor
    const setParentBackToBackMeetings = props?.setParentBackToBackMeetings
    const setParentBreakColor = props?.setParentBreakColor
    
    const changeCopyIsMeeting = (value: boolean) => {
        setCopyIsMeeting(value)
        setParentCopyIsMeeting(value)
    }
    
    const changeCopyIsExternalMeeting = (value: boolean) => {
        setCopyIsExternalMeeting(value)
        setParentCopyIsExternalMeeting(value)
    }
    
    const changeCopyColor = (value: boolean) => {
        setCopyColor(value)
        setParentCopyColor(value)
    }

    const changeBackToBackMeetings = (value: boolean) => {
        setBackToBackMeetings(value)
        setParentBackToBackMeetings(value)
    }

    const changeBreakColor = (value: string) => {
        setBreakColor(value)
        setParentBreakColor(value)
    }

    if (enableSelectColor) {
        return (
            <EditBreakPreferenceColor
                breakColor={breakColor}
                setParentBreakColor={changeBreakColor}
                setParentEnableSelectColor={setEnableSelectColor}
            />
        )
    }
    
    return (
        <Box flex={1} justifyContent="center" alignItems="center">
          <ScrollView style={{ width: '100%' }} contentContainerStyle={{ width: '100%', justifyContent: 'center', alignItems: 'center' }}>
              <Box flex={1} style={{ width: '90%' }} m={{ phone: 's', tablet: 'm' }}>
                  <Box style={{ width: '100%' }} flexDirection="row" justifyContent="flex-start" alignItems="center">  
                      <Text variant="optionHeader">Select color for any new events classified as a 'break type' event</Text>
                  </Box>
                  <Box style={{ width: '100%' }} flexDirection="row" justifyContent="flex-end" alignItems="center">  
                      <Pressable onPress={() => setEnableSelectColor(true)}>
                          <ColorSwatch color={breakColor} selected={true} />
                      </Pressable>
                  </Box>
              </Box>
              <Box flex={1} style={{ width: '90%' }} m={{ phone: 's', tablet: 'm' }}>
                  <Box style={{ width: '100%' }} flexDirection="row" justifyContent="flex-start" alignItems="center">  
                      <Text variant="optionHeader">Enable back-to-back meetings with no breaks for scheduling assists? </Text>
                  </Box>
                  <Box style={{ width: '100%' }} flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }}>
                      <Switch
                          onColor={Colors.purple30}
                          offColor={Colors.purple60}
                          value={backToBackMeetings}
                          onValueChange={changeBackToBackMeetings}
                      />
                  </Box>
              </Box>
              <Box flex={1} style={{ width: '90%' }} m={{ phone: 's', tablet: 'm' }}>
                  <Box style={{ width: '100%' }} flexDirection="row" justifyContent="flex-start" alignItems="center"> 
                      <Text variant="optionHeader">Classify any new events whose details are similar as a 'meeting type event' for scheduling assists? </Text>
                  </Box>
                  <Box style={{ width: '100%' }} flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }}>
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
                  <Box style={{ width: '100%' }} flexDirection="row" justifyContent="flex-start" alignItems="center">  
                      <Text variant="optionHeader">Classify any new events whose details are similar as an 'external meeting type event' (meeting with a contact outside the organization) for scheduling assists? </Text>
                  </Box>
                  <Box style={{ width: '100%' }} flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }}>
                      <Switch
                          onColor={Colors.purple30}
                          offColor={Colors.purple60}
                          value={copyIsExternalMeeting}
                          onValueChange={changeCopyIsExternalMeeting}
                          style={{ marginBottom: 20 }}
                      />
                  </Box>
              </Box>
              <Box flex={1} style={{ width: '90%' }}  m={{ phone: 's', tablet: 'm' }}>
                  <Box style={{ width: '100%' }} flexDirection="row" justifyContent="flex-start" alignItems="center">
                      <Text variant="optionHeader">Copy over background color to any new events whose details are similar? </Text>
                  </Box>
                  <Box style={{ width: '100%' }} flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }}>
                      <Switch
                          onColor={Colors.purple30}
                          offColor={Colors.purple60}
                          value={copyColor}
                          onValueChange={changeCopyColor}
                      />
                  </Box>
              </Box>
          </ScrollView>
        </Box>
    )
}

export default EditPreferenceStep6