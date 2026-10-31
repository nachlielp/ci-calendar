import {
    useCallback,
    useLayoutEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react"
import type { Language } from "../lib/language"
import {
    applyLanguageToDocument,
    LanguageContext,
    storedLanguage,
    storeLanguage,
} from "./language"
import { useServices } from "./services"

/**
 * The interface language: the one stored on the device, else Hebrew. A
 * layout effect sets `<html lang dir>` before the first paint and on every
 * switch, so text never shows in the wrong direction.
 *
 * `setLanguage` is the one way to change it. Legacy kept the language on the
 * device only (the `users` table has no language column); if accounts ever
 * carry one, the signed-in boot calls `setLanguage` with it.
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
    const { storage } = useServices()
    const [language, setState] = useState(() => storedLanguage(storage))

    useLayoutEffect(() => applyLanguageToDocument(language), [language])

    const setLanguage = useCallback(
        (next: Language) => {
            storeLanguage(storage, next)
            setState(next)
        },
        [storage],
    )
    const value = useMemo(
        () => ({ language, setLanguage }),
        [language, setLanguage],
    )

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    )
}
