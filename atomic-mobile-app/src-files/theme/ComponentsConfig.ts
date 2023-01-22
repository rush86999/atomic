import { ThemeManager } from 'react-native-ui-lib'
import { Colors } from 'react-native-ui-lib'
import {
  Appearance,
} from 'react-native'
import { palette } from '@theme/theme'



const darkMode = Appearance.getColorScheme() === 'dark'

ThemeManager.setComponentTheme('Dialog', {
  containerStyle: {
    backgroundColor: darkMode ? palette.black : palette.white,
    color: darkMode ? palette.white : palette.textBlack,
  },
})

ThemeManager.setComponentTheme('Stepper', {
  backgroundColor: darkMode ? palette.black : palette.white,
  color: darkMode ? palette.white : palette.textBlack,
})

ThemeManager.setComponentTheme('TextField', {

  backgroundColor: darkMode ? palette.black : palette.white,
  color: darkMode ? palette.white : palette.textBlack,
  disabledColor: darkMode ? palette.white : palette.PLACEHOLDER,
  titleColor: darkMode ? palette.white : palette.textBlack,
  placeholderTextColor: darkMode ? palette.white : palette.PLACEHOLDER,
  borderColor: darkMode ? palette.white : palette.textBlack,
  borderWidth: 1,
})

ThemeManager.setComponentTheme('Picker', {
  titleStyle: {
    fontWeight: '600',
    fontSize: 28,
    lineHeight: 36,
    color: darkMode ? palette.white : palette.textBlack,
    backGroundColor: darkMode ? palette.black : palette.white,
  },
  titleColor: darkMode ? palette.white : palette.textBlack,
  labelStyle: {
    fontSize: 32,
    color: darkMode ? palette.white : palette.textBlack,
    backgroundColor: darkMode ? palette.black : palette.white,
  },
  containerStyle: {
    backgroundColor: darkMode ? palette.black : palette.white,
    color: darkMode ? palette.white : palette.textBlack,
  },
  backgroundColor: darkMode ? palette.black : palette.white,
  color: darkMode ? palette.white : palette.textBlack,
})

ThemeManager.setComponentTheme('Switch', {
  onColor: palette.purplePrimary,
  offColor: palette.transparentPurple,
})

Colors.loadColors({
  error: palette.ERROR,
  success: palette.SUCCESS,
  primary: palette.purplePrimary,
})
