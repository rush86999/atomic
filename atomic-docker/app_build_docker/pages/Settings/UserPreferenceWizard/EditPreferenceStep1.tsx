import React, {
    useState,
    Dispatch,
    SetStateAction,
    useEffect,
} from 'react'
 import {
  FlatList,
  Pressable,
  StyleSheet,
    useColorScheme,
  Appearance,
} from 'react-native'

import TextField from '@components/TextField'
import { IoIosAdd, IoIosClose } from "react-icons/io"
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import Button from '@components/Button'

import { palette } from '@lib/theme/theme'
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
    reminders: number[],
    setParentReminders: Dispatch<SetStateAction<number[]>>,
}

// const dark = Appearance.getColorScheme() === 'dark'

function EditPreferenceStep1(props: Props) {
    const [reminders, setReminders] = useState<number[]>(props?.reminders || [])
    const [reminder, setReminder] = useState<number>(0)
    
    useEffect(() => {
        if (!_.isEqual(reminders, props?.reminders)) {
            setReminders(props?.reminders || [])
        }
    }, [props?.reminders, props?.reminders?.length, reminders])
    
    const setParentReminders = props?.setParentReminders


    const addItemToReminders = () => {
        const newReminders = _.uniqWith((reminders || []).concat([reminder]), _.isEqual)
        setReminders(newReminders)
        setParentReminders(newReminders)
    }

    const removeItemFromReminders = (item: number) => {
        const newReminders = _.without(reminders, item)
        setReminders(newReminders)
        setParentReminders(newReminders)
    }

    return (
            <Box justifyContent="center" alignItems="center">
                <Box mt={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
                    <Text variant="subheader">
                        Default Reminders
                    </Text>
                </Box>
                <Box  pt={{ phone: 'm', tablet: 'l' }} justifyContent="center"  alignItems="flex-start" minHeight="40vh">
                    <Box alignItems="center" style={{ width: '100%' }}>
                        <FlatList
                            data={reminders}
                            renderItem={({ item }) => (
                                <Box style={{ width: '100%' }} alignItems="center" justifyContent="center">
                                    <Box style={{ width: '70%' }} flexDirection="row" justifyContent="space-between">
                                        <Text variant="optionHeader">
                                            {`${item} minutes before`}
                                        </Text>
                                        <Pressable hitSlop={15} onPress={() => removeItemFromReminders(item)}>
                                            <IoIosClose size="3em" color={palette.red} />
                                        </Pressable>
                                    </Box>
                                </Box>
                            )}
                            keyExtractor={(item, index) => `${item}-${index}`}
                        />
                    </Box>
                </Box>
                
                <Box pt={{ phone: 'xs', tablet: 's' }} justifyContent="center" alignItems="center">
                    <Box justifyContent="center" alignItems="center">

                            <TextField
                                type="number"
                                onChange={(e: { target: { value: string } }) => setReminder(parseInt(e?.target?.value.replace(/[^0-9.]/g, ''), 10))}
                                value={`${reminder}`}
                                placeholder="0"
                               
                                label="Reminder"
                            />
                        
                    </Box>
                    <Pressable onPress={addItemToReminders}>
                        <Box flexDirection="row" justifyContent="space-between" alignItems="center">
                            <IoIosAdd size="3em" color={palette.pinkPrimary}  />
                            <Text variant="buttonLink">
                                Add
                            </Text>
                        </Box>
                    </Pressable>
                </Box>
            </Box>
    )

}

export default EditPreferenceStep1