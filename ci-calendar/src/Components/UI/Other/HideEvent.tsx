import { useAuthContext } from "../../Auth/AuthContext";
import { Icon } from "./Icon";

export default function HideEvent({ eventId, hide }: { eventId: string, hide: boolean }) {
    const { hideEvent } = useAuthContext();
    const handleHide = () => {
        hideEvent(eventId, !hide);
    };
    return (
        <div>
            <button onClick={handleHide}>{hide ? <Icon icon="visibilityOff" /> : <Icon icon="visibility" />}</button>
        </div>
    );
}

