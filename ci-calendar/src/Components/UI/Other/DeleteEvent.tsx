import { Modal } from "antd"
import { Icon } from "./Icon"
import { cieventsService } from "../../../supabase/cieventsService"

const { confirm } = Modal

const showDeleteConfirm = (eventId: string) => {
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
}

const DeleteEvent = ({ eventId }: IDeleteEventProps) => {
    return (
        <button
            className="event-footer-action"
            onClick={() => showDeleteConfirm(eventId)}
            style={{ borderRadius: " 0px", borderLeft: "none" }}
        >
            <Icon icon="deleteIcon" />
        </button>
    )
}

export default DeleteEvent
