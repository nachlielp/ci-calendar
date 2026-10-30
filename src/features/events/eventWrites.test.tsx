import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import { describe, expect, it } from "vitest"
import { createMemoryStorage } from "../../app/deviceStorage"
import { ServicesContext, type AppServices } from "../../app/services"
import { NO_TELEMETRY } from "../../app/telemetry/telemetry"
import { NO_UPDATES } from "../../app/updates/updates"
import { createFakeDataClient } from "../../test/fakeDataClient"
import { testUser } from "../../test/testUsers"
import { event } from "../calendar/testEvents"
import { useDeleteEvents, useSetCancelled, useSetHidden } from "./eventWrites"
import { toManagedEvent, type ManagedEventRow } from "./managedEvent"

// The writes as admin pages reuse them: `ownOnly: false` drops the owner
// filter (RLS lets admins write any event); the state conditions stay.
function setup() {
    const admin = testUser("admin")
    const fake = createFakeDataClient()
    const row = event({ title: "של יוצרת", user_id: "creator" })
    fake.rows("ci_events").push(row)
    fake.auth.signInAs(admin)
    const services = {
        data: fake.client,
        auth: fake.auth,
        functions: fake.functions,
        places: fake.places.load,
        files: fake.files,
        images: fake.images,
        now: () => new Date("2026-10-30T09:00:00Z"),
        storage: createMemoryStorage(),
        session: createMemoryStorage(),
        buildVersion: "test",
        reload: () => {},
        updates: NO_UPDATES,
        telemetry: NO_TELEMETRY,
    } satisfies AppServices
    const queryClient = new QueryClient()
    const wrapper = ({ children }: { children: ReactNode }) => (
        <ServicesContext.Provider value={services}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </ServicesContext.Provider>
    )
    const managed = toManagedEvent({
        ...row,
        ci_events_users_junction: [],
    } as unknown as ManagedEventRow)!
    return { admin, fake, wrapper, managed }
}

const writes = (fake: ReturnType<typeof createFakeDataClient>) =>
    fake.requests.filter((request) => request.method !== "select")

describe("event writes for admins (ownOnly: false)", () => {
    it("hide, cancel and delete anyone's event, without the owner filter", async () => {
        const { admin, fake, wrapper, managed } = setup()
        const { result } = renderHook(
            () => ({
                hide: useSetHidden(admin.id, { ownOnly: false }),
                cancel: useSetCancelled(admin.id, { ownOnly: false }),
                remove: useDeleteEvents(admin.id, { ownOnly: false }),
            }),
            { wrapper },
        )

        await act(() =>
            result.current.hide.mutateAsync({ events: [managed], hide: true }),
        )
        await act(() =>
            result.current.cancel.mutateAsync({
                event: managed,
                cancel: true,
                text: "",
            }),
        )
        await act(() => result.current.remove.mutateAsync([managed]))

        expect(writes(fake).map((request) => request.filters)).toEqual([
            [
                { op: "in", column: "id", value: [managed.id] },
                { op: "eq", column: "hide", value: false },
            ],
            [
                { op: "eq", column: "id", value: managed.id },
                { op: "not.is", column: "cancelled", value: true },
            ],
            [{ op: "in", column: "id", value: [managed.id] }],
        ])
        expect(fake.rows("ci_events")).toHaveLength(0)
    })

    it("keep the owner filter by default", async () => {
        const { admin, fake, wrapper, managed } = setup()
        const { result } = renderHook(() => useDeleteEvents(admin.id), {
            wrapper,
        })
        await act(() => result.current.mutateAsync([managed]))
        expect(writes(fake)[0].filters).toContainEqual({
            op: "eq",
            column: "user_id",
            value: admin.id,
        })
        expect(fake.rows("ci_events")).toHaveLength(1)
    })
})
