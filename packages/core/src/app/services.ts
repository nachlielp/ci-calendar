import type { Auth } from "../data/auth"
import type { DataClient } from "../data/client"
import type { Files } from "../data/files"
import type { Functions } from "../data/functions"
import type { PlacesLoader } from "../data/places"
import type { PublicFeed } from "../features/calendar/publicFeed"
import type { DeviceStorage } from "./deviceStorage"
import type { CoreTelemetry } from "./telemetry/telemetry"

/**
 * What every app needs from the outside world, injected once at boot: the
 * platform-neutral half of the seam. Each app extends it with its own
 * (the web's `AppServices`: images, updates, …). Code in the core
 * takes these, or a `Pick` of the ones it uses.
 */
export interface CoreServices {
    data: DataClient
    /**
     * The public window, the calendar's list (features/calendar/publicFeed.ts):
     * the Worker's edge-cached endpoint on the web, falling back to the
     * direct select; tests read the fake's data through the same select.
     */
    publicFeed: PublicFeed
    /** Sign-in state and actions (data/auth.ts); boot never waits on it. */
    auth: Auth
    /** Edge Functions (data/functions.ts): the `translate` function. */
    functions: Functions
    /**
     * Supabase Storage (data/files.ts): bio photo uploads, storage-js
     * imported on first use. Not `storage`, which is device storage.
     */
    files: Files
    /**
     * Address search and English addresses (data/places.ts), loaded on
     * first use: Google's script on the web. Tests count the loads.
     */
    places: PlacesLoader
    now: () => Date
    /** Device storage for the persisted query cache. */
    storage: DeviceStorage
    /** The app's build; tests pass their own to simulate a deploy. */
    buildVersion: string
    /** Crash reports and analytics. */
    telemetry: CoreTelemetry
}
