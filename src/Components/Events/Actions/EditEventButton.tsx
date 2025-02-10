import { useNavigate } from "react-router"
import { Icon } from "../../Common/Icon"
import edit from "../../../assets/svgs/edit.svg"
interface EditEventButtonProps {
    eventId: string
    isMultiDay: boolean
}

export default function EditEventButton({
    eventId,
    isMultiDay,
}: EditEventButtonProps) {
    const navigate = useNavigate()

    const handleEdit = () => {
        if (isMultiDay) {
            navigate(`/edit-multi-day-event/${eventId}`)
        } else {
            navigate(`/edit-single-day-event/${eventId}`)
        }
    }

    return (
        <button
            className="event-footer-action"
            onClick={handleEdit}
            style={{ borderRadius: "0px 5px 5px 0px" }}
        >
            <Icon icon={edit} />
        </button>
    )
}
