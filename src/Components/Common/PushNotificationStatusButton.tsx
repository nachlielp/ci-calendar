import { useEffect, useState } from "react"
import useMessagingPermission from "../../hooks/useMessagingPermission"
import { utilService } from "../../util/utilService"
import { PromissionStatus } from "../../util/interfaces"
import Alert from "antd/es/alert"

import { observer } from "mobx-react-lite"

const ios_notification_error =
    "ההרשאות לאפליקציה הזו חסומות, ניתן להפעיל אותם בהגדרות => עדכונים => גלילה מטה אל האפליקציה CI, ולחיצה על ״קבלת עדכונים״"

const android_notification_error =
    "ההרשאות לאפליקציה הזו חסומות, ניתן להפעיל אותם בהגדרות => עדכונים => ניהול עדכונים => גלילה מטה אל האפליקציה CI, ולחיצה על ״קבלת עדכונים״"

const browser_notification_error =
    "ניתן לקבל התראות באפליקציה שמותקנת בסלולרי בלבד"

const PushNotificationStatusButton = () => {
    const { requestPermission, permissionStatus } = useMessagingPermission()

    const [status, setStatus] = useState<PromissionStatus>(
        utilService.getNotificationPermission() as PromissionStatus
    )

    useEffect(() => {
        if (!utilService.isPWA()) {
            return
        }
        setStatus(permissionStatus as PromissionStatus)
    }, [permissionStatus])

    async function handleChange() {
        if (!utilService.isPWA()) {
            return
        }
        requestPermission().then(() => {
            setStatus(PromissionStatus.granted)
        })
    }

    return (
        <section
            className={`push-notification-status-button  ${
                !utilService.isPWA() && "pwa-only"
            }`}
        >
            <button
                onClick={handleChange}
                className={`notification-status-button general-action-btn ${status} `}
            >
                אישור התראות
            </button>

            {status == PromissionStatus.denied && (
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
