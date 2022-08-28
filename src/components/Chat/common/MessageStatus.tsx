import React from 'react';
import moment from 'moment';
import classNames from 'classnames';

import scss from '../Chat.module.scss';

interface Props {
    status: string,
    isOwn: boolean,
    isDeleted: boolean
    timestamp: number
}

const MessageStatus = ({
  status, isOwn, isDeleted, timestamp,
}: Props) => {
  const classes = classNames(scss.msg, { [scss.sent]: status === 'sent', [scss.delivered]: status === 'delivered', [scss.read]: status === 'read' });

  const formattedTime = moment(timestamp).local().format('hh:mm A');
  return (
    <span className={scss.time}>
      {formattedTime}
      {isOwn && !isDeleted ? (
        <span className={classes} />
      ) : null}
    </span>
  );
};

export default React.memo(MessageStatus);
