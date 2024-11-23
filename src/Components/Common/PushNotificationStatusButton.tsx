import { useEffect, useState } from "react"
import useMessagingPermission from "../../hooks/useMessagingPermission"
import { Icon } from "../Common/Icon"
import { utilService } from "../../util/utilService"
import { PushNotificationPromission } from "../../util/interfaces"
import Switch from "antd/es/switch"
import Alert from "antd/es/alert"
import { usersService } from "../../supabase/usersService"
import { store } from "../../Store/store"
import { observer } from "mobx-react-lite"

const ios_notification_error =
    "ההרשאות לאפליקציה הזו חסומות, ניתן להפעיל אותם בהגדרות => עדכונים => גלילה מטה אל האפליקציה CI, ולחיצה על ״קבלת עדכונים״"

const android_notification_error =
    "ההרשאות לאפליקציה הזו חסומות, ניתן להפעיל אותם בהגדרות => עדכונים => ניהול עדכונים => גלילה מטה אל האפליקציה CI, ולחיצה על ״קבלת עדכונים״"

const browser_notification_error =
    "ניתן להפעיל ולכבות התראות באפליקציה שמותקנת בסלולרי בלבד"

const PushNotificationStatusButton = () => {
    const { requestPermission, permissionStatus } = useMessagingPermission()

    const [status, setStatus] = useState<PushNotificationPromission>(
        utilService.getNotificationPermission() as PushNotificationPromission
    )

    const [checked, setChecked] = useState(store.getUserReceiveNotifications)

    useEffect(() => {
        if (!utilService.isPWA()) {
            setChecked(store.getUserReceiveNotifications)
            return
        }
        setStatus(permissionStatus)
        if (
            permissionStatus === "granted" &&
            store.getUserReceiveNotifications
        ) {
            setChecked(true)
        } else {
            console.log("setting checked to false")
            setChecked(false)
        }
    }, [permissionStatus, store.getUserReceiveNotifications])

    async function handleChange(checked: boolean) {
        if (!utilService.isPWA()) {
            return
        }

        if (checked) {
            requestPermission().then(() => {
                if (store.isUser) {
                    usersService.updateUser(store.getUser.user_id, {
                        receive_notifications: checked,
                    })
                }
                setChecked(checked)
            })
        } else if (checked && status === "denied") {
            setChecked(false)
            setStatus("denied")
        } else if (!checked) {
            usersService.updateUser(store.getUser.user_id, {
                receive_notifications: checked,
            })

            setChecked(false)
        }
    }

    return (
        <section className="notification-status-container">
            <Switch
                checked={checked}
                onChange={handleChange}
                checkedChildren={
                    <Icon
                        icon="notifications_active"
                        className="notification-switch-icon active"
                    />
                }
                unCheckedChildren={
                    <Icon
                        icon="notificationsOff"
                        className="notification-switch-icon"
                    />
                }
                disabled={!utilService.isPWA()}
            />
            {utilService.isPWA() && status === "denied" && (
                <Alert
                    message={
                        utilService.isIos()
                            ? ios_notification_error
                            : android_notification_error
                    }
                    type="warning"
                    style={{ marginTop: "10px" }}
                />
            )}
            {!utilService.isPWA() && (
                <Alert
                    message={browser_notification_error}
                    type="warning"
                    style={{ marginTop: "10px" }}
                />
            )}
        </section>
    )
}

export default observer(PushNotificationStatusButton)
