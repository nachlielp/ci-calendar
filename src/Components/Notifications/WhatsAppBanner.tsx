import whatsapp from "../../assets/svgs/whatsapp.wine.svg"
import { Icon } from "../Common/Icon"
import "../../styles/whatsapp-banner.scss"
import { store } from "../../Store/store"
import { translations } from "../../util/translations"

function WhatsAppBanner() {
    const whatsappUrl = `https://wa.me/${
        import.meta.env.VITE_WHATSAPP_NUMBER
    }?text=${encodeURIComponent(
        translations[store.getLanguage].whatsappMessage
    )}`
    return (
        <section className={`whatsapp-banner`}>
            <a href={whatsappUrl} className="whatsapp-btn">
                <Icon icon={whatsapp} className="whatsapp-icon" />
            </a>
        </section>
    )
}

export default WhatsAppBanner
