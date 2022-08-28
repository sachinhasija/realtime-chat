/* eslint-disable react/no-array-index-key */
import React, { useEffect, useState } from 'react';
import { MessageData } from 'interfaces/firestore';
import classNames from 'classnames';
import { Menu, MenuItem, Button } from '@mui/material';
import CircularProgressLoader from 'components/Loaders/CircularProgress';
import MessagesModel from 'firestore/messagesModel';
import playVideo from 'assets/images/icon-feather-play.svg';
import placeholderImage from 'assets/images/ic-avatar-placeholder.svg';
import linkPlaceholder from 'assets/images/link_placeholder.svg';
import Image from 'components/Image';
import { extractUrls } from 'utils/urlHelpers';

import MessageStatus from './MessageStatus';

import scss from '../Chat.module.scss';

interface Props {
  data: MessageData
  currentUserId: string
  messageSelected: boolean
  messageSelectMode: boolean
  isLastIndex: boolean
  currentUserName: string
  handleToastMessage: (message: string) => void
  handleMessageForward: (selectedMessageData: MessageData) => null
  handleReplyMessageSelection: (data: MessageData | null) => void
  setIsLastIndex: () => void
  handleModalTypeChange: (type: string, selectedMessageData: MessageData) => null
  handleMediaModalTypeChange: (type: string, mediaUrl: string | undefined, data: { name: string, time: string }, thumbnail?: string) => void
}

