import { CIEvent } from "../../../util/interfaces"
import FormContainer from "../EventForms/FormContainer"
import DeleteEventButton from "../Other/DeleteEventButton"
import HideEventButton from "../Other/HideEventButton"
import { Icon } from "../Other/Icon"

export default function ManageEventActions({ event }: { event: CIEvent }) {
    const buttonsArray = [
        {
            eventType: event.is_multi_day
                ? "edit-multi-day"
                : "edit-single-day",
            icon: "edit",
            className: "edit-btn",
        },
        // ,
        // {
        //     eventType: event.is_multi_day
        //         ? "recycle-multi-day"
        //         : "recycle-single-day",
        //     icon: "recycle",
        //     className: "recycle-btn",
        // },
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
                />
            ))}
            <DeleteEventButton eventId={event.id} />
            <HideEventButton eventId={event.id} hide={event.hide} />
        </section>
    )
}
