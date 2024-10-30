import Card from "antd/es/card"
import SubscribeToTeachers from "../UI/Other/SubscribeToTeachers"
import PushNotificationStatusButton from "../UI/Other/PushNotificationStatusButton"

export default function FiltersAndNotificationsPage() {
    return (
        <div className="filter-and-notifications-page">
            <Card className="filter-section">
                <h3>הרשמה להתראות על ארועים חדשים של מורים וארגונים</h3>
                <PushNotificationStatusButton />
                <SubscribeToTeachers />
            </Card>
        </div>
    )
}
