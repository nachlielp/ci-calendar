import { useState } from "react"
import { plural } from "../../lib/plural"
import { Dialog } from "../../ui/Dialog"
import { CloseIcon, InstantMixIcon } from "../../ui/icons"
import { HEBREW, optionLabel, type EventLocale } from "./eventFormat"
import { DISTRICT_FILTERS, TYPE_FILTERS } from "./filters"
import "./EventFilters.scss"

const hebrewPlurals = new Intl.PluralRules("he")

const COPY = {
    filter: "סינון",
    eventType: "סוג אירוע",
    region: "אזור",
    clear: "ניקוי הסינון",
    selected: (count: number) =>
        plural(hebrewPlurals, count, {
            one: "סינון אחד פעיל",
            other: "# סינונים פעילים",
        }),
    remove: (label: string) => `הסרת הסינון ${label}`,
}

interface FiltersProps {
    filters: readonly string[]
    /** Turns one filter on or off. */
    onToggle: (value: string, selected: boolean) => void
    locale?: EventLocale
}

/**
 * The filter button and its dialog (legacy FilterDrawer on phones,
 * FilterModal on wider screens). Each option applies as it is tapped.
 */
export function FilterButton({
    filters,
    onToggle,
    onClear,
    locale = HEBREW,
}: FiltersProps & { onClear: () => void }) {
    const [open, setOpen] = useState(false)

    const options = (values: readonly string[]) =>
        values.map((value) => (
            <button
                key={value}
                type="button"
                aria-pressed={filters.includes(value)}
                className="filter-option"
                onClick={() => onToggle(value, !filters.includes(value))}
            >
                {optionLabel(value, locale)}
            </button>
        ))

    return (
        <>
            <button
                type="button"
                aria-haspopup="dialog"
                className={`filter-button ${filters.length > 0 ? "active" : ""}`}
                onClick={() => setOpen(true)}
            >
                <span className="filter-button-text">{COPY.filter}</span>
                <InstantMixIcon className="filter-button-icon" />
                {filters.length > 0 && (
                    <span className="visually-hidden">
                        {`(${COPY.selected(filters.length)})`}
                    </span>
                )}
            </button>
            {open && (
                <Dialog
                    label={COPY.filter}
                    className="filter-dialog"
                    onClose={() => setOpen(false)}
                >
                    <h2 className="filter-group-title">{COPY.eventType}</h2>
                    <div
                        role="group"
                        aria-label={COPY.eventType}
                        className="filter-options"
                    >
                        {options(TYPE_FILTERS)}
                    </div>
                    <h2 className="filter-group-title">{COPY.region}</h2>
                    <div
                        role="group"
                        aria-label={COPY.region}
                        className="filter-options"
                    >
                        {options(DISTRICT_FILTERS)}
                    </div>
                    {filters.length > 0 && (
                        <button
                            type="button"
                            className="filter-clear"
                            onClick={onClear}
                        >
                            {COPY.clear}
                        </button>
                    )}
                </Dialog>
            )}
        </>
    )
}

/** The selected filters as chips under the header; a tap removes one. */
export function SelectedFilters({
    filters,
    onToggle,
    locale = HEBREW,
}: FiltersProps) {
    return (
        <div className="selected-filters">
            {filters.map((value) => (
                <button
                    key={value}
                    type="button"
                    aria-label={COPY.remove(optionLabel(value, locale))}
                    className="selected-filter"
                    onClick={() => onToggle(value, false)}
                >
                    {optionLabel(value, locale)}
                    <CloseIcon className="selected-filter-icon" />
                </button>
            ))}
        </div>
    )
}
