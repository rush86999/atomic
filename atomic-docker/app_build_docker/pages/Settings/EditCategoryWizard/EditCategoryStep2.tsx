import React, {
  useState,
  Dispatch,
  SetStateAction,
} from 'react'

import Switch1 from '@components/Switch'
import TextField from '@components/TextField'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import { DefaultTimeBlockingType } from '@lib/dataTypes/CategoryType'
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
    defaultAvailability: boolean,
    setParentDefaultAvailability: Dispatch<SetStateAction<boolean>>,
    defaultTimeBlocking: DefaultTimeBlockingType,
    setParentDefaultTimeBlocking?: Dispatch<SetStateAction<DefaultTimeBlockingType>>,
}

function EditCategoryStep2(props: Props) {
    const [defaultAvailability, setDefaultAvailability] = useState<boolean>(props?.defaultAvailability ?? false)
    const [defaultTimeBlocking, setDefaultTimeBlocking] = useState<DefaultTimeBlockingType>(props?.defaultTimeBlocking)
    const [beforeEvent, setBeforeEvent] = useState<number>(props?.defaultTimeBlocking?.beforeEvent ?? 0)
    const [afterEvent, setAfterEvent] = useState<number>(props?.defaultTimeBlocking?.afterEvent ?? 0)
    const [enableTimeBlocking, setEnableTimeBlocking] = useState<boolean>(props?.defaultTimeBlocking?.beforeEvent > 0 || props?.defaultTimeBlocking?.afterEvent > 0)
    
    const setParentDefaultAvailability = props?.setParentDefaultAvailability
    const setParentDefaultTimeBlocking = props?.setParentDefaultTimeBlocking
    
    const changeDefaultAvailability = (value: boolean) => {
        setDefaultAvailability(value)
        setParentDefaultAvailability(value)
    }
    
    const changeDefaultTimeBlocking = (value: DefaultTimeBlockingType) => {
        setDefaultTimeBlocking(value)
        setParentDefaultTimeBlocking(value)
    }

    const changeBeforeEvent = (value: string) => {
        setBeforeEvent(parseInt(value.replace(/[^0-9.]/g, ''), 10))
        setEnableTimeBlocking(parseInt(value.replace(/[^0-9.]/g, ''), 10) > 0)
        changeDefaultTimeBlocking({ ...defaultTimeBlocking, beforeEvent: parseInt(value.replace(/[^0-9.]/g, ''), 10) })
    }

    const changeAfterEvent = (value: string) => {
        setAfterEvent(parseInt(value.replace(/[^0-9.]/g, ''), 10))
        setEnableTimeBlocking(parseInt(value.replace(/[^0-9.]/g, ''), 10) > 0)
        changeDefaultTimeBlocking({ ...defaultTimeBlocking, afterEvent: parseInt(value.replace(/[^0-9.]/g, ''), 10) })
    }

    const onChangeEnableTimeBlocking = (value: boolean) => {
        setEnableTimeBlocking(value)
        if (!value) {
            changeDefaultTimeBlocking({ beforeEvent: 0, afterEvent: 0 })
        }
    }

    
    return (
        <Box justifyContent="center" alignItems="center" style={{ width: '100%'}}>
            <div className="flex-1 flex flex-col justify-center items-center" style={{ minHeight: '70vh' }}>
                <Box style={{ width: '90%' }} pt={{ phone: 'm', tablet: 's' }}>
                    <Box flexDirection="row" justifyContent="flex-start" alignItems="center" style={{ width: '100%' }}>
                        <Box style={{ width: '90%' }}>
                            <Text variant="optionHeader" pt={{ phone: 'xs', tablet: 's'}}>Set default availability / transparency for any new events with the given tag?</Text>
                            <Text variant="comment" pt={{ phone: 'xs', tablet: 's' }}>{defaultAvailability ? 'Transparent/not busy or available for meeting' : 'Opaque/busy or not available for meeting'}</Text>
                        </Box>
                    </Box>
                    <Box flexDirection="row" justifyContent="flex-end" pt={{ phone: 'm', tablet: 's' }} style={{ width: '100%' }}>
                        <Switch1
                            checked={defaultAvailability}
                            onValueChange={changeDefaultAvailability}
                            style={{ marginBottom: 20 }}
                        />
                    </Box>
                </Box>
                <Box style={{ width: '90%' }} pt={{ phone: 'm', tablet: 's' }}>
                    <Box flexDirection="row" justifyContent="flex-start" alignItems="center" style={{ width: '100%' }}>
                        <Text variant="optionHeader" pt={{ phone: 'xs', tablet: 's' }}>Enable default buffer times for any new events with the given tag?</Text>
                    </Box>
                    <Box flexDirection="row" justifyContent="flex-end" pt={{ phone: 'm', tablet: 's' }} style={{ width: '100%' }}>
                        <Switch1
                            checked={enableTimeBlocking}
                            onValueChange={onChangeEnableTimeBlocking}
                            style={{ marginBottom: 20 }}
                        />
                    </Box>
                </Box>
                {
                    enableTimeBlocking
                        ? (
                            <Box style={{ width: '90%' }} pt={{ phone: 'm', tablet: 's' }}>
                                <Box flexDirection="row" justifyContent="space-between" alignItems="center" p={{ phone: 's', tablet: 'm' }} style={{ width: '60%' }}>
                                    <TextField
                                        label="Default prep time before event"
                                        trailingAccessory={<Text>Minutes</Text>}
                                        value={`${beforeEvent}`}
                                        onChange={(e: { target: { value: string } }) => changeBeforeEvent(e?.target?.value)}
                                        type="number"
                                        style={{ marginBottom: 20, width: '15%' }}
                                    />  
                                </Box>
                                <Box flexDirection="row" justifyContent="space-between" alignItems="center" p={{ phone: 's', tablet: 'm' }} style={{ width: '60%' }}>
                                    <TextField
                                        label="Default debrief/review time after event"
                                        trailingAccessory={<Text>Minutes</Text>}
                                        value={`${afterEvent}`}
                                        onChange={(e: { target: { value: string } }) => changeAfterEvent(e?.target?.value)}
                                        type="number"
                                        style={{ marginBottom: 20, width: '15%' }}
                                    />
                                </Box>
                        </Box> 
                        ) : null
                }
            </div>
        </Box>
    )
}

export default EditCategoryStep2
