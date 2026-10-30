import { useQuery } from "@tanstack/react-query"
import { lazy, Suspense, useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router"
import { useServices } from "../../app/services"
import { useIsOnline } from "../../app/useIsOnline"
import { CalendarIcon, ViewDayIcon } from "../../ui/icons"
import { ToggleButtons, type ToggleOption } from "../../ui/ToggleButtons"
import { CalendarView } from "./CalendarView"
import { toEventCards } from "./eventCards"
import { FilterButton, SelectedFilters } from "./EventFilters"
import { EventList, type FromListState } from "./EventList"
import { eventFilter } from "./filters"
import { useLinkedEvent } from "./linkedEvent"
import { publicWindowQuery } from "./publicWindow"
import { StaleDataNotice } from "./StaleDataNotice"
import { useEventFilters } from "./useEventFilters"
import "./CalendarPage.scss"

const loadEventDetails = () => import("./details/EventDetailsDialog")
const EventDetailsDialog = lazy(loadEventDetails)
const NotFoundPage = lazy(() => import("../../pages/NotFoundPage"))

const COPY = {
    title: "קונטקט אימפרוביזציה ישראל",
    subtitle: "כל האירועים במקום אחד",
    view: "תצוגה",
    listView: "צפייה ברשימת אירועים",
    calendarView: "צפייה באירועים לפי לוח שנה",
    noEvents: "אין אירועים קרובים",
    offline: "אין חיבור לאינטרנט – לא ניתן לטעון את האירועים",
    loadFailed: "לא הצלחנו לטעון את האירועים",
    retry: "נסו שוב",
    loading: "טוען אירועים…",
}

type View = "list" | "calendar"

const VIEWS: readonly ToggleOption<View>[] = [
    { key: "list", label: COPY.listView, Icon: ViewDayIcon },
    { key: "calendar", label: COPY.calendarView, Icon: CalendarIcon },
]

/**
 * The public calendar at `/`, and with an event open over it at
 * `/event/:eventId` or the short `/:eventId` (see `useLinkedEvent`).
 */
export default function CalendarPage() {
    const services = useServices()
    const isOnline = useIsOnline()
    const { eventId } = useParams()
    const location = useLocation()
    const navigate = useNavigate()

    // Stable options keep `select`'s result, and the cards below, stable
    // across renders.
    const windowQuery = useMemo(() => publicWindowQuery(services), [services])
    const { data: events, isError, refetch } = useQuery(windowQuery)
    const cards = useMemo(() => events && toEventCards(events), [events])
    const { filters, setFilter, clearFilters } = useEventFilters()
    const shownCards = useMemo(() => {
        if (!cards || filters.length === 0) return cards
        const matches = eventFilter(filters)
        return cards.filter((card) => matches(card.event))
    }, [cards, filters])
    // Page state, as in legacy: a reload starts on the list. Opening an
    // event keeps this page mounted, so the view and picked day stay.
    const [view, setView] = useState<View>("list")
    const linked = useLinkedEvent(eventId, events)

    // Fetch the details' code alongside the linked event's data.
    useEffect(() => {
        if (eventId) void loadEventDetails()
    }, [eventId])

    if (linked?.status === "notFound") {
        return (
            <Suspense fallback={null}>
                <NotFoundPage />
            </Suspense>
        )
    }

    const closeEvent = () => {
        // Opened from the list: going back closes it and keeps the history
        // tidy. Opened from a shared link: replace it with the calendar.
        if ((location.state as FromListState | null)?.fromList) {
            void navigate(-1)
        } else {
            const calendar = { pathname: "/", search: location.search }
            void navigate(calendar, { replace: true })
        }
    }

    // Events, once there (fetched or restored from storage), stay on screen;
    // being offline or a failed refresh only adds a notice that they may be
    // out of date.
    const staleReason = !events
        ? null
        : !isOnline
          ? "offline"
          : isError
            ? "refreshFailed"
            : null

    return (
        <main className="calendar-page">
            <header className="calendar-header">
                <h1 className="calendar-title">{COPY.title}</h1>
                <p className="calendar-subtitle">{COPY.subtitle}</p>
                <div className="calendar-menu">
                    <ToggleButtons
                        label={COPY.view}
                        options={VIEWS}
                        selected={view}
                        onSelect={setView}
                    />
                    <FilterButton
                        filters={filters}
                        onToggle={setFilter}
                        onClear={clearFilters}
                    />
                </div>
                <SelectedFilters filters={filters} onToggle={setFilter} />
            </header>
            {staleReason && <StaleDataNotice reason={staleReason} />}
            {shownCards ? (
                view === "calendar" ? (
                    <CalendarView cards={shownCards} />
                ) : shownCards.length === 0 ? (
                    <p className="calendar-empty">{COPY.noEvents}</p>
                ) : (
                    <EventList cards={shownCards} />
                )
            ) : !isOnline ? (
                // The request waits for the connection and is sent once back
                // online.
                <p role="alert">{COPY.offline}</p>
            ) : isError ? (
                <div role="alert">
                    <p>{COPY.loadFailed}</p>
                    <button type="button" onClick={() => refetch()}>
                        {COPY.retry}
                    </button>
                </div>
            ) : (
                <p role="status">{COPY.loading}</p>
            )}
            {linked && (
                <Suspense fallback={null}>
                    <EventDetailsDialog
                        key={eventId}
                        linked={linked}
                        onClose={closeEvent}
                    />
                </Suspense>
            )}
        </main>
    )
}
