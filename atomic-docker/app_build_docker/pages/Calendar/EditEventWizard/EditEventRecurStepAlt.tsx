import React, {
  useState,
  Dispatch,
  SetStateAction,
 } from 'react'
import { Pressable, StyleSheet, useColorScheme } from 'react-native'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react'
import Switch1 from '@components/Switch'
import {Picker} from '@react-native-picker/picker'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import TextField from '@components/TextField'
import Button from '@components/Button'
// import DatePicker from 'react-native-date-picker'
// import DateTimePicker from 'react-datetime-picker/dist/entry.nostyle'
import { Input } from '@chakra-ui/react'
import { palette } from '@lib/theme/theme'
import RegularCard from '@components/RegularCard'
import { dayjs } from '@lib/date-utils'
import { RecurrenceFrequencyType } from '@lib/Assist/types'
import { NextApiRequest, NextApiResponse } from 'next';
import supertokensNode from 'supertokens-node'
import { backendConfig } from '../../../config/backendConfig'
import Session from 'supertokens-node/recipe/session'
import { Day } from '@lib/Schedule/constants'

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

const styles = {
  day: {
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    width: 50,
  },
  container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
  },
}

type Props = {
  recurringEndDate: Date,
  setParentRecurringEndDate: Dispatch<SetStateAction<Date>>,
  frequency: RecurrenceFrequencyType,
  setParentFrequency: Dispatch<SetStateAction<RecurrenceFrequencyType>>,
  interval: string,
  setParentInterval: Dispatch<SetStateAction<string>>,
  byWeekDay: Day[], 
  setParentByWeekDay: Dispatch<SetStateAction<Day[]>>,
}

