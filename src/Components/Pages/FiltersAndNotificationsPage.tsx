import Card from "antd/es/card"
import SubscribeToTeachers from "../Users/SubscribeToTeachers"
import UserNotificationsList from "../Users/UserNotificationsList"
import PushNotificationStatusButton from "../Common/PushNotificationStatusButton"
import { observer } from "mobx-react-lite"

const FiltersAndNotificationsPage = observer(() => {
    return (
        <div className="filter-and-notifications-page page">
            <Card className="filter-section">
                <h3>הרשמה להתראות על ארועים חדשים של מורים וארגונים</h3>
                <PushNotificationStatusButton />
                <SubscribeToTeachers />
                <UserNotificationsList />
            </Card>
        </div>
    )
})

export default FiltersAndNotificationsPage
