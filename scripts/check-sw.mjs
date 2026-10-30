// Service worker check (spec #34): after `vite build`, reads the precache
// list injected into dist/sw.js and fails unless it holds the app shell and
// every JS/CSS file the build emitted (so every page opens offline), and
// only same-origin build files. Then fails if the worker caches anything at
// runtime (so no API, auth or storage response is ever cached): checked in
// its source, src/sw/sw.ts, because minifying erases workbox's class and
// function names from dist/sw.js (and workbox's own error strings mention
// `registerRoute` even when nothing calls it), plus what does survive in
// the build (Supabase URLs, NetworkFirst's options). Prints the precache's
// size.
//
// Usage (after `vite build`): node scripts/check-sw.mjs

import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

/** The URLs in the precache list workbox injected into the worker. */
export function precacheUrls(swSource) {
    return [...swSource.matchAll(/"url":"([^"]+)"/g)].map((match) => match[1])
}

/**
 * Problems with the precache list `urls`, given the JS and CSS files the
 * build emitted (`buildFiles`, relative to dist/). Empty when it is fine.
 */
export function precacheProblems(urls, buildFiles) {
    const problems = []
    if (!urls.includes("index.html")) {
        problems.push("index.html (the app shell) is not precached")
    }
    for (const url of urls) {
        if (/^[a-z]+:|^\/\//i.test(url) || url.includes("supabase")) {
            problems.push(`${url} is not a same-origin build file`)
        }
    }
    for (const file of buildFiles) {
        if (!urls.includes(file)) {
            problems.push(`${file} is not precached, so it fails offline`)
        }
    }
    return problems
}

/** Workbox modules the worker may use: precaching and its navigation route. */
const ALLOWED_WORKBOX = new Set([
    "workbox-core",
    "workbox-precaching",
    "workbox-routing",
])

/** Problems with the worker's source: any caching beyond the precache. */
export function sourceProblems(sourceWithComments) {
    const source = sourceWithComments
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/(^|[^:])\/\/.*$/gm, "$1")
    const problems = []
    for (const [, module] of source.matchAll(/from\s+"(workbox-[\w-]+)"/g)) {
        if (!ALLOWED_WORKBOX.has(module)) {
            problems.push(`sw.ts imports ${module} (runtime caching)`)
        }
    }
    const routes = source.match(/registerRoute\(/g)?.length ?? 0
    const navigationRoutes =
        source.match(/registerRoute\(\s*new NavigationRoute\(/g)?.length ?? 0
    if (routes > navigationRoutes) {
        problems.push("sw.ts registers a route other than the navigation route")
    }
    for (const [pattern, what] of [
        [/respondWith\(/, "answers requests itself (respondWith)"],
        [/caches\.open\(|\.put\(/, "writes to Cache Storage itself"],
        [/supabase/i, "mentions Supabase"],
    ]) {
        if (pattern.test(source)) problems.push(`sw.ts ${what}`)
    }
    return problems
}

/** Problems visible in the built worker. */
export function builtProblems(built) {
    const problems = []
    if (/supabase/i.test(built)) problems.push("sw.js mentions Supabase")
    if (/networkTimeoutSeconds/.test(built)) {
        problems.push("sw.js contains a NetworkFirst strategy")
    }
    return problems
}

function main() {
    const dist = fileURLToPath(new URL("../dist", import.meta.url))
    const built = readFileSync(join(dist, "sw.js"), "utf8")
    const source = readFileSync(
        fileURLToPath(new URL("../src/sw/sw.ts", import.meta.url)),
        "utf8",
    )
    const urls = precacheUrls(built)
    const buildFiles = readdirSync(join(dist, "assets"))
        .filter((file) => /\.(js|css)$/.test(file))
        .map((file) => `assets/${file}`)
    const bytes = urls.reduce(
        (sum, url) => sum + statSync(join(dist, url)).size,
        0,
    )
    console.log(
        `Service worker precaches ${urls.length} files, ${(bytes / 1024).toFixed(1)} KB before compression.`,
    )
    const problems = [
        ...precacheProblems(urls, buildFiles),
        ...sourceProblems(source),
        ...builtProblems(built),
    ]
    for (const problem of problems) console.error(`  ${problem}`)
    if (problems.length > 0) process.exit(1)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main()
