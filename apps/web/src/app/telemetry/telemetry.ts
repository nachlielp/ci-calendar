import type { DataRouter, RouterState } from "react-router"
import type { DeviceStorage } from "../deviceStorage"
import { scrubUrl } from "./scrubUrl"

/**
 * Crash reports (Sentry), product analytics (PostHog) and real-user speed
 * (Cloudflare Web Analytics, where the build has its token), behind one
 * small boundary on `AppServices`. The app only ever talks to this; the vendors' SDKs are sinks loaded after the
 * first paint, so none of them is in `/`'s initial JS. Until a sink loads,
 * what it should receive is buffered; when it may not run at all (dev,
 * tests, internal devices, preview sites), nothing is kept or sent. A sink
 * that fails to load (an ad blocker, no network) is silently left out.
 */
export interface Telemetry {
    /**
     * Reports an error to Sentry, now or once the SDK loads. Each Error
     * object is reported once, however many places catch it.
     */
    captureError(error: unknown, context: ErrorContext): void
    /** Records a product event in PostHog. */
    track(event: string, properties?: Record<string, unknown>): void
    /**
     * The signed-in user (slice 9 calls it once the session is known):
     * Sentry gets `{ id, email }`, as legacy's `setUser`; PostHog gets
     * `identify(id)`, which joins this device's anonymous visitor to the
     * account (legacy kept PostHog's own anonymous id: its `reset()` ran
     * before `init` and was a no-op, and it identified the visitor with
     * that same id, which merges nothing and leaves it anonymous).
     */
    identify(user: TelemetryUser): void
    /** Sign-out: forget the user in Sentry and start a new PostHog visitor. */
    reset(): void
    /**
     * Saves legacy's `isInternal` device flag (`users.is_internal`, slice 9
     * after the profile loads). Marking the device internal stops PostHog at
     * once; unmarking it takes effect from the next
     * page load.
     */
    setInternal(internal: boolean): void
    /**
     * Records a page view per location, loads PostHog and Cloudflare Web
     * Analytics after the first paint, and hands the router to Sentry's tracing.
     * `AppRoot` calls it with the app's router. Returns a function that
     * stops following the router.
     */
    start(router: DataRouter): () => void
    /** Removes the window listeners (tests). */
    dispose(): void
}

export interface TelemetryUser {
    id: string
    email?: string
}

export interface ErrorContext {
    /**
     * Where it was caught, a Sentry tag: `window`, `rejection`, `route`,
     * `stale-chunk`, or a feature's own name.
     */
    source: string
    /** False for errors nothing handled (window, unhandled rejection). */
    handled?: boolean
}

/** Sentry, once loaded (`./sentry.ts`). */
export interface ErrorSink {
    captureException(error: unknown, context: ErrorContext): void
    setUser(user: TelemetryUser | null): void
    /** Starts tracing page loads and navigations of the app's router. */
    traceRouter(router: DataRouter): void
}

/** PostHog, once loaded (`./posthog.ts`). */
export interface AnalyticsSink {
    pageView(url: string): void
    track(event: string, properties?: Record<string, unknown>): void
    identify(userId: string): void
    reset(): void
    /** Stops all capture (autocapture included) on an internal device. */
    optOut(): void
}

export interface TelemetryOptions {
    /** A production build. Dev and tests send nothing. */
    production: boolean
    /**
     * The production site (`ci-events.org`). Analytics runs only there; previews still report errors.
     */
    productionSite: boolean
    /** Device storage: legacy's `isInternal` marks the team's devices. */
    storage: DeviceStorage
    /** Loads Sentry. Unset when there is no DSN. */
    loadErrors?: () => Promise<ErrorSink>
    /** Loads PostHog. Unset when there is no key. */
    loadAnalytics?: () => Promise<AnalyticsSink>
    /**
     * Loads Cloudflare Web Analytics (./cloudflareAnalytics.ts), with
     * PostHog's rules. Unset when there is no token. It follows the page
     * by itself and can't be stopped once loaded.
     */
    loadWebAnalytics?: () => Promise<unknown>
    /** Runs `run` after the first paint, when the page is idle. */
    whenIdle: (run: () => void) => () => void
    /** Where uncaught errors surface; `window`. */
    target?: Window
}

/** At most this many errors, and analytics calls, wait for their SDK. */
export const BUFFER_LIMIT = 50

/** Legacy's device flag (`users.is_internal`, saved at sign-in). */
export const INTERNAL_KEY = "isInternal"

export function isInternalDevice(storage: DeviceStorage): boolean {
    try {
        return storage.getItem(INTERNAL_KEY) === "true"
    } catch {
        return false
    }
}

/** Sends nothing: tests that don't look at telemetry. */
export const NO_TELEMETRY: Telemetry = {
    captureError: () => {},
    track: () => {},
    identify: () => {},
    reset: () => {},
    setInternal: () => {},
    start: () => () => {},
    dispose: () => {},
}

