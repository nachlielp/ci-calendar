import "../../../styles/events-list.css"
import { EventPreview } from "./EventPreview"
import { CIEvent } from "../../../util/interfaces"
import Empty from "antd/es/empty"
import { useRef } from "react"
import { useParams } from "react-router"
import FullEventCardContainer from "./FullEventCardContainer"
import { useScrollToEventById } from "../../../hooks/useScroolToEventById"
import { utilService } from "../../../util/utilService"
import PageFooter from "../../Common/PageFooter"
interface IEventsListProps {
    events: CIEvent[]
}

export default function EventsList({ events }: IEventsListProps) {
    const { eventId } = useParams<{ eventId: string }>()
    const eventRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

    useScrollToEventById(eventId || "", eventRefs)

    return (
        <div className="events-list">
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
            <PageFooter />
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
