import ManageTemplatesList from "../Events/Management/ManageTemplatesList"
import Alert from "antd/es/alert"
import { observer } from "mobx-react-lite"
import { store } from "../../Store/store"
import '../../styles/create-events-page.scss'
import { useNavigate } from "react-router"
const CreateEventsPage = () => {
    const navigate = useNavigate()
    const isMissingProfile =
        !store.getBio.bio_name || store.getBio.bio_name === ""

    const buttonsArray = [
        {
            type: "create-single-day",
            isTemplate: true,
            label: "תבנית חד יומית",
            path: "/create-events/single-day?isTemplate=true",
        },
        {
            type: "create-single-day",
            isTemplate: false,
            label: "אירוע חד יומי",
            path: "/create-events/single-day?isTemplate=false",
        },
        {
            type: "create-multi-day",
            isTemplate: true,
            label: "תבנית רב יומית",
            path: "/create-events/multi-day?isTemplate=true",
        },
        {
            type: "create-multi-day",
            isTemplate: false,
            label: "אירוע רב יומי",
            path: "/create-events/multi-day?isTemplate=false",
        },
    ]

    return (
        <section className="create-events-page ">
            <article className="alerts-container">
                {isMissingProfile && (
                    <Alert
                        message="על מנת לתייג את עצמכם בארועים צריך ליצור קודם פרופיל"
                        type="warning"
                        showIcon
                    />
                )}
                {store.getTemplates.length === 0 && (
                    <Alert
                        message="כדאי ליצור תבניות עבור אירועים חוזרים"
                        type="warning"
                        showIcon
                    />
                )}
            </article>
            <article className="btns-container">
                {buttonsArray.map((button) => (
                    <button
                        className="btn"
                        onClick={() => navigate(button.path)}
                        key={button.path}
                    >
                        {button.label}
                    </button>
                ))}
            </article>
            <ManageTemplatesList />
        </section>
    )
}

export default observer(CreateEventsPage)
