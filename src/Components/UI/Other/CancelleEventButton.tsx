import Modal from "antd/es/modal"
import { cieventsService } from "../../../supabase/cieventsService"
import { Icon } from "./Icon"

const { confirm } = Modal

const showCancelledConfirm = (
    eventId: string,
    cancelled: boolean,
    updateEventCancelledState: (eventId: string, cancelled: boolean) => void
) => {
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
        onOk() {
            cieventsService.updateCIEvent(eventId, { cancelled: !cancelled })
            updateEventCancelledState(eventId, !cancelled)
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
    updateEventCancelledState: (eventId: string, cancelled: boolean) => void
}

export default function CancelledEventButton({
    eventId,
    cancelled,
    updateEventCancelledState,
}: ICancelledEventProps) {
    return (
        <button
            className="action-btn"
            onClick={() =>
                showCancelledConfirm(
                    eventId,
                    cancelled,
                    updateEventCancelledState
                )
            }
            style={{ borderRadius: " 0px", borderLeft: "none" }}
        >
            {cancelled ? <Icon icon="check_circle" /> : <Icon icon="cancel" />}
        </button>
    )
}
