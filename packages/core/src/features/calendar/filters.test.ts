import { describe, expect, it } from "vitest"
import { createMemoryStorage } from "../../app/deviceStorage"
import {
    eventFilter,
    filtersFromSearch,
    readStoredFilters,
    searchWithFilters,
    storeFilterChange,
    TYPE_FILTERS,
} from "./filters"
import { publicEvent } from "../../testing/testEvents"

const segment = (type: string) => ({
    type,
    startTime: "2026-11-01T17:00:00.000Z",
    endTime: "2026-11-01T19:00:00.000Z",
    teachers: [],
    tags: [],
})

const classAndJam = publicEvent({
    district: "center",
    segments: [segment("class"), segment("jam")],
})
const jerusalemJam = publicEvent({
    district: "jerusalem",
    segments: [segment("jam")],
})
const retreat = publicEvent({
    district: "galilee",
    type: "retreat",
    segments: [],
})

const passing = (filters: string[]) =>
    [classAndJam, jerusalemJam, retreat].filter(eventFilter(filters))

describe("eventFilter", () => {
    it("passes every event with no filters", () => {
        expect(passing([])).toEqual([classAndJam, jerusalemJam, retreat])
    })

    it("matches any of a single-day event's segment types", () => {
        expect(passing(["class"])).toEqual([classAndJam])
        expect(passing(["jam"])).toEqual([classAndJam, jerusalemJam])
    })

    it("matches a multi-day event by its own type", () => {
        expect(passing(["retreat"])).toEqual([retreat])
    })

    it("matches warmup, which legacy links carry though it isn't offered", () => {
        const warmup = publicEvent({ segments: [segment("warmup")] })
        expect([warmup, classAndJam].filter(eventFilter(["warmup"]))).toEqual([
            warmup,
        ])
        expect(TYPE_FILTERS).not.toContain("warmup")
    })

    it("passes events of any selected type, or in any selected district", () => {
        expect(passing(["class", "retreat"])).toEqual([classAndJam, retreat])
        expect(passing(["center", "galilee"])).toEqual([classAndJam, retreat])
    })

    it("requires both a selected type and a selected district", () => {
        expect(passing(["jam", "jerusalem"])).toEqual([jerusalemJam])
        expect(passing(["retreat", "center"])).toEqual([])
    })
})

describe("filters in the URL", () => {
    it("reads legacy `f` params, dropping unknown values and repeats", () => {
        expect(
            filtersFromSearch("?f=jam&f=center&f=bogus&f=jam&f=warmup&x=1"),
        ).toEqual(["jam", "center", "warmup"])
        expect(filtersFromSearch("")).toEqual([])
    })

    it("writes one `f` param per filter, keeping other params", () => {
        expect(searchWithFilters("?x=1&f=class", ["jam", "center"])).toBe(
            "?x=1&f=jam&f=center",
        )
        expect(searchWithFilters("?f=class", [])).toBe("")
    })
})

describe("stored filters", () => {
    it("records one change at a time under the legacy keys", () => {
        const storage = createMemoryStorage()
        storeFilterChange(storage, "center", true)
        storeFilterChange(storage, "jam", true)
        storeFilterChange(storage, "class", true)
        storeFilterChange(storage, "jam", false)

        expect(storage.getItem("eventType")).toBe('["class"]')
        expect(storage.getItem("district")).toBe('["center"]')
        expect(readStoredFilters(storage)).toEqual(["class", "center"])
    })

    it("leaves the other stored values alone", () => {
        const storage = createMemoryStorage()
        storage.setItem("eventType", '["class"]')
        storeFilterChange(storage, "retreat", false)
        expect(storage.getItem("eventType")).toBe('["class"]')
    })

    it("reads what the legacy app stored, repeats and junk included", () => {
        const storage = createMemoryStorage()
        storage.setItem("eventType", '["jam","class","jam","center"]')
        storage.setItem("district", "not json")

        expect(readStoredFilters(storage)).toEqual(["jam", "class"])
        expect(readStoredFilters(createMemoryStorage())).toEqual([])
    })
})
