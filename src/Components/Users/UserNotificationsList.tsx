import { useUser } from "../../context/UserContext"
import { UserNotification } from "../../util/interfaces"
import { notificationOptions, SelectOption } from "../../util/options"
import { utilService } from "../../util/utilService"
import CIEventNotificationModal from "../Notifications/CIEventNotificationModal"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc.js"
import timezone from "dayjs/plugin/timezone.js"
dayjs.extend(utc)
dayjs.extend(timezone)

export default function UserNotificationsList() {
    const { user } = useUser()

    return (
        <section className="user-notifications-list">
            <label className="user-notifications-list-title">
                התזכורות שלי
            </label>

            {user?.notifications
                .filter((notification: UserNotification) => {
                    return utilService.isNotificationStartedByFirstSegment(
                        notification.start_date,
                        notification.firstSegment.startTime
                    )
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
