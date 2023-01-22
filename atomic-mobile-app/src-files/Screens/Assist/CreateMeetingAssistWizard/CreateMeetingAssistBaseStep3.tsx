import React, { useEffect, useState, Dispatch, SetStateAction } from 'react'
import { Appearance, Pressable } from 'react-native'
import { Switch, Colors, TextField, Picker, PickerValue, Hint } from 'react-native-ui-lib'

import Box from '@components/common/Box'
import Text from '@components/common/Text'
import { palette } from '@theme/theme'
import _ from 'lodash'


const dark = Appearance.getColorScheme() === 'dark'

const sendUpdatesOptions = [
    { label: 'All', value: 'all' },
    { label: 'External Only', value: 'externalOnly'}
]

const transparencyOptions = [
    { label: 'Opaque', value: 'opaque' },
    { label: 'Transparent', value: 'transparent' }
]

const visibilityOptions = [
    { label: 'Default', value: 'default' },
    { label: 'Public', value: 'public' },
    { label: 'Private', value: 'private' }
]

type Props = {
    sendUpdates: 'all' | 'externalOnly',
    guestsCanInviteOthers: boolean,
    transparency: 'opaque' | 'transparent',
    visibility: 'default' | 'public' | 'private',
    hostName: string,
    setParentSendUpdates: Dispatch<SetStateAction<'all' | 'externalOnly'>>,
    setParentGuestsCanInviteOthers: Dispatch<SetStateAction<boolean>>,
    setParentTransparency: Dispatch<SetStateAction<'opaque' | 'transparent'>>,
    setParentVisibility: Dispatch<SetStateAction<'default' | 'public' | 'private'>>,
    setParentHostName: Dispatch<SetStateAction<string>>,
}

