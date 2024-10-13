import { useEffect, useState } from "react"
import useMessagingPermission from "../../../hooks/useMessagingPermission"
import { Icon } from "./Icon"
import NotificationsBlockedModal from "./NotificationsBlockedModal"
import { utilService } from "../../../util/utilService"
import { PushNotificationPromission } from "../../../util/interfaces"

const PushNotificationButton = () => {
    const { requestPermission, permissionStatus } = useMessagingPermission()

    const [status, setStatus] = useState<PushNotificationPromission>(
        utilService.getNotificationPermission() as PushNotificationPromission
    )
    useEffect(() => {
        setStatus(permissionStatus)
    }, [permissionStatus])

    return (
        <section className="notification-status-container">
            {(status === "default" || status === null) && (
                <div onClick={requestPermission}>
                    <Icon icon="add_alert" />
                </div>
            )}
            {status === "denied" && (
                <NotificationsBlockedModal
                    anchorElement={<Icon icon="notificationsOff" />}
                />
            )}
            {status === "granted" && <Icon icon="notifications_active" />}
        </section>
    )
}

export default PushNotificationButton
