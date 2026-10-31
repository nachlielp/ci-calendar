import { act } from "@testing-library/react"
import { onTestFinished } from "vitest"
import { createMemoryStorage, type DeviceStorage } from "../app/deviceStorage"
import {
    createTelemetry,
    type ErrorContext,
    type TelemetryUser,
} from "../app/telemetry/telemetry"

export interface TestTelemetryOptions {
    /** A production build (default) or dev. */
    production?: boolean
    /** On the production site (default) or a preview. */
    productionSite?: boolean
    /** Device storage, to mark the device internal (`isInternal`). */
    storage?: DeviceStorage
    /**
     * SDKs whose file fails to load (an ad blocker), as Vite reports it:
     * `vite:preloadError`, then a rejected import.
     */
    blocked?: ("sentry" | "posthog" | "speed-insights")[]
}

/**
 * The app's real telemetry (`createTelemetry`) with in-memory stand-ins for
 * Sentry, PostHog and Speed Insights: nothing leaves the test. The SDKs
 * "load" only when the test calls `arrive()`, so it can act before and
 * after. `loaded` lists which SDKs the app asked for at all.
 */
export function createTestTelemetry({
    production = true,
    productionSite = true,
    storage = createMemoryStorage(),
    blocked = [],
}: TestTelemetryOptions = {}) {
    const errors: { error: unknown; context: ErrorContext }[] = []
    const sentryUsers: (TelemetryUser | null)[] = []
    const pageViews: string[] = []
    const events: { event: string; properties?: object }[] = []
    const posthogCalls: string[] = []
    const speedRoutes: string[] = []
    const loaded: string[] = []
    const tracedRouters: unknown[] = []

    let release = () => {}
    const arrived = new Promise<void>((resolve) => {
        release = resolve
    })
    const load = async <T>(name: string, sink: T) => {
        loaded.push(name)
        await arrived
        if (blocked.includes(name as never)) {
            const error = new TypeError(
                `Failed to fetch dynamically imported module: ${window.location.origin}/assets/telemetry/${name}.js`,
            )
            window.dispatchEvent(
                Object.assign(new Event("vite:preloadError"), {
                    payload: error,
                }),
            )
            throw error
        }
        return sink
    }

    const telemetry = createTelemetry({
        production,
        productionSite,
        storage,
        // The page is idle at once; the SDKs wait for `arrive()`.
        whenIdle: (run) => {
            run()
            return () => {}
        },
        loadErrors: () =>
            load("sentry", {
                captureException: (error: unknown, context: ErrorContext) =>
                    errors.push({ error, context }),
                setUser: (user: TelemetryUser | null) => sentryUsers.push(user),
                traceRouter: (router: unknown) => tracedRouters.push(router),
            }),
        loadAnalytics: () =>
            load("posthog", {
                pageView: (url: string) => pageViews.push(url),
                track: (event: string, properties?: object) =>
                    events.push({ event, properties }),
                identify: (id: string) => posthogCalls.push(`identify ${id}`),
                reset: () => posthogCalls.push("reset"),
                optOut: () => posthogCalls.push("optOut"),
            }),
        loadSpeed: () =>
            load("speed-insights", {
                setRoute: (route: string) => speedRoutes.push(route),
                stop: () => speedRoutes.push("stopped"),
            }),
    })
    onTestFinished(() => telemetry.dispose())

    return {
        telemetry,
        errors,
        sentryUsers,
        pageViews,
        events,
        posthogCalls,
        speedRoutes,
        loaded,
        tracedRouters,
        /** The SDKs finish loading; resolves once they've been flushed. */
        async arrive() {
            await act(async () => {
                release()
                await arrived
                // Let each loader's `.then` run.
                await new Promise((resolve) => setTimeout(resolve, 0))
            })
        },
    }
}
