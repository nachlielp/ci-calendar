import { Button, Modal } from "antd";
import { useAuthContext } from "../../Auth/AuthContext";
import { Icon } from "./Icon";

const { confirm } = Modal;

const showDeleteConfirm = (
    eventIds: string[],
    deleteMultipleEventlys: (ids: string[]) => Promise<void>,
    onDelete: () => void
) => {
    confirm({
        title: <div className="text-lg text-red-500">מחיקת ארועים</div>,
        icon: <Icon icon="warning" className="text-red-500 mr-2 ml-2" />,
        content: <div >האם אתה בטוח שאתה רוצה למחוק {eventIds.length} ארועים?</div>,
        okText: "מחיקה",
        okType: "danger",
        cancelText: "ביטול",
        direction: "rtl",
        onOk() {
            deleteMultipleEventlys(eventIds);
            onDelete();
        },
        onCancel() {
            console.log(
                "DeleteEvent.showDeleteConfirm.onCancel: User cancelled deletion"
            );
        },
    });
};

interface IDeleteEventProps {
    eventIds: string[];
    className?: string;
    disabled?: boolean;
    onDelete: () => void;
}
export default function DeleteMultipleEvents({ eventIds, className, disabled, onDelete }: IDeleteEventProps) {
    const { deleteMultipleEventlys } = useAuthContext();
    return (
        <Button className={`${className}`} onClick={() => showDeleteConfirm(eventIds, deleteMultipleEventlys, onDelete)} disabled={disabled}>
            <Icon icon="deleteIcon" />
        </Button>
    );
};

