import { useAuthContext } from "../../Auth/AuthContext";
import { Button } from "antd";
import { Icon } from "./Icon";

export default function HideMultipleEvents({ eventIds, className, disabled }: { eventIds: string[], className?: string, disabled?: boolean }) {
    const { hideOrShowMultipleEventlys } = useAuthContext();
    const handleHide = () => {
        hideOrShowMultipleEventlys(eventIds, true);
    };
    return (
        <div className={`${className}`}>
            <Button onClick={handleHide} disabled={disabled}><Icon icon="visibilityOff" /></Button>
        </div>
    );
}

