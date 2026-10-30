// The state of an edit form, as pure functions (`useForm` in app/useForm.ts
// runs them in a reducer). A form edits a copy of the saved values — what
// the server last returned — so it always knows which fields changed (what
// a save sends), whether there is unsaved work (the reload guard), and
// which fields the visitor has touched (where errors show).
//
// Errors and touched fields are keyed by path: a field's name, or a dotted
// path into a nested value (`segments.2.end`).

/** A form's values: one entry per field. */
export type FormValues = object

/** Per path, the key of its error copy; a path without one is valid. */
export type FormErrors<E extends string = string> = Readonly<
    Record<string, E | undefined>
>

export interface FormState<V extends FormValues> {
    /** The values as last saved (the server's), which `values` edits. */
    saved: V
    values: V
    /** Paths the visitor has changed (or left): their errors show. */
    touched: ReadonlySet<string>
    /** A save was attempted: every error shows. */
    submitted: boolean
    /**
     * The values the last save sent, until it fails or another save starts.
     * When the saved values come back, fields still as sent take the
     * server's version (it may have normalised them).
     */
    sent: V | null
    /** Errors the server reported, per path, until that path is edited. */
    serverErrors: FormErrors
    /** Fields whose lists compare in any order (`sameValue`'s `unordered`). */
    unordered: ReadonlySet<keyof V>
}

export type FormAction<V extends FormValues> =
    | { type: "set"; field: keyof V; value: unknown }
    | {
          type: "update"
          field: keyof V
          change: (value: never) => unknown
          /** The path the change touched (the field by default). */
          path?: string
      }
    /** The visitor left a field (or a nested one) without changing it. */
    | { type: "touch"; path: string }
    /** Loads a draft over the saved values: unsaved work again. */
    | { type: "restore"; values: V }
    /** A save was attempted (valid or not). */
    | { type: "submit" }
    /** A valid save started with these values. */
    | { type: "sending"; values: V }
    /** The save failed: the values stay unsaved. */
    | { type: "sendFailed" }
    /**
     * New saved values from the server (a save's response or a refetch put
     * in the cache). Fields without unsaved edits take them, and so do
     * fields still as the last save sent them; edits made since keep the
     * visitor's values, now compared against the new saved ones.
     */
    | { type: "saved"; values: V }
    | { type: "serverErrors"; errors: FormErrors }

export function initialFormState<V extends FormValues>(
    saved: V,
    unordered: readonly (keyof V)[] = [],
): FormState<V> {
    return {
        saved,
        values: saved,
        touched: new Set(),
        submitted: false,
        sent: null,
        serverErrors: {},
        unordered: new Set(unordered),
    }
}

/** `path` is `other`, inside it, or holds it. */
const overlaps = (path: string, other: string) =>
    path === other ||
    path.startsWith(`${other}.`) ||
    other.startsWith(`${path}.`)

/** Server errors without those the edit at `path` answers. */
function withoutErrorsAt(errors: FormErrors, path: string): FormErrors {
    const kept = Object.entries(errors).filter(
        ([errorPath]) => !overlaps(errorPath, path),
    )
    return kept.length === Object.keys(errors).length
        ? errors
        : Object.fromEntries(kept)
}

function edit<V extends FormValues>(
    state: FormState<V>,
    field: keyof V,
    value: unknown,
    path: string,
): FormState<V> {
    return {
        ...state,
        values: { ...state.values, [field]: value } as V,
        touched: new Set(state.touched).add(path),
        serverErrors: withoutErrorsAt(state.serverErrors, path),
    }
}

