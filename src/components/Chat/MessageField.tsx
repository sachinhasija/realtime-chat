/* eslint-disable react/no-array-index-key */
/* eslint-disable jsx-a11y/label-has-associated-control */
import React, {
  useState, useRef, useEffect, useCallback,
} from 'react';
import addMedia from 'assets/images/chat_add_media.svg';
import closeMedia from 'assets/images/close-media.svg';
// import addAvatar from 'assets/images/add-avatar.svg';
// import addGift from 'assets/images/add-gift.svg';
import addPhotos from 'assets/images/add-photo.svg';
import addPhotosDark from 'assets/images/add-photo-black.svg';
// import addGif from 'assets/images/add-gif.svg';
import placeholder from 'assets/images/ic-avatar-placeholder.svg';
import send from 'assets/images/msg-send.svg';
import MessagesModel from 'firestore/messagesModel';
import { Menu, MenuItem, Button } from '@mui/material';
import ImageUpload from 'components/ImageUpload';
import {
  MessageData,
  NewChatData, Room, User,
} from 'interfaces/firestore';
import cross from 'assets/images/chat-cross.svg';
// import deleteChat from 'assets/images/chat-delete.svg';
import forward from 'assets/images/chat-forward.svg';
import classNames from 'classnames';
import GroupModel from 'firestore/groupModel';
import UserModel from 'firestore/usersModel';
import InboxModel from 'firestore/inboxModel';
import { mediaUploader } from 'utils/mediaUpload';
import Image from 'components/Image';
import { extractUrls } from 'utils/urlHelpers';
import moment from 'moment';
import BlockModel from 'firestore/blockModel';

import RoomModel from 'firestore/roomModel';
import scss from './Chat.module.scss';

interface Props {
  currentUserInfo: { id: string, name: string },
  chatInfo: NewChatData | null
  blockedData: null | { isBlocked?: boolean; timestamp: string; }
  selectedUserBlockedData: null | { isBlocked?: boolean; timestamp: string; }
  roomData: null | Room
  selectedMessagesLength: number
  chatData: { [userId: string]: User } | null
  selectedMessageForReply: MessageData | null
  handleReplyMessageSelection: (data: MessageData | null) => void
  handleToastMessage: (message: string) => void
  handleForwardCancel: () => null
  handleModalTypeChange: (type: string) => null
}

const getRoomId = (curretUserId: string, userId: string) => (curretUserId > userId ? `${userId}_${curretUserId}` : `${curretUserId}_${userId}`);

