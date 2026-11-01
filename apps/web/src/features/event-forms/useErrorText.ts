import { useCopy } from "../../app/language"
import type { FormErrors } from "@ci-calendar/core/lib/form"
import { EVENT_FORM_COPY } from "@ci-calendar/core/features/event-forms/eventFormCopy"
import type { EventFormError } from "@ci-calendar/core/features/event-forms/eventFormValues"

/** The error to show at `path`, in the event forms' words. */
export function useErrorText(errors: FormErrors<EventFormError>) {
    const copy = useCopy(EVENT_FORM_COPY)
    return (path: string) => {
        const error = errors[path]
        return error ? copy[error] : undefined
    }
}
