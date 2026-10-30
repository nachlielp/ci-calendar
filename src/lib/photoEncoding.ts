// How a resized bio photo is encoded (see ./photo.ts for the size). Kept
// apart so it travels with the canvas code (the cropper's chunk), not with
// the bio page.
//
// JPEG, as legacy uploaded: the bucket's allowed types can't be checked
// from the repo, and legacy's JPEG (sent as `image/jpg`) is the one type
// known to be accepted. Legacy's budget too: 30 KB, the quality lowered
// from 0.8 by 0.1 until the photo fits, down to 0.1 as legacy went. At
// 600px (legacy drew 800px) a photo fits at a higher quality than legacy's.

/** Legacy's `MAX_FILE_SIZE`: the quality steps down until under it. */
export const PHOTO_MAX_BYTES = 30 * 1024

export const PHOTO_QUALITY = 0.8
export const PHOTO_MIN_QUALITY = 0.1
const QUALITY_STEP = 0.1

/** What the canvas encodes (uploaded as `PHOTO_CONTENT_TYPE`, ./photo.ts). */
export const PHOTO_ENCODING = "image/jpeg"

/**
 * Encodes as JPEG at `PHOTO_QUALITY`, then lowers the quality a step at a
 * time while the result is over `maxBytes`, down to `PHOTO_MIN_QUALITY`.
 * Returns the last encoding.
 */
export async function encodeWithinBudget(
    encode: (type: string, quality: number) => Promise<Blob>,
    maxBytes = PHOTO_MAX_BYTES,
): Promise<Blob> {
    let quality = PHOTO_QUALITY
    let blob = await encode(PHOTO_ENCODING, quality)
    // Rounded, so 0.8 - 7 × 0.1 reaches 0.1 exactly.
    const lower = (q: number) => Math.round((q - QUALITY_STEP) * 10) / 10
    while (blob.size > maxBytes && lower(quality) >= PHOTO_MIN_QUALITY) {
        quality = lower(quality)
        blob = await encode(PHOTO_ENCODING, quality)
    }
    return blob
}
