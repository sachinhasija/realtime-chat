/* eslint-disable no-await-in-loop */
import {
  doc, collection, query, limit, orderBy, where, onSnapshot, setDoc, QueryDocumentSnapshot, getDocs, writeBatch, startAt, DocumentData, endBefore, deleteDoc, getDoc,
} from 'firebase/firestore';
import {
  ChatRoomMemberData,
  GroupData, GroupMessageUpdateData, MessageData, Room, UpdateRoom,
} from '../interfaces/firestore';
import InboxModel from './inboxModel';
import RoomModel from './roomModel';
import FirestoreModel, { TopLevelCollections } from './firestoreModel';
import UserModel from './usersModel';
import GroupModel from './groupModel';

class MessagesModel extends FirestoreModel {
  private main: string;

  private collection: string;

  private mediaCollection: string;

  constructor() {
    super();

    this.main = TopLevelCollections.MAIN;
    this.collection = TopLevelCollections.MESSAGES;
    this.mediaCollection = TopLevelCollections.MEDIA;
  }

  public async createInboxAndRoom(roomId: string, data: MessageData) {
    if (data.senderId && data.receiverId) {
      const inboxModelObject = new InboxModel();
      const inboxData = { roomId };
      await inboxModelObject.updateInbox(data.senderId, data.receiverId, inboxData);
      await inboxModelObject.updateInbox(data.receiverId, data.senderId, inboxData);
      const roomModelObject = new RoomModel();
      const roomData = await roomModelObject.getRoom(roomId);
      if (!roomData.data()) {
        const rData = {
          chatRoomMembers: {
            [data.senderId]:
            {
              admin: false,
              memberDelete: '',
              memberId: data.senderId,
              memberJoin: `${+new Date()}`,
              memberLeave: '',
              memberName: '',
              muted: false,
              typing: false,
              unreadCount: 0,
            },
            [data.receiverId]:
            {
              admin: false,
              memberDelete: '',
              memberId: data.receiverId,
              memberJoin: `${+new Date()}`,
              memberLeave: '',
              memberName: '',
              muted: false,
              typing: false,
              unreadCount: 1,
            },
          },
          lastMessage: data,
          chatLastUpdate: `${+new Date()}`,
          chatRoomId: roomId,
          chatRoomType: 'single',
        };
        await roomModelObject.addRoom(roomId, rData);
      }
      const messageId = await this.addMessage(roomId, data, true);
      return messageId;
    }
    return '';
  }

  public async addMessage(roomId: string, data: MessageData, documentExists: boolean, unreadCount?: number, updateRoom = true, isGroup = false, roomDataMain?: null | Room): Promise<string> {
    if (!documentExists) {
      return this.createInboxAndRoom(roomId, data);
    }
    const messageData = { ...data };
    const newMessageRef = doc(collection(this.store, `${this.main}/${this.collection}/${roomId}`));
    messageData.messageId = newMessageRef.id;
    await setDoc(newMessageRef, messageData);
    const roomModelObject = new RoomModel();
    const userModelObject = new UserModel();

    const roomData: UpdateRoom = {
      lastMessage: messageData,
      chatLastUpdate: `${+new Date()}`,
    };
    if (!isGroup && updateRoom) {
      if (typeof unreadCount !== 'undefined' && data.receiverId) {
        roomData.chatRoomMembers = {
          [data.receiverId]: {
            unreadCount: unreadCount + 1,
          },
        };
        if (data.senderId) {
          userModelObject.updateUserTotalUnread(data.receiverId, data.senderId, {
            unreadMessage: true,
          });
        }
      }
      await roomModelObject.updateRoom(roomId, roomData);
    } else if (updateRoom && roomDataMain?.chatRoomMembers) {
      const chatRoomMembersData = Object.values(roomDataMain.chatRoomMembers);
      roomData.chatRoomMembers = {};
      chatRoomMembersData.forEach((member: ChatRoomMemberData) => {
        if (member.memberId && data.senderId && member.memberId !== data.senderId && roomData.chatRoomMembers) {
          roomData.chatRoomMembers[member.memberId] = {
            unreadCount: member.unreadCount ? member.unreadCount + 1 : 1,
          };
          if (data.receiverId) {
            userModelObject.updateUserTotalUnread(member.memberId, data.receiverId, {
              unreadMessage: true,
            });
          }
        }
      });
      if (Object.values(roomData.chatRoomMembers).length === 0) {
        delete roomData.chatRoomMembers;
      }
      await roomModelObject.updateRoom(roomId, roomData);
    }
    return newMessageRef.id;
  }

