import useMessagingPermission from "../../../hooks/useMessagingPermission"
import { Icon } from "./Icon"
import NotificationsBlockedModal from "./NotificationsBlockedModal"

const PushNotificationButton = () => {
    const { notificationPermissionGranted } = useMessagingPermission()

    return (
        <section className="notification-status-container">
            <NotificationsBlockedModal
                anchorElement={
                    <Icon
                        icon={
                            notificationPermissionGranted
                                ? "notifications"
                                : "notificationsOff"
                        }
                    />
                }
            />
        </section>
    )
}

export default PushNotificationButton
