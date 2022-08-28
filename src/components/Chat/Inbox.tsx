import React, {
  useState,
} from 'react';
import SearchBar from 'components/SearchBar';
import {
  Room, NewChatData, User,
} from 'interfaces/firestore';
import newMsg from 'assets/images/new-msg.png';
import { throttle } from 'lodash';
import NewChat from './NewChat';
import InboxCard from './common/InboxCard';

import scss from './Chat.module.scss';
import NewGroupChat from './NewGroupChat';

interface Props {
  currentUserInfo: { id: string, name: string },
  roomSelected: string
  inboxData: Map<string, string> | null,
  roomsData: { [roomId: string]: Room; } | null
  handleModalTypeChange: (type: string, data: { chatRoomId: string, chatId: string }) => void
  handleDeletedRoomId: (roomId: string) => void
  chatData: { [userId: string]: User } | null
  handleNewChat: (data: NewChatData | null) => null
}

const Inbox = ({
  handleNewChat, currentUserInfo, inboxData, roomsData, chatData, roomSelected, handleDeletedRoomId, handleModalTypeChange,
}: Props) => {
  const [isNewChat, setIsNewChat] = useState('');
  const [searchedData, setSearchedData] = useState<Map<string, string> | null>(null);
  const currentUserId = currentUserInfo.id;

  const toggleNewChat = (type: string) => {
    setIsNewChat(type);
  };

  const handleInboxSearch = throttle((value) => {
    //
    if (inboxData && chatData && value?.trim()) {
      const updatedInboxData = new Map();
      inboxData.forEach((val: string, key: string) => {
        if (chatData[val]?.name?.includes(value)) {
          updatedInboxData.set(key, val);
        }
      });
      setSearchedData(updatedInboxData);
    } else {
      setSearchedData(null);
    }
  }, 200);

  const mainData = searchedData || inboxData;

  return (
    <>
      <div className={`sidenav ${scss.chat_sidenav}`}>
        <div className={`inner ${scss.chat_inner_nav}`}>
          {isNewChat === '' || !isNewChat ? (
            <>
              <div className={`f_spacebw ${scss.msg_wrap}`}>
                <h1 className="xs_title m0">
                  Messages
                </h1>
                <button type="button" onClick={() => toggleNewChat('singleUser')} aria-label="New Message">
                  <img src={newMsg} alt="new-msg" className="invert" />
                </button>
              </div>
              <SearchBar
                className={`list_search ${scss.searchbar}`}
                placeholder="Search Contacts"
                onChange={handleInboxSearch}
              />
              {/* <ul className={scss.account_list}>
                <li className={scss.business}>
                  <button type="button" onClick={() => handleToastMessage('Under Development')} aria-label="Business messages">
                    <FormattedMessage id="Messages.business" />
                  </button>
                </li>
                <li className={scss.business}>
                  <button type="button" onClick={() => handleToastMessage('Under Development')} aria-label="Investment messages">
                    <FormattedMessage id="Messages.investment" />
                  </button>
                </li>
              </ul> */}
              <ul className={scss.chat_list}>
                {mainData && chatData && roomsData ? (
                  Array.from(mainData).map((inboxArray: string[]) => {
                    if (chatData[inboxArray[1]] && roomsData[inboxArray[0]]) {
                      return (
                        <InboxCard key={`inbox-${inboxArray[0]}`} handleModalTypeChange={handleModalTypeChange} handleDeletedRoomId={handleDeletedRoomId} handleNewChat={handleNewChat} currentUserId={currentUserId ?? ''} selected={roomSelected === inboxArray[0]} roomData={roomsData[inboxArray[0]]} chatData={chatData[inboxArray[1]]} />
                      );
                    }
                    return null;
                  })
                ) : null}
              </ul>
            </>
          ) : isNewChat === 'singleUser' ? <NewChat inboxData={inboxData} currentUserId={currentUserId} roomData={roomsData} chatData={chatData} toggleNewChat={toggleNewChat} handleNewChat={handleNewChat} /> : <NewGroupChat toggleNewChat={toggleNewChat} currentUserInfo={currentUserInfo} />}
        </div>
      </div>
    </>
  );
};

export default React.memo(Inbox);
