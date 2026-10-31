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

type StreamedSpan = Parameters<NonNullable<BrowserOptions["beforeSendSpan"]>>[0]

/**
 * Header names and query parameters that identify a person, filtered out
 * on top of Sentry's own list of secrets (`auth`, `token`, `session`, …).
 */
const IDENTIFYING = ["forwarded", "-ip", "remote-", "via", "-user"]

/**
 * What Sentry may collect beyond what the app sends it. Sentry 11 collects
 * everything by default; this is the baseline its migration guide gives
 * for keeping the earlier defaults (no `sendDefaultPii`): no IP address,
 * cookies or bodies, and headers (the user agent, the referrer) and query
 * strings with identifying values filtered. Replays have their own
 * masking (`sentryReplay.ts`).
 */
export const DATA_COLLECTION = {
    userInfo: false,
    cookies: false,
    httpHeaders: {
        request: { deny: IDENTIFYING },
        response: { deny: IDENTIFYING },
    },
    httpBodies: [],
    urlQueryParams: { deny: IDENTIFYING },
    genAI: { inputs: false, outputs: false },
    databaseQueryData: false,
    graphQL: { document: false, variables: false },
} satisfies BrowserOptions["dataCollection"]

/** Auth secrets out of every URL an event carries (`scrubUrl`). */
function scrubEvent<T extends Event>(event: T): T {
    if (event.request) {
        const { url, headers } = event.request
        event.request = {
            ...event.request,
            ...(url && { url: scrubUrl(url) }),
            // The referrer can be an auth redirect.
            ...(headers && { headers: scrubValues(headers) }),
        }
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
    return event
}

/**
 * Tracing's spans, streamed as they end: the name (a request's
 * "GET https://…") and attributes (`url.full`, the referrer header).
 */
function scrubSpan(span: StreamedSpan): StreamedSpan {
    return {
        ...span,
        name: scrubUrl(span.name),
        attributes: scrubValues(span.attributes),
    }
}

/**
 * Replay events (the page URLs a replay covers) skip `beforeSend`, which
 * only sees errors, so an event processor scrubs them.
 */
export const SCRUB_REPLAY_EVENTS = {
    name: "ScrubReplayEvents",
    processEvent: (event: Event) =>
        event.type === "replay_event" ? scrubEvent(event) : event,
}

/** Navigation (`from`, `to`) and request (`url`) breadcrumbs. */
function scrubBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb {
    return {
        ...breadcrumb,
        ...(breadcrumb.message && { message: scrubUrl(breadcrumb.message) }),
        ...(breadcrumb.data && { data: scrubValues(breadcrumb.data) }),
    }
}

/** Legacy's settings (the old client's `instrument.js`), with URLs scrubbed. */
export function sentryOptions({
    dsn,
    release,
    environment,
}: Omit<SentryConfig, "whenIdle">): BrowserOptions {
    return {
        dsn,
        release,
        environment,
        integrations: (defaults) => [
            ...defaults.filter(
                (integration) => !REPORTED_BY_APP.has(integration.name),
            ),
            SCRUB_REPLAY_EVENTS,
        ],
        tracesSampleRate: 0.2,
        allowUrls: OWN_URLS,
        tracePropagationTargets: OWN_URLS,
        replaysSessionSampleRate: 0.05,
        replaysOnErrorSampleRate: 0.5,
        dataCollection: DATA_COLLECTION,
        beforeSend: scrubEvent,
        beforeSendSpan: scrubSpan,
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
        setUser: (user) => setUser(user && { ...user }),
        traceRouter(router: DataRouter) {
            config.whenIdle(() => {
                void import("./sentryTracing")
                    .then(({ startTracing }) => startTracing(router))
                    .catch(() => {})
            })
        },
    }
}
