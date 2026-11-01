import { createContext, useContext } from "react"
import { defineCopy } from "@ci-calendar/core/lib/copy"
import {
    DEFAULT_LANGUAGE,
    languagesToShow,
    textDirection,
    type Language,
} from "@ci-calendar/core/lib/language"
import type { DeviceStorage } from "./deviceStorage"

/** The languages offered, set per deployment (`VITE_LANGUAGES_TO_SHOW`). */
export const SHOWN_LANGUAGES = languagesToShow(
    import.meta.env.VITE_LANGUAGES_TO_SHOW,
)

/**
 * Where the chosen language is kept on the device: legacy's key and raw
 * value (`he`/`en`/`ru`), so a visitor's choice survives the cutover.
 */
export const LANGUAGE_STORAGE_KEY = "language"

/**
 * The stored language, or Hebrew for a first visit, an odd value, or a
 * language this deployment doesn't offer.
 */
export function storedLanguage(
    storage: DeviceStorage,
    shown: readonly Language[] = SHOWN_LANGUAGES,
): Language {
    try {
        const value = storage.getItem(LANGUAGE_STORAGE_KEY)
        return shown.find((language) => language === value) ?? DEFAULT_LANGUAGE
    } catch {
        return DEFAULT_LANGUAGE
    }
}

export function storeLanguage(storage: DeviceStorage, language: Language) {
    try {
        storage.setItem(LANGUAGE_STORAGE_KEY, language)
    } catch {
        // Storage full or blocked: the choice lasts until the page closes.
    }
}

const DOCUMENT_TITLE = defineCopy({
    he: { title: "לוח אירועי קונטקט אימפרוביזציה | CI Calendar" },
    en: { title: "Contact Improvisation Events in Israel | CI Calendar" },
    ru: { title: "Календарь контактной импровизации в Израиле | CI Calendar" },
})

/**
 * `<html lang dir>`, which the whole layout mirrors from, and the page
 * title. Set at boot, before the first render, and on every switch.
 */
export function applyLanguageToDocument(language: Language) {
    const root = document.documentElement
    root.lang = language
    root.dir = textDirection(language)
    document.title = DOCUMENT_TITLE[language].title
}

export interface LanguageState {
    language: Language
    /** Switches the interface language and remembers it on the device. */
    setLanguage: (language: Language) => void
}

export const LanguageContext = createContext<LanguageState | null>(null)

export function useLanguage(): LanguageState {
    const state = useContext(LanguageContext)
    if (!state) throw new Error("useLanguage outside <LanguageProvider>")
    return state
}

/** A component's copy (`defineCopy`) in the interface language. */
export function useCopy<T>(copy: Readonly<Record<Language, T>>): T {
    return copy[useLanguage().language]
}
