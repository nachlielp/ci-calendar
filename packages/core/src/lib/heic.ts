// Telling a picked photo is HEIC/HEIF (iPhones' default format), which only
// Safari decodes: elsewhere app/images/preparePhoto.ts converts it to JPEG
// before the cropper shows it. Pure, so the bytes and names are tested here.

/** How many bytes from the file's start `isHeic` needs (the `ftyp` box). */
export const HEIC_HEADER_BYTES = 64

const HEIC_TYPES = new Set([
    "image/heic",
    "image/heif",
    "image/heic-sequence",
    "image/heif-sequence",
])

const HEIC_EXTENSION = /\.(heic|heif)$/i

/**
 * The HEVC brands of the `ftyp` box. Not the generic HEIF ones (`mif1`,
 * `msf1`): AVIF carries those too, and the browsers that don't decode HEIC
 * do decode AVIF.
 */
const HEIC_BRANDS = new Set([
    "heic",
    "heix",
    "heim",
    "heis",
    "hevc",
    "hevx",
    "hevm",
    "hevs",
])

function ascii(bytes: Uint8Array, start: number): string {
    return String.fromCharCode(...bytes.subarray(start, start + 4))
}

/**
 * The brands of an ISO-BMFF file's leading `ftyp` box (major and
 * compatible), or none when `header` doesn't start with one.
 */
export function ftypBrands(header: Uint8Array): string[] {
    if (header.length < 16 || ascii(header, 4) !== "ftyp") return []
    const view = new DataView(header.buffer, header.byteOffset)
    const size = Math.min(view.getUint32(0), header.length)
    const brands = [ascii(header, 8)]
    // Bytes 12–16 are the minor version.
    for (let at = 16; at + 4 <= size; at += 4) brands.push(ascii(header, at))
    return brands
}

/**
 * Whether a picked file is HEIC/HEIF: by its type or name (what the browser
 * says, when it knows), else by its first bytes (`header`, at least
 * `HEIC_HEADER_BYTES` of them), since Chrome and Firefox often give a HEIC
 * no type, and a renamed one keeps its bytes.
 */
export function isHeic(
    file: { type: string; name?: string },
    header: Uint8Array,
): boolean {
    if (HEIC_TYPES.has(file.type.toLowerCase())) return true
    if (file.name && HEIC_EXTENSION.test(file.name)) return true
    return ftypBrands(header).some((brand) => HEIC_BRANDS.has(brand))
}

/** What the photo input accepts: any image, and HEIC by name (Windows
 * doesn't count a `.heic` as an image unless a codec is installed). */
export const PHOTO_ACCEPT = "image/*,.heic,.heif"
