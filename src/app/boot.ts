import { onlineManager, QueryClient } from "@tanstack/react-query"
import { publicWindowQuery } from "../features/calendar/publicWindow"
import { persistQueryCache } from "./persistedCache"
import type { AppServices } from "./services"

export function createQueryClient(): QueryClient {
    // Retries live here, in one place: the PostgREST client has its own
    // retries turned off (see data/client.ts) so the two never multiply.
    return new QueryClient({ defaultOptions: { queries: { retry: 2 } } })
}

/**
 * Readies the query cache before React renders anything:
 *
 * 1. Restores the persisted cache from device storage, so a repeat visit
 *    renders the last events seen with no loading state.
 * 2. Starts the calendar request — without waiting on auth, and even when the
 *    restored data is fresh, because a cold start always revalidates — so
 *    the network and the first render overlap. The page's `useQuery` picks up
 *    this same request instead of sending its own.
 */
export function bootQueryClient(
    queryClient: QueryClient,
    services: AppServices,
) {
    // TanStack assumes it starts online; a cold start without a connection
    // should pause the request and show the offline notice instead.
    onlineManager.setOnline(navigator.onLine)
    persistQueryCache(queryClient, services)
    void queryClient.prefetchQuery({
        ...publicWindowQuery(services),
        staleTime: 0,
    })
}
