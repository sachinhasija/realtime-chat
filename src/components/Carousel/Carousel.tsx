import React from 'react';
import classNames from 'classnames';
import 'react-multi-carousel/lib/styles.css';
import Carousel from 'react-multi-carousel';

interface Props {
  className?: string
  children: any
  showDots?: boolean
  arrows?: boolean
  draggable?: boolean
  swipeable?: boolean
  partialVisibilityGutter?: number
  itemClass?: string
  itemCount?: { desktop: number, tablet: number, mobile: number, smMobile: number, xsMobile: number}
}

const CarouselComponent = (props: Props) => {
  const {
    className, children, draggable, swipeable, showDots, arrows, partialVisibilityGutter, itemCount, itemClass,
  } = props;
  const responsive = {
    desktop: {
      breakpoint: { max: 3000, min: 1024 },
      items: itemCount?.desktop ?? 3,
      partialVisibilityGutter: partialVisibilityGutter ?? 0,
    },
    tablet: {
      breakpoint: { max: 1024, min: 820 },
      items: itemCount?.tablet ?? 1,
      partialVisibilityGutter: 0,
      // partialVisibilityGutter: 125,
      // partialVisibilityGutter: spacing?.tablet ?? 135,
    },
    mobile: {
      breakpoint: { max: 820, min: 576 },
      items: itemCount?.mobile ?? 1,
      partialVisibilityGutter: 0,
    },
    smMobile: {
      breakpoint: { max: 576, min: 450 },
      items: itemCount?.smMobile ?? 1,
      partialVisibilityGutter: 0,
    },
    xsMobile: {
      breakpoint: { max: 450, min: 0 },
      items: itemCount?.xsMobile ?? 1,
      partialVisibilityGutter: 0,
    },
  };
  const classes = classNames(className);
  return (
    <div className={classes}>
      <Carousel
        responsive={responsive}
        swipeable={swipeable}
        draggable={draggable}
        showDots={showDots}
        arrows={arrows}
        partialVisible
        itemClass={itemClass}
        className="card_slider"
      >
        {children}
      </Carousel>
    </div>
  );
};

CarouselComponent.defaultProps = {
  className: undefined,
  itemCount: {
    desktop: 3,
    tablet: 1,
    mobile: 1,
    smMobile: 1,
    xsMobile: 1,
  },
  showDots: false,
  arrows: true,
  draggable: false,
  swipeable: false,
  itemClass: undefined,
  partialVisibilityGutter: 0,
};

export default CarouselComponent;
