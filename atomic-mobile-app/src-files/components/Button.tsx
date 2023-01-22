import React from 'react'
import {StyleSheet} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import {Button} from 'galio-framework'
import {palette} from '@theme/theme'
import SIZES from '@theme/sizes'

import materialTheme from '@constants/Theme'

export default function GaButton(props: any) {

    const {
        gradient,
        children,
        style,
        disabled,
        following,
        primary,
        ...rest
      } = props

    if (gradient) {
      return (
        <LinearGradient
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          locations={[0.2, 1]}
          style={[styles.gradient, style]}
          colors={[
            materialTheme.COLORS.GRADIENT_START,
            materialTheme.COLORS.GRADIENT_END,
          ]}>
          <Button
            color="transparent"
            style={[styles.gradient, style]}
            textStyle={{
              color: palette.white,
              fontSize: 20,
              lineHeight: 24,
            }}
            {...rest}>
              {children}
          </Button>
        </LinearGradient>
      );
    }
    if (disabled) {

      return (
        <Button
          style={[styles.disabledButton, style]}
          {...rest}
          textStyle={{
            color: palette.black,
            fontSize: 20,
            lineHeight: 24,
          }}
        >
          {children}
        </Button>
    )
    }

    if (following) {
      return (
        <Button
          style={[styles.followingButton, style]} {...rest}
          textStyle={{
            color: palette.textBlack,
            fontSize: 20,
            lineHeight: 24,
          }}
          >
            {children}
        </Button>
      )
    }

    if (primary) {
      return (
        <Button
          style={[styles.primaryButton, style]}
          {...rest}
          textStyle={{
            color: palette.textBlack,
            fontSize: 20,
            lineHeight: 24,
          }}
        >
            {children}
        </Button>
      )
    }

    return (
      <LinearGradient
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        locations={[0.2, 1]}
        style={[styles.gradient, style]}
        colors={[
          materialTheme.COLORS.GRADIENT_START,
          materialTheme.COLORS.GRADIENT_END,
        ]}>
        <Button
          style={[styles.button, style]}
          color="transparent"
          {...rest}
          textStyle={{
            color: palette.white,
            fontSize: 20,
            lineHeight: 24,
          }}
        >
            {children}
        </Button>
    </LinearGradient>
    )

}

const styles = StyleSheet.create({
  gradient: {
    borderWidth: 0,
    borderRadius: SIZES.BASE * 2,
    backgroundColor: palette.purplePrimary,
  },
  button: {
    borderWidth: 0,
    borderRadius: SIZES.BASE * 2,
  },
  disabledButton: {
    borderWidth: 0,
    borderRadius: SIZES.BASE * 2,
    backgroundColor: palette.disabled,
  },
  followingButton: {
    borderWidth: 0,
    backgroundColor: palette.white,
    borderRadius: SIZES.BASE * 2,
  },
  primaryButton: {
    borderWidth: 0,
    borderRadius: SIZES.BASE * 2,
    backgroundColor: palette.white,
  },
});
