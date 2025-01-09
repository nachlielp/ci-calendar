import { useCallback, useMemo } from "react"
import { useNavigate, useLocation } from "react-router"
import MultiDayEventForm from "../Events/Forms/MultiDayEventForm"
import '../../styles/single-day-form-page.scss'
import { Alert } from "antd"

const EVENT_TYPE_LABEL = "אירוע רב יומי"
const TEMPLATE_TYPE_LABEL = "תבנית רב יומית"

const MultiDayFormPage = () => {
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

            <Alert
                message="אירוע רב יומי הוא אירוע רציף שנמשך מספר ימים"
                type="info"
            />
            <div className="form-container">
                <MultiDayEventForm
                    closeForm={closeForm}
                    isTemplate={isTemplate}
                />
            </div>
        </section>
    )
}

MultiDayFormPage.displayName = "MultiDayFormPage"

export default MultiDayFormPage
