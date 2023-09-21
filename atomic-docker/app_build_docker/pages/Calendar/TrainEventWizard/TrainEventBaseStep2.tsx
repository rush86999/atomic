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
    copyCategories: boolean,
    setParentCopyCategories: Dispatch<SetStateAction<boolean>>,
    copyIsBreak: boolean,
    setParentCopyIsBreak: Dispatch<SetStateAction<boolean>>,

}

function TrainEventBaseStep2(props: Props) {
    const [copyModifiable, setCopyModifiable] = useState<boolean>(props?.copyModifiable ?? false)
    const [copyCategories, setCopyCategories] = useState<boolean>(props?.copyCategories ?? false)
    const [copyIsBreak, setCopyIsBreak] = useState<boolean>(props?.copyIsBreak ?? false)
    const [isMessage1, setIsMessage1] = useState<boolean>(false)
    const [isMessage2, setIsMessage2] = useState<boolean>(false)

    const setParentCopyModifiable = props?.setParentCopyModifiable
    const setParentCopyCategories = props?.setParentCopyCategories
    const setParentCopyIsBreak = props?.setParentCopyIsBreak

    const changeCopyModifiable = (value: boolean) => {
        setCopyModifiable(value)
        setParentCopyModifiable(value)
    }

    const changeCopyCategories = (value: boolean) => {
        setCopyCategories(value)
        setParentCopyCategories(value)
    }

    const changeCopyIsBreak = (value: boolean) => {
        setCopyIsBreak(value)
        setParentCopyIsBreak(value)
    }

    return (
        <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%'}}>
            <Box flex={1} style={{ width: '95%' }} p={{ phone: 's', tablet: 'm' }}>
                <Box flexDirection="row" justifyContent="flex-start" alignItems="center">
                    <Tooltip hasArrow label='Copy over start time modifiability of the event to any new events whose details are similar for schedule assists. This keeps the event static and immobile on the calendar.' bg='purple.700' color='white'>    
                        <Text variant="buttonLink">Copy over time modifiable value to any new events whose details are similar for scheduling assists? (Hint) </Text>
                    </Tooltip>
                </Box>
                <Box flexDirection="row" justifyContent="flex-end" pt={{ phone: 'm', tablet: 's' }}>
                    <Switch1
                        checked={copyModifiable}
                        onValueChange={changeCopyModifiable}

                    />
                </Box>
            </Box>
            <Box flex={1} style={{ width: '95%' }} p={{ phone: 's', tablet: 'm' }}>
                <Box  flexDirection="row" justifyContent="flex-start" alignItems="center">
                    <Text variant="optionHeader">Copy over tags to any new events whose details have similar context? </Text>
                </Box>
                <Box  flexDirection="row" justifyContent="flex-end" pt={{ phone: 'm', tablet: 's' }}>
                    <Switch1
                        checked={copyCategories}
                        onValueChange={changeCopyCategories}

                    />
                </Box>
            </Box>
            <Box flex={1} style={{ width: '95%' }} p={{ phone: 's', tablet: 'm' }}>
                <Box flexDirection="row" justifyContent="flex-start" alignItems="center">
                    <Tooltip hasArrow label='Classify any new events whose details are similar as a break for schedule assists.' bg='purple.700' color='white'> 
                        <Text variant="buttonLink">Classify as a break type event for any new events whose details have similar context for scheduling assists? (Hint) </Text>
                    </Tooltip>
                </Box>
                <Box flexDirection="row" justifyContent="flex-end" pt={{ phone: 'm', tablet: 's' }}>
                    <Switch1
                        checked={copyIsBreak}
                        onValueChange={changeCopyIsBreak}

                    />
                </Box>
            </Box>
        </Box>
    )
}

export default TrainEventBaseStep2
