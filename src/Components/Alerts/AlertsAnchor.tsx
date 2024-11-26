import { useEffect, useState } from "react"
import dayjs from "dayjs"
import { CIAlert, NotificationType } from "../../util/interfaces"
import { useNavigate } from "react-router-dom"
import { store } from "../../Store/store"
import { observer } from "mobx-react-lite"
import { utilService } from "../../util/utilService"

const AlertsAnchor = () => {
    const navigate = useNavigate()

    const [isOpen, setIsOpen] = useState(false)
    const [count, setCount] = useState(0)

    useEffect(() => {
        if (store.isUser) {
            const alerts = store.getAlerts
                .filter((alert) => !alert.viewed)
                .filter((alert) =>
                    utilService.validateEventNotification(
                        alert,
                        store.getEvents
                    )
                )

            setCount(alerts.length)

            // Add a small delay for iOS PWA
            setTimeout(() => {
                if (navigator.setAppBadge) {
                    navigator.setAppBadge(alerts.length)
                }
            }, 500)
        }
    }, [store.getAlerts])

    if (!store.isUser) return <></>

    const onAlertClick = (alert: CIAlert) => {
        setIsOpen(false)
        navigate(`/event/${alert.ci_event_id}`)
    }

    return (
        <div className="alerts-anchor">
            {count > 0 && (
                <>
                    <label
                        className="alerts-anchor-count"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        {count}
                    </label>
                    {isOpen && (
                        <article className="alerts-anchor-list">
                            {store.getAlerts
                                .filter((alert) => !alert.viewed)
                                .filter((alert) =>
                                    utilService.validateEventNotification(
                                        alert,
                                        store.getEvents
                                    )
                                )
                                .map((alert) => {
                                    return (
                                        <div
                                            key={alert.id}
                                            className="alert-item"
                                            onClick={() => onAlertClick(alert)}
                                        >
                                            <label className="alert-item-title">
                                                {alert.title}
                                            </label>
                                            <label className="alert-item-description">
                                                {formatAlertDescription(alert)}
                                            </label>
                                        </div>
                                    )
                                })}
                        </article>
                    )}
                </>
            )}
        </div>
    )
}

export default observer(AlertsAnchor)

function formatAlertDescription(alert: CIAlert) {
    if (alert.type === NotificationType.response) {
        return `תגובה לפניית תמיכה שלך נמצאת בדף תמיכה`
    }

    let label = ""
    switch (alert.type) {
        case "reminder":
            label = "תזכורת לאירוע"
            break
        case "subscription":
            label = "עדכון על לאירוע"
            break
    }
    return `${label} שמתקיים ב ${dayjs(alert.start_date).format(
        "DD/MM/YYYY"
    )} בשעה ${eventStartTime(alert).format("HH:mm")} ב${alert.address}`
}

function eventStartTime(alert: CIAlert) {
    return dayjs(alert.start_date)
        .hour(dayjs(alert.firstSegment.startTime).hour())
        .minute(dayjs(alert.firstSegment.startTime).minute())
        .tz("Asia/Jerusalem")
}
