import React, {
  useState,
  Dispatch,
  SetStateAction,
} from 'react'

import { Tooltip } from '@chakra-ui/react'
import Switch1 from '@components/Switch'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
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
    copyAvailability: boolean,
    setParentCopyAvailability: Dispatch<SetStateAction<boolean>>,
    copyTimeBlocking: boolean,
    setParentCopyTimeBlocking: Dispatch<SetStateAction<boolean>>,
    copyTimePreference: boolean,
    setParentCopyTimePreference: Dispatch<SetStateAction<boolean>>,
    // enablePreferredTime: boolean,
    // setParentEnablePreferredTime: Dispatch<SetStateAction<boolean>>,
}

function TrainEventBaseStep(props: Props) {
    const [copyAvailability, setCopyAvailability] = useState<boolean>(props?.copyAvailability ?? false)
    const [copyTimeBlocking, setCopyTimeBlocking] = useState<boolean>(props?.copyTimeBlocking ?? false)
    const [copyTimePreference, setCopyTimePreference] = useState<boolean>(props?.copyTimePreference ?? false)
    // const [enablePreferredTime, setEnablePreferredTime] = useState<boolean>(props?.enablePreferredTime ?? false)
    const [isMessage1, setIsMessage1] = useState<boolean>(false)
    const [isMessage2, setIsMessage2] = useState<boolean>(false)

    const setParentCopyAvailability = props?.setParentCopyAvailability
    const setParentCopyTimeBlocking = props?.setParentCopyTimeBlocking
    const setParentCopyTimePreference = props?.setParentCopyTimePreference
    // const setParentEnablePreferredTime = props?.setParentEnablePreferredTime

    // console.log(props?.enablePreferredTime, '   props?.enablePreferredTime')

    const changeCopyAvailability = (value: boolean) => {
        setCopyAvailability(value)
        setParentCopyAvailability(value)
    }

    const changeCopyTimeBlocking = (value: boolean) => {
        setCopyTimeBlocking(value)
        setParentCopyTimeBlocking(value)
    }

    const changeCopyTimePreference = (value: boolean) => {
        setCopyTimePreference(value)
        setParentCopyTimePreference(value)
    }

    // const changeEnablePreferredTime = (value: boolean) => {
    //     setEnablePreferredTime(value)
    //     setParentEnablePreferredTime(value)
    // }

    return (
        <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%'}}>
            <Box flex={1} style={{ width: '95%' }} p={{ phone: 's', tablet: 'm' }}>
                <Box flexDirection="row" justifyContent="flex-start" alignItems="center">

                    <Tooltip hasArrow label='Event availability shown in your calendar will be copied over to any new events whose details are similar to this one. Helpful for task events that are synced or created inside Atomic.' bg='purple.700' color='white'>
                        <Text variant="buttonLink">Copy over transparency of event to any new events whose details have similar context? (Hint)</Text>
                    </Tooltip>

                </Box>
                <Box flexDirection="row" justifyContent="flex-end" pt={{ phone: 'm', tablet: 's' }}>
                    <Switch1
                        checked={copyAvailability || props?.copyAvailability}
                        onValueChange={changeCopyAvailability}
                        style={{marginBottom: 20}}
                    />
                </Box>
            </Box>
            <Box flex={1} style={{ width: '95%' }} p={{ phone: 's', tablet: 'm' }}>
                <Box flexDirection="row" justifyContent="flex-start" alignItems="center">
                    <Tooltip hasArrow label='Blocked time for before and after the event will be copied over to new events whose details are similar to this one.' bg='purple.700' color='white'>
                        <Text variant="buttonLink">Copy over buffer times to any new events whose details have similar context? (Hint)</Text>
                    </Tooltip>
                </Box>
                <Box flexDirection="row" justifyContent="flex-end" pt={{ phone: 'm', tablet: 's' }}>
                    <Switch1
                        checked={copyTimeBlocking || props?.copyTimeBlocking}
                        onValueChange={changeCopyTimeBlocking}
                        style={{ marginBottom: 20 }}
                    />
                </Box>
            </Box>
            <Box flex={1} style={{ width: '95%' }} p={{ phone: 's', tablet: 'm' }}>
                <Box flexDirection="row" justifyContent="flex-start" alignItems="center">  
                    <Text variant="optionHeader">Copy over time preference to any new events whose details have similar context for scheduling assists?</Text>
                </Box>
                <Box flexDirection="row" justifyContent="flex-end" pt={{ phone: 'm', tablet: 's' }}>
                    <Switch1
                        checked={copyTimePreference || props?.copyTimePreference}
                        onValueChange={changeCopyTimePreference}
                        style={{ marginBottom: 20 }}
                    />
                </Box>
            </Box>
        </Box>
    )
}

export default TrainEventBaseStep