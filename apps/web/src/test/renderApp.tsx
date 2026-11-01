import { render } from "@testing-library/react"
import { createMemoryRouter, type RouteObject } from "react-router"
import { AppRoot } from "../app/AppRoot"
import { bootQueryClient, createQueryClient } from "../app/boot"
import {
    createMemoryStorage,
    type DeviceStorage,
} from "@ci-calendar/core/app/deviceStorage"
import { captureInstallPrompt } from "../app/install/installPrompt"
import { routes } from "../app/routes"
import type { AppServices } from "../app/services"
import { NO_TELEMETRY, type Telemetry } from "../app/telemetry/telemetry"
import { NO_UPDATES, type AppUpdates } from "../app/updates/updates"
import {
    directPublicFeed,
    edgePublicFeed,
} from "@ci-calendar/core/features/calendar/publicFeed"
import { createFakeDataClient, type FakeDataClient } from "./fakeDataClient"
import type { FakeEdge } from "./fakeEdge"
import { userRow, type TestUser } from "./testUsers"

export interface RenderAppOptions {
    path?: string
    fake?: FakeDataClient
    /**
     * The Worker's edge-cached window (`createFakeEdge()`), read first as on
     * the web, with the fake's direct select as its fallback. Without one,
     * the window is read straight from the fake (`publicFeed`'s direct
     * read, through the same select).
     */
    edge?: FakeEdge
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
    /** Crash reports and analytics (`createTestTelemetry()`); none by default. */
    telemetry?: Telemetry
    /**
     * Boots signed in as this user (`testUser(role)`), as if their session
     * were in device storage; their `users` row is seeded unless the fake
     * already has it.
     */
    signedInAs?: TestUser
    /** The stored session's token has expired: it needs a refresh first. */
    tokenExpired?: boolean
}

/**
 * Boots and renders the real app (real routes, real queries, the same boot
 * as production: persisted-cache restore and prefetch, the stored session)
 * against the fake backend (data and auth) — the one seam tests drive the
 * app through.
 */
export function renderApp({
    path = "/",
    fake = createFakeDataClient(),
    edge,
    now = new Date("2026-10-30T09:00:00Z"),
    storage = createMemoryStorage(),
    session = createMemoryStorage(),
    buildVersion = "test",
    updates = NO_UPDATES,
    routes: routeObjects = routes,
    telemetry = NO_TELEMETRY,
    signedInAs,
    tokenExpired = false,
}: RenderAppOptions = {}) {
    if (signedInAs) {
        const users = fake.rows("users")
        if (!users.some((row) => row.id === signedInAs.id)) {
            users.push(userRow(signedInAs))
        }
        fake.auth.signInAs(signedInAs, { expired: tokenExpired })
    }
    const reloads = { count: 0 }
    const clock = () => now
    const services: AppServices = {
        data: fake.client,
        publicFeed: edge
            ? edgePublicFeed({
                  data: fake.client,
                  now: clock,
                  signedIn: () => !!fake.auth.session(),
                  fetch: edge.fetch,
                  timeoutMs: edge.timeoutMs,
              })
            : directPublicFeed(fake.client, clock),
        auth: fake.auth,
        functions: fake.functions,
        places: fake.places.load,
        files: fake.files,
        images: fake.images,
        now: clock,
        storage,
        session,
        buildVersion,
        reload: () => {
            reloads.count += 1
        },
        updates,
        telemetry,
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
