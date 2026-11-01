import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import {
    allows,
    cloudflareHeaderProblems,
    cloudflareRulesOf,
    configuredOrigins,
    deployVariableProblems,
    dataUrlProblems,
    hashProblems,
    indexScriptOrigins,
    inlineHashes,
    parseCsp,
    parseHeadersFile,
    policyProblems,
    posthogOrigins,
    previewEndpoints,
    reportingProblems,
    sentryReportUrl,
    withCloudflarePolicies,
    withHashes,
} from "./check-headers.mjs"

type Rule = { headers: { key: string; value: string }[] }
const valueOf = (rule: Rule, key: string) =>
    rule.headers.find((header) => header.key === key)?.value

const DSN = "https://ab12@o1.ingest.de.sentry.io/22"
const REPORT = (environment: string) =>
    `https://o1.ingest.de.sentry.io/api/22/security/?sentry_key=ab12&sentry_environment=${environment}`

// sha256 of "a()" and of "b{}".
const SCRIPT_A = "'sha256-qVpDBgj7bpq5hMAcGp3AOc79J3Y1Z4HvySTwKrWDoy4='"
const STYLE_B = "'sha256-7yqHVAesot11p6HczDsgKRipvI5UPgs97z80zNXlans='"
const PAGE = `<head><script>a()</script><script type="module" src="/x.js"></script></head>
<body><style>b{}</style><script type="application/ld+json">{}</script></body>`

describe("security headers check", () => {
    it("reports previews as preview", () => {
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

        expect(withHashes(stale, inlineHashes(PAGE))).toBe(
            `default-src 'self'; script-src 'self' ${SCRIPT_A} https://a.com; style-src 'self' ${STYLE_B}`,
        )
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
        expect(skipped).toEqual([
            "VITE_PUBLIC_POSTHOG_KEY",
            "VITE_CF_ANALYTICS_TOKEN",
        ])
        expect(
            configuredOrigins({ VITE_CF_ANALYTICS_TOKEN: "t" }).needs,
        ).toEqual([
            {
                origin: "https://static.cloudflareinsights.com",
                directives: ["script-src"],
                what: "Cloudflare Web Analytics beacon",
            },
            {
                origin: "https://cloudflareinsights.com",
                directives: ["connect-src"],
                what: "Cloudflare Web Analytics",
            },
        ])
    })

    it("fails a Workers Builds build without the Supabase variables, since it deploys whatever builds", () => {
        const supabase = {
            VITE_SUPABASE_URL: "https://abc.supabase.co",
            VITE_SUPABASE_ANON_KEY: "anon",
        }
        expect(
            deployVariableProblems({ WORKERS_CI: "1", ...supabase }),
        ).toEqual([])
        expect(
            deployVariableProblems({
                WORKERS_CI: "1",
                VITE_SUPABASE_URL: "undefined",
            }),
        ).toEqual([
            "VITE_SUPABASE_URL is unset: add it to the Workers Builds build variables",
            "VITE_SUPABASE_ANON_KEY is unset: add it to the Workers Builds build variables",
        ])
        // Local and CI builds (no WORKERS_CI) may leave them unset.
        expect(deployVariableProblems({})).toEqual([])
    })

    it("finds the scripts index.html's inline code loads", () => {
        expect(
            indexScriptOrigins(
                `<script>s.src = "https://www.googletagmanager.com/gtag/js?id=G-1"; c.href = "https://www.ci-events.org"</script>`,
            ),
        ).toEqual(["https://www.googletagmanager.com"])
    })
})

const cloudflareText = readFileSync(
    join(__dirname, "..", "public", "_headers"),
    "utf8",
)
const cloudflareRules = cloudflareRulesOf(
    parseHeadersFile(cloudflareText).rules,
)
/** public/_headers' security headers, every path's (the policy aside). */
const COMMON = (cloudflareRules.common as Rule).headers
    .filter(
        ({ key }) =>
            key !== "Content-Security-Policy" && key !== "Reporting-Endpoints",
    )
    .map(({ key, value }) => `  ${key}: ${value}`)
    .join("\n")
/** A `_headers` with production's `policy` and its preview on `/*`. */
const headersWith = (
    policy: string,
    endpoints = `csp="${REPORT("production")}"`,
) =>
    withCloudflarePolicies(
        `/*
${COMMON}
  Content-Security-Policy: x
  Reporting-Endpoints: x

https://www.ci-events.org/*
  ! Content-Security-Policy
  ! Reporting-Endpoints
  Content-Security-Policy: x
  Reporting-Endpoints: x

https://ci-events.org/*
  ! Content-Security-Policy
  ! Reporting-Endpoints
  Content-Security-Policy: x
  Reporting-Endpoints: x

/assets/*
  Cache-Control: public, max-age=31536000, immutable
`,
        { policy, endpoints },
    )
