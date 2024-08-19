import { useAuthContext } from "../../Auth/AuthContext";
import { Icon } from "./Icon";

export default function HideEvent({
  eventId,
  hide,
}: {
  eventId: string;
  hide: boolean;
}) {
  const { hideEvent } = useAuthContext();
  const handleHide = () => {
    hideEvent(eventId, !hide);
  };
  return (
    <button
      className="event-footer-action"
      onClick={handleHide}
      style={{ borderRadius: "5px 0px 0px 5px" }}
    >
      {hide ? <Icon icon="visibility" /> : <Icon icon="visibilityOff" />}
    </button>
  );
}
