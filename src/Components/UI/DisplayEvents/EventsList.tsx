import { EventPreview } from "./EventPreview"
import { useEventsFilter } from "../../../hooks/useEventsFilter"
import { CIEvent, UserBio } from "../../../util/interfaces"
import Loading from "../Other/Loading"
import { Empty } from "antd"
import FullEventCardModal from "./FullEventCardModal"
import { useEffect, useRef, useState } from "react"
import { useParams } from "react-router-dom"
import FullEventCardContainer from "./FullEventCardContainer"

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
    const { eventId } = useParams<{ eventId: string }>()
    const eventRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null)

    useEffect(() => {
        if (eventId) {
            setSelectedEventId(eventId)
            if (eventRefs.current[eventId]) {
                eventRefs.current[eventId]?.scrollIntoView({
                    behavior: "smooth",
                    block: "end",
                })
            }
        }
    }, [eventId])

    let filteredEvents = useEventsFilter({ events })

    const visibleEvents = events.filter((event) => !event.hide)

    filteredEvents = useEventsFilter({ events: visibleEvents })

    if (!filteredEvents) return <Loading />

    return (
        <div className="events-list-container">
            {!isEvents && emptyEventsList()}
            {filteredEvents.map((event) => (
                <div
                    key={event.id}
                    ref={(el) => (eventRefs.current[event.id] = el)}
                >
                    <FullEventCardContainer
                        event={event}
                        viewableTeachers={viewableTeachers}
                        onSelectEvent={onSelectEvent}
                        anchorEl={
                            <EventPreview
                                key={event.id}
                                event={event}
                                viewableTeachers={viewableTeachers}
                            />
                        }
                        selectedEventId={selectedEventId}
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
