/* eslint-disable no-await-in-loop */
import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from 'react';
import {
  GroupData,
  MessageData, NewChatData, Room, User,
} from 'interfaces/firestore';
import SearchBar from 'components/SearchBar';
import Carousel from 'components/Carousel/Carousel';
import DotsLoader from 'components/Loaders/DotsLoader';
import ModalComponent from 'components/Modal';
import CircularProgressLoader from 'components/Loaders/CircularProgress';

import MessagesModel from 'firestore/messagesModel';
import DeleteMessageForm from 'forms/DeleteMessageForm';
import { DocumentData, QueryDocumentSnapshot, Unsubscribe } from 'firebase/firestore';
import RoomModel from 'firestore/roomModel';
import InfiniteScroll from 'react-infinite-scroll-component';
import { debounce } from 'lodash';

import UserModel from 'firestore/usersModel';
import Messages from './Messages';
import MessagesHeader from './MessagesHeader';
import MessageField from './MessageField';
import ForwardUser from './common/ForwardUser';
import ForwardSelectedUser from './common/ForwardSelectedUser';
import scss from './Chat.module.scss';
import forwardUserScss from './common/ForwardUser.module.scss';

interface PeopleData {
  page?: number,
  search?: string
  limit?: number,
}

interface Props {
  dataPresent: boolean
  currentUserInfo: { id: string, name: string },
  totalGroupsData: null | { [groupId: string]: GroupData },
  chatInfo: NewChatData | null
  usersInDb: { [userId: string]: User } | null
  blockedData: null | { [userId: string]: { isBlocked?: boolean, timestamp: string } }
  selectedUserBlockedData: null | { [userId: string]: { isBlocked?: boolean, timestamp: string } }
  roomData: null | Room
  chatData: { [userId: string]: User } | null
  resetRoomMessages: string
  onRoomMessageReset: () => void,
  handleDeletedRoomId: (roomId: string) => void
  deletedRoomId: string
  showContactDetails: boolean
  showGroupInfo: boolean
  removeListeners: boolean
  handleGroupInfoToggle: () => void
  handleContactToggleMain: () => void
  handleToastMessage: (message: string) => void
}

