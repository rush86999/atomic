import _ from 'lodash'
import React, {
    useState,
    Dispatch,
    SetStateAction,
} from 'react'

import Box from '@components/common/Box'
import Text from '@components/common/Text'
import Button from '@components/Button'
import { Colors, ColorSwatch, ColorPalette, ColorPicker } from 'react-native-ui-lib';
import { Pressable } from 'react-native'

interface Props {
    breakColor: string,
    setParentBreakColor: (color: string) => void,
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

function EditBreakPreferenceColor(props: Props) {
    const [breakColor, setBreakColor] = useState<string>(props?.breakColor ?? INITIAL_COLOR)
    const [customColors, setCustomColors] = useState<string[]>([])
    const [paletteChange, setPaletteChange] = useState<boolean>(false)

    const setParentBreakColor = props.setParentBreakColor
    const setParentEnableColor = props.setParentEnableSelectColor
    
    const close = () => {
        setParentEnableColor(false)
    }

    const onSubmit = (color: string) => {
        customColors.push(color)
        setBreakColor(color)
        setCustomColors(_.cloneDeep(customColors))
        setPaletteChange(false)
        setParentBreakColor(color)
    }

    const onValueChange = (value: string) => {
        setBreakColor(value)
        setPaletteChange(false)
        setParentBreakColor(value)
    }

    const onPaletteValueChange = (value: string) => {
        setBreakColor(value)
        setPaletteChange(true)
        setParentBreakColor(value)
    }

    const paletteValue = paletteChange ? (breakColor || INITIAL_COLOR) : undefined
    const pickerValue = !paletteChange ? (breakColor || INITIAL_COLOR) : undefined

    return (
        <Box style={{ width: '100%'}} flex={1} justifyContent="center" alignItems="center">
            <Box style={{ width: '100%'}} mt={{ phone: 's', tablet: 'm' }} justifyContent="center" alignItems="center">
                <Text variant="optionHeader" style={{color: breakColor}}>
                    Selected Color
                </Text>
                <ColorSwatch color={breakColor} selected={true} />
            </Box>
            <Box style={{ width: '100%'}} justifyContent="center" alignItems="center">
                <Text variant="optionHeader" m={{ phone: 'xs', tablet: 's' }}>
                    Choose a default break color
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
                <Text variant="optionHeader" m={{ phone: 'xs', tablet: 's' }}>
                    Custom Colors
                </Text>
                <ColorPicker
                    initialColor={breakColor}
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


export default EditBreakPreferenceColor


