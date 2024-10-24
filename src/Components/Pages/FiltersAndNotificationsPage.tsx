import Card from "antd/es/card"
import SubscribeToTeachers from "../UI/Other/SubscribeToTeachers"
import DefaultFilterSettings from "../UI/Other/DefaultFilterSettings"

export default function FiltersAndNotificationsPage() {
    return (
        <div className="filter-and-notifications-page">
            <Card className="filter-section">
                <h3>ברירת מחדל לפילטר ארועים במסך פתיחה</h3>
                <DefaultFilterSettings />
                <h3>הרשמה להתראות על ארועים חדשים של מורים וארגונים</h3>
                <SubscribeToTeachers />
            </Card>
        </div>
    )
}
