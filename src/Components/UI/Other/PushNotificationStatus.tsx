import { useEffect, useState } from "react"
import useMessagingPermission from "../../../hooks/useMessagingPermission"
import { Icon } from "./Icon"
import NotificationsBlockedModal from "./NotificationsBlockedModal"
import { utilService } from "../../../util/utilService"

const PushNotificationButton = () => {
    const [isFirstRequest, setIsFirstRequest] = useState(false)

    const {
        notificationPermissionGranted,
        checkPermissionsAndToken,
        requestPermission,
    } = useMessagingPermission()

    useEffect(() => {
        if (utilService.isFirstNotificationPermissionRequest()) {
            setIsFirstRequest(true)
        } else {
            checkPermissionsAndToken()
        }
    }, [])

    const anchorElement = (
        <Icon
            icon={
                isFirstRequest
                    ? "add_alert"
                    : notificationPermissionGranted
                    ? "notifications_active"
                    : "notificationsOff"
            }
        />
    )

    return (
        <section className="notification-status-container">
            {isFirstRequest && (
                <div onClick={requestPermission}>{anchorElement}</div>
            )}

            {!isFirstRequest && !notificationPermissionGranted && (
                <NotificationsBlockedModal anchorElement={anchorElement} />
            )}
            {!isFirstRequest && notificationPermissionGranted && anchorElement}
        </section>
    )
}

export default PushNotificationButton
