import { db } from 'firebase.js';

export enum TopLevelCollections {
  MAIN = 'Chat',
  USERS = 'Users',
  BLOCK = 'Block',
  INBOX = 'Inbox',
  MEDIA = 'media',
  MESSAGES = 'Messages',
  ROOM = 'room_info',
  GROUP = 'groups',
  TOTAL_UNREAD = 'total_unread',
}

export default class FirestoreModel {
  public store;

  constructor() {
    this.store = db;
  }
}
