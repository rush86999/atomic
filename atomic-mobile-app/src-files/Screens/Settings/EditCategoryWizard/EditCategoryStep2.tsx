import React, {
  useState,
  Dispatch,
  SetStateAction,
} from 'react'
import { Colors, Switch, TextField, Hint } from 'react-native-ui-lib'
import { Pressable } from 'react-native'

import Box from '@components/common/Box'
import Text from '@components/common/Text'
import { DefaultTimeBlockingType } from '@app/dataTypes/CategoryType'


type Props = {
    defaultAvailability: boolean,
    setParentDefaultAvailability: Dispatch<SetStateAction<boolean>>,
    defaultTimeBlocking: DefaultTimeBlockingType,
    setParentDefaultTimeBlocking?: Dispatch<SetStateAction<DefaultTimeBlockingType>>,
}

function EditCategoryStep2(props: Props) {
    const [defaultAvailability, setDefaultAvailability] = useState<boolean>(props?.defaultAvailability ?? false)
    const [defaultTimeBlocking, setDefaultTimeBlocking] = useState<DefaultTimeBlockingType>(props?.defaultTimeBlocking)
    const [beforeEvent, setBeforeEvent] = useState<number>(props?.defaultTimeBlocking?.beforeEvent ?? 0)
    const [afterEvent, setAfterEvent] = useState<number>(props?.defaultTimeBlocking?.afterEvent ?? 0)
    const [enableTimeBlocking, setEnableTimeBlocking] = useState<boolean>(props?.defaultTimeBlocking?.beforeEvent > 0 || props?.defaultTimeBlocking?.afterEvent > 0)
    
    const setParentDefaultAvailability = props?.setParentDefaultAvailability
    const setParentDefaultTimeBlocking = props?.setParentDefaultTimeBlocking
    
    const changeDefaultAvailability = (value: boolean) => {
        setDefaultAvailability(value)
        setParentDefaultAvailability(value)
    }
    
    const changeDefaultTimeBlocking = (value: DefaultTimeBlockingType) => {
        setDefaultTimeBlocking(value)
        setParentDefaultTimeBlocking(value)
    }

    const changeBeforeEvent = (value: string) => {
        setBeforeEvent(parseInt(value.replace(/[^0-9.]/g, ''), 10))
        setEnableTimeBlocking(parseInt(value.replace(/[^0-9.]/g, ''), 10) > 0)
        changeDefaultTimeBlocking({ ...defaultTimeBlocking, beforeEvent: parseInt(value.replace(/[^0-9.]/g, ''), 10) })
    }

    const changeAfterEvent = (value: string) => {
        setAfterEvent(parseInt(value.replace(/[^0-9.]/g, ''), 10))
        setEnableTimeBlocking(parseInt(value.replace(/[^0-9.]/g, ''), 10) > 0)
        changeDefaultTimeBlocking({ ...defaultTimeBlocking, afterEvent: parseInt(value.replace(/[^0-9.]/g, ''), 10) })
    }

    const onChangeEnableTimeBlocking = (value: boolean) => {
        setEnableTimeBlocking(value)
        if (!value) {
            changeDefaultTimeBlocking({ beforeEvent: 0, afterEvent: 0 })
        }
    }

    
    return (
        <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%'}}>
            <Box style={{ width: '90%' }} m={{ phone: 's', tablet: 'm' }}>
                <Box flexDirection="row" justifyContent="flex-start" alignItems="center" style={{ width: '100%' }}>
                    <Box>
                        <Text variant="optionHeader" m={{ phone: 'xs', tablet: 's'}}>Set default availability / transparency for any new events with the given tag?</Text>
                        <Text variant="comment" m={{ phone: 'xs', tablet: 's' }}>{defaultAvailability ? 'Transparent/not busy or available for meeting' : 'Opaque/busy or not available for meeting'}</Text>
                    </Box>
                </Box>
                <Box flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }} style={{ width: '100%' }}>
                    <Switch
                        onColor={Colors.purple30}
                        offColor={Colors.purple60}
                        value={defaultAvailability}
                        onValueChange={changeDefaultAvailability}
                        style={{ marginBottom: 20 }}
                    />
                </Box>
            </Box>
            <Box style={{ width: '90%' }} m={{ phone: 's', tablet: 'm' }}>
                <Box flexDirection="row" justifyContent="flex-start" alignItems="center" style={{ width: '100%' }}>
                    <Text variant="optionHeader" m={{ phone: 'xs', tablet: 's' }}>Enable default buffer times for any new events with the given tag?</Text>
                </Box>
                <Box flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }} style={{ width: '100%' }}>
                    <Switch
                        onColor={Colors.purple30}
                        offColor={Colors.purple60}
                        value={enableTimeBlocking}
                        onValueChange={onChangeEnableTimeBlocking}
                        style={{ marginBottom: 20 }}
                    />
                </Box>
            </Box>
            {
                enableTimeBlocking
                    ? (
                        <Box style={{ width: '90%' }} m={{ phone: 's', tablet: 'm' }}>
                            <Box flexDirection="row" justifyContent="space-between" alignItems="center" m={{ phone: 's', tablet: 'm' }} style={{ width: '60%' }}>
                                <TextField
                                    title="Default prep time before event"
                                    label="Minutes"
                                    value={`${beforeEvent}`}
                                    onChangeText={changeBeforeEvent}
                                    keyboardType="numeric"
                                    style={{ marginBottom: 20, width: '15%' }}
                                />  
                            </Box>
                            <Box flexDirection="row" justifyContent="space-between" alignItems="center" m={{ phone: 's', tablet: 'm' }} style={{ width: '60%' }}>
                                <TextField
                                    title="Default debrief/review time after event"
                                    label="Minutes"
                                    value={`${afterEvent}`}
                                    onChangeText={changeAfterEvent}
                                    keyboardType="numeric"
                                    style={{ marginBottom: 20, width: '15%' }}
                                />
                            </Box>
                       </Box> 
                    ) : null
            }
        </Box>
    )
}

export default EditCategoryStep2
