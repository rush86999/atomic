import React, {
    useState,
    Dispatch,
    SetStateAction,
    useEffect,
} from 'react'
import { colorsPalette as Colors } from '@lib/theme/colorsPalette'
import { Tooltip } from '@chakra-ui/react'
import Switch1 from '@components/Switch'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import TextField from '@components/TextField'

const styles = {
    minThresholdCount: {
        fontSize: '21px',
        lineHeight: '28px',
    },
    container: {
      flex: 1,
    },
}

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
    anyoneCanAddSelf: boolean,
    guestsCanSeeOtherGuests: boolean,
    lockAfter: boolean,
    primaryEmail: string,
    setParentAnyoneCanAddSelf: Dispatch<SetStateAction<boolean>>,
    setParentGuestsCanSeeOtherGuests: Dispatch<SetStateAction<boolean>>,
    setParentPrimaryEmail: Dispatch<SetStateAction<string>>,
    setParentLockAfter: Dispatch<SetStateAction<boolean>>,
}


function CMPWStep5(props: Props) {
    const [anyoneCanAddSelf, setAnyoneCanAddSelf] = useState<boolean>(props?.anyoneCanAddSelf)
    const [guestsCanSeeOtherGuests, setGuestsCanSeeOtherGuests] = useState<boolean>(props?.guestsCanSeeOtherGuests)
    const [primaryEmail, setPrimaryEmail] = useState<string>(props?.primaryEmail)
    const [lockAfter, setLockAfter] = useState<boolean>(props?.lockAfter)

    useEffect(() => {
        if (primaryEmail !== props?.primaryEmail) {
          setPrimaryEmail(props?.primaryEmail)
        }
      }, [primaryEmail, props?.primaryEmail])

    const setParentAnyoneCanAddSelf = props?.setParentAnyoneCanAddSelf
    const setParentGuestsCanSeeOtherGuests = props?.setParentGuestsCanSeeOtherGuests
    const setParentPrimaryEmail = props?.setParentPrimaryEmail
    const setParentLockAfter = props?.setParentLockAfter
    
    const changeAnyoneCanAddSelf = (value: boolean) => {
        setAnyoneCanAddSelf(value)
        setParentAnyoneCanAddSelf(value)
    }

    const changeLockAfter = (value: boolean) => {
        setLockAfter(value)
        setParentLockAfter(value)
    }

    const changeGuestsCanSeeOtherGuests = (value: boolean) => {
        setGuestsCanSeeOtherGuests(value)
        setParentGuestsCanSeeOtherGuests(value)
    }

    const changePrimaryEmail = (e: { target: { value: React.SetStateAction<string> } }) => {
        setPrimaryEmail(e?.target?.value)
        setParentPrimaryEmail(e?.target?.value)
    }

    return (
        <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%' }} minHeight="65vh" maxHeight="65vh">
            <Box flexDirection={{ tablet: "row"}} justifyContent="space-between" alignItems="flex-start" width="70%">
                <TextField
                    label="Primary Email"
                    placeholder="r@r.r"
                    onChange={changePrimaryEmail}
                    value={primaryEmail}
                   
                />
            </Box>
            <Box flexDirection={{ tablet: "row"}} justifyContent="space-between" alignItems="flex-start" width="70%">
                <Box flexDirection="row" justifyContent="flex-start"  >
                    <Text variant="optionHeader">
                        Can non-invited guests add themselves?
                    </Text>
                </Box>
                <Box flexDirection="row" justifyContent="flex-end" pt={{ phone: 'm', tablet: 's' }}>
                    <Switch1
                        onColor={Colors.purple30}
                        offColor={Colors.purple60}
                        checked={anyoneCanAddSelf}
                        onValueChange={changeAnyoneCanAddSelf}
                        style={{marginBottom: 20}}
                    />
                </Box>
            </Box>
            <Box flexDirection={{ tablet: "row"}} justifyContent="space-between" alignItems="flex-start" width="70%">
                <Box flexDirection="row" justifyContent="flex-start" pt={{ phone: 'm', tablet: 's' }} >
                    <Text variant="optionHeader">
                        Can guests see other guests?
                    </Text>
                </Box>
                <Box flexDirection="row" justifyContent="flex-end" pt={{ phone: 'm', tablet: 's' }}>
                    <Switch1
                        onColor={Colors.purple30}
                        offColor={Colors.purple60}
                        checked={guestsCanSeeOtherGuests}
                        onValueChange={changeGuestsCanSeeOtherGuests}
                        style={{marginBottom: 20}}
                    />
                </Box>
            </Box>
            <Box flexDirection={{ tablet: "row"}} justifyContent="space-between" alignItems="flex-start" width="70%">
                <Box flexDirection="row" justifyContent="flex-start"  >
                    <Text variant="optionHeader">
                        Lock after event created?
                    </Text>
                </Box>
                <Box flexDirection="row" justifyContent="flex-end" pt={{ phone: 'm', tablet: 's' }}>
                    <Switch1
                        onColor={Colors.purple30}
                        offColor={Colors.purple60}
                        checked={lockAfter}
                        onValueChange={changeLockAfter}
                        style={{marginBottom: 20}}
                    />
                </Box>
            </Box>
        </Box>
    )

}

export default CMPWStep5