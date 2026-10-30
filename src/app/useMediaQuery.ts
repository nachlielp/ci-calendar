import { useCallback, useSyncExternalStore } from "react"

/** Whether a CSS media query matches, kept current as it changes. */
export function useMediaQuery(query: string): boolean {
    const subscribe = useCallback(
        (onChange: () => void) => {
            const list = window.matchMedia?.(query)
            list?.addEventListener("change", onChange)
            return () => list?.removeEventListener("change", onChange)
        },
        [query],
    )
    return useSyncExternalStore(
        subscribe,
        () => window.matchMedia?.(query).matches ?? false,
    )
}

/** Phone widths: legacy's `ScreenSize.mobile`, the same 500px the dialogs use. */
export const PHONE_QUERY = "(max-width: 499px)"
