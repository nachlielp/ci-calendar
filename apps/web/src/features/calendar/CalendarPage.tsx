import { useQuery } from "@tanstack/react-query"
import { lazy, Suspense, useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router"
import { useCopy } from "../../app/language"
import { PageFooter } from "../../app/PageFooter"
import { useServices } from "../../app/services"
import { useIsOnline } from "../../app/useIsOnline"
import { useToday } from "../../app/useToday"
import { COMMON_COPY } from "@ci-calendar/core/lib/commonCopy"
import { defineCopy } from "@ci-calendar/core/lib/copy"
import { CalendarIcon } from "../../ui/icons/CalendarIcon"
import { ViewDayIcon } from "../../ui/icons/ViewDayIcon"
import { ToggleButtons } from "../../ui/ToggleButtons"
import { CalendarView } from "./CalendarView"
import { toEventCards } from "./eventCards"
import { FilterButton, SelectedFilters } from "./EventFilters"
import { EVENT_LOCALES } from "./eventLocales"
import { EventList, type FromListState } from "./EventList"
import { eventFilter } from "./filters"
import { isEventLink, useLinkedEvent } from "./linkedEvent"
import { publicWindowQuery } from "./publicWindow"
import { useEventFilters } from "./useEventFilters"
import "./CalendarPage.scss"

const loadEventDetails = () => import("./details/EventDetailsDialog")
const EventDetailsDialog = lazy(loadEventDetails)
const NotFoundPage = lazy(() => import("../../pages/NotFoundPage"))

const COPY = defineCopy({
    he: {
        title: "קונטקט אימפרוביזציה ישראל",
        subtitle: "כל האירועים במקום אחד",
        view: "תצוגה",
        listView: "צפייה ברשימת אירועים",
        calendarView: "צפייה באירועים לפי לוח שנה",
        noEvents: "אין אירועים קרובים",
        offline: "אין חיבור לאינטרנט – לא ניתן לטעון את האירועים",
        loadFailed: "לא הצלחנו לטעון את האירועים",
        loading: "טוען אירועים…",
    },
    en: {
        title: "Israel Contact Improvisation",
        subtitle: "Everything, everywhere",
        view: "View",
        listView: "Show events as a list",
        calendarView: "Show events on a calendar",
        noEvents: "No upcoming events",
        offline: "No internet connection – the events can't be loaded",
        loadFailed: "We couldn't load the events",
        loading: "Loading events…",
    },
    ru: {
        title: "Контактная импровизация в Израиле",
        subtitle: "Всё, везде",
        view: "Вид",
        listView: "Показать события списком",
        calendarView: "Показать события в календаре",
        noEvents: "Нет ближайших событий",
        offline: "Нет подключения к интернету – события не загрузить",
        loadFailed: "Не удалось загрузить события",
        loading: "Загрузка событий…",
    },
})

type View = "list" | "calendar"

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
    // …and on the day, so passed events drop out after midnight.
    const today = useToday()
    const windowQuery = useMemo(
        () => publicWindowQuery(services, today),
        [services, today],
    )
    const { data: events, isError, refetch } = useQuery(windowQuery)
    const copy = useCopy(COPY)
    const common = useCopy(COMMON_COPY)
    const locale = useCopy(EVENT_LOCALES)
    const cards = useMemo(
        () => events && toEventCards(events, locale),
        [events, locale],
    )
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
    // A shared link's event is shown in the list behind its details, as
    // legacy did; one opened from the list is there already.
    const fromList = !!(location.state as FromListState | null)?.fromList
    const revealId =
        !fromList && linked?.status === "found" ? linked.event.id : undefined

    // Fetch the details' code alongside the linked event's data.
    useEffect(() => {
        if (eventId && isEventLink(eventId)) void loadEventDetails()
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
        if (fromList) {
            void navigate(-1)
        } else {
            const calendar = { pathname: "/", search: location.search }
            void navigate(calendar, { replace: true })
        }
    }

    return (
        <main className="calendar-page">
            <header className="calendar-header">
                <h1 className="calendar-title">{copy.title}</h1>
                <p className="calendar-subtitle">{copy.subtitle}</p>
                <div className="calendar-menu">
                    <ToggleButtons
                        label={copy.view}
                        options={[
                            {
                                key: "list",
                                label: copy.listView,
                                Icon: ViewDayIcon,
                            },
                            {
                                key: "calendar",
                                label: copy.calendarView,
                                Icon: CalendarIcon,
                            },
                        ]}
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
            {/* Events, once there (fetched or restored from storage), stay on
                screen; being offline or a failed refresh only adds the
                header's out-of-date sign (StaleDataNotice). */}
            {shownCards ? (
                view === "calendar" ? (
                    <CalendarView cards={shownCards} today={today} />
                ) : shownCards.length === 0 ? (
                    <p className="calendar-empty">{copy.noEvents}</p>
                ) : (
                    <EventList cards={shownCards} revealId={revealId} />
                )
            ) : !isOnline ? (
                // The request waits for the connection and is sent once back
                // online.
                <p role="alert">{copy.offline}</p>
            ) : isError ? (
                <div role="alert">
                    <p>{copy.loadFailed}</p>
                    <button type="button" onClick={() => refetch()}>
                        {common.retry}
                    </button>
                </div>
            ) : (
                <p role="status">{copy.loading}</p>
            )}
            {/* Under the events in either view, or the empty list, as legacy. */}
            {shownCards && <PageFooter />}
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
