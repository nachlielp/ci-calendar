import { createContext, useContext } from "react"
import type { DataClient } from "../data/client"
import type { DeviceStorage } from "./deviceStorage"
import type { Telemetry } from "./telemetry/telemetry"
import type { AppUpdates } from "./updates/updates"

/** Everything the app needs from the outside world, injected once at boot. */
export interface AppServices {
    data: DataClient
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
