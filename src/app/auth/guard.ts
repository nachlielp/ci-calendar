import { createElement } from "react"
import type { RouteObject } from "react-router"
import type { SignedInRole } from "../viewer"
import { RequireRole } from "./RequireRole"

/**
 * A pathless route that guards `children` (route objects, usually lazy
 * pages) by role, for `routes.tsx`:
 *
 * ```ts
 * requireRole(CREATOR_ROLES, [
 *     { path: "manage-events", lazy: lazyPage(() => import("…")) },
 * ])
 * ```
 */
export function requireRole(
    roles: readonly SignedInRole[],
    children: RouteObject[],
): RouteObject {
    return { element: createElement(RequireRole, { roles }), children }
}

/** Legacy's role groups for its guarded routes. */
export const SIGNED_IN_ROLES: readonly SignedInRole[] = [
    "user",
    "profile",
    "creator",
    "org",
    "admin",
]
/** Bio pages. */
export const PROFILE_ROLES: readonly SignedInRole[] = [
    "profile",
    "creator",
    "org",
    "admin",
]
/** Event management and forms. */
export const CREATOR_ROLES: readonly SignedInRole[] = [
    "creator",
    "org",
    "admin",
]
/** Admin pages. */
export const ADMIN_ROLES: readonly SignedInRole[] = ["admin"]
