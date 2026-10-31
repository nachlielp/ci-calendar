import { useState } from "react"
import { useCopy } from "../../app/language"
import { counted, defineCopy } from "../../lib/copy"
import { Dialog } from "../../ui/Dialog"
import { CloseIcon } from "../../ui/icons/CloseIcon"
import { InstantMixIcon } from "../../ui/icons/InstantMixIcon"
import { optionLabel } from "./eventFormat"
import { EVENT_LOCALES } from "./eventLocales"
import { DISTRICT_FILTERS, TYPE_FILTERS } from "./filters"
import "./EventFilters.scss"

const COPY = defineCopy({
    he: {
        filter: "סינון",
        eventType: "סוג אירוע",
        region: "אזור",
        clear: "ניקוי הסינון",
        selected: counted({
            one: "סינון אחד פעיל",
            other: "# סינונים פעילים",
        }),
        remove: (label: string) => `הסרת הסינון ${label}`,
    },
    en: {
        filter: "Filter",
        eventType: "Event Type",
        region: "Region",
        clear: "Clear filters",
        selected: counted({
            one: "one active filter",
            other: "# active filters",
        }),
        remove: (label: string) => `Remove the ${label} filter`,
    },
    ru: {
        filter: "Фильтр",
        eventType: "Тип события",
        region: "Регион",
        clear: "Сбросить фильтры",
        selected: counted({
            one: "# активный фильтр",
            few: "# активных фильтра",
            many: "# активных фильтров",
            other: "# активного фильтра",
        }),
        remove: (label: string) => `Убрать фильтр «${label}»`,
    },
})

interface FiltersProps {
    filters: readonly string[]
    /** Turns one filter on or off. */
    onToggle: (value: string, selected: boolean) => void
}

/**
 * The filter button and its dialog (legacy FilterDrawer on phones,
 * FilterModal on wider screens). Each option applies as it is tapped.
 */
export function FilterButton({
    filters,
    onToggle,
    onClear,
}: FiltersProps & { onClear: () => void }) {
    const copy = useCopy(COPY)
    const locale = useCopy(EVENT_LOCALES)
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
                <span className="filter-button-text">{copy.filter}</span>
                <InstantMixIcon className="filter-button-icon" />
                {filters.length > 0 && (
                    <span className="visually-hidden">
                        {`(${copy.selected(filters.length)})`}
                    </span>
                )}
            </button>
            {open && (
                <Dialog
                    label={copy.filter}
                    className="filter-dialog"
                    onClose={() => setOpen(false)}
                >
                    <h2 className="filter-group-title">{copy.eventType}</h2>
                    <div
                        role="group"
                        aria-label={copy.eventType}
                        className="filter-options"
                    >
                        {options(TYPE_FILTERS)}
                    </div>
                    <h2 className="filter-group-title">{copy.region}</h2>
                    <div
                        role="group"
                        aria-label={copy.region}
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
                            {copy.clear}
                        </button>
                    )}
                </Dialog>
            )}
        </>
    )
}

/** The selected filters as chips under the header; a tap removes one. */
export function SelectedFilters({ filters, onToggle }: FiltersProps) {
    const copy = useCopy(COPY)
    const locale = useCopy(EVENT_LOCALES)
    return (
        <div className="selected-filters">
            {filters.map((value) => (
                <button
                    key={value}
                    type="button"
                    aria-label={copy.remove(optionLabel(value, locale))}
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
