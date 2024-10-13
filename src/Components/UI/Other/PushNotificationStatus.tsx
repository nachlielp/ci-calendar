import useMessagingPermission from "../../../hooks/useMessagingPermission"
import { Icon } from "./Icon"
import NotificationsBlockedModal from "./NotificationsBlockedModal"

const PushNotificationButton = () => {
    const { requestPermission, permissionStatus } = useMessagingPermission()

    return (
        <section className="notification-status-container">
            {(permissionStatus === "default" || permissionStatus === null) && (
                <div onClick={requestPermission}>
                    <Icon icon="add_alert" />
                </div>
            )}
            {permissionStatus === "denied" && (
                <NotificationsBlockedModal
                    anchorElement={<Icon icon="notificationsOff" />}
                />
            )}
            {permissionStatus === "granted" && (
                <Icon icon="notifications_active" />
            )}
        </section>
    )
}

export default PushNotificationButton