  public async sendInitialMessages(initialData: GroupMessageUpdateData) {
    const groupId = initialData.messageRoomId;
    const { senderId } = initialData;
    const { senderName } = initialData;
    const initialMessageData: MessageData = {
      deleteFor: {},
      mediaUrl: '',
      messageId: initialData.messageId,
      messageRoomId: initialData.messageRoomId,
      receiverId: initialData.receiverId,
      replyingTo: '',
      senderId: initialData.senderId,
      senderImageURL: '',
      forwarded: false,
      senderName: initialData.senderName,
      status: 'sent',
      localMedia: '',
      text: initialData.text,
      thumbnail: '',
      highlightedKeys: initialData.highlightedKeys,
      timestamp: `${+new Date()}`,
      type: 'header',
    };
    await this.addMessage(groupId, initialMessageData, true, 0, false);
    const members = Object.values(initialData.chatRoomMembers);
    if (Array.isArray(members) && members.length > 0) {
      members.forEach((user: { userId: string, name: string }) => {
        if (user.userId !== senderId) {
          initialMessageData.text = `${senderName} added ${user.name}  to the group`;
          initialMessageData.highlightedKeys = `${senderName},${user.name}`;
          initialMessageData.timestamp = `${+new Date()}`;
          this.addMessage(groupId, initialMessageData, true);
        }
      });
    }
  }

  public sendEditedGroupMessage(groupName: string, groupImage: string, group: GroupData, currentUser: { id: string, name: string }) {
    const messageData: MessageData = {
      deleteFor: {},
      mediaUrl: '',
      messageId: '',
      messageRoomId: group.groupId,
      receiverId: group.groupId,
      replyingTo: '',
      senderId: currentUser.id,
      senderImageURL: '',
      forwarded: false,
      senderName: currentUser.name,
      status: 'sent',
      localMedia: '',
      text: groupName ? `${currentUser.name} renamed the group to "${groupName}"` : `${currentUser.name} updated the group image`,
      thumbnail: '',
      highlightedKeys: groupName ? `${currentUser.name},${groupName}` : `${currentUser.name}`,
      timestamp: `${+new Date()}`,
      type: 'header',
    };
    this.addMessage(group.groupId, messageData, true);
  }

  public async sendMemberAddMessage(newMembers: { name: string, userId: string }[], group: GroupData, currentUser: { id: string, name: string }) {
    const initialMessageData: MessageData = {
      deleteFor: {},
      mediaUrl: '',
      messageId: '',
      messageRoomId: group.groupId,
      receiverId: group.groupId,
      replyingTo: '',
      senderId: currentUser.id,
      senderImageURL: '',
      forwarded: false,
      senderName: currentUser.name,
      status: 'sent',
      localMedia: '',
      text: '',
      thumbnail: '',
      highlightedKeys: '',
      timestamp: `${+new Date()}`,
      type: 'header',
    };
    for (let i = 0; i < newMembers.length; i += 1) {
      const userName = newMembers[i].name;
      initialMessageData.text = `${currentUser.name} added ${userName} to the group`;
      initialMessageData.highlightedKeys = `${currentUser.name},${userName}`;
      initialMessageData.timestamp = `${+new Date()}`;

      await this.addMessage(group.groupId, initialMessageData, true);
    }
  }

  public sendRemovedFromGroupMessage(userName: string, group: GroupData, currentUser: { id: string, name: string }) {
    const initialMessageData: MessageData = {
      deleteFor: {},
      mediaUrl: '',
      messageId: '',
      messageRoomId: group.groupId,
      receiverId: group.groupId,
      replyingTo: '',
      senderId: currentUser.id,
      senderImageURL: '',
      forwarded: false,
      senderName: currentUser.name,
      status: 'sent',
      localMedia: '',
      text: `${currentUser.name} removed ${userName} from the group`,
      thumbnail: '',
      highlightedKeys: `${currentUser.name},${userName}`,
      timestamp: `${+new Date()}`,
      type: 'header',
    };
    this.addMessage(group.groupId, initialMessageData, true);
  }

