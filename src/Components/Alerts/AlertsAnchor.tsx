import { useEffect, useState } from "react"
import { useUser } from "../../context/UserContext"
import dayjs from "dayjs"
import { CIAlert } from "../../util/interfaces"
import { useNavigate } from "react-router-dom"

export default function AlertsAnchor() {
    const { user } = useUser()
    const navigate = useNavigate()

    const [isOpen, setIsOpen] = useState(false)
    const [count, setCount] = useState(0)

    useEffect(() => {
        if (user) {
            setCount(user.alerts.filter((alert) => !alert.viewed).length)
        }
    }, [user])

    if (!user) return null

    const onAlertClick = (alert: CIAlert) => {
        setIsOpen(false)
        navigate(`/${alert.ci_event_id}`)
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
                            {user.alerts
                                .filter((alert) => !alert.viewed)
                                .map((alert) => {
                                    const eventStartTime = dayjs(
                                        alert.start_date
                                    )
                                        .hour(
                                            dayjs(
                                                alert.firstSegment.startTime
                                            ).hour()
                                        )
                                        .minute(
                                            dayjs(
                                                alert.firstSegment.startTime
                                            ).minute()
                                        )
                                        .tz("Asia/Jerusalem")

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
                                                {`תזכורת לאירוע שמתקיים ב ${dayjs(
                                                    alert.start_date
                                                ).format(
                                                    "DD/MM/YYYY"
                                                )} בשעה ${eventStartTime.format(
                                                    "HH:mm"
                                                )} ב${alert.address}`}
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
