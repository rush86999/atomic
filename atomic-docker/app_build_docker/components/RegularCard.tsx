import React from 'react'
import { StyleSheet } from 'react-native'
import Image from 'next/image'
import {
  createVariant, createRestyleComponent, VariantProps,
  createBox,
} from '@shopify/restyle'
import {Theme} from '@lib/theme/theme'
import SIZES from '@lib/theme/sizes'

import Text from './common/Text'

import { palette } from '@lib/theme/theme'

const variant = createVariant<Theme>({themeKey: 'cardVariants', defaults: {
  margin: {
    phone: 'xs',
    tablet: 's',
  },
}})

const Box = createBox<Theme>();

type Props = VariantProps<Theme, 'cardVariants' & React.ComponentProps<typeof Box>>

const Card = createRestyleComponent<Props, Theme>([variant], Box)

function RegularCard({style, ...rest}: any) {
  const { image, caption, title,
  titleColor, captionColor, footerStyle, imageText } = rest;

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
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={image} height={SIZES.CARD_IMAGE_HEIGHT} alt={title} />
          <Box position="absolute" bottom={15} left={10}>
            <Text variant="primaryHeader">
              {imageText ? imageText : null}
            </Text>
          </Box>
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
    <div className="md:w-96">
      <Card
        {...rest}
        variant="elevated"
        style={style}
      >
        {renderImage()}
        {renderAuthor()}
        {rest.children ? rest.children : null}
        </Card>
      </div>
  )
}

const styles = {
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
    } as any,
    round: {
      borderRadius: SIZES.CARD_ROUND,
    },
    rounded: {
      borderRadius: SIZES.CARD_ROUNDED,
    },
  }

export default RegularCard;