const problemsOf = (text: string) => {
    const { rules, problems } = parseHeadersFile(text)
    return [...problems, ...cloudflareHeaderProblems(rules)]
}

describe("Cloudflare's _headers", () => {
    it("passes public/_headers", () => {
        expect(problemsOf(cloudflareText)).toEqual([])
        const { common, production } = cloudflareRules
        const policy = valueOf(production[0]!, "Content-Security-Policy")!
        const { directives, problems } = parseCsp(policy)
        expect(problems).toEqual([])
        expect(policyProblems(directives)).toEqual([])
        expect(valueOf(common!, "Content-Security-Policy")).toBe(
            previewEndpoints(policy),
        )
    })

    it("parses rules, detached headers and comments, and fails bad lines", () => {
        const { rules, problems } = parseHeadersFile(
            `  X-Early: 1
# a comment
/a/*
  X-A: 1
  ! X-B
  not a header
/b
  X-Long: ${"x".repeat(2000)}`,
        )
        expect(rules).toEqual([
            {
                pattern: "/a/*",
                headers: [{ key: "X-A", value: "1" }],
                detached: ["X-B"],
            },
            {
                pattern: "/b",
                headers: [{ key: "X-Long", value: "x".repeat(2000) }],
                detached: [],
            },
        ])
        expect(problems).toEqual([
            "_headers line 1 has a header outside a rule",
            `_headers line 6 isn't "Name: value" or "! Name"`,
            "_headers line 8 is over Cloudflare's 2000 characters",
        ])
    })

    it("--write sets production's policy on its hosts and the preview's on every other", () => {
        const policy = `default-src 'self'; report-uri ${REPORT("production")}; report-to csp`
        const { common, production } = cloudflareRulesOf(
            parseHeadersFile(headersWith(policy)).rules,
        )
        for (const rule of production) {
            expect(valueOf(rule!, "Content-Security-Policy")).toBe(policy)
        }
        expect(valueOf(common!, "Content-Security-Policy")).toBe(
            policy.replace("=production", "=preview"),
        )
        expect(valueOf(common!, "Reporting-Endpoints")).toBe(
            `csp="${REPORT("preview")}"`,
        )
        expect(problemsOf(headersWith(policy))).toEqual([])
    })

    it("fails a production host without its own policy, or one not detaching the other", () => {
        const text = headersWith("default-src 'self'")
        expect(
            problemsOf(
                text.replace(/https:\/\/ci-events\.org\/\*[\s\S]*?\n\n/, ""),
            ),
        ).toEqual([
            "_headers has no rule for https://ci-events.org/* (production's policy)",
        ])
        expect(
            problemsOf(text.replaceAll("  ! Content-Security-Policy\n", "")),
        ).toEqual([
            expect.stringContaining(
                "https://www.ci-events.org/* must detach Content-Security-Policy",
            ),
            expect.stringContaining(
                "https://ci-events.org/* must detach Content-Security-Policy",
            ),
        ])
        expect(problemsOf("/assets/*\n  Cache-Control: immutable")).toEqual([
            '_headers has no rule for every path ("/*")',
        ])
    })

    it("fails a preview policy not made from production's", () => {
        const text = headersWith("default-src 'self'")
        const loose = text.replace(
            "  Content-Security-Policy: default-src 'self'\n  Reporting-Endpoints",
            "  Content-Security-Policy: default-src *\n  Reporting-Endpoints",
        )
        expect(problemsOf(loose)).toEqual([
            "_headers: /*'s Content-Security-Policy isn't production's reporting as preview (run --write)",
        ])
    })

    it("caches only the hashed build files, a year and immutable", () => {
        const text = headersWith("default-src 'self'")
        expect(
            problemsOf(
                text.replace("max-age=31536000, immutable", "max-age=3600"),
            ),
        ).toEqual([
            "_headers: /assets/* (hashed names) must be cached a year, immutable",
        ])
        expect(
            problemsOf(`${text}\n/sw.js\n  Cache-Control: max-age=86400\n`),
        ).toEqual([
            "_headers: /sw.js sets Cache-Control; only /assets/* may (index.html and sw.js must revalidate)",
        ])
    })

    it("needs the security headers on every path, with strong values", () => {
        const text = headersWith("default-src 'self'")
        expect(
            problemsOf(text.replace("  X-Frame-Options: DENY\n", "")),
        ).toEqual(["_headers: X-Frame-Options is missing"])
        expect(
            problemsOf(
                text
                    .replace(
                        /max-age=63072000; includeSubDomains/,
                        "max-age=60",
                    )
                    .replace(
                        "X-Frame-Options: DENY",
                        "X-Frame-Options: SAMEORIGIN",
                    )
                    .replace(/ {2}Referrer-Policy: .*\n/, ""),
            ),
        ).toEqual([
            "_headers: Strict-Transport-Security max-age must be at least a year",
            "_headers: X-Frame-Options must be DENY",
            "_headers: Referrer-Policy is missing",
        ])
    })
})
