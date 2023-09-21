import React from 'react';
import Star, { IStarProps } from '@pages/Calendar/Rating/Star'

interface IStarsProps extends IStarProps {
  maxStars: number;
  starSize: number;
}

const Stars = (props: IStarsProps) => {
  return (
    <>
      {Array.from({ length: props.maxStars || 5 }).map((_, i) => {
        return (
          <Star
            key={i}
            size={props.starSize}
            distance={props.distance}
            offset={props.offset - i}
          />
        );
      })}
    </>
  );
};

export default Stars;
