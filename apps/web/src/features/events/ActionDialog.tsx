import type { ReactNode } from "react"
import { useCopy, useLanguage } from "../../app/language"
import { COMMON_COPY } from "../../lib/commonCopy"
import { defineCopy } from "../../lib/copy"
import { numericDayLabel } from "../../lib/jerusalemDate"
import { Dialog } from "../../ui/Dialog"
import { FormAlert } from "../../ui/form/fields"
import { WarningIcon } from "../../ui/icons/WarningIcon"
import { pickTitle } from "../calendar/eventFormat"
import type { ManagedEvent } from "./managedEvent"

// Legacy's confirm modals for event actions (HideEventButton,
// DeleteEventButton, CancelledEventButton, EditRecurringEventDialog):
// the dialog, the `DD/MM/YYYY - title` line and the choice of later
// events of a recurring series. Shared by manage-events and the edit form;
// their stylesheets `@use "../events/action-dialog"` (./_action-dialog.scss).

const COPY = defineCopy({
    he: {
        series: "ארועים עתידיים באותה סדרה:",
        all: "הכל",
        failed: "הפעולה נכשלה, נסו שוב",
    },
    en: {
        series: "Later events in the same series:",
        all: "All",
        failed: "That didn't work, please try again",
    },
    ru: {
        series: "Следующие события той же серии:",
        all: "Все",
        failed: "Не получилось, попробуйте снова",
    },
})

/** Legacy's `DD/MM/YYYY - title` line. */
export function EventLine({ event }: { event: ManagedEvent }) {
    const { language } = useLanguage()
    return (
        <p className="font-medium">
            {numericDayLabel(event.startDate)} - {pickTitle(event, language)}
        </p>
    )
}

/** The later events of the series to act on too, with "all". */
export function SeriesChoice({
    series,
    chosen,
    onChange,
}: {
    series: readonly ManagedEvent[]
    chosen: readonly string[]
    onChange: (ids: string[]) => void
}) {
    const copy = useCopy(COPY)
    const { language } = useLanguage()
    if (series.length === 0) return null
    const all = series.every((event) => chosen.includes(event.id))
    return (
        <fieldset className="series-choice">
            <legend>{copy.series}</legend>
            <label className="series-option">
                <input
                    type="checkbox"
                    checked={all}
                    onChange={() =>
                        onChange(all ? [] : series.map(({ id }) => id))
                    }
                />
                {copy.all}
            </label>
            <div className="checkbox-group">
                {series.map((event) => (
                    <label key={event.id} className="series-option">
                        <input
                            type="checkbox"
                            checked={chosen.includes(event.id)}
                            onChange={() =>
                                onChange(
                                    chosen.includes(event.id)
                                        ? chosen.filter((id) => id !== event.id)
                                        : [...chosen, event.id],
                                )
                            }
                        />
                        {numericDayLabel(event.startDate)} -{" "}
                        {pickTitle(event, language)}
                    </label>
                ))}
            </div>
        </fieldset>
    )
}

/**
 * Legacy's confirm modal: a title, the question, OK (danger, or antd's
 * primary blue) and back.
 */
export function ActionDialog({
    title,
    ok,
    back,
    warning = false,
    primary = false,
    pending,
    ready = true,
    failed,
    failure,
    onOk,
    onClose,
    children,
}: {
    title: string
    ok: string
    /** The dismiss button's word; "cancel" by default. */
    back?: string
    /** Legacy's warning icon before the title (its cancel confirm). */
    warning?: boolean
    /** OK as antd's primary button, not a danger one. */
    primary?: boolean
    pending: boolean
    /** OK waits while false (what it acts on is still loading). */
    ready?: boolean
    failed: boolean
    /** What `failed` says, if not "that didn't work". */
    failure?: string
    onOk: () => void
    onClose: () => void
    children: ReactNode
}) {
    const copy = useCopy(COPY)
    const common = useCopy(COMMON_COPY)
    return (
        <Dialog label={title} onClose={onClose} className="action-dialog">
            <div className="batch-action-event-modal">
                <h2 className="action-dialog-title">
                    {warning && <WarningIcon className="action-dialog-icon" />}
                    {title}
                </h2>
                {children}
                {failed && (
                    <FormAlert kind="error">{failure ?? copy.failed}</FormAlert>
                )}
                <div className="action-dialog-footer">
                    <button
                        type="button"
                        className={`action-dialog-btn ${primary ? "primary" : "danger"}`}
                        disabled={pending || !ready}
                        onClick={onOk}
                    >
                        {ok}
                    </button>
                    <button
                        type="button"
                        className="action-dialog-btn"
                        disabled={pending}
                        onClick={onClose}
                    >
                        {back ?? common.cancel}
                    </button>
                </div>
            </div>
        </Dialog>
    )
}
