import React, {
  useState,
  Dispatch,
  SetStateAction,
} from 'react'
import { Tooltip } from '@chakra-ui/react'
import Switch1 from '@components/Switch'
import { Pressable } from 'react-native'
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
    copyPriorityLevel: boolean,
    setParentCopyPriorityLevel: Dispatch<SetStateAction<boolean>>,
    copyReminders: boolean,
    setParentCopyReminders: Dispatch<SetStateAction<boolean>>,
}

function TrainEventBaseStep(props: Props) {
    const [copyPriorityLevel, setCopyPriorityLevel] = useState<boolean>(props?.copyPriorityLevel ?? false)
    const [copyReminders, setCopyReminders] = useState<boolean>(props?.copyReminders ?? false)
    const [isMessage1, setIsMessage1] = useState<boolean>(false)
    const [isMessage2, setIsMessage2] = useState<boolean>(false)

    const setParentCopyPriorityLevel = props?.setParentCopyPriorityLevel
    const setParentCopyReminders = props?.setParentCopyReminders

    const changeCopyPriorityLevel = (value: boolean) => {
        setCopyPriorityLevel(value)
        setParentCopyPriorityLevel(value)
    }

    const changeCopyReminders = (value: boolean) => {
        setCopyReminders(value)
        setParentCopyReminders(value)
    }

    return (
        <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%'}}>
            <Box style={{ width: '90%' }} p={{ phone: 's', tablet: 'm' }}>
                <Box flexDirection="row" justifyContent="flex-start" alignItems="center" style={{ width: '100%' }}>
                    <Tooltip hasArrow label='New events whose details are similar to this one will have their priority level set to the level found on this event. If priority changes with time, avoid enabling this feature.' bg='purple.700' color='white'>
                        <Text variant="buttonLink">Copy over priority level to any new events whose details are similar in context to this event? (Hint)</Text>
                    </Tooltip>
                </Box>
                <Box flexDirection="row" justifyContent="flex-end" pt={{ phone: 'm', tablet: 's' }} style={{ width: '100%' }}>
                    <Switch1
                        checked={copyPriorityLevel}
                        onValueChange={changeCopyPriorityLevel}
                        style={{ marginBottom: 20 }}
                    />
                </Box>
            </Box>
            <Box style={{ width: '90%' }} p={{ phone: 's', tablet: 'm' }}>
                <Box flexDirection="row" justifyContent="flex-start" alignItems="center" style={{ width: '100%' }}>
                    <Text variant="optionHeader">Copy over reminders to any new events whose details are similar in context to this event?</Text>
                </Box>
                <Box flexDirection="row" justifyContent="flex-end" pt={{ phone: 'm', tablet: 's' }} style={{ width: '100%' }}>
                    <Switch1
                        checked={copyReminders}
                        onValueChange={changeCopyReminders} 
                        style={{ marginBottom: 20 }}
                    />  
                </Box>
            </Box>
        </Box>
    )
}

export default TrainEventBaseStep