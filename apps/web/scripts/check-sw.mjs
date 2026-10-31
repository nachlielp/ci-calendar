// Service worker check (spec #34): after `vite build`, reads the precache
// list injected into dist/sw.js and fails unless it holds the app shell and
// every JS/CSS file the build emitted (so every page opens offline), and
// only same-origin build files. Then fails if the worker caches anything at
// runtime (so no API, auth or storage response is ever cached): checked in
// its source, src/sw/sw.ts, because minifying erases workbox's class and
// function names from dist/sw.js (and workbox's own error strings mention
// `registerRoute` even when nothing calls it), plus what does survive in
// the build (Supabase URLs, NetworkFirst's options). Prints the precache's
// size. The telemetry SDKs' chunks (assets/telemetry/) and the HEIC
// converter's (assets/heic/) must stay out of the precache and be served
// immutable, and no source map may be left in dist/
// (they would be public). index.html's revision must cover the headers
// (vercel.json's and public/_headers), which the precache stores it with.
//
// Usage (after `vite build`): node scripts/check-sw.mjs

import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { headersRevision, SHELL } from "./headers-revision.mjs"

/**
 * Whether Cloudflare's `_headers` (text) serves `path` immutable: a rule
 * whose path pattern (`*` a splat) matches it sets an immutable
 * Cache-Control.
 */
export function cloudflareImmutable(headersText, path) {
    let pattern
    for (const line of headersText.split("\n")) {
        const content = line.trim()
        if (!content || content.startsWith("#")) continue
        if (!/^\s/.test(line)) pattern = content
        else if (
            pattern?.startsWith("/") &&
            /^cache-control:.*immutable/i.test(content)
        ) {
            const escape = (part) => part.replace(/[.+?^${}()|[\]\\/]/g, "\\$&")
            const regex = new RegExp(
                `^${pattern.split("*").map(escape).join(".*")}$`,
            )
            if (regex.test(path)) return true
        }
    }
    return false
}

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

/** Where the build puts the telemetry SDKs (`TELEMETRY_ASSETS`, swRules.ts). */
export const TELEMETRY_DIR = "assets/telemetry"

/** Where the build puts the HEIC converter (`HEIC_ASSETS`, swRules.ts). */
export const HEIC_DIR = "assets/heic"

/**
 * The `vercel.json` header rule source (path-to-regexp, only `(.*)` groups
 * used) as a regular expression.
 */
function sourcePattern(source) {
    const escape = (part) => part.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")
    return new RegExp(`^${source.split("(.*)").map(escape).join("(.*)")}$`)
}

/**
 * Problems with chunks kept out of the precache (`files` in `dir`, relative
 * to dist/; `what` names them): there must be some (else the build stopped
 * sorting them out), none may be precached, and each must be served
 * `immutable` by `vercelConfig` and Cloudflare's `_headers` (text).
 */
function notPrecachedProblems(
    urls,
    files,
    vercelConfig,
    cloudflareHeaders,
    { dir, what },
) {
    const problems = []
    if (files.length === 0) {
        problems.push(`no ${what} chunks in ${dir}/`)
    }
    const immutable = (vercelConfig.headers ?? []).filter((rule) =>
        rule.headers.some(
            ({ key, value }) =>
                key.toLowerCase() === "cache-control" &&
                value.includes("immutable"),
        ),
    )
    for (const file of files) {
        if (urls.includes(file)) {
            problems.push(`${file} is ${what} and must not be precached`)
        }
        if (
            !immutable.some((rule) =>
                sourcePattern(rule.source).test(`/${file}`),
            )
        ) {
            problems.push(`${file} is not served as immutable (vercel.json)`)
        }
        if (!cloudflareImmutable(cloudflareHeaders, `/${file}`)) {
            problems.push(`${file} is not served as immutable (_headers)`)
        }
    }
    return problems
}

/** `notPrecachedProblems` for the telemetry SDKs' chunks. */
export function telemetryProblems(
    urls,
    telemetryFiles,
    vercelConfig,
    cloudflareHeaders,
) {
    return notPrecachedProblems(
        urls,
        telemetryFiles,
        vercelConfig,
        cloudflareHeaders,
        {
            dir: TELEMETRY_DIR,
            what: "telemetry",
        },
    )
}

/** `notPrecachedProblems` for the HEIC converter's chunks. */
export function heicProblems(urls, heicFiles, vercelConfig, cloudflareHeaders) {
    return notPrecachedProblems(
        urls,
        heicFiles,
        vercelConfig,
        cloudflareHeaders,
        {
            dir: HEIC_DIR,
            what: "HEIC",
        },
    )
}

/**
 * Problems with the shell's precache revision: it must carry the hash of
 * the header rules, `vercelConfig`'s and `cloudflareHeaders`
 * (scripts/headers-revision.mjs), or a deploy that changes only the
 * headers (the CSP) keeps installed apps on the old ones, which the
 * precached index.html was stored with.
 */
export function shellRevisionProblems(
    swSource,
    vercelConfig,
    cloudflareHeaders,
) {
    const entry = [...swSource.matchAll(/\{[^{}]*\}/g)]
        .map(([object]) => object)
        .find((object) => object.includes(`"url":"${SHELL}"`))
    const revision = entry && /"revision":"([^"]+)"/.exec(entry)?.[1]
    return revision?.endsWith(
        `-h${headersRevision(vercelConfig, cloudflareHeaders)}`,
    )
        ? []
        : [`${SHELL}'s precache revision doesn't cover the headers`]
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

/** Problems with the build's files (relative to dist/): source maps left. */
export function sourceMapProblems(distFiles) {
    return distFiles
        .filter((file) => file.endsWith(".map"))
        .map((file) => `${file} is a source map and would be served publicly`)
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
    const jsIn = (dir) =>
        readdirSync(join(dist, dir))
            .filter((file) => file.endsWith(".js"))
            .map((file) => `${dir}/${file}`)
    const telemetryFiles = jsIn(TELEMETRY_DIR)
    const heicFiles = jsIn(HEIC_DIR)
    const vercelConfig = JSON.parse(
        readFileSync(
            fileURLToPath(new URL("../vercel.json", import.meta.url)),
            "utf8",
        ),
    )
    const cloudflareHeaders = readFileSync(
        fileURLToPath(new URL("../public/_headers", import.meta.url)),
        "utf8",
    )
    const bytes = urls.reduce(
        (sum, url) => sum + statSync(join(dist, url)).size,
        0,
    )
    console.log(
        `Service worker precaches ${urls.length} files, ${(bytes / 1024).toFixed(1)} KB before compression.`,
    )
    const problems = [
        ...precacheProblems(urls, buildFiles),
        ...telemetryProblems(
            urls,
            telemetryFiles,
            vercelConfig,
            cloudflareHeaders,
        ),
        ...heicProblems(urls, heicFiles, vercelConfig, cloudflareHeaders),
        ...shellRevisionProblems(built, vercelConfig, cloudflareHeaders),
        ...sourceProblems(source),
        ...builtProblems(built),
        ...sourceMapProblems(
            readdirSync(dist, { recursive: true }).map(String),
        ),
    ]
    for (const problem of problems) console.error(`  ${problem}`)
    if (problems.length > 0) process.exit(1)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main()
