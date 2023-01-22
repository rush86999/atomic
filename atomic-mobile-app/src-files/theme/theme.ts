import {createTheme} from '@shopify/restyle'
import tokens from '@shopify/polaris-tokens'

import { DefaultTheme as NavigationDefaultTheme } from '@react-navigation/native'
import { DefaultTheme as PaperDefaultTheme } from 'react-native-paper'

import SIZES from '@theme/sizes'

const pxToNumber = (px: string) => {
  return parseInt(px.replace('px', ''), 10);
};

const palette = {
  offBlack: '#252525',
  purpleLight: '#ebb0e6',
  purple: '#6B24AA',
  purplePrimary: '#6B24AA',
  pinkPrimary: '#AC2688',
  transparentPurple: 'rgba(157, 1, 144, 0.4)',
  purpleDark: '#5e0057',
  red: '#fd3a69',
  lightGreen: '#bcf5bc',
  greenPrimary: '#0ECD9D',
  darkGreen: '#024502',
  textBlack: '#221D23',
  black: '#000000',
  white: '#F0F2F3',
  darkGray: '#2e2e2e',
  lightGray: '#d7d8d9',
  FACEBOOK: '#3B5998',
  TWITTER: '#5BC0DE',
  PRIMARY: '#B23AFC',
  INFO: '#1232FF',
  ERROR: '#FE2472',
  WARNING: '#FF9C09',
  SUCCESS: '#45DF31',
  INPUT: '#808080',
  PLACEHOLDER: '#9FA5AA',
  NAVBAR: '#F9F9F9',
  BLOCK: '#808080',
  shadowColor: '#AC2688',
  ICON: '#000000',
  grey: '#898989',
  MUTED: '#9FA5AA',
  WARN: '#FF963C',
  regularCardBackground: '#EEEEEE',
  transparent: 'rgba(0,0,0,0)',
  black60: 'rgba( 0, 0, 0, .6 )',
  carbs: '#e89740',
  protein: '#32a9e6',
  fat: '#8277ca',
  link: '#00376b',
  backgroundLink: '#47a5ff',
  disabled: '#EEE',
};


