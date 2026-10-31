// How an uploaded bio photo is sized and encoded (spec #34: "uploaded bio
// photos are resized to a capped size on the client before upload"). Pure,
// so the browser's canvas code (app/images/renderPhoto.ts) only draws and
// encodes what these and ./photoEncoding.ts decide.
//
// Legacy scaled the crop to at most 800px and re-encoded it as JPEG,
// lowering the quality from 0.7 by 0.1 until it was under 30 KB (down to
// 0.1: a smeared photo). Bio photos are shown at 250 CSS px (the bio card),
// so 600px covers screens up to 2.4x, and fits legacy's 30 KB at a better
// quality than 800px did (./photoEncoding.ts keeps legacy's JPEG budget).

/** The longest side of an uploaded photo, in pixels. */
export const PHOTO_MAX_SIDE = 600

export interface Size {
    width: number
    height: number
}

/** A rectangle of the decoded image, in its pixels (the cropper's area). */
export interface PixelArea extends Size {
    x: number
    y: number
}

/**
 * The size to draw `area` at: scaled down so its longer side is at most
 * `maxSide`, never up, in whole pixels (at least 1).
 */
export function photoOutputSize(area: Size, maxSide = PHOTO_MAX_SIDE): Size {
    const scale = Math.min(1, maxSide / Math.max(area.width, area.height))
    return {
        width: Math.max(1, Math.round(area.width * scale)),
        height: Math.max(1, Math.round(area.height * scale)),
    }
}

/**
 * The content type photos are uploaded with: legacy's `image/jpg` (not the
 * standard `image/jpeg`), deliberately, because it is the one type known to
 * pass the bucket's allowed types (see the maintainer notes in
 * docs/architecture.md). The bytes are JPEG.
 */
export const PHOTO_CONTENT_TYPE = "image/jpg"

/**
 * Where a user's new photo goes in the bucket: legacy's
 * `<user id>/<milliseconds>` (each upload a new name, so a cached copy of
 * the old photo is never overwritten under anyone), as `.jpg`.
 */
export function photoPath(userId: string, now: Date): string {
    return `${userId}/${now.getTime()}.jpg`
}
