import { CIEvent } from "../../../util/interfaces"
import "../../../styles/manage-event-actions.css"
import HideEventButton from "../Actions/HideEventButton"
import { Icon } from "../../Common/Icon"
import CancelledEventButton from "../Actions/CancelleEventButton"
import DeleteEventButton from "../Actions/DeleteEventButton"
import { useNavigate } from "react-router"

export default function ManageEventActions({ event }: { event: CIEvent }) {
    const navigate = useNavigate()

    const editEventBtn = {
        icon: "edit",
        className: "edit-btn",
        path: event.is_multi_day
            ? `/manage-events/edit-multi-day/${event.id}`
            : `/manage-events/edit-single-day/${event.id}`,
    }

    return (
        <section className="manage-event-actions">
            <button
                className={`action-btn ${editEventBtn.className}`}
                onClick={() => navigate(editEventBtn.path)}
                key="edit-event-btn"
            >
                <Icon icon={editEventBtn.icon} className="icon" />
            </button>
            <DeleteEventButton eventId={event.id} />
            <CancelledEventButton
                eventId={event.id}
                cancelled={event.cancelled}
            />
            <HideEventButton eventId={event.id} hide={event.hide} />
        </section>
    )
}
