import { describe, it, expect, vi } from "vitest"

// utilService transitively imports the self-initializing `store` singleton and
// the `App` module (for CACHE_VERSION). Until that coupling is removed (#12 /
// #27), stub those two modules so the pure helpers below can be imported and
// exercised in isolation. These mocks should be deleted once utilService no
// longer reaches into the state layer.
vi.mock("../Store/store", () => ({ store: {} }))
vi.mock("../App", () => ({ CACHE_VERSION: "test" }))

import { utilService } from "./utilService"
import { UserType } from "./interfaces"

describe("areArraysEqual", () => {
    it("treats two nullish arrays as equal", () => {
        expect(
            utilService.areArraysEqual(undefined as never, undefined as never),
        ).toBe(true)
    })

    it("is false when only one side is nullish", () => {
        expect(utilService.areArraysEqual(["a"], undefined as never)).toBe(
            false,
        )
    })

    it("ignores order", () => {
        expect(
            utilService.areArraysEqual(["a", "b", "c"], ["c", "a", "b"]),
        ).toBe(true)
    })

    it("is false for different lengths", () => {
        expect(utilService.areArraysEqual(["a"], ["a", "b"])).toBe(false)
    })

    it("is false for same length, different contents", () => {
        expect(utilService.areArraysEqual(["a", "b"], ["a", "c"])).toBe(false)
    })
})

describe("isUUID", () => {
    it("accepts a canonical UUID", () => {
        expect(utilService.isUUID("123e4567-e89b-12d3-a456-426614174000")).toBe(
            true,
        )
    })

    it("rejects non-UUID strings", () => {
        expect(utilService.isUUID("not-a-uuid")).toBe(false)
        expect(utilService.isUUID("123e4567e89b12d3a456426614174000")).toBe(
            false,
        )
        expect(utilService.isUUID("")).toBe(false)
    })
})

describe("removeDuplicates", () => {
    it("keeps only unique values, preserving first-seen order", () => {
        expect(utilService.removeDuplicates(["a", "b", "a", "c", "b"])).toEqual(
            ["a", "b", "c"],
        )
    })

    it("returns an empty array unchanged", () => {
        expect(utilService.removeDuplicates([])).toEqual([])
    })
})

describe("notAUserId", () => {
    it("flags placeholder ids", () => {
        expect(utilService.notAUserId("NON_EXISTENT_teacher_1")).toBe(true)
    })

    it("treats real ids as users", () => {
        expect(
            utilService.notAUserId("123e4567-e89b-12d3-a456-426614174000"),
        ).toBe(false)
    })
})

describe("getUserTypeByRoleId", () => {
    it("maps known role ids to user types", () => {
        expect(utilService.getUserTypeByRoleId("1")).toBe(UserType.admin)
        expect(utilService.getUserTypeByRoleId("2")).toBe(UserType.creator)
        expect(utilService.getUserTypeByRoleId("4")).toBe(UserType.profile)
    })

    it("falls back to a plain user for unknown role ids", () => {
        expect(utilService.getUserTypeByRoleId("999")).toBe(UserType.user)
        expect(utilService.getUserTypeByRoleId("3")).toBe(UserType.user)
    })
})

describe("deepCompare", () => {
    it("compares nested objects by value", () => {
        expect(
            utilService.deepCompare(
                { a: 1, b: { c: 2 } },
                { a: 1, b: { c: 2 } },
            ),
        ).toBe(true)
    })

    it("is false when a nested value differs", () => {
        expect(
            utilService.deepCompare(
                { a: 1, b: { c: 2 } },
                { a: 1, b: { c: 3 } },
            ),
        ).toBe(false)
    })

    it("is false when key sets differ", () => {
        expect(utilService.deepCompare({ a: 1 }, { a: 1, b: 2 })).toBe(false)
    })
})

describe("deepCompareArraysUnordered", () => {
    it("is true for the same primitives in any order", () => {
        expect(
            utilService.deepCompareArraysUnordered([3, 1, 2], [1, 2, 3]),
        ).toBe(true)
    })

    it("is false for different lengths", () => {
        expect(utilService.deepCompareArraysUnordered([1, 2], [1, 2, 3])).toBe(
            false,
        )
    })
})
