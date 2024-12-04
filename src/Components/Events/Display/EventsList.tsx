import { EventPreview } from "./EventPreview"
import { CIEvent } from "../../../util/interfaces"
import Empty from "antd/es/empty"
import { useRef } from "react"
import { useParams } from "react-router-dom"
import FullEventCardContainer from "./FullEventCardContainer"
import { useScrollToEventById } from "../../../hooks/useScroolToEventById"
import { utilService } from "../../../util/utilService"
interface IEventsListProps {
    events: CIEvent[]
}

const CACHE_VERSION = (4).toString()

export default function EventsList({ events }: IEventsListProps) {
    const { eventId } = useParams<{ eventId: string }>()
    const eventRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

    useScrollToEventById(eventId || "", eventRefs)

    return (
        <div className="events-list-container">
            {!events.length && emptyEventsList()}
            {events
                .filter((event) =>
                    utilService.isSingleDayEventNotStarted(event)
                )
                .map((event) =>
                    event.cancelled ? (
                        <EventPreview key={event.id} event={event} />
                    ) : (
                        <div
                            key={event.id}
                            ref={(el) => (eventRefs.current[event.id] = el)}
                        >
                            <FullEventCardContainer
                                event={event}
                                anchorEl={
                                    <EventPreview
                                        key={event.id}
                                        event={event}
                                    />
                                }
                            />
                        </div>
                    )
                )}
            <div className="events-list-footer">
                <label>v - {CACHE_VERSION} </label>
            </div>
        </div>
    )
}

const emptyEventsList = () => {
    return (
        <Empty
            imageStyle={{ height: 120, marginTop: "78px" }}
            description={<span></span>}
        >
            <span style={{ fontSize: "1.5rem" }}></span>
        </Empty>
    )
}
