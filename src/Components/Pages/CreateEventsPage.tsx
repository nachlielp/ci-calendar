import ManageTemplatesList from "../Events/Management/ManageTemplatesList"
import FormContainer from "../Events/Forms/FormContainer"
import { useCIEvents } from "../../context/CIEventsContext"
import { Icon } from "../Common/Icon"
import { useUser } from "../../context/UserContext"
import Alert from "antd/es/alert"

export default function CreateEventsPage() {
    const { updateEventState } = useCIEvents()
    const { user } = useUser()

    const isMissingProfile = !user?.bio?.bio_name || user?.bio?.bio_name === ""

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
            {isMissingProfile && (
                <Alert
                    message="על מנת לתייג את עצמכם בארועים צריך ליצור קודם פרופיל"
                    type="warning"
                    showIcon
                    style={{ marginBottom: "1rem" }}
                />
            )}
            {user?.templates.length === 0 && (
                <Alert
                    message="כדאי ליצור תבניות עבור אירועים חוזרים"
                    type="warning"
                    showIcon
                />
            )}
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
                        updateEventState={updateEventState}
                    />
                ))}
            </article>
            <ManageTemplatesList />
        </section>
    )
}
