import {
  collection, deleteDoc, doc, onSnapshot, query, setDoc,
} from 'firebase/firestore';
import { BlockData } from '../interfaces/firestore';
import FirestoreModel, { TopLevelCollections } from './firestoreModel';

class BlockModel extends FirestoreModel {
  private main: string;

  private collection: string;

  constructor() {
    super();

    this.main = TopLevelCollections.MAIN;
    this.collection = TopLevelCollections.BLOCK;
  }

  public async addBlockedUser(userId: string, blockedUser: string, data: BlockData) {
    await setDoc(doc(this.store, `${this.main}/${this.collection}/${userId}`, `${blockedUser}`), data);
  }

  public async removeBlockedUser(userId: string, blockedUser: string) {
    await deleteDoc(doc(this.store, `${this.main}/${this.collection}/${userId}`, `${blockedUser}`));
  }

  public addBlockListener(userId: string, updateBlockData: (data: { [userId: string]: { timestamp: string, isBlocked?: boolean } }, deletedDocId?: string) => null) {
    const q = query(collection(this.store, `${this.main}/${this.collection}/${userId}`));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const blockData: { [userId: string]: { timestamp: string, isBlocked?: boolean } } = {};
      querySnapshot.docChanges().forEach((change) => {
        if (change.type === 'removed' && change.doc.id) {
          updateBlockData(blockData, change.doc.id);
        }
      });
      querySnapshot.forEach((d: any) => {
        if (d?.id && d?.data()) {
          blockData[d.id] = d.data();
        }
      });
      if (Object.keys(blockData).length > 0) {
        updateBlockData(blockData);
      }
    });
    return unsubscribe;
  }
}

export default BlockModel;
