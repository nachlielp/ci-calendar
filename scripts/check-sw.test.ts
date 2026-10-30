import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import {
    builtProblems,
    precacheProblems,
    precacheUrls,
    sourceProblems,
} from "./check-sw.mjs"

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
