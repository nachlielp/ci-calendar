import { describe, it, expect } from "vitest"
import { SUPABASE_URL_PATTERN } from "./cachePolicy"

describe("SUPABASE_URL_PATTERN", () => {
    it("matches Supabase REST, auth, storage and realtime URLs", () => {
        const supabaseUrls = [
            "https://pjgwpivkvsuernmoeebk.supabase.co/rest/v1/ci_events",
            "https://pjgwpivkvsuernmoeebk.supabase.co/auth/v1/token",
            "https://pjgwpivkvsuernmoeebk.supabase.co/storage/v1/object/public/img.png",
            "https://pjgwpivkvsuernmoeebk.supabase.co/functions/v1/translate",
            "https://pjgwpivkvsuernmoeebk.supabase.co/realtime/v1/websocket",
        ]
        for (const url of supabaseUrls) {
            expect(SUPABASE_URL_PATTERN.test(url)).toBe(true)
        }
    })

    it("does not match the app origin or third-party CDNs", () => {
        const otherUrls = [
            "https://www.ci-events.org/",
            "https://www.ci-events.org/assets/index-abc123.js",
            "https://res.cloudinary.com/demo/image/upload/x.png",
            "https://maps.googleapis.com/maps/api/js",
            "https://us.i.posthog.com/e/",
            // Look-alike hosts must not slip through the anchors/boundary.
            "https://supabase.co.evil.example/rest/v1/ci_events",
            "https://evil-supabase.co/rest/v1/ci_events",
            "https://x.supabase.co.evil.com/rest/v1/ci_events",
            "http://pjgwpivkvsuernmoeebk.supabase.co/rest/v1/ci_events",
        ]
        for (const url of otherUrls) {
            expect(SUPABASE_URL_PATTERN.test(url)).toBe(false)
        }
    })
})
