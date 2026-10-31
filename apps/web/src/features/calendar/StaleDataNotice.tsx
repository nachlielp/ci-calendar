import { useCopy } from "../../app/language"
import { defineCopy } from "../../lib/copy"
import { useStaleReason } from "./useStaleReason"
import "./StaleDataNotice.scss"

const COPY = defineCopy({
    he: {
        offline: "אין חיבור לאינטרנט – ייתכן שהאירועים אינם מעודכנים",
        refreshFailed: "לא הצלחנו לרענן – ייתכן שהאירועים אינם מעודכנים",
    },
    en: {
        offline: "No internet connection – the events may be out of date",
        refreshFailed: "We couldn't refresh – the events may be out of date",
    },
    ru: {
        offline: "Нет подключения к интернету – события могут быть устаревшими",
        refreshFailed: "Не удалось обновить – события могут быть устаревшими",
    },
})

/**
 * The header's sign that the events may be out of date (legacy AppHeader's
 * offline cloud): the device is offline, or refreshing the cached events
 * failed. As in legacy it shows only the icon, which says why on hover and
 * to screen readers.
 */
export function StaleDataNotice() {
    const copy = useCopy(COPY)
    const reason = useStaleReason()
    if (!reason) return null
    return (
        <p role="status" className="stale-data-notice" title={copy[reason]}>
            <CloudOfflineIcon />
            <span className="visually-hidden">{copy[reason]}</span>
        </p>
    )
}

// The old client's assets/svgs/cloud_offline.svg, the legacy offline icon.
function CloudOfflineIcon() {
    return (
        <svg
            aria-hidden="true"
            className="stale-data-notice-icon"
            viewBox="0 0 512 512"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={32}
        >
            <path d="M93.72,183.25C49.49,198.05,16,233.1,16,288c0,66,54,112,120,112H320.37" />
            <path d="M467.82,377.74C485.24,363.3,496,341.61,496,312c0-59.82-53-85.76-96-88-8.89-89.54-71-144-144-144-26.16,0-48.79,6.93-67.6,18.14" />
            <line x1="448" y1="448" x2="64" y2="64" />
        </svg>
    )
}
