import {
    useCallback,
    useEffect,
    useMemo,
    useReducer,
    useRef,
    useState,
    type FormEvent,
} from "react"
import {
    changedFields,
    formReducer,
    initialFormState,
    isValid,
    shownErrors,
    type FormErrors,
    type FormValues,
} from "../lib/form"
import { useBlockReload } from "./updates/reloadGuard"

/** What a form's save gets: the values, and the fields that changed. */
export interface Submission<V extends FormValues> {
    values: V
    changes: Partial<V>
    isDirty: boolean
}

export interface Form<V extends FormValues, E extends string> {
    values: V
    /** Sets one field (and marks it touched). */
    set: <K extends keyof V>(field: K, value: V[K]) => void
    /**
     * Changes one field from its current value, e.g. one item of a list:
     * `update("segments", (list) => replaceAt(list, 2, item), "segments.2.end")`.
     * `path` is what was touched (the field by default).
     */
    update: <K extends keyof V>(
        field: K,
        change: (value: V[K]) => V[K],
        path?: string,
    ) => void
    /** Marks a path touched without changing it (on blur). */
    touch: (path: string) => void
    /**
     * The errors to show now, by path: none of the form's own until a save
     * is attempted, then all of them; and the server's (`setErrors`).
     */
    errors: FormErrors<E>
    /** The fields that differ from `saved`: what a save sends. */
    changes: Partial<V>
    /** There are unsaved changes (reloads onto a new version wait). */
    isDirty: boolean
    /** A save from `handleSubmit` is running. */
    submitting: boolean
    /**
     * The form's submit handler: marks a save attempt (every error shows)
     * and, when the values are valid and no save is running, calls `save`
     * with the latest values and changes. `save` returns the save's promise
     * (`mutateAsync`), so the form knows when it ends; its failure is the
     * mutation's to show.
     */
    handleSubmit: (
        save: (submission: Submission<V>) => Promise<unknown> | void,
    ) => (event?: FormEvent) => void
    /** Loads a draft (e.g. kept on the device) as unsaved changes. */
    restore: (draft: V) => void
    /** Shows errors the server reported, by path, until each is edited. */
    setErrors: (errors: FormErrors<E>) => void
}

/**
 * An edit form's state (docs/architecture.md, "Forms"): controlled values
 * over `saved` (the server's, a query's data mapped to form values; a
 * constant for a new record), `validate`'s errors by path, what changed,
 * and whether there is unsaved work, which blocks reloads onto a new
 * version while it lasts. When `saved` changes (a save's response or a
 * refetch put in the cache), fields without unsaved edits take the new
 * values, as do fields still as the last save sent them; edits typed since
 * stay. Keep `saved` and `validate` stable (memoise `saved` on the query
 * data). Lists compare in order, unless their field is in `unordered`.
 */
export function useForm<V extends FormValues, E extends string = string>({
    saved,
    validate,
    unordered,
}: {
    saved: V
    validate?: (values: V) => FormErrors<E>
    unordered?: readonly (keyof V)[]
}): Form<V, E> {
    const [state, dispatch] = useReducer(formReducer<V>, saved, (values) =>
        initialFormState(values, unordered),
    )
    const latest = useRef({ state, validate })
    latest.current = { state, validate }

    useEffect(() => dispatch({ type: "saved", values: saved }), [saved])

    const changes = useMemo(() => changedFields(state, state.values), [state])
    const isDirty = Object.keys(changes).length > 0
    useBlockReload(isDirty)

    const errors = useMemo(
        () => shownErrors<E>(state, validate?.(state.values) ?? {}),
        [state, validate],
    )

    const [submitting, setSubmitting] = useState(false)
    const running = useRef(false)

    const handleSubmit = useCallback<Form<V, E>["handleSubmit"]>(
        (save) => (event) => {
            event?.preventDefault()
            if (running.current) return
            dispatch({ type: "submit" })
            const { state: current, validate: check } = latest.current
            if (!isValid(check?.(current.values) ?? {})) return
            const submitted = changedFields(current, current.values)
            running.current = true
            setSubmitting(true)
            dispatch({ type: "sending", values: current.values })
            void Promise.resolve()
                .then(() =>
                    save({
                        values: current.values,
                        changes: submitted,
                        isDirty: Object.keys(submitted).length > 0,
                    }),
                )
                .catch(() => dispatch({ type: "sendFailed" }))
                .finally(() => {
                    running.current = false
                    setSubmitting(false)
                })
        },
        [],
    )

    const set = useCallback(
        <K extends keyof V>(field: K, value: V[K]) =>
            dispatch({ type: "set", field, value }),
        [],
    )
    const update = useCallback(
        <K extends keyof V>(
            field: K,
            change: (value: V[K]) => V[K],
            path?: string,
        ) =>
            dispatch({
                type: "update",
                field,
                change: change as (value: never) => unknown,
                path,
            }),
        [],
    )
    const touch = useCallback(
        (path: string) => dispatch({ type: "touch", path }),
        [],
    )
    const restore = useCallback(
        (draft: V) => dispatch({ type: "restore", values: draft }),
        [],
    )
    const setErrors = useCallback(
        (serverErrors: FormErrors<E>) =>
            dispatch({ type: "serverErrors", errors: serverErrors }),
        [],
    )

    return {
        values: state.values,
        set,
        update,
        touch,
        errors,
        changes,
        isDirty,
        submitting,
        handleSubmit,
        restore,
        setErrors,
    }
}
