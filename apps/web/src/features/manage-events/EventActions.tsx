import { useId, useState } from "react"
import { Link } from "react-router"
import { useCopy } from "../../app/language"
import { COMMON_COPY } from "@ci-calendar/core/lib/commonCopy"
import { defineCopy } from "@ci-calendar/core/lib/copy"
import { FormAlert } from "../../ui/form/fields"
import { CancelIcon } from "../../ui/icons/CancelIcon"
import { CheckCircleIcon } from "../../ui/icons/CheckCircleIcon"
import { DeleteIcon } from "../../ui/icons/DeleteIcon"
import { EditIcon } from "../../ui/icons/EditIcon"
import { VisibilityIcon } from "../../ui/icons/VisibilityIcon"
import { VisibilityOffIcon } from "../../ui/icons/VisibilityOffIcon"
import { ActionDialog, EventLine, SeriesChoice } from "../events/ActionDialog"
import { editPath, type ManagedEvent } from "../events/managedEvent"
import {
    CANCELLED_TEXT_MAX,
    EventsChangedError,
    useDeleteEvents,
    useSetCancelled,
    useSetHidden,
    type EventWriteOptions,
} from "../events/eventWrites"

// Legacy ManageEventActions, HideEventButton, CancelledEventButton and
// DeleteEventButton (Hebrew only there; their typos fixed). Styled by
// ./_event-actions.scss, which the page's stylesheet `@use`s.
const COPY = defineCopy({
    he: {
        actions: "פעולות על האירוע",
        edit: "עריכת אירוע",
        delete: "מחיקת ארוע",
        deleteOk: "מחיקה",
        deleteQuestion: "האם אתם בטוחים שאתם רוצים למחוק את הארוע?",
        hide: "הסתרת ארוע",
        hideOk: "הסתרה",
        hideQuestion: "האם אתם בטוחים שאתם רוצים להסתיר את הארוע?",
        show: "הצגת ארוע",
        showOk: "הצגה",
        showQuestion: "האם אתם בטוחים שאתם רוצים להציג את הארוע?",
        cancel: "ביטול אירוע",
        cancelOk: "ביטול אירוע",
        cancelQuestion: "האם אתם בטוחים שאתם רוצים לבטל את הארוע?",
        cancelNote: "הסבר במידת הצורך - ביטול חד״פ/ לצמיתות וכו׳",
        restore: "הפעלת אירוע",
        restoreOk: "הפעלה",
        restoreQuestion: "האם אתם בטוחים שאתם רוצים להפעיל את הארוע?",
        back: "חזרה",
        changed:
            "הפעולה לא בוצעה על כל האירועים: אין הרשאה, או שהם השתנו בינתיים. הרשימה עודכנה.",
        seriesFailed: "לא הצלחנו לטעון את האירועים הבאים בסדרה",
    },
    en: {
        actions: "Event actions",
        edit: "Edit event",
        delete: "Delete event",
        deleteOk: "Delete",
        deleteQuestion: "Are you sure you want to delete the event?",
        hide: "Hide event",
        hideOk: "Hide",
        hideQuestion: "Are you sure you want to hide the event?",
        show: "Show event",
        showOk: "Show",
        showQuestion: "Are you sure you want to show the event?",
        cancel: "Cancel event",
        cancelOk: "Cancel event",
        cancelQuestion: "Are you sure you want to cancel the event?",
        cancelNote: "Explain if needed – cancelled once, for good, etc.",
        restore: "Restore event",
        restoreOk: "Restore",
        restoreQuestion: "Are you sure you want to restore the event?",
        back: "Back",
        changed:
            "Not done for every event: not allowed, or they changed meanwhile. The list is up to date.",
        seriesFailed: "We couldn't load the later events of the series",
    },
    ru: {
        actions: "Действия с событием",
        edit: "Редактировать событие",
        delete: "Удалить событие",
        deleteOk: "Удалить",
        deleteQuestion: "Вы уверены, что хотите удалить событие?",
        hide: "Скрыть событие",
        hideOk: "Скрыть",
        hideQuestion: "Вы уверены, что хотите скрыть событие?",
        show: "Показать событие",
        showOk: "Показать",
        showQuestion: "Вы уверены, что хотите показать событие?",
        cancel: "Отменить событие",
        cancelOk: "Отменить событие",
        cancelQuestion: "Вы уверены, что хотите отменить событие?",
        cancelNote:
            "Поясните при необходимости – отмена разовая, навсегда и т. п.",
        restore: "Возобновить событие",
        restoreOk: "Возобновить",
        restoreQuestion: "Вы уверены, что хотите возобновить событие?",
        back: "Назад",
        changed:
            "Выполнено не для всех событий: нет прав, или они тем временем изменились. Список обновлён.",
        seriesFailed: "Не удалось загрузить следующие события серии",
    },
})

