import React, { useEffect, useRef, useState } from 'react';
import {
  NewChatData, MessageData, UpdateRoom,
} from 'interfaces/firestore';
import cross from 'assets/images/chat-cross.svg';
import back from 'assets/images/ic-back.svg';
import videoPlay from 'assets/images/chat-video.png';
import classNames from 'classnames';
import channelImage from 'assets/images/image-placeholder.svg';
import ModalComponent from 'components/Modal';
import placeholderImage from 'assets/images/ic-avatar-placeholder.svg';
import MessagesModel from 'firestore/messagesModel';
import Image from 'components/Image';
import BlockModel from 'firestore/blockModel';
import InboxModel from 'firestore/inboxModel';
import RoomModel from 'firestore/roomModel';
import { Unsubscribe } from 'firebase/firestore';
import MediaViewer from './MediaViewer';
import scss from './UserProfile.module.scss';

interface Props {
  chatInfo: NewChatData
  currentUserId: string
  handleNewChat: (data: null) => null
  handleDeletedRoomId: (roomId: string) => void
  blockedData: null | { isBlocked?: boolean; timestamp: string; }
  handleMediaOpen: (value: boolean) => void
  handleContactToggle: () => void
}

const reasons = {
  1: 'Fake Account', 2: 'Pornography & Nudity', 3: 'Bullying or Harassment', 4: 'Scam or Fraudulent activity', 5: 'False & Misleading information', 6: 'Hate Speech', 7: 'Promoting dangerous organizations & individuals', 8: 'Intelectual property infringement', 9: 'Suicide or self harm', 10: 'Sale of illegal or regulated goods & services', 11: 'Violent and graphic content', 12: 'Animal cruelty', 13: 'Other',
};

const profileReasons = [
  { value: '1', label: 'Fake Account' },
  { value: '2', label: 'Pornography & Nudity' },
  { value: '3', label: 'Bullying or Harassment' },
  { value: '4', label: 'Scam or Fraudulent activity' },
  { value: '5', label: 'False & Misleading information' },
  { value: '6', label: 'Hate Speech' },
  { value: '7', label: 'Promoting dangerous organizations & individuals' },
  { value: '8', label: 'Intelectual property infringement' },
  { value: '9', label: 'Suicide or self harm' },
  { value: '10', label: 'Sale of illegal or regulated goods & services' },
  { value: '11', label: 'Violent and graphic content' },
  { value: '12', label: 'Animal cruelty' },
  { value: '13', label: 'Other' },
];

