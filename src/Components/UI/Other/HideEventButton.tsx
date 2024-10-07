import { cieventsService } from "../../../supabase/cieventsService"
import { Icon } from "./Icon"

export default function HideEventButton({
    eventId,
    hide,
}: {
    eventId: string
    hide: boolean
}) {
    const handleHide = () => {
        cieventsService.updateCIEvent(eventId, { hide: !hide })
    }
    return (
        <button
            className="event-footer-action"
            onClick={handleHide}
            style={{ borderRadius: "5px 0px 0px 5px" }}
        >
            {hide ? <Icon icon="visibility" /> : <Icon icon="visibilityOff" />}
        </button>
    )
}
