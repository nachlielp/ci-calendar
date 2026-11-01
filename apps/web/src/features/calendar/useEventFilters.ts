import { useCallback, useEffect, useMemo } from "react"
import { useLocation, useNavigate } from "react-router"
import { useServices } from "../../app/services"
import {
    filtersFromSearch,
    readStoredFilters,
    searchWithFilters,
    storeFilterChange,
} from "@ci-calendar/core/features/calendar/filters"

/**
 * The calendar's selected filters, kept in the URL (`f`). As in the legacy
 * app, `/` with no query at all restores the filters last chosen on this
 * device: they apply on the first render and are written into the URL.
 * Other pages (`/event/:id`) and queries (`/?utm_source=…`) don't.
 *
 * Turning a filter on or off updates the URL in place (no history entry) and
 * records that one change for next time, so a shared link's filters are
 * only saved once the user taps them.
 *
 * `filters` keeps its identity while the selected values stay the same
 * (other params, opening an event, the restore itself), so lists derived
 * from it aren't refiltered.
 */
export function useEventFilters() {
    const { storage } = useServices()
    const { pathname, search } = useLocation()
    const navigate = useNavigate()
    const restoring = pathname === "/" && search === ""

    const key = (
        restoring ? readStoredFilters(storage) : filtersFromSearch(search)
    ).join("&")
    const filters = useMemo(() => (key ? key.split("&") : []), [key])

    useEffect(() => {
        if (restoring && filters.length > 0) {
            void navigate(
                { search: searchWithFilters("", filters) },
                { replace: true },
            )
        }
    }, [restoring, filters, navigate])

    const showFilters = useCallback(
        (next: readonly string[]) =>
            void navigate(
                { search: searchWithFilters(search, next) },
                { replace: true },
            ),
        [search, navigate],
    )

    const setFilter = useCallback(
        (value: string, selected: boolean) => {
            storeFilterChange(storage, value, selected)
            const others = filters.filter((v) => v !== value)
            showFilters(selected ? [...others, value] : others)
        },
        [storage, filters, showFilters],
    )

    const clearFilters = useCallback(() => {
        for (const value of filters) storeFilterChange(storage, value, false)
        showFilters([])
    }, [storage, filters, showFilters])

    return { filters, setFilter, clearFilters }
}
