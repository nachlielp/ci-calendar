import { DeleteOutlined, ExclamationCircleFilled } from "@ant-design/icons";
import { Button, Modal, Space } from "antd";
import { useAuthContext } from "../../Auth/AuthContext";

const { confirm } = Modal;

const showDeleteConfirm = (
    eventIds: string[],
    deleteMultipleEventlys: (ids: string[]) => Promise<void>
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
}
export default function DeleteMultipleEvents({ eventIds, className, disabled }: IDeleteEventProps) {
    const { deleteMultipleEventlys } = useAuthContext();
    return (
        <Space wrap className={`${className}`}>
            <Button onClick={() => showDeleteConfirm(eventIds, deleteMultipleEventlys)} disabled={disabled}>
                <DeleteOutlined />
            </Button>
        </Space>
    );
};

