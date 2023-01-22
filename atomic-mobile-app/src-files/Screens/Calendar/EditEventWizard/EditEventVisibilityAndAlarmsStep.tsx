import React, {
  useState,
  Dispatch,
  SetStateAction,
  useEffect,
 } from 'react'
import {
  FlatList,
  Pressable,
  useColorScheme,
 } from 'react-native'
import { TextField } from 'react-native-ui-lib'
import Ionicons from 'react-native-vector-icons/Ionicons'
import {Picker} from '@react-native-picker/picker'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import Button from '@components/Button'

import { palette } from '@theme/theme'
import { visibility } from '@app/calendar/types'
import { addItemToAlarms, removeItemFromAlarms } from '@screens/Calendar/CreateEventWizard/wizardHelper'
import _ from 'lodash'

type Props = {
  setParentVisibility: Dispatch<SetStateAction<visibility>>,
  userId: string,
  visibility: visibility,
  alarms: number[],
  setParentAlarms: Dispatch<SetStateAction<number[]>>,
}

function EditEventVisibilityAndAlarmsStep(props: Props) {
  const [visibility, setVisibility] = useState<visibility>(props?.visibility)
  const [alarms, setAlarms] = useState<number[]>(props?.alarms || [])
  const [alarm, setAlarm] = useState<number>(0)

  const dark = useColorScheme() === 'dark'
  const setParentVisibility = props?.setParentVisibility
  const setParentAlarms = props?.setParentAlarms

  

  useEffect((): void => {
    if (props?.visibility !== visibility) {
      setVisibility(props?.visibility)
    }

    if (!_.isEqual(props?.alarms, alarms)) {
      setAlarms(props?.alarms)
    }
  }, [visibility, alarms])

  const onVisibilityChange = (value: visibility) => {
    setVisibility(value)
    setParentVisibility(value)
  }

  return (
    <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%'}}>
      <Box flex={1}  justifyContent="center" alignItems="center" style={{ width: '100%'}}>
        <Text variant="optionHeader">
          Make this event private or public
        </Text>
      </Box>
      <Box flex={3}  justifyContent="flex-start" alignItems="center" style={{ width: '100%'}}>
        <Picker
          selectedValue={visibility}
          onValueChange={onVisibilityChange}
          style={{ height: 150, width: '90%', color: dark ? palette.white : palette.textBlack }}
        >
            <Picker.Item color={dark ? palette.white : palette.textBlack}  key="default" value="default" label="Default" />
            <Picker.Item color={dark ? palette.white : palette.textBlack}  key="public" value="public" label="Public" />
            <Picker.Item color={dark ? palette.white : palette.textBlack}  key="private" value="private" label="Private" />
        </Picker>
      </Box>
      <Box flex={3}  justifyContent="center" alignItems="center" style={{ width: '100%'}}>
        <FlatList
          data={alarms}
          renderItem={({ item, index }) => (
            <Box justifyContent="center" alignItems="center" style={{ width: '100%'}}>
              <Box flexDirection="row" justifyContent="space-between" style={{ width: '70%'}}>
                <Text variant="optionHeader">
                  {`${item} minutes before`}
                </Text>
                <Pressable hitSlop={15} onPress={() => removeItemFromAlarms(index, alarms, setAlarms, setParentAlarms)}>
                  <Ionicons name="close" size={24} color={palette.red} />
                </Pressable>
              </Box>
            </Box>
          )}
          keyExtractor={(item, index) => `${item}-${index}`}
        />
      </Box>
      <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%'}}>
        <Box flex={1}  flexDirection="row" justifyContent="space-between" alignItems="center" style={{ width: '40%'}}>
          <Box>
            <Box p={{ phone: 's', tablet: 's' }} />
            <TextField
              type="numeric"
              onChangeText={(text: string) => setAlarm(parseInt(text.replace(/[^0-9.]/g, ''), 10) || 0)}
              value={`${alarm}`}
              placeholder="0"
              style={{ width: '15%' }}
            />
          </Box>
          <Pressable onPress={() => addItemToAlarms(alarm, alarms, setAlarms, setParentAlarms, setAlarm)}>
            <Text variant="buttonLink">
              Add Reminder
            </Text>
          </Pressable>
        </Box>
      </Box>
    </Box>
  )
}

export default EditEventVisibilityAndAlarmsStep
 /** end */
