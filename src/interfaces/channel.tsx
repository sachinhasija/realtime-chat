interface ChannelData {
    autoRenewal: boolean
    blockUserIds: string[]
    category: {_id: string, name: string, description: string, selectedImage: string, nonSelectedImage: string, nonSelectedImageSvg: string}
    categoryId: string
    categoryStatus: string
    channelIconImage: string
    channelLowerCaseName: string
    channelName: string
    created: number
    createdAt: string
    description: string
    followingUserIds: string[]
    isPrivateAccount: boolean
    isSubscribed: number
    isWishlisted: number
    lastDeactivatedDateTime: null
    lastReportedDateTime: null
    link: string
    muteUserIds: string[]
    myBlockUserIds: string[]
    postCount: number
    reportChannelUserIds: string[]
    reportCount: number
    status: string
    subscribedChannel: string[]
    subscriberChannelUserIds: string[]
    subscriberCount: number
    subscriptionIds: string[]
    subscriptionPlan: {
        createdAt: string
        price: number
        updatedAt: string
        _id: string
    }[]
    subscriptionType: string
    updatedAt: string
    user: {username: string, _id: string}
    userDetails: {_id: string, username: string}
    userId: string
    userStatus: string
    wishlistitems: []
    _id: string
}

interface ChannelWishlist {
  createdAt: string
  imageUrl: string
  itemDetails: ChannelData
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

export type {
  ChannelData, ChannelWishlist,
};
