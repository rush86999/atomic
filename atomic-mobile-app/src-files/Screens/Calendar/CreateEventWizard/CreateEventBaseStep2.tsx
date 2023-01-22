import React, {
  useState,
  Dispatch,
  SetStateAction,
} from 'react'
import { Colors, Switch } from 'react-native-ui-lib'

import Box from '@components/common/Box'
import Text from '@components/common/Text'

type Props = {
    isAttendees: boolean
    allDay: boolean
    isRecurring: boolean
    isBreak: boolean
    setParentAllDay: Dispatch<SetStateAction<boolean>>
    setParentIsRecurring: Dispatch<SetStateAction<boolean>>
    setParentIsAttendees: Dispatch<SetStateAction<boolean>>
    setParentIsBreak: Dispatch<SetStateAction<boolean>>
}

function CreateEventBaseStep2(props: Props) {
    const [isAttendees, setIsAttendees] = useState<boolean>(props?.isAttendees)
    const [allDay, setAllDay] = useState<boolean>(props?.allDay)
    const [isRecurring, setIsRecurring] = useState<boolean>(props?.isRecurring)
    const [isBreak, setIsBreak] = useState<boolean>(props?.isBreak)

    const setParentAllDay = props?.setParentAllDay
    const setParentIsRecurring = props?.setParentIsRecurring
    const setParentIsAttendees = props?.setParentIsAttendees
    const setParentIsBreak = props?.setParentIsBreak

    const changeAllDay = (value: boolean) => {
        setAllDay(value)
        setParentAllDay(value)
    }

    const changeIsRecurring = (value: boolean) => {
        setIsRecurring(value)
        setParentIsRecurring(value)
    }

    const changeIsAttendees = (value: boolean) => {
        setIsAttendees(value)
        setParentIsAttendees(value)
    }

    const changeIsBreak = (value: boolean) => {
        setIsBreak(value)
        setParentIsBreak(value)
    }

    return (
        <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%'}}>
            <Box flex={1} style={{ width: '90%' }} m={{ phone: 's', tablet: 'm' }}>
                <Box flex={1} flexDirection="row" justifyContent="flex-start" alignItems="center">  
                    <Text variant="optionHeader" mt={{ phone: 's', tablet: 'm' }}>
                        Change this to an all day event?
                    </Text>
                </Box>
                <Box flex={1} flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }}>
                    <Switch
                        onColor={Colors.purple30}
                        offColor={Colors.purple60}
                        value={allDay}
                        onValueChange={changeAllDay}
                        style={{marginBottom: 20}}
                    />
                </Box>
            </Box>
            <Box flex={1} style={{ width: '90%' }} m={{ phone: 's', tablet: 'm' }}>
                <Box flex={1} flexDirection="row" justifyContent="flex-start" alignItems="center">  
                    <Text variant="optionHeader" mt={{ phone: 's', tablet: 'm' }}>
                        Make this a recurring event?
                    </Text>
                </Box>
                <Box flex={1} flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }}>
                    <Switch
                        onColor={Colors.purple30}
                        offColor={Colors.purple60}
                        value={isRecurring}
                        onValueChange={changeIsRecurring}
                        style={{marginBottom: 20}}
                    />
                </Box>
            </Box>
            <Box flex={1} flexDirection={{ phone: 'column', tablet: 'row' }} justifyContent={{ phone: 'center', tablet: 'space-between' }} style={{ width: '90%' }} m={{ phone: 's', tablet: 'm' }}>
                <Box flex={1} flexDirection="row" justifyContent="flex-start" alignItems="center">  
                    <Text variant="optionHeader" mt={{ phone: 's', tablet: 'm' }}>
                        Add attendees to this event?
                    </Text>
                </Box>
                <Box flex={1} flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }}>
                    <Switch
                        onColor={Colors.purple30}
                        offColor={Colors.purple60}
                        value={isAttendees}
                        onValueChange={changeIsAttendees}
                        style={{marginBottom: 20}}
                    />
                </Box>
            </Box>
            <Box style={{ width: '90%' }} flex={1} m={{ phone: 's', tablet: 'm' }}>
                <Box flex={1} flexDirection="row" justifyContent="flex-start" alignItems="center">  
                    <Text variant="optionHeader" mt={{ phone: 's', tablet: 'm' }}>
                        Is this your break?
                    </Text>
                </Box>
                <Box flex={1} flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }}>
                    <Switch
                        onColor={Colors.purple30}
                        offColor={Colors.purple60}
                        value={isBreak}
                        onValueChange={changeIsBreak}
                        style={{marginBottom: 20}}
                    />
                </Box>
            </Box>
        </Box> 
    )

}

export default CreateEventBaseStep2