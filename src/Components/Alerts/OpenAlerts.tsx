import { notification } from "antd"
import { useUser } from "../../context/UserContext"
import { useEffect } from "react"
import { CIAlert } from "../../util/interfaces"
import dayjs from "dayjs"
import { useNavigate } from "react-router-dom"
import { useCallback } from "react"

export default function OpenAlerts() {
    const [api, contextHolder] = notification.useNotification()
    const { user } = useUser()
    const navigate = useNavigate()

    useEffect(() => {
        if (!user) return

        if (user?.alerts.length > 0) {
            for (const alert of user.alerts) {
                if (alert.viewed) continue
                openNotification(alert)
            }
        }
    }, [user])

    const openNotification = useCallback(
        (alert: CIAlert) => {
            const eventStartTime = dayjs(alert.start_date)
                .hour(dayjs(alert.firstSegment.startTime).hour())
                .minute(dayjs(alert.firstSegment.startTime).minute())
                .tz("Asia/Jerusalem")

            const key = `alert-${alert.id}`

            api.open({
                key,
                message: alert.title,
                description: `תזכורת לאירוע שמתקיים ב ${dayjs(
                    alert.start_date
                ).format("DD/MM/YYYY")} בשעה ${eventStartTime.format(
                    "HH:mm"
                )} ב${alert.address}`,
                duration: 0,
                onClick: () => {
                    api.destroy(key)
                    handleClick(alert)
                },
                onClose: handleClose,
                style: { zIndex: 100 },
            })
        },
        [api, handleClick]
    )

    function handleClose() {
        console.log("closed")
    }
    function handleClick(alert: CIAlert) {
        navigate(`/${alert.ci_event_id}`)
    }
    return <>{contextHolder}</>
}
