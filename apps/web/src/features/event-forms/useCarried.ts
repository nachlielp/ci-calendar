import { useLayoutEffect, useRef } from "react"

/**
 * Fills a new event's (or template's) form with what the user had filled
 * in before switching between single-day and multi-day (`carried`, already
 * converted to this form's values), once, as it mounts. Called after
 * `useFormDraft`, so it goes over any draft restored then.
 */
export function useCarried<V>(
    restore: (values: V) => void,
    carried: V | undefined,
) {
    const done = useRef(false)
    useLayoutEffect(() => {
        if (done.current || !carried) return
        done.current = true
        restore(carried)
    }, [restore, carried])
}
