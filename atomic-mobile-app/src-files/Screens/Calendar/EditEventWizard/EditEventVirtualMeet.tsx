import React, {
  useState,
  Dispatch,
  SetStateAction,
 } from 'react'

import { Colors, Switch } from 'react-native-ui-lib'
import Box from '@components/common/Box'
import Text from '@components/common/Text'

type Props = {
  isZoomAvailable: boolean,
  isGoogleMeetAvailable: boolean,
  zoomMeet: boolean,
  googleMeet: boolean,
  setParentZoomMeet: Dispatch<SetStateAction<boolean>>,
  setParentGoogleMeet: Dispatch<SetStateAction<boolean>>,
  zoomPrivateMeeting: boolean,
  setParentZoomPrivateMeeting: Dispatch<SetStateAction<boolean>>,
}

function EditEventVirtualMeet(props: Props) {
  const [zoomMeet, setZoomMeet] = useState<boolean>(props?.zoomMeet)
  const [googleMeet, setGoogleMeet] = useState<boolean>(props?.googleMeet)
  const [zoomPrivateMeeting, setZoomPrivateMeeting] = useState<boolean>(false)
  const [enableVirtual, setEnableVirtual] = useState<boolean>(false)
  const [notAvailable, setNotAvailable] = useState<boolean>(false)

  const isZoomAvailable = props?.isZoomAvailable
  const isGoogleMeetAvailable = props?.isGoogleMeetAvailable
  const setParentZoomMeet = props?.setParentZoomMeet
  const setParentGoogleMeet = props?.setParentGoogleMeet
  const setParentZoomPrivateMeeting = props?.setParentZoomPrivateMeeting

  const onEnableVirtual = (value: boolean) => {
    setEnableVirtual(value)

    if (!isZoomAvailable && !isGoogleMeetAvailable) {
      setNotAvailable(true)
    } else {
      setNotAvailable(false)
    }
  }

  const onZoomMeet = (value: boolean) => {
    setZoomMeet(value)
    setParentZoomMeet(value)
    setGoogleMeet(!value)
    setParentGoogleMeet(!value)
  }

  const onGoogleMeet = (value: boolean) => {
    setGoogleMeet(value)
    setParentGoogleMeet(value)
    setZoomMeet(!value)
    setParentZoomMeet(!value)
  }

  const onPrivateZoomMeeting = (value: boolean) => {
    setZoomPrivateMeeting(value)
    setParentZoomPrivateMeeting(value)
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
            value={enableVirtual}
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
                enableVirtual
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
                              {
                                zoomMeet
                                ? (
                                  <Box>
                                    <Box m={{ phone: 's', tablet: 'm' }}>
                                      <Text variant="optionHeader" mt={{ phone: 's', tablet: 'm' }}>
                                        Make this Zoom Meeting private?
                                      </Text>
                                      <Box flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }}>
                                        <Switch
                                          onColor={Colors.purple30}
                                          offColor={Colors.purple60}
                                          value={zoomPrivateMeeting}
                                          onValueChange={onPrivateZoomMeeting}
                                          style={{marginBottom: 20}}
                                        />
                                      </Box>
                                    </Box>
                                  </Box>
                                ) : null
                              }
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

export default EditEventVirtualMeet

/** end */
