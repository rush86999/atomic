import React, {
  useState,
  Dispatch,
  SetStateAction,
} from 'react'

import { dayjs } from '@lib/date-utils'
// import DatePicker from 'react-native-date-picker'
// import DateTimePicker from 'react-datetime-picker/dist/entry.nostyle'
import { colorsPalette as Colors } from '@lib/theme/colorsPalette'
import { Tooltip } from '@chakra-ui/react'
import Switch1 from '@components/Switch'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import TextField from '@components/TextField'

import { Appearance, Pressable, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { useToast } from '@chakra-ui/react'

import { Input } from '@chakra-ui/react'
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
  cancelIfAnyRefuse: boolean,
  enableAttendeePreferences: boolean,
  attendeeCanModify: boolean,
  expireDate: Date,
  duration: number,
  setParentCancelIfAnyRefuse: Dispatch<SetStateAction<boolean>>,
  setParentEnableAttendeePreferences: Dispatch<SetStateAction<boolean>>,
  setParentAttendeeCanModify: Dispatch<SetStateAction<boolean>>,
  setParentExpireDate: Dispatch<SetStateAction<Date>>,
  setParentDuration: Dispatch<SetStateAction<number>>,
}

const dark = Appearance.getColorScheme() === 'dark'

const styles = {
    duration: {
        fontSize: '21px',
        lineHeight: '28px',
        width: '30%',
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
}


function EditMeetingAssistBaseStep5(props: Props) {
  const [cancelIfAnyRefuse, setCancelIfAnyRefuse] = useState<boolean>(props?.cancelIfAnyRefuse)
  const [enableAttendeePreferences, setEnableAttendeePreferences] = useState<boolean>(props?.enableAttendeePreferences)
    const [attendeeCanModify, setAttendeeCanModify] = useState<boolean>(props?.attendeeCanModify)
    const [expireDate, setExpireDate] = useState<Date>(props?.expireDate)
    const [duration, setDuration] = useState<number>(props?.duration)
    const [isMessage, setIsMessage] = useState<boolean>(false)
    const [isExpireDatePicker, setIsExpireDatePicker] = useState<boolean>(false)
    const [pageOffset, setPageOffset] = useState<number>(0)
    const toast = useToast()
    const { height: fullHeight } = Dimensions.get('window')


  const setParentCancelIfAnyRefuse = props?.setParentCancelIfAnyRefuse
  const setParentEnableAttendeePreferences = props?.setParentEnableAttendeePreferences
  const setParentAttendeeCanModify = props?.setParentAttendeeCanModify
  const setParentExpireDate = props?.setParentExpireDate
  const setParentDuration = props?.setParentDuration



  const changeCancelIfAnyRefuse = (value: boolean) => {
    setCancelIfAnyRefuse(value)
    setParentCancelIfAnyRefuse(value)
  }

  const changeEnableAttendeePreferences = (value: boolean) => {
      setEnableAttendeePreferences(value)
      setParentEnableAttendeePreferences(value)
  }

  const changeAttendeeCanModify = (value: boolean) => {
      setAttendeeCanModify(value)
      setParentAttendeeCanModify(value)
  }

  const changeExpireDate = (value: Date) => {
      setExpireDate(value)
      setParentExpireDate(value)
  }

  // 
  const changeDuration = (e: { target: { value: string } }) => {
    const value = e?.target?.value
    const intValue = parseInt(value.replace(/[^0-9.]/g, ''), 10)

      // validate
      if (intValue < 10) {
        toast({
            status: 'error',
            title: 'Too short',
            description: 'Your duration is too short',
            duration: 9000,
            isClosable: true,
        })

          return
      }

      setDuration(intValue)
      setParentDuration(intValue)
  }

  const hideExpireDatePicker = () => setIsExpireDatePicker(false)

  const showExpireDatePicker = () => setIsExpireDatePicker(true)

    return (
        <Box flex={1} style={{ width: '100%' }}>

            <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={{ alignItems: 'center'}}> 
                <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%' }}>
                    <Box p={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center" style={{ width: '90%' }}>
                        <Box flexDirection="row" justifyContent="flex-start" alignItems="center" style={{ width: '100%' }}>
                            <Text variant="optionHeader" pt={{ phone: 'm', tablet: 's' }}>
                                Cancel planning if any refuse?
                            </Text>
                        </Box>
                        <Box flexDirection="row" justifyContent="flex-end" pt={{ phone: 'm', tablet: 's' }} style={{ width: '100%' }}>
                            <Switch1
                                onColor={Colors.purple30}
                                offColor={Colors.purple60}
                                checked={cancelIfAnyRefuse}
                                onValueChange={changeCancelIfAnyRefuse}
                                style={{marginBottom: 20}}
                            />
                        </Box>
                    </Box>
                    <Box p={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center" style={{ width: '90%' }}>
                        <Box flexDirection="row" justifyContent="flex-start" alignItems="center" style={{ width: '100%' }}>
                            <Text variant="optionHeader" pt={{ phone: 'm', tablet: 's' }}>
                                Allow attendee to select time preferences (slots) for event?
                            </Text>
                        </Box>
                        <Box flexDirection="row" justifyContent="flex-end" pt={{ phone: 'm', tablet: 's' }} style={{ width: '100%' }}>
                            <Switch1
                                onColor={Colors.purple30}
                                offColor={Colors.purple60}
                                checked={enableAttendeePreferences}
                                onValueChange={changeEnableAttendeePreferences}
                                style={{marginBottom: 20}}
                            />
                        </Box>
                    </Box>
                    <Box p={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center" style={{ width: '90%' }}>
                        <Box flexDirection="row" justifyContent="flex-start" alignItems="center" style={{ width: '100%' }}>
                            <Text variant="optionHeader" pt={{ phone: 'm', tablet: 's' }}>
                                Allow attendee to change existing time preferences (slots) for event?
                            </Text>
                        </Box>
                        <Box flexDirection="row" justifyContent="flex-end" pt={{ phone: 'm', tablet: 's' }} style={{ width: '100%' }}>
                            <Switch1
                                onColor={Colors.purple30}
                                offColor={Colors.purple60}
                                checked={attendeeCanModify}
                                onValueChange={changeAttendeeCanModify}
                                style={{marginBottom: 20}}
                            />
                        </Box>
                    </Box>
                    <Box p={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center" style={{ width: '90%' }}>
                        <Box flexDirection="row" justifyContent="flex-start" alignItems="center" style={{ width: '100%' }}>   
                            <Tooltip label="You can select a time when the meeting assist will no longer valid if minimum number of attendees do not say \'Yes\'. In other words, no new events will be created." bg='purple.700' color='white' aria-label='A tooltip'>
                                <Text p={{ phone: 's', tablet: 'm' }} variant="optionHeader">
                                    When will planning this event expire if minimum threshold of accepted invites is not met?
                                </Text>
                            </Tooltip>

                        </Box>
                        <Box flexDirection="row" justifyContent="flex-end" alignItems="center" style={{ width: '100%' }}>
                           <Input
                                placeholder="Select Date and Time"
                                size="md"
                                type="datetime-local"
                                onChange={(e) => {
                                    changeExpireDate(dayjs(e?.target?.value, "YYYY-MM-DDTHH:mm").toDate())
                                }}
                                value={dayjs(expireDate).format("YYYY-MM-DDTHH:mm")}
                            />
                            
                        </Box>
                    </Box>
                    <Box p={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center" style={{ width: '90%' }}>
                        <Box flexDirection="row" justifyContent="flex-start" alignItems="center" style={{ width: '100%' }}>
                            <Text variant="optionHeader" pt={{ phone: 'm', tablet: 's' }}>
                                How long is the event?
                            </Text>
                        </Box>
                            <Box flexDirection="row" justifyContent="flex-end" alignItems="center" style={{ width: '100%' }}>
                                
                                    <TextField
                                        label="Duration (minutes)"
                                        type="number"
                                        onChange={changeDuration}
                                        value={`${duration}`}
                                        placeholder="1"
                                        style={styles.duration}
                                    />

                        </Box>
                    </Box>
                </Box>
            </ScrollView>
            
        </Box>
  )
}

export default EditMeetingAssistBaseStep5
