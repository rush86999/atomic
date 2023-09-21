import React, {
    useState,
    Dispatch,
    SetStateAction,
} from 'react'
import Switch1 from '@components/Switch'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import TextField from '@components/TextField'
import _ from 'lodash'
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
    isBufferTime: boolean,
    beforeEventMinutes: number,
    afterEventMinutes: number,
    setParentIsBufferTime: Dispatch<SetStateAction<boolean>>,
    setParentBeforeEventMinutes: Dispatch<SetStateAction<number>>,
    setParentAfterEventMinutes: Dispatch<SetStateAction<number>>,
}

function CMPWStep4(props: Props) {
    const [isBufferTime, setIsBufferTime] = useState<boolean>(props?.isBufferTime)
    const [beforeEventMinutes, setBeforeEventMinutes] = useState<number>(props?.beforeEventMinutes)
    const [afterEventMinutes, setAfterEventMinutes] = useState<number>(props?.afterEventMinutes)

    const setParentIsBufferTime = props?.setParentIsBufferTime
    const setParentBeforeEventMinutes = props?.setParentBeforeEventMinutes
    const setParentAfterEventMinutes = props?.setParentAfterEventMinutes

    const changeIsBufferTime = (value: boolean) => {
        setIsBufferTime(value)
        setParentIsBufferTime(value)
    }

    const changeBeforeEventMinutes = (e: { target: { value: string } }) => {
        setBeforeEventMinutes(parseInt(e?.target?.value.replace(/[^0-9.]/g, ''), 10))
        setParentBeforeEventMinutes(parseInt(e?.target?.value.replace(/[^0-9.]/g, ''), 10))
    }

    const changeAfterEventMinutes = (e: { target: { value: string } }) => {
        setAfterEventMinutes(parseInt(e?.target?.value.replace(/[^0-9.]/g, ''), 10))
        setParentAfterEventMinutes(parseInt(e?.target?.value.replace(/[^0-9.]/g, ''), 10))
    }

    return (
        <Box flex={1} justifyContent="flex-start" alignItems="center" style={{ width: '100%' }} minHeight="65vh" maxHeight="65vh">
            <Box pt={{ phone: 'm', tablet: 's' }} flexDirection={{ tablet: "row"}} justifyContent="space-between" alignItems="flex-start" width="70%">
                <Box flexDirection={{ tablet: "row"}} justifyContent="flex-start">
                    <Text variant="optionHeader">
                        Do you want to add Buffer time to your event?
                    </Text>
                </Box>
                <Box flexDirection="row" justifyContent="flex-end" pt={{ phone: 's', tablet: 's' }}>
                    <Switch1
                        checked={isBufferTime}
                        onValueChange={changeIsBufferTime}
                        style={{marginBottom: 20}}
                    />
                </Box>
            </Box>
            <Box justifyContent="center" alignItems="center"  style={{ width: '100%' }}>
                {
                    isBufferTime 
                        ? (
                            <Box justifyContent="center" alignItems="center"  style={{ width: '100%' }}>
                                <Box pt={{ phone: 'm', tablet: 's' }} justifyContent="center" alignItems="center"  style={{ width: '100%' }}>
                                    <Box style={{ width: '100%' }} justifyContent="center" alignItems="center">
                                        <Box flexDirection={{ tablet: "row"}} justifyContent="space-between" alignItems="flex-start" width="70%">
                                           <Box>
                                                <Text variant="optionHeader">
                                                    Prep time before event: 
                                                </Text>
                                                <Text variant="greyComment">
                                                   30 min steps only
                                                </Text>
                                            </Box>
                                            <Box flexDirection="row" justifyContent="flex-end">
                                                <Box p={{ phone: 'm', tablet: 'm' }} />
                                                
                                                    <TextField
                                                        label="Minutes"
                                                        value={`${beforeEventMinutes}`}
                                                        onChange={changeBeforeEventMinutes}
                                                        type="number"
                                                        
                                                    />
                                                
                                            </Box>
                                        </Box>
                                    </Box>
                                    <Box style={{ width: '100%' }} justifyContent="center" alignItems="center">
                                        <Box flexDirection={{ tablet: "row"}} justifyContent="space-between" alignItems="flex-start" width="70%">
                                            <Box>
                                                <Text variant="optionHeader">
                                                    Review time after event:
                                                </Text>
                                                <Text variant="greyComment">
                                                   30 min steps only
                                                </Text>
                                            </Box>
                                            <Box flexDirection="row" justifyContent="flex-end">
                                                <Box p={{ phone: 'm', tablet: 'm' }} />
                                                
                                                    <TextField
                                                        label="Minutes"
                                                        value={`${afterEventMinutes}`}
                                                        onChange={changeAfterEventMinutes}
                                                        type="number"
                                                        
                                                    />
                                                
                                            </Box>
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        ) : null
                }
            </Box>
        </Box>
    )
}

export default CMPWStep4

