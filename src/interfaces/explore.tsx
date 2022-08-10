interface PostsDataInterface {
    activityCount: number
    categoryId: string
    channelId: null
    commentCount: number
    contentType: string
    createdAt: string
    description: string
    feeds: number
    follower: number
    hashTags?: []
    id?: string
    channel?: {
        channelIconImage: string,
        channelName: string,
        status: string,
        subscriptionType: string,
        _id: string
    }
    isPrivateAccount: false
    lastReaction: string
    likeCount: number
    media: {backgroundColor: string
    backgroundImage: string
    createdAt: string
    filePath: string
    mediaType: string
    postedText: string
    tagUser: []
    thumbnailImageUrl: string
    updatedAt: string
    _id: string}[]
    postType: string
    reactions: number
    reportCount: number
    status: string
    subCategoryId: string
    subscribed: number
    tagContent: []
    user: {username: string}
    userId: string
    viewCount: number
    _id: string
}

export type { PostsDataInterface };
