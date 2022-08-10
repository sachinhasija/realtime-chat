import {
  doc, setDoc, getDoc, onSnapshot, DocumentData, updateDoc, deleteField, FieldValue, deleteDoc,
} from 'firebase/firestore';
import {
  ChatRoomMemberData, GroupMessageUpdateData, Room, UpdateRoom,
} from '../interfaces/firestore';
import FirestoreModel, { TopLevelCollections } from './firestoreModel';

class RoomModel extends FirestoreModel {
  private main: string;

  private collection: string;

  constructor() {
    super();

    this.main = TopLevelCollections.MAIN;
    this.collection = TopLevelCollections.ROOM;
  }

  public async roomExists(roomId: string) {
    const docRef = doc(this.store, `${this.main}/${this.collection}/rooms`, `${roomId}`);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  }

  public async addRoom(roomId: string, data: Room) {
    setDoc(doc(this.store, `${this.main}/${this.collection}/rooms`, `${roomId}`), data);
  }

  public async getRoom(roomId: string) {
    return getDoc(doc(this.store, `${this.main}/${this.collection}/rooms`, `${roomId}`));
  }

  public async updateRoom(roomId: string, data: UpdateRoom) {
    const roomRef = doc(this.store, `${this.main}/${this.collection}/rooms`, `${roomId}`);
    setDoc(roomRef, data, { merge: true });
  }

  public async deleteRoom(roomId: string) {
    return deleteDoc(doc(this.store, `${this.main}/${this.collection}/rooms`, `${roomId}`));
  }

  public async updateChatLastMember(roomId: string, data: { [userId: string]: ChatRoomMemberData }) {
    const roomRef = doc(this.store, `${this.main}/${this.collection}/rooms`, `${roomId}`);
    updateDoc(roomRef, {
      chatRoomMembers: data,
    });
  }

  public addRoomListener(roomId: string, updateInboxRoomData: (data: DocumentData | undefined) => null) {
    const unsubscribe = onSnapshot(doc(this.store, `${this.main}/${this.collection}/rooms`, `${roomId}`), (d) => {
      updateInboxRoomData(d.data());
    });
    return unsubscribe;
  }

  public createRoomForGroup(data: GroupMessageUpdateData) {
    const roomData: Room = {
      chatRoomMembers: {},
      lastMessage: {
        deleteFor: {},
        mediaUrl: '',
        messageId: data.messageId,
        messageRoomId: data.messageRoomId,
        receiverId: data.receiverId,
        replyingTo: '',
        senderId: data.senderId,
        senderImageURL: '',
        forwarded: false,
        senderName: data.senderName,
        status: 'sent',
        localMedia: '',
        text: data.text,
        thumbnail: '',
        highlightedKeys: data.highlightedKeys,
        timestamp: `${+new Date()}`,
        type: 'header',
      },
      chatLastUpdate: `${+new Date()}`,
      chatRoomId: data.messageRoomId,
      chatRoomType: 'group',
    };
    const members = Object.values(data.chatRoomMembers);
    if (Array.isArray(members) && members.length > 0) {
      members.forEach((user: { userId: string, name: string }) => {
        const memberData = {
          admin: user.userId === data.senderId,
          image: '',
          memberDelete: '',
          memberId: user.userId,
          memberJoin: `${+new Date()}`,
          memberLeave: '',
          memberName: user.name,
          muted: false,
          typing: false,
          unreadCount: 0,
        };
        roomData.chatRoomMembers[user.userId] = memberData;
      });
    }
    this.addRoom(roomData.chatRoomId, roomData);
  }
}

export default RoomModel;
