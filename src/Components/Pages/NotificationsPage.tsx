import { observer } from "mobx-react-lite"
import "../../styles/notifications-page.scss"
import { EMAIL_SUPPORT } from "../../App"
import { getTranslation } from "../../util/translations"
import { store } from "../../Store/store"
import NewsletterFilter from "../Users/NewsletterFilter"

const NotificationsPage = observer(() => {
    const branch = import.meta.env.VITE_BRANCH
    return (
        <div className="notifications-page page">
            <label className="notifications-page-title">
                {getTranslation("manageNotifications", store.language)}
            </label>
            <section className="filter-section card">
                {branch !== "prod" && <NewsletterFilter />}
                {/* <UserNotificationsList /> */}
            </section>
            <label className="support-email">
                <label>{getTranslation("supportTitle", store.language)}</label>
                <a href={`mailto:${EMAIL_SUPPORT}`} target="_blank">
                    {EMAIL_SUPPORT}
                </a>
            </label>
        </div>
    )
})

export default NotificationsPage
