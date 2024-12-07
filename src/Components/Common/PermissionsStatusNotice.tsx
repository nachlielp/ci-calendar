import Alert from "antd/es/alert"
import { PromissionStatus } from "../../util/interfaces"
import { utilService } from "../../util/utilService"

const ios_notification_error = (
    <label style={{ fontSize: "18px" }}>
        ההרשאות לאפליקציה הזו חסומות, ניתן להפעיל אותם בהגדרות =&gt; עדכונים
        =&gt; גלילה מטה אל האפליקציה CI, ולחיצה על ״קבלת עדכונים״
    </label>
)

const android_notification_error = (
    <label style={{ fontSize: "18px" }}>
        ההרשאות לאפליקציה הזו חסומות, ניתן להפעיל אותם בהגדרות =&gt; עדכונים
        =&gt; ניהול עדכונים =&gt; גלילה מטה אל האפליקציה CI, ולחיצה על ״קבלת
        עדכונים״
    </label>
)

const browser_notification_error = (
    <label style={{ fontSize: "18px" }}>
        ניתן לקבל התראות באפליקציה שמותקנת בסלולרי בלבד
    </label>
)

export default function PermissionsStatusNotice() {
    const getCurrentPermission = () => Notification.permission
    return (
        <section
            className="permissions-status-notice"
            style={{ margin: "10px 0" }}
        >
            {getCurrentPermission() == PromissionStatus.denied &&
                utilService.isPWA() &&
                utilService.isIos() && (
                    <Alert
                        message={
                            utilService.isIos()
                                ? ios_notification_error
                                : android_notification_error
                        }
                        type="warning"
                    />
                )}
            {!utilService.isPWA() && (
                <Alert message={browser_notification_error} type="warning" />
            )}
        </section>
    )
}
