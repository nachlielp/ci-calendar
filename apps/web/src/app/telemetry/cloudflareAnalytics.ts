import { scrubUrl } from "./scrubUrl"

/** Cloudflare Web Analytics' beacon (its CSP origins are in public/_headers). */
export const BEACON_URL = "https://static.cloudflareinsights.com/beacon.min.js"

/**
 * Cloudflare Web Analytics (spec #37, which replaced Vercel Speed Insights):
 * cookie-less page views and Web Vitals, its beacon
 * added after the first paint. It follows the router's history changes
 * itself (`spa`). It has no hook to edit what it sends, so it isn't loaded
 * on a page whose URL holds auth secrets (`scrubUrl`): auth redirects arrive
 * as page loads, so later navigations carry none. Once loaded it can't be
 * stopped; marking the device internal keeps it off from the next page load.
 */
export function startCloudflareAnalytics(
    token: string,
    doc: Document = document,
): Promise<void> {
    const href = doc.location?.href ?? ""
    if (scrubUrl(href) !== href) {
        return Promise.reject(new Error("the URL holds auth secrets"))
    }
    return new Promise((resolve, reject) => {
        const script = doc.createElement("script")
        script.src = BEACON_URL
        script.defer = true
        script.dataset.cfBeacon = JSON.stringify({ token, spa: true })
        script.addEventListener("load", () => resolve(), { once: true })
        script.addEventListener(
            "error",
            () => reject(new Error("the beacon didn't load")),
            { once: true },
        )
        doc.head.append(script)
    })
}
