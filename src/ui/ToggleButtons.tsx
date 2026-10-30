import type { ComponentType } from "react"
import "./ToggleButtons.scss"

export interface ToggleOption<K extends string> {
    key: K
    /** The button's accessible name (it shows only its icon). */
    label: string
    Icon: ComponentType<{ className?: string }>
}

/**
 * A row of joined icon buttons, one of them pressed (legacy MenuButtons).
 * Laid out left to right whatever the page direction, as legacy did.
 */
export function ToggleButtons<K extends string>({
    label,
    options,
    selected,
    onSelect,
}: {
    /** The group's accessible name. */
    label: string
    options: readonly ToggleOption<K>[]
    selected: K
    onSelect: (key: K) => void
}) {
    return (
        <div role="group" aria-label={label} className="toggle-buttons">
            {options.map(({ key, label, Icon }) => (
                <button
                    key={key}
                    type="button"
                    aria-label={label}
                    aria-pressed={key === selected}
                    className="toggle-button"
                    onClick={() => onSelect(key)}
                >
                    <Icon className="toggle-button-icon" />
                </button>
            ))}
        </div>
    )
}
