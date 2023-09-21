import _ from 'lodash'
import React, {
    useState,
    Dispatch,
    SetStateAction,
} from 'react'

import Box from '@components/common/Box'
import Text from '@components/common/Text'
import { Pressable } from 'react-native'
import { colorsPalette as Colors } from '@lib/theme/colorsPalette'
import Circle from '@uiw/react-color-circle'
import { NextApiRequest, NextApiResponse } from 'next';
import supertokensNode from 'supertokens-node'
import { backendConfig } from '@config/backendConfig'
import Session from 'supertokens-node/recipe/session'

export async function getServerSideProps({ req, res }: { req: NextApiRequest, res: NextApiResponse }) {
    // Notice how the server uses `API` from `withSSRContext`, instead of the top-level `API`.
    // const SSR = withSSRContext({ req })
    // this runs on the backend, so we must call init on supertokens-node SDK
    supertokensNode.init(backendConfig())
    let session
    try {
        session = await Session.getSession(req, res, {
            overrideGlobalClaimValidators: async function () {
                return []
            },
        })
    } catch (err: any) {
        if (err.type === Session.Error.TRY_REFRESH_TOKEN) {
            return { props: { fromSupertokens: 'needs-refresh' } }
        } else if (err.type === Session.Error.UNAUTHORISED) {
            // this will force the frontend to try and refresh which will fail
            // clearing all cookies and redirecting the user to the login screen.
            return { props: { fromSupertokens: 'needs-refresh' } }
        }
        throw err
    }

    if (!session?.getUserId()) {
        return {
            redirect: {
                destination: '/User/Login/UserLogin',
                permanent: false,
            },
        }
    }

    return {
        props: {
        sub: session.getUserId(),
        }
    }
}

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
            <Box style={{ width: '100%'}} justifyContent="center" alignItems="center">
                <Text variant="optionHeader" p={{ phone: 'xs', tablet: 's' }}>
                    Choose a color for your tag
                </Text>
            </Box>
            <Box flex={1} style={{ width: '100%'}} justifyContent="center" alignItems="center">
                <Circle
                    colors={[ '#039be5', '#7986cb', '#33b679', '#8e24aa', '#e67c73', '#f6c026', '#f5511d', '#616161', '#3f51b5', '#0b8043', '#d60000' ]}
                    color={color}
                    onChange={(color) => {
                        onPaletteValueChange(color.hex);
                    }}
                />
            </Box>
            <Box justifyContent="center" alignItems="center" p={{ phone: 'xs', tablet: 's' }}>
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


