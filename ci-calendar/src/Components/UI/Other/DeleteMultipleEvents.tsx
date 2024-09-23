import { Modal } from "antd"
import { Icon } from "./Icon"
import { cieventsService } from "../../../supabase/cieventsService"

const { confirm } = Modal

const showDeleteConfirm = (eventIds: string[], onDelete: () => void) => {
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
}
export default function DeleteMultipleEvents({
    eventIds,
    className,
    disabled,
    onDelete,
}: IDeleteEventProps) {
    // const { deleteMultipleEventlys } = useAuthContext();
    return (
        <button
            className={`${className}`}
            onClick={() => showDeleteConfirm(eventIds, onDelete)}
            disabled={disabled}
        >
            <Icon icon="deleteIcon" />
        </button>
    )
}
