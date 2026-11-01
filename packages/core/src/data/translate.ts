import { withTimeout } from "@ci-calendar/core/lib/timeout"
import type { Functions } from "./functions"

// Machine translation through the `translate` Edge Function (legacy
// util/translate.ts `translateText`): the Google key lives only there, so
// nothing in the client can reach Google's Translate API itself. Hebrew is
// the source; English and Russian the targets. A failure or a hung call
// (after `LOOKUP_TIMEOUT_MS`) never surfaces: the source text stands, so a
// translation outage can't block a save or the event details.

/** The languages machine translation writes. */
export type TranslationTarget = "en" | "ru"

/** A hint for the translation (the function passes it on as is). */
export type TranslationContext = "name" | "general"

/**
 * This session's translations, per text and language (legacy's in-memory
 * cache; its Cache API copy is not kept: the details' translations live in
 * the query cache, and titles are stored with the event).
 */
const memory = new Map<string, string>()

const memoryKey = (text: string, language: TranslationTarget) =>
    `${language}\u0000${text}`

/**
 * `text` (Hebrew) in `language`, or `null` if it can't be translated now
 * (the function failed, or took longer than `LOOKUP_TIMEOUT_MS`). Never
 * rejects. Repeats within the session are served from memory (one
 * function call per text and language); failures aren't remembered.
 */
export async function translateOrNull(
    functions: Functions,
    text: string,
    language: TranslationTarget,
    context: TranslationContext = "general",
): Promise<string | null> {
    if (!text.trim()) return null
    const key = memoryKey(text, language)
    const remembered = memory.get(key)
    if (remembered !== undefined) return remembered
    const asked = functions
        .invoke<{ translatedText?: unknown }>("translate", {
            body: { text, targetLang: language, source: "he", context },
        })
        .then(({ data, error }) => {
            const translated = data?.translatedText
            if (error || typeof translated !== "string" || !translated) {
                return null
            }
            memory.set(key, translated)
            return translated
        })
    return withTimeout(asked, null)
}

/** `text` in `language`, or `text` itself if it can't be translated. */
export async function translateText(
    functions: Functions,
    text: string,
    language: TranslationTarget,
    context: TranslationContext = "general",
): Promise<string> {
    return (await translateOrNull(functions, text, language, context)) ?? text
}

/**
 * An event title's translations for `lng_titles` (legacy
 * `fetchTitleTranslation`): English and Russian at once. A language that
 * can't be translated is left out (legacy stored the Hebrew title there);
 * every reader falls back to the Hebrew title anyway (`pickTitle`, and
 * legacy's `getTitleByLanguage`).
 */
export async function translateTitle(
    functions: Functions,
    title: string,
): Promise<{ en?: string; ru?: string }> {
    const [ru, en] = await Promise.all([
        translateOrNull(functions, title, "ru", "name"),
        translateOrNull(functions, title, "en", "name"),
    ])
    return { ...(en ? { en } : {}), ...(ru ? { ru } : {}) }
}

/** Forgets this session's translations (tests). */
export function clearTranslationMemory() {
    memory.clear()
}
