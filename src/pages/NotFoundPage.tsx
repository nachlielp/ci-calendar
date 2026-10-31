import { Link } from "react-router"
import { useCopy } from "../app/language"
import { COMMON_COPY } from "../lib/commonCopy"
import { defineCopy } from "../lib/copy"

const COPY = defineCopy({
    he: { title: "הדף לא נמצא" },
    en: { title: "Page not found" },
    ru: { title: "Страница не найдена" },
})

export default function NotFoundPage() {
    const copy = useCopy(COPY)
    const common = useCopy(COMMON_COPY)
    return (
        <main className="not-found-page">
            <h1>{copy.title}</h1>
            <Link to="/">{common.backToCalendar}</Link>
        </main>
    )
}
