import { onlineManager } from "@tanstack/react-query"
import { useSyncExternalStore } from "react"

/** Whether the device is online, as the query cache sees it. */
export function useIsOnline(): boolean {
    return useSyncExternalStore(
        (onChange) => onlineManager.subscribe(onChange),
        () => onlineManager.isOnline(),
    )
}
