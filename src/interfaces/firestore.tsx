interface BlockData { isBlocked: boolean, timestamp: string }

interface InboxData { roomId: string }

interface AllInboxData { [inboxId: string]: InboxData }

interface MessageData {
    deleteFor?: { [userId: string]: boolean }
    mediaUrl?: string
    messageId?: string
    messageRoomId?: string
    receiverId?: string
    replyingTo?: string
    senderId?: string
    senderImageURL?: string
    forwarded?: boolean
    senderName?: string
    status?: string
    localMedia?: string
    text?: string
    thumbnail?: string
    highlightedKeys?: string
    timestamp?: string
    type?: string
}

interface ChatRoomMemberData {
    admin?: boolean
    image?: string
    memberDelete?: string
    memberId?: string
    memberJoin?: string
    memberLeave?: string
    memberName?: string
    muted?: boolean
    typing?: boolean
    unreadCount?: number
}

interface NewChatData {
    roomId?: string,
    name: string,
    chatId: string,
    isOnline?: boolean
}

interface GroupData {
    createdAt: string,
    groupId: string,
    image: string,
    name: string
}

interface GroupMessageUpdateData {
    messageId: string,
    messageRoomId: string,
    receiverId: string,
    senderId: string,
    senderName: string,
    chatRoomMembers: { [userId: string]: { userId: string, name: string } },
    type: string,
    text: string,
    highlightedKeys: string,
    group: GroupData,
}

interface Room {
    chatRoomMembers: { [userId: string]: ChatRoomMemberData }
    lastMessage: MessageData
    chatLastUpdate: string
    chatRoomId: string
    chatRoomType: string
}

interface TotalUnreadData {
    unreadMessage: boolean
}

interface UpdateRoom {
    chatRoomMembers?: { [userId: string]: ChatRoomMemberData }
    lastMessage?: MessageData
    chatLastUpdate?: string
    chatRoomId?: string
    chatRoomType?: string
}

interface FirebaseUser {
    accessToken: string
    auth: {}
    displayName: string
    email: string
    emailVerified: boolean
    isAnonymous: boolean
    metadata: { createdAt: string, lastLoginAt: string, lastSignInTime: string, creationTime: string }
    phoneNumber: null
    photoURL: string
    proactiveRefresh: {}
    providerData: []
    providerId: string
    reloadListener: null
    reloadUserInfo: {}
    stsTokenManager: {}
    tenantId: null
    uid: string
}

interface User {
    email?: string
    id: string
    isOnline: boolean
    lastSeen?: string
    image?: string
    createdAt?: string
    name: string
    showOnline: boolean
}

interface UpdateUser {
    deviceDetails?: {
        deviceTokens?: { [deviceToken: string]: string }
    },
    email?: string
    id?: string
    image?: string
    isOnline?: boolean
    lastSeen?: string
    name?: string
    showOnline?: boolean
}

interface UpdateUserDoc {
    [x: string]: string | boolean | {
        deviceTokens?: { [deviceToken: string]: string }
    }
}

export type {
    AllInboxData, BlockData, ChatRoomMemberData, FirebaseUser, GroupData, GroupMessageUpdateData, NewChatData, InboxData, MessageData, Room, TotalUnreadData, UpdateRoom, User, UpdateUser, UpdateUserDoc,
};
