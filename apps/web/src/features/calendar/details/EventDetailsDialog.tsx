import { useCopy, useLanguage } from "../../../app/language"
import { COMMON_COPY } from "@ci-calendar/core/lib/commonCopy"
import { defineCopy } from "@ci-calendar/core/lib/copy"
import { Dialog } from "../../../ui/Dialog"
import { pickTitle } from "../eventFormat"
import type { LinkedEvent } from "../linkedEvent"
import { EventDetails } from "./EventDetails"

const COPY = defineCopy({
    he: {
        label: "פרטי האירוע",
        loading: "טוען את האירוע…",
        offline: "אין חיבור לאינטרנט – האירוע ייטען כשהחיבור יחזור",
        failed: "לא הצלחנו לטעון את האירוע",
    },
    en: {
        label: "Event details",
        loading: "Loading the event…",
        offline:
            "No internet connection – the event will load once you're back online",
        failed: "We couldn't load the event",
    },
    ru: {
        label: "Подробности события",
        loading: "Загрузка события…",
        offline:
            "Нет подключения к интернету – событие загрузится, когда связь вернётся",
        failed: "Не удалось загрузить событие",
    },
})

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
    const copy = useCopy(COPY)
    const common = useCopy(COMMON_COPY)
    const { language } = useLanguage()
    return (
        <Dialog
            label={
                linked.status === "found"
                    ? pickTitle(linked.event, language)
                    : copy.label
            }
            onClose={onClose}
        >
            {linked.status === "found" ? (
                <EventDetails event={linked.event} />
            ) : linked.status === "failed" ? (
                <div role="alert" className="event-details-status">
                    <p>{copy.failed}</p>
                    <button type="button" onClick={linked.retry}>
                        {common.retry}
                    </button>
                </div>
            ) : (
                <p role="status" className="event-details-status">
                    {linked.offline ? copy.offline : copy.loading}
                </p>
            )}
        </Dialog>
    )
}
