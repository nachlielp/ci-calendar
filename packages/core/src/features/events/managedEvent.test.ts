import { describe, expect, it } from "vitest"
import {
    EVENT_BIO_COLUMNS,
    PUBLIC_EVENT_COLUMNS,
} from "../calendar/publicEvent"
import { bio, event } from "../../testing/testEvents"
import {
    MANAGED_EVENT_COLUMNS,
    toManagedEvent,
    toPublicOnly,
    type ManagedEventRow,
} from "./managedEvent"

const columns = (select: string) =>
    select
        .replace(/ci_events_users_junction\(.*\)/, "")
        .split(",")
        .map((column) => column.trim())
        .filter(Boolean)

describe("managed events", () => {
    it("select every public column, the bios' included", () => {
        expect(columns(MANAGED_EVENT_COLUMNS)).toEqual(
            expect.arrayContaining(columns(PUBLIC_EVENT_COLUMNS)),
        )
        expect(PUBLIC_EVENT_COLUMNS).toContain(
            `public_bio(${EVENT_BIO_COLUMNS})`,
        )
        expect(MANAGED_EVENT_COLUMNS).toContain(
            `public_bio(${EVENT_BIO_COLUMNS}, show_profile, user_type)`,
        )
    })

    it("keep only public bios, as the public query does", () => {
        const shown = bio({ bio_name: "גלויה" })
        const row = {
            ...event({ hide: true, user_id: "me", recurring_ref_key: "" }),
            is_multi_day: null,
            ci_events_users_junction: [
                { public_bio: shown },
                { public_bio: bio({ show_profile: false }) },
                { public_bio: bio({ user_type: "admin" }) },
                // `user_type <> 'admin'` isn't true for null in SQL.
                { public_bio: bio({ user_type: null }) },
                { public_bio: bio({ bio_name: "" }) },
                { public_bio: null },
            ],
        } as unknown as ManagedEventRow

        const managed = toManagedEvent(row)!
        expect(managed.bios.map((b) => b.name)).toEqual(["גלויה"])
        expect(managed).toMatchObject({
            hidden: true,
            ownerId: "me",
            multiDay: false,
            recurringRefKey: null,
        })
        expect(Object.keys(toPublicOnly(managed)).sort()).toEqual(
            Object.keys(managed)
                .filter(
                    (key) =>
                        ![
                            "hidden",
                            "ownerId",
                            "multiDay",
                            "recurringRefKey",
                        ].includes(key),
                )
                .sort(),
        )
    })

    it("leave out rows without a start date", () => {
        const row = {
            ...event({ start_date: null }),
            ci_events_users_junction: [],
        } as unknown as ManagedEventRow
        expect(toManagedEvent(row)).toBeNull()
    })
})
