interface PurchaseData {
    activityCode: string
    adminCommission: number
    adminId: null
    amount: number
    channelId: null
    createdAt: string
    currency: string
    goldCoin: number
    imageUrl: string
    inAppPurchaseFees: number
    platform: string
    purchaseIn: string
    giftedToUserId?: string
    giftedTo?: {
        createdAt: string,
        status: string,
        username: string,
        _id: string,
    }
    giftedby?: {
        createdAt: string,
        status: string,
        username: string,
        _id: string,
    }
    purchaseTransactionType: string
    receiverAccountId: string
    receiverTiliaWalletId: string
    receiverUserId: string
    receiverWalletId: string
    silverCoin: number
    sourceAccountId: string
    sourceTiliaWalletId: string
    sourceUserId: string
    sourceWalletId: string
    tiliaExchangeRate: number
    tiliaExchangeRateDirection: null
    tiliaFees: number
    title: string
    transactionFrom: string
    transactionId: string
    transactionType: string
    _id: string
    id?: string
}

export type { PurchaseData };
