import { describe, expect, it } from "vitest"
import {
    activationPlan,
    installPlan,
    isLegacyCache,
    isSkipWaitingMessage,
    servesAppShell,
} from "./swRules"

// Cache names as browsers hold them.
const LEGACY_RUNTIME = "api-cache-0.0.0-1735000000000"
const LEGACY_PRECACHE = "workbox-precache-v2-https://www.ci-events.org/"
const OWN_PRECACHE = "ci-calendar-precache-v2-https://www.ci-events.org/"

describe("service worker rules", () => {
    it("recognises the caches the legacy worker left", () => {
        expect(isLegacyCache(LEGACY_RUNTIME)).toBe(true)
        expect(isLegacyCache(LEGACY_PRECACHE)).toBe(true)
        expect(isLegacyCache(OWN_PRECACHE)).toBe(false)
    })

    it("takes over at once from the legacy worker, and waits for the page otherwise", () => {
        expect(installPlan([LEGACY_PRECACHE, LEGACY_RUNTIME])).toEqual({
            skipWaiting: true,
        })
        // A previous version of this worker, or a first install.
        expect(installPlan([OWN_PRECACHE])).toEqual({ skipWaiting: false })
        expect(installPlan([])).toEqual({ skipWaiting: false })
    })

    it("replacing the legacy worker deletes its caches and reloads the legacy pages left open", () => {
        expect(
            activationPlan(
                [LEGACY_RUNTIME, LEGACY_PRECACHE, OWN_PRECACHE],
                OWN_PRECACHE,
            ),
        ).toEqual({
            deleteCaches: [LEGACY_RUNTIME, LEGACY_PRECACHE],
            reloadOpenPages: true,
        })
    })

    it("a normal update keeps its precache, deletes strays and leaves reloading to the page", () => {
        expect(
            activationPlan(["something-else", OWN_PRECACHE], OWN_PRECACHE),
        ).toEqual({ deleteCaches: ["something-else"], reloadOpenPages: false })
        expect(activationPlan([OWN_PRECACHE], OWN_PRECACHE)).toEqual({
            deleteCaches: [],
            reloadOpenPages: false,
        })
    })

    it("takes over only when the page asks", () => {
        expect(isSkipWaitingMessage({ type: "SKIP_WAITING" })).toBe(true)
        expect(isSkipWaitingMessage({ type: "OTHER" })).toBe(false)
        expect(isSkipWaitingMessage("SKIP_WAITING")).toBe(false)
        expect(isSkipWaitingMessage(null)).toBe(false)
    })

    it("serves the app shell to every app route, offline too", () => {
        for (const path of [
            "/",
            "/?f=jam&f=center",
            "/event/2f1c8a3e-9b7d-4c2a-8e1f-0a9b8c7d6e5f",
            "/abc",
            "/123",
            "/about",
            "/privacy-policy",
            "/no-such-page",
            "/reset-password?code=x.y",
            "/?next=/files/report.pdf",
        ]) {
            expect(servesAppShell(path), path).toBe(true)
        }
    })

    it("lets files that aren't app routes go to the network", () => {
        for (const path of [
            "/sitemap.xml",
            "/robots.txt",
            "/a/b.json",
            "/sitemap.xml?x=1",
        ]) {
            expect(servesAppShell(path), path).toBe(false)
        }
    })
})
