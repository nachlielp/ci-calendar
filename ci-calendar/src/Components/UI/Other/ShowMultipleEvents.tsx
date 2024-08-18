import { useAuthContext } from "../../Auth/AuthContext";
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
    <button className={`${className}`} onClick={handleHide} disabled={disabled}>
      <Icon icon="visibility" />
    </button>
  );
}
