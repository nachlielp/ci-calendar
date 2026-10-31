import { createElement, useEffect } from "react"
import type {
    CropperComponent,
    CropperProps,
    ImageTools,
} from "../app/images/images"
import type { PixelArea, Size } from "../lib/photo"

// The fake's image tools (`createFakeDataClient().images`, passed as
// `services.images`). jsdom has no layout or canvas, so the cropper is a
// stand-in that reports `cropArea` (the crop in the picked image's pixels)
// as react-easy-crop does once it has measured, and `renderPhoto` records
// what it was asked to draw and returns a Blob of `outputBytes` in
// `outputType`. `cropperLoads` counts how often the cropper's code was
// asked for, so tests can prove it isn't loaded before a photo is picked.

export interface RenderCall {
    image: Blob
    area: PixelArea
    size: Size
    output: Blob
}

export interface FakeImages extends ImageTools {
    cropperLoads: number
    /** What the stand-in cropper reports (a 3000px square by default). */
    cropArea: PixelArea
    renders: RenderCall[]
    outputType: string
    outputBytes: number
}

export function createFakeImages(): FakeImages {
    const fake: FakeImages = {
        cropperLoads: 0,
        cropArea: { x: 500, y: 0, width: 3000, height: 3000 },
        renders: [],
        outputType: "image/jpeg",
        outputBytes: 28_000,
        loadCropper: async () => {
            fake.cropperLoads += 1
            return FakeCropper
        },
        renderPhoto: async (image, area, size) => {
            const output = new Blob([new Uint8Array(fake.outputBytes)], {
                type: fake.outputType,
            })
            fake.renders.push({ image, area, size, output })
            return output
        },
    }

    function StandInCropper({ image, zoom, onCropComplete }: CropperProps) {
        useEffect(() => {
            onCropComplete(fake.cropArea, fake.cropArea)
        }, [onCropComplete, zoom])
        return createElement("img", {
            src: image,
            alt: "",
            "data-testid": "cropper",
        })
    }
    const FakeCropper: CropperComponent = StandInCropper
    return fake
}
