import {
    useId,
    type InputHTMLAttributes,
    type ReactNode,
    type SelectHTMLAttributes,
    type TextareaHTMLAttributes,
} from "react"
import "./Form.scss"

// Controlled form fields drawn as legacy's large antd inputs (generics/
// form-inputs.scss), for forms built on `useForm` (app/useForm.ts). Each
// takes its label (shown above, or as the placeholder with `placeholder`),
// and the error to show under it, which also marks it invalid for screen
// readers. Copy comes from the form's own `defineCopy`. Other attributes
// pass through to the control, but never override what the field sets
// (id, value, label and error wiring).

interface FieldFrame {
    label: string
    /** Shows `label` inside the empty input instead of above it. */
    labelAsPlaceholder?: boolean
    /** Text under the label (legacy's grey hints). */
    hint?: ReactNode
    error?: string
}

function Frame({
    id,
    label,
    labelAsPlaceholder,
    hint,
    error,
    children,
}: FieldFrame & { id: string; children: ReactNode }) {
    return (
        <div className={`form-field${error ? " invalid" : ""}`}>
            <label
                htmlFor={id}
                className={
                    labelAsPlaceholder ? "visually-hidden" : "form-label"
                }
            >
                {label}
            </label>
            {hint && <p className="form-hint">{hint}</p>}
            {children}
            {error && (
                <p id={`${id}-error`} className="form-error">
                    {error}
                </p>
            )}
        </div>
    )
}

const describedBy = (id: string, error?: string) =>
    error
        ? { "aria-invalid": true as const, "aria-describedby": `${id}-error` }
        : {}

type InputProps = Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "value" | "onChange" | "id"
>

/** A one-line text input. */
export function TextField({
    label,
    labelAsPlaceholder,
    hint,
    error,
    value,
    onChange,
    ...input
}: FieldFrame &
    InputProps & { value: string; onChange: (value: string) => void }) {
    const id = useId()
    return (
        <Frame {...{ id, label, labelAsPlaceholder, hint, error }}>
            <input
                {...input}
                id={id}
                className="form-input"
                value={value}
                placeholder={labelAsPlaceholder ? label : input.placeholder}
                onChange={(event) => onChange(event.target.value)}
                {...describedBy(id, error)}
            />
        </Frame>
    )
}

type TextareaProps = Omit<
    TextareaHTMLAttributes<HTMLTextAreaElement>,
    "value" | "onChange" | "id"
>

/** A multi-line text input. */
export function TextAreaField({
    label,
    labelAsPlaceholder,
    hint,
    error,
    value,
    onChange,
    ...textarea
}: FieldFrame &
    TextareaProps & { value: string; onChange: (value: string) => void }) {
    const id = useId()
    return (
        <Frame {...{ id, label, labelAsPlaceholder, hint, error }}>
            <textarea
                {...textarea}
                id={id}
                className="form-input form-textarea"
                value={value}
                placeholder={labelAsPlaceholder ? label : textarea.placeholder}
                onChange={(event) => onChange(event.target.value)}
                {...describedBy(id, error)}
            />
        </Frame>
    )
}

type SelectProps = Omit<
    SelectHTMLAttributes<HTMLSelectElement>,
    "value" | "onChange" | "id"
>

/**
 * A native select (legacy's single antd Select). `placeholder` is the
 * empty first option, shown while no offered option is chosen.
 */
export function SelectField<T extends string>({
    label,
    labelAsPlaceholder,
    hint,
    error,
    value,
    onChange,
    options,
    placeholder,
    ...select
}: FieldFrame &
    SelectProps & {
        value: T | ""
        onChange: (value: T) => void
        options: readonly { value: T; label: string }[]
        placeholder?: string
    }) {
    const id = useId()
    // A value it doesn't offer (an old row's type) shows as nothing chosen,
    // not as whichever option the browser would fall back to; it stays the
    // value until another is picked.
    const chosen = options.some((option) => option.value === value)
    return (
        <Frame {...{ id, label, labelAsPlaceholder, hint, error }}>
            <select
                {...select}
                id={id}
                className={`form-input form-select${chosen ? "" : " empty"}`}
                value={chosen ? value : ""}
                onChange={(event) => onChange(event.target.value as T)}
                {...describedBy(id, error)}
            >
                {!chosen && (
                    <option value="" disabled>
                        {placeholder ?? (labelAsPlaceholder ? label : "")}
                    </option>
                )}
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </Frame>
    )
}

/**
 * Several values out of a short list, as toggle chips (legacy's antd
 * Select with `mode="tags"`): a group of checkboxes named by `label`.
 */
export function ChoiceChips({
    label,
    hint,
    options,
    selected,
    onChange,
}: {
    label: string
    hint?: ReactNode
    options: readonly { value: string; label: string }[]
    selected: readonly string[]
    onChange: (selected: string[]) => void
}) {
    return (
        <fieldset className="form-field choice-chips">
            <legend className="form-label">{label}</legend>
            {hint && <p className="form-hint">{hint}</p>}
            <div className="choice-chips-options">
                {options.map((option) => {
                    const checked = selected.includes(option.value)
                    return (
                        <label key={option.value} className="choice-chip">
                            <input
                                type="checkbox"
                                className="visually-hidden"
                                checked={checked}
                                onChange={() =>
                                    onChange(
                                        checked
                                            ? selected.filter(
                                                  (value) =>
                                                      value !== option.value,
                                              )
                                            : [...selected, option.value],
                                    )
                                }
                            />
                            {option.label}
                        </label>
                    )
                })}
            </div>
        </fieldset>
    )
}

/**
 * An on/off switch (legacy's antd Switch, with its words inside): a
 * checkbox with the switch role, named by `label`.
 */
export function Switch({
    label,
    checked,
    onChange,
    onText,
    offText,
    disabled,
}: {
    label: string
    checked: boolean
    onChange: (checked: boolean) => void
    onText: string
    offText: string
    disabled?: boolean
}) {
    const id = useId()
    return (
        <div className="switch-field">
            <label htmlFor={id} className="switch-label">
                {label}
            </label>
            <span className={`switch${checked ? " on" : ""}`}>
                <input
                    id={id}
                    type="checkbox"
                    role="switch"
                    className="switch-input"
                    checked={checked}
                    disabled={disabled}
                    onChange={(event) => onChange(event.target.checked)}
                />
                <span className="switch-text" aria-hidden="true">
                    {checked ? onText : offText}
                </span>
                <span className="switch-handle" aria-hidden="true" />
            </span>
        </div>
    )
}

/** Legacy's antd `Alert`: an error, a warning, a notice, or a success. */
export function FormAlert({
    kind,
    children,
}: {
    kind: "error" | "warning" | "info" | "success"
    children: ReactNode
}) {
    return (
        <p
            className={`form-alert form-alert-${kind}`}
            role={
                kind === "error"
                    ? "alert"
                    : kind === "success"
                      ? "status"
                      : undefined
            }
        >
            {children}
        </p>
    )
}
