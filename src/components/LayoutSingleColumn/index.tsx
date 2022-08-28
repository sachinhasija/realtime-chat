/**
 * LayoutSingleColumn needs to have 2-3 children:
 * LayoutWrapperTopbar, LayoutWrapperMain, and possibly LayoutWrapperFooter.
 */
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import LayoutWrapperMain from '../LayoutWrapperMain';

import scss from './LayoutSingleColumn.module.scss';

const prepareChildren = (children: any) => {
  // const childrenCount = React.Children.count(children);
  // if (!(childrenCount === 2 || childrenCount === 3)) {
  //   throw new Error(
  //     `LayoutSingleColumn needs to have 2 - 3 children:
  //      LayoutWrapperTopbar, and LayoutWrapperMain,
  //      and optionally LayoutWrapperFooter.`,
  //   );
  // }

  const childrenMap: { layoutWrapperTopbar?: any, layoutWrapperMain?: any, layoutWrapperFooter?: any } = {};

  React.Children.forEach(children, (child) => {
    if (child.type === LayoutWrapperMain) {
      // LayoutWrapperMain needs different rootClassName
      const childWithAddedCSS = React.cloneElement(child, {
        rootClassName: scss.layoutWrapperMain,
      });
      childrenMap.layoutWrapperMain = childWithAddedCSS;
    } else {
      throw new Error(
        `LayoutSingleColumn has an unknown child.
       Only LayoutWrapperTopbar, LayoutWrapperMain, LayoutWrapperFooter are allowed.`,
      );
    }
  });
  return childrenMap;
};

const LayoutSingleColumn = (props: any) => {
  const { className, rootClassName, children } = props;
  const preparedChildren = prepareChildren(children);
  const classes = classNames(rootClassName || scss.root, className);
  const maybeFooter = preparedChildren.layoutWrapperFooter || null;

  return (
    <>
      {preparedChildren.layoutWrapperTopbar}
      <div className={classes} role="main">
        {preparedChildren.layoutWrapperMain}
      </div>
      {maybeFooter}
    </>
  );
};

LayoutSingleColumn.defaultProps = {
  className: null,
  rootClassName: null,
};

const { node, string } = PropTypes;

LayoutSingleColumn.propTypes = {
  children: node.isRequired,
  className: string,
  rootClassName: string,
};

export default LayoutSingleColumn;
