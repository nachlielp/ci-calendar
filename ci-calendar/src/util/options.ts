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

export const tagOptions: SelectOption[] = [
  { value: "everyone", label: "פתוח לכולם" },
  { value: "beginner", label: "מתחילים" },
  { value: "advanced", label: "מתקדמים" },
  { value: "male", label: "גברים" },
  { value: "female", label: "נשים" },
  { value: "pre-registration", label: "הרשמה מראש" },
];

export const districtOptions: SelectOption[] = [
  { value: "jerusalem", label: "ירושלים" },
  { value: "center", label: "מרכז" },
  { value: "north", label: "צפון" },
  { value: "south", label: "דרום" },
];

export const viewOptions: SelectOption[] = [
  { value: "calendar", label: "calendar" },
  { value: "list", label: "list" },
];
