import { useCallback, useSyncExternalStore } from "react"
import { jerusalemToday } from "../lib/jerusalemDate"
import { useServices } from "./services"

/** How often an open page checks whether the day has changed. */
const CHECK_MS = 60 * 1000

/**
 * Today in Jerusalem (`YYYY-MM-DD`, from `services.now()`), re-read when the
 * page comes back (visible, focused) and every minute while it is open, so
 * whatever is derived from it (a query's `select` that drops passed days)
 * follows midnight. Re-renders only when the day changes.
 */
export function useToday(): string {
    const { now } = useServices()
    const read = useCallback(() => jerusalemToday(now()), [now])
    return useSyncExternalStore(subscribe, read)
}

function subscribe(onChange: () => void) {
    document.addEventListener("visibilitychange", onChange)
    window.addEventListener("focus", onChange)
    const timer = setInterval(onChange, CHECK_MS)
    return () => {
        document.removeEventListener("visibilitychange", onChange)
        window.removeEventListener("focus", onChange)
        clearInterval(timer)
    }
}
