import { act, screen } from "@testing-library/react"
import { type RouteObject } from "react-router"
import { describe, expect, it } from "vitest"
import { createTestTelemetry } from "../../test/fakeTelemetry"
import { renderApp } from "../../test/renderApp"
import { createMemoryStorage } from "../deviceStorage"
import { RouteError } from "../RootLayout"
import { BUFFER_LIMIT } from "./telemetry"

const ORIGIN = window.location.origin

/** An uncaught error, as the browser reports it to the window. */
function throwUncaught(error: Error) {
    window.dispatchEvent(
        new ErrorEvent("error", { error, message: error.message }),
    )
}

/**
 * An error page has rendered and its effects (reload decision, report) have
 * run; React runs them after the DOM shows it.
 */
async function settledOn(name: string) {
    await screen.findByRole("heading", { name })
    await act(async () => {})
}

/** A promise rejected with nothing to catch it. */
function rejectUnhandled(reason: unknown) {
    window.dispatchEvent(
        Object.assign(new Event("unhandledrejection"), { reason }),
    )
}

/** A route whose page throws while rendering, under the app's error page. */
function crashingRoute(error: Error): RouteObject[] {
    return [
        {
            path: "/",
            errorElement: <RouteError />,
            Component: () => {
                throw error
            },
        },
    ]
}

/** Chrome's error for a lazy file a deploy removed (now a 404). */
const goneChunkError = () =>
    new TypeError(
        "Failed to fetch dynamically imported module: https://www.ci-events.org/assets/AboutPage-old.js",
    )

describe("crash reports", () => {
    it("report an error thrown at boot once Sentry has loaded", async () => {
        const sinks = createTestTelemetry()
        const bootError = new Error("boot failed")
        throwUncaught(bootError)

        renderApp({ telemetry: sinks.telemetry })
        rejectUnhandled("lost promise")
        expect(sinks.errors).toEqual([])

        await sinks.arrive()

        expect(sinks.errors).toEqual([
            {
                error: bootError,
                context: { source: "window", handled: false },
            },
            {
                error: "lost promise",
                context: { source: "rejection", handled: false },
            },
        ])
    })

    it("report an error that stops the app from ever rendering", async () => {
        const sinks = createTestTelemetry()
        const crash = new Error("main.tsx threw")
        throwUncaught(crash)

        // No AppRoot, no router: Sentry still loads after the first paint.
        await sinks.arrive()

        expect(sinks.errors.map(({ error }) => error)).toEqual([crash])
    })

    it("hand the router to Sentry's tracing once both exist", async () => {
        const sinks = createTestTelemetry()
        const { router } = renderApp({ telemetry: sinks.telemetry })
        expect(sinks.tracedRouters).toEqual([])

        await sinks.arrive()

        expect(sinks.tracedRouters).toEqual([router])
    })

    it("keep at most the buffer's worth of errors while Sentry loads", async () => {
        const sinks = createTestTelemetry()
        const errors = Array.from(
            { length: BUFFER_LIMIT + 10 },
            (_, n) => new Error(`error ${n}`),
        )
        errors.forEach(throwUncaught)

        await sinks.arrive()

        expect(sinks.errors.map(({ error }) => error)).toEqual(
            errors.slice(0, BUFFER_LIMIT),
        )
    })

    it("drop the buffer when Sentry can't load (blocked or offline)", async () => {
        const sinks = createTestTelemetry({ blocked: ["sentry"] })
        throwUncaught(new Error("lost"))
        const { reloads } = renderApp({ telemetry: sinks.telemetry })

        await sinks.arrive()

        expect(sinks.errors).toEqual([])
        expect(reloads.count).toBe(0)
    })

    it("report errors straight away once Sentry is loaded", async () => {
        const sinks = createTestTelemetry()
        renderApp({ telemetry: sinks.telemetry })
        await sinks.arrive()

        const late = new Error("late")
        throwUncaught(late)

        expect(sinks.errors.map(({ error }) => error)).toEqual([late])
    })

    it("report a page that crashes once, from the route's error page", async () => {
        const sinks = createTestTelemetry()
        const crash = new Error("page crashed")
        renderApp({ telemetry: sinks.telemetry, routes: crashingRoute(crash) })
        await settledOn("משהו השתבש")
        // The same error surfacing again (e.g. through the window) is not a
        // second report.
        throwUncaught(crash)

        await sinks.arrive()

        expect(sinks.errors).toEqual([
            { error: crash, context: { source: "route" } },
        ])
    })

    it("attach the signed-in user, and forget them on sign-out", async () => {
        const sinks = createTestTelemetry()
        renderApp({ telemetry: sinks.telemetry })
        sinks.telemetry.identify({ id: "u1", email: "a@b.c" })

        await sinks.arrive()
        expect(sinks.sentryUsers).toEqual([{ id: "u1", email: "a@b.c" }])
        expect(sinks.posthogCalls).toEqual(["identify u1"])

        sinks.telemetry.reset()
        expect(sinks.sentryUsers).toEqual([{ id: "u1", email: "a@b.c" }, null])
        expect(sinks.posthogCalls).toEqual(["identify u1", "reset"])
    })

    it("send nothing outside production builds", async () => {
        const sinks = createTestTelemetry({ production: false })
        const { router } = renderApp({ telemetry: sinks.telemetry })
        sinks.telemetry.captureError(new Error("dev error"), {
            source: "route",
        })
        sinks.telemetry.track("filter_used")
        await act(() => router.navigate("/about"))

        await sinks.arrive()

        expect(sinks.loaded).toEqual([])
        expect(sinks.errors).toEqual([])
        expect(sinks.pageViews).toEqual([])
        expect(sinks.events).toEqual([])
    })
})

