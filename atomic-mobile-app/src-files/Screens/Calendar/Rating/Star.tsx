import React from 'react';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

export interface IStarProps {
  offset: number;
  size: number;
  distance?: number;
}

const Star = (props: IStarProps) => {
  return (
    <Svg
      style={{ marginHorizontal: props.distance || 0 }}
      width={props.size}
      height={props.size}
      viewBox="0 0 988 941">
      <Defs>
        <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
          <Stop offset={props.offset} stopColor="#FFD080" stopOpacity="1" />
          <Stop offset={props.offset} stopColor="grey" stopOpacity="1" />
        </LinearGradient>
      </Defs>

      <Path
        fill="url(#grad)"
        d="M479.471 9.49859C485.19 -2.89935 502.81 -2.89931 508.529 9.49863L642.603 300.17C644.933 305.223 649.722 308.702 655.248 309.357L973.124 347.047C986.682 348.654 992.127 365.412 982.103 374.682L747.089 592.016C743.004 595.794 741.175 601.424 742.259 606.882L804.644 920.846C807.305 934.238 793.049 944.595 781.135 937.926L501.815 781.574C496.959 778.857 491.041 778.857 486.185 781.574L206.865 937.926C194.951 944.595 180.695 934.238 183.356 920.846L245.741 606.882C246.825 601.424 244.996 595.794 240.911 592.016L5.89677 374.682C-4.12723 365.412 1.31786 348.654 14.8762 347.047L332.752 309.357C338.278 308.702 343.067 305.223 345.397 300.17L479.471 9.49859Z"
      />
    </Svg>
  );
};

export default Star;
