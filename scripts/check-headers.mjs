// Security headers check (#17, spec #34): after `vite build`, fails unless
// vercel.json serves every path with the security headers and a
// Content-Security-Policy that parses and stays strict (no 'unsafe-eval', no
// inline scripts but the hashed ones, no bare wildcards or http: sources),
// reports violations to Sentry's security endpoint, and has `sha256-` hashes
// in script-src and style-src that are exactly those of the inline scripts
// and styles in the built index.html (vercel.json is static, so a change to
// them must be copied there: `--write` does it). Production gets that policy
// (every host but `*.vercel.app`); previews get it plus what Vercel's
// toolbar needs (`previewPolicy`, also written by `--write`), and nothing
// else. The origins the build was configured with (Supabase, the Sentry
// DSN, PostHog's hosts), the scripts index.html loads and any assets the
// build inlined as data: URLs must be allowed. The env checks run when the
// variables are set (Vercel builds, local builds with .env); CI has none and
// skips them.
//
// Usage (after `vite build`): node scripts/check-headers.mjs [--write]

import { createHash } from "node:crypto"
import { readdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { loadEnv } from "vite"

const CSP = "Content-Security-Policy"

const ENDPOINTS = "Reporting-Endpoints"

/** Headers every path gets, and what each value must satisfy. */
const REQUIRED_HEADERS = {
    "Strict-Transport-Security": (value) => {
        const maxAge = Number(/max-age=(\d+)/i.exec(value)?.[1] ?? 0)
        if (maxAge < 31536000) return "max-age must be at least a year"
        if (!/includeSubDomains/i.test(value)) return "lacks includeSubDomains"
        return null
    },
    "X-Content-Type-Options": (value) =>
        value === "nosniff" ? null : "must be nosniff",
    "X-Frame-Options": (value) => (value === "DENY" ? null : "must be DENY"),
    "Referrer-Policy": (value) =>
        value === "strict-origin-when-cross-origin"
            ? null
            : "must be strict-origin-when-cross-origin",
    "Permissions-Policy": (value) => {
        const denied = ["camera", "microphone", "geolocation", "payment", "usb"]
        const missing = denied.filter(
            (feature) => !value.includes(`${feature}=()`),
        )
        return missing.length ? `doesn't deny ${missing.join(", ")}` : null
    },
}

/** Directives the policy must set (fetch directives fall back to default-src). */
const REQUIRED_DIRECTIVES = [
    "default-src",
    "script-src",
    "style-src",
    "img-src",
    "font-src",
    "connect-src",
    "worker-src",
    "manifest-src",
    "object-src",
    "base-uri",
    "form-action",
    "frame-ancestors",
    "report-uri",
    "report-to",
]

const KNOWN_DIRECTIVES = new Set([
    ...REQUIRED_DIRECTIVES,
    "child-src",
    "frame-src",
    "media-src",
    "script-src-elem",
    "script-src-attr",
    "style-src-elem",
    "style-src-attr",
    "upgrade-insecure-requests",
])

const KEYWORDS = new Set(["'self'", "'none'", "'strict-dynamic'"])
const HASH = /^'sha256-[A-Za-z0-9+/]+={0,2}'$/
// An https origin, maybe with a leading `*.` label: no paths, no ports.
const HOST = /^https:\/\/(\*\.)?[a-z0-9-]+(\.[a-z0-9-]+)+$/
const SCHEMES = new Set(["blob:", "data:"])
// Where reports go (`report-uri`): an https URL with a path.
const REPORT_URL = /^https:\/\/[a-z0-9.-]+\/\S+$/
// A `Reporting-Endpoints` name (`report-to`).
const ENDPOINT_NAME = /^[a-z0-9_-]+$/i

/**
 * The policy as a map of directive → sources, and what is wrong with its
 * syntax (unknown or repeated directives, sources that aren't allowed).
 */
export function parseCsp(value) {
    const directives = new Map()
    const problems = []
    for (const part of value.split(";")) {
        const [name, ...sources] = part.trim().split(/\s+/)
        if (!name) continue
        if (!KNOWN_DIRECTIVES.has(name))
            problems.push(`unknown directive ${name}`)
        if (directives.has(name)) problems.push(`${name} is set twice`)
        directives.set(name, sources)
        if (name === "report-uri" || name === "report-to") {
            const valid = name === "report-uri" ? REPORT_URL : ENDPOINT_NAME
            if (sources.length !== 1 || !valid.test(sources[0])) {
                problems.push(
                    `${name} must be one ${name === "report-uri" ? "https URL" : "endpoint name"}`,
                )
            }
            continue
        }
        for (const source of sources) {
            if (
                !KEYWORDS.has(source) &&
                !HASH.test(source) &&
                !HOST.test(source) &&
                !SCHEMES.has(source)
            ) {
                problems.push(`${name}: ${source} is not an allowed source`)
            }
        }
        if (sources.includes("'none'") && sources.length > 1) {
            problems.push(`${name}: 'none' with other sources`)
        }
    }
    return { directives, problems }
}

/** Problems with the policy's content: what it must and mustn't allow. */
export function policyProblems(directives) {
    const problems = []
    for (const name of REQUIRED_DIRECTIVES) {
        if (!directives.has(name)) problems.push(`${name} is missing`)
    }
    const expect = (name, sources) => {
        if (
            directives.has(name) &&
            directives.get(name).join(" ") !== sources
        ) {
            problems.push(`${name} must be ${sources}`)
        }
    }
    expect("object-src", "'none'")
    expect("frame-ancestors", "'none'")
    expect("default-src", "'self'")
    for (const name of ["script-src", "script-src-elem", "worker-src"]) {
        if (directives.get(name)?.includes("data:")) {
            problems.push(`${name} allows data: (script injection)`)
        }
    }
    for (const name of ["script-src", "script-src-elem"]) {
        if (directives.get(name)?.includes("blob:")) {
            problems.push(`${name} allows blob:`)
        }
    }
    return problems
}

const sha256 = (text) =>
    `'sha256-${createHash("sha256").update(text, "utf8").digest("base64")}'`

/** Script types the browser doesn't run (data blocks), so CSP ignores. */
const DATA_BLOCK = /^(application\/(ld\+)?json|text\/template)$/i

/**
 * The hashes the inline `<script>`s and `<style>`s of `html` need, and what
 * no hash can allow (inline event handlers, `style` attributes, `javascript:`
 * URLs).
 */
export function inlineHashes(html) {
    const scripts = []
    const styles = []
    const problems = []
    for (const [, tag, attributes, body] of html.matchAll(
        /<(script|style)\b([^>]*)>([\s\S]*?)<\/\1>/gi,
    )) {
        if (tag.toLowerCase() === "style") {
            styles.push(sha256(body))
            continue
        }
        if (/\bsrc\s*=/i.test(attributes)) continue
        const type = /\btype\s*=\s*["']?([^"'\s>]+)/i.exec(attributes)?.[1]
        if (type && DATA_BLOCK.test(type)) continue
        scripts.push(sha256(body))
    }
    const withoutInline = html.replace(
        /<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,
        "",
    )
    if (/<[^>]+\son[a-z]+\s*=/i.test(withoutInline)) {
        problems.push("index.html has an inline event handler (on…=)")
    }
    if (/<[^>]+\sstyle\s*=/i.test(withoutInline)) {
        problems.push("index.html has a style attribute")
    }
    if (/javascript:/i.test(withoutInline)) {
        problems.push("index.html has a javascript: URL")
    }
    return { scripts, styles, problems }
}

/** Problems with `directive`'s hashes against those the page needs. */
export function hashProblems(directives, directive, needed) {
    const listed = (directives.get(directive) ?? []).filter((source) =>
        HASH.test(source),
    )
    return [
        ...needed
            .filter((hash) => !listed.includes(hash))
            .map(
                (hash) =>
                    `${directive} lacks ${hash} (index.html's inline code changed; run node scripts/check-headers.mjs --write)`,
            ),
        ...listed
            .filter((hash) => !needed.includes(hash))
            .map(
                (hash) =>
                    `${directive} has ${hash}, which nothing in index.html needs`,
            ),
    ]
}

/**
 * Sentry's security endpoint for the project of `dsn`, which takes CSP
 * reports: `https://<host>/api/<project>/security/?sentry_key=<public key>`,
 * tagged with `environment`.
 */
export function sentryReportUrl(dsn, environment) {
    const url = new URL(dsn)
    const project = url.pathname.split("/").filter(Boolean).pop()
    return `https://${url.host}/api/${project}/security/?sentry_key=${url.username}&sentry_environment=${environment}`
}

/**
 * Problems with where `directives` report to: `report-to` must name the
 * `Reporting-Endpoints` entry whose URL is `report-uri`'s (older browsers
 * use that), a Sentry security endpoint for `environment`, and when the
 * build's `dsn` is known, its project's.
 */
export function reportingProblems(directives, endpoints, { dsn, environment }) {
    const uri = directives.get("report-uri")?.[0]
    const name = directives.get("report-to")?.[0]
    if (!uri || !name) return []
    const problems = []
    const listed = new Map(
        [...(endpoints ?? "").matchAll(/([a-z0-9_-]+)="([^"]+)"/gi)].map(
            ([, key, url]) => [key, url],
        ),
    )
    if (listed.get(name) !== uri) {
        problems.push(`${ENDPOINTS} must map ${name} to report-uri's URL`)
    }
    const sentry =
        /^https:\/\/[a-z0-9.-]+\/api\/\d+\/security\/\?sentry_key=[0-9a-f]+&sentry_environment=([a-z]+)$/.exec(
            uri,
        )
    if (!sentry) problems.push("report-uri is not a Sentry security endpoint")
    else if (sentry[1] !== environment) {
        problems.push(`report-uri must report as ${environment}`)
    }
    if (dsn && uri !== sentryReportUrl(dsn, environment)) {
        problems.push(`report-uri isn't the Sentry DSN's (from the env)`)
    }
    return problems
}

/**
 * What previews add for Vercel's toolbar (vercel.com/docs/vercel-toolbar/
 * managing-toolbar, "Using a Content Security Policy"). `'unsafe-inline'`
 * is ignored next to a hash, so previews drop the style hashes for it.
 */
const TOOLBAR = {
    "script-src": ["https://vercel.live"],
    "style-src": ["https://vercel.live", "'unsafe-inline'"],
    "img-src": ["https://vercel.live", "https://vercel.com", "data:"],
    "font-src": ["https://vercel.live", "https://assets.vercel.com"],
    "connect-src": ["https://vercel.live", "wss://ws-us3.pusher.com"],
    "frame-src": ["https://vercel.live"],
}

/** Production's policy as previews get it: the toolbar's sources added. */
export function previewPolicy(production) {
    return production
        .split(";")
        .map((part) => {
            let [name, ...sources] = part.trim().split(/\s+/)
            if (name === "style-src") {
                sources = sources.filter((source) => !HASH.test(source))
            }
            if (name === "report-uri") {
                sources = sources.map((url) =>
                    url.replace(
                        "sentry_environment=production",
                        "sentry_environment=preview",
                    ),
                )
            }
            const added = TOOLBAR[name] ?? []
            sources = [
                ...sources.filter(
                    (source) => source !== "'none'" || !added.length,
                ),
                ...added.filter((source) => !sources.includes(source)),
            ]
            return [name, ...sources].join(" ")
        })
        .join("; ")
}

/** Production's `Reporting-Endpoints` as previews get it. */
export const previewEndpoints = (production) =>
    production.replaceAll(
        "sentry_environment=production",
        "sentry_environment=preview",
    )

/** The host condition that tells previews (`*.vercel.app`) apart. */
const PREVIEW_HOST = JSON.stringify([
    { type: "host", value: { suf: ".vercel.app" } },
])

/**
 * vercel.json's rules for every path: `common` (the headers every host
 * gets), `production` (the policy for every host but previews') and
 * `preview` (`*.vercel.app`'s). Exactly one of the policy rules matches a
 * request, so no header is ever sent twice.
 */
export function rulesOf(config) {
    const all = (config.headers ?? []).filter((rule) => rule.source === "/(.*)")
    const condition = (rule) => JSON.stringify(rule.has ?? rule.missing ?? null)
    return {
        common: all.find((rule) => !rule.has && !rule.missing),
        production: all.find(
            (rule) =>
                rule.missing && !rule.has && condition(rule) === PREVIEW_HOST,
        ),
        preview: all.find(
            (rule) =>
                rule.has && !rule.missing && condition(rule) === PREVIEW_HOST,
        ),
    }
}

const valueOf = (rule, key) =>
    rule?.headers.find((header) => header.key === key)?.value

/**
 * `vercel.json`'s text with production's hashes replaced by `scripts`/
 * `styles` and previews' policy and endpoints made from production's (the
 * rest of the file as it was).
 */
export function withPolicies(configText, { scripts, styles }) {
    const { production, preview } = rulesOf(JSON.parse(configText))
    const policy = valueOf(production, CSP)
    if (!policy) return configText
    const next = policy
        .split(";")
        .map((part) => {
            const [name, ...sources] = part.trim().split(/\s+/)
            const hashes = { "script-src": scripts, "style-src": styles }[name]
            if (!hashes) return part.trim()
            const kept = sources.filter((source) => !HASH.test(source))
            // Hashes right after the keywords, before the hosts.
            const keywords = kept.filter((source) => source.startsWith("'"))
            const rest = kept.filter((source) => !source.startsWith("'"))
            return [name, ...keywords, ...hashes, ...rest].join(" ")
        })
        .join("; ")
    const replace = (from, to) => {
        if (from !== undefined && from !== to) {
            configText = configText.replace(
                JSON.stringify(from),
                JSON.stringify(to),
            )
        }
    }
    replace(policy, next)
    replace(valueOf(preview, CSP), previewPolicy(next))
    const endpoints = valueOf(production, ENDPOINTS)
    if (endpoints)
        replace(valueOf(preview, ENDPOINTS), previewEndpoints(endpoints))
    return configText
}

/**
 * Where PostHog sends events and loads its scripts from, as posthog-js
 * works it out from `api_host` (its RequestRouter): the US and EU clouds
 * get `<region>.i.posthog.com` and `<region>-assets.i.posthog.com`, any
 * other host (a reverse proxy) both.
 */
export function posthogOrigins(host) {
    const origin = new URL(host).origin
    const region = /^https:\/\/(app|us|us-assets)(\.i)?\.posthog\.com$/i.test(
        origin,
    )
        ? "us"
        : /^https:\/\/(eu|eu-assets)(\.i)?\.posthog\.com$/i.test(origin)
          ? "eu"
          : null
    return region
        ? {
              api: `https://${region}.i.posthog.com`,
              assets: `https://${region}-assets.i.posthog.com`,
          }
        : { api: origin, assets: origin }
}

/** Unset, or set to the strings the app treats as unset. */
const present = (value) =>
    value && value !== "null" && value !== "undefined" ? value : undefined

/**
 * The origins the build's configuration makes the app use, each with the
 * directives that must allow it. Variables that aren't set are skipped
 * (listed in `skipped`).
 */
export function configuredOrigins(env) {
    const needs = []
    const skipped = []
    const supabase = present(env.VITE_SUPABASE_URL)
    if (supabase) {
        const origin = new URL(supabase).origin
        // REST, auth, functions and storage uploads; bio photos.
        needs.push({
            origin,
            directives: ["connect-src", "img-src"],
            what: "Supabase",
        })
    } else skipped.push("VITE_SUPABASE_URL")
    const dsn = present(env.VITE_SENTRY_DSN)
    if (dsn) {
        needs.push({
            origin: `https://${new URL(dsn).host}`,
            directives: ["connect-src"],
            what: "Sentry ingest",
        })
    } else skipped.push("VITE_SENTRY_DSN")
    if (present(env.VITE_PUBLIC_POSTHOG_KEY)) {
        const { api, assets } = posthogOrigins(
            present(env.VITE_PUBLIC_POSTHOG_HOST) ?? "https://app.posthog.com",
        )
        needs.push({
            origin: api,
            directives: ["connect-src"],
            what: "PostHog",
        })
        needs.push({
            origin: assets,
            directives: ["script-src", "connect-src"],
            what: "PostHog assets",
        })
    } else skipped.push("VITE_PUBLIC_POSTHOG_KEY")
    return { needs, skipped }
}

/** The external scripts index.html's inline code loads (its https `…/js` URLs). */
export function indexScriptOrigins(html) {
    const origins = new Set()
    for (const [, body] of html.matchAll(
        /<script\b[^>]*>([\s\S]*?)<\/script>/gi,
    )) {
        for (const [url] of body.matchAll(/https:\/\/[^"'\s]+/g)) {
            if (/(\.js|\/js)(\?|$)/.test(url)) origins.add(new URL(url).origin)
        }
    }
    return [...origins]
}

/** Whether `directive`'s sources allow `origin` (exact or `*.` match). */
export function allows(directives, directive, origin) {
    const sources =
        directives.get(directive) ?? directives.get("default-src") ?? []
    const host = new URL(origin).host
    return sources.some((source) => {
        if (source === origin) return true
        const wildcard = /^https:\/\/\*\.(.+)$/.exec(source)
        return (
            !!wildcard &&
            origin.startsWith("https://") &&
            host.endsWith(`.${wildcard[1]}`)
        )
    })
}

/**
 * Problems with assets the build inlined as `data:` URLs (Vite inlines
 * small imported images and fonts), which `img-src`/`font-src` must then
 * allow. `files` are the build's JS and CSS, as `{ name, text }`.
 */
export function dataUrlProblems(directives, files) {
    const problems = []
    for (const [pattern, directive] of [
        // A CSS `url(data:…)` or a JS string that is a whole data: URL (what
        // Vite emits), not code building one (auth-js's MFA QR code).
        [
            /url\(\s*["']?data:image\/|["'`]data:image\/[\w+.-]+(;base64)?,/,
            "img-src",
        ],
        [
            /url\(\s*["']?data:(font|application\/(x-)?font)|["'`]data:font\/[\w+.-]+(;base64)?,/,
            "font-src",
        ],
    ]) {
        const sources = directives.get(directive) ?? []
        for (const { name, text } of files) {
            if (pattern.test(text) && !sources.includes("data:")) {
                problems.push(
                    `${name} inlines a data: URL, which ${directive} doesn't allow`,
                )
            }
        }
    }
    return problems
}

/** Problems with the header rules of `config` (vercel.json). */
export function headerProblems(config) {
    const { common, production, preview } = rulesOf(config)
    if (!common)
        return ['vercel.json has no header rule for every path ("/(.*)")']
    const problems = []
    if (!production || !preview) {
        problems.push(
            "vercel.json needs a policy rule for production (missing host .vercel.app) and one for previews (has it)",
        )
    }
    const values = new Map(common.headers.map(({ key, value }) => [key, value]))
    for (const [key, check] of Object.entries(REQUIRED_HEADERS)) {
        if (!values.has(key)) problems.push(`${key} is missing`)
        else {
            const problem = check(values.get(key))
            if (problem) problems.push(`${key} ${problem}`)
        }
    }
    for (const key of [CSP, ENDPOINTS]) {
        if (values.has(key)) problems.push(`${key} belongs in the policy rules`)
        for (const [rule, what] of [
            [production, "production"],
            [preview, "preview"],
        ]) {
            if (rule && !valueOf(rule, key))
                problems.push(`${what} has no ${key}`)
        }
    }
    if (production && preview) {
        const policy = valueOf(production, CSP) ?? ""
        const endpoints = valueOf(production, ENDPOINTS) ?? ""
        if (valueOf(preview, CSP) !== previewPolicy(policy)) {
            problems.push(
                "the preview policy isn't production's plus the toolbar's (run --write)",
            )
        }
        if (valueOf(preview, ENDPOINTS) !== previewEndpoints(endpoints)) {
            problems.push(
                `the preview ${ENDPOINTS} isn't production's (run --write)`,
            )
        }
    }
    return problems
}

/** The build's JS and CSS (telemetry chunks included), as `{ name, text }`. */
function builtFiles(assets) {
    return readdirSync(assets, { recursive: true })
        .map(String)
        .filter((name) => /\.(js|css)$/.test(name))
        .map((name) => ({
            name: `assets/${name}`,
            text: readFileSync(join(assets, name), "utf8"),
        }))
}

function main() {
    const root = fileURLToPath(new URL("..", import.meta.url))
    const configPath = join(root, "vercel.json")
    const html = readFileSync(join(root, "dist/index.html"), "utf8")
    const inline = inlineHashes(html)
    if (process.argv.includes("--write")) {
        const text = readFileSync(configPath, "utf8")
        writeFileSync(configPath, withPolicies(text, inline))
        console.log(
            "Wrote index.html's hashes and the preview policy to vercel.json.",
        )
    }
    const config = JSON.parse(readFileSync(configPath, "utf8"))
    const problems = headerProblems(config)
    const production = rulesOf(config).production
    const policy = valueOf(production, CSP)
    if (policy) {
        const env = { ...loadEnv("production", root, "VITE_"), ...process.env }
        const { directives, problems: syntax } = parseCsp(policy)
        problems.push(
            ...syntax,
            ...policyProblems(directives),
            ...inline.problems,
            ...hashProblems(directives, "script-src", inline.scripts),
            ...hashProblems(directives, "style-src", inline.styles),
            ...dataUrlProblems(
                directives,
                builtFiles(join(root, "dist/assets")),
            ),
            ...reportingProblems(directives, valueOf(production, ENDPOINTS), {
                dsn: present(env.VITE_SENTRY_DSN),
                environment: "production",
            }),
        )
        for (const origin of indexScriptOrigins(html)) {
            if (!allows(directives, "script-src", origin)) {
                problems.push(
                    `script-src doesn't allow ${origin} (index.html loads it)`,
                )
            }
        }
        const { needs, skipped } = configuredOrigins(env)
        for (const { origin, directives: names, what } of needs) {
            for (const name of names) {
                if (!allows(directives, name, origin)) {
                    problems.push(
                        `${name} doesn't allow ${origin} (${what}, from the env)`,
                    )
                }
            }
        }
        console.log(
            `CSP: ${directives.size} directives, ${inline.scripts.length} inline script and ${inline.styles.length} inline style hashes, ${needs.length} configured origins checked; preview policy matches.` +
                (skipped.length
                    ? ` Unset, not checked: ${skipped.join(", ")}.`
                    : ""),
        )
    }
    for (const problem of problems) console.error(`  ${problem}`)
    if (problems.length > 0) process.exit(1)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main()
