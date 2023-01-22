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
    copyModifiable: boolean,
    setParentCopyModifiable: Dispatch<SetStateAction<boolean>>,
}

function EditCategoryStep1b(props: Props) {
    const [copyModifiable, setCopyModifiable] = useState<boolean>(props?.copyModifiable ?? false)
    const [isMessage1, setIsMessage1] = useState<boolean>(false)

    const setParentCopyModifiable = props?.setParentCopyModifiable

    const changeCopyModifiable = (value: boolean) => {
        setCopyModifiable(value)
        setParentCopyModifiable(value)
    }

    return (
        <Box flex={1} justifyContent="center" alignItems="center" style={{ width: '100%' }}>
            <Box style={{ width: '90%' }} m={{ phone: 's', tablet: 'm' }}>
                <Box flexDirection="row" justifyContent="flex-start" alignItems="center" style={{ width: '100%' }}>
                    <Text variant="optionHeader">Copy over time modifiable / time not modifiable value (make static) to any new events whose details are similar in context to this event for scheduling assists? </Text>
                </Box>
                <Box flexDirection="row" justifyContent="flex-end" mt={{ phone: 's', tablet: 'm' }} style={{ width: '100%' }}>
                    <Switch
                        onColor={Colors.purple30}
                        offColor={Colors.purple60}
                        value={copyModifiable}
                        onValueChange={changeCopyModifiable}
                        style={{ marginBottom: 20 }}
                    />
                </Box>
            </Box>
        </Box>
    )
    
}

export default EditCategoryStep1b
