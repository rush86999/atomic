import React, {
  useState,
  Dispatch,
  SetStateAction,
} from 'react'

import Switch1 from '@components/Switch'
import Box from '@components/common/Box'
import Text from '@components/common/Text'

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
    copyIsBreak: boolean,
    setParentCopyIsBreak: Dispatch<SetStateAction<boolean>>,
    defaultIsBreak: boolean,
    setParentDefaultIsBreak: Dispatch<SetStateAction<boolean>>,
}

function EditCategoryStep5a(props: Props) {
    const [copyIsBreak, setCopyIsBreak] = useState<boolean>(props?.copyIsBreak ?? false)
    const [defaultIsBreak, setDefaultIsBreak] = useState<boolean>(props?.defaultIsBreak ?? false)

    const setParentCopyIsBreak = props?.setParentCopyIsBreak
    const setParentDefaultIsBreak = props?.setParentDefaultIsBreak

    const changeCopyIsBreak = (value: boolean) => {
        setCopyIsBreak(value)
        setParentCopyIsBreak(value)
    }

    const changeDefaultIsBreak = (value: boolean) => {
        setDefaultIsBreak(value)
        setParentDefaultIsBreak(value)
    }

    return (
      <Box justifyContent="center" alignItems="center" style={{ width: '100%' }}>
          <div className="flex-1 flex flex-col justify-center items-center" style={{ minHeight: '70vh' }}>
            <Box  justifyContent="center" alignItems="center" style={{ width: '90%' }} p={{ phone: 's', tablet: 'm' }}>
                <Box flexDirection="row" justifyContent="flex-start" alignItems="center" style={{ width: '100%' }} >
                    <Text variant="optionHeader">Copy over break value to any new events whose details have similar context? </Text>
                </Box>
                <Box flexDirection="row" justifyContent="flex-end" pt={{ phone: 'm', tablet: 's' }} style={{ width: '100%' }}>
                    <Switch1
                        checked={copyIsBreak}
                        onValueChange={changeCopyIsBreak}
                        style={{ marginBottom: 20 }}
                    />
                </Box>
            </Box>
            <Box  justifyContent="center" alignItems="center" style={{ width: '90%' }} p={{ phone: 's', tablet: 'm' }}>
                <Box flexDirection="row" justifyContent="flex-start" alignItems="center" style={{ width: '100%' }}>
                    <Text variant="optionHeader">Set any new events as break events with the given tag for scheduling assists? </Text>
                </Box>
                <Box flexDirection="row" justifyContent="flex-end" pt={{ phone: 'm', tablet: 's' }} style={{ width: '100%' }}>
                    <Switch1
                        checked={defaultIsBreak}
                        onValueChange={changeDefaultIsBreak}
                        style={{ marginBottom: 20 }}
                    />
                </Box>
            </Box>
          </div>
        </Box>
    )
}

export default EditCategoryStep5a

