import Card from "antd/es/card"
import SubscribeToTeachers from "../Users/SubscribeToTeachers"
import UserNotificationsList from "../Users/UserNotificationsList"
import { observer } from "mobx-react-lite"
import NotificationSwitch from "../Users/NotificationSwitch"
import PermissionsStatusNotice from "../Common/PermissionsStatusNotice"

const NotificationsPage = observer(() => {
    return (
        <div className="notifications-page page">
            <Card className="filter-section">
                <label className="notifications-page-title">
                    הרשמה להתראות על ארועים חדשים של מורים וארגונים
                </label>
                <PermissionsStatusNotice />
                <NotificationSwitch />
                <SubscribeToTeachers />
                <UserNotificationsList />
            </Card>
        </div>
    )
})

export default NotificationsPage
