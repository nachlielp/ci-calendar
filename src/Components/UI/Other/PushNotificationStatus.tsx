import { useEffect, useState } from "react"
import useMessagingPermission from "../../../hooks/useMessagingPermission"
import { Icon } from "./Icon"
import NotificationsBlockedModal from "./NotificationsBlockedModal"
import { utilService } from "../../../util/utilService"
import { PushNotificationPromission } from "../../../util/interfaces"

const PushNotificationButton = () => {
    const [status, setStatus] = useState<PushNotificationPromission | null>(
        null
    )

    const { checkPermissionsAndToken, requestPermission } =
        useMessagingPermission()

    useEffect(() => {
        if (utilService.isFirstNotificationPermissionRequest()) {
            setStatus("default")
        } else {
            checkPermissionsAndToken().then((status) => setStatus(status))
        }
    }, [])

    return (
        <section className="notification-status-container">
            {status === "default" ||
                (status === null && (
                    <div onClick={requestPermission}>
                        <Icon icon="add_alert" />
                    </div>
                ))}

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
