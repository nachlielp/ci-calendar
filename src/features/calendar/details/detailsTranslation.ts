import { useMemo } from "react"
import { useMachineTranslation } from "../../../app/useMachineTranslation"
import type { Language } from "../../../lib/language"
import { bioOf } from "../eventFormat"
import type { PublicEvent } from "../publicEvent"

// Legacy FullEventCard's `translatePage`: in English and Russian, the
// details machine-translate the texts the creator wrote in Hebrew that
// have no stored translation: the description, link and price titles, and
// the names of organisations and multi-day teachers who have no bio
// (segment teachers' names stayed as written). Through
// `useMachineTranslation`, kept on the device: they are public.

/** What legacy translated in the details (marked `translate-this`). */
export function translatableTexts(event: PublicEvent): string[] {
    const untagged = [...event.organisations, ...event.multiDayTeachers]
        .filter((tag) => !bioOf(event, tag))
        .map((tag) => tag.label)
    const texts = [
        event.description,
        ...event.links.map((link) => link.title),
        ...event.prices.map((price) => price.title),
        ...untagged,
    ]
    return [...new Set(texts.filter((text) => text.trim()))]
}

/** `text` in the interface language where a translation has arrived. */
export function useTranslated(
    event: PublicEvent,
    language: Language,
): (text: string) => string {
    const texts = useMemo(() => translatableTexts(event), [event])
    return useMachineTranslation(texts, language, { onDevice: true })
}
