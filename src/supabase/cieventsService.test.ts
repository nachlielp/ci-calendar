import { describe, it, expect, vi, beforeEach } from "vitest"

// Drive the service through the single seam — a fake Supabase client. Unlike a
// canned-response fake, this one is *filter-aware*: it records every `.eq()`
// predicate and, when the query is awaited, applies the top-level ones to the
// seeded rows. That lets a test prove the security property end to end at the
// data layer: hidden rows seeded in the "database" must not come back out of
// the default (anonymous) query — exactly what the anonymous store consumes.
//
// Nested/dotted predicate paths (e.g. the `public_bio.show_profile` join
// filter) are recorded but not applied, since the seeded rows are flat.
const state = vi.hoisted(() => ({
    rows: [] as Array<Record<string, unknown>>,
    eqCalls: [] as Array<{ column: string; value: unknown }>,
}))

// `cieventsService` → `utilService` → `store`, and the store's field
// initializers self-run on import. Bridge that coupling here (as the util
// tests do) so the test drives the data layer, not the whole app graph. This
// goes away with the store factory (#27).
vi.mock("../Store/store", () => ({ store: {} }))
vi.mock("../App", () => ({ CACHE_VERSION: "test" }))

vi.mock("./client", () => {
    const makeBuilder = () => {
        const eqPredicates: Array<{ column: string; value: unknown }> = []
        const builder: Record<string, unknown> = {}
        const passthrough = () => builder
        for (const method of [
            "select",
            "gte",
            "lte",
            "in",
            "order",
            "single",
        ]) {
            builder[method] = passthrough
        }
        builder.eq = (column: string, value: unknown) => {
            state.eqCalls.push({ column, value })
            eqPredicates.push({ column, value })
            return builder
        }
        builder.then = (resolve: (r: unknown) => void) => {
            const data = state.rows.filter((row) =>
                eqPredicates.every(({ column, value }) => {
                    // Only apply flat, top-level predicates; ignore join paths.
                    if (column.includes(".")) return true
                    if (!(column in row)) return true
                    return row[column] === value
                }),
            )
            return resolve({ data, error: null })
        }
        return builder
    }
    const supabase = { from: () => makeBuilder() }
    return { supabase, createSupabaseClient: () => supabase }
})

import { cieventsService } from "./cieventsService"

beforeEach(() => {
    state.rows = []
    state.eqCalls = []
})

// `getCIEvents` mutates each row (`delete event.ci_events_users_junction`), so
// hand it fresh objects every time rather than shared constants.
const visibleAndHidden = () => [
    { id: "visible-1", hide: false, ci_events_users_junction: [] },
    { id: "hidden-1", hide: true, ci_events_users_junction: [] },
]

describe("cieventsService.getCIEvents visibility", () => {
    it("hidden rows in → only visible events out (anonymous default)", async () => {
        state.rows = visibleAndHidden()

        const events = await cieventsService.getCIEvents()

        expect(events.map((e) => e.id)).toEqual(["visible-1"])
    })

    it("filters hide=false server-side by default", async () => {
        state.rows = visibleAndHidden()

        await cieventsService.getCIEvents()

        expect(state.eqCalls).toContainEqual({ column: "hide", value: false })
    })

    it("returns hidden events when a caller opts in with show_hidden", async () => {
        state.rows = visibleAndHidden()

        const events = await cieventsService.getCIEvents({ show_hidden: true })

        expect(events.map((e) => e.id).sort()).toEqual([
            "hidden-1",
            "visible-1",
        ])
        expect(state.eqCalls).not.toContainEqual({
            column: "hide",
            value: false,
        })
    })
})