export function formReducer<V extends FormValues>(
    state: FormState<V>,
    action: FormAction<V>,
): FormState<V> {
    switch (action.type) {
        case "set":
            return edit(state, action.field, action.value, String(action.field))
        case "update":
            return edit(
                state,
                action.field,
                action.change(state.values[action.field] as never),
                action.path ?? String(action.field),
            )
        case "touch":
            return state.touched.has(action.path)
                ? state
                : { ...state, touched: new Set(state.touched).add(action.path) }
        case "restore":
            return {
                ...state,
                values: action.values,
                touched: new Set(
                    Object.keys(changedFields(state, action.values)),
                ),
                sent: null,
            }
        case "submit":
            return state.submitted ? state : { ...state, submitted: true }
        case "sending":
            return { ...state, sent: action.values }
        case "sendFailed":
            return state.sent ? { ...state, sent: null } : state
        case "saved": {
            if (action.values === state.saved) return state
            const { values, saved, sent, unordered } = state
            const merged = { ...values }
            for (const key of Object.keys(merged) as (keyof V)[]) {
                const field = unordered.has(key)
                if (
                    sameValue(values[key], saved[key], field) ||
                    (sent && sameValue(values[key], sent[key], field))
                ) {
                    merged[key] = action.values[key]
                }
            }
            const next = { ...state, saved: action.values, values: merged }
            return Object.keys(changedFields(next, merged)).length
                ? next
                : initialFormState(action.values, [...unordered])
        }
        case "serverErrors":
            return { ...state, serverErrors: action.errors }
    }
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" &&
    value !== null &&
    Object.getPrototypeOf(value) === Object.prototype

/** Structural equality for form values (JSON-like: lists and objects). */
export function deepEqual(a: unknown, b: unknown): boolean {
    if (Object.is(a, b)) return true
    if (Array.isArray(a) && Array.isArray(b)) {
        return (
            a.length === b.length &&
            a.every((item, index) => deepEqual(item, b[index]))
        )
    }
    if (isPlainObject(a) && isPlainObject(b)) {
        const keys = Object.keys(a)
        return (
            keys.length === Object.keys(b).length &&
            keys.every(
                (key) => Object.hasOwn(b, key) && deepEqual(a[key], b[key]),
            )
        )
    }
    return false
}

/**
 * Whether two field values are the same: deeply, lists in order. With
 * `unordered`, lists compare as multisets (a set of chosen options).
 */
export function sameValue(a: unknown, b: unknown, unordered = false): boolean {
    if (!unordered || !Array.isArray(a) || !Array.isArray(b)) {
        return deepEqual(a, b)
    }
    if (a.length !== b.length) return false
    const left = [...b]
    return a.every((item) => {
        const index = left.findIndex((other) => deepEqual(item, other))
        if (index === -1) return false
        left.splice(index, 1)
        return true
    })
}

/** The fields of `values` that differ from `state.saved`, with their values. */
export function changedFields<V extends FormValues>(
    { saved, unordered }: Pick<FormState<V>, "saved" | "unordered">,
    values: V,
): Partial<V> {
    const changes: Partial<V> = {}
    for (const key of Object.keys(values) as (keyof V)[]) {
        if (!sameValue(saved[key], values[key], unordered.has(key))) {
            changes[key] = values[key]
        }
    }
    return changes
}

/**
 * The errors to show: a path's error once it (or a path holding it) was
 * touched, or all after a save attempt; then the server's errors where
 * the form has none of its own.
 */
export function shownErrors<E extends string>(
    state: Pick<
        FormState<FormValues>,
        "submitted" | "touched" | "serverErrors"
    >,
    errors: FormErrors<E>,
): FormErrors<E> {
    const touched = [...state.touched]
    const shown: Record<string, E | undefined> = {}
    for (const [path, error] of Object.entries(errors)) {
        if (!error) continue
        if (
            state.submitted ||
            touched.some(
                (other) => path === other || path.startsWith(`${other}.`),
            )
        ) {
            shown[path] = error
        }
    }
    for (const [path, error] of Object.entries(state.serverErrors)) {
        if (error && !shown[path]) shown[path] = error as E
    }
    return shown
}

/** Whether `errors` has none. */
export const isValid = (errors: FormErrors) =>
    Object.values(errors).every((error) => !error)
