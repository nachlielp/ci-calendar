import { useCopy } from "../app/language"
import { defineCopy } from "../lib/copy"

const COPY = defineCopy({
    he: { note: "" },
    en: { note: "This document is available in Hebrew only." },
    ru: { note: "Этот документ доступен только на иврите." },
})

/**
 * Says, in English and Russian, that the legal text below is Hebrew only.
 * Legacy published the privacy policy and terms in Hebrew alone; they are
 * legal texts, so they stay as written rather than translated here.
 */
export function HebrewOnlyNote() {
    const { note } = useCopy(COPY)
    return note ? <p className="hebrew-only">{note}</p> : null
}
