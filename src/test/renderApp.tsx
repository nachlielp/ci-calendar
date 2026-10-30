import { render } from "@testing-library/react"
import { createMemoryRouter } from "react-router"
import { AppRoot } from "../app/AppRoot"
import { bootQueryClient, createQueryClient } from "../app/boot"
import { BUILD_VERSION } from "../app/buildVersion"
import { createMemoryStorage, type DeviceStorage } from "../app/deviceStorage"
import { captureInstallPrompt } from "../app/install/installPrompt"
import { routes } from "../app/routes"
import type { AppServices } from "../app/services"
import { createFakeDataClient, type FakeDataClient } from "./fakeDataClient"

export interface RenderAppOptions {
    path?: string
    fake?: FakeDataClient
    now?: Date
    /** Pass the same storage to two renders to simulate a repeat visit. */
    storage?: DeviceStorage
    buildVersion?: string
}

/**
 * Boots and renders the real app (real routes, real queries, the same boot
 * as production: persisted-cache restore and prefetch) against the fake data
 * client — the one seam tests drive the app through.
 */
export function renderApp({
    path = "/",
    fake = createFakeDataClient(),
    now = new Date("2026-10-30T09:00:00Z"),
    storage = createMemoryStorage(),
    buildVersion = BUILD_VERSION,
}: RenderAppOptions = {}) {
    const reloads = { count: 0 }
    const services: AppServices = {
        data: fake.client,
        now: () => now,
        storage,
        buildVersion,
        reload: () => {
            reloads.count += 1
        },
    }
    const queryClient = createQueryClient()
    queryClient.setDefaultOptions({ queries: { retry: false } })
    bootQueryClient(queryClient, services)
    captureInstallPrompt()
    const router = createMemoryRouter(routes, { initialEntries: [path] })

    const view = render(
        <AppRoot
            services={services}
            queryClient={queryClient}
            router={router}
        />,
    )
    return { ...view, fake, storage, router, reloads }
}
