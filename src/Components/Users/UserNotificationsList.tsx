import { useUser } from "../../context/UserContext"
import { UserNotification } from "../../util/interfaces"
import {
    singleDayNotificationOptions,
    SelectOption,
    multiDayNotificationOptions,
} from "../../util/options"
import { utilService } from "../../util/utilService"
import CIEventNotificationModal from "../Notifications/CIEventNotificationModal"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc.js"
import timezone from "dayjs/plugin/timezone.js"
import { observer } from "mobx-react-lite"
import { store } from "../../Store/store"
dayjs.extend(utc)
dayjs.extend(timezone)

const UserNotificationsList = () => {
    const { user } = useUser()

    return (
        <section className="user-notifications-list">
            <label className="user-notifications-list-title">
                התזכורות שלי
            </label>

            {store.getNotificationList.map((notification: UserNotification) => (
                <article key={notification.id} className="user-notification">
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
                                    {notification.is_multi_day
                                        ? multiDayNotificationOptions.find(
                                              (option: SelectOption) =>
                                                  option.value ===
                                                  notification.remind_in_hours
                                          )?.label
                                        : singleDayNotificationOptions.find(
                                              (option: SelectOption) =>
                                                  option.value ===
                                                  notification.remind_in_hours
                                          )?.label}
                                </label>
                            </label>
                            <CIEventNotificationModal
                                eventId={notification.ci_event_id}
                                isMultiDay={notification.is_multi_day}
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

export default observer(UserNotificationsList)
