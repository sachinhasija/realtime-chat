/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { useState, useEffect, useRef } from 'react';
import CircularProgressLoader from 'components/Loaders/CircularProgress';
import SearchBar from 'components/SearchBar';
// import FieldCheckbox from 'components/FieldCheckbox';
// import {
//   Room, NewChatData, User, GroupData,
// } from 'interfaces/firestore';
import { debounce } from 'lodash';
import Carousel from 'components/Carousel/Carousel';
import InfiniteScroll from 'react-infinite-scroll-component';
// import addImg from 'assets/images/add.svg';
// import avatar from 'assets/images/ic_avatar_placeholder.svg';
// import placeholder from 'assets/images/image-placeholder.svg';
import classNames from 'classnames';
import NewGroupChatForm from 'forms/NewGroupChatForm';
// import {
//   FormControl, Menu, MenuItem, Button as MenuButton,
// } from '@mui/material';
// import Checkbox from '@mui/material/Checkbox';
import GroupModel from 'firestore/groupModel';
import { User } from 'interfaces/firestore';
import ForwardUser from './common/ForwardUser';
import scss from './Chat.module.scss';
import forwardUser from './common/ForwardUser.module.scss';
import ForwardSelectedUser from './common/ForwardSelectedUser';

interface PeopleData {
  page?: number,
  search?: string
  limit?: number,
}

interface Props {
  currentUserInfo: { id: string, name: string },
  toggleNewChat: (type: string) => void
  //   handleNewChat: (data: NewChatData) => null
  //   inboxData: Map<string, string> | null,
  //   roomData: { [roomId: string]: Room; } | null
  //   chatData: {[userId: string]: User} | null
}

const NewGroupChat = ({
  currentUserInfo, toggleNewChat,
}: Props) => {
  const usersToChat: User[] = [];
  const searchedUsersToChat: User[] = [];
  const searched = useRef('');
  const [usernamesData, setUsernamesData] = useState<null | Record<string, unknown>[]>(null);
  const [searchedUsernames, setSearchedUsernames] = useState<null | User[]>(null);
  const [selectedUsersGroup, setSelectedUsersGroup] = useState<{ [userId: string]: { userId: string, name: string } } | null>(null);
  const [pageData, setPageData] = useState({ allUserNames: { page: 1, hasMoreData: false }, searchedUserName: { page: 1, hasMoreData: false } });

  const mainData = searched?.current ? searchedUsernames : usernamesData;

  const [type, setType] = useState('members');

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
    fetchMoreData(30, 1);
  }, 300);

  const handleGroupFormSubmit = (data: { groupName: string, channelIconImage: string }) => {
    const GroupModelObj = new GroupModel();
    if (selectedUsersGroup && !selectedUsersGroup[currentUserInfo.id]) {
      selectedUsersGroup[currentUserInfo.id] = { userId: currentUserInfo.id, name: currentUserInfo.name };
    }
    if (selectedUsersGroup) {
      GroupModelObj.addGroup({
        name: data.groupName,
        image: data.channelIconImage,
        createdAt: `${+new Date()}`,
        groupId: '',
      }, selectedUsersGroup, currentUserInfo);
      toggleNewChat('');
    }
  };

  const handleBack = (t: string) => {
    setType(t);
  };

  const handleRemoveSelectedUser = (userId: string) => {
    const newUserObj = { ...selectedUsersGroup };
    delete newUserObj[userId];
    setSelectedUsersGroup(newUserObj);
    return null;
  };

  const handleUserSelect = (userData: { userId: string, name: string }, value: boolean) => {
    if (value && (!selectedUsersGroup || Object.values(selectedUsersGroup).length < 101)) {
      setSelectedUsersGroup((prevSelectedUsers) => (prevSelectedUsers ? { ...prevSelectedUsers, [userData.userId]: userData } : { [userData.userId]: userData }));
    } else {
      const newUserObj = { ...selectedUsersGroup };
      delete newUserObj[userData.userId];
      setSelectedUsersGroup(newUserObj);
    }
    return null;
  };

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

  useEffect(() => {
    if (usersToChat && !searched?.current) {
      // setUsernamesData(usersToChat);
    } else if (searchedUsersToChat && searched?.current) {
      setSearchedUsernames(searchedUsersToChat);
    }
  }, [usersToChat, searchedUsersToChat]);

  return (
    <div className={`${scss.new_chat}`}>
      {type === 'members' ? (
        <>
          <span className={`xs_title ${scss.chat_title}`}>
            <button
              type="button"
              className="back_btn m0 pseudo_invert"
              onClick={() => toggleNewChat('')}
              aria-label="Back"
            >
              &nbsp;
            </button>
            New Group Chat
          </span>
          <div>
            <SearchBar
              className={`list_search ${scss.search_wrap}`}
              placeholder="Search user"
              onChange={(search: string) => {
                handleUserSearch(search);
              }}
            />
            {selectedUsersGroup && Object.values(selectedUsersGroup).length > 0 ? (
              <>
                <hr className={scss.horizontal_break} />
                <Carousel
                  className={classNames(forwardUser.forward_list, scss.forward_selected_wrap)}
                  itemCount={{
                    desktop: 4,
                    tablet: 3,
                    mobile: 3,
                    smMobile: 3,
                    xsMobile: 3,
                  }}
                  draggable
                  arrows={false}
                >
                  {Object.values(selectedUsersGroup).map((selecteduserObj: { userId: string, name: string }) => (
                    <ForwardSelectedUser key={selecteduserObj.userId} name={selecteduserObj.name} id={selecteduserObj.userId} handleRemoveUser={handleRemoveSelectedUser} />
                  ))}
                </Carousel>
                <hr className={scss.horizontal_break} />
              </>
            ) : null}
            <ul className={classNames(scss.contact_list, scss.group_list, forwardUser.forward_user_list)} id="chat__message__forward__user__list">
              {((!searchedUsernames || searchedUsernames?.length === 0)) || ((!usernamesData || usernamesData?.length === 0)) ? (
                <CircularProgressLoader className={scss.list_loader} />
              ) : (
                <InfiniteScroll
                  dataLength={mainData?.length || 0}
                  next={fetchMoreData}
                  hasMore={searched.current ? pageData.searchedUserName.hasMoreData : pageData.allUserNames.hasMoreData}
                  className="overflow_unset"
                  loader={<CircularProgressLoader className={scss.list_loader} />}
                  scrollableTarget="chat__message__forward__user__list"
                >
                  {Array.isArray(mainData) && mainData.length > 0 ? mainData.map((userNameData: any) => (userNameData.id !== currentUserInfo.id && userNameData._id !== currentUserInfo.id ? (
                    <ForwardUser key={userNameData._id || userNameData.id} isGroup={false} selectedForwardMessageUser={selectedUsersGroup} name={userNameData.username || userNameData.fullName || ''} userId={userNameData._id || userNameData.id} handleUserSelect={handleUserSelect} />
                  ) : null)) : null}
                </InfiniteScroll>
              )}
            </ul>
            <div className={scss.action_wrap}>
              <button type="button" aria-label="Click to move to next step" className={`fill_red_btn btn-effect ${scss.next_btn}`} onClick={() => handleBack('form')}>
                Next
              </button>
            </div>
          </div>
        </>
      ) : <NewGroupChatForm handleFormSubmit={handleGroupFormSubmit} handleBack={handleBack} />}
    </div>
  );
};

export default NewGroupChat;
