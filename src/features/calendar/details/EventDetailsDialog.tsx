import { Dialog } from "../../../ui/Dialog"
import type { LinkedEvent } from "../linkedEvent"
import { EventDetails } from "./EventDetails"

const COPY = {
    label: "פרטי האירוע",
    loading: "טוען את האירוע…",
    offline: "אין חיבור לאינטרנט – האירוע ייטען כשהחיבור יחזור",
    failed: "לא הצלחנו לטעון את האירוע",
    retry: "נסו שוב",
}

/**
 * An event's full details over the calendar: a drawer on phones, a modal on
 * wider screens. It opens at once for a shared link, saying so while the
 * event loads or if loading fails. Loaded on demand, so `/` doesn't carry it.
 */
export default function EventDetailsDialog({
    linked,
    onClose,
}: {
    linked: Exclude<LinkedEvent, { status: "notFound" }>
    onClose: () => void
}) {
    return (
        <Dialog
            label={linked.status === "found" ? linked.event.title : COPY.label}
            onClose={onClose}
        >
            {linked.status === "found" ? (
                <EventDetails event={linked.event} />
            ) : linked.status === "failed" ? (
                <div role="alert" className="event-details-status">
                    <p>{COPY.failed}</p>
                    <button type="button" onClick={linked.retry}>
                        {COPY.retry}
                    </button>
                </div>
            ) : (
                <p role="status" className="event-details-status">
                    {linked.offline ? COPY.offline : COPY.loading}
                </p>
            )}
        </Dialog>
    )
}
