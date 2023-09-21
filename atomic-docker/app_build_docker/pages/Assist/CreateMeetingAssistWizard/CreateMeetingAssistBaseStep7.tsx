import React, {
  useState,
  Dispatch,
  SetStateAction,
} from 'react'
import { colorsPalette as Colors } from '@lib/theme/colorsPalette'
import { Tooltip } from '@chakra-ui/react'
 import Switch1 from '@components/Switch'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import TextField from '@components/TextField'

import { ScrollView } from 'react-native'

import { NextApiRequest, NextApiResponse } from 'next';
import supertokensNode from 'supertokens-node'
import { backendConfig } from '../../../config/backendConfig'
import Session from 'supertokens-node/recipe/session'

const styles = {
    minThresholdCount: {
        fontSize: '21px',
        lineHeight: '28px',
    },
    container: {
      flex: 1,
    },
}
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
    anyoneCanAddSelf: boolean,
    guestsCanSeeOtherGuests: boolean,
    minThresholdCount: number,
    guaranteeAvailability: boolean,
    isRecurring: boolean,
    lockAfter: boolean,
    setParentAnyoneCanAddSelf: Dispatch<SetStateAction<boolean>>,
    setParentGuestsCanSeeOtherGuests: Dispatch<SetStateAction<boolean>>,
    setParentMinThresholdCount: Dispatch<SetStateAction<number>>,
    setParentGuaranteeAvailability: Dispatch<SetStateAction<boolean>>,
    setParentIsRecurring: Dispatch<SetStateAction<boolean>>,
    setParentLockAfter: Dispatch<SetStateAction<boolean>>,
}

