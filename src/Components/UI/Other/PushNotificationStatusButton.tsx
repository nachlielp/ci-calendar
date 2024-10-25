import { useEffect, useState } from "react"
import useMessagingPermission from "../../../hooks/useMessagingPermission"
import { Icon } from "./Icon"
import { utilService } from "../../../util/utilService"
import { PushNotificationPromission } from "../../../util/interfaces"
import Switch from "antd/es/switch"
import { useUser } from "../../../context/UserContext"
import Alert from "antd/es/alert"
import { usersService } from "../../../supabase/usersService"

const ios_notification_error =
    "ההרשאות לאפליקציה הזו חסומות, ניתן להפעיל אותם בהגדרות => עדכונים => גלילה מטה אל האפליקציה CI, ולחיצה על ״קבלת עדכונים״"

const android_notification_error =
    "ההרשאות לאפליקציה הזו חסומות, ניתן להפעיל אותם בהגדרות => עדכונים => ניהול עדכונים => גלילה מטה אל האפליקציה CI, ולחיצה על ״קבלת עדכונים״"

const browser_notification_error =
    "ניתן להפעיל התראות באפליקציה שמותקנת בסלולרי בלבד"

const PushNotificationStatusButton = () => {
    const { user } = useUser()
    const { requestPermission, permissionStatus } = useMessagingPermission()

    const [status, setStatus] = useState<PushNotificationPromission>(
        utilService.getNotificationPermission() as PushNotificationPromission
    )

    const [checked, setChecked] = useState(user?.receive_notifications)

    useEffect(() => {
        if (!utilService.isPWA()) {
            return
        }
        setStatus(permissionStatus)
        if (permissionStatus === "granted" && user?.receive_notifications) {
            setChecked(true)
        } else if (permissionStatus === "denied") {
            setChecked(false)
        } else if (permissionStatus === "default") {
            setChecked(false)
        }
    }, [permissionStatus])

    if (!user) return <></>

    async function handleChange(checked: boolean) {
        if (!utilService.isPWA()) {
            if (!checked && user) {
                await usersService.updateUser(user.user_id, {
                    receive_notifications: checked,
                })
                setChecked(checked)
            }
            return
        }
        setChecked(checked)
        if (checked && status === "default") {
            requestPermission()
        } else if (checked && status === "denied") {
            setChecked(false)
        }
        if (user) {
            await usersService.updateUser(user.user_id, {
                receive_notifications: checked,
            })
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

export default PushNotificationStatusButton
