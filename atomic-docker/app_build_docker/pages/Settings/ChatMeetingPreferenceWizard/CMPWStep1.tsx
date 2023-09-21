import React, { useEffect, useState, Dispatch, SetStateAction } from 'react'
import { colorsPalette as Colors } from '@lib/theme/colorsPalette'
import { Tooltip } from '@chakra-ui/react'
 import Switch1 from '@components/Switch'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import TextField from '@components/TextField'
import _ from 'lodash'
import { SendUpdatesType, VisibilityType } from '@lib/calendarLib/types'
import { TransparencyType } from '@lib/calendarLib/types';

const sendUpdatesOptions = [
    { label: 'All', value: 'all' },
    { label: 'External Only', value: 'externalOnly'},
    { label: 'None', value: 'none'}
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
import { backendConfig } from '@config/backendConfig'
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
    sendUpdates: SendUpdatesType,
    guestsCanInviteOthers: boolean,
    transparency: TransparencyType,
    visibility: VisibilityType,
    name: string,
    setParentSendUpdates: Dispatch<SetStateAction<SendUpdatesType>>,
    setParentGuestsCanInviteOthers: Dispatch<SetStateAction<boolean>>,
    setParentTransparency: Dispatch<SetStateAction<TransparencyType>>,
    setParentVisibility: Dispatch<SetStateAction<VisibilityType>>,
    setParentName: Dispatch<SetStateAction<string>>,
}

function CMPWStep1(props: Props) {
    const [sendUpdates, setSendUpates] = useState<SendUpdatesType>(props?.sendUpdates)
    const [guestsCanInviteOthers, setGuestsCanInviteOthers] = useState<boolean>(props?.guestsCanInviteOthers)
    const [transparency, setTransparency] = useState<TransparencyType>(props?.transparency)
    const [visibility, setVisibility] = useState<VisibilityType>(props?.visibility)
    const [name, setName] = useState<string>(props?.name)


    useEffect(() => {
        if (name !== props?.name) {
          setName(props?.name)
        }
    }, [name, props?.name])

    const setParentSendUpdates = props?.setParentSendUpdates
    const setParentGuestsCanInviteOthers = props?.setParentGuestsCanInviteOthers
    const setParentTransparency = props?.setParentTransparency
    const setParentVisibility = props?.setParentVisibility
    const setParentName = props?.setParentName

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

    const changeName = (e: { target: { value: React.SetStateAction<string> } }) => {
        setName(e?.target?.value)
        setParentName(e?.target?.value)
    }

    return (
        <Box flex={1} justifyContent="center" alignItems="center" minHeight="65vh" maxHeight="65vh" width="100%">
          <Box flex={1} pt={{ phone: 'l', tablet: 'xl' }} flexDirection="row" justifyContent="flex-start" alignItems="center" style={{ width: '70%' }}>
            <TextField
                  label="Name"
                  placeholder="John Doe"
                  onChange={changeName}
                  value={name}
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
            <Box flexDirection="row" justifyContent="flex-end" alignItems="center" pt={{ phone: 'm', tablet: 's' }}>
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
            <Box flexDirection="row" justifyContent="flex-start" alignItems="center">
                <Tooltip label='Should it block time on your calendar' aria-label='A tooltip' bg='purple.700' color='white'>
                  <Text variant="buttonLink">
                      Will the event be transparent?
                  </Text>
                </Tooltip>
            </Box>
            <Box flexDirection="row" justifyContent="flex-end" alignItems="center">
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

export default CMPWStep1


