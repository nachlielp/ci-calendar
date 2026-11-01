import type { DeviceStorage } from "../../app/deviceStorage"
import {
    DISTRICTS,
    EVENT_TYPES,
    isDistrict,
    isEventType,
} from "../../lib/eventOptions"
import { isMultiDay } from "./eventFormat"
import type { PublicEvent } from "./publicEvent"

// The calendar's event-type and district filters, encoded as the legacy app
// did so shared and bookmarked links keep working: one `f` search param per
// selected value, types and districts mixed (`/?f=jam&f=class&f=center`).

export const FILTER_PARAM = "f"

/** The types offered as filters: all but warmup, as in legacy. */
export const TYPE_FILTERS = EVENT_TYPES.filter((type) => type !== "warmup")

export const DISTRICT_FILTERS = DISTRICTS

/** A value the filters understand (offered or not, e.g. `warmup`). */
export const isFilterValue = (value: string) =>
    isEventType(value) || isDistrict(value)

/** The filters selected in a URL query: known values, each once, in order. */
export function filtersFromSearch(search: string): string[] {
    const values = new URLSearchParams(search).getAll(FILTER_PARAM)
    return [...new Set(values)].filter(isFilterValue)
}

/** `search` with its filters replaced by `filters`; other params are kept. */
export function searchWithFilters(
    search: string,
    filters: readonly string[],
): string {
    const params = new URLSearchParams(search)
    params.delete(FILTER_PARAM)
    for (const value of filters) params.append(FILTER_PARAM, value)
    const query = params.toString()
    return query && `?${query}`
}

/** The types an event is filtered by: its segments', or a multi-day one's. */
const eventTypes = (event: PublicEvent) =>
    isMultiDay(event) ? [event.type] : event.segments.map((s) => s.type)

/**
 * Whether an event passes the filters: with any types selected, one of its
 * types must be among them (a class-and-jam evening matches `jam`); with any
 * districts selected, its district must be among them. No filters, all pass.
 */
export function eventFilter(
    filters: readonly string[],
): (event: PublicEvent) => boolean {
    const types: readonly string[] = filters.filter(isEventType)
    const districts: readonly string[] = filters.filter(isDistrict)
    return (event) =>
        (districts.length === 0 || districts.includes(event.district)) &&
        (types.length === 0 ||
            eventTypes(event).some((type) => types.includes(type)))
}

// The filters last chosen on this device, kept as the legacy app kept them
// (so a returning visitor keeps theirs across the switch): a JSON array of
// types under `eventType` and one of districts under `district`, changed one
// tapped value at a time. Filters that only came from a shared link are
// never saved.

const storageKey = (value: string) =>
    isDistrict(value) ? "district" : "eventType"

function readList(storage: DeviceStorage, key: string): string[] {
    try {
        const value: unknown = JSON.parse(storage.getItem(key) ?? "[]")
        return Array.isArray(value)
            ? value.filter((v): v is string => typeof v === "string")
            : []
    } catch {
        return []
    }
}

/** The filters last chosen on this device: types, then districts. */
export function readStoredFilters(storage: DeviceStorage): string[] {
    const types = readList(storage, "eventType").filter(isEventType)
    const districts = readList(storage, "district").filter(isDistrict)
    return [...new Set([...types, ...districts])]
}

/** Records that the user turned one filter on or off. */
export function storeFilterChange(
    storage: DeviceStorage,
    value: string,
    selected: boolean,
) {
    const key = storageKey(value)
    const others = readList(storage, key).filter((v) => v !== value)
    try {
        storage.setItem(
            key,
            JSON.stringify(selected ? [...others, value] : others),
        )
    } catch {
        // Storage full or blocked: the filters still apply, just not next time.
    }
}
