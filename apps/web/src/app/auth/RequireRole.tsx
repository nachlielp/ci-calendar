import { Link, Navigate, Outlet } from "react-router"
import { COMMON_COPY } from "@ci-calendar/core/lib/commonCopy"
import { defineCopy } from "@ci-calendar/core/lib/copy"
import { useCopy } from "../language"
import { useViewer } from "../viewer"
import { type SignedInRole } from "@ci-calendar/core/app/auth/roles"

const COPY = defineCopy({
    he: { unavailable: "לא הצלחנו לטעון את פרטי החשבון" },
    en: { unavailable: "We couldn't load your account" },
    ru: { unavailable: "Не удалось загрузить данные аккаунта" },
})

/**
 * Legacy `PrivateRoutes`: its child routes render only for the given roles.
 * While the viewer is unknown (profile loading, a redirect being read) it
 * shows loading; if the profile can't load, it says so with a retry and the
 * way home. A signed-out visitor goes to `/login`, a signed-in user without
 * the role to the calendar (both replace the history entry; legacy kept no
 * return path, and login always lands on `/`).
 */
export function RequireRole({ roles }: { roles: readonly SignedInRole[] }) {
    const viewer = useViewer()
    const copy = useCopy(COPY)
    const common = useCopy(COMMON_COPY)
    if (viewer.role === "unknown") {
        return (
            <main className="page-loading">
                <p role="status">{common.loading}</p>
            </main>
        )
    }
    if (viewer.role === "unavailable") {
        return (
            <main className="page-loading" role="alert">
                <p>{copy.unavailable}</p>
                <button type="button" onClick={viewer.retry}>
                    {common.retry}
                </button>{" "}
                <Link to="/">{common.backToCalendar}</Link>
            </main>
        )
    }
    if (viewer.role === "anonymous") return <Navigate to="/login" replace />
    if (!roles.includes(viewer.role)) return <Navigate to="/" replace />
    return <Outlet />
}
