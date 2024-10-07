import { useNavigate } from "react-router-dom"
import { Icon } from "./Icon"

interface EditEventProps {
    eventId: string
    isMultiDay: boolean
}

export default function RecycleEventButton({
    eventId,
    isMultiDay,
}: EditEventProps) {
    const navigate = useNavigate()

    const handleEdit = () => {
        if (isMultiDay) {
            navigate(`/recycle-multi-day-event/${eventId}`)
        } else {
            navigate(`/recycle-single-day-event/${eventId}`)
        }
    }

    return (
        <button
            className="event-footer-action"
            onClick={handleEdit}
            style={{
                borderRadius: "0px",
                borderLeft: "none",
                borderRight: "none",
            }}
        >
            <Icon icon="contentCopy" />
        </button>
    )
}
