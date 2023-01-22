import React from 'react';
import {View, TextStyle, ViewStyle} from 'react-native';
import {HOUR_BLOCK_HEIGHT} from '@screens/Calendar/Event/Packer';
import {calcTimeOffset} from '@screens/Calendar/Timeline/presenter';

export interface NowIndicatorProps {
  styles: {[key: string]: ViewStyle | TextStyle};
}

const NowIndicator = (props: NowIndicatorProps) => {
  const {styles} = props;

  const indicatorPosition = calcTimeOffset(HOUR_BLOCK_HEIGHT);

  return (
    <View style={[styles.nowIndicator, {top: indicatorPosition}]}>
      <View style={styles.nowIndicatorLine} />
      <View style={styles.nowIndicatorKnob} />
    </View>
  );
};

export default NowIndicator;