export function createTelemetry(options: TelemetryOptions): Telemetry {
    const { production, storage, whenIdle, target = window } = options
    const { loadAnalytics, loadWebAnalytics } = options
    const loadErrors = production ? options.loadErrors : undefined

    // Errors: buffered from boot until Sentry loads.
    let errorSink: ErrorSink | undefined
    let pendingErrors: [unknown, ErrorContext][] = []
    let user: TelemetryUser | null = null
    let router: DataRouter | undefined
    const reported = new WeakSet<object>()

    // Analytics: decided at start, and turned off if the device is marked
    // internal later.
    let analyticsOn: boolean | undefined
    let analyticsSink: AnalyticsSink | undefined
    let pendingAnalytics: ((sink: AnalyticsSink) => void)[] = []
    const analytics = (call: (sink: AnalyticsSink) => void) => {
        if (analyticsOn === false || !loadAnalytics) return
        if (analyticsSink) call(analyticsSink)
        else if (pendingAnalytics.length < BUFFER_LIMIT) {
            pendingAnalytics.push(call)
        }
    }

    let lastLocation: string | undefined
    let analyticsScheduled = false
    let analyticsLoading = false

    const captureError = (error: unknown, context: ErrorContext) => {
        if (!loadErrors) return
        if (typeof error === "object" && error !== null) {
            if (reported.has(error)) return
            reported.add(error)
        }
        if (errorSink) errorSink.captureException(error, context)
        else if (pendingErrors.length < BUFFER_LIMIT) {
            pendingErrors.push([error, context])
        }
    }

    // Uncaught errors and rejections, from boot on. React 19 reports render
    // errors no error boundary caught here too (through `reportError`).
    const onError = (event: ErrorEvent) => {
        captureError(event.error ?? event.message, {
            source: "window",
            handled: false,
        })
    }
    const onRejection = (event: PromiseRejectionEvent) => {
        captureError(event.reason, { source: "rejection", handled: false })
    }

    // Sentry loads after the first paint whether or not the app ever
    // renders, so an error that stops the boot is still reported.
    let cancelErrorsLoad = () => {}
    if (loadErrors) {
        target.addEventListener("error", onError)
        target.addEventListener("unhandledrejection", onRejection)
        cancelErrorsLoad = whenIdle(() => {
            loadErrors()
                .then((sink) => {
                    errorSink = sink
                    if (user) sink.setUser(user)
                    const errors = pendingErrors
                    pendingErrors = []
                    for (const [error, context] of errors) {
                        sink.captureException(error, context)
                    }
                    if (router) sink.traceRouter(router)
                })
                .catch(() => {
                    // Blocked or offline: nothing can be sent.
                    pendingErrors = []
                })
        })
    }

    const loadAnalyticsSinks = () => {
        if (!analyticsOn) return
        loadAnalytics?.()
            .then((sink) => {
                analyticsSink = sink
                const calls = pendingAnalytics
                pendingAnalytics = []
                if (analyticsOn) for (const call of calls) call(sink)
                else sink.optOut()
            })
            .catch(() => {
                pendingAnalytics = []
            })
        loadWebAnalytics?.().catch(() => {})
    }

    const onRouterState = (router: DataRouter, state: RouterState) => {
        if (state.navigation.state !== "idle") return
        const url = scrubUrl(
            new URL(router.createHref(state.location), window.location.origin)
                .href,
        )
        // One view per history entry. The first entry's key is "default",
        // as is any entry another script pushed, so the URL counts too.
        const location = `${state.location.key} ${url}`
        if (location === lastLocation) return
        lastLocation = location
        analytics((sink) => sink.pageView(url))
    }

    return {
        captureError,
        track: (event, properties) =>
            analytics((sink) => sink.track(event, properties)),
        identify(next) {
            user = next
            errorSink?.setUser(next)
            analytics((sink) => sink.identify(next.id))
        },
        reset() {
            user = null
            errorSink?.setUser(null)
            analytics((sink) => sink.reset())
        },
        setInternal(internal) {
            try {
                storage.setItem(INTERNAL_KEY, JSON.stringify(internal))
            } catch {
                // Blocked storage: this page load still stops below.
            }
            if (!internal) return
            analyticsOn = false
            pendingAnalytics = []
            analyticsSink?.optOut()
        },
        start(next) {
            if (analyticsOn === undefined) {
                analyticsOn =
                    production &&
                    options.productionSite &&
                    !isInternalDevice(storage)
                if (!analyticsOn) pendingAnalytics = []
            }
            if (!router) {
                router = next
                errorSink?.traceRouter(next)
            }
            onRouterState(next, next.state)
            const unsubscribe = next.subscribe((state) =>
                onRouterState(next, state),
            )
            let cancelLoad = () => {}
            if (!analyticsScheduled) {
                analyticsScheduled = true
                const cancel = whenIdle(() => {
                    analyticsLoading = true
                    loadAnalyticsSinks()
                })
                cancelLoad = () => {
                    if (analyticsLoading) return
                    cancel()
                    analyticsScheduled = false
                }
            }
            return () => {
                unsubscribe()
                cancelLoad()
            }
        },
        dispose() {
            cancelErrorsLoad()
            target.removeEventListener("error", onError)
            target.removeEventListener("unhandledrejection", onRejection)
        },
    }
}
