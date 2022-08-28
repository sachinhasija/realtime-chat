import React, { useEffect, useRef, useState } from 'react';
import { NewChatData, User } from 'interfaces/firestore';
import { formatTime } from 'utils/common.js';
// import Image from 'components/Image';

import placeholderImage from 'assets/images/ic-avatar-placeholder.svg';
import moment from 'moment';
import scss from './Chat.module.scss';

interface UserHeaderInfo {
  chatInfo: NewChatData
  handleGroupInfoToggle: () => void
  handleContactToggle: () => void
  chatData: { [userId: string]: User } | null
}

export default function MessagesHeader(props: UserHeaderInfo) {
  const {
    chatInfo, chatData, handleContactToggle, handleGroupInfoToggle,
  } = props;
  const [online, setOnline] = useState(false);
  const chatId = chatInfo?.chatId;
  const lastSeen = chatData?.[chatId]?.lastSeen ? Number(chatData?.[chatId]?.lastSeen) : null;
  const lastSeenFormatted = lastSeen ? formatTime(Number(chatData?.[chatId]?.lastSeen)) : null;
  const roomId = chatInfo?.roomId;
  const isGroup = roomId?.split('_')?.length === 1;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showOnline = chatData?.[chatId]?.showOnline;

  useEffect(() => {
    if (lastSeen) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      const currentDate = moment(new Date());
      const lastSeenDate = moment(lastSeen);
      const onlineTime = currentDate.diff(lastSeenDate, 'seconds') <= 60;
      if (onlineTime) {
        setOnline(true);
      }
      timeoutRef.current = setTimeout(() => {
        setOnline(false);
      }, 62000);
    }
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [lastSeen]);

  return (
    <div className="f_row">
      <div className={scss.msg_header}>
        <div className={scss.chat_user}>
          <button type="button" aria-label={`Click to view contact info of ${chatInfo.name}`} onClick={() => (isGroup ? handleGroupInfoToggle() : handleContactToggle())} className={scss.u_img}>
            <img src={chatData?.[chatId]?.image || placeholderImage} alt={`${chatInfo.name} avatar`} className={!chatData?.[chatId]?.image ? 'invert placeholder_img' : ''} />
          </button>
          <div className={scss.details}>
            {chatInfo.name !== '' ? (
              <span className={scss.name}>{chatInfo.name}</span>
            ) : null}
            {showOnline
              ? chatInfo.isOnline && online ? (
                <span className={`${scss.status} ${scss.online}`}>
                  Online
                </span>
              ) : lastSeenFormatted ? (
                <span className={scss.status}>{lastSeenFormatted}</span>
              ) : null
              : null}
          </div>
        </div>
      </div>
    </div>
  );
}
