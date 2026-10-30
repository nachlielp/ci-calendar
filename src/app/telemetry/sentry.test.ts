import { getDefaultIntegrations, type Event } from "@sentry/react"
import { describe, expect, it } from "vitest"
import {
    DATA_COLLECTION,
    REPORTED_BY_APP,
    SCRUB_REPLAY_EVENTS,
    sentryOptions,
} from "./sentry"
import { REPLAY_OPTIONS } from "./sentryReplay"

const options = sentryOptions({
    dsn: "https://public@example.invalid/1",
    release: "abc123",
    environment: "production",
})

describe("Sentry's settings", () => {
    it("mask session replays as legacy did (#15)", () => {
        expect(REPLAY_OPTIONS).toMatchObject({
            maskAllText: true,
            maskAllInputs: true,
            blockAllMedia: true,
            networkDetailAllowUrls: [],
        })
    })

    it("leave uncaught errors to the app, which reports them from boot", () => {
        const integrations = options.integrations as (
            defaults: ReturnType<typeof getDefaultIntegrations>,
        ) => { name: string }[]
        const defaults = getDefaultIntegrations({})
        // Still Sentry's names for them (a rename would keep them on).
        expect(defaults.map(({ name }) => name)).toEqual(
            expect.arrayContaining([...REPORTED_BY_APP]),
        )
        const names = integrations(defaults).map(({ name }) => name)
        expect(names).not.toContain("GlobalHandlers")
        expect(names).not.toContain("BrowserApiErrors")
        expect(names).toContain("Dedupe")
    })

    it("report under the build version", () => {
        expect(options.release).toBe("abc123")
    })

    it("keep auth secrets out of events and breadcrumbs", () => {
        const event = options.beforeSend!(
            {
                request: { url: "https://x.org/login?code=secret" },
                spans: [],
            } as Event as never,
            {},
        ) as Event
        expect(event.request?.url).toBe("https://x.org/login")

        const crumb = options.beforeBreadcrumb!(
            {
                category: "navigation",
                data: { from: "/", to: "/reset#access_token=a&type=recovery" },
            },
            undefined,
        )
        expect(crumb?.data).toEqual({ from: "/", to: "/reset" })
    })

    it("keep auth secrets out of streamed spans", () => {
        const span = options.beforeSendSpan!({
            trace_id: "t",
            span_id: "s",
            name: "GET https://x.org/auth/v1/verify?token=secret&type=signup",
            start_timestamp: 0,
            status: "ok",
            is_segment: false,
            attributes: {
                "url.full": "https://x.org/auth/v1/verify?token=secret",
                "http.request.header.referer": [
                    "https://x.org/reset#access_token=a&type=recovery",
                ],
                "http.response.status_code": 200,
            },
        })
        expect(span.name).toBe("GET https://x.org/auth/v1/verify")
        expect(span.attributes).toEqual({
            "url.full": "https://x.org/auth/v1/verify",
            "http.request.header.referer": ["https://x.org/reset"],
            "http.response.status_code": 200,
        })
    })

    it("keep the referrer's auth secrets out of events", () => {
        const event = options.beforeSend!(
            {
                request: {
                    url: "https://x.org/",
                    headers: { Referer: "https://x.org/?code=secret" },
                },
            } as Event as never,
            {},
        ) as Event
        expect(event.request?.headers).toEqual({ Referer: "https://x.org/" })
    })

    it("collect no IP addresses, cookies or bodies (Sentry 11 would)", () => {
        expect(options.dataCollection).toBe(DATA_COLLECTION)
        expect(DATA_COLLECTION).toMatchObject({
            userInfo: false,
            cookies: false,
            httpBodies: [],
        })
    })

    it("keep auth secrets out of replay events, which skip beforeSend", () => {
        const integrations = options.integrations as (
            defaults: ReturnType<typeof getDefaultIntegrations>,
        ) => unknown[]
        expect(integrations([])).toContain(SCRUB_REPLAY_EVENTS)
        const event = SCRUB_REPLAY_EVENTS.processEvent({
            type: "replay_event",
            urls: ["https://x.org/?f=jam&refresh_token=secret"],
            request: {
                url: "https://x.org/?f=jam&code=secret",
                headers: {
                    Referer: "https://x.org/reset#access_token=a&type=recovery",
                },
            },
        } as Event) as Event & { urls: string[] }
        expect(event.urls).toEqual(["https://x.org/?f=jam"])
        expect(event.request).toEqual({
            url: "https://x.org/?f=jam",
            headers: { Referer: "https://x.org/reset" },
        })
    })

    it("keep auth secrets out of replay recordings", () => {
        const recorded = REPLAY_OPTIONS.beforeAddRecordingEvent({
            type: 4,
            timestamp: 0,
            data: { href: "https://x.org/?code=secret", width: 1, height: 1 },
        } as never) as unknown as { data: { href: string } }
        expect(recorded.data.href).toBe("https://x.org/")
    })
})
