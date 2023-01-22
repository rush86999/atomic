import React from 'react'
import { Image, StyleSheet } from 'react-native'
import {
  createVariant, createRestyleComponent, VariantProps,
  createBox,
} from '@shopify/restyle'
import {Theme} from '../theme/theme'
import SIZES from '../theme/sizes'
import Text from './common/Text'
import { palette } from '../theme/theme'

const variant = createVariant<Theme>({themeKey: 'cardVariants', defaults: {
  margin: {
    phone: 's',
    tablet: 'm',
  },
  backgroundColor: 'regularCardBackground',
}})

const Box = createBox<Theme>();

type Props = VariantProps<Theme, 'cardVariants' & React.ComponentProps<typeof Box>>

const Card = createRestyleComponent<Props, Theme>([variant], Box)

function SmallerCard(props: any) {
  const { image, caption, title,
  titleColor, captionColor, footerStyle } = props;


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
      </Box>
    )
  }

  function renderAuthor() {
    if (!title) return null

    return (
      <Box flex={1} flexDirection="row" style={[styles.footer, footerStyle]} justifyContent="space-between">
        <Box>
          <Box style={styles.title}>
            <Text variant="cardTitle" color={titleColor}>
              {title}
            </Text>
          </Box>
          <Box flexDirection="row" justifyContent="flex-start">
            <Box flexDirection="row" alignItems="flex-end">
              <Text variant="cardCaption" color={captionColor}>
                {caption}
              </Text>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Card
      {...props}
      variant="miniElevated"
    >
      {renderImage()}
      {renderAuthor()}
      {props.children ? props.children : null}
    </Card>
  )
}

const styles =
  StyleSheet.create({
    card: {
      borderWidth: 0,
      backgroundColor: palette.white,
      width: SIZES.CARD_WIDTH,
      marginVertical: SIZES.CARD_MARGIN_VERTICAL,
    },
    footer: {
      justifyContent: 'flex-start',
      alignItems: 'center',
      paddingHorizontal: SIZES.CARD_FOOTER_HORIZONTAL,
      paddingVertical: SIZES.CARD_FOOTER_VERTICAL,
      backgroundColor: palette.transparent,
      zIndex: 1,
    },
    avatar: {
      width: SIZES.CARD_AVATAR_WIDTH,
      height: SIZES.CARD_AVATAR_HEIGHT,
      borderRadius: SIZES.CARD_AVATAR_RADIUS,
    },
    title: {
      justifyContent: 'center',
    },
    round: {
      borderRadius: SIZES.CARD_ROUND,
    },
    rounded: {
      borderRadius: SIZES.CARD_ROUNDED,
    },
  });

export default SmallerCard
