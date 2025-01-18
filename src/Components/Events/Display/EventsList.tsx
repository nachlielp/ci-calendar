import "../../../styles/events-list.scss"
import EventPreview from "./EventPreview"
import { CIEvent } from "../../../util/interfaces"
import Empty from "antd/es/empty"
import { useRef } from "react"
import { useParams } from "react-router"
import FullEventCardContainer from "./FullEventCardContainer"
import { useScrollToEventById } from "../../../hooks/useScroolToEventById"
import PageFooter from "../../Common/PageFooter"
import { observer } from "mobx-react-lite"
interface IEventsListProps {
    events: CIEvent[]
}

const EventsList = ({ events }: IEventsListProps) => {
    const { eventId } = useParams<{ eventId: string }>()
    const eventRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

    useScrollToEventById(eventId || "", eventRefs)

    return (
        <div className="events-list">
            {!events.length && emptyEventsList()}
            {events.map((event) =>
                event.cancelled ? (
                    <div
                        key={event.id}
                        ref={(el) => (eventRefs.current[event.id] = el)}
                    >
                        <EventPreview
                            key={event.id}
                            event={event}
                            isClicked={false}
                        />
                    </div>
                ) : (
                    <div
                        key={event.id}
                        ref={(el) => (eventRefs.current[event.id] = el)}
                    >
                        <FullEventCardContainer event={event} />
                    </div>
                )
            )}
            <PageFooter />
        </div>
    )
}

export default observer(EventsList)

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
