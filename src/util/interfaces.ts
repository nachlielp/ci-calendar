export enum EventlyType {
    class = "class",
    jame = "jame",
    workshop = "workshop",
    conference = "conference",
    underscore = "underscore",
    retreat = "retreat",
}
export enum WeekendEventType {
    cl = "class",
    j = "jame",
    w = "workshop",
    co = "conference",
    u = "underscore",
    r = "retreat",
}
export enum WeekendDistrict {
    n = "north",
    s = "south",
    c = "center",
    j = "jerusalem",
}

export interface UserOption {
    value: string
    label: string
}

export interface CIEventSegments {
    endTime: string
    type: string
    startTime: string
    //TODO add user option, or just name
    teachers: UserOption[]
    tags: string[]
}
interface IPrice {
    sum: number
    title: string
}
interface ILink {
    link: string
    title: string
}
//TODO preload address and fetch if needed from google api with  id, name, district, lat, lng, address
export interface IAddress {
    place_id: string
    label: string
}
export interface CIEvent {
    id: string
    owners: UserOption[]
    title: string
    description: string
    address: IAddress
    createdAt: string
    updatedAt: string
    hide: boolean
    startDate: string
    endDate: string
    //TODO add loc info to district
    district: string
    type: string
    price: IPrice[]
    links: ILink[]
    segments: CIEventSegments[]
    creatorId: string
    creatorName: string
}
export enum District {
    north = "north",
    south = "south",
    center = "center",
    jerusalem = "jerusalem",
}

export enum UserType {
    admin = "admin",
    creator = "creator",
    profile = "profile",
    user = "user",
}

export interface IMailingList {
    createdAt: string
    updatedAt: string
    subscribedForUpdatesAt: string
    active: boolean
    districts: District[]
    eventTypes: EventlyType[]
}
export interface DbUser {
    user_id: string
    createdAt: string
    updatedAt: string
    user_type: UserType
    fullName: string
    phone: string
    email: string
    subscribedForUpdatesAt: string
    newsletter: IMailingList
    pageUrl: string
    pageTitle: string
    showProfile: boolean
    allowTagging: boolean
    provider: string
    img: string
    bio: string
}

export interface UserBio extends Partial<DbUser> {
    user_id: string
    fullName: string
    pageUrl: string
    pageTitle: string
    showProfile: boolean
    allowTagging: boolean
    img: string
    bio: string
}

export interface DbTeacher {
    id: string
    createdAt: string
    updatedAt: string
    fullName: string
    img: string
    bio: string
    pageUrl: string
    pageTitle: string
    showProfile: boolean
    allowTagging: boolean
}
