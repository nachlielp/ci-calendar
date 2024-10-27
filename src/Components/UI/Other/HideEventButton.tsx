import { cieventsService } from "../../../supabase/cieventsService"
import { Icon } from "./Icon"

export default function HideEventButton({
    eventId,
    hide,
    updateEventHideState,
}: {
    eventId: string
    hide: boolean
    updateEventHideState: (eventId: string, hide: boolean) => void
}) {
    const handleHide = async () => {
        await cieventsService.updateCIEvent(eventId, { hide: !hide })
        updateEventHideState(eventId, !hide)
    }
    return (
        <button
            className="action-btn"
            onClick={handleHide}
            style={{ borderRadius: "5px 0px 0px 5px" }}
        >
            {hide ? <Icon icon="visibility" /> : <Icon icon="visibilityOff" />}
        </button>
    )
}
