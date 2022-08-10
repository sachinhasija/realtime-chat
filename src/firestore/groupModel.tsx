/* eslint-disable class-methods-use-this */
import {
  doc, collection, setDoc, onSnapshot, DocumentData, getDoc, deleteDoc,
} from 'firebase/firestore';
import { ChatRoomMemberData, GroupData, MessageData } from '../interfaces/firestore';
import FirestoreModel, { TopLevelCollections } from './firestoreModel';
import InboxModel from './inboxModel';
import MessagesModel from './messagesModel';
import RoomModel from './roomModel';

class GroupModel extends FirestoreModel {
  private main: string;

  private collection: string;

  constructor() {
    super();

    this.main = TopLevelCollections.MAIN;
    this.collection = TopLevelCollections.GROUP;
  }

  public async addGroup(data: GroupData, members: { [userId: string]: { userId: string, name: string } }, currentUserInfo: { name: string, id: string }) {
    const groupRefId = doc(collection(this.store, this.main)).id;
    const groupData = { ...data };
    groupData.groupId = groupRefId;
    setDoc(doc(this.store, `${this.main}/${this.collection}/${groupRefId}`, 'groupInfo'), groupData);
    const inboxModel = new InboxModel();
    inboxModel.createInboxForGroup(groupRefId, members);
    const newMessageRef = doc(collection(this.store, `${this.main}/${this.collection}/${groupRefId}`));
    const initialMessageData = {
      messageId: newMessageRef.id,
      messageRoomId: groupRefId,
      receiverId: groupRefId,
      chatRoomMembers: members,
      type: 'header',
      senderId: currentUserInfo.id,
      senderName: currentUserInfo.name,
      text: `${currentUserInfo.name} created this group`,
      highlightedKeys: currentUserInfo.name,
      group: groupData,
    };
    const roomModelObject = new RoomModel();
    roomModelObject.createRoomForGroup(initialMessageData);
    const messageModelObject = new MessagesModel();
    messageModelObject.sendInitialMessages(initialMessageData);
  }

  public updateGroup(imageUrl: string, name: string, group: GroupData, currentUser: { id: string, name: string }) {
    const newGroupData = { ...group };
    let shouldEdit = false;
    const MessageModelObj = new MessagesModel();

    if (imageUrl !== group.image) {
      newGroupData.image = imageUrl;
      shouldEdit = true;
      MessageModelObj.sendEditedGroupMessage('', imageUrl, group, currentUser);
    }
    if (name !== group.name) {
      newGroupData.name = name;
      shouldEdit = true;
      MessageModelObj.sendEditedGroupMessage(name, '', group, currentUser);
    }
    if (shouldEdit) {
      const roomRef = doc(this.store, `${this.main}/${this.collection}/${group.groupId}`, 'groupInfo');
      setDoc(roomRef, newGroupData, { merge: true });
    }
    // if let image = imageUrl {
    //     updateDict[FirebaseKeys.image.rawValue] = image
    //     sendEditGroupImageMessage(groupId, group: group)
    // }
    // if let name = name {
    //     updateDict[FirebaseKeys.name.rawValue] = name
    //     sendEditedGroupNameMessage(groupId, name, group: group)
    // }
  }

  // public deleteGroup(groupId: string) {
  //   return deleteDoc(doc(this.store, `${this.main}/${this.collection}`, `${groupId}`));
  // }

  public async groupExists(groupId: string) {
    const docRef = doc(this.store, `${this.main}/${this.collection}/${groupId}`, 'groupInfo');
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  }

  public addGroupListener(groupId: string, updateGroupData: (data: DocumentData | undefined) => null) {
    const unsubscribe = onSnapshot(doc(this.store, `${this.main}/${this.collection}/${groupId}`, 'groupInfo'), (d) => {
      updateGroupData(d.data());
    });
    return unsubscribe;
  }

  public async addParticipants(users: { name: string, userId: string }[], group: GroupData, currentUser: { id: string, name: string }) {
    const InboxModelObj = new InboxModel();
    const MessageModelObj = new MessagesModel();
    const { groupId } = group;

    InboxModelObj.createInboxForGroup(groupId, users);
    const defaultMemberData = {
      admin: false,
      image: '',
      memberDelete: `${+new Date()}`,
      memberId: '',
      memberJoin: `${+new Date()}`,
      memberLeave: '',
      memberName: '',
      muted: false,
      typing: false,
      unreadCount: 0,
    };
    const roomMembersData: { [userId: string]: ChatRoomMemberData } = {};
    const RoomModelObj = new RoomModel();

    users.forEach((user) => {
      const data = { ...defaultMemberData };
      data.memberName = user.name;
      data.memberId = user.userId;
      roomMembersData[user.userId] = data;
    });

    RoomModelObj.updateRoom(group.groupId, { chatRoomMembers: { ...roomMembersData } });
    await MessageModelObj.sendMemberAddMessage(users, group, currentUser);
    return true;
  }

  public removeParticipant(userId: string, userName: string, group: GroupData, chatRoomMembers: { [userId: string]: ChatRoomMemberData }, currentUser: { id: string, name: string }) {
    if (chatRoomMembers?.[userId]) {
      const InboxModelObj = new InboxModel();
      InboxModelObj.deleteUserFromInbox(userId, group.groupId);
      const RoomModelObj = new RoomModel();
      const newChatMembersData = { ...chatRoomMembers };
      delete newChatMembersData[userId];
      RoomModelObj.updateChatLastMember(group.groupId, newChatMembersData);
      const MessageModelObj = new MessagesModel();
      MessageModelObj.sendRemovedFromGroupMessage(userName, group, currentUser);
    }
  }

  public leaveGroup(userId: string, userName: string, group: GroupData, chatRoomMembers: { [userId: string]: ChatRoomMemberData }, currentUser: { id: string, name: string }, isAdmin: boolean | undefined, firstMember: ChatRoomMemberData | null) {
    if (chatRoomMembers?.[userId]) {
      const InboxModelObj = new InboxModel();
      InboxModelObj.deleteUserFromInbox(userId, group.groupId);
      const RoomModelObj = new RoomModel();
      const newChatMembersData = { ...chatRoomMembers };
      delete newChatMembersData[userId];
      let deleteAll = false; let
        updateAdmin = false;
      if (isAdmin) {
        if (firstMember) {
          updateAdmin = true;
        } else {
          deleteAll = true;
        }
      }
      if (!deleteAll) {
        if (updateAdmin && firstMember?.memberId) {
          newChatMembersData[firstMember.memberId].admin = true;
        }
        RoomModelObj.updateChatLastMember(group.groupId, newChatMembersData);
        const MessageModelObj = new MessagesModel();
        MessageModelObj.sendLeftGroupMessage(userName, group, currentUser);
      } else {
        RoomModelObj.deleteRoom(group.groupId);
        // this.deleteGroup(group.groupId);
      }
    }
  }
}

export default GroupModel;
