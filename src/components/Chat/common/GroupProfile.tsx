import React, {
  useEffect, useMemo, useRef, useState,
} from 'react';
import {
  NewChatData, MessageData, User, Room, ChatRoomMemberData,
} from 'interfaces/firestore';
import cross from 'assets/images/chat-cross.svg';
import back from 'assets/images/ic-back.svg';
import DotsLoader from 'components/Loaders/DotsLoader';
import videoPlay from 'assets/images/icon-feather-play.svg';
import classNames from 'classnames';
import InfiniteScroll from 'react-infinite-scroll-component';
import Carousel from 'components/Carousel/Carousel';
import SearchBar from 'components/SearchBar';
import channelImage from 'assets/images/image-placeholder.svg';
import add from 'assets/images/new-msg.png';
import ModalComponent from 'components/Modal/index';
import MessagesModel from 'firestore/messagesModel';
import Image from 'components/Image';
import placeholderImage from 'assets/images/ic-avatar-placeholder.svg';
import editIcon from 'assets/images/edit_icon.svg';
import moment from 'moment';
import GroupModel from 'firestore/groupModel';
import { debounce } from 'lodash';
import RoomModel from 'firestore/roomModel';
import { Unsubscribe } from 'firebase/firestore';
import ForwardSelectedUser from './ForwardSelectedUser';
import MediaViewer from './MediaViewer';
import ForwardUser from './ForwardUser';
import CircularProgressLoader from 'components/Loaders/CircularProgress';
import scss from './UserProfile.module.scss';
import forwardUserScss from './ForwardUser.module.scss';

interface PeopleData {
  page?: number,
  search?: string
  limit?: number,
}

interface Props {
  chatInfo: NewChatData
  roomData: Room
  currentUserInfo: { id: string, name: string },
  chatData: { [userId: string]: User } | null
  onRoomMessageReset: (roomId: string) => void,
  handleDeletedRoomId: (roomId: string) => void
  handleNewChat: (data: null) => null
  handleMediaOpen: (value: boolean) => void
  handleGroupInfoToggle: () => void
}

