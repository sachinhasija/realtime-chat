import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Room, NewChatData, User, GroupData, UpdateRoom,
} from 'interfaces/firestore';
import InboxModel from 'firestore/inboxModel';
import { DocumentData, Unsubscribe } from 'firebase/firestore';
import RoomModel from 'firestore/roomModel';
import UserModel from 'firestore/usersModel';
import classNames from 'classnames';
import BlockModel from 'firestore/blockModel';
import GroupModel from 'firestore/groupModel';
import ModalComponent from 'components/Modal/index';
import MessagesContainer from './MessagesContainer';
import Inbox from './Inbox';

import scss from './Chat.module.scss';
import UserProfile from './common/UserProfile';
import GroupProfile from './common/GroupProfile';

interface Props {
  usersInDb: { [userId: string]: User } | null
  currentUserInfo: User | null
  handleToastMessage: (message: string) => void
}

export default function ChatContainer(props: Props) {
  const { usersInDb, currentUserInfo, handleToastMessage } = props;
  const [chatInfo, setChatInfo] = useState<NewChatData | null>(null);
  const [inboxData, setInboxData] = useState<null | Map<string, string>>(null);
  const [dataPresent, setDataPresent] = useState(false);
  const [roomData, setRoomData] = useState<null | { [roomId: string]: Room }>(null);
  const [chatData, setChatData] = useState<{ [userId: string]: User } | null>(null);
  const chatMainDataRef = useRef<{ [userId: string]: User } | null>(null);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [blockedData, setBlockedData] = useState<null | { [userId: string]: { isBlocked?: boolean, timestamp: string } }>(null);
  const [deletedRoomId, setDeletedRoomId] = useState('');
  const [resetRoomMessages, setResetRoomMessages] = useState('');
  const [selectedUserBlockedData, setSelectedUserBlockedData] = useState<{ [userId: string]: { isBlocked?: boolean, timestamp: string } } | null>(null);
  const [totalGroupsData, setTotalGroupsData] = useState<null | { [groupId: string]: GroupData }>(null);
  const roomDataRef = useRef({});
  const userDataRef = useRef({});
  const blockDataUnsubscribeEvent = useRef<Unsubscribe | null>(null);
  const blockSelectedUserDataUnsubscribeEvent = useRef<Unsubscribe | null>(null);
  const inboxDataRef = useRef<Map<string, string> | null>(null);
  const chatDataRef = useRef<NewChatData | null>(null);
  const removedToastShown = useRef(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<null | string>(null);
  const deleteDataRef = useRef<null | { chatId: string, chatRoomId: string }>(null);
  const [showContactDetails, setShowContactDetails] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);

  const userData = useMemo(() => ({ _id: (currentUserInfo?.id) || '', username: (currentUserInfo?.name) || '' }), [currentUserInfo]);

  const selectedRoomData = chatInfo?.roomId && roomData?.[chatInfo?.roomId] ? roomData?.[chatInfo?.roomId] : null;

  const handleDeletedRoomId = (roomId: string) => {
    if (roomId) {
      setDeletedRoomId(roomId);
    }
  };

  const handleNewChat = (data: NewChatData | null) => {
    setChatInfo(data ? {
      ...data,
    } : null);
    setShowContactDetails(false);
    setShowGroupInfo(false);
    if (blockSelectedUserDataUnsubscribeEvent.current) {
      blockSelectedUserDataUnsubscribeEvent.current();
    }
    setSelectedUserBlockedData(null);
    chatDataRef.current = data ? { ...data } : null;
    return null;
  };
  const handleContactToggle = () => {
    setShowContactDetails((prevShowContactDetails) => !prevShowContactDetails);
  };

  const handleGroupInfoToggle = () => {
    setShowGroupInfo((prevShowContactDetails) => !prevShowContactDetails);
  };

  const handleMediaOpen = (value: boolean) => {
    setMediaOpen(value);
  };

  const onRoomMessageReset = (roomId?: string) => {
    setResetRoomMessages(roomId ?? '');
  };

  const handleModalClose = () => {
    setShowModal(false);
    setModalType(null);
    deleteDataRef.current = null;
  };

  const handleModalTypeChange = (type: string, data: { chatRoomId: string, chatId: string }) => {
    setModalType(type);
    setShowModal(true);
    deleteDataRef.current = data;
  };

  const handleChatDelete = (roomId: string, userId: string) => {
    const currentUserId = userData?._id;

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
      handleModalClose();
      handleToastMessage('Chat Deleted');
    }
  };

  const modalContent = () => {
    if (modalType === 'deleteChat') {
      return (
        <>
          <span className="xs_title m_title">
            Delete
          </span>
          <div className="txt_info">
            <p className="common_para">
              Confirm Delete
            </p>
          </div>
          <div className="f_center">
            <button
              type="button"
              className="fill_red_btn btn-effect btn"
              onClick={() => {
                if (deleteDataRef.current?.chatId && deleteDataRef.current?.chatRoomId) {
                  handleChatDelete(deleteDataRef.current?.chatRoomId, deleteDataRef.current?.chatId);
                }
              }}
              aria-label="Delete channel"
            >
              Delete
            </button>
            <button type="button" className="outline_btn btn-effect btn" onClick={handleModalClose} aria-label="Close">
              Cancel
            </button>
          </div>
        </>
      );
    }
    return null;
  };

  useEffect(() => () => {
    if (blockSelectedUserDataUnsubscribeEvent.current) {
      blockSelectedUserDataUnsubscribeEvent.current();
    }
    if (blockDataUnsubscribeEvent.current) {
      blockDataUnsubscribeEvent.current();
    }
  }, []);

  useEffect(() => {
    const unsubscribe: Unsubscribe | null = blockDataUnsubscribeEvent.current;
    let mounted = true;

    const updateBlockData = (data: { [userId: string]: { timestamp: string, isBlocked?: boolean } }, deletedDocId?: string) => {
      if (deletedDocId) {
        setBlockedData((prevData) => {
          const newData = prevData ? { ...prevData } : null;
          if (newData) {
            delete newData[deletedDocId];
          }
          return newData;
        });
      } else if (data && mounted) {
        setBlockedData(data);
      }
      return null;
    };

    if (userData?._id) {
      if (unsubscribe) {
        unsubscribe();
      }
      const blockModelObject = new BlockModel();
      blockDataUnsubscribeEvent.current = blockModelObject.addBlockListener(userData._id, updateBlockData);
    }

    return () => {
      mounted = false;
    };
  }, [userData]);

  useEffect(() => {
    const unsubscribe: Unsubscribe | null = blockSelectedUserDataUnsubscribeEvent.current;
    let mounted = true;
    const updateSelectedUserBlockData = (data: { [userId: string]: { timestamp: string, isBlocked?: boolean } }, deletedDocId?: string) => {
      if (deletedDocId) {
        setSelectedUserBlockedData((prevData) => {
          const newData = prevData ? { ...prevData } : null;
          if (newData) {
            delete newData[deletedDocId];
          }
          return newData;
        });
      } else if (data && mounted) {
        setSelectedUserBlockedData(data);
      }
      return null;
    };

    if (userData?._id && chatInfo?.chatId) {
      if (unsubscribe) {
        unsubscribe();
      }
      const blockModelObject = new BlockModel();
      blockSelectedUserDataUnsubscribeEvent.current = blockModelObject.addBlockListener(chatInfo?.chatId, updateSelectedUserBlockData);
    }

    return () => {
      mounted = false;
    };
  }, [chatInfo, userData?._id]);

  useEffect(() => {
    let unsubscribe: Unsubscribe | null = null;
    let mounted = true;
    const roomUnsubscribeEvents: Unsubscribe[] = [];
    const userUnsubscribeEvents: Unsubscribe[] = [];

    const updateRoomData = (data: any) => {
      if (data?.chatRoomId && mounted) {
        setRoomData((prevRoomData) => (prevRoomData ? { ...prevRoomData, [data.chatRoomId]: data } : { [data.chatRoomId]: data }));
        roomDataRef.current = { ...roomDataRef.current, [data.chatRoomId]: true };
        const chatRoomMembers = data?.chatRoomMembers ? data?.chatRoomMembers : null;
        if (!chatRoomMembers?.[userData?._id || '']) {
          const chatRoomId = data?.chatRoomId;
          if (chatRoomId && userData?._id) {
            const InboxModelObj = new InboxModel();
            const isGroup = chatRoomId.split('_').length === 1;
            let otherUserId = '';
            if (!isGroup) {
              otherUserId = chatRoomId.split('_')[0] === userData._id ? chatRoomId.split('_')[1] : chatRoomId.split('_')[0];
            }

            InboxModelObj.deleteUserFromInbox(userData?._id, isGroup ? chatRoomId : otherUserId);
          }
          if (data?.chatRoomType === 'group') {
            handleNewChat(null);
            handleDeletedRoomId(data?.chatRoomId);
            const groupName = chatMainDataRef.current && chatMainDataRef.current[data?.chatRoomId] ? chatMainDataRef.current[data?.chatRoomId].name : 'this group';
            if (!removedToastShown.current) {
              handleToastMessage(`You are not a participant of ${groupName} anymore`);
              removedToastShown.current = true;
            }
          }
        }
      }
      return null;
    };

    const updateUserData = (data: any) => {
      if (data?.id && mounted) {
        setChatData((prevChatData) => {
          if (prevChatData) {
            chatMainDataRef.current = { ...prevChatData, [data.id]: data };
            return { ...prevChatData, [data.id]: data };
          }
          chatMainDataRef.current = { [data.id]: data };
          return { [data.id]: data };
        });
        if (chatDataRef?.current && chatDataRef.current.chatId === data.id) {
          setChatInfo({ ...chatDataRef.current, name: data?.name ?? '', isOnline: !!(data?.showOnline && data?.isOnline) });
        }
        userDataRef.current = { ...userDataRef.current, [data.id]: true };
      }
      return null;
    };

    const updateGroupData = (data: any) => {
      if (data?.groupId && mounted) {
        const groupData = {
          id: data.groupId,
          name: data.name,
          image: data.image,
          createdAt: data.createdAt,
          isOnline: false,
          showOnline: false,
        };
        setTotalGroupsData((prevGroupsData) => (prevGroupsData ? { ...prevGroupsData, [data.groupId]: data } : { [data.groupId]: data }));
        setChatData((prevChatData) => {
          if (prevChatData) {
            chatMainDataRef.current = { ...prevChatData, [groupData.id]: groupData };
            return { ...prevChatData, [groupData.id]: groupData };
          }
          chatMainDataRef.current = { [groupData.id]: groupData };
          return { [groupData.id]: groupData };
        });
        if (chatDataRef?.current && chatDataRef.current.chatId === groupData.id) {
          setChatInfo({ ...chatDataRef.current, name: groupData?.name ?? '', isOnline: false });
        }
        userDataRef.current = { ...userDataRef.current, [groupData.id]: true };
      }
      return null;
    };

    const updateInboxData = (data: { [documentId: string]: DocumentData }) => {
      const roomModelObject = new RoomModel();
      const userModelObject = new UserModel();
      const groupModelObject = new GroupModel();

      if (data && typeof data === 'object' && mounted) {
        const newInboxData: Map<string, string> = new Map();
        Object.keys(data).forEach((documentId: string) => {
          const inboxRoomId = data?.[documentId]?.roomId;
          if (inboxRoomId) {
            newInboxData.set(inboxRoomId, documentId);
            if (chatDataRef?.current?.chatId === documentId) {
              setChatInfo({ ...chatDataRef.current, roomId: inboxRoomId });
              chatDataRef.current = { ...chatDataRef.current, roomId: inboxRoomId };
            }
            if (!roomDataRef?.current?.[inboxRoomId]) {
              const roomUnsubscribe = roomModelObject.addRoomListener(inboxRoomId, updateRoomData);
              roomUnsubscribeEvents.push(roomUnsubscribe);
            }
            if (!userDataRef?.current?.[documentId]) {
              const isGroup = inboxRoomId.split('_').length === 1;
              if (!isGroup) {
                const userUnsubscribe = userModelObject.addUserListener(documentId, updateUserData);
                userUnsubscribeEvents.push(userUnsubscribe);
              } else {
                const groupUnsubscribe = groupModelObject.addGroupListener(inboxRoomId, updateGroupData);
                userUnsubscribeEvents.push(groupUnsubscribe);
              }
            }
          }
        });
        inboxDataRef.current = newInboxData;
        setInboxData(newInboxData);
      }
      return null;
    };

    if (userData?._id) {
      const inboxModelObject = new InboxModel();
      unsubscribe = inboxModelObject.addInboxListener(userData._id, updateInboxData);
    }

    return () => {
      mounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
      if (roomUnsubscribeEvents?.length > 0) {
        roomUnsubscribeEvents.forEach((unsub) => unsub());
      }
      if (userUnsubscribeEvents?.length > 0) {
        userUnsubscribeEvents.forEach((unsub) => unsub());
      }
    };
  }, [userData?._id]);

  useEffect(() => {
    if (!dataPresent && inboxData && Array.from(inboxData).length > 0) {
      setDataPresent(true);
    }
  }, [inboxData, dataPresent]);

  useEffect(() => {
    if (roomData && inboxDataRef.current) {
      const inboxIds = Array.from(inboxDataRef.current);
      inboxIds.sort((inboxKeysA: string[], inboxKeysB: string[]) => {
        const timestamp1 = roomData?.[inboxKeysA[0]]?.lastMessage?.timestamp;
        const timestamp2 = roomData?.[inboxKeysB[0]]?.lastMessage?.timestamp;
        if (timestamp1 && timestamp2) {
          return Number(timestamp1) > Number(timestamp2) ? -1 : 1;
        }
        return 1;
      });
      setInboxData(new Map(inboxIds));
    }
  }, [roomData]);

  return (
    <div className={classNames('custom_container', { [scss.carousel_modal_zindex]: mediaOpen })}>
      <div className={`flex_row ${scss.chat_wrapper}`}>
        <Inbox handleNewChat={handleNewChat} usersInDb={usersInDb} handleModalTypeChange={handleModalTypeChange} handleDeletedRoomId={handleDeletedRoomId} roomSelected={chatInfo?.roomId ?? ''} inboxData={inboxData} roomsData={roomData} chatData={chatData} currentUserInfo={{ name: userData?.username ?? '', id: userData?._id ?? '' }} />
        <MessagesContainer usersInDb={usersInDb} dataPresent={dataPresent} removeListeners={false} totalGroupsData={totalGroupsData} handleDeletedRoomId={handleDeletedRoomId} deletedRoomId={deletedRoomId} handleToastMessage={handleToastMessage} blockedData={blockedData} selectedUserBlockedData={selectedUserBlockedData} handleContactToggleMain={handleContactToggle} handleGroupInfoToggle={handleGroupInfoToggle} showContactDetails={showContactDetails} showGroupInfo={showGroupInfo} currentUserInfo={{ name: userData?.username ?? '', id: userData?._id ?? '' }} chatData={chatData} chatInfo={chatInfo} roomData={selectedRoomData} onRoomMessageReset={onRoomMessageReset} resetRoomMessages={resetRoomMessages} />
        {chatInfo && userData._id ? showContactDetails ? (
          <UserProfile handleNewChat={handleNewChat} handleDeletedRoomId={handleDeletedRoomId} handleContactToggle={handleContactToggle} blockedData={blockedData?.[chatInfo.chatId] ?? null} currentUserId={userData._id} handleMediaOpen={handleMediaOpen} chatInfo={chatInfo} />
        ) : showGroupInfo && selectedRoomData ? <GroupProfile usersInDb={usersInDb} handleMediaOpen={handleMediaOpen} handleDeletedRoomId={handleDeletedRoomId} roomData={selectedRoomData} chatData={chatData} currentUserInfo={{ name: userData?.username ?? '', id: userData?._id ?? '' }} onRoomMessageReset={onRoomMessageReset} chatInfo={chatInfo} handleGroupInfoToggle={handleGroupInfoToggle} handleNewChat={handleNewChat} /> : null : null}
      </div>
      <ModalComponent
        id="chat-main-modal"
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
  );
}
