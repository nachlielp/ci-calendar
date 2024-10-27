import Modal from "antd/es/modal"
import { Icon } from "./Icon"
import { cieventsService } from "../../../supabase/cieventsService"

const { confirm } = Modal

const showDeleteConfirm = (
    eventId: string,
    removeEventState: (eventId: string) => void
) => {
    confirm({
        title: <div className="text-lg text-red-500">מחק ארוע</div>,
        icon: <Icon icon="warning" className="text-red-500 mr-2 ml-2" />,
        content: <div>האם אתה בטוחים שאתם רוצים למחוק את הארוע?</div>,
        okText: "מחיקה",
        okType: "danger",
        cancelText: "ביטול",
        direction: "rtl",
        onOk() {
            cieventsService.deleteCIEvent(eventId)
            removeEventState(eventId)
        },
        onCancel() {
            console.log(
                "DeleteEvent.showDeleteConfirm.onCancel: User cancelled deletion"
            )
        },
    })
}

interface IDeleteEventProps {
    eventId: string
    removeEventState: (eventId: string) => void
}

export default function DeleteEventButton({
    eventId,
    removeEventState,
}: IDeleteEventProps) {
    return (
        <button
            className="action-btn"
            onClick={() => showDeleteConfirm(eventId, removeEventState)}
            style={{ borderRadius: " 0px", borderLeft: "none" }}
        >
            <Icon icon="deleteIcon" />
        </button>
    )
}
