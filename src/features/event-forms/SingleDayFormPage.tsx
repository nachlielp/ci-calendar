import { useState } from "react"
import { useNavigate } from "react-router"
import { useUserId } from "../../app/auth/personal"
import { useCopy } from "../../app/language"
import { FORM_PAGE_COPY } from "./formPageCopy"
import { SingleDayEventForm } from "./SingleDayEventForm"
import "./FormPage.scss"

/**
 * Legacy SingleDayFormPage (`/create-events/single-day`): a new single-day
 * event. Saved (or left), it goes back to `/create-events`, as legacy did.
 */
export default function SingleDayFormPage() {
    const copy = useCopy(FORM_PAGE_COPY)
    const userId = useUserId()
    const navigate = useNavigate()
    // Clearing the form mounts a fresh one.
    const [instance, setInstance] = useState(0)
    const back = () => navigate("/create-events")
    return (
        <main className="single-day-form-page">
            <header className="header">
                <h1 className="title">{copy.singleDay}</h1>
                <button
                    type="button"
                    className="general-action-btn"
                    onClick={back}
                >
                    {copy.backToCreate}
                </button>
            </header>
            <div className="form-container">
                <SingleDayEventForm
                    key={instance}
                    userId={userId}
                    onDone={back}
                    onClear={() => setInstance((count) => count + 1)}
                />
            </div>
        </main>
    )
}
