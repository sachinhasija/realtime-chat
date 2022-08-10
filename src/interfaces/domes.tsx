interface DomesDataInterface {
    channelCount: number
    campaignCount: number
    description: string
    eventCount: number
    level: number
    name: string
    nonSelectedImage: string
    parentId: string
    postCount: number
    postCountBySubCategory: number
    rank: number
    selectedImage: string
    subDomesCount: number
    userCount: number
    _id: string
}

interface MainDomeInterface {
    channelCount: number
    campaignCount: number
    description: string
    eventCount: number
    level: number
    name: string
    nonSelectedImage: string
    nonSelectedImageSvg: string
    parentId: null
    postCount: number
    postCountBySubCategory: number
    rank: number
    selectedImage: string
    selectedImageSvg: string
    subDomesCount: number
    userCount: number
    _id: string
}
interface DomesObjectInterface {
    [id: number]: DomesDataInterface[]
}

interface StylesInterface {
    cx: string,
    cy: string,
    length: string,
    angle: string,
    name: string
}

export type {
  DomesObjectInterface, DomesDataInterface, MainDomeInterface, StylesInterface,
};
