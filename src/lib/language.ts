// The app's interface languages (legacy util/interfaces.ts `Language`) and
// the per-language facts the rest of the app reads: direction, Intl locale,
// and the shape of translated copy.

/** In the order the language switcher offers them, as legacy did. */
export const LANGUAGES = ["he", "en", "ru"] as const

export type Language = (typeof LANGUAGES)[number]

/** A first visit is in Hebrew, whatever the browser's language (legacy). */
export const DEFAULT_LANGUAGE: Language = "he"

export const isLanguage = (value: unknown): value is Language =>
    (LANGUAGES as readonly unknown[]).includes(value)

export const textDirection = (language: Language): "rtl" | "ltr" =>
    language === "he" ? "rtl" : "ltr"

/**
 * The `Intl` locale of each language. English is US English: legacy showed
 * month before day (`Saturday, November 7th`).
 */
export const INTL_LOCALES: Readonly<Record<Language, string>> = {
    he: "he-IL",
    en: "en-US",
    ru: "ru-RU",
}

/** Each language's name in itself, for the language switcher. */
export const LANGUAGE_NAMES: Readonly<Record<Language, string>> = {
    he: "עברית",
    en: "English",
    ru: "Русский",
}

/**
 * The languages offered, from `VITE_LANGUAGES_TO_SHOW` (legacy's setting,
 * e.g. `he,en,ru`), in its order: known codes only, all three when unset or
 * empty. Hebrew, the default, is always offered.
 */
export function languagesToShow(setting: string | undefined): Language[] {
    const listed = (setting ?? "")
        .split(",")
        .map((code) => code.trim())
        .filter(isLanguage)
    if (listed.length === 0) return [...LANGUAGES]
    const unique = [...new Set(listed)]
    return unique.includes(DEFAULT_LANGUAGE)
        ? unique
        : [DEFAULT_LANGUAGE, ...unique]
}
