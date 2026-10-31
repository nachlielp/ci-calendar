import { describe, expect, it } from "vitest"
import { takeWebSocketAttempts } from "./realtimeGuard"

describe("the realtime guard", () => {
    it("records a socket even when the code catches the error", () => {
        const url = "wss://project.supabase.co/realtime/v1/websocket"
        try {
            new WebSocket(url)
        } catch {
            // As a realtime client retrying in the background would.
        }
        // setup.ts's afterEach fails any test that leaves an attempt; this
        // one takes it, to show it was recorded.
        expect(takeWebSocketAttempts()).toEqual([url])
    })
})
