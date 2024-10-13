import { useEffect, useState } from "react"
import useMessagingPermission from "../../../hooks/useMessagingPermission"
import { Icon } from "./Icon"
import NotificationsBlockedModal from "./NotificationsBlockedModal"

const PushNotificationButton = () => {
    const [status, setStatus] = useState<"granted" | "denied" | "unknown">(
        "unknown"
    )

    const { notificationPermissionGranted, checkPermissionsAndToken } =
        useMessagingPermission()

    useEffect(() => {
        console.log("Notification.permission: ", Notification.permission)
        if (Notification.permission === "granted") {
            setStatus("granted")
        } else if (Notification.permission === "denied") {
            setStatus("denied")
        }
    }, [])

    const anchorElement = (
        <Icon
            icon={
                notificationPermissionGranted
                    ? "notifications"
                    : "notificationsOff"
            }
        />
    )
    return (
        <section className="notification-status-container">
            {status === "unknown" && (
                <div onClick={checkPermissionsAndToken}>{anchorElement}</div>
            )}
            {status === "denied" && (
                <NotificationsBlockedModal anchorElement={anchorElement} />
            )}
            {status === "granted" && anchorElement}
        </section>
    )
}

export default PushNotificationButton
