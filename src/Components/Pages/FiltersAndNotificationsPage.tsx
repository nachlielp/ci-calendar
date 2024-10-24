import Card from "antd/es/card"
import SubscribeToTeachers from "../UI/Other/SubscribeToTeachers"
import DefaultFilterSettings from "../UI/Other/DefaultFilterSettings"

export default function FiltersAndNotificationsPage() {
    return (
        <div className="filter-and-notifications-page">
            <Card className="filter-section">
                <h3>הגדרת פילטר דיפולטיבי</h3>
                <DefaultFilterSettings />
                <h3>הרשמה למורים</h3>
                <SubscribeToTeachers />
            </Card>
        </div>
    )
}
