import React, { ReactElement } from 'react'
import {StyleSheet, Button, ButtonProps, View, StyleProp, ViewStyle} from 'react-native'
// import tokens from '@shopify/polaris-tokens';
import {palette} from '@lib/theme/theme'
import SIZES from '@lib/theme/sizes'
import cls from 'classnames'

import materialTheme from '@lib/theme/constants/Theme'

export default function GaButton(props: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> & {
  gradient?: string,
  following?: boolean,
  disabled?: boolean,
  cancel?: boolean,
  primary?: boolean,
  style?: object,
  className?: string,
}) {

    const {
        gradient,
        children,
        style,
      disabled,
        cancel,
        following,
      primary,
        onClick,
        className,
        ...rest
      } = props

    if (disabled) {

      return (
        
      
          <button
            className={cls("btn btn-primary btn-disabled", {[`${className ?? 'atomic-placeholder'}`]: !!className })}
              style={{ ...(styles.disabledButton ?? {}),...(style ?? {}) }}
              {...rest}
              disabled={disabled}
              onClick={onClick}
          >
            {children}
          </button>
          
         
    )
    }

  if (cancel) {

      return (
        
      
          <button
            className={cls("btn btn-ghost", {[`${className ?? 'atomic-placeholder'}`]: !!className })}
              style={{ ...(styles.disabledButton ?? {}),...(style ?? {}) }}
              {...rest}
              onClick={onClick}
          >
            {children}
          </button>
          
         
    )
    }

    if (following) {
      return (
       
       
          <button
            className={cls("btn btn-ghost", {[`${className ?? 'atomic-placeholder'}`]: !!className })}
              style={{ ...styles.followingButton, ...(style ?? {})}}
          {...rest}
          onClick={onClick}
          >
            {children}
          </button>
      )
    }

    if (primary) {
      return (
        
         
          <button
             className={cls("btn btn-primary", {[`${className ?? 'atomic-placeholder'}`]: !!className })}
            style={{ ...styles.primaryButton, ...(style ?? {}) }}
              
          {...rest}
          onClick={onClick}
          >
            {children}
            </button>
          
          
      )
    }

  return (
      
     
      <button
        className={cls("btn btn-primary", {[`${className ?? 'atomic-placeholder'}`]: !!className })}
        style={{ ...styles.button, ...(style ?? {}) }}
 
        {...rest}
        onClick={onClick}
      >
        {children}
      </button>
        
     
    )

}

const styles = {
  gradient: {
    borderWidth: 0,
    borderRadius: SIZES.BASE * 2,
    backgroundColor: palette.purplePrimary,
  },
  button: {
    borderWidth: 0,
    borderRadius: SIZES.BASE * 2,
    // backgroundColor: palette.pinkPrimary,
  },
  disabledButton: {
    borderWidth: 0,
    borderRadius: SIZES.BASE * 2,
  },
  followingButton: {
    borderWidth: 0,
    backgroundColor: palette.white,
    borderRadius: SIZES.BASE * 2,
    // borderColor: palette.black60,
  },
  primaryButton: {
    borderWidth: 0,
    borderRadius: SIZES.BASE * 2,
  },
}
