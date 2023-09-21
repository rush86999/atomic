import React, {
  useState,
  Dispatch,
  SetStateAction,
} from 'react'
import {
   FlatList,
   Pressable,
} from 'react-native'

import { IoCloseOutline, IoTrash } from "react-icons/io5";

import Switch1 from '@components/Switch'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import TextField from '@components/TextField'

import { palette } from '@lib/theme/theme'

import { addItemToAlarms, removeItemFromAlarms } from '@lib/Calendar/CreateEventWizard/wizardHelper'

import { NextApiRequest, NextApiResponse } from 'next';
import supertokensNode from 'supertokens-node'
import { backendConfig } from '../../../config/backendConfig'
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
    useDefaultAlarms: boolean,
    alarms: number[],
    setParentAlarms: Dispatch<SetStateAction<number[]>>,
    setParentUseDefaultAlarms: Dispatch<SetStateAction<boolean>>,
}


function CreateMeetingAssistAlarms(props: Props) {
    const [useDefaultAlarms, setUseDefaultAlarms] = useState<boolean>(props?.useDefaultAlarms)
    const [alarms, setAlarms] = useState<number[]>(props?.alarms)
    const [alarm, setAlarm] = useState<number>(0)
    const [pageOffset, setPageOffset] = useState<number>(0)
    
    // const dark = useColorScheme() === 'dark'

    const setParentUseDefaultAlarms = props?.setParentUseDefaultAlarms
    const setParentAlarms = props?.setParentAlarms


    
    const changeUseDefaultAlarms = (value: boolean) => {
        setUseDefaultAlarms(value)
        setParentUseDefaultAlarms(value)
    }

    const addAlarmToAlarms = () => {
        addItemToAlarms(alarm, alarms, setAlarms, setParentAlarms, setAlarm)
        if (useDefaultAlarms) {
            changeUseDefaultAlarms(false)
        }
    }

    return (
        <Box flex={1} style={{ width: '100%' }} minHeight="65vh" maxHeight="65vh">
            <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%' }}>
                <Box flex={1} pt={{ phone: 'm', tablet: 's' }} flexDirection={{ tablet: "row"}} justifyContent="space-between" alignItems="center" width="70%">
                    <Box flexDirection="row" justifyContent="flex-start" alignItems="center" style={{ width: '100%' }}>
                        <Text variant="optionHeader">
                        Do you want to use default alarms?
                        </Text>
                    </Box>
                    <Box flexDirection="row" justifyContent="flex-end" pt={{ phone: 'm', tablet: 's' }} style={{ width: '100%' }}>
                        <Switch1
                            checked={useDefaultAlarms}
                            onValueChange={changeUseDefaultAlarms} 
                            style={{ marginBottom: 20 }}
                        />  
                    </Box>
                </Box>
                {alarms?.length > 0
                    ? (
                    <Box flex={3}  justifyContent="center" alignItems="center" style={{ width: '100%'}}>
                        <FlatList
                            data={alarms}
                            renderItem={({ item, index }) => (
                                <Box justifyContent="center" alignItems="center" style={{ width: '100%'}}>
                                <Box flexDirection="row" justifyContent="space-between" style={{ width: '100%'}}>
                                    <Text variant="optionHeader">
                                    {`${item} minutes before`}
                                    </Text>
                                    <Pressable hitSlop={15} onPress={() => removeItemFromAlarms(index, alarms, setAlarms, setParentAlarms)}>
                                        <IoTrash size="1.5em" color={palette.red} />
                                    </Pressable>
                                </Box>
                                </Box>
                            )}
                            keyExtractor={(item, index) => `${item}-${index}`}
                        />
                    </Box>
                    ) : null}
                <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%'}}>
                    <Box flex={1}  flexDirection="row" justifyContent="center" alignItems="center" style={{ width: '40%'}}>

                        <div className="mr-2">
                            <TextField
                                type="number"
                                onChange={(e: { target: { value: string; }; }) => setAlarm(parseInt(e?.target?.value?.replace(/[^0-9.]/g, ''), 10))}
                                value={`${alarm}`}
                                placeholder="0"
                            />
                                
                        </div>
                        <div className="ml-2">
                            <Pressable onPress={addAlarmToAlarms}>
                                <Text variant="buttonLink">
                                    Add Alarm
                                </Text>
                            </Pressable>
                        </div>
                    </Box>
                </Box>
            </Box>
        </Box>
    )
}

export default CreateMeetingAssistAlarms




