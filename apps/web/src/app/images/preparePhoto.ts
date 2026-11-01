import { HEIC_HEADER_BYTES, isHeic } from "@ci-calendar/core/lib/heic"

/**
 * JPEG quality of a converted HEIC: the cropper's source, cropped and
 * re-encoded within the photo budget after (`renderPhoto`), so close to
 * lossless here.
 */
const CONVERTED_QUALITY = 0.92

async function decodes(image: Blob): Promise<boolean> {
    try {
        const bitmap = await createImageBitmap(image)
        bitmap.close()
        return true
    } catch {
        return false
    }
}

/**
 * The picked photo as the cropper and `renderPhoto` can draw it
 * (`ImageTools.preparePhoto`, ./images.ts): the file itself, unless it is a
 * HEIC/HEIF (`isHeic`) this browser can't decode (all but Safari), which is
 * converted to JPEG by heic-to (libheif in JS, its CSP build: no eval, a
 * `blob:` worker). heic-to is ~780 KB gzip, so it is imported only then, as
 * its own chunk (`HEIC_ASSETS`, never precached). Any other file is passed
 * on as it is, as before.
 */
export async function preparePhoto(file: File): Promise<Blob> {
    const header = new Uint8Array(
        await file.slice(0, HEIC_HEADER_BYTES).arrayBuffer(),
    )
    if (!isHeic(file, header) || (await decodes(file))) return file
    const { heicTo } = await import("heic-to/csp")
    return heicTo({
        blob: file,
        type: "image/jpeg",
        quality: CONVERTED_QUALITY,
    })
}
