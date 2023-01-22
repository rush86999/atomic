import React, {
  useState,
  Dispatch,
  SetStateAction,
} from 'react'
import { Colors, Switch, TextField } from 'react-native-ui-lib'
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import _ from 'lodash'


type Props = {
    defaultPriorityLevel: number,
    setParentDefaultPriorityLevel: Dispatch<SetStateAction<number>>,
    defaultModifiable: boolean,
    setParentDefaultModifiable: Dispatch<SetStateAction<boolean>>,
}


const dayOfWeekInt = [-1, 1, 2, 3, 4, 5, 6, 7]

function EditCategoryStep3(props: Props) {
    const [defaultPriorityLevel, setDefaultPriorityLevel] = useState<number>(props?.defaultPriorityLevel ?? 1)
    const [defaultModifiable, setDefaultModifiable] = useState<boolean>(props?.defaultModifiable ?? false)

    const setParentDefaultPriorityLevel = props?.setParentDefaultPriorityLevel
    const setParentDefaultModifiable = props?.setParentDefaultModifiable


    const changeDefaultPriorityLevel = (value: string) => {
        setDefaultPriorityLevel(parseInt(value.replace(/[^0-9.]/g, ''), 10))
        setParentDefaultPriorityLevel(parseInt(value.replace(/[^0-9.]/g, ''), 10))
    }

    const changeDefaultModifiable = (value: boolean) => {
        setDefaultModifiable(value)
        setParentDefaultModifiable(value)
    }

    return (
        <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%' }}>
            <Box style={{ width: '90%' }} m={{ phone: 's', tablet: 'm' }}>
                <Box flexDirection="row" justifyContent="flex-start" alignItems="center">
                    <Text variant="optionHeader">
                        Set default priority level for any new events with the given tag?
                    </Text>
                </Box>
                <Box flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }}>
                    <TextField
                        type="numeric"
                        onChangeText={changeDefaultPriorityLevel}
                        value={defaultPriorityLevel.toString()}
                        style={{ width: '15%' }}
                    />
                </Box>
            </Box>
            <Box style={{ width: '90%' }} m={{ phone: 's', tablet: 'm' }}>
                <Box flexDirection="row" justifyContent="flex-start" alignItems="center">
                    <Text variant="optionHeader">Set default time modifiable / time Not Modifiable value to any new events with the given tag for scheduling assists? </Text>
                </Box>
                <Box flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }}>
                    <Switch
                        onColor={Colors.purple30}
                        offColor={Colors.purple60}
                        value={defaultModifiable}
                        onValueChange={changeDefaultModifiable}
                        style={{ marginBottom: 20 }}
                    />
                </Box>
            </Box>
        </Box> 
    )

}

export default EditCategoryStep3
