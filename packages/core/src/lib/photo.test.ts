import { describe, expect, it } from "vitest"
import { PHOTO_MAX_SIDE, photoOutputSize, photoPath } from "./photo"

describe("photoOutputSize", () => {
    it("scales a large crop down to the cap", () => {
        expect(photoOutputSize({ width: 3000, height: 3000 })).toEqual({
            width: PHOTO_MAX_SIDE,
            height: PHOTO_MAX_SIDE,
        })
        expect(photoOutputSize({ width: 1200, height: 900 })).toEqual({
            width: 600,
            height: 450,
        })
        expect(photoOutputSize({ width: 900, height: 1801 })).toEqual({
            width: 300,
            height: 600,
        })
    })

    it("never scales up, and keeps whole pixels", () => {
        expect(photoOutputSize({ width: 400, height: 400 })).toEqual({
            width: 400,
            height: 400,
        })
        expect(photoOutputSize({ width: 333.6, height: 333.4 })).toEqual({
            width: 334,
            height: 333,
        })
        expect(photoOutputSize({ width: 6000, height: 1 })).toEqual({
            width: 600,
            height: 1,
        })
    })
})

describe("photoPath", () => {
    it("is legacy's user folder and time, as .jpg", () => {
        const now = new Date("2026-10-30T09:00:00Z")
        expect(photoPath("u1", now)).toBe(`u1/${now.getTime()}.jpg`)
    })
})
