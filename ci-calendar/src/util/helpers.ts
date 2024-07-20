import { SelectOption } from "./options";

export function checkInvalidData(obj: any, path: string = "") {
  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    const currentPath = path ? `${path}.${key}` : key; // Construct the path to the current field

    if (
      typeof value === "object" &&
      value !== null &&
      !(value instanceof Date)
    ) {
      if (Array.isArray(value)) {
        value.forEach((item, index) =>
          checkInvalidData(item, `${currentPath}[${index}]`)
        ); // Handle arrays
      } else {
        checkInvalidData(value, currentPath); // Recursive call for nested objects
      }
    } else if (
      typeof value === "function" ||
      typeof value === "symbol" ||
      typeof value === "undefined"
    ) {
      console.error(`Invalid type for field ${currentPath}:`, value);
    }
  });
}

export function getMonthNameHebrew(month: number) {
  switch (month) {
    case 0:
      return "ינואר";
    case 1:
      return "פברואר";
    case 2:
      return "מרץ";
    case 3:
      return "אפריל";
    case 4:
      return "מאי";
    case 5:
      return "יוני";
    case 6:
      return "יולי";
    case 7:
      return "אוגוסט";
    case 8:
      return "ספטמבר";
    case 9:
      return "אוקטובר";
    case 10:
      return "נובמבר";
    case 11:
      return "דצמבר";
  }
}

export function getLabelByValue(value: string, options: SelectOption[]) {
  return options.find((option) => option.value === value)?.label;
}     