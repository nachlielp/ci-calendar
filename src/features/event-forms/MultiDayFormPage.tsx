import { useCopy } from "../../app/language"
import { NewEventFormPage } from "./EventFormPages"
import { FORM_PAGE_COPY } from "./formPageCopy"
import { MultiDayEventForm } from "./MultiDayEventForm"

/** Legacy MultiDayFormPage (`/create-events/multi-day`): a new multi-day event. */
export default function MultiDayFormPage() {
    const copy = useCopy(FORM_PAGE_COPY)
    return (
        <NewEventFormPage
            title={copy.multiDay}
            notice={copy.multiDayNotice}
            form={({ key, ...slot }) => (
                <MultiDayEventForm key={key} {...slot} />
            )}
        />
    )
}
