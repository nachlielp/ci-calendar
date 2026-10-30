import { createContext, useContext } from "react"
import type { DataClient } from "../data/client"

/** Everything the app needs from the outside world, injected once at boot. */
export interface AppServices {
    data: DataClient
    now: () => Date
}

export const ServicesContext = createContext<AppServices | null>(null)

export function useServices(): AppServices {
    const services = useContext(ServicesContext)
    if (!services) throw new Error("useServices outside <AppRoot>")
    return services
}
