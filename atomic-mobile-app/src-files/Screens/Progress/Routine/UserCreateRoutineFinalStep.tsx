import React from 'react';
import { StyleSheet } from 'react-native'
import LottieView from 'lottie-react-native';
import Box from '@components/common/Box'
import Text from '@components/common/Text'
import PrimaryCard from '@components/PrimaryCard'

const styles = StyleSheet.create({
  svg: {
    width: 'auto',
  }
})

type Props = {
  renderCreateRoutineButton: () => JSX.Element,
  name: string | null,
  renderPrevButton: () => JSX.Element,
}

function UserCreateRoutineFinalStep(props: Props) {
  const {
    renderCreateRoutineButton,
    name,
    renderPrevButton,
   } = props

  return (
    <Box flex={1} justifyContent="center" alignItems="center">
      <Box my={{ phone: 's', tablet: 'm' }} style={{ width: '100%' }}>
        <PrimaryCard>
        {name ? (
          <Text variant="primarySecondaryHeader">
            {`${name}`}
          </Text>
        )  : null}
        </PrimaryCard>
      </Box>
      <Box style={{ width: '100%' }}>
        <LottieView
          autoPlay
          source={require('@assets/icons/workout.json')}
          loop
          style={styles.svg}
        />
      </Box>
      <Box m={{ phone: 's', tablet: 'm' }} style={{ width: '100%' }} flexDirection="row" justifyContent="space-between">
        {renderPrevButton()}
        {renderCreateRoutineButton()}
      </Box>
    </Box>
  )
}


export default UserCreateRoutineFinalStep
