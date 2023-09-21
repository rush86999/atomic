import React, {
  useState,
  Dispatch,
  SetStateAction,
 } from 'react'

import Switch1 from '@components/Switch'
import Box from '@components/common/Box'
import Text from '@components/common/Text'

import { NextApiRequest, NextApiResponse } from 'next';
import supertokensNode from 'supertokens-node'
import { backendConfig } from '../../../config/backendConfig'
import Session from 'supertokens-node/recipe/session'

export async function getServerSideProps({ req, res }: { req: NextApiRequest, res: NextApiResponse }) {
  // Notice how the server uses `API` from `withSSRContext`, instead of the top-level `API`.
  // const SSR = withSSRContext({ req })
  // this runs on the backend, so we must call init on supertokens-node SDK
  supertokensNode.init(backendConfig())
  let session
  try {
    session = await Session.getSession(req, res, {
      overrideGlobalClaimValidators: async function () {
        return []
      },
    })
  } catch (err: any) {
    if (err.type === Session.Error.TRY_REFRESH_TOKEN) {
      return { props: { fromSupertokens: 'needs-refresh' } }
    } else if (err.type === Session.Error.UNAUTHORISED) {
      // this will force the frontend to try and refresh which will fail
      // clearing all cookies and redirecting the user to the login screen.
      return { props: { fromSupertokens: 'needs-refresh' } }
    }
    throw err
  }

  if (!session?.getUserId()) {
    return {
      redirect: {
        destination: '/User/Login/UserLogin',
        permanent: false,
      },
    }
  }

  return {
    props: {
      sub: session.getUserId(),
    }
  }
}

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

function CreateEventVirtualMeet(props: Props) {
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
      <Box p={{ phone: 's', tablet: 'm' }}>
        <Text variant="optionHeader" pt={{ phone: 'm', tablet: 's' }}>
          Enable a virtual meeting for this event?
        </Text>
        <Box flexDirection="row" justifyContent="flex-end" pt={{ phone: 'm', tablet: 's' }}>
          <Switch1
            checked={enableVirtual}
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
                            <Box p={{ phone: 's', tablet: 'm' }}>
                              <Text variant="optionHeader" pt={{ phone: 'm', tablet: 's' }}>
                                Enable a Zoom Meeting for this event?
                              </Text>
                              <Box flexDirection="row" justifyContent="flex-end" pt={{ phone: 'm', tablet: 's' }}>
                                <Switch1
                                  checked={zoomMeet}
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
                                    <Box p={{ phone: 's', tablet: 'm' }}>
                                      <Text variant="optionHeader" pt={{ phone: 'm', tablet: 's' }}>
                                        Make this Zoom Meeting private?
                                      </Text>
                                      <Box flexDirection="row" justifyContent="flex-end" pt={{ phone: 'm', tablet: 's' }}>
                                        <Switch1
                                          checked={zoomPrivateMeeting}
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
                          <Box p={{ phone: 's', tablet: 'm' }}>
                            <Text variant="optionHeader" pt={{ phone: 'm', tablet: 's' }}>
                              Enable a Google Meet for this event?
                            </Text>
                            <Box flexDirection="row" justifyContent="flex-end" pt={{ phone: 'm', tablet: 's' }}>
                              <Switch1
                                checked={googleMeet}
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

export default CreateEventVirtualMeet

/** end */
