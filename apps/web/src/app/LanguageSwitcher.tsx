import { useEffect, useRef, useState } from "react"
import enFlag from "../assets/flags/en.png?no-inline"
import heFlag from "../assets/flags/he.png?no-inline"
import ruFlag from "../assets/flags/ru.png?no-inline"
import { defineCopy } from "@ci-calendar/core/lib/copy"
import { LANGUAGE_NAMES, type Language } from "@ci-calendar/core/lib/language"
import { SHOWN_LANGUAGES, useCopy, useLanguage } from "./language"
import "./LanguageSwitcher.scss"

// Separate files, not inlined into the JS: only the shown flag downloads
// before the menu opens.
const FLAGS: Readonly<Record<Language, string>> = {
    he: heFlag,
    en: enFlag,
    ru: ruFlag,
}

const COPY = defineCopy({
    he: { language: "שפה" },
    en: { language: "Language" },
    ru: { language: "Язык" },
})

/**
 * The language menu (legacy AppHeader's flag select): the current language's
 * flag, opening a column of the flags this deployment offers. Escape or a press outside closes
 * it; picking a language switches the whole interface at once.
 */
export function LanguageSwitcher() {
    const { language, setLanguage } = useLanguage()
    const copy = useCopy(COPY)
    const [open, setOpen] = useState(false)
    const root = useRef<HTMLDivElement>(null)
    const toggle = useRef<HTMLButtonElement>(null)

    useEffect(() => {
        if (!open) return
        const onPointerDown = (event: PointerEvent) => {
            if (!root.current?.contains(event.target as Node)) setOpen(false)
        }
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key !== "Escape") return
            setOpen(false)
            toggle.current?.focus()
        }
        document.addEventListener("pointerdown", onPointerDown)
        document.addEventListener("keydown", onKeyDown)
        return () => {
            document.removeEventListener("pointerdown", onPointerDown)
            document.removeEventListener("keydown", onKeyDown)
        }
    }, [open])

    const choose = (next: Language) => {
        setLanguage(next)
        setOpen(false)
        toggle.current?.focus()
    }

    return (
        <div ref={root} className="language-switcher">
            <button
                ref={toggle}
                type="button"
                className="language-switcher-toggle"
                aria-label={`${copy.language}: ${LANGUAGE_NAMES[language]}`}
                aria-expanded={open}
                onClick={() => setOpen(!open)}
            >
                <Flag language={language} />
            </button>
            {open && (
                <ul
                    className="language-switcher-menu"
                    aria-label={copy.language}
                >
                    {SHOWN_LANGUAGES.map((option) => (
                        <li key={option}>
                            <button
                                type="button"
                                lang={option}
                                className="language-switcher-option"
                                aria-label={LANGUAGE_NAMES[option]}
                                aria-pressed={option === language}
                                onClick={() => choose(option)}
                            >
                                <Flag language={option} />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

function Flag({ language }: { language: Language }) {
    return (
        <img
            className="language-switcher-flag"
            src={FLAGS[language]}
            alt=""
            width={24}
            height={24}
        />
    )
}
