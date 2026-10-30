import { useCopy } from "../../app/language"
import { MULTI_DAY_EDIT_DRAFT_KEY } from "./draftKeys"
import { EditEventFormPage } from "./EventFormPages"
import { FORM_PAGE_COPY } from "./formPageCopy"
import { MultiDayEventForm } from "./MultiDayEventForm"

/**
 * Legacy EditMultiDayFormPage (`/manage-events/edit-multi-day/:eventId`):
 * one of the user's own multi-day events.
 */
export default function EditMultiDayFormPage() {
    const copy = useCopy(FORM_PAGE_COPY)
    return (
        <EditEventFormPage
            title={copy.editMultiDay}
            multiDay
            draftKey={MULTI_DAY_EDIT_DRAFT_KEY}
            form={(slot) => <MultiDayEventForm key={slot.event.id} {...slot} />}
        />
    )
}
