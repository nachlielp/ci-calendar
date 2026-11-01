import { act, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { lazy, Suspense } from "react"
import { Outlet, type RouteObject } from "react-router"
import { describe, expect, it } from "vitest"
import { createTestTelemetry } from "../../test/fakeTelemetry"
import { renderApp } from "../../test/renderApp"
import { createMemoryStorage } from "../deviceStorage"
import { RouteError } from "../RootLayout"
import { useBlockReload } from "./reloadGuard"
import { isStaleChunkError } from "./staleChunks"

/** Chrome's error for a lazy file a deploy removed (now a 404). */
const goneChunk = () =>
    Promise.reject(
        new TypeError(
            "Failed to fetch dynamically imported module: https://www.ci-events.org/assets/AboutPage-old.js",
        ),
    )

/** A lazy page whose file is gone, under the app's route error page. */
const stalePage: RouteObject[] = [
    { path: "/", errorElement: <RouteError />, lazy: goneChunk },
]

/**
 * The error page has rendered and its effects (the reload decision) have
 * run: React runs them after the DOM shows the page, so a test checking
 * `reloads` right after the heading appears would race them.
 */
async function settledOn(name: string) {
    await screen.findByRole("heading", { name })
    await act(async () => {})
}

const newVersionNotice = () => settledOn("יש גרסה חדשה של האפליקציה")

describe("pages left open on an old version", () => {
    it("reload once onto the current version when a lazy file is gone", async () => {
        const { reloads } = renderApp({ routes: stalePage })

        await newVersionNotice()
        expect(reloads.count).toBe(1)
    })

    it("offer a reload button instead of reloading again when the file is still missing after a reload", async () => {
        const session = createMemoryStorage()
        const first = renderApp({ routes: stalePage, session })
        await newVersionNotice()
        expect(first.reloads.count).toBe(1)
        first.unmount()

        // The reloaded page fails the same way: no reload loop.
        const { reloads } = renderApp({ routes: stalePage, session })
        await newVersionNotice()
        expect(reloads.count).toBe(0)

        await userEvent.click(
            screen.getByRole("button", { name: "טעינה מחדש" }),
        )
        expect(reloads.count).toBe(1)
    })

    it("never reload over unsaved work; the visitor gets the button", async () => {
        function DraftForm() {
            useBlockReload(true)
            return <Outlet />
        }
        // A lazy part of the page (React.lazy) whose file is gone.
        const Panel = lazy(goneChunk)
        const { reloads } = renderApp({
            routes: [
                {
                    path: "/",
                    element: <DraftForm />,
                    children: [
                        {
                            index: true,
                            errorElement: <RouteError />,
                            element: (
                                <Suspense fallback={null}>
                                    <Panel />
                                </Suspense>
                            ),
                        },
                    ],
                },
            ],
        })

        await newVersionNotice()
        expect(reloads.count).toBe(0)
        expect(
            screen.getByRole("button", { name: "טעינה מחדש" }),
        ).toBeInTheDocument()
    })

    it("don't reload offline, where the reload would fail too", async () => {
        Object.defineProperty(navigator, "onLine", {
            configurable: true,
            value: false,
        })
        const { reloads } = renderApp({ routes: stalePage })

        await newVersionNotice()
        expect(reloads.count).toBe(0)
    })

    it("never reload, or report, when a file that isn't a page fails to load (an ad blocker stopping analytics)", async () => {
        const sinks = createTestTelemetry({
            blocked: ["posthog", "cloudflare-analytics"],
        })
        const { reloads } = renderApp({ telemetry: sinks.telemetry })

        await sinks.arrive()

        expect(sinks.loaded).toEqual([
            "sentry",
            "posthog",
            "cloudflare-analytics",
        ])
        expect(reloads.count).toBe(0)
        expect(sinks.errors).toEqual([])
        expect(
            screen.queryByRole("heading", {
                name: "יש גרסה חדשה של האפליקציה",
            }),
        ).not.toBeInTheDocument()
    })

    it("show the usual error, with no reload, for other failures", async () => {
        const { reloads } = renderApp({
            routes: [
                {
                    path: "/",
                    errorElement: <RouteError />,
                    lazy: () => Promise.reject(new Error("boom")),
                },
            ],
        })

        await settledOn("משהו השתבש")
        expect(reloads.count).toBe(0)
    })

    it("recognise every browser's message for a missing lazy file", () => {
        for (const message of [
            "Failed to fetch dynamically imported module: https://x/assets/a.js",
            "error loading dynamically imported module: https://x/assets/a.js",
            "Importing a module script failed.",
            "Unable to preload CSS for /assets/a.css",
        ]) {
            expect(isStaleChunkError(new TypeError(message)), message).toBe(
                true,
            )
        }
        expect(isStaleChunkError(new Error("boom"))).toBe(false)
        expect(isStaleChunkError(undefined)).toBe(false)
    })
})
