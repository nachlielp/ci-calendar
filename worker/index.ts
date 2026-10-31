import { createWorker, type WorkerEnv } from "./app"

// The Worker's entry (wrangler.jsonc `main`): worker/app.ts bound to
// Cloudflare's per-data-centre cache, clock and `fetch`.

const handle = createWorker({
    cache: {
        match: (key) => caches.default.match(key),
        put: (key, response) => caches.default.put(key, response),
    },
    now: () => new Date(),
    fetch: (...args) => fetch(...args),
})

export default {
    fetch(request, env, ctx) {
        return handle(request, env, (work) => ctx.waitUntil(work))
    },
} satisfies ExportedHandler<WorkerEnv>
