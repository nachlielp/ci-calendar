import { useEffect } from "react"
import type { AppServices } from "../services"
import type { ReloadGuard } from "./reloadGuard"

/**
 * Moves the visitor onto a new version of the app at a safe moment. Once
 * `services.updates` reports a new version, the page hands over to it when
 * the visitor leaves (the page goes to the background) and reloads onto it
 * the moment they return, before they can touch anything. Never while the
 * page stays visible, and never while the reload guard is blocked (unsaved
 * work); then it waits for a later leave and return. If the new version
 * arrives while the visitor is away, the handover and reload both happen on
 * return. The reload goes through `services.reload`.
 */
export function useSafeUpdates(
    { updates, reload }: Pick<AppServices, "updates" | "reload">,
    guard: ReloadGuard,
) {
    useEffect(() => {
        let activate: (() => Promise<void>) | undefined
        let handover: Promise<void> | undefined
        let reloading = false

        // Once only; a failed handover still ends in the reload, as the next
        // load gets the newest files the network or cache has.
        const handOver = (ready: () => Promise<void>) =>
            (handover ??= ready().catch(() => {}))

        const onVisibilityChange = () => {
            if (!activate || reloading || guard.isBlocked()) return
            if (document.visibilityState === "hidden") {
                void handOver(activate)
                return
            }
            reloading = true
            void handOver(activate).then(reload)
        }

        const stopWatching = updates.watch((ready) => {
            activate = ready
        })
        document.addEventListener("visibilitychange", onVisibilityChange)
        return () => {
            stopWatching()
            document.removeEventListener("visibilitychange", onVisibilityChange)
        }
    }, [updates, reload, guard])
}
