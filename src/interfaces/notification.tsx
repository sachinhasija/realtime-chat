import { MessageData } from './firestore';

interface NotificationMain {
    title: string,
    content: string,
    image?: string,
    url?: string,
    chatData?: MessageData
    devices: {deviceToken: string, deviceType: string}[] // device type - 1 for Android, 2 IOS, 3 Web
}

interface HeaderNotificationData {
  adminId: string
  campaignId: string
  categoryId: string
  channelId: string
  createdAt: string
  eventId: string
  otherImage?: string
  image: string
  message: string
  isSeen: boolean
  postId: string
  receiverData: {username: string, _id: string}[]
  recieverId: string
  sendBy: string
  senderData: {username: string, _id: string}[]
  senderId: string
  status: string
  title: string
  transactionId: string
  type: string
  updatedAt: string
  userId: string
  _id: string
}

export type { NotificationMain, HeaderNotificationData };
