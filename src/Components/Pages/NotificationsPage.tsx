import Card from "antd/es/card"
import SubscribeToTeachers from "../Users/SubscribeToTeachers"
// import UserNotificationsList from "../Users/UserNotificationsList"
import { observer } from "mobx-react-lite"
import NotificationSwitch from "../Users/NotificationSwitch"
import PermissionsStatusNotice from "../Common/PermissionsStatusNotice"
import "../../styles/notifications-page.css"
import { EMAIL_SUPPORT } from "../../App"
const NotificationsPage = observer(() => {
    return (
        <div className="notifications-page page">
            <label className="notifications-page-title">ניהול התראות</label>
            <Card className="filter-section">
                <PermissionsStatusNotice />
                <NotificationSwitch />
                <SubscribeToTeachers />
                {/* <UserNotificationsList /> */}
            </Card>
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
