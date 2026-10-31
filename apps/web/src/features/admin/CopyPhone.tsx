import { useState, type ReactNode } from "react"
import { useCopy } from "../../app/language"
import { defineCopy } from "../../lib/copy"
import { FormAlert } from "../../ui/form/fields"
import { ContentCopyIcon } from "../../ui/icons/ContentCopyIcon"

const COPY = defineCopy({
    he: {
        copyPhone: "העתקת מספר הטלפון",
        phoneCopied: "מספר הטלפון הועתק",
    },
    en: {
        copyPhone: "Copy the phone number",
        phoneCopied: "Phone number copied to clipboard",
    },
    ru: {
        copyPhone: "Скопировать номер телефона",
        phoneCopied: "Номер телефона скопирован",
    },
})

/**
 * A phone number on an admin page (a user's, a request's) that copies
 * itself on a tap (legacy's copy-to-clipboard), then says so. Without a
 * clipboard (permission refused) nothing happens: the number is on screen.
 * Styled by `features/admin/_copy-phone.scss`, which the page's stylesheet
 * `@use`s.
 */
export function CopyPhone({
    phone,
    label,
}: {
    phone: string
    /** Shown before the number (e.g. "Phone: "). */
    label?: ReactNode
}) {
    const copy = useCopy(COPY)
    const [copied, setCopied] = useState(false)

    async function copyPhone() {
        try {
            await navigator.clipboard.writeText(phone)
            setCopied(true)
        } catch {
            // No clipboard (permission refused): the number is on screen.
        }
    }

    return (
        <>
            <button
                type="button"
                className="copy-phone"
                title={copy.copyPhone}
                onClick={() => void copyPhone()}
            >
                {label}
                <span dir="ltr">{phone}</span>
                <ContentCopyIcon className="copy-icon" />
                <span className="visually-hidden">{copy.copyPhone}</span>
            </button>
            {copied && <FormAlert kind="success">{copy.phoneCopied}</FormAlert>}
        </>
    )
}