const Message = ({
  data, currentUserName, currentUserId, messageSelectMode, messageSelected, handleModalTypeChange, isLastIndex, setIsLastIndex, handleMediaModalTypeChange, handleMessageForward, handleReplyMessageSelection, handleToastMessage,
}: Props) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLButtonElement>(null);
  const isOwn = data.senderId === currentUserId;
  const classes = classNames({ [scss.message]: data.type !== 'header', [scss.receive_msg]: !isOwn, [scss.select]: messageSelected });
  const [localUrl, setLocalUrl] = useState('');
  const [linkPresent, setLinkPreset] = useState('');

  const isGroup = data?.messageRoomId?.split('_')?.length === 1;
  const open = Boolean(anchorEl);
  const messageOptionClasses = classNames('actions', scss.msg_hover, { [scss.msg_menu_open]: open });

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(e.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleOptionClick = (type: string) => {
    if (data?.messageRoomId && data.messageId) {
      if (isLastIndex) {
        setIsLastIndex();
      }
      handleModalTypeChange(type, data);
      handleClose();
    } else {
      handleToastMessage('Room id or message Id not found!!');
    }
  };

  useEffect(() => {
    let mounted = true;

    const checkAndLoadImage = (localMediaUrl: string) => {
      if (localMediaUrl) {
        fetch(localMediaUrl)
          .then(() => {
            if (mounted) {
              setLocalUrl(localMediaUrl);
            }
          })
          .catch(() => {
            const messageModelObject = new MessagesModel();
            if (data.messageRoomId && data.messageId) {
              messageModelObject.deleteMessage(data.messageRoomId, data.messageId);
            }
          });
      }
    };
    if ((data.type === 'image' || data.type === 'video') && !data.mediaUrl && data.localMedia && isOwn) {
      checkAndLoadImage(data.localMedia);
    }

    if (data.type === 'text' && data.text) {
      const urls = extractUrls(data.text);
      if (urls && urls?.length > 0 && typeof urls[0] === 'string') {
        setLinkPreset(urls[0]);
      }
    }
    return () => {
      mounted = false;
    };
  }, [data, isOwn]);

  const isLocalMedia = !!((data.type === 'image' || data.type === 'video') && !data.mediaUrl && data.localMedia);
  const messageRepliedTo: MessageData | null = data.replyingTo ? JSON.parse(data.replyingTo) : null;
  const repliedToMyself = messageRepliedTo && messageRepliedTo.senderId === currentUserId;

  const showTime = !isLocalMedia && ((data.type === 'text' && data.text) || ((data.type === 'image' || data.type === 'video') && data.mediaUrl) || data.deleteFor?.all);
  const highlightText = (text: string, keys: string) => {
    const split = text.split(' ');

    return keys ? (
      <span>
        {split.map((word: string, index: number) => (keys.includes(word) ? currentUserName && word === currentUserName ? ' you' : <strong key={`${index}-${word}`}>{` ${word}`}</strong> : ` ${word}`))}
      </span>
    ) : (
      <span>{text}</span>
    );
  };

  return !data.deleteFor?.[currentUserId] ? (
    <div className={classes}>
      {(((data.type === 'text' || data.type === 'header') && data.text) || ((data.type === 'image' || data.type === 'video') && data.mediaUrl)) && !data.deleteFor?.all ? (
        <div
          role="presentation"
          className={`${scss.msg_txt} ${data.type === 'image' || data.type === 'video' ? scss.msg_media : ''}`}
          onClick={() => {
            if (!messageSelectMode) {
              return;
            }
            handleMessageForward(data);
          }}
        >
          {data.replyingTo && messageRepliedTo && messageRepliedTo?.senderName ? (
            <div className={scss.replied_msg}>
              <span className={scss.c_label}>
                Replied to
                {' '}
                {repliedToMyself ? 'You' : messageRepliedTo.senderName}
              </span>
              {messageRepliedTo.type === 'image' ? (
                <Image src={messageRepliedTo.mediaUrl || ''} fallbackSrc={placeholderImage} alt="message being replied to" />
              ) : messageRepliedTo.type === 'text' ? (
                <span className={scss.replytxt}>{messageRepliedTo.text}</span>
              ) : messageRepliedTo.type === 'video' ? (
                <Image src={messageRepliedTo.thumbnail || ''} fallbackSrc={placeholderImage} alt="message being replied to" />
              ) : null}
            </div>
          ) : null}
          {data.forwarded ? (
            <span className={scss.c_label}>
              Forwarded
            </span>
          ) : null}
          {!isOwn && isGroup && data?.senderName && data.type !== 'header' ? (
            <span className={scss.sender_name}>
              {data.senderName}
            </span>
          ) : null}
          {data.type === 'text' ? (data.thumbnail || linkPresent) ? (
            <div className={scss.message_imgbox}>
              <figure className={classNames(scss.message_img_wrap, scss.link_message)}>
                <div className={scss.link_wrap}>
                  <a href={linkPresent} target="_blank" rel="noreferrer">
                    <Image src={data.thumbnail ? data.thumbnail : linkPlaceholder} fallbackSrc={linkPlaceholder} className={scss.img_message} alt={`link to ${linkPresent}`} />
                    {data.text}
                  </a>
                </div>
              </figure>
            </div>
          ) : data.text : data.type === 'image' ? (
            <button type="button" aria-label="Click to view this image" onClick={() => handleMediaModalTypeChange('image', data.mediaUrl, { name: data.senderName ?? '', time: data.timestamp ?? '' })} className={scss.message_imgbox}>
              <figure className={scss.message_img_wrap}>
                <img src={data.mediaUrl} className={scss.img_message} alt="" />
              </figure>
            </button>
          ) : data.type === 'video' ? (
            <button type="button" aria-label="Click to view this video" onClick={() => handleMediaModalTypeChange('video', data.mediaUrl, { name: data.senderName ?? '', time: data.timestamp ?? '' }, data.thumbnail ?? '')} className={scss.message_imgbox}>
              <figure className={classNames(scss.message_img_wrap, scss.gif)}>
                <img src={data.thumbnail ?? placeholderImage} className={scss.img_message} alt="" />
                <div className={scss.gif_wrap}>
                  <img src={playVideo} className={scss.playVideo} alt="" role="presentation" />
                </div>
              </figure>
            </button>
          ) : data.type === 'header' ? (
            <div className={scss.horizontal_break}>
              {highlightText(data?.text ?? '', data?.highlightedKeys ?? '')}
            </div>
          ) : null}
          {!messageSelectMode ? (
            <ul className={messageOptionClasses}>
              <li>
                <button
                  type="button"
                  onClick={() => handleReplyMessageSelection(data)}
                  aria-label="Reply"
                >
                  <span className="reply invert" />
                </button>
              </li>
              <li>
                <Button
                  id={`message-more-button-${data.messageId}`}
                  aria-controls={`message-more-menu-${data.messageId}`}
                  aria-haspopup="true"
                  aria-expanded={open ? 'true' : undefined}
                  onClick={handleClick}
                  aria-label="More options"
                >
                  <span className="more invert" />
                </Button>
                <Menu
                  id={`message-more-menu-${data.messageId}`}
                  anchorEl={anchorEl}
                  open={open}
                  onClose={handleClose}
                  disableScrollLock
                  MenuListProps={{
                    'aria-labelledby': `message-more-button-${data.messageId}`,
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
                  <MenuItem onClick={() => {
                    handleClose();
                    handleMessageForward(data);
                  }}
                  >
                    Forward
                  </MenuItem>
                  <MenuItem onClick={() => handleOptionClick(isOwn ? 'messageDelete' : 'messageDeleteForOtherUser')}>
                    Delete
                  </MenuItem>
                </Menu>
              </li>
            </ul>
          ) : null}
        </div>
      ) : data.deleteFor?.all
        ? (
          <div className={`deleted ${scss.msg_txt} ${scss.deleted}`}>
            This message was deleted
          </div>
        ) : data.localMedia && !data.mediaUrl && isOwn && localUrl ? (
          <div className={scss.message_imgbox}>
            <figure className={classNames(scss.message_img_wrap, scss.loading)}>
              <img src={localUrl} className={scss.img_message} alt="" />
              <div className={scss.loader_wrap}>
                <CircularProgressLoader />
              </div>
            </figure>
          </div>
          //   <div className={scss.message_imgbox}>
          //   <figure className={classNames(scss.message_img_wrap, scss.gif)}>
          //     <img src={dummyImg} className={scss.img_message} alt="" />
          //     <div className={scss.gif_wrap}>
          //       <span><FormattedMessage id="Common.gif" /></span>
          //     </div>
          //   </figure>
          // </div>
        ) : null}
      {data?.timestamp && showTime ? (
        <MessageStatus status={data.status ?? ''} isOwn={isOwn} isDeleted={data.deleteFor?.all || false} timestamp={Number(data.timestamp)} />
      ) : null}
    </div>
  ) : null;
};

export default React.memo(Message);
