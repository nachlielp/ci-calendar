import { describe, expect, it } from "vitest"
import { scrubUrl, scrubValues } from "./scrubUrl"

describe("scrubUrl", () => {
    it("drops a fragment carrying Supabase's tokens (implicit flow)", () => {
        expect(
            scrubUrl(
                "https://www.ci-events.org/reset-password#access_token=eyJ.a.b&expires_in=3600&refresh_token=r1&token_type=bearer&type=recovery",
            ),
        ).toBe("https://www.ci-events.org/reset-password")
    })

    it("removes the auth query parameters and keeps the rest", () => {
        expect(scrubUrl("https://x.org/login?code=abc123")).toBe(
            "https://x.org/login",
        )
        expect(scrubUrl("/?f=jam&code=abc&f=center")).toBe("/?f=jam&f=center")
        expect(scrubUrl("/verify?token=t&type=signup")).toBe("/verify")
        expect(scrubUrl("/verify?token_hash=h&type=email&next=/")).toBe(
            "/verify?next=/",
        )
        expect(scrubUrl("/a?type=recovery&token=x#top")).toBe("/a#top")
    })

    it("scrubs URLs inside other text (a span's description)", () => {
        expect(scrubUrl("GET https://x.org/cb?code=abc&state=1 (200)")).toBe(
            "GET https://x.org/cb?state=1 (200)",
        )
    })

    it("leaves look-alikes and harmless fragments alone", () => {
        for (const url of [
            "https://www.ci-events.org/event/abc?f=jam",
            "/?postcode=123&error_code=otp_expired",
            "/#error=access_denied&error_description=Email+link+expired",
            "/about",
        ]) {
            expect(scrubUrl(url)).toBe(url)
        }
    })

    it("scrubs every string in a record, nested ones included", () => {
        expect(
            scrubValues({
                $current_url: "https://x.org/?code=1",
                $referrer: "https://x.org/#access_token=a",
                $initial_person_info: {
                    r: "$direct",
                    u: "https://x.org/?token=t",
                },
                $elements: [{ tag_name: "a", attr__href: "/cb?code=c&f=jam" }],
                count: 2,
            }),
        ).toEqual({
            $current_url: "https://x.org/",
            $referrer: "https://x.org/",
            $initial_person_info: { r: "$direct", u: "https://x.org/" },
            $elements: [{ tag_name: "a", attr__href: "/cb?f=jam" }],
            count: 2,
        })
    })
})
