// The app has no realtime by design (spec #34). `setup.ts` replaces
// `WebSocket` with a stand-in that throws and records every construction,
// and fails the test after it if any was attempted: even code that catches
// the error (as a realtime client retrying would) can't hide the attempt.

/** The URLs of the sockets the current test tried to open. */
const attempts: string[] = []

export class ForbiddenWebSocket {
    constructor(url: string | URL) {
        attempts.push(String(url))
        throw new Error("WebSockets/realtime are not allowed (spec #34)")
    }
}

/** The attempts so far, cleared (the guard's test reads its own). */
export function takeWebSocketAttempts(): string[] {
    return attempts.splice(0)
}
