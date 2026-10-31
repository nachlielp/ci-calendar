import { afterEach, describe, expect, it } from "vitest"
import { BEACON_URL, startCloudflareAnalytics } from "./cloudflareAnalytics"

const beacons = () =>
    [...document.querySelectorAll("script")].filter(
        (script) => script.src === BEACON_URL,
    )

afterEach(() => {
    for (const script of beacons()) script.remove()
    history.replaceState(null, "", "/")
})

describe("Cloudflare Web Analytics", () => {
    it("adds the beacon with the site's token, following the router", async () => {
        const started = startCloudflareAnalytics("site-token")

        const [script] = beacons()
        expect(script.defer).toBe(true)
        expect(JSON.parse(script.dataset.cfBeacon!)).toEqual({
            token: "site-token",
            spa: true,
        })
        script.dispatchEvent(new Event("load"))
        await expect(started).resolves.toBeUndefined()
    })

    it("fails when the beacon can't load (an ad blocker)", async () => {
        const started = startCloudflareAnalytics("site-token")

        beacons()[0].dispatchEvent(new Event("error"))

        await expect(started).rejects.toThrow("didn't load")
    })

    it("stays off a page whose URL holds auth secrets", async () => {
        history.replaceState(null, "", "/?code=pkce-secret")

        await expect(startCloudflareAnalytics("site-token")).rejects.toThrow(
            "auth secrets",
        )
        expect(beacons()).toEqual([])
    })
})