  public sendLeftGroupMessage(userName: string, group: GroupData, currentUser: { id: string, name: string }) {
    const initialMessageData: MessageData = {
      deleteFor: {},
      mediaUrl: '',
      messageId: '',
      messageRoomId: group.groupId,
      receiverId: group.groupId,
      replyingTo: '',
      senderId: currentUser.id,
      senderImageURL: '',
      forwarded: false,
      senderName: currentUser.name,
      status: 'sent',
      localMedia: '',
      text: `${userName} left the group`,
      thumbnail: '',
      highlightedKeys: `${userName}`,
      timestamp: `${+new Date()}`,
      type: 'header',
    };
    this.addMessage(group.groupId, initialMessageData, true);
  }

  public forwardMessage = async (currentUserInfo: { id: string, name: string }, selectedUsers: { userId: string, name: string, isGroup?: boolean }[], data: MessageData) => {
    if (selectedUsers?.length > 0) {
      const newMessageData: MessageData = {
        deleteFor: {},
        mediaUrl: data.mediaUrl,
        replyingTo: '',
        senderId: currentUserInfo.id,
        senderImageURL: '',
        senderName: currentUserInfo.name,
        forwarded: true,
        status: 'sent',
        text: data.text,
        thumbnail: data.thumbnail,
        timestamp: `${+new Date()}`,
        type: data.type,
      };
      const userModelObject = new UserModel();
      const inboxModelObject = new InboxModel();
      const groupModelObject = new GroupModel();
      for (let i = 0; i < selectedUsers.length; i += 1) {
        const userObject = selectedUsers[i];
        const isGroup = userObject.isGroup ?? false;
        let userExists = false;
        if (!isGroup) {
          userExists = await userModelObject.userExists(userObject.userId);
        } else {
          userExists = await groupModelObject.groupExists(userObject.userId);
        }
        if (userExists) {
          const inboxExists = await inboxModelObject.userExistsInInbox(currentUserInfo.id, userObject.userId);
          const roomId = !isGroup ? currentUserInfo.id > userObject.userId ? `${userObject.userId}_${currentUserInfo.id}` : `${currentUserInfo.id}_${userObject.userId}` : userObject.userId;

          let documentExists = inboxExists;
          let unreadCount = 0;
          let roomDataMain: any = null;

          if (inboxExists) {
            const roomModelObject = new RoomModel();
            const roomData = await roomModelObject.getRoom(roomId);
            if (!roomData.data()) {
              documentExists = false;
            } else {
              const rData = roomData.data();
              roomDataMain = { ...rData };
              unreadCount = rData?.chatRoomMembers?.[userObject.userId]?.unreadCount || 0;
            }
          }
          newMessageData.messageRoomId = roomId;
          newMessageData.receiverId = userObject.userId;
          await this.addMessage(roomId, newMessageData, documentExists, unreadCount, true, isGroup, roomDataMain);
        }
      }
    }
  }

  public addMedia(roomId: string, messageId: string, data: MessageData) {
    const mediaMessageRef = doc(this.store, `${this.main}/${this.mediaCollection}/${roomId}`, `${messageId}`);
    return setDoc(mediaMessageRef, data);
  }

  public updateMediaMessage(roomId: string, messageId: string, data: MessageData) {
    const messageRef = doc(this.store, `${this.main}/${this.mediaCollection}/${roomId}`, `${messageId}`);
    return setDoc(messageRef, data, { merge: true });
  }

  public async getMedia(roomId: string) {
    const q = query(collection(this.store, `${this.main}/${this.mediaCollection}/${roomId}`));
    const querySnapshot = await getDocs(q);
    const media: MessageData[] = [];
    querySnapshot.forEach((d) => {
      media.push(d.data());
    });
    return media;
  }

