import {
    useInfiniteQuery,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router"
import { useUserId } from "../../app/auth/personal"
import { useCopy } from "../../app/language"
import { useServices } from "../../app/services"
import { useToday } from "../../app/useToday"
import catButtGif from "../../assets/img/cat-butt.gif?no-inline"
import { defineCopy } from "@ci-calendar/core/lib/copy"
import { ToggleButtons } from "../../ui/ToggleButtons"
import { EventActions } from "./EventActions"
import { ManagedEventList } from "./ManagedEventList"
import { useFocusAfterDelete } from "./useFocusAfterDelete"
import {
    laterInSeries,
    myPastEventsKey,
} from "@ci-calendar/core/features/events/eventLists"
import {
    myPastEventsQuery,
    myUpcomingEventsQuery,
} from "@ci-calendar/core/features/manage-events/myEvents"
import "./ManageEventsPage.scss"

// Legacy ManageUserEventsPage (Hebrew only there).
const COPY = defineCopy({
    he: {
        title: "האירועים שלי",
        createEvent: "יצירת אירוע",
        timeframe: "אירועים להצגה",
        past: "עבר",
        future: "עתיד",
        noEvents: "נראה שעדיין אין לכם אירועים",
        loadMore: "טעינת אירועים נוספים",
        loadFailed: "לא הצלחנו לטעון את האירועים שלך",
    },
    en: {
        title: "My Events",
        createEvent: "Create Event",
        timeframe: "Events to show",
        past: "Past",
        future: "Future",
        noEvents: "Looks like you don't have any events yet",
        loadMore: "Load more events",
        loadFailed: "We couldn't load your events",
    },
    ru: {
        title: "Мои события",
        createEvent: "Создать событие",
        timeframe: "Какие события показать",
        past: "Прошедшие",
        future: "Будущие",
        noEvents: "Похоже, у вас ещё нет событий",
        loadMore: "Загрузить ещё события",
        loadFailed: "Не удалось загрузить ваши события",
    },
})

type Timeframe = "past" | "future"

/**
 * `/manage-events` (creators, orgs and admins): the user's own events,
 * hidden ones included. Upcoming events load when the page opens; past
 * ones only once asked for, a page at a time. A row opens the event's
 * details and, for upcoming events, its actions.
 */
export default function ManageEventsPage() {
    const copy = useCopy(COPY)
    const services = useServices()
    const userId = useUserId()
    const navigate = useNavigate()
    const [timeframe, setTimeframe] = useState<Timeframe>("future")
    // Past events are fetched from the first time they are asked for.
    const [pastAsked, setPastAsked] = useState(false)
    const { heading, onDeleted } = useFocusAfterDelete()

    // Memoised on the day too, so events whose day passes drop out.
    const today = useToday()
    const upcomingOptions = useMemo(
        () => myUpcomingEventsQuery(services, userId, today),
        [services, userId, today],
    )
    const upcoming = useQuery({ ...upcomingOptions, enabled: !!userId })
    const past = useInfiniteQuery({
        ...myPastEventsQuery(services, userId),
        enabled: !!userId && pastAsked,
    })
    // Past pages last as long as the page: the next visit starts over.
    const queryClient = useQueryClient()
    useEffect(
        () => () =>
            queryClient.removeQueries({ queryKey: myPastEventsKey(userId) }),
        [queryClient, userId],
    )
    const pastEvents = useMemo(
        () => past.data?.pages.flatMap((page) => page.events),
        [past.data],
    )

    const showPast = timeframe === "past"
    const shown = showPast ? past : upcoming
    const events = showPast ? pastEvents : upcoming.data

    function selectTimeframe(next: Timeframe) {
        setTimeframe(next)
        if (next === "past") setPastAsked(true)
    }

    return (
        <main className="user-events-list-page">
            <h1 ref={heading} tabIndex={-1} className="visually-hidden">
                {copy.title}
            </h1>
            <header className="manage-events-header">
                <div className="header-buttons-container">
                    <button
                        type="button"
                        className="general-action-btn"
                        onClick={() => void navigate("/create-events")}
                    >
                        {copy.createEvent}
                    </button>
                    <ToggleButtons
                        label={copy.timeframe}
                        options={[
                            { key: "past", label: copy.past },
                            { key: "future", label: copy.future },
                        ]}
                        selected={timeframe}
                        onSelect={selectTimeframe}
                    />
                </div>
            </header>
            <ManagedEventList
                label={showPast ? copy.past : copy.future}
                events={events}
                query={shown}
                paging={showPast ? past : undefined}
                empty={
                    <div className="no-events-message">
                        <img
                            className="no-events-message-gif"
                            src={catButtGif}
                            alt=""
                            width={300}
                            height={300}
                            loading="lazy"
                        />
                        <p className="no-events-message-label">
                            {copy.noEvents}
                        </p>
                    </div>
                }
                loadFailed={copy.loadFailed}
                loadMore={copy.loadMore}
                // Past events have no actions, as in legacy.
                actions={
                    showPast
                        ? undefined
                        : (event) => (
                              <EventActions
                                  event={event}
                                  later={{
                                      state: "ready",
                                      events: laterInSeries(
                                          upcoming.data ?? [],
                                          event,
                                      ),
                                  }}
                                  userId={userId}
                                  onDeleted={onDeleted}
                              />
                          )
                }
            />
        </main>
    )
}
