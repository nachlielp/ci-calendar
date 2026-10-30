// Bundle size limit for the public calendar (spec #34).
//
// Reads Vite's build manifest, finds the JavaScript the browser must download
// before `/` can render (the entry plus its static imports), gzips it, and
// fails if the total exceeds `bundleBudget.initialJsGzipKb` in package.json.
// Also reports what each lazy page adds on top, so growth is visible per route.
//
// Usage (after `vite build`): node scripts/bundle-size.mjs

import { readFileSync } from "node:fs"
import { gzipSync } from "node:zlib"
import { fileURLToPath } from "node:url"
import { join } from "node:path"

const ENTRY = "index.html"

/** Manifest keys reachable from `start` through static imports. */
function staticClosure(manifest, start) {
    const seen = new Set()
    const visit = (key) => {
        if (seen.has(key) || !manifest[key]) return
        seen.add(key)
        for (const dep of manifest[key].imports ?? []) visit(dep)
    }
    visit(start)
    return seen
}

const jsFile = (manifest) => (key) => manifest[key].file

/** JS files needed for the initial render of the entry. */
export function initialChunks(manifest) {
    return [...staticClosure(manifest, ENTRY)].map(jsFile(manifest))
}

/** For each lazy entry, the JS files it needs beyond the initial chunks. */
export function lazyChunks(manifest) {
    const initial = staticClosure(manifest, ENTRY)
    const result = {}
    for (const [key, chunk] of Object.entries(manifest)) {
        if (!chunk.isDynamicEntry) continue
        result[key] = [...staticClosure(manifest, key)]
            .filter((dep) => !initial.has(dep))
            .map(jsFile(manifest))
    }
    return result
}

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`

export function checkBudget(gzipBytes, limitKb) {
    const ok = gzipBytes <= limitKb * 1024
    return {
        ok,
        message: ok
            ? `Initial JS for / is ${kb(gzipBytes)} gzip (limit ${limitKb} KB).`
            : `Initial JS for / is ${kb(gzipBytes)} gzip, over the ${limitKb} KB limit by ${kb(gzipBytes - limitKb * 1024)}.`,
    }
}

function main() {
    const root = fileURLToPath(new URL("..", import.meta.url))
    const dist = join(root, "dist")
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"))
    const limitKb = pkg.bundleBudget.initialJsGzipKb
    const manifest = JSON.parse(
        readFileSync(join(dist, ".vite", "manifest.json"), "utf8"),
    )
    const gzipSize = (file) => gzipSync(readFileSync(join(dist, file))).length
    const total = (files) => files.reduce((sum, f) => sum + gzipSize(f), 0)

    console.log("Initial JS for /:")
    for (const file of initialChunks(manifest)) {
        console.log(`  ${kb(gzipSize(file)).padStart(9)}  ${file}`)
    }
    console.log("\nLazy pages (added on top of the initial load):")
    for (const [key, files] of Object.entries(lazyChunks(manifest))) {
        console.log(`  ${kb(total(files)).padStart(9)}  ${key}`)
    }

    const result = checkBudget(total(initialChunks(manifest)), limitKb)
    console.log(`\n${result.message}`)
    if (!result.ok) process.exit(1)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main()
