import Card from "antd/es/card"
// import PushNotificationStatusButton from "../Common/PushNotificationStatusButton"
// import SubscribeToTeachers from "../Users/SubscribeToTeachers"
import UserNotificationsList from "../Users/UserNotificationsList"

export default function FiltersAndNotificationsPage() {
    return (
        <div className="filter-and-notifications-page">
            <Card className="filter-section">
                <h3>הרשמה להתראות על ארועים חדשים של מורים וארגונים</h3>
                {/* <PushNotificationStatusButton /> */}
                {/* <SubscribeToTeachers /> */}
                <UserNotificationsList />
            </Card>
        </div>
    )
}
