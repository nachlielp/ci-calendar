import type { UIMatch } from "react-router"

/** What a route tells the shell about itself (its `handle` in routes.tsx). */
export interface RouteHandle {
    /**
     * A signed-out visitor gets the header's home button here (legacy: the
     * auth and text pages). Slice 9 sets it on its login, signup and
     * password-reset routes.
     */
    homeButton?: true
}

/** Whether any matched route sets `flag` in its handle. */
export function routeFlag(matches: UIMatch[], flag: keyof RouteHandle) {
    return matches.some(
        (match) => (match.handle as RouteHandle | undefined)?.[flag],
    )
}
