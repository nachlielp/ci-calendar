import { Icon } from "../UI/Other/Icon"
import { useWindowSize } from "../../hooks/useWindowSize"
import FormModal from "../UI/EventForms/FormModal"
import { FormDrawer } from "../UI/EventForms/FormDrawer"
import { ScreenSize } from "../../util/options"
import ManageTemplatesTable from "../UI/Other/ManageTemplatesTable"
export default function CreateEventsPage() {
    const { width } = useWindowSize()
    const isMobile = width < ScreenSize.mobile

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
                {isMobile && (
                    <>
                        {buttonsArray.map((button, index) => (
                            <FormDrawer
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
                    </>
                )}
                {!isMobile && (
                    <>
                        {buttonsArray.map((button, index) => (
                            <FormModal
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
                    </>
                )}
            </article>
            <ManageTemplatesTable />
        </section>
    )
}
