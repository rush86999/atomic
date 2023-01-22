import React from 'react'
import {
TouchableOpacity,
StyleSheet,
Dimensions,
TouchableWithoutFeedback,
} from 'react-native'
import { RNCamera } from 'react-native-camera'

import Ionicons from 'react-native-vector-icons/Ionicons'
import Box from '@components/common/Box'


const { FlashMode: CameraFlashModes, Type: CameraTypes } = RNCamera.Constants

type Props = {
    capturing: boolean,
    cameraType: 'back' | 'front',
    flashMode : 'off' | 'on',
    setFlashMode: (flashMod: typeof CameraFlashModes.on | typeof CameraFlashModes.off) => void,
    setCameraType: (cameraType: typeof CameraTypes.front | typeof CameraTypes.back) => void,
    onCaptureIn: () => void,
    // onCaptureOut: () => void,
    onCapture: () => void,
}

const { width: winWidth } = Dimensions.get('window')


const styles = StyleSheet.create({
  captureBtn: {
    width: 60,
    height: 60,
    borderWidth: 2,
    borderRadius: 60 / 2,
    borderColor: "#FFFFFF",
  },
  captureBtnActive: {
      width: 80,
      height: 80,
  },
  captureBtnInternal: {
    width: 76,
    height: 76,
    borderWidth: 2,
    borderRadius: 76,
    backgroundColor: "red",
    borderColor: "transparent",
  },
  bottomToolbar: {
    width: winWidth,
    position: 'absolute',
    height: 150,
    bottom: 0,
  },
})

function CameraToolbar(props: Props) {
  const {
    capturing = false,
    cameraType = CameraTypes.back,
    flashMode = CameraFlashModes.off,
    setFlashMode,
    setCameraType,
    onCaptureIn,
    // onCaptureOut,
    onCapture,
  } = props

  return (
    <Box style={styles.bottomToolbar} flexDirection="row" justifyContent="space-around">
      <Box flex={1} justifyContent="center" alignItems="center">
        <TouchableOpacity onPress={() => setFlashMode(
              flashMode === CameraFlashModes.on ? CameraFlashModes.off : CameraFlashModes.on
        )}>
          <Ionicons
            name={flashMode === CameraFlashModes.on ? 'md-flash' : 'md-flash-off'}
            size={30}
            color="white"
          />
        </TouchableOpacity>
      </Box>
      <Box flex={2} justifyContent="center" alignItems="center">
        <TouchableWithoutFeedback
          onPressIn={onCaptureIn}
          onPress={onCapture}>
          <Box style={[styles.captureBtn, capturing && styles.captureBtnActive]}>
              {capturing && <Box style={styles.captureBtnInternal} />}
          </Box>
        </TouchableWithoutFeedback>
      </Box>
      <Box flex={1} justifyContent="center" alignItems="center">
        <TouchableOpacity onPress={() => setCameraType(
            cameraType === CameraTypes.back ? CameraTypes.front : CameraTypes.back
        )}>
            <Ionicons
              name="md-camera-reverse-outline"
              color="white"
              size={30}
            />
        </TouchableOpacity>
      </Box>
    </Box>
  )
}

export default CameraToolbar
