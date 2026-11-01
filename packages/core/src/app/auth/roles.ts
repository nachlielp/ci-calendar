/** A signed-in user's role (`users.user_type`, granted in `user_roles`). */
export type SignedInRole = "user" | "profile" | "creator" | "org" | "admin"

/** Who sees a menu item: signed out (`anonymous`) or a signed-in role. */
export type Role = "anonymous" | SignedInRole
