import { QueryClient } from "@tanstack/react-query"
import { publicWindowQuery } from "../features/calendar/publicWindow"
import type { AppServices } from "./services"

export function createQueryClient(): QueryClient {
    // Retries live here, in one place: the PostgREST client has its own
    // retries turned off (see data/client.ts) so the two never multiply.
    return new QueryClient({ defaultOptions: { queries: { retry: 2 } } })
}

/**
 * Starts the calendar request before React renders anything — and without
 * waiting on auth — so the network and the first render overlap. The page's
 * `useQuery` then picks up this same request instead of sending its own.
 */
export function prefetchAtBoot(
    queryClient: QueryClient,
    services: AppServices,
) {
    void queryClient.prefetchQuery(publicWindowQuery(services))
}
