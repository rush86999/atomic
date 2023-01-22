import React, {
  useState,
  Dispatch,
  SetStateAction,
} from 'react'
import {
   FlatList,
   Pressable,
} from 'react-native'
import Ionicons from 'react-native-vector-icons/Ionicons'
 import { Colors, Switch, Hint, TextField } from 'react-native-ui-lib'
import Box from '@components/common/Box'
import Text from '@components/common/Text'

import { palette } from '@theme/theme'

import { addItemToAlarms, removeItemFromAlarms } from '@screens/Calendar/CreateEventWizard/wizardHelper'


type Props = {
    useDefaultAlarms: boolean,
    alarms: number[],
    setParentAlarms: Dispatch<SetStateAction<number[]>>,
    setParentUseDefaultAlarms: Dispatch<SetStateAction<boolean>>,
}


function CreateMeetingAssistAlarms(props: Props) {
    const [useDefaultAlarms, setUseDefaultAlarms] = useState<boolean>(props?.useDefaultAlarms)
    const [alarms, setAlarms] = useState<number[]>(props?.alarms)
    const [alarm, setAlarm] = useState<number>(0)
    

    const setParentUseDefaultAlarms = props?.setParentUseDefaultAlarms
    const setParentAlarms = props?.setParentAlarms


    const changeUseDefaultAlarms = (value: boolean) => {
        setUseDefaultAlarms(value)
        setParentUseDefaultAlarms(value)
    }

    const addAlarmToAlarms = () => {
        addItemToAlarms(alarm, alarms, setAlarms, setParentAlarms, setAlarm)
        if (useDefaultAlarms) {
            changeUseDefaultAlarms(false)
        }
    }

    return (
        <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%' }}>
            <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '90%' }} m={{ phone: 's', tablet: 'm' }}>
                <Box flexDirection="row" justifyContent="flex-start" alignItems="center" style={{ width: '100%' }}>
                    <Text variant="optionHeader">
                       Do you want to use default alarms?
                    </Text>
                </Box>
                <Box flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }} style={{ width: '100%' }}>
                    <Switch
                        onColor={Colors.purple30}
                        offColor={Colors.purple60}
                        value={useDefaultAlarms}
                        onValueChange={changeUseDefaultAlarms} 
                        style={{ marginBottom: 20 }}
                    />  
                </Box>
            </Box>
            {alarms?.length > 0
                ? (
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
                ) : null}
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
                <Pressable onPress={addAlarmToAlarms}>
                    <Text variant="buttonLink">
                        Add Alarm
                    </Text>
                </Pressable>
                </Box>
            </Box>
        </Box>
    )
}

export default CreateMeetingAssistAlarms




