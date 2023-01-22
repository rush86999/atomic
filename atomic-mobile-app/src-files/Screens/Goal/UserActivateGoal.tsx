import React, { useState } from 'react'
import { useColorScheme } from 'react-native'
import DatePicker from 'react-native-date-picker'

import { TextField} from 'react-native-ui-lib'

import Box from '@components/common/Box'
import Text from '@components/common/Text'
import RegularCard from '@components/RegularCard'

import { palette } from '@theme/theme'


type Props = {
  goalUnit: string,
  isUnit?: boolean,
  onGoalChange: (goal: string) => void,
  onGoalUnitChange?: (goal: string) => void,
  onEndDateChange: (date: Date) => void,
}

function UserActivateGoal(props: Props) {
  const [goal, setGoal] = useState<string>()
  const [endDate, setEndDate] = useState<Date>(new Date())

  const dark = useColorScheme() === 'dark'

  const {
    goalUnit: goalUnitEl,
    onGoalChange,
    onEndDateChange,
    onGoalUnitChange,
    isUnit,
  } = props

  const [goalUnit, setGoalUnit] = useState<string>(goalUnitEl)


  const onNewGoal = (text: string) => {
    setGoal(text)
    onGoalChange(text)
  }

  const onNewEndDate = (date: Date) => {
    setEndDate(date)
    onEndDateChange(date)
  }

  const onNewGoalUnit = (text: string) => {
    setGoalUnit(text)
    onGoalUnitChange(text)
  }

  return (
    <Box flex={1} justifyContent="center" alignItems="center">
      <RegularCard>
        <Text variant="header" mt={{ phone: 's', tablet: 'm' }}>
          Set a Goal?
        </Text>
        <Text variant="optionHeader" mr={{ phone: 's', tablet: 'm' }}>
          Goal
        </Text>
        <Box justifyContent="center" mt={{ phone: 's', tablet: 'm' }}>
          <TextField
            type="numeric"
            onChangeText={(text: string) => onNewGoal(text.replace(/[^0-9.]/g, ''))}
            value={goal}
          />
          {
            isUnit
            ? (
              <TextField
                onChangeText={onNewGoalUnit}
                value={goalUnit || 'minutes'}
              />
            ) : (
              <Text variant="optionHeader">
                {goalUnit}
              </Text>
            )
          }
        </Box>
        <Box mt={{ phone: 's', tablet: 'm' }}>
          <Text variant="subTitle">
            End Date
          </Text>
          <DatePicker
            date={endDate}
            onDateChange={onNewEndDate}
            mode="time"
            theme={dark ? 'dark' : 'light'}
          />
        </Box>
    </RegularCard>
    </Box>
  )
}

export default UserActivateGoal