const UserProfile = ({
  chatInfo, currentUserId, blockedData, handleNewChat, handleContactToggle, handleMediaOpen, handleDeletedRoomId,
}: Props) => {
  const [media, setMedia] = useState<Map<string, MessageData> | null>(null);
  const [expandMedia, setExpandMedia] = useState(false);
  const [switchEnabled, setSwitchEnabled] = useState(false);
  const [selectedMediaId, setSelectedMediaId] = useState('');
  const unblockRefId = useRef<string | undefined>();
  const mediaUnsubscribeEvent = useRef<Unsubscribe | null>(null);

  // modal
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<null | string>(null);

  const handleChatDelete = (roomId: string, userId: string) => {
    if (currentUserId && currentUserId !== userId) {
      const inboxModelObject = new InboxModel();
      inboxModelObject.deleteUserFromInbox(currentUserId, userId).catch(() => {
        // to be handled
      });
      const roomModelObject = new RoomModel();
      const updatedRoomData: UpdateRoom = {
        chatRoomMembers: {
          [currentUserId]: {
            memberDelete: `${+new Date()}`,
          },
        },
      };
      roomModelObject.updateRoom(roomId, updatedRoomData);
      handleDeletedRoomId(roomId);
      handleNewChat(null);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setModalType(null);
    handleMediaOpen(false);
    return null;
  };

  const handleSwitchToggle = () => {
    setSwitchEnabled((prevState) => !prevState);
  };

  const handleMediaExpand = (value: boolean) => {
    setExpandMedia(value);
  };

  const handleMediaView = (messageId: string) => {
    setSelectedMediaId(messageId);
    setModalType('media');
    handleMediaOpen(true);
    setShowModal(true);
  };

  const handleUserBlock = (chatId: string) => {
    if (chatId) {
      const BlockModalObj = new BlockModel();
      const data = {
        isBlocked: true,
        timestamp: `${+new Date()}`,
      };
      BlockModalObj.addBlockedUser(currentUserId, chatId, data);
      setModalType('blockSuccess');
    }
  };

  const handleUserUnblock = (userId: string) => {
    const BlockModalObj = new BlockModel();
    BlockModalObj.removeBlockedUser(currentUserId, userId);
  };

  const modalContent = () => {
    const selectedIndex = media ? Array.from(media).findIndex((msgData: [string, MessageData]) => msgData?.[1]?.messageId === selectedMediaId) : -1;

    if (modalType === 'media' && media && selectedIndex !== -1 && typeof selectedIndex !== 'undefined') {
      return (
        <MediaViewer selectedIndex={selectedIndex} data={media ? Array.from(media) : []} />
      );
    }
    if (modalType === 'block') {
      return (
        <>
          <div className="success_popup">
            <span className="sub_title">
              Block User
            </span>
            <p className="common_para">
              Are you sure you want to block
              <br />
              <span className="capitalize">
                {chatInfo?.name ?? ''}
              </span>
              ?
            </p>
            <div className="action_btns_wrapper">
              <div className="btn_wrap">
                <button type="button" className="fill_red_btn btn-effect btn block" onClick={() => handleUserBlock(chatInfo.chatId)}>Block</button>
              </div>
              <div className="btn_wrap">
                <button type="button" className="outline_btn btn-effect btn block" onClick={handleModalClose}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      );
    } if (modalType === 'blockSuccess') {
      return (
        <>
          <div className="success_popup">
            <span className="sub_title">
              User Blocked
            </span>
            <p className="common_para">
              This user has been blocked
            </p>
            <button type="button" className="fill_red_btn btn-effect only_child" onClick={handleModalClose}>
              Ok
            </button>
          </div>
        </>
      );
    }
    return null;
  };

  useEffect(() => () => {
    if (mediaUnsubscribeEvent.current) {
      mediaUnsubscribeEvent.current();
    }
  }, []);

  useEffect(() => {
    const unsubscribe: Unsubscribe | null = mediaUnsubscribeEvent.current;
    let mounted = true;

    const updateMediaData = (data: Map<string, MessageData>) => {
      if (data && mounted) {
        setMedia(data);
      }
      return null;
    };
    if (chatInfo?.roomId && currentUserId) {
      if (unsubscribe) {
        unsubscribe();
      }
      const MessagesModelObject = new MessagesModel();
      mediaUnsubscribeEvent.current = MessagesModelObject.addMediaMessagesListener(chatInfo.roomId, updateMediaData, currentUserId);
    }
    return () => {
      mounted = false;
    };
  }, [chatInfo, currentUserId]);

  return (
    <div className={`sidenav ${scss.contact_nav}  ${expandMedia ? scss.media_nav : ''}`}>
      {expandMedia && media ? (
        <>
          <div className={scss.close_btn_wrapper}>
            <button type="button" onClick={() => handleMediaExpand(false)} className={scss.cross} aria-label="Back">
              <img src={back} alt="media screen back btn" className="invert" role="presentation" />
            </button>
            <span className={`xs_title ${scss.contact_head}`}>Media</span>
          </div>
          <div className={`inner ${scss.contact_info}`}>
            <div className={scss.media_wrap}>
              <div className={classNames(scss.media_row, { [scss.show_all]: expandMedia })}>
                {Array.from(media).map((msgData: [string, MessageData]) => (
                  <div className={scss.media_col} key={msgData[1].messageId}>
                    {(msgData[1].type === 'image' || msgData[1].type === 'video') && msgData[1].mediaUrl ? (
                      <button
                        type="button"
                        className={classNames(scss.media_cover, msgData[1].type === 'video' ? scss.video : '')}
                        onClick={() => {
                          if (msgData[1].messageId) {
                            handleMediaView(msgData[1].messageId);
                          }
                        }}
                      >
                        <Image
                          src={msgData[1].type === 'image' ? msgData[1].mediaUrl : msgData[1].type === 'video' && msgData[1].thumbnail ? msgData[1].thumbnail : ''}
                          fallbackSrc={channelImage}
                          alt={`from user ${chatInfo.name}`}
                        />
                        {msgData[1].type === 'video' ? (
                          <span className={scss.play_video_btn} aria-label="Play Video">
                            <img src={videoPlay} alt="" role="presentation" />
                          </span>
                        ) : null}
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className={scss.close_btn_wrapper}>
            <button type="button" onClick={handleContactToggle} className={scss.cross}>
              <img src={cross} className="invert" alt="cross" />
            </button>
            <span className={`xs_title ${scss.contact_head}`}>
              Contact Info
            </span>
          </div>
          <div className={`inner ${scss.contact_info}`}>
            <div className="text-center">
              <figure className={scss.u_img}>
                <img src={placeholderImage} alt="u-img" className="invert placeholder_img" />
              </figure>
              <span className={`xs_title ${scss.name}`}>{chatInfo.name}</span>
            </div>
            {media && media?.size > 0 ? (
              <div className={scss.media_wrap}>
                <div className={scss.media_header}>
                  <h3>
                    Media
                  </h3>
                  {media.size > 4 ? (
                    <button type="button" className={`link ${scss.view_all}`} onClick={() => handleMediaExpand(true)}>
                      View All
                      <i className={scss.icon}>&nbsp;</i>
                    </button>
                  ) : null}
                </div>
                <div className={classNames(scss.media_row)}>
                  {Array.from(media).map((msgData: [string, MessageData]) => (
                    <div className={scss.media_col} key={msgData[1].messageId}>
                      {(msgData[1].type === 'image' || msgData[1].type === 'video') && msgData[1].mediaUrl ? (
                        <button
                          type="button"
                          className={classNames(scss.media_cover, msgData[1].type === 'video' ? scss.video : '')}
                          onClick={() => {
                            if (msgData[1].messageId) {
                              handleMediaView(msgData[1].messageId);
                            }
                          }}
                        >
                          <Image
                            src={msgData[1].type === 'image' ? msgData[1].mediaUrl : msgData[1].type === 'video' && msgData[1].thumbnail ? msgData[1].thumbnail : ''}
                            fallbackSrc={channelImage}
                            alt={`from user ${chatInfo.name}`}
                          />
                          {msgData[1].type === 'video' ? (
                            <span className={scss.play_video_btn} aria-label="Play Video">
                              <img src={videoPlay} alt="" role="presentation" />
                            </span>
                          ) : null}
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <ul className={`listing ${scss.list_chat_options} ${media && media?.size === 0 ? scss.margin_top : ''}`}>
              {/* <li>
            <button type="button" className="button">Mute</button>
          </li> */}
              {chatInfo.chatId && chatInfo.roomId ? (
                <li>
                  {(blockedData?.timestamp || blockedData?.isBlocked) ? (
                    <button
                      type="button"
                      className="button"
                      onClick={() => handleUserUnblock(chatInfo.chatId)}
                    >
                      Unblock
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="button"
                      onClick={() => {
                        setModalType('block');
                        setShowModal(true);
                      }}
                    >
                      Block
                    </button>
                  )}
                  {' '}

                </li>
              ) : null}
              {chatInfo.chatId && chatInfo.roomId ? (
                <li>
                  <button type="button" className="button" onClick={() => handleChatDelete(chatInfo.roomId ?? '', chatInfo.chatId)}>
                    Delete Chat
                  </button>
                </li>
              ) : null}
            </ul>
          </div>
        </>
      )}

      <ModalComponent
        id="user-profile-main-modal"
        isOpen={showModal}
        className={modalType === 'media' ? 'chat_media_modal' : ''}
        onClose={handleModalClose}
        onManageDisableScrolling={() => null}
        showCloseBtn={!(modalType === 'block' || modalType === 'blockSuccess')}
      >
        <div className="chat_media_inner">
          {modalContent()}
        </div>
      </ModalComponent>
    </div>
  );
};

export default UserProfile;
