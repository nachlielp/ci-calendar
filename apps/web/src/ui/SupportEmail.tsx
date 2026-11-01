import { useCopy } from "../app/language"
import { defineCopy } from "@ci-calendar/core/lib/copy"
import "./SupportEmail.scss"

/** Legacy `EMAIL_SUPPORT`. */
export const SUPPORT_EMAIL = "info@ci-events.org"

// Legacy translations.ts `supportTitle` (its English and Russian put the
// colon first).
const COPY = defineCopy({
    he: { title: "לתמיכה שאלות או הערות ניתן לפנות אלינו במייל:" },
    en: { title: "For support, please contact us by email:" },
    ru: {
        title: "Для поддержки, пожалуйста, свяжитесь с нами по электронной почте:",
    },
})

/** The support address under the account pages (legacy `.support-email`). */
export function SupportEmail() {
    const copy = useCopy(COPY)
    return (
        <p className="support-email">
            <span>{copy.title}</span>
            <a
                href={`mailto:${SUPPORT_EMAIL}`}
                target="_blank"
                rel="noreferrer"
            >
                {SUPPORT_EMAIL}
            </a>
        </p>
    )
}
