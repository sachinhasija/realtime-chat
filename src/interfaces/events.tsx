/* eslint-disable camelcase */
interface EventData {
    accepatedUserIds: []
    acceptedUserCount: number
    participantCount: number
    blockUserIds: []
    categoryId: string
    createdAt: string
    isWishlisted?: number
    description: string
    discountedPrice: {gold: number, silver: number}
    domName: string
    duration: string
    isViaCountMeIn?: boolean
    eventSubscriptionData:{
        _id: string,
        eventId: string,
        isPaid: boolean,
        status: string,
        type: string,
        userId: string
        isViaDiscountPrice?: boolean
    }
    agora?: {
            agoraChannelName: string,
            eventId: string,
            tokenWithAccount: string,
            tokenWithUid: string
            userId: string
        }
    eventCancelledDateTime: null
    eventCompletedDateTime: null
    eventShareLink: string
    eventType: string
    followingUserIds: []
    goldPrice: number
    id: string
    _id?: string
    imageUrl: string
    invitedUserIds: []
    isDiscountedPrice: boolean
    isEventCancelled: boolean
    isPaidEvent: boolean
    isScheduledLater: boolean
    lastReportedTime: null
    muteUserIds: []
    myBlockUserIds: []
    notifyMeUserIds: []
    participationLimit: number
    reportCount: number
    startTime: string
    status: string
    subCategoryId: string
    subDomName: string
    suggest_event: {
        contexts: {
            eventType: string[]
            myBlockUserIds: []
            status: string[]
            statusEventType: string[]
        },
        input: string[]
    }
    title: string
    updatedAt: string
    user: {
        avatusImage: string
        createdAt: string
        updatedAt: string
        username: string
        _id: string
    }
    userId: string
}

interface WishlistEvent {
    createdAt: string
    imageUrl: string
    itemDetails: EventData
    itemId: string
    serviceType: string
    status: string
    title: string
    updatedAt: string
    userId: string
    wishlistId: string
    wishlistType: string
    _id: string
}

interface LiveChatMessageData {
    avatusImage: string
    comment: string
    eventId: string
    timeStamp: string
    userId: string
    username: string
}

interface ScheduleEvent {
    title: string,
    description?: string,
    categoryId: string,
    subCategoryId: string,
    imageUrl: string,
    participationLimit?: number,
    startTime: string,
    startDate?: string,
    eventType: string,
    goldPrice?: string,
    invitationIds?: string[],
    privateEvent?: boolean,
    discountedPriceGold?: string,
    discountedPriceSilver?: string
}

interface ScheduleEventMain extends ScheduleEvent {
    discountedPrice?: {gold: string, silver: string},
    invitedUserIds?: string[],
    isScheduledLater: boolean
    isPaidEvent: boolean
    isDiscountedPrice?: boolean
}

export type {
  EventData, LiveChatMessageData, ScheduleEvent, ScheduleEventMain, WishlistEvent,
};
