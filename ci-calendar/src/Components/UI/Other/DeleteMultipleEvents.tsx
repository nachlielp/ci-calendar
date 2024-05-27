import { DeleteOutlined, ExclamationCircleFilled } from "@ant-design/icons";
import { Button, Modal } from "antd";
import { useAuthContext } from "../../Auth/AuthContext";

const { confirm } = Modal;

const showDeleteConfirm = (
    eventIds: string[],
    deleteMultipleEventlys: (ids: string[]) => Promise<void>,
    onDelete: () => void
) => {
    confirm({
        title: "מחק ארוע",
        icon: <ExclamationCircleFilled />,
        content: `האם אתה בטוח שאתה רוצה למחוק ${eventIds.length} ארועים?`,
        okText: "מחק",
        okType: "danger",
        cancelText: "בטל",
        onOk() {
            deleteMultipleEventlys(eventIds);
            onDelete();
        },
        onCancel() {
            console.log(
                "DeleteEvent.showDeleteConfirm.onCancel: User cancelled deletion"
            );
        },
        direction: "rtl",
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
            <DeleteOutlined />
        </Button>
    );
};

