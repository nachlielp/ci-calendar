import dayjs from "dayjs"
import { CIAlert, NotificationType } from "../../util/interfaces"
import { useNavigate } from "react-router-dom"
import { observer } from "mobx-react-lite"
import { alertsAnchorViewModal } from "./AlertsAnchorVM"

const AlertsAnchor = () => {
    const navigate = useNavigate()

    if (!alertsAnchorViewModal.shouldDisplayAlerts) return <></>

    const onEventClick = (alert: CIAlert) => {
        alertsAnchorViewModal.setOpen(false)
        navigate(`/event/${alert.ci_event_id}`)
    }

    const onRequestClick = (alert: CIAlert) => {
        alertsAnchorViewModal.setOpen(false)
        navigate(`/request/${alert.request_id}`)
    }

    return (
        <div className="alerts-anchor">
            {alertsAnchorViewModal.alertsCount > 0 && (
                <>
                    <label
                        className="alerts-anchor-count"
                        onClick={() => alertsAnchorViewModal.toggleOpen()}
                    >
                        {alertsAnchorViewModal.alertsCount}
                    </label>
                    {alertsAnchorViewModal.open && (
                        <article className="alerts-anchor-list">
                            {alertsAnchorViewModal.alerts.map((alert) => {
                                return alert.request_id ? (
                                    <RequestToast
                                        key={alert.id}
                                        alert={alert}
                                        onAlertClick={onRequestClick}
                                    />
                                ) : (
                                    <EventToast
                                        key={alert.id}
                                        alert={alert}
                                        onAlertClick={onEventClick}
                                    />
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

const EventToast = ({
    alert,
    onAlertClick,
}: {
    alert: CIAlert
    onAlertClick: (alert: CIAlert) => void
}) => {
    return (
        <div
            key={alert.id}
            className="alert-item"
            onClick={() => onAlertClick(alert)}
        >
            <label className="alert-item-title">{alert.title}</label>
            <label className="alert-item-description">
                {formatAlertDescription(alert)}
            </label>
        </div>
    )
}

const RequestToast = ({
    alert,
    onAlertClick,
}: {
    alert: CIAlert
    onAlertClick: (alert: CIAlert) => void
}) => {
    return (
        <div
            key={alert.id}
            className="alert-item"
            onClick={() => onAlertClick(alert)}
        >
            <label className="alert-item-title">
                תגובה חדשה לפניית תמיכה - ליחצו לפתיחה
            </label>
        </div>
    )
}

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
