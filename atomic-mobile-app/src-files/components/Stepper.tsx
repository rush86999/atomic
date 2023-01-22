import React, { useState } from 'react'
import { Appearance, TouchableOpacity, useWindowDimensions } from 'react-native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import Box from './common/Box'
import Text from './common/Text'
import LightRegularCard from './LightRegularCard'
import {palette} from '../theme/theme'

type Props = {
  onChangeValue: (value: string) => {},
  min: number,
  max: number,
}

const dark = Appearance.getColorScheme() === 'dark'

function Stepper(props: Props) {
  const {
    onChangeValue,
    min,
    max,
  } = props

  const [value, setValue] = useState<string>('')

  const onRemove = () => {
    if (((parseFloat(value) || 0) - 1) < min) {
      setValue(`${min}`)
      onChangeValue(`${min}`)
    } else {
      setValue(`${parseFloat(value) - 1}`)
      onChangeValue(`${parseFloat(value) - 1}`)
    }
  }

  const onAdd = () => {
    if ((parseFloat(value) || 0) > max) {
      setValue(`${max}`)
      onChangeValue(`${max}`)
    } else {
      setValue(`${parseFloat(value) + 1}`)
      onChangeValue(`${parseFloat(value) + 1}`)
    }
  }


  return (
    <LightRegularCard>
      <Box minWidth={(useWindowDimensions().width - (50))} flexDirection="row" justifyContent="space-between">
        <TouchableOpacity onPress={onRemove}>
          <Box p={{ phone: 's', tablet: 'm' }}>
            <Ionicons name="remove" size={24} color={dark ? palette.white : palette.purplePrimary} />
          </Box>
        </TouchableOpacity>
        <Text variant="subheader" p={{ phone: 's', tablet: 'm' }}>
          {value}
        </Text>
        <TouchableOpacity onPress={onAdd}>
          <Box p={{ phone: 's', tablet: 'm' }}>
            <Ionicons name="add" size={24} color={dark ? palette.white : palette.purplePrimary} />
          </Box>
        </TouchableOpacity>
      </Box>
    </LightRegularCard>
  )
}

export default Stepper
