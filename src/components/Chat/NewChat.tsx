import React, { useState, useEffect, useRef, useMemo } from 'react';
import SearchBar from 'components/SearchBar';
import {
  Room, NewChatData, User,
} from 'interfaces/firestore';
import { debounce } from 'lodash';
import InfiniteScroll from 'react-infinite-scroll-component';
import CircularProgressLoader from 'components/Loaders/CircularProgress';

import NewChatUserCard from './common/NewChatUserCard';

import scss from './Chat.module.scss';

interface PeopleData {
  page?: number,
  search?: string
  limit?: number,
}

interface Props {
  currentUserId: string
  usersInDb: { [userId: string]: User } | null
  toggleNewChat: (type: string) => void
  handleNewChat: (data: NewChatData) => null
  inboxData: Map<string, string> | null,
  roomData: { [roomId: string]: Room; } | null
  chatData: { [userId: string]: User } | null
}

const NewChat = ({
  currentUserId, usersInDb, toggleNewChat, handleNewChat, inboxData, roomData, chatData,
}: Props) => {
  const searched = useRef('');
  const [usernamesData, setUsernamesData] = useState<null | User[]>(null);
  const [searchedUsernames, setSearchedUsernames] = useState<null | User[]>(null);

  const usersToChat: User[] = useMemo(() => {
    return usersInDb ? Object.values(usersInDb) : [];
  }, [usersInDb]);

  const searchedUsersToChat: User[] = useMemo(() => {
    return usersInDb ? Object.values(usersInDb) : [];
  }, [usersInDb]);

  const mainData = searched?.current ? searchedUsernames : usernamesData;

  const handleUserSearch = debounce((search: string) => {
    searched.current = search;
  }, 300);


  useEffect(() => {
    if (usersToChat && !searched?.current) {
      setUsernamesData(usersToChat);
    } else if (searchedUsersToChat && searched?.current) {
      setSearchedUsernames(searchedUsersToChat);
    }
  }, [usersToChat, searchedUsersToChat]);

  return (
    <div className={`${scss.new_chat}`}>
      <span className={`xs_title ${scss.chat_title}`}>
        <button
          type="button"
          className="back_btn m0 pseudo_invert"
          onClick={() => toggleNewChat('')}
          aria-label="Back to chat"
        >
          &nbsp;
        </button>
        New Chat
      </span>
      <SearchBar
        className={`list_search ${scss.search_wrap}`}
        placeholder="Search user"
        onChange={(search: string) => {
          handleUserSearch(search);
        }}
      />
      <ul className={scss.account_list}>
        <li className={scss.group}>
          <button type="button" onClick={() => toggleNewChat('group')} aria-label="Create new group">
            New Group
          </button>
        </li>
      </ul>
      <ul className={scss.contact_list} id="chat__inbox__main__new__user__list">
        {(!mainData || mainData.length === 0) ? (
          <CircularProgressLoader className={scss.list_loader} />
        ) : (
          <InfiniteScroll
            dataLength={mainData?.length || 0}
            next={() => null}
            hasMore={false}
            className="overflow_unset"
            loader={<CircularProgressLoader />}
            scrollableTarget="chat__inbox__main__new__user__list"
          >
            {Array.isArray(mainData) && mainData.length > 0 ? mainData.map((userNameData: User) => (userNameData.id !== currentUserId ? (
              <NewChatUserCard key={userNameData.id} inboxData={inboxData} roomData={roomData} chatData={chatData} id={userNameData.id} name={userNameData.name} handleNewChat={handleNewChat} img="" />
            ) : null)) : null}
          </InfiniteScroll>
        )}
      </ul>
    </div>
  );
};

export default NewChat;
