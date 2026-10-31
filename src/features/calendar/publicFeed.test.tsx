import { describe, expect, it } from "vitest"
import { createMemoryStorage } from "../../app/deviceStorage"
import { createFakeDataClient } from "../../test/fakeDataClient"
import { createFakeEdge, type EdgeAnswer } from "../../test/fakeEdge"
import { renderApp } from "../../test/renderApp"
import { event, eventTitles } from "../../test/testEvents"
import { testUser } from "../../test/testUsers"

// "Today" in these tests is Friday 2026-10-30 in Asia/Jerusalem.
const NOW = new Date("2026-10-30T09:00:00Z")

/**
 * The page's database and the edge's copy of it, seeded apart so a test can
 * tell where the events on screen came from.
 */
function backends() {
    const fake = createFakeDataClient({
        ci_events: [event({ title: "מהמסד" })],
    })
    const edgeBackend = createFakeDataClient({
        ci_events: [
            event({ title: "מהקצה" }),
            event({ title: "מוסתר בקצה", hide: true }),
        ],
    })
    const edge = createFakeEdge(edgeBackend, () => NOW)
    return { fake, edge }
}

const windowReads = (fake: ReturnType<typeof createFakeDataClient>) =>
    fake.requests.filter(
        (request) =>
            request.table === "ci_events" && request.method === "select",
    )

describe("the public window from the edge (publicFeed)", () => {
    it("boots from the edge with one request and none to Supabase", async () => {
        const { fake, edge } = backends()

        renderApp({ fake, edge, now: NOW })

        expect(await eventTitles()).toEqual(["מהקצה"])
        expect(edge.requests.map((request) => request.url)).toEqual([
            "/api/public-window",
        ])
        expect(fake.requests).toEqual([])
    })

    it("sends nothing of the visitor to the edge", async () => {
        const { fake, edge } = backends()

        renderApp({ fake, edge, now: NOW })

        expect(await eventTitles()).toEqual(["מהקצה"])
        expect(edge.requests).toEqual([
            {
                url: "/api/public-window",
                credentials: "omit",
                authorization: null,
            },
        ])
    })

    it("reads a signed-in visitor's window straight from Supabase, so their own saves show", async () => {
        // The edge's copy may predate a save of theirs (it is served up to
        // ten minutes old): it must never replace what they just changed.
        const { fake, edge } = backends()

        renderApp({ fake, edge, now: NOW, signedInAs: testUser("creator") })

        expect(await eventTitles()).toEqual(["מהמסד"])
        expect(edge.requests).toEqual([])
        expect(windowReads(fake)).toHaveLength(1)
    })

    it.each<[EdgeAnswer, string]>([
        ["spa-shell", "no Worker (Vercel serves the SPA shell)"],
        ["not-found", "a 404"],
        ["server-error", "an upstream failure (502)"],
        ["network-error", "no network"],
        ["not-a-window", "JSON that isn't a window"],
        ["hang", "no answer in time"],
    ])("falls back to one direct select on %s (%s)", async (answer) => {
        const { fake, edge } = backends()
        edge.answer(answer)

        renderApp({ fake, edge, now: NOW })

        expect(await eventTitles()).toEqual(["מהמסד"])
        expect(edge.requests).toHaveLength(1)
        expect(windowReads(fake)).toHaveLength(1)
    })

    it("keeps the window it read from the edge for the next visit", async () => {
        const storage = createMemoryStorage()
        const first = backends()
        const view = renderApp({ ...first, storage, now: NOW })
        await eventTitles()
        view.unmount()

        // Next visit: the edge and Supabase both stall; the stored window
        // renders anyway.
        const { fake, edge } = backends()
        edge.answer("hang")
        fake.holdTable("ci_events")
        renderApp({ fake, edge, storage, now: NOW })

        expect(await eventTitles()).toEqual(["מהקצה"])
    })
})
