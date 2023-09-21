import React, {
  useState,
  Dispatch,
  SetStateAction,
} from 'react'

import Switch1 from '@components/Switch'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import { TransparencyType } from '@lib/calendarLib/types'
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
    modifiable: boolean,
    isMeeting: boolean,
    isExternalMeeting: boolean,
    transparency: TransparencyType,
    setParentModifiable: Dispatch<SetStateAction<boolean>>,
    setParentIsMeeting: Dispatch<SetStateAction<boolean>>,
    setParentIsExternalMeeting: Dispatch<SetStateAction<boolean>>,
    setParentTransparency: Dispatch<SetStateAction<TransparencyType>>
}   

function EditEventBaseStep3(props: Props) {
    const [modifiable, setModifiable] = useState<boolean>(props?.modifiable ?? true)
    const [isMeeting, setIsMeeting] = useState<boolean>(props?.isMeeting)
    const [isExternalMeeting, setIsExternalMeeting] = useState<boolean>(props?.isExternalMeeting)
    const [transparency, setTransparency] = useState<TransparencyType>(props?.transparency ?? 'opaque')

    const setParentModifiable = props?.setParentModifiable
    const setParentIsMeeting = props?.setParentIsMeeting
    const setParentIsExternalMeeting = props?.setParentIsExternalMeeting
    const setParentTransparency = props?.setParentTransparency
    
    const changeTransparency = (value: boolean) => {
        setTransparency(value === true ? 'transparent' : 'opaque')
        setParentTransparency(value === true ? 'transparent' : 'opaque')
    }

    const changeModifiable = (value: boolean) => {
        setModifiable(value)
        setParentModifiable(value)
    }

    const changeIsMeeting = (value: boolean) => {
        setIsMeeting(value)
        setParentIsMeeting(value)

        if (value) {
            setIsExternalMeeting(false)
            setParentIsExternalMeeting(false)
        }
    }

    const changeIsExternalMeeting = (value: boolean) => {
        setIsExternalMeeting(value)
        setParentIsExternalMeeting(value)
        if (value) {
            setIsMeeting(false)
            setParentIsMeeting(false)
        }
    }


    return (
        <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%'}}>
            <Box flex={1} style={{ width: '90%' }} p={{ phone: 's', tablet: 'm' }}>
                <Box flex={1} flexDirection="row" justifyContent="flex-start" alignItems="center">  
                    <Text variant="optionHeader" pt={{ phone: 'm', tablet: 's' }}>
                        Make this event transparent?
                    </Text>
                </Box>
                <Box flex={1} flexDirection="row" justifyContent="flex-end" pt={{ phone: 'm', tablet: 's' }}>
                    <Switch1
                        checked={transparency === 'opaque' ? false : true}
                        onValueChange={changeTransparency}
                        style={{marginBottom: 20}}
                    />
                </Box>
            </Box>
            <Box flex={1} style={{ width: '90%' }} p={{ phone: 's', tablet: 'm' }}>
                <Box  flexDirection="row" justifyContent="flex-start" alignItems="center">  
                    <Text variant="optionHeader">Is the start time of this event modifiable for scheduling assists?</Text>
                </Box>
                <Box  flexDirection="row" justifyContent="flex-end" pt={{ phone: 'm', tablet: 's' }}>
                    <Switch1
                        checked={modifiable}
                        onValueChange={changeModifiable}
                        style={{marginBottom: 20}}
                    />
                </Box>
            </Box>
            <Box flex={1} style={{ width: '90%' }} p={{ phone: 's', tablet: 'm' }}>
                <Box  flexDirection="row" justifyContent="flex-start" alignItems="center">  
                    <Text variant="optionHeader">Classify this event as a meeting type event?</Text>
                </Box>
                <Box  flexDirection="row" justifyContent="flex-end" pt={{ phone: 'm', tablet: 's' }}>
                    <Switch1
                        checked={isMeeting}
                        onValueChange={changeIsMeeting}
                        style={{ marginBottom: 20 }}
                    />
                </Box>
            </Box>
            <Box flex={1} style={{ width: '90%' }} p={{ phone: 's', tablet: 'm' }}>
                <Box  flexDirection="row" justifyContent="flex-start" alignItems="center">  
                    <Text variant="optionHeader">Classify this event as an external meeting type ie meeting that is outside your organization or team?</Text>
                </Box>
                <Box  flexDirection="row" justifyContent="flex-end" pt={{ phone: 'm', tablet: 's' }}>
                    <Switch1
                        checked={isExternalMeeting}
                        onValueChange={changeIsExternalMeeting}
                        style={{ marginBottom: 20 }}
                    />
                </Box>
            </Box>
        </Box>
    )

}

export default EditEventBaseStep3
