// The service worker precaches index.html with the response headers it was
// served with (the CSP included), revisioned by its content only, so a
// deploy that changed only vercel.json's headers would never reach
// installed apps. The build adds a hash of the header rules to the shell's
// revision (vite.config.ts), and `check:sw` checks it is there.

import { createHash } from "node:crypto"

/** The precached app shell. */
export const SHELL = "index.html"

/** A short hash of vercel.json's header rules (`config` parsed). */
export function headersRevision(config) {
    return createHash("sha256")
        .update(JSON.stringify(config.headers ?? []))
        .digest("hex")
        .slice(0, 12)
}

/** The shell's revision with the headers' hash on: `<content>-h<headers>`. */
function shellRevision(contentRevision, config) {
    return `${contentRevision}-h${headersRevision(config)}`
}

/** Precache entries with the shell's revision covering the headers too. */
export function withHeadersRevision(entries, config) {
    return entries.map((entry) =>
        entry.url === SHELL && entry.revision
            ? { ...entry, revision: shellRevision(entry.revision, config) }
            : entry,
    )
}
