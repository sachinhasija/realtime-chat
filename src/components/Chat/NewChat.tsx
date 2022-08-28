import React, { useState, useEffect, useRef } from 'react';
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
  toggleNewChat: (type: string) => void
  handleNewChat: (data: NewChatData) => null
  inboxData: Map<string, string> | null,
  roomData: { [roomId: string]: Room; } | null
  chatData: { [userId: string]: User } | null
}

const NewChat = ({
  currentUserId, toggleNewChat, handleNewChat, inboxData, roomData, chatData,
}: Props) => {
  const usersToChat: User[] = [];
  const searchedUsersToChat: User[] = [];
  const searched = useRef('');
  const [pageData, setPageData] = useState({ allUserNames: { page: 1, hasMoreData: false }, searchedUserName: { page: 1, hasMoreData: false } });
  const [usernamesData, setUsernamesData] = useState<null | User[]>(null);
  const [searchedUsernames, setSearchedUsernames] = useState<null | User[]>(null);

  const mainData = searched?.current ? searchedUsernames : usernamesData;

  const fetchMoreData = (limit?: number, pageNumber?: number) => {
    const payload: PeopleData = { limit: limit ?? 30 };
    if (searched.current) {
      payload.page = pageNumber || pageData.searchedUserName.page;
      payload.search = searched.current;
    } else {
      payload.page = pageNumber || pageData.allUserNames.page;
    }
    return null;
  };

  const handleUserSearch = debounce((search: string) => {
    searched.current = search;
    // dispatch(resetChatSearchData());
    fetchMoreData(30, 1);
  }, 300);

  useEffect(() => {
    if (!usersToChat) {
      fetchMoreData(30);
    }
  }, [usersToChat]);

  useEffect(() => {
    if (usersToChat && !searched?.current) {
      // setUsernamesData(usersToChat);
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
        {(!searchedUsernames || searchedUsernames?.length === 0) || (!usernamesData || usernamesData?.length === 0) ? (
          <CircularProgressLoader className={scss.list_loader} />
        ) : (
          <InfiniteScroll
            dataLength={mainData?.length || 0}
            next={() => fetchMoreData(30)}
            hasMore={searched.current ? pageData.searchedUserName.hasMoreData : pageData.allUserNames.hasMoreData}
            className="overflow_unset"
            loader={<CircularProgressLoader />}
            scrollableTarget="chat__inbox__main__new__user__list"
          >
            {Array.isArray(mainData) && mainData.length > 0 ? mainData.map((userNameData: any) => (userNameData.id !== currentUserId && userNameData._id !== currentUserId ? (
              <NewChatUserCard key={userNameData._id || userNameData.id} inboxData={inboxData} roomData={roomData} chatData={chatData} id={userNameData._id || userNameData.id} name={userNameData.username || userNameData.fullName || ''} handleNewChat={handleNewChat} img="https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500" />
            ) : null)) : null}
          </InfiniteScroll>
        )}
      </ul>
    </div>
  );
};

export default NewChat;
