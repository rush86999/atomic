import React, {
  useState,
  Dispatch,
  SetStateAction,
} from 'react'
import { Colors, Switch } from 'react-native-ui-lib'

import Box from '@components/common/Box'
import Text from '@components/common/Text'
import { transparency } from '@app/calendar/types'

type Props = {
    modifiable: boolean,
    isMeeting: boolean,
    isExternalMeeting: boolean,
    transparency: transparency,
    setParentModifiable: Dispatch<SetStateAction<boolean>>,
    setParentIsMeeting: Dispatch<SetStateAction<boolean>>,
    setParentIsExternalMeeting: Dispatch<SetStateAction<boolean>>,
    setParentTransparency: Dispatch<SetStateAction<transparency>>
}   

function EditEventBaseStep3(props: Props) {
    const [modifiable, setModifiable] = useState<boolean>(props?.modifiable ?? true)
    const [isMeeting, setIsMeeting] = useState<boolean>(props?.isMeeting)
    const [isExternalMeeting, setIsExternalMeeting] = useState<boolean>(props?.isExternalMeeting)
    const [transparency, setTransparency] = useState<transparency>(props?.transparency ?? 'opaque')

    const setParentModifiable = props?.setParentModifiable
    const setParentIsMeeting = props?.setParentIsMeeting
    const setParentIsExternalMeeting = props?.setParentIsExternalMeeting
    const setParentTransparency = props?.setParentTransparency
    
    const changeTransparency = (value: boolean) => {
        setTransparency(value === true ? 'transparent' : 'opaque')
        setParentTransparency(value === true ? 'transparent' : 'opaque')
    }

    const changeModifiable = (value: boolean) => {
        setModifiable(value)
        setParentModifiable(value)
    }

    const changeIsMeeting = (value: boolean) => {
        setIsMeeting(value)
        setParentIsMeeting(value)

        if (value) {
            setIsExternalMeeting(false)
            setParentIsExternalMeeting(false)
        }
    }

    const changeIsExternalMeeting = (value: boolean) => {
        setIsExternalMeeting(value)
        setParentIsExternalMeeting(value)
        if (value) {
            setIsMeeting(false)
            setParentIsMeeting(false)
        }
    }


    return (
        <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%'}}>
            <Box flex={1} style={{ width: '90%' }} m={{ phone: 's', tablet: 'm' }}>
                <Box flex={1} flexDirection="row" justifyContent="flex-start" alignItems="center">  
                    <Text variant="optionHeader" mt={{ phone: 's', tablet: 'm' }}>
                        Make this event transparent?
                    </Text>
                </Box>
                <Box flex={1} flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }}>
                    <Switch
                        onColor={Colors.purple30}
                        offColor={Colors.purple60}
                        value={transparency === 'opaque' ? false : true}
                        onValueChange={changeTransparency}
                        style={{marginBottom: 20}}
                    />
                </Box>
            </Box>
            <Box flex={1} style={{ width: '90%' }} m={{ phone: 's', tablet: 'm' }}>
                <Box  flexDirection="row" justifyContent="flex-start" alignItems="center">  
                    <Text variant="optionHeader">Is the start time of this event modifiable for scheduling assists?</Text>
                </Box>
                <Box  flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }}>
                    <Switch
                        onColor={Colors.purple30}
                        offColor={Colors.purple60}
                        value={modifiable}
                        onValueChange={changeModifiable}
                        style={{marginBottom: 20}}
                    />
                </Box>
            </Box>
            <Box flex={1} style={{ width: '90%' }} m={{ phone: 's', tablet: 'm' }}>
                <Box  flexDirection="row" justifyContent="flex-start" alignItems="center">  
                    <Text variant="optionHeader">Classify this event as a meeting type event?</Text>
                </Box>
                <Box  flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }}>
                    <Switch
                        onColor={Colors.purple30}
                        offColor={Colors.purple60}
                        value={isMeeting}
                        onValueChange={changeIsMeeting}
                        style={{ marginBottom: 20 }}
                    />
                </Box>
            </Box>
            <Box flex={1} style={{ width: '90%' }} m={{ phone: 's', tablet: 'm' }}>
                <Box  flexDirection="row" justifyContent="flex-start" alignItems="center">  
                    <Text variant="optionHeader">Classify this event as an external meeting type ie meeting that is outside your organization or team?</Text>
                </Box>
                <Box  flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }}>
                    <Switch
                        onColor={Colors.purple30}
                        offColor={Colors.purple60}
                        value={isExternalMeeting}
                        onValueChange={changeIsExternalMeeting}
                        style={{ marginBottom: 20 }}
                    />
                </Box>
            </Box>
        </Box>
    )

}

export default EditEventBaseStep3
