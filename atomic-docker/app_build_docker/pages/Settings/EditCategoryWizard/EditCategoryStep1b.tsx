import React, {
  useState,
  Dispatch,
  SetStateAction,
} from 'react'

import Switch1 from '@components/Switch'
import { Pressable } from 'react-native'
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
    copyModifiable: boolean,
    setParentCopyModifiable: Dispatch<SetStateAction<boolean>>,
}

function EditCategoryStep1b(props: Props) {
    const [copyModifiable, setCopyModifiable] = useState<boolean>(props?.copyModifiable ?? false)
    const [isMessage1, setIsMessage1] = useState<boolean>(false)

    const setParentCopyModifiable = props?.setParentCopyModifiable

    const changeCopyModifiable = (value: boolean) => {
        setCopyModifiable(value)
        setParentCopyModifiable(value)
    }

    return (
        <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%' }}>
            <Box justifyContent="center" alignItems="flex-start" style={{ width: '90%' }} pt={{ phone: 'm', tablet: 's' }} minHeight="70vh">
                <Box flexDirection="row" justifyContent="flex-start" alignItems="center" style={{ width: '100%' }}>
                    <Text variant="optionHeader">Copy over time modifiable / time not modifiable value (make static) to any new events whose details are similar in context to this event for scheduling assists? </Text>
                </Box>
                <Box flexDirection="row" justifyContent="flex-end" pt={{ phone: 'm', tablet: 's' }} style={{ width: '100%' }}>
                    <Switch1
                        checked={copyModifiable}
                        onValueChange={changeCopyModifiable}
                        style={{ marginBottom: 20 }}
                    />
                </Box>
            </Box>
        </Box>
    )
    
}

export default EditCategoryStep1b
