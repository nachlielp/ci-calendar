import { onlineManager } from "@tanstack/react-query"
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

/** Pages (by their reload guard) already reloading onto the current version. */
const reloading = new WeakSet<ReloadGuard>()

/**
 * Reloads once to land on the current version's files, and says whether it
 * did (or this page already is). It doesn't when unsaved work blocks
 * reloads, when offline (the reload would fail too), or when it already
 * reloaded for this a minute ago (the files are missing for another reason;
 * no reload loop). The caller then reports the error and shows the visitor a
 * reload button instead. A recovered one is expected after a deploy and
 * isn't reported.
 */
export function reloadForStaleChunks(
    { session, reload, now }: Pick<AppServices, "session" | "reload" | "now">,
    guard: ReloadGuard,
): boolean {
    if (reloading.has(guard)) return true
    if (guard.isBlocked() || !onlineManager.isOnline()) return false
    const at = now().getTime()
    const last = Number(session.getItem(LAST_RELOAD_KEY))
    if (last && Math.abs(at - last) < RELOAD_AGAIN_AFTER_MS) return false
    session.setItem(LAST_RELOAD_KEY, String(at))
    reloading.add(guard)
    reload()
    return true
}
