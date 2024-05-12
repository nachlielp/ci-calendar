import { EyeOutlined, EyeInvisibleOutlined } from "@ant-design/icons";
import { useAuthContext } from "../../Auth/AuthContext";

export default function HideEvent({ eventId, hide }: { eventId: string, hide: boolean }) {
    const { hideEvent } = useAuthContext();
    const handleHide = () => {
        hideEvent(eventId, !hide);
    };
    return (
        <div>
            <button onClick={handleHide}>{hide ? <EyeInvisibleOutlined /> : <EyeOutlined />}</button>
        </div>
    );
}

