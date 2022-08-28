/* eslint-disable react/destructuring-assignment */
import React, { useEffect } from 'react';
import classNames from 'classnames';
import IconClose from 'components/IconClose';

import scss from './Modal.module.scss';

const KEY_CODE_ESCAPE = 27;

interface Props {
  children?: React.ReactNode,
  className?: string,
  scrollLayerClassName?: string,
  containerClassName?: string,
  contentClassName?: string,
  lightCloseButton?: boolean,
  closeButtonClassName?: string
  id: string,
  isClosedClassName?: string,
  isOpen?: boolean,
  onClose?: any,
  onManageDisableScrolling: any
  showCloseBtn?: boolean
}

const ModalComponent: React.FC<Props> = (props: Props) => {
  const {
    children,
    className,
    id,
    scrollLayerClassName,
    closeButtonClassName,
    containerClassName,
    contentClassName,
    lightCloseButton,
    isClosedClassName,
    onManageDisableScrolling,
    onClose,
    isOpen,
    showCloseBtn,
  } = props;

  const handleClose = (event: any) => {
    onManageDisableScrolling(id, false);
    onClose(event);
  };

  const handleBodyKeyUp = (event: any) => {
    if (event.keyCode === KEY_CODE_ESCAPE && isOpen) {
      handleClose(event);
    }
  };

  useEffect(() => {
    onManageDisableScrolling(id, isOpen);
    document.body.addEventListener('keyup', handleBodyKeyUp);
    return () => {
      document.body.removeEventListener('keyup', handleBodyKeyUp);
    };
  }, []);

  useEffect(() => {
    onManageDisableScrolling(props.id, props.isOpen);
    return () => {
      onManageDisableScrolling(props.id, false);
    };
  }, [props.isOpen]);

  useEffect(() => {
    if (isOpen === true && document.body) {
      document.body.classList?.add('hide_scroll');
    } else if (!isOpen && document.body) {
      document.body.classList?.remove('hide_scroll');
    }
  }, [isOpen]);

  const closeModalMessage = 'close';
  const closeButtonClasses = classNames("cross", closeButtonClassName, scss.close, {
    [scss.closeLight]: lightCloseButton,
  });
  const closeBtn = isOpen && showCloseBtn ? (
    <button
      onClick={handleClose}
      title={closeModalMessage}
      className={closeButtonClasses}
      aria-label="Close"
    >
      {/* <span className={scss.closeText}>
        {closeButtonMessage || <FormattedMessage id="Modal.close" />}
      </span> */}
      <IconClose rootClassName={scss.closeIcon} />
    </button>
  ) : null;

  const modalClass = isOpen ? scss.isOpen : isClosedClassName;
  const classes = classNames(modalClass, className);
  const scrollLayerClasses = scrollLayerClassName || scss.scrollLayer;
  const containerClasses = classNames(scss.container, containerClassName);

  return (
    <div className={`isOpen ${classes}`}>
      <div className={scrollLayerClasses}>
        <div className={`${containerClasses} zoom_container`}>
          {closeBtn}
          <div className={classNames(scss.content, contentClassName)}>{children}</div>
        </div>
      </div>
    </div>
  );
};

ModalComponent.defaultProps = {
  children: null,
  className: '',
  scrollLayerClassName: '',
  containerClassName: '',
  contentClassName: '',
  closeButtonClassName: undefined,
  lightCloseButton: false,
  isClosedClassName: scss.isClosed,
  isOpen: false,
  onClose: null,
  showCloseBtn: true,
};

export default ModalComponent;
