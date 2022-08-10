interface ProfileDataInterface {
  ageFlag: boolean
  avatCoinCount: number
  bio: string
  badgeCount?: number
  campaignCount: number
  channelCount: number
  createdAt: string
  dob: number
  emailFlag: boolean
  eventCount: number
  followersCount: number
  followingCount: number
  fullName: string
  fullNameFlag: boolean
  gender: string
  genderFlag: boolean
  isBrand: boolean
  isEmailVerified: boolean
  isInvestor: boolean
  isPhoneNoVerified: boolean
  isPremiumUser: boolean
  isPrivateAccount: boolean
  isServiceProvider: boolean
  nationality: string
  nationalityFlag: boolean
  phoneFlag: boolean
  receiveMessage: number
  postCount: number
  registerationStatus: string
  registerationStep: number
  rewardCoinsCount: number
  serviceCount: number
  status: string
  subscribedChannelCount: number
  uid: string
  userId: string
  username: string
  _id: string
  doam?: string[]
  follow?: {
    adminFollowerIdStatus: string,
    adminUserIdstatus: string,
    createdAt: string,
    followerId: string,
    status: string,
    updatedAt: string,
    userId: string,
    _id: string
  }
  id?: string
  isFollow?: 0 | 1
}

interface ProfileDataInterfaceUpdate {
  avatCoinCount?: number
  bio?: string
  campaignCount?: number
  channelCount?: number
  createdAt?: string
  dob?: number
  emailFlag?: boolean
  eventCount?: number
  followersCount?: number
  followingCount?: number
  fullName?: string
  fullNameFlag?: boolean
  gender?: string
  genderFlag?: boolean
  isBrand?: boolean
  isEmailVerified?: boolean
  isInvestor?: boolean
  isPhoneNoVerified?: boolean
  isPremiumUser?: boolean
  isPrivateAccount?: boolean
  isServiceProvider?: boolean
  nationality?: string
  nationalityFlag?: boolean
  phoneFlag?: boolean
  postCount?: number
  registerationStatus?: string
  registerationStep?: number
  rewardCoinsCount?: number
  serviceCount?: number
  status?: string
  subscribedChannelCount?: number
  uid?: string
  userId?: string
  username?: string
  _id?: string
}

export type {
  ProfileDataInterface, ProfileDataInterfaceUpdate,
};
