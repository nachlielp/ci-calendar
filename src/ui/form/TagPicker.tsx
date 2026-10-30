import { useId, useState, type KeyboardEvent } from "react"
import { CloseIcon } from "../icons/CloseIcon"
import "./TagPicker.scss"

/** A chosen or offered option: `value` identifies it, `label` shows. */
export interface PickerOption {
    label: string
    value: string
}

/**
 * Several options out of a long list, typed to search (legacy's antd
 * Select with `mode="multiple"`, or `mode="tags"` with `allowTyped`, where
 * a typed name not in the list is added as `{ label: name, value: name }`).
 * The chosen ones show as chips with a remove button; the input is an ARIA
 * combobox over a listbox of matches (arrows, Enter, Escape; Backspace in
 * the empty input removes the last chip).
 */
export function TagPicker({
    label,
    options,
    selected,
    onChange,
    onBlur,
    allowTyped = false,
    typedOption,
    removeLabel,
    error,
}: {
    label: string
    options: readonly PickerOption[]
    selected: readonly PickerOption[]
    onChange: (selected: PickerOption[]) => void
    onBlur?: () => void
    allowTyped?: boolean
    /** The option that adds typed text, e.g. `Add "Dana"`. */
    typedOption?: (text: string) => string
    /** The chip's remove button, e.g. `Remove Dana`. */
    removeLabel: (label: string) => string
    error?: string
}) {
    const id = useId()
    const [query, setQuery] = useState("")
    const [open, setOpen] = useState(false)
    const [active, setActive] = useState(0)

    const text = query.trim()
    const chosen = new Set(selected.map((option) => option.value))
    const matches = options.filter(
        (option) =>
            !chosen.has(option.value) &&
            option.label.toLowerCase().includes(text.toLowerCase()),
    )
    const typed =
        allowTyped &&
        text &&
        !options.some((option) => option.label === text) &&
        !selected.some((option) => option.label === text)
            ? [{ label: text, value: text, typed: true }]
            : []
    const shown: (PickerOption & { typed?: boolean })[] = [...matches, ...typed]
    const expanded = open && shown.length > 0
    const current = Math.min(active, shown.length - 1)

    const pick = (option: PickerOption) => {
        onChange([...selected, { label: option.label, value: option.value }])
        setQuery("")
        setActive(0)
    }

    const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault()
            setOpen(true)
            const step = event.key === "ArrowDown" ? 1 : -1
            setActive((current + step + shown.length) % (shown.length || 1))
        } else if (event.key === "Enter") {
            // Picks, never submits the form.
            event.preventDefault()
            if (expanded) pick(shown[current])
        } else if (event.key === "Escape" && expanded) {
            event.preventDefault()
            event.stopPropagation()
            setOpen(false)
        } else if (event.key === "Backspace" && !query && selected.length) {
            onChange(selected.slice(0, -1))
        }
    }

    const optionId = (index: number) => `${id}-option-${index}`
    return (
        <div
            className={`form-field combobox-field tag-picker${error ? " invalid" : ""}`}
        >
            <label htmlFor={id} className="visually-hidden">
                {label}
            </label>
            <div className="form-input tag-picker-box">
                {selected.length > 0 && (
                    <ul className="tag-picker-chips" aria-label={label}>
                        {selected.map((option, index) => (
                            <li
                                key={`${option.value}-${index}`}
                                className="tag-picker-chip"
                            >
                                {option.label}
                                <button
                                    type="button"
                                    className="tag-picker-remove"
                                    aria-label={removeLabel(option.label)}
                                    onClick={() =>
                                        onChange(
                                            selected.filter(
                                                (_, other) => other !== index,
                                            ),
                                        )
                                    }
                                >
                                    <CloseIcon className="tag-picker-remove-icon" />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
                <input
                    id={id}
                    className="tag-picker-input"
                    role="combobox"
                    aria-expanded={expanded}
                    aria-controls={`${id}-list`}
                    aria-autocomplete="list"
                    aria-activedescendant={
                        expanded ? optionId(current) : undefined
                    }
                    autoComplete="off"
                    placeholder={selected.length ? "" : label}
                    value={query}
                    onChange={(event) => {
                        setQuery(event.target.value)
                        setActive(0)
                        setOpen(true)
                    }}
                    onFocus={() => setOpen(true)}
                    onBlur={() => {
                        setOpen(false)
                        setQuery("")
                        onBlur?.()
                    }}
                    onKeyDown={onKeyDown}
                    {...(error
                        ? {
                              "aria-invalid": true,
                              "aria-describedby": `${id}-error`,
                          }
                        : {})}
                />
            </div>
            <ul
                id={`${id}-list`}
                role="listbox"
                aria-label={label}
                className="form-options"
                hidden={!expanded}
            >
                {expanded &&
                    shown.map((option, index) => (
                        // The keyboard picks through the combobox
                        // (aria-activedescendant), not on the option.
                        // eslint-disable-next-line jsx-a11y/click-events-have-key-events
                        <li
                            key={`${option.value}-${index}`}
                            id={optionId(index)}
                            role="option"
                            aria-selected={index === current}
                            className="form-option"
                            // Keeps the focus in the input.
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => pick(option)}
                        >
                            {option.typed && typedOption
                                ? typedOption(option.label)
                                : option.label}
                        </li>
                    ))}
            </ul>
            {error && (
                <p id={`${id}-error`} className="form-error">
                    {error}
                </p>
            )}
        </div>
    )
}
