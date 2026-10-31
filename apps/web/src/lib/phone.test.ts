import { describe, expect, it } from "vitest"
import { isIsraeliMobile, phoneInput } from "./phone"

describe("phoneInput", () => {
    it("keeps digits, and a plus only at the start", () => {
        expect(phoneInput("050-123 4567")).toBe("0501234567")
        expect(phoneInput("+972 50+1")).toBe("+972501")
        expect(phoneInput("05a")).toBe("05")
        expect(phoneInput("")).toBe("")
    })
})

describe("phone rules", () => {
    it("takes Israeli mobile numbers for role requests", () => {
        expect(isIsraeliMobile("0501234567")).toBe(true)
        expect(isIsraeliMobile("+972501234567")).toBe(true)
        expect(isIsraeliMobile("972501234567")).toBe(true)
        expect(isIsraeliMobile("050123456")).toBe(false)
        expect(isIsraeliMobile("0301234567")).toBe(false)
    })
})
