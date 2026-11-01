import { afterLoadAndIdle } from "../afterLoadAndIdle"
import type { DeviceStorage } from "../deviceStorage"
import { createTelemetry, type Telemetry } from "./telemetry"

/** The production site, as index.html's Google Analytics rule has it. */
const PRODUCTION_HOSTS = ["ci-events.org", "www.ci-events.org"]

/** Legacy's default when `VITE_PUBLIC_POSTHOG_HOST` is unset. */
const DEFAULT_POSTHOG_HOST = "https://app.posthog.com"

/** Unset, or set to the strings legacy's DSN check rejected. */
const present = (value: string | undefined) =>
    value && value !== "null" && value !== "undefined" ? value : undefined

/**
 * The app's telemetry: errors are captured from the moment this runs (it is
 * main.tsx's first import), and Sentry, PostHog and Cloudflare Web
 * Analytics (when `VITE_CF_ANALYTICS_TOKEN` is set) load
 * after the first paint, each from its own chunk.
 */
export function createBrowserTelemetry(
    storage: DeviceStorage,
    buildVersion: string,
): Telemetry {
    const productionSite = PRODUCTION_HOSTS.includes(window.location.hostname)
    const dsn = present(import.meta.env.VITE_SENTRY_DSN)
    const posthogKey = present(import.meta.env.VITE_PUBLIC_POSTHOG_KEY)
    const webAnalyticsToken = present(import.meta.env.VITE_CF_ANALYTICS_TOKEN)
    const posthogHost =
        present(import.meta.env.VITE_PUBLIC_POSTHOG_HOST) ??
        DEFAULT_POSTHOG_HOST

    return createTelemetry({
        production: import.meta.env.PROD,
        productionSite,
        storage,
        whenIdle: afterLoadAndIdle,
        loadErrors: dsn
            ? async () => {
                  const { startSentry } = await import("./sentry")
                  return startSentry({
                      dsn,
                      release: buildVersion,
                      environment: productionSite ? "production" : "preview",
                      whenIdle: afterLoadAndIdle,
                  })
              }
            : undefined,
        loadAnalytics: posthogKey
            ? async () => {
                  const { startPostHog } = await import("./posthog")
                  return startPostHog(posthogKey, posthogHost)
              }
            : undefined,
        loadWebAnalytics: webAnalyticsToken
            ? async () => {
                  const { startCloudflareAnalytics } =
                      await import("./cloudflareAnalytics")
                  return startCloudflareAnalytics(webAnalyticsToken)
              }
            : undefined,
    })
}
