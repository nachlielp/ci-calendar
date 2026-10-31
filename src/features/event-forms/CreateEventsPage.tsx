import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router"
import { useUserId } from "../../app/auth/personal"
import { useCopy } from "../../app/language"
import { useServices } from "../../app/services"
import { defineCopy } from "../../lib/copy"
import { FormAlert } from "../../ui/form/fields"
import { ManageTemplatesList } from "./ManageTemplatesList"
import { taggableBiosQuery } from "./taggableBios"
import { TEMPLATE_COPY } from "./templateCopy"
import { useMyTemplates } from "./templates"
import "./FormPage.scss"

const COPY = defineCopy({
    he: {
        title: "יצירת אירוע",
        missingBio: "על מנת לתייג את עצמכם בארועים צריך ליצור קודם פרופיל",
        newEvent: "אירוע חדש",
        newTemplate: "תבנית חדשה",
    },
    en: {
        title: "Create Events",
        missingBio: "To tag yourself on events, create a profile first",
        newEvent: "New event",
        newTemplate: "New template",
    },
    ru: {
        title: "Создать событие",
        missingBio: "Чтобы отмечать себя в событиях, сначала создайте профиль",
        newEvent: "Новое событие",
        newTemplate: "Новый шаблон",
    },
})

/**
 * Legacy CreateEventsPage (`/create-events`): what to create, an event or
 * a template (each single-day at first, switched to multi-day in its form;
 * legacy offered the four as separate links), then the user's templates
 * (`ManageTemplatesList`), read as the page opens. A
 * user without a public bio is told to make one before they can tag
 * themselves, and one without templates that they are worth making.
 */
export default function CreateEventsPage() {
    const copy = useCopy(COPY)
    const templateCopy = useCopy(TEMPLATE_COPY)
    const services = useServices()
    const userId = useUserId()
    const bios = useQuery({
        ...taggableBiosQuery(services, userId),
        enabled: !!userId,
    })
    const templates = useMyTemplates(userId)
    const hasBio = bios.data?.some(
        (bio) => bio.user_id === userId && bio.bio_name,
    )
    const missingBio = bios.isSuccess && !hasBio
    const noTemplates = templates.isSuccess && templates.data.length === 0
    const choices = [
        { label: copy.newEvent, path: "/create-events/single-day" },
        {
            label: copy.newTemplate,
            path: "/create-events/single-day?isTemplate=true",
        },
    ]
    return (
        <main className="create-events-page">
            <h1 className="visually-hidden">{copy.title}</h1>
            {(missingBio || noTemplates) && (
                <div className="alerts-container">
                    {missingBio && (
                        <FormAlert kind="warning">{copy.missingBio}</FormAlert>
                    )}
                    {noTemplates && (
                        <FormAlert kind="warning">
                            {templateCopy.noTemplates}
                        </FormAlert>
                    )}
                </div>
            )}
            <nav className="btns-container" aria-label={copy.title}>
                {choices.map(({ label, path }) => (
                    <Link className="btn" to={path} key={path}>
                        {label}
                    </Link>
                ))}
            </nav>
            {userId && <ManageTemplatesList userId={userId} />}
        </main>
    )
}
