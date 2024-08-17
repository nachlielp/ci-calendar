import { useAuthContext } from "../../Auth/AuthContext";
import { Icon } from "./Icon";
import { Button } from "antd";

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
    <Button onClick={handleHide}>
      {hide ? <Icon icon="visibilityOff" /> : <Icon icon="visibility" />}
    </Button>
  );
}
