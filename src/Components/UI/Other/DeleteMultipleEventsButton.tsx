import Modal from "antd/es/modal"
import { Icon } from "./Icon"
import { cieventsService } from "../../../supabase/cieventsService"

const { confirm } = Modal

const showDeleteConfirm = (
    eventIds: string[],
    onDelete: () => void,
    removeEventState: (eventId: string) => void
) => {
    const text =
        eventIds.length > 1 ? (
            <div>האם למחוק {eventIds.length} ארועים?</div>
        ) : (
            <div>האם למחוק אירוע אחד?</div>
        )
    confirm({
        title: (
            <div style={{ fontSize: "20px", fontWeight: "bold", color: "red" }}>
                מחיקת ארועים
            </div>
        ),
        icon: <Icon icon="warning" />,
        content: text,
        okText: "מחיקה",
        okType: "danger",
        cancelText: "ביטול",
        direction: "rtl",
        async onOk() {
            await cieventsService.deleteMultipleCIEvents(eventIds)
            eventIds.forEach((eventId) => removeEventState(eventId))
            onDelete()
        },
        onCancel() {
            console.log(
                "DeleteEvent.showDeleteConfirm.onCancel: User cancelled deletion"
            )
        },
    })
}

interface IDeleteEventProps {
    eventIds: string[]
    className?: string
    disabled?: boolean
    onDelete: () => void
    removeEventState: (eventId: string) => void
}
export default function DeleteMultipleEventsButton({
    eventIds,
    className,
    disabled,
    onDelete,
    removeEventState,
}: IDeleteEventProps) {
    return (
        <button
            className={`${className}`}
            onClick={() =>
                showDeleteConfirm(eventIds, onDelete, removeEventState)
            }
            disabled={disabled}
        >
            <Icon icon="deleteIcon" />
        </button>
    )
}
