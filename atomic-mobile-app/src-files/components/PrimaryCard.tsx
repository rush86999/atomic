import React from 'react'
import { Image, StyleSheet } from 'react-native'
import {
  createVariant, createRestyleComponent, VariantProps,
  createBox,
} from '@shopify/restyle'
import {Theme} from '../theme/theme'
import SIZES from '../theme/sizes'
import Text from './common/Text'


const variant = createVariant<Theme>({themeKey: 'cardVariants', defaults: {
  margin: {
    phone: 's',
    tablet: 'm',
  },
  backgroundColor: 'primaryCardBackground',
}})

const Box = createBox<Theme>();

type Props = VariantProps<Theme, 'cardVariants' & React.ComponentProps<typeof Box>>

const Card = createRestyleComponent<Props, Theme>([variant], Box)

function PrimaryCard(props: any) {
  const { image, imageText } = props;

  function renderImage() {
    if (!image) {
      return null;
    }

    return (
      <Box style={{
        width: 'auto',
        height: SIZES.CARD_IMAGE_HEIGHT,
        borderWidth: 0,
        overflow: 'hidden',
      }}>
          <Image source={{ uri: image }} />
          <Box position="absolute" bottom={15} left={10}>
            <Text variant="primaryHeader">
              {imageText ? imageText : null}
            </Text>
          </Box>
      </Box>
    )
  }

  return (
    <Card
      {...props}
      variant="primaryElevated"
    >
        {renderImage()}
        {props.children ? props.children : null}
    </Card>
  )
}


export default PrimaryCard