const theme = createTheme({
  colors: {
    mainBackground: palette.white,
    mainForeground: palette.textBlack,

    regularCardBackground: palette.white,
    regularCardText: palette.textBlack,

    lightRegularCardBackground: palette.transparentPurple,
    lightRegularCardText: palette.textBlack,
    lightRegularCardIcon: palette.purplePrimary,

    darkCardBackground: palette.darkGray,
    darkCardText: palette.white,

    secondaryCardBackground: palette.purpleLight,
    secondaryCardText: palette.textBlack,

    toastBreakBackground: palette.greenPrimary,

    primaryCardBackground: palette.purplePrimary,
    primaryCardText: palette.white,
    buttonIconBackground: palette.transparent,
    iconColor: palette.purplePrimary,
    link: palette.link,
    backgroundLink: palette.backgroundLink,
    greyLink: palette.darkGray,
    buttonLink: palette.purplePrimary,
    redLink: palette.red,
    buttonText: palette.white,
    primaryButtonText: palette.black,
    followingButtonText: palette.black,
    body: palette.textBlack,
    commentPost: palette.purplePrimary,
    shadowColor: palette.shadowColor,
    transparent: palette.transparent,
  },
  borderRadii: {
    cardRadius: SIZES.CARD_ROUNDED,
  },
  spacing: {
    none: tokens.spacingNone,
      xxs: pxToNumber(tokens.spacingExtraTight),
      xs: pxToNumber(tokens.spacingTight),
      s: pxToNumber(tokens.spacingBaseTight),
      m: pxToNumber(tokens.spacingBase),
      l: pxToNumber(tokens.spacingLoose),
      xl: pxToNumber(tokens.spacingExtraLoose),
      xxl: 2 * pxToNumber(tokens.spacingExtraLoose),
  },
  breakpoints: {
    phone: 0,
    tablet: 768,
  },
  textVariants: {
    backgroundText: {
      fontWeight: 'bold',
      fontSize: 48,
      textAlign: 'center',
      color: 'greyLink',
    },
    header: {
      fontWeight: 'bold',
      fontSize: 34,
      lineHeight: 42.5,
      color: 'mainForeground',
      textAlign: 'center',
    },
    subheader: {
      fontWeight: '600',
      fontSize: 28,
      lineHeight: 36,
      color: 'mainForeground',
    },
    subheaderNormal: {
      fontWeight: '400',
      fontSize: 28,
      lineHeight: 36,
      color: 'mainForeground',
    },
    rating: {
      textTransform: 'uppercase',
      fontWeight: 'bold',
      fontSize: 24,
      color: 'body',
    },
    subheaderBold: {
      fontWeight: 'bold',
      fontSize: 28,
      lineHeight: 36,
      color: 'mainForeground',
    },
    subTitle: {
      fontWeight: '600',
      fontSize: 28,
      lineHeight: 36,
      color: 'greyLink',
      textTransform: 'uppercase',
    },
    primaryHeader: {
      fontWeight: 'bold',
      fontSize: 34,
      lineHeight: 42.5,
      color: 'primaryCardText',
      textAlign: 'center',
    },
    primarySecondaryHeader: {
      fontWeight: '600',
      fontSize: 28,
      lineHeight: 36,
      color: 'primaryCardText',
    },
    secondaryHeaderLink: {
      fontWeight: '600',
      fontSize: 28,
      lineHeight: 36,
      color: 'buttonLink',
    },
    lightRegularHeader: {
      fontWeight: 'bold',
      fontSize: 34,
      lineHeight: 42.5,
      color: 'lightRegularCardText',
      textAlign: 'center',
    },
    lightRegularSubheader: {
      fontWeight: '600',
      fontSize: 28,
      lineHeight: 36,
      color: 'lightRegularCardText',
    },
    body: {
      fontSize: 16,
      lineHeight: 24,
      color: 'body',
    },
    bodyBold: {
      fontWeight: 'bold',
      fontSize: 16,
    },
    google: {
      color: 'mainBackground',
      fontSize: 19,
      lineHeight: 24,
      fontWeight: "500",
    },
    apple: {
      color: 'mainBackground',
      fontSize: 19,
      lineHeight: 24,
      fontWeight: "500",
    }, 
    comment: {
      fontSize: 16,
      lineHeight: 24,
      color: 'body',
    },
    username: {
      fontSize: 16,
      lineHeight: 24,
      color: 'body',
      fontWeight: 'bold',
    },
    caption: {
      fontSize: 16,
      lineHeight: 24,
      color: 'greyLink',
    },
    toDoButton: {
      fontSize: 12,
      lineHeight: 14,
      color: 'greyLink',
    },
    cardCaption: {
      fontSize: SIZES.FONT * 0.875,
      lineHeight: 24,
      color: 'greyLink',
    },
    cardTitle: {
      fontSize: SIZES.FONT * 1.2,
      lineHeight: 24,
      color: 'body',
    },
    cardLink: {
      fontSize: SIZES.FONT * 0.875,
      lineHeight: 24,
      color: 'buttonLink',
    },
    greyComment: {
      fontSize: 16,
      lineHeight: 24,
      color: 'greyLink',
    },
    optionHeader: {
      fontSize: 20,
      lineHeight: 24,
      color: 'body',
    },
    primaryOptionHeader: {
      fontSize: 20,
      lineHeight: 24,
      color: 'primaryCardText',
    },
    menuHeader: {
      fontSize: 60,
      color: 'body',
    },
    buttonLink: {
      fontSize: 20,
      lineHeight: 24,
      color: 'buttonLink',
    },
    greyLink: {
      fontSize: 20,
      lineHeight: 24,
      color: 'greyLink',
    },
    redLink: {
      fontSize: 20,
      lineHeight: 24,
      color: 'redLink',
    },
    buttonText: {
      fontSize: 20,
      lineHeight: 24,
      color: 'buttonText',
    },
    primaryButtonText: {
      fontSize: 20,
      lineHeight: 24,
      color: 'primaryButtonText',
    },
    followingButtonText: {
      fontSize: 20,
      lineHeight: 24,
      color: 'followingButtonText',
    },
    commentPost: {
      fontSize: 18,
      lineHeight: 24,
      color: 'commentPost',
    },
  },
  cardVariants: {
    defaults: {
      marginVertical: {
        phone: 's',
        tablet: 'm',
      },
      padding: {
        phone: 's',
        tablet: 'm',
      },
      borderRadius: {
        phone: 'cardRadius',
        tablet: 'cardRadius',
      },
      borderWidth: SIZES.CARD_BORDER_WIDTH,
      borderColor: 'shadowColor',
      justifyContent: 'center',
      alignItems: 'center',
    },
    regular: {
      backgroundColor: 'regularCardBackground',
      width: SIZES.CARD_WIDTH,
    },
    elevated: {
      borderWidth: 0,
      backgroundColor: 'regularCardBackground',
      shadowColor: 'shadowColor',
      shadowOpacity: SIZES.BLOCK_SHADOW_OPACITY,
      shadowOffset: {width: 0, height: 3},
      shadowRadius: SIZES.BLOCK_SHADOW_RADIUS,
      elevation: SIZES.ANDROID_ELEVATION,
      width: SIZES.CARD_WIDTH,
    },
    primaryElevated: {
      borderWidth: 0,
      backgroundColor: 'primaryCardBackground',
      shadowColor: 'shadowColor',
      shadowOpacity: SIZES.BLOCK_SHADOW_OPACITY,
      shadowOffset: {width: 0, height: 3},
      shadowRadius: SIZES.BLOCK_SHADOW_RADIUS,
      elevation: SIZES.ANDROID_ELEVATION,
      width: SIZES.CARD_WIDTH,
    },
    miniElevated: {
      borderWidth: 0,
      backgroundColor: 'regularCardBackground',
      shadowColor: 'shadowColor',
      shadowOpacity: SIZES.BLOCK_SHADOW_OPACITY,
      shadowOffset: {width: 0, height: 3},
      shadowRadius: SIZES.BLOCK_SHADOW_RADIUS,
      elevation: SIZES.ANDROID_ELEVATION,
      width: SIZES.CARD_WIDTH / 2,
    },
  },
});

