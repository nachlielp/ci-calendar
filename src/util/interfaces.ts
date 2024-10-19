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
    users?: UserBio[]
    owners: UserOption[]
    title: string
    description: string
    address: IAddress
    created_at: string
    updated_at: string
    hide: boolean
    start_date: string
    end_date: string
    //TODO add loc info to district
    district: string
    type: string
    price: IPrice[]
    links: ILink[]
    segments: CIEventSegments[]
    creator_id: string
    creator_name: string
    source_template_id: string | null
    is_multi_day: boolean
    multi_day_teachers: UserOption[] | null
    organisations: UserOption[]
}
export interface CITemplate {
    template_id: string
    owners: UserOption[]
    name: string
    title: string
    description: string
    address: IAddress
    created_at: string
    updated_at: string | null
    district: string
    type: string
    price: IPrice[]
    links: ILink[]
    segments: CIEventSegments[]
    is_multi_day: boolean
    created_by: string
    multi_day_teachers: UserOption[]
    organisations: UserOption[]
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

export interface DefaultFilter {
    eventTypes: string[]
    districts: string[]
}

export interface PushNotificationToken {
    token: string
    created_at: string
    device_id: string
    is_pwa: boolean
    breanch: string
}

export interface Notification {
    id: string
    event_id: string
    title: string
    body: string
    created_at: string
    send_at: string
    dispose_at: string
    timezone: string
}

export interface DbUser {
    user_id: string
    created_at: string
    updated_at: string
    user_type: UserType
    full_name: string
    phone: string
    email: string
    subscribed_for_updates_at: string
    newsletter: IMailingList
    page_url: string
    page_title: string
    show_profile: boolean
    allow_tagging: boolean
    provider: string
    img: string
    bio: string
    default_filter: DefaultFilter
    push_notification_tokens: PushNotificationToken[]
    notifications: Notification[]
    subscriptions: string[]
    is_org: boolean
}

export interface UserBio extends Partial<DbUser> {
    user_id: string
    full_name: string
    page_url: string
    page_title: string
    show_profile: boolean
    allow_tagging: boolean
    img: string
    bio: string
    is_org: boolean
}

export interface CIRequestResponse {
    response: string
    created_at: string
    created_by: string
}

export interface CIRequest {
    request_id: string
    created_at: string
    request_type: string
    created_by: string
    type: RequestType
    status: RequestStatus
    message: string
    user_id: string
    responses: CIRequestResponse[]
    phone: string
    email: string
    name: string
    viewed_response: boolean
    viewed_by: string[]
}

export enum RequestType {
    make_profile = "make_profile",
    make_creator = "make_creator",
    support = "support",
}

export enum RequestTypeHebrew {
    make_profile = "הרשמה כמורה",
    make_creator = "הרשמה כמורה ויוצר ארועים",
    support = "תמיכה",
}

export enum RequestStatus {
    open = "open",
    closed = "closed",
    pending = "pending",
}
export enum RequestStatusHebrew {
    open = "פתוח",
    closed = "סגור",
    pending = "בטיפול",
}
export type PushNotificationPromission = "granted" | "denied" | "default" | null
