import { EventPreview } from "./EventPreview"
import { useEventsFilter } from "../../../hooks/useEventsFilter"
import { CIEvent, UserBio } from "../../../util/interfaces"
import Loading from "../Other/Loading"
import { Empty } from "antd"
import EventModalWrapper from "./EventModalWrapper"

interface IEventsListProps {
    onSelectEvent: (event: CIEvent) => void
    events: CIEvent[]
    viewableTeachers: UserBio[]
    isEvents: boolean
}
export default function EventsList({
    events,
    isEvents,
    onSelectEvent,
    viewableTeachers,
}: IEventsListProps) {
    let filteredEvents = useEventsFilter({ events })

    const visibleEvents = events.filter((event) => !event.hide)

    filteredEvents = useEventsFilter({ events: visibleEvents })

    if (!filteredEvents) return <Loading />

    return (
        <div className="events-list-container">
            {!isEvents && emptyEventsList()}
            {filteredEvents.map((event) => (
                <div key={event.id}>
                    <EventModalWrapper
                        event={event}
                        onSelectEvent={onSelectEvent}
                        anchorEl={
                            <EventPreview
                                key={event.id}
                                event={event}
                                viewableTeachers={viewableTeachers}
                            />
                        }
                        viewableTeachers={viewableTeachers}
                    />
                </div>
            ))}
            <div className="events-list-footer"></div>
        </div>
    )
}

const emptyEventsList = () => {
    return (
        <Empty
            imageStyle={{ height: 60, marginTop: "10rem" }}
            description={<span></span>}
        >
            <span style={{ fontSize: "1.5rem" }}>אופס, נראה שיש לנו בעיה</span>
        </Empty>
    )
}
