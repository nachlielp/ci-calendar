/** The `users.user_type` values legacy used. */
export type SignedInRole = "user" | "profile" | "creator" | "org" | "admin"

/** Who sees a menu item: signed out (`anonymous`) or a signed-in role. */
export type Role = "anonymous" | SignedInRole

/**
 * Who is looking at the app, as far as the header and menu care. While the
 * session is being restored the viewer is `unknown`, and nothing that
 * depends on the account (login, account pages) shows, so a signed-in user
 * never sees login flash.
 */
export type Viewer =
    | { role: "unknown" }
    | { role: "anonymous" }
    | {
          role: SignedInRole
          /** Signed in with email and password (legacy `provider === "email"`). */
          signsInWithEmail: boolean
          /** Ends the session (the menu's logout item). */
          signOut: () => Promise<void>
      }

export const ANONYMOUS: Viewer = { role: "anonymous" }

/**
 * The current viewer. There is no auth yet, so everyone is anonymous.
 *
 * Extension point (slice 9): return `unknown` until the stored session is
 * read, then the signed-in user's role from it and the small profile row
 * loaded at boot (or `anonymous`). The header and the menu take everything
 * else from the viewer.
 */
export function useViewer(): Viewer {
    return ANONYMOUS
}
