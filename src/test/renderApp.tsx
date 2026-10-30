import { render } from "@testing-library/react"
import { createMemoryRouter, type RouteObject } from "react-router"
import { AppRoot } from "../app/AppRoot"
import { bootQueryClient, createQueryClient } from "../app/boot"
import { createMemoryStorage, type DeviceStorage } from "../app/deviceStorage"
import { captureInstallPrompt } from "../app/install/installPrompt"
import { routes } from "../app/routes"
import type { AppServices } from "../app/services"
import { NO_UPDATES, type AppUpdates } from "../app/updates/updates"
import { createFakeDataClient, type FakeDataClient } from "./fakeDataClient"

export interface RenderAppOptions {
    path?: string
    fake?: FakeDataClient
    now?: Date
    /** Pass the same storage to two renders to simulate a repeat visit. */
    storage?: DeviceStorage
    /** Pass the same session to two renders to simulate a reload. */
    session?: DeviceStorage
    buildVersion?: string
    /** New versions of the app (`createFakeUpdates()`); none by default. */
    updates?: AppUpdates
    /**
     * Stand-in routes, for app-wide behaviour that no real page exercises
     * yet (e.g. a form blocking reloads). The real routes by default.
     */
    routes?: RouteObject[]
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
    session = createMemoryStorage(),
    buildVersion = "test",
    updates = NO_UPDATES,
    routes: routeObjects = routes,
}: RenderAppOptions = {}) {
    const reloads = { count: 0 }
    const services: AppServices = {
        data: fake.client,
        now: () => now,
        storage,
        session,
        buildVersion,
        reload: () => {
            reloads.count += 1
        },
        updates,
    }
    const queryClient = createQueryClient()
    queryClient.setDefaultOptions({ queries: { retry: false } })
    bootQueryClient(queryClient, services)
    captureInstallPrompt()
    const router = createMemoryRouter(routeObjects, { initialEntries: [path] })

    const view = render(
        <AppRoot
            services={services}
            queryClient={queryClient}
            router={router}
        />,
    )
    return { ...view, fake, storage, router, reloads }
}
