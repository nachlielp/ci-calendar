import { createContext, useContext } from "react"
import type { CoreServices } from "@ci-calendar/core/app/services"
import type { DeviceStorage } from "@ci-calendar/core/app/deviceStorage"
import type { ImageTools } from "./images/images"
import type { Telemetry } from "./telemetry/telemetry"
import type { AppUpdates } from "./updates/updates"

/**
 * Everything the web app needs from the outside world, injected once at
 * boot: the core's services (`CoreServices`: data, auth, functions, files,
 * Places, the public feed, device storage, the clock) plus the browser's own.
 */
export interface AppServices extends CoreServices {
    /**
     * The photo cropper and the browser's image resize/encode
     * (app/images/images.ts), loaded when a photo is picked.
     */
    images: ImageTools
    /** Storage for this tab's session only (sessionStorage). */
    session: DeviceStorage
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
