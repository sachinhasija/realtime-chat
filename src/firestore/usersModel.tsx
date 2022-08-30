import {
  doc, setDoc, getDoc, onSnapshot, DocumentData, updateDoc, query, collection
} from 'firebase/firestore';
import {
  User, UpdateUser, UpdateUserDoc, TotalUnreadData,
} from '../interfaces/firestore';
import FirestoreModel, { TopLevelCollections } from './firestoreModel';

class UserModel extends FirestoreModel {
  private main: string;

  private collection: string;

  private unreadCollection: string;

  constructor() {
    super();
    this.main = TopLevelCollections.MAIN;
    this.unreadCollection = TopLevelCollections.TOTAL_UNREAD;
    this.collection = TopLevelCollections.USERS;
  }

  public async userExists(userId: string) {
    const docRef = doc(this.store, `${this.main}/${this.collection}/userInfo`, userId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  }

  public async addUser(userId: string, data: User) {
    setDoc(doc(this.store, `${this.main}/${this.collection}/userInfo`, userId), data);
  }

  public async updateUser(userId: string, data: UpdateUser) {
    const userRef = doc(this.store, `${this.main}/${this.collection}/userInfo`, userId);
    setDoc(userRef, data, { merge: true });
  }

  public async updateUserDoc(userId: string, data: UpdateUserDoc) {
    const userRef = doc(this.store, `${this.main}/${this.collection}/userInfo`, userId);
    updateDoc(userRef, data);
  }

  public addUserListener(userId: string, updateInboxRoomData: (data: DocumentData | undefined) => null) {
    const unsubscribe = onSnapshot(doc(this.store, `${this.main}/${this.collection}/userInfo`, userId), (d) => {
      updateInboxRoomData(d.data());
    });
    return unsubscribe;
  }

  public addUsersListener(updateUsersData: (data: DocumentData | undefined) => void) {
    const unsubscribe = onSnapshot(query(collection(this.store, `${this.main}/${this.collection}/userInfo`)), (querySnapshot) => {
      const unreadData: { [id: string]: DocumentData } = {};
      querySnapshot.forEach((d) => {
        if (d.data() && d.id) {
          unreadData[d.id] = d.data();
        }
      });
      updateUsersData(unreadData);
    });
    return unsubscribe;
  }

  public async getUser(userId: string) {
    const docRef = doc(this.store, `${this.main}/${this.collection}`);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return Promise.resolve(docSnap.data());
    }
    return Promise.reject(new Error('404'));
  }

  public async fetchUserTotalUnread(userId: string, updateUnreadData: (data: { [id: string]: DocumentData }) => void) {
    const unsubscribe = onSnapshot(query(collection(this.store, `${this.main}/${this.unreadCollection}/${userId}`)), (querySnapshot) => {
      const unreadData: { [id: string]: DocumentData } = {};
      querySnapshot.forEach((d) => {
        if (d.data() && d.id) {
          unreadData[d.id] = d.data();
        }
      });
      updateUnreadData(unreadData);
    });
    return unsubscribe;
  }

  public updateUserTotalUnread(userId: string, otherUserId: string, data: TotalUnreadData) {
    setDoc(doc(this.store, `${this.main}/${this.unreadCollection}/${userId}`, `${otherUserId}`), data);
  }
}

export default UserModel;
