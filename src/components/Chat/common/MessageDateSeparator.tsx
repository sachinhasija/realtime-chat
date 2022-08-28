import React from 'react';
import { formatDate } from 'utils/common.js';

import scss from '../Chat.module.scss';

interface Props {
  timestamp: string
}

const MessageDateSeparator = (props: Props) => {
  const { timestamp } = props;
  const formattedDate = formatDate(Number(timestamp));

  return (
    <>
      <div className={scss.horizontal_break}>
        <span>{formattedDate}</span>
      </div>
    </>
  );
};

export default React.memo(MessageDateSeparator);
