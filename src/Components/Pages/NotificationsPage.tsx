import Card from "antd/es/card"
import SubscribeToTeachers from "../Users/SubscribeToTeachers"
// import UserNotificationsList from "../Users/UserNotificationsList"
import { observer } from "mobx-react-lite"
import NotificationSwitch from "../Users/NotificationSwitch"
import PermissionsStatusNotice from "../Common/PermissionsStatusNotice"
import "../../styles/notifications-page.css"
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
        </div>
    )
})

export default NotificationsPage