export type Theme = typeof theme;

const darkTheme: Theme = {
  ...theme,
  colors: {
    ...theme.colors,
    mainBackground: palette.offBlack,
    mainForeground: palette.white,

    secondaryCardBackground: palette.purpleDark,
    secondaryCardText: palette.white,

    toastBreakBackground: palette.greenPrimary,

    regularCardBackground: palette.darkGray,
    regularCardText: palette.white,

    lightRegularCardBackground: palette.textBlack,
    lightRegularCardText: palette.white,
    lightRegularCardIcon: palette.white,

    darkCardBackground: palette.white,
    darkCardText: palette.textBlack,

    primaryCardBackground: palette.white,
    primaryCardText: palette.textBlack,
    buttonIconBackground: palette.transparent,
    iconColor: palette.white,
    link: palette.pinkPrimary,
    backgroundLink: palette.textBlack,
    greyLink: palette.lightGray,
    buttonLink: palette.pinkPrimary,
    buttonText: palette.white,
    redLink: palette.white,
    primaryButtonText: palette.white,
    followingButtonText: palette.white,
    body: palette.white,
    commentPost: palette.white,
    transparent: palette.transparent,
  },
}

const navigationTheme = {
  ...NavigationDefaultTheme,
  colors: {
    ...NavigationDefaultTheme.colors,
    primary: palette.purplePrimary,
    card: palette.purplePrimary,
    text: palette.white,
    notification: 'rgb(255, 69, 58)',
  },
}

const darkNavigationTheme = {
  ...NavigationDefaultTheme,
  colors: {
    ...NavigationDefaultTheme.colors,
    primary: palette.pinkPrimary,
    background: palette.black,
    card: palette.black,
    text: palette.pinkPrimary,
  },
}

const paperTheme = {
  ...PaperDefaultTheme,
  roundness: 2,
  dark: false,
  colors: {
    ...PaperDefaultTheme.colors,
    primary: palette.purplePrimary,
    accent: palette.purpleLight,
    background: palette.white,
    surface: palette.white,
    text: palette.textBlack,
    disabled: palette.disabled,
    placeholder: palette.PLACEHOLDER,
  },
}

const darkPaperTheme = {
  ...PaperDefaultTheme,
  roundness: 2,
  dark: true,
  colors: {
    ...PaperDefaultTheme.colors,
    primary: palette.black,
    accent: palette.black,
    background: palette.black,
    surface: palette.black,
    text: palette.white,
    disabled: palette.white,
    placeholder: palette.white,
  },
}

export {
  darkTheme,
  theme,
  palette,
  navigationTheme,
  darkNavigationTheme,
  paperTheme,
  darkPaperTheme,
 }
