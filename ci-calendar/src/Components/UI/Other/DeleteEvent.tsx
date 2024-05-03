import { DeleteOutlined, ExclamationCircleFilled } from "@ant-design/icons";
import { Button, Modal, Space } from "antd";
import { useAuthContext } from "../../Auth/AuthContext";

const { confirm } = Modal;

const showDeleteConfirm = (
  eventId: string,
  deleteEvently: (id: string) => void
) => {
  confirm({
    title: "מחק ארוע",
    icon: <ExclamationCircleFilled />,
    content: "האם אתה בטוח שאתה רוצה למחוק את הארוע?",
    okText: "מחק",
    okType: "danger",
    cancelText: "בטל",
    onOk() {
      deleteEvently(eventId);
    },
    onCancel() {
      console.log(
        "DeleteEvent.showDeleteConfirm.onCancel: User cancelled deletion"
      );
    },
  });
};

interface IDeleteEventProps {
  eventId: string;
}
const DeleteEvent = ({ eventId }: IDeleteEventProps) => {
  const { deleteEvently } = useAuthContext();
  return (
    <Space wrap>
      <Button onClick={() => showDeleteConfirm(eventId, deleteEvently)}>
        <DeleteOutlined />
      </Button>
    </Space>
  );
};

export default DeleteEvent;
