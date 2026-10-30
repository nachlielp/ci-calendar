import "@testing-library/jest-dom"
import { focusManager, onlineManager } from "@tanstack/react-query"
import { afterEach } from "vitest"

// The app has no realtime by design (spec #34). Any code path that opens a
// socket — e.g. someone wiring up `@supabase/supabase-js` realtime — fails the
// test that triggers it.
globalThis.WebSocket = class {
    constructor() {
        throw new Error("WebSockets/realtime are not allowed (spec #34)")
    }
} as unknown as typeof WebSocket

// TanStack's online and focus managers are module singletons; a test that
// goes offline or hides the page must not leak that into the next test.
afterEach(() => {
    onlineManager.setOnline(true)
    focusManager.setFocused(undefined)
    // Drop per-test overrides, restoring jsdom's "visible" and online.
    delete (document as { visibilityState?: unknown }).visibilityState
    delete (navigator as { onLine?: unknown }).onLine
})

// jsdom has <dialog> but not its modal API. This stands in for what the
// browser does: `showModal()` opens it on top, Escape closes the topmost one,
// and `close()` fires the `close` event the app listens to.
const openModals: HTMLDialogElement[] = []
HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
    this.open = true
    openModals.push(this)
}
HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
    if (!this.open) return
    this.open = false
    openModals.splice(openModals.indexOf(this), 1)
    this.dispatchEvent(new Event("close"))
}
document.addEventListener("keydown", (event) => {
    const top = openModals.filter((dialog) => dialog.isConnected).at(-1)
    if (event.key === "Escape" && top) top.close()
})
afterEach(() => {
    openModals.length = 0
})