const MessagesContainer = (props: Props) => {
  const {
    chatInfo, currentUserInfo, totalGroupsData, removeListeners, roomData, chatData, dataPresent, deletedRoomId, resetRoomMessages, blockedData, selectedUserBlockedData, showContactDetails, showGroupInfo, handleDeletedRoomId, handleContactToggleMain, handleGroupInfoToggle, handleToastMessage, onRoomMessageReset, usersInDb,
  } = props;
  const [messageData, setMessageData] = useState<{ [roomId: string]: Map<string, MessageData> } | null>(null);
  const messageUnsubscribeEvent = useRef<Unsubscribe[] | null>(null);
  const unreadMessageUnsubscribeEvent = useRef<Unsubscribe | null>(null);
  const queryPointers = useRef<{ start?: QueryDocumentSnapshot<DocumentData> } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<null | string>(null);
  const [selectedMessage, setSelectedMessage] = useState<null | MessageData>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [totalGroupsDataMain, setTotalGroupsDataMain] = useState<{ [groupId: string]: GroupData }>({});
  const isLastIndex = useRef(false);

  // forward message
  const [forwardingMessage, setForwardingMessage] = useState(false);
  const [selectedMessagesForForward, setSelectedMessagesForForward] = useState<null | { [messageId: string]: MessageData }>(null);
  const [selectedForwardMessageUser, setSelectedForwardMessageUser] = useState<{ [userId: string]: { userId: string, name: string } } | null>(null);

  // reply message
  const [selectedMessageForReply, setSelectedMessageForReply] = useState<null | MessageData>(null);

  const searched = useRef('');
  const roomDataRef = useRef<null | Room>(roomData);
  const [pageData, setPageData] = useState({ allUserNames: { page: 1, hasMoreData: false }, searchedUserName: { page: 1, hasMoreData: false } });
  const [usernamesData, setUsernamesData] = useState<null | User[]>(null);
  const [searchedUsernames, setSearchedUsernames] = useState<null | User[]>(null);

  const mainData = searched?.current ? searchedUsernames : usernamesData;
  const usersToChat: User[] = useMemo(() => {
    return usersInDb ? Object.values(usersInDb) : [];
  }, [usersInDb]);

  const searchedUsersToChat: User[] = useMemo(() => {
    return usersInDb ? Object.values(usersInDb) : [];
  }, [usersInDb]);

  const lastMessageReceiverId = useRef<null | string>(roomData && roomData.lastMessage.receiverId ? roomData.lastMessage.receiverId : null);

  const lastMessageTime = roomData && typeof roomData.chatRoomMembers?.[currentUserInfo?.id]?.memberDelete !== 'undefined' ? roomData.chatRoomMembers?.[currentUserInfo?.id].memberDelete : undefined;

  const handleSetIsLastIndex = () => {
    isLastIndex.current = true;
  };

  const handleForwardMessageSelection = (forwardMessageData: MessageData) => {
    const newForwardMessageData = { ...selectedMessagesForForward };
    if (newForwardMessageData && forwardMessageData?.messageId && newForwardMessageData[forwardMessageData.messageId]) {
      delete newForwardMessageData[forwardMessageData.messageId];
    } else if (forwardMessageData?.messageId && Object.values(newForwardMessageData).length < 3) {
      newForwardMessageData[forwardMessageData.messageId] = forwardMessageData;
    }
    setSelectedMessagesForForward(newForwardMessageData);
    return null;
  };

  const handleReplyMessageSelection = (replyMessageData: MessageData | null) => {
    setSelectedMessageForReply(replyMessageData);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setModalType(null);
    setSelectedMessage(null);
    setSelectedForwardMessageUser(null);
    isLastIndex.current = false;
    searched.current = '';
    return null;
  };

  const handleDeleteSubmit = (deleteSubmitData: { deleteType: string }) => {
    if (selectedMessage?.messageId && selectedMessage.messageRoomId && currentUserInfo?.id) {
      const messageObjectModel = new MessagesModel();
      const roomObjectModel = new RoomModel();
      messageObjectModel.updateMessage(selectedMessage.messageRoomId, selectedMessage.messageId, { deleteFor: deleteSubmitData.deleteType === 'everyone' ? { all: true } : { [currentUserInfo?.id]: true } });
      messageObjectModel.updateMediaMessage(selectedMessage.messageRoomId, selectedMessage.messageId, { deleteFor: deleteSubmitData.deleteType === 'everyone' ? { all: true } : { [currentUserInfo?.id]: true } });
      if (isLastIndex.current) {
        const roomLastMessageUpdateData = { lastMessage: { deleteFor: deleteSubmitData.deleteType === 'everyone' ? { all: true } : { [currentUserInfo?.id]: true } } };
        roomObjectModel.updateRoom(selectedMessage.messageRoomId, roomLastMessageUpdateData);
      }
      handleModalClose();
    }
    return null;
  };

  const handleModalTypeChange = (type: string, selectedMessageData?: MessageData) => {
    setModalType(type);
    setShowModal(true);
    if (selectedMessageData) {
      setSelectedMessage(selectedMessageData);
    }
    return null;
  };

  const handleRemoveForwardSelectedUser = (userId: string) => {
    const newUserObj = { ...selectedForwardMessageUser };
    delete newUserObj[userId];
    setSelectedForwardMessageUser(newUserObj);
    return null;
  };

  const handleUserSearch = debounce((search: string) => {
    searched.current = search;
    if (totalGroupsData) {
      const data = { ...totalGroupsData };
      if (typeof search === 'string') {
        Object.values(data).forEach((group: GroupData) => {
          if (!(typeof group.name === 'string' && group.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))) {
            delete data[group.groupId];
          }
        });
      }
      setTotalGroupsDataMain(data);
    }
    if (usernamesData && search?.trim()) {
      searched.current = search?.trim();
      const searchedData: User[] = [];
      usernamesData.forEach((data: User) => {
        if (data?.name?.toLocaleLowerCase()?.includes(search.toLocaleLowerCase())) {
          searchedData.push(data);
        }
      });
      setSearchedUsernames(searchedData);
    } else {
      searched.current = '';
      setSearchedUsernames(null);
    }
  }, 300);

  const handleUserSelect = (userData: { userId: string, name: string, isGroup: boolean }, value: boolean) => {
    if (value && (!selectedForwardMessageUser || Object.values(selectedForwardMessageUser).length < 5)) {
      setSelectedForwardMessageUser((prevSelectedUsers) => (prevSelectedUsers ? { ...prevSelectedUsers, [userData.userId]: userData } : { [userData.userId]: userData }));
    } else {
      const newUserObj = { ...selectedForwardMessageUser };
      delete newUserObj[userData.userId];
      setSelectedForwardMessageUser(newUserObj);
    }
    return null;
  };

  const handleForwardCancel = () => {
    setSelectedMessagesForForward(null);
    return null;
  };

  const handleUserForward = async () => {
    console.log("currentUserInfo", currentUserInfo, selectedForwardMessageUser)
    if (currentUserInfo?.id && selectedForwardMessageUser && selectedMessagesForForward && Object.values(selectedForwardMessageUser).length > 0 && Object.values(selectedMessagesForForward).length > 0) {
      setForwardingMessage(true);
      const messageModelObject = new MessagesModel();
      const messagesToForward = Object.values(selectedMessagesForForward);
      for (let i = 0; i < messagesToForward.length; i += 1) {
        const forwardMessageData = messagesToForward[i];
        await messageModelObject.forwardMessage(currentUserInfo, Object.values(selectedForwardMessageUser), forwardMessageData);
      }
      setForwardingMessage(false);
      handleForwardCancel();
      handleModalClose();
    }
  };

  const modalContent = () => {
    if (modalType === 'messageDelete') {
      return (
        <>
          <span className="xs_title m_title m0 b_none">
            Delete Message
          </span>
          <div className="text-center">
            <p className="common_para m0">
              Are you sure you want to delete this
              {' '}
              <br />
              {' '}
              message?
            </p>
          </div>
          <DeleteMessageForm deleting={false} errorMsg="" handleFormSubmit={handleDeleteSubmit} handleClose={handleModalClose} />
        </>
      );
    } if (modalType === 'messageDeleteForOtherUser') {
      return (
        <>
          <span className="xs_title m_title m0 b_none">
            Delete Message
          </span>
          <div className="text-center">
            <p className="common_para">
              Are you sure you want to delete this
              {' '}
              <br />
              {' '}
              message?
            </p>
          </div>
          <div className="f_center mt-sm">
            <button type="button" className="fill_red_btn btn-effect btn" onClick={() => handleDeleteSubmit({ deleteType: 'user' })} aria-label="Click to delete this message for me">
              Delete for me
            </button>
            <button type="button" className="outline_btn btn-effect btn" onClick={handleModalClose} aria-label="Close">
              Cancel
            </button>
          </div>
        </>
      );
    } if (modalType === 'messageForward') {
      return (
        <div>
          <span className="xs_title m_title">
            Forward Message
          </span>
          {selectedForwardMessageUser && Object.values(selectedForwardMessageUser).length > 0 ? (
            <Carousel
              className={forwardUserScss.forward_list}
              itemCount={{
                desktop: 5,
                tablet: 3,
                mobile: 3,
                smMobile: 3,
                xsMobile: 3,
              }}
              draggable
              arrows={false}
            >
              {Object.values(selectedForwardMessageUser).map((selecteduserObj: { userId: string, name: string }) => (
                <ForwardSelectedUser key={selecteduserObj.userId} name={selecteduserObj.name} id={selecteduserObj.userId} handleRemoveUser={handleRemoveForwardSelectedUser} />
              ))}
            </Carousel>
          ) : null}
          <SearchBar
            placeholder="Search"
            className="m0"
            onChange={(search: string) => {
              handleUserSearch(search);
            }}
          />
          <div className={`m_content ${forwardUserScss.forward_user_list}`} id="chat__message__forward__user__list">
            {totalGroupsDataMain && typeof totalGroupsDataMain === 'object' && Object.values(totalGroupsDataMain).length > 0 ? Object.values(totalGroupsDataMain).map((gData: GroupData) => (
              <ForwardUser key={gData.groupId} selectedForwardMessageUser={selectedForwardMessageUser} name={gData.name} userId={gData.groupId} isGroup handleUserSelect={handleUserSelect} />
            )) : null}
            {((!usernamesData || usernamesData?.length === 0)) ? (
              <CircularProgressLoader />
            ) : (
              <InfiniteScroll
                dataLength={mainData?.length || 0}
                next={() => null}
                hasMore={searched.current ? pageData.searchedUserName.hasMoreData : pageData.allUserNames.hasMoreData}
                className="overflow_unset"
                loader={<CircularProgressLoader />}
                scrollableTarget="chat__message__forward__user__list"
              >
                {Array.isArray(mainData) && mainData.length > 0 ? mainData.map((userNameData: User) => (userNameData.id !== currentUserInfo.id ? (
                  <ForwardUser key={userNameData.id} isGroup={false} selectedForwardMessageUser={selectedForwardMessageUser} name={userNameData.name || ''} userId={userNameData.id} handleUserSelect={handleUserSelect} />
                ) : null)) : null}
              </InfiniteScroll>
            )}
          </div>
          <div className="f_center">
            <button className="fill_red_btn btn-effect btn" aria-label="Forward message" disabled={!(selectedForwardMessageUser && Object.values(selectedForwardMessageUser).length > 0)} onClick={handleUserForward}>{forwardingMessage ? <DotsLoader /> : 'Forward'}</button>
          </div>
        </div>
      );
    }
    return null;
  };

  const updateUnreadCountForGroupMember = useCallback(() => {
    const rData = roomDataRef.current;
    // const currentChatMemberData = rData?.chatRoomMembers?.[currentUserInfo?.id ?? ''] ? rData?.chatRoomMembers[currentUserInfo.id] : {};
    // if (currentChatMemberData?.unreadCount && currentChatMemberData?.unreadCount > 0) {
    const RoomModelObj = new RoomModel();
    const data = {
      chatRoomMembers: {
        [currentUserInfo.id]: {
          unreadCount: 0,
        },
      },
    };
    if (rData?.chatRoomId) {
      RoomModelObj.updateRoom(rData?.chatRoomId, data);
      const UserMOdelObj = new UserModel();
      UserMOdelObj.updateUserTotalUnread(currentUserInfo.id, rData.chatRoomId, { unreadMessage: false });
    }
    // }
  }, [currentUserInfo]);

  const updateMessages = useCallback((data: Map<string, MessageData>, firstTime?: boolean) => {
    if (chatInfo?.roomId) {
      const isGroup = chatInfo.roomId?.split('_').length === 1;
      if ((!unreadMessageUnsubscribeEvent.current) && lastMessageReceiverId.current && chatInfo.chatId && currentUserInfo.id && !isGroup) {
        const MessageModelObject = new MessagesModel();
        const unsubscribeUnreadMessagesEvent = MessageModelObject.addUnreadListener(chatInfo.roomId, chatInfo.chatId, currentUserInfo.id, lastMessageReceiverId.current);
        unreadMessageUnsubscribeEvent.current = unsubscribeUnreadMessagesEvent;
      }
      setHasMoreMessages(data?.size >= 19);

      setMessageData((prevMessageData) => {
        const newData = new Map();
        const oldData = prevMessageData && chatInfo.roomId && prevMessageData[chatInfo.roomId] ? new Map([...prevMessageData[chatInfo.roomId]]) : null;
        if (oldData && data.size > 0) {
          data.forEach((value: MessageData, key: string) => {
            if (oldData.has(key)) {
              oldData.set(key, value);
            } else {
              newData.set(key, value);
            }
          });
        }
        return (prevMessageData && chatInfo.roomId && oldData ? { ...prevMessageData, [chatInfo.roomId]: !firstTime ? new Map([...newData, ...oldData]) : new Map([...oldData, ...newData]) } : chatInfo.roomId ? { [chatInfo.roomId]: data } : null);
      });
    }
    return null;
  }, [chatInfo?.roomId, chatInfo?.chatId, currentUserInfo?.id]);

  const loadMoreMessages = useCallback(() => {
    setHasMoreMessages(false);

    if (queryPointers?.current?.start && chatInfo?.roomId && typeof lastMessageTime !== 'undefined') {
      const start = queryPointers?.current?.start ? queryPointers.current.start : queryPointers?.current?.start;
      const MessageModelObject = new MessagesModel();
      const unsubscribeMessagesEvent = MessageModelObject.addMoreMessagesListener(chatInfo?.roomId, 20, updateMessages, { start }, lastMessageTime ?? '');
      unsubscribeMessagesEvent.then((response: { listener: Unsubscribe, pointers: { start: QueryDocumentSnapshot<DocumentData> } }) => {
        if (messageUnsubscribeEvent.current) {
          messageUnsubscribeEvent.current.push(response.listener);
        } else {
          messageUnsubscribeEvent.current = [response.listener];
        }
        queryPointers.current = response.pointers;
      });
    }
    return null;
  }, [queryPointers, chatInfo?.roomId, lastMessageTime]);

  useEffect(() => () => {
    if (messageUnsubscribeEvent.current) {
      messageUnsubscribeEvent.current.forEach((unsub) => unsub());
    }
    if (unreadMessageUnsubscribeEvent.current) {
      unreadMessageUnsubscribeEvent.current();
    }
  }, []);

  useEffect(() => {
    if (totalGroupsData) {
      const data = { ...totalGroupsData };
      if (searched.current && typeof searched.current === 'string') {
        Object.values(data).forEach((group: GroupData) => {
          if (!(group.name && group.name.includes(searched.current.trim()))) {
            delete data[group.groupId];
          }
        });
      }
      setTotalGroupsDataMain(data);
    }
  }, [totalGroupsData]);

  useEffect(() => {
    const unsubscribe: Unsubscribe[] | null = messageUnsubscribeEvent.current;
    const unsubscribeUnreadListener: Unsubscribe | null = unreadMessageUnsubscribeEvent.current;
    if (chatInfo?.roomId && chatInfo?.chatId && currentUserInfo.id && typeof lastMessageTime !== 'undefined') {
      queryPointers.current = null;
      if (unsubscribe && unsubscribe.length > 0) {
        unsubscribe.forEach((unsub: Unsubscribe) => unsub());
      }
      if (messageUnsubscribeEvent.current) {
        messageUnsubscribeEvent.current.forEach((unsub) => unsub());
      }
      messageUnsubscribeEvent.current = null;
      if (unsubscribeUnreadListener) {
        unsubscribeUnreadListener();
      }
      const MessageModelObject = new MessagesModel();

      const unsubscribeMessagesEvent = MessageModelObject.addMessagesListener(chatInfo.roomId, 20, updateMessages, lastMessageTime ?? '');
      unreadMessageUnsubscribeEvent.current = null;
      unsubscribeMessagesEvent.then((response: { listener: Unsubscribe, pointers: { start: QueryDocumentSnapshot<DocumentData> } }) => {
        messageUnsubscribeEvent.current = [response.listener];
        queryPointers.current = response.pointers;
      });
      setSelectedMessagesForForward(null);
    }
  }, [chatInfo?.roomId, chatInfo?.chatId, currentUserInfo?.id, lastMessageTime]);

  useEffect(() => {
    const unsubscribe: Unsubscribe[] | null = messageUnsubscribeEvent.current;
    const unsubscribeUnreadListener: Unsubscribe | null = unreadMessageUnsubscribeEvent.current;
    if (chatInfo === null) {
      if (unsubscribe && unsubscribe.length > 0) {
        unsubscribe.forEach((unsub: Unsubscribe) => unsub());
      }
      if (unsubscribeUnreadListener) {
        unsubscribeUnreadListener();
      }
    }
  }, [chatInfo]);

  useEffect(() => {
    if (usersToChat && !searched?.current) {
      setUsernamesData(usersToChat);
    }
  }, [usersToChat]);

  useEffect(() => {
    if (roomData) {
      lastMessageReceiverId.current = roomData.lastMessage.receiverId ?? '';
      roomDataRef.current = roomData;
      const isGroup = roomData?.chatRoomId?.split('_').length === 1;
      if (isGroup) {
        updateUnreadCountForGroupMember();
      }
    }
  }, [roomData]);

  useEffect(() => {
    if (deletedRoomId) {
      setMessageData((prevData) => {
        const newData = prevData ? { ...prevData } : null;
        if (newData?.[deletedRoomId]) {
          delete newData[deletedRoomId];
          handleDeletedRoomId('');
        }
        return newData;
      });
    }
  }, [deletedRoomId]);

  useEffect(() => {
    if (resetRoomMessages) {
      setMessageData((prevMessageData) => {
        const newMessageData = { ...prevMessageData };
        if (newMessageData?.[resetRoomMessages]) {
          newMessageData[resetRoomMessages] = new Map();
        }
        return newMessageData;
      });
      onRoomMessageReset();
    }
  }, [resetRoomMessages]);

  console.log("usersToChat", usersToChat)
  return (
    <>
      <div className={`list_container ${scss.msg_container} ${showContactDetails || showGroupInfo ? scss.view_contact : ''}`}>
        {chatInfo ? (
          <MessagesHeader chatInfo={chatInfo} chatData={chatData} handleGroupInfoToggle={handleGroupInfoToggle} handleContactToggle={handleContactToggleMain} />
        ) : null}
        <Messages dataPresent={dataPresent} setIsLastIndex={handleSetIsLastIndex} handleToastMessage={handleToastMessage} loadMoreMessages={loadMoreMessages} hasMoreMessages={hasMoreMessages} roomId={chatInfo?.roomId} messageData={messageData?.[chatInfo?.roomId ?? ''] ?? null} selectedMessages={selectedMessagesForForward} handleReplyMessageSelection={handleReplyMessageSelection} handleMessageForward={handleForwardMessageSelection} handleModalTypeChange={handleModalTypeChange} currentUserInfo={currentUserInfo} />
        {chatInfo ? (
          <MessageField chatInfo={chatInfo} chatData={chatData} blockedData={blockedData?.[chatInfo.chatId] ?? null} selectedUserBlockedData={selectedUserBlockedData?.[currentUserInfo?.id] ?? null} handleToastMessage={handleToastMessage} selectedMessageForReply={selectedMessageForReply} roomData={roomData} currentUserInfo={currentUserInfo} selectedMessagesLength={selectedMessagesForForward ? Object.keys(selectedMessagesForForward).length : 0} handleModalTypeChange={handleModalTypeChange} handleForwardCancel={handleForwardCancel} handleReplyMessageSelection={handleReplyMessageSelection} />
        ) : null}
        <ModalComponent
          id="messages-main-modal"
          isOpen={showModal}
          onClose={handleModalClose}
          onManageDisableScrolling={() => null}
          showCloseBtn={modalType === 'messageForward'}
        >
          <div>
            {modalContent()}
          </div>
        </ModalComponent>
      </div>
    </>
  );
};

export default React.memo(MessagesContainer);
