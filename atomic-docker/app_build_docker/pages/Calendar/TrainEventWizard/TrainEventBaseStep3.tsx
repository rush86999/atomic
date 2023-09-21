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
    copyIsMeeting: boolean,
    setParentCopyIsMeeting: Dispatch<SetStateAction<boolean>>,
    copyIsExternalMeeting: boolean,
    setParentCopyIsExternalMeeting: Dispatch<SetStateAction<boolean>>,
    copyDuration: boolean,
    setParentCopyDuration: Dispatch<SetStateAction<boolean>>,
    copyColor: boolean,
    setParentCopyColor: Dispatch<SetStateAction<boolean>>,
}

function TrainEventBaseStep3(props: Props) {
    const [copyIsMeeting, setCopyIsMeeting] = useState<boolean>(props?.copyIsMeeting ?? false)
    const [copyIsExternalMeeting, setCopyIsExternalMeeting] = useState<boolean>(props?.copyIsExternalMeeting ?? false)
    const [copyDuration, setCopyDuration] = useState<boolean>(props?.copyDuration ?? false)
    const [copyColor, setCopyColor] = useState<boolean>(props?.copyColor ?? false)
    const [isMessage1, setIsMessage1] = useState<boolean>(false)
    const [isMessage2, setIsMessage2] = useState<boolean>(false)
    const [isMessage3, setIsMessage3] = useState<boolean>(false)
    const [isMessage4, setIsMessage4] = useState<boolean>(false)

    const setParentCopyIsExternalMeeting = props?.setParentCopyIsExternalMeeting
    const setParentCopyDuration = props?.setParentCopyDuration
    const setParentCopyIsMeeting = props?.setParentCopyIsMeeting
    const setParentCopyColor = props?.setParentCopyColor
    
    const changeCopyIsExternalMeeting = (value: boolean) => {
        setCopyIsExternalMeeting(value)
        setParentCopyIsExternalMeeting(value)
    }

    const changeCopyDuration = (value: boolean) => {
        setCopyDuration(value)
        setParentCopyDuration(value)
    }

     const changeCopyIsMeeting = (value: boolean) => {
        setCopyIsMeeting(value)
        setParentCopyIsMeeting(value)
     }
    
    const changeCopyColor = (value: boolean) => {
        setCopyColor(value)
        setParentCopyColor(value)
    }

    return (
        <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%'}}>
            <Box flex={1} style={{ width: '90%' }} p={{ phone: 's', tablet: 'm' }}>
                <Box flexDirection="row" justifyContent="flex-start" alignItems="center">
                    <Tooltip hasArrow label='Event will be tagged with Meeting topic and settings for the tag will be applied to the event. Note: training settings override tag settings for schedule assists in case of overlap.' bg='purple.700' color='white'>
                        <Text variant="buttonLink">Classify any new events whose details are similar as a &apos;Meeting type&apos; event? (Hint) </Text>
                    </Tooltip>
                        
                </Box>
                <Box flexDirection="row" justifyContent="flex-end" pt={{ phone: 'm', tablet: 's' }}>
                    <Switch1
                        checked={copyIsMeeting}
                        onValueChange={changeCopyIsMeeting}
                        style={{ marginBottom: 20 }}
                    />
                </Box>
            </Box>
            <Box flex={1} style={{ width: '90%' }} p={{ phone: 's', tablet: 'm' }}>
                <Box flexDirection="row" justifyContent="flex-start" alignItems="center">
                    <Tooltip hasArrow label='Tag with External Meeting topic is a meeting with contact outside the organization. Event will be tagged with external meeting topic and settings for the tag will be applied to the event. Note: training settings override tag settings for schedule assists in case of overlap.' bg='purple.700' color='white'>
                        <Text variant="buttonLink">Classify any new events whose details have similar context as an &apos;External Meeting type&apos; event? (Hint) </Text>
                    </Tooltip>
                </Box>
                <Box flexDirection="row" justifyContent="flex-end" pt={{ phone: 'm', tablet: 's' }}>
                    <Switch1
                        checked={copyIsExternalMeeting}
                        onValueChange={changeCopyIsExternalMeeting}
                    />
                </Box>
            </Box>
            <Box flex={1} style={{ width: '90%' }} p={{ phone: 's', tablet: 'm' }}>
                <Box flexDirection="row" justifyContent="flex-start" alignItems="center"> 
                    <Tooltip hasArrow label='New events whose details are similar will change their end time to match the duration to this event. Usually useful to sync task events from 3rd party apps.' bg='purple.700' color='white'>
                        <Text variant="buttonLink">Copy over duration value to any new events whose details have similar context? (Hint)</Text>
                    </Tooltip>
                       
                </Box>
                <Box flexDirection="row" justifyContent="flex-end" pt={{ phone: 'm', tablet: 's' }}>
                    <Switch1
                        checked={copyDuration}
                        onValueChange={changeCopyDuration}
                    />
                </Box>
            </Box>
            <Box flex={1} style={{ width: '90%' }} p={{ phone: 's', tablet: 'm' }}>
                <Box flexDirection="row" justifyContent="flex-start" alignItems="center"> 
                    <Text variant="optionHeader">Copy over background color to any new events whose details have similar context? </Text>
                </Box>
                <Box flexDirection="row" justifyContent="flex-end" pt={{ phone: 'm', tablet: 's' }}>
                    <Switch1
                        checked={copyColor}
                        onValueChange={changeCopyColor}
                    />
                </Box>
            </Box>
        </Box>
    )
}

export default TrainEventBaseStep3