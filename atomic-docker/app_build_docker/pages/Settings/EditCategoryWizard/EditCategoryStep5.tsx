import React, {
  useState,
  Dispatch,
    SetStateAction,
} from 'react'
import { IoIosAdd, IoIosClose } from "react-icons/io";
import TextField from '@components/TextField'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import { DefaultRemindersType } from '@lib/dataTypes/CategoryType'
import _ from 'lodash'
import Button from '@components/Button'
import { Appearance, FlatList, Pressable, StyleSheet } from 'react-native'
import { palette } from '@lib/theme/theme'
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
    defaultReminders: DefaultRemindersType,
    setParentDefaultReminders: Dispatch<SetStateAction<DefaultRemindersType>>,
}


function EditCategoryStep5(props: Props) {
    const [defaultReminders, setDefaultReminders] = useState<DefaultRemindersType>(props?.defaultReminders || [])
    const [alarm, setAlarm] = useState<number>(0)  
    const [isMessage1, setIsMessage1] = useState<boolean>(false)
    const [isMessage2, setIsMessage2] = useState<boolean>(false)

    const setParentDefaultReminders = props?.setParentDefaultReminders

    

    const changeDefaultReminders = (value: number) => {
        const newAlarms = _.uniqWith(defaultReminders.concat([value]), _.isEqual)
        setDefaultReminders(newAlarms)
        setParentDefaultReminders(newAlarms)
    }

    const removeItemFromDefaultReminders = (item: number) => {
        const newAlarms = _.without(defaultReminders, item)

        setDefaultReminders(newAlarms)
        setParentDefaultReminders(newAlarms)
    }

    const changeAlarm = (value: string) => {
        setAlarm(parseInt(value.replace(/[^0-9.]/g, ''), 10))
    }



    return (
        <Box justifyContent="center" alignItems="center" style={{ width: '100%'}}>
            <Box mt={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
                <Text variant="subheader">
                Add reminders
                </Text>
            </Box>
            <Box pt={{ phone: 'm', tablet: 'l' }} justifyContent="center" alignItems="center" style={{ width: '100%' }} minHeight="30vh">
                <FlatList
                    data={defaultReminders}
                    renderItem={({ item, index }) => (
                        <Box justifyContent="center" alignItems="center" style={{ width: '100%' }}>
                            <Box style={{ width: '100%' }} flexDirection="row" justifyContent="space-between">
                                <Text variant="optionHeader">
                                    {`${item} minutes before`}
                                </Text>
                                <Pressable hitSlop={15} onPress={() => removeItemFromDefaultReminders(item)}>
                                    <IoIosClose size="3em" color={palette.red} />
                                </Pressable>
                            </Box>
                        </Box>
                    )}
                    keyExtractor={(item, index) => `${item}-${index}`}
                />
            </Box>
            <Box  justifyContent="center" alignItems="center">
                <Box pt={{ phone: 'xs', tablet: 's' }}>

                        <TextField
                            type="number"
                            onChange={(e: { target: { value: string } }) => changeAlarm(e?.target?.value)}
                            value={`${alarm}`}
                            placeholder="0"
                            
                            label="Reminder"
                        />
              
                </Box>
            </Box>
            <Box pt={{ phone: 'xs', tablet: 's' }} justifyContent="center" alignItems="center">
                <Pressable onPress={() => changeDefaultReminders(alarm)}>
                    <Box flexDirection="row" justifyContent="space-between" alignItems="center">
                        <IoIosAdd size="3em" color={palette.pinkPrimary} />
                        <Text variant="buttonLink">
                            Add
                        </Text>
                    </Box>
                </Pressable>
            </Box>
        </Box>
    )
}

export default EditCategoryStep5
