import React, {
  useState,
  Dispatch,
  SetStateAction,
} from 'react'

import { Colors, Picker, PickerValue, Switch, TextField } from 'react-native-ui-lib'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import { palette } from '@theme/theme'
import _ from 'lodash'

import { Appearance } from 'react-native'
import { ConferenceAppType } from '@app/dataTypes/MeetingAssistType'

const dark = Appearance.getColorScheme() === 'dark'

const conferenceAppOptions = [
    { label: 'Google', value: 'google' },
    { label: 'Zoom', value: 'zoom' }
]


type Props = {
    isBufferTime: boolean,
    beforeEventMinutes: number,
    afterEventMinutes: number,
    setParentIsBufferTime: Dispatch<SetStateAction<boolean>>,
    setParentBeforeEventMinutes: Dispatch<SetStateAction<number>>,
    setParentAfterEventMinutes: Dispatch<SetStateAction<number>>,
}

function CreateMeetingAssistBaseStep6(props: Props) {
    const [isBufferTime, setIsBufferTime] = useState<boolean>(props?.isBufferTime)
    const [beforeEventMinutes, setBeforeEventMinutes] = useState<number>(props?.beforeEventMinutes)
    const [afterEventMinutes, setAfterEventMinutes] = useState<number>(props?.afterEventMinutes)

    const setParentIsBufferTime = props?.setParentIsBufferTime
    const setParentBeforeEventMinutes = props?.setParentBeforeEventMinutes
    const setParentAfterEventMinutes = props?.setParentAfterEventMinutes

    const changeIsBufferTime = (value: boolean) => {
        setIsBufferTime(value)
        setParentIsBufferTime(value)
    }

    const changeBeforeEventMinutes = (value: string) => {
        setBeforeEventMinutes(parseInt(value.replace(/[^0-9.]/g, ''), 10) || 0)
        setParentBeforeEventMinutes(parseInt(value.replace(/[^0-9.]/g, ''), 10) || 0)
    }

    const changeAfterEventMinutes = (value: string) => {
        setAfterEventMinutes(parseInt(value.replace(/[^0-9.]/g, ''), 10) || 0)
        setParentAfterEventMinutes(parseInt(value.replace(/[^0-9.]/g, ''), 10) || 0)
    }

    return (
        <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%' }}>
            <Box m={{ phone: 's', tablet: 'm' }} style={{ width: '90%' }}>
                <Box flexDirection="row" justifyContent="flex-start" mt={{ phone: 's', tablet: 'm' }}  style={{ width: '100%' }}>
                    <Text variant="optionHeader">
                        Do you want to add Buffer time to your event?
                    </Text>
                </Box>
                <Box flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }}  style={{ width: '100%' }}>
                    <Switch
                        onColor={Colors.purple30}
                        offColor={Colors.purple60}
                        value={isBufferTime}
                        onValueChange={changeIsBufferTime}
                        style={{marginBottom: 20}}
                    />
                </Box>
            </Box>
            <Box justifyContent="center" alignItems="center"  style={{ width: '100%' }}>
                {
                    isBufferTime 
                        ? (
                            <Box justifyContent="center" alignItems="center"  style={{ width: '90%' }}>
                                <Box mt={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center"  style={{ width: '100%' }}>
                                    <Box style={{ width: '100%' }} justifyContent="center" alignItems="center">
                                        <Box style={{ width: '100%' }} flexDirection="row" justifyContent="space-between" alignItems="center" mt={{ phone: 's', tablet: 'm' }}>
                                           <Box>
                                                <Text variant="optionHeader">
                                                    Prep time before event: 
                                                </Text>
                                                <Text variant="greyComment">
                                                   30 min steps only
                                                </Text>
                                            </Box>
                                            <Box>
                                                <Box p={{ phone: 'm', tablet: 'm'}} />
                                                <TextField
                                                    label="Minutes"
                                                    value={`${beforeEventMinutes}`}
                                                    onChangeText={changeBeforeEventMinutes}
                                                    keyboardType="numeric"
                                                    style={{ width: '15%' }}
                                                />
                                            </Box>
                                        </Box>
                                    </Box>
                                    <Box style={{ width: '100%' }} justifyContent="center" alignItems="center">
                                        <Box style={{ width: '100%' }} flexDirection="row" justifyContent="space-between" alignItems="center" mt={{ phone: 's', tablet: 'm' }}>
                                            <Box>
                                                <Text variant="optionHeader">
                                                    Review time after event:
                                                </Text>
                                                <Text variant="greyComment">
                                                   30 min steps only
                                                </Text>
                                            </Box>
                                            <Box>
                                                <Box p={{ phone: 'm', tablet: 'm'}} />
                                                <TextField
                                                    label="Minutes"
                                                    value={`${afterEventMinutes}`}
                                                    onChangeText={changeAfterEventMinutes}
                                                    keyboardType="numeric"
                                                    style={{width: '15%' }}
                                                />
                                            </Box>
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        ) : null
                }
            </Box>
        </Box>
    )

}

export default CreateMeetingAssistBaseStep6

