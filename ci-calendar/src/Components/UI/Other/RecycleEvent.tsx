import { Button } from "antd";
import { useNavigate } from "react-router-dom";
import { Icon } from "./Icon";

interface EditEventProps {
    eventId: string;
    isMultiDay: boolean;
}

const RecycleEvent: React.FC<EditEventProps> = ({ eventId, isMultiDay }) => {
    const navigate = useNavigate();

    const handleEdit = () => {
        if (isMultiDay) {
            navigate(`/recycle-multi-day-event/${eventId}`);
        } else {
            navigate(`/recycle-single-day-event/${eventId}`);
        }
    };

    return (
        <Button onClick={handleEdit}>
            <Icon icon="recycle" />
        </Button>
    );
};

export default RecycleEvent;
