import { StyleSheet, ViewStyle, TextStyle, Appearance } from 'react-native'

import { palette } from '@theme/theme'

export const Z_INDEX: number = 100
export const MARGIN: number = 13
export const OFFSET_WIDTH: number = 4

export interface IStyle {
  container: ViewStyle
  tooltip: ViewStyle
  tooltipText: TextStyle
  tooltipContainer: ViewStyle
  button: ViewStyle
  buttonText: TextStyle
  bottomBar: ViewStyle
  overlayContainer: ViewStyle
}

const dark = Appearance.getColorScheme() === 'dark'

export default StyleSheet.create<IStyle>({
  container: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    zIndex: Z_INDEX,
  },
  tooltip: {
    position: 'absolute',
    paddingHorizontal: 15,
    overflow: 'hidden',
    width: '100%',
    borderRadius: 16,
    paddingTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 16,
  },
  tooltipText: {
    textAlign: 'center',
    color: dark ? palette.white : palette.textBlack,
  },
  tooltipContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '80%',
  },
  button: {
    padding: 10,
  },
  buttonText: {
    color: '#27ae60',
  },
  bottomBar: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  overlayContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
  },
})
