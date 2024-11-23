import { store } from "../../../Store/store"
import { Icon } from "../../Common/Icon"

export default function HideEventButton({
    eventId,
    hide,
}: {
    eventId: string
    hide: boolean
}) {
    const handleHide = async () => {
        await store.updateCIEvent({
            id: eventId,
            hide: !hide,
        })
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
