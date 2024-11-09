import ManageTemplatesList from "../Events/Management/ManageTemplatesList"
import FormContainer from "../Events/Forms/FormContainer"
import { useCIEvents } from "../../Context/CIEventsContext"
import { Icon } from "../Common/Icon"
export default function CreateEventsPage() {
    const { updateEventState } = useCIEvents()
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
                        updateEventState={updateEventState}
                    />
                ))}
            </article>
            <ManageTemplatesList />
        </section>
    )
}
