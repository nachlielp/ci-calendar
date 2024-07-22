import { useParams } from "react-router-dom";
import { IEvently } from "../../../util/interfaces";

import FullSingleDayEventCard from "./FullSingleDayEventCard";


export default function EventPage({ events }: { events: IEvently[] }) {
    const { eventId } = useParams();
    const event = events.find(event => event.id === eventId);

    if (!event) {
        return (
            <section className="event-page">
                <h1>Event not found</h1>
            </section>
        );
    }

    return (
        <section className="event-page">
            <FullSingleDayEventCard event={event} />
        </section>
    );
}