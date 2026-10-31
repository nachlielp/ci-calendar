import { useQueries } from "@tanstack/react-query"
import { useMemo } from "react"
import { translateOrNull, type TranslationTarget } from "../data/translate"
import type { Language } from "../lib/language"
import { useServices } from "./services"
import { storeTranslation, storedTranslation } from "./translationStore"

// Machine translation of what people wrote (in Hebrew) for a reader in
// English or Russian, through the `translate` function (data/translate.ts):
// the event details (legacy FullEventCard's `translatePage`), bios and
// requests. The texts show at once as written; each translation replaces
// its text when it arrives, and a failed one leaves it as written. One
// query per text and language (the same text elsewhere isn't asked for
// again). The queries aren't a public kind, so they leave the cache when
// the user signs out (auth/session.ts).

export const TRANSLATION_KIND = "translation"

const SEPARATOR = "\u0000"

/** Whether `text` has Hebrew letters: the only source the function takes. */
export const hasHebrew = (text: string) => /[\u0590-\u05ff]/.test(text)

export interface TranslationOptions {
    /**
     * Keep the translations on the device across visits
     * (./translationStore.ts) and show them from there at once. For public
     * texts; leave off for private ones (requests), which stay in memory.
     */
    onDevice?: boolean
}

/**
 * `text` in the interface language where a translation has arrived, else
 * as written. Hebrew asks for nothing, and neither does a text without
 * Hebrew letters (written in another language already) or an empty one.
 * Only `texts` are translated; any other text comes back as given.
 */
export function useMachineTranslation(
    texts: readonly string[],
    language: Language,
    { onDevice = false }: TranslationOptions = {},
): (text: string) => string {
    const { functions, storage } = useServices()
    // `texts` by content: callers build a new array every render.
    const joined = texts.join(SEPARATOR)
    const asked = useMemo(
        () =>
            language === "he"
                ? []
                : [...new Set(joined.split(SEPARATOR).filter(hasHebrew))],
        [joined, language],
    )
    const translated = useQueries({
        queries: asked.map((text) => ({
            queryKey: [TRANSLATION_KIND, language, text],
            queryFn: async (): Promise<string | null> => {
                const stored = onDevice
                    ? storedTranslation(storage, language, text)
                    : undefined
                if (stored) return stored
                const result = await translateOrNull(
                    functions,
                    text,
                    language as TranslationTarget,
                )
                if (result && onDevice) {
                    storeTranslation(storage, language, text, result)
                }
                return result
            },
            initialData: () =>
                onDevice
                    ? storedTranslation(storage, language, text)
                    : undefined,
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
        const index = asked.indexOf(text)
        return (index !== -1 && translated[index]) || text
    }
}
