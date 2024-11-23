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

export interface RawAppConfigRecord {
    id: string
    title: string
    created_at: string
    flag: boolean
    update_by: string
    data: string
}

export enum EventPayloadType {
    UPDATE = "UPDATE",
    DELETE = "DELETE",
    INSERT = "INSERT",
    UPSERT = "UPSERT",
}
export interface AppConfig {
    app_title: string
    app_description: string
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
    users: UserBio[]
    owners: UserOption[]
    title: string
    description: string
    address: IAddress
    created_at: string
    updated_at: string
    hide: boolean
    start_date: string
    end_date: string
    district: string
    type: string
    price: IPrice[]
    links: ILink[]
    segments: CIEventSegments[]
    user_id: string
    source_template_id: string | null
    is_multi_day: boolean
    multi_day_teachers: UserOption[] | null
    organisations: UserOption[]
    is_notified: boolean
    creator: {
        user_id: string
        full_name: string
    }
    cancelled: boolean
}
export interface CITemplate {
    id: string
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
    user_id: string
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
    org = "org",
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
    branch: string
}

export enum NotificationType {
    reminder = "reminder",
    subscription = "subscription",
    response = "response",
}

export interface CINotification {
    id: string
    created_at: string
    ci_event_id: string
    user_id: string
    remind_in_hours: string
    type: NotificationType
    title: string
    body: string
    send_at: string
    timezone: string
    is_sent: boolean
    is_multi_day: boolean
}

export interface UserNotification
    extends Omit<CINotification, "user_id" | "body" | "send_at" | "timezone"> {
    title: string
    start_date: string
    firstSegment: CIEventSegments
}

export interface NotificationDB
    extends Omit<
        CINotification,
        | "id"
        | "created_at"
        | "title"
        | "body"
        | "send_at"
        | "timezone"
        | "is_multi_day"
    > {
    id?: string
}

export interface CIUser {
    user_id: string
    created_at: string
    updated_at: string
    user_type: UserType
    user_name: string
    phone: string
    email: string
    subscribed_for_updates_at: string
    allow_tagging: boolean
    provider: string
    receive_notifications: boolean
    subscriptions: {
        teachers: string[]
        orgs: string[]
    }
    push_notification_tokens: PushNotificationToken[]
}

export interface CIUserData {
    user: CIUser
    userBio: UserBio
    notifications: UserNotification[]
    requests: CIRequest[]
    templates: CITemplate[]
    ci_events: CIEvent[]
    past_ci_events: CIEvent[]
    alerts: CIAlert[]
}

export interface DbUserWithoutJoin
    extends Omit<
        DbUser,
        | "notifications"
        | "requests"
        | "templates"
        | "bio_name"
        | "page_url"
        | "page_title"
        | "show_profile"
        | "allow_tagging"
        | "img"
        | "bio"
        | "ci_events"
    > {}

export interface DbUser {
    user_id: string
    created_at: string
    updated_at: string
    user_type: UserType
    user_name: string
    phone: string
    email: string
    subscribed_for_updates_at: string
    allow_tagging: boolean
    provider: string
    bio: UserBio
    default_filter: DefaultFilter
    push_notification_tokens: PushNotificationToken[]
    notifications: UserNotification[]
    subscriptions: {
        teachers: string[]
        orgs: string[]
    }
    receive_notifications: boolean
    requests: CIRequest[]
    templates: CITemplate[]
    ci_events: CIEvent[]
    alerts: CIAlert[]
}

export interface CIAlert {
    id: string
    ci_event_id?: string
    request_id?: string
    viewed: boolean
    type: NotificationType
    title: string
    start_date: string
    firstSegment: CIEventSegments
    address: IAddress
}

export interface DBCIAlert
    extends Omit<
        CIAlert,
        "ci_event_id" | "title" | "start_date" | "firstSegment" | "address"
    > {
    ci_event_id?: string
}
export interface UserBio {
    user_id: string
    bio_name: string
    page_url: string
    page_title: string
    show_profile: boolean
    allow_tagging: boolean
    img: string
    about: string
    user_type: UserType
}

export interface CIRequestResponse {
    response: string
    created_at: string
    responder_name: string
}
export interface CIRequest {
    id: string
    created_at: string
    request_type: string
    user_id: string
    type: RequestType
    status: RequestStatus
    message: string
    responses: CIRequestResponse[]
    phone: string
    email: string
    name: string
    viewed_response: boolean
    viewed_by: string[]
    number: number
}

export enum RequestType {
    make_profile = "make_profile",
    make_creator = "make_creator",
    make_org = "make_org",
    support = "support",
}

export enum RequestTypeHebrew {
    make_profile = "הרשמה כמורה",
    make_creator = "הרשמה כמורה ויוצר ארועים",
    make_org = "הרשמה כארגון",
    support = "תמיכה",
}

export enum RequestStatus {
    open = "open",
    closed = "closed",
}
export enum RequestStatusHebrew {
    open = "פתוח",
    closed = "סגור",
}

export interface RequestStatusOptions {
    value: RequestStatus
    label: RequestStatusHebrew
}

export type PushNotificationPromission = "granted" | "denied" | "default" | null

export interface NotificationPayload {
    schema: string
    table: string
    commit_timestamp: string
    eventType: "INSERT" | "UPDATE" | "DELETE" // Assuming these are the possible event types
    new: {
        ci_event_id: string
        created_at: string
        id: string
        is_sent: boolean
        remind_in_hours: string
        user_id: string
        title?: string
        start_date?: string
    }
    old?: {
        id?: string
    }
    errors: any | null
}
