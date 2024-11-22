import ManageTemplatesList from "../Events/Management/ManageTemplatesList"
import FormContainer from "../Events/Forms/FormContainer"
import { Icon } from "../Common/Icon"
import Alert from "antd/es/alert"
import { observer } from "mobx-react-lite"
import { store } from "../../Store/store"

const CreateEventsPage = () => {
    const isMissingProfile =
        !store.getBio.bio_name || store.getBio.bio_name === ""

    const buttonsArray = [
        {
            type: "create-single-day",
            isTemplate: true,
            label: "אירוע חד יומי - תבנית",
        },
        {
            type: "create-single-day",
            isTemplate: false,
            label: "אירוע חד יומי",
        },
        {
            type: "create-multi-day",
            isTemplate: true,
            label: "אירוע רב יומי - תבנית",
        },
        {
            type: "create-multi-day",
            isTemplate: false,
            label: "אירוע רב יומי",
        },
    ]

    return (
        <section className="create-events-page page">
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
                {buttonsArray.map((button, index) => (
                    <FormContainer
                        key={index}
                        anchorEl={
                            <button className="btn">
                                <Icon icon="addBox" className="icon" />
                                {button.label}
                            </button>
                        }
                        eventType={button.type}
                        isTemplate={button.isTemplate}
                    />
                ))}
            </article>
            <ManageTemplatesList />
        </section>
    )
}

export default observer(CreateEventsPage)
