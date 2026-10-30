import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router"
import { useUserId } from "../../app/auth/personal"
import { useCopy } from "../../app/language"
import { useServices } from "../../app/services"
import { defineCopy } from "../../lib/copy"
import { FormAlert } from "../../ui/form/fields"
import { taggableBiosQuery } from "./taggableBios"
import "./FormPage.scss"

const COPY = defineCopy({
    he: {
        title: "יצירת אירוע",
        missingBio: "על מנת לתייג את עצמכם בארועים צריך ליצור קודם פרופיל",
        singleDay: "אירוע חד יומי",
        multiDay: "אירוע רב יומי",
    },
    en: {
        title: "Create Events",
        missingBio: "To tag yourself on events, create a profile first",
        singleDay: "Single-day event",
        multiDay: "Multi-day event",
    },
    ru: {
        title: "Создать событие",
        missingBio: "Чтобы отмечать себя в событиях, сначала создайте профиль",
        singleDay: "Однодневное событие",
        multiDay: "Многодневное событие",
    },
})

/**
 * Legacy CreateEventsPage (`/create-events`): what to create. Templates
 * (their buttons, list and alert) come with slice 16. A user without a
 * public bio is told to make one before they can tag themselves.
 */
export default function CreateEventsPage() {
    const copy = useCopy(COPY)
    const services = useServices()
    const userId = useUserId()
    const bios = useQuery({
        ...taggableBiosQuery(services, userId),
        enabled: !!userId,
    })
    const hasBio = bios.data?.some(
        (bio) => bio.user_id === userId && bio.bio_name,
    )
    return (
        <main className="create-events-page">
            <h1 className="visually-hidden">{copy.title}</h1>
            {bios.isSuccess && !hasBio && (
                <div className="alerts-container">
                    <FormAlert kind="warning">{copy.missingBio}</FormAlert>
                </div>
            )}
            <nav className="btns-container" aria-label={copy.title}>
                <Link className="btn" to="/create-events/single-day">
                    {copy.singleDay}
                </Link>
                <Link className="btn" to="/create-events/multi-day">
                    {copy.multiDay}
                </Link>
            </nav>
        </main>
    )
}
