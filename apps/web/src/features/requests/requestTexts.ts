import { useCopy, useLanguage } from "../../app/language"
import { useMachineTranslation } from "../../app/useMachineTranslation"
import { isRequestNote } from "@ci-calendar/core/features/requests/requestRows"
import { REQUEST_WORDS } from "@ci-calendar/core/features/requests/requestWords"

/**
 * A request's texts in the reader's language: the notes the app stores
 * (`REQUEST_NOTES`) in its words, and what people wrote (a message, a
 * reply), in English and Russian, machine-translated from Hebrew. Private
 * text, so the translations stay in memory, never on the device. It imports
 * no feature, so the admin pages may use it too.
 */
export function useRequestTexts(
    texts: readonly string[],
): (text: string) => string {
    const words = useCopy(REQUEST_WORDS)
    const { language } = useLanguage()
    const translated = useMachineTranslation(
        texts.filter((text) => !isRequestNote(text)),
        language,
    )
    return (text) => (isRequestNote(text) ? words.note(text) : translated(text))
}
