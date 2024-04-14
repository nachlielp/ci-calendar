import { ExclamationCircleFilled } from "@ant-design/icons";
import { Button, Modal, Space } from "antd";
import { useAuthContext } from "../Auth/AuthContext";
import { useEventsContext } from "../EventsProvider";

const { confirm } = Modal;

const showDeleteConfirm = (
  eventId: string,
  deleteEvent: (id: string) => void,
  removeEvent: (id: string) => void
) => {
  confirm({
    title: "מחק ארוע",
    icon: <ExclamationCircleFilled />,
    content: "האם אתה בטוח שאתה רוצה למחוק את הארוע?",
    okText: "מחק",
    okType: "danger",
    cancelText: "בטל",
    onOk() {
      deleteEvent(eventId);
      removeEvent(eventId);
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
  const { deleteEvent } = useAuthContext();
  const { removeEvent } = useEventsContext();
  return (
    <Space wrap>
      <Button
        onClick={() => showDeleteConfirm(eventId, deleteEvent, removeEvent)}
      >
        מחק ארוע
      </Button>
    </Space>
  );
};

export default DeleteEvent;
