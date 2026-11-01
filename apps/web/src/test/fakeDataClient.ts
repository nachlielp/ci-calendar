import {
    createFakeDataClient as createCoreFakeDataClient,
    type FakeDataClient as CoreFakeDataClient,
} from "@ci-calendar/core/testing/fakeDataClient"
import { createFakeImages, type FakeImages } from "./fakeImages"

export type {
    RecordedFilter,
    RecordedRequest,
} from "@ci-calendar/core/testing/fakeDataClient"

/**
 * The core's fake backend (`@ci-calendar/core/testing/fakeDataClient`)
 * plus the web's own fake: `images`, the photo cropper and canvas
 * (`services.images`, ./fakeImages.ts).
 */
export interface FakeDataClient extends CoreFakeDataClient {
    images: FakeImages
}

export function createFakeDataClient(
    ...seed: Parameters<typeof createCoreFakeDataClient>
): FakeDataClient {
    return { ...createCoreFakeDataClient(...seed), images: createFakeImages() }
}
