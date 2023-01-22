import React, { useCallback, useRef } from 'react'
import { BlurView } from '@react-native-community/blur'
import {
  Animated,
  PanResponder,
  Dimensions,
  StyleSheet,
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native'
import Star from '@screens/Calendar/Rating/Star'
import Text from '@components/common/Text'
import Box from '@components/common/Box'

interface Props {
  visible: boolean;
  onClose: () => void;
  onRatingChanged: (rating: number) => void;
  starSize: number;
  maxStars?: number;
  starRating?: number;
}

const { width, height } = Dimensions.get('screen')

const MODAL_HEIGHT = height * 0.25

const RatingBottomModal = (props: Props) => {
  if (!props.visible) {
    return null
  }

  const pan = React.useRef(new Animated.ValueXY({ x: 0, y: height })).current
  const [offset, setOffset] = React.useState(props.starRating || 0)
  const animatedWidth = React.useRef(0)

  const openAnim = () => {
    Animated.spring(pan.y, {
      toValue: height - MODAL_HEIGHT,
      bounciness: 0,
      useNativeDriver: true,
    }).start()
  }

  const closeAnim = () => {
    Animated.spring(pan.y, {
      toValue: height,
      useNativeDriver: true,
    }).start()

    props.onClose()
  }

  React.useEffect(() => {
    props.onRatingChanged(offset);
  }, [offset]);

  React.useEffect(() => {
    if (!props.visible) {
      return
    }

    openAnim()
  }, [props.visible])

  const changeOffset = useCallback((e: GestureResponderEvent) => {
    const { nativeEvent } = e;

    const distance = (width - animatedWidth.current) / 2;
    const starSize = animatedWidth.current / (props.maxStars || 5);

    let v = Number((nativeEvent.pageX - distance) / starSize);

    const rest = v - Math.trunc(v);

    if (rest <= 0.5) {
      v = Math.trunc(v);
    } else {
      v = Math.trunc(v) + 0.5;
    }

    setOffset(v);
  }, [])

  const changeModalPosition = React.useCallback(
    (gs: PanResponderGestureState) => {
      const value = height - MODAL_HEIGHT + gs.dy

      if (value >= height || value < height - MODAL_HEIGHT) {
        return
      }

      pan.y.setValue(value)
    },
    [],
  )

  const modalResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (e) => {
        if (e.nativeEvent.pageY > height - MODAL_HEIGHT) {
          return true;
        }

        closeAnim();

        return false;
      },
      onPanResponderGrant: () => {
      },
      onPanResponderMove: (_, gs) => {
        changeModalPosition(gs);
      },
      onPanResponderRelease: (_, { dy }) => {
        if (dy < MODAL_HEIGHT / 2) {
          openAnim();
        } else {
          closeAnim();
        }
      },
    }),
  ).current

  const starPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (e, gs) => {
        changeOffset(e)
        return true
      },
      onPanResponderMove: (e, gs) => {
        if (gs.dy > 50) {
          changeModalPosition(gs);
          return
        }

        changeOffset(e)
      },
      onPanResponderRelease: (_, { dy }) => {
        if (dy < MODAL_HEIGHT / 2) {
          openAnim()
        } else {
          closeAnim()
        }
      },
    }),
  ).current

  return (
    <Animated.View
      {...modalResponder.panHandlers}
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          width,
          height,
          backgroundColor: 'rgba(0,0,0,.1)',
        },
      ]}>
      <BlurView
        style={StyleSheet.absoluteFillObject}
        blurType="light"
        blurAmount={5}
        reducedTransparencyFallbackColor="white"
      />

      <Animated.View
        style={{
          opacity: pan.y.interpolate({
            inputRange: [height - MODAL_HEIGHT, height],
            outputRange: [1, 0.5],
          }),
          transform: [
            {
              translateY: pan.y,
            },
          ],
        }}>
          <Box
            backgroundColor="mainBackground"
            style={{
            width: '100%',
            height: MODAL_HEIGHT,
            shadowColor: '#ccc',
            shadowOffset: { height: -1, width: 0 },
            shadowRadius: 15,
            shadowOpacity: 0.1,
            }}
          >
              <Box
                style={{
                    flex: 1,
                    paddingTop: 24,
                    alignItems: 'center',
                    justifyContent: 'flex-start'
              }}>
                  <Text variant="rating">
                      rate your productivity level for this event
                  </Text>

                  <Box
                      style={{
                      marginTop: 16,
                      flexDirection: 'row',
                    }}>
                      <Animated.View
                      onLayout={(e) => {
                          animatedWidth.current = e.nativeEvent.layout.width;
                      }}
                      style={{ flexDirection: 'row' }}
                      {...starPanResponder.panHandlers}>
                      {Array.from({ length: props.maxStars || 5 }).map((_, i) => {
                          return (
                          <Star
                              key={i}
                              size={props.starSize}
                              distance={8}
                              offset={offset - i}
                          />
                          );
                      })}
                      </Animated.View>
                  </Box>
              </Box>
          </Box>
      </Animated.View>
    </Animated.View>
  )
}

export default RatingBottomModal