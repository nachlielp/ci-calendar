import { onlineManager } from "@tanstack/react-query"
import { useEffect } from "react"
import type { AppServices } from "../services"
import type { ReloadGuard } from "./reloadGuard"

/**
 * A page left open on an old version asks for one of its lazy files after a
 * deploy replaced them (another tab handed over to the new version, or the
 * page was never under the service worker): the server answers 404, and the
 * import fails. These are the browsers' messages for that (Chrome, Firefox,
 * Safari, and Vite's CSS preload).
 */
const STALE_CHUNK_MESSAGE =
    /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Unable to preload CSS/i

export function isStaleChunkError(error: unknown): boolean {
    const message =
        error instanceof Error
            ? error.message
            : typeof error === "string"
              ? error
              : ""
    return STALE_CHUNK_MESSAGE.test(message)
}

/** `services.session` key: when the last such reload happened. */
const LAST_RELOAD_KEY = "staleChunkReloadAt"
/** A failure again within this long after a reload isn't a stale page. */
const RELOAD_AGAIN_AFTER_MS = 60 * 1000

/**
 * Reloads once to land on the current version's files, and says whether it
 * did. It doesn't when unsaved work blocks reloads, when offline (the reload
 * would fail too), or when it already reloaded for this a minute ago (the
 * files are missing for another reason; no reload loop). The caller then
 * shows the visitor a reload button instead.
 */
export function reloadForStaleChunks(
    { session, reload, now }: Pick<AppServices, "session" | "reload" | "now">,
    guard: ReloadGuard,
): boolean {
    if (guard.isBlocked() || !onlineManager.isOnline()) return false
    const at = now().getTime()
    const last = Number(session.getItem(LAST_RELOAD_KEY))
    if (last && Math.abs(at - last) < RELOAD_AGAIN_AFTER_MS) return false
    session.setItem(LAST_RELOAD_KEY, String(at))
    reload()
    return true
}

/**
 * Recovers from a lazy file that fails to load (Vite's `vite:preloadError`,
 * fired for every failed dynamic import) by reloading once, as above. The
 * error still reaches the route's `RouteError`, which offers a reload button
 * when this didn't reload.
 */
export function useStaleChunkRecovery(
    services: Pick<AppServices, "session" | "reload" | "now">,
    guard: ReloadGuard,
) {
    const { session, reload, now } = services
    useEffect(() => {
        const onPreloadError = () => {
            reloadForStaleChunks({ session, reload, now }, guard)
        }
        window.addEventListener("vite:preloadError", onPreloadError)
        return () =>
            window.removeEventListener("vite:preloadError", onPreloadError)
    }, [session, reload, now, guard])
}
