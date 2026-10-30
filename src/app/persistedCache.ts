import type { QueryClient, QueryKey } from "@tanstack/react-query"
import {
    PUBLIC_WINDOW_KIND,
    PUBLIC_WINDOW_SHAPE,
} from "../features/calendar/publicWindow"
import type { AppServices } from "./services"

// Saves chosen queries to device storage so a repeat visit (or an offline
// one) renders at once from the last data seen, then revalidates.
//
// Hand-rolled instead of @tanstack/react-query-persist-client: storage is
// synchronous, so the cache is restored before the first render (no
// "restoring" state to handle), and the whole thing is a few dozen lines.

/** Rename (e.g. `:v2`) if `StoredCache` itself ever changes shape. */
const STORAGE_KEY = "ci-calendar:query-cache:v1"

/** The legacy client's data caches, replaced by this one. */
const LEGACY_KEYS = ["events", "bios"]

/**
 * The query kinds (first element of the query key) saved to the device, each
 * with the shape of its data. Stored data is restored only while its shape
 * still matches, so changing a kind's data shape must change its shape value.
 *
 * Public data only: personal and admin queries must never be added here, so
 * nothing private survives on a shared phone.
 */
const PERSISTED_SHAPES: Readonly<Record<string, string>> = {
    [PUBLIC_WINDOW_KIND]: PUBLIC_WINDOW_SHAPE,
}

interface StoredCache {
    /** The build that wrote it. Another build's data is restored as stale. */
    buildVersion: string
    queries: StoredQuery[]
}

interface StoredQuery {
    queryKey: QueryKey
    /** `PERSISTED_SHAPES` of the kind, as of the build that wrote it. */
    shape: string
    data: unknown
    dataUpdatedAt: number
}

function persistedShape(queryKey: QueryKey): string | undefined {
    const kind = queryKey[0]
    return typeof kind === "string" && Object.hasOwn(PERSISTED_SHAPES, kind)
        ? PERSISTED_SHAPES[kind]
        : undefined
}

const isPersistedKey = (queryKey: QueryKey) =>
    persistedShape(queryKey) !== undefined

/**
 * Restores the persisted queries into `queryClient`, then keeps storage in
 * step with every successful fetch or write of a persisted query.
 *
 * Restored data keeps its fetch time, so it is as stale as it really is. Data
 * from another build (a deploy since) is still shown, since it may be all an
 * offline visitor has, but marked stale so it is revalidated. Persisted kinds
 * are never garbage-collected: a dropped query would vanish from storage on
 * the next write. Returns a function that stops saving.
 */
export function persistQueryCache(
    queryClient: QueryClient,
    { storage, buildVersion }: Pick<AppServices, "storage" | "buildVersion">,
): () => void {
    for (const key of LEGACY_KEYS) {
        attempt(() => storage.removeItem(key))
    }
    for (const kind of Object.keys(PERSISTED_SHAPES)) {
        queryClient.setQueryDefaults([kind], { gcTime: Infinity })
    }

    const stored = readStored(storage)
    const sameBuild = stored?.buildVersion === buildVersion
    for (const query of stored?.queries ?? []) {
        queryClient.setQueryData(query.queryKey, query.data, {
            updatedAt: sameBuild ? query.dataUpdatedAt : 0,
        })
    }

    const cache = queryClient.getQueryCache()
    return cache.subscribe((event) => {
        if (
            event.type !== "updated" ||
            event.action.type !== "success" ||
            !isPersistedKey(event.query.queryKey)
        ) {
            return
        }
        const next: StoredCache = {
            buildVersion,
            queries: cache
                .findAll({
                    predicate: (query) =>
                        isPersistedKey(query.queryKey) &&
                        query.state.data !== undefined,
                })
                .map((query) => ({
                    queryKey: query.queryKey,
                    shape: persistedShape(query.queryKey)!,
                    data: query.state.data,
                    dataUpdatedAt: query.state.dataUpdatedAt,
                })),
        }
        // Storage full or blocked: the next visit just loads normally.
        attempt(() => storage.setItem(STORAGE_KEY, JSON.stringify(next)))
    })
}

/**
 * The stored cache, keeping only queries of a persisted kind whose shape
 * still matches. Undefined if there is none or it is unreadable (corrupt
 * JSON, blocked storage); the next save overwrites it.
 */
function readStored(storage: AppServices["storage"]): StoredCache | undefined {
    try {
        const raw = storage.getItem(STORAGE_KEY)
        if (!raw) return undefined
        const stored = JSON.parse(raw) as StoredCache
        return {
            buildVersion: stored.buildVersion,
            queries: stored.queries.filter(
                (query) =>
                    Array.isArray(query.queryKey) &&
                    persistedShape(query.queryKey) === query.shape,
            ),
        }
    } catch {
        return undefined
    }
}

/** Device storage may throw (full, blocked); none of its writes are vital. */
function attempt(write: () => void) {
    try {
        write()
    } catch {
        // Nothing to do: the app works without them.
    }
}
