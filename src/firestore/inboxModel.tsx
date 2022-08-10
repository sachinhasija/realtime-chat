import {
  doc, query, collection, onSnapshot, setDoc, getDoc, DocumentData, deleteDoc,
} from 'firebase/firestore';
import { InboxData } from '../interfaces/firestore';
import FirestoreModel, { TopLevelCollections } from './firestoreModel';

class InboxModel extends FirestoreModel {
  private main: string;

  private collection: string;

  constructor() {
    super();

    this.main = TopLevelCollections.MAIN;
    this.collection = TopLevelCollections.INBOX;
  }

  public async userExistsInInbox(documentId: string, userId: string) {
    const docRef = doc(this.store, `${this.main}/${this.collection}/${documentId}`, `${userId}`);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  }

  // here documentId is either userId or groupId
  public async updateInbox(documentId: string, userId: string, data: InboxData) {
    await setDoc(doc(this.store, `${this.main}/${this.collection}/${documentId}`, `${userId}`), data);
  }

  // here documentId is either userId or groupId
  public async deleteUserFromInbox(documentId: string, userId: string) {
    return deleteDoc(doc(this.store, `${this.main}/${this.collection}/${documentId}`, `${userId}`));
  }

  public addInboxListener(userId: string, updateInboxData: (data: { [documentId: string]: DocumentData }) => null) {
    const q = query(collection(this.store, `${this.main}/${this.collection}/${userId}`));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const inboxData: { [documentId: string]: DocumentData } = {};
      querySnapshot.forEach((d) => {
        const documentID = d.id;
        inboxData[documentID] = d.data();
      });
      updateInboxData(inboxData);
    });
    return unsubscribe;
  }

  public createInboxForGroup(groupId: string, members: { [userId: string]: { userId: string, name: string } } | { name: string, userId: string }[]) {
    const membersData = Array.isArray(members) ? members : Object.values(members);
    if (Array.isArray(membersData) && membersData.length > 0) {
      membersData.forEach((user: { userId: string, name: string }) => {
        setDoc(doc(this.store, `${this.main}/${this.collection}/${user.userId}`, `${groupId}`), { roomId: `${groupId}` });
      });
    }
    return null;
  }
}

export default InboxModel;
