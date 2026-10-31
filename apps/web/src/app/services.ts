import { createContext, useContext } from "react"
import type { Auth } from "../data/auth"
import type { DataClient } from "../data/client"
import type { Files } from "../data/files"
import type { Functions } from "../data/functions"
import type { PublicFeed } from "../features/calendar/publicFeed"
import type { PlacesLoader } from "../data/places"
import type { DeviceStorage } from "./deviceStorage"
import type { ImageTools } from "./images/images"
import type { Telemetry } from "./telemetry/telemetry"
import type { AppUpdates } from "./updates/updates"

/** Everything the app needs from the outside world, injected once at boot. */
export interface AppServices {
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
     * Google Places (data/places.ts), loaded on first use: address
     * autocomplete and English addresses. Tests count the loads.
     */
    places: PlacesLoader
    /**
     * Supabase Storage (data/files.ts): bio photo uploads, storage-js
     * imported on first use. Not `storage`, which is device storage.
     */
    files: Files
    /**
     * The photo cropper and the browser's image resize/encode
     * (app/images/images.ts), loaded when a photo is picked.
     */
    images: ImageTools
    now: () => Date
    /** Device storage for the persisted query cache (app/persistedCache.ts). */
    storage: DeviceStorage
    /** Storage for this tab's session only (sessionStorage). */
    session: DeviceStorage
    /** `BUILD_VERSION` in the app; tests pass their own to simulate a deploy. */
    buildVersion: string
    /** Reloads the page (`location.reload()`); tests record the calls. */
    reload: () => void
    /** New versions of the app from the service worker (`SafeUpdates`). */
    updates: AppUpdates
    /**
     * Crash reports, analytics and Speed Insights (`app/telemetry`). Tests
     * get `NO_TELEMETRY` unless they pass `createTestTelemetry()`.
     */
    telemetry: Telemetry
}

export const ServicesContext = createContext<AppServices | null>(null)

export function useServices(): AppServices {
    const services = useContext(ServicesContext)
    if (!services) throw new Error("useServices outside <AppRoot>")
    return services
}
