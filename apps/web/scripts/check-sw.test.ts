import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import {
    builtProblems,
    precacheProblems,
    precacheUrls,
    shellRevisionProblems,
    cloudflareImmutable,
    sourceMapProblems,
    sourceProblems,
    telemetryProblems,
    heicProblems,
} from "./check-sw.mjs"
import { withHeadersRevision } from "./headers-revision.mjs"

// The list as workbox injects it into dist/sw.js (minified), trimmed.
const SW_SOURCE =
    'const x=1;Ce([{"revision":"a1","url":"index.html"},{"revision":null,"url":"assets/index-AbC.js"},{"revision":null,"url":"assets/index-DeF.css"}]);'

describe("service worker check", () => {
    it("reads the precache list from the built worker", () => {
        expect(precacheUrls(SW_SOURCE)).toEqual([
            "index.html",
            "assets/index-AbC.js",
            "assets/index-DeF.css",
        ])
    })

    it("passes a list with the shell and every build file", () => {
        expect(
            precacheProblems(precacheUrls(SW_SOURCE), [
                "assets/index-AbC.js",
                "assets/index-DeF.css",
            ]),
        ).toEqual([])
    })

    it("fails without the app shell or with a build file missing", () => {
        expect(
            precacheProblems(
                ["assets/index-AbC.js"],
                ["assets/index-AbC.js", "assets/AboutPage-X.js"],
            ),
        ).toEqual([
            "index.html (the app shell) is not precached",
            "assets/AboutPage-X.js is not precached, so it fails offline",
        ])
    })

    it("fails on anything that isn't a same-origin build file", () => {
        expect(
            precacheProblems(
                [
                    "index.html",
                    "https://abc.supabase.co/rest/v1/ci_events",
                    "//cdn.example.com/x.js",
                ],
                [],
            ),
        ).toEqual([
            "https://abc.supabase.co/rest/v1/ci_events is not a same-origin build file",
            "//cdn.example.com/x.js is not a same-origin build file",
        ])
    })

    it("passes the worker as it is: precache plus the navigation route", () => {
        const source = readFileSync(join(process.cwd(), "src/sw/sw.ts"), "utf8")
        expect(sourceProblems(source)).toEqual([])
    })

    it("fails a worker that caches at runtime", () => {
        const source = `
            // Comments may say anything: supabase, registerRoute(
            import { NetworkFirst } from "workbox-strategies"
            import { NavigationRoute, registerRoute } from "workbox-routing"
            registerRoute(new NavigationRoute(handler))
            registerRoute(({ url }) => url.host.endsWith("supabase.co"), new NetworkFirst())
            self.addEventListener("fetch", (e) => e.respondWith(caches.open("x").then((c) => c.put(e.request, r))))
        `
        expect(sourceProblems(source)).toEqual([
            "sw.ts imports workbox-strategies (runtime caching)",
            "sw.ts registers a route other than the navigation route",
            "sw.ts answers requests itself (respondWith)",
            "sw.ts writes to Cache Storage itself",
            "sw.ts mentions Supabase",
        ])
    })

    it("fails a built worker with Supabase URLs or a NetworkFirst strategy", () => {
        expect(builtProblems('const a="x";')).toEqual([])
        expect(
            builtProblems(
                'fetch("https://abc.supabase.co");{networkTimeoutSeconds:3}',
            ),
        ).toEqual([
            "sw.js mentions Supabase",
            "sw.js contains a NetworkFirst strategy",
        ])
    })
})

const vercel = JSON.parse(
    readFileSync(join(process.cwd(), "vercel.json"), "utf8"),
)
const cloudflare = readFileSync(
    join(process.cwd(), "public", "_headers"),
    "utf8",
)
/** `_headers` without its `/assets/*` caching rule. */
const cloudflareUncached = cloudflare.replace(/^\/assets\/\*\n.*\n/m, "")

