import React, {
  useState,
  Dispatch,
  SetStateAction,
} from 'react'
import { Colors, Switch } from 'react-native-ui-lib'

import Box from '@components/common/Box'
import Text from '@components/common/Text'
import { ScrollView } from 'react-native'

type Props = {
  copyAvailability: boolean,
  copyTimeBlocking: boolean,
  copyTimePreference: boolean,
  copyReminders: boolean,
  copyPriorityLevel: boolean,
  copyModifiable: boolean,
  setParentCopyAvailability: Dispatch<SetStateAction<boolean>>,
  setParentCopyTimeBlocking: Dispatch<SetStateAction<boolean>>,
  setParentCopyTimePreference: Dispatch<SetStateAction<boolean>>,
  setParentCopyReminders: Dispatch<SetStateAction<boolean>>,
  setParentCopyPriorityLevel: Dispatch<SetStateAction<boolean>>,
  setParentCopyModifiable: Dispatch<SetStateAction<boolean>>,
}

function EditPreferenceStep3(props: Props) {
  const [copyAvailability, setCopyAvailability] = useState<boolean>(props?.copyAvailability)
  const [copyTimeBlocking, setCopyTimeBlocking] = useState<boolean>(props?.copyTimeBlocking)
  const [copyTimePreference, setCopyTimePreference] = useState<boolean>(props?.copyTimePreference)
  const [copyReminders, setCopyReminders] = useState<boolean>(props?.copyReminders)
  const [copyPriorityLevel, setCopyPriorityLevel] = useState<boolean>(props?.copyPriorityLevel)
  const [copyModifiable, setCopyModifiable] = useState<boolean>(props?.copyModifiable)

  const setParentCopyAvailability = props?.setParentCopyAvailability
  const setParentCopyTimeBlocking = props?.setParentCopyTimeBlocking
  const setParentCopyTimePreference = props?.setParentCopyTimePreference
  const setParentCopyReminders = props?.setParentCopyReminders
  const setParentCopyPriorityLevel = props?.setParentCopyPriorityLevel
  const setParentCopyModifiable = props?.setParentCopyModifiable

  const changeCopyAvailability = (value: boolean) => {
    setCopyAvailability(value)
    setParentCopyAvailability(value)
  }

  const changeCopyTimeBlocking = (value: boolean) => {
    setCopyTimeBlocking(value)
    setParentCopyTimeBlocking(value)
  }

  const changeCopyTimePreference = (value: boolean) => {
    setCopyTimePreference(value)
    setParentCopyTimePreference(value)
  }

  const changeCopyReminders = (value: boolean) => {
    setCopyReminders(value)
    setParentCopyReminders(value)
  }

  const changeCopyPriorityLevel = (value: boolean) => {
    setCopyPriorityLevel(value)
    setParentCopyPriorityLevel(value)
  }

  const changeCopyModifiable = (value: boolean) => {
    setCopyModifiable(value)
    setParentCopyModifiable(value)
  }

  return (
    <Box flex={1} justifyContent="center" alignItems="center">
      <ScrollView style={{ width: '100%' }} contentContainerStyle={{ width: '100%', justifyContent: 'center', alignItems: 'center' }}>
        <Box flex={1} style={{ width: '90%' }} m={{ phone: 's', tablet: 'm' }}>
          <Box flexDirection="row" justifyContent="flex-start" alignItems="center">   
            <Text variant="optionHeader">Copy over transparency of event to any new events whose details are similar?</Text>
          </Box>
          <Box flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }}>
            <Switch
                onColor={Colors.purple30}
                offColor={Colors.purple60}
                value={copyAvailability}
                onValueChange={changeCopyAvailability}
                style={{marginBottom: 20}}
            />
          </Box>
        </Box>
        <Box flex={1} style={{ width: '90%' }} m={{ phone: 's', tablet: 'm' }}>
          <Box style={{ width: '100%' }} flexDirection="row" justifyContent="flex-start" alignItems="center">  
            <Text variant="optionHeader">Copy over buffer times to any new events whose details are similar?</Text>
          </Box>
          <Box style={{ width: '100%' }} flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }}>
              <Switch
                  onColor={Colors.purple30}
                  offColor={Colors.purple60}
                  value={copyTimeBlocking}
                  onValueChange={changeCopyTimeBlocking}
                  style={{ marginBottom: 20 }}
              />
          </Box>
        </Box>
        <Box flex={1} style={{ width: '90%' }} m={{ phone: 's', tablet: 'm' }}>
          <Box style={{ width: '100%' }} flexDirection="row" justifyContent="flex-start" alignItems="center">
            <Text variant="optionHeader">Copy over time preference to any new events whose details are similar for scheduling assists?</Text>
          </Box>
          <Box style={{ width: '100%' }} flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }}>
              <Switch
                  onColor={Colors.purple30}
                  offColor={Colors.purple60}
                  value={copyTimePreference}
                  onValueChange={changeCopyTimePreference}
                  style={{ marginBottom: 20 }}
              />
          </Box>
        </Box>
        <Box flex={1} style={{ width: '90%' }} m={{ phone: 's', tablet: 'm' }}>
          <Box style={{ width: '100%' }} flexDirection="row" justifyContent="flex-start" alignItems="center">
            <Text variant="optionHeader">Copy over reminders to any new events whose details are similar?</Text>
          </Box>
          <Box style={{ width: '100%' }} flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }}>
              <Switch
                  onColor={Colors.purple30}
                  offColor={Colors.purple60}
                  value={copyReminders}
                  onValueChange={changeCopyReminders} 
                  style={{ marginBottom: 20 }}
              />  
          </Box>
        </Box>
        <Box flex={1} style={{ width: '90%' }} m={{ phone: 's', tablet: 'm' }}>
          <Box style={{ width: '100%' }} flexDirection="row" justifyContent="flex-start" alignItems="center">
            <Text variant="optionHeader">Copy over priority level to any new events whose details are similar for scheduling assists?</Text>
          </Box>
          <Box style={{ width: '100%' }} flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }}>
              <Switch
                  onColor={Colors.purple30}
                  offColor={Colors.purple60}
                  value={copyPriorityLevel}
                  onValueChange={changeCopyPriorityLevel}
                  style={{ marginBottom: 20 }}
              />
          </Box>
        </Box>
        <Box flex={1} style={{ width: '90%' }} m={{ phone: 's', tablet: 'm' }}>  
          <Box style={{ width: '100%' }} flexDirection="row" justifyContent="flex-start" alignItems="center">
            <Text variant="optionHeader">Copy over time modifiable / time not modifiable value to any new events whose details are similar for scheduling assists? </Text>
          </Box>
          <Box style={{ width: '100%' }} flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }}>
            <Switch
              onColor={Colors.purple30}
              offColor={Colors.purple60}
              value={copyModifiable}
              onValueChange={changeCopyModifiable}
              style={{ marginBottom: 20 }}
            />
          </Box>
        </Box>
      </ScrollView>
    </Box>
  )
}

export default EditPreferenceStep3


