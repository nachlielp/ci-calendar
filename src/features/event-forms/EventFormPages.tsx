import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState, type ReactNode } from "react"
import {
    Link,
    Navigate,
    useLocation,
    useNavigate,
    useParams,
} from "react-router"
import { useUserId } from "../../app/auth/personal"
import { useCopy } from "../../app/language"
import { useServices } from "../../app/services"
import { useViewer } from "../../app/viewer"
import { COMMON_COPY } from "../../lib/commonCopy"
import { FormAlert } from "../../ui/form/fields"
import {
    ALL_EVENTS_PATH,
    editPath,
    type ManagedEvent,
} from "../events/managedEvent"
import { myUpcomingEventsKey } from "../manage-events/myEvents"
import { FORM_PAGE_COPY } from "./formPageCopy"
import { myEventQuery } from "./myEvent"
import "./FormPage.scss"

// The pages around the event forms (legacy SingleDayFormPage,
// MultiDayFormPage and their edit pages): a header with the page's title
// and a way back, then the form. Each form's routes are thin modules over
// these, so each stays its own chunk.

/** What a page's form gets. */
export interface FormSlot {
    userId: string
    /** After a save: where legacy went. */
    onDone: () => void
}

/**
 * A new event's page: saved (or left), it goes back to `/create-events`,
 * as legacy did. Clearing the form mounts a fresh one (`key`).
 */
export function NewEventFormPage({
    title,
    notice,
    form,
}: {
    title: string
    /** Legacy's info alert under the header. */
    notice?: string
    form: (slot: FormSlot & { key: number; onClear: () => void }) => ReactNode
}) {
    const copy = useCopy(FORM_PAGE_COPY)
    const userId = useUserId()
    const navigate = useNavigate()
    const [instance, setInstance] = useState(0)
    const back = () => navigate("/create-events")
    return (
        <main className="single-day-form-page">
            <header className="header">
                <h1 className="title">{title}</h1>
                <button
                    type="button"
                    className="general-action-btn"
                    onClick={back}
                >
                    {copy.backToCreate}
                </button>
            </header>
            {notice && (
                <div className="form-notice">
                    <FormAlert kind="info">{notice}</FormAlert>
                </div>
            )}
            <div className="form-container">
                {form({
                    key: instance,
                    userId,
                    onDone: back,
                    onClear: () => setInstance((count) => count + 1),
                })}
            </div>
        </main>
    )
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * An edit page (`/manage-events/edit-…/:eventId`): one of the user's own
 * events (an admin: anyone's, as legacy's manage-all-events let them), at
 * once from their cached events if there, read fresh as the page opens; an
 * event of the other kind (single-day or multi-day) goes to its own form.
 * Saved, it goes back to `/manage-events`, as legacy did (opened from
 * `/manage-all-events`, there); going back by the button drops the edits
 * (`draftKey`'s draft).
 */
export function EditEventFormPage({
    title,
    multiDay,
    draftKey,
    form,
}: {
    title: string
    multiDay: boolean
    draftKey: string
    form: (slot: FormSlot & { event: ManagedEvent }) => ReactNode
}) {
    const copy = useCopy(FORM_PAGE_COPY)
    const common = useCopy(COMMON_COPY)
    const services = useServices()
    const queryClient = useQueryClient()
    const userId = useUserId()
    const viewer = useViewer()
    const navigate = useNavigate()
    const location = useLocation()
    const { eventId = "" } = useParams()
    const isId = UUID.test(eventId)
    const scope = viewer.role === "admin" ? "any" : "own"
    const fromAll =
        (location.state as { from?: unknown } | null)?.from === ALL_EVENTS_PATH
    const upcoming = queryClient.getQueryState(myUpcomingEventsKey(userId))
    const cached = queryClient
        .getQueryData<ManagedEvent[]>(myUpcomingEventsKey(userId))
        ?.find((event) => event.id === eventId)
    const query = useQuery({
        ...myEventQuery(services, userId, eventId, scope),
        enabled: !!userId && isId,
        ...(cached
            ? {
                  initialData: cached,
                  initialDataUpdatedAt: upcoming?.dataUpdatedAt,
              }
            : {}),
    })
    const done = () => navigate(fromAll ? ALL_EVENTS_PATH : "/manage-events")
    const back = () => {
        try {
            services.storage.removeItem(draftKey)
        } catch {
            // Blocked storage holds no draft.
        }
        done()
    }

    let body
    if (isId && query.isPending) {
        body = <p role="status">{common.loading}</p>
    } else if (isId && query.isError) {
        body = (
            <div role="alert">
                <p>{copy.loadFailed}</p>
                <button type="button" onClick={() => void query.refetch()}>
                    {common.retry}
                </button>
            </div>
        )
    } else if (!isId || !query.data) {
        body = (
            <p role="alert">
                {copy.notFound}{" "}
                <Link to="/manage-events">{copy.backToMine}</Link>
            </p>
        )
    } else if (query.data.multiDay !== multiDay) {
        return <Navigate to={editPath(query.data)} replace />
    } else {
        body = form({ userId, event: query.data, onDone: done })
    }

    return (
        <main className="single-day-form-page">
            <header className="header">
                <h1 className="title">{title}</h1>
                <button
                    type="button"
                    className="general-action-btn"
                    onClick={back}
                >
                    {fromAll ? copy.backToAll : copy.backToMine}
                </button>
            </header>
            <div className="form-container">{body}</div>
        </main>
    )
}
