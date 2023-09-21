import React from 'react'
import { StyleSheet } from 'react-native'
import Image from 'next/image'
import {
  createVariant, createRestyleComponent, VariantProps,
  createBox,
} from '@shopify/restyle'
import {Theme} from '@lib/theme/theme'
import SIZES from '@lib/theme/sizes'

import Text from '@components/common/Text'


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
          {/* eslint-disable-next-line jsx-a11y/alt-text*/}
          <Image src={image} height={SIZES.CARD_IMAGE_HEIGHT} alt={imageText} />
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

// const styles = (theme: any) =>
//   StyleSheet.create({
//     card: {
//       borderWidth: 0,
//       backgroundColor: theme.COLORS.WHITE,
//       width: theme.SIZES.CARD_WIDTH,
//       marginVertical: theme.SIZES.CARD_MARGIN_VERTICAL,
//     },
//     footer: {
//       justifyContent: 'flex-start',
//       alignItems: 'center',
//       paddingHorizontal: theme.SIZES.CARD_FOOTER_HORIZONTAL,
//       paddingVertical: theme.SIZES.CARD_FOOTER_VERTICAL,
//       backgroundColor: theme.COLORS.TRANSPARENT,
//       zIndex: 1,
//     },
//     avatar: {
//       width: theme.SIZES.CARD_AVATAR_WIDTH,
//       height: theme.SIZES.CARD_AVATAR_HEIGHT,
//       borderRadius: theme.SIZES.CARD_AVATAR_RADIUS,
//     },
//     title: {
//       justifyContent: 'center',
//     },
//     round: {
//       borderRadius: theme.SIZES.CARD_ROUND,
//     },
//     rounded: {
//       borderRadius: theme.SIZES.CARD_ROUNDED,
//     },
//   });

export default PrimaryCard