function EditEventRecurStepAlt(props: Props) {
  const [recurringEndDate, setRecurringEndDate] = useState<Date>(props?.recurringEndDate)
  const [frequency, setFrequency] = useState<RecurrenceFrequencyType>(props?.frequency || 'daily')
  const [interval, setInterval1] = useState<string>('1')
  const [byWeekDay, setByWeekDay] = useState<Day[]>(props?.byWeekDay)
  const [MO, setMO] = useState<boolean>(props?.byWeekDay?.includes(Day.MO) || false)
  const [TU, setTU] = useState<boolean>(props?.byWeekDay?.includes(Day.TU) || false)
  const [WE, setWE] = useState<boolean>(props?.byWeekDay?.includes(Day.WE) || false)
  const [TH, setTH] = useState<boolean>(props?.byWeekDay?.includes(Day.TH) || false)
  const [FR, setFR] = useState<boolean>(props?.byWeekDay?.includes(Day.FR) || false)
  const [SA, setSA] = useState<boolean>(props?.byWeekDay?.includes(Day.SA) || false)
  const [SU, setSU] = useState<boolean>(props?.byWeekDay?.includes(Day.SU) || false)
  const [isWeekDay, setIsWeekDay] = useState<boolean>(props?.byWeekDay?.length > 0 || false)
  const [isRecurring, setIsRecurring] = useState<boolean>(false)

  const { isOpen, onOpen, onClose } = useDisclosure()

  // const dark = useColorScheme() === 'dark'

  const setParentRecurringEndDate = props?.setParentRecurringEndDate
  const setParentFrequency = props?.setParentFrequency
  const setParentInterval = props?.setParentInterval
  const setParentByWeekDay = props?.setParentByWeekDay

  const hideIsWeekDay = () => setIsWeekDay(false)
  
  const showIsWeekDay = () => setIsWeekDay(true)

  const hideRecurringEndDatePicker = () => setIsRecurring(false)
  
  const showRecurringEndDatePicker = () => setIsRecurring(true)

  const changeRecurringEndDate = (value: Date) => {
    setRecurringEndDate(value)
    setParentRecurringEndDate(value)
  }

  const changeFrequency = (value: RecurrenceFrequencyType) => {
    setFrequency(value)
    setParentFrequency(value)
  }

  const changeInterval = (value: string) => {
    setInterval1(value)
    setParentInterval(value)
  }

  const changeWeekDay = (value: Day[]) => {
    setByWeekDay(value)
    setParentByWeekDay(value)
  }

  const changeMO = () => {
    setMO(!MO)
    if (!MO) {
      if (byWeekDay?.length > 0) {
        const newWeekDay = [...byWeekDay, Day.MO]
        changeWeekDay(newWeekDay)
      } else {
        const newWeekDay = [Day.MO]
        changeWeekDay(newWeekDay)
      }
      
    } else {
      changeWeekDay(byWeekDay.filter(day => day !== Day.MO))
    }
  }

  const changeTU = () => {
    setTU(!TU)
    if (!TU) {
      if (byWeekDay?.length > 0) {
        const newWeekDay = [...byWeekDay, Day.TU]
        changeWeekDay(newWeekDay)
      } else {
        const newWeekDay = [Day.TU]
        changeWeekDay(newWeekDay)
      }
    } else {
      changeWeekDay(byWeekDay.filter(day => day !== Day.TU))
    }
  }

  const changeWE = () => {
    setWE(!WE)
    if (!WE) {
      if (byWeekDay?.length > 0) {
        const newWeekDay = [...byWeekDay, Day.WE]
        changeWeekDay(newWeekDay)
      } else {
        const newWeekDay = [Day.WE]
        changeWeekDay(newWeekDay)
      }
      
    } else {
      changeWeekDay(byWeekDay.filter(day => day !== Day.WE))
    }
  }

  const changeTH = () => {
    setTH(!TH)
    if (!TH) {
      if (byWeekDay?.length > 0) {
        const newWeekDay = [...byWeekDay, Day.TH]
        changeWeekDay(newWeekDay)
      } else {
        const newWeekDay = [Day.TH]
        changeWeekDay(newWeekDay)
      }
      
    } else {
      changeWeekDay(byWeekDay.filter(day => day !== Day.TH))
    }
  }

  const changeFR = () => {
    setFR(!FR)
    if (!FR) {
      if (byWeekDay?.length > 0) {
        const newWeekDay = [...byWeekDay, Day.FR]
        changeWeekDay(newWeekDay)
      } else {
        const newWeekDay = [Day.FR]
        changeWeekDay(newWeekDay)
      }
      
    } else {
      changeWeekDay(byWeekDay.filter(day => day !== Day.FR))
    }
  }

  const changeSA = () => {
    setSA(!SA)
    if (!SA) {
      if (byWeekDay?.length > 0) {
        const newWeekDay = [...byWeekDay, Day.SA]
        changeWeekDay(newWeekDay)
      } else {
        const newWeekDay = [Day.SA]
        changeWeekDay(newWeekDay)
      }
      
    } else {
      changeWeekDay(byWeekDay.filter(day => day !== Day.SA))
    }
  }

  const changeSU = () => {
    setSU(!SU)
    if (!SU) {
      if (byWeekDay?.length > 0) {
        const newWeekDay = [...byWeekDay, Day.SU]
        changeWeekDay(newWeekDay)
      } else {
        const newWeekDay = [Day.SU]
        changeWeekDay(newWeekDay)
      }
      
    } else {
      changeWeekDay(byWeekDay.filter(day => day !== Day.SU))
    }
  }

  const changeEnableWeekDay = (value: boolean) => {
    setIsWeekDay(value)
  }

  return (
    <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%'}}>
      <Box flex={1} justifyContent="flex-end" alignItems="center" style={{ width: '90%'}}>
        <Box flex={1} justifyContent="flex-end" alignItems="center" style={{ width: '100%'}}>
            <Text variant="optionHeader">
              End Date for Recurrence
            </Text>
        </Box>
        <Input
          placeholder="Select Date and Time"
          size="md"
          type="datetime-local"
          onChange={(e) => {
              changeRecurringEndDate(dayjs(e?.target?.value, "YYYY-MM-DDTHH:mm").toDate())
            }}
          value={dayjs(recurringEndDate).format("YYYY-MM-DDTHH:mm")}
        />
      </Box>
      <Box flex={3} p={{ phone: 's', tablet: 'm' }} justifyContent="flex-start" alignItems="center" style={{ width: '100%'}}>
        <Picker
          selectedValue={frequency}
          onValueChange={changeFrequency}
          style={{ color: palette.textBlack, height: 150, width: '70%' }}
        >
            <Picker.Item color={palette.textBlack}  key="daily" value="daily" label="Daily" />
            <Picker.Item color={palette.textBlack}  key="weekly" value="weekly" label="Weekly" />
            <Picker.Item color={palette.textBlack}  key="monthly" value="monthly" label="Monthly" />
            <Picker.Item color={palette.textBlack}  key="yearly" value="yearly" label="Yearly" />
        </Picker>
      </Box>
      <Box flex={1} p={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center"  style={{ width: '100%'}}>
        <Box justifyContent="center" alignItems="flex-start" style={{ width: '90%'}}>
          <Text variant="optionHeader">
            Interval (ex: every 2 weeks)
          </Text>
        </Box>
        <Box flex={1} p={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="flex-end" style={{ width: '90%' }}>
            <TextField
              type="number"
              onChange={(e: { target: { value: string } }) => changeInterval(e?.target?.value?.replace(/[^0-9.]/g, '') || '0')}
              value={interval}
              placeholder="1"
              style={{ width: '20%' }}
            />
        </Box>
      </Box>
      <Box flex={1} p={{ phone: 's', tablet: 'm' }}  justifyContent="center" alignItems="center"  style={{ width: '100%'}}>
        <Box justifyContent="center" alignItems="flex-start" style={{ width: '90%'}}>
          <Text variant="optionHeader" pt={{ phone: 'm', tablet: 's' }}>
              {`Choose specific days of the week? ${byWeekDay?.length > 0 ? ' specific days selected' : ''}`}
          </Text>
        </Box>
        <Box flexDirection="row" justifyContent="flex-end" pt={{ phone: 'm', tablet: 's' }} style={{ width: '90%'}}>
            <Button onClick={onOpen}>
              Open to choose days 
            </Button>
        </Box>
      </Box>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Pick days of the week</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Box justifyContent="center" alignItems="center">
              <RegularCard>
                <Box width="100%" flexDirection="row" justifyContent="space-evenly" p={{ phone: 's', tablet: 'm' }}>
                <button onClick={changeMO} style={{ ...(styles.day), ...{ backgroundColor: MO ? palette.purplePrimary : palette.lightGray } }}>
                      <Text variant="optionHeader" style={{color: MO ? palette.white : palette.textBlack }}>
                        MO
                      </Text>
                  </button>
                <button onClick={changeTU} style={{ ...styles.day, ...{ backgroundColor: TU ? palette.purplePrimary : palette.lightGray } }}>
                      <Text variant="optionHeader" style={{color: TU ? palette.white : palette.textBlack }}>
                        TU
                      </Text>
                  </button>
                  <button onClick={changeWE} style={{ ...styles.day, ...{ backgroundColor: WE ? palette.purplePrimary : palette.lightGray }}}>
                      <Text variant="optionHeader" style={{color: WE ? palette.white : palette.textBlack }}>
                        WE
                      </Text>
                  </button>
                </Box>
                <Box width="100%" flexDirection="row" justifyContent="space-evenly" p={{ phone: 's', tablet: 'm' }}>
                  <button onClick={changeTH} style={{ ...(styles.day), ...{ backgroundColor: TH ? palette.purplePrimary : palette.lightGray }}}>
                      <Text variant="optionHeader" style={{color: TH ? palette.white : palette.textBlack }}>
                        TH
                      </Text>
                  </button>
                  <button onClick={changeFR} style={{ ...(styles.day), ...{ backgroundColor: FR ? palette.purplePrimary : palette.lightGray }}}>
                      <Text variant="optionHeader" style={{color: FR ? palette.white : palette.textBlack }}>
                        FR
                      </Text>
                  </button>
                <button onClick={changeSA} style={{ ...styles.day, ...{ backgroundColor: SA ? palette.purplePrimary : palette.lightGray } }}>
                      <Text variant="optionHeader" style={{color: SA ? palette.white : palette.textBlack }}>
                        SA
                      </Text>
                  </button>
                  <button onClick={changeSU} style={{...(styles.day), ...{ backgroundColor: SU ? palette.purplePrimary : palette.lightGray }}}>
                      <Text variant="optionHeader" style={{color: SU ? palette.white : palette.textBlack }}>
                        SU
                      </Text>
                  </button>
                </Box>
                <Pressable onPress={hideIsWeekDay}>
                  <Text variant="buttonLink"> Close</Text>
                </Pressable>
              </RegularCard>
            </Box>
          </ModalBody>
        </ModalContent>
        <ModalFooter>
          <Button onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </Box>
  )
}

export default EditEventRecurStepAlt
/** end */
