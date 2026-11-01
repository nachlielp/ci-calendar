import { describe, expect, it } from "vitest"
import { isDistrict, isEventType, normaliseMultiDayType } from "./eventOptions"

describe("event options", () => {
    it("knows the legacy types and districts", () => {
        expect(isEventType("warmup")).toBe(true)
        expect(isEventType("center")).toBe(false)
        expect(isDistrict("pardesHanna")).toBe(true)
        expect(isDistrict("north")).toBe(false)
    })

    it("reads legacy Hebrew multi-day types as their values", () => {
        expect(normaliseMultiDayType("ריטריט")).toBe("retreat")
        expect(normaliseMultiDayType("קורס")).toBe("course")
        expect(normaliseMultiDayType("סדנה")).toBe("workshop")
        expect(normaliseMultiDayType("retreat")).toBe("retreat")
        expect(normaliseMultiDayType("constructor")).toBe("constructor")
        expect(normaliseMultiDayType("")).toBe("")
    })
})
