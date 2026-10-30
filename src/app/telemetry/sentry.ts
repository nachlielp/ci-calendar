import {
    captureException,
    init,
    setUser,
    type Breadcrumb,
    type BrowserOptions,
    type Event,
} from "@sentry/react"
import type { DataRouter } from "react-router"
import { scrubUrl, scrubValues } from "./scrubUrl"
import type { ErrorSink } from "./telemetry"

export interface SentryConfig {
    dsn: string
    /** `BUILD_VERSION`, the release the build's source maps are under. */
    release: string
    environment: string
    /** Runs `run` when the page is idle again (tracing and replay). */
    whenIdle: (run: () => void) => void
}

/** Sites whose scripts' errors are ours, and that get trace headers. */
const OWN_URLS = [
    window.location.origin,
    "https://ci-events.org",
    "https://www.ci-events.org",
]

/**
 * The app reports uncaught errors and rejections itself, from boot on
 * (`telemetry.ts`), so Sentry's own handlers would report them twice.
 * `BrowserApiErrors` rethrows what it catches to the window, where the app
 * reports it.
 */
export const REPORTED_BY_APP = new Set(["GlobalHandlers", "BrowserApiErrors"])

/** Auth secrets out of every URL an event carries (`scrubUrl`). */
function scrubEvent<T extends Event>(event: T): T {
    if (event.request?.url) {
        event.request = { ...event.request, url: scrubUrl(event.request.url) }
    }
    // Replay events list the page URLs they cover.
    const urls = (event as { urls?: unknown }).urls
    if (Array.isArray(urls)) {
        Object.assign(event, {
            urls: urls.map((url) =>
                typeof url === "string" ? scrubUrl(url) : url,
            ),
        })
    }
    if (event.transaction) event.transaction = scrubUrl(event.transaction)
    event.spans = event.spans?.map((span) => ({
        ...span,
        description: span.description && scrubUrl(span.description),
        data: span.data && scrubValues(span.data),
    }))
    return event
}

/** Navigation (`from`, `to`) and request (`url`) breadcrumbs. */
function scrubBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb {
    return {
        ...breadcrumb,
        ...(breadcrumb.message && { message: scrubUrl(breadcrumb.message) }),
        ...(breadcrumb.data && { data: scrubValues(breadcrumb.data) }),
    }
}

/** Legacy's settings (`legacy/src/instrument.js`), with URLs scrubbed. */
export function sentryOptions({
    dsn,
    release,
    environment,
}: Omit<SentryConfig, "whenIdle">): BrowserOptions {
    return {
        dsn,
        release,
        environment,
        integrations: (defaults) =>
            defaults.filter(
                (integration) => !REPORTED_BY_APP.has(integration.name),
            ),
        tracesSampleRate: 0.2,
        allowUrls: OWN_URLS,
        tracePropagationTargets: OWN_URLS,
        replaysSessionSampleRate: 0.05,
        replaysOnErrorSampleRate: 0.5,
        beforeSend: scrubEvent,
        beforeSendTransaction: scrubEvent,
        beforeBreadcrumb: scrubBreadcrumb,
    }
}

/**
 * Starts Sentry, then, when the page is idle again, the fully masked
 * session replay; browser tracing follows once the app's router exists
 * (`traceRouter`). Each is its own lazy chunk.
 */
export function startSentry(config: SentryConfig): ErrorSink {
    init(sentryOptions(config))
    // Replay events and their URLs go through this too.
    config.whenIdle(() => {
        void import("./sentryReplay")
            .then(({ startReplay }) => startReplay())
            .catch(() => {})
    })

    return {
        captureException(error, { source, handled = true }) {
            captureException(error, {
                mechanism: { type: source, handled },
                captureContext: { tags: { source } },
            })
        },
        setUser,
        traceRouter(router: DataRouter) {
            config.whenIdle(() => {
                void import("./sentryTracing")
                    .then(({ startTracing }) => startTracing(router))
                    .catch(() => {})
            })
        },
    }
}
