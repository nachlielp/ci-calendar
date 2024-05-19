import { EyeOutlined } from "@ant-design/icons";
import { useAuthContext } from "../../Auth/AuthContext";
import { Button } from "antd";

export default function ShowMultipleEvents({ eventIds, className, disabled }: { eventIds: string[], className?: string, disabled?: boolean }) {
    const { hideOrShowMultipleEventlys } = useAuthContext();
    const handleHide = () => {
        hideOrShowMultipleEventlys(eventIds, false);
    };
    return (
        <div className={`${className} mt-1`}>
            <Button onClick={handleHide} disabled={disabled}><EyeOutlined /></Button>
        </div>
    );
}

