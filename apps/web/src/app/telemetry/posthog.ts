import posthog, { type CaptureResult } from "posthog-js"
import { scrubValues } from "./scrubUrl"
import type { AnalyticsSink } from "./telemetry"

/**
 * Auth secrets out of every URL an event carries: `$current_url`,
 * `$referrer`, `$initial_person_info`, autocaptured links' `attr__href`.
 */
export function scrubPostHogEvent(
    event: CaptureResult | null,
): CaptureResult | null {
    if (!event) return null
    return {
        ...event,
        properties: scrubValues(event.properties),
        ...(event.$set && { $set: scrubValues(event.$set) }),
        ...(event.$set_once && { $set_once: scrubValues(event.$set_once) }),
    }
}

/**
 * PostHog with legacy's settings (the old client's `Providers/PHProvider.tsx`):
 * autocapture on, page views recorded by the app (one per location), and
 * the same persistence name, so returning visitors keep their PostHog id.
 */
export function startPostHog(key: string, host: string): AnalyticsSink {
    posthog.init(key, {
        api_host: host,
        autocapture: true,
        capture_pageview: false,
        capture_pageleave: false,
        persistence: "localStorage",
        persistence_name: "ph_custom_persistence",
        before_send: scrubPostHogEvent,
    })
    // PostHog only loads on devices that aren't internal, so an opt-out kept
    // from a time this device was marked internal no longer applies.
    if (posthog.has_opted_out_capturing()) posthog.clear_opt_in_out_capturing()
    return {
        pageView: (url) => posthog.capture("$pageview", { $current_url: url }),
        track: (event, properties) => posthog.capture(event, properties),
        identify: (userId) => posthog.identify(userId),
        reset: () => posthog.reset(),
        optOut: () => posthog.opt_out_capturing(),
    }
}
