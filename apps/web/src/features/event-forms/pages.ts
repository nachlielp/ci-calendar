// The event-form pages, as one lazy chunk (`eventFormPage` in
// app/routes.tsx): one dynamic import in `/`'s route table for all of them,
// and moving from the chooser to a form, or between forms, downloads
// nothing more. The forms share most of their code anyway.

export { default as CreateEventsPage } from "./CreateEventsPage"
export { default as NewEventPage } from "./NewEventPage"
export { default as EditEventPage } from "./EditEventPage"
