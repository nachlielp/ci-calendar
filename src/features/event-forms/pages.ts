// The event-form pages, as one lazy chunk (`eventFormPage` in
// app/routes.tsx): one dynamic import in `/`'s route table for all five,
// and moving from the chooser to a form, or between forms, downloads
// nothing more. The forms share most of their code anyway.

export { default as CreateEventsPage } from "./CreateEventsPage"
export { default as SingleDayFormPage } from "./SingleDayFormPage"
export { default as EditSingleDayFormPage } from "./EditSingleDayFormPage"
export { default as MultiDayFormPage } from "./MultiDayFormPage"
export { default as EditMultiDayFormPage } from "./EditMultiDayFormPage"
