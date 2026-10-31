import { describe, expect, it } from "vitest"
import { encodeWithinBudget, PHOTO_MAX_BYTES } from "./photoEncoding"

/** An encoder whose output size per quality is given, recording calls. */
function encoder(sizeAt: (quality: number) => number) {
    const calls: [string, number][] = []
    const encode = async (type: string, quality: number) => {
        calls.push([type, quality])
        return new Blob([new Uint8Array(sizeAt(quality))], { type })
    }
    return { calls, encode }
}

describe("encodeWithinBudget", () => {
    it("is JPEG at 0.8 when that fits legacy's 30 KB", async () => {
        const { calls, encode } = encoder(() => 25_000)
        const blob = await encodeWithinBudget(encode)
        expect(blob.type).toBe("image/jpeg")
        expect(calls).toEqual([["image/jpeg", 0.8]])
        expect(PHOTO_MAX_BYTES).toBe(30 * 1024)
    })

    it("steps the quality down while over budget", async () => {
        const fits = encoder((q) => (q > 0.5 ? 50_000 : 29_000))
        expect((await encodeWithinBudget(fits.encode)).size).toBe(29_000)
        expect(fits.calls.map(([, q]) => q)).toEqual([0.8, 0.7, 0.6, 0.5])
    })

    it("stops at 0.1, as legacy did", async () => {
        const never = encoder(() => 200_000)
        expect((await encodeWithinBudget(never.encode)).size).toBe(200_000)
        expect(never.calls.map(([, q]) => q)).toEqual([
            0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1,
        ])
    })
})
