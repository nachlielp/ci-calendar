// The service worker precaches index.html with the response headers it was
// served with (the CSP included), revisioned by its content only, so a
// deploy that changed only the headers would never reach installed apps.
// The build adds a hash of the header rules, Cloudflare's public/_headers,
// to the shell's revision (vite.config.ts), and `check:sw` checks it is
// there.

import { createHash } from "node:crypto"

/** The precached app shell. */
export const SHELL = "index.html"

/** A short hash of the header rules (`_headers`' text). */
export function headersRevision(headers) {
    return createHash("sha256").update(headers).digest("hex").slice(0, 12)
}

/** The shell's revision with the headers' hash on: `<content>-h<headers>`. */
function shellRevision(contentRevision, headers) {
    return `${contentRevision}-h${headersRevision(headers)}`
}

/** Precache entries with the shell's revision covering the headers too. */
export function withHeadersRevision(entries, headers) {
    return entries.map((entry) =>
        entry.url === SHELL && entry.revision
            ? { ...entry, revision: shellRevision(entry.revision, headers) }
            : entry,
    )
}
