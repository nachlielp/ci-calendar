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
