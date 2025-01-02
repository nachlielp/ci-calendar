import { useCallback, useMemo } from "react"
import { useNavigate, useLocation } from "react-router"
import "../../styles/single-day-form-page.css"
import EditSingleDayEventForm from "../Events/Forms/EditSingleDayEventForm"
import { useSetSelectedEventByParams } from "../../hooks/useSetSelectedEventByParams"
import { useSetSelectedTemplateByParams } from "../../hooks/useSetSelectedTemplateByParams"

const EVENT_TYPE_LABEL = "עריכת אירוע חד יומי"
const TEMPLATE_TYPE_LABEL = "עריכת תבנית חד יומית"

const SingleDayFromPage = () => {
    const navigate = useNavigate()
    const { search } = useLocation()

    const { selectedEvent: event } = useSetSelectedEventByParams()
    const { selectedTemplate: template } = useSetSelectedTemplateByParams()

    // Memoize the isTemplate value
    const isTemplate = useMemo(() => {
        const params = new URLSearchParams(search)
        return params.get("isTemplate") === "true"
    }, [search])

    const closeForm = useCallback(() => {
        navigate("/manage-events")
    }, [navigate])

    return (
        <section className="single-day-form-page">
            <header className="header">
                <label className="title">
                    {isTemplate ? TEMPLATE_TYPE_LABEL : EVENT_TYPE_LABEL}
                </label>
                <button onClick={closeForm} className="general-action-btn">
                    חזרה לאירועים שלי
                </button>
            </header>
            <div className="form-container">
                <EditSingleDayEventForm
                    closeForm={closeForm}
                    event={event}
                    template={template}
                    isTemplate={isTemplate}
                />
            </div>
        </section>
    )
}

SingleDayFromPage.displayName = "SingleDayFromPage"

export default SingleDayFromPage
