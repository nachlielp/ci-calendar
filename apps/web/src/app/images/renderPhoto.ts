import type { PixelArea, Size } from "../../lib/photo"
import { encodeWithinBudget } from "../../lib/photoEncoding"

/**
 * The crop drawn at its upload size and encoded (`ImageTools.renderPhoto`,
 * ./images.ts). The image is decoded with `createImageBitmap` (EXIF
 * orientation applied, as the cropper's `<img>` shows it) and drawn once,
 * straight from the crop to the output size; no data URL is ever made.
 */
export async function renderPhoto(
    image: Blob,
    area: PixelArea,
    size: Size,
): Promise<Blob> {
    const bitmap = await createImageBitmap(image)
    try {
        const canvas = document.createElement("canvas")
        canvas.width = size.width
        canvas.height = size.height
        const context = canvas.getContext("2d")
        if (!context) throw new Error("No 2d context")
        context.imageSmoothingQuality = "high"
        context.drawImage(
            bitmap,
            area.x,
            area.y,
            area.width,
            area.height,
            0,
            0,
            size.width,
            size.height,
        )
        return await encodeWithinBudget(
            (type, quality) =>
                new Promise((resolve, reject) =>
                    canvas.toBlob(
                        (blob) =>
                            blob ? resolve(blob) : reject(new Error("toBlob")),
                        type,
                        quality,
                    ),
                ),
        )
    } finally {
        bitmap.close()
    }
}
