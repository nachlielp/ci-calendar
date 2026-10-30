import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, Navigate, useNavigate, useParams } from "react-router"
import { useUserId } from "../../app/auth/personal"
import { useCopy } from "../../app/language"
import { useServices } from "../../app/services"
import { COMMON_COPY } from "../../lib/commonCopy"
import { editPath, type ManagedEvent } from "../events/managedEvent"
import { myUpcomingEventsKey } from "../manage-events/myEvents"
import { SINGLE_DAY_EDIT_DRAFT_KEY } from "./draftKeys"
import { FORM_PAGE_COPY } from "./formPageCopy"
import { myEventQuery } from "./myEvent"
import { SingleDayEventForm } from "./SingleDayEventForm"
import "./FormPage.scss"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Legacy EditSingleDayFormPage (`/manage-events/edit-single-day/:eventId`):
 * one of the user's own events, at once from their cached events if there,
 * read fresh as the page opens. Saved, it goes back to `/manage-events`, as
 * legacy did; going back by the button drops the edits.
 */
export default function EditSingleDayFormPage() {
    const copy = useCopy(FORM_PAGE_COPY)
    const common = useCopy(COMMON_COPY)
    const services = useServices()
    const queryClient = useQueryClient()
    const userId = useUserId()
    const navigate = useNavigate()
    const { eventId = "" } = useParams()
    const isId = UUID.test(eventId)
    const upcoming = queryClient.getQueryState(myUpcomingEventsKey(userId))
    const cached = queryClient
        .getQueryData<ManagedEvent[]>(myUpcomingEventsKey(userId))
        ?.find((event) => event.id === eventId)
    const query = useQuery({
        ...myEventQuery(services, userId, eventId),
        enabled: !!userId && isId,
        ...(cached
            ? {
                  initialData: cached,
                  initialDataUpdatedAt: upcoming?.dataUpdatedAt,
              }
            : {}),
    })
    const done = () => navigate("/manage-events")
    const back = () => {
        try {
            services.storage.removeItem(SINGLE_DAY_EDIT_DRAFT_KEY)
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
    } else if (query.data.multiDay) {
        return <Navigate to={editPath(query.data)} replace />
    } else {
        body = (
            <SingleDayEventForm
                key={query.data.id}
                userId={userId}
                event={query.data}
                onDone={done}
            />
        )
    }

    return (
        <main className="single-day-form-page">
            <header className="header">
                <h1 className="title">{copy.editSingleDay}</h1>
                <button
                    type="button"
                    className="general-action-btn"
                    onClick={back}
                >
                    {copy.backToMine}
                </button>
            </header>
            <div className="form-container">{body}</div>
        </main>
    )
}
