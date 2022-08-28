import React, { useEffect, useRef, useState } from 'react';
import {
  Room, NewChatData, User,
} from 'interfaces/firestore';
import Image from 'components/Image';
import chatMute from 'assets/images/chat-mute.svg';
import placeholderImage from 'assets/images/ic_avatar_placeholder.svg';
import deleteMsg from 'assets/images/deleted-message.svg';
import { Menu, MenuItem, Button } from '@mui/material';
import classNames from 'classnames';
import moment from 'moment';
import scss from '../Chat.module.scss';

interface Props {
  // chatData: {name: string, img: string}
  chatData: User
  roomData: Room
  selected: boolean
  currentUserId: string
  handleModalTypeChange: (type: string, data: { chatRoomId: string, chatId: string }) => void
  handleDeletedRoomId: (roomId: string) => void
  handleNewChat: (data: NewChatData | null) => null
}

const InboxCard = ({
  roomData, selected, currentUserId, chatData, handleNewChat, handleDeletedRoomId, handleModalTypeChange,
}: Props) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [online, setOnline] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const open = Boolean(anchorEl);

  const handleClick = (e: any) => {
    setAnchorEl(e.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const lastSeen = chatData?.lastSeen ? Number(chatData?.lastSeen) : null;
  const unreadCount = roomData?.chatRoomMembers?.[currentUserId]?.unreadCount;
  const isMuted = roomData?.chatRoomMembers?.[currentUserId]?.muted;
  const deletedTime = roomData?.chatRoomMembers?.[currentUserId]?.memberDelete ? Number(roomData?.chatRoomMembers?.[currentUserId]?.memberDelete) : '';
  const isOwn = roomData?.lastMessage?.senderId === currentUserId;
  const lastMessage = roomData?.lastMessage;
  //   const isDeleted = ((lastMessage?.deletedFor === 'me' && isOwn) || lastMessage?.deletedFor === 'all');
  const isGroup = roomData?.chatRoomType === 'group';
  const isText = lastMessage?.type === 'text';
  const isDeleted = lastMessage?.deleteFor?.[currentUserId] || lastMessage?.deleteFor?.all;
  const timestamp = Number(lastMessage?.timestamp);
  const messageClasses = classNames(classNames(scss.message, scss.msg_ellipsis, {
    [scss.received]: !isOwn || isDeleted,
    [scss[lastMessage?.status ?? '']]: lastMessage?.status && isOwn && isText && !isDeleted,
    [scss.video]: lastMessage?.type === 'video',
    [scss.image]: lastMessage?.type === 'image',
    [scss.no_padding]: lastMessage?.type === 'header',
  }));

  const messageText = lastMessage?.type === 'text' || lastMessage?.type === 'header' ? lastMessage?.text : lastMessage?.type === 'video' ? 'Video' : lastMessage?.type === 'image' ? 'Image' : '';
  const shouldNotShowMessage = deletedTime && timestamp ? deletedTime > timestamp : false;
  const formmattedTime = lastMessage?.timestamp ? moment(Number(lastMessage.timestamp))?.local().format('hh:mm A') : null;

  const startNewChat = () => {
    const newChatData: NewChatData = {
      name: chatData.name,
      chatId: chatData.id,
    };
    if (roomData?.chatRoomId) {
      newChatData.roomId = roomData.chatRoomId;
    }
    if (!isGroup && chatData?.showOnline) {
      newChatData.isOnline = chatData?.isOnline;
    }
    handleNewChat(newChatData);
    return null;
  };

  const notGroup = roomData?.chatRoomId && roomData?.chatRoomId?.split('_')?.length > 1;

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
    <li className={selected ? scss.active : ''}>
      <div className={scss.chat_list_item}>
        {roomData?.chatRoomId && chatData.id && notGroup ? (
          <>
            <Button
              id={`inbox-card-${chatData.id}-menu-button`}
              aria-controls={`inbox-card-${chatData.id}-menu`}
              aria-haspopup="true"
              className={scss.chat_menu}
              aria-expanded={open ? 'true' : undefined}
              onClickCapture={handleClick}
              aria-label="More options"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="5.917" viewBox="0 0 10 5.917">
                <path d="m11.636 12.439 4.217-4.217.783.783-5 5.133-5-5.133.783-.783z" transform="translate(-6.636 -8.222)" fill="#fff" className="cls-1" />
              </svg>
            </Button>
            <Menu
              id={`inbox-card-${chatData.id}-menu`}
              anchorEl={anchorEl}
              open={open}
              disableScrollLock
              onClose={handleClose}
              MenuListProps={{
                'aria-labelledby': `inbox-card-${chatData.id}-menu-button`,
              }}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              className="basic_menu_container"
            >
              <MenuItem onClick={() => { handleModalTypeChange('deleteChat', { chatId: chatData.id, chatRoomId: roomData.chatRoomId }); handleClose(); }}>
                Delete
              </MenuItem>
            </Menu>
          </>
        ) : null}
        {formmattedTime ? (
          <span className={scss.time}>{formmattedTime}</span>
        ) : null}
        {unreadCount ? (
          <span className={scss.msg_count}>{unreadCount}</span>
        ) : null}
        {isMuted ? (
          <button type="button" className={scss.mute} aria-label="Mute chat">
            <img src={chatMute} alt="mute" />
          </button>
        ) : null}
        <figure role="presentation" className={scss.u_img} onClick={startNewChat}>
          <Image src={chatData.image ?? placeholderImage} fallbackSrc={placeholderImage} alt="u-img" className={!chatData.image ? 'invert placeholder_img' : ''} />
          {chatData?.showOnline && chatData?.isOnline && online ? (
            <span className={scss.badge_icon} />
          ) : null}
        </figure>
        <div role="presentation" className={scss.info} onClick={startNewChat}>
          <span className={`line-1 ${scss.name}`}>{chatData?.name ?? ''}</span>
          {!shouldNotShowMessage ? (
            <span className={`line-1 ${messageClasses} ${isDeleted ? scss.delete_msg : ''}`}>
              {isGroup && chatData && lastMessage?.type !== 'header' ? (
                <span className={scss.by}>
                  {`${lastMessage?.senderName}:`}
                  &nbsp;
                </span>
              ) : null}
              {isDeleted ? (
                <div className={`${scss.deleted_msg}`}>
                  <img src={deleteMsg} alt="" role="presentation" />
                  Message Deleted
                </div>
              ) : <span className={scss.span_ellipsis}>{`${messageText}`}</span>}
            </span>
          ) : null}
        </div>
      </div>
    </li>
  );
};

export default React.memo(InboxCard);
