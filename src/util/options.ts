export interface SelectOption {
  value: string;
  label: string;
}
export const eventTypes: SelectOption[] = [
  { value: "class", label: "שיעור" },
  { value: "jame", label: "ג'אם" },
  { value: "underscore", label: "אנדרסקור" },
  { value: "workshop", label: "סדנה" },
  { value: "retreat", label: "ריטריט" },
  { value: "conference", label: "כנס" },
  { value: "warmup", label: "חימום" },
];

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
];

export const tagOptions: SelectOption[] = [
  { value: "everyone", label: "פתוח לכולם" },
  { value: "beginner", label: "מתחילים" },
  { value: "advanced", label: "מתקדמים" },
  { value: "male", label: "גברים" },
  { value: "female", label: "נשים" },
  { value: "pre-registration", label: "הרשמה מראש" },
];

export const districtOptions = [
  { value: 'north', label: 'צפון' },
  { value: 'south', label: 'דרום' },
  { value: "center", label: "מרכז" },
  { value: "jerusalem", label: "ירושלים" },
  // Add more districts as needed
];

export const viewOptions: SelectOption[] = [
  { value: "calendar", label: "calendar" },
  { value: "list", label: "list" },
];
