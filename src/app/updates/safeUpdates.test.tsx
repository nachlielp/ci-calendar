import { act, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { describe, expect, it } from "vitest"
import { setPageVisibility } from "../../test/browser"
import { createFakeUpdates } from "../../test/fakeUpdates"
import { renderApp } from "../../test/renderApp"
import { useBlockReload } from "./reloadGuard"

/** The visitor switches to another app or tab, then comes back. */
function leaveAndReturn() {
    setPageVisibility("hidden")
    setPageVisibility("visible")
}

/** Lets pending promises (the activation, the boot request) settle. */
const settle = () =>
    act(() => new Promise<void>((resolve) => setTimeout(resolve, 0)))

describe("updating to a new version", () => {
    it("hands over when the visitor leaves and reloads as they come back, never while they are looking", async () => {
        const sw = createFakeUpdates()
        const { reloads } = renderApp({ updates: sw.updates })
        expect(sw.watching).toBe(true)

        sw.announce()
        await settle()
        // Visible, maybe mid-scroll or mid-tap: nothing happens yet.
        expect(sw.activations).toBe(0)
        expect(reloads.count).toBe(0)

        // Away: the new version takes over now, so coming back is instant.
        setPageVisibility("hidden")
        await settle()
        expect(sw.activations).toBe(1)
        expect(reloads.count).toBe(0)

        setPageVisibility("visible")
        await settle()
        expect(sw.activations).toBe(1)
        expect(reloads.count).toBe(1)
    })

    it("hands over and reloads on return when the new version arrived while the visitor was away", async () => {
        const sw = createFakeUpdates()
        const { reloads } = renderApp({ updates: sw.updates })

        setPageVisibility("hidden")
        sw.announce()
        await settle()
        expect(reloads.count).toBe(0)

        setPageVisibility("visible")
        await settle()
        expect(sw.activations).toBe(1)
        expect(reloads.count).toBe(1)
    })

    it("does nothing on coming back when there is no new version", async () => {
        const sw = createFakeUpdates()
        const { reloads } = renderApp({ updates: sw.updates })

        leaveAndReturn()
        await settle()

        expect(sw.activations).toBe(0)
        expect(reloads.count).toBe(0)
    })

    it("reloads once, however often the visitor comes back", async () => {
        const sw = createFakeUpdates()
        const { reloads } = renderApp({ updates: sw.updates })

        sw.announce()
        leaveAndReturn()
        leaveAndReturn()
        await settle()

        expect(sw.activations).toBe(1)
        expect(reloads.count).toBe(1)
    })

    it("waits while unsaved work blocks reloads, and updates on the next return after it is gone", async () => {
        function DraftForm() {
            const [dirty, setDirty] = useState(true)
            useBlockReload(dirty)
            return (
                <button type="button" onClick={() => setDirty(false)}>
                    save
                </button>
            )
        }
        const sw = createFakeUpdates()
        const { reloads } = renderApp({
            updates: sw.updates,
            routes: [{ path: "/", element: <DraftForm /> }],
        })

        sw.announce()
        leaveAndReturn()
        await settle()
        expect(sw.activations).toBe(0)
        expect(reloads.count).toBe(0)

        // Saving lifts the block, but the visitor is still here: wait.
        await userEvent.click(screen.getByRole("button", { name: "save" }))
        await settle()
        expect(reloads.count).toBe(0)

        leaveAndReturn()
        await settle()
        expect(sw.activations).toBe(1)
        expect(reloads.count).toBe(1)
    })

    it("lifts the block when the blocking page unmounts", async () => {
        function DraftForm() {
            useBlockReload(true)
            return <p>draft</p>
        }
        function Page() {
            const [open, setOpen] = useState(true)
            return (
                <>
                    {open && <DraftForm />}
                    <button type="button" onClick={() => setOpen(false)}>
                        discard
                    </button>
                </>
            )
        }
        const sw = createFakeUpdates()
        const { reloads } = renderApp({
            updates: sw.updates,
            routes: [{ path: "/", element: <Page /> }],
        })

        sw.announce()
        leaveAndReturn()
        await settle()
        expect(reloads.count).toBe(0)

        await userEvent.click(screen.getByRole("button", { name: "discard" }))
        leaveAndReturn()
        await settle()
        expect(reloads.count).toBe(1)
    })

    it("stops watching for new versions when the app unmounts", () => {
        const sw = createFakeUpdates()
        const { unmount } = renderApp({ updates: sw.updates })

        unmount()

        expect(sw.watching).toBe(false)
    })
})
