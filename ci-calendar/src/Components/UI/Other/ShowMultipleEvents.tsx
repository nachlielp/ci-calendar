import { useAuthContext } from "../../Auth/AuthContext";
import { Button } from "antd";
import { Icon } from "./Icon";

export default function ShowMultipleEvents({
  eventIds,
  className,
  disabled,
}: {
  eventIds: string[];
  className?: string;
  disabled?: boolean;
}) {
  const { hideOrShowMultipleEventlys } = useAuthContext();
  const handleHide = () => {
    hideOrShowMultipleEventlys(eventIds, false);
  };
  return (
    <Button className={`${className}`} onClick={handleHide} disabled={disabled}>
      <Icon icon="visibility" />
    </Button>
  );
}
