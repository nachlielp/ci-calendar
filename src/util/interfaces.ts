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
export interface IAddress {
    place_id: string
    label: string
    en_label?: string
}
export interface CIEvent {
    id: string
    short_id: string
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
    creator: {
        user_id: string
        full_name: string
    }
    cancelled: boolean
    cancelled_text: string
    recurring_ref_key?: string
    lng_titles?: {
        ru?: string
        en?: string
    }
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

export enum UserTypeHebrew {
    admin = "מנהל",
    creator = "מורה ויוצר ארועים",
    profile = "מורה",
    org = "ארגון",
    user = "משתמש רגיל",
}



export interface WeeklyScheduleFilters {
    "district-weekly": string[]
    "district-monthly": string[]
    "weekly-event-type": string[]
}

export interface CIUser {
    id: string
    created_at: string
    updated_at: string
    user_type: UserType
    user_name: string
    phone: string
    email: string
    subscribed_for_updates_at: string
    allow_tagging: boolean
    provider: string
    subscriptions: {
        teachers: string[]
        orgs: string[]
    }
    version: string
    pwa_install_id: string | null
    is_internal: boolean
    receive_weekly_schedule: boolean
    weekly_schedule: WeeklyScheduleFilters
}

export interface CIUserData {
    user: CIUser
    userBio: UserBio
    requests: CIRequest[]
    templates: CITemplate[]
    ci_events: CIEvent[]
    past_ci_events: CIEvent[]
    future_ci_events: CIEvent[]
}

export interface DbUserWithoutJoin
    extends Omit<
        DbUser,
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
    id: string
    created_at: string
    updated_at: string
    last_signin: string
    user_type: UserType
    user_name: string
    phone: string
    email: string
    subscribed_for_updates_at: string
    allow_tagging: boolean
    provider: string
    bio: UserBio
    subscriptions: {
        teachers: string[]
        orgs: string[]
    }
    requests: CIRequest[]
    templates: CITemplate[]
    ci_events: CIEvent[]
    version: string
    pwa_install_id: string | null
}


export interface UserBio {
    user_id: string
    bio_name: string
    page_url: string
    page_title: string
    page_url_2: string
    page_title_2: string
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
    sent: boolean
    to_send: boolean
    viewed: boolean
    closed: boolean
}

export enum RequestType {
    profile = "profile",
    creator = "creator",
    org = "org",
    support = "support",
}

export enum RequestTypeHebrew {
    profile = "הרשמה כמורה",
    creator = "הרשמה כמורה ויוצר ארועים",
    org = "הרשמה כארגון",
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

export enum PromissionStatus {
    granted = "granted",
    denied = "denied",
    default = "default",
}

export interface NotificationPayload {
    schema: string
    table: string
    commit_timestamp: string
    eventType: "INSERT" | "UPDATE" | "DELETE" // Assuming these are the possible event types
    new: {
        ci_event_id: string
        created_at: string
        id: string
        sent: boolean
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

export interface TaggableUserOptions {
    user_id: string
    bio_name: string
    user_type: UserType
}

export interface CIConfig {
    app_title: string
    app_description: string
}
export type DBCIEvent = Omit<CIEvent, "users" | "creator">

export interface UserRole {
    user_id: string
    role_id: number
    user_type: UserType
}

export type ManageUserOption = {
    id: string
    user_name: string
    user_type: UserType
    email: string
    phone: string
    role: {
        id: number
        role: string
    }
}

export enum SupabaseSessionEvent {
    signedIn = "SIGNED_IN",
    signedOut = "SIGNED_OUT",
    initialSession = "INITIAL_SESSION",
    sessionChange = "SESSION_CHANGE",
    tokenRefreshed = "TOKEN_REFRESHED",
    userUpdated = "USER_UPDATED",
    userDeleted = "USER_DELETED",
    passwordRecovery = "PASSWORD_RECOVERY",
}

export enum Language {
    he = "he",
    en = "en",
    ru = "ru",
}
