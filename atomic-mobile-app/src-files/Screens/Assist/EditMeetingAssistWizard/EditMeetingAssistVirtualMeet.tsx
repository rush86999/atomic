import React, {
    useState,
    Dispatch,
    SetStateAction,
  } from 'react'
  import { Colors, Switch } from 'react-native-ui-lib'
  
  import Box from '@components/common/Box'
  import Text from '@components/common/Text'
  import { ConferenceAppType } from '@app/dataTypes/MeetingAssistType'

type Props = {
    isZoomAvailable: boolean,
    isGoogleMeetAvailable: boolean,
    zoomMeet: boolean,
    googleMeet: boolean,
    enableConference: boolean,
    setParentZoomMeet: Dispatch<SetStateAction<boolean>>,
    setParentGoogleMeet: Dispatch<SetStateAction<boolean>>,
    setParentEnableConference: Dispatch<SetStateAction<boolean>>,
    setParentConferenceApp: Dispatch<SetStateAction<ConferenceAppType | null>>,
}

function EditMeetingAssistVirtualMeet(props: Props) {
    const [zoomMeet, setZoomMeet] = useState<boolean>(props?.zoomMeet)
    const [googleMeet, setGoogleMeet] = useState<boolean>(props?.googleMeet)
    const [enableConference, setEnableConference] = useState<boolean>(props?.enableConference)
    const [notAvailable, setNotAvailable] = useState<boolean>(false)

    const isZoomAvailable = props?.isZoomAvailable
    const isGoogleMeetAvailable = props?.isGoogleMeetAvailable
    const setParentZoomMeet = props?.setParentZoomMeet
    const setParentGoogleMeet = props?.setParentGoogleMeet
    const setParentConferenceApp = props?.setParentConferenceApp

    const onEnableVirtual = (value: boolean) => {
        setEnableConference(value)
    
        if (!isZoomAvailable && !isGoogleMeetAvailable) {
          setNotAvailable(true)
          setParentConferenceApp(null)
        } else {
          setNotAvailable(false)
        }
    
        if (value === false) {
          setParentConferenceApp(null)
        }
      }
    
      const onZoomMeet = (value: boolean) => {
        setZoomMeet(value)
        setParentZoomMeet(value)
        setGoogleMeet(!value)
        setParentGoogleMeet(!value)
    
        if (value) {
          setParentConferenceApp('zoom')
        } else {
          setParentConferenceApp('google')
        }
      }
    
      const onGoogleMeet = (value: boolean) => {
        setGoogleMeet(value)
        setParentGoogleMeet(value)
        setZoomMeet(!value)
        setParentZoomMeet(!value)
        if (value) {
          setParentConferenceApp('google')
        } else {
          setParentConferenceApp('zoom')
        }
        
      }

      return (
        <Box flex={1} justifyContent="center" alignItems="center">
          <Box m={{ phone: 's', tablet: 'm' }}>
            <Text variant="optionHeader" mt={{ phone: 's', tablet: 'm' }}>
              Enable a virtual meeting for this event?
            </Text>
            <Box flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }}>
              <Switch
                onColor={Colors.purple30}
                offColor={Colors.purple60}
                value={enableConference}
                onValueChange={onEnableVirtual}
                style={{marginBottom: 20}}
              />
            </Box>
          </Box>
          <Box>
            {
              notAvailable
              ? (
                <Box>
                  <Text variant="subheader">
                    3rd party providers are not enabled. Please enable either zoom or google to use this feature.
                  </Text>
                </Box>
              ) : (
                <Box>
                  {
                    enableConference
                    ? (
                      <Box>
                        <Box>
                          {
                            isZoomAvailable
                            ? (
                              <Box>
                                <Box m={{ phone: 's', tablet: 'm' }}>
                                  <Text variant="optionHeader" mt={{ phone: 's', tablet: 'm' }}>
                                    Enable a Zoom Meeting for this event?
                                  </Text>
                                  <Box flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }}>
                                    <Switch
                                      onColor={Colors.purple30}
                                      offColor={Colors.purple60}
                                      value={zoomMeet}
                                      onValueChange={onZoomMeet}
                                      style={{marginBottom: 20}}
                                    />
                                  </Box>
                                </Box>
                                <Box>
                                </Box>
                              </Box>
                            ): null
                          }
                        </Box>
                        <Box>
                          {
                            isGoogleMeetAvailable
                            ? (
                              <Box m={{ phone: 's', tablet: 'm' }}>
                                <Text variant="optionHeader" mt={{ phone: 's', tablet: 'm' }}>
                                  Enable a Google Meet for this event?
                                </Text>
                                <Box flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }}>
                                  <Switch
                                    onColor={Colors.purple30}
                                    offColor={Colors.purple60}
                                    value={googleMeet}
                                    onValueChange={onGoogleMeet}
                                    style={{marginBottom: 20}}
                                  />
                                </Box>
                              </Box>
                            ) : null
                          }
                        </Box>
                      </Box>
                    ) : null
                  }
                </Box>
              )
            }
          </Box>
        </Box>
      )
}

export default EditMeetingAssistVirtualMeet




