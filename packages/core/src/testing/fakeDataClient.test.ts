import { describe, expect, it } from "vitest"
import { rowsAfter } from "../lib/keyset"
import { createFakeDataClient } from "./fakeDataClient"

// The fake stands in for PostgREST in both apps' tests, so its filters must
// answer as the real one does: these pin the behaviour the queries rely on.

type Row = Record<string, unknown>

const rows = (...items: Row[]) => items

const events = () =>
    rows(
        { id: "a", title: "Jam", hide: false, start_date: "2026-11-01" },
        { id: "b", title: "Class", hide: true, start_date: "2026-11-02" },
        { id: "c", title: "jam night", hide: false, start_date: "2026-11-03" },
        { id: "d", title: "Workshop", hide: false, start_date: "2026-11-03" },
    )

const read = async (query: PromiseLike<{ data: unknown; error: unknown }>) => {
    const { data, error } = await query
    expect(error).toBeNull()
    return data as Row[]
}

const ids = (data: Row[]) => data.map(({ id }) => id)

describe("the fake data client's filters", () => {
    it("applies eq, neq, the comparisons and in", async () => {
        const { client } = createFakeDataClient({ ci_events: events() })
        const from = () => client.from("ci_events").select("id")

        expect(ids(await read(from().eq("hide", false)))).toEqual([
            "a",
            "c",
            "d",
        ])
        expect(ids(await read(from().neq("id", "a")))).toEqual(["b", "c", "d"])
        expect(
            ids(
                await read(
                    from()
                        .gte("start_date", "2026-11-02")
                        .lt("start_date", "2026-11-03"),
                ),
            ),
        ).toEqual(["b"])
        expect(ids(await read(from().in("id", ["d", "a"])))).toEqual(["a", "d"])
    })

    it("matches ilike's * wildcard without regard to case", async () => {
        const { client } = createFakeDataClient({ ci_events: events() })

        const data = await read(
            client.from("ci_events").select("id").ilike("title", "*jam*"),
        )

        expect(ids(data)).toEqual(["a", "c"])
    })

    it("orders, then pages with range and limit", async () => {
        const { client } = createFakeDataClient({ ci_events: events() })
        const ordered = () =>
            client
                .from("ci_events")
                .select("id")
                .order("start_date", { ascending: false })
                .order("id", { ascending: false })

        expect(ids(await read(ordered()))).toEqual(["d", "c", "b", "a"])
        expect(ids(await read(ordered().range(1, 2)))).toEqual(["c", "b"])
        expect(ids(await read(ordered().limit(1)))).toEqual(["d"])
    })

    it("takes a keyset page's logic tree in or()", async () => {
        const { client } = createFakeDataClient({ ci_events: events() })

        const data = await read(
            client
                .from("ci_events")
                .select("id")
                .or(rowsAfter("start_date", "ascending", "2026-11-02", "b"))
                .order("start_date")
                .order("id"),
        )

        expect(ids(data)).toEqual(["c", "d"])
    })

    it("returns only the selected columns", async () => {
        const { client } = createFakeDataClient({ ci_events: events() })

        const data = await read(
            client.from("ci_events").select("id, title").eq("id", "a"),
        )

        expect(data).toEqual([{ id: "a", title: "Jam" }])
    })

    it("counts the filtered rows, before paging", async () => {
        const { client } = createFakeDataClient({ ci_events: events() })

        const { count, data } = await client
            .from("ci_events")
            .select("id", { count: "exact", head: true })
            .eq("hide", false)
            .limit(1)

        expect(count).toBe(3)
        expect(data).toBeNull()
    })

    it("answers single() with one row, or an error for none", async () => {
        const { client } = createFakeDataClient({ ci_events: events() })
        const one = (id: string) =>
            client.from("ci_events").select("id").eq("id", id)

        expect((await one("a").single()).data).toEqual({ id: "a" })
        expect((await one("z").maybeSingle()).data).toBeNull()
        const missing = await one("z").single()
        expect(missing.error?.code).toBe("PGRST116")
    })

    it("fails a table on demand, with or without an answer", async () => {
        const fake = createFakeDataClient({ ci_events: events() })
        const query = () => fake.client.from("ci_events").select("id")

        fake.failTable("ci_events", "boom")
        const failed = await query()
        expect(failed.error?.message).toBe("boom")
        expect(failed.status).toBeGreaterThan(0)

        fake.failTable("ci_events", "offline", { network: true })
        expect((await query()).status).toBe(0)

        fake.healTable("ci_events")
        expect((await query()).error).toBeNull()
    })

    it("records each request with its filters", async () => {
        const fake = createFakeDataClient({ ci_events: events() })

        await fake.client.from("ci_events").select("id").eq("hide", false)

        expect(fake.requests).toHaveLength(1)
        expect(fake.requests[0]).toMatchObject({
            table: "ci_events",
            select: "id",
        })
    })
})
