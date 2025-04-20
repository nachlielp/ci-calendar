import whatsapp from "../../assets/svgs/whatsapp.wine.svg"
import { Icon } from "../Common/Icon"
import "../../styles/whatsapp-banner.scss"

function WhatsAppBanner() {
    const onClick = () => {
        window.open(
            `https://wa.me/${
                import.meta.env.VITE_WHATSAPP_NUMBER
            }?text=${encodeURIComponent("היי")}`,
            "_blank"
        )
    }
    return (
        <section className={`whatsapp-banner`}>
            <button className="whatsapp-btn" onClick={onClick}>
                <Icon icon={whatsapp} className="whatsapp-icon" />
            </button>
        </section>
    )
}

export default WhatsAppBanner
