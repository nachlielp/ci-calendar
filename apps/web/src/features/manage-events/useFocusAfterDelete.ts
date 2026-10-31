import { useCallback, useEffect, useRef, useState } from "react"

/**
 * Focus after a delete: the deleted event's row (where focus was) is gone,
 * so focus moves to the page's heading (`heading`, with `tabIndex={-1}`)
 * once the list has re-rendered without it. Pass `onDeleted` to the
 * actions.
 */
export function useFocusAfterDelete() {
    const heading = useRef<HTMLHeadingElement>(null)
    const [deleted, setDeleted] = useState(false)
    useEffect(() => {
        if (!deleted) return
        heading.current?.focus()
        setDeleted(false)
    }, [deleted])
    const onDeleted = useCallback(() => setDeleted(true), [])
    return { heading, onDeleted }
}
