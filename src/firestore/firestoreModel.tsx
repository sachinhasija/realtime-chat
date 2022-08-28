import { db } from 'firebase.js';

export enum TopLevelCollections {
  MAIN = 'chat',
  USERS = 'Users',
  BLOCK = 'Block',
  INBOX = 'Inbox',
  MEDIA = 'Media',
  MESSAGES = 'Messages',
  ROOM = 'Room_info',
  GROUP = 'Groups',
  TOTAL_UNREAD = 'Total_unread',
}

export default class FirestoreModel {
  public store;

  constructor() {
    this.store = db;
  }
}
