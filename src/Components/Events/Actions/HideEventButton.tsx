import { store } from "../../../Store/store"
import { cieventsService } from "../../../supabase/cieventsService"
import { EventPayloadType } from "../../../util/interfaces"
import { Icon } from "../../Common/Icon"

export default function HideEventButton({
    eventId,
    hide,
}: {
    eventId: string
    hide: boolean
}) {
    const handleHide = async () => {
        const newEvent = await cieventsService.updateCIEvent(eventId, {
            hide: !hide,
        })
        store.setCIEvent(newEvent, EventPayloadType.UPDATE)
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