function CreateMeetingAssistBaseStep7(props: Props) {
    const [anyoneCanAddSelf, setAnyoneCanAddSelf] = useState<boolean>(props?.anyoneCanAddSelf)
    const [guestsCanSeeOtherGuests, setGuestsCanSeeOtherGuests] = useState<boolean>(props?.guestsCanSeeOtherGuests)
    const [minThresholdCount, setMinThresholdCount] = useState<number>(props?.minThresholdCount)
    const [guaranteeAvailability, setGuaranteeAvailability] = useState<boolean>(props?.guaranteeAvailability)
    const [isRecurring, setIsRecurring] = useState<boolean>(props?.isRecurring)
    const [lockAfter, setLockAfter] = useState<boolean>(props?.lockAfter)
    const [isMessage, setIsMessage] = useState<boolean>(false)

    const setParentAnyoneCanAddSelf = props?.setParentAnyoneCanAddSelf
    const setParentGuestsCanSeeOtherGuests = props?.setParentGuestsCanSeeOtherGuests
    const setParentMinThresholdCount = props?.setParentMinThresholdCount
    const setParentGuaranteeAvailability = props?.setParentGuaranteeAvailability
    const setParentIsRecurring = props?.setParentIsRecurring
    const setParentLockAfter = props?.setParentLockAfter

    const changeAnyoneCanAddSelf = (value: boolean) => {
        setAnyoneCanAddSelf(value)
        setParentAnyoneCanAddSelf(value)
    }

    const changeGuestsCanSeeOtherGuests = (value: boolean) => {
        setGuestsCanSeeOtherGuests(value)
        setParentGuestsCanSeeOtherGuests(value)
    }

    const changeMinThresholdCount = (e: any) => {
        setMinThresholdCount(parseInt(e?.target?.value.replace(/[^0-9.]/g, ''), 10))
        setParentMinThresholdCount(parseInt(e?.target?.value.replace(/[^0-9.]/g, ''), 10))
    }

    const changeGuaranteeAvailability = (value: boolean) => {
        setGuaranteeAvailability(value)
        setParentGuaranteeAvailability(value)
    }

    const changeIsRecurring = (value: boolean) => {
        setIsRecurring(value)
        setParentIsRecurring(value)
    }

    const changeLockAfter = (value: boolean) => {
        setLockAfter(value)
        setParentLockAfter(value)
    }

    return (

        <ScrollView style={{ flex: 1, width: '100%', minHeight: '65vh', maxHeight: '65vh' }} contentContainerStyle={{ alignItems: 'center'}}>
            <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%' }}>
                <Box pt={{ phone: 'm', tablet: 's' }} flexDirection={{ tablet: "row"}} justifyContent="space-between" alignItems="flex-start" width="70%">
                    <Box flexDirection="row" justifyContent="flex-start" pt={{ phone: 'm', tablet: 's' }}>
                        <Text variant="optionHeader">
                            Can non-invited guests add themselves?
                        </Text>
                    </Box>
                    <Box flexDirection="row" justifyContent="flex-end" pt={{ phone: 'm', tablet: 's' }}>
                        <Switch1
                            onColor={Colors.purple30}
                            offColor={Colors.purple60}
                            checked={anyoneCanAddSelf}
                            onValueChange={changeAnyoneCanAddSelf}
                            style={{marginBottom: 20}}
                        />
                    </Box>
                </Box>
                <Box pt={{ phone: 'm', tablet: 's' }} flexDirection={{ tablet: "row"}} justifyContent="space-between" alignItems="flex-start" width="70%">
                    <Box flexDirection="row" justifyContent="flex-start" pt={{ phone: 'm', tablet: 's' }}>
                        <Text variant="optionHeader">
                            Can guests see other guests?
                        </Text>
                    </Box>
                    <Box flexDirection="row" justifyContent="flex-end" pt={{ phone: 'm', tablet: 's' }}>
                        <Switch1
                            onColor={Colors.purple30}
                            offColor={Colors.purple60}
                            checked={guestsCanSeeOtherGuests}
                            onValueChange={changeGuestsCanSeeOtherGuests}
                            style={{marginBottom: 20}}
                        />
                    </Box>
                </Box>
                <Box pt={{ phone: 'm', tablet: 's' }} flexDirection={{ tablet: "row"}} justifyContent="space-between" alignItems="flex-start" width="70%">
                    <Box flexDirection="row" justifyContent="flex-start" pt={{ phone: 'm', tablet: 's' }}>
                        <Text variant="optionHeader">
                            How many minimum number of attendees (including host) needed before creating a new event?
                        </Text>
                    </Box>
                    <Box flexDirection="row" justifyContent="flex-end" pt={{ phone: 'm', tablet: 's' }}>
                        
                            <TextField
                                label="Minimum threshold count"
                                type="number"
                                onChange={changeMinThresholdCount}
                                value={`${minThresholdCount}`}
                                validate="number"
                                validationMessage="Please type a number"
                                placeholder="2"
                                style={styles.minThresholdCount}
                            />
                        
                    </Box>
                </Box>
                <Box pt={{ phone: 'm', tablet: 's' }} flexDirection={{ tablet: "row"}} justifyContent="space-between" alignItems="flex-start" width="70%">
                    <Box flexDirection="row" justifyContent="flex-start" pt={{ phone: 'm', tablet: 's' }}>
                        <Tooltip label='Users will able to select custom timeslots that can overlap with already registered events. Events will be placed somewhere else if possible. Note: events from non-Atomic users cannot be changed.' bg='purple.700' color='white' aria-label='A tooltip'>
                            <Text variant="buttonLink" pt={{ phone: 'm', tablet: 's' }}>
                                Do you like to guarantee availability of any time slot regardless of being busy or not?
                            </Text>
                        </Tooltip>
                    </Box>
                    <Box flexDirection="row" justifyContent="flex-end" pt={{ phone: 'm', tablet: 's' }}>
                        <Switch1
                            onColor={Colors.purple30}
                            offColor={Colors.purple60}
                            checked={guaranteeAvailability}
                            onValueChange={changeGuaranteeAvailability}
                            style={{marginBottom: 20}}
                        />
                    </Box>
                </Box>
                <Box pt={{ phone: 'm', tablet: 's' }} flexDirection={{ tablet: "row"}} justifyContent="space-between" alignItems="flex-start" width="70%">
                    <Box flexDirection="row" justifyContent="flex-start" >
                        <Text variant="optionHeader">
                            Do you want this meeting to be recurring?
                        </Text>
                    </Box>
                    <Box flexDirection="row" justifyContent="flex-end" >
                        <Switch1
                            onColor={Colors.purple30}
                            offColor={Colors.purple60}
                            checked={isRecurring}
                            onValueChange={changeIsRecurring}
                            style={{marginBottom: 20}}
                        />
                    </Box>
                </Box>
                <Box pt={{ phone: 'm', tablet: 's' }} flexDirection={{ tablet: "row"}} justifyContent="space-between" alignItems="flex-start" width="70%">
                    <Box flexDirection="row" justifyContent="flex-start" >
                        <Tooltip label='Every time the AI planner runs, it will look for a more optimal time given the schedule context. By enabling lock after, the AI planner will no longer be able to move the meeting after the first cycle.' bg='purple.700' color='white' aria-label='A tooltip'>
                            <Text variant="buttonLink" pt={{ phone: 'm', tablet: 's' }}>
                            Do you want to lock after or make it not modifiable for AI planner after meeting is formed?
                            </Text>
                        </Tooltip>
                    </Box>
                    <Box flexDirection="row" justifyContent="flex-end" >
                        <Switch1
                            onColor={Colors.purple30}
                            offColor={Colors.purple60}
                            checked={lockAfter}
                            onValueChange={changeLockAfter}
                            style={{marginBottom: 20}}
                        />
                    </Box>
                </Box>
            </Box>
        </ScrollView>

    )
}

export default CreateMeetingAssistBaseStep7