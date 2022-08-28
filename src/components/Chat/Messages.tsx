import React, {
  useState, useEffect, useRef,
} from 'react';
import { MessageData } from 'interfaces/firestore';
import ModalComponent from 'components/Modal/index';
import Image from 'components/Image';

import { formatDate } from 'utils/common.js';
import moment from 'moment';
import Message from './common/Message';
import MessageDateSeparator from './common/MessageDateSeparator';
import NoMessages from './common/NoMessages';
import scss from './Chat.module.scss';

interface Props {
  dataPresent: boolean
  messageData: Map<string, MessageData> | null
  currentUserInfo: { id: string, name: string },
  roomId: string | undefined,
  selectedMessages: null | { [messageId: string]: MessageData },
  hasMoreMessages: boolean
  setIsLastIndex: () => void
  handleReplyMessageSelection: (data: MessageData | null) => void
  handleToastMessage: (message: string) => void
  loadMoreMessages: () => null,
  handleMessageForward: (selectedMessageData: MessageData) => null
  handleModalTypeChange: (type: string, selectedMessageData: MessageData) => null
}

const Messages = (props: Props) => {
  const {
    dataPresent, messageData, currentUserInfo, setIsLastIndex, loadMoreMessages, hasMoreMessages, selectedMessages, handleModalTypeChange, handleMessageForward, handleReplyMessageSelection, roomId, handleToastMessage,
  } = props;
  const [data, setData] = useState<null | [string, MessageData][]>(null);
  const shouldAutoScrollRef = useRef(true);
  const hasMoreMessagesRef = useRef(false);
  const dataRef = useRef<null | [string, MessageData][]>(null);
  const scrollTopRef = useRef(0);
  const messagesListRef = useRef<HTMLDivElement>(null);
  const mediaDataRef = useRef<null | { name: string, time: string }>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<null | string>(null);
  const [currentMediaSelected, setCurrentMediaSelected] = useState('');
  const [videoThumbnail, setVideoThumbnail] = useState('');

  const handleModalClose = () => {
    setShowModal(false);
    setModalType(null);
    mediaDataRef.current = null;
  };

  const handleMediaModalTypeChange = (type: string, mediaUrl: string | undefined, mediaData: { name: string, time: string }, thumbnail?: string) => {
    if (mediaUrl && mediaData) {
      setCurrentMediaSelected(mediaUrl);
      setModalType(type);
      setShowModal(true);
      mediaDataRef.current = mediaData;
      if (thumbnail) {
        setVideoThumbnail(thumbnail);
      }
    }
  };

  let oldDate: null | string = null;
  const currentUserId = currentUserInfo.id;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop + Math.max(e.currentTarget.clientHeight, e.currentTarget.offsetHeight) === e.currentTarget.scrollHeight) {
      shouldAutoScrollRef.current = true;
    }
    if (scrollTopRef.current > e.currentTarget.scrollTop) {
      shouldAutoScrollRef.current = false;
      const scrolledPercentage = (e.currentTarget.scrollTop / e.currentTarget.scrollHeight) * 100;
      if (scrolledPercentage < 5 && hasMoreMessagesRef.current) {
        hasMoreMessagesRef.current = false;
        loadMoreMessages();
      }
    }
    scrollTopRef.current = e.currentTarget.scrollTop;
  };

  useEffect(() => {
    if (roomId) {
      shouldAutoScrollRef.current = true;
    }
  }, [roomId]);

  useEffect(() => {
    const dataReference = dataRef.current;
    if (messageData && messageData.size > 0) {
      setData(Array.from(messageData));
      dataRef.current = Array.from(messageData);
    } else if (messageData === null) {
      setData(null);
    }
    return () => {
      if (dataReference) {
        setData(null);
      }
    };
  }, [messageData]);

  useEffect(() => {
    if (hasMoreMessages) {
      hasMoreMessagesRef.current = true;
    }
  }, [hasMoreMessages]);

  useEffect(() => {
    const scrollToLastMessage = () => {
      const lastMessageChild = messagesListRef.current?.lastElementChild;
      lastMessageChild?.scrollIntoView({
        block: 'end',
      });
    };

    if (Array.isArray(data) && data.length > 0 && shouldAutoScrollRef.current) {
      scrollToLastMessage();
    }
  }, [data]);

  const formatMediaTime = (timestamp: number) => {
    try {
      return `${formatDate(timestamp)}, ${moment(timestamp)?.local().format('hh:mm A')}`;
    } catch (err) {
      //
    }
    return null;
  };

  const modalContent = () => {
    if (modalType === 'image') {
      return (
        <div className="media_detail_wrap">
          <div className="user_detail_wrap">
            {mediaDataRef.current?.name ? <h1>{mediaDataRef.current.name}</h1> : null}
            {mediaDataRef.current?.time ? <span className="date">{formatMediaTime(Number(mediaDataRef.current.time))}</span> : null}
          </div>
          <figure className="media_content">
            <Image src={currentMediaSelected} alt="channel-img" fallbackSrc="" />
          </figure>
        </div>
      );
    } if (modalType === 'video') {
      return (
        <div className="media_detail_wrap">
          <div className="user_detail_wrap">
            {mediaDataRef.current?.name ? <h1>{mediaDataRef.current.name}</h1> : null}
            {mediaDataRef.current?.time ? <span className="date">{formatMediaTime(Number(mediaDataRef.current.time))}</span> : null}
          </div>
          <div className="media_content">
            <video
              src={currentMediaSelected}
              muted
              autoPlay
              poster={videoThumbnail ?? ''}
              controls
            />
          </div>
        </div>
      );
    }
    return null;
  };
  return Array.isArray(data) && data.length > 0 ? (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
    <div tabIndex={0} role="log" className={scss.message_wrapper} onScroll={handleScroll}>
      <div className={scss.chat} ref={messagesListRef}>
        {data.map((msgData: [string, MessageData], index: number) => {
          let currentDate = null;
          let setDateSeparator = false;
          const isLocalMedia = !!(msgData[1].type === 'image' && !msgData[1].mediaUrl && msgData[1].localMedia);

          if (msgData[1].timestamp && !isLocalMedia) {
            currentDate = new Date(Number(msgData[1].timestamp)).toLocaleDateString();
            if (currentDate !== oldDate) {
              oldDate = new Date(Number(msgData[1].timestamp)).toLocaleDateString();
              setDateSeparator = true;
            }
          }
          return (
            <React.Fragment key={msgData[1].messageId}>
              {msgData[1].timestamp && setDateSeparator && msgData[1].type !== 'header' ? (
                <MessageDateSeparator timestamp={msgData[1].timestamp} />
              ) : null}
              <Message
                data={msgData[1]}
                setIsLastIndex={setIsLastIndex}
                isLastIndex={index === (data.length - 1)}
                handleToastMessage={handleToastMessage}
                handleReplyMessageSelection={handleReplyMessageSelection}
                currentUserName={currentUserInfo?.name}
                messageSelectMode={!!(selectedMessages && Object.values(selectedMessages).length > 0)}
                messageSelected={!!(selectedMessages && msgData[1].messageId && selectedMessages[msgData[1].messageId])}
                currentUserId={currentUserId || ''}
                handleMessageForward={handleMessageForward}
                handleModalTypeChange={handleModalTypeChange}
                handleMediaModalTypeChange={handleMediaModalTypeChange}
              />
            </React.Fragment>
          );
        })}
      </div>
      <ModalComponent
        id={`${roomId}-media-enhanced-view`}
        className={modalType === 'image' || modalType === 'video' ? 'chat_media_modal' : ''}
        isOpen={showModal}
        onClose={handleModalClose}
        onManageDisableScrolling={() => null}
        lightCloseButton={false}
      >
        <div className="chat_media_inner">
          {modalContent()}
        </div>
      </ModalComponent>
    </div>
  ) : <NoMessages dataPresent={dataPresent} />;
};

export default React.memo(Messages);
