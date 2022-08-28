import React from 'react';
import NextIcon from 'assets/images/ic-next.png';
import PrevIcon from 'assets/images/ic-prev.png';
import classNames from 'classnames';
import Carousel from 'react-material-ui-carousel';

interface Props {
  className?: string
  children: any
  indicators?: boolean
  index?: number
  handleChange?: (value: any) => void,
  navButtonsAlwaysVisible?: boolean
  navButtonsAlwaysInvisible?: boolean
  swipe?: boolean
  autoPlay?: boolean
}

const MainCarouselComponent = (props: Props) => {
  const {
    className, children, index, autoPlay, swipe, indicators, navButtonsAlwaysVisible, navButtonsAlwaysInvisible, handleChange,
  } = props;
  const classes = classNames(className);
  return (
    <Carousel
      autoPlay={autoPlay}
      // className={classes}
      className="mui_carousel"
      swipe={swipe}
      index={index}
      onChange={handleChange}
      indicators={indicators}
      NextIcon={<img src={NextIcon} alt="next icon" />}
      PrevIcon={<img src={PrevIcon} alt="previous icon" />}
      navButtonsAlwaysVisible={navButtonsAlwaysVisible}
      navButtonsAlwaysInvisible={navButtonsAlwaysInvisible}
    >
      {children}
    </Carousel>
  );
};

MainCarouselComponent.defaultProps = {
  className: undefined,
  autoPlay: false,
  index: 0,
  navButtonsAlwaysVisible: false,
  navButtonsAlwaysInvisible: false,
  handleChange: () => null,
  indicators: false,
  swipe: false,
};

export default MainCarouselComponent;
