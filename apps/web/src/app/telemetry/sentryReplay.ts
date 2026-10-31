import { addIntegration, replayIntegration } from "@sentry/react"
import { scrubUrl } from "./scrubUrl"

type RecordingEvent = Parameters<
    NonNullable<
        NonNullable<
            Parameters<typeof replayIntegration>[0]
        >["beforeAddRecordingEvent"]
    >
>[0]

/**
 * The page's URL in a recording (rrweb's meta event `href`) and the URLs in
 * its performance spans and breadcrumbs, without auth secrets.
 */
function scrubRecordingEvent(event: RecordingEvent): RecordingEvent {
    const data = event.data as {
        href?: unknown
        payload?: { description?: unknown; data?: Record<string, unknown> }
    }
    if (typeof data.href === "string") data.href = scrubUrl(data.href)
    const payload = data.payload
    if (payload && typeof payload === "object") {
        if (typeof payload.description === "string") {
            payload.description = scrubUrl(payload.description)
        }
        if (payload.data && typeof payload.data === "object") {
            for (const [key, value] of Object.entries(payload.data)) {
                if (typeof value === "string")
                    payload.data[key] = scrubUrl(value)
            }
        }
    }
    return event
}

/**
 * Session replay, masked as legacy's (#15): all text and inputs masked, all
 * media blocked, and no request or response bodies or headers (auth tokens,
 * API payloads); only timing and status are kept. URLs lose auth secrets.
 */
export const REPLAY_OPTIONS = {
    maskAllText: true,
    maskAllInputs: true,
    blockAllMedia: true,
    networkDetailAllowUrls: [],
    beforeAddRecordingEvent: scrubRecordingEvent,
} satisfies Parameters<typeof replayIntegration>[0]

export function startReplay() {
    addIntegration(replayIntegration(REPLAY_OPTIONS))
}
