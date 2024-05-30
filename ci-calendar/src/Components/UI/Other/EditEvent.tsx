import { Button } from "antd";
import { useNavigate } from "react-router-dom";
import { Icon } from "./Icon";

interface EditEventProps {
  eventId: string;
  isMultiDay: boolean;
}

const EditEvent: React.FC<EditEventProps> = ({ eventId, isMultiDay }) => {
  const navigate = useNavigate();

  const handleEdit = () => {
    if (isMultiDay) {
      navigate(`/edit-multi-day-event/${eventId}`);
    } else {
      navigate(`/edit-single-day-event/${eventId}`);
    }
  };

  return (
    <Button onClick={handleEdit}>
      <Icon icon="edit" />
    </Button>
  );
};

export default EditEvent;
