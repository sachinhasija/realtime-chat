interface BlockedUserData {
  blockUserId: string
  createdAt: string
  fullName: string
  status: string
  userId: string
  username: string
  users: {_id: string, username: string, fullName: string}
  _id: string
}

interface PrivacySettings {
    isPrivateAccount?: boolean,
    enableAllNotification?: boolean,
    enableRemindersNotification?: boolean,
    enableUpdateFollowersNotification?: boolean,
    enableFollowRequestNotification?: boolean,
    enableEventCreationNotification?: boolean,
    enableFollowedChannelsNotification?: boolean,
    enableCompaignsNotification?: boolean,
    enableMessagesNotification?: boolean,
    enableLiveotification?: boolean,
    messages?: number
}

interface FeatureData {
  coinValue: number
  customizationOfAvatar: number
  enable: boolean
  featureName: string
  featureType: number
  noOfChannel: number
  talkToThea: number
}

interface MembershipData {
  createdAt: string
  currency: string
  description: string
  features: FeatureData[]
  interval: number
  isFreePlan: false
  isSubscribed: number
  price: number
  status: string
  subscribedPremium: [] | {autorenual: boolean
    canceledAt: null
    createdAt: string
    features: FeatureData[]
    interval: number
    isFreePlan: boolean
    nextBillingDate: string
    paymentMethodId: string
    periodEnd: string
    periodStart: string
    status: string
    subscriptionPlanId: string
    title: string
    userId: string
    _id: string}[]
  title: string
  totalSubscribers: number
  _id: string
}

export type {
  BlockedUserData, PrivacySettings, FeatureData, MembershipData,
};
