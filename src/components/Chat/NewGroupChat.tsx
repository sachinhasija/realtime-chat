/* eslint-disable jsx-a11y/label-has-associated-control */
import React, { useState, useEffect, useRef, useMemo } from 'react';
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
// import avatar from 'assets/images/ic-avatar-placeholder.svg';
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
  usersInDb: { [userId: string]: User } | null
  toggleNewChat: (type: string) => void
  //   handleNewChat: (data: NewChatData) => null
  //   inboxData: Map<string, string> | null,
  //   roomData: { [roomId: string]: Room; } | null
  //   chatData: {[userId: string]: User} | null
}

const NewGroupChat = ({
  currentUserInfo, usersInDb, toggleNewChat,
}: Props) => {
  const searched = useRef('');
  const [usernamesData, setUsernamesData] = useState<null | User[]>(null);
  const [searchedUsernames, setSearchedUsernames] = useState<null | User[]>(null);
  const [selectedUsersGroup, setSelectedUsersGroup] = useState<{ [userId: string]: { userId: string, name: string } } | null>(null);

  const mainData = searched?.current ? searchedUsernames : usernamesData;

  const [type, setType] = useState('members');

  const handleUserSearch = debounce((search: string) => {
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
    if (usersInDb) {
      setUsernamesData(Object.values(usersInDb));
    }
  }, [usersInDb]);

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
              {((!usernamesData || usernamesData?.length === 0)) && !searched.current ? (
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
                  {Array.isArray(mainData) && mainData.length > 0 ? mainData.map((userNameData: User) => (userNameData.id !== currentUserInfo.id ? (
                    <ForwardUser key={userNameData.id} isGroup={false} selectedForwardMessageUser={selectedUsersGroup} name={userNameData.name || ''} userId={userNameData.id} handleUserSelect={handleUserSelect} />
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
