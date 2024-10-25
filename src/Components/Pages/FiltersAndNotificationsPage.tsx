import Card from "antd/es/card"
import SubscribeToTeachers from "../UI/Other/SubscribeToTeachers"
import DefaultFilterSettings from "../UI/Other/DefaultFilterSettings"
import PushNotificationStatusButton from "../UI/Other/PushNotificationStatusButton"

export default function FiltersAndNotificationsPage() {
    return (
        <div className="filter-and-notifications-page">
            <Card className="filter-section">
                <h3>ברירת מחדל לפילטר ארועים במסך פתיחה</h3>
                <DefaultFilterSettings />
                <h3>הרשמה להתראות על ארועים חדשים של מורים וארגונים</h3>
                <PushNotificationStatusButton />
                <SubscribeToTeachers />
            </Card>
        </div>
    )
}
