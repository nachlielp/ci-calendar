import { useId, useState } from "react"
import { Link } from "react-router"
import { useCopy } from "../../app/language"
import { defineCopy } from "../../lib/copy"
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
    useDeleteEvents,
    useSetCancelled,
    useSetHidden,
} from "../events/eventWrites"
import { laterInSeries } from "./myEvents"
import "./EventActions.scss"

// Legacy ManageEventActions, HideEventButton, CancelledEventButton and
// DeleteEventButton (Hebrew only there; their typos fixed).
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
    },
})

type Open = "delete" | "cancel" | "hide" | null

/**
 * An upcoming event's actions: edit, delete, cancel or restore, hide or
 * show. `upcoming` is the user's upcoming events, where its recurring
 * series' later events are found for "this one or the following too".
 */
export function EventActions({
    event,
    upcoming,
    userId,
    onDeleted,
}: {
    event: ManagedEvent
    upcoming: readonly ManagedEvent[]
    userId: string
    /** The event is deleted (its row, and this, are about to go). */
    onDeleted: () => void
}) {
    const copy = useCopy(COPY)
    const [open, setOpen] = useState<Open>(null)
    const close = () => setOpen(null)
    const later = laterInSeries(upcoming, event)

    return (
        <section className="manage-event-actions" aria-label={copy.actions}>
            <Link
                className="action-btn edit-btn"
                to={editPath(event)}
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
                    userId={userId}
                    onClose={close}
                    onDeleted={onDeleted}
                />
            )}
            {open === "hide" && (
                <HideDialog
                    event={event}
                    // Legacy offered the series' events in the same state.
                    series={later.filter(
                        (other) => other.hidden === event.hidden,
                    )}
                    userId={userId}
                    onClose={close}
                />
            )}
            {open === "cancel" && (
                <CancelDialog event={event} userId={userId} onClose={close} />
            )}
        </section>
    )
}

interface DialogProps {
    event: ManagedEvent
    userId: string
    onClose: () => void
}

function DeleteDialog({
    event,
    series,
    userId,
    onClose,
    onDeleted,
}: DialogProps & { series: ManagedEvent[]; onDeleted: () => void }) {
    const copy = useCopy(COPY)
    const remove = useDeleteEvents(userId)
    const [chosen, setChosen] = useState<string[]>([])
    return (
        <ActionDialog
            title={copy.delete}
            ok={copy.deleteOk}
            pending={remove.isPending}
            failed={remove.isError}
            onOk={() =>
                remove.mutate(
                    [event, ...series.filter((e) => chosen.includes(e.id))],
                    {
                        onSuccess: () => {
                            onClose()
                            onDeleted()
                        },
                    },
                )
            }
            onClose={onClose}
        >
            <p>{copy.deleteQuestion}</p>
            <EventLine event={event} />
            <SeriesChoice
                series={series}
                chosen={chosen}
                onChange={setChosen}
            />
        </ActionDialog>
    )
}

function HideDialog({
    event,
    series,
    userId,
    onClose,
}: DialogProps & { series: ManagedEvent[] }) {
    const copy = useCopy(COPY)
    const setHidden = useSetHidden(userId)
    const [chosen, setChosen] = useState<string[]>([])
    const hide = !event.hidden
    return (
        <ActionDialog
            title={hide ? copy.hide : copy.show}
            ok={hide ? copy.hideOk : copy.showOk}
            pending={setHidden.isPending}
            failed={setHidden.isError}
            onOk={() =>
                setHidden.mutate(
                    {
                        events: [
                            event,
                            ...series.filter((e) => chosen.includes(e.id)),
                        ],
                        hide,
                    },
                    { onSuccess: onClose },
                )
            }
            onClose={onClose}
        >
            <p>{hide ? copy.hideQuestion : copy.showQuestion}</p>
            <EventLine event={event} />
            <SeriesChoice
                series={series}
                chosen={chosen}
                onChange={setChosen}
            />
        </ActionDialog>
    )
}

function CancelDialog({ event, userId, onClose }: DialogProps) {
    const copy = useCopy(COPY)
    const setCancelled = useSetCancelled(userId)
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
