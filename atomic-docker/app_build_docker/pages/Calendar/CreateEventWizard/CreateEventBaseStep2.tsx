import React, {
  useState,
  Dispatch,
  SetStateAction,
} from 'react'

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
    isAttendees: boolean
    allDay: boolean
    isRecurring: boolean
    isBreak: boolean
    setParentAllDay: Dispatch<SetStateAction<boolean>>
    setParentIsRecurring: Dispatch<SetStateAction<boolean>>
    setParentIsAttendees: Dispatch<SetStateAction<boolean>>
    setParentIsBreak: Dispatch<SetStateAction<boolean>>
}

function CreateEventBaseStep2(props: Props) {
    const [isAttendees, setIsAttendees] = useState<boolean>(props?.isAttendees)
    const [allDay, setAllDay] = useState<boolean>(props?.allDay)
    const [isRecurring, setIsRecurring] = useState<boolean>(props?.isRecurring)
    const [isBreak, setIsBreak] = useState<boolean>(props?.isBreak)

    const setParentAllDay = props?.setParentAllDay
    const setParentIsRecurring = props?.setParentIsRecurring
    const setParentIsAttendees = props?.setParentIsAttendees
    const setParentIsBreak = props?.setParentIsBreak

    const changeAllDay = (value: boolean) => {
        setAllDay(value)
        setParentAllDay(value)
    }

    const changeIsRecurring = (value: boolean) => {
        setIsRecurring(value)
        setParentIsRecurring(value)
    }

    const changeIsAttendees = (value: boolean) => {
        setIsAttendees(value)
        setParentIsAttendees(value)
    }

    const changeIsBreak = (value: boolean) => {
        setIsBreak(value)
        setParentIsBreak(value)
    }

    return (
        <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%'}}>
            <Box flex={1} style={{ width: '90%' }} p={{ phone: 's', tablet: 'm' }}>
                <Box flex={1} flexDirection="row" justifyContent="flex-start" alignItems="center">  
                    <Text variant="optionHeader" pt={{ phone: 'm', tablet: 's' }}>
                        Change this to an all day event?
                    </Text>
                </Box>
                <Box flex={1} flexDirection="row" justifyContent="flex-end" pt={{ phone: 'm', tablet: 's' }}>
                    <Switch1
                        checked={allDay}
                        onValueChange={changeAllDay}
                        style={{marginBottom: 20}}
                    />
                </Box>
            </Box>
            <Box flex={1} style={{ width: '90%' }} p={{ phone: 's', tablet: 'm' }}>
                <Box flex={1} flexDirection="row" justifyContent="flex-start" alignItems="center">  
                    <Text variant="optionHeader" pt={{ phone: 'm', tablet: 's' }}>
                        Make this a recurring event?
                    </Text>
                </Box>
                <Box flex={1} flexDirection="row" justifyContent="flex-end" pt={{ phone: 'm', tablet: 's' }}>
                    <Switch1
                        checked={isRecurring}
                        onValueChange={changeIsRecurring}
                        style={{marginBottom: 20}}
                    />
                </Box>
            </Box>
            <Box flex={1} flexDirection={{ phone: 'column', tablet: 'row' }} justifyContent={{ phone: 'center', tablet: 'space-between' }} style={{ width: '90%' }} p={{ phone: 's', tablet: 'm' }}>
                <Box flex={1} flexDirection="row" justifyContent="flex-start" alignItems="center">  
                    <Text variant="optionHeader" pt={{ phone: 'm', tablet: 's' }}>
                        Add attendees to this event?
                    </Text>
                </Box>
                <Box flex={1} flexDirection="row" justifyContent="flex-end" pt={{ phone: 'm', tablet: 's' }}>
                    <Switch1
                        checked={isAttendees}
                        onValueChange={changeIsAttendees}
                        style={{marginBottom: 20}}
                    />
                </Box>
            </Box>
            <Box style={{ width: '90%' }} flex={1} p={{ phone: 's', tablet: 'm' }}>
                <Box flex={1} flexDirection="row" justifyContent="flex-start" alignItems="center">  
                    <Text variant="optionHeader" pt={{ phone: 'm', tablet: 's' }}>
                        Is this your break?
                    </Text>
                </Box>
                <Box flex={1} flexDirection="row" justifyContent="flex-end" pt={{ phone: 'm', tablet: 's' }}>
                    <Switch1
                        checked={isBreak}
                        onValueChange={changeIsBreak}
                        style={{marginBottom: 20}}
                    />
                </Box>
            </Box>
        </Box> 
    )

}

export default CreateEventBaseStep2