import { EventPreview } from "./EventPreview"
import { useEventsFilter } from "../../../hooks/useEventsFilter"
import { CIEvent, UserBio } from "../../../util/interfaces"
import Loading from "../Other/Loading"
import EmptyList from "../Other/Empty"
import { Empty } from "antd"
import { useUser } from "../../../context/UserContext"
import EventModalWrapper from "./EventModalWrapper"

interface IEventsListProps {
    onSelectEvent: (event: CIEvent) => void
    events: CIEvent[]
    viewableTeachers: UserBio[]
    isEdit: boolean
    isEvents: boolean
}
export default function EventsList({
    events,
    isEdit,
    isEvents,
    onSelectEvent,
    viewableTeachers,
}: IEventsListProps) {
    const { user } = useUser()
    const isAdmin = user?.user_type === "admin"
    let filteredEvents = useEventsFilter({ events })
    if (isEdit && !isAdmin) {
        filteredEvents = useEventsFilter({
            events,
            uids: user ? [user.user_id] : [],
        })
    } else if (isEdit && isAdmin) {
        filteredEvents = events
    } else {
        const visibleEvents = events.filter((event) => !event.hide)
        filteredEvents = useEventsFilter({ events: visibleEvents })
    }
    if (!filteredEvents.length && isEdit && !isAdmin) return <EmptyList />
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
