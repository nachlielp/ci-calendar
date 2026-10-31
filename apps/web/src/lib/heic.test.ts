import { describe, expect, it } from "vitest"
import { ftypBrands, HEIC_HEADER_BYTES, isHeic } from "./heic"

/** A file's first bytes: an `ftyp` box with these brands, zero-padded. */
function header(major: string, ...compatible: string[]): Uint8Array {
    const brands = [major, "\0\0\0\0", ...compatible].join("")
    const size = 8 + brands.length
    const bytes = new Uint8Array(HEIC_HEADER_BYTES)
    new DataView(bytes.buffer).setUint32(0, size)
    bytes.set(
        [...("ftyp" + brands)].map((c) => c.charCodeAt(0)),
        4,
    )
    return bytes
}

const NONE = new Uint8Array(HEIC_HEADER_BYTES)
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, ...NONE]).slice(
    0,
    HEIC_HEADER_BYTES,
)

describe("ftypBrands", () => {
    it("reads the major and compatible brands", () => {
        expect(ftypBrands(header("heic", "mif1", "heic"))).toEqual([
            "heic",
            "mif1",
            "heic",
        ])
    })

    it("is empty for anything else", () => {
        expect(ftypBrands(JPEG)).toEqual([])
        expect(ftypBrands(new Uint8Array(4))).toEqual([])
    })
})

describe("isHeic", () => {
    it("knows HEIC by type", () => {
        for (const type of ["image/heic", "image/heif", "image/HEIC"]) {
            expect(isHeic({ type, name: "x" }, NONE)).toBe(true)
        }
    })

    it("knows HEIC by name when the browser gives no type", () => {
        expect(isHeic({ type: "", name: "IMG_0001.HEIC" }, NONE)).toBe(true)
        expect(isHeic({ type: "", name: "photo.heif" }, NONE)).toBe(true)
    })

    it("knows HEIC by its bytes (an iPhone's, or generic HEIF with a HEVC brand)", () => {
        expect(isHeic({ type: "", name: "x" }, header("heic", "mif1"))).toBe(
            true,
        )
        expect(
            isHeic(
                { type: "image/jpeg", name: "x.jpg" },
                header("mif1", "heic"),
            ),
        ).toBe(true)
        expect(isHeic({ type: "" }, header("hevc"))).toBe(true)
    })

    it("leaves other photos alone, AVIF too (it shares HEIF's generic brand)", () => {
        expect(isHeic({ type: "image/jpeg", name: "me.jpg" }, JPEG)).toBe(false)
        expect(
            isHeic(
                { type: "image/avif", name: "me.avif" },
                header("avif", "mif1", "miaf"),
            ),
        ).toBe(false)
    })
})
