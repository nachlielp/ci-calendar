import { EditOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useNavigate } from "react-router-dom";

interface EditEventProps {
  eventId: string;
}

const EditEvent: React.FC<EditEventProps> = ({ eventId }) => {
  const navigate = useNavigate();

  const handleEdit = () => {
    navigate(`/edit-event/${eventId}`);
  };

  return (
    <Button onClick={handleEdit}>
      <EditOutlined />
    </Button>
  );
};

export default EditEvent;
