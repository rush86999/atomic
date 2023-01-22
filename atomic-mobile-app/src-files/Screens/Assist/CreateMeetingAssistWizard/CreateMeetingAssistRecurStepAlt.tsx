import React, {
  useState,
  Dispatch,
  SetStateAction,
} from 'react'
import { Pressable, useColorScheme, } from 'react-native'
import { TextField, Picker, PickerValue } from 'react-native-ui-lib'
import DatePicker from 'react-native-date-picker'
import Box from '@components/common/Box'
import Text from '@components/common/Text'

import { palette } from '@theme/theme'

import { dayjs } from '@app/date-utils'
import { RecurrenceFrequencyType } from '@screens/Calendar/types'
import _ from 'lodash'


const frequencyOptions = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
]

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
      <Box flex={1} justifyContent="flex-end" alignItems="center" style={{ width: '90%'}}>
        <Box flex={1} justifyContent="flex-end" alignItems="center" style={{ width: '100%'}}>
          <Pressable onPress={showUntilPicker}>
            <Text variant="buttonLink">
              End Date for Recurrence: {dayjs(until).format('MM/DD/YYYY h:mm A')}
            </Text>
          </Pressable>
        </Box>
        <DatePicker
          modal
          open={isRecurring}
          date={until}
          onConfirm={(date) => {
            changeUntil(date)
            hideUntilPicker()
          }}
          onCancel={() => {
            hideUntilPicker()
          }}
          theme={dark ? 'dark' : 'light'}
        />
      </Box>
      <Box flex={1} m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
          <Text m={{ phone: 's', tablet: 'm' }} variant="optionHeader">
              Select how oftern to recur?
          </Text>         
          <Picker
              modal
              style={{ color: dark ? palette.white : palette.textBlack }}
              placeholder="frequency"
              useNativePicker
              migrateTextField
              value={frequency}
              onChange={(itemValue: PickerValue) => {
              
              changeFrequency(itemValue as RecurrenceFrequencyType)
              }}
          >
              {_.map(frequencyOptions, option => (
                  <Picker.Item
                    key={option.value}
                    label={option.label}
                    value={option.value}
                  />
              ))}
          </Picker>
      </Box>
      <Box flex={1} m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center"  style={{ width: '100%'}}>
        <Box justifyContent="center" alignItems="flex-start" style={{ width: '90%'}}>
          <Text variant="optionHeader">
            Interval (ex: every 2 weeks)
          </Text>
        </Box>
        <Box flex={1} m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="flex-end"  style={{ width: '90%'}}>
          <TextField
            type="numeric"
            onChangeText={(text: string) => changeInterval(text.replace(/[^0-9.]/g, '') || '0')}
            value={interval}
            placeholder="1"
            style={{ width: '20%' }}
          />
        </Box>
      </Box>
    </Box>
  )
}

export default CreateMeetingAssistRecurStepAlt

