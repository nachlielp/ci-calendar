import { useUser } from "../../context/UserContext"
import { UserNotification } from "../../util/interfaces"
import { notificationOptions, SelectOption } from "../../util/options"
import { utilService } from "../../util/utilService"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc.js"
import timezone from "dayjs/plugin/timezone.js"
import CIEventNotificationModal from "../Notifications/CIEventNotificationModal"
dayjs.extend(utc)
dayjs.extend(timezone)

export default function UserNotificationsList() {
    const { user } = useUser()

    const now = dayjs().tz("Asia/Jerusalem")

    return (
        <section className="user-notifications-list">
            <label className="user-notifications-list-title">
                התזכורות שלי
            </label>

            {user?.notifications
                .filter((notification: UserNotification) => {
                    //make sure the event start time did not pass
                    const eventStartTime = dayjs(notification.start_date)
                        .hour(dayjs(notification.firstSegment.startTime).hour())
                        .minute(
                            dayjs(notification.firstSegment.startTime).minute()
                        )
                        .tz("Asia/Jerusalem")

                    const isFutureEvent = eventStartTime.isAfter(now)

                    return isFutureEvent
                })
                .sort((a: UserNotification, b: UserNotification) =>
                    dayjs(a.start_date).isBefore(dayjs(b.start_date)) ? -1 : 1
                )
                .map((notification: UserNotification) => (
                    <article
                        key={notification.id}
                        className="user-notification"
                    >
                        <div className="user-notification-content">
                            <label className="user-notification-title">
                                {notification.title}
                            </label>
                            <div className="notification-actions">
                                <label className="user-notification-date">
                                    <label>
                                        {utilService.formatHebrewDate(
                                            notification.start_date
                                        )}
                                    </label>
                                    {" - "}
                                    <label className="user-notification-remind-in-hours">
                                        {
                                            notificationOptions.find(
                                                (option: SelectOption) =>
                                                    option.value ===
                                                    notification.remind_in_hours
                                            )?.label
                                        }
                                    </label>
                                </label>
                                <CIEventNotificationModal
                                    eventId={notification.ci_event_id}
                                />
                            </div>
                        </div>
                    </article>
                ))}

            {user?.notifications.length === 0 && (
                <div className="user-notifications-list-empty">
                    <label>נראה שאין לכם התראות פעילות</label>
                </div>
            )}
        </section>
    )
}