type Open = "delete" | "cancel" | "hide" | null

/**
 * The later events of the event's recurring series (offered by delete and
 * hide): known, still loading, or failed to load (with a retry). Until
 * known, delete and hide wait rather than skip the question.
 */
export type LaterEvents =
    | { state: "ready"; events: readonly ManagedEvent[] }
    | { state: "loading" }
    | { state: "failed"; retry: () => void }

/** A write's failure as the dialog says it. */
function useFailure(error: Error | null) {
    const copy = useCopy(COPY)
    return error instanceof EventsChangedError ? copy.changed : undefined
}

/**
 * An upcoming event's actions: edit, delete, cancel or restore, hide or
 * show. `later` is its recurring series' later events, offered for "this
 * one or the following too". The user's own events by default; admin
 * pages pass `ownOnly={false}` (and `editState`, the edit link's state).
 */
export function EventActions({
    event,
    later,
    userId,
    ownOnly = true,
    editState,
    onDeleted,
}: {
    event: ManagedEvent
    later: LaterEvents
    userId: string
    ownOnly?: boolean
    editState?: unknown
    /** The event is deleted (its row, and this, are about to go). */
    onDeleted: () => void
}) {
    const copy = useCopy(COPY)
    const [open, setOpen] = useState<Open>(null)
    const close = () => setOpen(null)
    const scope = { userId, options: { ownOnly } }

    return (
        <section className="manage-event-actions" aria-label={copy.actions}>
            <Link
                className="action-btn edit-btn"
                to={editPath(event)}
                state={editState}
                aria-label={copy.edit}
            >
                <EditIcon className="icon" />
            </Link>
            <button
                type="button"
                className="action-btn"
                aria-label={copy.delete}
                onClick={() => setOpen("delete")}
            >
                <DeleteIcon className="icon" />
            </button>
            <button
                type="button"
                className="action-btn"
                aria-label={event.cancelled ? copy.restore : copy.cancel}
                onClick={() => setOpen("cancel")}
            >
                {event.cancelled ? (
                    <CheckCircleIcon className="icon" />
                ) : (
                    <CancelIcon className="icon" />
                )}
            </button>
            <button
                type="button"
                className="action-btn hide-btn"
                aria-label={event.hidden ? copy.show : copy.hide}
                onClick={() => setOpen("hide")}
            >
                {event.hidden ? (
                    <VisibilityIcon className="icon" />
                ) : (
                    <VisibilityOffIcon className="icon" />
                )}
            </button>
            {open === "delete" && (
                <DeleteDialog
                    event={event}
                    series={later}
                    {...scope}
                    onClose={close}
                    onDeleted={onDeleted}
                />
            )}
            {open === "hide" && (
                <HideDialog
                    event={event}
                    // Legacy offered the series' events in the same state.
                    series={
                        later.state === "ready"
                            ? {
                                  ...later,
                                  events: later.events.filter(
                                      (other) => other.hidden === event.hidden,
                                  ),
                              }
                            : later
                    }
                    {...scope}
                    onClose={close}
                />
            )}
            {open === "cancel" && (
                <CancelDialog event={event} {...scope} onClose={close} />
            )}
        </section>
    )
}

interface DialogProps {
    event: ManagedEvent
    userId: string
    options: EventWriteOptions
    onClose: () => void
}

