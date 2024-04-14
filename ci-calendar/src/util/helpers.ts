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
