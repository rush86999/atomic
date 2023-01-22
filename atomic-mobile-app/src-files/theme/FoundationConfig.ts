import {Colors, Typography, Spacings, Constants} from 'react-native-ui-lib'
import tokens from '@shopify/polaris-tokens'
import { Appearance } from 'react-native'

import {palette} from '@theme/theme'

const pxToNumber = (px: string) => {
  return parseInt(px.replace('px', ''), 10)
}

const darkMode = Appearance.getColorScheme() === 'dark'

const {
  purplePrimary,
  purpleLight,
  textBlack,
  ERROR,
  SUCCESS,
  WARN,
  white,
} = palette

const {
  isSmallScreen,
} = Constants

Colors.loadColors({
  primaryColor: darkMode ? textBlack : purplePrimary,
  secondaryColor: darkMode ? textBlack : purpleLight,
  textColor: darkMode ? white : textBlack,
  errorColor: ERROR,
  successColor: SUCCESS,
  warnColor: WARN
})

Typography.loadTypographies({
  heading: {
    fontWeight: 'bold',
    fontSize: 34,
    lineHeight: 42.5,
    color: darkMode ? white : textBlack,
  },
  subheading: {
    fontWeight: '600',
    fontSize: 28,
    lineHeight: 36,
    color: darkMode ? white : textBlack,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: darkMode ? white : textBlack,
  },
})

Spacings.loadSpacings({
  page: isSmallScreen ? pxToNumber(tokens.spacingLoose) : pxToNumber(tokens.spacingExtraLoose),
  card: isSmallScreen ? pxToNumber(tokens.spacingBaseTight) : pxToNumber(tokens.spacingBase),
  gridGutter: pxToNumber(tokens.spacingBase) ? pxToNumber(tokens.spacingBase): pxToNumber(tokens.spacingLoose),
})
