import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { useUserId } from "../../app/auth/personal"
import { useCopy } from "../../app/language"
import { useServices } from "../../app/services"
import { useDebouncedValue } from "../../app/useDebouncedValue"
import { useToday } from "../../app/useToday"
import { defineCopy } from "@ci-calendar/core/lib/copy"
import { FormAlert, TextField } from "../../ui/form/fields"
import { TagPicker, type PickerOption } from "../../ui/form/TagPicker"
import { SEARCH_DEBOUNCE_MS, usePagedAdminList } from "../admin/adminLists"
import { RefreshButton } from "../admin/RefreshButton"
import { laterInSeries } from "@ci-calendar/core/features/events/eventLists"
import {
    FROM_ALL_EVENTS,
    type ManagedEvent,
} from "@ci-calendar/core/features/events/managedEvent"
import { seriesQuery } from "@ci-calendar/core/features/events/series"
import { EventActions, type LaterEvents } from "../manage-events/EventActions"
import { ManagedEventList } from "../manage-events/ManagedEventList"
import { useFocusAfterDelete } from "../manage-events/useFocusAfterDelete"
import {
    adminEventCreatorsQuery,
    adminEventsQuery,
} from "@ci-calendar/core/features/admin-events/adminEvents"
import "./ManageAllEventsPage.scss"

// Legacy ManageEventsList (Hebrew only there). The list's states, "load
// more" and the refresh are new: legacy showed the store's events as they
// were.
const COPY = defineCopy({
    he: {
        title: "ניהול אירועים",
        byCreator: "סינון לפי יוצרים",
        removeCreator: (name: string) => `הסרת ${name}`,
        byTitle: "סינון לפי שם האירוע",
        events: "אירועים",
        none: "אין אירועים",
        filtering: "מסנן…",
        loadMore: "טעינת אירועים נוספים",
        loadFailed: "לא הצלחנו לטעון את האירועים",
        refreshFailed: "לא הצלחנו לרענן את האירועים",
    },
    en: {
        title: "Manage Events",
        byCreator: "Filter by creators",
        removeCreator: (name: string) => `Remove ${name}`,
        byTitle: "Filter by event name",
        events: "Events",
        none: "No events",
        filtering: "Filtering…",
        loadMore: "Load more events",
        loadFailed: "We couldn't load the events",
        refreshFailed: "We couldn't refresh the events",
    },
    ru: {
        title: "Управление событиями",
        byCreator: "Фильтр по организаторам",
        removeCreator: (name: string) => `Убрать ${name}`,
        byTitle: "Фильтр по названию события",
        events: "События",
        none: "Событий нет",
        filtering: "Фильтрация…",
        loadMore: "Загрузить ещё события",
        loadFailed: "Не удалось загрузить события",
        refreshFailed: "Не удалось обновить события",
    },
})

/**
 * `/manage-all-events` (admins): every creator's events from today on,
 * hidden ones included, filtered by creator and title on the server, each
 * opening to its details and legacy's actions on anyone's event (edit,
 * delete, cancel or restore, hide or show). The events and the creators
 * load when the page opens; nothing of it at boot.
 */
export default function ManageAllEventsPage() {
    const copy = useCopy(COPY)
    const services = useServices()
    const adminId = useUserId()
    const [creators, setCreators] = useState<PickerOption[]>([])
    const [text, setText] = useState("")
    const search = useDebouncedValue(text, SEARCH_DEBOUNCE_MS).trim()
    const creatorIds = useMemo(
        () => creators.map(({ value }) => value),
        [creators],
    )
    const { heading, onDeleted } = useFocusAfterDelete()

    // Memoised on the day too, so events whose day passes drop out.
    const today = useToday()
    const eventsOptions = useMemo(
        () => adminEventsQuery(services, adminId, creatorIds, search, today),
        [services, adminId, creatorIds, search, today],
    )
    // The refresh button: the list shown, from its first page, and the
    // creators; other filters' lists load again when chosen.
    const {
        list: events,
        refreshing,
        refresh,
    } = usePagedAdminList({
        ...eventsOptions,
        // A new filter shows the last list until its own arrives.
        placeholderData: keepPreviousData,
    })
    const creatorList = useQuery({
        ...adminEventCreatorsQuery(services, adminId),
        enabled: !!adminId,
    })
    const { refetch: refetchCreators } = creatorList

    const shown = useMemo(
        () => events.data?.pages.flatMap((page) => page.events),
        [events.data],
    )
    const creatorOptions = useMemo(
        () =>
            (creatorList.data ?? []).map(({ id, name }) => ({
                value: id,
                label: name,
            })),
        [creatorList.data],
    )
    const names = useMemo(
        () => new Map(creatorOptions.map(({ value, label }) => [value, label])),
        [creatorOptions],
    )

    return (
        <main className="manage-all-events">
            <header className="manage-events-header">
                <h1
                    ref={heading}
                    tabIndex={-1}
                    className="manage-events-header-title"
                >
                    {copy.title}
                </h1>
                <div className="filters-container">
                    <TagPicker
                        label={copy.byCreator}
                        options={creatorOptions}
                        selected={creators}
                        onChange={setCreators}
                        removeLabel={copy.removeCreator}
                    />
                    <TextField
                        type="search"
                        label={copy.byTitle}
                        labelAsPlaceholder
                        autoComplete="off"
                        value={text}
                        onChange={setText}
                    />
                </div>
            </header>
            <div className="manage-all-events-toolbar">
                <RefreshButton
                    refreshing={refreshing}
                    onRefresh={() => refresh(refetchCreators)}
                />
            </div>
            {events.isPlaceholderData && (
                <p className="manage-events-status" role="status">
                    {copy.filtering}
                </p>
            )}
            {events.isRefetchError && (
                <FormAlert kind="error">{copy.refreshFailed}</FormAlert>
            )}
            <ManagedEventList
                label={copy.events}
                events={shown}
                query={events}
                paging={events}
                busy={events.isPlaceholderData}
                empty={<p className="manage-events-status">{copy.none}</p>}
                loadFailed={copy.loadFailed}
                loadMore={copy.loadMore}
                creatorOf={(event) => names.get(event.ownerId)}
                actions={(event) => (
                    <AdminEventActions
                        event={event}
                        adminId={adminId}
                        onDeleted={onDeleted}
                    />
                )}
            />
        </main>
    )
}

/**
 * Legacy's actions on anyone's event (`ownOnly={false}`). Delete and hide
 * offer the later events of its recurring series, the owner's, read when
 * the row opens (legacy took them from the calendar's events).
 */
function AdminEventActions({
    event,
    adminId,
    onDeleted,
}: {
    event: ManagedEvent
    adminId: string
    onDeleted: () => void
}) {
    const services = useServices()
    const refKey = event.recurringRefKey ?? ""
    const series = useQuery({
        ...seriesQuery(services, adminId, refKey, event.ownerId),
        enabled: !!adminId && !!refKey,
    })
    // Delete and hide wait for it; failed, they say so and offer a retry.
    const { refetch } = series
    const later: LaterEvents = !refKey
        ? { state: "ready", events: [] }
        : series.data
          ? { state: "ready", events: laterInSeries(series.data, event) }
          : series.isError
            ? { state: "failed", retry: () => void refetch() }
            : { state: "loading" }
    return (
        <EventActions
            event={event}
            later={later}
            userId={adminId}
            ownOnly={false}
            editState={FROM_ALL_EVENTS}
            onDeleted={onDeleted}
        />
    )
}
