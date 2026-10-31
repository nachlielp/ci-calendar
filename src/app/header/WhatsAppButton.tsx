import whatsappLogo from "../../assets/logos/whatsapp.svg?no-inline"
import { defineCopy } from "../../lib/copy"
import { isIos, isStandalone } from "../device"
import { useCopy } from "../language"
import "./WhatsAppButton.scss"

const COPY = defineCopy({
    he: {
        label: "שלחו לנו הודעה בוואטסאפ",
        // Legacy translations.ts `whatsappMessage`.
        message: "היי בואו נפטפט🙃",
    },
    en: { label: "Message us on WhatsApp", message: "Hey let's chat🙃" },
    ru: {
        label: "Напишите нам в WhatsApp",
        message: "Привет, давай поговорим🙃",
    },
})

/**
 * The WhatsApp logo in the header (legacy WhatsAppBanner): opens a chat with
 * the community's number (`VITE_WHATSAPP_NUMBER`) with a greeting typed in.
 * In the installed app on iOS it opens the WhatsApp app directly, as a web
 * link there would stay inside the app's window. Hidden when no number is
 * configured.
 */
export function WhatsAppButton() {
    const copy = useCopy(COPY)
    const number = import.meta.env.VITE_WHATSAPP_NUMBER
    if (!number) return null

    const text = encodeURIComponent(copy.message)
    const opensApp = isStandalone() && isIos()
    const href = opensApp
        ? `whatsapp://send?phone=${number}&text=${text}`
        : `https://wa.me/${number}?text=${text}`

    return (
        <a
            className="whatsapp-button"
            href={href}
            target={opensApp ? undefined : "_blank"}
            rel="noreferrer"
            aria-label={copy.label}
        >
            <img src={whatsappLogo} alt="" width={40} height={40} />
        </a>
    )
}
