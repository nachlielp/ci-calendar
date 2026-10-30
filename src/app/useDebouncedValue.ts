import { useEffect, useState } from "react"

/**
 * `value` once it has stayed the same for `delay` ms (e.g. a search box's
 * text, so a server search goes out when the typing pauses, not per key).
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
    const [settled, setSettled] = useState(value)
    useEffect(() => {
        const timer = setTimeout(() => setSettled(value), delay)
        return () => clearTimeout(timer)
    }, [value, delay])
    return settled
}
