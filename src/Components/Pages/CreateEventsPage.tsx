import { Icon } from "../UI/Other/Icon"
import { useWindowSize } from "../../hooks/useWindowSize"
import AddEventModal from "../UI/EventForms/AddEventModal"
import { AddEventDrawer } from "../UI/EventForms/AddEventDrawer"
import { ScreenSize } from "../../util/options"
import ManageTemplatesTable from "../UI/Other/ManageTemplatesTable"
export default function CreateEventsPage() {
    const { width } = useWindowSize()
    const isMobile = width < ScreenSize.mobile

    const buttonsArray = [
        {
            type: "single-day",
            isTemplate: true,
            label: "אירוע חד יומי - תבנית",
        },
        { type: "single-day", isTemplate: false, label: "אירוע חד יומי" },
        { type: "multi-day", isTemplate: true, label: "אירוע רב יומי - תבנית" },
        { type: "multi-day", isTemplate: false, label: "אירוע רב יומי" },
    ]
    return (
        <section className="create-events-page">
            <article className="btns-container">
                {isMobile && (
                    <>
                        {buttonsArray.map((button, index) => (
                            <AddEventDrawer
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
                            <AddEventModal
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