describe("HEIC converter chunks", () => {
    const files = ["assets/heic/heic-to-AbC.js"]

    it("pass when none is precached and both hosts serve them immutable", () => {
        expect(heicProblems(["index.html"], files, vercel, cloudflare)).toEqual(
            [],
        )
    })

    it("fail when one is precached, isn't immutable, or the build put none there", () => {
        expect(heicProblems([...files], files, vercel, cloudflare)).toEqual([
            "assets/heic/heic-to-AbC.js is HEIC and must not be precached",
        ])
        expect(
            heicProblems([], files, { ...vercel, headers: [] }, cloudflare),
        ).toEqual([
            "assets/heic/heic-to-AbC.js is not served as immutable (vercel.json)",
        ])
        expect(heicProblems([], files, vercel, cloudflareUncached)).toEqual([
            "assets/heic/heic-to-AbC.js is not served as immutable (_headers)",
        ])
        expect(heicProblems([], [], vercel, cloudflare)).toEqual([
            "no HEIC chunks in assets/heic/",
        ])
    })
})

describe("Cloudflare's immutable caching", () => {
    it("covers hashed build files, nested too, and nothing else", () => {
        expect(cloudflareImmutable(cloudflare, "/assets/index-AbC.js")).toBe(
            true,
        )
        expect(
            cloudflareImmutable(cloudflare, "/assets/telemetry/sentry-AbC.js"),
        ).toBe(true)
        expect(cloudflareImmutable(cloudflare, "/index.html")).toBe(false)
        expect(cloudflareImmutable(cloudflare, "/sw.js")).toBe(false)
    })
})

describe("telemetry chunks", () => {
    const files = [
        "assets/telemetry/sentry-AbC.js",
        "assets/telemetry/posthog-DeF.js",
    ]

    it("pass when none is precached and both hosts serve them immutable", () => {
        expect(
            telemetryProblems(["index.html"], files, vercel, cloudflare),
        ).toEqual([])
    })

    it("fail when one is precached", () => {
        expect(
            telemetryProblems(
                ["index.html", "assets/telemetry/posthog-DeF.js"],
                files,
                vercel,
                cloudflare,
            ),
        ).toEqual([
            "assets/telemetry/posthog-DeF.js is telemetry and must not be precached",
        ])
    })

    it("fail when they aren't served immutable, or the build put none there", () => {
        const noHeaders = { ...vercel, headers: [] }
        expect(
            telemetryProblems([], files.slice(0, 1), noHeaders, cloudflare),
        ).toEqual([
            "assets/telemetry/sentry-AbC.js is not served as immutable (vercel.json)",
        ])
        expect(
            telemetryProblems(
                [],
                files.slice(0, 1),
                vercel,
                cloudflareUncached,
            ),
        ).toEqual([
            "assets/telemetry/sentry-AbC.js is not served as immutable (_headers)",
        ])
        expect(telemetryProblems([], [], vercel, cloudflare)).toEqual([
            "no telemetry chunks in assets/telemetry/",
        ])
    })

    it("fails when a source map is left in dist/", () => {
        expect(
            sourceMapProblems([
                "index.html",
                "assets/index-AbC.js",
                "assets/telemetry/sentry-X.js.map",
            ]),
        ).toEqual([
            "assets/telemetry/sentry-X.js.map is a source map and would be served publicly",
        ])
    })

    it("fails unless the shell's revision covers both hosts' headers", () => {
        const headers = { headers: [{ source: "/(.*)", headers: [] }] }
        const changed = {
            headers: [{ source: "/(.*)", headers: [{ key: "X", value: "1" }] }],
        }
        const entries = withHeadersRevision(
            [
                { url: "index.html", revision: "a1" },
                { url: "assets/x.js", revision: null },
            ],
            headers,
            "/*\n  X: 1\n",
        )
        expect(entries[1]).toEqual({ url: "assets/x.js", revision: null })
        const built = `Ce(${JSON.stringify(entries)});`
        expect(shellRevisionProblems(built, headers, "/*\n  X: 1\n")).toEqual(
            [],
        )
        expect(shellRevisionProblems(built, changed, "/*\n  X: 1\n")).toEqual([
            "index.html's precache revision doesn't cover the headers",
        ])
        expect(shellRevisionProblems(built, headers, "/*\n  X: 2\n")).toEqual([
            "index.html's precache revision doesn't cover the headers",
        ])
        expect(shellRevisionProblems(SW_SOURCE, headers, "")).toHaveLength(1)
    })
})