describe("files a deploy removed", () => {
    const stalePage = (error: Error): RouteObject[] => [
        {
            path: "/",
            errorElement: <RouteError />,
            lazy: () => Promise.reject(error),
        },
    ]

    it("aren't reported when one reload recovers the page", async () => {
        const sinks = createTestTelemetry()
        const error = goneChunkError()
        const { reloads } = renderApp({
            telemetry: sinks.telemetry,
            routes: stalePage(error),
        })
        // Vite reports the failed import, then the route shows it.
        act(() => {
            window.dispatchEvent(
                Object.assign(new Event("vite:preloadError"), {
                    payload: error,
                }),
            )
        })
        await settledOn("יש גרסה חדשה של האפליקציה")

        await sinks.arrive()

        expect(reloads.count).toBe(1)
        expect(sinks.errors).toEqual([])
    })

    it("are reported once when the reload didn't help", async () => {
        const session = createMemoryStorage()
        const first = renderApp({
            routes: stalePage(goneChunkError()),
            session,
        })
        await settledOn("יש גרסה חדשה של האפליקציה")
        first.unmount()

        // The reloaded page fails the same way.
        const sinks = createTestTelemetry()
        const error = goneChunkError()
        const { reloads } = renderApp({
            telemetry: sinks.telemetry,
            routes: stalePage(error),
            session,
        })
        act(() => {
            window.dispatchEvent(
                Object.assign(new Event("vite:preloadError"), {
                    payload: error,
                }),
            )
        })
        await settledOn("יש גרסה חדשה של האפליקציה")

        await sinks.arrive()

        expect(reloads.count).toBe(0)
        expect(sinks.errors).toEqual([
            { error, context: { source: "stale-chunk" } },
        ])
    })
})

describe("analytics", () => {
    it("record one page view per page, including the first", async () => {
        const sinks = createTestTelemetry()
        const { router } = renderApp({ telemetry: sinks.telemetry })

        await sinks.arrive()
        expect(sinks.pageViews).toEqual([`${ORIGIN}/`])

        await act(() => router.navigate("/about"))
        await screen.findByRole("heading", { name: "אודות הפרוייקט" })

        expect(sinks.pageViews).toEqual([`${ORIGIN}/`, `${ORIGIN}/about`])
    })

    it("load Cloudflare Web Analytics after the first paint on the production site", async () => {
        const sinks = createTestTelemetry()
        renderApp({ telemetry: sinks.telemetry })

        await sinks.arrive()

        expect(sinks.loaded).toEqual(
            expect.arrayContaining(["posthog", "cloudflare-analytics"]),
        )
    })

    it("carry on without Cloudflare Web Analytics when it is blocked", async () => {
        const sinks = createTestTelemetry({ blocked: ["cloudflare-analytics"] })
        renderApp({ telemetry: sinks.telemetry })

        await sinks.arrive()

        expect(sinks.loaded).toContain("cloudflare-analytics")
        expect(sinks.pageViews).toEqual([`${ORIGIN}/`])
        expect(sinks.errors).toEqual([])
    })

    it("keep product events until PostHog loads", async () => {
        const sinks = createTestTelemetry()
        renderApp({ telemetry: sinks.telemetry })
        sinks.telemetry.track("filter_used", { type: "jam" })

        await sinks.arrive()

        expect(sinks.events).toEqual([
            { event: "filter_used", properties: { type: "jam" } },
        ])
    })

    it("never load for the team's own devices; crashes are still reported", async () => {
        const storage = createMemoryStorage()
        storage.setItem("isInternal", "true")
        const sinks = createTestTelemetry({ storage })
        const { router } = renderApp({ telemetry: sinks.telemetry, storage })
        sinks.telemetry.track("filter_used")
        await act(() => router.navigate("/about"))

        await sinks.arrive()

        expect(sinks.loaded).toEqual(["sentry"])
        expect(sinks.pageViews).toEqual([])
        expect(sinks.events).toEqual([])
    })

    it("stop at once when the device is marked internal after sign-in", async () => {
        const storage = createMemoryStorage()
        const sinks = createTestTelemetry({ storage })
        const { router } = renderApp({ telemetry: sinks.telemetry, storage })
        await sinks.arrive()

        sinks.telemetry.setInternal(true)
        await act(() => router.navigate("/about"))
        sinks.telemetry.track("filter_used")

        expect(storage.getItem("isInternal")).toBe("true")
        expect(sinks.posthogCalls).toEqual(["optOut"])
        expect(sinks.pageViews).toEqual([`${ORIGIN}/`])
        expect(sinks.events).toEqual([])
    })

    it("keep auth secrets out of page views", async () => {
        const sinks = createTestTelemetry()
        renderApp({
            telemetry: sinks.telemetry,
            path: "/about?code=pkce-secret&f=jam#access_token=jwt&refresh_token=r&type=recovery",
        })

        await sinks.arrive()

        expect(sinks.pageViews).toEqual([`${ORIGIN}/about?f=jam`])
    })

    it("never load on preview sites; crashes are still reported", async () => {
        const sinks = createTestTelemetry({ productionSite: false })
        renderApp({ telemetry: sinks.telemetry })

        await sinks.arrive()

        expect(sinks.loaded).toEqual(["sentry"])
        expect(sinks.pageViews).toEqual([])
    })
})
