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

import { Dimensions, ScrollView } from 'react-native'

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
    isBufferTime: boolean,
    beforeEventMinutes: number,
    afterEventMinutes: number,
    setParentIsBufferTime: Dispatch<SetStateAction<boolean>>,
    setParentBeforeEventMinutes: Dispatch<SetStateAction<number>>,
    setParentAfterEventMinutes: Dispatch<SetStateAction<number>>,
}

function EditMeetingAssistBaseStep6(props: Props) {
    const [isBufferTime, setIsBufferTime] = useState<boolean>(props?.isBufferTime)
    const [beforeEventMinutes, setBeforeEventMinutes] = useState<number>(props?.beforeEventMinutes)
    const [afterEventMinutes, setAfterEventMinutes] = useState<number>(props?.afterEventMinutes)
    const [pageOffset, setPageOffset] = useState<number>(0)

    const { height: fullHeight } = Dimensions.get('window')
    
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
        <Box flex={1} style={{ width: '100%' }}>

            <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={{ alignItems: 'center'}}> 
                <Box p={{ phone: 's', tablet: 'm' }} style={{ width: '90%' }}>
                    <Box flexDirection="row" justifyContent="flex-start" pt={{ phone: 'm', tablet: 's' }}  style={{ width: '100%' }}>
                        <Text variant="optionHeader" pt={{ phone: 'm', tablet: 's' }}>
                            Do you want to add Buffer time to your event?
                        </Text>
                    </Box>
                    <Box flexDirection="row" justifyContent="flex-end" pt={{ phone: 'm', tablet: 's' }}>
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
                                <Box justifyContent="center" alignItems="center"  style={{ width: '90%' }}>
                                    <Box pt={{ phone: 'm', tablet: 's' }} justifyContent="center" alignItems="center"  style={{ width: '100%' }}>
                                        <Box style={{ width: '100%' }} justifyContent="center" alignItems="center">
                                            <Box style={{ width: '100%' }} flexDirection="row" justifyContent="space-between" alignItems="center" pt={{ phone: 'm', tablet: 's' }}>
                                                <Box>
                                                    <Text variant="optionHeader">
                                                        Prep time before event: 
                                                    </Text>
                                                    <Text variant="greyComment">
                                                    30 min steps only
                                                    </Text>
                                                </Box>
                                                <Box>
                                                    <Box p={{ phone: 'm', tablet: 'm' }} />
                                                    
                                                        <TextField
                                                            label="Minutes"
                                                            value={`${beforeEventMinutes}`}
                                                            onChange={changeBeforeEventMinutes}
                                                            type="number"
                                                            style={{ width: '15%' }}
                                                        />
                                                    
                                                </Box>
                                            </Box>
                                        </Box>
                                        <Box style={{ width: '100%' }} justifyContent="center" alignItems="center">
                                            <Box style={{ width: '100%' }} flexDirection="row" justifyContent="space-between" alignItems="center" pt={{ phone: 'm', tablet: 's' }}>
                                                <Box>
                                                    <Text variant="optionHeader">
                                                        Review time after event:
                                                    </Text>
                                                    <Text variant="greyComment">
                                                    30 min steps only
                                                    </Text>
                                                </Box>
                                                <Box>
                                                    <Box p={{ phone: 'm', tablet: 'm' }} />
                                                    
                                                        <TextField
                                                            label="Minutes"
                                                            value={`${afterEventMinutes}`}
                                                            onChange={changeAfterEventMinutes}
                                                            type="number"
                                                            style={{width: '15%' }}
                                                        />
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Box>
                                </Box>
                            ) : null
                    }
                </Box>
            </ScrollView>

        </Box>
    )

}

export default EditMeetingAssistBaseStep6