export default function MessageField({
  currentUserInfo, chatInfo, chatData, roomData, blockedData, selectedUserBlockedData, selectedMessagesLength, selectedMessageForReply, handleToastMessage, handleModalTypeChange, handleForwardCancel, handleReplyMessageSelection,
}: Props) {
  const roomId = chatInfo?.roomId ? chatInfo.roomId : currentUserInfo?.id && chatInfo?.chatId ? getRoomId(currentUserInfo.id, chatInfo.chatId) : null;
  const [showSubmitButton, setShowSubmitButton] = useState(false);
  const [documentExists, setDocumentExists] = useState(false);
  const [userExists, setUserExists] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLButtonElement>(null);
  const unblockRefId = useRef<string | undefined>();

  // image upload
  const [openFile, setOpenFile] = useState(false);
  const [openVideoFile, setOpenVideoFile] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showModalType, setShowModalType] = useState('');
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [currentFiles, setCurrentFiles] = useState<File[]>();
  const [currentImages, setCurrentImages] = useState<string[]>();
  const [fileNode, setFileNode] = useState<null | HTMLInputElement>(null);
  const [fileVideoNode, setFileVideoNode] = useState<null | HTMLInputElement>(null);
  const [isVideo, setIsVideo] = useState(false);

  const shouldNotSendMessage = !!(roomId && roomId?.split('_').length === 1 && currentUserInfo?.id && !roomData?.chatRoomMembers?.[currentUserInfo?.id]);

  const buttonRef = useRef<any>();
  const onFileRefChange = useCallback((node: null | HTMLInputElement) => {
    if (node != null) {
      setFileNode(node);
    }
  }, [fileNode]);

  const onVideoFileRefChange = useCallback((node: null | HTMLInputElement) => {
    if (node != null) {
      setFileVideoNode(node);
    }
  }, [fileVideoNode]);

  const open = Boolean(anchorEl);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(e.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const unreadCount = roomData?.chatRoomMembers?.[chatInfo?.chatId ?? '']?.unreadCount;
  const lastMessageTime = roomData && chatInfo?.chatId && typeof roomData.chatRoomMembers?.[chatInfo?.chatId]?.memberDelete !== 'undefined' ? roomData.chatRoomMembers?.[chatInfo?.chatId].memberDelete : undefined;

  const handleUserUnblock = (userId: string) => {
    unblockRefId.current = userId;
  };

  useEffect(() => {
    if (unblockRefId.current && currentUserInfo?.id) {
      const BlockModalObj = new BlockModel();
      BlockModalObj.removeBlockedUser(currentUserInfo.id, unblockRefId.current);
    }
  }, [currentUserInfo]);

  useEffect(() => {
    if (currentUserInfo?.id && chatInfo?.chatId && roomId) {
      const InboxModelObject = new InboxModel();
      const UserModelObject = new UserModel();
      const GroupModelObject = new GroupModel();
      const isGroup = roomId.split('_').length === 1;
      if (isGroup) {
        GroupModelObject.groupExists(chatInfo.chatId).then((response: boolean) => setUserExists(response));
      } else {
        UserModelObject.userExists(chatInfo.chatId).then((response: boolean) => setUserExists(response));
      }
      InboxModelObject.userExistsInInbox(currentUserInfo.id, chatInfo.chatId).then((response: boolean) => {
        if (response) {
          InboxModelObject.userExistsInInbox(chatInfo.chatId, currentUserInfo.id).then((resp: boolean) => {
            if (resp) {
              const RoomModelObject = new RoomModel();
              RoomModelObject.roomExists(roomId).then((res: boolean) => {
                setDocumentExists(res);
              });
            } else {
              setDocumentExists(false);
            }
          });
        } else {
          setDocumentExists(false);
        }
      });
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  }, [currentUserInfo?.id, chatInfo?.chatId, roomId, lastMessageTime]);

  useEffect(() => {
    if (fileNode && typeof fileNode.click === 'function' && openFile) {
      setOpenFile(false);
      fileNode.click();
    }
  }, [fileNode, openFile]);

  useEffect(() => {
    if (fileVideoNode && typeof fileVideoNode.click === 'function' && openVideoFile) {
      setOpenVideoFile(false);
      fileVideoNode.click();
    }
  }, [fileVideoNode, openVideoFile]);

  const handleOnChange = () => {
    if (!userExists) {
      return;
    }
    const value = inputRef.current?.value || '';

    if (value.trim() && !showSubmitButton) {
      setShowSubmitButton(true);
    } else if (!value.trim() && showSubmitButton) {
      setShowSubmitButton(false);
    }
  };

  const handleSendMessage = async () => {
    if (inputRef.current && userExists) {
      const { value } = inputRef.current;
      try {
        if (value.trim() && roomId) {
          const urls = extractUrls(value);
          const isGroup = roomId.split('_').length === 1;
          // const deviceTokens = chatData?.[chatInfo?.chatId ?? '']?.deviceDetails?.deviceTokens;
          const messageData = {
            deleteFor: {},
            mediaUrl: '',
            messageRoomId: roomId,
            receiverId: chatInfo?.chatId,
            replyingTo: selectedMessageForReply ? JSON.stringify(selectedMessageForReply) : '',
            senderId: currentUserInfo.id,
            senderImageURL: '',
            senderName: currentUserInfo.name,
            forwarded: false,
            status: 'sent',
            text: value,
            thumbnail: '',
            timestamp: `${+new Date()}`,
            type: 'text',
          };
          const MessagesModelObject = new MessagesModel();
          const response = await MessagesModelObject.addMessage(roomId, messageData, documentExists, unreadCount ?? 0, true, isGroup, roomData);
          handleReplyMessageSelection(null);
          if (response) {
            if (urls && urls?.length > 0) {
              // api.postApiCall('/api/v1/users/scraping', { url: urls[0] }).then((resp: { data: { data: { img: string } } }) => {
              //   if (resp?.data?.data?.img) {
              //     MessagesModelObject.updateMessage(roomId, response, { thumbnail: resp.data.data.img });
              //   }
              // })
              // .catch(() => {
              //   // err

              // });
            }
            // if (deviceTokens) {
            //   const tokens = Object.keys(deviceTokens);
            //   const data: NotificationMain = {
            //     title: currentUserInfo.name ?? 'Message Received',
            //     content: value,
            //     chatData: { ...messageData, messageId: response },
            //     devices: [],
            //   };
            //   if (currentUserInfo?.id) {
            //     data.url = `/message?user=${currentUserInfo.id}`;
            //   }
            //   tokens.forEach((token: string) => {
            //     if (token && (deviceTokens[token] === '1' || deviceTokens[token] === '2' || deviceTokens[token] === '3')) {
            //       data.devices.push({ deviceToken: token, deviceType: deviceTokens[token] });
            //     }
            //   });
            //   if (data.devices.length > 0) {
            //     sendNotification(data);
            //   }
            // }
            setDocumentExists(true);
          }
          inputRef.current.value = '';
          setShowSubmitButton(false);
        }
      } catch (err: unknown) {
        //
      }
    }
  };

  const handleSendImageMessage = async () => {
    if (currentImages && currentFiles && currentImages?.length > 0 && currentFiles?.length > 0) {
      if (roomId && chatInfo?.chatId) {
        const isGroup = roomId.split('_').length === 1;

        mediaUploader(currentFiles, {
          roomId, receiverId: chatInfo?.chatId, senderId: currentUserInfo.id, senderName: currentUserInfo.name, unreadCount: unreadCount ?? 0, documentExists,
        }, thumbnail ?? undefined, {}, isGroup, roomData);
        setShowSubmitButton(false);
        setCurrentFiles([]);
        setThumbnail(null);
        setCurrentImages([]);
      }
    }
  };

  const handleImageRemove = (index: number, all?: boolean) => {
    if (all) {
      setCurrentFiles([]);
      setThumbnail(null);
      setCurrentImages([]);
    } else {
      setCurrentImages((prevImages) => prevImages?.filter((image: string, i: number) => index !== i));
      setCurrentFiles((prevFiles) => prevFiles?.filter((file: File, i: number) => index !== i));
      setThumbnail(null);
    }
  };

  const submitButtonClasses = classNames(scss.send, { [scss.show]: showSubmitButton });

  return selectedMessagesLength > 0 ? (

    <div className={`${scss.msg_field} ${scss.selected_msg}`}>
      <div className="f_spacebw">
        <div className={scss.col}>
          <button type="button" onClick={handleForwardCancel} aria-label="Cancel message forwarding">
            <img src={cross} className="invert" alt="cancel message forward icon" />
          </button>
          <span>{`${selectedMessagesLength}/3 selected`}</span>
        </div>
        <div className={scss.col}>
          {/* <button type="button" className={scss.delete} aria-label="Delete chat">
            <img src={deleteChat} alt="delete" />
          </button> */}
          <button type="button" title="Forward" onClick={() => handleModalTypeChange('messageForward')} aria-label="Forward message">
            <img src={forward} className="invert" alt="forward" />
          </button>
        </div>
      </div>
    </div>
  ) : (blockedData?.timestamp || blockedData?.isBlocked) ? (
    <div className={scss.blocked_by_you_wrapper}>
      <div className={scss.block_inner}>
        <p>{`You blocked this contact ${blockedData.timestamp ? `on ${moment(Number(blockedData.timestamp)).format('Do MMMM YYYY')}` : ''}`}</p>
      </div>
      {chatInfo?.chatId ? (
        <button
          type="button"
          className={`fill_red_btn btn-effect ${scss.block_btn}`}
          onClick={() => handleUserUnblock(chatInfo.chatId)}
          aria-label="Unblock user"
        >
          Unblock
        </button>
      ) : null}
    </div>
  ) : (selectedUserBlockedData?.timestamp || selectedUserBlockedData?.isBlocked) ? (
    <div className={scss.blocked_by_them}>
      <p>
        You cannot reply to this conversation because this user has blocked you
      </p>
    </div>
  ) : (
    <>
      {currentFiles && currentImages && currentFiles?.length > 0 && currentImages?.length > 0 ? (
        <div className={scss.images_preview_wrapper}>
          <button type="button" className={scss.add_media} onClick={() => handleImageRemove(0, true)} aria-label="Click to close media">
            <img src={closeMedia} className="invert" alt="close" />
          </button>
          <ul className={scss.images_list}>
            {currentImages.map((imageString: string, index: number) => (
              <li className={scss.img_list_item} key={`new_image_${index}`}>
                <figure className={scss.img_wrap}>
                  <img className={scss.preview_img} src={imageString} alt="" />
                  <button type="button" onClick={() => handleImageRemove(index)} aria-label="Click to remove this image">
                    <img src={cross} className="invert" alt="" />
                  </button>
                </figure>
              </li>
            ))}
          </ul>
          <button type="submit" className={scss.send_btn} disabled={!userExists || shouldNotSendMessage} onClick={handleSendImageMessage} aria-label="Send message">
            <img src={send} className="invert" alt="send" />
          </button>
        </div>
      ) : (
        <div className={scss.msg_field}>
          <Button
            id="message-add-button"
            aria-controls="message-add-menu"
            aria-haspopup="true"
            className={scss.add_media}
            ref={buttonRef}
            aria-expanded={open ? 'true' : undefined}
            onClick={handleClick}
            aria-label="Click to add media"
          >
            <img src={addMedia} alt="add media" className="invert" />
          </Button>
          <Menu
            id="message-add-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            disableScrollLock
            MenuListProps={{
              'aria-labelledby': 'message-add-button',
            }}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
            transformOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            className={`basic_menu_container ${scss.add_media_menu}`}
          >
            <MenuItem>
              {!showTerms ? (
                <>
                  <figure className={classNames(scss.image_wrapper, scss.file_input_wrap)}>
                    <img src={addPhotos} className="dark_hover_img" alt="" />
                    <img src={addPhotosDark} className="light_hover_img" alt="" />
                  </figure>
                  <input
                    id="changeAddImage"
                    type="file"
                    accept="image/jpg,image/jpeg,image/png"
                    className={scss.choose_file_input}
                    title=""
                    multiple
                    ref={onFileRefChange}
                    onChange={(e: any) => {
                      const files = e.target?.files && Array.from(e.target.files);
                      if (files.length > 10) {
                        files.splice(10);
                        handleToastMessage('Max 10 photos allowed at a time');
                      }
                      setIsVideo(false);
                      setCurrentFiles(files);
                      handleClose();
                    }}
                  />
                  <label htmlFor="changeAddImage" className={scss.browse}>
                    Photos
                  </label>
                </>
              ) : (
                <>
                  <figure className={scss.image_wrapper}>
                    <img src={addPhotos} className="dark_hover_img" alt="" />
                    <img src={addPhotosDark} className="light_hover_img" alt="" />
                  </figure>
                  Photos
                </>
              )}
            </MenuItem>
            <MenuItem onClick={() => { if (showTerms) { handleClose(); setIsVideo(true); setShowModalType('terms'); } }}>
              {!showTerms ? (
                <>
                  <figure className={classNames(scss.image_wrapper, scss.file_input_wrap)}>
                    <img src={addPhotos} className="dark_hover_img" alt="" />
                    <img src={addPhotosDark} className="light_hover_img" alt="" />
                  </figure>
                  <input
                    id="changeAddImage"
                    type="file"
                    accept="video/mp4,video/3gpp,video/quicktime,video/x-m4v"
                    className={scss.choose_file_input}
                    title=""
                    ref={onVideoFileRefChange}
                    onChange={(e: any) => {
                      const files = e.target?.files && Array.from(e.target.files);
                      if (files.length > 1) {
                        files.splice(1);
                        handleToastMessage('Max 1 video allowed at a time');
                      }
                      setIsVideo(true);
                      setCurrentFiles(files);
                      handleClose();
                    }}
                  />
                  <label htmlFor="changeAddImage" className={scss.browse}>
                    Videos
                  </label>
                </>
              ) : (
                <>
                  <figure className={scss.image_wrapper}>
                    <img src={addPhotos} className="dark_hover_img" alt="" />
                    <img src={addPhotosDark} className="light_hover_img" alt="" />
                  </figure>
                  Videos
                </>
              )}
            </MenuItem>
          </Menu>
          <div className={`${scss.field_wrap}`}>
            <textarea
              ref={inputRef}
              placeholder="Type your message..."
              onChange={handleOnChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={!userExists || shouldNotSendMessage}
            />
            <button type="submit" aria-label="Send message" className={submitButtonClasses} onClick={handleSendMessage} disabled={!userExists || shouldNotSendMessage}>
              <img src={send} className="invert" alt="send" />
            </button>
          </div>
          {selectedMessageForReply ? (
            <div className={scss.replying_msg}>
              <div className={scss.reply_msg_wrap}>
                <span className={scss.to}>
                  Replying to
                  {' '}
                  {currentUserInfo?.id === selectedMessageForReply?.senderId ? 'You' : selectedMessageForReply.senderName ? selectedMessageForReply.senderName : ''}
                </span>
                {selectedMessageForReply.type === 'image' ? (
                  <div className={scss.reply_img_wrap}>
                    <Image src={selectedMessageForReply.mediaUrl || ''} fallbackSrc={placeholder} alt="message being replied to" />
                  </div>
                ) : selectedMessageForReply.type === 'text' ? (
                  <span className={scss.selectedMsg}>{selectedMessageForReply.text}</span>
                ) : selectedMessageForReply.type === 'video' ? (
                  <div className={scss.reply_img_wrap}>
                    <Image src={selectedMessageForReply.thumbnail || ''} fallbackSrc={placeholder} alt="message being replied to" />
                  </div>
                ) : null}
              </div>
              <button type="button" aria-label="Click to close the popup" className={scss.cross} onClick={() => handleReplyMessageSelection(null)}>
                <img src={cross} className="invert" alt="cross" />
              </button>
            </div>
          ) : null}
          <ImageUpload
            currentFiles={currentFiles}
            showModalType={showModalType}
            handleThumbnailChange={(data: File) => {
              setThumbnail(data);
            }}
            handleModalTypeChange={(type: string) => {
              setShowModalType(type);
            }}
            multiple
            handleFileChange={(data: File[]) => {
              if (data) {
                setCurrentFiles(data);
              }
            }}
            isVideo={isVideo}
            handleCurrentImageChange={(data: string[]) => {
              if (data) {
                setCurrentImages(data);
              }
            }}
            handleButtonClick={() => {
              if (buttonRef && buttonRef.current) {
                buttonRef.current.click();
                if (isVideo) {
                  setOpenVideoFile(true);
                } else {
                  setOpenFile(true);
                }
                localStorage.setItem('site-terms', '1');
                setShowTerms(false);
                setShowModalType('');
              }
            }}
          />
        </div>
      )}
    </>
  );
}
