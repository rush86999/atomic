import React, {
    useState,
    Dispatch,
    SetStateAction,
    useEffect,
} from 'react'
import { Tooltip } from '@chakra-ui/react'
import Switch1 from '@components/Switch'
import TextField from '@components/TextField'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import { Pressable } from 'react-native'
import { NextApiRequest, NextApiResponse } from 'next';
import supertokensNode from 'supertokens-node'
import { backendConfig } from '@config/backendConfig'
import Session from 'supertokens-node/recipe/session'
import { colorsPalette as Colors} from '@lib/theme/colorsPalette';

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
    name: string,
    setParentName: Dispatch<SetStateAction<string>>,
    copyAvailability: boolean,
    setParentCopyAvailability: Dispatch<SetStateAction<boolean>>,
    copyTimeBlocking: boolean,
    setParentCopyTimeBlocking: Dispatch<SetStateAction<boolean>>,
}

function EditCategoryStep1(props: Props) {
    const [name, setName] = useState(props.name)
    const [copyAvailability, setCopyAvailability] = useState<boolean>(props?.copyAvailability ?? false)
    const [copyTimeBlocking, setCopyTimeBlocking] = useState<boolean>(props?.copyTimeBlocking ?? false)

    const [isMessage1, setIsMessage1] = useState<boolean>(false)
    const [isMessage2, setIsMessage2] = useState<boolean>(false)

    const setParentName = props?.setParentName
    const setParentCopyAvailability = props?.setParentCopyAvailability
    const setParentCopyTimeBlocking = props?.setParentCopyTimeBlocking

    useEffect(() => {
        if (name !== props?.name) {
            setName(props?.name)
        }

        if (copyAvailability !== props?.copyAvailability) {
            setCopyAvailability(props?.copyAvailability ?? false)
        }

        if (copyTimeBlocking !== props?.copyTimeBlocking) {
            setCopyTimeBlocking(props?.copyTimeBlocking ?? false)
        }
    }, [props?.name, props?.copyAvailability, props?.copyTimeBlocking, name, copyAvailability, copyTimeBlocking])

    const changeCopyAvailability = (value: boolean) => {
        setCopyAvailability(value)
        setParentCopyAvailability(value)
    }

    const changeCopyTimeBlocking = (value: boolean) => {
        setCopyTimeBlocking(value)
        setParentCopyTimeBlocking(value)
    }

    const changeName = (value: string) => {
        setName(value)
        setParentName(value)
    }

    return (
        <Box justifyContent="center" alignItems="center" style={{ width: '100%'}}>
            <div className="flex-1 flex flex-col jsutify-start items-center" style={{ minHeight: '70vh'}}>
                <Box justifyContent="center" alignItems="flex-start" style={{ width: '90%' }} pt={{ phone: 'm', tablet: 's' }}>
                    <TextField
                        label="Name"
                        placeholder="social"
                        onChange={(e: { target: { value: string } }) => changeName(e?.target?.value)}
                        value={name}
                        
                    />
                </Box>
                <Box style={{ width: '90%' }} pt={{ phone: 'm', tablet: 's' }}>  
                    <Box flexDirection="row" justifyContent="flex-start" alignItems="center">
                        <Tooltip hasArrow label='Event availability shown in your calendar will be copied over to any new events whose details are similar to this one. Helpful for task events that are synced or created inside Atomic.' bg='purple.700' color='white'>
                            <Text variant="buttonLink" pt={{ phone: 'm', tablet: 's' }}>Once you set time preferences or priority of an event, copy over transparency of event to any new events whose details are similar? (Hint)</Text>
                        </Tooltip>

                    </Box>
                    <Box flexDirection="row" justifyContent="flex-end" pt={{ phone: 'm', tablet: 's' }}>
                        <Switch1
                            onColor={Colors.purple30}
                            offColor={Colors.purple60}
                            checked={copyAvailability}
                            onValueChange={changeCopyAvailability}
                            style={{marginBottom: 20}}
                        />
                    </Box>
                </Box>
                <Box style={{ width: '90%' }} pt={{ phone: 'm', tablet: 's' }}>
                    <Box flexDirection="row" justifyContent="flex-start" alignItems="center">
                        <Tooltip hasArrow label='Blocked time for before and after the event will be copied over to new events whose details are similar to this one.' bg='purple.700' color='white'>
                            <Text variant="optionHeader" pt={{ phone: 'm', tablet: 's' }}>Once you set time preferences or priority of an event, copy over buffer times to any new events whose details have similar context? (Hint)</Text>
                        </Tooltip>   
                    </Box>
                    <Box flexDirection="row" justifyContent="flex-end" pt={{ phone: 'm', tablet: 's' }}>
                        <Switch1
                            onColor={Colors.purple30}
                            offColor={Colors.purple60}
                            checked={copyTimeBlocking}
                            onValueChange={changeCopyTimeBlocking}
                            style={{ marginBottom: 20 }}
                        />
                    </Box>
                </Box>
            </div>
        </Box>
    )
}

export default EditCategoryStep1
