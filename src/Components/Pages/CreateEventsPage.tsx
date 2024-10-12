import { Icon } from "../UI/Other/Icon"
import ManageTemplatesList from "../UI/Other/ManageTemplatesList"
import FormContainer from "../UI/EventForms/FormContainer"
export default function CreateEventsPage() {
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
        <section className="create-events-page">
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
