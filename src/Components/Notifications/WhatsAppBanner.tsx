import whatsapp from "../../assets/svgs/whatsapp.wine.svg"
import { Icon } from "../Common/Icon"
import "../../styles/whatsapp-banner.scss"
import { store } from "../../Store/store"
import { translations } from "../../util/translations"
import { utilService } from "../../util/utilService"

function WhatsAppBanner() {
    const whatsappUrl = `https://wa.me/${
        import.meta.env.VITE_WHATSAPP_NUMBER
    }?text=${encodeURIComponent(
        translations[store.getLanguage].whatsappMessage
    )}`

    const handleWhatsAppClick = (e: React.MouseEvent) => {
        e.preventDefault()

        if (utilService.isPWA()) {
            if (utilService.isIos()) {
                window.location.href = `whatsapp://send?phone=${
                    import.meta.env.VITE_WHATSAPP_NUMBER
                }&text=${encodeURIComponent(
                    translations[store.getLanguage].whatsappMessage
                )}`
            } else {
                window.open(whatsappUrl, "_blank")
            }
        } else {
            window.open(whatsappUrl, "_blank")
        }
    }

    return (
        <section className={`whatsapp-banner`}>
            <button
                className="whatsapp-btn"
                onClick={handleWhatsAppClick}
                rel="noreferrer"
            >
                <Icon icon={whatsapp} className="whatsapp-icon" />
            </button>
        </section>
    )
}

export default WhatsAppBanner
