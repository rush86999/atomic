import _ from 'lodash'
import React, {
    useState,
    Dispatch,
    SetStateAction,
} from 'react'

import Box from '@components/common/Box'
import Text from '@components/common/Text'
import { Colors, ColorSwatch, ColorPalette, ColorPicker } from 'react-native-ui-lib';
import { Pressable } from 'react-native'

interface Props {
    color: string,
    setParentColor: (color: string) => void,
    setParentEnableSelectColor: Dispatch<SetStateAction<boolean>>,
}


const INITIAL_COLOR = Colors.blue30
const colors = [
  '#20303C', '#43515C', '#66737C', '#858F96', '#A3ABB0', '#C2C7CB', '#E0E3E5', '#F2F4F5',
  '#3182C8', '#4196E0', '#459FED', '#57a8ef', '#8fc5f4', '#b5d9f8', '#daecfb', '#ecf5fd',
  '#00AAAF', '#32BABC', '#3CC7C5', '#64D4D2', '#8BDFDD', '#B1E9E9', '#D8F4F4', '#EBF9F9',
  '#00A65F', '#32B76C', '#65C888', '#84D3A0', '#A3DEB8', '#C1E9CF', '#E8F7EF', '#F3FBF7',
  '#E2902B', '#FAA030', '#FAAD4D', '#FBBD71', '#FCCE94', '#FDDEB8', '#FEEFDB', '#FEF7ED',
  '#D9644A', '#E66A4E', '#F27052', '#F37E63', '#F7A997', '#FAC6BA', '#FCE2DC', '#FEF0ED',
  '#CF262F', '#EE2C38', '#F2564D', '#F57871', '#F79A94', '#FABBB8', '#FCDDDB', '#FEEEED',
  '#8B1079', '#A0138E', '#B13DAC', '#C164BD', '#D08BCD', '#E0B1DE', '#EFD8EE', '#F7EBF7'
]

function UserEditCategoryColor(props: Props) {
    const [color, setColor] = useState<string>(props?.color ?? INITIAL_COLOR)
    const [customColors, setCustomColors] = useState<string[]>([])
    const [paletteChange, setPaletteChange] = useState<boolean>(false)

    const setParentColor = props.setParentColor
    const setParentEnableColor = props.setParentEnableSelectColor
    
    const close = () => {
        setParentEnableColor(false)
    }

    const onSubmit = (color: string) => {
        customColors.push(color)
        setColor(color)
        setCustomColors(_.cloneDeep(customColors))
        setPaletteChange(false)
        setParentColor(color)
    }

    const onValueChange = (value: string) => {
        setColor(value)
        setPaletteChange(false)
        setParentColor(value)
    }

    const onPaletteValueChange = (value: string) => {
        setColor(value)
        setPaletteChange(true)
        setParentColor(value)
    }

    const paletteValue = paletteChange ? (color || INITIAL_COLOR) : undefined
    const pickerValue = !paletteChange ? (color || INITIAL_COLOR) : undefined

    return (
        <Box style={{ width: '100%'}} flex={1} justifyContent="center" alignItems="center">
            <Box  style={{ width: '100%'}} mt={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
                <Text style={{color}}>
                    Selected Color
                </Text>
                <ColorSwatch color={color} selected={true} />
            </Box>
            <Box style={{ width: '100%'}} justifyContent="center" alignItems="center">
                <Text m={{ phone: 'xs', tablet: 's' }}>
                    Choose a color for your tag
                </Text>
            </Box>
            <Box flex={1} style={{ width: '100%'}} justifyContent="center" alignItems="center">
                <ColorPalette
                    colors={colors}
                    onValueChange={onPaletteValueChange}
                    value={paletteValue}
                    
                />
            </Box>
            <Box style={{ width: '60%'}} flexDirection="row" justifyContent="space-between" alignItems="center">
                <Text m={{ phone: 'xs', tablet: 's' }}>
                    Custom Colors
                </Text>
                <ColorPicker
                    initialColor={color}
                    colors={customColors}
                    onSubmit={onSubmit}
                    onValueChange={onValueChange}
                    value={pickerValue}
                    // animatedIndex={0}
                />
            </Box>
            <Box justifyContent="center" alignItems="center" m={{ phone: 'xs', tablet: 's' }}>
                <Pressable onPress={close}>
                    <Text variant="buttonLink">
                        Close
                    </Text>
                </Pressable>
            </Box>
        </Box>
    )
}


export default UserEditCategoryColor


