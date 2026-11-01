import { createElement, useEffect } from "react"
import type {
    CropperComponent,
    CropperProps,
    ImageTools,
} from "../app/images/images"
import type { PixelArea, Size } from "@ci-calendar/core/lib/photo"

// The fake's image tools (`createFakeDataClient().images`, passed as
// `services.images`). jsdom has no layout or canvas, so the cropper is a
// stand-in that reports `cropArea` (the crop in the picked image's pixels)
// as react-easy-crop does once it has measured, and `renderPhoto` records
// what it was asked to draw and returns a Blob of `outputBytes` in
// `outputType`. `preparePhoto` passes the picked file on, or what
// `convert` makes of it (a HEIC as JPEG), recording each in `prepared`;
// `failPrepare()` makes it reject. `cropperLoads` counts how often the cropper's code was
// asked for, so tests can prove it isn't loaded before a photo is picked.

export interface RenderCall {
    image: Blob
    area: PixelArea
    size: Size
    output: Blob
}

export interface PrepareCall {
    file: File
    output: Blob
}

export interface FakeImages extends ImageTools {
    cropperLoads: number
    prepared: PrepareCall[]
    /** What `preparePhoto` returns for a file (the file itself by default). */
    convert: (file: File) => Blob
    failPrepare(): void
    /** What the stand-in cropper reports (a 3000px square by default). */
    cropArea: PixelArea
    renders: RenderCall[]
    outputType: string
    outputBytes: number
}

export function createFakeImages(): FakeImages {
    let prepareFails = false
    const fake: FakeImages = {
        cropperLoads: 0,
        prepared: [],
        convert: (file) => file,
        failPrepare: () => {
            prepareFails = true
        },
        cropArea: { x: 500, y: 0, width: 3000, height: 3000 },
        renders: [],
        outputType: "image/jpeg",
        outputBytes: 28_000,
        loadCropper: async () => {
            fake.cropperLoads += 1
            return FakeCropper
        },
        preparePhoto: async (file) => {
            if (prepareFails) throw new Error("Couldn't decode the photo")
            const output = fake.convert(file)
            fake.prepared.push({ file, output })
            return output
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
