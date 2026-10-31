import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import {
    allows,
    configuredOrigins,
    dataUrlProblems,
    hashProblems,
    headerProblems,
    indexScriptOrigins,
    inlineHashes,
    parseCsp,
    policyProblems,
    posthogOrigins,
    previewEndpoints,
    previewPolicy,
    reportingProblems,
    rulesOf,
    sentryReportUrl,
    withPolicies,
} from "./check-headers.mjs"

const config = JSON.parse(
    readFileSync(join(__dirname, "..", "vercel.json"), "utf8"),
)
type Rule = { headers: { key: string; value: string }[] }
const valueOf = (rule: Rule, key: string) =>
    rule.headers.find((header) => header.key === key)?.value
const policyOf = (
    vercelConfig: typeof config,
    which: "production" | "preview" = "production",
): string => valueOf(rulesOf(vercelConfig)[which], "Content-Security-Policy")!

const PREVIEW_HOST = [{ type: "host", value: { suf: ".vercel.app" } }]
const DSN = "https://ab12@o1.ingest.de.sentry.io/22"
const REPORT = (environment: string) =>
    `https://o1.ingest.de.sentry.io/api/22/security/?sentry_key=ab12&sentry_environment=${environment}`
/** vercel.json with `policy` for production and the preview made from it. */
const configWith = (policy: string, common: Rule["headers"] = []) => ({
    headers: [
        { source: "/(.*)", headers: common },
        {
            source: "/(.*)",
            missing: PREVIEW_HOST,
            headers: [
                { key: "Content-Security-Policy", value: policy },
                {
                    key: "Reporting-Endpoints",
                    value: `csp="${REPORT("production")}"`,
                },
            ],
        },
        {
            source: "/(.*)",
            has: PREVIEW_HOST,
            headers: [
                {
                    key: "Content-Security-Policy",
                    value: previewPolicy(policy),
                },
                {
                    key: "Reporting-Endpoints",
                    value: `csp="${REPORT("preview")}"`,
                },
            ],
        },
    ],
})

// sha256 of "a()" and of "b{}".
const SCRIPT_A = "'sha256-qVpDBgj7bpq5hMAcGp3AOc79J3Y1Z4HvySTwKrWDoy4='"
const STYLE_B = "'sha256-7yqHVAesot11p6HczDsgKRipvI5UPgs97z80zNXlans='"
const PAGE = `<head><script>a()</script><script type="module" src="/x.js"></script></head>
<body><style>b{}</style><script type="application/ld+json">{}</script></body>`

