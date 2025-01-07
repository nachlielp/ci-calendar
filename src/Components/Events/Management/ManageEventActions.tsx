import { CIEvent } from "../../../util/interfaces"
import "../../../styles/manage-event-actions.css"
import HideEventButton from "../Actions/HideEventButton"
import { Icon } from "../../Common/Icon"
import CancelledEventButton from "../Actions/CancelleEventButton"
import DeleteEventButton from "../Actions/DeleteEventButton"
import { useNavigate } from "react-router"

export default function ManageEventActions({ event }: { event: CIEvent }) {
    const navigate = useNavigate()

    const buttonsArray = [
        {
            icon: "edit",
            className: "edit-btn",
            path: event.is_multi_day
                ? `/manage-events/edit-multi-day/${event.id}`
                : `/manage-events/edit-single-day/${event.id}`,
        },
    ]

    return (
        <section className="manage-event-actions">
            {buttonsArray.map((button) => (
                <button
                    className={`action-btn ${button.className}`}
                    onClick={() => navigate(button.path)}
                    key={button.icon}
                >
                    <Icon icon={button.icon} className="icon" />
                </button>
            ))}
            <DeleteEventButton event={event} />
            <CancelledEventButton
                eventId={event.id}
                cancelled={event.cancelled}
            />
            <HideEventButton event={event} />
        </section>
    )
}
