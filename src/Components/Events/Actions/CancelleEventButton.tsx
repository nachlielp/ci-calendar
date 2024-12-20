import { Icon } from "../../Common/Icon"
import { store } from "../../../Store/store"
import { confirm } from "../../Common/Confirm"

const showCancelledConfirm = (eventId: string, cancelled: boolean) => {
    confirm({
        title: <div>{cancelled ? "הפעלת אירוע" : "ביטול אירוע"}</div>,
        icon: <Icon icon="warning" />,
        content: cancelled ? (
            <div>האם אתה בטוחים שאתם רוצים להפעיל את הארוע?</div>
        ) : (
            <div>האם אתה בטוחים שאתם רוצים לבטל את הארוע?</div>
        ),
        okText: cancelled ? "הפעלה" : "ביטול",
        okType: "danger",
        cancelText: "חזרה",
        direction: "rtl",
        onOk: async () => {
            await store.updateCIEvent({
                id: eventId,
                cancelled: !cancelled,
            })
        },
        onCancel() {
            console.log(
                "DeleteEvent.showDeleteConfirm.onCancel: User cancelled deletion"
            )
        },
    })
}

interface ICancelledEventProps {
    eventId: string
    cancelled: boolean
}

export default function CancelledEventButton({
    eventId,
    cancelled,
}: ICancelledEventProps) {
    return (
        <button
            className="action-btn"
            onClick={() => showCancelledConfirm(eventId, cancelled)}
            style={{ borderRadius: " 0px", borderLeft: "none" }}
        >
            {cancelled ? <Icon icon="check_circle" /> : <Icon icon="cancel" />}
        </button>
    )
}
