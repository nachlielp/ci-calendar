import { CIEvent } from "../../../util/interfaces"
import "../../../styles/manage-event-actions.css"
import HideEventButton from "../Actions/HideEventButton"
import { Icon } from "../../Common/Icon"
import FormContainer from "../Forms/FormContainer"
import CancelledEventButton from "../Actions/CancelleEventButton"
import DeleteEventButton from "../Actions/DeleteEventButton"
import { useNavigate } from "react-router"

export default function ManageEventActions({ event }: { event: CIEvent }) {
    const navigate = useNavigate()

    const buttonsArray = [
        {
            eventType: event.is_multi_day
                ? "edit-multi-day"
                : "edit-single-day",
            icon: "edit",
            className: "edit-btn",
            path: event.is_multi_day
                ? `/manage-events/edit-multi-day/${event.id}`
                : `/manage-events/edit-single-day/${event.id}`,
        },
    ]

    return (
        <section className="manage-event-actions">
            {buttonsArray.map((button, index) => (
                <FormContainer
                    key={index}
                    anchorEl={
                        <button
                            className={`action-btn ${button.className}`}
                            onClick={() => navigate(button.path)}
                        >
                            <Icon icon={button.icon} className="icon" />
                        </button>
                    }
                    eventType={button.eventType}
                    isTemplate={false}
                    event={event}
                />
            ))}
            <DeleteEventButton eventId={event.id} />
            <CancelledEventButton
                eventId={event.id}
                cancelled={event.cancelled}
            />
            <HideEventButton eventId={event.id} hide={event.hide} />
        </section>
    )
}
