import { getDefaultIntegrations, type Event } from "@sentry/react"
import { describe, expect, it } from "vitest"
import { sentryOptions } from "./sentry"
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
        const names = integrations(getDefaultIntegrations({})).map(
            ({ name }) => name,
        )
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

    it("keep auth secrets out of replay recordings", () => {
        const recorded = REPLAY_OPTIONS.beforeAddRecordingEvent({
            type: 4,
            timestamp: 0,
            data: { href: "https://x.org/?code=secret", width: 1, height: 1 },
        } as never) as unknown as { data: { href: string } }
        expect(recorded.data.href).toBe("https://x.org/")
    })
})
