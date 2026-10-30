import "@testing-library/jest-dom"

// The app has no realtime by design (spec #34). Any code path that opens a
// socket — e.g. someone wiring up `@supabase/supabase-js` realtime — fails the
// test that triggers it.
globalThis.WebSocket = class {
    constructor() {
        throw new Error("WebSockets/realtime are not allowed (spec #34)")
    }
} as unknown as typeof WebSocket
