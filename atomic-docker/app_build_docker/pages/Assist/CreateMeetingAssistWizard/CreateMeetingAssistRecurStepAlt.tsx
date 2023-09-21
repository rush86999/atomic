import React, {
  useState,
  Dispatch,
  SetStateAction,
} from 'react'
import { Pressable, StyleSheet, useColorScheme, KeyboardAvoidingView, Platform } from 'react-native';

import TextField from '@components/TextField'
// import DatePicker from 'react-native-date-picker'
// import DateTimePicker from 'react-datetime-picker/dist/entry.nostyle'
import Box from '@components/common/Box'
import Text from '@components/common/Text'

import { palette } from '@lib/theme/theme'

import { dayjs } from '@lib/date-utils'
import { RecurrenceFrequencyType } from '@lib/Calendar/types'
import _ from 'lodash'

import { Input } from '@chakra-ui/react';


const frequencyOptions = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
]

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
  frequency: RecurrenceFrequencyType,
  interval: number,
  until: Date,
  setParentFrequency: Dispatch<SetStateAction<RecurrenceFrequencyType>>,
  setParentInterval: Dispatch<SetStateAction<number>>,
  setParentUntil: Dispatch<SetStateAction<Date>>,
}

function CreateMeetingAssistRecurStepAlt(props: Props) {
  const [frequency, setFrequency] = useState<RecurrenceFrequencyType>(props?.frequency)
  const [interval, setInterval] = useState<number>(props?.interval)
  const [until, setUntil] = useState<Date>(props?.until)
  const [isRecurring, setIsRecurring] = useState<boolean>(false)

  const dark = useColorScheme() === 'dark'


  const setParentFrequency = props?.setParentFrequency
  const setParentInterval = props?.setParentInterval
  const setParentUntil = props?.setParentUntil

  const changeUntil = (value: Date) => {
    setUntil(value)
    setParentUntil(value)
  }

  const changeFrequency = (value: RecurrenceFrequencyType) => {
    setFrequency(value)
    setParentFrequency(value)
  }

  const changeInterval = (value: string) => {
    setInterval(parseInt(value.replace(/[^0-9.]/g, ''), 10))
    setParentInterval(parseInt(value.replace(/[^0-9.]/g, ''), 10))
  }

  const hideUntilPicker = () => setIsRecurring(false)
  
  const showUntilPicker = () => setIsRecurring(true)

  return (
    <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%' }}>
      <Box flex={1} justifyContent="flex-end" alignItems="center" style={{ width: '90%' }}>
        <Text variant="optionHeader">
          Until
        </Text>
        <Box flex={1} justifyContent="flex-end" alignItems="center" style={{ width: '100%'}}>
         <Input
            placeholder="Select Date and Time"
            size="md"
            type="datetime-local"
            onChange={(e) => {
              changeUntil(dayjs(e?.target?.value, "YYYY-MM-DDTHH:mm").toDate())
            }}
            value={dayjs(until).format("YYYY-MM-DDTHH:mm")}
          />
        </Box>
      </Box>
      <Box flex={1} p={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
          <Text p={{ phone: 's', tablet: 'm' }} variant="optionHeader">
              Select how oftern to recur?
        </Text>
        <select value={frequency} onChange={(e) => changeFrequency(e?.target?.value as RecurrenceFrequencyType)} className="select select-primary w-full max-w-xs">
          <option disabled selected>frequency</option>
          {_.map(frequencyOptions, option => (
              <option
                key={option.value}
                value={option.value}
              >{option.label}</option>
            ))}
        </select>
      </Box>
      <Box flex={1} p={{ phone: 's', tablet: 'm' }}   justifyContent="center" alignItems="center"  style={{ width: '100%'}}>
        <Box justifyContent="center" alignItems="flex-start" style={{ width: '90%'}}>
          <Text variant="optionHeader">
            Interval (ex: every 2 weeks)
          </Text>
        </Box>
        <Box flex={1} p={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="flex-end" style={{ width: '90%' }}>
          
            <TextField
              type="number"
              onChange={(e: any) => changeInterval(e?.target?.value)}
              value={`${interval}`}
              placeholder="1"
            validate="number"
            validationMessage="Please type a number"
              />
          
        </Box>
      </Box>
    </Box>
  )
}

export default CreateMeetingAssistRecurStepAlt

