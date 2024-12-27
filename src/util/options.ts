import {
    RequestStatus,
    RequestStatusHebrew,
    RequestStatusOptions,
    RequestType,
    RequestTypeHebrew,
} from "./interfaces"

export interface SelectOption {
    value: string
    label: string
}
export const eventOptions: SelectOption[] = [
    { value: "class", label: "שיעור" },
    { value: "jame", label: "ג'אם" },
    { value: "underscore", label: "אנדרסקור" },
    { value: "workshop", label: "סדנה" },
    { value: "retreat", label: "ריטריט" },
    { value: "conference", label: "כנס" },
    { value: "warmup", label: "חימום" },
    { value: "course", label: "קורס" },
]

export const hebrewMonths: SelectOption[] = [
    { value: "01", label: "ינואר" },
    { value: "02", label: "פברואר" },
    { value: "03", label: "מרץ" },
    { value: "04", label: "אפריל" },
    { value: "05", label: "מאי" },
    { value: "06", label: "יוני" },
    { value: "07", label: "יולי" },
    { value: "08", label: "אוגוסט" },
    { value: "09", label: "ספטמבר" },
    { value: "10", label: "אוקטובר" },
    { value: "11", label: "נובמבר" },
    { value: "12", label: "דצמבר" },
]

export const tagOptions: SelectOption[] = [
    { value: "everyone", label: "פתוח לכולם" },
    { value: "beginner", label: "מתחילים" },
    { value: "advanced", label: "מתקדמים" },
    { value: "male", label: "גברים" },
    { value: "female", label: "נשים" },
    { value: "pre-registration", label: "הרשמה מראש" },
]

export const districtOptions: SelectOption[] = [
    // { value: "north", label: "צפון" },
    { value: "center", label: "מרכז" },
    { value: "jerusalem", label: "ירושלים" },
    { value: "עalilee", label: "גליל" },
    { value: "haifa", label: "חיפה" },
    { value: "carmel", label: "חוף כרמל" },
    { value: "pardes-hana", label: "פרדס חנה" },
    { value: "south", label: "דרום" },
    // Add more districts as needed
]

export const viewOptions: SelectOption[] = [
    { value: "calendar", label: "calendar" },
    { value: "list", label: "list" },
]

export const requestStatusOptions: RequestStatusOptions[] = [
    { value: RequestStatus.open, label: RequestStatusHebrew.open },
    { value: RequestStatus.closed, label: RequestStatusHebrew.closed },
]
export const requestTypeOptions: SelectOption[] = [
    { value: RequestType.profile, label: RequestTypeHebrew.profile },
    { value: RequestType.creator, label: RequestTypeHebrew.creator },
    { value: RequestType.org, label: RequestTypeHebrew.org },
    // { value: RequestType.support, label: RequestTypeHebrew.support },
]
export enum ScreenSize {
    mobile = 600,
    tablet = 900,
    desktop = 1200,
}

export const singleDayNotificationOptions: SelectOption[] = [
    { label: "ללא התראה", value: "0" },
    { label: "שעה לפני הארוע", value: "1" },
    { label: "שעתיים לפני הארוע", value: "2" },
    { label: "4 שעות לפני הארוע", value: "4" },
    { label: "יום לפני הארוע", value: "24" },
    { label: "יומיים לפני הארוע", value: "48" },
]
export const multiDayNotificationOptions: SelectOption[] = [
    { label: "ללא התראה", value: "0" },
    { label: "יום לפני הארוע", value: "24" },
    { label: "יומיים לפני הארוע", value: "48" },
    { label: "שבוע לפני הארוע", value: "168" },
]
