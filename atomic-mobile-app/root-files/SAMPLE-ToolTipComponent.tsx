import * as React from 'react'
import { View, TouchableOpacity, Appearance } from 'react-native'
import Text from '@components/common/Text'
import { palette } from '@theme/theme'

import { Button } from './Button'
import styles from './style'
import { IStep, Labels } from './SAMPLE-types'

export interface TooltipProps {
  isFirstStep?: boolean
  isLastStep?: boolean
  currentStep: IStep
  labels?: Labels
  handleNext?(): void
  handlePrev?(): void
  handleStop?(): void
}

const dark = Appearance.getColorScheme() === 'dark'

export const Tooltip = ({
  isFirstStep,
  isLastStep,
  handleNext,
  handlePrev,
  handleStop,
  currentStep,
  labels,
}: TooltipProps) => (
  <View
    style={{
      borderRadius: 16,
      paddingTop: 24,
      alignItems: 'center',
      justifyContent: 'center',
      paddingBottom: 16,
      width: '80%',
      backgroundColor: dark ? palette.black : palette.white,
    }}
  >
    <View style={styles.tooltipContainer}>
      <Text variant="body" testID='stepDescription' style={styles.tooltipText}>
        {currentStep && currentStep.text}
      </Text>
    </View>
    <View style={[styles.bottomBar]}>
      {!isLastStep ? (
        <TouchableOpacity onPress={handleStop}>
          <Button>{labels?.skip || 'Skip'}</Button>
        </TouchableOpacity>
      ) : null}
      {!isFirstStep ? (
        <TouchableOpacity onPress={handlePrev}>
          <Button>{labels?.previous || 'Previous'}</Button>
        </TouchableOpacity>
      ) : null}
      {!isLastStep ? (
        <TouchableOpacity onPress={handleNext}>
          <Button>{labels?.next || 'Next'}</Button>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={handleStop}>
          <Button>{labels?.finish || 'Finish'}</Button>
        </TouchableOpacity>
      )}
    </View>
  </View>
)
