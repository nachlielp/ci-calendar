import type { AuthOptions } from "@ci-calendar/core/data/auth"

/**
 * What `createAuth` needs from the browser: the URL's fragment, where auth
 * redirects arrive; how to take it out of the URL and its history entry;
 * and the window, where other tabs' storage changes are heard.
 */
export function browserAuthOptions(): Pick<
    AuthOptions,
    "hash" | "clearHash" | "target"
> {
    return {
        hash: window.location.hash,
        clearHash: () =>
            history.replaceState(
                history.state,
                "",
                window.location.pathname + window.location.search,
            ),
        target: window,
    }
}
