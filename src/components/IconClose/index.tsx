import React from 'react';
import classNames from 'classnames';

import close from 'assets/images/close-modal.svg';
import closeLight from 'assets/images/close-modal-light.svg';
import scss from './IconClose.module.scss';

const SIZE_SMALL = 'small';

const IconClose = (props: any) => {
  const { className, rootClassName, size } = props;
  const classes = classNames(rootClassName || scss.root, className);

  if (size === SIZE_SMALL) {
    return (
      <svg className={classes} width="9" height="9" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M2.175 8.396l2.482-2.482 2.482 2.482a.889.889 0 1 0 1.258-1.257L5.914 4.657l2.482-2.483A.89.89 0 0 0 7.139.917L4.657 3.4 2.175.918A.888.888 0 1 0 .917 2.174L3.4 4.657.918 7.139a.889.889 0 1 0 1.257 1.257"
          fillRule="evenodd"
        />
      </svg>
    );
  }

  return (
    <>
      <img src={close} className="dark_theme_img" alt="close" />
      <img src={closeLight} className="light_theme_img" alt="close" />
    </>
  );
};

IconClose.defaultProps = {
  className: null,
  rootClassName: null,
};

export default IconClose;
