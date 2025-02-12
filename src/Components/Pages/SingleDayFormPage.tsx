import { useCallback, useMemo } from "react"
import { useNavigate, useLocation } from "react-router"
import SingleDayEventForm from "../Events/Forms/SingleDayEventForm"
import '../../styles/single-day-form-page.scss'

const EVENT_TYPE_LABEL = "אירוע חד יומי"
const TEMPLATE_TYPE_LABEL = "תבנית חד יומית"

const SingleDayFormPage = () => {
    const navigate = useNavigate()
    const { search } = useLocation()

    // Memoize the isTemplate value
    const isTemplate = useMemo(() => {
        const params = new URLSearchParams(search)
        return params.get("isTemplate") === "true"
    }, [search])

    const closeForm = useCallback(() => {
        navigate("/create-events")
    }, [navigate])

    return (
        <section className="single-day-form-page">
            <header className="header">
                <label className="title">
                    {isTemplate ? TEMPLATE_TYPE_LABEL : EVENT_TYPE_LABEL}
                </label>
                <button onClick={closeForm} className="general-action-btn">
                    חזרה ליצירת אירועים
                </button>
            </header>
            <div className="form-container">
                <SingleDayEventForm
                    closeForm={closeForm}
                    isTemplate={isTemplate}
                />
            </div>
        </section>
    )
}

SingleDayFormPage.displayName = "SingleDayFromPage"

export default SingleDayFormPage