/** The later events to offer, or that they are loading or failed. */
function Series({
    series,
    chosen,
    onChange,
}: {
    series: LaterEvents
    chosen: readonly string[]
    onChange: (ids: string[]) => void
}) {
    const copy = useCopy(COPY)
    const common = useCopy(COMMON_COPY)
    if (series.state === "ready") {
        return (
            <SeriesChoice
                series={series.events}
                chosen={chosen}
                onChange={onChange}
            />
        )
    }
    if (series.state === "loading") {
        return <p role="status">{common.loading}</p>
    }
    return (
        <FormAlert kind="error">
            {copy.seriesFailed}{" "}
            <button
                type="button"
                className="text-button"
                onClick={series.retry}
            >
                {common.retry}
            </button>
        </FormAlert>
    )
}

/** `event` and the later events chosen. */
const withChosen = (
    event: ManagedEvent,
    series: LaterEvents,
    chosen: readonly string[],
) => [
    event,
    ...(series.state === "ready" ? series.events : []).filter((e) =>
        chosen.includes(e.id),
    ),
]

function DeleteDialog({
    event,
    series,
    userId,
    options,
    onClose,
    onDeleted,
}: DialogProps & {
    series: LaterEvents
    onDeleted: () => void
}) {
    const copy = useCopy(COPY)
    const remove = useDeleteEvents(userId, options)
    const failure = useFailure(remove.error)
    const [chosen, setChosen] = useState<string[]>([])
    return (
        <ActionDialog
            title={copy.delete}
            ok={copy.deleteOk}
            pending={remove.isPending}
            ready={series.state === "ready"}
            failed={remove.isError}
            failure={failure}
            onOk={() =>
                remove.mutate(withChosen(event, series, chosen), {
                    onSuccess: () => {
                        onClose()
                        onDeleted()
                    },
                })
            }
            onClose={onClose}
        >
            <p>{copy.deleteQuestion}</p>
            <EventLine event={event} />
            <Series series={series} chosen={chosen} onChange={setChosen} />
        </ActionDialog>
    )
}

function HideDialog({
    event,
    series,
    userId,
    options,
    onClose,
}: DialogProps & { series: LaterEvents }) {
    const copy = useCopy(COPY)
    const setHidden = useSetHidden(userId, options)
    const failure = useFailure(setHidden.error)
    const [chosen, setChosen] = useState<string[]>([])
    const hide = !event.hidden
    return (
        <ActionDialog
            title={hide ? copy.hide : copy.show}
            ok={hide ? copy.hideOk : copy.showOk}
            pending={setHidden.isPending}
            ready={series.state === "ready"}
            failed={setHidden.isError}
            failure={failure}
            onOk={() =>
                setHidden.mutate(
                    { events: withChosen(event, series, chosen), hide },
                    { onSuccess: onClose },
                )
            }
            onClose={onClose}
        >
            <p>{hide ? copy.hideQuestion : copy.showQuestion}</p>
            <EventLine event={event} />
            <Series series={series} chosen={chosen} onChange={setChosen} />
        </ActionDialog>
    )
}

function CancelDialog({ event, userId, options, onClose }: DialogProps) {
    const copy = useCopy(COPY)
    const setCancelled = useSetCancelled(userId, options)
    const failure = useFailure(setCancelled.error)
    const [text, setText] = useState("")
    const noteId = useId()
    const cancel = !event.cancelled
    return (
        <ActionDialog
            title={cancel ? copy.cancel : copy.restore}
            ok={cancel ? copy.cancelOk : copy.restoreOk}
            back={copy.back}
            warning
            pending={setCancelled.isPending}
            failed={setCancelled.isError}
            failure={failure}
            onOk={() =>
                setCancelled.mutate(
                    { event, cancel, text },
                    { onSuccess: onClose },
                )
            }
            onClose={onClose}
        >
            <p>{cancel ? copy.cancelQuestion : copy.restoreQuestion}</p>
            {cancel && (
                <div className="cancel-note">
                    <label htmlFor={noteId} className="visually-hidden">
                        {copy.cancelNote}
                    </label>
                    <input
                        id={noteId}
                        type="text"
                        className="cancel-note-input"
                        maxLength={CANCELLED_TEXT_MAX}
                        placeholder={copy.cancelNote}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    />
                    <div className="cancel-note-count" aria-hidden="true">
                        {text.length}/{CANCELLED_TEXT_MAX}
                    </div>
                </div>
            )}
        </ActionDialog>
    )
}
