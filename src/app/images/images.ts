import type { ComponentType } from "react"
import type { PixelArea, Size } from "../../lib/photo"

// Image tools (`services.images`): the photo cropper and the browser's image
// decode/resize/encode, both loaded on first use (a photo picked), never with
// a page. They are a service so tests can count the cropper's loads and
// drive a crop: jsdom has no layout (react-easy-crop measures its box) and
// no canvas. The sizing decisions are pure (lib/photo.ts) and tested there.
//
// Cropped photos stay in memory (a Blob, shown through an object URL) until
// they are uploaded: never base64 or data URLs, never in device storage, the
// persisted cache or a draft (legacy kept the picked image in localStorage
// as base64, #23).

/** What the bio page passes the cropper (react-easy-crop's props it uses). */
export interface CropperProps {
    /** The picked photo's object URL. */
    image: string
    crop: { x: number; y: number }
    zoom: number
    aspect: number
    onCropChange: (crop: { x: number; y: number }) => void
    onZoomChange: (zoom: number) => void
    /** The crop in the image's own pixels is the second argument. */
    onCropComplete: (area: PixelArea, areaPixels: PixelArea) => void
}

export type CropperComponent = ComponentType<CropperProps>

export interface ImageTools {
    /** react-easy-crop, imported on first call (./photoTools.ts). */
    loadCropper(): Promise<CropperComponent>
    /**
     * The picked photo in a form the browser can draw: itself, or a HEIC
     * the browser can't decode converted to JPEG (./preparePhoto.ts). The
     * cropper shows, and `renderPhoto` draws, what this returns.
     */
    preparePhoto(file: File): Promise<Blob>
    /**
     * Draws `area` of `image` (its decoded pixels, as the cropper reports
     * them) at `size` and encodes it within the photo budget
     * (`encodeWithinBudget`): the Blob to upload.
     */
    renderPhoto(image: Blob, area: PixelArea, size: Size): Promise<Blob>
}

/** The browser's: imported (./photoTools.ts) the first time either is used. */
export function browserImages(): ImageTools {
    let tools: Promise<typeof import("./photoTools")> | undefined
    const load = () =>
        (tools ??= import("./photoTools").catch((error: unknown) => {
            // Try again next time (offline, a deploy).
            tools = undefined
            throw error
        }))
    return {
        loadCropper: () => load().then((module) => module.PhotoCropper),
        preparePhoto: (file) =>
            load().then((module) => module.preparePhoto(file)),
        renderPhoto: (image, area, size) =>
            load().then((module) => module.renderPhoto(image, area, size)),
    }
}
