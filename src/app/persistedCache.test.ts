import { QueryClient } from "@tanstack/react-query"
import { describe, expect, it, vi } from "vitest"
import { PUBLIC_WINDOW_KIND } from "../features/calendar/publicWindow"
import { createMemoryStorage, type DeviceStorage } from "./deviceStorage"
import { persistQueryCache } from "./persistedCache"

/** A fresh app start: a new query client restored from `storage`. */
function start(storage: DeviceStorage, buildVersion = "v1") {
    const queryClient = new QueryClient()
    persistQueryCache(queryClient, { storage, buildVersion })
    return queryClient
}

describe("persisted query cache", () => {
    it("saves the allow-listed public queries and nothing else", () => {
        const storage = createMemoryStorage()
        const before = start(storage)
        before.setQueryData([PUBLIC_WINDOW_KIND], ["public"])
        before.setQueryData(["my-events"], ["personal"])

        const after = start(storage)

        expect(after.getQueryData([PUBLIC_WINDOW_KIND])).toEqual(["public"])
        expect(after.getQueryData(["my-events"])).toBeUndefined()
    })

    it("keeps when the data was fetched, so restored data is as stale as it is", () => {
        const storage = createMemoryStorage()
        start(storage).setQueryData([PUBLIC_WINDOW_KIND], ["public"], {
            updatedAt: 1234,
        })

        const after = start(storage)

        expect(after.getQueryState([PUBLIC_WINDOW_KIND])?.dataUpdatedAt).toBe(
            1234,
        )
    })

    it("restores another build's data, marked stale so it is revalidated", () => {
        const storage = createMemoryStorage()
        start(storage, "v1").setQueryData([PUBLIC_WINDOW_KIND], ["public"])

        const afterDeploy = start(storage, "v2")

        expect(afterDeploy.getQueryData([PUBLIC_WINDOW_KIND])).toEqual([
            "public",
        ])
        expect(
            afterDeploy.getQueryState([PUBLIC_WINDOW_KIND])?.dataUpdatedAt,
        ).toBe(0)
    })

    it("skips stored data whose shape no longer matches", () => {
        const storage = createMemoryStorage()
        start(storage).setQueryData([PUBLIC_WINDOW_KIND], ["public"])
        // As if an older build wrote it with a different data shape.
        const olderShape: DeviceStorage = {
            ...storage,
            getItem: (key) => {
                const raw = storage.getItem(key)
                if (!raw) return null
                const stored = JSON.parse(raw)
                for (const query of stored.queries) query.shape = "0|old"
                return JSON.stringify(stored)
            },
        }

        expect(
            start(olderShape).getQueryData([PUBLIC_WINDOW_KIND]),
        ).toBeUndefined()
    })

    it("keeps restored queries past the default garbage-collection time", () => {
        vi.useFakeTimers()
        try {
            const storage = createMemoryStorage()
            start(storage).setQueryData([PUBLIC_WINDOW_KIND], ["public"])

            const after = start(storage)
            vi.advanceTimersByTime(60 * 60 * 1000)

            expect(after.getQueryData([PUBLIC_WINDOW_KIND])).toEqual(["public"])
        } finally {
            vi.useRealTimers()
        }
    })

    it("starts empty when storage holds something unreadable", () => {
        const storage = createMemoryStorage()
        start(storage).setQueryData([PUBLIC_WINDOW_KIND], ["public"])
        // Corrupt whatever was written, wherever it was written.
        const corrupting: DeviceStorage = {
            ...storage,
            getItem: (key) => (storage.getItem(key) ? "{not json" : null),
        }

        expect(
            start(corrupting).getQueryData([PUBLIC_WINDOW_KIND]),
        ).toBeUndefined()
    })
})
