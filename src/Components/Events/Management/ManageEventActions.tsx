import { DBCIEvent } from "../../../supabase/cieventsService"
import { CIEvent } from "../../../util/interfaces"

import HideEventButton from "../Actions/HideEventButton"
import { Icon } from "../../Common/Icon"
import FormContainer from "../Forms/FormContainer"
import CancelledEventButton from "../Actions/CancelleEventButton"
import DeleteEventButton from "../Actions/DeleteEventButton"

export default function ManageEventActions({
    event,
    updateEventState,
    updateEventHideState,
    updateEventCancelledState,
    removeEventState,
}: {
    event: CIEvent
    updateEventState: (eventId: string, event: DBCIEvent) => void
    updateEventHideState: (eventId: string, hide: boolean) => void
    updateEventCancelledState: (eventId: string, cancelled: boolean) => void
    removeEventState: (eventId: string) => void
}) {
    const buttonsArray = [
        {
            eventType: event.is_multi_day
                ? "edit-multi-day"
                : "edit-single-day",
            icon: "edit",
            className: "edit-btn",
        },
    ]

    return (
        <section className="manage-event-actions">
            {buttonsArray.map((button, index) => (
                <FormContainer
                    key={index}
                    anchorEl={
                        <button className={`action-btn ${button.className}`}>
                            <Icon icon={button.icon} className="icon" />
                        </button>
                    }
                    eventType={button.eventType}
                    isTemplate={false}
                    event={event}
                    updateEventState={updateEventState}
                />
            ))}
            <DeleteEventButton
                eventId={event.id}
                removeEventState={removeEventState}
            />
            <CancelledEventButton
                eventId={event.id}
                cancelled={event.cancelled}
                updateEventCancelledState={updateEventCancelledState}
            />
            <HideEventButton
                eventId={event.id}
                hide={event.hide}
                updateEventHideState={updateEventHideState}
            />
        </section>
    )
}
