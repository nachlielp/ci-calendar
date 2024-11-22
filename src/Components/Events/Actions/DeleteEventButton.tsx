import Modal from "antd/es/modal"
import { Icon } from "../../Common/Icon"
import { cieventsService } from "../../../supabase/cieventsService"
import { CIEvent, EventPayloadType } from "../../../util/interfaces"
import { store } from "../../../Store/store"

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
        onOk: async () => {
            const deletedEventId = await cieventsService.deleteCIEvent(eventId)
            store.setCIEvent(
                { id: deletedEventId } as CIEvent,
                EventPayloadType.DELETE
            )
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

export default function DeleteEventButton({ eventId }: IDeleteEventProps) {
    return (
        <button
            className="action-btn"
            onClick={() => showDeleteConfirm(eventId)}
            style={{ borderRadius: " 0px", borderLeft: "none" }}
        >
            <Icon icon="deleteIcon" />
        </button>
    )
}
