import { personalKey } from "../../app/auth/personalStorage"

// The event forms' draft keys in device storage (./eventDraft.ts): personal
// keys, removed on sign-out by their prefix (app/auth/personalStorage.ts).

/** The new single-day event's draft. */
export const SINGLE_DAY_DRAFT_KEY = personalKey("single-day-event-draft")
/** The single-day edit form's draft (for the one event it names). */
export const SINGLE_DAY_EDIT_DRAFT_KEY = personalKey("single-day-edit-draft")
/** The new multi-day event's draft. */
export const MULTI_DAY_DRAFT_KEY = personalKey("multi-day-event-draft")
/** The multi-day edit form's draft (for the one event it names). */
export const MULTI_DAY_EDIT_DRAFT_KEY = personalKey("multi-day-edit-draft")
