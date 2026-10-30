import { useCopy } from "../../app/language"
import { NewEventFormPage } from "./EventFormPages"
import { FORM_PAGE_COPY } from "./formPageCopy"
import { SingleDayEventForm } from "./SingleDayEventForm"

/** Legacy SingleDayFormPage (`/create-events/single-day`): a new single-day event. */
export default function SingleDayFormPage() {
    const copy = useCopy(FORM_PAGE_COPY)
    return (
        <NewEventFormPage
            title={copy.singleDay}
            form={({ key, ...slot }) => (
                <SingleDayEventForm key={key} {...slot} />
            )}
        />
    )
}
