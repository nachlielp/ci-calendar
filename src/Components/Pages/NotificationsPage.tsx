import SubscribeToTeachers from "../Users/SubscribeToTeachers"
// import UserNotificationsList from "../Users/UserNotificationsList"
import { observer } from "mobx-react-lite"
import NotificationSwitch from "../Users/NotificationSwitch"
import PermissionsStatusNotice from "../Common/PermissionsStatusNotice"
import '../../styles/notifications-page.scss'
import { EMAIL_SUPPORT } from "../../App"
import NewsletterFilter from "../Users/NewsletterFilter"
const NotificationsPage = observer(() => {
    const branch = import.meta.env.VITE_BRANCH
    return (
        <div className="notifications-page page">
            <label className="notifications-page-title">ניהול התראות</label>
            <section className="filter-section card">
                <PermissionsStatusNotice />
                <NotificationSwitch />
                <SubscribeToTeachers />

                {branch !== "prod" && <NewsletterFilter />}
                {/* <UserNotificationsList /> */}
            </section>
            <label className="support-email">
                <label>לתמיכה שאלות או הערות ניתן לפנות אלינו במייל:</label>
                <a href={`mailto:${EMAIL_SUPPORT}`} target="_blank">
                    {EMAIL_SUPPORT}
                </a>
            </label>
        </div>
    )
})

export default NotificationsPage
