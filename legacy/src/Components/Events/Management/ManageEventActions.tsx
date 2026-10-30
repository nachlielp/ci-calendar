import { CIEvent } from "../../../util/interfaces"
import "../../../styles/manage-event-actions.scss"
import HideEventButton from "../Actions/HideEventButton"
import { Icon } from "../../Common/Icon"
import CancelledEventButton from "../Actions/CancelleEventButton"
import DeleteEventButton from "../Actions/DeleteEventButton"
import { useNavigate } from "react-router"
import edit from "../../../assets/svgs/edit.svg"
export default function ManageEventActions({ event }: { event: CIEvent }) {
    const navigate = useNavigate()

    const btn = {
        icon: edit,
        className: "edit-btn",
        path: event.is_multi_day
            ? `/manage-events/edit-multi-day/${event.id}`
            : `/manage-events/edit-single-day/${event.id}`,
    }

    return (
        <section className="manage-event-actions">
            <button
                className={`action-btn ${btn.className}`}
                onClick={() => navigate(btn.path)}
                key={btn.icon}
            >
                <Icon icon={btn.icon} className="icon" />
            </button>
            <DeleteEventButton event={event} />
            <CancelledEventButton
                eventId={event.id}
                cancelled={event.cancelled}
            />
            <HideEventButton event={event} />
        </section>
    )
}
