import { SafeAreaView } from 'react-native-safe-area-context'
import { ViewProps } from 'react-native'
import {
  useRestyle,
  spacing,
  border,
    backgroundColor,
    layout,
  SpacingProps,
  BorderProps,
    BackgroundColorProps,
  LayoutProps,
    composeRestyleFunctions,
} from '@shopify/restyle'
import { Theme } from '@theme/theme'
import React from 'react';

const restyleFunctions = composeRestyleFunctions([spacing, border, backgroundColor, layout]);
type Props = ViewProps & SpacingProps<Theme> &
  BorderProps<Theme> &
    BackgroundColorProps<Theme>
    & LayoutProps<Theme>;
  
function SafeAreaBox({children, ...rest}: Props) {
    const props = useRestyle(restyleFunctions, rest)
    return (
        <SafeAreaView {...props}>
            {children}
        </SafeAreaView>
    )
}

export default SafeAreaBox

