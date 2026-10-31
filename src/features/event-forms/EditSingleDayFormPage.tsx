import { useCopy } from "../../app/language"
import { SINGLE_DAY_EDIT_DRAFT_KEY } from "./draftKeys"
import { EditEventFormPage } from "./EventFormPages"
import { FORM_PAGE_COPY } from "./formPageCopy"
import { SingleDayEventForm } from "./SingleDayEventForm"

/**
 * Legacy EditSingleDayFormPage (`/manage-events/edit-single-day/:eventId`):
 * one of the user's own single-day events.
 */
export default function EditSingleDayFormPage() {
    const copy = useCopy(FORM_PAGE_COPY)
    return (
        <EditEventFormPage
            title={copy.editSingleDay}
            multiDay={false}
            draftKey={SINGLE_DAY_EDIT_DRAFT_KEY}
            form={(slot) => (
                <SingleDayEventForm key={slot.event.id} {...slot} />
            )}
        />
    )
}
