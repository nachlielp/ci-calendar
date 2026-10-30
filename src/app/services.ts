import { createContext, useContext } from "react"
import type { DataClient } from "../data/client"
import type { DeviceStorage } from "./deviceStorage"

/** Everything the app needs from the outside world, injected once at boot. */
export interface AppServices {
    data: DataClient
    now: () => Date
    /** Device storage for the persisted query cache (app/persistedCache.ts). */
    storage: DeviceStorage
    /** `BUILD_VERSION` in the app; tests pass their own to simulate a deploy. */
    buildVersion: string
}

export const ServicesContext = createContext<AppServices | null>(null)

export function useServices(): AppServices {
    const services = useContext(ServicesContext)
    if (!services) throw new Error("useServices outside <AppRoot>")
    return services
}
