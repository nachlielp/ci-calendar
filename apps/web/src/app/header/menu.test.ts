import { describe, expect, it } from "vitest"
import { menuFor } from "./menu"
import { ANONYMOUS } from "../viewer"
import { type SignedInRole } from "@ci-calendar/core/app/auth/roles"

const signOut = async () => {}
const keys = (role: SignedInRole, signsInWithEmail = false) =>
    menuFor({ role, name: "Dana", signsInWithEmail, signOut }).map(
        (item) => item.key,
    )

// Legacy MenuDrawer's items per user type.
describe("menuFor", () => {
    it("offers a signed-out visitor the calendar and the about page", () => {
        expect(menuFor(ANONYMOUS).map((item) => item.key)).toEqual([
            "home",
            "about",
        ])
    })

    it("offers only what everyone sees while the session is unknown", () => {
        expect(menuFor({ role: "unknown" }).map((item) => item.key)).toEqual([
            "home",
            "about",
        ])
    })

    it("offers sign-out when the profile can't load", () => {
        expect(
            menuFor({ role: "unavailable", signOut, retry: () => {} }).map(
                (item) => item.key,
            ),
        ).toEqual(["home", "about", "logout"])
    })

    it("offers a plain user the role request and sign-out", () => {
        expect(keys("user")).toEqual(["home", "requestRole", "about", "logout"])
    })

    it("offers a teacher their bio", () => {
        expect(keys("profile")).toEqual(["home", "profile", "about", "logout"])
    })

    it("offers creators and orgs their events and the event forms", () => {
        const creator = ["home", "myEvents", "createEvents", "profile"]
        expect(keys("creator")).toEqual([...creator, "about", "logout"])
        expect(keys("org")).toEqual([...creator, "about", "logout"])
    })

    it("offers an admin everything", () => {
        expect(keys("admin", true)).toEqual([
            "home",
            "myEvents",
            "createEvents",
            "manageAllEvents",
            "manageUsers",
            "profile",
            "manageSupport",
            "resetPassword",
            "about",
            "logout",
        ])
    })

    it("offers a password reset only to email-and-password accounts", () => {
        expect(keys("user", true)).toContain("resetPassword")
        expect(keys("user", false)).not.toContain("resetPassword")
    })
})