const GroupProfile = ({
  chatInfo, currentUserInfo, chatData, handleGroupInfoToggle, handleMediaOpen, roomData, handleNewChat, handleDeletedRoomId, onRoomMessageReset,
}: Props) => {
  const usersToChat: User[] = [];
  const searchedUsersToChat: User[] = [];
  const [editGroup, setEditGroup] = useState(false);
  const data = chatData?.[chatInfo?.roomId ?? ''];
  const [media, setMedia] = useState<Map<string, MessageData> | null>(null);
  const [expandMedia, setExpandMedia] = useState(false);
  const [showMoreParticipants, setShowMoreParticipants] = useState(false);
  const [selectedMediaId, setSelectedMediaId] = useState('');
  const [addingParticipants, setAddingParticipants] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState<{ [userId: string]: { userId: string, name: string } } | null>(null);
  const searched = useRef('');
  const [pageData, setPageData] = useState({ allUserNames: { page: 1, hasMoreData: false }, searchedUserName: { page: 1, hasMoreData: false } });
  const [usernamesData, setUsernamesData] = useState<null | User[]>(null);
  const [searchedUsernames, setSearchedUsernames] = useState<null | User[]>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<ChatRoomMemberData | null>(null);
  const mediaUnsubscribeEvent = useRef<Unsubscribe | null>(null);

  const { participants, firstMember, currentAdminId } = useMemo(() => {
    const members = roomData?.chatRoomMembers ? Object.values(roomData?.chatRoomMembers) : [];
    let adminId = '';
    members.sort((a: ChatRoomMemberData, b: ChatRoomMemberData) => (a.memberName && b.memberName && a.memberName.toLocaleLowerCase() > b.memberName.toLocaleLowerCase() ? 1 : -1));
    members.forEach((member: ChatRoomMemberData, i: number) => {
      if (member.admin) {
        adminId = member.memberId ?? '';
        members.splice(i, 1);
        members.unshift(member);
      }
    });
    let first: null | ChatRoomMemberData = null;
    members.forEach((member: ChatRoomMemberData) => {
      if (!member.admin) {
        if (!first) {
          first = member;
        } else if (Number(member.memberJoin) < Number(first.memberJoin)) {
          first = member;
        }
      }
    });
    return { participants: members, firstMember: first, currentAdminId: adminId };
  }, [roomData?.chatRoomMembers]);

  const mainData = searched?.current ? searchedUsernames : usernamesData;

  const participantsNotAdded = useMemo(() => {
    if (participants.length > 0 && mainData) {
      const ids: string[] = [];
      participants.forEach((user) => (user.memberId ? ids.push(user.memberId) : ''));
      return mainData.filter((d) => {
        const id: string = d.id;
        return !ids.includes(id);
      });
    }
    return [];
  }, [participants, mainData]);

  const currentUserRoomData = roomData?.chatRoomMembers?.[currentUserInfo.id];
  const isAdmin = currentUserRoomData?.admin;

  // modal
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<null | string>(null);

  const handleModalClose = () => {
    setShowModal(false);
    setModalType(null);
    handleMediaOpen(false);
    setAddingParticipants(false);
    setSelectedParticipant(null);
    searched.current = '';
    return null;
  };

  const toggleShowMoreParticipants = () => {
    setShowMoreParticipants((prev) => !prev);
  };

  const handleMediaExpand = (value: boolean) => {
    setExpandMedia(value);
  };

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

  const handleMediaView = (messageId: string) => {
    setSelectedMediaId(messageId);
    setModalType('media');
    handleMediaOpen(true);
    setShowModal(true);
  };

  const handleUserSelect = (userData: { userId: string, name: string, isGroup: boolean }, value: boolean) => {
    if (value && (!selectedParticipants || Object.values(selectedParticipants).length <= 100)) {
      setSelectedParticipants((prevSelectedUsers) => (prevSelectedUsers ? { ...prevSelectedUsers, [userData.userId]: userData } : { [userData.userId]: userData }));
    } else {
      const newUserObj = { ...selectedParticipants };
      delete newUserObj[userData.userId];
      setSelectedParticipants(newUserObj);
    }
    return null;
  };

  const handleRemoveSelectedParticipants = (userId: string) => {
    const newUserObj = { ...selectedParticipants };
    delete newUserObj[userId];
    setSelectedParticipants(newUserObj);
    return null;
  };

  const handleAddParticipants = async () => {
    if (currentUserInfo?.id && selectedParticipants && Object.values(selectedParticipants).length > 0) {
      setAddingParticipants(true);
      const GroupModelObj = new GroupModel();
      const groupData = {
        name: data?.name ?? '',
        image: data?.image ?? '',
        createdAt: data?.createdAt ?? '',
        groupId: data?.id ?? '',
      };
      await GroupModelObj.addParticipants(Object.values(selectedParticipants), groupData, currentUserInfo);
      setAddingParticipants(false);
      setSelectedParticipants(null);
      handleModalClose();
    }
  };

  const handleBack = () => {
    setEditGroup(false);
  };

  const handleGroupFormSubmit = (values: { channelIconImage: string, groupName: string }) => {
    const groupData = {
      name: data?.name ?? '',
      image: data?.image ?? '',
      createdAt: data?.createdAt ?? '',
      groupId: data?.id ?? '',
    };
    const GroupModelObj = new GroupModel();
    if (groupData.groupId && groupData.name && groupData.createdAt && groupData.image && currentUserInfo.id && currentUserInfo.name) {
      GroupModelObj.updateGroup(values.channelIconImage, values.groupName, groupData, currentUserInfo);
    }
    handleBack();
  };

  const handleParticipantRemove = () => {
    const GroupModelObj = new GroupModel();
    const groupData = {
      name: data?.name ?? '',
      image: data?.image ?? '',
      createdAt: data?.createdAt ?? '',
      groupId: data?.id ?? '',
    };
    if (selectedParticipant && selectedParticipant.memberId && selectedParticipant.memberName && roomData?.chatRoomMembers) {
      GroupModelObj.removeParticipant(selectedParticipant.memberId, selectedParticipant.memberName, groupData, roomData?.chatRoomMembers, currentUserInfo);
    }
    handleModalClose();
  };

  const handleGroupLeave = () => {
    const GroupModelObj = new GroupModel();
    const groupData = {
      name: data?.name ?? '',
      image: data?.image ?? '',
      createdAt: data?.createdAt ?? '',
      groupId: data?.id ?? '',
    };
    if (currentUserInfo && currentUserInfo.id && roomData?.chatRoomMembers) {
      GroupModelObj.leaveGroup(currentUserInfo.id, currentUserInfo.name, groupData, roomData?.chatRoomMembers, currentUserInfo, isAdmin, firstMember);
      handleDeletedRoomId(groupData.groupId);
    }
    handleModalClose();
    handleNewChat(null);
  };

  const handleClearConversation = () => {
    const currentUserId = currentUserInfo?.id;
    const roomId = roomData?.chatRoomId;
    if (currentUserId && roomId) {
      const RoomModelObj = new RoomModel();
      const updatedDeleteTime = {
        chatRoomMembers: {
          [currentUserId]: {
            memberDelete: `${+new Date()}`,
          },
        },
      };
      RoomModelObj.updateRoom(roomId, updatedDeleteTime);
      onRoomMessageReset(roomId);
    }
    handleModalClose();
  };

  const handleFormSubmit = () => {
    // handleGroupFormSubmit();
  }

  const modalContent = () => {
    const selectedIndex = media ? Array.from(media).findIndex((msgData: [string, MessageData]) => msgData?.[1]?.messageId === selectedMediaId) : -1;

    if (modalType === 'media' && media && selectedIndex !== -1 && typeof selectedIndex !== 'undefined') {
      return (
        <MediaViewer selectedIndex={selectedIndex} data={media ? Array.from(media) : []} />
      );
    } if (modalType === 'reportUser') {
      return (
        <div className="report_user_modal">
          <span className="xs_title m_title">
            Report
          </span>
          <span className="xs_title report_title">
            Why are you reporting this?
          </span>
          {/* <ReportForm reasons={profileReasons} handleFormSubmit={(data: { reason: string, reasonDescription: string }) => handleUserReport(data)} actionType="Report" reportChannelLoading={reportingUser} errorMsg={typeof reportUserError?.message === 'string' ? reportUserError.message : ''} handleModalClose={handleModalClose} /> */}
        </div>
      );
    } if (modalType === 'reportSuccess') {
      return (
        <>
          <div className="success_popup">
            <span className="sub_title">Thanks for letting us know</span>
            <p className="common_para">Your feedback is important in keeping the community safe.</p>
            <button className="fill_red_btn btn-effect only_child" onClick={handleModalClose} aria-label="Close">
              ok
            </button>
          </div>
        </>
      );
    } if (modalType === 'addParticipants') {
      return (
        <div>
          <span className="xs_title m_title">
            Add participants
          </span>
          {selectedParticipants && Object.values(selectedParticipants).length > 0 ? (
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
              {Object.values(selectedParticipants).map((selecteduserObj: { userId: string, name: string }) => (
                <ForwardSelectedUser key={selecteduserObj.userId} name={selecteduserObj.name} id={selecteduserObj.userId} handleRemoveUser={handleRemoveSelectedParticipants} />
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
            {((!searchedUsernames || searchedUsernames?.length === 0)) || ((!usernamesData || usernamesData?.length === 0)) ? (
              <CircularProgressLoader />
            ) : (
              <InfiniteScroll
                dataLength={participantsNotAdded?.length || 0}
                next={fetchMoreData}
                hasMore={searched.current ? pageData.searchedUserName.hasMoreData : pageData.allUserNames.hasMoreData}
                className="overflow_unset"
                loader={<CircularProgressLoader />}
                scrollableTarget="chat__message__forward__user__list"
              >
                {Array.isArray(participantsNotAdded) && participantsNotAdded.length > 0 ? participantsNotAdded.map((userNameData: any) => (userNameData.id !== currentUserInfo.id && userNameData._id !== currentUserInfo.id ? (
                  <ForwardUser key={userNameData._id || userNameData.id} isGroup={false} selectedForwardMessageUser={selectedParticipants} name={userNameData.username || userNameData.fullName || ''} userId={userNameData._id || userNameData.id} handleUserSelect={handleUserSelect} />
                ) : null)) : null}
              </InfiniteScroll>
            )}

          </div>
          <div className="f_center">
            <button className="fill_red_btn btn-effect btn" aria-label="Click to add participants to group" disabled={!(selectedParticipants && Object.values(selectedParticipants).length > 0)} onClick={handleAddParticipants}>{addingParticipants ? <DotsLoader /> : 'Add'}</button>
          </div>
        </div>
      );
    } if (modalType === 'leaveGroup') {
      return (
        <>
          <div className="success_popup">
            <span className="sub_title">
              Leave group
            </span>
            <p className="common_para">
              Do you really want to leave this group?
            </p>
            <div className="f_center">
              <button
                type="button"
                className="fill_red_btn btn-effect btn"
                onClick={handleGroupLeave}
                aria-label="Click to leave this group"
              >
                Yes
              </button>
              <button type="button" className="outline_btn btn-effect btn" onClick={handleModalClose} aria-label="Close">
                Cancel
              </button>
            </div>
          </div>
        </>
      );
    } if (modalType === 'removeUser' && selectedParticipant) {
      return (
        <>
          <div className="success_popup">
            <span className="sub_title">
              Remove User
            </span>
            <p className="common_para">
              Do you really want to remove
              <strong>{` ${selectedParticipant.memberName} `}</strong>
              from the group?
            </p>
            <div className="f_center">
              <button
                type="button"
                className="fill_red_btn btn-effect btn"
                onClick={handleParticipantRemove}
                aria-label={`Remove ${selectedParticipant.memberName} from this group`}
              >
                Yes
              </button>
              <button type="button" className="outline_btn btn-effect btn" onClick={handleModalClose} aria-label="Close">
                Cancel
              </button>
            </div>
          </div>
        </>
      );
    } if (modalType === 'clearConversation') {
      return (
        <>
          <div className="success_popup">
            <span className="sub_title">
              Clear Conversation
            </span>
            <p className="common_para">
              Confirm
            </p>
            <div className="f_center">
              <button
                type="button"
                className="fill_red_btn btn-effect btn"
                onClick={handleClearConversation}
                aria-label="Clear conversation"
              >
                Yes
              </button>
              <button type="button" className="outline_btn btn-effect btn" onClick={handleModalClose} aria-label="Close">
                Cancel
              </button>
            </div>
          </div>
        </>
      );
    }
    return null;
  };

  useEffect(() => {
    if (modalType === 'addParticipants' && !usersToChat) {
      fetchMoreData(30);
    }
  }, [usersToChat, modalType]);

  useEffect(() => () => {
    if (mediaUnsubscribeEvent.current) {
      mediaUnsubscribeEvent.current();
    }
  }, []);

  useEffect(() => {
    const unsubscribe: Unsubscribe | null = mediaUnsubscribeEvent.current;
    let mounted = true;

    const updateMediaData = (mediaData: Map<string, MessageData>) => {
      if (mediaData && mounted) {
        setMedia(mediaData);
      }
      return null;
    };
    if (chatInfo?.roomId && currentUserInfo?.id) {
      if (unsubscribe) {
        unsubscribe();
      }
      const MessagesModelObject = new MessagesModel();
      mediaUnsubscribeEvent.current = MessagesModelObject.addMediaMessagesListener(chatInfo.roomId, updateMediaData, currentUserInfo?.id);
    }
    return () => {
      mounted = false;
    };
  }, [chatInfo, currentUserInfo]);

  useEffect(() => {
    if (usersToChat && !searched?.current) {
      setUsernamesData(usersToChat);
    } else if (searchedUsernames && searched?.current) {
      setSearchedUsernames(searchedUsersToChat);
    }
  }, [usersToChat, searchedUsersToChat]);

  //   useEffect(() => {
  //     if (reportUserSuccess) {
  //       setModalType('reportSuccess');
  //       setShowModal(true);
  //       dispatch(reportUserDataClear());
  //     }
  //   }, [reportUserSuccess, reportUserDataClear, dispatch]);

  return (
    <div className={`sidenav ${scss.contact_nav} ${expandMedia ? scss.media_nav : ''}`}>

      {expandMedia && media ? (
        <>
          <div className={scss.close_btn_wrapper}>
            <button type="button" onClick={() => handleMediaExpand(false)} className={scss.cross} aria-label="Media screen back button">
              <img src={back} alt="media screen back button" className="invert" role="presentation" />
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
                        aria-label="Click to view this media"
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
      ) : !editGroup ? (
        <>
          <div className={scss.close_btn_wrapper}>
            <button type="button" onClick={handleGroupInfoToggle} className={scss.cross} aria-label="Close this group information popup">
              <img src={cross} className="invert" alt="cross" />
            </button>
            <span className={`xs_title ${scss.contact_head}`}>Group Info</span>
          </div>
          <div className={`inner ${scss.contact_info}`}>
            <div className="text-center relative">
              <figure className={classNames(scss.u_img, scss.group_icon)}>
                <Image src={data?.image ?? placeholderImage} fallbackSrc={placeholderImage} className={!data?.image ? 'invert placeholder_img' : ''} alt={`group ${data?.name}`} />
              </figure>
              <span className={`xs_title ${scss.name}`}>{data?.name}</span>
              {data?.createdAt ? (
                <p className={scss.created_on}>
                  Created on
                  {' '}
                  {`${moment(Number(data.createdAt)).format('DD MMMM YYYY')}`}
                </p>
              ) : null}
              {isAdmin ? (
                <button
                  className={scss.edit_group}
                  onClick={() => setEditGroup(true)}
                  type="button"
                  aria-label="Edit group information"
                >
                  <img src={editIcon} className="invert" alt="" role="presentation" />
                  <span>Edit</span>
                </button>
              ) : null}
            </div>
            {media ? (
              <div className={scss.media_wrap}>
                <div className={scss.media_header}>
                  <h3>Media</h3>
                  <button type="button" aria-label="View all media" className={`link ${scss.view_all}`} onClick={() => handleMediaExpand(true)}>
                    View all
                    <i className={scss.icon}>&nbsp;</i>
                  </button>
                </div>
                <div className={classNames(scss.media_row)}>
                  {Array.from(media).map((msgData: [string, MessageData]) => (
                    <div className={scss.media_col} key={msgData[1].messageId}>
                      {(msgData[1].type === 'image' || msgData[1].type === 'video') && msgData[1].mediaUrl ? (
                        <button
                          type="button"
                          className={classNames(scss.media_cover, msgData[1].type === 'video' ? scss.video : '')}
                          aria-label="Click to view media"
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
            {participants.length > 0 ? (
              <div className={scss.participants_wrapper}>
                <div className={scss.participants_head}>
                  <h3>
                    {participants.length}
                    {' '}
                    Participants
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setModalType('addParticipants');
                      setShowModal(true);
                    }}
                    aria-label="Click to add participants to this group"
                  >
                    <img src={add} className="invert" alt="Add participants" />
                    <span>Add</span>
                  </button>
                </div>
                <ul className={classNames(scss.participants_list, { [scss.show_all_participants]: showMoreParticipants })}>
                  {participants.map((participant) => (participant?.memberId ? (
                    <li key={participant.memberId}>
                      <div className={scss.name_wrap}>
                        <figure>
                          <img src={channelImage} alt="" className="invert" />
                        </figure>
                        <h4>{participant.memberName}</h4>
                      </div>
                      {participant.admin ? (
                        <div className={scss.action}>
                          <span>Admin</span>
                        </div>
                      ) : currentAdminId && currentUserInfo?.id === currentAdminId ? (
                        <div className={scss.action}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedParticipant(participant);
                              setModalType('removeUser');
                              setShowModal(true);
                            }}
                            aria-label={`Remove ${participant.memberName} from this group`}
                          >
                            Remove
                          </button>
                        </div>
                      ) : null}
                    </li>
                  ) : null))}
                </ul>
                {participants.length > 5 ? (
                  <button
                    type="button"
                    className={scss.show_more_btn}
                    onClick={() => {
                      toggleShowMoreParticipants();
                    }}
                    aria-label={`Show ${!showMoreParticipants ? 'more' : 'less'} participants`}
                  >
                    {`Show ${!showMoreParticipants ? 'more' : 'less'}`}
                  </button>
                ) : null}
              </div>
            ) : null}

            <ul className={`listing ${scss.list_chat_options}`}>
              {/* <li>
                <button type="button" className="button" aria-label="Mute this group">
                  <span>Mute</span>
                  <div className={`toggle_switch ${scss.toggle_switch}`}>
                    <MaterialUISwitch {...label} className={scss.switch} checked={switchEnabled} onChange={handleSwitchToggle} />
                  </div>
                </button>
              </li> */}
              <li>
                <button
                  type="button"
                  className="button"
                  onClick={() => {
                    setModalType('clearConversation');
                    setShowModal(true);
                  }}
                  aria-label="Clear group conversation"
                >
                  Clear Conversation
                </button>
              </li>
              {/* <li>
                <button type="button" className="button" aria-label="Report this group">Report</button>
              </li> */}
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setModalType('leaveGroup');
                    setShowModal(true);
                  }}
                  aria-label="Leave this group"
                  className={`button ${scss.leave}`}
                >
                  Leave Group
                </button>
              </li>
            </ul>
          </div>
        </>
      ) : isAdmin ? (
        <form onSubmit={handleFormSubmit}>
          <button type="button" onClick={handleBack}>Go Back</button>
          <input type="text" name="groupName" id="groupName" />
          <button type="submit">Create</button>
        </form>
      ) : null}
      <ModalComponent
        id="user-profile-main-modal"
        isOpen={showModal}
        className={modalType === 'media' ? 'chat_media_modal' : ''}
        onClose={handleModalClose}
        onManageDisableScrolling={() => null}
        showCloseBtn={!(modalType === 'block' || modalType === 'reportSuccess' || modalType === 'reportUser' || modalType === 'clearConversation' || modalType === 'removeUser' || modalType === 'leaveGroup')}
      >
        <div className="chat_media_inner">
          {modalContent()}
        </div>
      </ModalComponent>
    </div>
  );
};

export default GroupProfile;
