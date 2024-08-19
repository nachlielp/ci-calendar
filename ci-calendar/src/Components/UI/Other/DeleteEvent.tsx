import { Modal } from "antd";
import { useAuthContext } from "../../Auth/AuthContext";
import { Icon } from "./Icon";

const { confirm } = Modal;

const showDeleteConfirm = (
  eventId: string,
  deleteEvently: (id: string) => void
) => {
  confirm({
    title: <div className="text-lg text-red-500">מחק ארוע</div>,
    icon: <Icon icon="warning" className="text-red-500 mr-2 ml-2" />,
    content: <div>האם אתה בטוחים שאתם רוצים למחוק את הארוע?</div>,
    okText: "מחיקה",
    okType: "danger",
    cancelText: "ביטול",
    direction: "rtl",
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
    <button
      className="event-footer-action"
      onClick={() => showDeleteConfirm(eventId, deleteEvently)}
      style={{ borderRadius: " 0px", borderLeft: "none" }}
    >
      <Icon icon="deleteIcon" />
    </button>
  );
};

export default DeleteEvent;
