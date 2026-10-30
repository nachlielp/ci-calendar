import { useCopy } from "../../app/language"
import { NewEventFormPage } from "./EventFormPages"
import { FORM_PAGE_COPY } from "./formPageCopy"
import { MultiDayEventForm } from "./MultiDayEventForm"
import { TEMPLATE_COPY } from "./templateCopy"
import { MultiDayTemplateForm } from "./TemplateForms"
import { useIsTemplate } from "./templates"

/**
 * Legacy MultiDayFormPage (`/create-events/multi-day`): a new multi-day
 * event, or with `?isTemplate=true` (legacy's link) a new template; legacy's
 * notice either way.
 */
export default function MultiDayFormPage() {
    const copy = useCopy(FORM_PAGE_COPY)
    const templateCopy = useCopy(TEMPLATE_COPY)
    const isTemplate = useIsTemplate()
    return (
        <NewEventFormPage
            title={isTemplate ? templateCopy.multiDay : copy.multiDay}
            notice={copy.multiDayNotice}
            form={({ key, ...slot }) =>
                isTemplate ? (
                    <MultiDayTemplateForm key={key} {...slot} />
                ) : (
                    <MultiDayEventForm key={key} {...slot} />
                )
            }
        />
    )
}
