import { injectSpeedInsights } from "@vercel/speed-insights"
import { scrubUrl } from "./scrubUrl"
import type { SpeedSink } from "./telemetry"

/**
 * Vercel Speed Insights (legacy's `<SpeedInsights />`), its script added
 * after the first paint, reporting vitals under the route's pattern, with
 * auth secrets out of the page URL.
 */
export function startSpeedInsights(route: string): SpeedSink {
    let stopped = false
    const insights = injectSpeedInsights({
        route,
        framework: "react",
        beforeSend: (event) =>
            stopped ? null : { ...event, url: scrubUrl(event.url) },
    })
    return {
        setRoute: (next) => insights?.setRoute(next),
        stop: () => {
            stopped = true
        },
    }
}
