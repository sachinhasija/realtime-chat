/**
 * This is a wrapper component for different Layouts. Main content should be added to this wrapper.
 */
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import scss from './LayoutWrapperMain.module.scss';

const LayoutWrapperMain = (props: any) => {
  const { className, rootClassName, children } = props;
  const classes = classNames(rootClassName || scss.root, className);

  return (
    <div className={classes}>{children}</div>
  );
};

LayoutWrapperMain.defaultProps = {
  className: null,
  rootClassName: null,
};

const { node, string } = PropTypes;

LayoutWrapperMain.propTypes = {
  children: node.isRequired,
  className: string,
  rootClassName: string,
};

export default LayoutWrapperMain;
