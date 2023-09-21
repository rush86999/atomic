import React, { useEffect, useState, Dispatch, SetStateAction } from 'react'
import { Appearance, Pressable, StyleSheet } from 'react-native'
import { colorsPalette as Colors } from '@lib/theme/colorsPalette'
import { Tooltip } from '@chakra-ui/react'
 import Switch1 from '@components/Switch'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import TextField from '@components/TextField'
import { palette } from '@lib/theme/theme'
import _ from 'lodash'

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
    const [hostName, setHostName] = useState<string>(props?.hostName)


    useEffect(() => {
      if (hostName !== props?.hostName) {
        setHostName(props?.hostName)
      }
    }, [hostName, props?.hostName])

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

    const changeHostName = (e: { target: { value: React.SetStateAction<string> } }) => {
      setHostName(e?.target?.value)
      setParentHostName(e?.target?.value)
    }

    return (
        <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%' }} minHeight="65vh" maxHeight="65vh">
          <Box flex={1} pt={{ phone: 'l', tablet: 'xl' }} flexDirection="row" justifyContent="flex-start" alignItems="center" style={{ width: '90%' }}>
            <TextField
                  label="Host Name"
                  placeholder="John Doe"
                  onChange={changeHostName}
                  value={hostName}
                  style={{ width: '100%'}}
              />
          </Box>
          <Box flex={1} pt={{ phone: 'm', tablet: 's' }} flexDirection={{ tablet: "row"}} justifyContent="space-between" alignItems="center" width="70%">
            <Box flexDirection="row" justifyContent="flex-start" alignItems="center">

                <Tooltip label='Google calendar option on who to notify - Google users vs non-Google users' aria-label='A tooltip' bg='purple.700' color='white'>
                    <Box  pt={{ phone: 'm', tablet: 's' }}>
                        <Text variant="buttonLink">
                            Select who should receive updates
                        </Text>
                        <Text variant="buttonLink">
                            for event changes?
                        </Text>
                    </Box>
                </Tooltip>
            </Box>
            <Box flexDirection="row" justifyContent="flex-end" alignItems="center">

            <select value={sendUpdates} onChange={(e) => changeSendUpdates(e?.target?.value as "all" | "externalOnly")} className="select select-primary w-full max-w-xs">
                <option disabled selected>Send updates to...</option>
                {_.map(sendUpdatesOptions, option => (
                    <option
                      key={option.value}
                      value={option.value}
                    >{option.label}</option>
                  ))}
            </select>
             
            </Box>
          </Box>
          <Box flex={1} pt={{ phone: 'm', tablet: 's' }} flexDirection={{ tablet: "row"}} justifyContent="space-between" alignItems="center" width="70%">
            <Box flexDirection="row" justifyContent="flex-start" pt={{ phone: 'm', tablet: 's' }}>
              <Text variant="optionHeader">
                  Can Guests invite others?
              </Text>
            </Box>
            <Box flexDirection="row" justifyContent="flex-end">
                <Switch1
                    checked={guestsCanInviteOthers}
                    onValueChange={changeGuestsCanInviteOthers}
                    style={{marginBottom: 20}}
                />
            </Box>
          </Box>
          <Box flex={1} pt={{ phone: 'm', tablet: 's' }} flexDirection={{ tablet: "row"}} justifyContent="space-between" alignItems="center" width="70%">
            <Box flexDirection="row" justifyContent="flex-start" alignItems="center" >
                <Tooltip label='Should it block time on your calendar' aria-label='A tooltip' bg='purple.700' color='white'>
                  <Text variant="buttonLink">
                      Will the event be transparent?
                  </Text>
                </Tooltip>
            </Box>
            <Box flexDirection="row" justifyContent="flex-end" alignItems="center" >
              <select value={transparency} onChange={(e) => changeTransparency(e?.target?.value as 'opaque' | 'transparent')} className="select select-primary w-full max-w-xs">
                  <option disabled selected>transparency</option>
                  {_.map(transparencyOptions, option => (
                      <option
                        key={option.value}
                        value={option.value}
                      >{option.label}</option>
                    ))}
              </select>
            </Box>
          </Box>
          <Box flex={1} pt={{ phone: 'm', tablet: 's' }} flexDirection={{ tablet: "row"}} justifyContent="space-between" alignItems="center" width="70%">
            <Box flexDirection="row" justifyContent="flex-start" alignItems="center">
                <Tooltip label='Who can see the details of the event - anyone or just attendees' bg='purple.700' color='white'>
                  <Text variant="buttonLink">
                    Who can see this event?
                  </Text>
                </Tooltip>
            </Box>
            <Box flexDirection="row" justifyContent="flex-end" alignItems="center">
              <select value={visibility} onChange={(e) => changeVisibility(e?.target?.value as 'default' | 'public' | 'private')} className="select select-primary w-full max-w-xs">
                  <option disabled selected>visibility...</option>
                  {_.map(visibilityOptions, option => (
                      <option
                        key={option.value}
                        value={option.value}
                      >{option.label}</option>
                    ))}
              </select>
            </Box>
          </Box>
        </Box>

    )

}


export default CreateMeetingAssistBaseStep3

