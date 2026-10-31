import { useQueries } from "@tanstack/react-query"
import { useMemo } from "react"
import { useServices } from "../../../app/services"
import { translateOrNull } from "../../../data/translate"
import type { Language } from "../../../lib/language"
import { bioOf } from "../eventFormat"
import type { PublicEvent } from "../publicEvent"
import { storeTranslation, storedTranslation } from "./translationStore"

// Legacy FullEventCard's `translatePage`: in English and Russian, the
// details machine-translate the texts the creator wrote in Hebrew that
// have no stored translation: the description, link and price titles, and
// the names of organisations and multi-day teachers who have no bio
// (segment teachers' names stayed as written). The details show at once
// with the Hebrew; each translation replaces its text when it arrives.
// One query per text and language (the same text in another event isn't
// asked for again), kept for the session and on the device
// (./translationStore.ts), outside the persisted query cache.

export const TRANSLATION_KIND = "translation"

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

/**
 * `text` in the interface language where a translation has arrived, else
 * as written. Hebrew asks for nothing. Translations are kept on the device
 * (./translationStore.ts) and shown at once from there.
 */
export function useTranslated(
    event: PublicEvent,
    language: Language,
): (text: string) => string {
    const { functions, storage } = useServices()
    const texts = useMemo(
        () => (language === "he" ? [] : translatableTexts(event)),
        [event, language],
    )
    const translated = useQueries({
        queries: texts.map((text) => ({
            queryKey: [TRANSLATION_KIND, language, text],
            queryFn: async (): Promise<string | null> => {
                const stored = storedTranslation(storage, language, text)
                if (stored) return stored
                const result = await translateOrNull(
                    functions,
                    text,
                    language as "en" | "ru",
                )
                if (result) storeTranslation(storage, language, text, result)
                return result
            },
            initialData: () => storedTranslation(storage, language, text),
            // Kept for the session; a text that couldn't be translated
            // (`null`) is asked for again the next time it shows.
            staleTime: (query: { state: { data?: string | null } }) =>
                query.state.data ? Infinity : 0,
            gcTime: Infinity,
            retry: false,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
        })),
        combine: (results) => results.map((result) => result.data),
    })
    return (text) => {
        const index = texts.indexOf(text)
        return (index !== -1 && translated[index]) || text
    }
}
