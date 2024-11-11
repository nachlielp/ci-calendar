import { useUser } from "../../context/UserContext"
import { UserNotification } from "../../util/interfaces"
import { notificationOptions, SelectOption } from "../../util/options"
import { utilService } from "../../util/utilService"
import CIEventNotificationModal from "../Notifications/CIEventNotificationModal"

export default function UserNotificationsList() {
    const { user } = useUser()

    return (
        <section className="user-notifications-list">
            <label className="user-notifications-list-title">
                התזכורות שלי
            </label>

            {user?.notifications
                .sort((a: UserNotification, b: UserNotification) =>
                    a.start_date.localeCompare(b.start_date)
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
        </section>
    )
}
