import { useCopy } from "../../app/language"
import { NewEventFormPage } from "./EventFormPages"
import { FORM_PAGE_COPY } from "./formPageCopy"
import { SingleDayEventForm } from "./SingleDayEventForm"
import { TEMPLATE_COPY } from "./templateCopy"
import { SingleDayTemplateForm } from "./TemplateForms"
import { useIsTemplate } from "./templates"

/**
 * Legacy SingleDayFormPage (`/create-events/single-day`): a new single-day
 * event, or with `?isTemplate=true` (legacy's link) a new template.
 */
export default function SingleDayFormPage() {
    const copy = useCopy(FORM_PAGE_COPY)
    const templateCopy = useCopy(TEMPLATE_COPY)
    const isTemplate = useIsTemplate()
    return (
        <NewEventFormPage
            title={isTemplate ? templateCopy.singleDay : copy.singleDay}
            form={({ key, ...slot }) =>
                isTemplate ? (
                    <SingleDayTemplateForm key={key} {...slot} />
                ) : (
                    <SingleDayEventForm key={key} {...slot} />
                )
            }
        />
    )
}
