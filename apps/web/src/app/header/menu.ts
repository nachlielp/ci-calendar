import type { ReactNode } from "react"
import { AccountIcon } from "../../ui/icons/AccountIcon"
import { CalendarAddOnIcon } from "../../ui/icons/CalendarAddOnIcon"
import { CalendarIcon } from "../../ui/icons/CalendarIcon"
import { GroupIcon } from "../../ui/icons/GroupIcon"
import { HomeIcon } from "../../ui/icons/HomeIcon"
import { InfoIcon } from "../../ui/icons/InfoIcon"
import { LockResetIcon } from "../../ui/icons/LockResetIcon"
import { LogoutIcon } from "../../ui/icons/LogoutIcon"
import { SupportAgentIcon } from "../../ui/icons/SupportAgentIcon"
import { VerifiedUserIcon } from "../../ui/icons/VerifiedUserIcon"
import type { Viewer } from "../viewer"
import type { Role } from "@ci-calendar/core/app/auth/roles"

export type MenuItemKey =
    | "home"
    | "myEvents"
    | "createEvents"
    | "manageAllEvents"
    | "manageUsers"
    | "profile"
    | "requestRole"
    | "manageSupport"
    | "resetPassword"
    | "about"
    | "logout"

interface MenuItemBase {
    key: MenuItemKey
    Icon: (props: { className?: string }) => ReactNode
    /** The roles that see the item. */
    roles: readonly Role[]
    /** Shown only to accounts that sign in with email and password. */
    emailOnly?: true
}

/** An item that opens a page. */
export interface MenuLink extends MenuItemBase {
    to: string
}

/** An item that does something instead: the viewer's `signOut`. */
export interface MenuAction extends MenuItemBase {
    action: "signOut"
}

export type MenuItem = MenuLink | MenuAction

const EVERYONE: readonly Role[] = [
    "anonymous",
    "user",
    "profile",
    "creator",
    "org",
    "admin",
]
const SIGNED_IN: readonly Role[] = [
    "user",
    "profile",
    "creator",
    "org",
    "admin",
]
const CREATORS: readonly Role[] = ["creator", "org", "admin"]
const PROFILES: readonly Role[] = ["profile", "creator", "org", "admin"]
const ADMINS: readonly Role[] = ["admin"]

/**
 * Legacy MenuDrawer's items, in its order, with the roles it showed each to.
 * Pages that later slices build are listed already; only signed-in roles
 * see them, so nobody reaches them before their slice lands.
 */
export const MENU_ITEMS: readonly MenuItem[] = [
    { key: "home", to: "/", Icon: HomeIcon, roles: EVERYONE },
    {
        key: "myEvents",
        to: "/manage-events",
        Icon: CalendarIcon,
        roles: CREATORS,
    },
    {
        key: "createEvents",
        to: "/create-events",
        Icon: CalendarAddOnIcon,
        roles: CREATORS,
    },
    {
        key: "manageAllEvents",
        to: "/manage-all-events",
        Icon: CalendarAddOnIcon,
        roles: ADMINS,
    },
    {
        key: "manageUsers",
        to: "/manage-users",
        Icon: GroupIcon,
        roles: ADMINS,
    },
    { key: "profile", to: "/bio", Icon: AccountIcon, roles: PROFILES },
    {
        key: "requestRole",
        to: "/request",
        Icon: VerifiedUserIcon,
        roles: ["user"],
    },
    {
        key: "manageSupport",
        to: "/manage-support",
        Icon: SupportAgentIcon,
        roles: ADMINS,
    },
    {
        key: "resetPassword",
        to: "/reset-password",
        Icon: LockResetIcon,
        roles: SIGNED_IN,
        emailOnly: true,
    },
    { key: "about", to: "/about", Icon: InfoIcon, roles: EVERYONE },
    { key: "logout", action: "signOut", Icon: LogoutIcon, roles: SIGNED_IN },
]

/** The menu items `viewer` sees, in menu order. */
export function menuFor(viewer: Viewer): MenuItem[] {
    return MENU_ITEMS.filter((item) => {
        // Before the session is known, only what everyone sees; signed in
        // without a profile, that and sign-out.
        if (viewer.role === "unknown") return item.roles === EVERYONE
        if (viewer.role === "unavailable") {
            return item.roles === EVERYONE || item.key === "logout"
        }
        if (!item.roles.includes(viewer.role)) return false
        return (
            !item.emailOnly ||
            ("signsInWithEmail" in viewer && viewer.signsInWithEmail)
        )
    })
}