  public addMediaMessagesListener(roomId: string, updateMedia: (data: Map<string, MessageData>) => void, currentUserId: string) {
    const q = query(collection(this.store, `${this.main}/${this.mediaCollection}/${roomId}`));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const mediaData: Map<string, MessageData> = new Map();
      querySnapshot.forEach((d: any) => {
        if (d?.id && d?.data()) {
          const mediaDataTemp = d.data();
          const deletedForMe = (currentUserId && mediaDataTemp?.deleteFor?.[currentUserId]) || mediaDataTemp?.deleteFor?.all;
          if (!deletedForMe) {
            mediaData.set(d.id, d.data());
          }
        }
      });
      updateMedia(mediaData);
    });
    return unsubscribe;
  }

  public updateMessage(roomId: string, messageId: string, data: MessageData) {
    const messageRef = doc(this.store, `${this.main}/${this.collection}/${roomId}`, `${messageId}`);
    return setDoc(messageRef, data, { merge: true });
  }

  public deleteMessage(roomId: string, messageId: string) {
    const messageRef = doc(this.store, `${this.main}/${this.collection}/${roomId}`, `${messageId}`);
    return deleteDoc(messageRef);
  }

  // public deleteMessageRoom(roomId: string) {
  //   const messageRef = doc(this.store, `${this.main}/${this.collection}/${roomId}`, `${messageId}`);
  //   return deleteDoc(messageRef);
  // }

  public async addMessagesListener(roomId: string, messagesLimit: number, updateMessages: (data: Map<string, MessageData>, firstTime?: boolean) => null, deleteChatTime: string) {
    const docRef = query(collection(this.store, `${this.main}/${this.collection}/${roomId}`), limit(messagesLimit), orderBy('timestamp', 'desc'));
    const docSnap = await getDocs(docRef);
    const start: QueryDocumentSnapshot<DocumentData> = docSnap.docs[docSnap.docs.length !== 0 ? docSnap.docs.length - 1 : 0];
    const newQuery = query(collection(this.store, `${this.main}/${this.collection}/${roomId}`), orderBy('timestamp'), startAt(start || ''));
    const messages: Map<string, MessageData> = new Map();

    const listener = onSnapshot(newQuery, (querySnapshot) => {
      querySnapshot.forEach((messageData) => {
        messages.set(messageData.id, messageData.data());
      });
      if (deleteChatTime) {
        messages.forEach((message: MessageData, key: string) => {
          if (Number(message?.timestamp) < Number(deleteChatTime)) {
            messages.delete(key);
          }
        });
      }
      updateMessages(messages, true);
    });
    return { listener, pointers: { start } };
  }

  public async addMoreMessagesListener(roomId: string, messagesLimit: number, updateMessages: (data: Map<string, MessageData>) => null, pointers: { start: QueryDocumentSnapshot<DocumentData> }, deleteChatTime: string) {
    const queryPointers = { ...pointers };
    const docRef = query(collection(this.store, `${this.main}/${this.collection}/${roomId}`), limit(messagesLimit), orderBy('timestamp', 'desc'), startAt(queryPointers.start));
    const docSnap = await getDocs(docRef);
    const end = queryPointers.start;
    queryPointers.start = docSnap.docs[docSnap.docs.length - 1];

    const newQuery = query(collection(this.store, `${this.main}/${this.collection}/${roomId}`), orderBy('timestamp'), startAt(queryPointers.start), endBefore(end));
    const messages: Map<string, MessageData> = new Map();
    const listener = onSnapshot(newQuery, (querySnapshot) => {
      querySnapshot.forEach((messageData) => {
        messages.set(messageData.id, messageData.data());
      });
      if (deleteChatTime) {
        messages.forEach((message: MessageData, key: string) => {
          if (Number(message?.timestamp) < Number(deleteChatTime)) {
            messages.delete(key);
          }
        });
      }
      updateMessages(messages);
    });
    return { listener, pointers: { start: queryPointers.start } };
  }

  public addUnreadListener(roomId: string, otherUserId: string, currentUserId: string, receiverId?: string) {
    let firstTime = true;
    const q = query(collection(this.store, `${this.main}/${this.collection}/${roomId}`), where('senderId', '==', otherUserId), where('status', 'in', ['sent', 'delivered']));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const batch = writeBatch(this.store);
      try {
        const roomModelObject = new RoomModel();
        const userModelObject = new UserModel();

        if (firstTime && receiverId) {
          const roomData: UpdateRoom = { chatRoomMembers: { [currentUserId]: { unreadCount: 0 } } };
          if (receiverId === currentUserId) {
            roomData.lastMessage = { status: 'read' };
          }
          roomModelObject.updateRoom(roomId, roomData);
          firstTime = false;
        } else {
          roomModelObject.updateRoom(roomId, { lastMessage: { status: 'read' }, chatRoomMembers: { [currentUserId]: { unreadCount: 0 } } });
        }
        userModelObject.updateUserTotalUnread(currentUserId, otherUserId, { unreadMessage: false });
        querySnapshot.forEach((d) => {
          if (d.data()) {
            const { messageId } = d.data();
            if (messageId) {
              const messageRef = doc(this.store, `${this.main}/${this.collection}/${roomId}`, messageId);
              batch.update(messageRef, { status: 'read' });
            }
          }
        });
        batch.commit();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('UnreadListner Error', e);
      }
    });
    return unsubscribe;
  }
}

export default MessagesModel;
