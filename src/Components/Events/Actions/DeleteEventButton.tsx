import { Icon } from "../../Common/Icon"
import { store } from "../../../Store/store"
import { confirm } from "../../Common/Confirm"

const showDeleteConfirm = (eventId: string) => {
    confirm({
        title: <div className="text-lg text-red-500">מחק ארוע</div>,
        icon: <Icon icon="warning" className="text-red-500 mr-2 ml-2" />,
        content: <div>האם אתם בטוחים שאתם רוצים למחוק את הארוע?</div>,
        okText: "מחיקה",
        okType: "danger",
        cancelText: "ביטול",
        direction: "rtl",
        onOk: async () => {
            await store.deleteCIEvent(eventId)
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
