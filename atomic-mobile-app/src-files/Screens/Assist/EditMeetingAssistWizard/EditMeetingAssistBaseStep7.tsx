import React, {
    useState,
    Dispatch,
    SetStateAction,
} from 'react'

import { TextField, Switch, Colors, Hint } from 'react-native-ui-lib'
import Box from '@components/common/Box'
import Text from '@components/common/Text'

import { Appearance, Pressable, StyleSheet, ScrollView } from 'react-native';
import { palette } from '@theme/theme'

const dark = Appearance.getColorScheme() === 'dark'

const styles = StyleSheet.create({
    minThresholdCount: {
        fontSize: 16,
        lineHeight: 24,
        color: dark ? palette.white : '#221D23',
        width: '30%',
    }
})

type Props = {
    anyoneCanAddSelf: boolean,
    guestsCanSeeOtherGuests: boolean,
    minThresholdCount: number,
    guaranteeAvailability: boolean,
    isRecurring: boolean,
    setParentAnyoneCanAddSelf: Dispatch<SetStateAction<boolean>>,
    setParentGuestsCanSeeOtherGuests: Dispatch<SetStateAction<boolean>>,
    setParentMinThresholdCount: Dispatch<SetStateAction<number>>,
    setParentGuaranteeAvailability: Dispatch<SetStateAction<boolean>>,
    setParentIsRecurring: Dispatch<SetStateAction<boolean>>,
}

function EditMeetingAssistBaseStep7(props: Props) {
    const [anyoneCanAddSelf, setAnyoneCanAddSelf] = useState<boolean>(props?.anyoneCanAddSelf)
    const [guestsCanSeeOtherGuests, setGuestsCanSeeOtherGuests] = useState<boolean>(props?.guestsCanSeeOtherGuests)
    const [minThresholdCount, setMinThresholdCount] = useState<number>(props?.minThresholdCount)
    const [guaranteeAvailability, setGuaranteeAvailability] = useState<boolean>(props?.guaranteeAvailability)
    const [isRecurring, setIsRecurring] = useState<boolean>(props?.isRecurring)
    const [isMessage, setIsMessage] = useState<boolean>(false)

    const setParentAnyoneCanAddSelf = props?.setParentAnyoneCanAddSelf
    const setParentGuestsCanSeeOtherGuests = props?.setParentGuestsCanSeeOtherGuests
    const setParentMinThresholdCount = props?.setParentMinThresholdCount
    const setParentGuaranteeAvailability = props?.setParentGuaranteeAvailability
    const setParentIsRecurring = props?.setParentIsRecurring

    const changeAnyoneCanAddSelf = (value: boolean) => {
        setAnyoneCanAddSelf(value)
        setParentAnyoneCanAddSelf(value)
    }

    const changeGuestsCanSeeOtherGuests = (value: boolean) => {
        setGuestsCanSeeOtherGuests(value)
        setParentGuestsCanSeeOtherGuests(value)
    }

    const changeMinThresholdCount = (value: string) => {
        setMinThresholdCount(parseInt(value.replace(/[^0-9.]/g, ''), 10))
        setParentMinThresholdCount(parseInt(value.replace(/[^0-9.]/g, ''), 10))
    }

    const changeGuaranteeAvailability = (value: boolean) => {
        setGuaranteeAvailability(value)
        setParentGuaranteeAvailability(value)
    }

    const changeIsRecurring = (value: boolean) => {
        setIsRecurring(value)
        setParentIsRecurring(value)
    }

    return (
        <ScrollView>
            <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%' }}>
                <Box m={{ phone: 's', tablet: 'm' }} style={{ width: '90%' }}>
                    <Box flexDirection="row" justifyContent="flex-start" mt={{ phone: 's', tablet: 'm' }} style={{ width: '100%'}}>
                        <Text variant="optionHeader">
                            Can non-invited guests add themselves?
                        </Text>
                    </Box>
                    <Box flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }} style={{ width: '100%'}}>
                        <Switch
                            onColor={Colors.purple30}
                            offColor={Colors.purple60}
                            value={anyoneCanAddSelf}
                            onValueChange={changeAnyoneCanAddSelf}
                            style={{marginBottom: 20}}
                        />
                    </Box>
                </Box>
                <Box m={{ phone: 's', tablet: 'm' }} style={{ width: '90%' }}>
                    <Box flexDirection="row" justifyContent="flex-start" mt={{ phone: 's', tablet: 'm' }} style={{ width: '100%'}}>
                        <Text variant="optionHeader">
                            Can guests see other guests?
                        </Text>
                    </Box>
                    <Box flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }} style={{ width: '100%' }}>
                        <Switch
                            onColor={Colors.purple30}
                            offColor={Colors.purple60}
                            value={guestsCanSeeOtherGuests}
                            onValueChange={changeGuestsCanSeeOtherGuests}
                            style={{marginBottom: 20}}
                        />
                    </Box>
                </Box>
                <Box m={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center" style={{ width: '90%' }}>
                    <Box flexDirection="row" justifyContent="flex-start" mt={{ phone: 's', tablet: 'm' }} style={{ width: '100%'}}>
                        <Text variant="optionHeader" mt={{ phone: 's', tablet: 'm' }}>
                            How many minimum number of attendees needed before creating a new event?
                        </Text>
                    </Box>
                    <Box flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }} style={{ width: '100%'}}>
                        <TextField
                            title="Minimum threshold count"
                            type="numeric"
                            onChangeText={changeMinThresholdCount}
                            value={`${minThresholdCount}`}
                            placeholder="1"
                            style={styles.minThresholdCount}
                        />
                    </Box>
                </Box>
                <Box m={{ phone: 's', tablet: 'm' }} style={{ width: '90%' }}>
                    <Box flexDirection="row" justifyContent="flex-start" mt={{ phone: 's', tablet: 'm' }} style={{ width: '100%'}}>
                        <Hint visible={isMessage} message={'Users will able to select custom timeslots that can overlap with already registered events'} color={Colors.purple} onBackgroundPress={() => setIsMessage(false)}>
                            <Pressable onPress={() => setIsMessage(!isMessage)}> 
                                <Text variant="buttonLink" mt={{ phone: 's', tablet: 'm' }}>
                                    Do you like to guarantee availability of any time slot regardless of being busy or not?
                                </Text>
                            </Pressable>
                        </Hint>
                    </Box>
                    <Box flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }}>
                        <Switch
                            onColor={Colors.purple30}
                            offColor={Colors.purple60}
                            value={guaranteeAvailability}
                            onValueChange={changeGuaranteeAvailability}
                            style={{marginBottom: 20}}
                        />
                    </Box>
                </Box>
                <Box m={{ phone: 's', tablet: 'm' }} style={{ width: '90%' }}>
                    <Box flexDirection="row" justifyContent="flex-start" mt={{ phone: 's', tablet: 'm' }} style={{ width: '100%'}}>
                        <Text variant="optionHeader" mt={{ phone: 's', tablet: 'm' }}>
                            Do you want this meeting to be recurring?
                        </Text>
                    </Box>
                    <Box flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }} style={{ width: '100%'}}>
                        <Switch
                            onColor={Colors.purple30}
                            offColor={Colors.purple60}
                            value={isRecurring}
                            onValueChange={changeIsRecurring}
                            style={{marginBottom: 20}}
                        />
                    </Box>
                </Box>
            </Box>
        </ScrollView>
    )
}

export default EditMeetingAssistBaseStep7


