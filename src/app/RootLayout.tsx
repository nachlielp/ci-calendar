import { Link, Outlet } from "react-router"
import { COMMON_COPY } from "../lib/commonCopy"
import { defineCopy } from "../lib/copy"
import { useCopy } from "./language"
import { useRemoveInitialLoader } from "./useRemoveInitialLoader"

const ERROR_COPY = defineCopy({
    he: { title: "משהו השתבש" },
    en: { title: "Something went wrong" },
    ru: { title: "Что-то пошло не так" },
})

export function RootLayout() {
    useRemoveInitialLoader()

    return (
        <div className="app">
            <Outlet />
        </div>
    )
}

export function RouteError() {
    useRemoveInitialLoader()
    const copy = useCopy(ERROR_COPY)
    const common = useCopy(COMMON_COPY)

    return (
        <main className="app" role="alert">
            <h1>{copy.title}</h1>
            <Link to="/">{common.backToCalendar}</Link>
        </main>
    )
}