function CreateMeetingAssistBaseStep3(props: Props) {
    const [sendUpdates, setSendUpates] = useState<'all' | 'externalOnly'>(props?.sendUpdates)
    const [guestsCanInviteOthers, setGuestsCanInviteOthers] = useState<boolean>(props?.guestsCanInviteOthers)
    const [transparency, setTransparency] = useState<'opaque' | 'transparent'>(props?.transparency)
    const [visibility, setVisibility] = useState<'default' | 'public' | 'private'>(props?.visibility)
    const [isMessage, setIsMessage] = useState<boolean>(false)
    const [hostName, setHostName] = useState<string>(props?.hostName)
    const [isMessage1, setIsMessage1] = useState<boolean>(false)
    const [isMessage2, setIsMessage2] = useState<boolean>(false)

    useEffect(() => {
      if (hostName !== props?.hostName) {
        setHostName(props?.hostName)
      }
    }, [])

    const setParentSendUpdates = props?.setParentSendUpdates
    const setParentGuestsCanInviteOthers = props?.setParentGuestsCanInviteOthers
    const setParentTransparency = props?.setParentTransparency
    const setParentVisibility = props?.setParentVisibility
    const setParentHostName = props?.setParentHostName

    const changeSendUpdates = (value: 'all' | 'externalOnly') => {
        setSendUpates(value)
        setParentSendUpdates(value)
    }

    const changeGuestsCanInviteOthers = (value: boolean) => {
        setGuestsCanInviteOthers(value)
        setParentGuestsCanInviteOthers(value)
    }

    const changeTransparency = (value: 'opaque' | 'transparent') => {
        setTransparency(value)
        setParentTransparency(value)
    }

    const changeVisibility = (value: 'default' | 'public' | 'private') => {
        setVisibility(value)
        setParentVisibility(value)
    }

    const changeHostName = (value: string) => {
      setHostName(value)
      setParentHostName(value)
    }

    return (
        <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%' }}>
           <Box flex={1} pt={{ phone: 'l', tablet: 'xl' }} flexDirection="row" justifyContent="flex-start" alignItems="center" style={{ width: '90%'}}>
                <Box  style={{ width: '60%'}}>
                    <TextField
                        title="Host Name"
                        placeholder="John Doe"
                        onChangeText={changeHostName}
                        value={hostName}
                        style={{ width: '100%'}}
                    />
                </Box>
            </Box>
            <Box flex={1} mt={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="flex-start" style={{ width: '90%' }}>
              <Box flexDirection="row" justifyContent="flex-start" alignItems="center" style={{ width: '100%' }}>
                <Hint visible={isMessage} message={'Google calendar option on who to notify - Google users vs non-Google users'} color={Colors.purple} onBackgroundPress={() => setIsMessage(false)}>
                    <Pressable onPress={() => setIsMessage(!isMessage)}>
                      <Box  mt={{ phone: 's', tablet: 'm' }}>
                          <Text variant="buttonLink">
                              Select who should receive updates
                          </Text>
                          <Text variant="buttonLink">
                              for event changes?
                          </Text>
                      </Box>
                    </Pressable>
                </Hint>
              </Box>
              <Box flexDirection="row" justifyContent="flex-end" alignItems="center"  style={{ width: '90%' }}>
                <Picker
                  modal
                  style={{ color: dark ? palette.white : palette.textBlack }}
                  placeholder="Send updates to..."
                  useNativePicker
                  migrateTextField
                  value={sendUpdates}
                  onChange={(itemValue: PickerValue) => {
                    
                    changeSendUpdates(itemValue as 'all' | 'externalOnly')
                  }}
                >
                    {_.map(sendUpdatesOptions, option => (
                      <Picker.Item
                        key={option.value}
                        label={option.label}
                        value={option.value}
                      />
                    ))}
                </Picker>
              </Box>
            </Box>
            <Box m={{ phone: 's', tablet: 'm' }} style={{ width: '90%' }}>
              <Box flexDirection="row" justifyContent="flex-start" mt={{ phone: 's', tablet: 'm' }} style={{ width: '100%' }}>
                  <Text variant="optionHeader">
                      Can Guests invite others?
                  </Text>
                </Box>
                <Box flexDirection="row" justifyContent="flex-end" style={{ width: '90%' }}>
                    <Switch
                        onColor={Colors.purple30}
                        offColor={Colors.purple60}
                        value={guestsCanInviteOthers}
                        onValueChange={changeGuestsCanInviteOthers}
                        style={{marginBottom: 20}}
                    />
                </Box>
            </Box>
            <Box flex={1} m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center" style={{ width: '90%' }}>
              <Box flexDirection="row" justifyContent="flex-start" alignItems="center" style={{ width: '100%' }}>
                <Hint visible={isMessage1} message={'Should it block time on your calendar'} color={Colors.purple} onBackgroundPress={() => setIsMessage(false)}>
                    <Pressable onPress={() => setIsMessage1(!isMessage1)}> 
                        <Text variant="buttonLink">
                            Will the event be transparent?
                        </Text>
                    </Pressable>
                </Hint>
              </Box>
              <Box flexDirection="row" justifyContent="flex-end" alignItems="center"  style={{ width: '90%' }}>
                <Picker
                  modal
                  style={{ color: dark ? palette.white : palette.textBlack }}
                  placeholder="transparency"
                  useNativePicker
                  migrateTextField
                  value={transparency}
                  onChange={(itemValue: PickerValue) => {
                    
                    changeTransparency(itemValue as 'opaque' | 'transparent')
                  }}
                >
                    {_.map(transparencyOptions, option => (
                      <Picker.Item
                        key={option.value}
                        label={option.label}
                        value={option.value}
                      />
                    ))}
                </Picker>
              </Box>
            </Box>
            <Box flex={1} m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center" style={{ width: '90%' }}>
            <Box flexDirection="row" justifyContent="flex-start" alignItems="center" style={{ width: '100%' }}>
                <Hint visible={isMessage2} message={'Who can see the details of the event - anyone or just attendees'} color={Colors.purple} onBackgroundPress={() => setIsMessage(false)}>
                    <Pressable onPress={() => setIsMessage2(!isMessage2)}> 
                        <Text variant="buttonLink">
                            Who can see this event?
                        </Text>
                    </Pressable>
                </Hint>
              </Box>
              <Box flexDirection="row" justifyContent="flex-end" alignItems="center"  style={{ width: '90%' }}>
                <Picker
                  modal
                  style={{ color: dark ? palette.white : palette.textBlack }}
                  placeholder="visibility..."
                  useNativePicker
                  migrateTextField
                  value={visibility}
                  onChange={(itemValue: PickerValue) => {
                    
                    changeVisibility(itemValue as 'default' | 'public' | 'private')
                  }}
                >
                    {_.map(visibilityOptions, option => (
                      <Picker.Item
                        key={option.value}
                        label={option.label}
                        value={option.value}
                      />
                    ))}
                </Picker>
              </Box>
            </Box>
        </Box>
    )

}


export default CreateMeetingAssistBaseStep3

