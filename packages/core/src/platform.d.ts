// The web-platform globals the core may use: ones the browser, Cloudflare
// Workers, React Native (Expo ships a standard URL) and Node all have. The
// core has no DOM and no Node types (tsconfig.json), so anything else is a
// type error. Declare a global here only when all four have it; tests use
// Node's own declarations instead (tsconfig.test.json leaves this file out).

/** An opaque timer handle: a number in browsers, an object in Node. */
type TimerHandle = { readonly __timer: unique symbol }

declare function setTimeout(handler: () => void, ms?: number): TimerHandle
declare function clearTimeout(handle: TimerHandle | undefined): void

/** WHATWG URL: only the members the core reads. */
declare class URL {
    constructor(url: string, base?: string | URL)
    readonly href: string
    readonly protocol: string
    readonly hostname: string
    readonly host: string
    readonly pathname: string
    readonly search: string
    readonly hash: string
    toString(): string
}
