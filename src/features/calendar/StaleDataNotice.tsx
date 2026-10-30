import "./StaleDataNotice.scss"

// Copy lives here, in one place, for the languages slice to translate.
const COPY = {
    offline: "אין חיבור לאינטרנט – ייתכן שהאירועים אינם מעודכנים",
    refreshFailed: "לא הצלחנו לרענן – ייתכן שהאירועים אינם מעודכנים",
}

/**
 * A small sign that the events shown may be out of date: the device is
 * offline, or the shown data is cached and refreshing it failed.
 */
export function StaleDataNotice({ reason }: { reason: keyof typeof COPY }) {
    return (
        <p role="status" className="stale-data-notice">
            <CloudOfflineIcon />
            {COPY[reason]}
        </p>
    )
}

// legacy/src/assets/svgs/cloud_offline.svg, the legacy offline icon.
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
