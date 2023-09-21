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
    defaultPriorityLevel: number,
    setParentDefaultPriorityLevel: Dispatch<SetStateAction<number>>,
    defaultModifiable: boolean,
    setParentDefaultModifiable: Dispatch<SetStateAction<boolean>>,
}


const dayOfWeekInt = [-1, 1, 2, 3, 4, 5, 6, 7]

function EditCategoryStep3(props: Props) {
    const [defaultPriorityLevel, setDefaultPriorityLevel] = useState<number>(props?.defaultPriorityLevel ?? 1)
    const [defaultModifiable, setDefaultModifiable] = useState<boolean>(props?.defaultModifiable ?? false)

    // const setParentDefaultReminders = props?.setParentDefaultReminders
    const setParentDefaultPriorityLevel = props?.setParentDefaultPriorityLevel
    const setParentDefaultModifiable = props?.setParentDefaultModifiable

    // const changeDefaultReminders = (value: DefaultRemindersType) => {
    //     setDefaultReminders(value)
    //     setParentDefaultReminders(value)
    // }

    const changeDefaultPriorityLevel = (value: string) => {
        setDefaultPriorityLevel(parseInt(value.replace(/[^0-9.]/g, ''), 10))
        setParentDefaultPriorityLevel(parseInt(value.replace(/[^0-9.]/g, ''), 10))
    }

    const changeDefaultModifiable = (value: boolean) => {
        setDefaultModifiable(value)
        setParentDefaultModifiable(value)
    }

    return (
        <Box justifyContent="center" alignItems="center" style={{ width: '100%' }}>
            <div className="flex-1 flex flex-col justify-center items-center" style={{ minHeight: '70vh'}}>
                <Box style={{ width: '90%' }} pt={{ phone: 'm', tablet: 's' }}>
                    <Box flexDirection="row" justifyContent="flex-start" alignItems="center">
                        <Text variant="optionHeader">
                            Set default priority level for any new events with the given tag?
                        </Text>
                    </Box>
                    <Box flexDirection="row" justifyContent="flex-end" pt={{ phone: 'm', tablet: 's' }}>
                        <TextField
                            type="number"
                            onChange={(e: { target: { value: string } }) => changeDefaultPriorityLevel(e?.target?.value)}
                            value={defaultPriorityLevel.toString()}
                            
                        />
                    </Box>
                </Box>
                <Box style={{ width: '90%' }} pt={{ phone: 'm', tablet: 's' }}>
                    <Box flexDirection="row" justifyContent="flex-start" alignItems="center">
                        <Text variant="optionHeader">Set default time Modifiable / Not Modifiable value to any new events with the given tag for scheduling assists? </Text>
                    </Box>
                    <Box flexDirection="row" justifyContent="flex-end" pt={{ phone: 'm', tablet: 's' }}>
                        <Switch1
                            checked={defaultModifiable}
                            onValueChange={changeDefaultModifiable}
                            style={{ marginBottom: 20 }}
                        />
                    </Box>
                    <Box justifyContent="center" alignItems="flex-end">
                        { defaultModifiable
                            ? (
                                <Text variant="body">Modifiable</Text>
                            ): (
                                <Text variant="body"> Not Modifiable</Text>    
                         )}
                    </Box>
                </Box>
            </div>
        </Box> 
    )

}

export default EditCategoryStep3