describe("security headers check", () => {
    it("passes the headers in vercel.json", () => {
        expect(headerProblems(config)).toEqual([])
        const { directives, problems } = parseCsp(policyOf(config))
        expect(problems).toEqual([])
        expect(policyProblems(directives)).toEqual([])
    })

    it("fails a missing header or a weak value", () => {
        const weak = configWith("default-src 'self'", [
            { key: "Strict-Transport-Security", value: "max-age=60" },
            { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ])
        expect(headerProblems(weak)).toEqual([
            "Strict-Transport-Security max-age must be at least a year",
            "X-Content-Type-Options is missing",
            "X-Frame-Options must be DENY",
            "Referrer-Policy is missing",
            "Permissions-Policy is missing",
        ])
        expect(headerProblems({ headers: [] })).toHaveLength(1)
    })

    it("needs a production and a preview policy, the preview's made from production's", () => {
        const common = config.headers[0].headers
        const both = configWith("default-src 'self'; frame-src 'none'", common)
        expect(headerProblems(both)).toEqual([])
        expect(headerProblems({ headers: [both.headers[0]] })).toEqual([
            expect.stringContaining("needs a policy rule for production"),
        ])
        both.headers[2].headers[0].value += "; img-src https://evil.example"
        both.headers[2].headers[1].value = `csp="${REPORT("production")}"`
        expect(headerProblems(both)).toEqual([
            "the preview policy isn't production's plus the toolbar's (run --write)",
            "the preview Reporting-Endpoints isn't production's (run --write)",
        ])
    })

    it("gives previews the toolbar's sources and nothing else", () => {
        expect(
            previewPolicy(
                `script-src 'self' ${SCRIPT_A}; style-src 'self' ${STYLE_B}; frame-src 'none'; object-src 'none'; report-uri ${REPORT("production")}`,
            ),
        ).toBe(
            `script-src 'self' ${SCRIPT_A} https://vercel.live; style-src 'self' https://vercel.live 'unsafe-inline'; frame-src https://vercel.live; object-src 'none'; report-uri ${REPORT("preview")}`,
        )
        expect(previewEndpoints(`csp="${REPORT("production")}"`)).toBe(
            `csp="${REPORT("preview")}"`,
        )
    })

    it("reports to the DSN's Sentry security endpoint", () => {
        expect(sentryReportUrl(DSN, "production")).toBe(REPORT("production"))
        const { directives, problems } = parseCsp(
            `default-src 'self'; report-uri ${REPORT("production")}; report-to csp`,
        )
        expect(problems).toEqual([])
        const endpoints = `csp="${REPORT("production")}"`
        expect(
            reportingProblems(directives, endpoints, {
                dsn: DSN,
                environment: "production",
            }),
        ).toEqual([])
        expect(
            reportingProblems(directives, `other="${REPORT("production")}"`, {
                dsn: "https://cd34@o1.ingest.de.sentry.io/23",
                environment: "preview",
            }),
        ).toEqual([
            "Reporting-Endpoints must map csp to report-uri's URL",
            "report-uri must report as preview",
            "report-uri isn't the Sentry DSN's (from the env)",
        ])
        expect(parseCsp("report-uri /csp; report-to a b").problems).toEqual([
            "report-uri must be one https URL",
            "report-to must be one endpoint name",
        ])
    })

    it("fails unsafe sources, wildcards and repeated directives", () => {
        const { directives, problems } = parseCsp(
            "default-src *; script-src 'self' 'unsafe-eval' 'unsafe-inline' https: data:; img-src http://x.com https://a.com/path; img-src 'self'; frame-ancestors 'self'",
        )
        expect(problems).toEqual([
            "default-src: * is not an allowed source",
            "script-src: 'unsafe-eval' is not an allowed source",
            "script-src: 'unsafe-inline' is not an allowed source",
            "script-src: https: is not an allowed source",
            "img-src: http://x.com is not an allowed source",
            "img-src: https://a.com/path is not an allowed source",
            "img-src is set twice",
        ])
        expect(policyProblems(directives)).toEqual(
            expect.arrayContaining([
                "object-src is missing",
                "default-src must be 'self'",
                "frame-ancestors must be 'none'",
                "script-src allows data: (script injection)",
            ]),
        )
    })

    it("hashes the inline scripts and styles that run, not data blocks", () => {
        const { scripts, styles, problems } = inlineHashes(PAGE)
        expect(scripts).toEqual([SCRIPT_A])
        expect(styles).toEqual([STYLE_B])
        expect(problems).toEqual([])
        expect(
            inlineHashes('<img src="x" onerror="a()"><p style="color:red">')
                .problems,
        ).toEqual([
            "index.html has an inline event handler (on…=)",
            "index.html has a style attribute",
        ])
    })

    it("fails a changed or stale hash, and --write fixes both", () => {
        const stale = `default-src 'self'; script-src 'self' 'sha256-AAAA' https://a.com; style-src 'self' ${STYLE_B}`
        const { directives } = parseCsp(stale)
        expect(hashProblems(directives, "script-src", [SCRIPT_A])).toEqual([
            expect.stringContaining(`script-src lacks ${SCRIPT_A}`),
            "script-src has 'sha256-AAAA', which nothing in index.html needs",
        ])
        expect(hashProblems(directives, "style-src", [STYLE_B])).toEqual([])

        const text = JSON.stringify(configWith(stale))
        const written = JSON.parse(withPolicies(text, inlineHashes(PAGE)))
        const fresh = `default-src 'self'; script-src 'self' ${SCRIPT_A} https://a.com; style-src 'self' ${STYLE_B}`
        expect(policyOf(written)).toBe(fresh)
        expect(policyOf(written, "preview")).toBe(previewPolicy(fresh))
    })

    it("matches origins exactly or under a *. wildcard", () => {
        const { directives } = parseCsp(
            "default-src 'self'; img-src https://*.example.com https://a.org",
        )
        expect(allows(directives, "img-src", "https://x.example.com")).toBe(
            true,
        )
        expect(allows(directives, "img-src", "https://a.org")).toBe(true)
        expect(allows(directives, "img-src", "https://example.com")).toBe(false)
        expect(allows(directives, "img-src", "https://b.org")).toBe(false)
    })

    it("fails an inlined data: image unless img-src allows data:", () => {
        const files = [
            {
                name: "assets/a.css",
                text: "a{background:url(data:image/png;base64,AA)}",
            },
        ]
        expect(
            dataUrlProblems(parseCsp("img-src 'self'").directives, files),
        ).toEqual([
            "assets/a.css inlines a data: URL, which img-src doesn't allow",
        ])
        expect(
            dataUrlProblems(parseCsp("img-src 'self' data:").directives, files),
        ).toEqual([])
    })

    it("works out PostHog's hosts as posthog-js does", () => {
        expect(posthogOrigins("https://us.i.posthog.com")).toEqual({
            api: "https://us.i.posthog.com",
            assets: "https://us-assets.i.posthog.com",
        })
        expect(posthogOrigins("https://app.posthog.com")).toEqual({
            api: "https://us.i.posthog.com",
            assets: "https://us-assets.i.posthog.com",
        })
        expect(posthogOrigins("https://eu.i.posthog.com/")).toEqual({
            api: "https://eu.i.posthog.com",
            assets: "https://eu-assets.i.posthog.com",
        })
        expect(posthogOrigins("https://ph.example.com")).toEqual({
            api: "https://ph.example.com",
            assets: "https://ph.example.com",
        })
    })

    it("lists the origins the env configures, skipping unset ones", () => {
        const { needs, skipped } = configuredOrigins({
            VITE_SUPABASE_URL: "https://abc.supabase.co",
            VITE_SENTRY_DSN: "https://key@o1.ingest.de.sentry.io/2",
            VITE_PUBLIC_POSTHOG_KEY: "undefined",
        })
        expect(needs.map(({ origin }) => origin)).toEqual([
            "https://abc.supabase.co",
            "https://o1.ingest.de.sentry.io",
        ])
        expect(skipped).toEqual(["VITE_PUBLIC_POSTHOG_KEY"])
    })

    it("finds the scripts index.html's inline code loads", () => {
        expect(
            indexScriptOrigins(
                `<script>s.src = "https://www.googletagmanager.com/gtag/js?id=G-1"; c.href = "https://www.ci-events.org"</script>`,
            ),
        ).toEqual(["https://www.googletagmanager.com"])
    })
})
